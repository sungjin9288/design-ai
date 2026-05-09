<!-- hand-written -->
---
title: Tailwind CSS v4 default theme reference
applies_to: [tailwindcss, oklch, design-tokens, web]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Tailwind CSS v4 default theme

Tailwind v4 ships an OKLCH-based default theme that's the most commonly used token set in modern web product UIs. Worth knowing as a reference, even if you customize.

## Theme syntax

Tailwind v4 uses CSS-native `@theme` declarations:

```css
@import "tailwindcss";

@theme {
  --color-primary-500: oklch(0.606 0.250 292.717);
  --spacing: 0.25rem;
  --font-sans: 'Inter', sans-serif;
  /* ... */
}
```

Variables become utility classes automatically (`bg-primary-500`, `p-4`, `font-sans`).

## Color scale (the hero feature)

Tailwind v4's default colors are OKLCH-derived. **Each scale is perceptually uniform** — step from 100 to 200 is visually the same magnitude as 800 to 900. This is the headline change from v3.

### Color families

22 default color families × 11 steps each = 242 default colors. Listed below in OKLCH rotation order:

```
red, orange, amber, yellow, lime, green, emerald, teal, cyan,
sky, blue, indigo, violet, purple, fuchsia, pink, rose,
slate, gray, zinc, neutral, stone
```

The first 17 are chromatic; the last 5 are neutral grays with subtle hue tints.

### Steps (per family)

`50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`

### Lightness mapping (consistent across families)

| Step | Approximate OKLCH `L` |
| --- | --- |
| 50  | 0.96–0.98 |
| 100 | 0.93–0.95 |
| 200 | 0.87–0.90 |
| 300 | 0.78–0.82 |
| 400 | 0.65–0.72 |
| 500 | 0.55–0.62 |
| 600 | 0.49–0.55 |
| 700 | 0.42–0.49 |
| 800 | 0.36–0.43 |
| 900 | 0.30–0.38 |
| 950 | 0.18–0.28 |

**Step 600 hits ~4.5:1 on white** for most chromatic colors — this is the canonical "primary brand" anchor. Step 500 hits ~3:1 (UI-sized only).

### Sample family — violet

```css
@theme {
  --color-violet-50:  oklch(0.969 0.016 293.756);  /* #F5F3FF */
  --color-violet-100: oklch(0.943 0.029 294.588);  /* #EDE9FE */
  --color-violet-200: oklch(0.894 0.057 293.283);  /* #DDD6FE */
  --color-violet-300: oklch(0.811 0.111 293.571);  /* #C4B5FD */
  --color-violet-400: oklch(0.702 0.183 293.541);  /* #A78BFA */
  --color-violet-500: oklch(0.606 0.250 292.717);  /* #8B5CF6 */
  --color-violet-600: oklch(0.541 0.281 293.009);  /* #7C3AED */
  --color-violet-700: oklch(0.491 0.270 292.581);  /* #6D28D9 */
  --color-violet-800: oklch(0.432 0.232 292.759);  /* #5B21B6 */
  --color-violet-900: oklch(0.381 0.176 293.745);  /* #4C1D95 */
  --color-violet-950: oklch(0.283 0.141 291.089);  /* #2E1065 */
}
```

## Spacing

Tailwind v4 default uses a single `--spacing` base, with utilities scaling it:

```css
@theme {
  --spacing: 0.25rem;  /* 4px (assuming 16px root) */
}
```

| Class | Value |
| --- | --- |
| `p-1` | 4px |
| `p-2` | 8px |
| `p-3` | 12px |
| `p-4` | 16px |
| `p-5` | 20px |
| `p-6` | 24px |
| `p-8` | 32px |
| `p-10` | 40px |
| `p-12` | 48px |
| `p-16` | 64px |
| `p-20` | 80px |
| `p-24` | 96px |

Aligns with our 4-base scale per [`layout/spacing-and-grid.md`](../layout/spacing-and-grid.md).

## Typography

```css
@theme {
  --font-sans: ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}
```

System-font stacks are the default — performant, no FOUT.

### Type scale

| Class | Size | Line height |
| --- | --- | --- |
| `text-xs` | 12px | 16px (1.33) |
| `text-sm` | 14px | 20px (1.43) |
| `text-base` | 16px | 24px (1.5) |
| `text-lg` | 18px | 28px (1.56) |
| `text-xl` | 20px | 28px (1.4) |
| `text-2xl` | 24px | 32px (1.33) |
| `text-3xl` | 30px | 36px (1.2) |
| `text-4xl` | 36px | 40px (1.11) |
| `text-5xl` | 48px | 1 |
| `text-6xl` | 60px | 1 |
| `text-7xl` | 72px | 1 |
| `text-8xl` | 96px | 1 |
| `text-9xl` | 128px | 1 |

Note: large sizes (`5xl+`) drop to `line-height: 1` (display use). Body sizes have generous leading.

### Weights

`font-thin` 100 / `font-extralight` 200 / `font-light` 300 / `font-normal` 400 / `font-medium` 500 / `font-semibold` 600 / `font-bold` 700 / `font-extrabold` 800 / `font-black` 900.

## Breakpoints

```css
@theme {
  --breakpoint-sm: 40rem;    /* 640px */
  --breakpoint-md: 48rem;    /* 768px */
  --breakpoint-lg: 64rem;    /* 1024px */
  --breakpoint-xl: 80rem;    /* 1280px */
  --breakpoint-2xl: 96rem;   /* 1536px */
}
```

Mobile-first: utilities apply at all sizes by default; `md:bg-blue-500` applies at ≥ 768px.

## Border radius

| Class | Value |
| --- | --- |
| `rounded-none` | 0 |
| `rounded-sm` | 0.125rem (2px) |
| `rounded` | 0.25rem (4px) |
| `rounded-md` | 0.375rem (6px) |
| `rounded-lg` | 0.5rem (8px) |
| `rounded-xl` | 0.75rem (12px) |
| `rounded-2xl` | 1rem (16px) |
| `rounded-3xl` | 1.5rem (24px) |
| `rounded-full` | 9999px |

## Shadows

```
shadow-2xs  / shadow-xs  / shadow-sm  / shadow  /
shadow-md  / shadow-lg  / shadow-xl  / shadow-2xl  /
shadow-inner  / shadow-none
```

Default values use `rgb(0 0 0 / x)` with varying offset and blur.

## Transitions

| Class | Properties |
| --- | --- |
| `transition` | most common (color, bg, border, opacity, shadow, transform, filter, backdrop-filter) |
| `transition-all` | everything (avoid in production) |
| `transition-colors` | color-only |
| `transition-opacity` | opacity-only |
| `transition-shadow` | shadow-only |
| `transition-transform` | transform-only |

Default duration `150ms`, ease `cubic-bezier(0.4, 0, 0.2, 1)`.

| Class | Duration |
| --- | --- |
| `duration-75` | 75ms |
| `duration-100` | 100ms |
| `duration-150` | 150ms |
| `duration-200` | 200ms |
| `duration-300` | 300ms |
| `duration-500` | 500ms |
| `duration-700` | 700ms |
| `duration-1000` | 1000ms |

Consistent with [`motion/principles.md`](../motion/principles.md) duration tiers.

## Z-index scale

`z-0`, `z-10`, `z-20`, `z-30`, `z-40`, `z-50`, `z-auto`.

For component systems with modals/popovers/tooltips: extend with semantic z-tokens (`--z-modal`, `--z-popover`, etc.) above this default.

## Dark mode

Tailwind v4 supports two strategies:

### Media query (default)

```css
.dark\:bg-slate-900 { ... }
```

Applied via `@media (prefers-color-scheme: dark)`.

### Class-based (most product apps)

```css
@variant dark (&:where(.dark, .dark *));
```

Then `<html class="dark">` toggles dark mode globally.

### Token override

```css
@theme {
  --color-bg: oklch(1 0 0);  /* white */
}

@layer base {
  .dark {
    --color-bg: oklch(0.18 0 0);  /* near-black */
  }
}
```

## How to customize

To make Tailwind v4 yours:

1. Override `@theme` with your brand tokens.
2. Add semantic aliases:
   ```css
   @theme {
     --color-primary-default: var(--color-violet-600);
     --color-primary-hover: var(--color-violet-700);
   }
   ```
3. Drop unused color families if bundle size matters (Tailwind tree-shakes; minimal concern).

## When NOT to use Tailwind v4 defaults

- **Brand has very specific palette**: replace the chromatic families with your brand ramps.
- **Korean fintech needing red=up convention**: replace `--color-money-positive` / `--color-money-negative` semantically; keep primary scale.
- **Material Design alignment**: use Material 3 tokens instead — see [`material-3.md`](material-3.md).
- **Apps where `oklch()` browser support matters** (older browsers): provide hex fallbacks via PostCSS plugin or extract hex equivalents.

## Worked example using Tailwind v4

See [`examples/palette-saas-violet.md`](../../examples/palette-saas-violet.md) for a complete palette generated from Tailwind v4 violet ramps.

## Cross-reference

- [`knowledge/colors/color-theory.md`](../colors/color-theory.md) — OKLCH rationale, ramp construction
- [`knowledge/design-tokens/material-3.md`](material-3.md) — alternative HCT-based token system
- [`knowledge/design-tokens/ant-design.md`](ant-design.md) — alternative seed-token system
- [Tailwind CSS v4 docs](https://tailwindcss.com/docs/theme)
