# `Switch` / `Checkbox` / `Radio` — combined spec

> Three sibling controls. They share patterns (binary/boolean inputs with a label) but differ in semantics. Speccing together avoids duplication.
>
> Citing Ant Design `Switch`/`Checkbox`/`Radio`, MUI `Switch`/`Checkbox`/`Radio`, shadcn-ui `switch`/`checkbox`/`radio-group`

## Semantic difference

| Control | Semantic | Use |
| --- | --- | --- |
| **Switch** | Apply immediately, on/off | Settings (notifications, dark mode) — change takes effect at toggle. |
| **Checkbox** | Multi-select, deferred | Form fields, tasks, multi-select lists — user toggles, then submits. |
| **Radio** | Single-select from a group, deferred | Pick one from N — payment method, plan tier. |

**Picking the wrong one is the most common mistake.** A "subscribe to newsletter" checkbox isn't a Switch — its effect is deferred to form submit.

## Anatomy — Switch

```
Off:                       On:
┌─────────────┐            ┌─────────────┐
│ ⚪          │            │          ⚪ │
└─────────────┘            └─────────────┘
gray bg                    primary bg
```

## Anatomy — Checkbox

```
Unchecked:                 Checked:                Indeterminate:
┌────┐                     ┌────┐                  ┌────┐
│    │                     │ ✓  │                  │ ─  │
└────┘                     └────┘                  └────┘
```

## Anatomy — Radio

```
Unselected:                Selected:
○                          ●
```

## API

### Switch

```tsx
<Switch
  checked={enabled}
  onCheckedChange={setEnabled}
  label="알림 받기"
  description="새 메시지가 오면 푸시 알림을 보냅니다."
  size="md"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `checked` / `defaultChecked` | `boolean` | — | Controlled / uncontrolled |
| `onCheckedChange` | `(checked: boolean) => void` | — | Fires on toggle |
| `label` | `string \| ReactNode` | — | Visible label (right side). Required for accessible name. |
| `description` | `string \| ReactNode` | — | Help text below label |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |
| `disabled` | `boolean` | `false` | |
| `name` / `value` | — | — | For native form submission |

### Checkbox

```tsx
<Checkbox
  checked={agreed}
  onCheckedChange={setAgreed}
  label="이용약관에 동의합니다"
  required
/>
```

Same props as Switch, plus:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `indeterminate` | `boolean` | `false` | Mixed state (some children selected) |
| `required` | `boolean` | `false` | Required for form |
| `error` / `errorText` | — | — | Validation state |

### RadioGroup + Radio

Radios always live in a `RadioGroup`:

```tsx
<RadioGroup
  value={method}
  onValueChange={setMethod}
  label="결제 수단"
>
  <Radio value="card" label="신용/체크카드" description="국내 모든 카드 사용 가능" />
  <Radio value="kakao" label="KakaoPay" description="간편결제" />
  <Radio value="naver" label="NaverPay" description="간편결제" />
</RadioGroup>
```

| Prop (group) | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `defaultValue` | `string` | — | Currently selected value |
| `onValueChange` | `(value: string) => void` | — | |
| `label` | `string` | — | Group label (`<legend>`) |
| `description` | `string` | — | |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | |
| `disabled` | `boolean` | `false` | Disables all radios |
| `required` | `boolean` | `false` | |
| `error` / `errorText` | — | — | |

| Prop (radio) | Type | Description |
| --- | --- | --- |
| `value` | `string` | Required. Matches `RadioGroup.value`. |
| `label` | `string \| ReactNode` | Required for accessible name. |
| `description` | `string \| ReactNode` | |
| `disabled` | `boolean` | |

## Sizes

| Size | Switch (W×H) | Checkbox / Radio | Label font |
| --- | --- | --- | --- |
| `sm` | 28 × 16 | 14 | 13px |
| `md` (default) | 36 × 20 | 16 | 14px |
| `lg` | 44 × 24 | 20 | 16px |

For mobile primary forms: `md` minimum. The control is small but the **whole row** (control + label) should be the tap target — minimum row height 44px.

## States

| State | Switch | Checkbox / Radio |
| --- | --- | --- |
| Default | Gray track | Gray border |
| Hover | Track darkens | Border darkens |
| Focus-visible | 2px ring around control | 2px ring |
| Active (toggled on) | Primary bg | Primary fill + checkmark/dot |
| Disabled | 50% opacity, no events | 50% opacity, no events |
| Error | Red border | Red border |
| Indeterminate (Checkbox only) | N/A | Filled with horizontal bar |

## Tokens consumed

```
--color-bg-default              (track off, checkbox bg unchecked)
--color-border-default          (border)
--color-border-strong           (hover border)
--color-primary-default         (track on, fill, dot)
--color-on-primary              (checkmark)
--color-text-primary            (label)
--color-text-secondary          (description)
--color-error                   (error border)
--color-focus-ring
--space-sm, --space-md
--radius-sm                     (checkbox)
--radius-full                   (switch track, radio)
--motion-fast, --easing-out     (toggle animation)
```

## Layout

```
┌─────────────────────────────────────────────────┐
│ [control]  Label (clickable to toggle)          │
│            Description (optional)                │
└─────────────────────────────────────────────────┘
   ↑
   12px gap between control and label

vs.

┌─────────────────────────────────────────────────┐
│  Label                              [control]   │  ← settings list pattern
│  Description                                    │
└─────────────────────────────────────────────────┘
```

- **Form field pattern**: control on left, label on right. Default for forms.
- **Settings row pattern**: label on left, control (Switch) on right. Default for `Settings` pages.

## Accessibility

### Native HTML preferred

- Switch: `<input type="checkbox" role="switch">` (or `<button role="switch" aria-checked>` for custom). Prefer the input.
- Checkbox: `<input type="checkbox">`.
- Radio: `<input type="radio" name="...">` (group via `name`).

Custom-styled controls hide the input visually but keep it in the DOM for native form submission + a11y.

### ARIA

- `<label htmlFor={id}>` wraps or is paired with the input (clicking label toggles).
- `aria-describedby` points to the description's id.
- `aria-required="true"` when `required`.
- `aria-invalid="true"` on error.
- Switch: native `type="checkbox"` + `role="switch"` is the AAA pattern.
- Indeterminate (Checkbox only): set via JavaScript — `el.indeterminate = true`. There's no HTML attribute.
- RadioGroup: wrap radios in `<fieldset>` + `<legend>`. Or `role="radiogroup"` + `aria-labelledby`.

### Keyboard

| Key | Switch | Checkbox | Radio |
| --- | --- | --- | --- |
| `Tab` | Reach | Reach | Reach the **selected** radio (first if none selected) |
| `Space` | Toggle | Toggle | (selects current radio) |
| `Enter` | Toggle (custom only) | (forms submit if inside form) | (forms submit) |
| `↑` `↓` | — | — | Move + select within group (radio behavior) |
| `←` `→` | — | — | Same as ↑ ↓ (when horizontal) |

### Touch target

The visible control is small (16–24px). The **clickable area** must be ≥ 44×44 — extend via the label/row. The whole `[control + label]` row is the click target.

## Edge cases

- **"Save changes" pattern with Switches**: anti-pattern. Switches mean immediate effect. If you have a Save button, use Checkboxes.
- **Required Checkbox (e.g., terms-and-conditions)**: must show validation error if unchecked at submit. `aria-invalid` + visible error text.
- **Multiple Checkboxes acting as a group**: that's fine, but if exactly-one must be picked, use a RadioGroup.
- **2 options where Radio would work**: usually a Switch reads cleaner if it's binary. "Light/Dark" → Switch (or 3-radio if "System" is also an option). "Yes/No" → Radio if part of a form, Switch if immediate.
- **Pre-selected radio**: avoid. Let users actively choose. (Exception: settings forms where defaults are explicit.)
- **Many radios (10+)**: use a Select. Radio groups become unwieldy.
- **Korean labels**: typically more verbose ("이용약관에 동의합니다" vs "I agree"). Plan label width.

## Don't

- Don't use Checkbox for "this takes effect immediately" — that's a Switch.
- Don't use Switch for "submit later" — that's a Checkbox.
- Don't use Radio for binary on/off. Use Switch (immediate) or Checkbox (form).
- Don't pre-check marketing-consent checkboxes. **Illegal in Korea** (e-commerce law) and bad practice everywhere.
- Don't use Switch as a destructive confirmation ("Delete account: [Switch]"). Confirmation needs explicit action with a button + modal.
- Don't make the control's hit area smaller than the label's. Make the entire row clickable.
- Don't combine indeterminate with disabled — visually confusing.

## References

- Ant Design: `Switch`, `Checkbox`, `Checkbox.Group`, `Radio`, `Radio.Group`, `Radio.Button`. Has `Radio.Button` for segmented-control-style radios.
- MUI: `Switch`, `Checkbox`, `Radio` + `RadioGroup` + `FormControl` for the wrapper. `FormControlLabel` for label-with-control.
- shadcn-ui: [`switch.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/switch.tsx), [`checkbox.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/checkbox.tsx), [`radio-group.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/radio-group.tsx). Radix primitives. **Default for new projects.**

API choices made:
- **`onCheckedChange(checked)` for Switch + Checkbox**, **`onValueChange(value)` for RadioGroup**: matches the actual user intent — Switch/Checkbox is "what's the boolean?", RadioGroup is "what's the value?".
- **`label` and `description` as props**: 90% of forms use both; props are faster than composition. Composition (`<Switch.Label>`) is the escape hatch.
- **Three components in one spec**: shared a11y rules and visual language; treating them separately would force triplicate maintenance.

## Cross-reference

- [examples/component-input.md](component-input.md) — also a form input, but text-typed
- [examples/component-form.md](component-form.md) — orchestration of multiple form controls
- [knowledge/a11y/keyboard-and-focus.md](../knowledge/a11y/keyboard-and-focus.md) — keyboard contracts
- [knowledge/i18n/korean-product-conventions.md](../knowledge/i18n/korean-product-conventions.md) — required marketing-consent split
