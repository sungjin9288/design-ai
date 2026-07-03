# `Resizable` — spec

> Synthesized from shadcn-ui `resizable`. Resizable panel groups for IDE-style layouts. Distinct from `Splitter` (covered separately) — Resizable here is the shadcn primitive.

## When to use

- IDE-style two-pane layouts (sidebar | editor).
- Three-pane layouts (sidebar | editor | preview).
- Vertical splits (top pane / bottom pane — terminal below editor).
- Any UI where users want to manually adjust pane sizes.

When NOT to use:
- Simple two-column layouts that don't need user-resize (use Grid).
- Mobile (drag handles awkward on touch).

## Anatomy

```
┌────────┬─────────────────────────┐
│ Side   │                         │
│ panel  ║   Main editor pane      │
│        ║                         │
│        ║                         │
└────────┴─────────────────────────┘
         ↑ draggable handle (vertical bar)
```

## API

```tsx
<Resizable.Group direction="horizontal">
  <Resizable.Panel defaultSize={25} minSize={15}>
    <Sidebar />
  </Resizable.Panel>

  <Resizable.Handle />

  <Resizable.Panel defaultSize={75}>
    <Resizable.Group direction="vertical">
      <Resizable.Panel defaultSize={70}>
        <Editor />
      </Resizable.Panel>

      <Resizable.Handle />

      <Resizable.Panel defaultSize={30} minSize={20} collapsible>
        <Terminal />
      </Resizable.Panel>
    </Resizable.Group>
  </Resizable.Panel>
</Resizable.Group>
```

## Composition

| Part | Purpose |
| --- | --- |
| `Resizable.Group` | Wrapper; direction = "horizontal" or "vertical" |
| `Resizable.Panel` | Single resizable pane |
| `Resizable.Handle` | Draggable divider |

| Panel prop | Type | Description |
| --- | --- | --- |
| `defaultSize` | `number` | Initial size as percentage |
| `minSize` | `number` | Minimum size % |
| `maxSize` | `number` | Maximum size % |
| `collapsible` | `boolean` | Allow collapsing to 0 |
| `collapsedSize` | `number` | Size when collapsed (default 0) |
| `onResize` | `(size) => void` | Callback during drag |
| `onCollapse` / `onExpand` | function | State callbacks |

## States

| State | Visual |
| --- | --- |
| Default | Handles visible (subtle) |
| Handle hover | Highlights (cursor: col-resize / row-resize) |
| Handle dragging | Active visual; user dragging |
| Panel collapsed | Width 0; chevron to expand |
| Panel min reached | Handle stops at min boundary |

## Tokens consumed

```
--resizable-handle-bg
--resizable-handle-bg-hover
--resizable-handle-bg-active
--resizable-handle-thickness        (typically 4-8px)
--motion-fast
```

## Accessibility

- Handle: `role="separator" aria-orientation="vertical|horizontal" aria-valuenow={size} aria-valuemin={minSize} aria-valuemax={maxSize}`.
- Keyboard:
  - Tab to focus handle.
  - Arrow keys (Left/Right or Up/Down) move handle by 5%.
  - Home / End: snap to min / max.
  - Enter (when collapsible): toggle collapse.
- Don't make handle thinner than 4px — hard to grab.

## Layout persistence

Save panel sizes to localStorage so they persist across sessions:

```tsx
const [sizes, setSizes] = useLocalStorage("layout-sizes", [25, 75]);

<Resizable.Group
  direction="horizontal"
  onLayout={(newSizes) => setSizes(newSizes)}
>
  ...
</Resizable.Group>
```

## Code example — IDE shell

```tsx
function IDEShell() {
  return (
    <Resizable.Group direction="horizontal" className="h-screen">
      <Resizable.Panel defaultSize={20} minSize={15} collapsible>
        <FileExplorer />
      </Resizable.Panel>
      <Resizable.Handle />
      <Resizable.Panel defaultSize={60}>
        <Resizable.Group direction="vertical">
          <Resizable.Panel defaultSize={70}>
            <Editor />
          </Resizable.Panel>
          <Resizable.Handle />
          <Resizable.Panel defaultSize={30} minSize={10}>
            <Terminal />
          </Resizable.Panel>
        </Resizable.Group>
      </Resizable.Panel>
      <Resizable.Handle />
      <Resizable.Panel defaultSize={20} minSize={15} collapsible>
        <Outline />
      </Resizable.Panel>
    </Resizable.Group>
  );
}
```

## Don't

- Don't ship without min/max sizes — users drag to 0 and lose content.
- Don't make handles invisible — affordance must be visible.
- Don't auto-resize on window resize without preserving user adjustments.
- Don't use Resizable on mobile — touch drag conflicts with scroll.

## References

- shadcn-ui: [`resizable`](../docs/reference/shadcn-ui.md#resizable) — wraps `react-resizable-panels`
- VS Code, Linear, Cursor — IDE layout pattern

## Cross-reference

- [`examples/component-splitter.md`](component-splitter.md) — Ant equivalent
- [`examples/component-sidebar.md`](component-sidebar.md)
- [`examples/component-layout.md`](component-layout.md)
