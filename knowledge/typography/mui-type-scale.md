---
title: MUI default type scale
source: refs/mui/packages/mui-material/src/styles/createTypography.js
upstream: https://github.com/mui/material-ui/blob/master/packages/mui-material/src/styles/createTypography.js
extracted_at: 2026-05-19
applies_to: [react, mui, material-design]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# MUI default type scale

Material Design's official type system as implemented by MUI. The base font size is **14px** with **16px html root**, producing a `coef = 14/16 = 0.875`. Letter spacing values are in `em`, derived as `letterSpacing / size`.

Default font: `"Roboto", "Helvetica", "Arial", sans-serif`.

## Variants

| Variant | Weight | Size | Line height | Letter spacing | Casing |
| --- | --- | --- | --- | --- | --- |
| `h1` | fontWeightLight | 96px | 1.167 | -1.5 | — |
| `h2` | fontWeightLight | 60px | 1.2 | -0.5 | — |
| `h3` | fontWeightRegular | 48px | 1.167 | 0 | — |
| `h4` | fontWeightRegular | 34px | 1.235 | 0.25 | — |
| `h5` | fontWeightRegular | 24px | 1.334 | 0 | — |
| `h6` | fontWeightMedium | 20px | 1.6 | 0.15 | — |
| `subtitle1` | fontWeightRegular | 16px | 1.75 | 0.15 | — |
| `subtitle2` | fontWeightMedium | 14px | 1.57 | 0.1 | — |
| `body1` | fontWeightRegular | 16px | 1.5 | 0.15 | — |
| `body2` | fontWeightRegular | 14px | 1.43 | 0.15 | — |
| `button` | fontWeightMedium | 14px | 1.75 | 0.4 | ALL CAPS |
| `caption` | fontWeightRegular | 12px | 1.66 | 0.4 | — |
| `overline` | fontWeightRegular | 12px | 2.66 | 1 | ALL CAPS |

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
