# `Checkbox` — spec

> Synthesized from Ant Design `Checkbox`, MUI `Checkbox`, shadcn-ui `checkbox`. Form selection control. See also [`component-form-controls.md`](component-form-controls.md) for Switch + Radio comparisons.

## Checkbox vs Switch vs Radio

| | Checkbox | Switch | Radio |
| --- | --- | --- | --- |
| Use | Multi-select; binary form input | Setting toggle (immediate effect) | Mutually exclusive choice |
| Default state matters | Yes (form has explicit unchecked option) | Yes (immediate state) | One must be selected |
| Visual | Square box + check | iOS-style slider | Circle |

For **forms with submit button**: Checkbox.
For **immediately-applied settings**: Switch.
For **pick-one-of-many**: Radio.

## Anatomy

```
☐ Send me promotional email      ← unchecked
☑ Subscribe to newsletter         ← checked
☒ I agree (indeterminate)         ← rare, used for "mixed" group state
```

## API

```tsx
<Checkbox
  checked={subscribed}
  onCheckedChange={setSubscribed}
  id="subscribe"
/>
<label htmlFor="subscribe">Subscribe</label>

<Checkbox checked="indeterminate" onCheckedChange={...}>
  Select all
</Checkbox>

<Checkbox required disabled />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `checked` | `boolean \| "indeterminate"` | controlled | State |
| `defaultChecked` | `boolean` | `false` | Uncontrolled initial |
| `onCheckedChange` | `(checked: boolean) => void` | — | Callback |
| `disabled` | `boolean` | `false` | — |
| `required` | `boolean` | `false` | For form validation |
| `name` | `string` | — | Form field name |
| `value` | `string` | `"on"` | Form value when checked |

## States

| State | Visual |
| --- | --- |
| Unchecked | Empty box with border |
| Checked | Filled box with check icon |
| Indeterminate | Filled box with horizontal bar (group "some-checked") |
| Hover | Border color shift |
| Focus-visible | 2px focus ring |
| Disabled | Reduced opacity, no events |
| Error | Red border (form validation) |

## Indeterminate use

The "select all" pattern:

```tsx
const allChecked = items.every(i => i.checked);
const someChecked = items.some(i => i.checked) && !allChecked;
const indeterminate = someChecked;

<Checkbox
  checked={allChecked ? true : indeterminate ? "indeterminate" : false}
  onCheckedChange={(c) => setAll(c === true)}
>
  Select all
</Checkbox>

{items.map(item => (
  <Checkbox
    key={item.id}
    checked={item.checked}
    onCheckedChange={(c) => updateItem(item.id, c)}
  >
    {item.label}
  </Checkbox>
))}
```

## Tokens consumed

```
--checkbox-bg-unchecked
--checkbox-bg-checked              (brand)
--checkbox-border
--checkbox-border-checked
--checkbox-fg-check                (check icon color)
--checkbox-error-border
--checkbox-size                    (typically 16-20px)
--space-xs                         (label-checkbox gap)
--motion-fast
```

## Accessibility

- Native `<input type="checkbox">` (or Radix `<Checkbox>` with proper ARIA).
- `<label htmlFor="...">` linked. Click on label toggles.
- `aria-checked="true|false|mixed"` — the third value for indeterminate.
- For groups: wrap in `<fieldset>` + `<legend>`.
- Keyboard: Space toggles. Tab moves between checkboxes (no arrow-nav unless in a group with `role="group"`).
- Touch target ≥ 44pt mobile.

## Korean conventions

- 마케팅 정보 수신 동의 (marketing consent) — required field per 정보통신망법; default unchecked, never auto-check.
- 이용약관 동의 (terms agreement) — typically with link to terms; required for signup.
- 만 14세 이상입니다 (age confirmation) — required for KR services.

```tsx
<Checkbox required>
  <span>
    <Link href="/terms" external>이용약관</Link>에 동의합니다 (필수)
  </span>
</Checkbox>
<Checkbox>
  마케팅 정보 수신에 동의합니다 (선택)
</Checkbox>
```

## Don't

- Don't auto-check marketing consent. KR law (정보통신망법) prohibits.
- Don't omit label or `aria-label`.
- Don't use Checkbox for "Apply immediately" settings — use Switch.
- Don't make checkbox visual smaller than 16x16 (touch target may still be 44pt via padding, but visual must be readable).

## References

- Ant: [`Checkbox`](../docs/reference/ant-design.md#checkbox)
- MUI: [`Checkbox`](../docs/reference/mui.md#checkbox)
- shadcn-ui: [`checkbox`](../docs/reference/shadcn-ui.md#checkbox)

## Cross-reference

- [`examples/component-form-controls.md`](component-form-controls.md) — combined Switch + Radio + Checkbox
- [`examples/component-radio.md`](component-radio.md)
- [`examples/component-switch.md`](component-switch.md) — N/A (covered in form-controls)
- [`knowledge/patterns/email-design.md`](../knowledge/patterns/email-design.md) — KR marketing consent rules
