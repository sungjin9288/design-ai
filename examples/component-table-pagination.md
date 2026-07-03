# `TablePagination` — spec

> Synthesized from MUI `TablePagination`. The pagination controls for a `Table` — page size selector + page navigation + total count display. Sits in `TableFooter` or below the table container.

## When to use

- Tables with > 25 rows where users need to navigate pages.
- For client-side pagination of small datasets, prefer `Pagination` component (decoupled from Table).

## When NOT to use

- Infinite-scroll feeds → use `Load More` button or auto-load on scroll. Cite [`knowledge/patterns/list-and-feed.md`](../knowledge/patterns/list-and-feed.md).
- Single-page tables → no pagination control.

## Anatomy

```
┌────────────────────────────────────────────────────────┐
│  Rows per page: [10 ▼]   1-10 of 234   [<] [>] [>>]    │
└────────────────────────────────────────────────────────┘
```

## API

```tsx
<TablePagination
  component="div"
  count={total}
  page={page}
  onPageChange={(_, newPage) => setPage(newPage)}
  rowsPerPage={pageSize}
  onRowsPerPageChange={(e) => {
    setPageSize(parseInt(e.target.value, 10));
    setPage(0);
  }}
  rowsPerPageOptions={[10, 25, 50, 100]}
  labelRowsPerPage="페이지당 행"
  labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 전체 ${count}`}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `count` | `number` | required | Total row count |
| `page` | `number` | required | Current page (0-indexed) |
| `onPageChange` | `(e, page) => void` | required | Page change handler |
| `rowsPerPage` | `number` | required | Current page size |
| `onRowsPerPageChange` | `(e) => void` | — | Page-size change handler |
| `rowsPerPageOptions` | `number[]` | `[10, 25, 50, 100]` | Page-size options (or `[]` to hide selector) |
| `labelRowsPerPage` | `ReactNode` | `'Rows per page:'` | Selector label |
| `labelDisplayedRows` | `({ from, to, count }) => ReactNode` | — | Range label formatter |
| `showFirstButton` / `showLastButton` | `boolean` | `false` | Show first/last page jumps |
| `component` | `ElementType` | `'td'` | Override (use `'div'` outside Table footer) |
| `SelectProps` | `SelectProps` | — | Customize the page-size Select |
| `getItemAriaLabel` | `(type) => string` | — | Customize button aria-labels |

## States

| State | Visual |
| --- | --- |
| First page | Previous button disabled |
| Last page | Next button disabled |
| All pages fit on one | Pagination collapses; only count shows |

## Tokens consumed

```
--table-pagination-min-height-52
--font-size-body
--space-md
```

## Accessibility

- Buttons have `aria-label` (Previous/Next/First/Last). Localize via `getItemAriaLabel`.
- The page-size Select needs an associated label — `labelRowsPerPage` provides it.
- Korean: provide `labelDisplayedRows` formatter that uses Korean range syntax: `1-10 / 전체 234`.
- Announce page changes via `aria-live="polite"` if context requires (e.g., screen reader users navigating large tables).

## Edge cases

- **`count={-1}` (unknown total)** — pagination shows "1-10 of more than 10" (with `labelDisplayedRows` returning that string). Useful for cursor-based APIs.
- **Korean pluralization** — there's none in Korean; "1 결과" and "234 결과" both fine. Don't try to pluralize.
- **Mobile narrow** — buttons + Select can wrap awkwardly. Consider hiding `rowsPerPageOptions` on mobile (`rowsPerPageOptions={[]}`).

## Code example

```tsx
function EmployeesTable() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const { data, total } = useEmployees({ page, pageSize });

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>...</TableHead>
          <TableBody>
            {data.map((emp) => <EmployeeRow key={emp.id} {...emp} />)}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => {
          setPageSize(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelRowsPerPage="페이지당 행"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 전체 ${count}`}
      />
    </Paper>
  );
}
```

## Don't

- Don't reset `page` to 0 implicitly when filters change without surfacing the reset to the user (sudden page jumps confuse).
- Don't put 1000+ rows on one page — slow render + bad UX.
- Don't use English labels in a Korean UI.

## References

- MUI: [`TablePagination`](../docs/reference/mui.md#table-pagination)

## Cross-reference

- [`component-table.md`](component-table.md)
- [`component-pagination.md`](component-pagination.md)
- [`knowledge/patterns/list-and-feed.md`](../knowledge/patterns/list-and-feed.md)
