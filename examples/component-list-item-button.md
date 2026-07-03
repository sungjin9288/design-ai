# `ListItemButton` — spec

> Synthesized from MUI `ListItemButton`. The clickable variant of `ListItem`. Use this whenever a list row should respond to clicks (settings, nav, picker). Without it, `ListItem` is just a structural container.

## When to use

- Settings rows ("계정 정보", "알림 설정").
- Nav lists in drawers / sidebars.
- Picker / chooser rows where the row itself is the selection target.
- ANY list row with a primary click action.

## Anatomy

```
┌──────────────────────────────────────────────────┐
│ [icon]  Primary text          [trailing icon]    │
│         Secondary text                           │
└──────────────────────────────────────────────────┘
        ─ entire row is the click target ─
```

For rows with a *separate* trailing action (button), wrap `ListItemButton` inside `ListItem` and put the action in `secondaryAction` (which sits outside the button's hit area).

## API

```tsx
<List>
  <ListItem disablePadding>
    <ListItemButton selected={current === 'profile'} onClick={() => navigate('/profile')}>
      <ListItemIcon><PersonIcon /></ListItemIcon>
      <ListItemText primary="프로필" secondary="이름, 이메일, 사진" />
    </ListItemButton>
  </ListItem>
</List>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Usually `ListItemIcon` + `ListItemText` + optional trailing icon |
| `selected` | `boolean` | `false` | Highlighted (current/active item in nav) |
| `disabled` | `boolean` | `false` | Non-interactive; greyed |
| `dense` | `boolean` | `false` | Reduce vertical padding |
| `divider` | `boolean` | `false` | Bottom divider line |
| `onClick` | `(e) => void` | — | Click handler |
| `href` | `string` | — | Renders as `<a>` (use for nav lists) |
| `component` | `ElementType` | `'div'` | Override element (e.g., `Link` from react-router) |
| `disableRipple` | `boolean` | `false` | Skip the click-ripple effect |

## States

| State | Visual |
| --- | --- |
| Default | transparent bg, fg-default |
| Hover | bg-subtle |
| Focus-visible | bg-subtle + 2px focus ring inset |
| Active | bg-pressed |
| Selected | bg-selected (~ brand-50/dark mode brand-900-30%), fg-on-selected |
| Selected + hover | bg-selected-hover (slight shift) |
| Disabled | reduced opacity, no hover effect |

## Tokens consumed

```
--list-item-min-height-44      /* default touch target */
--list-item-min-height-36      /* dense */
--color-bg-default
--color-bg-subtle              /* hover */
--color-bg-pressed             /* active */
--color-bg-selected            /* selected */
--color-fg-default
--color-fg-on-selected
--space-md                     /* horizontal padding */
--motion-duration-100          /* hover/active transition */
```

## Accessibility

- Default semantic: `<div role="button">` with `tabIndex=0`. With `href`: renders `<a>` (preferred for nav).
- `selected={true}` → `aria-selected="true"`. For nav lists also add `aria-current="page"` when the row matches the current route.
- Keyboard: Enter / Space activates. Disabled rows skipped in tab order.
- Touch target: ≥ 44pt mobile (default 48px). Don't use `dense` on mobile primary nav.
- Cite [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md).

## Edge cases

- **Long primary text** — wraps to 2 lines, then ellipsis. For nav rows, prefer concise labels.
- **`href` + `onClick`** — `onClick` fires before navigation; useful for analytics.
- **Inside React Router** — pass `component={RouterLink}` + `to="/path"` for SPA-style nav (no full page reload).
- **Selected without persistence** — `selected` is for the *current* item. For multi-select (checkbox lists), use `Checkbox` inside the row instead of `selected`.
- **Korean labels** — slightly more vertical padding looks less cramped (Hangul reads taller). Default 48px row height works; resist `dense` for Korean nav.

## Code example

```tsx
function SettingsNav({ section }: { section: string }) {
  const items = [
    { id: 'profile', label: '프로필', icon: <PersonIcon /> },
    { id: 'notifications', label: '알림 설정', icon: <BellIcon /> },
    { id: 'privacy', label: '개인정보', icon: <LockIcon /> },
    { id: 'billing', label: '결제 정보', icon: <CardIcon /> },
  ];

  return (
    <List component="nav" aria-label="설정">
      {items.map((it) => (
        <ListItem key={it.id} disablePadding>
          <ListItemButton
            component={Link}
            to={`/settings/${it.id}`}
            selected={section === it.id}
          >
            <ListItemIcon>{it.icon}</ListItemIcon>
            <ListItemText primary={it.label} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}
```

## Don't

- Don't use `ListItemButton` outside a `ListItem` parent — semantics break.
- Don't make the entire `ListItem` clickable via `onClick` on `ListItem` — wrap the inner content in `ListItemButton` so secondary actions stay separately focusable.
- Don't combine `ListItemButton` with form controls (Checkbox, Switch) inside the same clickable area — a click on the form control conflicts with the row click.
- Don't override `selected` styling without keeping enough contrast (`color-bg-selected` should be ≥ 3:1 against `color-bg-default`).

## References

- MUI: [`ListItemButton`](../docs/reference/mui.md#list-item-button)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- [`component-list-item.md`](component-list-item.md) — structural container
- [`component-list-item-text.md`](component-list-item-text.md)
- [`component-list-item-icon.md`](component-list-item-icon.md)
- [`knowledge/patterns/list-and-feed.md`](../knowledge/patterns/list-and-feed.md)
