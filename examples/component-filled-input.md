# `FilledInput` — spec

> Synthesized from MUI `FilledInput`. Filled-background input variant — denser, less prominent than `OutlinedInput`. Useful inside cards or dense forms where 30+ borders would create visual noise.

## When to use

- Dense data-entry forms (10+ fields per screen).
- Inputs inside cards with already-active borders (avoids "border on border").
- Mobile-first layouts where the filled look reads as a touch target.

## When NOT to use

- General-purpose product UI — `OutlinedInput` has the cleanest "this is editable" affordance.
- Forms with many error states — error styling is more legible against an outlined background.

## Anatomy

```
┌─ Label (floats up on focus) ─────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│   ← filled bg
│ ░Input value                            ░│
│ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│   ← bottom rule (focus → brand)
└─────────────────────────────────────────────┘
```

## API

```tsx
<FormControl variant="filled" fullWidth>
  <InputLabel htmlFor="name">이름</InputLabel>
  <FilledInput
    id="name"
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
</FormControl>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `defaultValue` | `string` | — | Controlled / uncontrolled |
| `disableUnderline` | `boolean` | `false` | Hide the bottom rule |
| `hiddenLabel` | `boolean` | `false` | Drop the label region (use placeholder only) |

Inherits everything from `InputBase` — see [`component-input-base.md`](component-input-base.md).

## States

| State | Visual |
| --- | --- |
| Default | bg-subtle fill, neutral underline |
| Hover | bg-subtle (slightly darker) |
| Focus | brand underline (animates from neutral) |
| Error | error underline + label color |
| Disabled | muted bg + fg |

## Tokens consumed

```
--input-bg-filled         /* surface-subtle */
--input-bg-filled-hover
--input-underline
--input-underline-focus   /* brand */
--input-underline-error
--input-min-height-48     /* taller than outlined to compensate for filled aesthetic */
```

## Accessibility

Same a11y contract as `OutlinedInput`:
- `htmlFor` ↔ `id` association via `InputLabel`.
- `aria-required`, `aria-invalid`, `aria-describedby` per state.
- Touch target: ≥ 48px (default — `FilledInput` is taller than `OutlinedInput` by design).

## Edge cases

- **Mixing variants on one screen** — pick one. Mixed outlined + filled looks haphazard.
- **`hiddenLabel`** — only acceptable when context is unmistakable (e.g., a search field labeled by a magnifying-glass icon nearby with `aria-label`).
- **Korean labels** — same density consideration as outlined; expect labels to need 10-15% more horizontal room than Latin.

## Code example

```tsx
<Stack direction="column" gap={1.5}>
  <FormControl variant="filled" fullWidth>
    <InputLabel htmlFor="name">이름</InputLabel>
    <FilledInput id="name" />
  </FormControl>
  <FormControl variant="filled" fullWidth>
    <InputLabel htmlFor="email">이메일</InputLabel>
    <FilledInput id="email" type="email" />
  </FormControl>
  <FormControl variant="filled" fullWidth>
    <InputLabel htmlFor="phone">전화번호</InputLabel>
    <FilledInput id="phone" type="tel" />
  </FormControl>
</Stack>
```

## Don't

- Don't mix with `OutlinedInput` on the same form.
- Don't use `disableUnderline=true` without an alternative focus indicator — accessibility break.
- Don't use without `InputLabel` (or `inputProps.aria-label`) — silent accessibility miss.

## References

- MUI: [`FilledInput`](../refs/mui/packages/mui-material/src/FilledInput/)

## Cross-reference

- [`component-input-base.md`](component-input-base.md)
- [`component-outlined-input.md`](component-outlined-input.md)
- [`component-form-control.md`](component-form-control.md)
