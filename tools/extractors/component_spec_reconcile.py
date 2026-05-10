#!/usr/bin/env python3
"""
Reconciliation mode for v3 extractor — auto-suggest unified API for cross-source conflicts.

Where `component_spec_conflict_check.py` SURFACES drift, this module
PROPOSES resolution. For each prop with disagreement across Ant / MUI /
shadcn, output a recommended unified type, default, deprecation status,
and (where applicable) a migration note.

This is a maintainer aid — the output is NEVER auto-applied to specs.
A human reviews + decides.

Usage:
  # Single component
  python3 tools/extractors/component_spec_reconcile.py --name button

  # All multi-source canonicals — bulk review session
  python3 tools/extractors/component_spec_reconcile.py --multi-source

  # JSON for tooling
  python3 tools/extractors/component_spec_reconcile.py --name button --json

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


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", help="Single canonical component to reconcile")
    parser.add_argument(
        "--multi-source",
        action="store_true",
        help="Reconcile every canonical with ≥2 sources in refs/",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON")
    args = parser.parse_args()

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

        if not args.json:
            print(render_text(name, sources, proposals))
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
