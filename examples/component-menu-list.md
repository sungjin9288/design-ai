# `MenuList` — spec

> Synthesized from MUI `MenuList`. The container that holds `MenuItem` children — handles keyboard navigation (arrow keys, type-ahead, focus trap). When you need a menu without the floating Menu's anchor/popover machinery, use MenuList directly inside your own Paper / Popover.

## When to use

- Custom popover / drawer that should behave like a menu inside.
- Static "all options" page that uses menu-style keyboard nav.
- Inside `Menu` (MUI wraps it for you — direct MenuList use is for the unwrapped case).

## API

```tsx
<Paper>
  <MenuList autoFocusItem>
    <MenuItem onClick={handleProfile}>프로필</MenuItem>
    <MenuItem onClick={handleSettings}>설정</MenuItem>
    <Divider />
    <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
  </MenuList>
</Paper>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | `MenuItem` children (Dividers OK) |
| `autoFocus` | `boolean` | `false` | Focus the menu on mount |
| `autoFocusItem` | `boolean` | `false` | Focus the first item on mount |
| `disabledItemsFocusable` | `boolean` | `false` | Allow focus on disabled items |
| `disableListWrap` | `boolean` | `false` | Don't wrap from last to first item |
| `variant` | `'menu' \| 'selectedMenu'` | `'selectedMenu'` | Menu without selection vs with-selection (focus jumps to selected) |

## States

Layout/keyboard primitive — no own visual states. Children own theirs.

## Tokens consumed

```
--menu-bg
--menu-padding
--menu-min-width
```

## Accessibility

- Renders as `<ul role="menu">` (or `role="listbox"` in some Select variants).
- Arrow Up/Down navigates; Home/End jump to first/last; Esc closes (when inside Menu); Enter activates.
- Type-ahead: typing letters jumps to first MenuItem starting with those letters. Korean Hangul: works via the input characters (not a Korean-specific feature).
- For variant `selectedMenu`: focus moves to the currently-selected item on open (correct UX for picker menus).

## Edge cases

- **No focusable items** — all disabled = focus traps in nowhere. Set `disabledItemsFocusable={true}` so keyboard users can at least navigate.
- **Long menus** — scrollable; keyboard nav scrolls into view automatically.
- **Mixed actions and selections** — distinguish via icon (check for selected, not for action). Keyboard semantics treat both the same.

## Code example

```tsx
<Popover
  open={open}
  anchorEl={anchorEl}
  onClose={handleClose}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
>
  <MenuList autoFocusItem>
    <MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>
      <ListItemIcon><PersonIcon /></ListItemIcon>
      <ListItemText>프로필</ListItemText>
    </MenuItem>
    <MenuItem onClick={() => { navigate('/settings'); handleClose(); }}>
      <ListItemIcon><SettingsIcon /></ListItemIcon>
      <ListItemText>설정</ListItemText>
    </MenuItem>
    <Divider />
    <MenuItem onClick={handleLogout}>
      <ListItemIcon><LogoutIcon /></ListItemIcon>
      <ListItemText>로그아웃</ListItemText>
    </MenuItem>
  </MenuList>
</Popover>
```

## Don't

- Don't use as a plain List — kbd nav semantics differ.
- Don't put non-MenuItem children (random buttons) — keyboard nav breaks.

## References

- MUI: [`MenuList`](../docs/reference/mui.md#menu-list)

## Cross-reference

- [`component-menu-item.md`](component-menu-item.md)
- [`component-menu.md`](component-menu.md) — the wrapping floating menu
- [`component-popover.md`](component-popover.md)
