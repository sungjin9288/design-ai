# `Splitter` (resizable panel) — spec

> Citing Ant Design `Splitter`, MUI (no built-in), shadcn-ui `resizable`

## Purpose

Two or more panels separated by draggable handles. User resizes by dragging the handle. Used for: IDE/editor layouts, three-pane email apps, dashboard with sidebar, side-by-side editors.

## When Splitter vs alternatives

| Pattern | Use |
| --- | --- |
| **Splitter** | User-driven resize between persistent panels |
| **Collapsible drawer** | Show/hide a panel (binary, not gradient resize) |
| **Tabs** | Switch between mutually exclusive views |
| **Grid** | Static layout |

Splitter is a desktop-first pattern. Mobile rarely uses it (small screens, touch resize is awkward).

## Anatomy

```
Horizontal split:
┌────────────┬┊┬─────────────────────────────┐
│            │┊│                              │
│  Panel A   │┊│   Panel B                    │
│            │┊│                              │
└────────────┴┊┴─────────────────────────────┘
              ↑ draggable handle

Vertical split:
┌──────────────────────────────────────────────┐
│                                              │
│  Panel A                                      │
│                                              │
├╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴┤  ← drag handle
│                                              │
│  Panel B                                      │
│                                              │
└──────────────────────────────────────────────┘
```

## API

```tsx
<Splitter direction="horizontal">
  <Splitter.Panel size={240} minSize={200} maxSize={400}>
    <Sidebar />
  </Splitter.Panel>
  <Splitter.Panel size="auto">
    <MainContent />
  </Splitter.Panel>
</Splitter>

<Splitter direction="horizontal">
  <Splitter.Panel size={240}>{nav}</Splitter.Panel>
  <Splitter.Panel size="40%">{listing}</Splitter.Panel>
  <Splitter.Panel size="auto">{detail}</Splitter.Panel>
</Splitter>
```

| Prop (root) | Type | Default | Description |
| --- | --- | --- | --- |
| `direction` | `"horizontal" \| "vertical"` | `"horizontal"` | |
| `lazy` | `boolean` | `false` | Defer panel rendering during drag (perf) |
| `onResizeEnd` | `(sizes: number[]) => void` | — | Persist sizes |

| Prop (Panel) | Type | Description |
| --- | --- | --- |
| `size` | `number \| string \| "auto"` | px, %, "auto" (consume remaining) |
| `minSize` | `number` | Minimum size when dragging |
| `maxSize` | `number` | Maximum size |
| `collapsible` | `boolean` | Collapse to 0 when dragged below minSize |
| `defaultSize` | `number \| string` | Initial (uncontrolled) |

## Behavior

- User drags handle: adjacent panels resize.
- Constraints: min/max enforced.
- Collapsible: dragging below `minSize` snaps to 0; clicking handle restores to `minSize`.
- Total: panels share the parent's space; resizing one redistributes.

## Persistence

Common pattern: persist sizes to localStorage:

```tsx
const [sizes, setSizes] = useLocalStorage("splitter-sizes", [240, 400, 800]);

<Splitter onResizeEnd={setSizes}>
  <Splitter.Panel size={sizes[0]}>{...}</Splitter.Panel>
  <Splitter.Panel size={sizes[1]}>{...}</Splitter.Panel>
  <Splitter.Panel size={sizes[2]}>{...}</Splitter.Panel>
</Splitter>
```

User's preference survives refresh.

## States

| State | Visual |
| --- | --- |
| Default handle | Subtle 2-4px line, neutral color |
| Hover handle | Border color changes, cursor `col-resize` (or `row-resize`) |
| Dragging | Handle highlighted, panels shrink/grow live |
| Focus-visible (keyboard) | 2px ring around handle |
| Panel collapsed | Width/height 0; expand affordance visible |

## Tokens consumed

```
--color-border-default       (handle line)
--color-border-strong         (hover)
--color-primary-default       (drag-active or focus)
--color-bg-default
--color-focus-ring
--space-xs                    (handle thickness)
--motion-fast                 (resize transitions)
```

## Sizes

| Direction | Handle thickness |
| --- | --- |
| Horizontal | 4–6px width |
| Vertical | 4–6px height |

For touch devices: increase hit area to 12–16px around the visual line via padding.

## Accessibility

- Each handle: `role="separator"`, `aria-orientation`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- Handle is keyboard-reachable: `tabIndex="0"`.
- Resize via keyboard: `←` / `→` (horizontal) or `↑` / `↓` (vertical) — increment/decrement by 10px.

```html
<div role="separator"
     aria-orientation="vertical"
     aria-valuenow="240"
     aria-valuemin="200"
     aria-valuemax="400"
     tabindex="0"
     aria-label="Resize navigation panel">
</div>
```

## Mobile

For mobile: usually replace with stacked panels, or a single-pane experience with drill-in. Splitter at narrow widths is awkward.

If Splitter is needed on mobile (rare, e.g., for tablet apps): handle width should be 16+ px for touch.

## Code example

```tsx
// IDE-style 3-pane layout
function CodeEditor() {
  const [sizes, setSizes] = useLocalStorage("editor-sizes", [240, 50, 50]);

  return (
    <Splitter direction="horizontal" onResizeEnd={setSizes}>
      <Splitter.Panel size={sizes[0]} minSize={180} maxSize={400} collapsible>
        <FileTree />
      </Splitter.Panel>
      <Splitter.Panel size={`${sizes[1]}%`} minSize={20}>
        <Editor />
      </Splitter.Panel>
      <Splitter.Panel size="auto">
        <Preview />
      </Splitter.Panel>
    </Splitter>
  );
}

// Vertical: editor + console
<Splitter direction="vertical">
  <Splitter.Panel size="70%">
    <Editor />
  </Splitter.Panel>
  <Splitter.Panel size="30%" minSize={100}>
    <Console />
  </Splitter.Panel>
</Splitter>
```

## Edge cases

- **All panels at minSize and total < parent**: leftover space shows; consider extending the last panel or showing a fallback.
- **Window resize**: panels redistribute proportionally if percentage-based; clamp to absolute mins.
- **Nested Splitters**: works but heavy. Avoid 3+ nested levels — UX gets confusing.
- **Panels with text content**: ensure text wraps when narrow; otherwise, splitter becomes a horizontal-scroll trap.

## Don't

- Don't use Splitter for content that doesn't benefit from user-driven resize.
- Don't remember the user's resize *globally* across all instances — be context-specific.
- Don't allow collapse to 0 without an obvious "expand" affordance somewhere visible.
- Don't render the handle without a clear cursor change (col-resize / row-resize) — users won't know it's draggable.
- Don't omit aria-valuenow on the separator — keyboard users need feedback.

## References

- Ant Design: [`refs/ant-design/components/splitter/`](../docs/reference/ant-design.md#splitter) — `Splitter` + `Splitter.Panel`. Modern Ant addition.
- MUI: no built-in. Use `react-resizable-panels` or `allotment`.
- shadcn-ui: [`resizable.tsx`](../docs/reference/shadcn-ui.md#resizable) — wraps `react-resizable-panels`. Cleanest impl.

## Cross-reference

- [`examples/component-drawer.md`](component-drawer.md) — collapsible alternative
- [`knowledge/layout/spacing-and-grid.md`](../knowledge/layout/spacing-and-grid.md) — broader layout context
