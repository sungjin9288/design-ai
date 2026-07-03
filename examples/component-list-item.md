# `ListItem` — spec

> Synthesized from MUI `ListItem`. The single-row primitive used inside `List`. For interactive rows that respond to clicks, use [`component-list-item-button.md`](component-list-item-button.md) — `ListItem` itself is the structural container.

## When to use

- One row inside a `<List>`.
- Pure-display rows (text + secondary action button on the right).
- For *clickable rows* (the common case in settings / nav lists), use `ListItemButton` as the child.

## Anatomy

```
┌──────────────────────────────────────────────────┐
│ [icon/avatar]  Primary text          [secondary] │
│                Secondary text                    │
└──────────────────────────────────────────────────┘
```

Slots: leading icon/avatar (optional), text block (`ListItemText`), trailing secondary action (`ListItemSecondaryAction`).

## API

```tsx
<List>
  <ListItem secondaryAction={<IconButton><DeleteIcon /></IconButton>}>
    <ListItemAvatar><Avatar /></ListItemAvatar>
    <ListItemText primary="이름" secondary="설명" />
  </ListItem>
</List>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Primary content; usually `ListItemText` + optional avatar/icon |
| `disablePadding` | `boolean` | `false` | Remove default vertical padding (use when child is `ListItemButton`) |
| `secondaryAction` | `ReactNode` | — | Right-anchored action area; not part of the row's clickable surface |
| `disableGutters` | `boolean` | `false` | Remove horizontal padding |
| `dense` | `boolean` | `false` | Reduce vertical padding (settings / dense nav lists) |
| `divider` | `boolean` | `false` | Bottom divider line |

## States

`ListItem` itself is non-interactive. Interactivity comes from a `ListItemButton` child:

| State (on inner button) | Visual |
| --- | --- |
| Default | transparent bg, fg-default |
| Hover | bg-subtle |
| Focus-visible | 2px focus ring inset; cite [keyboard-and-focus.md](../knowledge/a11y/keyboard-and-focus.md) |
| Active | bg-pressed |
| Selected | bg-selected, fg-on-selected |
| Disabled | reduced opacity |

## Tokens consumed

```
--color-bg-default
--color-fg-default
--space-sm        /* dense */
--space-md        /* default */
--list-row-min-height-44
--color-divider
```

## Accessibility

- Semantic element: `<li>` (default).
- For navigable list with selection, use `role="list"` on the parent and `aria-current="page"` on the selected item.
- `secondaryAction` must be a separately-focusable control with its own accessible name (otherwise it merges into the row's tab stop and is unreachable).
- Touch target: ≥ 44pt for mobile lists.

## Edge cases

- **Long primary text** — wraps to 2 lines, then ellipsis.
- **`ListItemButton` child + `secondaryAction`** — the secondary action is OUTSIDE the button's hit area. Functionally critical for screen-reader nav.
- **Korean text density** — Hangul reads ~10% wider than Latin. Test with realistic Korean copy.

## Code example

```tsx
<List>
  {users.map((u) => (
    <ListItem
      key={u.id}
      secondaryAction={
        <IconButton edge="end" aria-label={`${u.name} 삭제`}>
          <DeleteIcon />
        </IconButton>
      }
      disablePadding
    >
      <ListItemButton onClick={() => select(u.id)}>
        <ListItemAvatar><Avatar src={u.avatarUrl} /></ListItemAvatar>
        <ListItemText primary={u.name} secondary={u.role} />
      </ListItemButton>
    </ListItem>
  ))}
</List>
```

## Don't

- Don't make the entire `ListItem` clickable via `onClick`; wrap inner content in `ListItemButton` so secondary action stays separately focusable.
- Don't put 3+ controls inside `secondaryAction` — overflow into a menu.

## References

- MUI: [`ListItem.d.ts`](../docs/reference/mui.md#list-item)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- [`component-list-item-button.md`](component-list-item-button.md)
- [`component-list-item-text.md`](component-list-item-text.md)
- [`knowledge/patterns/list-and-feed.md`](../knowledge/patterns/list-and-feed.md)
