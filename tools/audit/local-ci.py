#!/usr/bin/env python3
"""
Run the local equivalent of the non-publishing GitHub CI surfaces.

This is intentionally broader than `npm run release:check`: it also exercises
the workflow-only Python syntax check, knowledge size budget, VS Code extension
compile/unit tests, and mkdocs site build before a branch is pushed for
Real-CI verification.

Usage:
  python3 tools/audit/local-ci.py
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


def run(command: list[str], *, cwd: Path = ROOT) -> None:
    print(f"\n$ {' '.join(command)}", flush=True)
    result = subprocess.run(command, cwd=cwd)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


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
    run(["python3", "-m", "mkdocs", "build", "--clean"])


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

    print("Local CI self-test passed")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true", help="Run local fixture checks.")
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

    if not args.skip_release_check:
        run_release_check()
    run_python_compile()
    run_size_budget()
    if not args.skip_vscode:
        run_vscode_checks()
    if not args.skip_docs:
        run_docs_build()

    print("\nLocal CI parity check passed", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
