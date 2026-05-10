# `OutlinedInput` — spec

> Synthesized from MUI `OutlinedInput`. The outlined-border input variant — clearer affordance than filled or underline. Default for most product UIs.

## When to use

- Default form input for product UIs.
- When users need a clear "this is a field" affordance (vs filled which can blend into card backgrounds).
- For dense forms with many fields, consider `FilledInput` (less visual noise) — but accessibility default is outlined.

## Anatomy

```
┌── Label ─────────────┐
│ Input value          │   ← label notches the border on focus
└──────────────────────┘
```

## API

```tsx
<FormControl variant="outlined" fullWidth>
  <FormLabel htmlFor="email">이메일</FormLabel>
  <OutlinedInput
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="hong@example.com"
    startAdornment={<InputAdornment position="start"><EmailIcon /></InputAdornment>}
  />
</FormControl>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `defaultValue` | `string` | — | Controlled / uncontrolled |
| `onChange` | `(e) => void` | — | Change handler |
| `type` | `string` | `'text'` | HTML input type |
| `placeholder` | `string` | — | Placeholder (NOT a substitute for label) |
| `startAdornment` | `ReactNode` | — | Leading content (icon, prefix) |
| `endAdornment` | `ReactNode` | — | Trailing content (clear button, unit) |
| `multiline` | `boolean` | `false` | Render as textarea |
| `rows` | `number` | — | Multi-line height |
| `maxRows` / `minRows` | `number` | — | Auto-resize bounds |
| `disabled` | `boolean` | `false` | |
| `error` | `boolean` | inherited | From parent FormControl |
| `fullWidth` | `boolean` | inherited | |
| `inputProps` | `InputHTMLAttributes` | — | Pass-through to native input (autoComplete, inputMode, pattern) |
| `inputRef` | `Ref` | — | Ref to native input |
| `notched` | `boolean` | derived | Notch label-cutout (auto when label is visible) |

## States

| State | Visual |
| --- | --- |
| Default | 1px border-default |
| Hover | border-strong |
| Focus | 2px brand border, label fg-primary |
| Error | 2px error border, label fg-error |
| Disabled | muted border, muted fg |
| Read-only | same as default but no caret |

## Tokens consumed

```
--input-border-default
--input-border-hover
--input-border-focus      /* brand */
--input-border-error
--input-bg                /* surface */
--input-radius
--input-padding-x
--input-min-height-40     /* touch-friendly */
--input-min-height-32     /* small */
--font-size-body
--space-sm                /* gap to adornment */
```

## Accessibility

- Pair with `FormLabel` via `id` ↔ `htmlFor`.
- For required: `aria-required="true"` (in addition to FormControl `required` for the visual asterisk).
- For error: `aria-invalid="true"` + `aria-describedby` matching FormHelperText `id`.
- Touch target: 40px min (default `medium` size). For dense forms `small` (32px) — desktop only.
- `inputProps={{ autoComplete: '...' }}` — set semantically (`email`, `name`, `tel`, `address-line1`, etc.) so password managers and autofill work.

## Edge cases

- **Korean IME composition** — `onChange` fires on each keystroke including IME composition characters. For "search-as-you-type" scenarios that should wait for committed input, use `onCompositionEnd`. Cite [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md).
- **Long values** — input scrolls horizontally inside the field. For multi-line, set `multiline maxRows={4}`.
- **Clear button** — not built-in. Add via `endAdornment` with a small IconButton; show only when `value.length > 0`.
- **Password visibility toggle** — same pattern: `endAdornment` IconButton that toggles `type` between `password` and `text`.

## Code example

```tsx
function PasswordField({ value, onChange, error }) {
  const [show, setShow] = useState(false);

  return (
    <FormControl error={!!error} fullWidth>
      <FormLabel htmlFor="pw">비밀번호</FormLabel>
      <OutlinedInput
        id="pw"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputProps={{ autoComplete: 'current-password', minLength: 8 }}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'}
              onClick={() => setShow(!show)}
              edge="end"
            >
              {show ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </InputAdornment>
        }
      />
      <FormHelperText>{error ?? '8자 이상, 영문 + 숫자 + 특수문자'}</FormHelperText>
    </FormControl>
  );
}
```

## Don't

- Don't use `placeholder` as the only label — disappears on focus, accessibility issue.
- Don't omit `autoComplete` — autofill won't work, slowing user-friction in onboarding.
- Don't toggle `disabled` based on transient state without restoring focus on re-enable.

## References

- MUI: [`OutlinedInput`](../refs/mui/packages/mui-material/src/OutlinedInput/) + [`InputBase`](../refs/mui/packages/mui-material/src/InputBase/)

## Cross-reference

- [`component-input.md`](component-input.md)
- [`component-input-base.md`](component-input-base.md)
- [`component-filled-input.md`](component-filled-input.md)
- [`component-input-adornment.md`](component-input-adornment.md)
- [`component-form-control.md`](component-form-control.md)
- [`knowledge/patterns/form-design.md`](../knowledge/patterns/form-design.md)
