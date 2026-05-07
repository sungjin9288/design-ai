#!/usr/bin/env python3
"""
Extract MUI default typography variants and palette structure into knowledge.

Sources:
  refs/mui/packages/mui-material/src/styles/createTypography.js
  refs/mui/packages/mui-material/src/styles/createPalette.js

Outputs:
  knowledge/typography/mui-type-scale.md
  knowledge/colors/mui-palette-structure.md
"""
from __future__ import annotations

import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TYPOGRAPHY_SRC = ROOT / "refs/mui/packages/mui-material/src/styles/createTypography.js"
PALETTE_SRC = ROOT / "refs/mui/packages/mui-material/src/styles/createPalette.js"
TYPOGRAPHY_OUT = ROOT / "knowledge/typography/mui-type-scale.md"
PALETTE_OUT = ROOT / "knowledge/colors/mui-palette-structure.md"

VARIANT_RE = re.compile(
    r"^\s*(\w+):\s*buildVariant\(([^)]+)\)",
)


def parse_variants(text: str) -> list[dict[str, str]]:
    """
    Match lines like:
      h1: buildVariant(fontWeightLight, 96, 1.167, -1.5),
    """
    variants: list[dict[str, str]] = []
    for line in text.splitlines():
        match = VARIANT_RE.match(line)
        if not match:
            continue
        name, args = match.groups()
        parts = [p.strip() for p in args.split(",")]
        if len(parts) < 4:
            continue
        weight, size, line_height, letter_spacing = parts[:4]
        casing = "ALL CAPS" if (len(parts) > 4 and "caseAllCaps" in parts[4]) else "—"
        variants.append({
            "name": name,
            "weight": weight,
            "size": f"{size}px",
            "line_height": line_height,
            "letter_spacing": letter_spacing,
            "casing": casing,
        })
    return variants


def render_typography(variants: list[dict[str, str]]) -> str:
    today = date.today().isoformat()
    rows = ["| Variant | Weight | Size | Line height | Letter spacing | Casing |",
            "| --- | --- | --- | --- | --- | --- |"]
    for v in variants:
        rows.append(
            f"| `{v['name']}` | {v['weight']} | {v['size']} | {v['line_height']} | "
            f"{v['letter_spacing']} | {v['casing']} |"
        )
    table = "\n".join(rows)

    return f"""---
title: MUI default type scale
source: refs/mui/packages/mui-material/src/styles/createTypography.js
upstream: https://github.com/mui/material-ui/blob/master/packages/mui-material/src/styles/createTypography.js
extracted_at: {today}
applies_to: [react, mui, material-design]
---

# MUI default type scale

Material Design's official type system as implemented by MUI. The base font size is **14px** with **16px html root**, producing a `coef = 14/16 = 0.875`. Letter spacing values are in `em`, derived as `letterSpacing / size`.

Default font: `"Roboto", "Helvetica", "Arial", sans-serif`.

## Variants

{table}

## Weights

| Weight | Numeric |
| --- | --- |
| `fontWeightLight` | 300 |
| `fontWeightRegular` | 400 |
| `fontWeightMedium` | 500 |
| `fontWeightBold` | 700 |

## Designer notes

- `h1`–`h6` use **light** for h1/h2 (display), **regular** for h3/h4/h5, **medium** for h6. This means hero headlines look airy; section headers feel solid.
- `subtitle1` is 16/1.75 — generous leading meant to sit above body content as a label.
- `button` is 14/1.75 with `0.4em` letter spacing **and uppercase**. Modern Material 3 dropped the uppercase; if you mirror MUI defaults, the all-caps button is intentional.
- `caption` and `overline` are both 12px. `overline` adds 1em letter spacing + uppercase for legal-text style.
- Line-heights are unitless on purpose ([Eric Meyer](https://meyerweb.com/eric/thoughts/2006/02/08/unitless-line-heights/)) — they inherit cleanly under font-size changes.

## When NOT to use this scale verbatim

- For **dense product UIs** (admin dashboards, IDEs): drop h1 to ~32px, h2 to 24px. The 96/60/48 ladder eats vertical space.
- For **Korean/CJK UIs**: increase line-heights by ~10% (e.g., body1 to 1.6) to clear hangul descenders cleanly.
- For **branded/serif fonts**: `letterSpacing` was tuned for Roboto. Reset to `0` and re-tune by eye.
"""


def render_palette() -> str:
    today = date.today().isoformat()
    body = """---
title: MUI palette structure
source: refs/mui/packages/mui-material/src/styles/createPalette.js
upstream: https://github.com/mui/material-ui/blob/master/packages/mui-material/src/styles/createPalette.js
extracted_at: __TODAY__
applies_to: [react, mui, material-design]
---

# MUI palette structure

MUI splits palette into two layers:

1. **Color objects** — `main`, `light`, `dark`, `contrastText` per role.
2. **Roles** — `primary`, `secondary`, `error`, `warning`, `info`, `success`, plus surface/text scales.

```ts
type ColorPartial = {
  main: string;
  light?: string;        // auto-derived if missing (lighten by 0.2)
  dark?: string;         // auto-derived if missing (darken by 0.3)
  contrastText?: string; // auto-derived for accessible 3:1 against main
};

type Palette = {
  mode: 'light' | 'dark';
  primary: ColorPartial;
  secondary: ColorPartial;
  error: ColorPartial;
  warning: ColorPartial;
  info: ColorPartial;
  success: ColorPartial;
  // Surface
  background: { default: string; paper: string };
  // Text — semantic, not raw
  text: {
    primary: string;     // High-emphasis (87% opacity in light)
    secondary: string;   // Medium (60%)
    disabled: string;    // Low (38%)
  };
  // Other
  divider: string;
  action: {
    active: string;
    hover: string;
    selected: string;
    disabled: string;
    focus: string;
  };
};
```

## Light mode defaults

| Role | Token | Hex |
| --- | --- | --- |
| primary | `primary.main` | `#1976d2` |
| secondary | `secondary.main` | `#9c27b0` |
| error | `error.main` | `#d32f2f` |
| warning | `warning.main` | `#ed6c02` |
| info | `info.main` | `#0288d1` |
| success | `success.main` | `#2e7d32` |
| background | `background.default` | `#fff` |
| background | `background.paper` | `#fff` |
| text | `text.primary` | `rgba(0,0,0,0.87)` |
| text | `text.secondary` | `rgba(0,0,0,0.6)` |
| text | `text.disabled` | `rgba(0,0,0,0.38)` |
| divider | `divider` | `rgba(0,0,0,0.12)` |

## Dark mode defaults

| Role | Token | Hex |
| --- | --- | --- |
| primary | `primary.main` | `#90caf9` |
| secondary | `secondary.main` | `#ce93d8` |
| error | `error.main` | `#f44336` |
| warning | `warning.main` | `#ffa726` |
| info | `info.main` | `#29b6f6` |
| success | `success.main` | `#66bb6a` |
| background | `background.default` | `#121212` |
| background | `background.paper` | `#121212` |
| text | `text.primary` | `#fff` |
| text | `text.secondary` | `rgba(255,255,255,0.7)` |
| text | `text.disabled` | `rgba(255,255,255,0.5)` |
| divider | `divider` | `rgba(255,255,255,0.12)` |

## Action overlay opacities

Action states are **overlays** on top of the role color, not separate tokens. Light/dark vary:

| State | Light opacity | Dark opacity |
| --- | --- | --- |
| `hover` | 0.04 | 0.08 |
| `selected` | 0.08 | 0.16 |
| `focus` | 0.12 | 0.12 |
| `disabled` | 0.26 | 0.3 |

## Designer notes

- The **opacity-based text scale** (87/60/38) is Material 1's hierarchy. Modern Material 3 uses HCT-based on-surface variants with hard hex values. Use opacity for muted text in legacy systems, hex tokens in new systems.
- `contrastText` is auto-computed against `main`. If you override `main`, leave `contrastText` blank — let MUI compute it. If you fix `contrastText` manually, **verify ≥ 4.5:1**.
- `background.default` and `background.paper` are intentionally identical in dark mode (`#121212`). Material 3 separates them via elevation overlays. If you want depth in dark mode, set `background.paper` to `#1e1e1e` or use `Paper` `elevation` props.
- Don't add custom roles (e.g., `tertiary`) without also defining `light/dark/contrastText` — the theme provider will throw.
"""
    return body.replace("__TODAY__", today)


def main() -> None:
    if not TYPOGRAPHY_SRC.exists():
        raise SystemExit(f"Source not found: {TYPOGRAPHY_SRC}")
    typography_text = TYPOGRAPHY_SRC.read_text(encoding="utf-8")
    variants = parse_variants(typography_text)

    TYPOGRAPHY_OUT.parent.mkdir(parents=True, exist_ok=True)
    TYPOGRAPHY_OUT.write_text(render_typography(variants), encoding="utf-8")
    print(f"  wrote {TYPOGRAPHY_OUT.relative_to(ROOT)} ({len(variants)} variants)")

    PALETTE_OUT.parent.mkdir(parents=True, exist_ok=True)
    PALETTE_OUT.write_text(render_palette(), encoding="utf-8")
    print(f"  wrote {PALETTE_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
