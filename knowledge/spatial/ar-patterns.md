<!-- hand-written -->
---
title: AR patterns (mobile AR, headset MR, world-anchored UI)
applies_to: [ar, mixed-reality, augmented-reality, arkit, arcore, hololens]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# AR patterns

Augmented Reality and Mixed Reality. The user's real environment is enhanced with virtual content. Mobile AR (ARKit on iOS, ARCore on Android), headset MR (Vision Pro passthrough, Quest passthrough, HoloLens).

Read [`spatial-design-fundamentals.md`](spatial-design-fundamentals.md) first.

## AR vs VR — design differences

| | VR | AR |
| --- | --- | --- |
| Background | Fully virtual | Real environment |
| Lighting | Controlled | Variable (sun, lamps, dim) |
| Surfaces | Designed | User's room (random) |
| Movement | Locomotion-aware | Real walking |
| Privacy | Closed | Public (shared cameras) |
| Battery | Tethered or VR-class | Mobile / headset shared |

AR designs **survive variable conditions**. White text on an off-white wall? Unreadable. Plan for any background.

## Three AR contexts

### 1. Mobile handheld AR

iPhone / Android holding the device up:
- **Phone screen as window** to AR world.
- **One hand for device, one for interaction**.
- **Limited session length** (arm fatigue at 30s+).
- **Looking at phone, not real world** (different from VR / headset).

Examples: Pokemon GO, Snap filters, IKEA Place, Google Lens AR translate.

Design:
- Treat as a moving viewport.
- Critical UI on screen (not in world).
- Short interaction sessions.
- Small visual angles (limited screen).

### 2. AR glasses / headset (HoloLens, Vision Pro passthrough, Magic Leap)

Wearable; hands free:
- **Both hands free**.
- **Full FOV** (varies by device).
- **Real environment visible** through display.
- **Long sessions possible**.

Examples: HoloLens medical training, Vision Pro productivity (passthrough mode), industrial AR.

Design:
- World-anchored UI works.
- Hand interactions natural.
- Real-world context informs UI.

### 3. World-anchored AR (object recognition / mapping)

Virtual content anchored to real things:
- **Marker-based** (QR code, image triggers content).
- **Plane-detection** (place virtual furniture on detected floor).
- **Object recognition** (recognize a product, show overlay).
- **Persistent anchors** (content stays where user placed it across sessions).

Examples: IKEA Place (place furniture), Hyundai AR car configurator, museum AR exhibits.

## Visibility against real backgrounds

The hardest AR design problem.

### Strategies

| Strategy | When |
| --- | --- |
| **Solid background panel** | Default — opaque or semi-opaque rectangle behind UI |
| **Drop shadow / outline** | Floating text / icons; visible on most backgrounds |
| **High-contrast colors** | Bright UI, dark text — forces visibility |
| **Animated highlight** | Pulsing brings attention even on busy backgrounds |
| **Semi-transparent backdrop** | Blur the real world behind UI panel |

For mobile AR (iPhone): use semi-opaque dark panels; readable on any background.

For headset MR (HoloLens, Vision Pro): plan for variable lighting; user can't dim their room.

## Spatial mapping and surface detection

ARKit / ARCore detect:
- **Horizontal planes** (floors, tables).
- **Vertical planes** (walls).
- **Mesh** (Vision Pro, HoloLens — full room mesh).

UI rules:
- **Place furniture on horizontal planes**, anchored to floor.
- **Hang artwork on vertical planes**, anchored to walls.
- **Snap to surfaces** for natural feel.
- **Show detection state** to user ("Move phone to detect surfaces", indicator showing detected plane).

## Anchoring strategies

### World-locked

Content stays where placed in the world. User moves around it.

- **Stable anchor** required (some surfaces drift over time).
- **Re-localization** when user returns to same space (cloud anchors).

### Image-locked

Content tied to a recognized image / marker:
- **Print marker** triggers content (museum signs, posters).
- **QR code** for entry point.
- **Object recognition** — Coca-Cola can recognized → branded experience plays.

### Body-locked / wrist

UI on body parts (Vision Pro Home View on wrist).

### Screen-locked (mobile AR)

UI overlaid on phone screen, not in 3D world. For:
- App controls (close, share).
- Persistent indicators.
- Status info.

Don't put everything in world — some 2D UI on the phone screen is better.

## Onboarding AR

First-run experience:

```
Step 1: "Hold phone up and move slowly"
        → User scans environment
        → System detects surfaces
        → Visual feedback: dots / mesh on detected planes

Step 2: "Tap to place"
        → Reticle appears on detected surface
        → User taps; content appears

Step 3: "Walk around to see"
        → User moves; content stays anchored
```

Rules:
- **Visual instructions** at each step (animated).
- **No long text walls** — show, don't tell.
- **Skip option** for repeat users.
- **Restart** if AR session fails (lost tracking).

## Common AR interactions

| Interaction | How |
| --- | --- |
| **Place object** | Tap-on-screen at detected surface |
| **Move object** | Drag (mobile) / pinch + move (headset) |
| **Rotate** | Two-finger twist (mobile) / hand gesture (headset) |
| **Scale** | Pinch (mobile) / two-hand spread (headset) |
| **Activate** | Tap (mobile) / pinch (headset) |
| **Delete** | Drag off-screen / dedicated button |

Provide visual feedback for each interaction.

## Permission and privacy

AR requires camera access. Permission flow:

```
"To use AR, [App] needs camera access"
[Allow]  [Don't allow]
```

Once granted: explain what happens with camera data:
- Local processing only? Or cloud?
- Storage? Sharing?
- Right to delete?

For privacy-sensitive AR (face filters, body capture):
- Local processing whenever possible.
- Disclose if cloud upload.
- Comply with regional privacy laws (GDPR, 개인정보보호법).

## Tracking failure handling

AR tracking can lose:
- **Low light** — can't see features.
- **Featureless surfaces** — blank wall.
- **Rapid motion** — blur.
- **Reflective surfaces** — glass, mirrors.

UX:
- **Visible tracking quality indicator**.
- **Recovery prompt**: "Move slowly... point camera at textured surface".
- **Pause AR** when tracking lost; resume when recovered.
- **Fallback to 2D mode** if persistent failure.

## Korean AR market

Limited but growing:
- **Naver Z (Zepeto)** — virtual avatars + AR features.
- **Snapchat / Instagram filters** — large user base.
- **Pokemon GO** — sustained popularity.
- **Retail AR** — Shinsegae, Hyundai car configurators.
- **Tourism / museum AR** — government-sponsored.

For Korean AR product:
- Korean voice / text overlays.
- Mobile-first (iPhone + Galaxy primary).
- Camera permission UX in Korean (개인정보보호법 compliance).

## Mobile AR performance

Mobile constraints:
- **Battery drain** — heavy CPU + GPU + camera.
- **Heat** — phone gets hot fast.
- **Limited session length** — 5-15 minutes typical before user puts phone down.

Optimize:
- **Reduce polygon count** — mobile-friendly models.
- **Bake lighting** instead of real-time.
- **Lower resolution** for distant objects.
- **Pause when idle** — turn off camera processing during dialog.

## Headset MR performance

Vision Pro / HoloLens / Quest 3 passthrough:
- **Passthrough rendering cost** — real-time camera feed processing.
- **Hand tracking compute** — separate from rendering.
- **Higher polygon budget** than mobile but still finite.

## Don't

- Don't ignore variable lighting. Test in dark, bright, mixed.
- Don't put critical UI invisible against common backgrounds (white text on white wall).
- Don't ignore tracking loss. Always show recovery path.
- Don't make sessions too long. Mobile AR is 5-15 min comfort limit.
- Don't request camera without explaining why.
- Don't ship persistent anchors without re-localization fallback.
- Don't ignore privacy. Camera data is sensitive.
- Don't assume horizontal floor exists — some users in standing-only spaces.

## Cross-reference

- [`knowledge/spatial/spatial-design-fundamentals.md`](spatial-design-fundamentals.md) — fundamentals
- [`knowledge/spatial/vr-patterns.md`](vr-patterns.md) — VR
- [`knowledge/spatial/spatial-ui-elements.md`](spatial-ui-elements.md) — panels, controls
- [`knowledge/spatial/comfort-and-accessibility.md`](comfort-and-accessibility.md) — comfort + a11y
- [`knowledge/i18n/korean-payments.md`](../i18n/korean-payments.md) — KR privacy law
