# `Rate` (Rating) — spec

> Citing Ant Design `Rate`, MUI `Rating`, shadcn-ui (composed)

## Purpose

A row of star (or other) icons for capturing or displaying a rating. Used for: product reviews, satisfaction scoring, content quality feedback.

## Two distinct uses

| Use | Mode | Example |
| --- | --- | --- |
| **Input rating** | Interactive | "Rate your experience" |
| **Display rating** | Read-only | "4.3 ★ (1,247 reviews)" |

The component is the same; the props differ. Always implement input behavior accessibly.

## Anatomy

```
Input mode (hover state):
☆ ☆ ☆ ☆ ☆           ← empty (default)
★ ★ ★ ☆ ☆           ← user picked 3
★ ★ ★ ⭑ ☆           ← user hovering 4 (preview)

With half-star precision:
★ ★ ⯨ ☆ ☆           ← 2.5 stars

Display mode:
★ ★ ★ ★ ⯨  4.5     (1,247)

Other shapes:
😡 😞 😐 🙂 😍     emoji-based scale
👎 👍               binary
1 2 3 4 5          numeric scale (NPS-style 0-10 also)
```

## API

```tsx
<Rate value={rating} onValueChange={setRating} />
<Rate value={4.3} readOnly count={5} />
<Rate value={3} max={10} />     {/* 10-point scale */}
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | `0` | Current value |
| `onValueChange` | `(value: number) => void` | — | (Input mode only) |
| `defaultValue` | `number` | — | Uncontrolled |
| `count` | `number` | `5` | Number of icons (rating max) |
| `precision` | `number` | `1` | Smallest increment (0.5 for half-star, 0.1 for finer) |
| `readOnly` | `boolean` | `false` | Display only — no hover/click |
| `disabled` | `boolean` | `false` | |
| `allowClear` | `boolean` | `true` | Click on the active value to clear (input mode only) |
| `icon` | `ReactNode \| ((index, value) => ReactNode)` | star | Custom icon |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |
| `label` | `string` | — | Accessible label |
| `tooltips` | `string[]` | — | Per-rating tooltip ("나쁨", "보통", "좋음", "아주 좋음", "최고") |

## Sizes

| Size | Icon size |
| --- | --- |
| `sm` | 16px |
| `md` (default) | 20px |
| `lg` | 28px |

For input mode on mobile: `lg`. The hit area extends ~8px around each icon.

## Behavior

### Input mode

- Hover over an icon: preview that rating (and lower stars filled).
- Click: commit value.
- If `allowClear`: clicking on the currently-selected icon clears.
- Half-star: clicking the left half of an icon = `n - 0.5`, right half = `n`.

### Display mode

- Renders the value as filled icons (with partial fill for fractional values).
- No hover effects.
- Often paired with numeric value + count.

## States

| State | Visual |
| --- | --- |
| Empty | All icons in `--color-text-tertiary` |
| Hovered | Preview rating in primary or yellow |
| Selected | Filled icons in `--color-warning` (yellow stars) or brand color |
| Half | Filled half + empty half |
| Disabled | Muted, no events |
| Read-only | Non-interactive, no hover |

## Tokens consumed

```
--color-warning             (default star color — yellow)
OR
--color-primary-default     (when brand-aligned)
--color-text-tertiary       (empty icons)
--color-text-secondary      (numeric value beside)
--color-focus-ring
--space-xs
--motion-fast               (hover transition)
```

## Accessibility — WAI-ARIA Slider pattern (input)

For input mode, use `role="slider"`:

- `role="slider"`
- `aria-valuenow={value}`
- `aria-valuemin={0}`
- `aria-valuemax={count}`
- `aria-valuetext={tooltip[value-1]}` if tooltips defined (more descriptive than just the number)
- `aria-label="Rating"`
- `tabIndex={0}` to be keyboard-reachable

For display mode (readOnly):
- `aria-label="Rating: 4.3 out of 5"`
- No interactive role needed — it's text equivalent

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reach the rating control (single tab stop) |
| `←` / `↓` | Decrement by `precision` |
| `→` / `↑` | Increment by `precision` |
| `Home` | 0 |
| `End` | max |
| `Enter` (with focus) | (no-op or commit, depending on UX) |
| `Esc` | (Input form context) cancel |
| `0`–`9` | Jump to that rating value |

## Code example

```tsx
// Standard 5-star input with tooltips
<Rate
  value={rating}
  onValueChange={setRating}
  tooltips={["나쁨", "보통", "좋음", "아주 좋음", "최고"]}
  label="만족도"
  size="lg"
/>

// Half-star precision
<Rate value={rating} onValueChange={setRating} precision={0.5} />

// Display mode with details
<div className="flex items-center gap-2">
  <Rate value={4.3} readOnly />
  <span className="font-medium">4.3</span>
  <span className="text-text-secondary">(1,247 리뷰)</span>
</div>

// Custom icon (heart for favorite)
<Rate value={1} count={1} icon={(i, v) => v === 0 ? <HeartIcon /> : <HeartFilled />} />

// Emoji-based satisfaction
<Rate
  value={mood}
  onValueChange={setMood}
  count={5}
  icon={(i, v) => <span>{["😡", "😞", "😐", "🙂", "😍"][i]}</span>}
  tooltips={["아주 별로", "별로", "보통", "좋음", "최고"]}
/>
```

## Edge cases

- **Fractional displays**: `value=4.3` renders 4 full + a partial 5th. CSS clip-path or width-based fill.
- **Hover then click outside**: revert to actual value.
- **`allowClear` with hover preview**: hovering the current value should NOT preview clear. Clear only on click.
- **Touch devices**: no hover. Click-only commits. Drag-to-rate is uncommon — stick to tap.
- **Very large counts (10+)**: stars become small/cramped. Switch to numeric input or NPS-style 0–10 number row.
- **Required rating in form**: render error state if value=0 on submit.
- **Localized labels**: tooltips ("나쁨" / "Bad") matching locale.

## Don't

- Don't show stars without numeric value when display mode — users want both.
- Don't auto-submit a form on rating click.
- Don't use 5-star for binary feedback (helpful / not helpful). Use thumbs.
- Don't disable arrow keys — rating is a slider semantically.
- Don't use yellow stars on yellow backgrounds. Pick a contrasting color.
- Don't omit tooltips for input ratings — without them, the rating values are abstract.

## References

- Ant Design: [`refs/ant-design/components/rate/`](../refs/ant-design/components/rate/) — `Rate` with `count`, `allowHalf`, `tooltips`, custom `character`. Most flexible.
- MUI: [`refs/mui/packages/mui-material/src/Rating/`](../refs/mui/packages/mui-material/src/Rating/) — `Rating` with `precision`, `IconContainerComponent`, `getLabelText` for a11y. Solid impl.
- shadcn-ui: no built-in. Compose from icons + state.

## Cross-reference

- [`examples/component-slider.md`](component-slider.md) — Rate is essentially a discrete-step slider
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md) — slider keyboard contract
