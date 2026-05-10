#!/usr/bin/env python3
"""Bulk-bump `last_updated` to the current month for given files.

Use after a quarterly stability review when files are still accurate
but the date is stale.

Usage:
  python3 tools/migrations/bump-last-updated.py knowledge/foo.md knowledge/bar.md
  python3 tools/migrations/bump-last-updated.py --dry-run knowledge/*.md
  python3 tools/migrations/bump-last-updated.py --today 2026-12 knowledge/foo.md

Idempotent: if the file is already at the target date, it's skipped.
"""
from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def find_frontmatter_bounds(text: str) -> tuple[int, int] | None:
    lines = text.splitlines()
    cursor = 0
    while cursor < len(lines):
        s = lines[cursor].strip()
        if s.startswith("<!--") and s.endswith("-->"):
            cursor += 1
            continue
        if s == "":
            cursor += 1
            continue
        break
    if cursor >= len(lines) or lines[cursor].strip() != "---":
        return None
    start = cursor + 1
    for i in range(start, len(lines)):
        if lines[i].strip() == "---":
            return (start, i)
    return None


def parse_today(value: str | None) -> date:
    if not value:
        return date.today()
    # Allow YYYY-MM or YYYY-MM-DD
    try:
        return date.fromisoformat(value)
    except ValueError:
        # Try YYYY-MM
        parts = value.split("-")
        if len(parts) == 2:
            return date(int(parts[0]), int(parts[1]), 1)
        raise


def bump_last_updated(text: str, target: date) -> tuple[str, bool]:
    bounds = find_frontmatter_bounds(text)
    if bounds is None:
        return text, False
    start, end = bounds
    lines = text.splitlines(keepends=True)
    target_str = target.strftime("%Y-%m")

    changed = False
    for i in range(start, end):
        line = lines[i]
        stripped = line.lstrip()
        if stripped.startswith("last_updated:"):
            indent = line[: len(line) - len(stripped)]
            new_line = f"{indent}last_updated: {target_str}\n"
            if line != new_line:
                lines[i] = new_line
                changed = True
            break  # only one last_updated per file

    return "".join(lines), changed


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--today", help="Override today (YYYY-MM or YYYY-MM-DD); for testing")
    parser.add_argument("files", nargs="+", type=Path)
    args = parser.parse_args()

    target = parse_today(args.today)
    target_str = target.strftime("%Y-%m")

    bumped: list[Path] = []
    unchanged: list[Path] = []
    skipped: list[tuple[Path, str]] = []

    for raw in args.files:
        path = raw if raw.is_absolute() else ROOT / raw
        if not path.exists():
            skipped.append((path, "not found"))
            continue

        text = path.read_text(encoding="utf-8")
        new_text, changed = bump_last_updated(text, target)

        if not changed:
            unchanged.append(path)
            continue

        if args.dry_run:
            print(f"  [dry-run] would bump {path.relative_to(ROOT)} → {target_str}")
            bumped.append(path)
            continue

        tmp = path.with_suffix(path.suffix + ".tmp")
        tmp.write_text(new_text, encoding="utf-8")
        tmp.replace(path)
        print(f"  ✓ {path.relative_to(ROOT)} → {target_str}")
        bumped.append(path)

    print()
    print(f"Bumped: {len(bumped)}")
    print(f"Unchanged: {len(unchanged)}")
    if skipped:
        print(f"Skipped: {len(skipped)}")
        for p, reason in skipped:
            print(f"  - {p}: {reason}")
        sys.exit(1)


if __name__ == "__main__":
    main()
