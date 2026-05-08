<!-- hand-written -->
# `SpatialPanel` (custom — floating UI panel for VR / AR / spatial computing) — spec

> Floating 2D-in-3D panel for spatial UIs (Vision Pro, Quest, HoloLens, mobile AR). Handles anchoring (world / wrist / hand / head), distance / scale / billboarding, comfort positioning, hand + gaze input, depth occlusion. Pairs with [`knowledge/spatial/spatial-ui-elements.md`](../knowledge/spatial/spatial-ui-elements.md).

## Purpose

Spatial apps are full of floating panels — settings, content, dialogs, productivity windows. Without a primitive, every team reinvents:
1. Anchoring (where in space?).
2. Distance / size (visual angle vs absolute meters?).
3. Billboarding (face user always or fixed?).
4. Input handling (hand pinch, controller raycast, gaze).
5. Comfort positioning (eye level, slight tilt, etc.).
6. Occlusion (in front of / behind real objects).

`SpatialPanel` provides these as a primitive. Subclass for specific surface types.

## Anatomy

```
                  [shadow / occlusion]
                  ┌──────────────────┐
                  │ [grab handle]  ⊗ │   ← title bar with close
                  ├──────────────────┤
                  │                  │
                  │   [content]      │
                  │                  │
                  │                  │
                  └──────────────────┘
                       [tail / pointer]
```

## API (conceptual; per-platform implementation differs)

### visionOS (SwiftUI / RealityKit)

```swift
SpatialPanel(
  anchor: .world(position: .init(x: 0, y: 1.4, z: -1.5)),
  size: .visualAngle(width: 30, height: 20),  // degrees
  billboard: .yAxisOnly,
  closable: true,
  resizable: true,
  draggable: true
) {
  YourContent()
}
```

### Unity (Quest, Vision Pro via Polyspatial)

```csharp
public class SpatialPanel : MonoBehaviour
{
    public AnchorMode anchor;         // World, Wrist, Hand, Head
    public Vector3 worldPosition;
    public float widthMeters = 1.0f;
    public float heightMeters = 0.6f;
    public BillboardMode billboard;   // None, YAxis, Full
    public float distanceMeters = 1.5f;
    public bool grabbable = true;
    public bool closable = true;
}
```

### React Three Fiber (WebXR)

```tsx
<SpatialPanel
  anchor="world"
  position={[0, 1.4, -1.5]}
  width={1.0}
  height={0.6}
  billboard="y-axis"
  closable
  draggable
>
  <Html transform>
    <YourContent />
  </Html>
</SpatialPanel>
```

| Prop / config | Type | Default | Description |
| --- | --- | --- | --- |
| `anchor` | `"world" \| "wrist" \| "hand" \| "head"` | `"world"` | Where panel exists |
| `position` | `Vector3` | depends on anchor | World position (m) |
| `width` | `number` (m or °) | per platform | Width in meters or visual angle |
| `height` | `number` | per platform | Height |
| `billboard` | `"none" \| "y-axis" \| "full"` | `"y-axis"` | Rotation behavior |
| `distance` | `number` | `1.5` | Default distance from user when first placed |
| `grabbable` | `boolean` | `true` | Can user grab + reposition? |
| `closable` | `boolean` | `true` | Show close button |
| `resizable` | `boolean` | `false` | Allow resize |
| `tilt` | `number` (degrees) | `5` | Slight tilt toward user |
| `occluded` | `boolean` | `true` | Real / virtual objects can occlude panel |
| `shadow` | `boolean` | `true` | Cast shadow on real surfaces (AR) |
| `glow` | `"none" \| "subtle" \| "active"` | `"subtle"` | Edge glow / highlight |

## Anchoring modes

### `world`

Panel fixed in world space. User moves around it. Default for content / productivity panels.

```
[user position changes; panel stays fixed]
[1m away looking left, panel appears as expected]
```

### `wrist`

Panel anchored to user's wrist. Moves with arm.

```
[user looks at wrist] → [panel becomes visible]
[user lowers arm]      → [panel hides or persists faintly]
```

Used for quick-access menus (Vision Pro Home, Quest watch).

### `hand`

Panel held in user's hand. Moves with hand fully.

```
[hand moves] → [panel moves]
```

Used for tools, palettes (drawing apps, color picker).

### `head`

Panel locked to user's head — always in front. **Use sparingly** — nauseating for long content.

```
[user looks anywhere] → [panel always at fixed position relative to view]
```

Used for: brief tooltips, reticles, system-level alerts.

## Sizing

### Visual angle vs absolute size

| Approach | Pro | Con |
| --- | --- | --- |
| **Absolute (meters)** | Predictable physical size | Visual angle changes with distance |
| **Visual angle (degrees)** | Consistent screen presence | Physical size changes with distance |

Default: visual angle for UI clarity (panels look the same size regardless of placement); absolute for content that should "be" a specific size (a virtual TV is a real-world TV size).

### Reference sizes

| Use | Visual angle (recommended at 1.5m distance) | Meters |
| --- | --- | --- |
| Tooltip / quick info | 5-10° | 13-26cm wide |
| Settings / dialog | 20-30° | 53-80cm |
| Productivity window | 40-50° | 1.0-1.4m |
| Movie screen | 60-90° | 1.7-3.0m |

## States

| State | Visual |
| --- | --- |
| Default | Panel rendered with subtle edge glow |
| Hover (gaze / pointer near) | Slightly brighter glow |
| Grabbing | Stronger glow + lift animation; user dragging |
| Pressed (button inside) | Inner content reacts; panel itself static |
| Closing | Fade out + scale down 200ms |
| Out-of-comfort (extreme angle) | Faint warning glow at edge |

## Comfort positioning

### Default placement

When panel first appears, place:
- **At gaze direction** for primary content.
- **At eye level OR slightly below** (-10° from horizontal).
- **1.2-1.5m distance** from user.
- **Slight tilt** (5-10°) toward user.

### Avoid

- **Too close** (< 50cm): vergence-accommodation strain.
- **Too far** (> 5m): hard to read text.
- **Above eye level for long content**: neck strain.
- **Behind user**: lost.
- **Inside real objects** (AR): collision.

### Reposition gracefully

If panel ends up uncomfortable (user moved):
- **Auto-reposition button**: "Bring panel to me".
- **Recall** gesture (look + pinch on a corner).
- **Gradual drift correction** (subtle move toward comfort zone).

## Input handling

### Gaze + pinch (Vision Pro)

- User looks at panel; panel highlights.
- User looks at button inside panel; button highlights.
- User pinches; button activates.

### Hand poke (Quest, Vision Pro hand tracking)

- User extends finger toward button.
- Visual feedback as finger approaches surface.
- Push through surface = press.

### Ray-cast (controller, far targeting)

- Controller emits ray.
- Ray intersects panel; cursor appears on panel.
- Trigger pulled = press at cursor.

### Direct touch (close range)

- Hand is within touch distance of panel.
- Finger taps surface like a touchscreen.

`SpatialPanel` should detect input mode and provide appropriate feedback. All four work transparently.

## Tokens consumed

Spatial-specific tokens:

```
--spatial-panel-bg                  (panel background, semi-opaque)
--spatial-panel-bg-blur             (background blur amount, AR)
--spatial-panel-border              (edge color)
--spatial-panel-glow                (subtle edge glow)
--spatial-panel-shadow              (shadow on real surfaces)
--spatial-panel-text                (default text color)
--spatial-panel-text-emphasis
--spatial-panel-button-idle
--spatial-panel-button-hover
--spatial-panel-button-pressed
--spatial-panel-distance-default    (1.5m)
--spatial-panel-tilt-default        (5°)
--spatial-panel-anim-fade           (200ms)
--spatial-panel-anim-easing         (ease-out)
```

For AR / passthrough: panels need higher contrast against variable real backgrounds. Apply `--spatial-panel-bg-blur` for legibility.

## Accessibility

- **Keyboard nav** (where input mode supports): Tab through panel children.
- **Screen reader / VoiceOver**: panel announced as a region; children announced as user navigates.
- **High contrast mode**: swap tokens.
- **Larger text option**: scale internal content text.
- **Reduced motion**: skip fade-in / animation.
- **Voice control**: "Open settings", "Close panel".
- **Hand alternative**: if hand tracking fails / disabled, controller / voice still works.

## Implementation hints (Unity-style pseudocode)

```csharp
public class SpatialPanel : MonoBehaviour
{
    void Update()
    {
        switch (anchor)
        {
            case AnchorMode.World:
                // Stay where placed; do nothing each frame
                break;
            case AnchorMode.Head:
                transform.position = camera.position + camera.forward * distanceMeters;
                transform.rotation = camera.rotation;
                break;
            case AnchorMode.Wrist:
                transform.position = wristTransform.position;
                transform.rotation = wristTransform.rotation;
                break;
            case AnchorMode.Hand:
                transform.position = handTransform.position;
                transform.rotation = handTransform.rotation;
                break;
        }

        if (billboard == BillboardMode.YAxis)
        {
            Vector3 toCamera = camera.position - transform.position;
            toCamera.y = 0;
            transform.rotation = Quaternion.LookRotation(-toCamera);
        }
        else if (billboard == BillboardMode.Full)
        {
            transform.LookAt(2 * transform.position - camera.position);
        }
    }
}
```

For visionOS: SwiftUI auto-handles much of this; manual for advanced cases.

For React Three Fiber / WebXR: wrap with `<group>` and update transform per frame in `useFrame`.

## Edge cases

- **User walks behind the panel**: panel is double-sided OR rotates to face user.
- **AR — panel inside a real object**: collision detection; nudge panel forward.
- **AR — panel obscured by real object**: render with depth occlusion (real wall blocks panel).
- **VR — user moves play area**: panel stays in world, but might be unreachable; reposition button.
- **Input mode switches mid-interaction** (controller dropped, hand-tracking takes over): preserve current state.
- **Panel content overflows**: scroll inside panel.
- **Multi-panel layout**: snap to grid; persist arrangement.
- **Wrist panel with arm down**: hide; show only when wrist visible.

## Don't

- Don't head-lock long content.
- Don't make panels too small for comfortable reading (< 20° for dense content).
- Don't ignore comfort tilt — head-on panels feel stiff.
- Don't skip occlusion in AR — flat overlays look unreal.
- Don't forget input alternatives. Voice / controller / hand all work.
- Don't render text below 1° visual angle.
- Don't ignore Korean text size needs (~1.5× Latin equivalent for clarity at low PPD).

## Cross-reference

- [`knowledge/spatial/spatial-ui-elements.md`](../knowledge/spatial/spatial-ui-elements.md) — UI elements
- [`knowledge/spatial/spatial-design-fundamentals.md`](../knowledge/spatial/spatial-design-fundamentals.md) — fundamentals
- [`knowledge/spatial/vr-patterns.md`](../knowledge/spatial/vr-patterns.md) — VR
- [`knowledge/spatial/ar-patterns.md`](../knowledge/spatial/ar-patterns.md) — AR
- [`knowledge/spatial/comfort-and-accessibility.md`](../knowledge/spatial/comfort-and-accessibility.md) — comfort + a11y
- [`examples/component-spatial-locomotion.md`](component-spatial-locomotion.md) — VR locomotion
