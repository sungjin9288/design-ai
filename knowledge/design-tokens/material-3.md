<!-- hand-written -->
---
title: Material Design 3 token reference
applies_to: [material-design, hct, design-tokens, android, web]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Material Design 3 (Material You)

Google's third-generation Material Design (2021+). Token-first, **HCT-based** color system, dynamic theming. The reference for Android UIs and many web product systems.

If your product targets Android primarily or aligns with Material aesthetic, build on this. For non-Material products, learn it as comparison.

## What changed from Material 2

| Aspect | Material 2 (2018) | Material 3 (2021+) |
| --- | --- | --- |
| Color | RGB-based palette | HCT-based, dynamic from seed |
| Tokens | Limited semantic tokens | Full token system (color, type, motion, shape) |
| Customization | Theme provider with overrides | Generate full theme from one seed color |
| Dynamic theming | None | Yes (Android system color, user wallpaper) |
| Surface model | Elevation overlays | Surface + tonal containers |
| Buttons | All-caps text on Filled | Mixed-case (modernized) |

## Color: HCT and tonal palettes

**HCT** = Hue, Chroma, Tone. Tonal palettes generate 13 stops per hue from one seed:

```
Tone:  0   5   10  20  30  40  50  60  70  80  90  95  99  100
       └──────────────────── one tonal palette ────────────────────┘
       darkest                                                lightest
```

Tone is roughly equivalent to OKLCH `L`, but tuned for Material's perceptual model.

### Five tonal palettes (per theme)

| Palette | Source |
| --- | --- |
| **Primary** | The brand seed |
| **Secondary** | Hue ~rotated; lower chroma |
| **Tertiary** | Different hue (often complement) |
| **Neutral** | Slightly chromatic gray, matched to primary's hue |
| **Neutral-variant** | Slightly more chromatic neutral |

Plus **error** as a fixed red tonal palette.

### Token roles (canonical)

```
Light theme:
  primary               = primary tone 40
  on-primary            = primary tone 100 (white)
  primary-container     = primary tone 90
  on-primary-container  = primary tone 10

  surface               = neutral tone 99
  on-surface            = neutral tone 10
  surface-container     = neutral tone 94
  surface-container-high = neutral tone 92
  surface-container-highest = neutral tone 90
  outline               = neutral-variant tone 50
  outline-variant       = neutral-variant tone 80

  background            = neutral tone 99
  on-background         = neutral tone 10

  inverse-surface       = neutral tone 20
  inverse-on-surface    = neutral tone 95
  inverse-primary       = primary tone 80

  error                 = error tone 40
  on-error              = error tone 100
  error-container       = error tone 90
  on-error-container    = error tone 10
```

For dark theme: tones flip. `primary` = primary tone 80, `on-primary` = primary tone 20, etc.

### Why containers?

Material 3's "container" concept is its main innovation. Instead of "primary + on-primary" only, you also have "primary-container + on-primary-container":

- `primary` (tone 40 light) — the FAB, the most-emphasized button
- `primary-container` (tone 90 light) — secondary surface that uses brand color subtly

This means: the FAB is bold primary; a "Premium" badge can sit on `primary-container` without competing.

## Typography

Material 3's type scale is more refined than Material 2's:

| Role | Size | Weight | Line height | Letter spacing |
| --- | --- | --- | --- | --- |
| **Display Large** | 57px | 400 | 64px | -0.25px |
| **Display Medium** | 45px | 400 | 52px | 0 |
| **Display Small** | 36px | 400 | 44px | 0 |
| **Headline Large** | 32px | 400 | 40px | 0 |
| **Headline Medium** | 28px | 400 | 36px | 0 |
| **Headline Small** | 24px | 400 | 32px | 0 |
| **Title Large** | 22px | 400 | 28px | 0 |
| **Title Medium** | 16px | 500 | 24px | 0.15 |
| **Title Small** | 14px | 500 | 20px | 0.1 |
| **Label Large** | 14px | 500 | 20px | 0.1 |
| **Label Medium** | 12px | 500 | 16px | 0.5 |
| **Label Small** | 11px | 500 | 16px | 0.5 |
| **Body Large** | 16px | 400 | 24px | 0.5 |
| **Body Medium** | 14px | 400 | 20px | 0.25 |
| **Body Small** | 12px | 400 | 16px | 0.4 |

Roboto is the default; Material 3 also has **Roboto Flex** (variable font) and **Roboto Serif** for serif variants.

For Korean: pair with Pretendard or Noto Sans KR; see [`i18n/korean-typography.md`](../i18n/korean-typography.md).

### Material 3 dropped uppercase buttons

Material 2's `text-transform: uppercase` on buttons is gone. Material 3 uses sentence case, which reads cleaner with non-Latin scripts.

## Shape (corner radius scale)

Material 3 standardizes corner radius via tokens:

| Token | Radius |
| --- | --- |
| `shape-corner-none` | 0 |
| `shape-corner-extra-small` | 4 |
| `shape-corner-small` | 8 |
| `shape-corner-medium` | 12 |
| `shape-corner-large` | 16 |
| `shape-corner-extra-large` | 28 |
| `shape-corner-full` | 9999 (pill) |

Each component has a default shape. Buttons: `extra-small` (4) for outlined, `full` for FAB.

Material 3 also introduces **shape morphing** — components can transition between shapes (e.g., FAB to bottom sheet expanding).

## Motion — Easing & Duration

Material 3 standardizes motion via two axes:

### Easing

| Token | Curve | Use |
| --- | --- | --- |
| `motion-easing-linear` | linear | Loading spinners |
| `motion-easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default — entering/exiting |
| `motion-easing-emphasized` | `cubic-bezier(0.2, 0, 0, 1)` | Emphasis on primary motion |
| `motion-easing-emphasized-decelerate` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | Hero arrives |
| `motion-easing-emphasized-accelerate` | `cubic-bezier(0.3, 0, 0.8, 0.15)` | Hero exits |

### Duration

Increments of 50ms from 50 to 600:

| Token | Duration |
| --- | --- |
| `motion-duration-short1` | 50ms |
| `motion-duration-short2` | 100ms |
| `motion-duration-short3` | 150ms |
| `motion-duration-short4` | 200ms |
| `motion-duration-medium1` | 250ms |
| `motion-duration-medium2` | 300ms |
| `motion-duration-medium3` | 350ms |
| `motion-duration-medium4` | 400ms |
| `motion-duration-long1` | 450ms |
| `motion-duration-long2` | 500ms |
| `motion-duration-long3` | 550ms |
| `motion-duration-long4` | 600ms |

Aligns with our duration tiers in [`motion/principles.md`](../motion/principles.md).

## Elevation (5 levels)

| Level | Use |
| --- | --- |
| `elevation-0` | Surface, no shadow |
| `elevation-1` | Card, FAB at rest |
| `elevation-2` | Top app bar (scrolled), filled buttons elevated |
| `elevation-3` | Modal, popover, navigation drawer |
| `elevation-4` | Floating menu, picker |
| `elevation-5` | Reserved (rarely used) |

In dark mode, Material 3 uses **surface tint overlays** instead of just shadow — surfaces get progressively lighter tones to indicate elevation. This reads better on dark backgrounds.

## State layers

Material 3 introduces a "state layer" — a semi-transparent overlay applied to interactive elements on hover/focus/press. Universal across components:

| State | Layer opacity (on top of base color) |
| --- | --- |
| Hover | 8% |
| Focus | 12% |
| Pressed | 12% |
| Dragged | 16% |
| Selected | 8% |

Layer color matches `on-X` tokens (e.g., on a primary button, the state layer is `on-primary` at 8% opacity).

This is the elegant unification — instead of writing per-component hover/focus styles, you apply one system.

## Tools and extraction

- **Material Theme Builder**: <https://material-foundation.github.io/material-theme-builder/> — paste a hex, get a full Material 3 token set.
- **Material 3 Theme Editor for Figma**: official plugin for Figma users.
- **m3-theme-editor**: VS Code extension for live editing.

The Theme Builder is the canonical source. For consuming Material 3 tokens in code, export to:
- CSS custom properties
- W3C DTCG JSON (compatible with Style Dictionary)
- Android XML (for Android apps)
- iOS Swift (for iOS apps)

## When to use Material 3

- **Android-primary apps**: native fit; don't fight the OS.
- **Multi-platform that wants Google-aligned aesthetic**: Material 3 is the "modern Google" look.
- **Teams that want one seed → full theme**: Material's dynamic theming is the simplest "give me a theme" pipeline.

## When NOT to use

- **Brand wants distinctive, non-Material aesthetic**: Material's shape + motion patterns are recognizable. Customizing fights the system.
- **Korean consumer market**: Material is widely accepted but Korean designs often have a denser, more Toss/Kakao-coded aesthetic.
- **Web with very specific brand**: prefer Tailwind v4's flexibility — see [`tailwind-v4.md`](tailwind-v4.md).

## Cross-reference

- [`knowledge/colors/color-theory.md`](../colors/color-theory.md) — HCT vs OKLCH
- [`knowledge/design-tokens/tailwind-v4.md`](tailwind-v4.md) — alternative web token system
- [`knowledge/design-tokens/ant-design.md`](ant-design.md) — alternative for enterprise web
- [`knowledge/colors/mui-palette-structure.md`](../colors/mui-palette-structure.md) — MUI's Material implementation (mostly Material 2 still)
- [Material 3 official spec](https://m3.material.io/)
- [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/)
