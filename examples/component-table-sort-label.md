# `TableSortLabel` — spec

> Synthesized from MUI `TableSortLabel`. The clickable sort indicator inside a header `TableCell`. Shows the current sort direction (ascending / descending) + click handler to toggle.

## When to use

- Inside header `TableCell`s of sortable columns.
- For non-sortable columns, render plain text in the TableCell.

## API

```tsx
<TableCell sortDirection={orderBy === 'name' ? order : false}>
  <TableSortLabel
    active={orderBy === 'name'}
    direction={orderBy === 'name' ? order : 'asc'}
    onClick={() => handleSort('name')}
  >
    이름
  </TableSortLabel>
</TableCell>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `active` | `boolean` | `false` | This column is currently sorted |
| `direction` | `'asc' \| 'desc'` | `'asc'` | Sort direction (ignored when not active) |
| `hideSortIcon` | `boolean` | `false` | Hide arrow when not active (cleaner default; arrow appears on hover) |
| `IconComponent` | `ElementType` | `ArrowDownwardIcon` | Custom sort icon |
| `onClick` | `(e) => void` | — | Toggle handler |

## States

| State | Visual |
| --- | --- |
| Default (not active) | Label only; no arrow (or arrow on hover if `hideSortIcon=false`) |
| Active asc | Label + up arrow |
| Active desc | Label + down arrow |
| Hover (any) | Subtle bg + arrow visible |
| Focus-visible | 2px focus ring |

## Tokens consumed

```
--icon-size-sm           /* sort arrow */
--color-fg-default
--color-fg-muted         /* inactive arrow */
--motion-duration-100    /* arrow rotation */
```

## Accessibility

- Renders as `<button>` — keyboard activates with Enter/Space.
- Pair with `TableCell sortDirection={...}` to set `aria-sort` correctly. MUI handles the cell side automatically.
- Korean: arrow direction is universal; the label localizes naturally.

## Edge cases

- **Tri-state sort** (asc → desc → unsorted → asc...) — implement in your `onClick`. MUI doesn't enforce tri-state by default; common is asc ↔ desc.
- **Multi-column sort** — possible but UX-confusing for most adopters. Stick to single-column unless data work warrants it.
- **Default sort** — set initial `orderBy` + `order` state on mount; first render shows the active arrow.

## Code example

```tsx
function SortableHeader({ orderBy, order, onSort }) {
  const cell = (key, label, align = 'left') => (
    <TableCell
      align={align}
      sortDirection={orderBy === key ? order : false}
      scope="col"
    >
      <TableSortLabel
        active={orderBy === key}
        direction={orderBy === key ? order : 'asc'}
        onClick={() => onSort(key)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <TableHead>
      <TableRow>
        {cell('name', '이름')}
        {cell('department', '부서')}
        {cell('hireDate', '입사일', 'right')}
        {cell('salary', '급여', 'right')}
      </TableRow>
    </TableHead>
  );
}
```

## Don't

- Don't put `TableSortLabel` outside a `TableCell` — `aria-sort` won't propagate.
- Don't use for non-sortable columns — confuses users when clicking does nothing.
- Don't omit `aria-label` if the column header is icon-only (pair with `aria-label="정렬: 이름"` or similar).

## References

- MUI: [`TableSortLabel`](../docs/reference/mui.md#table-sort-label)

## Cross-reference

- [`component-table-cell.md`](component-table-cell.md)
- [`component-table-head.md`](component-table-head.md)
