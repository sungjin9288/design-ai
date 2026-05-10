# `AccordionActions` — spec (DRAFT — scaffolded 2026-05-10 via TS-AST)

> **Draft scaffold** generated from upstream sources via TypeScript AST.
> A maintainer should review the narrative sections (when to use, anatomy,
> edge cases), verify the API table (especially defaults and event
> handlers), fill in tokens consumed, and remove this banner before
> shipping.
>
> Sources analyzed:
> - **mui**: `refs/mui/packages/mui-material/src/AccordionActions/AccordionActions.d.ts` (1 interface(s), 1 component(s))

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
<AccordionActions>
  {children}
</AccordionActions>
```

### Props

| Prop | Type | Default | Required | Source(s) | Description |
| --- | --- | --- | --- | --- | --- |
| `children` | `React.ReactNode` | — | — | mui | The content of the component. |
| `classes` | `Partial<AccordionActionsClasses> \| undefined` | — | — | mui | Override or extend the styles applied to the component. |
| `disableSpacing` | `boolean \| undefined` | `false` | — | mui | If `true`, the actions do not have additional margin. |
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

- Mui: [`AccordionActions.d.ts`](../refs/mui/packages/mui-material/src/AccordionActions/AccordionActions.d.ts)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- (Add 2-3 related component specs)
