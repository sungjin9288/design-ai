# `ColorPicker` — spec

> Citing Ant Design `ColorPicker`, MUI (no built-in), shadcn-ui (composition with libraries)

## Purpose

Lets users pick a color value. Used in: design tools, theme customizers, content authoring (highlight color, brand color), CRM tag creation.

## Anatomy

```
Trigger (small swatch):           Open (full picker panel):
┌─────────────┐                   ┌─────────────────────────────────┐
│ ▣ #7C3AED  ▾│                   │  ┌─────────────────────────┐   │
└─────────────┘                   │  │                         │   │  ← saturation/value square
                                  │  │     [picker dot]        │   │
                                  │  │                         │   │
                                  │  └─────────────────────────┘   │
                                  │  ──[ hue slider ]────────       │
                                  │  ──[ alpha slider ]──────       │
                                  │                                  │
                                  │  HEX:    [#7C3AED         ]      │
                                  │  RGB:    [124] [58] [237]        │
                                  │  HSL/OKLCH:  [...]              │
                                  │                                  │
                                  │  Presets: ● ● ● ● ● ● ● ●       │
                                  └─────────────────────────────────┘
```

## API

```tsx
<ColorPicker
  value={color}
  onValueChange={setColor}
  format="hex"
  showAlpha
  presets={brandColors}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` (hex/rgba/oklch) | — | Color value |
| `onValueChange` | `(value: string) => void` | — | |
| `format` | `"hex" \| "rgb" \| "hsl" \| "oklch"` | `"hex"` | Output format |
| `showAlpha` | `boolean` | `false` | Alpha slider |
| `showInputs` | `boolean` | `true` | Numeric inputs (hex/rgb/hsl) |
| `presets` | `string[]` | — | Preset swatches at the bottom |
| `disabled` | `boolean` | `false` | |
| `triggerStyle` | `"swatch" \| "button"` | `"swatch"` | Compact swatch vs labeled button |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |

## Behavior

- Click trigger → opens popover with picker.
- Saturation/value square: drag picker dot to choose; updates live.
- Hue slider: vertical or horizontal; rotates hue.
- Alpha slider (if shown): adjusts transparency.
- Numeric inputs: typing updates picker.
- Preset swatch click: instant apply.

## States

Standard popover-trigger states. The picker square + sliders use canvas/SVG; track mouse + keyboard.

## Accessibility

- Trigger: `role="button"`, `aria-label="Choose color"`, `aria-haspopup="dialog"`.
- Popover: `role="dialog"`, `aria-label="Color picker"`.
- Saturation/value square: `role="slider"`, `aria-valuetext` describing current color (e.g., "Hue 285, Saturation 70%, Value 90%").
- Hue/alpha sliders: standard slider role.
- Numeric inputs: standard input fields with labels.

### Keyboard

The square is hard to navigate by keyboard. Provide:
- `Tab` to reach square; arrow keys move dot by small steps.
- Numeric inputs: type to set exact value.
- Preset swatches: tab through, Enter to apply.

For users who prefer, the hex input is the primary path on keyboard.

## Format conversion

Internally, store as a single canonical format (often HSV or RGB), convert to display format on output. Use a library:

- `tinycolor2` — robust conversions
- `chroma.js` — color manipulation
- `culori` — modern, OKLCH-aware

Don't roll your own — color math is hard and there are subtle edge cases.

## Don't

- Don't use ColorPicker for picking from a fixed brand palette. Use a Tag/swatch picker.
- Don't auto-apply on hover (only on commit).
- Don't omit accessible name. Color values aren't enough.
- Don't show only the picker without numeric inputs — accessibility requires keyboard alternative.

## References

- Ant Design: [`refs/ant-design/components/color-picker/`](../docs/reference/ant-design.md#color-picker) — comprehensive. Has presets, alpha, multiple format inputs.
- MUI: no built-in. Use `react-colorful` or similar.
- shadcn-ui: no built-in. Compose with `Popover` + `react-colorful`.

## Cross-reference

- [`knowledge/colors/color-theory.md`](../knowledge/colors/color-theory.md) — color spaces (OKLCH, HSL)
- [`knowledge/a11y/contrast.md`](../knowledge/a11y/contrast.md) — when picking text colors, verify contrast
