#!/usr/bin/env python3
"""
Reconciliation mode for v3 extractor — auto-suggest unified API for cross-source conflicts.

Where `component_spec_conflict_check.py` SURFACES drift, this module
PROPOSES resolution. For each prop with disagreement across Ant / MUI /
shadcn, output a recommended unified type, default, deprecation status,
and (where applicable) a migration note.

This is a maintainer aid. By default it only reports proposals.
With --apply-high, it can update existing API table rows for HIGH-confidence
proposals only; it does not add missing props or apply MEDIUM/MANUAL items.

Usage:
  # Single component
  python3 tools/extractors/component_spec_reconcile.py --name button

  # All multi-source canonicals — bulk review session
  python3 tools/extractors/component_spec_reconcile.py --multi-source

  # JSON for tooling
  python3 tools/extractors/component_spec_reconcile.py --name button --json

  # Preview or apply safe HIGH-confidence updates to existing spec rows
  python3 tools/extractors/component_spec_reconcile.py --name button --apply-high --dry-run
  python3 tools/extractors/component_spec_reconcile.py --name button --apply-high

Strategy:
- Type drift: prefer most-specific compatible type (boolean over unknown).
  When truly incompatible (e.g., string vs number), flag for manual review.
- Default drift: prefer the value that matches the most sources;
  fall back to "Undecided — pick by use case".
- Deprecation: if any source deprecates, propose deprecating in unified
  spec with a migration note pointing to the replacement.
- "Only in one source" (LOW): document as library-specific; suggest
  whether to adopt for the unified spec based on prevalence in real apps.
"""
from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from component_spec_scaffold_v2 import (  # noqa: E402
    INDEX_JSON,
    ParsedFile,
    check_node_available,
    check_parser_ready,
    find_ant_source,
    find_mui_source,
    find_shadcn_source,
    pick_primary_interface,
    run_parser,
)
from component_spec_conflict_check import (  # noqa: E402
    STANDARD_HTML_PROPS,
    detect_conflicts,
    is_same_concept,
    normalize_type,
    types_compatible,
)

ROOT = Path(__file__).resolve().parents[2]


# ----- proposal types -----


@dataclass(frozen=True)
class PropProposal:
    name: str
    sources_present: tuple[str, ...]
    proposed_type: str
    proposed_default: str
    proposed_deprecated: bool
    confidence: str  # HIGH / MEDIUM / LOW / MANUAL
    rationale: str
    migration_note: str = ""


@dataclass(frozen=True)
class ApplyChange:
    prop: str
    field: str
    before: str
    after: str


@dataclass(frozen=True)
class ApplyResult:
    path: Path
    changed: tuple[ApplyChange, ...] = ()
    skipped: tuple[str, ...] = ()
    missing_table: bool = False


# ----- type reconciliation -----

# Specificity ranking. Higher = more specific.
# When merging, prefer more-specific types.
TYPE_SPECIFICITY: dict[str, int] = {
    "any": 0,
    "unknown": 0,
    "object": 1,
    "string": 2,
    "number": 2,
    "boolean": 2,
    "React.ReactNode": 3,
    "ReactNode": 3,
    "React.ElementType": 3,
}


def specificity(t: str) -> int:
    """Heuristic specificity score for a type. Union literals score higher."""
    n = normalize_type(t)
    if n in TYPE_SPECIFICITY:
        return TYPE_SPECIFICITY[n]
    # Union of string literals like 'sm' | 'md' | 'lg' is highly specific
    if "|" in n and all("'" in p or '"' in p for p in n.split("|")):
        return 5
    # Other unions: medium-specific
    if "|" in n:
        return 3
    # Function types or React.X: assume specific
    if "=>" in n or n.startswith("React.") or n.startswith("("):
        return 4
    # Custom named type: assume specific
    return 4


def propose_type(types_by_source: dict[str, str]) -> tuple[str, str, str]:
    """Return (proposed_type, confidence, rationale)."""
    if not types_by_source:
        return ("", "MANUAL", "no source data")

    unique = sorted({normalize_type(t) for t in types_by_source.values()})

    if len(unique) == 1:
        return (unique[0], "HIGH", "all sources agree")

    # Compatibility check: if all pairs are compatible, pick the most-specific.
    types = list(types_by_source.values())
    all_compatible = True
    for i in range(len(types)):
        for j in range(i + 1, len(types)):
            if not types_compatible(types[i], types[j]):
                all_compatible = False
                break

    if all_compatible:
        # Pick the most-specific
        sorted_types = sorted(unique, key=lambda t: -specificity(t))
        chosen = sorted_types[0]
        sources_with_chosen = [
            lib for lib, t in types_by_source.items() if normalize_type(t) == chosen
        ]
        return (
            chosen,
            "MEDIUM" if len(sources_with_chosen) < len(types_by_source) else "HIGH",
            f"compatible refinement; chose most-specific ({chosen}) from {sources_with_chosen}",
        )

    # Truly incompatible — flag for manual review
    return (
        " | ".join(unique),  # show all options as a union
        "MANUAL",
        "incompatible types across sources — human review required",
    )


def propose_default(defaults_by_source: dict[str, str]) -> tuple[str, str, str]:
    """Return (proposed_default, confidence, rationale)."""
    non_empty = {lib: d for lib, d in defaults_by_source.items() if d}

    if not non_empty:
        return ("", "HIGH", "no source declares an explicit default")

    if len(non_empty) == 1:
        lib, val = next(iter(non_empty.items()))
        return (val, "MEDIUM", f"only {lib} declares a default")

    # Multiple sources — find the most common
    from collections import Counter

    counts = Counter(non_empty.values())
    most_common, count = counts.most_common(1)[0]

    if count == len(non_empty):
        return (most_common, "HIGH", "all sources agree")

    # Tied or split — present options
    if count >= len(non_empty) / 2:
        sources_agreeing = [lib for lib, d in non_empty.items() if d == most_common]
        return (
            most_common,
            "MEDIUM",
            f"majority chose {most_common} ({sources_agreeing})",
        )

    return (
        " | ".join(sorted(set(non_empty.values()))),
        "MANUAL",
        "no majority — human review",
    )


def propose_deprecation(deprecated_by_source: dict[str, bool]) -> tuple[bool, str, str, str]:
    """Return (proposed_deprecated, confidence, rationale, migration_note)."""
    deprecated_in = [lib for lib, d in deprecated_by_source.items() if d]

    if not deprecated_in:
        return (False, "HIGH", "no source deprecates", "")

    if len(deprecated_in) == len(deprecated_by_source):
        return (
            True,
            "HIGH",
            "all sources deprecate",
            "Mark `@deprecated` in unified spec; document the replacement.",
        )

    # Mixed
    not_deprecated = [
        lib for lib, d in deprecated_by_source.items() if not d
    ]
    return (
        True,
        "MEDIUM",
        f"deprecated in {deprecated_in} but not {not_deprecated}",
        f"Lean toward deprecated (Ant/MUI deprecate signals API maturity). Note in spec: 'deprecated in {deprecated_in}; still supported in {not_deprecated} for compatibility.'",
    )


# ----- per-component reconciliation -----


def reconcile(name: str, sources: list[tuple[str, ParsedFile]]) -> list[PropProposal]:
    proposals: list[PropProposal] = []

    by_source: dict[str, dict[str, dict]] = {}
    for lib, parsed in sources:
        primary = pick_primary_interface(parsed, name)
        by_source[lib] = {} if primary is None else {p["name"]: p for p in primary["props"]}

    all_names: set[str] = set()
    for props in by_source.values():
        all_names.update(props.keys())

    libs = list(by_source.keys())

    for prop_name in sorted(all_names):
        # Skip standard HTML props (no reconciliation needed)
        if prop_name in STANDARD_HTML_PROPS:
            continue

        present_in = tuple(lib for lib in libs if prop_name in by_source[lib])

        # Library-specific prop (only one source)
        if len(present_in) == 1 and len(libs) > 1:
            lib = present_in[0]
            entry = by_source[lib][prop_name]
            proposals.append(
                PropProposal(
                    name=prop_name,
                    sources_present=present_in,
                    proposed_type=entry["type"],
                    proposed_default=entry.get("default", ""),
                    proposed_deprecated=entry.get("deprecated", False),
                    confidence="MEDIUM",
                    rationale=f"library-specific: only in {lib}",
                    migration_note=f"This prop is unique to {lib}. Adopt only if your design system needs the same capability; otherwise document as a known omission.",
                )
            )
            continue

        if len(present_in) < 1:
            continue

        # Multi-source prop — reconcile each axis
        types_by = {lib: by_source[lib][prop_name]["type"] for lib in present_in}
        defaults_by = {lib: by_source[lib][prop_name].get("default", "") for lib in present_in}
        deprecated_by = {lib: by_source[lib][prop_name].get("deprecated", False) for lib in present_in}

        type_proposal, type_conf, type_rationale = propose_type(types_by)
        default_proposal, def_conf, def_rationale = propose_default(defaults_by)
        deprecated_proposal, dep_conf, dep_rationale, migration = propose_deprecation(
            deprecated_by
        )

        # Combine confidences: take the lowest
        ranks = {"HIGH": 0, "MEDIUM": 1, "LOW": 2, "MANUAL": 3}
        worst = max((ranks[c] for c in (type_conf, def_conf, dep_conf)), default=0)
        confidence = ["HIGH", "MEDIUM", "LOW", "MANUAL"][worst]

        # Combine rationale
        rationale_parts = []
        if type_conf != "HIGH":
            rationale_parts.append(f"type: {type_rationale}")
        if def_conf != "HIGH":
            rationale_parts.append(f"default: {def_rationale}")
        if dep_conf != "HIGH":
            rationale_parts.append(f"deprecation: {dep_rationale}")
        if not rationale_parts:
            rationale_parts.append("all axes agree")

        proposals.append(
            PropProposal(
                name=prop_name,
                sources_present=present_in,
                proposed_type=type_proposal,
                proposed_default=default_proposal,
                proposed_deprecated=deprecated_proposal,
                confidence=confidence,
                rationale=" | ".join(rationale_parts),
                migration_note=migration,
            )
        )

    return proposals


# ----- runners -----


def analyze(name: str) -> tuple[list[tuple[str, ParsedFile]], list[PropProposal]]:
    found_paths: list[tuple[str, Path]] = []
    if (p := find_ant_source(name)) is not None:
        found_paths.append(("ant-design", p))
    if (p := find_mui_source(name)) is not None:
        found_paths.append(("mui", p))
    if (p := find_shadcn_source(name)) is not None:
        found_paths.append(("shadcn-ui", p))

    parsed_sources: list[tuple[str, ParsedFile]] = []
    for lib, src in found_paths:
        parsed = run_parser(src)
        if parsed is not None:
            parsed_sources.append((lib, parsed))

    proposals = reconcile(name, parsed_sources)
    return parsed_sources, proposals


def render_text(name: str, sources: list[tuple[str, ParsedFile]], proposals: list[PropProposal]) -> str:
    lines: list[str] = []
    lines.append(f"# Reconciliation proposal — {name}")
    lines.append("")

    if not sources:
        lines.append("(no upstream sources found)")
        return "\n".join(lines)

    lines.append("Sources:")
    for lib, parsed in sources:
        rel = parsed.file.relative_to(ROOT)
        lines.append(f"  - {lib}: {rel}")
    lines.append("")

    if not proposals:
        lines.append("(no props to reconcile)")
        return "\n".join(lines)

    # Group by confidence
    by_conf: dict[str, list[PropProposal]] = {}
    for p in proposals:
        by_conf.setdefault(p.confidence, []).append(p)

    for conf in ("MANUAL", "LOW", "MEDIUM", "HIGH"):
        items = by_conf.get(conf, [])
        if not items:
            continue
        label = {
            "HIGH": "✓ HIGH confidence (auto-adopt safely)",
            "MEDIUM": "~ MEDIUM confidence (review before adopt)",
            "LOW": "? LOW confidence",
            "MANUAL": "✗ MANUAL review required",
        }[conf]
        lines.append(f"## {label} ({len(items)})")
        lines.append("")
        lines.append("| Prop | Type | Default | Deprecated | Sources | Rationale |")
        lines.append("| --- | --- | --- | --- | --- | --- |")
        for p in items:
            type_str = "`" + p.proposed_type[:50].replace("|", "\\|") + "`" if p.proposed_type else "—"
            default = "`" + p.proposed_default.replace("|", "\\|") + "`" if p.proposed_default else "—"
            dep = "✗" if p.proposed_deprecated else "—"
            srcs = ", ".join(p.sources_present)
            rat = p.rationale.replace("|", "\\|")[:120]
            lines.append(f"| `{p.name}` | {type_str} | {default} | {dep} | {srcs} | {rat} |")

        # Migration notes
        with_migration = [p for p in items if p.migration_note]
        if with_migration:
            lines.append("")
            lines.append("Migration notes:")
            for p in with_migration:
                lines.append(f"- `{p.name}`: {p.migration_note}")

        lines.append("")

    return "\n".join(lines)


# ----- safe API-table auto-apply -----


def split_markdown_row(line: str) -> list[str]:
    """Split a pipe table row while respecting escaped pipes."""
    stripped = line.strip()
    if not stripped.startswith("|"):
        return []

    body = stripped[1:]
    if body.endswith("|"):
        body = body[:-1]

    cells: list[str] = []
    current: list[str] = []
    escaped = False
    for char in body:
        if char == "|" and not escaped:
            cells.append("".join(current).strip())
            current = []
            continue

        current.append(char)
        escaped = char == "\\" and not escaped
        if char != "\\":
            escaped = False

    cells.append("".join(current).strip())
    return cells


def join_markdown_row(cells: list[str]) -> str:
    return "| " + " | ".join(cells) + " |"


def normalize_cell(cell: str) -> str:
    value = cell.strip()
    if value in {"", "—", "-"}:
        return ""
    if value.startswith("`") and value.endswith("`") and len(value) >= 2:
        value = value[1:-1]
    return value.replace("\\|", "|").strip()


def normalize_prop_cell(cell: str) -> str:
    return normalize_cell(cell).strip("`")


def format_code_cell(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        return "—"
    return "`" + cleaned.replace("|", "\\|") + "`"


def find_api_table(lines: list[str]) -> tuple[int, int] | None:
    """Return (header_index, end_index_exclusive) for a supported API table."""
    for index, line in enumerate(lines):
        cells = split_markdown_row(line)
        lower = [cell.strip().lower() for cell in cells]
        if not lower:
            continue
        if lower[0] != "prop" or "type" not in lower or "default" not in lower:
            continue
        if index + 1 >= len(lines):
            continue
        separator = split_markdown_row(lines[index + 1])
        if len(separator) < len(cells) or not all(set(cell) <= {"-", ":", " "} for cell in separator):
            continue

        end = index + 2
        while end < len(lines):
            row = split_markdown_row(lines[end])
            if not row or len(row) < len(cells):
                break
            end += 1
        return index, end
    return None


def apply_high_confidence_to_text(
    text: str,
    proposals: list[PropProposal],
) -> tuple[str, tuple[ApplyChange, ...], tuple[str, ...], bool]:
    high = {proposal.name: proposal for proposal in proposals if proposal.confidence == "HIGH"}
    if not high:
        return text, (), (), False

    lines = text.splitlines()
    trailing_newline = text.endswith("\n")
    table = find_api_table(lines)
    if table is None:
        return text, (), tuple(sorted(high)), True

    header_index, end_index = table
    headers = [cell.strip().lower() for cell in split_markdown_row(lines[header_index])]
    field_indexes = {name: headers.index(name) for name in headers}
    prop_index = field_indexes["prop"]
    type_index = field_indexes["type"]
    default_index = field_indexes["default"]
    description_index = field_indexes.get("description")
    source_index = field_indexes.get("source(s)")

    changes: list[ApplyChange] = []
    applied_props: set[str] = set()

    for row_index in range(header_index + 2, end_index):
        cells = split_markdown_row(lines[row_index])
        prop_name = normalize_prop_cell(cells[prop_index])
        proposal = high.get(prop_name)
        if proposal is None:
            continue

        applied_props.add(prop_name)

        next_type = format_code_cell(proposal.proposed_type)
        if normalize_cell(cells[type_index]) != normalize_cell(next_type):
            changes.append(ApplyChange(prop_name, "type", cells[type_index], next_type))
            cells[type_index] = next_type

        if proposal.proposed_default:
            next_default = format_code_cell(proposal.proposed_default)
            if normalize_cell(cells[default_index]) != normalize_cell(next_default):
                changes.append(ApplyChange(prop_name, "default", cells[default_index], next_default))
                cells[default_index] = next_default

        if source_index is not None:
            next_sources = ", ".join(proposal.sources_present)
            if cells[source_index].strip() != next_sources:
                changes.append(ApplyChange(prop_name, "source(s)", cells[source_index], next_sources))
                cells[source_index] = next_sources

        if proposal.proposed_deprecated and description_index is not None:
            description = cells[description_index]
            if "[deprecated]" not in description.lower():
                next_description = f"**[deprecated]** {description}"
                changes.append(ApplyChange(prop_name, "description", description, next_description))
                cells[description_index] = next_description

        lines[row_index] = join_markdown_row(cells)

    skipped = tuple(sorted(set(high) - applied_props))
    updated = "\n".join(lines)
    if trailing_newline:
        updated += "\n"
    return updated, tuple(changes), skipped, False


def apply_high_confidence_to_spec(name: str, proposals: list[PropProposal], *, write: bool) -> ApplyResult:
    path = ROOT / "examples" / f"component-{name}.md"
    if not path.exists():
        high_names = tuple(sorted(p.name for p in proposals if p.confidence == "HIGH"))
        return ApplyResult(path=path, skipped=high_names, missing_table=True)

    original = path.read_text(encoding="utf-8")
    updated, changes, skipped, missing_table = apply_high_confidence_to_text(original, proposals)
    if write and changes and updated != original:
        path.write_text(updated, encoding="utf-8")

    return ApplyResult(path=path, changed=changes, skipped=skipped, missing_table=missing_table)


def render_apply_result(result: ApplyResult, *, dry_run: bool) -> str:
    rel = result.path.relative_to(ROOT)
    action = "Would update" if dry_run else "Updated"
    if result.missing_table:
        return f"{rel}: skipped (supported API table not found)"
    if not result.changed:
        skipped = f", skipped {len(result.skipped)} missing HIGH prop(s)" if result.skipped else ""
        return f"{rel}: no existing API rows changed{skipped}"

    lines = [f"{rel}: {action} {len(result.changed)} field(s)"]
    for change in result.changed:
        lines.append(f"  - `{change.prop}` {change.field}: {change.before} -> {change.after}")
    if result.skipped:
        lines.append(f"  - skipped missing HIGH prop rows: {', '.join(result.skipped)}")
    return "\n".join(lines)


def find_multi_source_components(canonical_index: dict) -> list[str]:
    out: list[str] = []
    for name in canonical_index:
        sources = 0
        if find_ant_source(name) is not None:
            sources += 1
        if find_mui_source(name) is not None:
            sources += 1
        if find_shadcn_source(name) is not None:
            sources += 1
        if sources >= 2:
            out.append(name)
    return sorted(out)


def assert_self_test(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"self-test failed: {message}")


def run_self_test() -> None:
    proposals = [
        PropProposal(
            name="action",
            sources_present=("ant-design", "mui"),
            proposed_type="React.ReactNode",
            proposed_default="",
            proposed_deprecated=False,
            confidence="HIGH",
            rationale="all axes agree",
        ),
        PropProposal(
            name="tone",
            sources_present=("ant-design", "mui"),
            proposed_type="'success' | 'warning'",
            proposed_default="'success'",
            proposed_deprecated=True,
            confidence="HIGH",
            rationale="all axes agree",
        ),
        PropProposal(
            name="mediumOnly",
            sources_present=("mui",),
            proposed_type="boolean",
            proposed_default="false",
            proposed_deprecated=False,
            confidence="MEDIUM",
            rationale="library-specific",
        ),
        PropProposal(
            name="missing",
            sources_present=("mui", "shadcn-ui"),
            proposed_type="boolean",
            proposed_default="false",
            proposed_deprecated=False,
            confidence="HIGH",
            rationale="all axes agree",
        ),
        PropProposal(
            name="preserveDefault",
            sources_present=("ant-design", "mui"),
            proposed_type="boolean",
            proposed_default="",
            proposed_deprecated=False,
            confidence="HIGH",
            rationale="all axes agree",
        ),
    ]

    polished = """# Fixture

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `action` | `ReactNode` | — | Action slot. |
| `tone` | `'success' \\| 'warning'` | — | Visual tone. |
| `mediumOnly` | `boolean` | `false` | Should not change. |
| `preserveDefault` | `boolean` | `false` | Curated default should stay. |
"""
    updated, changes, skipped, missing_table = apply_high_confidence_to_text(polished, proposals)
    assert_self_test(not missing_table, "polished fixture table should be found")
    assert_self_test("`React.ReactNode`" in updated, "HIGH type should update")
    assert_self_test("`'success'`" in updated, "HIGH default should update")
    assert_self_test("**[deprecated]** Visual tone." in updated, "deprecated HIGH should mark description")
    assert_self_test("mediumOnly` | `boolean` | `false` | Should not change." in updated, "MEDIUM should not change")
    assert_self_test(
        "preserveDefault` | `boolean` | `false` | Curated default should stay." in updated,
        "empty proposed default should not erase existing curated defaults",
    )
    assert_self_test("missing" in skipped, "missing HIGH rows should be skipped")
    assert_self_test(len(changes) == 3, "fixture should record three changed fields")

    scaffold = """# Fixture

## API

### Props

| Prop | Type | Default | Required | Source(s) | Description |
| --- | --- | --- | --- | --- | --- |
| `action` | `ReactNode` | — | — | ant-design | Action slot. |
"""
    updated_scaffold, changes_scaffold, _, missing_table_scaffold = apply_high_confidence_to_text(
        scaffold,
        proposals,
    )
    assert_self_test(not missing_table_scaffold, "scaffold fixture table should be found")
    assert_self_test(
        "| `action` | `React.ReactNode` | — | — | ant-design, mui | Action slot. |" in updated_scaffold,
        "scaffold source column should update",
    )
    assert_self_test(
        any(change.field == "source(s)" for change in changes_scaffold),
        "scaffold fixture should record source-column change",
    )

    no_table = "# Fixture\n\nNo API table here.\n"
    _, _, skipped_no_table, missing = apply_high_confidence_to_text(no_table, proposals)
    assert_self_test(missing, "missing table should be reported")
    assert_self_test(
        set(skipped_no_table) == {"action", "missing", "preserveDefault", "tone"},
        "missing table should skip only HIGH proposals",
    )

    print("Reconciliation auto-apply self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", help="Single canonical component to reconcile")
    parser.add_argument(
        "--multi-source",
        action="store_true",
        help="Reconcile every canonical with ≥2 sources in refs/",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON")
    parser.add_argument(
        "--apply-high",
        action="store_true",
        help="Update existing API table rows with HIGH-confidence proposals only",
    )
    parser.add_argument("--dry-run", action="store_true", help="Preview --apply-high changes without writing")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Allow writing --apply-high changes across --multi-source",
    )
    parser.add_argument("--self-test", action="store_true", help="Run local auto-apply fixtures")
    args = parser.parse_args()

    if args.self_test:
        run_self_test()
        return

    if args.dry_run and not args.apply_high:
        print("error: --dry-run is only supported with --apply-high", file=sys.stderr)
        sys.exit(2)

    if args.apply_high and args.multi_source and not args.dry_run and not args.force:
        print(
            "error: --multi-source --apply-high writes many specs; run --dry-run first or add --force",
            file=sys.stderr,
        )
        sys.exit(2)

    if not check_node_available():
        print("error: 'node' not found in PATH.", file=sys.stderr)
        sys.exit(2)

    if not check_parser_ready():
        print(
            "error: parser not installed. Run: cd tools/extractors/ts-ast && npm install",
            file=sys.stderr,
        )
        sys.exit(2)

    if not INDEX_JSON.exists():
        print(f"error: {INDEX_JSON.relative_to(ROOT)} not found.", file=sys.stderr)
        sys.exit(2)

    canonical_index = json.loads(INDEX_JSON.read_text(encoding="utf-8"))

    if args.name:
        targets = [args.name]
    elif args.multi_source:
        targets = find_multi_source_components(canonical_index)
        print(f"# Reconciling {len(targets)} multi-source canonical(s)\n", file=sys.stderr)
    else:
        parser.print_help()
        sys.exit(0)

    all_results: list[dict] = []

    for name in targets:
        sources, proposals = analyze(name)
        if not sources:
            continue

        all_results.append(
            {
                "name": name,
                "sources": [lib for lib, _ in sources],
                "proposals": [
                    {
                        "name": p.name,
                        "sources_present": list(p.sources_present),
                        "proposed_type": p.proposed_type,
                        "proposed_default": p.proposed_default,
                        "proposed_deprecated": p.proposed_deprecated,
                        "confidence": p.confidence,
                        "rationale": p.rationale,
                        "migration_note": p.migration_note,
                    }
                    for p in proposals
                ],
            }
        )

        apply_result: ApplyResult | None = None
        if args.apply_high:
            apply_result = apply_high_confidence_to_spec(
                name,
                proposals,
                write=not args.dry_run,
            )
            all_results[-1]["apply"] = {
                "path": str(apply_result.path.relative_to(ROOT)),
                "changed": [
                    {
                        "prop": change.prop,
                        "field": change.field,
                        "before": change.before,
                        "after": change.after,
                    }
                    for change in apply_result.changed
                ],
                "skipped": list(apply_result.skipped),
                "missing_table": apply_result.missing_table,
                "dry_run": args.dry_run,
            }

        if not args.json:
            print(render_text(name, sources, proposals))
            if apply_result is not None:
                print("## Apply HIGH-confidence rows")
                print("")
                print(render_apply_result(apply_result, dry_run=args.dry_run))
                print()
            print()

    if args.json:
        json.dump(all_results, sys.stdout, indent=2, ensure_ascii=False)
        print()
    else:
        # Summary
        total = sum(len(r["proposals"]) for r in all_results)
        print("=== Summary ===")
        print(f"Components reconciled: {len(all_results)}")
        print(f"Total proposals: {total}")
        for conf in ("HIGH", "MEDIUM", "LOW", "MANUAL"):
            count = sum(
                1 for r in all_results for p in r["proposals"] if p["confidence"] == conf
            )
            print(f"  {conf}: {count}")


if __name__ == "__main__":
    main()
