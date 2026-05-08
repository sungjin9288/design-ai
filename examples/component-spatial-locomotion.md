<!-- hand-written -->
# `SpatialLocomotion` (custom — VR locomotion controller with comfort options) — spec

> Locomotion controller for VR / spatial games / experiences. Provides teleport, smooth, snap-turn, room-scale modes; comfort vignette; preferences saved per user. Pairs with [`knowledge/spatial/vr-patterns.md`](../knowledge/spatial/vr-patterns.md) and [`knowledge/spatial/comfort-and-accessibility.md`](../knowledge/spatial/comfort-and-accessibility.md).

## Purpose

Locomotion is the #1 cause of VR motion sickness. Every VR experience must:
1. Offer multiple locomotion options.
2. Default to comfortable (teleport + snap turn) for new users.
3. Provide opt-in to less comfortable but more immersive modes.
4. Apply comfort vignette dynamically.
5. Persist user preference per profile.

`SpatialLocomotion` is the primitive controller every VR game / experience embeds.

## Anatomy (in-game)

### Teleport mode

```
[user holds joystick forward]
       ↓
[arc trajectory shown from controller]
       ↓
[landing point indicator visible]
       ↓
[user releases]
       ↓
[brief fade or instant teleport to landing point]
```

### Smooth locomotion mode

```
[user pushes joystick]
       ↓
[player moves at walking speed in joystick direction]
       ↓
[comfort vignette appears around peripheral vision]
       ↓
[user releases joystick]
       ↓
[player stops; vignette fades]
```

### Snap turn

```
[user pushes joystick left/right]
       ↓
[brief fade]
       ↓
[player rotates 30° / 45° / 90°]
       ↓
[fade ends]
```

## API (Unity-flavored)

```csharp
public class SpatialLocomotion : MonoBehaviour
{
    public LocomotionMode mode = LocomotionMode.Teleport;
    public TurnMode turnMode = TurnMode.Snap;
    public float snapTurnAngle = 30f;
    public float smoothMoveSpeed = 1.5f;     // m/s
    public float smoothTurnSpeed = 90f;      // deg/s
    public ComfortVignette vignette;
    public bool teleportArcVisible = true;
    public float teleportFadeMs = 100f;
}

public enum LocomotionMode { Teleport, Smooth, Hybrid, RoomScaleOnly }
public enum TurnMode { Snap, Smooth, None /* room-scale only */ }
```

For React XR / WebXR / Vision Pro: similar API patterns; specifics differ.

## Configuration UI

Settings menu the user accesses to change comfort:

```
Locomotion
─────────
Move
  ◉ Teleport
  ○ Smooth
  ○ Hybrid

Turn
  ◉ Snap (30°)
  ○ Snap (45°)
  ○ Snap (90°)
  ○ Smooth (slow)
  ○ Smooth (medium)
  ○ Smooth (fast)
  ○ None (room-scale only)

Comfort
  Comfort vignette  ●○○ Strong → ○○● Off
  Smooth move speed Slow → Fast
  Teleport fade     Off → Long
```

Save preferences. Apply immediately.

## Comfort vignette

Implementation:

```glsl
// Pseudocode shader
void main() {
    vec3 color = sceneColor;
    float distFromCenter = length(uv - vec2(0.5));
    float vignetteAlpha = smoothstep(comfortRadius, comfortRadius - 0.1, distFromCenter);
    color = mix(black, color, vignetteAlpha);
    fragColor = vec4(color, 1.0);
}
```

The `comfortRadius` parameter:
- During motion: smaller (more vignette).
- Stationary: full FOV (no vignette).
- Acceleration: vignette tightens slightly.

User-configurable strength. For some users: off. For sensitive users: maximum.

## Teleport details

### Arc trajectory

Show a parabolic arc from controller to landing point:

```
[controller ✕]
        ╲
         ╲___
              ╲___
                  ●  ← landing indicator
```

Arc tunes:
- **Strength**: based on input deflection or fixed.
- **Color**: brand-aligned; visible against world.
- **Invalid endpoints** (cliffs, blocked): different color (red).

### Landing indicator

```
        ┌─────────┐
        │ player  │
        │ outline │
        └─────────┘
```

Show:
- Direction the player will face after teleport (arrow).
- Footprint or circle on the ground.
- Distance estimate.

### Teleport restrictions

Don't allow teleport to:
- **Inaccessible areas** (gameplay-locked).
- **Inside objects**.
- **Off cliffs** (without intent).
- **Mid-air** (typically).

Some games allow climbing / mid-air teleport for traversal.

### Fade

Brief black fade during teleport (50-150ms) reduces nausea. Or instant ("blink") for power users.

## Smooth locomotion details

### Direction relative to head vs controller

| Mode | Direction |
| --- | --- |
| **Head-relative** (default) | Push joystick forward → move where you're looking |
| **Controller-relative** | Push joystick forward → move in controller's pointing direction |
| **Body-relative** (chest) | Some headsets support this |

Most users prefer head-relative for natural feel.

### Speed curve

Constant velocity is most comfortable. Acceleration causes more sickness. So:
- **Joystick on**: full speed (no ramp).
- **Joystick off**: stop quickly.

Some games allow ramp-up for "running" feel; usually less comfortable.

## Snap turn

### Default angles

- 30° — fine-grained; many small turns.
- 45° — common default; balance.
- 60° — bigger but rare.
- 90° — quick 4-way orientation.

User picks.

### Fade transition

Brief black flash (50-100ms) during snap turn reduces sickness. Some users prefer no fade.

## Smooth turn

```
[joystick left] → [view rotates left at smoothTurnSpeed]
[joystick released] → [stop]
```

Comfort vignette stronger during smooth turn (most nauseating motion).

For new users: default to **snap turn**. Allow opt-in to smooth turn.

## Hybrid locomotion

Some experiences use hybrid:
- Joystick for short movements (smooth).
- Press button for long teleports.

Or contextual:
- Walking around a room: room-scale.
- Crossing a large space: teleport.
- Combat: smooth strafe.

Document which gesture does what; teach in tutorial.

## Room-scale walking

- User physically walks in their playspace.
- Most comfortable; no software-induced motion.
- Limited by room size.

For room-scale-primary games:
- **Guardian boundary** must be set up.
- **Re-center** option for tight spaces.
- **Standing OR seated** modes.

Vehicles / cockpits move the world relative to player; user's room-scale movement still works inside the cockpit.

## Implementation hints

```csharp
void Update()
{
    Vector2 leftStick = Input.GetLeftStick();
    Vector2 rightStick = Input.GetRightStick();

    // Movement
    if (mode == LocomotionMode.Teleport)
    {
        if (leftStick.magnitude > 0.5f) ShowTeleportArc(leftStick);
        if (Input.LeftStickReleased && validTeleportTarget) PerformTeleport();
    }
    else if (mode == LocomotionMode.Smooth)
    {
        Vector3 moveDir = camera.forward * leftStick.y + camera.right * leftStick.x;
        moveDir.y = 0;
        transform.position += moveDir * smoothMoveSpeed * Time.deltaTime;

        if (leftStick.magnitude > 0.1f) vignette.SetActive(true);
        else vignette.SetActive(false);
    }

    // Turn
    if (turnMode == TurnMode.Snap)
    {
        if (rightStick.x > 0.7f && !snapping) StartSnapTurn(snapTurnAngle);
        if (rightStick.x < -0.7f && !snapping) StartSnapTurn(-snapTurnAngle);
    }
    else if (turnMode == TurnMode.Smooth)
    {
        transform.Rotate(0, rightStick.x * smoothTurnSpeed * Time.deltaTime, 0);
        if (Mathf.Abs(rightStick.x) > 0.1f) vignette.IncreaseStrength();
    }
}

IEnumerator StartSnapTurn(float angle)
{
    snapping = true;
    yield return FadeOut(50);
    transform.Rotate(0, angle, 0);
    yield return FadeIn(50);
    snapping = false;
}
```

## Tokens consumed

```
--spatial-locomotion-arc-color        (teleport arc default)
--spatial-locomotion-arc-invalid      (red for invalid)
--spatial-locomotion-fade-color       (typically black)
--spatial-locomotion-fade-duration    (50-150ms)
--spatial-locomotion-vignette-color   (typically black)
--spatial-locomotion-vignette-strength (0-1)
--spatial-locomotion-snap-default     (45°)
--spatial-locomotion-smooth-speed     (1.5 m/s)
```

## States

| State | Visual |
| --- | --- |
| Idle | No motion; full FOV |
| Showing teleport arc | Arc + landing indicator visible |
| Teleporting | Brief fade; instant relocation; fade in |
| Smooth moving | Player moves; vignette applied |
| Snap turning | Brief fade; instant rotation; fade in |
| Smooth turning | View rotates; stronger vignette |
| Disabled (cinematic / cutscene) | All input ignored |

## Accessibility

- **Comfort defaults** for new users (teleport + snap turn + vignette on).
- **One-handed mode** — locomotion possible with single controller.
- **Auto-walk** option (forward without holding) for users with reduced grip strength.
- **Voice locomotion** — "teleport to [target]" for users who can't use joystick.
- **Reduce motion** — skip vignette animation; use static darken.
- **Adjust speeds** — slow option for sensitive users.

## Korean / cultural

Less specific to KR than other components. Default vignette + snap-turn defaults same globally.

For Korean Samsung Galaxy XR (upcoming): likely similar conventions. KR localization of settings menu in Korean.

## Common locomotion mistakes

- **Defaulting to smooth + smooth** for new users.
- **No vignette option** (some users need maximum, some none).
- **Ignoring guardian** during smooth locomotion.
- **Forgetting fade** in snap turn.
- **No "sit / stand" mode** option.
- **Teleport without arc trajectory** — disorienting.
- **Forced cinematic camera moves** — sickness.

## Don't

- Don't default to smooth + smooth turn for new users.
- Don't omit comfort vignette as an option.
- Don't lock out room-scale movement when user wants it.
- Don't ignore guardian boundaries.
- Don't make snap turn instant without fade — disorienting.
- Don't allow teleport into walls / objects.
- Don't change locomotion mode without saving preference.
- Don't ignore frame rate during smooth motion — drops cause severe sickness.

## References

Patterns drawn from:
- Half-Life: Alyx (gold standard for comfort options)
- Beat Saber (room-scale, no locomotion needed)
- Asgard's Wrath 2 (full comfort suite)
- Resident Evil 4 VR (hybrid)
- Half-Life: Alyx's "blink" teleport with arc + landing indicator
- Boneworks / BONELAB physics-based smooth (less comfort-friendly intentionally)

## Cross-reference

- [`knowledge/spatial/vr-patterns.md`](../knowledge/spatial/vr-patterns.md) — VR
- [`knowledge/spatial/spatial-design-fundamentals.md`](../knowledge/spatial/spatial-design-fundamentals.md) — fundamentals
- [`knowledge/spatial/comfort-and-accessibility.md`](../knowledge/spatial/comfort-and-accessibility.md) — comfort + a11y
- [`examples/component-spatial-panel.md`](component-spatial-panel.md) — UI panels
