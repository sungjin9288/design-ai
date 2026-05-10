#!/usr/bin/env python3
"""
Scaffold a starter component spec from upstream source files in refs/ — v2.

Improvements over v1 (component_spec_scaffold.py):
- Uses TypeScript Compiler API (via tools/extractors/ts-ast/parse-component.mjs)
  instead of regex. Correctly handles:
  - Generic type parameters (Props<T>)
  - Extended interfaces (extends BaseProps)
  - Intersection types (Props & ARIA)
  - Union literal types ('sm' | 'md' | 'lg')
  - Destructured defaults from function parameters
  - JSDoc tags (@deprecated, @default, @since)
- Merges props across all available sources (Ant + MUI + shadcn) deduplicated
  by name, with provenance per prop.
- Identifies event handlers (props starting with "on") for separate listing.
- Surfaces deprecated props for human review.

The output is still a DRAFT — narrative sections (when to use, anatomy,
edge cases) are placeholders. A maintainer reviews, fills in tokens,
and ships.

Usage:
  # Single component
  python3 tools/extractors/component_spec_scaffold_v2.py --name combobox

  # Compare with v1 output (writes to /tmp for diff)
  python3 tools/extractors/component_spec_scaffold_v2.py --name combobox --dry-run

  # All canonical components without specs
  python3 tools/extractors/component_spec_scaffold_v2.py --all-missing

  # Force overwrite (default skips if file exists)
  python3 tools/extractors/component_spec_scaffold_v2.py --name combobox --force

Requires:
  - refs/ populated with ant-design / mui / shadcn-ui clones.
  - tools/extractors/ts-ast/node_modules/ (run `npm install` there once).

If either is missing, prints a helpful message and exits cleanly.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[2]
TS_AST_DIR = ROOT / "tools/extractors/ts-ast"
PARSER_SCRIPT = TS_AST_DIR / "parse-component.mjs"
INDEX_JSON = ROOT / "knowledge/components/index.json"
ANT_REPO = ROOT / "refs/ant-design"
MUI_REPO = ROOT / "refs/mui"
SHADCN_REPO = ROOT / "refs/shadcn-ui"
EXAMPLES_DIR = ROOT / "examples"

# ----- source location -----


def find_ant_source(component: str) -> Path | None:
    candidates = [
        ANT_REPO / "components" / component / f"{_capital_first(component)}.tsx",
        ANT_REPO / "components" / component / "index.tsx",
        ANT_REPO / "components" / component / "index.ts",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def find_mui_source(name: str) -> Path | None:
    pascal = _pascal(name)
    candidates = [
        MUI_REPO / f"packages/mui-material/src/{pascal}/{pascal}.tsx",
        MUI_REPO / f"packages/mui-material/src/{pascal}/{pascal}.ts",
        MUI_REPO / f"packages/mui-material/src/{pascal}/index.tsx",
        # Fall back to .d.ts — MUI ships compiled JS + types per component.
        MUI_REPO / f"packages/mui-material/src/{pascal}/{pascal}.d.ts",
        MUI_REPO / f"packages/mui-material/src/{pascal}/index.d.ts",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def find_shadcn_source(name: str) -> Path | None:
    candidates = [
        ROOT / f"refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/{name}.tsx",
        ROOT / f"refs/shadcn-ui/apps/v4/registry/default-v4/ui/{name}.tsx",
        ROOT / f"refs/shadcn-ui/apps/www/registry/default/ui/{name}.tsx",
        ROOT / f"refs/shadcn-ui/apps/www/registry/new-york/ui/{name}.tsx",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def _pascal(name: str) -> str:
    return "".join(part.capitalize() for part in name.split("-"))


def _capital_first(name: str) -> str:
    """ant uses lowercase dirs but PascalCase filenames sometimes."""
    parts = name.split("-")
    return "".join(p.capitalize() for p in parts)


# ----- AST invocation -----


@dataclass
class ParsedFile:
    file: Path
    interfaces: list[dict] = field(default_factory=list)
    components: list[dict] = field(default_factory=list)


def check_node_available() -> bool:
    return shutil.which("node") is not None


def check_parser_ready() -> bool:
    if not PARSER_SCRIPT.exists():
        return False
    node_modules = TS_AST_DIR / "node_modules" / "typescript"
    return node_modules.exists()


def run_parser(file_path: Path) -> ParsedFile | None:
    """Invoke the TS AST parser; return None on failure."""
    try:
        completed = subprocess.run(
            ["node", str(PARSER_SCRIPT), str(file_path)],
            capture_output=True,
            text=True,
            timeout=30,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        print(f"  parser error on {file_path.name}: {e}", file=sys.stderr)
        return None

    if completed.returncode != 0:
        print(f"  parser exit {completed.returncode} on {file_path.name}: {completed.stderr.strip()}", file=sys.stderr)
        return None

    try:
        data = json.loads(completed.stdout)
    except json.JSONDecodeError as e:
        print(f"  parser produced invalid JSON for {file_path.name}: {e}", file=sys.stderr)
        return None

    return ParsedFile(
        file=Path(data["file"]),
        interfaces=data.get("interfaces", []),
        components=data.get("components", []),
    )


# ----- prop merging -----


def pick_primary_interface(parsed: ParsedFile, name: str) -> dict | None:
    """Pick the interface most likely to be the public Props.

    Heuristics, in order:
      1. <PascalName>Props
      2. Base<PascalName>Props
      3. <PascalName>Properties
      4. Any interface ending in 'Props' that has > 0 own props.
      5. The interface with the most own props.
    """
    pascal = _pascal(name)
    by_name = {i["name"]: i for i in parsed.interfaces}

    for candidate in (f"{pascal}Props", f"Base{pascal}Props", f"{pascal}Properties"):
        if candidate in by_name and by_name[candidate]["props"]:
            return by_name[candidate]

    # Any *Props interface with props
    props_interfaces = [
        i for i in parsed.interfaces if i["name"].endswith("Props") and i["props"]
    ]
    if props_interfaces:
        return max(props_interfaces, key=lambda i: len(i["props"]))

    if parsed.interfaces:
        return max(parsed.interfaces, key=lambda i: len(i["props"]))

    return None


def merge_props_across_sources(
    sources: list[tuple[str, ParsedFile]],
    canonical_name: str,
) -> tuple[list[dict], dict[str, str]]:
    """Merge props from multiple parsed sources.

    Returns (merged_props, destructured_defaults).
    Each prop carries `provenance` listing which libraries declared it.
    """
    by_name: dict[str, dict] = {}
    destructured: dict[str, str] = {}

    for lib, parsed in sources:
        primary = pick_primary_interface(parsed, canonical_name)
        if primary:
            for prop in primary["props"]:
                key = prop["name"]
                if key in by_name:
                    by_name[key]["provenance"].append(lib)
                    # Prefer non-empty description / default
                    if not by_name[key].get("description") and prop.get("description"):
                        by_name[key]["description"] = prop["description"]
                    if not by_name[key].get("default") and prop.get("default"):
                        by_name[key]["default"] = prop["default"]
                else:
                    by_name[key] = {**prop, "provenance": [lib]}

        # Collect destructured defaults from any component
        for comp in parsed.components:
            for k, v in (comp.get("destructuredDefaults") or {}).items():
                if k not in destructured:
                    destructured[k] = v

    # Apply destructured defaults to props that don't have them
    for prop_name, prop in by_name.items():
        if not prop.get("default") and prop_name in destructured:
            prop["default"] = destructured[prop_name]

    # Sort: required first, then alphabetically
    merged = sorted(
        by_name.values(),
        key=lambda p: (p.get("optional", True), p["name"]),
    )
    return merged, destructured


# ----- spec rendering -----


SPEC_TEMPLATE = """# `{title}` — spec (DRAFT — scaffolded {today} via TS-AST)

> **Draft scaffold** generated from upstream sources via TypeScript AST.
> A maintainer should review the narrative sections (when to use, anatomy,
> edge cases), verify the API table (especially defaults and event
> handlers), fill in tokens consumed, and remove this banner before
> shipping.
>
> Sources analyzed:
{sources_block}

## When to use

(Fill in: what user need does this serve? What's the canonical use case?
When to use vs sibling components?)

## Anatomy

(Fill in: ASCII diagram of the component's parts.)

```
[diagram here]
```

## API

```tsx
<{title}{example_props}>
  {{children}}
</{title}>
```

### Props

| Prop | Type | Default | Required | Source(s) | Description |
| --- | --- | --- | --- | --- | --- |
{props_table}

{events_section}{deprecated_section}## Variants

(Fill in: visual variants — size / color / shape / etc.)

## States

| State | Visual |
| --- | --- |
| Default | (fill in) |
| Hover | (fill in) |
| Focus-visible | 2px focus ring; cite [keyboard-and-focus.md](../knowledge/a11y/keyboard-and-focus.md) |
| Active | (fill in) |
| Disabled | reduced opacity; `aria-disabled="true"` |

## Tokens consumed

(Fill in. List every token this component reads. Flag missing tokens.)

```
--color-bg-default
--color-fg-default
--space-md
--radius-md
```

## Accessibility

- Semantic element: (fill in)
- ARIA: (fill in)
- Keyboard: (fill in — cite [keyboard-and-focus.md](../knowledge/a11y/keyboard-and-focus.md))
- Touch target: ≥ 44pt for primary mobile / ≥ 24px for desktop AA

## Edge cases

(Fill in 3+ edge cases.)

## Code example

```tsx
// Fill in a concrete usage example
```

## Don't

- (Fill in 2-3 specific misuses.)

## References

{references_block}

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- (Add 2-3 related component specs)
"""


def render_sources_block(sources: list[tuple[str, ParsedFile]]) -> str:
    if not sources:
        return "> _(no upstream sources found in refs/ — manually scaffolded)_"
    lines = []
    for lib, parsed in sources:
        rel = parsed.file.relative_to(ROOT)
        n_interfaces = len(parsed.interfaces)
        n_components = len(parsed.components)
        lines.append(
            f"> - **{lib}**: `{rel}` ({n_interfaces} interface(s), {n_components} component(s))"
        )
    return "\n".join(lines)


def render_props_table(props: list[dict]) -> str:
    if not props:
        return "| (Fill in props from source.) | | | | | |"
    rows = []
    for p in props:
        if p.get("isEvent"):
            continue  # events go in their own section
        name = f"`{p['name']}`"
        ptype = "`" + p["type"][:50].replace("|", "\\|") + "`"
        default = p["default"] or "—"
        if default != "—":
            default = "`" + default.replace("|", "\\|") + "`"
        required = "—" if p.get("optional", True) else "✓"
        provenance = ", ".join(p.get("provenance", []))
        desc = p.get("description") or "(fill in)"
        if p.get("deprecated"):
            desc = "**[deprecated]** " + desc
        rows.append(f"| {name} | {ptype} | {default} | {required} | {provenance} | {desc} |")
    if not rows:
        return "| (no non-event props) | | | | | |"
    return "\n".join(rows)


def render_events_section(props: list[dict]) -> str:
    events = [p for p in props if p.get("isEvent")]
    if not events:
        return ""
    lines = ["### Events", "", "| Event | Type | Source(s) | Description |", "| --- | --- | --- | --- |"]
    for e in events:
        name = f"`{e['name']}`"
        etype = "`" + e["type"][:60].replace("|", "\\|") + "`"
        provenance = ", ".join(e.get("provenance", []))
        desc = e.get("description") or "(fill in)"
        if e.get("deprecated"):
            desc = "**[deprecated]** " + desc
        lines.append(f"| {name} | {etype} | {provenance} | {desc} |")
    lines.append("")
    return "\n".join(lines) + "\n"


def render_deprecated_section(props: list[dict]) -> str:
    deprecated = [p for p in props if p.get("deprecated")]
    if not deprecated:
        return ""
    lines = ["### Deprecated props", ""]
    for p in deprecated:
        names = ", ".join(p.get("provenance", []))
        lines.append(
            f"- `{p['name']}` ({names}) — review: rename, drop, or keep with a different surface?"
        )
    lines.append("")
    return "\n".join(lines) + "\n"


def render_references_block(sources: list[tuple[str, ParsedFile]]) -> str:
    if not sources:
        return "- (No upstream sources found.)"
    lines = []
    for lib, parsed in sources:
        rel = parsed.file.relative_to(ROOT)
        lines.append(f"- {lib.title()}: [`{parsed.file.name}`](../{rel})")
    return "\n".join(lines)


# ----- scaffold-one -----


def scaffold_one(name: str, force: bool = False, dry_run: bool = False) -> bool:
    output_path = EXAMPLES_DIR / f"component-{name}.md"
    if output_path.exists() and not force:
        print(f"  - skip {name} (exists; use --force to overwrite)")
        return False

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

    merged_props, destructured = merge_props_across_sources(parsed_sources, name)

    title = _pascal(name)

    # Pick example props from common defaults (variant / size if present)
    example_pieces = []
    for prop_name in ("variant", "size", "color"):
        if prop_name in destructured:
            example_pieces.append(f' {prop_name}={destructured[prop_name]}')
    example_props = "".join(example_pieces[:2])

    content = SPEC_TEMPLATE.format(
        title=title,
        today=date.today().isoformat(),
        sources_block=render_sources_block(parsed_sources),
        props_table=render_props_table(merged_props),
        events_section=render_events_section(merged_props),
        deprecated_section=render_deprecated_section(merged_props),
        references_block=render_references_block(parsed_sources),
        example_props=example_props,
    )

    if dry_run:
        print(
            f"  - would write {output_path.relative_to(ROOT)} "
            f"({len(parsed_sources)} source(s), {len(merged_props)} merged prop(s))"
        )
        return False

    output_path.write_text(content, encoding="utf-8")
    print(
        f"  ✓ wrote {output_path.relative_to(ROOT)} "
        f"({len(parsed_sources)} source(s), {len(merged_props)} prop(s))"
    )
    return True


# ----- find-missing -----


def find_missing(canonical_index: dict) -> list[str]:
    existing = {p.stem.replace("component-", "") for p in EXAMPLES_DIR.glob("component-*.md")}
    return sorted(name for name in canonical_index if name not in existing)


# ----- main -----


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", help="Canonical component name to scaffold")
    parser.add_argument("--all-missing", action="store_true", help="Scaffold every missing canonical")
    parser.add_argument("--force", action="store_true", help="Overwrite existing spec files")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--limit", type=int, help="Cap on --all-missing (for review)")
    args = parser.parse_args()

    if not check_node_available():
        print("error: 'node' not found in PATH. Install Node 18+ to use the TS AST parser.", file=sys.stderr)
        sys.exit(2)

    if not check_parser_ready():
        print(
            f"error: parser not installed. Run:\n"
            f"  cd {TS_AST_DIR.relative_to(ROOT)} && npm install",
            file=sys.stderr,
        )
        sys.exit(2)

    if not INDEX_JSON.exists():
        print(f"error: {INDEX_JSON.relative_to(ROOT)} not found.", file=sys.stderr)
        sys.exit(2)

    canonical_index = json.loads(INDEX_JSON.read_text(encoding="utf-8"))

    if args.name:
        scaffold_one(args.name, force=args.force, dry_run=args.dry_run)
        return

    if args.all_missing:
        missing = find_missing(canonical_index)
        if args.limit:
            missing = missing[: args.limit]
        print(f"Scaffolding {len(missing)} missing component(s):")
        for name in missing:
            scaffold_one(name, force=args.force, dry_run=args.dry_run)
        return

    parser.print_help()


if __name__ == "__main__":
    main()
