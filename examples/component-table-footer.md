# `TableFooter` — spec

> Synthesized from MUI `TableFooter`. The container for footer rows in a `Table` — totals, summaries, or pagination. Renders `<tfoot>`.

## When to use

- Tables with totals/subtotals row (sum of an amount column).
- Tables with `TablePagination` rendered inside the table (rather than below).

## API

```tsx
<Table>
  <TableHead>...</TableHead>
  <TableBody>...</TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colSpan={2}>합계</TableCell>
      <TableCell align="right">{total.toLocaleString('ko-KR')}원</TableCell>
    </TableRow>
  </TableFooter>
</Table>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | `TableRow` (typically one) |
| `component` | `ElementType` | `'tfoot'` | Override |

## Accessibility

- `<tfoot>` semantics communicate "summary row" to screen readers.
- For totals: the row label cell uses `scope="row"` so the total cell is properly associated.

## Edge cases

- **Multiple footer rows** — fine; common for layered summaries (subtotal, tax, total).
- **Korean total labels** — "합계", "총액", "소계 / 부가세 / 합계" — keep in 합쇼체 or noun-form.

## Code example

```tsx
<TableFooter>
  <TableRow>
    <TableCell colSpan={2} scope="row">소계</TableCell>
    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {subtotal.toLocaleString('ko-KR')}원
    </TableCell>
  </TableRow>
  <TableRow>
    <TableCell colSpan={2} scope="row">부가세 (10%)</TableCell>
    <TableCell align="right">{tax.toLocaleString('ko-KR')}원</TableCell>
  </TableRow>
  <TableRow sx={{ '& td': { fontWeight: 600 } }}>
    <TableCell colSpan={2} scope="row">합계</TableCell>
    <TableCell align="right">{total.toLocaleString('ko-KR')}원</TableCell>
  </TableRow>
</TableFooter>
```

## Don't

- Don't use as a wrapper for non-summary rows (filters, etc.) — that's a sibling component, not the footer.

## References

- MUI: [`TableFooter`](../refs/mui/packages/mui-material/src/TableFooter/)

## Cross-reference

- [`component-table.md`](component-table.md)
- [`component-table-row.md`](component-table-row.md)
