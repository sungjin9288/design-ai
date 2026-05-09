<!-- hand-written -->
---
title: Type scale fundamentals
applies_to: [web, mobile, all-ui]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Type scale fundamentals

Choosing a type scale is a 30-minute decision that compounds for the life of a product. This is the floor.

## Pick a base size first

| Context | Base body |
| --- | --- |
| Marketing site | 18 px (sometimes 20). Reading-heavy. |
| Product UI (SaaS, dashboards) | 14 px (Ant, MUI default) or 15 px. Density matters. |
| Mobile native | 17 pt iOS, 14 sp Android. |
| Editorial / long-form reading | 18–20 px with line-length 60–75 chars. |

The base sets **everything else** because most scales are ratios of the base.

## Common scale ratios

| Ratio name | Multiplier | Feels like |
| --- | --- | --- |
| **Minor third** | 1.2 | Tight, dense (ideal for product UI). |
| **Major third** | 1.25 | Tight but a touch more contrast. |
| **Perfect fourth** | 1.333 | Balanced — most "modern" sites. |
| **Augmented fourth** | 1.414 | Editorial feel. |
| **Perfect fifth** | 1.5 | Dramatic — marketing/landing. |
| **Golden ratio** | 1.618 | Display-only — collapses on small screens. |

Worked example with base 14, ratio 1.25 (major third):
```
14, 18, 22, 27, 34, 42, 53, 66 px
```

In Ant Design's actual scale (not strictly geometric):
```
12, 14, 16, 20, 24, 30, 38, 46, 56, 68 px
```

The non-geometric jump at the top works in real product because designers use 38+ rarely; the bottom needs more granularity.

## Line height by size

Line height is **inversely** related to font size:

| Size | Line height (multiplier) |
| --- | --- |
| 12 px | 1.5–1.7 (16–20 px) |
| 14 px | 1.5 (21 px) |
| 16 px | 1.5 (24 px) |
| 20–24 px | 1.4 |
| 28–34 px | 1.3 |
| 40+ px | 1.1–1.2 |

Express as **unitless** (`line-height: 1.5`) so it inherits cleanly.

## Korean / CJK adjustments

- Increase line-height by ~10% over Latin defaults. Hangul descenders bite into the next line otherwise.
- 한글 본문 14px → line-height 1.6 (vs 1.5 for Latin).
- Letter-spacing (`tracking`) for Hangul: usually `-0.005em` or `0`. Latin negative tracking can crush Hangul jamo.
- Font-weight: Hangul typefaces frequently look 1 step "lighter" than Latin at the same numeric weight. Bump bold body to 600 (vs 500/400 mix in Latin).

## Font weight — picking the set

Most products need **3 weights, not 9**:

| Use | Weight |
| --- | --- |
| Body | 400 (Regular) |
| Emphasis / UI labels | 500 or 600 (Medium / Semibold) |
| Headings | 700 (Bold) — or 600 if heavy |

Adding 300 (Light) is OK for very large display sizes but reads too thin under 24px. Skip 200 and 100 unless you're designing a magazine.

Bundle cost: each weight adds ~30–80 KB. Variable fonts ship one file with the full axis range — prefer `Inter Variable` over `Inter 400` + `Inter 600` separately.

## Font pairing — the rules

1. **Contrast or harmony, not both.** Either pick two fonts of clearly different categories (serif heading + sans body) or pick within the same family / pairing (geometric sans + humanist sans).
2. **Match x-height when both are sans.** Inter and Roboto Flex pair badly because Inter's x-height is much taller — body looks oversized.
3. **The body font is the more important choice.** A great pairing with poor body legibility is a failure. Test the body font in your actual content first.
4. **Avoid trend-of-the-year fonts** for products with multi-year horizons. Inter, Roboto, IBM Plex Sans, Source Sans, Open Sans age well. Recoleta, Cabinet Grotesk are 2023-coded.
5. **Use system fonts when speed matters.** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` ships zero KB and matches the OS.

## Hierarchy beyond size

A type system uses **at most 6** size steps, but communicates hierarchy with:

- **Weight**: 400 body → 600 emphasis → 700 heading.
- **Color**: full-contrast for primary text, 60–70% opacity for secondary.
- **Casing**: ALL CAPS reserved for tiny labels (12–14 px) — increases tracking ≥ 0.05em.
- **Whitespace**: `margin-top` on headings creates the section feel. The size jump alone is not enough.
- **Numerals**: tabular numerals (`font-variant-numeric: tabular-nums`) for tables, dashboards, prices. Proportional otherwise.

## Cross-reference

- [knowledge/typography/font-pairings.md](font-pairings.md) — curated pairings by mood
- [knowledge/typography/mui-type-scale.md](mui-type-scale.md) — Material's scale
