# `InputAdornment` — spec

> Synthesized from MUI `InputAdornment`. Leading or trailing content slot for an input — icons (search, calendar, currency), text prefixes/suffixes (`₩`, `@`), or interactive controls (clear button, password toggle).

## When to use

- Search input → leading magnifying glass.
- Currency input → leading `₩` or `$`.
- Password input → trailing show/hide toggle.
- Email input → trailing domain hint.

## API

```tsx
<OutlinedInput
  startAdornment={
    <InputAdornment position="start">
      <SearchIcon />
    </InputAdornment>
  }
  endAdornment={
    <InputAdornment position="end">
      <IconButton aria-label="지우기" size="small">
        <CloseIcon />
      </IconButton>
    </InputAdornment>
  }
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `position` | `'start' \| 'end'` | required | Which side |
| `children` | `ReactNode` | — | The content |
| `disablePointerEvents` | `boolean` | `false` | When the adornment is decorative-only (icon, prefix text), this lets clicks pass through to the input |
| `disableTypography` | `boolean` | `false` | Skip default Typography wrapping (for non-text adornments) |

## Tokens consumed

```
--space-sm        /* gap between adornment and input value */
--icon-size-md    /* default 24px */
--color-fg-muted  /* default adornment color */
```

## Accessibility

- **Decorative icons**: set `aria-hidden="true"` on the icon + `disablePointerEvents={true}` on the adornment.
- **Interactive adornments** (clear button, password toggle): use `IconButton` inside with explicit `aria-label`. Set `edge="start"` or `edge="end"` on the IconButton for proper alignment.
- **Text prefixes** like `₩` are decorative — wrap in `<Typography>` and `aria-hidden="true"`. The input's `inputMode="decimal"` + numeric value handle the actual semantics.

## Edge cases

- **Adornment focus tab order** — interactive adornments are part of the tab order BEFORE/AFTER the input, depending on `position`. End-adornments tab AFTER the input — usually correct (clear button after typing).
- **Korean prefix labels** — for "원" suffix, use `position="end"`. Don't put it inside the input as text — the input's value should stay numeric.
- **Combining start + end** — fine, but watch for narrow widths; long text in both can squeeze the input.

## Code example

```tsx
function PriceInput({ value, onChange }) {
  return (
    <FormControl fullWidth>
      <FormLabel htmlFor="price">가격</FormLabel>
      <OutlinedInput
        id="price"
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        startAdornment={
          <InputAdornment position="start" disablePointerEvents>
            <Typography aria-hidden>₩</Typography>
          </InputAdornment>
        }
        endAdornment={
          <InputAdornment position="end" disablePointerEvents>
            <Typography color="text.secondary" aria-hidden>원</Typography>
          </InputAdornment>
        }
      />
    </FormControl>
  );
}
```

## Don't

- Don't put non-trivial UI in adornments (whole forms, multi-line text) — they collapse oddly.
- Don't omit `aria-label` on interactive adornments.
- Don't set `disablePointerEvents` on interactive adornments — it breaks them.

## References

- MUI: [`InputAdornment`](../refs/mui/packages/mui-material/src/InputAdornment/)

## Cross-reference

- [`component-input-base.md`](component-input-base.md)
- [`component-outlined-input.md`](component-outlined-input.md)
- [`component-amount-input.md`](component-amount-input.md) — currency-specific composition
