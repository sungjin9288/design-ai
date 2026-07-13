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
import re
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
AUDIT_WORKFLOW = ROOT / ".github" / "workflows" / "audit.yml"
PUBLISH_WORKFLOW = ROOT / ".github" / "workflows" / "publish.yml"
DOCS_WORKFLOW_POLICY_COMMAND = "python3 -B tools/audit/local-ci.py --docs-only"
PUBLISH_WORKFLOW_COMMAND = "npm publish dist/*.tgz --provenance --access public"
AUDIT_WORKFLOW_REQUIRED_COMMANDS = (
    "python3 tools/audit/run-all.py --strict",
    DOCS_WORKFLOW_POLICY_COMMAND,
)
AUDIT_WORKFLOW_ALLOWED_ACTIONS = (
    "actions/checkout",
    "actions/setup-node",
    "actions/setup-python",
    "actions/cache",
)
# Reference-link policy (docs/PRODUCT-READINESS.md): corpus pages link to the
# generated docs/reference/ pages instead of the gitignored refs/ mirror, so
# no refs-only MkDocs warnings are expected anymore (was 632 before v4.56.x).
MKDOCS_REFS_WARNING_BASELINE = 0
GITHUB_WORKFLOW_FILES = (
    ROOT / ".github" / "workflows" / "audit.yml",
    ROOT / ".github" / "workflows" / "docs.yml",
    ROOT / ".github" / "workflows" / "publish.yml",
    ROOT / ".github" / "workflows" / "release.yml",
)
WORKFLOW_REQUIRED_ACTION_REFS = (
    ("actions/checkout", "v6"),
    ("actions/setup-node", "v6"),
    ("actions/setup-python", "v6"),
    ("actions/cache", "v5"),
    ("actions/upload-pages-artifact", "v5"),
    ("actions/deploy-pages", "v5"),
    ("softprops/action-gh-release", "v3"),
)
WORKFLOW_USES_RE = re.compile(
    r"^\s*-?\s*uses:\s*"
    r"(?P<action>[^@\s#]+)@(?P<ref>[^\s#]+)"
)
DOCS_WORKFLOW_REQUIRED_PATHS = (
    "knowledge/**",
    "examples/**",
    "skills/**",
    "agents/**",
    "commands/**",
    "docs/**",
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


def yaml_mapping_block(text: str, key: str, indent: int) -> str:
    lines = text.splitlines()
    start = None

    for index, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("#"):
            continue
        if yaml_indent(line) == indent and stripped == f"{key}:":
            start = index + 1
            break

    if start is None:
        return ""

    end = len(lines)
    for index in range(start, len(lines)):
        stripped = lines[index].strip()
        if not stripped or stripped.startswith("#"):
            continue
        if yaml_indent(lines[index]) <= indent:
            end = index
            break
    return "\n".join(lines[start:end])


def yaml_direct_scalars(text: str, indent: int) -> dict[str, str]:
    scalars: dict[str, str] = {}
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith(("#", "- ")):
            continue
        if yaml_indent(line) != indent or ":" not in stripped:
            continue
        key, value = stripped.split(":", 1)
        if value.strip():
            scalars[key] = unquote_yaml_scalar(value)
    return scalars


def workflow_job_block(text: str, job_name: str) -> str:
    jobs = yaml_mapping_block(text, "jobs", 0)
    return yaml_mapping_block(jobs, job_name, 2)


def workflow_permission_entries(text: str) -> list[tuple[str, str]]:
    lines = text.splitlines()
    entries: list[tuple[str, str]] = []

    for index, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("#") or not stripped.startswith("permissions:"):
            continue

        parent_indent = yaml_indent(line)
        inline_value = stripped.removeprefix("permissions:").strip()
        if inline_value:
            entries.append(("permissions", unquote_yaml_scalar(inline_value)))
            continue

        for child in lines[index + 1 :]:
            child_stripped = child.strip()
            if not child_stripped or child_stripped.startswith("#"):
                continue
            child_indent = yaml_indent(child)
            if child_indent <= parent_indent:
                break
            if child_indent != parent_indent + 2 or ":" not in child_stripped:
                continue
            key, value = child_stripped.split(":", 1)
            entries.append((key, unquote_yaml_scalar(value)))
    return entries


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


def audit_workflow_policy_errors(text: str) -> list[str]:
    errors: list[str] = []
    root_permissions = yaml_direct_scalars(
        yaml_mapping_block(text, "permissions", 0),
        2,
    )
    if root_permissions != {"contents": "read"}:
        errors.append("audit workflow root permissions must be exactly contents: read")

    audit_job = workflow_job_block(text, "audit")
    if AUDIT_WORKFLOW_REQUIRED_COMMANDS[0] not in workflow_run_commands(audit_job):
        errors.append(f"audit job must run {AUDIT_WORKFLOW_REQUIRED_COMMANDS[0]}")

    docs_job = workflow_job_block(text, "docs-check")
    docs_job_scalars = yaml_direct_scalars(docs_job, 4)
    if docs_job_scalars.get("if") != "github.event_name == 'pull_request'":
        errors.append("docs-check job must run only for pull_request events")
    if AUDIT_WORKFLOW_REQUIRED_COMMANDS[1] not in workflow_run_commands(docs_job):
        errors.append(f"docs-check job must run {AUDIT_WORKFLOW_REQUIRED_COMMANDS[1]}")

    for permission, value in workflow_permission_entries(text):
        if (permission, value) != ("contents", "read"):
            errors.append(
                f"audit workflow permission is outside the allowlist: {permission}: {value}"
            )

    for _, action, _ in workflow_action_refs(text):
        if action not in AUDIT_WORKFLOW_ALLOWED_ACTIONS:
            errors.append(f"audit workflow action is outside the allowlist: {action}")
    return errors


def publish_workflow_policy_errors(text: str) -> list[str]:
    publish_job = workflow_job_block(text, "publish")
    if PUBLISH_WORKFLOW_COMMAND not in workflow_run_commands(publish_job):
        return [
            "publish job must publish the smoke-tested dist/*.tgz artifact with provenance"
        ]
    return []


def display_workflow_path(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def workflow_action_refs(text: str) -> list[tuple[int, str, str]]:
    refs: list[tuple[int, str, str]] = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        match = WORKFLOW_USES_RE.match(line)
        if match:
            refs.append((line_number, match.group("action"), match.group("ref")))
    return refs


def workflow_action_ref_errors(
    paths: tuple[Path, ...] = GITHUB_WORKFLOW_FILES,
    expected_refs: tuple[tuple[str, str], ...] = WORKFLOW_REQUIRED_ACTION_REFS,
) -> list[str]:
    errors: list[str] = []
    expected = dict(expected_refs)
    found: set[str] = set()

    for path in paths:
        if not path.exists():
            errors.append(f"workflow file is missing: {display_workflow_path(path)}")
            continue

        text = path.read_text(encoding="utf-8")
        for line_number, action, ref in workflow_action_refs(text):
            expected_ref = expected.get(action)
            if expected_ref is None:
                continue
            found.add(action)
            if ref != expected_ref:
                errors.append(
                    f"{display_workflow_path(path)}:{line_number} uses {action}@{ref}; "
                    f"expected {action}@{expected_ref}"
                )

    for action, expected_ref in expected_refs:
        if action not in found:
            errors.append(f"workflow action ref missing: {action}@{expected_ref}")

    return errors


def run_workflow_action_ref_check(paths: tuple[Path, ...] = GITHUB_WORKFLOW_FILES) -> None:
    errors = workflow_action_ref_errors(paths)
    if errors:
        raise SystemExit(
            "workflow action ref check failed:\n"
            + "\n".join(f"- {error}" for error in errors)
        )
    print("\nWorkflow action ref check passed", flush=True)


def run_docs_workflow_policy_check(path: Path = DOCS_WORKFLOW) -> None:
    errors = docs_workflow_policy_errors(path.read_text(encoding="utf-8"))
    if errors:
        raise SystemExit("docs workflow policy check failed:\n" + "\n".join(f"- {error}" for error in errors))
    print("\nDocs workflow policy check passed", flush=True)


def run_audit_workflow_policy_check(path: Path = AUDIT_WORKFLOW) -> None:
    errors = audit_workflow_policy_errors(path.read_text(encoding="utf-8"))
    if errors:
        raise SystemExit("audit workflow policy check failed:\n" + "\n".join(f"- {error}" for error in errors))
    print("\nAudit workflow policy check passed", flush=True)


def run_publish_workflow_policy_check(path: Path = PUBLISH_WORKFLOW) -> None:
    errors = publish_workflow_policy_errors(path.read_text(encoding="utf-8"))
    if errors:
        raise SystemExit("publish workflow policy check failed:\n" + "\n".join(f"- {error}" for error in errors))
    print("\nPublish workflow policy check passed", flush=True)


def mkdocs_warning_lines(output: str) -> list[str]:
    return [line for line in output.splitlines() if "WARNING" in line]


def non_refs_mkdocs_warning_lines(output: str) -> list[str]:
    return [line for line in mkdocs_warning_lines(output) if "refs/" not in line]


def refs_mkdocs_warning_lines(output: str) -> list[str]:
    return [line for line in mkdocs_warning_lines(output) if "refs/" in line]


def assert_mkdocs_warning_policy(
    output: str,
    *,
    refs_warning_baseline: int = MKDOCS_REFS_WARNING_BASELINE,
) -> None:
    unexpected = non_refs_mkdocs_warning_lines(output)
    if unexpected:
        sample = "\n".join(f"- {line}" for line in unexpected[:10])
        raise SystemExit(
            "mkdocs emitted non-refs warning(s); fix docs navigation or update the warning policy.\n"
            f"Unexpected warning count: {len(unexpected)}\n"
            f"{sample}"
        )

    refs_warnings = refs_mkdocs_warning_lines(output)
    if len(refs_warnings) > refs_warning_baseline:
        sample = "\n".join(f"- {line}" for line in refs_warnings[:10])
        raise SystemExit(
            "mkdocs refs-only warning count exceeded the accepted baseline; normalize new "
            "refs links or update the baseline with a documented policy decision.\n"
            f"Refs warning count: {len(refs_warnings)}\n"
            f"Accepted baseline: {refs_warning_baseline}\n"
            f"{sample}"
        )

    print(
        "\nMkDocs warning policy passed: "
        f"{len(refs_warnings)}/{refs_warning_baseline} refs-only warning(s)",
        flush=True,
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
            len(refs_mkdocs_warning_lines(refs_only_output)) == 2,
            "refs mkdocs warning classifier should count refs warning lines",
        )
        assert_condition(
            run_capture(["python3", "-c", "print('quiet success')"], echo=False).strip() == "quiet success",
            "quiet command capture should return stdout without echoing on success",
        )
        assert_mkdocs_warning_policy(refs_only_output, refs_warning_baseline=2)

        try:
            assert_mkdocs_warning_policy(refs_only_output)
        except SystemExit as error:
            assert_condition(
                "baseline" in str(error),
                "default zero baseline should reject refs-only warnings",
            )
        else:
            raise SystemExit(
                "self-test failed: refs warnings should exceed the default zero baseline"
            )

        refs_baseline_regression_output = refs_only_output + "\n" + (
            "WARNING - Doc file 'examples/extra.md' contains a link '../refs/extra/source.md', "
            "but the target 'refs/extra/source.md' is not found among documentation files."
        )
        try:
            assert_mkdocs_warning_policy(refs_baseline_regression_output, refs_warning_baseline=2)
        except SystemExit as error:
            assert_condition("baseline" in str(error), "refs warning cap failure should explain baseline")
        else:
            raise SystemExit("self-test failed: refs warning cap should raise SystemExit")

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
        passing_audit_workflow = "\n".join([
            "permissions:",
            "  contents: read",
            "jobs:",
            "  audit:",
            f"        run: {AUDIT_WORKFLOW_REQUIRED_COMMANDS[0]}",
            "  docs-check:",
            "    if: github.event_name == 'pull_request'",
            f"        run: {AUDIT_WORKFLOW_REQUIRED_COMMANDS[1]}",
        ])
        assert_condition(
            audit_workflow_policy_errors(passing_audit_workflow) == [],
            "audit workflow fixture should enforce strict audits and docs-only checks",
        )
        passing_publish_workflow = "\n".join([
            "jobs:",
            "  publish:",
            f"        run: {PUBLISH_WORKFLOW_COMMAND}",
        ])
        assert_condition(
            publish_workflow_policy_errors(passing_publish_workflow) == [],
            "publish workflow fixture should publish the tested tarball",
        )
        assert_condition(
            publish_workflow_policy_errors(
                passing_publish_workflow.replace(" dist/*.tgz", "")
            ) != [],
            "publish workflow fixture should reject repacking the repository directory",
        )
        commented_policy_decoy = "\n".join([
            "# permissions:",
            "#   contents: read",
            "jobs:",
            "  audit:",
            f"        run: {AUDIT_WORKFLOW_REQUIRED_COMMANDS[0]}",
            "  other:",
            "    if: github.event_name == 'pull_request'",
            f"        run: {AUDIT_WORKFLOW_REQUIRED_COMMANDS[1]}",
            "# docs-check:",
        ])
        assert_condition(
            len(audit_workflow_policy_errors(commented_policy_decoy)) >= 2,
            "comments or unrelated jobs must not satisfy audit workflow policy",
        )
        deployment_policy_violation = passing_audit_workflow + "\n" + "\n".join([
            "  deploy-preview:",
            "    permissions:",
            "      deployments: write",
            "    steps:",
            "      - uses: vendor/preview-deploy@v1",
        ])
        deployment_errors = audit_workflow_policy_errors(deployment_policy_violation)
        assert_condition(
            any("deployments" in error for error in deployment_errors),
            "deployment write permission must fail audit workflow policy",
        )
        assert_condition(
            any("preview-deploy" in error for error in deployment_errors),
            "deployment actions must fail audit workflow policy",
        )
        nested_action_violation = passing_audit_workflow.replace(
            f"        run: {AUDIT_WORKFLOW_REQUIRED_COMMANDS[1]}",
            f"        run: {AUDIT_WORKFLOW_REQUIRED_COMMANDS[1]}\n"
            "      - uses: vendor/actions/deploy@v1\n"
            "      - uses: amondnet/vercel-action@v25",
        )
        nested_action_errors = audit_workflow_policy_errors(nested_action_violation)
        assert_condition(
            any("vendor/actions/deploy" in error for error in nested_action_errors),
            "nested action paths must be parsed and rejected",
        )
        assert_condition(
            any("amondnet/vercel-action" in error for error in nested_action_errors),
            "non-allowlisted deployment actions must be rejected regardless of name",
        )
        action_ref_workflow = root / "action-refs.yml"
        action_ref_workflow.write_text(
            "\n".join(
                [
                    "name: Action refs",
                    "jobs:",
                    "  fixture:",
                    "    steps:",
                    *(f"      - uses: {action}@{ref}" for action, ref in WORKFLOW_REQUIRED_ACTION_REFS),
                ]
            ),
            encoding="utf-8",
        )
        assert_condition(
            workflow_action_refs(action_ref_workflow.read_text(encoding="utf-8"))[0] == (
                5,
                "actions/checkout",
                "v6",
            ),
            "workflow action ref parser should read uses lines with line numbers",
        )
        assert_condition(
            workflow_action_ref_errors((action_ref_workflow,)) == [],
            "workflow action ref fixture should pass when expected refs are present",
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
        audit_policy_errors = audit_workflow_policy_errors(
            "permissions:\n  pages: write\n  id-token: write\n"
            "        run: python3 tools/audit/run-all.py\n"
            "      - uses: actions/deploy-pages@v5"
        )
        assert_condition(
            any("--strict" in error for error in audit_policy_errors),
            "audit workflow fixture should reject non-strict audits",
        )
        assert_condition(
            any("docs-check" in error for error in audit_policy_errors),
            "audit workflow fixture should require a PR-only docs job",
        )
        assert_condition(
            any(
                "pages" in error or "id-token" in error or "deploy-pages" in error
                for error in audit_policy_errors
            ),
            "audit workflow fixture should reject deployment permissions and actions",
        )
        bad_action_ref_workflow = root / "bad-action-refs.yml"
        bad_action_ref_workflow.write_text(
            "\n".join(
                [
                    "name: Bad action refs",
                    "jobs:",
                    "  fixture:",
                    "    steps:",
                    "      - uses: actions/checkout@v4",
                    "      - uses: actions/setup-node@v6",
                ]
            ),
            encoding="utf-8",
        )
        action_ref_errors = workflow_action_ref_errors((bad_action_ref_workflow,))
        assert_condition(
            any("actions/checkout@v4" in error for error in action_ref_errors),
            "workflow action ref failure should report stale action versions",
        )
        assert_condition(
            any("actions/setup-python@v6" in error for error in action_ref_errors),
            "workflow action ref failure should report missing required actions",
        )
        run_workflow_action_ref_check()
        run_docs_workflow_policy_check()
        run_audit_workflow_policy_check()
        run_publish_workflow_policy_check()

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
    run_workflow_action_ref_check()
    run_docs_workflow_policy_check()
    run_audit_workflow_policy_check()
    run_publish_workflow_policy_check()
    if not args.skip_vscode:
        run_vscode_checks()
    if not args.skip_docs:
        run_docs_build()

    print("\nLocal CI parity check passed", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
