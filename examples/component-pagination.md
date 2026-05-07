# `Pagination` — spec

> Citing Ant Design `Pagination`, MUI `Pagination`, shadcn-ui `pagination`

## Purpose

Lets users navigate large result sets in chunks. Three modes — pick the right one for context:

| Mode | Use |
| --- | --- |
| **Numbered pagination** | Tables, search results, content where users want to know position. |
| **Cursor-based "Load more"** | Feeds, social timelines, infinite content. |
| **Infinite scroll** | Engagement-driven feeds (Instagram, TikTok). See [knowledge/patterns/list-and-feed.md](../knowledge/patterns/list-and-feed.md). |

This spec covers numbered pagination + Load more. Infinite scroll is a list pattern, not a "Pagination component".

## Anatomy — numbered

```
[‹]  [1]  [2]  [3]  4  [5]  ...  [12]  [›]              총 142개
                ↑ active                  Page size: [20 ▾]   (1–20 of 142)
```

| Slot | Required | Notes |
| --- | --- | --- |
| Previous (‹) | yes | Disabled on page 1 |
| Page numbers | yes | Subset shown with ellipsis for many pages |
| Next (›) | yes | Disabled on last page |
| Page size selector | optional | Common in tables, rare in mobile |
| Total count display | optional | "총 142개" / "1–20 of 142" |
| Jump to page | optional | Input field to type a page number (desktop only) |

## API

```tsx
<Pagination
  page={currentPage}
  pageSize={20}
  total={142}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
  pageSizeOptions={[10, 20, 50, 100]}
  showTotal
  showJumper
  siblingCount={1}
  boundaryCount={1}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | `number` | — | Current page (1-indexed) |
| `pageSize` | `number` | `20` | Items per page |
| `total` | `number` | — | Total item count (server-provided) |
| `onPageChange` | `(page: number) => void` | — | Fires on navigation |
| `onPageSizeChange` | `(size: number) => void` | — | Fires on size change |
| `pageSizeOptions` | `number[]` | `[10, 20, 50, 100]` | Options in size selector |
| `showSizeChanger` | `boolean` | `true` | Show page size dropdown |
| `showTotal` | `boolean` | `true` | Show total count |
| `showJumper` | `boolean` | `false` | Show "go to page X" input (desktop only) |
| `siblingCount` | `number` | `1` | Pages shown on each side of current (e.g., 4 [5] 6) |
| `boundaryCount` | `number` | `1` | Pages always shown at start/end (e.g., [1] ... [12]) |
| `simple` | `boolean` | `false` | Compact mobile mode: just `< 5/12 >` |

## Numbered display algorithm

For `total=142, pageSize=20, currentPage=5, siblingCount=1, boundaryCount=1`:

```
[‹]  [1]  ...  [4]  [5]  [6]  ...  [8]  [›]
       ↑boundary  ↑siblings   ↑boundary
```

Pages: `1, ..., 4, 5, 6, ..., 8`.

When near the start: `[1] [2] [3] [4] ... [8]`.
When near the end: `[1] ... [5] [6] [7] [8]`.
When few pages (≤ 7): show all without ellipsis.

## Variants

### `simple` mode (mobile)

```
[‹]  5 / 12  [›]
```

Just prev/next + position display. Avoids cramped numbered buttons on mobile.

### Compact (no size changer, no total)

```
[‹]  [1]  [2]  [3]  ...  [12]  [›]
```

For minimal UIs where the count and page size are not user-relevant.

### Load more variant

```
... existing items ...
[Load more (122 remaining)]
```

Single button at the bottom of the list. Replaces numbered pagination for feed-like content.

## States

| State | Visual |
| --- | --- |
| Default page button | Border `--color-border-default`, text `--color-text-primary` |
| Hover | Border `--color-border-strong`, bg `--color-bg-subtle` |
| Active (current page) | Background `--color-primary-default`, text `--color-on-primary` |
| Disabled (prev on page 1, next on last) | Opacity 0.4, no events |
| Focus-visible | 2px ring |

## Sizes

| Size | Button height | Font |
| --- | --- | --- |
| `sm` | 28px | 13px |
| `md` (default) | 32px | 14px |
| `lg` | 40px | 16px |

## Tokens consumed

```
--color-bg-default
--color-bg-subtle           (hover)
--color-primary-default     (active page bg)
--color-on-primary          (active page text)
--color-text-primary
--color-text-secondary      (disabled)
--color-border-default
--color-border-strong
--color-focus-ring
--space-xs, --space-sm
--radius-md                 (button corners) or radius-full (pill style)
--font-size-sm
```

## Accessibility

- `<nav role="navigation" aria-label="Pagination">` wraps the controls.
- Each page button is a `<button>` (or `<a href="?page=N">` for crawlable pages).
- Current page: `aria-current="page"` on the button. Don't use `disabled` on the current page — the user might want to click it (no-op, but accessible).
- Previous/Next buttons:
  - `aria-label="이전 페이지"` / `"다음 페이지"`
  - `disabled` when at boundary
- Page size selector: standard Select with `aria-label="페이지당 항목 수"`.
- Total count: live region `aria-live="polite"` so screen reader announces when it changes (e.g., after filtering).

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reach individual buttons in order |
| `Enter` / `Space` | Activate focused button |
| Arrow keys | NOT used — user tabs through |

## URL sync (highly recommended)

Pagination should sync to URL:

```
/transactions?page=5&size=20
```

Benefits:
- Browser back/forward works.
- Shareable links to specific pages.
- Refresh preserves position.
- SEO: search crawlers see all pages.

Implementation: read from `useSearchParams` in React Router / Next.js. Update query on `onPageChange`.

## Korean copy

| English | Korean |
| --- | --- |
| Previous | 이전 |
| Next | 다음 |
| First | 처음 |
| Last | 마지막 |
| Page X of Y | X 페이지 / 총 Y 페이지 |
| Go to page | 페이지로 이동 |
| 1–20 of 142 | 142개 중 1–20 |
| Items per page | 페이지당 항목 수 |
| Show N | N개씩 보기 |

## Edge cases

- **Only 1 page**: hide pagination entirely. Don't render an empty navigation.
- **Empty results**: render the empty state instead of page 1 with no items.
- **Invalid page in URL**: clamp to valid range (`?page=999` with 12 pages → page 12). Surface to user with a toast: "페이지 999는 존재하지 않아 마지막 페이지로 이동했습니다".
- **Page size change reset**: when user changes page size, reset to page 1 (otherwise, current page might no longer exist).
- **Filter change reset**: when filters change, reset to page 1.
- **Server returns total=null** (cursor pagination, unknown total): use Load More variant instead.
- **Very large totals (10,000+ pages)**: jumper input is essential. Numbered pagination becomes unwieldy past ~100 pages.
- **Fast-clicking through pages**: debounce 100ms or cancel previous request on new click. Don't blast 5 requests.

## Don't

- Don't show "Page 1 of 1" — hide the component.
- Don't disable the active page button. Use `aria-current` instead.
- Don't put pagination ABOVE the list. Always below (and optionally also above for very long pages, like > 50 items per page).
- Don't auto-scroll to top on page change. Let the user choose. (Exception: if pagination is far below the fold, auto-scroll **into view** is OK.)
- Don't combine numbered pagination + infinite scroll.
- Don't lose scroll position on page change for inline tables (where pagination is at the table footer).

## References

- Ant Design: [`refs/ant-design/components/pagination/`](../refs/ant-design/components/pagination/) — most exhaustive: `simple`, `total`, `showSizeChanger`, `showJumper`, `itemRender`, `disabled`, `responsive`. Common in admin tables.
- MUI: [`refs/mui/packages/mui-material/src/Pagination/`](../refs/mui/packages/mui-material/src/Pagination/) — `Pagination` + `PaginationItem`. Cleaner API, fewer features.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/pagination.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/pagination.tsx) — primitive only (`Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`). Compose for behavior. **No built-in pagination logic** — pair with TanStack Table or your own state.

API choices made:
- **`siblingCount` and `boundaryCount` exposed**: lets the consumer tune the numbered display algorithm without overriding rendering.
- **`simple` mode** for mobile: separate concept, not just CSS — different ARIA semantics (a single button group with status text vs. a list of page buttons).
- **`showJumper` opt-in, off by default**: useful for power users (admin, analytics), noise for consumers.
- **No `itemRender` prop** (Ant has it): too much surface area. If you need custom rendering, compose `PaginationItem` manually.

## Cross-reference

- [examples/component-table.md](component-table.md) — pagination at the table footer
- [knowledge/patterns/list-and-feed.md](../knowledge/patterns/list-and-feed.md) — Load More vs infinite scroll vs pagination
