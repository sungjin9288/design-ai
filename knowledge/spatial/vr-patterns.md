<!-- hand-written -->
---
title: VR patterns (immersive virtual reality design)
applies_to: [vr, virtual-reality, immersive, quest, psvr]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# VR patterns

Fully immersive Virtual Reality (Quest, PSVR2, Valve Index, Vive). The user is replaced in a virtual environment.

Read [`spatial-design-fundamentals.md`](spatial-design-fundamentals.md) first.

## VR experiences — categories

| Category | Examples | UX focus |
| --- | --- | --- |
| **Games / immersive** | Beat Saber, Half-Life: Alyx, Asgard's Wrath | Fun, presence, interaction |
| **Productivity** | Immersed, Virtual Desktop, Horizon Workrooms | Multi-monitor, focus |
| **Social** | VRChat, Rec Room, Horizon Worlds | Avatars, voice, presence |
| **Training / simulation** | Medical, military, industrial training | Realism, repeat-ability |
| **Cinema / video** | Bigscreen, Apple TV in Vision Pro | Reading distance, comfort |
| **Fitness** | Supernatural, Beat Saber, FitXR | Movement, calorie tracking |

## Three core VR design principles

### 1. Presence is everything

VR's killer feature is *presence* — feeling like you're really there. Design choices that break presence are the worst design failures:

- **UI floating awkwardly** in space (vs anchored to logical thing).
- **Hands clipping through objects** (no haptic / collision feedback).
- **Visible loading screens** with no diegetic explanation.
- **Sudden teleports** without grounding.
- **Floating numbers** without context.

Design solutions diegetically (in-fiction):
- Health on a wrist watch (not floating HUD).
- Inventory in a backpack (not pop-up menu).
- Weapon ammo on the gun (not text overlay).

### 2. Comfort over flash

Cool effects that make users sick are unshipable:
- Avoid camera shakes (player's body doesn't shake).
- Avoid forced motion (player must initiate).
- Avoid black flashes / strobing.
- Limit acceleration (constant velocity is more comfortable).

### 3. Use the body

Real interactions feel better than abstract:
- Grab a door handle, turn it (vs press a button to open door).
- Throw a ball physically (vs click).
- Look around to spot enemies (vs minimap).
- Reach over your shoulder for inventory (vs menu).

## VR HUD anti-patterns

Traditional 2D HUD doesn't work in VR. What to do instead:

| Bad (2D HUD) | Good (VR-native) |
| --- | --- |
| Health bar in corner | Glow on player's hands when low |
| Floating ammo count | Magazine count visible on the gun |
| Mini-map overlay | Compass on wrist; map in journal |
| Score top-right | Score on a scoreboard in the world |
| Floating quest waypoint | Compass needle, NPC pointing, in-world signs |

Diegetic UI > head-locked UI > world-anchored UI.

## Locomotion in detail

### Teleport

User points at destination, presses button, instantly arrives.

Variants:
- **Arc teleport**: arc trajectory shows where you'll land.
- **Straight teleport**: simple ray.
- **Dash**: short, immediate.
- **Blink**: instantaneous fade-cut.

UI:
- **Visible target indicator** at landing spot (circle, footprint).
- **Direction post-teleport**: where will player be facing? (Some games let you snap to a direction during teleport.)
- **Cooldown / no-cost**: most games have no cooldown.

### Smooth (joystick) locomotion

Push joystick → move at walking speed.

Comfort options:
- **Speed setting** — slower = more comfortable.
- **Comfort vignette** — peripheral darkening during motion.
- **Snap turn** for rotation (don't combine smooth-walk with smooth-turn for new users — too much).

### Snap turn

Pressing left/right rotates view 30° / 45° / 90° instantly.

- Avoids the disorientation of smooth turn.
- Standard angles: 30°, 45°, 60°, 90°.
- Default 30-45°.

### Room-scale walking

User physically walks around in their playspace. Most comfortable; limited by physical room.

- **Guardian / chaperone** boundary system warns when approaching real wall.
- **Re-center** option for users in cramped spaces.

### Hybrid locomotion

Most games offer multiple options; let player pick. Common combination:
- Smooth walk + snap turn + comfort vignette.

## Movement guardrails

### Speed limits

Walking pace ~1.5 m/s feels natural. Faster than 3-4 m/s starts feeling sicky.

Running / vehicles can go faster but with:
- **Cockpit anchor** (steering wheel grounds you).
- **Cinematic vignette** during high speed.
- **Physical input** (pumping arms, cycling motion) reduces sickness perceptually.

### Acceleration

Constant velocity is more comfortable than acceleration. Vehicle / sled experiences feel sickier than steady walk.

For combat / chase: avoid sudden direction changes; use teleport for big jumps.

## Spatial UI placement

### Default panel position

```
                eye height
              ─────────────
              │             
              │  [panel ~1.2m wide]
              │   floats at 1.5m distance
              │   slightly below eye level (-10°)
              │             
              ─────────────
                    user
```

Within reach of natural arm extension if the panel needs touching.

### Multi-panel productivity

For workspaces (Immersed, Vision Pro):
- Multiple windows positioned around user.
- User repositions via drag handles.
- Snap to grid / columns helps organization.
- Save layouts for repeat sessions.

### Inventory access

Patterns:
- **Reach over shoulder** (Half-Life: Alyx) — diegetic, immersive.
- **Wrist menu** (palm up to reveal) — quick access.
- **Belt slots** — items at hip.
- **Spawn-in front** — modal overlay appears.

## Hands and avatars

### Hand representation

| Style | Use |
| --- | --- |
| **Realistic hands** | Most immersive; uncanny valley risk |
| **Stylized hands** | Cartoon, anime, robotic — safer |
| **Floating gloves** | Half-Life: Alyx style — clean |
| **Tools only** (no hands visible) | Sterile but works for some |

Hand presence requires good tracking; mismatched real-vs-virtual hand position breaks immersion.

### Self-avatar

Should the user see their own body?
- **Hands only** — most VR (Quest, etc.).
- **Hands + arms** — IK-driven from headset + controllers.
- **Full body** — requires extra trackers (Vive trackers, Slime VR).
- **No body** — tools / disembodied; for some experiences.

If full body: legs / movement match real walking via room-scale; otherwise, IK approximations risk uncanny.

## Multiplayer / social VR

### Avatars

- **Customizable** — users build identity.
- **Realistic vs cartoon** — picking lane.
- **Lip sync** from voice input.
- **Eye contact** if eye-tracking available.

### Personal space

Korean cultural note: Korean users may have different comfort distances than Western. Default 1.5m personal space; allow adjustment.

In social VR:
- **Personal space bubble** (auto-mute when too close).
- **Block / mute** prominent.
- **Safe zone** to escape harassment.

### Voice + gestures

Communication:
- **Voice chat** primary.
- **Hand gestures** (waves, thumbs up).
- **Avatar emotes** triggered by buttons.
- **Text chat** as secondary (typing in VR is hard).

## Reading text in VR

### Sizing for legibility

| Distance | Min readable text size |
| --- | --- |
| 0.5m | 12mm character height |
| 1m | 24mm |
| 1.5m | 35mm |
| 3m | 70mm |

Equivalent of "1° visual angle" rule.

### Font choices

- **Sans-serif** for legibility at low PPD.
- **Higher weight** (medium-bold) renders cleaner.
- **High contrast** (white on dark, dark on light).
- **Anti-aliased / sub-pixel** rendering enabled.

For Korean: Pretendard, NanumSquare; bold weights for VR clarity.

### Long-form reading

Reading a book in VR is uncomfortable for >15 min currently:
- Text appears clear at distance but pixels show on close inspection.
- Eye strain from fixed focal distance.
- Better: cinema-style (large text far away) for novels.

## Cinema / video in VR

For Bigscreen, Apple TV in Vision Pro:
- **Screen size 3-5m wide** (perceived).
- **Distance 5-15m** (perceived).
- **Curved screen** wraps slightly.
- **Dimmable environment** (movie theater black, beach, etc.).
- **Stereoscopic 3D** for 3D content.
- **Pause / play** via controller / pinch / voice.

## Performance for VR

Hard requirement: **90Hz minimum, no dropped frames**.

| Tech | Use |
| --- | --- |
| **Foveated rendering** | Render high-detail at gaze point only |
| **Single-pass stereo** | Render both eyes in one pass |
| **Multi-view rendering** | Hardware-accelerated stereo |
| **Asynchronous reprojection** | Re-warp frame to current head pose if late |
| **Fixed foveated rendering** | Reduce edge resolution (fixed pattern) |

For mobile VR (Quest standalone): aggressive optimization — limited GPU.

## Common VR mistakes

- **Dropping frames** — instant sickness.
- **Forced camera motion** — sickness.
- **Tiny text** — illegible at low PPD.
- **2D HUD ports** — breaks immersion.
- **No comfort options** — alienates new users.
- **Ignoring guardian boundary** — players hit walls.
- **No avatar self-representation** — disorienting absence.
- **Long unskippable cutscenes** in VR — players stuck.

## Don't

- Don't drop below 90 fps. Period.
- Don't head-lock long content.
- Don't move the camera without user input.
- Don't put text smaller than 1° visual angle.
- Don't use 2D HUD patterns. Diegetic > overlay.
- Don't force smooth locomotion without comfort options.
- Don't ignore guardian / chaperone — players walk into real walls.
- Don't combine smooth turn + smooth walk + tiny FOV without comfort fallback.

## Cross-reference

- [`knowledge/spatial/spatial-design-fundamentals.md`](spatial-design-fundamentals.md) — fundamentals
- [`knowledge/spatial/ar-patterns.md`](ar-patterns.md) — AR
- [`knowledge/spatial/spatial-ui-elements.md`](spatial-ui-elements.md) — panels, controls
- [`knowledge/spatial/comfort-and-accessibility.md`](comfort-and-accessibility.md) — comfort + a11y
- [`knowledge/game-ui/game-ui-fundamentals.md`](../game-ui/game-ui-fundamentals.md) — game UI broader
- [`knowledge/motion/principles.md`](../motion/principles.md) — motion
