---
description: Design and spec an illustration system or single illustration. Picks style, voice, format (SVG / Lottie / PNG), and produces a delivery-ready spec.
---

You will produce an illustration spec for the scope described in `$ARGUMENTS`.

## Input

Parse `$ARGUMENTS`. Expect:
- A scope ("define a system for our SaaS", "spec empty-state illustrations", "design a mascot", "optimize this SVG").
- Optionally: brand voice, target market (Korean / global), existing system reference.

If ambiguous, ask one clarifying question — but only one. Otherwise apply reasonable defaults and proceed.

## Steps

1. **Classify the work** — system definition vs single piece vs mascot vs SVG technical. The classification determines which playbook section applies.

2. **Apply the [illustration-designer playbook](../skills/illustration-designer/PLAYBOOK.md)**:
   - If system: set style, voice, color, geometry, perspective.
   - If single piece: pick from existing system; spec subject, size, format, tokens, a11y.
   - If mascot: brief → silhouette → expression sheet → pose sheet → style guide.
   - If SVG technical: SVGO + currentColor + accessibility checklist.

3. **Apply Korean conventions** if the market is Korean B2C (mascot-led, soft geometry, warm palette).

4. **Output** using the structure in PLAYBOOK.md step 8.

## Done when

- Style + voice + format choices explicit.
- Color tokens listed (no raw hex in body).
- Asset list with size, format, a11y per illustration.
- Production checklist.
- Reduced-motion fallback if animated.
- "Don't" section catches 2-3 misuses.
- Verification phase from PLAYBOOK.md passes.
