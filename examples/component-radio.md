# `Radio` (and `RadioGroup`) — spec

> Synthesized from Ant Design `Radio`, MUI `Radio`/`RadioGroup`, shadcn-ui `radio-group`. Mutually exclusive choice control. See also [`component-form-controls.md`](component-form-controls.md).

## Radio vs Select

> Radio for **2-5 visible options**. Select / Combobox for **6+** OR when space is constrained.

| | Radio | Select |
| --- | --- | --- |
| All options visible | Yes | No (one at a time) |
| Use | Few visible options; explicit choice | Many options; chosen value visible |
| Visual | Each option as a row | Compact dropdown |

## Anatomy

```
Pick payment method:

○ Credit card
●  KakaoPay
○ Toss
○ Bank transfer
```

## API

```tsx
<RadioGroup value={method} onValueChange={setMethod}>
  <RadioGroup.Item value="card" id="card" />
  <label htmlFor="card">Credit card</label>

  <RadioGroup.Item value="kakao" id="kakao" />
  <label htmlFor="kakao">KakaoPay</label>

  <RadioGroup.Item value="toss" id="toss" />
  <label htmlFor="toss">Toss</label>
</RadioGroup>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | controlled | Selected value |
| `defaultValue` | `string` | — | Uncontrolled initial |
| `onValueChange` | `(value: string) => void` | — | Callback |
| `disabled` | `boolean` | `false` | Disable all items |
| `required` | `boolean` | `false` | One must be selected |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | Layout |

## States

| State | Visual |
| --- | --- |
| Unselected | Empty circle with border |
| Selected | Filled circle with brand-color dot inside |
| Hover | Border color shift |
| Focus-visible | Ring around the focused item |
| Disabled | Reduced opacity |

## Layouts

### Vertical (default)

```
○ Option 1
○ Option 2
● Option 3
```

### Horizontal

```
○ Option 1   ○ Option 2   ● Option 3
```

For 2-3 short options.

### Card-style (visual-rich)

```
┌─────────────────────┐ ┌─────────────────────┐
│ ●  KakaoPay         │ │ ○  Toss             │
│    No fees          │ │    1.5% fee         │
└─────────────────────┘ └─────────────────────┘
```

Whole card clickable; radio dot in corner OR replaced by border highlight.

## Tokens consumed

```
--radio-bg-unchecked
--radio-bg-checked-dot             (brand color dot inside)
--radio-border
--radio-border-checked
--radio-error-border
--radio-size                       (typically 16-20px)
--space-sm                         (item gap)
--motion-fast
```

## Accessibility

- `RadioGroup`: `role="radiogroup"` + `aria-labelledby` (often referencing a heading).
- `Radio.Item`: `role="radio"` + `aria-checked`.
- Keyboard:
  - Tab moves into the group (focuses the selected one or first if none).
  - Arrow keys navigate within the group AND change selection.
  - Space activates if not already activated.
- For required: `aria-required="true"` on group; show error if no selection on submit.
- Label every radio with linked `<label htmlFor>`.

## Code example — Korean fintech payment method

```tsx
function PaymentMethodPicker({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend>결제 수단</legend>
      <RadioGroup value={value} onValueChange={onChange}>
        <div className="radio-row">
          <RadioGroup.Item value="kakao" id="pay-kakao" />
          <label htmlFor="pay-kakao">
            <Image src="/kakaopay-logo.svg" alt="KakaoPay" />
            카카오페이
          </label>
        </div>
        <div className="radio-row">
          <RadioGroup.Item value="naver" id="pay-naver" />
          <label htmlFor="pay-naver">
            <Image src="/naverpay-logo.svg" alt="NaverPay" />
            네이버페이
          </label>
        </div>
        <div className="radio-row">
          <RadioGroup.Item value="toss" id="pay-toss" />
          <label htmlFor="pay-toss">
            <Image src="/toss-logo.svg" alt="Toss" />
            토스페이
          </label>
        </div>
      </RadioGroup>
    </fieldset>
  );
}
```

## Don't

- Don't use Radio for binary on/off — use Switch (immediate effect) or Checkbox (form).
- Don't allow zero selection in a required group. Validation must catch it.
- Don't make the visual circle smaller than 16x16. Touch target ≥ 44pt via padding.
- Don't omit `<fieldset>` + `<legend>` for the group context.
- Don't have only one radio in a group. That's a Checkbox or just a single button.

## References

- Ant: [`Radio`](../refs/ant-design/components/radio)
- MUI: [`Radio`](../refs/mui/packages/mui-material/src/Radio)
- shadcn-ui: [`radio-group`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/radio-group.tsx)
- WAI-ARIA: [Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)

## Cross-reference

- [`examples/component-form-controls.md`](component-form-controls.md) — combined with Switch + Checkbox
- [`examples/component-checkbox.md`](component-checkbox.md)
- [`examples/component-payment-method-selector.md`](component-payment-method-selector.md) — KR payment specialization
