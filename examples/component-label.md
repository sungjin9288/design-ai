# `Label` — spec

> Synthesized from shadcn-ui `label` and the HTML5 `<label>` element. The semantic + styled label primitive for form controls.

## When to use

- **Every form control** (Input, Select, Checkbox, Radio, Switch, Combobox).
- Wherever you'd write `<label htmlFor="...">`.

`Label` is a thin styled wrapper around `<label>` — adds typography tokens + optional required/optional indicator.

## API

```tsx
<Label htmlFor="email">이메일</Label>
<Input id="email" />

<Label htmlFor="age" required>만 14세 이상입니다</Label>

<Label htmlFor="bio" optional>자기소개 (선택)</Label>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `htmlFor` | `string` | — | Linked input id (mandatory for accessibility) |
| `required` | `boolean` | `false` | Adds asterisk visual |
| `optional` | `boolean` | `false` | Adds "(선택)" / "(optional)" text |
| `children` | `ReactNode` | — | Label text |
| `className` | `string` | — | Style override |

## CSS

```css
.label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-fg-default);
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  cursor: pointer;
  user-select: none;
}

.label[data-required]::after {
  content: "*";
  color: var(--color-error-default);
  margin-left: 2px;
}

.label[data-disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
```

## States

| State | Visual |
| --- | --- |
| Default | Standard label color |
| Hover (when paired with input) | No change (the input handles hover) |
| Disabled (when input is disabled) | Reduced opacity |

Label is presentational; states inherit from the linked input.

## Accessibility

- Always use `htmlFor` matching the input's `id`.
- Click on label focuses / activates the linked input.
- For Checkbox / Radio: clicking the label also toggles the control (native browser behavior).
- For required field, prefer `aria-required="true"` on the input over visual asterisk alone — color-blind / screen reader users miss the star.

```html
<Label htmlFor="email" required>이메일</Label>
<Input id="email" type="email" required aria-required="true" />
```

## Korean conventions

- 필수 / 선택 marker patterns:
  - 필수: asterisk `*` OR "(필수)" text after label
  - 선택: "(선택)" text after label OR no marker (assume required by default)
- Common labels: 이메일 / 비밀번호 / 이름 / 휴대폰 번호 / 주소 / 회원가입 약관 동의

## Code example

```tsx
<Field>
  <Label htmlFor="email" required>이메일</Label>
  <Input id="email" type="email" autoComplete="email" required />
  <FieldDescription>로그인할 때 사용해요.</FieldDescription>
</Field>

<Field>
  <Label htmlFor="bio" optional>자기소개</Label>
  <Textarea id="bio" rows={3} />
</Field>
```

## Don't

- Don't use Label without `htmlFor`. Just text without a link is decorative.
- Don't put long instructional text in Label. Use FieldDescription.
- Don't rely on color alone for required indicator — use asterisk OR `aria-required`.
- Don't wrap multiple inputs in one Label — confusing. Use separate Labels.

## References

- HTML5 `<label>` element
- shadcn-ui: [`label`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/label.tsx) (Radix)
- MUI: `FormLabel`

## Cross-reference

- [`examples/component-field.md`](component-field.md) — wraps Label + control
- [`examples/component-input.md`](component-input.md)
- [`examples/component-form-controls.md`](component-form-controls.md)
