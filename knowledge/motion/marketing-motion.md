<!-- hand-written -->
---
title: Marketing motion (landing pages, ads, hero animations)
applies_to: [marketing, landing, hero, ads]
---

# Marketing motion

Motion in marketing differs from motion in product UI. Product motion is functional (navigate, confirm, focus). Marketing motion is **persuasive** — it stops the scroll, reveals the value prop, drives emotional response.

Different rules. This is the floor.

## Three intents

| Intent | Goal |
| --- | --- |
| **Stop the scroll** | Catch attention before user bounces |
| **Reveal value** | Tell the product story through motion |
| **Anchor brand** | Motion as part of brand recognition |

A marketing animation should hit at least one. Animation that doesn't is decoration — cut it.

## Six marketing motion patterns

### 1. Hero entrance (above-the-fold reveal)

The hero text and visual fade-in / slide-in on page load.

```
On load:
0ms — hero hidden
50ms — sub-headline starts fading in (translateY +12px → 0)
100ms — headline starts (offset by 50ms)
250ms — primary CTA appears
500ms — visual / illustration enters (scale 0.95 → 1 + opacity)
```

Total budget: 600–800ms. Done.

Don't:
- Don't make hero entrance > 1s (user is waiting).
- Don't auto-replay on scroll.
- Don't entrance from far off-screen (cheesy).

### 2. Scroll-triggered reveals

Sections animate in as user scrolls them into view. The classic landing-page motion pattern.

```
[scroll position]
- Section enters viewport at 80% threshold
- 200ms fade + 16px translateY → 0
- Stagger child elements (cards, list items) by 50–80ms
```

Use `IntersectionObserver` (or library like Framer Motion / GSAP ScrollTrigger).

Rules:
- **Trigger once per element**. Not on every up/down scroll.
- **Stagger small** (50–80ms). Larger feels slow.
- **Don't reveal everything**. Body text already-rendered is fine; reserve animation for sections / cards / images.

### 3. Parallax

Background elements move at different speeds than foreground.

```
foreground: scroll at 1× rate
background image: scroll at 0.5× rate (slower, "deeper")
floating shape: scroll at 1.5× rate (faster, "closer")
```

Implementation: CSS `transform: translateY(var(--scroll))` driven by JS scroll listener, OR `background-attachment: fixed` (limited).

When to use:
- Storytelling pages with strong visual narrative.
- Hero sections with depth.

When to skip:
- Content-heavy sites (parallax distracts from reading).
- Mobile (most parallax breaks on iOS Safari).
- Performance-sensitive (parallax requires constant scroll repaints).

### 4. Choreographed sequences (storytelling)

A series of coordinated animations that tell a story. Common in product walkthroughs:

```
"Sketch your idea" → screen shows pencil drawing
"Add color" → palette appears, color fills
"Share with team" → cursors appear, comments stream in
```

Tools: Lottie / Rive (designer-led), Framer Motion / GSAP (engineer-led).

For Korean fintech: Toss's "money flows from one account to another" animations are canonical examples.

### 5. Hover / cursor-driven

Elements respond to cursor position or hover:
- Magnetic buttons (button slightly tracks cursor near it)
- 3D card tilt on cursor (popular 2023+)
- Cursor effects (custom cursor, trailing dot)

Cool but use sparingly:
- 3D tilt on every card = performance death.
- Custom cursors break a11y if wrongly done.
- Magnetic effects only work on desktop.

### 6. Loop animations / ambient motion

Background animations that loop continuously:
- Floating geometric shapes
- Animated gradients
- Particle systems

Risk: visual noise, performance, distraction. Use ONLY if motion IS part of the brand identity.

## Tools comparison

| Tool | Use | Skill needed |
| --- | --- | --- |
| **CSS animations** | Simple entrances, hovers | Low |
| **Framer Motion** | React-based product motion + marketing | Medium |
| **GSAP** | Complex sequences, timeline-based | Medium-high |
| **Lottie** | After Effects → web (designer-led) | Designer + dev |
| **Rive** | Interactive animations (state-machine) | Designer + dev |
| **Three.js / WebGL** | 3D scenes | High |
| **Spline** | 3D scenes (designer-friendly) | Designer-led |

For most marketing sites: Framer Motion + Lottie covers 90%. See [`motion-tools.md`](motion-tools.md) for full comparison.

## Performance budget

Marketing motion runs in browsers across devices. Performance matters:

| Metric | Budget |
| --- | --- |
| First Contentful Paint | < 1.8s |
| Largest Contentful Paint | < 2.5s (don't block on motion) |
| Cumulative Layout Shift | < 0.1 (motion shouldn't cause layout shift) |
| Total animations on page | < 10 simultaneously |
| Animation framerate | 60fps target |

Tips:
- Animate `transform` and `opacity` only (GPU-composited).
- Avoid animating `width`, `height`, `top`, `left` (layout-triggering).
- Lazy-load heavy animations below the fold.
- Provide static fallbacks for `prefers-reduced-motion`.

## Reduced motion

Critical for marketing — many users have it on:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

But blanket-killing all motion can be too much. Better:

| Animation | When motion reduced |
| --- | --- |
| Fade-in entrances | Keep (opacity is fine) |
| Translate-Y entrances | Convert to instant or pure fade |
| Parallax | Disable |
| Scroll-driven sequences | Show all states at once |
| Loop animations | Pause |
| Hover tilt | Disable |
| Auto-play hero video | Show poster image instead |

## Korean marketing motion conventions

Korean fintech / consumer landing pages trend toward:
- **Toss-style** — minimal, smooth, brand-color-led, restrained
- **Kakao-style** — playful, character-driven, warmer
- **Naver-style** — denser, less motion

For most Korean B2C: lean Toss-style — restrained, fast, smooth. Heavy motion reads as foreign / over-designed.

## Brand motion as identity

Some brands have a defined "motion language":
- Apple: smooth, decisive, rubber-band
- Stripe: refined, geometric, minimal
- Linear: fast, snappy, decisive
- Toss: gentle, calming, money-friendly

Define yours:
- **Easing curves** (rubber-band? smooth? snappy?)
- **Duration tier preferences** (fast vs medium)
- **Choreography style** (staggered? unison? cascading?)
- **Reaction to interaction** (eager vs reserved)

Document in your brand kit alongside color and typography.

## Common marketing motion mistakes

- **Motion as decoration**, no purpose.
- **Auto-play heavy video** without poster fallback.
- **Hero entrance > 1s** — feels slow.
- **Stagger > 100ms per item** — feels glacial.
- **Animating layout properties** (width, height) — janky.
- **No reduced motion** support.
- **Motion that interferes with reading** (text moving while reading).
- **Custom cursor that hides the OS cursor** entirely — accessibility break.
- **Looping motion at 0.5fps** to "save battery" — looks broken.

## Cross-reference

- [`knowledge/motion/principles.md`](principles.md) — duration tiers, easings (foundation)
- [`knowledge/motion/app-loading-sequences.md`](app-loading-sequences.md) — splash + app load
- [`knowledge/motion/choreography-depth.md`](choreography-depth.md) — multi-element coordination
- [`knowledge/motion/motion-tools.md`](motion-tools.md) — tool comparison
- [`knowledge/patterns/landing-hero-design.md`](../patterns/landing-hero-design.md) — hero strategy
- [`knowledge/patterns/landing-page-patterns.md`](../patterns/landing-page-patterns.md)
