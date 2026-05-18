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
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KNOWLEDGE_WARN_LINES = 150_000
KNOWLEDGE_MAX_LINES = 200_000


def run(command: list[str], *, cwd: Path = ROOT) -> None:
    print(f"\n$ {' '.join(command)}", flush=True)
    result = subprocess.run(command, cwd=cwd)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def run_release_check() -> None:
    run(["npm", "run", "release:check"])


def run_python_compile() -> None:
    files: list[str] = []
    for directory in ("tools/extractors", "tools/audit", "tools/migrations", "tools/preview"):
        files.extend(str(path.relative_to(ROOT)) for path in sorted((ROOT / directory).glob("*.py")))
    run(["python3", "-m", "py_compile", *files])


def run_size_budget() -> None:
    total = 0
    for directory in ("knowledge", "examples", "docs"):
        for path in (ROOT / directory).rglob("*.md"):
            with path.open("r", encoding="utf-8") as handle:
                total += sum(1 for _ in handle)

    print(f"\nKnowledge/docs/examples total: {total} lines", flush=True)
    if total > KNOWLEDGE_MAX_LINES:
        raise SystemExit(
            f"knowledge base exceeds hard cap of {KNOWLEDGE_MAX_LINES} lines ({total})"
        )
    if total > KNOWLEDGE_WARN_LINES:
        print(
            f"warning: knowledge base exceeds {KNOWLEDGE_WARN_LINES} lines ({total}); consider pruning",
            file=sys.stderr,
        )


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


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--skip-release-check",
        action="store_true",
        help="Skip the expensive npm release gate when rerunning workflow-only checks.",
    )
    parser.add_argument("--skip-docs", action="store_true", help="Skip mkdocs site build.")
    parser.add_argument("--skip-vscode", action="store_true", help="Skip VS Code extension checks.")
    args = parser.parse_args()

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
