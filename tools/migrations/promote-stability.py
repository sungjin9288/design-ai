#!/usr/bin/env python3
"""Bulk-promote (or demote) stability level for knowledge files.

Updates `stability:` in YAML frontmatter for the given files. Idempotent:
re-running with the same target is a no-op. Atomic per-file: writes a
temp file then renames.

Usage:
  # Promote experimental → stable
  python3 tools/migrations/promote-stability.py --from experimental --to stable \
    knowledge/foo.md knowledge/bar.md

  # Promote beta → stable
  python3 tools/migrations/promote-stability.py --from beta --to stable knowledge/qux.md

  # Demote stable → deprecated
  python3 tools/migrations/promote-stability.py --from stable --to deprecated knowledge/old.md

  # Dry-run
  python3 tools/migrations/promote-stability.py --from beta --to stable \
    --dry-run knowledge/*.md

The --from value is enforced: if a file's current stability doesn't match,
it's skipped with a warning. Use --force to override (rare).
"""
from __future__ import annotations

import argparse
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STABILITY_VALUES = {"stable", "beta", "experimental", "deprecated"}


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


def get_stability(text: str) -> str | None:
    bounds = find_frontmatter_bounds(text)
    if bounds is None:
        return None
    start, end = bounds
    for line in text.splitlines()[start:end]:
        if line.lstrip().startswith("stability:"):
            return line.split(":", 1)[1].strip().strip("'\"")
    return None


def update_stability(text: str, new_value: str, today: date | None = None) -> tuple[str, bool]:
    """Return (new_text, changed). Bumps last_updated to today if changed."""
    bounds = find_frontmatter_bounds(text)
    if bounds is None:
        return text, False

    start, end = bounds
    lines = text.splitlines(keepends=True)

    changed = False
    for i in range(start, end):
        line = lines[i]
        stripped = line.lstrip()
        if stripped.startswith("stability:"):
            indent = line[: len(line) - len(stripped)]
            new_line = f"{indent}stability: {new_value}\n"
            if line != new_line:
                lines[i] = new_line
                changed = True
        if stripped.startswith("last_updated:"):
            indent = line[: len(line) - len(stripped)]
            target = today or date.today()
            new_line = f"{indent}last_updated: {target.strftime('%Y-%m')}\n"
            if line != new_line:
                lines[i] = new_line
                # Bumping last_updated alone shouldn't claim "changed"
                # if stability didn't move — but we always pair them when promoting.

    return "".join(lines), changed


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--from", dest="from_level", required=True, choices=sorted(STABILITY_VALUES))
    parser.add_argument("--to", dest="to_level", required=True, choices=sorted(STABILITY_VALUES))
    parser.add_argument("--force", action="store_true", help="Skip the --from check")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--today", help="Override today (YYYY-MM-DD); for testing")
    parser.add_argument("files", nargs="+", type=Path)
    args = parser.parse_args()

    if args.from_level == args.to_level:
        print(f"--from and --to are the same ({args.from_level}). Nothing to do.", file=sys.stderr)
        sys.exit(2)

    today = date.fromisoformat(args.today) if args.today else date.today()

    promoted: list[Path] = []
    skipped: list[tuple[Path, str]] = []
    not_found: list[Path] = []

    for raw in args.files:
        path = raw if raw.is_absolute() else ROOT / raw
        if not path.exists():
            not_found.append(path)
            continue

        text = path.read_text(encoding="utf-8")
        current = get_stability(text)

        if current is None:
            skipped.append((path, "no stability key"))
            continue

        if current != args.from_level and not args.force:
            skipped.append((path, f"current={current}, expected={args.from_level}"))
            continue

        new_text, changed = update_stability(text, args.to_level, today=today)

        if not changed:
            skipped.append((path, "already at target"))
            continue

        if args.dry_run:
            print(f"  [dry-run] would update {path.relative_to(ROOT)}: {current} → {args.to_level}")
            promoted.append(path)
            continue

        # Atomic write
        tmp = path.with_suffix(path.suffix + ".tmp")
        tmp.write_text(new_text, encoding="utf-8")
        tmp.replace(path)
        print(f"  ✓ {path.relative_to(ROOT)}: {current} → {args.to_level}")
        promoted.append(path)

    print()
    print(f"Promoted: {len(promoted)}")
    print(f"Skipped: {len(skipped)}")
    if skipped:
        for p, reason in skipped[:10]:
            print(f"  - {p.relative_to(ROOT)}: {reason}")
        if len(skipped) > 10:
            print(f"  ... and {len(skipped) - 10} more")
    if not_found:
        print(f"Not found: {len(not_found)}")
        for p in not_found:
            print(f"  - {p}")
        sys.exit(1)


if __name__ == "__main__":
    main()
