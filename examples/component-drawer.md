# `Drawer` — spec

> Citing Ant Design `Drawer`, MUI `Drawer`, shadcn-ui `sheet` (which the Modal spec covers as Sheet variant)

## Purpose

A panel that slides in from a screen edge, covering part of the page. Used for navigation menus, edit panels, filters, and detail-without-leaving-context.

This is **different from Modal** — a modal centers and blocks; a drawer slides from an edge and can be dismissed by clicking outside or swiping.

In shadcn-ui, this primitive is called "Sheet" — see [`examples/component-modal.md`](component-modal.md) which treats Sheet as a variant of Modal. This spec covers the **navigation drawer** specifically: persistent or persistent-in-context navigation panels, distinct from one-shot edit sheets.

## When Drawer vs Modal vs Sheet

| Pattern | Use |
| --- | --- |
| **Drawer** (this spec) | Persistent or repeatedly-accessed navigation panel. Slides from screen edge. May be persistent (visible always above tablet width). |
| **Sheet / Modal** (see modal spec) | One-shot edit / form / decision. Slides in for one task, dismisses. |
| **Popover** | Small, attached to a trigger element. |

The line: a Drawer often holds the app's secondary navigation (sidebar). A Sheet holds a one-time interaction.

## Anatomy

```
┌─────────┬──────────────────────────────────────┐
│  Drawer │                                       │
│         │                                       │
│  ──     │   Main content                        │
│  Nav 1  │                                       │
│  Nav 2  │                                       │
│  Nav 3  │                                       │
│         │                                       │
│         │                                       │
│  Footer │                                       │
└─────────┴──────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Header | optional | Title + close button OR account info (in nav drawers) |
| Body | yes | Scrollable content (nav links, list, etc.) |
| Footer | optional | Pinned to bottom — settings, logout, version |

## API

```tsx
<Drawer
  open={open}
  onOpenChange={setOpen}
  side="left"
  size="md"
  modal={true}
  persistent={false}
>
  <Drawer.Header>
    <Drawer.Title>Menu</Drawer.Title>
    <Drawer.Close />
  </Drawer.Header>
  <Drawer.Body>
    <NavList />
  </Drawer.Body>
  <Drawer.Footer>
    <UserCard />
  </Drawer.Footer>
</Drawer>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` / `defaultOpen` | `boolean` | — | |
| `onOpenChange` | `(open: boolean) => void` | — | |
| `side` | `"left" \| "right" \| "top" \| "bottom"` | `"left"` | Edge to anchor |
| `size` | `"sm" \| "md" \| "lg" \| "xl"` or width/height | `"md"` | |
| `modal` | `boolean` | `true` | If true, backdrop + scroll lock + focus trap. If false, persistent / inline drawer. |
| `persistent` | `boolean` | `false` | When true on tablet+ widths, drawer is always visible (no slide-in/out). |
| `dismissOnOutsideClick` | `boolean` | `true` (when modal) | |
| `swipeToDismiss` | `boolean` | `true` on mobile | iOS-native swipe-to-close gesture |

## Sizes

| Side: left/right | Width |
| --- | --- |
| `sm` | 240px |
| `md` (default) | 320px |
| `lg` | 400px |
| `xl` | 480px |

| Side: top/bottom | Height |
| --- | --- |
| `sm` | 25% viewport |
| `md` | 50% |
| `lg` | 75% |
| `xl` | 90% |

For mobile bottom drawers (sheets): `md` with detents (drag handle, snap to multiple sizes).

## Persistent vs modal mode

### Modal drawer (default)

- Backdrop behind drawer (50% black scrim)
- Closes on backdrop click, Escape, swipe (mobile)
- Body scroll locked while open
- Focus trap inside drawer

### Persistent drawer

For desktop apps where the sidebar is always visible above tablet width:

```
< sm: hidden, opens via menu button (modal mode)
≥ md: persistent, always visible

@media (min-width: 768px) {
  .drawer { transform: translateX(0); position: relative; }
  .main-content { margin-left: 320px; }
}
```

The drawer collapses to modal mode below the breakpoint. **Don't show both modal toggle and persistent at the same width** — use media queries to switch behavior.

## States

| State | Visual |
| --- | --- |
| Closed (modal) | Translated off-screen (-100% on side axis) |
| Opening | 250–300ms slide-in with ease-out |
| Open | Settled, focus inside, scroll locked |
| Closing | 200ms slide-out with ease-in |
| Persistent | Always visible, no slide animation needed |

For mobile bottom drawer with detents: also have intermediate "snap" states (50%, 90%).

## Tokens consumed

```
--color-bg-elevated         (drawer surface)
--color-bg-overlay          (backdrop, ~rgba(0,0,0,0.5))
--color-border-default
--color-text-primary
--space-md, --space-lg
--radius-lg                 (top corners on bottom drawer; left/right edges on side drawers usually 0)
--shadow-modal              (drawer's elevation)
--motion-default            (250ms slide)
--easing-out
--z-modal
```

## Accessibility — same as Modal

This is the WAI-ARIA dialog pattern when `modal={true}`:
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby={titleId}`
- Focus trap on open
- Restore focus to opener on close
- Escape closes (unless dismissible disabled)

For persistent drawers (when not modal):
- `<nav>` element, not dialog role
- Focus is not trapped — user can tab out into main content
- No backdrop, no scroll lock
- Escape doesn't close (it's not modal)

### Keyboard

| Key | Modal drawer | Persistent drawer |
| --- | --- | --- |
| `Tab` | Cycle within drawer | Move through drawer content; eventually exits to main |
| `Esc` | Close | No-op |
| `Enter`/`Space` | Activate focused item | Same |

## Mobile-specific behaviors

### Swipe to dismiss

- Side drawer (left): swipe right-to-left dismisses (or left-to-right depending on side).
- Bottom drawer (sheet): swipe down dismisses.
- Drag handle (3px high pill) at the swipeable edge as a visual hint.

### Detents (multi-size)

iOS sheets support detents — the user can drag to snap to multiple sizes (small, medium, full):

```tsx
<Drawer side="bottom" detents={[0.25, 0.5, 0.9]}>
  ...
</Drawer>
```

## Code example

```tsx
// Mobile menu drawer
const [menuOpen, setMenuOpen] = useState(false);

<Drawer open={menuOpen} onOpenChange={setMenuOpen} side="left" size="md">
  <Drawer.Header>
    <UserCard user={user} />
  </Drawer.Header>
  <Drawer.Body>
    <NavLink to="/dashboard">대시보드</NavLink>
    <NavLink to="/transactions">거래 내역</NavLink>
    <NavLink to="/settings">설정</NavLink>
  </Drawer.Body>
  <Drawer.Footer>
    <Button onClick={signOut}>로그아웃</Button>
  </Drawer.Footer>
</Drawer>

// Filter drawer (right side)
<Drawer open={filterOpen} onOpenChange={setFilterOpen} side="right" size="md">
  <Drawer.Header>
    <Drawer.Title>필터</Drawer.Title>
    <Button variant="link" onClick={resetFilters}>초기화</Button>
  </Drawer.Header>
  <Drawer.Body>
    <FilterForm />
  </Drawer.Body>
  <Drawer.Footer>
    <Button fullWidth onClick={applyFilters}>적용</Button>
  </Drawer.Footer>
</Drawer>

// Persistent sidebar on desktop
<Drawer side="left" size="md" persistent open={true}>
  <Sidebar />
</Drawer>
```

## Edge cases

- **Drawer overflows on small phones**: cap at `100vw - 16px` (always show some main content peeking) so user knows there's a way back.
- **Long content scrolls inside body**: header and footer stay fixed, body scrolls.
- **Drawer above another drawer**: avoid. Refactor.
- **Drawer + on-screen keyboard (mobile)**: keyboard pushes drawer content up, but doesn't affect drawer chrome. Test on iOS Safari.
- **RTL**: `side="left"` becomes physical right. Use logical `side="start"`/`"end"` if your library supports it; else handle in CSS.
- **Persistent on small viewport**: collapse to modal below breakpoint. Don't show both styles competing.

## Don't

- Don't use Drawer for simple confirmation. Use a Modal or AlertDialog.
- Don't make a Drawer's content depend on the parent page's data without a way to refresh — context can become stale.
- Don't put primary destructive actions in a drawer's footer without confirmation.
- Don't autoplay videos / animations in a drawer that's not currently open (waste of CPU).
- Don't combine modal + persistent at the same viewport size.

## References

- Ant Design: [`refs/ant-design/components/drawer/`](../refs/ant-design/components/drawer/) — `Drawer`. Supports `placement`, `size`, `mask`, `closable`. Mature.
- MUI: [`refs/mui/packages/mui-material/src/Drawer/`](../refs/mui/packages/mui-material/src/Drawer/) — `Drawer` with `variant="permanent" | "persistent" | "temporary"`. Best persistent-mode handling.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/sheet.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/sheet.tsx) — Radix Dialog primitive used as a side panel. Modal-only by default; persistent requires composition.

## Cross-reference

- [`examples/component-modal.md`](component-modal.md) — Sheet variant, focus management
- [`knowledge/patterns/mobile-navigation.md`](../knowledge/patterns/mobile-navigation.md) — when drawer vs bottom-tab-bar
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md) — focus trap rules
