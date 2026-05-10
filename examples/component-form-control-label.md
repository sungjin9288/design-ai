# `FormControlLabel` — spec

> Synthesized from MUI `FormControlLabel`. The label-wraps-control pattern for `Checkbox` / `Radio` / `Switch` — the entire label area becomes the click target. Without it, users have to click the tiny check/radio circle directly (poor touch UX).

## When to use

- Any standalone `Checkbox` / `Radio` / `Switch` with a visible label.
- Inside `FormGroup` for grouped checkboxes.
- Inside `RadioGroup` for radio sets (RadioGroup wires up `name` automatically).

## Anatomy

```
[control]   Label text
   └─────── click target spans both ────────┘
```

## API

```tsx
<FormControlLabel
  control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />}
  label="개인정보 수집 및 이용에 동의해요"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `control` | `ReactElement` | required | The Checkbox/Radio/Switch |
| `label` | `ReactNode` | — | Label text or component |
| `labelPlacement` | `'start' \| 'end' \| 'top' \| 'bottom'` | `'end'` | Label position relative to control |
| `disabled` | `boolean` | inherited | Disable the entire label+control |
| `required` | `boolean` | `false` | Visual asterisk (label only) |
| `value` | `any` | — | When inside RadioGroup |
| `componentsProps` | `{ typography?: TypographyProps }` | — | Customize label typography |

## States

| State | Visual |
| --- | --- |
| Default | Control + label fg-default |
| Hover | Subtle bg ripple from control |
| Focus | Control's focus ring; label color unchanged |
| Disabled | Both control + label muted |
| Checked / unchecked | Driven by inner control |

## Tokens consumed

```
--font-size-body
--color-fg-default
--color-fg-muted          /* disabled */
--space-sm                /* gap between control and label */
```

## Accessibility

- Label is implicitly associated via the wrapping `<label>` element — no explicit `htmlFor` needed when `control` is a child.
- For long labels with HTML inside (links, **bold**), screen readers read the entire label as the control's name.
- Don't put interactive elements (other buttons/links) inside the label — they conflict with the click target.
- For consent checkboxes with required-acceptance, also set `aria-required="true"` on the inner Checkbox.

## Edge cases

- **Long label wrapping** — wraps cleanly; the click target stays aligned with the control on the first line.
- **Korean labels with embedded link** — "이용약관에 동의해요" with link on "이용약관". Use `<Link onClick={(e) => e.stopPropagation()}>` to prevent toggling the checkbox when the link is clicked.
- **labelPlacement="start"** — useful for settings rows where the label is the question and the Switch is the answer.
- **Inside Stack with multiple labels** — `Stack gap={0}` — don't add extra gap; FormControlLabel has its own.

## Code example

```tsx
function ConsentCheckboxes() {
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });

  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Checkbox
            checked={consents.terms}
            onChange={(e) => setConsents({ ...consents, terms: e.target.checked })}
          />
        }
        label={
          <>
            <Link
              href="/terms"
              target="_blank"
              onClick={(e) => e.stopPropagation()}
            >
              이용약관
            </Link>
            에 동의해요 <span style={{ color: 'red' }}>*</span>
          </>
        }
        required
      />
      <FormControlLabel
        control={<Checkbox checked={consents.privacy} onChange={...} />}
        label="개인정보 수집 동의"
        required
      />
      <FormControlLabel
        control={<Checkbox checked={consents.marketing} onChange={...} />}
        label="마케팅 수신 동의 (선택)"
      />
    </FormGroup>
  );
}
```

## Don't

- Don't put a button inside `label` — clicking the button toggles the control, confusing users.
- Don't use it without a visible label — for icon-only toggles, use `IconButton` with `aria-label`.
- Don't place the control too far from the label visually (`labelPlacement="bottom"` with extra gap) — the connection becomes unclear.

## References

- MUI: [`FormControlLabel`](../refs/mui/packages/mui-material/src/FormControlLabel/)

## Cross-reference

- [`component-form-control.md`](component-form-control.md)
- [`component-form-group.md`](component-form-group.md)
- [`component-checkbox.md`](component-checkbox.md)
- [`component-radio.md`](component-radio.md)
- [`component-switch.md`](component-switch.md)
- [`knowledge/patterns/form-design.md`](../knowledge/patterns/form-design.md)
