# `TableBody` — spec

> Synthesized from MUI `TableBody`. The container for data rows in a `Table`. Equivalent to `<tbody>` with consistent styling defaults.

## When to use

- Inside every `Table` that displays data rows.
- For tables with no body (header-only summary), omit.

## API

```tsx
<Table>
  <TableHead>...</TableHead>
  <TableBody>
    {rows.map((row) => (
      <TableRow key={row.id}>
        <TableCell>{row.name}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | `TableRow` children |
| `component` | `ElementType` | `'tbody'` | Override |

## Accessibility

Renders `<tbody>` — semantic role for table body comes for free. No additional ARIA needed.

## Edge cases

- **Empty state** — when `rows.length === 0`, render a single `TableRow` with one `TableCell` spanning all columns containing the empty-state message. Cite [`knowledge/patterns/empty-states.md`](../knowledge/patterns/empty-states.md).
- **Loading state** — show skeleton rows or a single overlay. Don't leave the body empty during fetch — users see a flash.
- **Virtualization** — for 100+ rows, use a virtualized table library (TanStack Virtual + MUI Table). MUI's `TableBody` doesn't virtualize automatically.

## Code example

```tsx
{isLoading ? (
  <TableBody>
    {Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        {columns.map((col) => (
          <TableCell key={col.key}><Skeleton /></TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
) : rows.length === 0 ? (
  <TableBody>
    <TableRow>
      <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
        결과가 없어요
      </TableCell>
    </TableRow>
  </TableBody>
) : (
  <TableBody>
    {rows.map((row) => <TableRow key={row.id}>...</TableRow>)}
  </TableBody>
)}
```

## Don't

- Don't render rows outside `TableBody` (or `TableHead` / `TableFooter`).
- Don't use for content that isn't tabular — Cards / Stacks fit better.

## References

- MUI: [`TableBody`](../docs/reference/mui.md#table-body)

## Cross-reference

- [`component-table.md`](component-table.md)
- [`component-table-row.md`](component-table-row.md)
- [`component-table-cell.md`](component-table-cell.md)
- [`knowledge/patterns/empty-states.md`](../knowledge/patterns/empty-states.md)
