# spatial-designer — playbook

Design and spec spatial / AR / VR / MR experiences. Output is a markdown spec covering platform, anchoring, locomotion, UI elements, comfort, and accessibility.

## When to use

- "Design a Vision Pro productivity app."
- "Spec the locomotion for our VR game."
- "Plan a mobile AR product visualization."
- "Build a HoloLens training app."
- "Design a WebXR experience for our website."

## Inputs (ask if missing)

1. **Mode** — VR (immersive) / AR (mobile) / MR (passthrough headset) / WebXR / hybrid.
2. **Platform** — Vision Pro / Quest / HoloLens / iOS ARKit / Android ARCore / WebXR.
3. **Use case** — productivity / game / training / social / cinema / commerce AR.
4. **Audience** — first-time VR / experienced / Korean / international.
5. **Session length** — minutes (mobile AR) / hours (productivity).
6. **Locomotion needed?** — none (room-scale only) / teleport / smooth / hybrid.
7. **Input methods** — hand tracking / controllers / gaze / voice / mixed.
8. **Existing brand voice** — for visual / interaction style.

## Steps

### 1. Pick the mode + platform

| Mode | Read |
| --- | --- |
| VR (immersive) | [`vr-patterns.md`](../../knowledge/spatial/vr-patterns.md) |
| AR (mobile / headset MR) | [`ar-patterns.md`](../../knowledge/spatial/ar-patterns.md) |
| All — UI elements | [`spatial-ui-elements.md`](../../knowledge/spatial/spatial-ui-elements.md) |
| All — comfort + a11y | [`comfort-and-accessibility.md`](../../knowledge/spatial/comfort-and-accessibility.md) |

Always read [`spatial-design-fundamentals.md`](../../knowledge/spatial/spatial-design-fundamentals.md).

### 2. Spec the spatial geometry

| Aspect | Decide |
| --- | --- |
| Coordinate system | Right-handed (Unity) / left-handed (Unreal) / per platform |
| Default user height | 1.7m typical adult; allow calibration |
| Comfort distance for primary UI | 1.2-1.5m |
| Eye-level reference | 0° (eye level), -10° (slightly below for reading) |
| Field of view design | ±30° comfort zone |

### 3. Spec anchoring

For each UI element:
- **World-locked** (fixed in space).
- **Wrist-locked** (Vision Pro Home, quick menu).
- **Hand-locked** (held tools).
- **Head-locked** (sparingly — reticle, brief alerts).
- **Object-locked** (AR — pinned to recognized object).
- **Image-locked** (AR — triggered by marker).

Document each: when, where, why.

### 4. Spec locomotion (VR / immersive)

| Mode | Default for |
| --- | --- |
| Room-scale only | Stationary games (Beat Saber, vehicle sims) |
| Teleport | First-time users; accessible default |
| Snap turn | New + most users |
| Smooth move (with comfort options) | Hardcore VR; opt-in |
| Smooth turn | Opt-in advanced |
| Hybrid | Most action games |

Apply comfort vignette, fade transitions, and frame-rate guarantees (90+ fps).

### 5. Spec input methods

For each interaction:
- **Hand tracking** (pinch, point, grab, push).
- **Controllers** (trigger, grip, joystick, buttons).
- **Gaze + pinch** (Vision Pro signature).
- **Voice commands**.
- **Eye tracking** (where supported).
- **Hardware inputs** (face touch, head tap).

Don't make any single input mode mandatory. Provide alternatives.

### 6. Spec UI elements

For each panel / button / menu:
- **Anchoring** mode.
- **Distance + size** (visual angle preferred).
- **Billboarding** behavior.
- **Visual states** (idle / hover / pressed / selected).
- **Audio feedback** for state changes.
- **Occlusion** (real / virtual).

Use `SpatialPanel` primitive where applicable.

### 7. Plan comfort options

Comfort options menu (mandatory for VR):

- Locomotion mode (teleport / smooth / hybrid).
- Turn mode (snap / smooth) + angle.
- Comfort vignette strength.
- Smooth move speed.
- Camera motion control (allow / limit / none).
- Reduce flashing / particles.

### 8. Plan accessibility

- **Vision**: large text option, high contrast, color-blind, screen reader / VoiceOver.
- **Hearing**: subtitles + visual sound indicators.
- **Motor**: one-handed mode, voice nav, dwell-click.
- **Cognitive**: clear instructions, pause anywhere, save often.
- **Photosensitive**: no flashing > 3Hz; reduce particles option.
- **Mobility**: seated mode, smaller play area option, auto-walk.

### 9. Plan onboarding (first-run)

For users new to spatial:
- **Calibration** (eye height, IPD, hand tracking).
- **Tutorial** for unique gestures (pinch, teleport).
- **Comfort defaults** (most accessible).
- **Skip** for repeat users.

For AR mobile:
- **Surface detection** prompt.
- **Permission grant** for camera.
- **Visual instructions** to scan environment.

### 10. Korean / regional

| Aspect | Notes |
| --- | --- |
| Korean text | Pretendard / NanumSquare; ~1.5× Latin equivalent for readability at low PPD |
| Voice / TTS | Korean voice for assistant; 해요체 default |
| Privacy | 개인정보보호법 — disclose camera + body data use |
| Galaxy XR (upcoming) | Samsung XR ecosystem when launches |
| Cross-platform | Web XR or Unity / Unreal multi-platform |

### 11. Performance

- 90Hz minimum (VR); 120Hz preferred.
- 60Hz for mobile AR.
- Frame budget per device.
- Foveated rendering where supported.
- Polygon / texture budgets per platform.
- Battery / heat for mobile AR — limit session length.

### 12. Output

```markdown
# Spatial design spec: <experience name>

> Mode: <VR / AR / MR / WebXR>
> Platform: <Vision Pro / Quest / HoloLens / iOS ARKit / WebXR>
> Use case: <productivity / game / training / social / cinema / commerce AR>
> Audience: <first-time / experienced / Korean / international>
> Session length: <minutes / hours>

## Spatial geometry
<coordinate system, height, comfort distance, FOV>

## Anchoring
<per UI element: world / wrist / hand / head / object>

## Locomotion (if VR)
<modes, defaults, comfort options>

## Input methods
<hand / controller / gaze / voice; alternatives for accessibility>

## UI elements
<panels, buttons, menus with sizing + states>

## Comfort options
<locomotion / turn / vignette / motion / flashing>

## Accessibility
<vision / hearing / motor / cognitive / photosensitive / mobility>

## Onboarding
<calibration / tutorial / skip>

## Korean / regional (if applicable)
<text, voice, privacy, Galaxy XR>

## Performance budget
<fps, polygons, textures, battery>

## UI components needed
<reference SpatialPanel, SpatialLocomotion, etc>

## Don't
<2-3 specific misuses>
```

## Source files this skill reads

- [`knowledge/spatial/spatial-design-fundamentals.md`](../../knowledge/spatial/spatial-design-fundamentals.md)
- [`knowledge/spatial/vr-patterns.md`](../../knowledge/spatial/vr-patterns.md)
- [`knowledge/spatial/ar-patterns.md`](../../knowledge/spatial/ar-patterns.md)
- [`knowledge/spatial/spatial-ui-elements.md`](../../knowledge/spatial/spatial-ui-elements.md)
- [`knowledge/spatial/comfort-and-accessibility.md`](../../knowledge/spatial/comfort-and-accessibility.md)
- [`knowledge/game-ui/game-accessibility.md`](../../knowledge/game-ui/game-accessibility.md) — broader a11y
- [`knowledge/motion/principles.md`](../../knowledge/motion/principles.md) — motion
- [`knowledge/i18n/korean-typography.md`](../../knowledge/i18n/korean-typography.md) — Hangul fonts
- [`examples/component-spatial-panel.md`](../../examples/component-spatial-panel.md)
- [`examples/component-spatial-locomotion.md`](../../examples/component-spatial-locomotion.md)

## Verification phase (run before declaring done)

- [ ] Is the mode (VR / AR / MR / WebXR) explicit?
- [ ] Is the platform (Vision Pro / Quest / etc) explicit?
- [ ] Are anchoring choices documented per UI element?
- [ ] If VR: are locomotion options + comfort defaults specified?
- [ ] Are input methods + alternatives documented?
- [ ] Are UI elements specified with sizing + states + audio?
- [ ] Are comfort options addressed (locomotion, turn, vignette, motion, flashing)?
- [ ] Is accessibility addressed across vision / hearing / motor / cognitive / photosensitive / mobility?
- [ ] Is performance budget (fps, polygons) explicit?
- [ ] Is onboarding planned?
- [ ] If Korean: is Korean text size + 개인정보보호법 addressed?
- [ ] Does "Don't" catch 2-3 specific misuses?

## Done when

- One markdown spec, < 500 lines.
- Mode + platform + use case + audience explicit.
- Spatial geometry defined.
- Anchoring per UI element.
- Locomotion (if VR).
- Input methods.
- UI elements with states + sizing.
- Comfort options.
- Accessibility plan.
- Performance budget.
- Onboarding plan.
- "Don't" section.
- Verification passes.
