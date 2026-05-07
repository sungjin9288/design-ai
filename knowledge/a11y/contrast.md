<!-- hand-written -->
---
title: Contrast — WCAG 2.1 / 2.2 reference
applies_to: [web, mobile, all-ui]
---

# Contrast

WCAG 2.1 / 2.2 contrast requirements. Cite this file when justifying any color decision involving text or interactive UI.

## Required ratios

| Content | AA (legal floor) | AAA (target for product UI) |
| --- | --- | --- |
| Body text (< 18pt regular / < 14pt bold) | **4.5:1** | 7:1 |
| Large text (≥ 18pt regular / ≥ 14pt bold) | **3:1** | 4.5:1 |
| UI components (buttons, form borders, focus indicators, icons that convey meaning) | **3:1** | — |
| Graphical objects that convey information | **3:1** | — |
| Decorative content, logos | exempt | exempt |

> "Large text" = ≥ 24px regular or ≥ 18.66px bold. Pixel sizes assume default browser root.

## Quick failure modes

- **Placeholder gray**: `#9CA3AF` on `#FFFFFF` is 2.88:1 — fails AA at any size. Use `#6B7280` (4.83:1) or darker.
- **Disabled text "disabled-by-design"**: WCAG explicitly **exempts disabled controls**. But if "disabled" is your primary state (e.g., greyed-out menu item), users perceive it as live and you must clear AA.
- **Brand color on white**: Many brand reds and greens fail AA for body. Reserve them for large text, icons (3:1 only), or accents on darker backgrounds.
- **Focus indicators**: WCAG 2.4.11 (AA in WCAG 2.2) requires the focus ring itself to clear **3:1 against adjacent colors AND ≥ 2px thickness**. A subtle outline-blue on a light blue button often fails.
- **Hover-only states**: hover is not a contrast requirement, but the **default state** must clear contrast on its own. Don't rely on hover to fix a non-compliant resting state.

## Computing contrast (WCAG)

The relative luminance of an sRGB component `c ∈ [0, 1]` is:

```
c' = c/12.92               if c ≤ 0.03928
c' = ((c + 0.055)/1.055)^2.4   otherwise

L = 0.2126 R' + 0.7152 G' + 0.0722 B'
```

Contrast ratio of two luminances:

```
ratio = (L_lighter + 0.05) / (L_darker + 0.05)
```

Range: 1 (identical) to 21 (black on white).

## APCA (forthcoming)

WCAG 3 will replace the WCAG 2 ratio with APCA (Accessible Perceptual Contrast Algorithm). Different scale (`Lc`), different polarity rules (dark-on-light vs light-on-dark are not symmetric). Don't migrate yet — APCA is not yet a normative web standard. Track: <https://www.myndex.com/APCA/>.

## Tools

| Tool | When |
| --- | --- |
| Browser DevTools color picker | Quick spot check (every browser shows AA/AAA badges). |
| `color-contrast` CLI npm package | Automated CI check. |
| WebAIM Contrast Checker | Authoritative web reference. |
| Stark (Figma plugin) | Designing in Figma. |

## What this rule does NOT cover

- **Color blindness simulation** — pass contrast does not guarantee discriminability. Test with deuteranopia/protanopia simulators if color encodes meaning (status, charts).
- **Text on imagery / video** — use a scrim (overlay 40–60% black) and verify against the **darkest** patch of the image you allow.
- **Dark mode contrast inversion** — recompute every token. Light-mode AA does not imply dark-mode AA.
