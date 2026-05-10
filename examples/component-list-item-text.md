# `ListItemText` — spec (DRAFT — scaffolded 2026-05-10 via TS-AST)

> **Draft scaffold** generated from upstream sources via TypeScript AST.
> A maintainer should review the narrative sections (when to use, anatomy,
> edge cases), verify the API table (especially defaults and event
> handlers), fill in tokens consumed, and remove this banner before
> shipping.
>
> Sources analyzed:
> - **mui**: `refs/mui/packages/mui-material/src/ListItemText/ListItemText.d.ts` (4 interface(s), 1 component(s))

## When to use

(Fill in: what user need does this serve? What's the canonical use case?
When to use vs sibling components?)

## Anatomy

(Fill in: ASCII diagram of the component's parts.)

```
[diagram here]
```

## API

```tsx
<ListItemText>
  {children}
</ListItemText>
```

### Props

| Prop | Type | Default | Required | Source(s) | Description |
| --- | --- | --- | --- | --- | --- |
| `children` | `React.ReactNode` | — | — | mui | Alias for the `primary` prop. |
| `classes` | `Partial<ListItemTextClasses> \| undefined` | — | — | mui | Override or extend the styles applied to the component. |
| `disableTypography` | `boolean \| undefined` | `false` | — | mui | If `true`, the children won't be wrapped by a Typography component.
This can be useful to render an alternative Typography variant by wrapping
the `children` (or `primary`) text, and optional `secondary` text
with the Typography component. |
| `inset` | `boolean \| undefined` | `false` | — | mui | If `true`, the children are indented.
This should be used if there is no left avatar or left icon. |
| `primary` | `React.ReactNode` | — | — | mui | The main content element. |
| `secondary` | `React.ReactNode` | — | — | mui | The secondary content element. |
| `sx` | `SxProps<Theme> \| undefined` | — | — | mui | The system prop that allows defining system overrides as well as additional CSS styles. |

## Variants

(Fill in: visual variants — size / color / shape / etc.)

## States

| State | Visual |
| --- | --- |
| Default | (fill in) |
| Hover | (fill in) |
| Focus-visible | 2px focus ring; cite [keyboard-and-focus.md](../knowledge/a11y/keyboard-and-focus.md) |
| Active | (fill in) |
| Disabled | reduced opacity; `aria-disabled="true"` |

## Tokens consumed

(Fill in. List every token this component reads. Flag missing tokens.)

```
--color-bg-default
--color-fg-default
--space-md
--radius-md
```

## Accessibility

- Semantic element: (fill in)
- ARIA: (fill in)
- Keyboard: (fill in — cite [keyboard-and-focus.md](../knowledge/a11y/keyboard-and-focus.md))
- Touch target: ≥ 44pt for primary mobile / ≥ 24px for desktop AA

## Edge cases

(Fill in 3+ edge cases.)

## Code example

```tsx
// Fill in a concrete usage example
```

## Don't

- (Fill in 2-3 specific misuses.)

## References

- Mui: [`ListItemText.d.ts`](../refs/mui/packages/mui-material/src/ListItemText/ListItemText.d.ts)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- (Add 2-3 related component specs)
