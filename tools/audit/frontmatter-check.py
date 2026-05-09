#!/usr/bin/env python3
"""
Validate YAML frontmatter on every markdown file in knowledge/ and examples/.

Checks:
  - Frontmatter present (`---\n...\n---`)
  - Required keys: title, applies_to (or `source` for generated, or `purpose` for PRINCIPLES.md)
  - For generated files: source and extracted_at present
  - applies_to is a list (YAML array)

Outputs a report to console; exits 1 if any errors.

Usage:
  python3 tools/audit/frontmatter-check.py [--strict]
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


REQUIRED_KEYS = {"title"}
RECOMMENDED_KEYS = {"applies_to"}
GENERATED_KEYS = {"source", "extracted_at"}
# Optional versioning keys (added in v3.11). Validated only if present —
# missing them is fine for backward compatibility, but if present they
# should be well-formed.
VERSIONING_KEYS = {"version", "last_updated", "stability"}
STABILITY_VALUES = {"stable", "beta", "experimental", "deprecated"}


def is_hand_written(text: str) -> bool:
    return "<!-- hand-written -->" in text


def parse_frontmatter(text: str) -> dict[str, object] | None:
    """Lightweight YAML parser — handles flat keys + simple lists.
    Returns None if no frontmatter found.
    Skips a leading HTML comment (e.g., `<!-- hand-written -->`) before frontmatter.
    """
    lines = text.splitlines()

    # Skip leading HTML comments (e.g., <!-- hand-written -->) and blank lines
    cursor = 0
    while cursor < len(lines):
        stripped = lines[cursor].strip()
        if stripped.startswith("<!--") and stripped.endswith("-->"):
            cursor += 1
            continue
        if stripped == "":
            cursor += 1
            continue
        break

    if cursor >= len(lines) or not lines[cursor].strip().startswith("---"):
        return None

    fm_lines: list[str] = []
    for line in lines[cursor + 1:]:
        if line.strip().startswith("---"):
            break
        fm_lines.append(line)
    if not fm_lines:
        return None

    fm: dict[str, object] = {}
    current_list_key: str | None = None
    for line in fm_lines:
        stripped = line.rstrip()
        if not stripped:
            current_list_key = None
            continue

        # List continuation: "  - item"
        if current_list_key and stripped.lstrip().startswith("-"):
            item = stripped.lstrip()[1:].strip()
            if item:
                fm[current_list_key] = list(fm.get(current_list_key, [])) + [item]
            continue

        # New key
        match = re.match(r"^([a-zA-Z_]+):\s*(.*)$", stripped)
        if not match:
            continue
        key, value = match.group(1), match.group(2).strip()
        if value == "":
            current_list_key = key
            fm[key] = []
        elif value.startswith("[") and value.endswith("]"):
            # Inline list
            inner = value[1:-1]
            items = [item.strip().strip("\"'") for item in inner.split(",") if item.strip()]
            fm[key] = items
            current_list_key = None
        else:
            fm[key] = value.strip().strip("\"'")
            current_list_key = None
    return fm


def validate(path: Path, strict: bool) -> list[str]:
    text = path.read_text(encoding="utf-8")
    rel = path.relative_to(ROOT)
    errors: list[str] = []
    fm = parse_frontmatter(text)

    if fm is None:
        errors.append(f"{rel}: no frontmatter found")
        return errors

    # Required keys
    missing = REQUIRED_KEYS - set(fm.keys())
    if missing:
        errors.append(f"{rel}: missing required keys {missing}")

    # applies_to should be a list
    if "applies_to" in fm and not isinstance(fm["applies_to"], list):
        errors.append(f"{rel}: 'applies_to' should be a list, got {type(fm['applies_to']).__name__}")

    # Generated files need source + extracted_at
    if not is_hand_written(text):
        # Heuristic: files in knowledge/ are generated unless marked
        if "knowledge/" in str(rel) and "design-tokens/" not in str(rel) and "/INDEX.md" not in str(rel) and rel.parent.name != "knowledge":
            # Most other knowledge files are generated; check
            missing_gen = GENERATED_KEYS - set(fm.keys())
            if missing_gen and strict:
                errors.append(f"{rel}: generated file missing {missing_gen}")

    # Recommended keys (warn only in strict)
    if strict:
        missing_rec = RECOMMENDED_KEYS - set(fm.keys())
        if missing_rec:
            errors.append(f"{rel}: (warn) recommended keys missing {missing_rec}")

    # Versioning keys: validate format if present (added v3.11)
    version = fm.get("version")
    if version is not None and not _is_valid_version(version):
        errors.append(f"{rel}: invalid version '{version}' — expected semver (e.g., 1.0.0)")

    last_updated = fm.get("last_updated")
    if last_updated is not None and not _is_valid_date_or_yearmonth(last_updated):
        errors.append(f"{rel}: invalid last_updated '{last_updated}' — expected YYYY-MM or YYYY-MM-DD")

    stability = fm.get("stability")
    if stability is not None and str(stability) not in STABILITY_VALUES:
        errors.append(
            f"{rel}: invalid stability '{stability}' — expected one of {sorted(STABILITY_VALUES)}"
        )

    return errors


def _is_valid_version(value: object) -> bool:
    """Match semver-like X.Y.Z (with optional -prerelease)."""
    if not isinstance(value, str):
        return False
    return bool(re.match(r"^\d+\.\d+\.\d+(-[A-Za-z0-9.-]+)?$", value))


def _is_valid_date_or_yearmonth(value: object) -> bool:
    if not isinstance(value, str):
        return False
    return bool(re.match(r"^\d{4}-\d{2}(-\d{2})?$", value))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--strict", action="store_true", help="Treat warnings as errors")
    args = parser.parse_args()

    # Only check knowledge/ — examples/ are prose component specs without
    # required frontmatter contract.
    targets: list[Path] = list(ROOT.glob("knowledge/**/*.md"))

    all_errors: list[str] = []
    files_checked = 0
    for path in targets:
        if path.name == "README.md" or path.name == "COVERAGE.md":
            continue
        files_checked += 1
        errors = validate(path, args.strict)
        all_errors.extend(errors)

    print(f"Checked {files_checked} files")
    if all_errors:
        print(f"\n{len(all_errors)} issues:\n")
        for err in all_errors:
            print(f"  {err}")
        sys.exit(1)
    else:
        print("All frontmatter valid ✓")


if __name__ == "__main__":
    main()
