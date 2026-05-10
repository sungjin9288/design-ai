# `TableRow` — spec

> Synthesized from MUI `TableRow`. A row inside a `Table`. Handles selection state, hover styling, zebra striping. Used for both `<tbody>` rows and `<thead>` header rows.

## When to use

- Inside any `Table` body or head.
- For non-tabular data (cards, lists), don't use TableRow.

## API

```tsx
<TableRow hover selected={isSelected} onClick={() => onSelect(row.id)}>
  <TableCell padding="checkbox">
    <Checkbox checked={isSelected} />
  </TableCell>
  <TableCell>{row.name}</TableCell>
  <TableCell align="right">{row.amount.toLocaleString('ko-KR')}원</TableCell>
</TableRow>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | TableCell children |
| `hover` | `boolean` | `false` | Enable hover bg |
| `selected` | `boolean` | `false` | Selected styling (bg-selected) |
| `onClick` | `(e) => void` | — | Row click handler |

## States

| State | Visual |
| --- | --- |
| Default | transparent / zebra |
| Hover (with `hover`) | bg-subtle |
| Selected | bg-selected (brand-tinted) |
| Focus-visible | 2px ring inset |

## Tokens consumed

```
--table-row-bg
--table-row-bg-zebra
--table-row-bg-hover
--table-row-bg-selected
--table-row-min-height-48
--color-divider
```

## Accessibility

- Renders as `<tr>`. Native semantics handle row/column relationships.
- For selectable rows with `onClick`, also support keyboard (Enter/Space). MUI doesn't add this automatically — wrap in `tabIndex={0}` + onKeyDown handler.
- For selected rows, screen readers announce based on the inner Checkbox state, not `selected` prop.
- Cite [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md).

## Edge cases

- **Whole-row click** — convenient but can conflict with cell-level clicks (link inside, button). Use `e.stopPropagation()` on inner interactives.
- **Korean amount alignment** — `align="right"` on numeric cells; use `font-variant-numeric: tabular-nums` for clean column alignment.
- **Long cell content** — wraps by default; use `noWrap` on Typography or `overflow: hidden` for ellipsis.

## Code example

```tsx
<TableContainer>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox checked={allSelected} onChange={toggleAll} />
        </TableCell>
        <TableCell>이름</TableCell>
        <TableCell>부서</TableCell>
        <TableCell align="right">입사일</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {employees.map((emp) => (
        <TableRow
          key={emp.id}
          hover
          selected={selected.has(emp.id)}
          onClick={() => toggleSelect(emp.id)}
        >
          <TableCell padding="checkbox">
            <Checkbox checked={selected.has(emp.id)} />
          </TableCell>
          <TableCell>{emp.name}</TableCell>
          <TableCell>{emp.department}</TableCell>
          <TableCell align="right">{formatDate(emp.hireDate)}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

## Don't

- Don't put TableRow outside a Table — semantics break.
- Don't use TableRow for card layouts — use Stack / Grid.
- Don't omit a key when mapping.

## References

- MUI: [`TableRow`](../refs/mui/packages/mui-material/src/TableRow/)

## Cross-reference

- [`component-table.md`](component-table.md)
- [`component-table-cell.md`](component-table-cell.md)
- [`component-table-body.md`](component-table-body.md)
- [`component-table-head.md`](component-table-head.md)
