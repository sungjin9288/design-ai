# `FormLabel` — spec

> Synthesized from MUI `FormLabel`. The label of a form input — handles required-asterisk, focused color, error color via parent `FormControl`. Use this OR `<label htmlFor>` directly; FormLabel adds the design-system styling.

## When to use

- Label for any `OutlinedInput` / `Select` / custom input inside `FormControl`.
- For `Checkbox` / `Radio` / `Switch`, prefer `FormControlLabel` (label-wraps-control pattern).

## API

```tsx
<FormControl required error={!!emailError}>
  <FormLabel htmlFor="email">이메일</FormLabel>
  <OutlinedInput id="email" />
  <FormHelperText>...</FormHelperText>
</FormControl>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `htmlFor` | `string` | — | Match the input's `id` (REQUIRED for click-to-focus + screen-reader association) |
| `children` | `ReactNode` | — | Label text |
| `required` | `boolean` | inherited | Visual asterisk |
| `error` | `boolean` | inherited | Color as error |
| `focused` | `boolean` | inherited | Color when input focused |
| `disabled` | `boolean` | inherited | Mute when disabled |
| `component` | `ElementType` | `'label'` | Override (use `'legend'` inside `<fieldset>`) |
| `filled` | `boolean` | inherited | Match Filled variant spacing |

## States

| State | Color |
| --- | --- |
| Default | `fg-default` |
| Focused | `fg-primary` |
| Error | `fg-error` |
| Disabled | `fg-muted` |
| Required | Same color + `*` suffix |

## Tokens consumed

```
--font-size-body
--font-weight-medium
--color-fg-default
--color-fg-primary       /* focused */
--color-fg-error
--color-fg-muted         /* disabled */
--space-xs               /* margin-bottom to input */
```

## Accessibility

- `htmlFor` MUST match the input's `id`. Without it, click-on-label-focuses-input doesn't work AND screen readers don't announce the label.
- For groups (RadioGroup, FormGroup), use `component="legend"` inside a `<fieldset>` (FormControl handles fieldset for you when you set `component="fieldset"`).
- Required asterisk: visual decoration; pair with `aria-required="true"` on the input for screen readers.
- Korean labels: keep short (1-3 words). Avoid "을/를" particles in label form ("이메일" not "이메일을").

## Edge cases

- **Optional indicator** — for forms where most fields are optional, label *required* fields visually rather than the inverse. Per [`knowledge/patterns/form-design.md`](../knowledge/patterns/form-design.md).
- **Long label** — wraps; check at narrow viewports.
- **Tooltip on label** — wrap label content in a Tooltip for hint-on-hover; ensure focus-visible on label still triggers the tooltip.

## Code example

```tsx
<FormControl required error={!!errors.password} fullWidth>
  <FormLabel htmlFor="password">비밀번호</FormLabel>
  <OutlinedInput
    id="password"
    type="password"
    aria-required="true"
    aria-invalid={!!errors.password}
    aria-describedby="password-help"
  />
  <FormHelperText id="password-help">
    {errors.password ?? "8자 이상, 영문 + 숫자 + 특수문자"}
  </FormHelperText>
</FormControl>
```

## Don't

- Don't omit `htmlFor` — biggest a11y miss in real codebases.
- Don't put placeholder text instead of a label — placeholders disappear on focus.
- Don't use multiple `FormLabel` per input.

## References

- MUI: [`FormLabel`](../refs/mui/packages/mui-material/src/FormLabel/)

## Cross-reference

- [`component-form-control.md`](component-form-control.md)
- [`component-form-helper-text.md`](component-form-helper-text.md)
- [`knowledge/patterns/form-design.md`](../knowledge/patterns/form-design.md)
