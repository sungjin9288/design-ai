<!-- hand-written -->
---
title: Motion principles for product UI
applies_to: [web, mobile, all-ui]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Motion principles for product UI

Motion in product UI is functional, not decorative. Every animation should answer one of: *Where did this come from? Where is it going? What just happened? What can I do now?*

If an animation answers none of those, cut it.

## The three duration tiers

| Tier | Duration | Use |
| --- | --- | --- |
| **Fast** | 100–150 ms | Micro-interactions: hover, focus ring, button press, ripple, switch toggle, checkbox, simple state changes within a component. |
| **Default** | 200–300 ms | Component-level transitions: drawer slide, modal fade-in, tooltip, dropdown, accordion expand, page transition (within an SPA). |
| **Slow** | 400–600 ms | Hero/storytelling moments only: celebrating a completed action, full-screen welcome, large card flip in onboarding. |

> Above 600 ms, users perceive the system as slow. Reserve for genuinely emotional moments or intentional delays.

## Easing curves

Pick a small set of named curves. Don't author one-off `cubic-bezier()` per animation.

| Token | cubic-bezier | Feel | Use |
| --- | --- | --- | --- |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | starts fast, decelerates | **Default for entrances** — element settles into place |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | accelerates, snaps off | **Default for exits** — element accelerates away |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | symmetric | Position changes within view (e.g., reorder, accordion height) |
| `emphasized` | `cubic-bezier(0.2, 0, 0, 1)` | Material 3 style — strong start, slow end | Hero entrances, primary CTA reveal |
| `bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | overshoot | **Use rarely** — celebratory micro-moments only |
| `linear` | `linear` | constant | progress bars, spinners, anything that should not "feel" elastic |

**Do not** ship custom-named curves like `wobble`, `whoosh`, `pop` unless you have a brand-driven motion language and a designer who maintains it.

Source for emphasized curves: Material 3 motion (https://m3.material.io/styles/motion/easing-and-duration). Ant Design uses `cubic-bezier(0.215, 0.61, 0.355, 1)` for `motionEaseOut` — also good.

## Choreography (multi-element transitions)

When several elements animate together:

1. **Sequence, don't overlap chaos**. A list reveal: first item starts at 0 ms, each subsequent at +30 ms (stagger). Total duration ≤ 400 ms even with 10 items.
2. **Stack hierarchy**. The most important element animates first (or last — for emphasis). Don't animate everything in unison; one anchor point + supporting elements.
3. **Match-move on transitions**. Element A turns into element B (e.g., FAB expands into modal). Use FLIP technique or shared element transitions (CSS View Transitions API in 2024+).

## Reduced motion

WCAG 2.3.3 (AAA) and platform conventions:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

But blanket-killing all motion is too aggressive. Better:

- **Keep**: state changes (color shift, opacity 0→1) without movement.
- **Drop**: spring/bounce, parallax, hero auto-play, scroll-jacking, anything that translates >20px.
- **Replace**: heavy transitions with instant state changes.

Audit every animation for reduced-motion behavior. The system either respects user preference or it fails AA.

## Performance budget

| Animated property | Cost | Use when |
| --- | --- | --- |
| `transform` (translate, scale, rotate) | **cheap** — GPU-composited | first choice, almost always |
| `opacity` | cheap | first choice |
| `filter` (blur, brightness) | medium | sparingly, not on large surfaces |
| `width` / `height` | **expensive** — triggers layout | avoid; use `transform: scale` |
| `top` / `left` | **expensive** — triggers layout | avoid; use `transform: translate` |
| `box-shadow` | medium-expensive | OK for hover, avoid for keyframe loops |
| `background-color` | cheap | yes |

Aim for **60fps**. If a transition stutters on a mid-range Android device, simplify it.

## Common animations and their specs

| Pattern | Duration | Easing | Property |
| --- | --- | --- | --- |
| Button hover | 150 ms | `ease-out` | `background-color` |
| Button press | 100 ms | `ease-out` | `transform: scale(0.97)` |
| Focus ring | 0 ms (instant) | — | — |
| Modal fade-in | 200 ms | `ease-out` | `opacity 0→1`, `transform: translateY(8px)→0` |
| Drawer slide-in | 300 ms | `ease-out` | `transform: translateX(±100%)→0` |
| Drawer slide-out | 250 ms | `ease-in` | reverse |
| Tooltip appear | 100 ms (300 ms delay) | `ease-out` | `opacity`, slight `scale 0.95→1` |
| Toast enter | 250 ms | `ease-out` | `transform: translateY(100%)→0`, opacity |
| Toast auto-dismiss | 200 ms (after 4–5s linger) | `ease-in` | reverse |
| Accordion expand | 250 ms | `ease-in-out` | `height: 0→auto` (actually animate `grid-template-rows` 0fr→1fr or use FLIP) |
| Tab indicator slide | 200 ms | `ease-out` | `transform: translateX` |
| Page transition (SPA) | 200–300 ms | `ease-out` | `opacity` only — avoid horizontal slide |
| List item enter | 200 ms (30 ms stagger) | `ease-out` | `opacity 0→1`, `translateY(8px)→0` |
| Skeleton shimmer | 1500 ms loop | `linear` | `background-position` |
| Spinner rotation | 1000 ms loop | `linear` | `transform: rotate` |
| Form error shake | 400 ms | `ease-in-out` | `transform: translateX` (4 cycles) — **rarely; use color/border instead** |

## Anti-patterns

- **Auto-playing hero video without pause control**: WCAG fail. Always provide pause and respect reduced-motion.
- **Long entrance animations on every page load**: 400+ ms transitions every navigation feel sluggish. Reserve for first-load or rare transitions.
- **Bouncy / springy on serious surfaces**: a banking app with bouncy delete confirmations reads as toy-like.
- **Decorative motion on focused work surfaces**: the data table doesn't need fade-ins on every cell.
- **Motion as the only feedback**: a button that wiggles to indicate error but doesn't change color fails for users with reduced motion. Color, copy, and motion together.

## Reference values from upstream systems

- **Material 3**: short1 50ms, short2 100ms, short3 150ms, short4 200ms, medium1 250ms, medium2 300ms, medium3 350ms, medium4 400ms, long1 450ms, long2 500ms, long3 550ms, long4 600ms.
- **Ant Design**: `motionUnit 0.1` (100ms base), most transitions `0.2–0.3s`. Easings in [knowledge/design-tokens/ant-design.md](../design-tokens/ant-design.md).
- **iOS HIG**: 0.35s default for most transitions, 0.5s for cross-fade.

## Cross-reference

- [knowledge/design-tokens/ant-design.md](../design-tokens/ant-design.md) — Ant's motion easings as concrete cubic-bezier values
- [knowledge/a11y/keyboard-and-focus.md](../a11y/keyboard-and-focus.md) — focus must not depend on motion
