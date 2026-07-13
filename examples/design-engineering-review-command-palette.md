<!-- hand-written -->
# Design engineering review: Command palette and result navigation

> User goal: Open the palette, find an action, and execute it without losing keyboard momentum.
> Mode: review
> Evidence: source inspection plus Playwright recording at 1440x900 and 390x844
> Scope: `CommandPalette`, result rows, tooltip provider, desktop keyboard and mobile trigger

## Summary

The palette is structurally accessible and uses the product's motion tokens, but its open choreography and result hover behavior slow a high-frequency keyboard path. The best path is to remove decorative entrance movement for keyboard invocation, keep a short origin-aware transition for pointer/touch invocation, and make result feedback device-aware. Gesture continuity is not applicable; reduced-motion and rapid-toggle behavior still require explicit proof.

Grounding: [`knowledge/patterns/interface-craft.md`](../knowledge/patterns/interface-craft.md), [`knowledge/motion/principles.md`](../knowledge/motion/principles.md), and [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md).

## Craft scorecard

| Lens | Status | Evidence |
| --- | --- | --- |
| Purpose and frequency | fail | `Cmd+K` is used repeatedly, but every open runs translate/scale choreography. |
| Response | pass | The selected row updates on the same keyboard event and the trigger has a visible pressed state. |
| Spatial continuity | partial | Pointer open originates near the trigger; keyboard open incorrectly reuses that origin. |
| Interruptibility | fail | A second `Cmd+K` during entry waits for the current keyframe sequence before closing. |
| Timing and cohesion | partial | Durations use tokens, but keyframes are unnecessary for a rapidly toggled state. |
| Performance | pass | Only opacity and transform animate; no layout properties change per frame. |
| Accessibility | partial | Dialog naming and focus trap pass; reduced-motion removes translation but leaves the scale animation. |
| Responsive resilience | partial | Mobile layout fits at 390px; result-row hover background also appears after touch. |

## Findings

| Priority | Location | Before | After | Why | Verification |
| --- | --- | --- | --- | --- | --- |
| P1 | `src/components/command-palette.css:18` | Keyboard and pointer opens both run the 250ms `palette-enter` keyframes. | For keyboard invocation, mount in the final position with no decorative transform; preserve focus and a short state-visible opacity change only if it does not delay input. Keep the existing component-tier token for occasional pointer/touch open. | A repeated expert action should not wait for entrance choreography. | Playwright: toggle `Cmd+K` five times rapidly and verify the palette follows each input without queueing; inspect at 0.25x. |
| P1 | `src/components/CommandPalette.tsx:96` | Input is ignored while `isAnimating` is true. | Remove animation-owned input lockout and retarget from the current open state. Use the existing disclosure state primitive rather than a parallel animation state. | Animation must not block dismissal or reversal. | Open, press Escape halfway through, and verify immediate close with focus restored to the trigger. |
| P1 | `src/components/command-palette.css:44` | Reduced motion removes translation but retains `scale(0.96)` to `scale(1)`. | Under `prefers-reduced-motion: reduce`, remove scale and translation; use an instant state swap or a short opacity-only transition. | Scale is non-essential and may trigger motion sensitivity. | Emulate reduced motion and verify computed transform is `none`; confirm the selected state remains perceivable without motion. |
| P2 | `src/components/command-result.css:27` | The full hover treatment is active on touch devices after tap. | Gate hover elevation/translation behind `(hover: hover) and (pointer: fine)` and keep a separate pressed/selected state for coarse pointers. | Hover is an enhancement and must not become sticky touch feedback. | Use a coarse-pointer mobile context; tap consecutive rows and verify no stale hover state. |

## Implementation slices

### Slice 1 — Invocation-aware palette response

- Remove animation-owned input lockout.
- Distinguish keyboard invocation from pointer/touch invocation using the existing trigger metadata.
- Keep the current dialog, focus trap, and token names.
- Do not add a motion library.
- Add focused tests for rapid toggle, mid-entry Escape, and focus restoration.

### Slice 2 — Reduced-motion and pointer capability cleanup

- Remove scale/translation under reduced motion.
- Gate hover-only elevation and movement to fine pointers.
- Preserve selected, active, and focus-visible states across all input types.

## Accessibility and responsive proof

- Keyboard: `Cmd+K` opens, arrow keys move selection, Enter executes, Escape closes, and focus returns to the trigger.
- Screen reader: the dialog has an accessible name; result count changes use a polite live region.
- Contrast: result text is 7.1:1 and focus outline is 3.4:1 against the default surface, clearing WCAG AA thresholds.
- Touch targets: the mobile trigger and result rows are at least 44x44.
- Reduced motion: no translation, scale, parallax, or spring overshoot remains.
- Responsive: verify 1440x900, 768x1024, and 390x844; long Korean result labels wrap without covering shortcuts or icons.

## What already works

- The palette uses the shared overlay, elevation, duration, and easing tokens.
- Dialog focus trapping and accessible naming are already correct.
- Result selection is announced independently of color.

## Remaining unknowns

- Safari compositing has not been profiled; verify the pointer-open transition on a real iPhone before release.
- Android TalkBack announcement order remains unverified because this review used browser accessibility tooling only.

## Don't

- Do not replace the current state primitive with a new animation package.
- Do not remove focus or selection feedback in the name of speed.
- Do not apply the keyboard no-choreography rule to rare onboarding or explanatory motion.
