<!-- hand-written -->
---
title: Spacing, grid, and responsive layout
applies_to: [web, mobile, all-ui]
---

# Spacing, grid, and responsive layout

## The 4-or-8 rule

Pick one base unit and use **only multiples**. Most systems pick **4 px** (with 8 px subset). Tailwind defaults to 4. Material defaults to 4. Ant Design's `sizeUnit` is 4.

**Why 4 not 8?** 4 lets you express tight component padding (e.g., 12 px, 20 px) without breaking grid. 8-only is simpler but produces blocky UIs.

The canonical scale derived from base 4:

```
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128
```

**Skip 28, 36, 44, 52, 56**: they are intermediate steps that should be expressed as `+8` from neighbors when truly needed, not added to the scale.

## Spacing tokens

Name spacing tokens by **role**, not value:

```
✗ space-12
✓ space-md           OR    component-padding-y
```

Two-axis naming is the cleanest:
- **`space-2xs / xs / sm / md / lg / xl / 2xl / 3xl`** for layout (4, 8, 12, 16, 24, 32, 48, 64).
- **`gap-x` / `gap-y`** for component-internal spacing.
- **`inset`** vs **`stack`** vs **`inline`** (Braid/Mirage style) — fancier but disambiguates "padding inside" vs "vertical rhythm" vs "horizontal flow".

## Grid systems

| System | Columns | Gutter | Margin |
| --- | --- | --- | --- |
| 12-column (Bootstrap, Ant) | 12 | 16–24 px | 24 px (mobile) → 80+ px (desktop) |
| 8-point grid | flexible | 8 multiples | aligns to 8 |
| Material | 4-column (mobile), 8 (tablet), 12 (desktop) | 16/24/24 | 16/24/24 |
| Editorial | 6-column or asymmetric | wide | wide |

For most product UIs: **12 columns, 24 px gutter, 24 px outer margin on mobile, scaling**.

## Breakpoints

The pragmatic set, ordered by frequency of use:

| Name | Min width | Usage |
| --- | --- | --- |
| `xs` | 0 | Mobile portrait. Single column, full-width buttons. |
| `sm` | 640 px | Large mobile / phablet. |
| `md` | 768 px | Tablet portrait, foldables. |
| `lg` | 1024 px | Tablet landscape, small laptops. |
| `xl` | 1280 px | Desktop. |
| `2xl` | 1536 px | Large desktop. |

Tailwind v4 defaults match exactly (mobile-first). Ant Design uses 576/768/992/1200/1600 — slightly different, less aligned with modern devices.

**Mobile-first**: write base styles for mobile, use `min-width` queries to add desktop adjustments. Don't author for desktop and shrink down.

## Container queries vs media queries

Use container queries when:
- A component reused at multiple sizes (a card in a grid AND in a sidebar).
- Layout depends on its own width, not the viewport.

Use media queries when:
- Page-level layout shifts (sidebar collapses, navigation opens).
- Typography scale changes globally.

```css
@container card (min-width: 320px) {
  .card { display: grid; grid-template-columns: 1fr 2fr; }
}
```

Browser support: 2023+ all major browsers.

## Density modes

Many products need at least two density modes:

| Mode | Use | Adjustments |
| --- | --- | --- |
| **Comfortable** (default) | Consumer apps, marketing | Standard padding, 16 px body |
| **Compact** | Power users, data tables, IDE-like UIs | -25% vertical padding, 14 px body, smaller controls (28 px height vs 32) |
| **Spacious** | First-time-user, accessibility mode | +25% padding, 16+ px body |

Implement as a CSS variable scale that all components consume:

```css
:root[data-density="compact"] {
  --space-md: 12px;     /* normally 16 */
  --control-height: 28px; /* normally 32 */
}
```

## Responsive type

Three approaches, pick one:

1. **Stepped**: Different `font-size` at each breakpoint. Predictable, easy to QA. _Default for most projects._
2. **Fluid (clamp)**: `font-size: clamp(1rem, 0.5rem + 2vw, 1.5rem)`. Smooth, harder to QA. Good for editorial.
3. **Combined**: Stepped at small/medium, fluid above to fill wide screens. Most expressive, most work.

## Common layout failures

- **No max-width on text content**: lines exceeding 75 chars hurt readability. Cap with `max-w-prose` (Tailwind) or `max-width: 65ch`.
- **Form fields full-width on desktop**: a 1200 px-wide email input looks broken. Cap at 480 px.
- **Card grids without min/max width**: pure `repeat(auto-fit, 1fr)` produces 50 px cards on tiny screens. Use `repeat(auto-fit, minmax(280px, 1fr))`.
- **Mobile drawer that scrolls behind backdrop**: scroll-locking the body is required.
- **No safe-area handling on iOS**: notch/home-bar overlap. `padding-top: env(safe-area-inset-top)`.
