# `Field` — spec

> Synthesized from shadcn-ui `field` (an opinionated form-field wrapper). The "Field family" — `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldSet`, `FieldLegend` — ship as a set, providing a consistent layout for labeled form inputs. Pairs with [`examples/component-form.md`](component-form.md) for the broader form composition.

## When to use

- **Wrapping any form input** (Input, Textarea, Select, Checkbox, Switch) with consistent label / description / error layout.
- **Replacing ad-hoc div+label markup** with a semantic, a11y-correct primitive.
- **As the building block** for higher-level form patterns (Form skill in design-ai).

When NOT to use:
- Pure presentation labels (use a `<label>` directly).
- Complex multi-input compositions — use `FieldGroup`.

## Field family

```
FieldSet (multi-field section, optional)
└─ FieldLegend (section heading)
   └─ FieldGroup (related fields, e.g., First + Last name)
      └─ Field (single labeled control)
         ├─ FieldLabel
         ├─ <Input> | <Select> | <Checkbox> | etc.
         ├─ FieldDescription (helper text, optional)
         └─ FieldError (validation message, conditional)
```

## Anatomy

```
Email                        ← FieldLabel
[ user@example.com  ]        ← <Input>
We'll never share your...    ← FieldDescription
Email is required            ← FieldError (when invalid)
```

## API

```tsx
<Field>
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <Input id="email" type="email" {...register("email")} />
  <FieldDescription>We'll never share your email.</FieldDescription>
  <FieldError>{errors.email?.message}</FieldError>
</Field>

<FieldGroup>
  <Field>
    <FieldLabel htmlFor="first">First name</FieldLabel>
    <Input id="first" {...register("first")} />
  </Field>
  <Field>
    <FieldLabel htmlFor="last">Last name</FieldLabel>
    <Input id="last" {...register("last")} />
  </Field>
</FieldGroup>

<FieldSet>
  <FieldLegend>Notification preferences</FieldLegend>
  <Field>
    <FieldLabel htmlFor="email-notif">
      <Checkbox id="email-notif" />
      Email notifications
    </FieldLabel>
  </Field>
  <Field>
    <FieldLabel htmlFor="sms-notif">
      <Checkbox id="sms-notif" />
      SMS notifications
    </FieldLabel>
  </Field>
</FieldSet>
```

## Composition

| Part | Purpose | Semantic element |
| --- | --- | --- |
| `Field` | Wrapper for one labeled input | `<div>` |
| `FieldLabel` | Label for the input | `<label>` |
| `FieldDescription` | Helper text below | `<p>` (linked via `aria-describedby`) |
| `FieldError` | Validation error | `<p role="alert">` (linked via `aria-describedby`) |
| `FieldGroup` | Visual grouping of related fields (no semantic) | `<div role="group">` |
| `FieldSet` | Semantic group with shared legend | `<fieldset>` |
| `FieldLegend` | Heading for `FieldSet` | `<legend>` |

## Variants

### Layout direction

| Layout | Use |
| --- | --- |
| Vertical (default) | Label above input; mobile-friendly |
| Horizontal | Label left of input (rare; tight tabular forms) |
| Inline | Single-line for short inputs (search, toggle) |

```tsx
<Field orientation="horizontal">
  <FieldLabel>Country</FieldLabel>
  <Select>...</Select>
</Field>
```

### Required indicator

```tsx
<Field required>
  <FieldLabel>Email *</FieldLabel>
  <Input ... />
</Field>
```

The `required` prop on Field auto-adds:
- `aria-required="true"` on the wrapped input
- Visual asterisk on FieldLabel
- Optional: required marker on the right OR text "(required)"

### Optional indicator (Korean / Japanese style)

For markets that mark optional vs required: `<Field optional>` adds "(선택)" / "(任意)".

## States

| State | Visual |
| --- | --- |
| Default | Resting |
| Focused | Input shows focus ring |
| Filled | Input has value |
| Disabled | Reduced opacity; input non-interactive |
| Read-only | No focus ring; muted bg |
| Error | Input border red; FieldError visible; FieldDescription dims |
| Success | Optional checkmark icon (post-validation) |

## Tokens consumed

```
--field-gap                        (vertical space between Label / Input / Description)
--field-label-fg
--field-description-fg             (typically muted)
--field-error-fg                   (red)
--field-asterisk-fg                (required marker color)
--space-xs, --space-sm, --space-md
--font-size-sm                     (Label, Description, Error)
--font-weight-medium               (Label)
--motion-fast                      (state transitions)
```

## Accessibility

- `FieldLabel` uses real `<label htmlFor="...">`. Click on label focuses input.
- `FieldDescription` linked via `aria-describedby="<id>-desc"`.
- `FieldError` linked via `aria-describedby="<id>-err"`. When error visible, both descriptions can be linked: `aria-describedby="<id>-desc <id>-err"`.
- `aria-invalid="true"` on input when in error state.
- `FieldSet` is a real `<fieldset>` — screen readers announce the legend before each input within it. Critical for grouped checkboxes / radios.
- Required: prefer `aria-required` over relying on visual asterisk alone.
- Touch targets: input ≥ 44pt for primary mobile.

## Korean conventions

```
이메일                          ← FieldLabel
[ user@example.com  ]
이메일은 공유되지 않아요.        ← FieldDescription (해요체)
이메일을 입력해 주세요.          ← FieldError
```

- 해요체 ("...해요") for casual brand voice
- 합쇼체 ("...해 주세요") for formal / banking
- "(선택)" for optional, "(필수)" or "*" for required
- Avoid mixing levels within one form

## Code example — sign-up form

```tsx
function SignupForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Field required>
        <FieldLabel htmlFor="email">이메일</FieldLabel>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        <FieldDescription>로그인 시 사용해요.</FieldDescription>
        {errors.email && <FieldError>{errors.email.message}</FieldError>}
      </Field>

      <Field required>
        <FieldLabel htmlFor="password">비밀번호</FieldLabel>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          aria-invalid={!!errors.password}
        />
        <FieldDescription>8자 이상, 영문 + 숫자 + 특수문자 포함.</FieldDescription>
        {errors.password && <FieldError>{errors.password.message}</FieldError>}
      </Field>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="first">이름</FieldLabel>
          <Input id="first" {...register("first")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="last">성</FieldLabel>
          <Input id="last" {...register("last")} />
        </Field>
      </FieldGroup>

      <FieldSet>
        <FieldLegend>알림 설정</FieldLegend>
        <Field>
          <FieldLabel htmlFor="marketing">
            <Checkbox id="marketing" {...register("marketing")} />
            마케팅 정보 수신 동의 (선택)
          </FieldLabel>
        </Field>
      </FieldSet>

      <Button type="submit">가입하기</Button>
    </form>
  );
}
```

## Edge cases

- **Multiple errors on same field**: show only the most-relevant; or stack with separator.
- **Async validation**: show "Checking..." state while validating; transition to FieldError or success.
- **Input is wrapped in another component** (e.g., Combobox, DatePicker): Field still works; pass id via Combobox's render prop.
- **Field with multiple inputs** (e.g., date split into 3 inputs): use FieldGroup; each input has its own aria-labelled-by referencing FieldLabel.
- **Help icon next to label**: render Tooltip trigger in FieldLabel; tooltip content = additional context.
- **Reduced motion**: skip transition on error appearance.

## Don't

- Don't use plain `<div>` + `<label>` for form fields. Use Field — a11y baked in.
- Don't omit FieldDescription for non-obvious inputs. Help users.
- Don't rely on placeholder as label. Placeholder ≠ label.
- Don't show error before user has interacted with the field. On-blur or on-submit, not on-change.
- Don't use FieldSet for visual grouping only. Use FieldGroup. FieldSet has semantic meaning.
- Don't use red text alone for error — pair with icon for color-blind users.
- Don't auto-focus on error after submit if there are multiple errors — focus on first invalid field, but only one.

## References

- shadcn-ui: [`field`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/field.tsx)
- WAI-ARIA Authoring Practices: form labeling
- Native HTML: `<fieldset>`, `<legend>`, `<label>`

## Cross-reference

- [`examples/component-form.md`](component-form.md) — Form composition (uses Field internally)
- [`examples/component-form-controls.md`](component-form-controls.md) — Switch / Checkbox / Radio (Field-compatible)
- [`examples/component-input.md`](component-input.md) — most common Field child
- [`knowledge/patterns/form-design.md`](../knowledge/patterns/form-design.md)
- [`knowledge/i18n/korean-document-style.md`](../knowledge/i18n/korean-document-style.md) — 해요체 / 합쇼체
