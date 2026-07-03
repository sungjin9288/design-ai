# `InputBase` — spec

> Synthesized from MUI `InputBase`. The unstyled foundation of every MUI input variant (`OutlinedInput`, `FilledInput`, `Input`, `TextField`'s internals). Use directly when you need a fully custom-styled input that still gets MUI's accessibility + IME + adornment behavior.

## When to use

- Building a custom-styled input that doesn't fit `OutlinedInput`/`FilledInput`.
- Composition primitive for design-system-specific input variants.
- For 99% of cases, prefer `OutlinedInput` (default styling + label notch).

## Anatomy

```
┌─[start adornment]─[input element]─[end adornment]─┐
│                                                    │
└────────────────────────────────────────────────────┘
```

## API

```tsx
<InputBase
  inputProps={{ "aria-label": "search" }}
  startAdornment={<SearchIcon />}
  placeholder="검색..."
  sx={{ /* full custom styling */ }}
/>
```

39 props (full surface). Most-used:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `defaultValue` | `unknown` | — | Controlled / uncontrolled value |
| `onChange` | `(e) => void` | — | Change handler |
| `type` | `string` | `'text'` | HTML input type |
| `multiline` | `boolean` | `false` | Render as `<textarea>` |
| `rows` / `minRows` / `maxRows` | `number` | — | Multi-line height |
| `placeholder` | `string` | — | Placeholder text |
| `startAdornment` / `endAdornment` | `ReactNode` | — | Leading/trailing content |
| `disabled` | `boolean` | `false` | |
| `readOnly` | `boolean` | `false` | Caret disabled, no editing |
| `error` | `boolean` | `false` | Error state |
| `fullWidth` | `boolean` | `false` | |
| `autoFocus` | `boolean` | `false` | Focus on mount |
| `inputProps` | `InputHTMLAttributes` | — | Pass-through to native input (autoComplete, inputMode, pattern, maxLength, etc.) |
| `inputRef` | `Ref` | — | Ref to native input |
| `inputComponent` | `ElementType` | `'input'` | Override the inner element (e.g., for masked input libraries) |
| `name` | `string` | — | Form name |
| `required` | `boolean` | `false` | |
| `slots` / `slotProps` | `object` | — | MUI v5+ component override pattern |
| `sx` | `SxProps` | — | Style override |

## States

| State | Visual |
| --- | --- |
| Default | inherits parent FormControl styling |
| Focus | inherits FormControl focus styling |
| Disabled | reduced opacity, no caret |
| Error | inherits FormControl error styling |
| Read-only | no caret, but still focusable + selectable |

## Tokens consumed

InputBase has no built-in tokens — it inherits from the parent FormControl + your custom `sx` styles. Token cascade comes from the variant wrapper (`OutlinedInput`, `FilledInput`).

## Accessibility

- `inputProps` is the right place for native semantics: `autoComplete`, `inputMode`, `pattern`, `maxLength`, `aria-*`.
- For required: pair `required` with `aria-required="true"` (for older AT compatibility).
- `inputComponent` is the seam for masked-input libraries (react-imask, react-text-mask) — they need to forward refs correctly; check the library docs.
- Cite [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md).

## Edge cases

- **Korean IME composition** — `onChange` fires per keystroke including IME composition. For "search-as-you-type" patterns, use `onCompositionEnd` instead. Cite [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md).
- **`inputComponent` swap** — when using a masked-input lib, the component must implement `forwardRef` correctly. Common gotcha: cursor jumps on every keystroke if the implementation doesn't preserve selection.
- **`multiline=true` + `maxRows`** — the textarea grows up to `maxRows` then becomes scrollable. Don't set both `rows` and `maxRows` — pick auto-grow or fixed.
- **`type="search"`** — adds an "X" clear button in some browsers (Safari, Chrome on macOS). For consistent UX, render your own end-adornment with a clear icon.

## Code example

```tsx
// Custom search field with clear + icon
function SearchField({ value, onChange, onClear }) {
  return (
    <InputBase
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="검색..."
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        px: 2,
        py: 1,
        '&:focus-within': { borderColor: 'primary.main' },
      }}
      startAdornment={
        <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} aria-hidden />
      }
      endAdornment={
        value && (
          <IconButton size="small" onClick={onClear} aria-label="검색어 지우기">
            <CloseIcon fontSize="small" />
          </IconButton>
        )
      }
      inputProps={{ "aria-label": "검색", autoComplete: "off" }}
    />
  );
}
```

## Don't

- Don't use directly when an existing variant (`OutlinedInput`, `FilledInput`, `TextField`) fits — you'll re-implement focus styling, label association, and helper-text wiring.
- Don't omit `inputProps={{ "aria-label": ... }}` if there's no associated `<label>` — the input has no accessible name otherwise.
- Don't pass styling via `style` prop — use `sx` for theme integration.

## References

- MUI: [`InputBase`](../docs/reference/mui.md#input-base)

## Cross-reference

- [`component-outlined-input.md`](component-outlined-input.md) — outlined variant (default)
- [`component-filled-input.md`](component-filled-input.md) — filled variant
- [`component-input.md`](component-input.md) — standard variant
- [`component-input-adornment.md`](component-input-adornment.md)
- [`component-form-control.md`](component-form-control.md)
- [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md) — IME notes
