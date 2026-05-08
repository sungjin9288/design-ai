# `Sheet` — spec

> Synthesized from shadcn-ui `sheet` (Radix Dialog with side anchoring) and Material 3 bottom sheet. A modal panel that slides in from a screen edge — distinct from `Drawer` (typically navigation) and `Modal` (centered).

## When to use Sheet vs Drawer vs Modal

| Component | Anchor | Primary use |
| --- | --- | --- |
| **Modal** | Center | Confirmation, focused task |
| **Drawer** | Left/Right | Persistent or modal navigation menu |
| **Sheet** | Any side | Modal supplemental flow / detail view, mobile-first |

Sheet's distinguishing properties:
- **Side-anchored** like a drawer, but **always modal**.
- **Mobile-first** patterns (bottom sheet on phone; drawer on desktop).
- **Detents / snap points** common (peek vs full).

## Anatomy

```
┌────────────────────────────────────┐
│                                    │
│   [backdrop scrim]                 │
│                                    │
│                                    │
├────────────────────────────────────┤
│ ━━━ (drag handle, optional)         │
│ Sheet header                    [×]│
│ ───────────────                     │
│                                    │
│  Sheet content                     │
│                                    │
│  ...                               │
│                                    │
└────────────────────────────────────┘
       (Bottom-anchored sheet)
```

## API

```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <Sheet.Trigger asChild>
    <Button>Open settings</Button>
  </Sheet.Trigger>
  <Sheet.Content side="right">
    <Sheet.Header>
      <Sheet.Title>Settings</Sheet.Title>
      <Sheet.Description>Configure your preferences.</Sheet.Description>
    </Sheet.Header>

    {/* form content */}

    <Sheet.Footer>
      <Sheet.Close asChild>
        <Button variant="ghost">Cancel</Button>
      </Sheet.Close>
      <Button onClick={save}>Save</Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | controlled | Visibility |
| `onOpenChange` | `(open: boolean) => void` | — | Close handler |
| `modal` | `boolean` | `true` | Trap focus + lock scroll |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"right"` | Anchor edge |
| `size` | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"md"` | Width (top/bottom) or height (left/right) |
| `dismissible` | `boolean` | `true` | Click outside or Esc closes |
| `detents` | `number[]` | — | Optional snap points (mobile bottom sheet); e.g., `[0.4, 0.9]` |

## Composition

| Part | Purpose |
| --- | --- |
| `Trigger` | Element that opens the sheet |
| `Content` | The sheet panel |
| `Header` | Title + description region |
| `Title` | Heading (announced to screen readers) |
| `Description` | Helper text |
| `Footer` | Actions row |
| `Close` | Button that closes the sheet |
| `Overlay` | Backdrop scrim |

## Side variants

### Right (default — desktop settings, detail panels)

```
                  ┌──────────────┐
[main content]    │ Sheet panel  │
                  │              │
                  │              │
                  └──────────────┘
```

### Left (alternative navigation)

Less common; use Drawer for nav.

### Bottom (mobile-first)

```
[main content]
            ┌───────────────┐
            │   Sheet       │ ← slides up
            │               │
            └───────────────┘
```

Mobile: bottom sheet is the canonical action / detail pattern. iOS / Android native.

### Top (notification center, full-page filter)

Less common. Use for app-wide announcements or full-page-spanning filter overlays.

## Size variants

| Size | Width (left/right) | Height (top/bottom) |
| --- | --- | --- |
| `sm` | 320px | 30vh |
| `md` (default) | 480px | 50vh |
| `lg` | 640px | 70vh |
| `xl` | 800px | 90vh |
| `full` | 100% | 100% |

For mobile (< 640px viewport): all sizes default to ~90% of viewport.

## Detents (mobile bottom sheet)

```
detents: [0.4, 0.9]
            ↑     ↑
         peek  full

User can drag to switch between detents:
- Drag up from peek → snap to full
- Drag down from full → snap to peek (or close if dragged to 0)
```

iOS-style sheet behavior. Common for map apps (peek shows summary, drag up for full).

## States

| State | Visual |
| --- | --- |
| Closed | Hidden |
| Opening | Slide-in from side (200-300ms) + backdrop fade |
| Open | Visible, focus trapped |
| Dragging (mobile, with detents) | Following finger; backdrop opacity proportional |
| Snapping | Animate to nearest detent |
| Closing | Reverse |

## Animation

```css
[data-side="right"] {
  --slide: translateX(100%);
}
[data-side="left"] {
  --slide: translateX(-100%);
}
[data-side="bottom"] {
  --slide: translateY(100%);
}
[data-side="top"] {
  --slide: translateY(-100%);
}

.sheet[data-state="closed"] {
  transform: var(--slide);
}
.sheet[data-state="open"] {
  transform: translate(0);
}
.sheet {
  transition: transform 250ms var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  .sheet { transition: none; }
}
```

## Tokens consumed

```
--color-bg-overlay-scrim         (backdrop, ~50% opacity)
--color-bg-default               (sheet bg)
--color-fg-default
--color-border-default           (header / footer divider)
--shadow-overlay
--radius-lg                      (mobile bottom sheet has rounded top corners)
--space-md, --space-lg
--motion-medium                  (slide-in)
--ease-out
--z-overlay
```

## Accessibility

- `Content`: `role="dialog"` (or `alertdialog` if it interrupts), `aria-modal="true"`.
- `aria-labelledby` references `Title`.
- `aria-describedby` references `Description`.
- Focus trap on open; first focusable in Content gets focus.
- `Esc` closes; `Tab` cycles within Content.
- `Close` button is inside Content; users find it via Tab.
- Click outside (on overlay) closes — but not for forms with unsaved changes (confirm first).
- Backdrop is non-interactive (just visual scrim) — clicks bubble to close handler.
- Touch-drag (mobile detents) uses `aria-valuenow` for screen reader; announce position changes.
- Reduced motion: no slide; instant appearance.

## Mobile-specific

- Bottom sheet rounded-top corners (`--radius-lg` on top-left + top-right only).
- Drag handle (small bar at top): visual + accessible (`role="button" aria-label="Drag to resize"`).
- Safe-area inset: respect device safe-area for iPhone home indicator (`padding-bottom: env(safe-area-inset-bottom)`).
- Dynamic height for keyboard: when virtual keyboard opens, shrink sheet so input visible.

## Code example

```tsx
function FilterSheet({ filters, onChange, onApply }: Props) {
  return (
    <Sheet>
      <Sheet.Trigger asChild>
        <Button variant="outline">필터</Button>
      </Sheet.Trigger>
      <Sheet.Content side="bottom" size="lg" detents={[0.5, 0.95]}>
        <Sheet.Header>
          <Sheet.Title>필터 설정</Sheet.Title>
        </Sheet.Header>
        <FilterControls value={filters} onChange={onChange} />
        <Sheet.Footer>
          <Button variant="ghost" onClick={() => onChange({})}>초기화</Button>
          <Button onClick={onApply}>적용하기</Button>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>
  );
}
```

## Edge cases

- **Form with unsaved changes + click outside**: confirm before close ("Discard changes?").
- **Sheet inside a Sheet**: stack, but close inner first; ensure focus returns correctly.
- **Very long content**: scroll inside Content (header / footer stay pinned).
- **Mobile keyboard opens while sheet open**: shrink sheet to fit; ensure focused input visible.
- **Detents + content scroll** conflict: drag from header drags sheet; drag from content scrolls content. Detect target.
- **RTL**: `right` and `left` swap automatically.
- **Multi-step flow inside Sheet**: each step within same Sheet; or stack sheets (max 2).

## Don't

- Don't use Sheet for full-page navigation (use Drawer).
- Don't use Sheet for centered confirm dialogs (use Modal).
- Don't put 3+ stacked Sheets — too deep, users lose context.
- Don't omit close button. Users need an obvious dismiss path.
- Don't forget the click-outside guard for forms with unsaved data.
- Don't auto-close after task completion without confirmation animation; user feedback matters.
- Don't ignore safe-area insets on iOS.

## References

- shadcn-ui: [`sheet`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/sheet.tsx) (Radix Dialog primitive)
- Material 3: bottom sheet pattern
- iOS: UISheetPresentationController detents

## Cross-reference

- [`examples/component-modal.md`](component-modal.md) — centered dialog
- [`examples/component-drawer.md`](component-drawer.md) — persistent navigation
- [`knowledge/motion/principles.md`](../knowledge/motion/principles.md) — slide-in timing
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md) — focus trap
