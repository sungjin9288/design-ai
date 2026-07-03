# `FormGroup` — spec

> Synthesized from MUI `FormGroup`. A wrapper for grouping multiple `FormControlLabel`-wrapped checkboxes. Provides spacing + optional row layout. Doesn't enforce mutual exclusivity (use `RadioGroup` for that).

## When to use

- Multi-select checkbox groups (filter options, consent checkboxes, multi-day picker).
- Inside `FormControl` to group related toggles under one label.

## API

```tsx
<FormControl>
  <FormLabel>관심 도메인 (복수 선택)</FormLabel>
  <FormGroup>
    <FormControlLabel control={<Checkbox />} label="UI/UX" />
    <FormControlLabel control={<Checkbox />} label="브랜드" />
    <FormControlLabel control={<Checkbox />} label="모션" />
  </FormGroup>
</FormControl>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | `FormControlLabel` children |
| `row` | `boolean` | `false` | Layout horizontally (default vertical) |

## States

Layout primitive — no interactive state of its own.

## Tokens consumed

```
--space-xs   /* gap between rows */
--space-md   /* gap between columns when row */
```

## Accessibility

- Wrap inside `FormControl` with `FormLabel` to give the group an accessible name.
- For required groups: `FormControl required` propagates to the FormLabel asterisk.
- Don't rely on FormGroup alone for labeling — screen readers won't announce the group purpose without a parent label.

## Edge cases

- **Many options (10+)** — switch to a multi-select Autocomplete or a search-filtered list.
- **`row` with long labels** — wraps to next line; check at narrow viewports (320px).
- **Mixing checkboxes + switches** — possible but visually inconsistent; prefer one control type per group.

## Code example

```tsx
<FormControl required component="fieldset">
  <FormLabel component="legend">법적 동의 사항</FormLabel>
  <FormGroup>
    <FormControlLabel
      control={<Checkbox required name="terms" />}
      label="이용약관에 동의해요"
    />
    <FormControlLabel
      control={<Checkbox required name="privacy" />}
      label="개인정보 수집·이용에 동의해요"
    />
    <FormControlLabel
      control={<Checkbox name="marketing" />}
      label="마케팅 수신에 동의해요 (선택)"
    />
  </FormGroup>
</FormControl>
```

## Don't

- Don't use for radio groups — use `RadioGroup` (handles `name` + mutual exclusivity).
- Don't omit the parent label — the group needs an accessible name.

## References

- MUI: [`FormGroup`](../docs/reference/mui.md#form-group)

## Cross-reference

- [`component-form-control.md`](component-form-control.md)
- [`component-form-control-label.md`](component-form-control-label.md)
- [`component-checkbox.md`](component-checkbox.md)
