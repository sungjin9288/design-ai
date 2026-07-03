# `Switch` — spec

> Synthesized from Ant Design `Switch`, MUI `Switch`, shadcn-ui `switch`. iOS-style toggle for binary on/off settings. See [`component-form-controls.md`](component-form-controls.md) for Switch + Checkbox + Radio comparison.

## Switch vs Checkbox

> **Switch = immediate effect setting. Checkbox = form input.**

- Settings page: `Switch` ("Enable notifications" — toggles immediately).
- Signup form: `Checkbox` ("I agree to terms" — submitted with form).

## Anatomy

```
Off:     ◯━━ ━━━━━           On:     ━━━━━ ━━●
```

Track + thumb. Thumb slides from left to right when toggled.

## API

```tsx
<Switch
  checked={enabled}
  onCheckedChange={setEnabled}
  id="notifications"
/>

<Switch checked={loading ? enabled : ...} disabled={loading} />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `checked` | `boolean` | controlled | State |
| `defaultChecked` | `boolean` | `false` | Uncontrolled initial |
| `onCheckedChange` | `(checked: boolean) => void` | — | Callback |
| `disabled` | `boolean` | `false` | — |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | — |
| `name` / `value` | `string` | — | Form attributes |

## Sizes

| Size | Track w×h | Thumb |
| --- | --- | --- |
| sm | 28×16 | 12 |
| md (default) | 44×24 | 20 |
| lg | 56×32 | 28 |

Touch target ≥ 44pt regardless via padding.

## States

| State | Visual |
| --- | --- |
| Off | Track: muted gray; thumb left |
| On | Track: brand color; thumb right |
| Hover | Subtle track color shift |
| Focus-visible | Ring around track |
| Disabled | Reduced opacity |
| Loading (optional) | Spinner replaces thumb |

## Tokens consumed

```
--switch-track-off
--switch-track-on               (brand)
--switch-thumb
--switch-thumb-disabled
--motion-fast                   (200ms slide)
--ease-out
```

## Accessibility

- `<button role="switch" aria-checked="true|false">`.
- `aria-label` if no visible label.
- Keyboard: Space toggles; Enter doesn't (per WAI-ARIA Switch).

## Korean conventions

- 알림 받기, 다크 모드, 자동 저장 — typical settings labels (해요체).
- For 마케팅 정보 수신: use Checkbox (form), not Switch (immediate effect).

## Don't

- Don't use Switch in forms with Submit. That's Checkbox.
- Don't make Switch < 28px wide. Touch / readability.
- Don't lazy-render label state ("On" / "Off") — let the visual track show state.

## References

- Ant: [`Switch`](../docs/reference/ant-design.md#switch)
- MUI: [`Switch`](../docs/reference/mui.md#switch)
- shadcn-ui: [`switch`](../docs/reference/shadcn-ui.md#switch)

## Cross-reference

- [`examples/component-form-controls.md`](component-form-controls.md)
- [`examples/component-checkbox.md`](component-checkbox.md)
