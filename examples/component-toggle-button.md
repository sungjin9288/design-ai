# `ToggleButton` — spec

> Synthesized from MUI `ToggleButton`. A button that stays in a "pressed" state when activated, like the formatting buttons in a rich-text editor (B / I / U). Used inside `ToggleButtonGroup` for related options.

## When to use

- Single binary toggle (e.g., "show grid").
- Set of mutually exclusive options (text alignment: left / center / right) — use inside `ToggleButtonGroup` with `exclusive`.
- Set of multi-select options (text style: bold + italic) — `ToggleButtonGroup` without `exclusive`.

## When NOT to use

- For two states with text labels (filter chips), use `Chip` with `clickable`.
- For toggling a setting on/off in a form, use `Switch` (more standard).

## Anatomy

```
┌──────┬──────┬──────┐
│  B   │  I   │  U   │   (pressed = filled bg)
└──────┴──────┴──────┘
```

## API

```tsx
<ToggleButtonGroup
  value={align}
  exclusive
  onChange={(_, v) => v && setAlign(v)}
  aria-label="text alignment"
>
  <ToggleButton value="left" aria-label="왼쪽 정렬">
    <FormatAlignLeftIcon />
  </ToggleButton>
  <ToggleButton value="center" aria-label="가운데 정렬">
    <FormatAlignCenterIcon />
  </ToggleButton>
  <ToggleButton value="right" aria-label="오른쪽 정렬">
    <FormatAlignRightIcon />
  </ToggleButton>
</ToggleButtonGroup>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `any` | required | Identifies this button to the parent group |
| `selected` | `boolean` | derived | Whether this button is pressed (auto when inside group) |
| `disabled` | `boolean` | `false` | Non-interactive; greyed |
| `onChange` | `(e, value) => void` | — | Standalone use; group manages otherwise |
| `color` | `'standard' \| 'primary' \| 'secondary' \| ...` | `'standard'` | Pressed color |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | |
| `aria-label` | `string` | — | Required for icon-only buttons |

## States

| State | Visual |
| --- | --- |
| Default | transparent bg, fg-default border |
| Hover | bg-subtle |
| Focus-visible | 2px focus ring |
| Pressed (selected) | bg-pressed (brand-tinted), fg-on-pressed |
| Disabled | reduced opacity |

## Tokens consumed

```
--toggle-bg-default
--toggle-bg-hover
--toggle-bg-pressed       /* brand-50 light, brand-900-30 dark */
--toggle-fg-default
--toggle-fg-on-pressed
--toggle-border
--toggle-min-height-32    /* small */
--toggle-min-height-40    /* medium — touch-friendly */
```

## Accessibility

- For icon-only: `aria-label` MUST be set ("왼쪽 정렬", not "Left").
- `aria-pressed` on the button reflects selected state (MUI handles this).
- Inside `ToggleButtonGroup` with `aria-label`, the group becomes a toolbar; arrow keys navigate between buttons.
- For exclusive groups, `aria-pressed` shouldn't be all unset — at least one should be pressed (or set `value=null` explicitly).

## Edge cases

- **Exclusive group with no selection** — possible if `value=null`; user can deselect by clicking the active button. Decide if that's intentional (alignment: probably no — always have one).
- **Long labels** — switch to text labels with icons. Avoid mixing icon-only and text-only in the same group.
- **Disabled subset** — possible per-button, but visually confusing if scattered. Prefer disabling the entire group.

## Code example

```tsx
function TextStyleToolbar({ formats, onChange }) {
  return (
    <ToggleButtonGroup
      value={formats}
      onChange={(_, next) => onChange(next)}
      aria-label="텍스트 스타일"
    >
      <ToggleButton value="bold" aria-label="굵게">
        <FormatBoldIcon />
      </ToggleButton>
      <ToggleButton value="italic" aria-label="기울임">
        <FormatItalicIcon />
      </ToggleButton>
      <ToggleButton value="underline" aria-label="밑줄">
        <FormatUnderlinedIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
```

## Don't

- Don't put 6+ ToggleButtons in a row — overflow into a menu.
- Don't use as a primary CTA — it's a setting control, not an action.
- Don't omit `aria-label` for icon-only.

## References

- MUI: [`ToggleButton`](../refs/mui/packages/mui-material/src/ToggleButton/) + [`ToggleButtonGroup`](../refs/mui/packages/mui-material/src/ToggleButtonGroup/)

## Cross-reference

- [`component-button.md`](component-button.md)
- [`component-toggle.md`](component-toggle.md)
- [`component-switch.md`](component-switch.md)
