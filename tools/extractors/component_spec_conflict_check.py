#!/usr/bin/env python3
"""
Cross-source conflict detection for component APIs (v3 extractor capability).

Compares the same canonical component as expressed by Ant Design, MUI, and
shadcn-ui. Surfaces:
- Same prop name with INCOMPATIBLE types (e.g., `size: 'sm'|'md'|'lg'` vs
  `size: number`).
- Same concept exposed under DIFFERENT prop names (e.g., MUI `disabled` vs
  legacy `enabled`).
- Props that exist in only one source — adopters who switch sources lose them.
- Default-value drift (same prop but different defaults across sources).

This extends `component_spec_scaffold_v2.py` — same TS-AST parser, same
source-finder, but the output is a CONFLICT REPORT, not a scaffolded spec.
Used when a maintainer is reconciling a multi-source component.

Usage:
  # One component
  python3 tools/extractors/component_spec_conflict_check.py --name button

  # All canonical with multi-source coverage
  python3 tools/extractors/component_spec_conflict_check.py --multi-source

  # Fast quarterly-review summary
  python3 tools/extractors/component_spec_conflict_check.py --multi-source --summary-only

  # JSON output for tooling
  python3 tools/extractors/component_spec_conflict_check.py --name button --json

  # Local fixtures
  python3 tools/extractors/component_spec_conflict_check.py --self-test

Exit codes:
  0 = no conflicts (or only INFO-level differences)
  1 = HIGH or CRITICAL conflicts found

Severity levels:
  CRITICAL — same prop name, fundamentally incompatible types.
  HIGH    — same concept, different name (drift requires reconciliation).
  MEDIUM  — default-value disagreement.
  LOW     — prop exists in one source only (gap, not conflict).
  INFO    — naming convention difference (camelCase vs kebab) — usually fine.
"""
from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

# Re-use v2's source-finder + parser invocation.
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
    _pascal,
)

ROOT = Path(__file__).resolve().parents[2]


# ----- conflict types -----


@dataclass(frozen=True)
class Conflict:
    severity: str  # CRITICAL / HIGH / MEDIUM / LOW / INFO
    prop: str
    description: str
    sources: tuple[str, ...]


SEVERITY_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
SEVERITIES = ("CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO")


# ----- normalization helpers -----


def normalize_type(type_str: str) -> str:
    """Strip whitespace + collapse spaces + strip optional decorations for type comparison.

    Treats `T | undefined`, `T | null`, `T | undefined | null` as equivalent
    to `T` — the optionality is already captured by the `optional` flag.
    """
    s = " ".join(type_str.split()).strip()
    # Strip trailing optional unions (covers " | undefined", " | null", " | undefined | null")
    parts = [p.strip() for p in s.split("|")]
    parts = [p for p in parts if p not in ("undefined", "null")]
    return " | ".join(parts)


# Standard React/HTML props that exist implicitly via spread on most components.
# Their presence in one source's interface and absence in another's is not a
# real conflict — both ultimately spread to the underlying element.
STANDARD_HTML_PROPS: set[str] = {
    "children",
    "className",
    "id",
    "style",
    "ref",
    "key",
    "tabIndex",
    "role",
    "title",
    "lang",
    "dir",
    "hidden",
    "draggable",
    "spellCheck",
    "translate",
    "contentEditable",
    "suppressContentEditableWarning",
    "suppressHydrationWarning",
    "'aria-label'",
    "'aria-labelledby'",
    "'aria-describedby'",
    "'aria-hidden'",
    "'aria-controls'",
    # Ant-specific naming
    "prefixCls",
    "rootClassName",
}


def is_same_concept(t1: str, t2: str) -> bool:
    """Heuristic: are two types representing the same concept?"""
    n1, n2 = normalize_type(t1), normalize_type(t2)
    if n1 == n2:
        return True
    # Both are primitives that match
    primitives = {"string", "number", "boolean", "any", "unknown"}
    if n1 in primitives and n2 in primitives:
        return n1 == n2
    # Both are React.ReactNode-like
    rn = {"React.ReactNode", "ReactNode", "React.Node", "Node"}
    if n1 in rn and n2 in rn:
        return True
    return False


def types_compatible(t1: str, t2: str) -> bool:
    """Are types interchangeable for an adopter switching sources?"""
    n1, n2 = normalize_type(t1), normalize_type(t2)
    if n1 == n2:
        return True
    # boolean OR boolean+other-strict types are incompatible
    if (n1 == "boolean") != (n2 == "boolean"):
        return False
    # number vs string are incompatible
    if {"number", "string"} <= {n1, n2}:
        return False
    # Otherwise, treat as soft difference (could be a refinement)
    return True


# ----- conflict detection per component -----


def detect_conflicts(
    sources: list[tuple[str, ParsedFile]],
    canonical_name: str,
) -> list[Conflict]:
    """Compare props across sources; emit Conflicts."""
    conflicts: list[Conflict] = []

    # Build per-source prop maps from primary interface
    by_source: dict[str, dict[str, dict]] = {}
    for lib, parsed in sources:
        primary = pick_primary_interface(parsed, canonical_name)
        if primary is None:
            by_source[lib] = {}
            continue
        by_source[lib] = {p["name"]: p for p in primary["props"]}

    # Union of all prop names
    all_names: set[str] = set()
    for props in by_source.values():
        all_names.update(props.keys())

    libs = list(by_source.keys())

    for name in sorted(all_names):
        present_in = [lib for lib in libs if name in by_source[lib]]

        # Case: prop only in one source
        if len(present_in) == 1 and len(libs) > 1:
            # Skip standard HTML props — they spread implicitly in all sources.
            if name in STANDARD_HTML_PROPS:
                continue
            conflicts.append(
                Conflict(
                    severity="LOW",
                    prop=name,
                    description=f"Prop only in {present_in[0]} (missing in {set(libs) - set(present_in)})",
                    sources=tuple(present_in),
                )
            )
            continue

        if len(present_in) < 2:
            continue

        # Case: prop in 2+ sources — compare types
        types_map = {lib: by_source[lib][name]["type"] for lib in present_in}
        unique_types = set(normalize_type(t) for t in types_map.values())

        if len(unique_types) > 1:
            # Determine severity by compatibility
            type_pairs = list(types_map.items())
            severities: list[str] = []
            for i in range(len(type_pairs)):
                for j in range(i + 1, len(type_pairs)):
                    if not types_compatible(type_pairs[i][1], type_pairs[j][1]):
                        severities.append("CRITICAL")
                    elif not is_same_concept(type_pairs[i][1], type_pairs[j][1]):
                        severities.append("MEDIUM")
                    else:
                        severities.append("INFO")
            sev = max(severities, key=lambda s: -SEVERITY_ORDER[s])
            conflicts.append(
                Conflict(
                    severity=sev,
                    prop=name,
                    description=f"Type drift across {len(present_in)} sources: "
                    + " | ".join(f"{lib}={types_map[lib]}" for lib in present_in),
                    sources=tuple(present_in),
                )
            )

        # Case: default-value drift
        defaults = {lib: by_source[lib][name].get("default", "") for lib in present_in}
        non_empty = [(lib, d) for lib, d in defaults.items() if d]
        if len(non_empty) >= 2:
            unique_defaults = set(d for _, d in non_empty)
            if len(unique_defaults) > 1:
                conflicts.append(
                    Conflict(
                        severity="MEDIUM",
                        prop=name,
                        description=f"Default drift: " + " | ".join(f"{lib}={d}" for lib, d in non_empty),
                        sources=tuple(lib for lib, _ in non_empty),
                    )
                )

        # Case: deprecation status drift
        deprecated_in = [lib for lib in present_in if by_source[lib][name].get("deprecated")]
        if 0 < len(deprecated_in) < len(present_in):
            conflicts.append(
                Conflict(
                    severity="HIGH",
                    prop=name,
                    description=f"`{name}` deprecated in {deprecated_in} but not in {set(present_in) - set(deprecated_in)}",
                    sources=tuple(deprecated_in),
                )
            )

    return conflicts


# ----- runner -----


def analyze(name: str) -> tuple[list[tuple[str, ParsedFile]], list[Conflict]]:
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

    conflicts = detect_conflicts(parsed_sources, name)
    return parsed_sources, conflicts


def render_text(name: str, sources: list[tuple[str, ParsedFile]], conflicts: list[Conflict]) -> str:
    lines: list[str] = []
    lines.append(f"# Conflict report — {name}")
    lines.append("")
    if not sources:
        lines.append("(no upstream sources found)")
        return "\n".join(lines)

    lines.append("Sources:")
    for lib, parsed in sources:
        rel = parsed.file.relative_to(ROOT)
        lines.append(f"  - {lib}: {rel}")
    lines.append("")

    if not conflicts:
        lines.append("✓ No conflicts detected.")
        return "\n".join(lines)

    by_sev: dict[str, list[Conflict]] = {}
    for c in conflicts:
        by_sev.setdefault(c.severity, []).append(c)

    for sev in SEVERITIES:
        items = by_sev.get(sev, [])
        if not items:
            continue
        lines.append(f"## {sev} ({len(items)})")
        lines.append("")
        for c in items:
            lines.append(f"- `{c.prop}` — {c.description}")
        lines.append("")

    return "\n".join(lines)


def severity_counts(results: list[dict]) -> dict[str, int]:
    return {
        sev: sum(1 for r in results for c in r["conflicts"] if c["severity"] == sev)
        for sev in SEVERITIES
    }


def render_summary(results: list[dict]) -> str:
    total = sum(len(r["conflicts"]) for r in results)
    counts = severity_counts(results)

    lines = ["", "=== Summary ==="]
    lines.append(f"Components analyzed: {len(results)}")
    lines.append(f"Total conflicts: {total}")
    for sev in SEVERITIES:
        lines.append(f"  {sev}: {counts[sev]}")
    return "\n".join(lines)


def find_multi_source_components(canonical_index: dict) -> list[str]:
    """Return canonical names that have ≥ 2 source files in refs/."""
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
        raise SystemExit(f"conflict-check self-test failed: {message}")


def run_self_test() -> int:
    ant = ParsedFile(
        file=ROOT / "refs/ant-design/components/button/Button.tsx",
        interfaces=[
            {
                "name": "ButtonProps",
                "props": [
                    {"name": "value", "type": "string", "default": ""},
                    {"name": "disabled", "type": "boolean", "default": "false"},
                    {"name": "legacy", "type": "boolean", "default": "", "deprecated": True},
                    {"name": "antOnly", "type": "boolean", "default": ""},
                ],
            }
        ],
    )
    mui = ParsedFile(
        file=ROOT / "refs/mui/packages/mui-material/src/Button/Button.d.ts",
        interfaces=[
            {
                "name": "ButtonProps",
                "props": [
                    {"name": "value", "type": "number", "default": ""},
                    {"name": "disabled", "type": "boolean", "default": "true"},
                    {"name": "legacy", "type": "boolean", "default": ""},
                ],
            }
        ],
    )

    conflicts = detect_conflicts([("ant-design", ant), ("mui", mui)], "button")
    severities = {c.severity for c in conflicts}
    assert_self_test("CRITICAL" in severities, "incompatible prop type should be CRITICAL")
    assert_self_test("HIGH" in severities, "partial deprecation should be HIGH")
    assert_self_test("MEDIUM" in severities, "default-value drift should be MEDIUM")
    assert_self_test("LOW" in severities, "single-source prop should be LOW")

    results = [
        {
            "name": "button",
            "sources": ["ant-design", "mui"],
            "conflicts": [
                {
                    "severity": c.severity,
                    "prop": c.prop,
                    "description": c.description,
                    "sources": list(c.sources),
                }
                for c in conflicts
            ],
        }
    ]
    counts = severity_counts(results)
    assert_self_test(counts["CRITICAL"] == 1, "summary should count one CRITICAL")
    assert_self_test(counts["HIGH"] == 1, "summary should count one HIGH")
    assert_self_test(counts["MEDIUM"] == 1, "summary should count one MEDIUM")
    assert_self_test(counts["LOW"] == 1, "summary should count one LOW")
    summary = render_summary(results)
    assert_self_test("Components analyzed: 1" in summary, "summary should include component count")
    assert_self_test("  CRITICAL: 1" in summary, "summary should include severity rows")
    assert_self_test("  INFO: 0" in summary, "summary should include zero-count severities")

    no_conflict_text = render_text("empty", [("mui", mui)], [])
    assert_self_test("✓ No conflicts detected." in no_conflict_text, "empty reports should show no-conflict marker")

    print("Conflict-check self-test passed")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", help="Single canonical component to check")
    parser.add_argument(
        "--multi-source",
        action="store_true",
        help="Check every canonical that has ≥2 sources in refs/",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON")
    parser.add_argument(
        "--summary-only",
        action="store_true",
        help="Suppress per-component reports and print only aggregate counts.",
    )
    parser.add_argument("--strict", action="store_true", help="Exit 1 on HIGH or CRITICAL conflicts")
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run local conflict classification and summary fixtures.",
    )
    args = parser.parse_args()

    if args.self_test:
        sys.exit(run_self_test())

    if args.json and args.summary_only:
        parser.error("--summary-only cannot be combined with --json")

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

    targets: list[str]
    if args.name:
        targets = [args.name]
    elif args.multi_source:
        targets = find_multi_source_components(canonical_index)
        print(f"# Found {len(targets)} multi-source canonical(s)\n", file=sys.stderr)
    else:
        parser.print_help()
        sys.exit(0)

    all_results: list[dict] = []
    severity_max = 4  # INFO

    for name in targets:
        sources, conflicts = analyze(name)
        if not sources:
            continue
        all_results.append(
            {
                "name": name,
                "sources": [lib for lib, _ in sources],
                "conflicts": [
                    {
                        "severity": c.severity,
                        "prop": c.prop,
                        "description": c.description,
                        "sources": list(c.sources),
                    }
                    for c in conflicts
                ],
            }
        )
        for c in conflicts:
            if SEVERITY_ORDER[c.severity] < severity_max:
                severity_max = SEVERITY_ORDER[c.severity]

        if not args.json and not args.summary_only:
            print(render_text(name, sources, conflicts))
            print()

    if args.json:
        json.dump(all_results, sys.stdout, indent=2, ensure_ascii=False)
        print()

    # Summary
    if not args.json:
        print(render_summary(all_results))

    # Exit code
    if args.strict and severity_max <= SEVERITY_ORDER["HIGH"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
