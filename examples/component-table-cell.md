# `TableCell` — spec (DRAFT — scaffolded 2026-05-11 via TS-AST)

> **Draft scaffold** generated from upstream sources via the TypeScript
> Compiler API. The **API table below is parsed directly from the source's
> typed declarations** — props / types / defaults / `@deprecated` markers
> are accurate and trustworthy.
>
> The **narrative sections** (when to use, anatomy, tokens, accessibility,
> edge cases, code example) are placeholders. A maintainer should fill
> them in based on actual usage and remove this banner before declaring
> the spec polished.
>
> Sources analyzed:
> - **mui**: `refs/mui/packages/mui-material/src/TableCell/TableCell.d.ts` (5 interface(s), 1 component(s))

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
<TableCell>
  {children}
</TableCell>
```

### Props

| Prop | Type | Default | Required | Source(s) | Description |
| --- | --- | --- | --- | --- | --- |
| `align` | `'inherit' \| 'left' \| 'center' \| 'right' \| 'justify` | `'inherit'` | — | mui | Set the text-align on the table cell content.

Monetary or generally number fields **should be right aligned** as that allows
you to add them up quickly in your head without having to worry about decimals. |
| `children` | `React.ReactNode` | — | — | mui | The content of the component. |
| `classes` | `Partial<TableCellClasses> \| undefined` | — | — | mui | Override or extend the styles applied to the component. |
| `component` | `React.ElementType<TableCellBaseProps> \| undefined` | — | — | mui | The component used for the root node.
Either a string to use a HTML element or a component. |
| `padding` | `'normal' \| 'checkbox' \| 'none' \| undefined` | — | — | mui | Sets the padding applied to the cell.
The prop defaults to the value (`'default'`) inherited from the parent Table component. |
| `scope` | `TableCellBaseProps['scope'] \| undefined` | — | — | mui | Set scope attribute. |
| `size` | `OverridableStringUnion<'small' \| 'medium', TableCe` | — | — | mui | Specify the size of the cell.
The prop defaults to the value (`'medium'`) inherited from the parent Table component. |
| `sortDirection` | `SortDirection \| undefined` | — | — | mui | Set aria-sort direction. |
| `sx` | `SxProps<Theme> \| undefined` | — | — | mui | The system prop that allows defining system overrides as well as additional CSS styles. |
| `variant` | `\| OverridableStringUnion<'head' \| 'body' \| 'footer` | — | — | mui | Specify the cell type.
The prop defaults to the value inherited from the parent TableHead, TableBody, or TableFooter components. |

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

- Mui: [`TableCell.d.ts`](../refs/mui/packages/mui-material/src/TableCell/TableCell.d.ts)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- (Add 2-3 related component specs)
