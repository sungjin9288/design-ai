#!/usr/bin/env python3
"""Verify that integration walkthrough docs have the expected sections.

Each walkthrough should include: Prerequisites, Setup, at least 3
"Walkthrough" sections, Tips, and Next/cross-reference. This catches
walkthroughs that drift from the standard structure over time.

Usage:
  python3 tools/audit/integration-check.py
  python3 tools/audit/integration-check.py --strict
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INTEGRATIONS_DIR = ROOT / "docs" / "integrations"

# Walkthrough files (not the MCP-specific ones, which have a different shape).
WALKTHROUGH_FILES = [
    "codex-walkthrough.md",
    "cursor-walkthrough.md",
    "aider-walkthrough.md",
    "sdk-walkthrough.md",
    "vscode-walkthrough.md",
    "agent-sdk-walkthrough.md",
]

# Required headings (substring match, case-insensitive).
REQUIRED_SECTIONS = [
    "prerequisites",
    "setup",
    "walkthrough",  # at least one
    "next",
]

MIN_WALKTHROUGH_COUNT = 3  # at least 3 numbered "Walkthrough N:" sections


def check_file(path: Path) -> list[str]:
    """Return list of issues for this file."""
    if not path.exists():
        return [f"missing: {path.relative_to(ROOT)}"]

    content = path.read_text(encoding="utf-8").lower()
    issues: list[str] = []

    for section in REQUIRED_SECTIONS:
        if section not in content:
            issues.append(f"missing section: '{section}'")

    walkthrough_count = content.count("## walkthrough ")
    if walkthrough_count < MIN_WALKTHROUGH_COUNT:
        issues.append(
            f"only {walkthrough_count} 'Walkthrough N:' sections "
            f"(min {MIN_WALKTHROUGH_COUNT})"
        )

    return issues


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--strict", action="store_true", help="Exit 1 on any issue")
    args = parser.parse_args()

    if not INTEGRATIONS_DIR.exists():
        print(f"::error::Missing dir: {INTEGRATIONS_DIR.relative_to(ROOT)}")
        sys.exit(1)

    total_issues = 0
    for filename in WALKTHROUGH_FILES:
        path = INTEGRATIONS_DIR / filename
        issues = check_file(path)
        if issues:
            print(f"\n{path.relative_to(ROOT)}:")
            for issue in issues:
                print(f"  - {issue}")
            total_issues += len(issues)
        else:
            print(f"✓ {path.relative_to(ROOT)}")

    print()
    if total_issues == 0:
        print("All integration walkthroughs valid ✓")
        sys.exit(0)

    print(f"Found {total_issues} issue(s) across walkthroughs.")
    if args.strict:
        sys.exit(1)


if __name__ == "__main__":
    main()
