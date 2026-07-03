# `ButtonGroup` — spec

> Synthesized from MUI `ButtonGroup` and shadcn-ui's `button-group`. A horizontal cluster of related buttons, visually unified — no gap between them; shared border for outline variant.

## When to use

- Related actions with one shared visual frame ("Save", "Save as...", "Cancel" together).
- Toolbar action clusters.
- Segmented-style action button row (different from `ToggleGroup` which has persistent selection).

When NOT to use:
- Mutually exclusive selection — use `ToggleGroup` (single).
- Independent actions with distinct purposes — use separate `Button`s with gap.

## ButtonGroup vs ToggleGroup vs Segmented

| | ButtonGroup | ToggleGroup | Segmented |
| --- | --- | --- | --- |
| Persistent selection | No | Yes | Yes |
| Visual shape | Joined buttons | Joined toggle buttons | Pill-style |
| Use | Action cluster | Multi-select / radio of toggles | iOS-style mode switch |

## Anatomy

```
[ Save ][ Save as... ][ Cancel ]
   ↑ no gap; shared border
```

## API

```tsx
<ButtonGroup>
  <Button onClick={save}>Save</Button>
  <Button onClick={saveAs}>Save as...</Button>
  <Button variant="ghost" onClick={cancel}>Cancel</Button>
</ButtonGroup>

<ButtonGroup variant="outline" orientation="vertical">
  <Button>Option 1</Button>
  <Button>Option 2</Button>
  <Button>Option 3</Button>
</ButtonGroup>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Direction |
| `variant` | `"default" \| "outline" \| "ghost"` | `"default"` | Visual style applied to all children |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Size applied to all children |
| `disabled` | `boolean` | `false` | Disable all |

## States

Same as Button — each Button child has its own hover / focus / disabled state.

The `ButtonGroup` adjusts:
- First child: rounded left corners only.
- Last child: rounded right corners only.
- Middle children: no rounded corners.
- Borders: shared (outline variant) — adjacent buttons share a 1px border, not 2px.

## Tokens consumed

```
--button-group-divider             (subtle line between buttons in default variant)
--radius-md                        (only at outer corners)
```

Otherwise inherits Button's tokens.

## Accessibility

- `role="group"` + `aria-label` describing the group's purpose.
- Each Button is independently focusable; standard Button keyboard contract.
- For toolbars: wrap ButtonGroup in `<div role="toolbar">`.

## Code example

```tsx
function EditorToolbar() {
  return (
    <div role="toolbar" aria-label="Text formatting">
      <ButtonGroup>
        <Button onClick={undo} aria-label="실행 취소"><UndoIcon /></Button>
        <Button onClick={redo} aria-label="다시 실행"><RedoIcon /></Button>
      </ButtonGroup>

      <Separator orientation="vertical" />

      <ButtonGroup>
        <Button onClick={cut}>잘라내기</Button>
        <Button onClick={copy}>복사</Button>
        <Button onClick={paste}>붙여넣기</Button>
      </ButtonGroup>
    </div>
  );
}
```

## Don't

- Don't use ButtonGroup for mutually exclusive selection. Use ToggleGroup or Segmented.
- Don't put 5+ buttons in one group — visual clutter; split.
- Don't mix variants within one group (some outline, some filled).
- Don't use ButtonGroup as a navigation menu. Use NavigationMenu / Menubar.

## References

- MUI: [`ButtonGroup`](../docs/reference/mui.md#button-group)
- shadcn-ui: [`button-group`](../docs/reference/shadcn-ui.md#button-group)

## Cross-reference

- [`examples/component-button.md`](component-button.md)
- [`examples/component-toggle.md`](component-toggle.md) — for persistent selection
- [`examples/component-segmented.md`](component-segmented.md) — pill-style alternative
