# `Toggle` and `ToggleGroup` — spec

> Synthesized from shadcn-ui `toggle` + `toggle-group` (Radix). A two-state pressable button. `Toggle` is single; `ToggleGroup` is a set of mutually exclusive (radio) or independent (checkbox) toggles.

## Toggle vs Switch vs Checkbox

| | Toggle | Switch | Checkbox |
| --- | --- | --- | --- |
| Visual | Button-like | iOS slider | Square box + check |
| Use | Bold/italic in editor; pressable filter chips | On/off setting | Form selection / accept |
| Affordance | "Press" | "Slide" | "Check" |
| State | Pressed / unpressed | On / off | Checked / unchecked |
| Form? | No | Yes (input semantics) | Yes (input semantics) |

Toggle is for **interactive controls** in toolbars and editors. Switch is for **settings**. Checkbox is for **forms**.

## Toggle anatomy

```
[ B ]   [ I ]   [ U ]      <- toolbar with 3 toggles
 ↑ pressed (B is bold-toggled on)
```

## API — Toggle

```tsx
<Toggle
  pressed={isBold}
  onPressedChange={setIsBold}
  aria-label="Toggle bold"
>
  <BoldIcon />
</Toggle>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `pressed` | `boolean` | controlled | Pressed state |
| `defaultPressed` | `boolean` | `false` | Uncontrolled initial |
| `onPressedChange` | `(pressed: boolean) => void` | — | Callback |
| `disabled` | `boolean` | `false` | Disabled |
| `variant` | `"default" \| "outline"` | `"default"` | Visual style |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Size |
| `aria-label` | `string` | required (for icon-only) | Accessible label |

## ToggleGroup anatomy

```
[ Left | Center | Right ]   ← single-select (one active)
       ↑ Center pressed

[ B ] [ I ] [ U ]            ← multi-select (multiple can be pressed)
 ↑ B and I both pressed
```

## API — ToggleGroup

### Single

```tsx
<ToggleGroup type="single" value={align} onValueChange={setAlign}>
  <ToggleGroup.Item value="left" aria-label="Align left"><AlignLeftIcon /></ToggleGroup.Item>
  <ToggleGroup.Item value="center" aria-label="Align center"><AlignCenterIcon /></ToggleGroup.Item>
  <ToggleGroup.Item value="right" aria-label="Align right"><AlignRightIcon /></ToggleGroup.Item>
</ToggleGroup>
```

### Multiple

```tsx
<ToggleGroup type="multiple" value={formatting} onValueChange={setFormatting}>
  <ToggleGroup.Item value="bold" aria-label="Bold"><BoldIcon /></ToggleGroup.Item>
  <ToggleGroup.Item value="italic" aria-label="Italic"><ItalicIcon /></ToggleGroup.Item>
  <ToggleGroup.Item value="underline" aria-label="Underline"><UnderlineIcon /></ToggleGroup.Item>
</ToggleGroup>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `"single" \| "multiple"` | required | Selection model |
| `value` | `string \| string[]` | controlled | Selected values |
| `onValueChange` | function | — | Callback (signature depends on type) |
| `disabled` | `boolean` | `false` | Disable all items |
| `variant` | `"default" \| "outline"` | `"default"` | Visual style |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Size |

## Variants

### `default`

Filled when pressed; transparent when not.

```
Idle:    [ B ]    (transparent)
Pressed: [ B ]    (brand-colored bg)
```

### `outline`

Bordered when not pressed; bordered + filled when pressed.

```
Idle:    [ B ]    (border + bg-secondary)
Pressed: [ B ]    (border + brand-bg)
```

## States

| State | Visual |
| --- | --- |
| Idle | Per variant |
| Hover | Bg shifts subtly |
| Focus-visible | 2px focus ring |
| Pressed (active) | Persistent visual indicating "on" state |
| Disabled | Reduced opacity, no events |

Don't confuse "active" (pressed-on) with "active" (mid-press). They're different states.

## Tokens consumed

```
--color-bg-default
--color-bg-secondary           (outline idle bg)
--color-bg-hover
--color-bg-pressed             (when toggled-on)
--color-fg-default
--color-fg-on-pressed
--color-border-default         (outline)
--radius-md
--space-xs, --space-sm
--font-size-sm
--motion-fast
```

## Accessibility

### Toggle

- `<button>` with `aria-pressed="true|false"`.
- Icon-only: `aria-label` required.
- Touch target ≥ 24×24 (web) / 44×44 (mobile primary).
- Focus-visible ring.

### ToggleGroup

- `role="group"` with `aria-label="<purpose>"`.
- For `type="single"`: items use `role="radio"` + `aria-checked`. Treat as radio group.
- For `type="multiple"`: items use `role="button"` + `aria-pressed`.
- Keyboard:
  - Tab into group focuses first.
  - Arrow keys navigate (single-select moves selection; multi-select moves focus).
  - Space / Enter toggles.

## Code example — Editor toolbar

```tsx
function EditorToolbar({ editor }: Props) {
  return (
    <div className="toolbar">
      <ToggleGroup type="multiple" value={editor.activeFormats} onValueChange={editor.setFormats}>
        <ToggleGroup.Item value="bold" aria-label="굵게">
          <BoldIcon />
        </ToggleGroup.Item>
        <ToggleGroup.Item value="italic" aria-label="기울임">
          <ItalicIcon />
        </ToggleGroup.Item>
        <ToggleGroup.Item value="underline" aria-label="밑줄">
          <UnderlineIcon />
        </ToggleGroup.Item>
      </ToggleGroup>

      <Separator orientation="vertical" />

      <ToggleGroup type="single" value={editor.alignment} onValueChange={editor.setAlignment}>
        <ToggleGroup.Item value="left" aria-label="왼쪽 정렬"><AlignLeftIcon /></ToggleGroup.Item>
        <ToggleGroup.Item value="center" aria-label="가운데 정렬"><AlignCenterIcon /></ToggleGroup.Item>
        <ToggleGroup.Item value="right" aria-label="오른쪽 정렬"><AlignRightIcon /></ToggleGroup.Item>
      </ToggleGroup>
    </div>
  );
}
```

## Korean labels

For toolbar icons:
- 굵게 (bold) / 기울임 (italic) / 밑줄 (underline) / 취소선 (strikethrough)
- 왼쪽 / 가운데 / 오른쪽 / 양쪽 정렬
- 글머리 기호 (bullet list) / 번호 매기기 (numbered list)

Pretendard for label / Korean text in `aria-label`.

## Edge cases

- **No selection in single-select**: allow empty value (no item pressed). Some UIs require always-one — set initial value.
- **All items disabled**: group still rendered for layout; aria-label communicates state.
- **Loading state**: typically disable while async toggle pending; show spinner inside.
- **Confirmation needed for destructive toggle**: don't fire on click; open confirmation dialog first.
- **Tooltip integration**: pair Toggle with Tooltip for icon-only buttons.
- **RTL**: text-direction-aware alignment toggles flip meaning (left ↔ right) but keep visual order.

## Don't

- Don't use Toggle for form submission state. That's Switch.
- Don't omit `aria-label` on icon-only Toggle.
- Don't make the pressed state too subtle (need clear visual difference).
- Don't put 10+ items in a single ToggleGroup. Split or use a dropdown.
- Don't conflate Toggle with Button — Toggle has persistent state.
- Don't disable focus outline.

## References

- shadcn-ui: [`toggle`](../docs/reference/shadcn-ui.md#toggle), [`toggle-group`](../docs/reference/shadcn-ui.md#toggle-group) (Radix)
- WAI-ARIA: [Toggle button](https://www.w3.org/WAI/ARIA/apg/patterns/button/) + [Radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)

## Cross-reference

- [`examples/component-form-controls.md`](component-form-controls.md) — Switch + Checkbox + Radio
- [`examples/component-segmented.md`](component-segmented.md) — segmented control variant
- [`examples/component-button.md`](component-button.md) — non-toggle variant
