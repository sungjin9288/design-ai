# `ListItemAvatar` — spec

> Synthesized from MUI `ListItemAvatar`. The leading-avatar slot — like `ListItemIcon` but sized for `Avatar` (40px default vs 24px). Used in user/contact lists, message lists, and any row identified by a person/entity image.

## When to use

- User lists (team members, followers).
- Message threads (sender avatar).
- Brand/entity rows with logos.

## API

```tsx
<ListItem secondaryAction={<IconButton><CloseIcon /></IconButton>}>
  <ListItemAvatar>
    <Avatar src={user.avatarUrl} alt={user.name} />
  </ListItemAvatar>
  <ListItemText primary={user.name} secondary={user.role} />
</ListItem>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | An `Avatar` component |

## Tokens consumed

```
--avatar-size-md            /* 40px default */
--list-avatar-min-width     /* 56px reserved column */
--space-md                  /* gap to text */
```

## Accessibility

- `Avatar` should have meaningful `alt` (the person's name) — don't set `alt=""`.
- For image-failed states, MUI's Avatar falls back to initials or generic icon; ensure both are readable.

## Edge cases

- **Status badge** — wrap Avatar in `Badge` for online/unread indicators.
- **Initials fallback** — Korean names use 2-3 character initials (성+이름 first char). Latin: 1-2.
- **Compact lists** — set `Avatar size={32}` and override `ListItemAvatar` `minWidth`.

## Code example

```tsx
<Badge
  overlap="circular"
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  badgeContent={user.online ? <OnlineDot /> : null}
>
  <ListItemAvatar>
    <Avatar src={user.avatarUrl}>{user.name[0]}</Avatar>
  </ListItemAvatar>
</Badge>
```

## Don't

- Don't use for plain icons — use `ListItemIcon` (smaller column).
- Don't omit `alt` on the inner Avatar — failed loads become anonymous gray circles.

## References

- MUI: [`ListItemAvatar`](../docs/reference/mui.md#list-item-avatar)

## Cross-reference

- [`component-list-item.md`](component-list-item.md)
- [`component-avatar.md`](component-avatar.md)
- [`component-list-item-icon.md`](component-list-item-icon.md)
