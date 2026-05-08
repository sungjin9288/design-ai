---
description: Spec a spatial / AR / VR / MR experience. Platform, anchoring, locomotion, UI elements, comfort, accessibility; Korean Galaxy XR + KR market context.
---

You will produce a spatial design spec for the experience described in `$ARGUMENTS`.

## Input

Parse `$ARGUMENTS`. Expect:
- An experience (e.g., "Vision Pro productivity app", "Quest VR training", "iOS ARKit product viewer", "HoloLens medical training", "WebXR exhibit").
- Optionally: mode (VR / AR / MR / WebXR), platform, use case, audience, session length.

If ambiguous, ask one clarifying question — but only one. Otherwise apply reasonable defaults and proceed.

## Steps

1. **Pick mode + platform** to determine which knowledge files apply (VR vs AR; Vision Pro vs Quest vs HoloLens vs mobile).

2. **Apply the [spatial-designer playbook](../skills/spatial-designer/PLAYBOOK.md)**:
   - Spatial geometry (coordinate system, height, comfort distance, FOV).
   - Anchoring per UI element (world / wrist / hand / head / object).
   - Locomotion if VR (teleport / smooth / hybrid + comfort options).
   - Input methods + accessibility alternatives (hand / controller / gaze / voice).
   - UI elements with sizing, states, audio.
   - Comfort options (locomotion, vignette, motion, flashing).
   - Accessibility across vision / hearing / motor / cognitive.
   - Onboarding.
   - Korean / regional considerations.
   - Performance budget.

3. **Output** using the structure in PLAYBOOK.md step 12.

## Done when

- Mode + platform + use case + audience explicit.
- Spatial geometry specified.
- Anchoring per UI element documented.
- Locomotion options if VR (with comfort defaults).
- Input methods + alternatives.
- UI elements with sizing + states.
- Comfort options addressed.
- Accessibility plan covering vision / hearing / motor / cognitive / photosensitive / mobility.
- Onboarding planned.
- Korean / regional considerations if applicable.
- Performance budget stated.
- "Don't" catches 2-3 misuses.
- Verification phase from PLAYBOOK.md passes.
