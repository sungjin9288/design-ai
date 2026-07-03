# `FormControl` — spec

> Synthesized from MUI `FormControl`. The wrapper that groups a label + input + helper-text + error message together, so they share state (focused, error, disabled, required).

## When to use

- Around every form input that has a label or helper text. Skip when wrapping a single uncontrolled `TextField` (which already provides its own FormControl internally).
- Around custom composed inputs where you want consistent error/required state propagation.

## Anatomy

```
┌──────────────────────────────────────┐
│ Label *                              │  ← FormLabel
│ ┌──────────────────────────────────┐ │
│ │ Input                            │ │  ← OutlinedInput / Select / etc.
│ └──────────────────────────────────┘ │
│ Helper text or error                 │  ← FormHelperText
└──────────────────────────────────────┘
```

The visual gap between input and helper text is part of the FormControl's owned spacing.

## API

```tsx
<FormControl error={hasError} required disabled={!editable}>
  <FormLabel htmlFor="email">이메일</FormLabel>
  <OutlinedInput id="email" value={email} onChange={...} />
  <FormHelperText>{hasError ? errorMsg : '회사 이메일을 입력해 주세요'}</FormHelperText>
</FormControl>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Label + input + helper |
| `error` | `boolean` | `false` | Propagates error styling to label, input, and helper |
| `disabled` | `boolean` | `false` | Propagates disabled to all children |
| `required` | `boolean` | `false` | Propagates required (visual asterisk on label) |
| `fullWidth` | `boolean` | `false` | 100% width |
| `variant` | `'outlined' \| 'filled' \| 'standard'` | `'outlined'` | Inherited by child input |
| `size` | `'small' \| 'medium'` | `'medium'` | Inherited by child input |
| `focused` | `boolean` | — | Force-focused styling (rarely needed; auto from input focus) |
| `margin` | `'dense' \| 'normal' \| 'none'` | `'none'` | Vertical margin |

## States

| State | Visual (cascades to children) |
| --- | --- |
| Default | Standard label + input |
| Focused | Label color = primary; input border = primary |
| Error | Label color = error; input border = error; helper text = error |
| Disabled | All elements muted; no hover effects |

## Tokens consumed

```
--color-fg-default
--color-fg-error
--color-fg-primary
--space-sm        /* helper-text margin-top */
--space-md
```

## Accessibility

- The `FormLabel`'s `htmlFor` MUST match the input's `id` — without it, label clicks don't focus the input AND screen readers don't read the label.
- For required fields, the visual `*` is decorative; pair with `aria-required="true"` on the input itself.
- For error state: `aria-invalid="true"` on the input, and the FormHelperText's `id` should match `aria-describedby` so screen readers announce the error.
- Cite [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md) and [`knowledge/patterns/form-design.md`](../knowledge/patterns/form-design.md).

## Edge cases

- **Multiple FormControls in a row** — group them with `Stack` or `Grid`; don't try to nest one FormControl with multiple labels.
- **Validation message switching** — when toggling between helper text and error message, animate the color change but not the text swap (no flicker).
- **Korean field labels** — keep labels short (1-3 words) plus optional helper text. "이메일" not "이메일 주소를 입력해 주세요" as the label.

## Code example

```tsx
<FormControl error={!!errors.email} required disabled={isSubmitting} fullWidth>
  <FormLabel htmlFor="email">이메일</FormLabel>
  <OutlinedInput
    id="email"
    type="email"
    value={values.email}
    onChange={handleChange}
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? "email-error" : "email-help"}
  />
  <FormHelperText id={errors.email ? "email-error" : "email-help"}>
    {errors.email ?? '회사 이메일을 입력해 주세요'}
  </FormHelperText>
</FormControl>
```

## Don't

- Don't omit `FormLabel` for a labeled field — visual placeholder text isn't a substitute (placeholders disappear on focus).
- Don't put the helper text in a separate paragraph outside `FormControl` — error state won't propagate.
- Don't toggle `required` based on user input — set it once based on schema.

## References

- MUI: [`FormControl.d.ts`](../docs/reference/mui.md#form-control)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- [`component-form-label.md`](component-form-label.md)
- [`component-form-helper-text.md`](component-form-helper-text.md)
- [`component-form-control-label.md`](component-form-control-label.md)
- [`knowledge/patterns/form-design.md`](../knowledge/patterns/form-design.md)
