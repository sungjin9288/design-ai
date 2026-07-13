<!-- hand-written -->
---
title: Interface craft for web and app design engineering
applies_to: [web, app, ui, ux-audit, motion, design-engineering, website-improvement]
version: 1.0.0
last_updated: 2026-07
stability: beta
sources:
  - https://github.com/emilkowalski/skills
  - https://github.com/emilkowalski/skills/tree/main/skills/emil-design-eng
  - https://github.com/emilkowalski/skills/tree/main/skills/review-animations
  - https://github.com/emilkowalski/skills/tree/main/skills/improve-animations
  - https://github.com/emilkowalski/skills/tree/main/skills/animation-vocabulary
---

# Interface craft for web and app design engineering

Interface craft is the layer between visual design and implementation quality. It asks whether a web or app surface responds when users expect, preserves spatial meaning, survives rapid repeated input, and remains accessible and fast on real devices.

This file mines evaluation categories from Emil Kowalski's MIT-licensed design-engineering skills. It does not copy the upstream voice, brand, course material, or implementation snippets. Local motion tokens, accessibility rules, platform conventions, and repository architecture remain authoritative.

## The craft contract

Review every interactive surface through eight lenses. A polished screenshot is not enough.

| Lens | Question | Evidence | Failure threshold |
| --- | --- | --- | --- |
| Purpose and frequency | Does the effect help orientation, feedback, hierarchy, explanation, or continuity at its actual usage frequency? | User flow, trigger, usage estimate, runtime recording | Repeated actions wait for decorative motion or have no immediate feedback. |
| Response | Does visual feedback start at input time and continue through direct manipulation? | Pointer, keyboard, touch, loading-state behavior | The control appears idle after activation or only updates after a gesture ends. |
| Spatial continuity | Does an overlay, expansion, dismissal, or navigation change preserve where it came from and where it went? | Trigger location, transform origin, enter/exit path | Anchored UI grows from an unrelated center or exits along a conflicting path. |
| Interruptibility | Can rapid input reverse, retarget, or dismiss the state without a jump or lockout? | Repeated toggle, Escape, drag reversal, route change | Input is blocked until animation completion or restarts from a stale target. |
| Timing and cohesion | Are durations, easing, spring behavior, and state feedback drawn from one local motion language? | Tokens, component variants, computed styles | One-off curves, `transition: all`, or long motion on frequent controls. |
| Performance | Does the implementation avoid layout/paint churn and unnecessary runtime cost? | DevTools trace, CSS/JS inspection, bundle evidence | Layout properties animate per frame, loops run offscreen, or a library is added for a trivial state. |
| Accessibility | Is meaning preserved for keyboard, screen reader, reduced motion, zoom, contrast, and touch? | Keyboard pass, accessibility tree, media-query fallback | Motion blocks operation, focus disappears, or state is conveyed only by motion/color. |
| Responsive resilience | Does the interaction survive mobile viewport, coarse pointer, long text, dynamic type, and orientation changes? | Desktop/tablet/mobile checks, touch device | Hover-only affordance, clipped labels, unstable fixed geometry, or undersized targets. |

## Decide whether motion belongs

Classify the trigger before choosing a duration:

| Frequency | Default treatment |
| --- | --- |
| Continuous or command-driven | No decorative transition. Preserve direct 1:1 response and state visibility. |
| Repeated during a work session | Instant or fast-tier feedback; remove entrance choreography. |
| Occasional state change | Component-tier motion is acceptable when it explains origin, hierarchy, or completion. |
| Rare, first-run, or brand moment | A longer sequence may be justified if it stays skippable and does not delay the task. |

Keyboard invocation is a strong signal for speed, not an absolute ban on all state change. Keep focus, selection, and status feedback; remove motion that delays expert operation.

Every retained animation needs one named purpose:

- **Feedback** — confirms the input was received.
- **Orientation** — shows where content came from or where it moved.
- **Continuity** — connects two states without a visual jump.
- **Explanation** — demonstrates a feature or relationship.
- **Hierarchy** — introduces the next focus without competing with the task.

"It looks modern" is not a sufficient purpose for repeated product UI.

## Response before decoration

For pressable controls, show a visible state on pointer or touch down and commit the action on release. The pressed state can use color, elevation, opacity, or a subtle transform; do not force `scale()` onto text links, dense table actions, toggles with their own state layer, or controls whose content becomes less legible when scaled.

For direct manipulation:

1. Start only after a small intent threshold so taps remain taps.
2. Capture the active pointer so the gesture continues outside the original bounds.
3. Track the pointer continuously rather than jumping at release.
4. Allow cancellation and reversal.
5. Hand current position and velocity into the settling motion.
6. Ignore additional touch points unless multi-touch is part of the product contract.

Input must remain available while UI transitions. A disabled interaction may be valid during a destructive server mutation, but an animation alone is never a reason to lock input.

## Local timing and easing policy

Use the local ranges from [`motion/principles.md`](../motion/principles.md): 100–150ms for fast micro-interactions, 200–300ms for component transitions, and 400–600ms only for rare hero or storytelling moments. Choose a value inside the applicable range from runtime evidence; do not create a second timing scale here.

- Entrances use `ease-out` so response is visible immediately.
- Exits are shorter than entrances and use the local `ease-in` token when acceleration clarifies departure.
- Position-to-position movement uses `ease-in-out` or a restrained spring when it must preserve velocity.
- Constant progress or ambient loops use `linear` only when constant speed carries meaning.
- Rapidly repeated states should be retargetable from the current visual state.

The reference repo recommends `ease-out` more broadly, including exits. This project keeps the exit semantics documented in the local motion principles. Review the perceived first frame and total duration; switch curves only with runtime evidence, not taste alone.

## Origin and continuity

Anchored UI should reveal its relationship to the trigger:

- Popovers, menus, and tooltips originate near their trigger.
- Centered modals remain centered because they are viewport tasks, not anchored disclosures.
- Drawers and sheets exit along the same spatial path they entered.
- Expand/collapse and shared-element transitions preserve object identity.
- Directional navigation mirrors forward and backward movement.

Avoid `scale(0)` entrances. Start close to the final size and pair the small scale delta with opacity if scale adds real spatial information. Do not scale large reading surfaces merely to make them feel animated.

## Interruptibility tiers

| Interaction | Preferred mechanism | Why |
| --- | --- | --- |
| Hover, focus, press, color/state change | CSS transition on named properties | Small, reversible, low runtime cost. |
| Mount/unmount entrance without gesture | CSS transition with `@starting-style` when supported, with a documented fallback | Keeps simple entry logic out of JavaScript. |
| Rapid toggle, toast, disclosure | Retargetable transition or state-driven motion primitive | New input should redirect the current visual state. |
| Drag, swipe, reorder, sheet | Pointer-driven value plus spring/inertia that accepts current velocity | Gesture response must remain continuous. |
| Marketing timeline | Timeline tool only when sequencing exceeds CSS/state primitives | Long choreography needs explicit orchestration and budget. |

Do not treat all CSS transitions as interruptible enough for gesture work. CSS is appropriate for state retargeting; gesture-driven movement needs current-position and velocity ownership.

## Code review sweeps

Search is reconnaissance, not proof. Confirm each result in context.

```text
transition: all
transition / animation / @keyframes
ease-in / ease-out / cubic-bezier
scale(0)
transform-origin
prefers-reduced-motion
@starting-style
motion. / animate= / useSpring
pointerdown / pointermove / setPointerCapture
width / height / top / left inside animation code
```

Check these implementation details:

- Name transition properties explicitly.
- Keep hover enhancements inside `(hover: hover) and (pointer: fine)` when they change more than color or underline.
- Do not rely on hover for discoverability or primary actions.
- Pause ambient loops when offscreen or the document is hidden.
- Promote repeated duration/easing/spring values into semantic tokens.
- Avoid persistent `will-change`; apply it narrowly and remove it after expensive sequences.
- Treat blur and large filters as paint-cost risks, especially on Safari and low-end mobile devices.
- Prefer transforms and opacity, but verify compositing rather than assuming it.

## Accessibility and responsive proof

The craft pass must include:

- keyboard reachability, visible focus of at least 2px and 3:1 contrast, and logical focus restoration
- body text contrast of at least 4.5:1 and UI/large-text contrast of at least 3:1
- touch targets of at least 44x44 on mobile and 24x24 on web AA
- `prefers-reduced-motion` behavior that removes large translation, parallax, and spring overshoot while preserving state feedback
- screen-reader state and live-status behavior for loading, success, error, and expanded/collapsed controls
- desktop, tablet, and mobile viewport checks, including Korean label wrapping when applicable
- coarse-pointer behavior with hover treated as enhancement only

See [`a11y/keyboard-and-focus.md`](../a11y/keyboard-and-focus.md), [`a11y/contrast.md`](../a11y/contrast.md), and [`i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md).

## Required review artifact

Start with a scorecard, then report only confirmed findings.

```markdown
## Craft scorecard
| Lens | Status | Evidence |
| --- | --- | --- |
| Response | pass / fail / unverified | <runtime or code evidence> |

## Findings
| Priority | Location | Before | After | Why | Verification |
| --- | --- | --- | --- | --- | --- |
| P1 | `src/...:42` | <current behavior> | <specific target> | <user impact> | <command + feel check> |
```

`Before` is observed evidence, not an invented bad snippet. `After` must use the target repository's existing primitives and tokens. When runtime behavior cannot be judged from code, mark it `unverified` and prescribe a browser or device check.

## Feel-check protocol

Automated tests cannot prove that motion feels coherent. Pair them with repeatable manual evidence:

1. Record the interaction at normal speed and slow it to 0.25x for discontinuities.
2. Repeat the action quickly at least five times; verify no queueing, lockout, jump, or stale state.
3. Reverse or dismiss halfway through when the interaction supports it.
4. Test keyboard and coarse-pointer paths separately.
5. Enable reduced motion and confirm the task remains understandable.
6. Capture desktop and mobile screenshots after motion settles; no text may clip, overlap, or shift unexpectedly.

## Don't

- Do not add motion to every component to create a premium feel.
- Do not replace local tokens with a reference author's preferred curves without product evidence.
- Do not report regex matches as confirmed defects.
- Do not add a motion dependency for one hover, focus, or press state.
- Do not declare polish complete from static screenshots alone when the surface is interactive.
