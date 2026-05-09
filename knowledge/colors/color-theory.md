<!-- hand-written -->
---
title: Color theory for product UI
applies_to: [design-system, brand, all-ui]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Color theory for product UI

Practical color reasoning for product designers. Skip if you've designed three real systems already; otherwise this is the floor.

## Color spaces

| Space | When to use |
| --- | --- |
| **HEX / RGB** | Final output, code-side. Not for reasoning about hue/luminance. |
| **HSL** | Quick mental model — hue spin, lightness ramps. Falls apart for perceptually uniform ramps (e.g., yellow at L=50% reads brighter than blue at L=50%). |
| **OKLCH** | Modern default for design tokens. Perceptually uniform, predictable lightness ramps, stable hue under chroma changes. Tailwind v4 defaults to OKLCH. Browser-supported in 2023+. |
| **HCT (Material 3)** | Same family as OKLCH but tuned for Material's tone mapping. Use if you build on Material 3. |

**Rule of thumb**: design and store tokens in **OKLCH or HCT**, output in HEX/RGB for code. Don't author tokens in HSL — your "L=50%" yellow will read 1.5× brighter than your "L=50%" blue.

## Building a palette — the steps

1. **Pick the brand primary** (1 hex).
2. **Generate the ramp**: 10–11 stops from `50` (lightest) to `950` (darkest). Use OKLCH lightness step ≈ 8–10% per stop. Keep chroma constant where possible — falling chroma at the dark end avoids muddy darks.
3. **Pick semantic anchors** in the ramp:
   - `primary-default` = step 500 or 600 (pick the one that hits 4.5:1 on white).
   - `primary-hover` = +1 step darker.
   - `primary-active` = +2 steps darker.
   - `primary-subtle-bg` = step 50 or 100.
4. **Generate accent / supporting hues** by holding `L` and `C` constant in OKLCH and rotating `H`. This produces palette members that feel like siblings.
5. **Pick neutrals** — usually a hue-cooled gray (slight blue tint matching the primary). Pure `#808080` reads cold and dead.
6. **Pick semantic non-brand**: `success` (green-600), `warning` (amber-500), `error` (red-600), `info` (often = primary).
7. **Dark mode**: Don't just invert. Recompute. Increase chroma by 10–20% (low-light eye is less saturated), keep semantic ranks the same (success-600 stays success-600), but sample from a cooler/darker baseline.

## Anchor lightness for AA on white

For white backgrounds, the primary text/CTA color must clear ratio:

| Hue family | OKLCH `L` for ≈ 4.5:1 on white |
| --- | --- |
| Blue | ~50% |
| Red | ~52% |
| Green (cool, like emerald) | ~46% |
| Yellow / Amber | ~36–40% (yellows go nearly to black before they clear AA) |
| Purple | ~50% |
| Gray | ~45% |

These are starting estimates — always verify with a contrast checker.

## Color roles (semantic naming)

Use **role-based names**, not hue-based:

```
✗ blue-600
✓ color-primary-default

✗ gray-900
✓ color-text-primary

✗ red-500
✓ color-feedback-error
```

Ramps stay hue-named (`blue-50` … `blue-950`); the **alias layer** above ramps is role-named. This is the same model as Ant Design, Tailwind, Material 3, and Polaris.

## Anti-patterns

- **Too many primaries**: a "primary" and a "primary-2" both used for CTAs. Pick one. The second goes into the secondary slot or gets cut.
- **Pure black for text**: `#000000` is harsh. Most systems use `#1F1F1F` or `#111827` (Tailwind's gray-900).
- **Pure white for backgrounds with content**: causes glare; use `#FAFAFA` or `#F9FAFB` for subdued backgrounds.
- **Color encoding meaning without redundancy**: green for "online" / red for "offline" with no icon or label fails for color-blind users. WCAG 1.4.1.
- **Inverted dark mode**: light mode swapped doesn't work. White becomes pure black, contrast hurts the eye, and brand hues lose punch.

## Tools

- **OKLCH picker**: <https://oklch.com> — design ramps in OKLCH, copy as CSS.
- **Material Theme Builder**: <https://material-foundation.github.io/material-theme-builder/> — HCT-based, useful even for non-Material projects.
- **Adobe Leonardo**: <https://leonardocolor.io> — generates ramps with target contrast ratios as the constraint.
- **Tailwind v4 OKLCH variables**: defined as `oklch(l c h)` in CSS — paste from designer to dev cleanly.

## Cross-reference

- [knowledge/colors/palettes-by-product-type.md](palettes-by-product-type.md) — battle-tested palette starting points
- [knowledge/colors/mui-palette-structure.md](mui-palette-structure.md) — MUI's role/state model
- [knowledge/a11y/contrast.md](../a11y/contrast.md) — WCAG ratios
