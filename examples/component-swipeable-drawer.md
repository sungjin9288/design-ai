# `SwipeableDrawer` — spec

> Synthesized from MUI `SwipeableDrawer`. A `Drawer` variant supporting swipe gestures (open from edge / close by swiping away). Mobile-first; iOS / Android conventions.

## When to use

- Mobile primary navigation accessible via edge swipe.
- Mobile bottom sheet draggable open / close.
- Native-feel mobile menus.

When NOT to use:
- Desktop-only contexts (mouse drag is unintuitive).
- Critical confirmation flows (use Modal / AlertDialog).
- See [`component-drawer.md`](component-drawer.md) for non-swipeable variants.

## Anatomy

Same as `Drawer`, but with gesture support:

```
↓ swipe from left edge
┌──────────┐
│          │
│          │
│  Drawer  │
│  content │
│          │
│          │
└──────────┘
   ↓ swipe right to close
```

## API

```tsx
<SwipeableDrawer
  open={open}
  onOpen={() => setOpen(true)}
  onClose={() => setOpen(false)}
  anchor="left"
  swipeAreaWidth={20}
  disableSwipeToOpen={false}
>
  <NavMenu />
</SwipeableDrawer>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | controlled | Visibility |
| `onOpen` / `onClose` | function | — | Gesture / click outside / Esc callbacks |
| `anchor` | `"left" \| "right" \| "top" \| "bottom"` | `"left"` | Edge anchor |
| `swipeAreaWidth` | `number` | `20` | Pixels from edge where swipe-open triggers |
| `disableSwipeToOpen` | `boolean` | iOS auto-disabled | Disable open-by-swipe |
| `disableDiscovery` | `boolean` | `false` | Hide the "discovery" peek that hints at swipe-to-open |
| `minFlingVelocity` | `number` | `450` | Velocity threshold for flick-to-open/close |
| `transitionDuration` | `number` | `300` | Ms for non-gesture transition |

## Gesture mechanics

| Gesture | Behavior |
| --- | --- |
| Edge swipe in | Drawer follows finger; releases → snap open or closed (based on past midpoint) |
| Drag drawer back | Same — past midpoint snaps closed |
| Flick (high velocity) | Always completes the action regardless of position |
| Tap backdrop | Closes |
| Esc (when keyboard available) | Closes |

## States

Same as Drawer. Plus:
- **Following finger**: drawer position interpolated to touch X (or Y); backdrop opacity proportional.
- **Snapping**: animate to nearest detent (open or closed) on release.

## Tokens consumed

Inherits from Drawer:
```
--drawer-bg
--drawer-shadow
--drawer-backdrop
--drawer-width                    (left/right)
--drawer-height                   (top/bottom)
--motion-medium                   (snap animation)
--ease-out
--z-overlay
```

## Accessibility

- Same as Drawer (role="dialog" aria-modal="true", focus trap, Esc to close).
- Add visible "Open menu" button — swipe is non-discoverable.
- Touch gesture is supplemental; never the only way to open.

## iOS quirk

iOS Safari has its own edge-swipe gesture (back navigation). MUI auto-disables `swipeToOpen` on iOS to avoid conflict.

For iOS: provide a visible hamburger button; swipe-to-close still works.

## Code example — mobile nav

```tsx
function MobileApp() {
  const [navOpen, setNavOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (!isMobile) return <DesktopAppShell />;

  return (
    <>
      <header>
        <IconButton onClick={() => setNavOpen(true)} aria-label="메뉴">
          <MenuIcon />
        </IconButton>
      </header>

      <SwipeableDrawer
        open={navOpen}
        onOpen={() => setNavOpen(true)}
        onClose={() => setNavOpen(false)}
        anchor="left"
      >
        <NavList onItemClick={() => setNavOpen(false)} />
      </SwipeableDrawer>

      <main>{/* main content */}</main>
    </>
  );
}
```

## Don't

- Don't rely on swipe-to-open as the only access — provide a button.
- Don't use SwipeableDrawer on desktop (mouse drag feels wrong).
- Don't put critical actions inside without a backup access path.
- Don't override iOS's edge swipe — let it be.

## References

- MUI: [`SwipeableDrawer`](../refs/mui/packages/mui-material/src/SwipeableDrawer)
- iOS native drawer pattern; Material 3 standard drawer

## Cross-reference

- [`examples/component-drawer.md`](component-drawer.md) — non-swipeable variant
- [`examples/component-sheet.md`](component-sheet.md) — bottom-sheet alternative
- [`knowledge/patterns/mobile-navigation.md`](../knowledge/patterns/mobile-navigation.md)
