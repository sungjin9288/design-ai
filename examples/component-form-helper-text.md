# `FormHelperText` — spec

> Synthesized from MUI `FormHelperText`. The helper / error text below an input. Inherits `error` and `disabled` state from the parent `FormControl` so consumers don't conditionally style.

## When to use

- Below every input that needs guidance ("회사 이메일을 입력해 주세요").
- Below every input that can show validation errors.
- Skip when an input is fully self-explanatory (rare for a sound design).

## API

```tsx
<FormControl error={!!emailError} required>
  <FormLabel htmlFor="email">이메일</FormLabel>
  <OutlinedInput id="email" />
  <FormHelperText id="email-help">
    {emailError ?? "회사 도메인 이메일을 입력해 주세요"}
  </FormHelperText>
</FormControl>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | The helper / error text |
| `disabled` | `boolean` | inherited | Mute when disabled |
| `error` | `boolean` | inherited | Color as error |
| `filled` | `boolean` | inherited | Match Filled variant spacing |
| `focused` | `boolean` | inherited | Color when input focused |
| `margin` | `'dense' \| 'normal' \| 'none'` | `'normal'` | Top spacing |
| `required` | `boolean` | inherited | (Not visualized; from FormControl) |

## States

| State | Color |
| --- | --- |
| Default | `fg-muted` |
| Focused | `fg-primary` |
| Error | `fg-error` |
| Disabled | reduced opacity |

## Tokens consumed

```
--font-size-caption   /* 12px */
--color-fg-muted
--color-fg-primary
--color-fg-error
--space-xs            /* margin-top */
```

## Accessibility

- Pair with input via `aria-describedby` matching this element's `id`.
- For error states, also set `aria-invalid="true"` on the input.
- Avoid putting links inside helper text — they're hard to spot at this size and easy to miss.

## Edge cases

- **Switching between helper and error** — keep the same `id`; switch text content. Don't unmount/remount (the screen reader association breaks).
- **Multi-line helper** — wraps; for long text, consider moving to a Tooltip or below-block info instead.
- **Korean honorific** — match the form's overall register. Onboarding: 해요체 ("입력해 주세요"). Legal/contracts: 합쇼체 ("입력하시기 바랍니다").

## Code example

```tsx
<FormControl error={!!errors.email} fullWidth>
  <FormLabel htmlFor="email">이메일</FormLabel>
  <OutlinedInput
    id="email"
    type="email"
    aria-invalid={!!errors.email}
    aria-describedby="email-help"
  />
  <FormHelperText id="email-help">
    {errors.email ?? "회사 도메인 이메일을 입력해 주세요"}
  </FormHelperText>
</FormControl>
```

## Don't

- Don't use raw `<p>` for helper text — `error` state won't auto-propagate.
- Don't conditionally hide the helper element when there's no error and there used to be — the layout shifts and screen readers lose the association.
- Don't pile multiple FormHelperText siblings — combine into one node.

## References

- MUI: [`FormHelperText`](../refs/mui/packages/mui-material/src/FormHelperText/)

## Cross-reference

- [`component-form-control.md`](component-form-control.md)
- [`component-form-label.md`](component-form-label.md)
- [`knowledge/patterns/form-design.md`](../knowledge/patterns/form-design.md)
