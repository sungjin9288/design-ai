<!-- hand-written -->
---
title: Comfort and accessibility in spatial / VR / AR
applies_to: [spatial, vr, ar, accessibility, comfort]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Comfort and accessibility in spatial

VR / AR has unique comfort and accessibility concerns. Some users get sick within minutes; some can't physically use spatial tech. Plan for it.

Read [`spatial-design-fundamentals.md`](spatial-design-fundamentals.md) first.

## Motion sickness — the #1 comfort issue

VR motion sickness is real. It's caused by sensory mismatch: your eyes see motion that your inner ear doesn't feel.

### Triggers (worst to less bad)

| Trigger | Severity |
| --- | --- |
| **Smooth locomotion + smooth turn** | Most severe |
| **Forced camera motion** (cinematic without user input) | Severe |
| **Acceleration / deceleration** | Moderate |
| **Constant velocity** | Mild |
| **Vertical motion** (elevators, falling) | Severe |
| **Roll / pitch rotation** without user-initiated | Severe |
| **Frame drops below 90 fps** | Severe |
| **Mismatched real-vs-virtual height / scale** | Mild |

### Mitigations

| Mitigation | Helps |
| --- | --- |
| **Teleport locomotion** | Most users; default for accessible VR |
| **Snap turn** (vs smooth turn) | Most users |
| **Comfort vignette** during motion | Tunneled vision reduces peripheral motion |
| **Stable horizon** (cockpit, pod) | Anchors the world; reduces sickness |
| **Constant velocity, no accel** | Less sickness than accelerate/decelerate |
| **Movement initiated by user only** | No surprise camera moves |
| **Reduce motion option** | Total skip of physical motion |
| **Frame rate above 90 fps** | Non-negotiable |
| **Match user's eye height** | If user is 5'4", don't render them as 6'2" |
| **IPD calibration** | Wrong inter-pupillary distance causes strain |

### Ramp-up

For new VR users:
- Start in stationary scene (lobby, beach).
- Introduce teleport locomotion.
- Add smooth turn only after first session.
- Slowly introduce smooth locomotion.

### Comfort settings menu

Make these prominent:

```
Comfort Settings
─────────────────
Locomotion         [Teleport] [Smooth] [Hybrid]
Turning            [Snap] [Smooth]
Snap turn angle    [30°] [45°] [60°] [90°]
Comfort vignette   [Off] [Low] [High]
Smooth turn speed  [Slow] [Medium] [Fast]
Camera motion      [Allow] [Limited] [None]
Reduce flashing    [On / Off]
Reduce particles   [On / Off]
```

## Vision accessibility

### Low vision

- **Larger text option** (1.5×, 2×).
- **High contrast mode**.
- **Bold weight default**.
- **UI scale** independent of game scale.

### Color blindness

- **Color-blind modes** (protanopia, deuteranopia, tritanopia).
- **Don't rely on color alone** — shape, pattern, text redundancy.

### Total blindness

- **Spatial audio dominant** — sound design must convey position, threats, navigation.
- **Audio cues for UI elements** (button hover, panel opens).
- **Voice navigation** (Vision Pro VoiceOver).
- **Haptic feedback** for state changes.

Vision Pro VoiceOver navigates spatial UI with voice + gestures.

## Hearing accessibility

- **Subtitles for all dialogue + audio cues**.
- **Visual sound indicators** ("[footsteps approaching from left]") critical in VR — spatial audio can't be heard.
- **Adjustable per-channel volume**.
- **Vibrating notification** if controllers vibrate (haptic feedback).

For hearing-impaired VR: spatial audio replaced by visual indicators; bigger UX shift than 2D apps.

## Motor accessibility

### One-handed users

VR commonly assumes two controllers + two hands:
- **One-handed mode** — all interactions doable with one controller.
- **Toggle vs hold** for sustained inputs.
- **Auto-aim** in shooters.

### Limited mobility

- **Seated mode** — no requirement to stand or duck.
- **Reduced reach** — UI within arm-reach distance.
- **Smaller play area** option (vs requiring full room scale).

### Tremor / Parkinson's

- **Click-confirmation** vs precise targeting.
- **Slow-tap** option — hold to register.
- **Forgiveness window** for accidental presses.

### Voice control alternative

For users who can't use hands or controllers:
- **Voice-only navigation**.
- **Eye tracking + voice confirm** (if available).

## Cognitive accessibility

- **Clear instructions** in spatial onboarding.
- **Skip / replay tutorials**.
- **Pause anytime** — VR is intense; break ability mandatory.
- **Save state often** — don't require long sessions.
- **Reduce information density** — spatial overstimulation real.
- **Predictable interactions** — same gesture means same thing across the app.

## Photosensitive epilepsy

- **No flashing > 3Hz** without warning.
- **Disable particle storms** option.
- **Reduce post-processing effects** option.
- **Warning at start** for any flashing content.

## Eye strain

Long VR sessions cause:
- **Vergence-accommodation conflict** strain.
- **Dryness** (less blinking).
- **Eye fatigue**.

Mitigations:
- **Break reminder** every 30 min.
- **Distant content** (less convergence stress).
- **Background dim** option.
- **Reduce brightness** option.

## Physical safety

VR users can hit walls / furniture / pets:

- **Guardian / chaperone boundary** required (Quest, PSVR2).
- **Passthrough** when approaching boundary (Quest 3, Vision Pro).
- **Visual outline** of real obstacles.
- **Clear setup instructions** — clear play area before starting.
- **Stop and rest** prompts after 60 min.

For seated VR: less critical but still — chair stability, headphone cord management.

## Wheelchair / mobility-device users

- **Sitting-height calibration** (not just standing).
- **Reachable UI** from wheelchair height.
- **Locomotion** via teleport / vehicle (not requiring physical walking).

Vision Pro / Quest support seated mode well.

## Korean accessibility

Korean spatial product market is small but growing:
- **NEXON / NCSoft** developing accessible game UX.
- **Samsung Galaxy XR** (upcoming) — Galaxy accessibility ecosystem.

For Korean spatial products:
- 자막 standard.
- 한국어 voice control / VoiceOver.
- 신체 장애인 (disabled person) considerations.

Korean Disability Discrimination Act (장애인차별금지법) may apply to digital products including spatial.

## Hygiene and shared headsets

For shared / public VR:
- **Disposable face covers** (museums, location-based VR).
- **IPD adjustment** — different face sizes need different settings.
- **Easy decontamination** — non-porous surfaces.

For consumer headsets: less concern but still — share carefully.

## Session length guidance

| Use case | Recommended session length |
| --- | --- |
| Game / immersive | 30-60 min, then break |
| Productivity | 45-90 min, then break |
| Cinema | Movie length OK with break |
| Training / education | 20-30 min sessions |
| First-time user | 5-10 min, build up |

Some users tolerate longer; some less. Provide **break reminder** options; don't lock out.

## Comfort = inclusion

Comfort options aren't optional features. They're inclusion:
- **Without teleport**, many users can't play.
- **Without subtitles**, deaf users excluded.
- **Without seated mode**, wheelchair users excluded.
- **Without color-blind**, ~6% of men excluded.

Plan from start; don't bolt on at end.

## Don't

- Don't ship without comfort options.
- Don't default to smooth locomotion + smooth turn for new users.
- Don't head-lock content.
- Don't drop frames.
- Don't ignore guardian / chaperone — physical injury risk.
- Don't lock users out of pause.
- Don't require standing.
- Don't ignore hearing-impaired users in audio-heavy VR.
- Don't render text below 1° visual angle.

## Cross-reference

- [`knowledge/spatial/spatial-design-fundamentals.md`](spatial-design-fundamentals.md) — fundamentals
- [`knowledge/spatial/vr-patterns.md`](vr-patterns.md) — VR
- [`knowledge/spatial/ar-patterns.md`](ar-patterns.md) — AR
- [`knowledge/spatial/spatial-ui-elements.md`](spatial-ui-elements.md) — UI elements
- [`knowledge/a11y/contrast.md`](../a11y/contrast.md) — color contrast
- [`knowledge/a11y/keyboard-and-focus.md`](../a11y/keyboard-and-focus.md) — alt input
- [`knowledge/game-ui/game-accessibility.md`](../game-ui/game-accessibility.md) — game a11y broader
