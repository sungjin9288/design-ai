# `Table` — spec

> Citing Ant Design `Table`, MUI `DataGrid` / `Table`, shadcn-ui `data-table` (TanStack Table)

## Purpose

Displays multi-column data for comparison and analysis. Optimized for desktop. On mobile, **most tables should become stacked card lists** — see edge cases.

When NOT to use: single-attribute lists (use `List`); items where each row is a self-contained card (use card list).

## Anatomy

```
[Toolbar?]              search · filter · density · column-toggle · export
┌──────────────────────────────────────────────────────────────────────┐
│ ☐  Header 1 ▾    Header 2     Header 3 ▾                  Actions ▾ │  ← sticky
├──────────────────────────────────────────────────────────────────────┤
│ ☐  cell 1.1      cell 1.2     cell 1.3                    [...]     │
│ ☐  cell 2.1      cell 2.2     cell 2.3                    [...]     │
│ ─────────────────────────────────────────────────────────────────── │
│   ...                                                                │
└──────────────────────────────────────────────────────────────────────┘
[Footer]                  selected count · pagination · summary
```

## API (TanStack Table-flavored, framework-agnostic)

```tsx
<Table
  columns={[
    { id: "name", header: "이름", accessor: (row) => row.name, sortable: true, width: 180 },
    { id: "email", header: "이메일", accessor: (row) => row.email, width: 220 },
    { id: "amount", header: "금액", accessor: (row) => row.amount, sortable: true, align: "right", cell: (v) => formatKRW(v) },
    { id: "actions", header: "", cell: (_, row) => <ActionsMenu row={row} />, width: 64 },
  ]}
  data={data}
  selectable
  onSelectionChange={setSelection}
  sortBy={sort}
  onSortChange={setSort}
  pagination={{ pageSize: 20, total, onChange: setPage }}
  density="md"
  emptyState={<EmptyState />}
  loading={isPending}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | `Column[]` | — | Column definitions |
| `data` | `T[]` | `[]` | Row data |
| `selectable` | `boolean` | `false` | Adds checkbox column |
| `sortable` | per-column | — | Click header to toggle asc/desc/none |
| `pagination` | `{ pageSize, total, onChange }` | — | Server or client pagination |
| `density` | `"compact" \| "md" \| "comfortable"` | `"md"` | Row height |
| `stickyHeader` | `boolean` | `true` | Header pins on scroll |
| `loading` | `boolean` | `false` | Skeleton rows |
| `emptyState` | `ReactNode` | default | Replaces tbody when `data.length === 0` |
| `onRowClick` | `(row) => void` | — | Drill into detail. Doesn't conflict with checkbox. |
| `getRowId` | `(row) => string` | `row.id` | For React keys + selection |

### Column definition

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | — | Stable key for sort/visibility |
| `header` | `ReactNode` | — | Header content |
| `accessor` | `(row) => any` | `row[id]` | How to extract the value |
| `cell` | `(value, row) => ReactNode` | `value as string` | How to render |
| `sortable` | `boolean` | `false` | |
| `align` | `"left" \| "right" \| "center"` | `"left"` | Right for numbers/amounts |
| `width` | `number \| string` | auto | Fixed or `min-content`/`1fr` |
| `sticky` | `"left" \| "right"` | — | Pin column for horizontal scroll (e.g., name on left, actions on right) |

## Density

| Density | Row height | Use |
| --- | --- | --- |
| `compact` | 32px | Power user, > 100 rows visible |
| `md` (default) | 40px | Standard product table |
| `comfortable` | 48px | Marketing pages, fewer rows |

User-facing density toggle in toolbar is common. Persist preference to localStorage.

## Sort

- Header click cycles: `asc` → `desc` → `none`.
- Visual: arrow indicator, `▲` asc / `▼` desc / muted both when none.
- One-column at a time by default. Multi-sort via `Shift+click` (desktop power users). Document in tooltip.
- Server-side sort: re-fetch on change. Client-side: just re-render.

## Selection

- Checkbox column on far left.
- "Select all" checkbox in header. Three states: unchecked / partial / checked.
- "Select all 142" affordance when paginated: "All 20 on this page selected. **[Select all 142]**" — clarifies vs. "select all visible".
- Bulk actions appear in a contextual bar that **replaces the toolbar** when selection > 0:

  ```
  ┌─────────────────────────────────────────────────────┐
  │  3 selected   [Archive] [Delete] [Export] · ✕       │
  └─────────────────────────────────────────────────────┘
  ```

## Pagination

See [examples/component-pagination.md](component-pagination.md) for the standalone Pagination spec.

For tables: footer-mounted, right-aligned. Show "1–20 of 142" + page controls + page size selector.

## Empty / loading / error

- **Loading first paint**: render header + 5 skeleton rows.
- **Loading after data exists** (refetch): show subtle progress in header, keep stale data visible.
- **Empty**: full-row span: illustration + "데이터가 없어요" + optional CTA.
- **Error**: full-row span: error icon + message + retry. Cite [knowledge/patterns/list-and-feed.md](../knowledge/patterns/list-and-feed.md).

## Accessibility

- Use semantic `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`. Don't fake with `<div>` unless absolutely necessary (and then use `role="table"` etc.).
- `<th scope="col">` on column headers, `<th scope="row">` on row labels.
- For sortable columns: `aria-sort="ascending" | "descending" | "none"` on `<th>`.
- Keyboard: arrow keys move focus across cells; Enter/Space activates header (sort) or cell (if interactive).
- Screen reader: announce row/column count on table render. Announce sort change.
- Selection: each checkbox has a label like "Select row for 김민지".
- Bulk action bar: `role="region" aria-label="Bulk actions"`.

## Mobile — break to cards

A 5-column table is unusable on a 375px screen. Two approaches:

### 1. Card list

Below `md` breakpoint, render as a card per row:

```
┌────────────────────────────────────┐
│ 김민지                              │
│ minji@example.com                   │
│                                    │
│ 결제: ₩45,000                       │
│ 상태: 완료                           │
│                                    │
│              [상세 보기]   [더보기 ⋮] │
└────────────────────────────────────┘
```

Each card shows the same data as a row but vertically. The "primary" column (name) becomes the heading.

### 2. Horizontal scroll

Keep the table but enable horizontal scroll. **Pin** the first column (name) so it stays visible.

Pick #1 for product UIs, #2 for power-user data tools.

## Tokens consumed

```
--color-bg-default
--color-bg-elevated         (sticky header background)
--color-bg-subtle           (zebra rows or hover)
--color-border-default
--color-text-primary
--color-text-secondary
--color-primary-default     (selected row indicator)
--space-md, --space-base
--font-size-sm, --font-size-base
```

## Edge cases

- **Long text in cells**: truncate to 1 line with `…`, `title` attr for full. Optionally allow row expansion to wrap.
- **Numeric columns**: right-align, tabular numerals. See [knowledge/patterns/money-and-amount.md](../knowledge/patterns/money-and-amount.md).
- **Sticky columns + horizontal scroll**: pin the leftmost (name/identifier) and the rightmost (actions). Middle columns scroll.
- **Frozen header on tall tables**: use CSS `position: sticky` on `<thead>`. Not `<table>` height tricks.
- **Click row to drill in vs. interactive controls in cells**: `onClick` on the row, but `e.stopPropagation()` on inner buttons (checkbox, menu). Or use the block-link pattern from [examples/component-card.md](component-card.md).
- **CSV export**: include the export button in the toolbar; prefer client-side generation for ≤ 10K rows, server-generated download for larger.

## Don't

- Don't use a Table for a 1-column list. Use a List.
- Don't auto-update sort/filter on every keystroke in toolbar inputs — debounce 300ms.
- Don't paginate to "1, 2, 3, ..., 142, last" as the only nav. Provide page-size + jump-to-page.
- Don't allow horizontal scroll on mobile by default — user expects vertical-only.
- Don't put primary CTAs in cells unless the row is the action target (e.g., "Approve" per row in an admin queue).

## References

- Ant Design: [`refs/ant-design/components/table/`](../refs/ant-design/components/table/) — most exhaustive: tree data, expandable rows, virtual scroll, drag-drop column reorder, fixed headers/columns. Heavy but production-grade.
- MUI: `<Table>` (basic) and `<DataGrid>` (heavy, paid for some features). DataGrid has best DX for filtering/sorting but is a large dep.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/table.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/table.tsx) — primitives only (`<Table>`, `<TableHeader>`, etc.). Pair with TanStack Table for behavior. **Recommended modern pattern.**

API choices made:
- **TanStack Table as the engine** — headless, framework-agnostic, free, mature. Don't reinvent.
- **Sort/filter state controlled** by default — server-side pagination is the common case.
- **Mobile fallback as a designed escape hatch** (card list) rather than horizontal scroll.

## Cross-reference

- [knowledge/patterns/list-and-feed.md](../knowledge/patterns/list-and-feed.md)
- [knowledge/patterns/money-and-amount.md](../knowledge/patterns/money-and-amount.md) — amount columns
- [examples/component-pagination.md](component-pagination.md) — table footer pagination
