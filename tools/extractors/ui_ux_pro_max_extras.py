#!/usr/bin/env python3
"""
Extract additional curated knowledge from ui-ux-pro-max-skill CSVs.

Sources:
  refs/ui-ux-pro-max/src/ui-ux-pro-max/data/charts.csv
  refs/ui-ux-pro-max/src/ui-ux-pro-max/data/icons.csv
  refs/ui-ux-pro-max/src/ui-ux-pro-max/data/ui-reasoning.csv
  refs/ui-ux-pro-max/src/ui-ux-pro-max/data/landing.csv

Outputs:
  knowledge/patterns/chart-types.md
  knowledge/icons/curated-sets.md
  knowledge/patterns/ui-reasoning.md
  knowledge/patterns/landing-page-patterns.md
"""
from __future__ import annotations

import csv
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "refs/ui-ux-pro-max/src/ui-ux-pro-max/data"
UPSTREAM = "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill"


def read_csv(name: str) -> list[dict[str, str]]:
    path = DATA / name
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_md(rel_path: str, body: str) -> None:
    out = ROOT / rel_path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(body, encoding="utf-8")
    print(f"  wrote {out.relative_to(ROOT)}")


def render_charts(rows: list[dict[str, str]]) -> str:
    today = date.today().isoformat()
    head = f"""---
title: Chart type selection guide
source: refs/ui-ux-pro-max/src/ui-ux-pro-max/data/charts.csv
upstream: {UPSTREAM}
extracted_at: {today}
applies_to: [data-visualization, dashboard, web]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Chart type selection guide

For each data type, the right chart, the wrong chart, and the accessibility floor. Use as a lookup before opening any charting library.

| # | Data type | Best chart | Secondary | When to use | When NOT to use |
| --- | --- | --- | --- | --- | --- |
"""
    body_rows = []
    for r in rows:
        body_rows.append(
            f"| {r.get('No', '')} | **{r.get('Data Type', '')}** | "
            f"{r.get('Best Chart Type', '')} | {r.get('Secondary Options', '')} | "
            f"{r.get('When to Use', '')[:80]} | {r.get('When NOT to Use', '')[:80]} |"
        )

    details = ["\n## Detailed specs\n"]
    for r in rows:
        name = r.get("Data Type", "")
        details.append(f"### {r.get('No', '')}. {name} → {r.get('Best Chart Type', '')}\n")
        for label, key in [
            ("When to use", "When to Use"),
            ("When NOT to use", "When NOT to Use"),
            ("Volume threshold", "Data Volume Threshold"),
            ("Color guidance", "Color Guidance"),
            ("A11y grade", "Accessibility Grade"),
            ("A11y notes", "Accessibility Notes"),
            ("A11y fallback", "A11y Fallback"),
            ("Library", "Library Recommendation"),
            ("Interactive level", "Interactive Level"),
        ]:
            value = r.get(key, "").strip()
            if value:
                details.append(f"- **{label}**: {value}")
        details.append("")

    return head + "\n".join(body_rows) + "\n" + "\n".join(details)


def render_icons(rows: list[dict[str, str]]) -> str:
    today = date.today().isoformat()

    by_lib: dict[str, list[dict[str, str]]] = {}
    by_cat: dict[str, list[dict[str, str]]] = {}
    for r in rows:
        lib = r.get("Library", "Unknown")
        cat = r.get("Category", "Misc")
        by_lib.setdefault(lib, []).append(r)
        by_cat.setdefault(cat, []).append(r)

    parts = [f"""---
title: Curated icon sets
source: refs/ui-ux-pro-max/src/ui-ux-pro-max/data/icons.csv
upstream: {UPSTREAM}
extracted_at: {today}
applies_to: [icons, react, all-ui]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Curated icon sets

Common UI icons indexed by **library** and **category**. Pick a single library per project — mixing icon sets in one UI looks unprofessional (different stroke weights, different cap rules).

## Libraries indexed

| Library | Icons cataloged | Strengths |
| --- | --- | --- |
"""]

    library_notes = {
        "Phosphor": "Most variants (Thin/Light/Regular/Bold/Fill/Duotone), 1200+ icons. Clean for product UIs.",
        "Lucide": "Fork of Feather, actively maintained. 1000+ outline-only. Very consistent stroke. Default for shadcn-ui.",
        "Heroicons": "From the Tailwind team. Outline + solid variants. Smaller set, but deeply curated.",
        "Tabler": "1900+ icons, single 2px stroke style. Strong for dashboards.",
        "Material": "Google's set. Multi-variant (Outlined/Rounded/Sharp/Two-Tone/Filled). Requires their font or symbol set.",
        "Feather": "Original; maintenance has slowed. Use Lucide instead.",
        "Remix": "Chinese-origin, 2400+. Wide coverage including locale-specific (Chinese characters as icons).",
        "Bootstrap": "Bundled with Bootstrap. 1900+. Solid/regular only.",
        "FontAwesome": "Largest commercial set. Free tier limited. Avoid for new projects with budget for alternatives.",
    }

    for lib in sorted(by_lib):
        count = len(by_lib[lib])
        note = library_notes.get(lib, "—")
        parts.append(f"| **{lib}** | {count} | {note} |\n")

    parts.append("\n## Common icons by category\n")
    for cat in sorted(by_cat):
        parts.append(f"\n### {cat}\n")
        parts.append("| Icon | Keywords | Library | Best for |\n")
        parts.append("| --- | --- | --- | --- |\n")
        for r in by_cat[cat]:
            parts.append(
                f"| `{r.get('Icon Name', '')}` | "
                f"{r.get('Keywords', '')[:60]} | {r.get('Library', '')} | "
                f"{r.get('Best For', '')[:60]} |\n"
            )

    parts.append("""
## Picking an icon library

| Situation | Pick |
| --- | --- |
| New React project, Tailwind, default-shadcn | **Lucide** |
| Need many weight variants (thin/regular/bold) | **Phosphor** |
| Heavy dashboard / data tools | **Tabler** |
| Material Design alignment | **Material Symbols** (variable font) |
| Tailwind-team alignment | **Heroicons** |
| Multi-language support including CJK glyphs | **Remix** |

## Rules

1. **One library per UI.** Mixing produces inconsistent stroke widths and cap rules.
2. **Stay in one weight.** If you use Phosphor's `regular`, don't sprinkle `bold` for emphasis — pick weight by component (e.g., menu = regular, primary action = bold) and apply consistently.
3. **24px is the default size.** 16px for inline-with-text, 32–48px for hero/empty states.
4. **Icons that convey meaning need an accessible name.** `<Icon aria-label="Close">` or paired text. Decorative icons get `aria-hidden="true"`.
5. **Match icon size to text leading.** If body line-height is 24px, body-line icons should be 16–20px (sit on the cap-height).

## Cross-reference

- [knowledge/components/INDEX.md](../components/INDEX.md) — components that consume icons
- [knowledge/a11y/keyboard-and-focus.md](../a11y/keyboard-and-focus.md) — icon accessibility
""")

    return "".join(parts)


def render_ui_reasoning(rows: list[dict[str, str]]) -> str:
    today = date.today().isoformat()
    parts = [f"""---
title: UI category decision rules
source: refs/ui-ux-pro-max/src/ui-ux-pro-max/data/ui-reasoning.csv
upstream: {UPSTREAM}
extracted_at: {today}
applies_to: [art-direction, ui-design]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# UI category decision rules

For each product category, an opinionated recommendation: layout pattern, visual style, color mood, typography mood, motion, and the anti-patterns to avoid. Use as a starting point — adjust to brand.

"""]

    for r in rows:
        cat = r.get("UI_Category", "")
        if not cat:
            continue
        sev = r.get("Severity", "")
        sev_marker = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🟢"}.get(sev, "•")

        parts.append(f"## {sev_marker} {r.get('No', '')}. {cat}\n")
        for label, key in [
            ("Recommended pattern", "Recommended_Pattern"),
            ("Style priority", "Style_Priority"),
            ("Color mood", "Color_Mood"),
            ("Typography mood", "Typography_Mood"),
            ("Key effects", "Key_Effects"),
            ("Anti-patterns", "Anti_Patterns"),
        ]:
            value = r.get(key, "").strip()
            if value:
                parts.append(f"- **{label}**: {value}")

        rules = r.get("Decision_Rules", "")
        if rules:
            try:
                parsed = json.loads(rules.replace("'", '"'))
                parts.append("- **Decision rules**:")
                for rule_key, rule_value in parsed.items():
                    parts.append(f"  - `{rule_key}` → `{rule_value}`")
            except (json.JSONDecodeError, ValueError):
                parts.append(f"- **Decision rules**: `{rules}`")
        parts.append("")

    return "\n".join(parts)


def render_landing(rows: list[dict[str, str]]) -> str:
    today = date.today().isoformat()
    parts = [f"""---
title: Landing page patterns
source: refs/ui-ux-pro-max/src/ui-ux-pro-max/data/landing.csv
upstream: {UPSTREAM}
extracted_at: {today}
applies_to: [marketing, landing-page, conversion]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Landing page patterns

Battle-tested section orders for landing pages, with conversion-optimization notes. Use as scaffolding for new landing pages.

"""]

    for r in rows:
        name = r.get("Pattern Name", "")
        if not name:
            continue
        parts.append(f"## {r.get('No', '')}. {name}\n")

        keywords = r.get("Keywords", "")
        if keywords:
            parts.append(f"**Keywords**: {keywords}\n")

        section_order = r.get("Section Order", "")
        if section_order:
            parts.append("**Section order**:")
            for item in section_order.split(","):
                item = item.strip()
                if item:
                    parts.append(f"- {item}")
            parts.append("")

        for label, key in [
            ("Primary CTA placement", "Primary CTA Placement"),
            ("Color strategy", "Color Strategy"),
            ("Recommended effects", "Recommended Effects"),
            ("Conversion notes", "Conversion Optimization"),
        ]:
            value = r.get(key, "").strip()
            if value:
                parts.append(f"**{label}**: {value}\n")
        parts.append("")

    return "\n".join(parts)


def main() -> None:
    if not DATA.exists():
        raise SystemExit(f"Data not found: {DATA}")

    charts = read_csv("charts.csv")
    if charts:
        write_md("knowledge/patterns/chart-types.md", render_charts(charts))

    icons = read_csv("icons.csv")
    if icons:
        write_md("knowledge/icons/curated-sets.md", render_icons(icons))

    reasoning = read_csv("ui-reasoning.csv")
    if reasoning:
        write_md("knowledge/patterns/ui-reasoning.md", render_ui_reasoning(reasoning))

    landing = read_csv("landing.csv")
    if landing:
        write_md("knowledge/patterns/landing-page-patterns.md", render_landing(landing))


if __name__ == "__main__":
    main()
