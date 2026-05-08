<!-- hand-written -->
---
title: Spatial UI elements (panels, billboards, controls, menus)
applies_to: [spatial, vr, ar, ui-elements, panels]
---

# Spatial UI elements

UI primitives for spatial / AR / VR. Panels, billboards, buttons, sliders, menus — adapted for 3D space.

Read [`spatial-design-fundamentals.md`](spatial-design-fundamentals.md) first.

## Panel — the core spatial UI element

A panel is a 2D surface floating in 3D space. Most "interface" content lives on panels.

### Panel anatomy

```
        [shadow / glow]
         ┌──────────────┐
         │ [Title bar]  │
         ├──────────────┤
         │              │
         │  [Content]   │
         │              │
         │              │
         └──────────────┘
        [tail / handle for grabbing]
```

### Panel anchoring

| Anchor | Use |
| --- | --- |
| **World-locked** | Default for primary content; user moves around it |
| **Wrist-locked** | Quick-access menus (Vision Pro Home, Quest dock) |
| **Hand-locked** | Tools / palettes the user holds |
| **Object-locked** (AR) | Content overlaid on real things |

### Panel sizing

Standard sizes:

| Size | Use | Visual angle |
| --- | --- | --- |
| **Small / quick info** | Tooltips, notifications | 5-10° wide |
| **Medium / panel** | Settings, dialogs | 20-30° wide |
| **Large / window** | Productivity, content | 40-50° wide |
| **Cinema / video** | Movies, presentations | 60-90° wide |

Convert visual angle to real size based on distance:
- 30° at 1.5m distance ≈ 80cm wide.
- 50° at 1.5m distance ≈ 1.4m wide.

### Panel placement defaults

- **Distance**: 1.2-1.5m from user (sweet spot).
- **Height**: at or slightly below eye level.
- **Angle**: tilted 5-10° toward user (face-on feels stiff).

For Vision Pro: SwiftUI auto-positions; manual override available.

### Multi-panel layouts

For productivity (Vision Pro multi-window, Quest workspace):
- **Curved arrangement** — panels arc around user.
- **Grid layout** — 2×2, 3×2, etc.
- **Snap-to-grid** for organization.
- **Save / restore layouts** per session.

## Billboarding

Billboarding = a 2D plane that always faces the user, regardless of view angle.

| Pattern | Use |
| --- | --- |
| **Full billboarding** | Always faces user (text labels, icons in world) |
| **Y-axis billboarding** | Rotates only on Y axis (text on a sign) |
| **No billboarding** | Fixed orientation (book on table) |

For text labels in 3D worlds: full billboarding so always readable.

For environmental UI (signs, posters in a virtual room): no billboarding — looks placed.

## Buttons

Spatial buttons are 3D objects users interact with.

### Visual states

| State | Visual |
| --- | --- |
| **Idle** | Resting, default |
| **Hover** (gaze / hand near) | Slight glow, tint, lift |
| **Pressed** | Pushed in (z-depth) |
| **Disabled** | Desaturated, no interaction |

### Push button (depressed)

Most natural: physical push.

```
[ idle ] → [ pressed (lower z) ] → [ release ]
```

User pushes finger / controller through button surface. Animation: 0.5-2cm of physical depression.

### Tap-button (no physical depth)

For Vision Pro hand tracking: pinch gesture activates without "pushing":

```
[idle] → [hover (gaze)] → [pinch] → [activated]
```

No physical depression needed.

### Sizing

- **Hand-pressed button**: 5cm minimum (fingertip-friendly).
- **Pinch / gaze**: 1-2cm minimum (smaller OK with gaze precision).
- **Far buttons** (raycast / pointer): scale to maintain visual angle.

### Audio feedback

Every button needs sound:
- **Hover**: subtle.
- **Press**: distinct click.
- **Release**: confirm tone.

## Sliders

| Type | Use |
| --- | --- |
| **Linear slider** (horizontal/vertical) | Volume, scale, percentage |
| **Radial slider** (dial) | Rotational adjustments |
| **3D slider** (z-axis) | Depth-related |

Interaction:
- **Hand grab handle** + drag.
- **Pinch + drag** (Vision Pro hand tracking).
- **Controller stick** → slider value.

Show:
- **Current value** clearly.
- **Range markers** (0%, 50%, 100%).
- **Snap to common values** if applicable.

## Menus

### Wrist menu (Vision Pro / Quest)

Look at wrist to invoke menu:

```
User looks at wrist →
  Wrist UI appears →
  Pinch to select →
  Confirms / closes
```

Quick-access pattern. Stays on wrist; user always knows where to find it.

### Floating menu

Hand-anchored or world-locked menu panel:

```
[Trigger] →
  Menu panel appears at gaze direction →
  Tap / pinch to select item →
  Menu closes / cascades
```

For tools, options, settings.

### Radial menu

Items arranged in a circle around user's hand or cursor:

```
        [Item 1]
   [Item 4]    [Item 2]
        [Item 3]
```

Press direction to select. Fast for power users; common in VR games (Half-Life: Alyx weapon select).

### Pie menu (variant)

Radial menu but using gesture direction (flick / drag direction).

## Input affordances

### Pointer / ray

Visible ray from controller / hand pointing at target:

```
[hand] -------------→ [target]
                      [highlight on target]
```

Standard for distant interaction. Hover effect on targeted object.

### Hand cursor (touch range)

When hand is close to a target:
- **No ray needed**.
- **Pinch / push** directly.

Mode switches automatically based on distance (Vision Pro does this elegantly).

### Gaze cursor (eye tracking)

For eye-tracked devices (Vision Pro):
- **Subtle indicator** at gaze point (Vision Pro shows nothing — just visual focus shift).
- **Pinch to confirm** (gaze + pinch = signature Vision Pro interaction).

### Voice

For accessibility / hands-busy:
- **"Open settings"** opens settings.
- **"Click that"** while looking at target.
- Coexists with hand / controller input.

## Notifications in spatial

Different from 2D notifications:

| Pattern | Use |
| --- | --- |
| **Wrist notification** | Brief preview on user's wrist |
| **Floating notification** at gaze | Short panel near gaze direction |
| **Spatial audio chime** | Direction indicates source location |
| **Ambient pulsing** | Subtle attention cue |

Don't:
- **Lock notification to head** for too long (annoying).
- **Block important real content** in AR (real road, etc.).
- **Loud audio** when private headset.

## Lists

### Vertical scrolling list (in panel)

Same as 2D web — scroll inside panel.

### Carousel (3D rotation)

Items arranged in arc around user; rotate to browse:

```
   [item]   [item]
     ↘     ↙
        [user]
        ↑
   [item]   [item]
```

Spatial-native; uses depth.

### Cover-flow (depth-based)

Items at different depths; closest is "selected"; user pushes / scrolls to bring others forward.

## Forms in spatial

Forms (login, search, settings) are awkward in spatial:
- **Virtual keyboards** — slow to type.
- **Voice dictation** — common preferred input.
- **Auto-fill** — leverage system credentials, never make user type passwords.

For Vision Pro: keyboard floats; user looks at keys + pinches. Slow for long input.

For Quest: ray-cast at virtual keyboard; both controllers can type at once. Faster.

For mobile AR: device's native keyboard pops up; tap as usual.

Plan to **avoid long forms** in spatial. If unavoidable: voice + autocomplete first.

## Korean text in spatial

Hangul considerations:
- **Larger size needed** at low PPD; 1.5-2× equivalent Latin size.
- **Font choice**: Pretendard, NanumSquare, NanumGothic — render well at low resolutions.
- **Line height**: Korean needs more leading; 1.6-1.8 × font-size.
- **Mixed Korean + English**: pick a font with both glyphs (Pretendard, Noto Sans CJK).

## Dialogs

Modal dialogs in spatial:
- **Float in front of user** at comfortable distance.
- **Dim / blur background** to focus attention.
- **Confirm + cancel** clearly.
- **Don't trap user** — always allow back / dismiss.

## Loading / progress

```
[spinning indicator]   or   [progress bar]
[text: "Loading..."]        [text: "60%"]
```

Spatial loading should feel diegetic when possible:
- Hourglass / loading orb in 3D.
- Door opening animation.
- Materializing object.

Avoid floating "Loading" text alone — feels cheap.

## Icons in spatial

Same iconography as 2D, but:
- **3D versions** for important actions (button = depressible 3D shape).
- **Higher contrast** required.
- **Larger size** for visibility at distance.

For brand consistency: maintain icon system; render in 3D where appropriate.

## Don't

- Don't head-lock long-form content.
- Don't make panels smaller than 20° visual angle for dense content.
- Don't put critical UI in peripheral (>30°).
- Don't omit hover / press feedback. Spatial without feedback feels broken.
- Don't make buttons smaller than 5cm for hand-press; 1cm for gaze + pinch.
- Don't forget audio feedback. Spatial UI is multisensory.
- Don't require long-form text input. Voice or autofill first.
- Don't leave panels at uncomfortable angles. User should not have to look up / down for primary UI.

## Cross-reference

- [`knowledge/spatial/spatial-design-fundamentals.md`](spatial-design-fundamentals.md) — fundamentals
- [`knowledge/spatial/vr-patterns.md`](vr-patterns.md) — VR specifics
- [`knowledge/spatial/ar-patterns.md`](ar-patterns.md) — AR specifics
- [`knowledge/spatial/comfort-and-accessibility.md`](comfort-and-accessibility.md) — comfort + a11y
- [`examples/component-spatial-panel.md`](../../examples/component-spatial-panel.md) — panel spec
- [`knowledge/i18n/korean-typography.md`](../i18n/korean-typography.md) — Korean fonts
