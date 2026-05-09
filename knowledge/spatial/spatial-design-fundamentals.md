<!-- hand-written -->
---
title: Spatial design fundamentals (3D, depth, comfort, distance, units)
applies_to: [spatial, ar, vr, xr, 3d]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Spatial design fundamentals

Designing for AR, VR, MR, and spatial computing (Vision Pro, Quest, ARKit, ARCore) is fundamentally different from screen design. The user is *inside* the UI; comfort and physical realism matter; 2D interface patterns translate poorly.

This file is the foundation for [`vr-patterns.md`](vr-patterns.md), [`ar-patterns.md`](ar-patterns.md), [`spatial-ui-elements.md`](spatial-ui-elements.md), and [`comfort-and-accessibility.md`](comfort-and-accessibility.md).

## Reality–virtuality continuum (Milgram)

```
Real world  →  Augmented Reality  →  Mixed Reality  →  Augmented Virtuality  →  Virtual Reality
(real only)     (real + overlay)     (real + virtual    (virtual + real         (virtual only)
                                      interact)          accents)
```

| Mode | Examples |
| --- | --- |
| **AR** (Augmented Reality) | Pokemon Go, IKEA Place, Snapchat filters, ARKit / ARCore mobile apps |
| **MR** (Mixed Reality) | HoloLens, Quest passthrough, Vision Pro |
| **VR** (Virtual Reality) | Quest 3 immersive, PSVR2, Valve Index, Vive |
| **XR** | Umbrella term for all of the above |

Different design constraints per mode. AR works in real environments (variable lighting, surface detection); VR is fully controlled.

## Spatial units

### Real-world units

Spatial design uses **meters, centimeters, millimeters** — physical measurements. Unlike screen design (pixels, points), distance from the user is real.

| Distance from user | Use |
| --- | --- |
| < 25cm | Hands / close inspection (object held) |
| 25-75cm | Personal space; reading distance for text |
| 75cm-1.5m | Conversation distance; primary UI plane |
| 1.5-3m | Social distance; secondary content |
| 3m+ | Distant background / world objects |

### Visual angle (more important than absolute size)

What matters is how big something appears in the user's field of view, not its absolute size.

```
Visual angle = 2 × atan(size / 2 / distance)
```

For text:
- Easily readable: 1° visual angle minimum (~2.5cm tall at 1.5m).
- Comfortable reading: 1.5-2° visual angle.
- Headlines: 3-5°.

This is the spatial equivalent of font size + reading distance.

### Field of view (FOV)

| Device | Horizontal FOV |
| --- | --- |
| Apple Vision Pro | ~100° |
| Quest 3 | ~110° |
| Quest 2 | ~90° |
| Valve Index | ~130° |
| HoloLens 2 | ~52° (small "window") |
| Mobile AR (iPhone) | varies with camera FOV |

Design **inside the central FOV** (roughly 60-80° horizontal). Peripheral content is missed unless the user turns.

## Comfort zones

```
                    Above (uncomfortable for long viewing)
                    ─────────────────
                    │
                    │   Comfortable    
   Left periphery → │   center zone      ← Right periphery
                    │   (60° wide)
                    │
                    ─────────────────
                    Below (uncomfortable for long viewing)
```

### Vertical comfort

- **Eye level (0°)**: best for primary content; comfortable indefinitely.
- **Slightly below (-10° to -20°)**: natural rest position; very comfortable.
- **Above eye level (+15°+)**: neck strain after a few minutes.
- **Below -30°**: must look down; uncomfortable for long viewing.

Default UI plane: at or slightly below eye level (matching reading-position natural neck angle).

### Horizontal comfort

- **0° (centered)**: most comfortable.
- **±15°**: easy eye movement, no head turn.
- **±30°**: small head turn comfortable.
- **±45°**: requires head turn.
- **±90°+**: requires significant body rotation.

For primary UI: stay within ±30° of forward gaze.

## Stereoscopic depth

VR / spatial devices render two images (one per eye), creating stereo depth perception.

### Depth cues

| Cue | Strength |
| --- | --- |
| Stereopsis (binocular disparity) | Strong < 10m |
| Convergence (eye angle) | Strong < 2m |
| Motion parallax | Strong at all distances |
| Shading / shadows | Medium |
| Occlusion (one object in front) | Strong |
| Atmospheric perspective | Distant only |
| Texture gradient | Medium |
| Familiar size | Medium |

For close UI (< 2m): rely on stereopsis + convergence. For distant: use occlusion, atmospheric.

### Vergence-accommodation conflict

In real life, when you focus on something close, your eyes converge AND your lenses focus. In VR / Vision Pro, eyes converge to perceived 3D depth, but lenses must focus on the actual physical screen distance (typically infinity for VR).

Result: eye strain over time, especially with content very close (< 1m perceived).

Mitigations:
- Default UI distance: 1-1.5m (sweet spot for most headsets).
- Avoid making users focus < 50cm for extended periods.
- Vision Pro mitigates this with vari-focal optics in research; current devices don't.

## Locomotion

How the user moves in VR / MR. Major UX decision.

| Method | Comfort | Use |
| --- | --- | --- |
| **Teleport** | High (no nausea) | Default for casual / accessible VR |
| **Smooth locomotion** (joystick) | Variable; some users feel sick | Hardcore VR; comfort options needed |
| **Snap turn** (instant rotation by 30/45°) | High | Reduces nausea vs smooth turn |
| **Smooth turn** | Moderate; some sickness | Default for some FPS-style games |
| **Room-scale walking** | Highest comfort (real walking) | Limited by physical play space |
| **Vehicle / fixed pod** | High (cockpit anchors world) | Driving / flying games |
| **Climbing / arm-pulling** | High | Physical engagement |

For first-time users: default to teleport + snap turn + comfort vignette. Offer smooth locomotion as opt-in.

## Comfort vignette

Reduces field of view during locomotion to mimic peripheral darkening, reducing motion sickness:

```
Stationary:           Moving:
[full view]           [tunnel-vision view]
                      (reduced FOV ~70%, dark frame)
```

Standard in modern VR. Strength is configurable.

## Spatial audio

In VR / spatial:
- **3D positional audio** (HRTF — head-related transfer function).
- Sounds emit from where they appear.
- Critical for immersion; equally critical for accessibility (visually impaired users navigate by sound).

For UI sounds:
- Notifications come from the notification's spatial position.
- Confirmation sounds emit from the button.
- Ambient sounds are 3D (forest from all around, not flat stereo).

## Hand vs controller vs gaze input

### Hand tracking (Vision Pro, Quest 3, HoloLens)

- **Pinch** (thumb + index): primary "click" gesture.
- **Tap in air**: secondary gesture.
- **Grab**: hold pinch.
- **Pointing**: ray-cast from index finger.
- **Eye gaze + pinch** (Vision Pro signature): look at target, pinch to select.

### Controllers (Quest, PSVR, Index)

- **Trigger**: primary action.
- **Grip**: grab / hold.
- **Joystick**: locomotion / scroll.
- **Buttons (A/B/X/Y)**: confirm / back / menu.

### Gaze (HoloLens, eye-tracked headsets)

- **Dwell**: look at target for N ms = select.
- **Eye tracking + voice / hand**: combination.

Most modern apps support both hand tracking AND controllers (user picks).

## 2D vs 3D UI

### 2D-in-3D (panels)

A 2D UI floating in 3D space:

```
  [floating panel — basically a 2D web page in space]
       Headlines
       Body text
       [Buttons]
```

Most common for productivity apps (Vision Pro, Quest browser). Mostly works; can use existing web / native UI patterns adapted.

### True 3D UI

UI elements ARE 3D objects:
- 3D buttons that physically depress.
- Levers, dials, switches that turn.
- Spatial volumes (a box you can turn around).
- Hand-held objects (pick up, manipulate, put down).

More immersive; harder to design.

For productivity / reading: 2D-in-3D is fine.
For immersive games / training: true 3D shines.

## Anchoring

Where does UI exist in space?

| Anchor | Behavior |
| --- | --- |
| **Head-locked** | Follows the user's head (always in front) |
| **World-locked** | Fixed in space; user moves around it |
| **Wrist-anchored** | Attached to user's wrist (Vision Pro Home View); user looks at wrist to invoke |
| **Hand-anchored** | Held in hand |
| **Object-anchored** (AR) | Pinned to a real-world object |

| When | Anchor |
| --- | --- |
| HUD that must always be visible | Head-locked (sparingly; nauseating) |
| Reading content / detailed inspection | World-locked |
| Quick-access menu | Wrist-anchored |
| Tool currently in use | Hand-anchored |
| AR overlays on a product | Object-anchored |

## Don't head-lock for long content

Head-locked UI moves with you constantly. For long content (reading, watching video): nauseating because you can't look around without text following.

Default: world-locked. User positions content where they want, then looks naturally.

Exception: reticle / crosshair (head-locked); small tooltips (head-locked briefly).

## Resolution and pixel density

Modern headsets:
- **Quest 3**: 2064×2208 per eye.
- **Vision Pro**: 3660×3200 per eye.
- **PSVR2**: 2000×2040 per eye.

But the FOV is wide, so pixels per degree (PPD) is what matters:

| Device | PPD |
| --- | --- |
| Quest 3 | ~25 PPD |
| Vision Pro | ~34 PPD |
| Human eye | ~60 PPD (foveal) |

Even Vision Pro is below human eye. Text at small sizes pixelates. Plan for this — design at 1.5-2× the size you'd use on a desktop monitor.

## Performance budget

VR / spatial runs at 90Hz / 120Hz / 144Hz. Each frame must be on time or motion sickness ensues.

| Constraint | Budget |
| --- | --- |
| Frame budget at 90Hz | 11.1ms |
| Frame budget at 120Hz | 8.3ms |
| Frame budget at 144Hz | 6.9ms |
| Draw calls | < 1000 typical |
| Polygons | varies; mobile VR ≈ 500K-1M |
| Texture memory | < 1-2GB |

UI overhead must fit within frame budget. Optimize aggressively for mobile VR (Quest standalone) — mobile-class GPU.

## Spatial design platforms

| Platform | OS / SDK |
| --- | --- |
| **Apple Vision Pro** | visionOS, SwiftUI + RealityKit |
| **Meta Quest** | Horizon OS; Unity / Unreal / native |
| **HTC Vive / Index** | SteamVR; Unity / Unreal |
| **PSVR2** | PlayStation; Unity / Unreal / proprietary |
| **HoloLens** | Windows; Unity (most common) |
| **iOS AR** | ARKit; SwiftUI / RealityKit / Unity |
| **Android AR** | ARCore; Unity / native |
| **Web XR** | A-Frame / Three.js + WebXR |

Design tools:
- Figma (2D screens, panel mockups).
- Unity / Unreal (full 3D).
- Reality Composer Pro (visionOS).
- Bezi, ShapesXR, Gravity Sketch (spatial design tools).

## Korean market context

Korea has limited spatial product market (2024+):
- **Samsung XR headset** (in development, Galaxy XR) launching 2025+.
- **Naver Z (Zepeto)** — metaverse mobile/desktop platform.
- **NCSoft, Krafton** experimenting with VR.
- **NEXON metaverse** initiatives.
- **AR for retail / commerce**: limited.

Most Korean users encounter spatial via:
- Mobile AR (Snapchat, Instagram filters).
- Some VR gaming (PSVR2, Quest imports).
- Pokémon GO and similar.

For Korean spatial product:
- Samsung XR ecosystem (when launches).
- Galaxy phone AR features.
- WebXR for accessibility.

## Don't

- Don't apply 2D web UX patterns directly to spatial. Distance + scale + depth change everything.
- Don't head-lock long content — nauseating.
- Don't ignore comfort. Motion sickness loses users permanently.
- Don't put critical UI in peripheral. Stay within ±30°.
- Don't make text too small. PPD limits real legibility.
- Don't drop frames. 90Hz is non-negotiable; below = sickness.
- Don't ignore vergence-accommodation. < 50cm content for extended use = strain.
- Don't make locomotion-only smooth without comfort options.

## Cross-reference

- [`knowledge/spatial/vr-patterns.md`](vr-patterns.md) — VR specifics
- [`knowledge/spatial/ar-patterns.md`](ar-patterns.md) — AR specifics
- [`knowledge/spatial/spatial-ui-elements.md`](spatial-ui-elements.md) — panels, controls, menus
- [`knowledge/spatial/comfort-and-accessibility.md`](comfort-and-accessibility.md) — comfort + a11y
- [`knowledge/motion/principles.md`](../motion/principles.md) — motion / animation
- [`knowledge/a11y/keyboard-and-focus.md`](../a11y/keyboard-and-focus.md) — alt input
