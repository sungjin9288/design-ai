# `ClickAwayListener` — spec

> Synthesized from MUI `ClickAwayListener`. Utility that fires a callback when user clicks outside a wrapped element. Used internally by Popover / Modal / Menu to handle click-outside-closes.

## When to use

- Custom dropdowns / popups that should close on outside click.
- Image galleries / lightboxes with click-outside-to-close.
- Any custom floating UI not built on Popover.

When NOT to use:
- Standard Popover / Menu / Modal — they include this internally.
- Form inputs (focus / blur events handle this naturally).

## API

```tsx
<ClickAwayListener onClickAway={() => setOpen(false)}>
  <div className="custom-popup">
    {/* content */}
  </div>
</ClickAwayListener>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `onClickAway` | `(event) => void` | required | Fires on outside click / touch |
| `mouseEvent` | `"onClick" \| "onMouseDown" \| "onMouseUp" \| false` | `"onClick"` | Which mouse event triggers |
| `touchEvent` | `"onTouchStart" \| "onTouchEnd" \| false` | `"onTouchEnd"` | Touch event |
| `disableReactTree` | `boolean` | `false` | Use document listener instead of React's synthetic events |
| `children` | `ReactNode` | — | Single child — the inside |

## Implementation note

For modern projects, the same effect via hooks:

```tsx
function useClickAway<T extends HTMLElement>(
  ref: React.RefObject<T>,
  onAway: () => void,
) {
  useEffect(() => {
    function handler(e: MouseEvent | TouchEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      onAway();
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, onAway]);
}

// Use:
const ref = useRef<HTMLDivElement>(null);
useClickAway(ref, () => setOpen(false));
return <div ref={ref}>...</div>;
```

shadcn-based projects don't include this as a separate primitive — Popover / Sheet handle it internally via Radix.

## Edge cases

- **Click on a portal child**: portal renders outside DOM tree; `ref.contains()` won't match. Use `disableReactTree` OR maintain a list of "inside" elements.
- **Mobile touch + click both fire**: prevent double-fire by debouncing or using only one event.
- **Synthetic vs native events**: React's synthetic events bubble through React tree even if rendered to portal; native events don't.
- **Esc key**: ClickAwayListener doesn't handle Esc — pair with separate keydown listener.

## Don't

- Don't ship custom modals without click-outside handling.
- Don't fire on all clicks — limit to outside-the-wrapped-element.
- Don't forget mobile touch events.
- Don't rely on ClickAwayListener for accessibility — focus trap + Esc still required.

## References

- MUI: [`ClickAwayListener`](../docs/reference/mui.md#click-away-listener)
- Hook alternatives in many libs (use-click-away, react-use, etc.)

## Cross-reference

- [`examples/component-popover.md`](component-popover.md) — uses click-away internally
- [`examples/component-modal.md`](component-modal.md) — uses click-away (or backdrop click)
- [`examples/component-dropdown.md`](component-dropdown.md) — uses click-away
