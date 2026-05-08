---
description: Design and spec motion for a screen, component, or page — picks tool, durations, easings, and writes a developer-ready motion spec. Reduced-motion-safe by default.
---

You will produce a motion spec for the surface described in `$ARGUMENTS`. The argument may be a component name, screen description, or design link.

## Input

Parse `$ARGUMENTS`. Expect:
- A surface (e.g., "landing hero", "modal open", "route transition", "checkout success state").
- Optionally: trigger (e.g., "on scroll into view", "on submit"), platform (web / mobile / native), brand voice (Toss-style / playful / minimal).

If ambiguous, ask one clarifying question — but only one. Otherwise apply reasonable defaults and proceed.

## Steps

1. **Classify the moment** into one of: micro-interaction, marketing motion, app loading, choreography, state transition. The category determines the rules — see [`skills/motion-designer/PLAYBOOK.md`](../skills/motion-designer/PLAYBOOK.md) step 1.

2. **Apply the [motion-designer playbook](../skills/motion-designer/PLAYBOOK.md)**:
   - Pick duration tier → easing → tool → properties.
   - Choreograph if multi-element.
   - Specify reduced-motion fallback.
   - Verify performance budget.

3. **Output** using the structure in PLAYBOOK.md step 10:

```markdown
# Motion spec: <surface>

> Surface: <...>
> Intent: <one sentence>
> Trigger: <...>
> Tool: <CSS | Framer Motion | GSAP | Lottie | Rive | react-spring>

## Tokens used
## Sequence
## Timing diagram
## Reduced motion
## Performance budget
## Code stub
## Don't
```

## Done when

- Surface, intent, trigger, and tool stated.
- Duration tier and easing tokenized (no raw values in body).
- Animated properties limited to `opacity` / `transform` / `filter`.
- Stagger ≤ 80ms; total entrance ≤ 800ms.
- `prefers-reduced-motion` fallback specified for every element.
- Performance budget (bundle delta, animation count, LCP impact) stated.
- Code stub a developer can paste in.
- "Don't" section catches 2–3 misuses.
- Verification phase from PLAYBOOK.md passes.
