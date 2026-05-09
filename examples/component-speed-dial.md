# `SpeedDial` — spec

> Synthesized from MUI `SpeedDial`. A floating action button (FAB) that expands into a radial / vertical menu of secondary actions on hover or tap. Common in mobile apps for "create" / "compose" multi-action triggers.

## When to use

- Mobile app primary action with 2-5 sub-actions ("New post", "Camera", "Voice memo").
- Editor canvas tool palette.
- Quick-action menu in dashboards.

When NOT to use:
- One-off action (use plain FAB / `FloatButton`).
- 6+ sub-actions (becomes overwhelming; use full menu).
- Desktop primary nav (use Sidebar / NavigationMenu).

## Anatomy

```
                        [✏️] Compose
                        [📷] Camera
                        [🎤] Voice
                        [➕]    ← FAB (collapsed)

Closed: just the FAB.
Open: actions fan up (or out radially) above the FAB.
```

## API

```tsx
<SpeedDial
  ariaLabel="Create"
  icon={<PlusIcon />}
  openIcon={<XIcon />}
>
  <SpeedDial.Action
    icon={<EditIcon />}
    tooltipTitle="Compose"
    onClick={compose}
  />
  <SpeedDial.Action
    icon={<CameraIcon />}
    tooltipTitle="Camera"
    onClick={openCamera}
  />
  <SpeedDial.Action
    icon={<MicIcon />}
    tooltipTitle="Voice"
    onClick={recordVoice}
  />
</SpeedDial>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `ariaLabel` | `string` | required | FAB accessible label |
| `icon` | `ReactNode` | — | Closed-state icon |
| `openIcon` | `ReactNode` | rotated `icon` | Open-state icon (often X) |
| `direction` | `"up" \| "down" \| "left" \| "right"` | `"up"` | Action expansion direction |
| `placement` | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left"` | `"bottom-right"` | FAB position on screen |
| `hidden` | `boolean` | `false` | Hide entire SpeedDial |
| `open` | `boolean` | controlled | Open state |
| `onOpen` / `onClose` | function | — | State callbacks |

## States

| State | Visual |
| --- | --- |
| Closed | FAB only |
| Hover (desktop) | Auto-opens (configurable) |
| Tap (mobile) | Opens with stagger animation |
| Open | Actions visible with tooltip labels |
| Action hover | Action highlights |
| Action click | Closes SpeedDial; fires action |

## Animation

```
Open: actions fan out one-by-one with 50ms stagger
      Each scales from 0 to 1 + fades in
      Total: ~250ms

Close: reverse, faster (~150ms)

Backdrop: optional dim of background while open
```

Reduced motion: skip stagger; instant appear / disappear.

## Tokens consumed

```
--fab-bg                           (FAB color)
--fab-fg
--fab-shadow
--fab-size                         (typically 56px)
--speed-dial-action-bg             (smaller secondary FABs)
--speed-dial-action-fg
--speed-dial-action-size           (40-44px)
--speed-dial-tooltip-bg
--speed-dial-tooltip-fg
--space-md
--motion-medium
--ease-out
--z-fab
```

## Accessibility

- FAB: `<button aria-label="..." aria-haspopup="true" aria-expanded>`.
- Action: `<button aria-label="...">`.
- Each Action has visible (or aria-described) tooltip.
- Keyboard: focus FAB → Enter opens → arrow keys navigate actions → Enter activates.
- Esc closes.
- Focus trap optional (depending on whether actions are independent or sequential).

## Korean conventions

- 작성하기 / 새 글 / 새 글 쓰기 — common labels for "compose"
- 카메라 / 사진 / 동영상 — for media actions
- 음성 메모 — voice memo
- 안전영역 (safe area) on iOS — bottom inset 고려

## Code example

```tsx
function MobileApp() {
  return (
    <>
      <main>{/* main content */}</main>

      <SpeedDial
        ariaLabel="새로 만들기"
        icon={<PlusIcon />}
        placement="bottom-right"
        direction="up"
        sx={{ position: "fixed", bottom: 80, right: 16 }}
      >
        <SpeedDial.Action
          icon={<EditIcon />}
          tooltipTitle="새 글"
          onClick={() => navigate("/compose")}
        />
        <SpeedDial.Action
          icon={<CameraIcon />}
          tooltipTitle="사진"
          onClick={openCamera}
        />
        <SpeedDial.Action
          icon={<MicIcon />}
          tooltipTitle="음성"
          onClick={recordVoice}
        />
      </SpeedDial>
    </>
  );
}
```

## Don't

- Don't put 6+ actions. Becomes overwhelming.
- Don't open on hover for mobile-primary apps (no hover; users miss it). Tap-only on mobile.
- Don't omit safe-area inset on iOS — FAB covered by home indicator.
- Don't use SpeedDial when a single-purpose FAB suffices.
- Don't anchor at top — expectations are bottom corner.

## References

- MUI: [`SpeedDial`](../refs/mui/packages/mui-material/src/SpeedDial)
- Material Design: SpeedDial pattern
- Patterns: Twitter / Instagram compose FAB

## Cross-reference

- [`examples/component-float-button.md`](component-float-button.md) — single-action FAB
- [`examples/component-bottom-navigation.md`](component-bottom-navigation.md) — common companion
