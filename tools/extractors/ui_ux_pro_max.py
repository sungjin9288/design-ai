#!/usr/bin/env python3
"""
Extract curated design knowledge from ui-ux-pro-max-skill CSVs.

Sources:
  refs/ui-ux-pro-max/src/ui-ux-pro-max/data/colors.csv
  refs/ui-ux-pro-max/src/ui-ux-pro-max/data/typography.csv
  refs/ui-ux-pro-max/src/ui-ux-pro-max/data/styles.csv
  refs/ui-ux-pro-max/src/ui-ux-pro-max/data/ux-guidelines.csv

Outputs:
  knowledge/colors/palettes-by-product-type.md
  knowledge/typography/font-pairings.md
  knowledge/patterns/styles-catalog.md
  knowledge/patterns/ux-guidelines.md
"""
from __future__ import annotations

import csv
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "refs/ui-ux-pro-max/src/ui-ux-pro-max/data"

UPSTREAM = "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill"

LOCAL_COLOR_ROWS = [
    {
        "Product Type": "Korean B2B SaaS — Sensitive Data (HR / Payroll / Legal)",
        "Primary": "#0D9488",
        "Accent": "#0369A1",
        "Background": "#F0FDFA",
        "Notes": (
            "Trust-driven muted teal + professional blue accent. Cooler than fintech, less "
            "corporate than navy. Pair with neutral cool-greys. Pretendard mandatory. "
            "Surfaced in v4.7 dogfood (Korean HR onboarding)."
        ),
    }
]


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


def with_local_color_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    """Preserve design-ai dogfood palette rows across upstream CSV refreshes."""
    merged = [dict(row) for row in rows]
    product_types = {row.get("Product Type", "") for row in merged}
    next_no = len(merged) + 1
    for overlay in LOCAL_COLOR_ROWS:
        if overlay["Product Type"] in product_types:
            continue
        row = dict(overlay)
        row["No"] = str(next_no)
        merged.append(row)
        next_no += 1
    return merged


def render_colors(rows: list[dict[str, str]]) -> str:
    today = date.today().isoformat()
    head = f"""---
title: Curated palettes by product type
source: refs/ui-ux-pro-max/src/ui-ux-pro-max/data/colors.csv
upstream: {UPSTREAM}
extracted_at: {today}
applies_to: [tailwindcss, shadcn-ui, design-system]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Curated palettes by product type

A palette catalog organized by product type. Each row is a battle-tested combination tuned for **WCAG 3:1+ accent contrast**. Use as a starting point — adjust the primary hue to match brand and the supporting tokens follow.

The token names map directly to **shadcn-ui / Tailwind CSS v4** conventions.

| # | Product type | Primary | Accent | Background | Notes |
| --- | --- | --- | --- | --- | --- |
"""
    body_rows = []
    for r in rows:
        notes = r.get('Notes', '').replace('|', r'\|')
        body_rows.append(
            f"| {r.get('No', '')} | {r.get('Product Type', '')} | "
            f"`{r.get('Primary', '')}` | `{r.get('Accent', '')}` | "
            f"`{r.get('Background', '')}` | {notes} |"
        )

    full_specs = ["\n## Full token specs\n"]
    for r in rows[:30]:  # First 30 in detail
        full_specs.append(f"### {r.get('No', '')}. {r.get('Product Type', '')}\n")
        full_specs.append("```css")
        for key in ["Primary", "On Primary", "Secondary", "On Secondary", "Accent", "On Accent",
                    "Background", "Foreground", "Card", "Card Foreground", "Muted",
                    "Muted Foreground", "Border", "Destructive", "On Destructive", "Ring"]:
            value = r.get(key, '').strip()
            if value:
                token = "--" + key.lower().replace(" ", "-")
                full_specs.append(f"{token}: {value};")
        full_specs.append("```\n")
        notes = r.get("Notes", "").strip()
        if notes:
            full_specs.append(f"_{notes}_\n")

    if len(rows) > 30:
        full_specs.append(f"\n_({len(rows) - 30} more palettes available — see source CSV.)_\n")

    return head + "\n".join(body_rows) + "\n" + "\n".join(full_specs)


def render_fonts(rows: list[dict[str, str]]) -> str:
    today = date.today().isoformat()
    head = f"""---
title: Curated font pairings
source: refs/ui-ux-pro-max/src/ui-ux-pro-max/data/typography.csv
upstream: {UPSTREAM}
extracted_at: {today}
applies_to: [google-fonts, web-typography]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Curated font pairings

Tested heading + body combinations grouped by mood. Pick by **best-for** and **mood keywords**, not by aesthetic guess.

| # | Pairing | Type | Heading | Body | Mood | Best for |
| --- | --- | --- | --- | --- | --- | --- |
"""
    body_rows = []
    for r in rows:
        body_rows.append(
            f"| {r.get('No', '')} | **{r.get('Font Pairing Name', '')}** | "
            f"{r.get('Category', '')} | {r.get('Heading Font', '')} | "
            f"{r.get('Body Font', '')} | {r.get('Mood/Style Keywords', '')[:60]} | "
            f"{r.get('Best For', '')[:80]} |"
        )

    details = ["\n## Implementation\n"]
    for r in rows[:20]:
        name = r.get("Font Pairing Name", "")
        details.append(f"### {name}\n")
        details.append(f"- **Heading**: {r.get('Heading Font', '')}")
        details.append(f"- **Body**: {r.get('Body Font', '')}")
        details.append(f"- **Mood**: {r.get('Mood/Style Keywords', '')}")
        details.append(f"- **Best for**: {r.get('Best For', '')}")
        notes = r.get("Notes", "").strip()
        if notes:
            details.append(f"- _Notes_: {notes}")
        css = r.get("CSS Import", "")
        if css:
            details.append(f"\n```css\n{css}\n```\n")

    return head + "\n".join(body_rows) + "\n" + "\n".join(details)


def render_styles(rows: list[dict[str, str]]) -> str:
    today = date.today().isoformat()
    head = f"""---
title: Visual style catalog
source: refs/ui-ux-pro-max/src/ui-ux-pro-max/data/styles.csv
upstream: {UPSTREAM}
extracted_at: {today}
applies_to: [visual-design, art-direction]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Visual style catalog

A catalog of distinct visual languages. Use as **art-direction shorthand** — pick a style by best-for/avoid-for, then implement using its keywords, colors, and CSS hints.

"""
    blocks = []
    for r in rows:
        name = r.get("Style Category", "")
        if not name:
            continue
        blocks.append(f"## {r.get('No', '')}. {name}\n")
        for label, key in [
            ("Keywords", "Keywords"),
            ("Primary colors", "Primary Colors"),
            ("Secondary colors", "Secondary Colors"),
            ("Effects", "Effects & Animation"),
            ("Best for", "Best For"),
            ("Avoid for", "Do Not Use For"),
            ("Light mode", "Light Mode ✓"),
            ("Dark mode", "Dark Mode ✓"),
            ("Performance", "Performance"),
            ("Accessibility", "Accessibility"),
            ("Era", "Era/Origin"),
            ("Complexity", "Complexity"),
        ]:
            value = r.get(key, "").strip()
            if value:
                blocks.append(f"- **{label}**: {value}")

        prompt = r.get("AI Prompt Keywords", "")
        if prompt:
            blocks.append(f"\n**AI prompt**: {prompt}\n")

        css = r.get("CSS/Technical Keywords", "")
        if css:
            blocks.append(f"```css\n/* {name} hints */\n{css}\n```\n")

        checklist = r.get("Implementation Checklist", "")
        if checklist:
            blocks.append("**Checklist**:")
            for item in checklist.split(","):
                item = item.strip().lstrip("☐").strip()
                if item:
                    blocks.append(f"- [ ] {item}")
            blocks.append("")

    return head + "\n".join(blocks)


def render_ux(rows: list[dict[str, str]]) -> str:
    today = date.today().isoformat()
    head = f"""---
title: UX guidelines
source: refs/ui-ux-pro-max/src/ui-ux-pro-max/data/ux-guidelines.csv
upstream: {UPSTREAM}
extracted_at: {today}
applies_to: [web, mobile, accessibility]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# UX guidelines

A catalog of common UX issues with do/don't pairs. Use as a **review checklist** before sign-off and as a learning index for new designers.

"""
    by_category: dict[str, list[dict[str, str]]] = {}
    for r in rows:
        cat = r.get("Category", "Misc")
        by_category.setdefault(cat, []).append(r)

    blocks = []
    for cat in sorted(by_category):
        blocks.append(f"## {cat}\n")
        for r in by_category[cat]:
            issue = r.get("Issue", "")
            severity = r.get("Severity", "")
            platform = r.get("Platform", "")
            desc = r.get("Description", "")
            do = r.get("Do", "")
            dont = r.get("Don't", "")
            good = r.get("Code Example Good", "")
            bad = r.get("Code Example Bad", "")

            sev_marker = {"High": "🔴", "Medium": "🟡", "Low": "🟢"}.get(severity, "•")
            blocks.append(f"### {sev_marker} {issue} _(_{platform}_)_\n")
            if desc:
                blocks.append(f"{desc}\n")
            if do:
                blocks.append(f"**Do**: {do}")
            if dont:
                blocks.append(f"**Don't**: {dont}\n")
            if good or bad:
                blocks.append("```")
                if good:
                    blocks.append(f"// good\n{good}")
                if bad:
                    blocks.append(f"// bad\n{bad}")
                blocks.append("```\n")
        blocks.append("")
    return head + "\n".join(blocks)


def main() -> None:
    if not DATA.exists():
        raise SystemExit(f"Data not found: {DATA}")

    colors = read_csv("colors.csv")
    if colors:
        write_md("knowledge/colors/palettes-by-product-type.md", render_colors(with_local_color_rows(colors)))

    fonts = read_csv("typography.csv")
    if fonts:
        write_md("knowledge/typography/font-pairings.md", render_fonts(fonts))

    styles = read_csv("styles.csv")
    if styles:
        write_md("knowledge/patterns/styles-catalog.md", render_styles(styles))

    ux = read_csv("ux-guidelines.csv")
    if ux:
        write_md("knowledge/patterns/ux-guidelines.md", render_ux(ux))


if __name__ == "__main__":
    main()
