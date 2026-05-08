#!/usr/bin/env python3
"""
Scaffold a starter component spec from upstream source files in refs/.

For a given canonical component name, look up its sources in
knowledge/components/index.json, read the source files (Ant TSX +
MUI TSX + shadcn TSX), extract the API surface (props from TS interfaces +
JSDoc), and emit a draft examples/component-{name}.md following the
established skill template.

The output is a DRAFT — a maintainer reviews narrative sections (when
to use, anatomy, edge cases), fills in tokens, and ships.

Usage:
  # Single component
  python3 tools/extractors/component_spec_scaffold.py --name combobox

  # All canonical components without specs
  python3 tools/extractors/component_spec_scaffold.py --all-missing --dry-run

  # Force overwrite (default skips if file exists)
  python3 tools/extractors/component_spec_scaffold.py --name combobox --force

Requires refs/ to be populated. If refs/ is missing, prints a helpful
message and exits cleanly (so this script is safe to ship even without
upstream sources locally).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[2]
INDEX_JSON = ROOT / "knowledge/components/index.json"
ANT_REPO = ROOT / "refs/ant-design"
MUI_REPO = ROOT / "refs/mui"
SHADCN_REPO = ROOT / "refs/shadcn-ui"
EXAMPLES_DIR = ROOT / "examples"

# ----- source-reading helpers -----


def read_file(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return ""


def find_ant_source(component: str) -> Path | None:
    candidates = [
        ANT_REPO / "components" / component / "index.tsx",
        ANT_REPO / "components" / component / "index.ts",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def find_mui_source(name: str) -> Path | None:
    """MUI uses PascalCase for source dirs."""
    pascal = "".join(part.capitalize() for part in name.split("-"))
    candidates = [
        MUI_REPO / f"packages/mui-material/src/{pascal}/{pascal}.tsx",
        MUI_REPO / f"packages/mui-material/src/{pascal}/{pascal}.ts",
        MUI_REPO / f"packages/mui-material/src/{pascal}/index.tsx",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def find_shadcn_source(name: str) -> Path | None:
    p = SHADCN_REPO / f"apps/v4/registry/new-york-v4/ui/{name}.tsx"
    return p if p.exists() else None


# ----- API extraction -----

PROPS_INTERFACE_RE = re.compile(
    r"(?:export\s+)?(?:interface|type)\s+(\w*Props)\s*[={]\s*([^}]*)(?:\}|$)",
    re.DOTALL | re.MULTILINE,
)

JSDOC_RE = re.compile(
    r"/\*\*\s*\n?\s*\*?\s*([\s\S]*?)\s*\*/",
    re.MULTILINE,
)


def extract_props(source: str) -> list[dict]:
    """Best-effort prop extraction from a component source.

    Returns list of {name, type, default, description}. Best effort —
    real parsing would need a TypeScript AST; this is good enough for
    scaffolding.
    """
    props: list[dict] = []

    match = PROPS_INTERFACE_RE.search(source)
    if not match:
        return props

    body = match.group(2)
    # Naive split per prop (skip nested types)
    lines = body.split("\n")
    pending_doc: list[str] = []
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if line.startswith("*") or line.startswith("/**") or line.startswith("//"):
            cleaned = line.lstrip("/*").strip()
            if cleaned:
                pending_doc.append(cleaned)
            continue
        # Match `name?: type = default;` or similar
        m = re.match(r"(\w+)\s*\??\s*:\s*([^;,/]+?)(?:\s*[;,]|$)", line)
        if m:
            props.append(
                {
                    "name": m.group(1),
                    "type": m.group(2).strip(),
                    "default": "",
                    "description": " ".join(pending_doc).strip()[:120],
                }
            )
            pending_doc = []
        else:
            pending_doc = []

    return props[:30]  # cap to avoid runaway interfaces


# ----- spec generation -----


SPEC_TEMPLATE = """# `{title}` — spec (DRAFT — scaffolded {today})

> **Draft scaffold** generated from upstream sources. A maintainer should
> review the narrative sections (when to use, anatomy, edge cases),
> verify the API table, fill in tokens consumed, and remove this banner
> before shipping.
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

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
{props_table}

## Variants

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


def render_sources_block(sources: list[tuple[str, Path]]) -> str:
    if not sources:
        return "> _(no upstream sources found in refs/ — manually scaffolded)_"
    return "\n".join(f"> - **{lib}**: `{p.relative_to(ROOT)}`" for lib, p in sources)


def render_references_block(sources: list[tuple[str, Path]]) -> str:
    lines = []
    for lib, p in sources:
        lines.append(f"- {lib.title()}: [`{p.name}`](../{p.relative_to(ROOT)})")
    if not lines:
        lines.append("- (No upstream sources found.)")
    return "\n".join(lines)


def render_props_table(props: list[dict]) -> str:
    if not props:
        return "| (Fill in props from source.) | | | |"
    rows = []
    for p in props:
        name = p["name"]
        ptype = p["type"][:40]
        default = p["default"] or "—"
        desc = p["description"] or "(fill in)"
        rows.append(f"| `{name}` | `{ptype}` | `{default}` | {desc} |")
    return "\n".join(rows)


def to_pascal(name: str) -> str:
    return "".join(part.capitalize() for part in name.split("-"))


def scaffold_one(name: str, force: bool = False, dry_run: bool = False) -> bool:
    """Scaffold spec for a single canonical name. Returns True if written."""
    output_path = EXAMPLES_DIR / f"component-{name}.md"
    if output_path.exists() and not force:
        print(f"  - skip {name} (exists; use --force to overwrite)")
        return False

    # Find sources
    sources: list[tuple[str, Path]] = []
    if (p := find_ant_source(name)) is not None:
        sources.append(("ant-design", p))
    if (p := find_mui_source(name)) is not None:
        sources.append(("mui", p))
    if (p := find_shadcn_source(name)) is not None:
        sources.append(("shadcn-ui", p))

    # Extract props from the first available source
    props: list[dict] = []
    for _, src_path in sources:
        text = read_file(src_path)
        if text:
            props = extract_props(text)
            if props:
                break

    title = to_pascal(name)
    example_props = " variant=\"default\"" if props else ""

    content = SPEC_TEMPLATE.format(
        title=title,
        today=date.today().isoformat(),
        sources_block=render_sources_block(sources),
        props_table=render_props_table(props),
        references_block=render_references_block(sources),
        example_props=example_props,
    )

    if dry_run:
        print(f"  - would write {output_path.relative_to(ROOT)} ({len(sources)} source(s), {len(props)} prop(s))")
        return False

    output_path.write_text(content, encoding="utf-8")
    print(f"  ✓ wrote {output_path.relative_to(ROOT)} ({len(sources)} source(s), {len(props)} prop(s))")
    return True


def find_missing(canonical_index: dict) -> list[str]:
    """Return canonical names without an examples/component-{name}.md."""
    existing = {p.stem.replace("component-", "") for p in EXAMPLES_DIR.glob("component-*.md")}
    return sorted(name for name in canonical_index if name not in existing)


# ----- main -----


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", help="Canonical component name to scaffold (e.g., 'combobox')")
    parser.add_argument(
        "--all-missing",
        action="store_true",
        help="Scaffold every canonical component without an existing spec",
    )
    parser.add_argument("--force", action="store_true", help="Overwrite existing spec files")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Cap number of files to scaffold (with --all-missing)",
    )
    args = parser.parse_args()

    if not (args.name or args.all_missing):
        parser.error("Specify --name or --all-missing")

    if not INDEX_JSON.exists():
        print(f"::error::{INDEX_JSON.relative_to(ROOT)} not found.")
        print("Run `python3 tools/extractors/component_index.py` first to build the index.")
        sys.exit(1)

    canonical = json.loads(INDEX_JSON.read_text(encoding="utf-8"))

    # Refs/ check (graceful degradation)
    if not any(repo.exists() for repo in (ANT_REPO, MUI_REPO, SHADCN_REPO)):
        print("⚠  refs/ is missing or empty.")
        print("   The scaffolder will still produce a template, but without")
        print("   API extraction. To get full output:")
        print()
        print("     ./tools/extractors/clone-refs.sh   # if you have it, or:")
        print("     git clone --depth=1 https://github.com/ant-design/ant-design.git refs/ant-design")
        print("     # ... and similar for mui, shadcn-ui")
        print()

    targets: list[str]
    if args.name:
        if args.name not in canonical:
            print(f"::error::'{args.name}' is not a canonical component name.")
            print(f"  Closest matches: {[n for n in canonical if args.name in n][:5]}")
            sys.exit(1)
        targets = [args.name]
    else:
        targets = find_missing(canonical)
        if args.limit:
            targets = targets[: args.limit]
        print(f"Scaffolding {len(targets)} missing components...")

    written = 0
    for name in targets:
        if scaffold_one(name, force=args.force, dry_run=args.dry_run):
            written += 1

    print(f"\n{written} file(s) written.")
    if not args.dry_run and written > 0:
        print()
        print("⚠  These are DRAFTS. Each scaffolded file has a banner")
        print("   indicating it needs maintainer review before shipping.")
        print("   Run `python3 tools/audit/check-coverage.py` to see updated")
        print("   coverage stats.")


if __name__ == "__main__":
    main()
