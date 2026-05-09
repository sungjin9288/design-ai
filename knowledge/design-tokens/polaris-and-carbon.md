<!-- hand-written -->
---
title: Polaris (Shopify) and Carbon (IBM) — enterprise token references
applies_to: [enterprise, b2b-saas, design-tokens]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Polaris and Carbon

Two enterprise design systems worth knowing as references. Both prioritize accessibility + token-based theming. Useful for B2B SaaS / e-commerce admin / enterprise dashboards.

## Polaris (Shopify)

Optimized for **e-commerce admin** — merchant tools, multi-store management, dense product catalog UIs.

### Color tokens

Polaris uses **role-based naming** without hue families:

```
Surface tokens:
  --p-color-bg                       (page background)
  --p-color-bg-surface               (cards, panels)
  --p-color-bg-surface-secondary     (subtle alternate)
  --p-color-bg-fill                  (filled inputs, switches)
  --p-color-bg-fill-brand            (primary CTA)
  --p-color-bg-fill-success
  --p-color-bg-fill-warning
  --p-color-bg-fill-critical

Text tokens:
  --p-color-text                     (primary)
  --p-color-text-secondary
  --p-color-text-disabled
  --p-color-text-brand
  --p-color-text-success
  --p-color-text-warning
  --p-color-text-critical

Border tokens:
  --p-color-border                   (default)
  --p-color-border-secondary
  --p-color-border-brand
  --p-color-border-disabled
```

The `-fill` / `-text` / `-border` suffix pattern is consistent across colors. **Critical** is Polaris's term for "destructive/error" — note the slight rename from typical "error".

### Typography

```
font-size-50:  10px (caption)
font-size-75:  12px (small body)
font-size-100: 13px (default body)
font-size-200: 14px
font-size-300: 16px (heading-md)
font-size-400: 20px
font-size-500: 24px (heading-lg)
font-size-600: 30px
font-size-700: 36px
font-size-800: 48px (display)
```

Numeric naming (`-100`, `-200`) instead of `-sm`/`-md`/`-lg` is a Polaris signature — easier to insert intermediate values.

### Spacing

```
space-025: 1px
space-050: 2px
space-100: 4px
space-150: 6px
space-200: 8px
space-300: 12px
space-400: 16px
space-500: 20px
space-600: 24px
space-800: 32px
space-1000: 40px
space-1200: 48px
space-1600: 64px
space-2000: 80px
space-2400: 96px
space-3200: 128px
```

`-100` = 4px (the smallest non-pixel unit). Numeric naming + clear progression.

### Notable patterns from Polaris

- **`Page` and `Layout` primitives** with sections and slots — extremely opinionated layout system for admin screens
- **`IndexTable`** — polaris's data table, optimized for admin lists with bulk actions
- **`Filters` and `Tabs`** — admin search/filter patterns

For admin dashboards: study Polaris's "Page → Layout → Card" composition. It's a strong template.

### When to look at Polaris

- Building Shopify apps (mandatory).
- B2B SaaS admin UIs where Polaris's density + structure fits.
- Token naming inspiration (numeric scales, role-based).

## Carbon (IBM)

Optimized for **enterprise data UIs** — analytics, dashboards, data manipulation tools (Cloud Pak, Watson, etc.).

### Color tokens

Carbon's tokens are role-based with a **theme-aware** layer:

```
Each Carbon theme (white, g10, g90, g100) has its own token values:

Layer tokens (page → modal stacking):
  --cds-background          (page bg)
  --cds-layer               (first card)
  --cds-layer-accent        (alt card variant)
  --cds-layer-02            (2nd-level card on layer 1)
  --cds-layer-03            (3rd-level card on layer 2)

Text tokens:
  --cds-text-primary
  --cds-text-secondary
  --cds-text-placeholder
  --cds-text-on-color
  --cds-text-helper
  --cds-text-error

Interactive tokens:
  --cds-interactive          (primary brand)
  --cds-link-primary
  --cds-link-primary-hover
  --cds-link-secondary
  --cds-button-primary
  --cds-button-secondary
  --cds-button-tertiary
  --cds-button-disabled

Support tokens:
  --cds-support-success
  --cds-support-warning
  --cds-support-error
  --cds-support-info
```

The **layer system** is Carbon's standout: depth is encoded as `layer` / `layer-02` / `layer-03`. A modal on a card on a page automatically resolves to the right surface color.

### Typography (IBM Plex)

Default font: **IBM Plex Sans** (custom designed for Carbon).

Type scale (Productive expressive):
```
caption-01:    12px / 16px
helper-text:   12px / 16px
body-compact:  14px / 18px
body-01:       14px / 20px
body-02:       16px / 24px
heading-01:    14px / 18px / 600 weight
heading-02:    16px / 22px / 600 weight
heading-03:    20px / 28px / 400 weight
heading-04:    28px / 36px / 400 weight
heading-05:    32px / 40px / 400 weight
heading-06:    42px / 50px / 300 weight
heading-07:    54px / 64px / 300 weight
display-01:    42px / 50px / 300 weight
```

"Productive" mode is dense; "Expressive" mode is more spacious — Carbon ships both.

### Spacing

```
spacing-01: 0.125rem (2px)
spacing-02: 0.25rem  (4px)
spacing-03: 0.5rem   (8px)
spacing-04: 0.75rem  (12px)
spacing-05: 1rem     (16px)
spacing-06: 1.5rem   (24px)
spacing-07: 2rem     (32px)
spacing-08: 2.5rem   (40px)
spacing-09: 3rem     (48px)
spacing-10: 4rem     (64px)
spacing-11: 5rem     (80px)
spacing-12: 6rem     (96px)
spacing-13: 10rem    (160px)
```

### Notable patterns from Carbon

- **DataTable** — heavy data tables with selection, batch actions, customizable density
- **UI Shell** — the navigation chrome (header + side nav)
- **Notification (toast/inline)** — typed for business contexts
- **DataVisualization** library — Carbon Charts, focused on enterprise reporting

### When to look at Carbon

- Enterprise B2B with heavy data/dashboard content.
- IBM ecosystem.
- When dense, "professional" aesthetic is required (no playfulness).

## Comparison

| Aspect | Polaris | Carbon | (vs Material 3) | (vs Tailwind v4) |
| --- | --- | --- | --- | --- |
| Token naming | Role-based, numeric scales | Role-based, layer-aware | Role-based, container-pattern | Hue-based, numeric steps |
| Audience | E-commerce admin | Enterprise / data | Cross-platform consumer | Web product (any) |
| Density default | Comfortable | Productive (dense) | Comfortable | Comfortable |
| Color generation | Hand-curated | Hand-curated | Generated from seed (HCT) | Generated from seed (OKLCH) |
| Accessibility | High | Highest (IBM is strict) | High | Good (OKLCH helps) |
| Customization | Token override | Token override per-theme | Whole theme from seed | Token override |

## When to NOT use these directly

For most teams: **don't import Polaris or Carbon directly**. They're heavy dependencies designed for the parent companies' ecosystems.

- Use Polaris if building Shopify apps.
- Use Carbon if you're IBM-aligned.
- Otherwise: **learn from their token structures** but build your own (or use Tailwind / Ant / shadcn) and apply naming patterns you like.

## Cross-reference

- [`knowledge/design-tokens/tailwind-v4.md`](tailwind-v4.md) — modern web default
- [`knowledge/design-tokens/material-3.md`](material-3.md) — Google's system
- [`knowledge/design-tokens/ant-design.md`](ant-design.md) — alternative enterprise system
- [`knowledge/colors/mui-palette-structure.md`](../colors/mui-palette-structure.md) — Material 2 still in MUI
- [`docs/TOKEN-SYNC.md`](../../docs/TOKEN-SYNC.md) — three-tier architecture
- [Polaris](https://polaris.shopify.com/)
- [Carbon Design System](https://carbondesignsystem.com/)
