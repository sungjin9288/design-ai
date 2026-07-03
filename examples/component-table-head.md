# `TableHead` — spec

> Synthesized from MUI `TableHead`. The container for header rows in a `Table`. Renders `<thead>` with semibold cell text and `<th>` semantics on inner `TableCell`s.

## When to use

- Every `Table` with column labels (almost all of them).
- For tables with sortable columns, header cells contain `TableSortLabel`.

## API

```tsx
<Table>
  <TableHead>
    <TableRow>
      <TableCell scope="col">이름</TableCell>
      <TableCell scope="col" align="right">금액</TableCell>
    </TableRow>
  </TableHead>
  <TableBody>...</TableBody>
</Table>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | `TableRow` (typically one) |
| `component` | `ElementType` | `'thead'` | Override |

## Accessibility

- `TableCell` children inside `TableHead` automatically render as `<th>`.
- Add `scope="col"` to each header cell — required for screen readers to associate columns with body cells.
- For multi-row headers, use `<TableRow>` siblings inside `TableHead` and `colspan` / `rowspan` on cells.

## Edge cases

- **Sticky header** — set `<TableContainer sx={{ maxHeight: 400 }}>` + `<Table stickyHeader>` to keep headers visible during scroll.
- **Mobile narrow viewport** — Tables don't scale well; switch to card-list layout. Cite [`knowledge/patterns/list-and-feed.md`](../knowledge/patterns/list-and-feed.md).
- **Korean column labels** — keep short (1-3 words). Long labels wrap or truncate; truncated headers are confusing.

## Code example

```tsx
<TableContainer component={Paper} sx={{ maxHeight: 480 }}>
  <Table stickyHeader>
    <TableHead>
      <TableRow>
        <TableCell scope="col">이름</TableCell>
        <TableCell scope="col">부서</TableCell>
        <TableCell scope="col" align="right">
          <TableSortLabel active direction="asc" onClick={onSort}>
            입사일
          </TableSortLabel>
        </TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {employees.map((emp) => <EmployeeRow key={emp.id} {...emp} />)}
    </TableBody>
  </Table>
</TableContainer>
```

## Don't

- Don't omit `scope="col"` — accessibility miss.
- Don't put body rows inside `TableHead`.
- Don't style header cells with body-cell typography — keep semibold semantic distinction.

## References

- MUI: [`TableHead`](../docs/reference/mui.md#table-head)

## Cross-reference

- [`component-table.md`](component-table.md)
- [`component-table-cell.md`](component-table-cell.md)
- [`component-table-sort-label.md`](component-table-sort-label.md)
