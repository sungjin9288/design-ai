---
title: Ant Design seed tokens
source: refs/ant-design/components/theme/themes/seed.ts
upstream: https://github.com/ant-design/ant-design/blob/master/components/theme/themes/seed.ts
extracted_at: 2026-05-19
applies_to: [react, antd, design-system]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Ant Design seed tokens

Ant Design uses a layered token model: **seed tokens** (raw inputs) → **map tokens** (derived scales) → **alias tokens** (semantic names). This file documents the seed layer — the inputs you change to retheme the entire system.

## Color seeds

| Token | Value |
| --- | --- |
| `colorPrimary` | `'#1677ff'` |
| `colorSuccess` | `'#52c41a'` |
| `colorWarning` | `'#faad14'` |
| `colorError` | `'#ff4d4f'` |
| `colorInfo` | `'#1677ff'` |
| `colorLink` | `''` |
| `colorTextBase` | `''` |
| `colorBgBase` | `''` |


## Preset palette anchors

Ant Design ships 12 preset color families. Each anchor below is the "primary" hue (rank 6 in a 10-step scale). The full ramp is generated at runtime by `genPresetColor`.

| Name | Hex | Swatch |
| --- | --- | --- |
| blue | `#1677FF` | <span aria-hidden="true" style="display:inline-block;width:0.875rem;height:0.875rem;border-radius:999px;border:1px solid rgba(0,0,0,.18);vertical-align:-0.125em;background-color:#1677FF;"></span> |
| purple | `#722ED1` | <span aria-hidden="true" style="display:inline-block;width:0.875rem;height:0.875rem;border-radius:999px;border:1px solid rgba(0,0,0,.18);vertical-align:-0.125em;background-color:#722ED1;"></span> |
| cyan | `#13C2C2` | <span aria-hidden="true" style="display:inline-block;width:0.875rem;height:0.875rem;border-radius:999px;border:1px solid rgba(0,0,0,.18);vertical-align:-0.125em;background-color:#13C2C2;"></span> |
| green | `#52C41A` | <span aria-hidden="true" style="display:inline-block;width:0.875rem;height:0.875rem;border-radius:999px;border:1px solid rgba(0,0,0,.18);vertical-align:-0.125em;background-color:#52C41A;"></span> |
| magenta | `#EB2F96` | <span aria-hidden="true" style="display:inline-block;width:0.875rem;height:0.875rem;border-radius:999px;border:1px solid rgba(0,0,0,.18);vertical-align:-0.125em;background-color:#EB2F96;"></span> |
| pink | `#EB2F96` | <span aria-hidden="true" style="display:inline-block;width:0.875rem;height:0.875rem;border-radius:999px;border:1px solid rgba(0,0,0,.18);vertical-align:-0.125em;background-color:#EB2F96;"></span> |
| red | `#F5222D` | <span aria-hidden="true" style="display:inline-block;width:0.875rem;height:0.875rem;border-radius:999px;border:1px solid rgba(0,0,0,.18);vertical-align:-0.125em;background-color:#F5222D;"></span> |
| orange | `#FA8C16` | <span aria-hidden="true" style="display:inline-block;width:0.875rem;height:0.875rem;border-radius:999px;border:1px solid rgba(0,0,0,.18);vertical-align:-0.125em;background-color:#FA8C16;"></span> |
| yellow | `#FADB14` | <span aria-hidden="true" style="display:inline-block;width:0.875rem;height:0.875rem;border-radius:999px;border:1px solid rgba(0,0,0,.18);vertical-align:-0.125em;background-color:#FADB14;"></span> |
| volcano | `#FA541C` | <span aria-hidden="true" style="display:inline-block;width:0.875rem;height:0.875rem;border-radius:999px;border:1px solid rgba(0,0,0,.18);vertical-align:-0.125em;background-color:#FA541C;"></span> |
| geekblue | `#2F54EB` | <span aria-hidden="true" style="display:inline-block;width:0.875rem;height:0.875rem;border-radius:999px;border:1px solid rgba(0,0,0,.18);vertical-align:-0.125em;background-color:#2F54EB;"></span> |
| gold | `#FAAD14` | <span aria-hidden="true" style="display:inline-block;width:0.875rem;height:0.875rem;border-radius:999px;border:1px solid rgba(0,0,0,.18);vertical-align:-0.125em;background-color:#FAAD14;"></span> |
| lime | `#A0D911` | <span aria-hidden="true" style="display:inline-block;width:0.875rem;height:0.875rem;border-radius:999px;border:1px solid rgba(0,0,0,.18);vertical-align:-0.125em;background-color:#A0D911;"></span> |


## Typography

| Token | Value |
| --- | --- |
| `fontFamily` | ``-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial` |
| `fontFamilyCode` | ``'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace`` |
| `fontSize` | `14` |


## Motion (cubic-bezier curves)

| Token | Value |
| --- | --- |
| `motionUnit` | `0.1` |
| `motionBase` | `0` |
| `motionEaseOutCirc` | `'cubic-bezier(0.08, 0.82, 0.17, 1)'` |
| `motionEaseInOutCirc` | `'cubic-bezier(0.78, 0.14, 0.15, 0.86)'` |
| `motionEaseOut` | `'cubic-bezier(0.215, 0.61, 0.355, 1)'` |
| `motionEaseInOut` | `'cubic-bezier(0.645, 0.045, 0.355, 1)'` |
| `motionEaseOutBack` | `'cubic-bezier(0.12, 0.4, 0.29, 1.46)'` |
| `motionEaseInBack` | `'cubic-bezier(0.71, -0.46, 0.88, 0.6)'` |
| `motionEaseInQuint` | `'cubic-bezier(0.755, 0.05, 0.855, 0.06)'` |
| `motionEaseOutQuint` | `'cubic-bezier(0.23, 1, 0.32, 1)'` |
| `motion` | `true` |


## Sizing

| Token | Value |
| --- | --- |
| `sizeUnit` | `4` |
| `sizeStep` | `4` |
| `sizePopupArrow` | `16` |
| `controlHeight` | `32` |


## Border / radius

| Token | Value |
| --- | --- |
| `borderRadius` | `6` |


## Lines

| Token | Value |
| --- | --- |
| `lineWidth` | `1` |
| `lineType` | `'solid'` |


## Notes for designers

- `colorPrimary` drives the entire interactive surface — buttons, links, focus rings, selected states.
- `borderRadius: 6` is the system default. Components like `Button` and `Input` use this directly. Going to `0` produces the "wireframe" aesthetic; going to `12+` produces "soft/friendly".
- `controlHeight: 32` is the canonical input height. `controlHeightSM = controlHeight - 8 = 24`, `controlHeightLG = controlHeight + 8 = 40`. Match this when building custom controls so they align in forms.
- `sizeUnit: 4, sizeStep: 4` produces the spacing scale `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.
- Motion easings: `motionEaseOut` for entering UI, `motionEaseInOut` for sliding, `motionEaseOutCirc` for slide-up overlays.

## How to use this in a project

If your project uses `antd`, set `theme.token` directly:

```tsx
<ConfigProvider theme={ token: { colorPrimary: '#7C3AED', borderRadius: 8 } }>
  <App />
</ConfigProvider>
```

If your project does not use `antd` but you want the same ramp model:

1. Pick a primary hex.
2. Use `tools/extractors/preset_color_ramp.py` (TODO) to generate the 10-step ramp.
3. Map ramps to semantic aliases (`color-primary`, `color-primary-hover`, …) using ranks `6/5/7` for default/hover/active.
