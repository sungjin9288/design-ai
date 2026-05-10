# `ListItemIcon` — spec

> Synthesized from MUI `ListItemIcon`. The leading-icon slot in a `ListItem` — handles consistent sizing, color, and spacing so icons align across rows.

## When to use

- Leading icons in nav lists (settings, drawer menu).
- Status icons in compact lists (success / warning indicators).
- For trailing icons (chevrons, badges), use `secondaryAction` on `ListItem` instead.

## API

```tsx
<ListItem disablePadding>
  <ListItemButton>
    <ListItemIcon>
      <PersonIcon />
    </ListItemIcon>
    <ListItemText primary="프로필" />
  </ListItemButton>
</ListItem>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | The icon component |

The icon's color and size are controlled by the parent — don't apply explicit `sx={{ color, fontSize }}` unless intentionally diverging.

## States

Inherits from parent button: hover, focus, selected, disabled all cascade. Selected rows get brand-colored icons.

## Tokens consumed

```
--icon-size-md            /* 24px default */
--color-fg-muted          /* default icon color */
--color-fg-on-selected    /* selected state */
--list-icon-min-width     /* 40-56px reserved column */
```

## Accessibility

- Decorative icons get `aria-hidden="true"` (default behavior of MUI icons).
- If the icon is the *only* indicator (no text label), wrap with `<span aria-label="..."/>`.
- Touch target lives on the parent `ListItemButton`, not the icon itself.

## Edge cases

- **Mixed: some rows have icons, some don't** — use `inset={true}` on `ListItemText` for icon-less rows so text columns align.
- **Custom icon size** — overriding via `sx={{ minWidth: ... }}` lets compact lists fit more rows; don't go below 32px on touch.
- **Status icons + text** — pair with `<Stack direction="row" gap={1}>` inside `ListItemText.primary` if both need to be at the text level.

## Code example

```tsx
// Settings nav with status indicators
<List component="nav">
  <ListItem disablePadding>
    <ListItemButton>
      <ListItemIcon><BellIcon color="primary" /></ListItemIcon>
      <ListItemText primary="알림" secondary="3개 안 읽음" />
    </ListItemButton>
  </ListItem>
</List>
```

## Don't

- Don't put text inside `ListItemIcon` — it's sized for icons only.
- Don't skip `ListItemIcon` and put icons in `ListItemText.primary` for icon-led rows — alignment breaks.

## References

- MUI: [`ListItemIcon`](../refs/mui/packages/mui-material/src/ListItemIcon/)

## Cross-reference

- [`component-list-item.md`](component-list-item.md)
- [`component-list-item-text.md`](component-list-item-text.md)
- [`knowledge/icons/curated-sets.md`](../knowledge/icons/curated-sets.md)
