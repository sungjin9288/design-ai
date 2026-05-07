# design-system-builder — playbook

Bootstrap a complete design system from a brand brief. Output is a directory of design tokens, foundational guidelines, and a starter component set.

## When to use

- "We're starting a new product, build the design system."
- "Migrate our hardcoded styles into a token system."
- "I have these brand colors and fonts — turn it into a system."

## Inputs (ask if missing)

1. **Product type / category** — SaaS, e-commerce, fintech, etc. Use to seed palette and density.
2. **Brand inputs**:
   - Primary brand color (hex).
   - Optional: secondary color, font preferences, mood words.
3. **Target framework** — `tailwind v4`, `shadcn-ui`, `mui`, `antd`, `css variables`, `style dictionary`.
4. **Content language(s)** — affects type system (Korean line-height, RTL).
5. **Density default** — comfortable / compact.
6. **Light + dark, or light only?** — default both.

## Steps

### 1. Seed from a curated row

Open [`knowledge/colors/palettes-by-product-type.md`](../../knowledge/colors/palettes-by-product-type.md). Find the closest product-type row. Use it as a reference shape — not values to copy. The user's brand color overrides the primary.

### 2. Build tokens — color

Invoke the `color-palette` skill (or its playbook) with the brand color as seed. Get back:
- Brand ramps (primary, accent, neutrals)
- Semantic aliases (light + dark)
- Contrast matrix

### 3. Build tokens — typography

- Pick a font pairing from [`knowledge/typography/font-pairings.md`](../../knowledge/typography/font-pairings.md) by mood.
- Build the type scale using base 14 (product UI) or 16 (marketing). Ratio 1.25 (major third) is the safe default. See [`knowledge/typography/type-scale-fundamentals.md`](../../knowledge/typography/type-scale-fundamentals.md).
- Define 5–7 named variants: `display`, `heading-lg`, `heading-md`, `heading-sm`, `body-lg`, `body`, `caption`.
- Each variant has: family, weight, size, line-height, letter-spacing, casing.

For Korean content: bump line-heights by 10%.

### 4. Build tokens — spacing, radius, elevation, motion

Spacing: 4-base scale, 9 stops (`4, 8, 12, 16, 20, 24, 32, 40, 48, 64`). See [`knowledge/layout/spacing-and-grid.md`](../../knowledge/layout/spacing-and-grid.md).

Radius:
- `radius-none: 0`
- `radius-sm: 4px`
- `radius-md: 6–8px` (system default)
- `radius-lg: 12px`
- `radius-full: 9999px`

Elevation (4 levels):
- `elevation-0`: `none`
- `elevation-1`: `0 1px 2px rgba(0,0,0,0.06)`
- `elevation-2`: `0 4px 8px rgba(0,0,0,0.08)`
- `elevation-3`: `0 12px 24px rgba(0,0,0,0.12)`

In dark mode, replace shadow with subtle border + elevated background.

Motion:
- `motion-fast: 150ms`
- `motion-default: 250ms`
- `motion-slow: 400ms`
- `easing-default: cubic-bezier(0.4, 0, 0.2, 1)` (standard)
- `easing-emphasized: cubic-bezier(0.2, 0, 0, 1)` (emphasized accelerate)

Cite Ant Design's motion easings ([`knowledge/design-tokens/ant-design.md`](../../knowledge/design-tokens/ant-design.md)) — they ship a tested set.

### 5. Define foundations document

Write a `FOUNDATIONS.md` with:
- Color usage rules (when to use primary vs accent).
- Typography hierarchy rules.
- Iconography (set choice — Material symbols, Lucide, custom — and stroke/size rules).
- Voice and tone (1 paragraph or skip).
- Layout grid (12-col, 24px gutter, 24px margin scaling).
- Density modes if applicable.

### 6. Pick component baseline

Recommend a baseline based on the framework choice:
- **shadcn-ui** for new React projects with Tailwind. Copy the components, adapt tokens.
- **MUI** for React projects needing rich pre-built widgets (date pickers, data grids).
- **Ant Design** for enterprise/dense/Chinese-market or where Form, Table, Tree need to be production-grade out of the box.
- **Custom (Radix + Tailwind)** if the team has senior FE bandwidth.

Don't recommend more than one — pick the strongest fit and explain why.

### 7. List the starter component set

A minimal v1 system needs:
- Button (3 sizes × 4 intents)
- Input, Textarea, Select, Checkbox, Radio, Switch
- Card
- Modal, Drawer, Toast
- Badge, Tag, Tooltip
- Tabs, Breadcrumb, Pagination
- Form (label, help-text, error-text, layout)
- Alert (4 intents: info, success, warning, error)
- Skeleton, EmptyState

Mark each as **derived from baseline** or **custom**. The custom ones get spec'd via `component-spec-writer` next.

### 8. Output structure

Produce a directory:

```
design-system/
├── tokens/
│   ├── color.css        # all color tokens, light + dark
│   ├── typography.css
│   ├── spacing.css
│   ├── radius.css
│   ├── elevation.css
│   ├── motion.css
│   └── tokens.json       # Style Dictionary source
├── foundations/
│   ├── color.md
│   ├── typography.md
│   ├── spacing.md
│   ├── iconography.md
│   └── motion.md
├── components/
│   └── README.md         # baseline choice + starter set list
├── README.md             # how to consume the system
└── CHANGELOG.md          # versioned token changes (start at v0.1.0)
```

If the user just wants a single document instead of a directory, condense into one markdown file in the same order.

### 9. Validate

Before declaring done, verify:
- Every semantic color token has a contrast number.
- Light and dark are both populated.
- Type scale has line-heights AND letter-spacing.
- Motion has both duration and easing.
- README explains how to consume (CSS import / Tailwind config / MUI ThemeProvider).

## Source files this skill reads

- [`knowledge/colors/color-theory.md`](../../knowledge/colors/color-theory.md)
- [`knowledge/colors/palettes-by-product-type.md`](../../knowledge/colors/palettes-by-product-type.md)
- [`knowledge/typography/type-scale-fundamentals.md`](../../knowledge/typography/type-scale-fundamentals.md)
- [`knowledge/typography/font-pairings.md`](../../knowledge/typography/font-pairings.md)
- [`knowledge/typography/mui-type-scale.md`](../../knowledge/typography/mui-type-scale.md)
- [`knowledge/layout/spacing-and-grid.md`](../../knowledge/layout/spacing-and-grid.md)
- [`knowledge/design-tokens/ant-design.md`](../../knowledge/design-tokens/ant-design.md)
- [`knowledge/components/INDEX.md`](../../knowledge/components/INDEX.md)

## Done when

- Token files in the requested format(s).
- Foundations docs cover color, type, spacing, motion, iconography.
- Component baseline is named with one-paragraph rationale.
- Starter component list with derived/custom labels.
- A consumer (frontend dev) can import and start building without questions.
