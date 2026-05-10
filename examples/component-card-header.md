# `CardHeader` — spec (DRAFT — scaffolded 2026-05-10 via TS-AST)

> **Draft scaffold** generated from upstream sources via TypeScript AST.
> A maintainer should review the narrative sections (when to use, anatomy,
> edge cases), verify the API table (especially defaults and event
> handlers), fill in tokens consumed, and remove this banner before
> shipping.
>
> Sources analyzed:
> - **mui**: `refs/mui/packages/mui-material/src/CardHeader/CardHeader.d.ts` (14 interface(s), 0 component(s))

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
<CardHeader>
  {children}
</CardHeader>
```

### Props

| Prop | Type | Default | Required | Source(s) | Description |
| --- | --- | --- | --- | --- | --- |
| `action` | `React.ReactNode` | — | — | mui | The action to display in the card header. |
| `avatar` | `React.ReactNode` | — | — | mui | The Avatar element to display. |
| `classes` | `Partial<CardHeaderClasses> \| undefined` | — | — | mui | Override or extend the styles applied to the component. |
| `disableTypography` | `boolean \| undefined` | `false` | — | mui | If `true`, `subheader` and `title` won't be wrapped by a Typography component.
This can be useful to render an alternative Typography variant by wrapping
the `title` text, and optional `subheader` text
with the Typography component. |
| `subheader` | `React.ReactNode` | — | — | mui | The content of the component. |
| `sx` | `SxProps<Theme> \| undefined` | — | — | mui | The system prop that allows defining system overrides as well as additional CSS styles. |
| `title` | `React.ReactNode` | — | — | mui | The content of the component. |

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

- Mui: [`CardHeader.d.ts`](../refs/mui/packages/mui-material/src/CardHeader/CardHeader.d.ts)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- (Add 2-3 related component specs)
