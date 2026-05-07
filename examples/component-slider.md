# `Slider` — spec

> Citing Ant Design `Slider`, MUI `Slider`, shadcn-ui `slider`

## Purpose

A control for selecting a numeric value (or a range) by dragging. Used for: volume, price filter, opacity, brightness, age range.

## When Slider vs Input

| Use Slider | Use Input (numeric) |
| --- | --- |
| Approximate value matters more than exact | Exact value matters |
| Continuous range with no obvious snap points | Discrete options or precise numbers |
| Visual feedback as the user adjusts | User knows the value (e.g., DOB year, transaction amount) |

For amounts (currency, distance), prefer Input. For preferences (volume, contrast adjustment), Slider.

## Anatomy

```
Single value:
0 ──────●─────────── 100
        45

Range:
0 ─────●━━━━━━━●─── 100
       20      80
```

| Slot | Required | Notes |
| --- | --- | --- |
| Track | yes | Background line |
| Range fill | yes | Filled portion (single: 0→thumb, range: thumb1→thumb2) |
| Thumb(s) | yes | Draggable circle(s) |
| Tick marks | optional | Small lines at intervals |
| Step labels | optional | Numbers at tick positions |
| Value display | optional | Tooltip at thumb OR fixed display nearby |

## API

```tsx
<Slider
  value={volume}
  onValueChange={setVolume}
  min={0}
  max={100}
  step={1}
  label="볼륨"
  showValue
/>

<Slider
  value={priceRange}
  onValueChange={setPriceRange}
  min={0}
  max={1000000}
  step={10000}
  range
  label="가격대"
  formatValue={(v) => `₩${v.toLocaleString()}`}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `defaultValue` | `number \| [number, number]` | — | Single or range. `[number, number]` triggers range mode |
| `onValueChange` | `(value) => void` | — | Fires while dragging (debounced) |
| `onValueCommit` | `(value) => void` | — | Fires only on drag-end (use for expensive updates) |
| `range` | `boolean` | inferred from value type | Force range mode |
| `min` / `max` | `number` | `0` / `100` | |
| `step` | `number` | `1` | Increment per arrow key / tick |
| `marks` | `{ value: number, label?: string }[]` | — | Custom marks |
| `disabled` | `boolean` | `false` | |
| `label` | `string` | — | Visible label (above slider) |
| `showValue` | `boolean` | `false` | Render value as tooltip on thumb |
| `formatValue` | `(value) => string` | `String(value)` | Custom format |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | |
| `inverted` | `boolean` | `false` | Right-to-left direction |

## States

| State | Visual |
| --- | --- |
| Default | Track + thumb at value position |
| Hover (thumb) | Thumb slightly larger or shadow |
| Focus-visible | 2px ring around thumb |
| Dragging | Cursor: grabbing; thumb scaled up; tooltip visible |
| Disabled | Track + thumb muted, no events |

## Sizes

| Size | Track height | Thumb size |
| --- | --- | --- |
| `sm` | 2px | 14px |
| `md` (default) | 4px | 18px |
| `lg` | 6px | 22px |

For mobile touch: `md` minimum. The thumb's hit area extends beyond the visible thumb by ~12px each side to support thumb dragging.

## Tokens consumed

```
--color-bg-subtle           (track)
--color-primary-default      (range fill, thumb)
--color-bg-default           (thumb center, ring)
--color-text-primary         (value display)
--color-focus-ring
--space-xs, --space-sm
--radius-full                (thumb)
--motion-fast, --easing-out
--shadow-card                 (thumb shadow)
```

## Accessibility — WAI-ARIA Slider pattern

- Single thumb: `role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-orientation`, `aria-label` (or `aria-labelledby`).
- Range: two `role="slider"` thumbs, each with their own valuenow + label ("Minimum price" / "Maximum price").
- `aria-valuetext` if the displayed value isn't a plain number (e.g., "₩50,000" instead of "50000").

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reach slider (thumb 1; if range, then thumb 2) |
| `←` / `↓` | Decrement by `step` |
| `→` / `↑` | Increment by `step` |
| `Home` | min value |
| `End` | max value |
| `PageUp` / `PageDown` | Larger step (typically 10× step) |

For range slider with overlapping thumbs: each thumb maintains independent focus + keyboard control. Thumb that would cross the other "pushes" it (or stops at the other's position).

## Touch / drag behavior

- Hit area for thumb: 44×44 pt minimum (extend with invisible padding).
- Drag the track: should jump-to-value-and-start-drag from any track position.
- Snap to step: cleanly, no fractional positions.
- Vibration / haptic feedback (mobile): subtle haptic at each step crossing for some apps; off by default for sliders that are continuous-feeling.

## Edge cases

- **Range thumbs overlap**: when min and max meet, thumbs occupy the same space. Allow this (they're interchangeable). Visual: render z-index so the active one is on top.
- **`step` doesn't divide `max - min` evenly**: thumb snaps to nearest step; the max position might not be reachable. Prefer round-numbered max + step combinations.
- **Very large ranges with small step**: 0–1,000,000 with step=1 gives a million positions but only ~1000 px of track. Thumb position is still continuous; consider bumping step to 1000 or showing a numeric input next to the slider for precision.
- **Vertical orientation**: arrow keys reverse on `↑`/`↓` semantically (up = increase). Keep that.
- **RTL**: track flows right-to-left automatically with `dir="rtl"`. Use logical CSS.
- **Dragging while page scrolls**: prevent accidental page scroll on touch — use `touch-action: none` on the slider.

## Code example

```tsx
// Volume control
<Slider
  label="볼륨"
  value={volume}
  onValueChange={setVolume}
  min={0}
  max={100}
  step={1}
  showValue
  formatValue={(v) => `${v}%`}
/>

// Price range filter
<Slider
  label="가격대"
  value={priceRange}
  onValueChange={setPriceRange}    // updates UI live
  onValueCommit={fetchResults}      // server-fetch only on release
  min={0}
  max={1000000}
  step={10000}
  range
  marks={[
    { value: 0, label: "₩0" },
    { value: 250000, label: "₩25만" },
    { value: 500000, label: "₩50만" },
    { value: 750000, label: "₩75만" },
    { value: 1000000, label: "₩100만+" },
  ]}
  formatValue={(v) => `₩${v.toLocaleString()}`}
/>

// Disabled state with explanation
<Slider value={50} disabled aria-label="요금제 한도 도달" />
```

## Don't

- Don't use Slider for exact numeric input where the exact value matters. Use a number input (or both — common in price filters: slider + two number inputs synced).
- Don't omit `aria-label` (or `label` prop). Sliders without an accessible name are unusable.
- Don't fire expensive operations on `onValueChange` (debounce 100ms minimum, or use `onValueCommit`).
- Don't disable the slider without explaining why (tooltip or inline help).
- Don't have `step` so small that arrow keys feel useless (1 over a 0–1,000,000 range — 1,000,000 keypresses).
- Don't show a slider for binary choices. Use a Switch.
- Don't layer two sliders on top of each other to fake range. Use proper range mode.

## References

- Ant Design: [`refs/ant-design/components/slider/`](../refs/ant-design/components/slider/) — `Slider` with `range`, `marks`, `step`, `included` (whether range fill shows). Solid impl.
- MUI: [`refs/mui/packages/mui-material/src/Slider/`](../refs/mui/packages/mui-material/src/Slider/) — `Slider` with rich `marks`, `valueLabelDisplay`, `track="normal" | "false" | "inverted"`. Most comprehensive.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/slider.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/slider.tsx) — Radix Slider primitive. Simplest API.

## Cross-reference

- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md) — keyboard contract for slider
- [`examples/component-input.md`](component-input.md) — when number input is the right choice instead
