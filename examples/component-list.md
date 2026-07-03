# `List` — spec

> Synthesized from Ant Design `List` and MUI `List` + `ListItem`. The semantic + styled wrapper around a list of `Item` rows. Distinct from `Item` (single row) and `Table` (tabular data).

## When to use

- Vertical stack of similar entities (notifications, files, contacts).
- With pagination, infinite scroll, or filtering.
- When `<ul>` + items need consistent styling + a11y.

When NOT to use:
- Tabular data (use `Table`).
- Single row of actions (use `Toolbar` / `Flex`).
- Heterogeneous content (use composition of `Card`s).

## Anatomy

```
[List header (optional)]
─────────────────────────
[Item 1]
[Item 2]
[Item 3]
─────────────────────────
[List footer (optional, e.g., Load more)]
```

## API

```tsx
<List
  header={<h3>Recent activity</h3>}
  footer={<Button onClick={loadMore}>Load more</Button>}
  loading={loading}
  empty={<Empty description="No activity yet" />}
>
  {activities.map(a => (
    <Item key={a.id}>
      <ItemMedia>
        <Avatar src={a.user.avatar} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{a.user.name}</ItemTitle>
        <ItemDescription>{a.action}</ItemDescription>
      </ItemContent>
    </Item>
  ))}
</List>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `header` | `ReactNode` | — | Sticky header above items |
| `footer` | `ReactNode` | — | Below items (Load more, totals) |
| `loading` | `boolean` | `false` | Show Skeleton instead of items |
| `empty` | `ReactNode` | — | Shown when 0 items |
| `dividers` | `boolean` | `true` | Show separators between items |
| `density` | `"compact" \| "comfortable" \| "relaxed"` | `"comfortable"` | Item padding |
| `as` | `"ul" \| "ol" \| "div"` | `"ul"` | Underlying element |

## States

| State | Visual |
| --- | --- |
| Loading | Skeleton items |
| Empty | `empty` prop content |
| With items | Standard render |
| Error | (handled externally; pass error UI in children) |

## Variants

### With dividers (default)

```
[Item 1]
─────
[Item 2]
─────
[Item 3]
```

### Without dividers (cards spaced)

```
[Item 1]

[Item 2]

[Item 3]
```

Use when items are full Cards with their own boundaries.

### With sections (grouped)

```
Yesterday
─────
[Item 1]
[Item 2]

Last week
─────
[Item 3]
```

Group via wrapping headings + smaller sub-lists.

## Tokens consumed

```
--list-bg
--list-divider
--list-header-bg                   (sticky header bg)
--list-empty-fg
--space-md, --space-lg
--font-size-sm                     (header)
```

## Accessibility

- Use `<ul>` (default) or `<ol>` if order matters.
- Each `<Item>` is `<li>` semantically.
- Header outside `<ul>` (separate element).
- For load-more: announce new items via `aria-live="polite"`.
- Empty state: `role="status"`.

## Pagination + infinite scroll

```tsx
{/* Pagination at bottom */}
<List footer={<Pagination ... />}>...</List>

{/* Infinite scroll (trigger near bottom) */}
<List footer={<InfiniteTrigger onTrigger={loadMore} loading={loadingMore} />}>
  ...
</List>
```

For long lists (1000+ items): virtualize. Use react-virtual or react-virtuoso.

## Code example

```tsx
function NotificationList() {
  const { data, isLoading, error } = useNotifications();

  if (error) return <ErrorState error={error} />;

  return (
    <List
      header={<h2>알림</h2>}
      loading={isLoading}
      empty={
        <EmptyState
          illustration="no-notifications"
          title="알림이 없어요"
          description="새 활동이 있을 때 여기에 표시돼요."
        />
      }
    >
      {data?.map(n => (
        <Item key={n.id} interactive onClick={() => markRead(n.id)}>
          <ItemMedia><n.icon /></ItemMedia>
          <ItemContent>
            <ItemTitle>{n.title}</ItemTitle>
            <ItemDescription>{n.message}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <time>{formatRelative(n.timestamp)}</time>
            {!n.read && <UnreadDot />}
          </ItemActions>
        </Item>
      ))}
    </List>
  );
}
```

## Don't

- Don't use List for tabular data. Use Table.
- Don't omit empty state. Empty list = unclear if loading or really empty.
- Don't render 10,000 items unvirtualized. Performance dies.
- Don't use raw `<ul>` for item-style data. Use List + Item primitives.

## References

- Ant: [`List`](../docs/reference/ant-design.md#list)
- MUI: [`List`](../docs/reference/mui.md#list) + [`ListItem`](../docs/reference/mui.md#list-item)
- HTML5 `<ul>` / `<ol>` / `<li>`

## Cross-reference

- [`examples/component-item.md`](component-item.md) — single row
- [`examples/component-table.md`](component-table.md) — tabular alternative
- [`examples/component-empty-state.md`](component-empty-state.md) — full-page empty
- [`knowledge/patterns/list-and-feed.md`](../knowledge/patterns/list-and-feed.md)
