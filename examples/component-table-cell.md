# `TableCell` — spec

> Synthesized from MUI `TableCell`. The single cell inside a `TableRow`. Handles padding density, alignment (number columns right-aligned by convention), header/body semantics via `component`.

## When to use

- Inside every `TableRow` (head, body, footer).
- For every column of tabular data.

## API

```tsx
<TableCell align="right" component="td" padding="normal">
  {row.amount.toLocaleString('ko-KR')}원
</TableCell>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `align` | `'left' \| 'right' \| 'center' \| 'justify' \| 'inherit'` | `'inherit'` | Text alignment |
| `padding` | `'normal' \| 'checkbox' \| 'none'` | `'normal'` | Padding profile (`checkbox` is narrow for selection columns) |
| `size` | `'small' \| 'medium'` | inherited | Density |
| `component` | `ElementType` | `'td'` (body) / `'th'` (head) | Override |
| `scope` | `'col' \| 'row' \| 'colgroup' \| 'rowgroup'` | — | Header scope (use on `<th>` cells) |
| `sortDirection` | `'asc' \| 'desc' \| false` | `false` | Sort indicator |
| `variant` | `'head' \| 'body' \| 'footer'` | derived | Cell role |

## States

`TableCell` itself has no states. Selection / hover / active live on `TableRow`.

## Tokens consumed

```
--table-cell-padding-x-normal   /* 16px */
--table-cell-padding-x-checkbox /* 0 */
--table-cell-padding-y          /* 16px (medium) / 8px (small) */
--color-fg-default
--color-fg-muted               /* head cells */
--color-divider                /* bottom border */
--font-size-body
--font-size-small
--font-weight-semibold         /* head cells */
```

## Accessibility

- Header cells render as `<th>` automatically when inside `<TableHead>`. Add `scope="col"` for column headers (or `scope="row"` for row headers in side-headed tables).
- For sort indicators, use `TableSortLabel` inside the cell — it provides keyboard activation + `aria-sort` on the cell.
- Right-aligned numeric columns: `align="right"` is visual only. Screen readers still read in DOM order.
- Cite [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md).

## Alignment conventions

- **Text columns** → `align="left"` (default in LTR locales).
- **Numeric columns** → `align="right"`.
- **Status / icon columns** → `align="center"`.
- **Action columns (last)** → `align="right"`.
- For Korean tables: same conventions; Korean reads left-to-right.

## Edge cases

- **Long text** — wraps. For ellipsis: wrap inner content in a `Box` with `noWrap` styling, AND set `Tooltip` to surface full text on hover.
- **Numeric tabular alignment** — pair `align="right"` with `font-variant-numeric: tabular-nums` for clean column alignment regardless of digit width.
- **Korean amount cells** — append `원` directly: `12,345원`. Don't put `원` in a separate column (creates layout waste).
- **Empty cells** — render `—` (em-dash) rather than empty; signals "intentionally empty" vs "data not loaded".

## Code example

```tsx
<TableHead>
  <TableRow>
    <TableCell scope="col">이름</TableCell>
    <TableCell scope="col">부서</TableCell>
    <TableCell scope="col" align="right">
      <TableSortLabel
        active={orderBy === 'amount'}
        direction={order}
        onClick={() => handleSort('amount')}
      >
        급여
      </TableSortLabel>
    </TableCell>
    <TableCell scope="col" align="right">상태</TableCell>
  </TableRow>
</TableHead>
<TableBody>
  {employees.map((emp) => (
    <TableRow key={emp.id} hover>
      <TableCell>{emp.name}</TableCell>
      <TableCell>{emp.department}</TableCell>
      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {emp.salary.toLocaleString('ko-KR')}원
      </TableCell>
      <TableCell align="right">
        <Chip label={emp.status} size="small" />
      </TableCell>
    </TableRow>
  ))}
</TableBody>
```

## Don't

- Don't omit `scope` on header cells — accessibility miss.
- Don't put block-level content (`Card`, full forms) inside cells — Tables aren't grid layouts.
- Don't mix `padding="checkbox"` with non-checkbox content — use `padding="none"` for tighter control.

## References

- MUI: [`TableCell`](../docs/reference/mui.md#table-cell)

## Cross-reference

- [`component-table.md`](component-table.md)
- [`component-table-row.md`](component-table-row.md)
- [`component-table-sort-label.md`](component-table-sort-label.md)
- [`component-table-head.md`](component-table-head.md)
