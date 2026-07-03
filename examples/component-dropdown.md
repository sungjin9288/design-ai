# `DropdownMenu` — spec

> Synthesized from Ant Design `Dropdown`, MUI `Menu`, shadcn-ui `dropdown-menu` (Radix). Triggered overlay menu of actions; the canonical "more options" / overflow menu, profile menu, action menu.

## Anatomy

```
┌────────────────────┐
│ [trigger button]   │ ← user clicks
└────────────────────┘
       ↓ opens
       ┌────────────────────┐
       │ ⌃ caret pointing up│
       │ ────────────────── │
       │  Profile         ⌘P│
       │  Settings        ⌘,│
       │ ────────────────── │
       │ ▶ Workspace        │ ← submenu trigger
       │  ────              │
       │  Sign out          │
       └────────────────────┘
```

## API

```tsx
<DropdownMenu>
  <DropdownMenu.Trigger asChild>
    <Button variant="ghost">More ▾</Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item onSelect={handleProfile}>
      Profile
      <DropdownMenu.Shortcut>⌘P</DropdownMenu.Shortcut>
    </DropdownMenu.Item>
    <DropdownMenu.Item onSelect={handleSettings}>Settings</DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger>Workspace</DropdownMenu.SubTrigger>
      <DropdownMenu.SubContent>
        <DropdownMenu.Item>Switch workspace</DropdownMenu.Item>
        <DropdownMenu.Item>Invite members</DropdownMenu.Item>
      </DropdownMenu.SubContent>
    </DropdownMenu.Sub>
    <DropdownMenu.Separator />
    <DropdownMenu.Item destructive onSelect={handleSignOut}>Sign out</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu>
```

## Composition

| Part | Purpose |
| --- | --- |
| `Trigger` | Element that opens the menu (Button, IconButton, etc) |
| `Content` | Menu surface; positioned via floating-ui |
| `Item` | Individual action |
| `CheckboxItem` | Toggleable item with check state |
| `RadioGroup` + `RadioItem` | Mutually exclusive items |
| `Sub` + `SubTrigger` + `SubContent` | Nested submenu |
| `Label` | Section heading (non-interactive) |
| `Separator` | Visual divider |
| `Group` | Logical grouping for screen readers |
| `Shortcut` | Keyboard shortcut hint (visual only; doesn't bind) |

## Item types

```tsx
<DropdownMenu.Item>Standard action</DropdownMenu.Item>

<DropdownMenu.CheckboxItem
  checked={notificationsOn}
  onCheckedChange={setNotificationsOn}
>
  Email notifications
</DropdownMenu.CheckboxItem>

<DropdownMenu.RadioGroup value={theme} onValueChange={setTheme}>
  <DropdownMenu.RadioItem value="light">Light</DropdownMenu.RadioItem>
  <DropdownMenu.RadioItem value="dark">Dark</DropdownMenu.RadioItem>
  <DropdownMenu.RadioItem value="system">System</DropdownMenu.RadioItem>
</DropdownMenu.RadioGroup>
```

## States

| State | Visual |
| --- | --- |
| Closed | Trigger only; menu hidden |
| Opening | Menu fades + scales in (200ms) |
| Open | Menu visible; first item focused |
| Item hover | Bg highlight |
| Item focus (keyboard) | Bg highlight + visible focus ring |
| Item disabled | Reduced opacity, no events, `aria-disabled="true"` |
| Item destructive | Red text + hover |
| Submenu opening | Right-side adjacent panel slides in |
| Closing | Reverse 150ms |

## Positioning

- Default: `bottom-start` (below trigger, left-aligned).
- `align="end"`: right-aligned (common for header avatar menus).
- `side="top"`: above trigger (when near bottom of viewport).
- **Auto-flip**: floating-ui adjusts side / align based on available space.
- **Collision padding**: 8px from viewport edges.
- **Sub-menus**: open to the right by default; flip to left if collision.

## Keyboard contract (WAI-ARIA Menu pattern)

| Key | Action |
| --- | --- |
| `Enter` / `Space` (on trigger) | Open menu, focus first item |
| `↓` / `↑` | Move between items |
| `Home` / `End` | Jump to first / last item |
| `Enter` / `Space` (on item) | Activate; close menu |
| `Esc` | Close; return focus to trigger |
| `Tab` | Close; move to next focusable in document |
| `→` (on submenu trigger) | Open submenu |
| `←` (in submenu) | Close submenu, focus parent item |
| typeahead (letter keys) | Jump to item starting with letter |

## Tokens consumed

```
--color-bg-overlay              (menu bg)
--color-fg-on-overlay           (item text)
--color-bg-overlay-hover        (item hover bg)
--color-fg-emphasis             (selected item)
--color-error-default           (destructive item)
--color-border-overlay
--color-fg-muted                (Shortcut, Label)
--radius-md
--shadow-overlay                (drop shadow)
--space-xs, --space-sm, --space-md
--font-size-sm
--motion-fast                   (open/close)
--ease-out
--z-overlay
```

## Accessibility

- Trigger: `<button>` with `aria-haspopup="menu" aria-expanded="true|false"`.
- Content: `role="menu"`; auto-focuses first item on open.
- Items: `role="menuitem"`; `tabindex="-1"` (managed by parent `roving tabindex`).
- CheckboxItem: `role="menuitemcheckbox"` + `aria-checked`.
- RadioItem: `role="menuitemradio"` + `aria-checked`.
- Separator: `role="separator"`.
- Label: `role="presentation"` (just visual).
- Submenu trigger: `aria-haspopup="menu" aria-expanded`.
- Touch target: each item ≥ 36px tall.
- Don't disable focus outline; brand the ring color but keep visible.

## Tokens for Korean

For Korean menus:
- Menu items in Korean text — Pretendard / NanumSquare; line-height 1.6 for legibility.
- Shortcut display: 한글 keyboards have different keys; show "Cmd / Ctrl" + Latin letter (typing layouts mostly Latin).

## Code example

```tsx
function UserMenu({ user, onSignOut }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <button className="user-menu-trigger" aria-label="사용자 메뉴">
          <Avatar src={user.avatar} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Label>{user.name}</DropdownMenu.Label>
        <DropdownMenu.Item onSelect={() => navigate("/profile")}>
          프로필
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => navigate("/settings")}>
          설정
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item destructive onSelect={onSignOut}>
          로그아웃
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
```

## Edge cases

- **Long item list**: scroll inside menu; cap at ~60% of viewport height.
- **Item label too long**: truncate with ellipsis OR wrap (pick a system-wide rule).
- **Menu opens off-screen on small viewport**: floating-ui auto-flips. Test on mobile.
- **Closing while submenu open**: closes both at once; focus returns to trigger.
- **Disabled state with destructive variant**: still grayed but red tint preserved.
- **Async action inside Item**: don't close menu before action completes; show inline spinner.
- **Right-click context menu**: use `ContextMenu` component, not DropdownMenu.

## Don't

- Don't use DropdownMenu for navigation links — use NavigationMenu.
- Don't pack > 10 items in one menu. Use sections / groups, or move some to a settings page.
- Don't open menu on hover (except submenus). Click-only.
- Don't put inputs inside DropdownMenu (use `Popover` for that — different keyboard model).
- Don't omit `aria-label` on icon-only triggers.
- Don't disable Esc closing — accessibility foundation.

## References

- Ant: [`Dropdown`](../docs/reference/ant-design.md#dropdown)
- MUI: [`Menu`](../docs/reference/mui.md#menu)
- shadcn-ui: [`dropdown-menu`](../docs/reference/shadcn-ui.md#dropdown-menu) (Radix-based)
- WAI-ARIA: [Menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu/)

## Cross-reference

- [`examples/component-context-menu.md`](component-context-menu.md) — right-click variant
- [`examples/component-popover.md`](component-popover.md) — for non-menu floating content
- [`examples/component-command.md`](component-command.md) — for searchable menus
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)
