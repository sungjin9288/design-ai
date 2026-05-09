---
title: MUI palette structure
source: refs/mui/packages/mui-material/src/styles/createPalette.js
upstream: https://github.com/mui/material-ui/blob/master/packages/mui-material/src/styles/createPalette.js
extracted_at: 2026-05-07
applies_to: [react, mui, material-design]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# MUI palette structure

MUI splits palette into two layers:

1. **Color objects** — `main`, `light`, `dark`, `contrastText` per role.
2. **Roles** — `primary`, `secondary`, `error`, `warning`, `info`, `success`, plus surface/text scales.

```ts
type ColorPartial = {
  main: string;
  light?: string;        // auto-derived if missing (lighten by 0.2)
  dark?: string;         // auto-derived if missing (darken by 0.3)
  contrastText?: string; // auto-derived for accessible 3:1 against main
};

type Palette = {
  mode: 'light' | 'dark';
  primary: ColorPartial;
  secondary: ColorPartial;
  error: ColorPartial;
  warning: ColorPartial;
  info: ColorPartial;
  success: ColorPartial;
  // Surface
  background: { default: string; paper: string };
  // Text — semantic, not raw
  text: {
    primary: string;     // High-emphasis (87% opacity in light)
    secondary: string;   // Medium (60%)
    disabled: string;    // Low (38%)
  };
  // Other
  divider: string;
  action: {
    active: string;
    hover: string;
    selected: string;
    disabled: string;
    focus: string;
  };
};
```

## Light mode defaults

| Role | Token | Hex |
| --- | --- | --- |
| primary | `primary.main` | `#1976d2` |
| secondary | `secondary.main` | `#9c27b0` |
| error | `error.main` | `#d32f2f` |
| warning | `warning.main` | `#ed6c02` |
| info | `info.main` | `#0288d1` |
| success | `success.main` | `#2e7d32` |
| background | `background.default` | `#fff` |
| background | `background.paper` | `#fff` |
| text | `text.primary` | `rgba(0,0,0,0.87)` |
| text | `text.secondary` | `rgba(0,0,0,0.6)` |
| text | `text.disabled` | `rgba(0,0,0,0.38)` |
| divider | `divider` | `rgba(0,0,0,0.12)` |

## Dark mode defaults

| Role | Token | Hex |
| --- | --- | --- |
| primary | `primary.main` | `#90caf9` |
| secondary | `secondary.main` | `#ce93d8` |
| error | `error.main` | `#f44336` |
| warning | `warning.main` | `#ffa726` |
| info | `info.main` | `#29b6f6` |
| success | `success.main` | `#66bb6a` |
| background | `background.default` | `#121212` |
| background | `background.paper` | `#121212` |
| text | `text.primary` | `#fff` |
| text | `text.secondary` | `rgba(255,255,255,0.7)` |
| text | `text.disabled` | `rgba(255,255,255,0.5)` |
| divider | `divider` | `rgba(255,255,255,0.12)` |

## Action overlay opacities

Action states are **overlays** on top of the role color, not separate tokens. Light/dark vary:

| State | Light opacity | Dark opacity |
| --- | --- | --- |
| `hover` | 0.04 | 0.08 |
| `selected` | 0.08 | 0.16 |
| `focus` | 0.12 | 0.12 |
| `disabled` | 0.26 | 0.3 |

## Designer notes

- The **opacity-based text scale** (87/60/38) is Material 1's hierarchy. Modern Material 3 uses HCT-based on-surface variants with hard hex values. Use opacity for muted text in legacy systems, hex tokens in new systems.
- `contrastText` is auto-computed against `main`. If you override `main`, leave `contrastText` blank — let MUI compute it. If you fix `contrastText` manually, **verify ≥ 4.5:1**.
- `background.default` and `background.paper` are intentionally identical in dark mode (`#121212`). Material 3 separates them via elevation overlays. If you want depth in dark mode, set `background.paper` to `#1e1e1e` or use `Paper` `elevation` props.
- Don't add custom roles (e.g., `tertiary`) without also defining `light/dark/contrastText` — the theme provider will throw.
