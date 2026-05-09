<!-- hand-written -->
---
title: Motion choreography (multi-element coordination)
applies_to: [motion, animation, page-transition, complex-ui]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Motion choreography

When multiple elements animate together, they need to be **choreographed** — sequenced, staggered, hierarchical. Random simultaneous motion looks chaotic. This is the floor for orchestrating multiple animations.

## Core principles

### 1. Sequence, don't unison

Don't fire all animations at 0ms. Stagger them.

```
Bad (unison):
  All cards: 0ms → fade in over 250ms

Good (staggered):
  Card 1: 0ms → fade in
  Card 2: 50ms → fade in
  Card 3: 100ms → fade in
  Total: still ~350ms but reads as composed
```

Stagger 30–80ms per item is the sweet spot. Larger feels glacial; smaller feels simultaneous.

### 2. Establish a primary

When multiple things animate, there's a **lead**. Other elements support.

```
Hero entrance:
  - Heading appears first (the lead)
  - Sub-headline 100ms later
  - CTAs 200ms later
  - Visual 300ms later (last; supports the message)

Reading order matches motion order.
```

### 3. Anchor with a focal point

Animation should originate from a meaningful place:
- Modal: from center, or from the trigger button (transform-origin)
- List item entering: from top (new) or bottom (just-added)
- Drawer: from edge it slides in from
- Hero CTA: from the primary's position

Random origins read as "AI-generated motion" (the wrong kind).

## Five choreography patterns

### 1. Cascade (waterfall)

Items animate in sequence, like a waterfall.

```
Card 1 enters at 0ms
Card 2 enters at 50ms
Card 3 enters at 100ms
...
```

Use for: list reveals, grid fills, multi-step forms.

```ts
{children.map((c, i) => (
  <motion.div
    key={c.id}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.05, duration: 0.25 }}
  >
    {c}
  </motion.div>
))}
```

### 2. FLIP (First, Last, Invert, Play)

When an element changes position (different parent, layout shift), animate the transition smoothly.

```
1. First: record element's position before change
2. Last: render new layout (element at new position)
3. Invert: apply transform that puts element back at "First" position
4. Play: animate transform to identity (transform: 0)

Result: element appears to smoothly move from old to new position.
```

Used in:
- Reordering lists (drag-and-drop result)
- Layout changes (collapse/expand)
- Hero / shared-element transitions

Tools that handle FLIP automatically:
- Framer Motion `layout` prop / `layoutId`
- React Aria's drag-and-drop
- Vue's `<transition-group>`
- View Transitions API (web-native)

### 3. View Transitions API (web-native)

Modern browsers (Chrome 111+, Safari 18+, Edge 111+) ship `document.startViewTransition()`:

```js
function navigate(newRoute) {
  if (!document.startViewTransition) {
    // Fallback: just update
    updateDOM(newRoute);
    return;
  }
  document.startViewTransition(() => {
    updateDOM(newRoute);
  });
}
```

Browser handles the cross-fade automatically. Pair with `view-transition-name` CSS for shared elements:

```css
.product-image {
  view-transition-name: product-image;
}
```

Now navigating from list to detail: the image automatically morphs from list position to detail position.

### 4. Choreographed sequences (storytelling)

A series of coordinated animations that tell a story.

```
Marketing storyboard:
  Scene 1 (0-1s): "Sketch your idea" — pencil draws line
  Scene 2 (1-2s): "Add color" — palette appears, fills shapes
  Scene 3 (2-3s): "Share with team" — cursors stream in, comments appear
```

Tools:
- **Lottie** — designer creates in After Effects, ships as JSON
- **Rive** — designer creates with state machine, runtime interactive
- **GSAP timelines** — engineer codes the sequence
- **CSS keyframes + JS triggers** — for simple sequences

For long sequences (3+ seconds): Lottie or Rive (designer-led).
For short (< 1s) coordinated: Framer Motion or GSAP (engineer-led).

### 5. Reactive choreography (state machines)

Animations driven by **state**, not duration:
- Mouse position → cursor effect
- Scroll position → parallax + reveals
- Form state → field validation animation
- Page state → skeleton vs content vs error

Tools:
- **Rive** state machine (visual, designer-friendly)
- **XState** + Framer Motion (engineer-friendly)
- **Spring physics** libraries (react-spring) for natural motion responding to state

## Stagger formulas

| Items | Stagger ms | Total time |
| --- | --- | --- |
| 3 | 80ms | 240ms + each item's duration |
| 5 | 60ms | 300ms |
| 10 | 40ms | 400ms |
| 20+ | 20–30ms | 500ms+ (cap; longer is glacial) |

Rule: total animation time of all items shouldn't exceed ~600ms. If it does, you're animating too many items.

## Choreographing exits

Exits are the underdesigned half. Most teams design entrances and forget exits.

```
Modal open: 250ms ease-out (slow, settle in)
Modal close: 200ms ease-in (faster, accelerates away)

The exit is faster than entrance — feels right.
```

For lists:
- Removed item: slide-out + fade
- New item appears in the gap: 100–150ms

```ts
<AnimatePresence mode="popLayout">
  {items.map(item => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
    >
      {item}
    </motion.div>
  ))}
</AnimatePresence>
```

## Choreographing across components

Multi-component sequences (e.g., dashboard onboarding):

```
0ms: Header enters (top-down)
200ms: Sidebar enters (left-right)
400ms: Content area starts skeleton
600ms: Skeleton replaced with real content (cascade)
```

Tools:
- Framer Motion `<MotionConfig>` for shared transition defaults
- GSAP `gsap.timeline()` for explicit time control

## Timing diagrams

For complex sequences, document with a timing diagram:

```
Time:    0ms   200ms   400ms   600ms   800ms   1000ms
Header:  ▕━━━━▏
Side:           ▕━━━━▏
Skel:                  ▕━━━━━━━━━━━━━━━━━━━━━━▏
Content:                                       ▕━━━━▏
```

When designing, sketch this. Helps spot conflicts and pacing issues.

## Performance for choreographed motion

Multiple simultaneous animations × multiple frames per second = expensive.

Rules:
- Animate `transform` and `opacity` only (GPU layer).
- Use `will-change: transform` on heavy items (sparingly — kills GPU memory if overused).
- Batch DOM reads + writes (avoid layout thrashing).
- For 60+ items: virtualize or fall back to instant.

For Framer Motion: `LazyMotion` + `domAnimation` ships smaller bundle:

```ts
import { LazyMotion, domAnimation, m } from "framer-motion";

<LazyMotion features={domAnimation}>
  <m.div ... />
</LazyMotion>
```

## Reduced motion in choreographed sequences

For sequences with reduced motion preference:
- Skip stagger (everything appears together).
- Skip slide / scale / parallax.
- Keep cross-fade (opacity is OK).
- Skip Hero / FLIP transitions (instant layout change).

Don't try to "preserve choreography" — just disable.

## Korean motion language

For Korean fintech / consumer apps:
- **Toss style**: smooth, decisive, no overshoot. Stagger 50ms typical.
- **KakaoBank style**: slightly warmer, occasional gentle overshoot. Stagger 60ms.
- **Naver style**: less choreographed; more direct.

Avoid Western "playful Disney-style" sequencing for Korean financial apps — reads as toy-like.

## Don't

- Don't fire 10+ animations simultaneously without staggering.
- Don't use 200ms+ stagger (feels glacial).
- Don't choreograph for the sake of motion. Reduce to what serves the message.
- Don't animate `width` / `height` / `left` / `top` (layout-triggering, janky).
- Don't ignore exits.
- Don't over-spring with bouncy curves on financial / serious surfaces.
- Don't design choreography that breaks under reduced motion.

## Cross-reference

- [`knowledge/motion/principles.md`](principles.md) — durations + easings
- [`knowledge/motion/marketing-motion.md`](marketing-motion.md) — landing-page choreography
- [`knowledge/motion/app-loading-sequences.md`](app-loading-sequences.md) — splash + route transitions
- [`knowledge/motion/micro-interactions.md`](micro-interactions.md) — single-element motions
- [`knowledge/motion/motion-tools.md`](motion-tools.md) — Framer Motion / GSAP / Lottie / Rive
- [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- [Framer Motion docs](https://www.framer.com/motion/)
