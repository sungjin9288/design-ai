# `TableContainer` — spec

> Synthesized from MUI `TableContainer`. Wraps a `Table` to provide horizontal scroll, fixed height (with sticky header), and Paper styling. Without it, wide tables overflow the viewport ungracefully.

## When to use

- Every `Table` that might exceed viewport width on narrow screens.
- Tables inside Cards/Papers where you want consistent elevation.
- Tables with `stickyHeader` (requires `maxHeight` on container).

## API

```tsx
<TableContainer component={Paper} sx={{ maxHeight: 480 }}>
  <Table stickyHeader>
    <TableHead>...</TableHead>
    <TableBody>...</TableBody>
  </Table>
</TableContainer>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | A `Table` |
| `component` | `ElementType` | `'div'` | Wrap as `Paper` for elevation |

## Tokens consumed

```
--paper-bg
--paper-shadow-1
--paper-radius
```

## Accessibility

- The container itself adds no a11y semantics.
- For very wide tables that scroll horizontally, ensure keyboard users can navigate (the table itself stays focusable; arrow keys move within cells).
- Set `tabIndex={0}` + `role="region"` + `aria-label` on the container to make scrolling discoverable to screen readers.

## Edge cases

- **`stickyHeader` without `maxHeight`** — header doesn't stick (needs a scrollable parent).
- **Mobile pivot to card-list** — for very narrow viewports, breaking out of TableContainer entirely and rendering `<Stack><Card /></Stack>` reads better than horizontal scroll. Cite [`knowledge/patterns/list-and-feed.md`](../knowledge/patterns/list-and-feed.md).

## Code example

```tsx
<TableContainer
  component={Paper}
  sx={{ maxHeight: 480 }}
  tabIndex={0}
  role="region"
  aria-label="직원 명단"
>
  <Table stickyHeader>
    <TableHead>...</TableHead>
    <TableBody>...</TableBody>
  </Table>
</TableContainer>
```

## Don't

- Don't use without a `Table` child.
- Don't apply both `maxHeight` and `height: 100%` — unpredictable layout.

## References

- MUI: [`TableContainer`](../docs/reference/mui.md#table-container)

## Cross-reference

- [`component-table.md`](component-table.md)
- [`component-table-pagination.md`](component-table-pagination.md)
