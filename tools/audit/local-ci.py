#!/usr/bin/env python3
"""
Run the local equivalent of the non-publishing GitHub CI surfaces.

This is intentionally broader than `npm run release:check`: it also exercises
the workflow-only Python syntax check, knowledge size budget, VS Code extension
compile/unit tests, mkdocs site build, and mkdocs warning policy before a branch
is pushed for Real-CI verification.

Usage:
  python3 tools/audit/local-ci.py
  python3 tools/audit/local-ci.py --docs-only
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KNOWLEDGE_WARN_LINES = 150_000
KNOWLEDGE_MAX_LINES = 200_000
PYTHON_COMPILE_DIRS = ("tools/extractors", "tools/audit", "tools/migrations", "tools/preview")
LINE_BUDGET_DIRS = ("knowledge", "examples", "docs")
DOCS_WORKFLOW = ROOT / ".github" / "workflows" / "docs.yml"
DOCS_WORKFLOW_POLICY_COMMAND = "python3 -B tools/audit/local-ci.py --docs-only"
DOCS_WORKFLOW_REQUIRED_PATHS = (
    "AGENTS.md",
    "AGENTS.ko.md",
    "CLAUDE.md",
    "README.md",
    "README.ko.md",
    "CHANGELOG.md",
    "mkdocs.yml",
    "tools/audit/local-ci.py",
    "tools/build-docs.sh",
    ".github/workflows/docs.yml",
)


def run(command: list[str], *, cwd: Path = ROOT) -> None:
    print(f"\n$ {' '.join(command)}", flush=True)
    result = subprocess.run(command, cwd=cwd)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def run_capture(command: list[str], *, cwd: Path = ROOT, echo: bool = True) -> str:
    print(f"\n$ {' '.join(command)}", flush=True)
    result = subprocess.run(
        command,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    if result.stdout and (echo or result.returncode != 0):
        print(result.stdout, end="", flush=True)
    if result.returncode != 0:
        raise SystemExit(result.returncode)
    return result.stdout


def run_release_check() -> None:
    run(["npm", "run", "release:check"])


def python_compile_files(root: Path = ROOT) -> list[str]:
    files: list[str] = []
    for directory in PYTHON_COMPILE_DIRS:
        files.extend(str(path.relative_to(root)) for path in sorted((root / directory).glob("*.py")))
    return files


def run_python_compile() -> None:
    files = python_compile_files()
    run(["python3", "-m", "py_compile", *files])


def markdown_line_count(root: Path = ROOT) -> int:
    total = 0
    for directory in LINE_BUDGET_DIRS:
        for path in (root / directory).rglob("*.md"):
            with path.open("r", encoding="utf-8") as handle:
                total += sum(1 for _ in handle)
    return total


def size_budget_warning(total: int) -> str | None:
    if total > KNOWLEDGE_MAX_LINES:
        raise SystemExit(
            f"knowledge base exceeds hard cap of {KNOWLEDGE_MAX_LINES} lines ({total})"
        )
    if total > KNOWLEDGE_WARN_LINES:
        return f"knowledge base exceeds {KNOWLEDGE_WARN_LINES} lines ({total}); consider pruning"
    return None


def run_size_budget() -> None:
    total = markdown_line_count()
    print(f"\nKnowledge/docs/examples total: {total} lines", flush=True)
    warning = size_budget_warning(total)
    if warning:
        print(f"warning: {warning}", file=sys.stderr)


def run_vscode_checks() -> None:
    extension_root = ROOT / "vscode-extension"
    run(["npm", "ci", "--no-audit", "--no-fund"], cwd=extension_root)
    run(["npm", "run", "compile"], cwd=extension_root)
    run(["npm", "run", "test:unit"], cwd=extension_root)


def run_docs_build() -> None:
    try:
        run(["python3", "-m", "mkdocs", "--version"])
    except SystemExit as error:
        if error.code:
            raise SystemExit(
                "mkdocs is not installed; run `python3 -m pip install -r docs/requirements.txt` "
                "before `npm run ci:local`."
            ) from error
        raise
    run(["./tools/build-docs.sh"])
    mkdocs_output = run_capture(["python3", "-m", "mkdocs", "build", "--clean"], echo=False)
    assert_mkdocs_warning_policy(mkdocs_output)


def unquote_yaml_scalar(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def yaml_indent(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def workflow_run_commands(text: str) -> list[str]:
    commands: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("run:"):
            commands.append(unquote_yaml_scalar(stripped.removeprefix("run:").strip()))
    return commands


def workflow_path_entries(text: str) -> list[str]:
    entries: list[str] = []
    in_paths = False
    paths_indent = 0

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        indent = yaml_indent(line)
        if stripped == "paths:":
            in_paths = True
            paths_indent = indent
            continue

        if not in_paths:
            continue

        if indent <= paths_indent and not stripped.startswith("- "):
            in_paths = False
            continue

        if stripped.startswith("- "):
            entries.append(unquote_yaml_scalar(stripped.removeprefix("- ").strip()))

    return entries


def docs_workflow_policy_errors(text: str) -> list[str]:
    errors: list[str] = []
    run_commands = workflow_run_commands(text)
    path_entries = workflow_path_entries(text)

    if DOCS_WORKFLOW_POLICY_COMMAND not in run_commands:
        errors.append("docs workflow must run local-ci.py --docs-only")
    if any("mkdocs build --clean" in command for command in run_commands):
        errors.append("docs workflow must not call mkdocs build directly")
    for required_path in DOCS_WORKFLOW_REQUIRED_PATHS:
        if required_path not in path_entries:
            errors.append(f"docs workflow path filter missing {required_path}")
    return errors


def run_docs_workflow_policy_check(path: Path = DOCS_WORKFLOW) -> None:
    errors = docs_workflow_policy_errors(path.read_text(encoding="utf-8"))
    if errors:
        raise SystemExit("docs workflow policy check failed:\n" + "\n".join(f"- {error}" for error in errors))
    print("\nDocs workflow policy check passed", flush=True)


def mkdocs_warning_lines(output: str) -> list[str]:
    return [line for line in output.splitlines() if "WARNING" in line]


def non_refs_mkdocs_warning_lines(output: str) -> list[str]:
    return [line for line in mkdocs_warning_lines(output) if "refs/" not in line]


def assert_mkdocs_warning_policy(output: str) -> None:
    unexpected = non_refs_mkdocs_warning_lines(output)
    if not unexpected:
        print(
            f"\nMkDocs warning policy passed: {len(mkdocs_warning_lines(output))} refs-only warning(s)",
            flush=True,
        )
        return

    sample = "\n".join(f"- {line}" for line in unexpected[:10])
    raise SystemExit(
        "mkdocs emitted non-refs warning(s); fix docs navigation or update the warning policy.\n"
        f"Unexpected warning count: {len(unexpected)}\n"
        f"{sample}"
    )


def assert_condition(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"self-test failed: {message}")


def run_self_test() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        for directory in PYTHON_COMPILE_DIRS:
            (root / directory).mkdir(parents=True)

        (root / "tools" / "audit" / "b.py").write_text("print('b')\n", encoding="utf-8")
        (root / "tools" / "audit" / "a.py").write_text("print('a')\n", encoding="utf-8")
        (root / "tools" / "preview" / "render.py").write_text("print('p')\n", encoding="utf-8")

        assert_condition(
            python_compile_files(root) == [
                "tools/audit/a.py",
                "tools/audit/b.py",
                "tools/preview/render.py",
            ],
            "python compile file list should be sorted and relative",
        )

        for directory in LINE_BUDGET_DIRS:
            (root / directory).mkdir(parents=True)

        (root / "knowledge" / "one.md").write_text("a\nb\n", encoding="utf-8")
        (root / "examples" / "two.md").write_text("c\n", encoding="utf-8")
        (root / "docs" / "nested").mkdir()
        (root / "docs" / "nested" / "three.md").write_text("d\ne\nf\n", encoding="utf-8")

        assert_condition(markdown_line_count(root) == 6, "markdown line count should include all budget dirs")
        assert_condition(size_budget_warning(42) is None, "small line count should not warn")
        assert_condition(
            "consider pruning" in (size_budget_warning(KNOWLEDGE_WARN_LINES + 1) or ""),
            "warning threshold should return a warning message",
        )

        try:
            size_budget_warning(KNOWLEDGE_MAX_LINES + 1)
        except SystemExit as error:
            assert_condition("hard cap" in str(error), "hard cap should explain the failure")
        else:
            raise SystemExit("self-test failed: hard cap should raise SystemExit")

        refs_only_output = "\n".join(
            [
                "INFO - Documentation built",
                "WARNING - Doc file 'examples/component.md' contains a link '../refs/mui/Button.js', but the target 'refs/mui/Button.js' is not found among documentation files.",
                "WARNING - Doc file 'knowledge/components/INDEX.md' contains a link '../../refs/ant-design/button.md', but the target 'refs/ant-design/button.md' is not found among documentation files.",
            ]
        )
        assert_condition(
            len(mkdocs_warning_lines(refs_only_output)) == 2,
            "mkdocs warning classifier should count WARNING lines",
        )
        assert_condition(
            non_refs_mkdocs_warning_lines(refs_only_output) == [],
            "refs-only mkdocs warnings should be allowed",
        )
        assert_condition(
            run_capture(["python3", "-c", "print('quiet success')"], echo=False).strip() == "quiet success",
            "quiet command capture should return stdout without echoing on success",
        )
        assert_mkdocs_warning_policy(refs_only_output)

        mixed_output = refs_only_output + "\n" + (
            "WARNING - Doc file 'index.md' contains a link 'skills/', "
            "but the target 'skills/' is not found among documentation files."
        )
        try:
            assert_mkdocs_warning_policy(mixed_output)
        except SystemExit as error:
            assert_condition("non-refs" in str(error), "non-refs warning failure should explain the policy")
        else:
            raise SystemExit("self-test failed: non-refs mkdocs warning should raise SystemExit")

        passing_workflow = "\n".join(
            [
                "    paths:",
                *(f'      - "{path}"' for path in DOCS_WORKFLOW_REQUIRED_PATHS),
                "  workflow_dispatch:",
                "      - name: Build site with warning policy",
                f"        run: {DOCS_WORKFLOW_POLICY_COMMAND}",
            ]
        )
        assert_condition(
            workflow_path_entries(passing_workflow) == list(DOCS_WORKFLOW_REQUIRED_PATHS),
            "workflow path parser should read quoted path entries",
        )
        assert_condition(
            workflow_run_commands(passing_workflow) == [DOCS_WORKFLOW_POLICY_COMMAND],
            "workflow run parser should read one-line run commands",
        )
        assert_condition(
            docs_workflow_policy_errors(passing_workflow) == [],
            "docs workflow fixture should pass when it uses docs-only policy",
        )

        failing_workflow = "\n".join(
            [
                "      - name: Build site",
                "        run: mkdocs build --clean",
            ]
        )
        workflow_errors = docs_workflow_policy_errors(failing_workflow)
        assert_condition(
            len(workflow_errors) == len(DOCS_WORKFLOW_REQUIRED_PATHS) + 2,
            "docs workflow fixture should fail on direct mkdocs command and missing path filters",
        )
        assert_condition(
            any("--docs-only" in error for error in workflow_errors),
            "docs workflow failure should mention docs-only policy",
        )
        run_docs_workflow_policy_check()

    print("Local CI self-test passed")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true", help="Run local fixture checks.")
    parser.add_argument(
        "--docs-only",
        action="store_true",
        help="Run only mkdocs build plus warning policy, matching the docs deployment workflow.",
    )
    parser.add_argument(
        "--skip-release-check",
        action="store_true",
        help="Skip the expensive npm release gate when rerunning workflow-only checks.",
    )
    parser.add_argument("--skip-docs", action="store_true", help="Skip mkdocs site build.")
    parser.add_argument("--skip-vscode", action="store_true", help="Skip VS Code extension checks.")
    args = parser.parse_args()

    if args.self_test:
        return run_self_test()

    if args.docs_only:
        run_docs_workflow_policy_check()
        run_docs_build()
        print("\nDocs-only MkDocs policy check passed", flush=True)
        return 0

    if not args.skip_release_check:
        run_release_check()
    run_python_compile()
    run_size_budget()
    run_docs_workflow_policy_check()
    if not args.skip_vscode:
        run_vscode_checks()
    if not args.skip_docs:
        run_docs_build()

    print("\nLocal CI parity check passed", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
