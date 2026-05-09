#!/usr/bin/env python3
"""One-shot migration: add `version`, `last_updated`, `stability` keys to
the YAML frontmatter of every knowledge file.

Behavior:
  - Locates every .md file in knowledge/ that already has a frontmatter
    block (between `---` markers, optionally preceded by an HTML comment
    like `<!-- hand-written -->`).
  - If `version` is already present, the file is skipped (idempotent).
  - Otherwise inserts `version: 1.0.0`, `last_updated: 2026-05`, and
    `stability: stable` BEFORE the closing `---` line. Existing keys
    are preserved as-is.

Usage:
  python3 tools/migrations/add-version-frontmatter.py            # dry-run
  python3 tools/migrations/add-version-frontmatter.py --write    # apply

After running, verify with:
  python3 tools/audit/frontmatter-check.py
"""
from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KNOWLEDGE = ROOT / "knowledge"

DEFAULT_VERSION = "1.0.0"
DEFAULT_LAST_UPDATED = "2026-05"
DEFAULT_STABILITY = "stable"


def find_frontmatter_bounds(text: str) -> tuple[int, int] | None:
    """Return (start_line_idx, end_line_idx) of frontmatter, exclusive of
    the closing `---` line marker (so insertions go ABOVE end_line_idx).

    Skips leading HTML comments and blank lines before the opening `---`.
    Returns None if no frontmatter block found.
    """
    lines = text.splitlines()
    cursor = 0

    # Skip leading HTML comments + blank lines
    while cursor < len(lines):
        stripped = lines[cursor].strip()
        if stripped.startswith("<!--") and stripped.endswith("-->"):
            cursor += 1
            continue
        if stripped == "":
            cursor += 1
            continue
        break

    # Now expect opening `---`
    if cursor >= len(lines) or lines[cursor].strip() != "---":
        return None

    start = cursor + 1
    # Find closing `---`
    for i in range(start, len(lines)):
        if lines[i].strip() == "---":
            return (start, i)
    return None


def has_version_key(text: str, start: int, end: int) -> bool:
    lines = text.splitlines()
    for line in lines[start:end]:
        if line.lstrip().startswith("version:"):
            return True
    return False


def insert_version_keys(text: str, start: int, end: int) -> str:
    lines = text.splitlines(keepends=True)
    insertion = (
        f"version: {DEFAULT_VERSION}\n"
        f"last_updated: {DEFAULT_LAST_UPDATED}\n"
        f"stability: {DEFAULT_STABILITY}\n"
    )
    # Insert before the closing `---` line (line index `end`)
    lines.insert(end, insertion)
    return "".join(lines)


def process_file(path: Path, write: bool) -> str:
    """Returns one of: 'skip-no-frontmatter', 'skip-already-versioned',
    'updated', 'would-update'."""
    text = path.read_text(encoding="utf-8")
    bounds = find_frontmatter_bounds(text)
    if bounds is None:
        return "skip-no-frontmatter"

    start, end = bounds
    if has_version_key(text, start, end):
        return "skip-already-versioned"

    new_text = insert_version_keys(text, start, end)
    if write:
        path.write_text(new_text, encoding="utf-8")
        return "updated"
    return "would-update"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Apply changes (without this, dry-run)")
    args = parser.parse_args()

    files = sorted(KNOWLEDGE.rglob("*.md"))
    counts = {"updated": 0, "would-update": 0, "skip-already-versioned": 0, "skip-no-frontmatter": 0}

    for path in files:
        result = process_file(path, args.write)
        counts[result] += 1

    print()
    if args.write:
        print(f"  ✓ Updated:                    {counts['updated']}")
    else:
        print(f"  Would update:                 {counts['would-update']}")
    print(f"  Skipped (already versioned):  {counts['skip-already-versioned']}")
    print(f"  Skipped (no frontmatter):     {counts['skip-no-frontmatter']}")
    print(f"  Total scanned:                {sum(counts.values())}")
    print()
    if not args.write and counts["would-update"] > 0:
        print("Re-run with --write to apply.")


if __name__ == "__main__":
    main()
