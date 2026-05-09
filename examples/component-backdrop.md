# `Backdrop` — spec

> Synthesized from MUI `Backdrop`. A semi-opaque overlay that dims the page behind a foreground element. Used by `Modal`, `Drawer`, `Sheet`, `AlertDialog` internally — and standalone for full-page loading screens.

## When to use

- **Standalone**: full-page loading state ("Saving... please wait").
- **Inside other components**: as the scrim behind Modal / Drawer / Sheet (usually internal to those components).
- **Focus / attention**: dim everything else to point at one task.

When NOT to use:
- Modal-like UI — use `Modal` (it includes Backdrop).
- Loading inside a card — use Skeleton or Spinner inline.

## Anatomy

```
┌─────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░ (dimmed page content) ░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░ [spinner] ░░░░░░░░░░░░░░ │
│ ░░░░░░░░░ Loading...  ░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────┘
```

## API

```tsx
<Backdrop open={loading}>
  <CircularProgress />
</Backdrop>

<Backdrop open={open} onClick={() => setOpen(false)}>
  <p>Click anywhere to dismiss</p>
</Backdrop>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | controlled | Visibility |
| `onClick` | `() => void` | — | Click handler (often dismisses) |
| `transitionDuration` | `number` | `300` | Fade ms |
| `invisible` | `boolean` | `false` | Backdrop is transparent (still blocks clicks) |
| `children` | `ReactNode` | — | Foreground content (centered by default) |

## States

| State | Visual |
| --- | --- |
| Closed | `display: none` |
| Opening | Fade in from 0 to opacity (300ms) |
| Open | Fully visible |
| Closing | Reverse |

## Tokens consumed

```
--backdrop-bg                      (rgba(0,0,0,0.5) typical)
--backdrop-bg-light                (lighter for dark themes)
--motion-medium                    (fade duration)
--ease-out
--z-backdrop                       (above content, below modals/dialogs)
```

## CSS

```css
.backdrop {
  position: fixed;
  inset: 0;
  background: var(--backdrop-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-backdrop);
  opacity: 0;
  transition: opacity var(--motion-medium) var(--ease-out);
  pointer-events: none;
}

.backdrop[data-state="open"] {
  opacity: 1;
  pointer-events: auto;
}

@media (prefers-reduced-motion: reduce) {
  .backdrop { transition: opacity 0ms; }
}
```

## Accessibility

- Backdrop with content: usually wrap content in `<div role="status" aria-live="polite">` (for loading) or `<div role="alertdialog">` (for confirmations).
- Standalone Backdrop is a focus trap when modal — keyboard can't escape until Backdrop closes.
- Esc to close (when dismissible).
- Click-outside to close (configurable).
- `aria-busy="true"` on the entire affected page region during loading.

## Code example — full-page loading

```tsx
function App() {
  const { isAuthenticating } = useAuth();

  return (
    <>
      <Backdrop open={isAuthenticating}>
        <Stack align="center" gap={4}>
          <Spinner size="lg" color="white" />
          <Text color="white">로그인 중...</Text>
        </Stack>
      </Backdrop>

      <main>{/* main content */}</main>
    </>
  );
}
```

## Edge cases

- **Multiple Backdrops at once**: stack via z-index but visually messy. Avoid; use one at a time.
- **Backdrop doesn't cover virtual keyboard on mobile**: position: fixed handles most, but iOS Safari has quirks with input focus.
- **Backdrop above modals**: usually wrong — modals own their Backdrop. Don't double-stack.
- **Reduced motion**: skip fade; instant.
- **Print**: hide via `@media print`.

## Don't

- Don't use Backdrop where Modal / Drawer / Sheet handles it for you.
- Don't make Backdrop too transparent — should clearly signal "background is inactive".
- Don't make Backdrop too opaque (>0.7) — feels suffocating.
- Don't disable Esc / click-outside without a clear dismiss button.
- Don't pile multiple Backdrops.

## References

- MUI: [`Backdrop`](../refs/mui/packages/mui-material/src/Backdrop)
- Used internally by: Modal, Drawer, Sheet, AlertDialog

## Cross-reference

- [`examples/component-modal.md`](component-modal.md) — uses Backdrop internally
- [`examples/component-spinner.md`](component-spinner.md) — common Backdrop child
- [`knowledge/motion/principles.md`](../knowledge/motion/principles.md) — fade timing
