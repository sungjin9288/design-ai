# `Popper` — spec

> Synthesized from MUI `Popper`. Low-level positioning primitive that handles floating element placement with collision detection. Used internally by Tooltip / Popover / Menu / Autocomplete / Combobox.

## When to use

- As a primitive for custom floating UI when Tooltip / Popover / Menu don't fit.
- Building custom dropdowns / pickers / overlays.

When NOT to use:
- Standard menus (use `DropdownMenu`).
- Tooltips (use `Tooltip`).
- Click-triggered floating content (use `Popover`).
- For shadcn-based projects: use Radix Popover under the hood (which uses `@floating-ui/react`).

## API

```tsx
<Popper
  open={open}
  anchorEl={anchorEl}
  placement="bottom-start"
  modifiers={[
    { name: "offset", options: { offset: [0, 8] } },
    { name: "preventOverflow", options: { padding: 8 } },
  ]}
>
  <div className="custom-floating-content">
    {/* whatever */}
  </div>
</Popper>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | controlled | Visibility |
| `anchorEl` | `HTMLElement \| null` | — | Element to anchor to |
| `placement` | `"top" \| "bottom" \| "left" \| "right"` (+ -start / -end) | `"bottom"` | Preferred placement |
| `modifiers` | `Modifier[]` | — | Popper.js modifiers (offset, flip, preventOverflow, etc.) |
| `transition` | `boolean` | `false` | Enable animation hooks |
| `disablePortal` | `boolean` | `false` | Render in-place vs Portal to body |
| `keepMounted` | `boolean` | `false` | Keep DOM when closed (for CSS transitions) |

## Behaviors

| Capability | How |
| --- | --- |
| **Collision detection** | `flip` modifier flips placement when off-screen |
| **Boundary clamping** | `preventOverflow` clamps to viewport |
| **Offset** | Distance from anchor (8-12px typical) |
| **Arrow** | Optional `arrow` modifier shows caret pointing at anchor |
| **Portal** | Render in document body to escape parent overflow / z-index issues |

## Modifier examples

```ts
[
  { name: "offset", options: { offset: [0, 8] } },          // 8px gap
  { name: "flip", options: { fallbackPlacements: ["top", "right"] } },
  { name: "preventOverflow", options: { padding: 8 } },
  { name: "arrow", options: { element: arrowEl } },
]
```

For modern projects: use [`@floating-ui/react`](https://floating-ui.com/) directly. Popper.js is largely superseded; MUI v6+ uses floating-ui internally.

## States

Stateless from Popper's POV — visibility is controlled via `open`. Animations / transitions are layered separately.

## Tokens consumed

Popper itself doesn't theme. Tokens go on the children content.

## Accessibility

- Popper is positioning only. Accessibility comes from the wrapping component:
  - Tooltip uses `role="tooltip"`.
  - Menu uses `role="menu"`.
  - Popover uses `role="dialog"`.
- Focus management is up to the consumer.

## Code example — custom date hover preview

```tsx
function DateHoverPreview({ date }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <span
        onMouseEnter={(e) => setAnchor(e.currentTarget)}
        onMouseLeave={() => setAnchor(null)}
      >
        {date.toLocaleDateString()}
      </span>
      <Popper
        open={!!anchor}
        anchorEl={anchor}
        placement="top"
        modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
      >
        <div className="date-preview">
          {date.toLocaleString("ko-KR", { dateStyle: "full", timeStyle: "short" })}
        </div>
      </Popper>
    </>
  );
}
```

## Don't

- Don't use Popper when a higher-level primitive fits (Tooltip / Popover / DropdownMenu).
- Don't anchor to a transient element (mutates / unmounts) without cleanup.
- Don't rely on Popper for accessibility — wrap with proper roles + focus management.
- Don't skip `disablePortal` consideration — default Portal behavior may break z-index in some layouts.

## References

- MUI: [`Popper`](../docs/reference/mui.md#popper)
- Popper.js (deprecated; use @floating-ui)
- @floating-ui/react — modern replacement

## Cross-reference

- [`examples/component-tooltip.md`](component-tooltip.md) — uses Popper internally
- [`examples/component-popover.md`](component-popover.md) — uses Popper internally
- [`examples/component-dropdown.md`](component-dropdown.md) — uses Popper internally
