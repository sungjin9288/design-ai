<!-- hand-written -->
---
title: Micro-interactions (the small motions that make UI feel alive)
applies_to: [ui, motion, interactive-elements]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Micro-interactions

The < 200ms motions that respond to user input — button press, switch toggle, focus ring, hover. They're invisible when right; janky when wrong. This is the floor.

## What is a micro-interaction

A motion that:
- Lasts < 200ms
- Responds directly to user action
- Confirms an event happened
- Doesn't navigate or change state at the system level

Examples: button scale-down on press, switch toggle, checkbox checkmark draw-in, hover glow, focus ring expand, tooltip fade-in, ripple, chip dismiss.

## Five categories

### 1. Press feedback

User taps / clicks. The element confirms with a brief visual reaction.

| Pattern | Use |
| --- | --- |
| **Scale 0.97** + opacity 0.85 | iOS-feeling, default for buttons |
| **Ripple** (Material) | Material-aligned products |
| **Subtle bg shift** (10% darker) | Calm, business-feeling |
| **Border emphasis** | Buttons with no fill |
| **Shadow lift** then settle | Card-like elements |

Duration: 100–150ms. `ease-out` going down, `ease-out` returning.

```css
.button {
  transition: transform 100ms ease-out, opacity 100ms ease-out;
}
.button:active {
  transform: scale(0.97);
  opacity: 0.85;
}
```

### 2. State change confirmation

A binary state changes (toggle, checkbox, radio). Show the change physically.

```
Switch: 200ms ease-out track color + thumb translateX
Checkbox: 100ms checkmark draw-in (SVG path with stroke-dashoffset)
Radio: 100ms scale 0 → 1 of inner dot
Star rating: 150ms scale 0.8 → 1.1 → 1 (slight overshoot for satisfaction)
```

The "physical satisfaction" of the toggle matters. Don't strip the motion.

### 3. Hover (desktop only)

| Element | Hover motion |
| --- | --- |
| Button | bg darken 5–8%, no scale |
| Card (interactive) | shadow deepen, optional 1–2px translateY -1 |
| Link | underline appears |
| Icon button | bg circle appears (40px round) |
| Checkbox | border color emphasis |

Duration: 100–150ms. Apply `@media (hover: hover)` so touch devices skip.

### 4. Focus ring

When element receives keyboard focus.

```css
.button:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
  transition: outline-offset 100ms ease-out;
}
```

Optional: animate ring scale on appearance. But mostly: just appear instantly.

`:focus-visible` (modern browsers) keeps focus rings on keyboard nav, hides on mouse click. Keyboard users get them; mouse users don't.

### 5. Loading / progress micro-states

Inside a button or input, motion reflects async work:

| Pattern | Use |
| --- | --- |
| Spinner inside button | Loading after click |
| Progress bar inline | File upload row |
| Pulse on indicator | "live" / refreshing |
| Shimmer | Skeleton loading |

Duration: continuous loop until done. Spinner: 1000ms linear rotate. Shimmer: 1500ms linear sweep.

## The four laws of micro-interactions

### Law 1: Be fast

< 200ms feels instant. > 300ms feels sluggish. > 500ms is broken.

### Law 2: Be functional

Every micro-interaction confirms something:
- Button press → "I registered your tap"
- Switch → "I changed the state"
- Focus ring → "You're here now"

If a motion communicates nothing, cut it.

### Law 3: Match the input

| Input source | Motion type |
| --- | --- |
| Mouse click | Subtle (mouse is precise) |
| Touch | Pronounced (finger needs feedback) |
| Keyboard | Focus ring (visual only) |
| Voice | Visual + audio (TBD pattern) |

Touch needs more motion than mouse — fingers cover the button on tap. The press feedback is the only confirmation.

### Law 4: Stagger redundancy

If a button changes 3 things on click (color, scale, shadow), don't fire all at exactly 0ms. Stagger by 30–50ms for a more natural sequence.

```
Press:
  0ms — scale 1 → 0.97
  20ms — opacity 1 → 0.85
  40ms — shadow drops
```

Tiny stagger; enough that the eye reads "physical."

## Reduced motion

For micro-interactions:

| Pattern | Reduced-motion alternative |
| --- | --- |
| Press scale | Instant bg color shift |
| Switch toggle | Instant state change |
| Checkbox draw | Instant checkmark |
| Hover lift | No motion; rely on color + cursor |
| Spinner | Static "loading" text |
| Shimmer | Static skeleton, no animation |

Skip motion, keep meaning.

## The animation timing function — fine-tuning

Most micro-interactions use `ease-out` (decelerate to rest). For finer control:

| Curve | Feel | Use |
| --- | --- | --- |
| `cubic-bezier(0, 0, 0.2, 1)` | Standard ease-out | Default |
| `cubic-bezier(0.4, 0, 0.2, 1)` | Material standard | Material-aligned products |
| `cubic-bezier(0.34, 1.56, 0.64, 1)` | Slight overshoot (back-out) | Toggle satisfaction, checkmark |
| `cubic-bezier(0.68, -0.55, 0.27, 1.55)` | Big bounce | Avoid for UI; OK for celebration |
| `linear` | Constant | Spinners, progress bars |

For micro-interactions: stick with the first three. Bouncier curves feel toy-like in serious products.

## Sound and haptic

Mobile micro-interactions can pair with haptic:
- iOS: `UIImpactFeedbackGenerator` (light, medium, heavy)
- Android: `Vibrator.vibrate(pattern)`
- React Native: `Haptics.impactAsync()`

When to add haptic:
- Long-press confirmation (helps users know they pressed long enough)
- Switch / toggle (physical satisfaction)
- Pull-to-refresh activation
- Drag-and-drop pickup

When to skip:
- Every button press (excessive)
- Settings or read-only screens (annoying)

Sound: rarely appropriate in product UI. Reserve for games, accessibility cues, video calls.

## Korean fintech micro-interactions

Toss-style: smooth, calm, money-friendly.
- Press: 0.97 scale + 0.85 opacity (gentle).
- Toggle: 250ms (slightly slower than typical, "deliberate").
- Number ticker for amounts: 300ms count-up.
- Sub-200ms haptic for transfer confirmation.

KakaoBank-style: warmer, slightly more pronounced.
- Press: 0.95 scale (more visible).
- Checkmark: with slight bounce.
- Coin / money icons may rotate playfully in success states.

For Korean banking specifically: don't over-do motion. Users associate restraint with trustworthiness.

## Button micro-interaction spec (canonical)

```css
.button {
  background: var(--color-primary-default);
  transition:
    background-color 150ms ease-out,
    transform 100ms ease-out,
    opacity 100ms ease-out,
    box-shadow 150ms ease-out;
}

@media (hover: hover) {
  .button:hover {
    background: var(--color-primary-hover);
    box-shadow: var(--shadow-card);
  }
}

.button:active {
  background: var(--color-primary-active);
  transform: scale(0.97);
  opacity: 0.85;
}

.button:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition: background-color 0ms;
    transform: none;
  }
  .button:active {
    transform: none;
  }
}
```

## Common micro-interaction mistakes

- **Over 200ms** — too slow.
- **No press feedback** — touch users wonder if tap registered.
- **Hover-only feedback** — fails for touch.
- **All elements animating equally** — no hierarchy.
- **Bounce/spring on serious surfaces** (banking, government) — toy-like.
- **Same motion for press and hover** — should differ.
- **Animation interferes with rapid tapping** — rapid taps shouldn't queue up animations.
- **Spinner inside disabled button** — looks broken.
- **No reduced-motion fallback**.

## Cross-reference

- [`knowledge/motion/principles.md`](principles.md) — duration tiers, easings
- [`knowledge/motion/choreography-depth.md`](choreography-depth.md) — coordinating multiple micro-interactions
- [`knowledge/motion/motion-tools.md`](motion-tools.md) — when CSS vs Framer Motion
- [`knowledge/a11y/keyboard-and-focus.md`](../a11y/keyboard-and-focus.md) — focus indicator rules
- [`examples/component-button.md`](../../examples/component-button.md) — Button spec with full state machine
- [`examples/component-form-controls.md`](../../examples/component-form-controls.md) — Switch/Checkbox/Radio motions
