# `InputNumber` — spec

> Synthesized from Ant Design `InputNumber`. Numeric input with up/down stepper buttons, formatting, and min/max constraints. shadcn / MUI ship a generic `<TextField type="number">` instead — Ant's specialized component handles formatting (commas, decimals), parsing, and IME edge cases that the generic falls down on.

## When to use

- Quantities (수량, 인원, 횟수).
- Prices / amounts where commas matter.
- Bounded inputs (rating 1-5, percentage 0-100).

## When NOT to use

- Currency input with extensive formatting → use a specialized `AmountInput` per [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md).
- Phone numbers → text input with masking, not numeric.

## Anatomy

```
┌────────────────┐
│ 12,345    ▲▼  │   ← stepper buttons (up/down)
└────────────────┘
```

## API

```tsx
<InputNumber
  min={0}
  max={100}
  step={1}
  value={qty}
  onChange={setQty}
  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
  parser={(v) => v.replace(/,/g, '')}
  addonAfter="개"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `defaultValue` | `number` | — | Controlled / uncontrolled value |
| `onChange` | `(value) => void` | — | Fires on commit (blur, Enter, stepper) |
| `min` / `max` | `number` | `-Infinity` / `Infinity` | Bounds |
| `step` | `number` | `1` | Stepper increment |
| `precision` | `number` | — | Decimal places |
| `formatter` | `(value) => string` | — | Display transform (e.g., add commas) |
| `parser` | `(displayValue) => number` | — | Reverse the formatter on input |
| `controls` | `boolean \| { upIcon, downIcon }` | `true` | Show stepper buttons |
| `prefix` / `addonBefore` | `ReactNode` | — | Leading content (icon / unit) |
| `suffix` / `addonAfter` | `ReactNode` | — | Trailing content (unit / "원") |
| `disabled` | `boolean` | `false` | |
| `size` | `'small' \| 'middle' \| 'large'` | `'middle'` | |
| `keyboard` | `boolean` | `true` | Enable arrow keys to step |
| `stringMode` | `boolean` | `false` | Use string for big-int values (decimals beyond JS number precision) |
| `status` | `'error' \| 'warning'` | — | Validation state |

## States

| State | Visual |
| --- | --- |
| Default | Border, fg-default |
| Focus | Brand border + ring |
| Hover | Stepper buttons reveal (or always visible per design system) |
| Error | Red border + helper |
| Disabled | Muted, stepper hidden |

## Tokens consumed

```
--input-bg
--input-border
--input-border-focus
--input-border-error
--input-min-height-32
--input-min-height-40
--input-padding-x
--font-family-mono     /* tabular numerals for clean alignment */
```

## Accessibility

- Renders as `<input type="text" inputmode="decimal">` (NOT `type="number"` — that breaks `formatter`).
- Stepper buttons need `aria-label="증가"` / `aria-label="감소"`.
- Arrow Up/Down keys step through values when focused.
- For min/max bounds, surface invalid attempts via `aria-invalid` + helper text rather than silently clamping.
- Cite [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md).

## Edge cases

- **Korean IME entering numbers** — IME shouldn't intercept; `inputmode="decimal"` brings up numeric keyboard on mobile. Test on a real device — desktop testing misses IME edge cases per [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md).
- **Paste with formatting** — "12,345원" pasted should parse to 12345 via `parser`. Don't reject — clean it.
- **Decimal precision overflow** — JS `0.1 + 0.2 = 0.30000000000000004`. Use `precision={2}` + display rounding, or `stringMode` for invoices/finance.
- **Negative values** — explicit `min={0}` if not allowed; otherwise minus sign is accepted.
- **Empty value** — `value=null` vs `value=undefined` vs `value=0` are distinct. Decide your convention; document it.
- **Big numbers (> Number.MAX_SAFE_INTEGER)** — use `stringMode={true}` to keep precision.

## Code example

```tsx
// Quantity picker
<InputNumber
  min={1}
  max={99}
  defaultValue={1}
  onChange={(qty) => setQty(qty ?? 1)}
  addonAfter="개"
  size="middle"
  aria-label="수량"
/>

// Price input with comma formatting
<InputNumber
  min={0}
  step={100}
  precision={0}
  value={price}
  onChange={setPrice}
  addonBefore="₩"
  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
  parser={(v) => Number(v?.replace(/,/g, '') ?? 0)}
  style={{ width: '100%' }}
/>
```

## Don't

- Don't use `<input type="number">` for prices — formatting/IME break.
- Don't silently clamp to bounds without a message — user wonders why their input changed.
- Don't omit unit suffix for ambiguous numbers (12 what?).
- Don't use without `inputmode="decimal"` on mobile.

## References

- Ant Design: [`InputNumber`](../refs/ant-design/components/input-number/)

## Cross-reference

- [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md)
- [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md)
- [`component-input.md`](component-input.md)
- [`component-amount-input.md`](component-amount-input.md)
