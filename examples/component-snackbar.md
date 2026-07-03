# `Snackbar` — spec

> Synthesized from MUI `Snackbar` and Material 3 snackbar pattern. Bottom-anchored brief notification with optional action — Material's specific name for the Toast pattern. See [`component-toast.md`](component-toast.md) for the broader Toast family.

## Snackbar vs Toast vs Message vs Notification

| Library | Position | Use |
| --- | --- | --- |
| Snackbar (Material) | Bottom-center / bottom-left | Brief result + optional Undo |
| Toast (Sonner / shadcn / Ant) | Bottom-right (configurable) | Same as Snackbar |
| Message (Ant) | Top-center | Brief inline confirmation |
| Notification (Ant) | Top-right corner card | Rich title + description |

In design-ai's canonical synthesis: **Snackbar = MUI's name for Toast**. Pick one terminology per project.

## Anatomy

```
                                 ┌────────────────────────┐
                                 │ Marked as read [Undo] [×] │
                                 └────────────────────────┘
                                          ↑ bottom-center (Material default)
```

## API

```tsx
<Snackbar
  open={open}
  onClose={() => setOpen(false)}
  message="읽음 처리됨"
  action={
    <Button size="sm" onClick={undo}>실행 취소</Button>
  }
  autoHideDuration={6000}
  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | controlled | Visibility |
| `onClose` | `(reason) => void` | — | Close callback (auto / manual / clickaway) |
| `message` | `string \| ReactNode` | — | Content |
| `action` | `ReactNode` | — | Trailing action button(s) |
| `autoHideDuration` | `number` | `6000` | Ms before auto-close; null = persistent |
| `anchorOrigin` | `{ vertical, horizontal }` | bottom-left | Position |
| `severity` | `"success" \| "info" \| "warning" \| "error"` | none | Color preset |

## States

| State | Visual |
| --- | --- |
| Closed | Hidden |
| Opening | Slide up + fade in (200ms) |
| Open | Visible; auto-hide timer ticks |
| Closing | Slide down + fade out |

## Tokens consumed

```
--snackbar-bg                     (default; near-black on light, near-white on dark)
--snackbar-fg
--snackbar-action                 (action button text)
--snackbar-shadow
--radius-md
--motion-medium
--ease-out
--z-snackbar                      (above content, below modals)
```

## Accessibility

- `role="status"` (informational) or `role="alert"` (errors).
- `aria-live="polite"` (status) or `assertive` (alert) — be sparing.
- Auto-hide pauses on hover / focus (don't dismiss while user is reading or interacting).
- Esc closes if focusable.

## Code example — undo pattern

```tsx
async function deleteItem(id: string) {
  const item = items.find(i => i.id === id);
  setItems(prev => prev.filter(i => i.id !== id));

  toast.snackbar({
    message: "삭제되었어요",
    action: <Button onClick={() => setItems(prev => [...prev, item])}>실행 취소</Button>,
    autoHideDuration: 5000,
    onClose: (reason) => {
      if (reason !== "clickaway") {
        api.deleteItem(id);  // commit deletion when snackbar closes
      }
    },
  });
}
```

## Korean conventions

- 삭제됐어요 / 저장됐어요 / 복사됐어요 — typical 해요체 messages
- 실행 취소 (Undo) — standard label
- For network errors: "네트워크 오류 — 다시 시도하시겠어요?" + Retry button

## Don't

- Don't use Snackbar for blocking errors. Use Modal / AlertDialog.
- Don't show 3+ Snackbars stacked. Queue them.
- Don't auto-dismiss persistent errors (let user dismiss manually).
- Don't make autoHide < 4 seconds for messages with Undo. Users need time to act.

## References

- MUI: [`Snackbar`](../docs/reference/mui.md#snackbar)
- Material 3: Snackbar pattern

## Cross-reference

- [`examples/component-toast.md`](component-toast.md) — broader Toast family
- [`examples/component-message.md`](component-message.md) — top-positioned alternative
- [`examples/component-notification.md`](component-notification.md) — richer card variant
