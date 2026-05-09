#!/usr/bin/env python3
"""Flag knowledge files whose `last_updated` is too old.

Operationalizes the versioned frontmatter (added in v3.11). Default:
- Warn: last_updated > 6 months ago.
- Error: last_updated > 12 months ago (with --strict).

Files without `last_updated` are skipped (backward-compatible).

Usage:
  python3 tools/audit/stale-check.py
  python3 tools/audit/stale-check.py --strict
  python3 tools/audit/stale-check.py --warn-months 3 --error-months 6
"""
from __future__ import annotations

import argparse
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KNOWLEDGE = ROOT / "knowledge"

DATE_RE = re.compile(r"^(\d{4})-(\d{2})(?:-(\d{2}))?$")


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


def extract_last_updated(text: str) -> str | None:
    bounds = find_frontmatter_bounds(text)
    if bounds is None:
        return None
    start, end = bounds
    for line in text.splitlines()[start:end]:
        if line.lstrip().startswith("last_updated:"):
            value = line.split(":", 1)[1].strip().strip("'\"")
            return value
    return None


def parse_date(value: str) -> date | None:
    """Parse YYYY-MM or YYYY-MM-DD; return last day of month if no day given."""
    m = DATE_RE.match(value)
    if not m:
        return None
    year, month, day = int(m.group(1)), int(m.group(2)), m.group(3)
    if day is None:
        # Treat YYYY-MM as the LAST day of that month (most generous reading).
        # Pick day 28 — safe for all months — then advance to month-end.
        d = date(year, month, 28)
    else:
        d = date(year, month, int(day))
    return d


def months_diff(target: date, today: date) -> int:
    """Approximate month difference (today − target). Negative if target is in the future."""
    return (today.year - target.year) * 12 + (today.month - target.month)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--strict", action="store_true", help="Exit 1 if any file exceeds the error threshold")
    parser.add_argument("--warn-months", type=int, default=6, help="Months before warning (default: 6)")
    parser.add_argument("--error-months", type=int, default=12, help="Months before error (default: 12)")
    parser.add_argument("--today", default=None, help="Override today's date (YYYY-MM-DD) — for testing")
    args = parser.parse_args()

    today = date.fromisoformat(args.today) if args.today else date.today()

    warns: list[str] = []
    errors: list[str] = []
    skipped = 0
    invalid = 0
    fresh = 0

    for path in sorted(KNOWLEDGE.rglob("*.md")):
        text = path.read_text(encoding="utf-8")
        last_updated = extract_last_updated(text)
        rel = path.relative_to(ROOT)

        if last_updated is None:
            skipped += 1
            continue

        d = parse_date(last_updated)
        if d is None:
            invalid += 1
            errors.append(f"{rel}: invalid last_updated format '{last_updated}'")
            continue

        diff = months_diff(d, today)
        if diff >= args.error_months:
            errors.append(f"{rel}: {diff} months stale (last_updated={last_updated})")
        elif diff >= args.warn_months:
            warns.append(f"{rel}: {diff} months old (last_updated={last_updated})")
        else:
            fresh += 1

    total = fresh + len(warns) + len(errors) + skipped + invalid
    print()
    print(f"  Fresh (≤ {args.warn_months} months):       {fresh}")
    print(f"  Warning (>{args.warn_months} months):      {len(warns)}")
    print(f"  Stale  (>{args.error_months} months):      {len(errors)}")
    print(f"  Skipped (no last_updated):  {skipped}")
    print(f"  Invalid format:             {invalid}")
    print(f"  Total knowledge files:      {total}")
    print()

    if warns and not args.strict:
        print("⚠  Warnings:")
        for w in warns[:10]:
            print(f"   - {w}")
        if len(warns) > 10:
            print(f"   ... and {len(warns) - 10} more")

    if errors:
        print("✗  Stale files:")
        for e in errors[:20]:
            print(f"   - {e}")
        if len(errors) > 20:
            print(f"   ... and {len(errors) - 20} more")

    if errors:
        if args.strict:
            sys.exit(1)
        else:
            print()
            print("Use --strict to fail CI on stale files.")
    else:
        print("All knowledge files within freshness window ✓")


if __name__ == "__main__":
    main()
