# `SpeedDialAction` — spec

> Synthesized from MUI `SpeedDialAction`. Single action item inside a [`SpeedDial`](component-speed-dial.md) — child component, surfaces an icon + tooltip when the parent is open.

## API

```tsx
<SpeedDial ariaLabel="새로 만들기" icon={<PlusIcon />}>
  <SpeedDialAction
    icon={<EditIcon />}
    tooltipTitle="새 글"
    onClick={() => navigate("/compose")}
  />
  <SpeedDialAction
    icon={<CameraIcon />}
    tooltipTitle="사진"
    onClick={openCamera}
  />
</SpeedDial>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `icon` | `ReactNode` | required | Action icon |
| `tooltipTitle` | `string` | required | Tooltip / aria label |
| `tooltipPlacement` | `"top" \| "bottom" \| "left" \| "right"` | per parent | Tooltip side |
| `tooltipOpen` | `boolean` | `false` | Always-visible label (instead of hover) |
| `onClick` | `() => void` | — | Action callback |
| `disabled` | `boolean` | `false` | Disabled |

## States

| State | Visual |
| --- | --- |
| Hidden (parent closed) | Not rendered |
| Visible (parent open) | Animated entrance with stagger |
| Hover | Bg shift + tooltip visible |
| Pressed | Active state |
| Disabled | Reduced opacity, no events |

## Animation

Entrance: scaled from 0 → 1 + fades in. Stagger 50ms between siblings (handled by parent SpeedDial).

## Tokens consumed

```
--speed-dial-action-bg
--speed-dial-action-fg
--speed-dial-action-size           (typically 40-44px)
--speed-dial-action-shadow
--motion-fast
--ease-out
```

Inherits from parent SpeedDial's tokens.

## Accessibility

- `<button aria-label={tooltipTitle}>`.
- Tooltip optional (parent shows them by default).
- Touch target ≥ 44pt.
- For tooltipOpen=true: tooltip becomes a persistent label, not a hover hint.

## Don't

- Don't ship SpeedDialAction outside a SpeedDial parent — orphan.
- Don't omit tooltipTitle. It's the accessible label.
- Don't make actions different sizes within one SpeedDial.

## References

- MUI: [`SpeedDialAction`](../docs/reference/mui.md#speed-dial-action)

## Cross-reference

- [`examples/component-speed-dial.md`](component-speed-dial.md) — parent
- [`examples/component-icon-button.md`](component-icon-button.md) — sibling pattern
