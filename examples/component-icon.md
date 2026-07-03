# `Icon` — spec

> Synthesized from MUI `Icon`/`SvgIcon` and Ant Design `Icon`. The base primitive for rendering icons. Pairs with [`knowledge/icons/curated-sets.md`](../knowledge/icons/curated-sets.md) for icon-set selection.

## When to use

- Inline icons in buttons, links, list items.
- Decorative or status indicators.
- As building blocks for `IconButton`, `Avatar`, `Toast`.

## API

```tsx
<Icon as={CheckIcon} />
<Icon size="md" color="brand" />
<Icon as={WarningIcon} aria-label="Warning" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `ComponentType` | required | The actual icon SVG component (Phosphor, Lucide, etc) |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| number` | `"md"` | Pixel size |
| `color` | `"current" \| "brand" \| "muted" \| "success" \| "warning" \| "error"` | `"current"` | Color via token |
| `weight` | `"thin" \| "light" \| "regular" \| "bold" \| "fill"` | `"regular"` | Phosphor-style weight (if icon set supports) |
| `aria-label` | `string` | — | Required for meaningful icons |
| `aria-hidden` | `boolean` | auto | True for decorative |

## Sizes

| Size | px |
| --- | --- |
| `xs` | 12 |
| `sm` | 16 |
| `md` (default) | 20-24 |
| `lg` | 32 |
| `xl` | 48 |

## Color via `currentColor`

```svg
<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="..." />
</svg>
```

The icon SVG should use `fill="currentColor"` (or `stroke="currentColor"` for stroke-style). Icon component sets the parent `color` token; SVG inherits.

```css
.icon[data-color="brand"]   { color: var(--color-brand-default); }
.icon[data-color="muted"]   { color: var(--color-fg-muted); }
.icon[data-color="success"] { color: var(--color-success-default); }
.icon[data-color="warning"] { color: var(--color-warning-default); }
.icon[data-color="error"]   { color: var(--color-error-default); }
```

## Accessibility

| Use | Pattern |
| --- | --- |
| Decorative (label-redundant) | `aria-hidden="true"` |
| Meaningful (no adjacent label) | `<span role="img" aria-label="...">` wrapper |
| Inside button text label | `aria-hidden="true"` (button label conveys meaning) |
| Inside icon-only button | label on the button, NOT the icon |

```tsx
{/* Decorative inside text-labeled button */}
<button>
  <Icon as={SaveIcon} aria-hidden /> 저장
</button>

{/* Meaningful icon-only button */}
<button aria-label="저장">
  <Icon as={SaveIcon} aria-hidden />
</button>
```

## Icon-set conventions

- Pick **one set** per project (Phosphor, Lucide, Heroicons, Material Icons).
- Don't mix stroke and fill icon sets — visual inconsistency.
- For Phosphor: weights (thin / light / regular / bold / fill) accepted.
- For Lucide / Heroicons: stroke-only; uniform line weight.

See [`knowledge/icons/curated-sets.md`](../knowledge/icons/curated-sets.md).

## Don't

- Don't use color alone to convey state. Pair with adjacent text or shape.
- Don't render icon SVG inline without `aria-hidden` if it's decorative.
- Don't use `<i className="icon-...">` icon-font pattern. Bad a11y, no theming.
- Don't render at non-multiple-of-2 sizes (15px). Stays sharp on retina at 16/20/24.

## References

- MUI: [`SvgIcon`](../docs/reference/mui.md#svg-icon)
- Phosphor Icons: 1200+ icons, 5 weights
- Lucide: stroke-only minimalist set

## Cross-reference

- [`examples/component-icon-button.md`](component-icon-button.md)
- [`knowledge/icons/curated-sets.md`](../knowledge/icons/curated-sets.md)
