<!-- hand-written -->
---
title: Motion tools comparison
applies_to: [motion, animation, tools]
---

# Motion tools comparison

Designers and developers split the work of motion. The tool depends on who creates and how complex.

## Decision tree

```
Is the motion < 200ms and triggered by user input?
  ├── Yes → CSS transition / animation
  └── No
      ├── Designer-led, complex sequence?
      │   ├── Yes, interactive → Rive
      │   └── Yes, non-interactive → Lottie
      └── Engineer-led, in React?
          ├── Simple → Framer Motion
          ├── Timeline-based, complex → GSAP
          └── Physics / springs → react-spring
```

## Six tools, when to use each

### 1. CSS animations / transitions

**Use for**: hover, press feedback, state changes, simple entrances.

Built into the browser. No bundle cost. Universally supported.

```css
.button {
  transition: transform 100ms ease-out, opacity 100ms ease-out;
}
.button:active {
  transform: scale(0.97);
  opacity: 0.85;
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

Limitations:
- No JS-driven control (can't pause / scrub / sequence imperatively).
- Limited to single elements (no choreographing many).
- No state-machine animations.

For 80% of micro-interactions: CSS is the right answer.

### 2. Framer Motion (React)

**Use for**: React apps. Component entrances, page transitions, shared elements (`layoutId`), choreographed sequences.

```tsx
import { motion, AnimatePresence } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
  Content
</motion.div>
```

Strengths:
- React-native API (declarative).
- Layout animations (`layout` prop, FLIP technique built-in).
- Shared element transitions (`layoutId`).
- Drag, gesture support.
- Variants (orchestrate parent → children).
- AnimatePresence for exits.

Bundle cost: ~30 kB gz. Use `LazyMotion` + `domAnimation` to slim to ~7 kB for simple needs.

When NOT to use:
- Non-React apps.
- Simple CSS hovers (overkill).
- Timeline-heavy sequences (GSAP is better).

### 3. GSAP (GreenSock)

**Use for**: complex marketing sequences, scroll-triggered animations, timeline-based choreography. Framework-agnostic.

```js
gsap.timeline()
  .from(".hero-headline", { y: 40, opacity: 0, duration: 0.6 })
  .from(".hero-sub", { y: 20, opacity: 0, duration: 0.5 }, "-=0.4")
  .from(".hero-cta", { scale: 0.9, opacity: 0, duration: 0.4 }, "-=0.3")
  .from(".hero-visual", { x: 80, opacity: 0, duration: 0.7 }, "-=0.5");
```

Strengths:
- **ScrollTrigger** plugin — best-in-class for scroll-driven motion.
- **Timeline** — precise control over sequence timing.
- **Performance** — heavily optimized, 60fps on complex scenes.
- Framework-agnostic (works in React, Vue, vanilla, etc.).

License: MIT for non-business use; **paid for commercial use** of certain plugins (ScrollTrigger, MorphSVG, etc.). Check current pricing.

Bundle: 30–60 kB depending on plugins.

When NOT to use:
- Simple CSS fades (overkill).
- Pure micro-interactions (CSS is faster).

### 4. Lottie

**Use for**: designer-created animations exported from After Effects, used as JSON.

```tsx
import Lottie from "lottie-react";
import animationData from "./checkmark-success.json";

<Lottie animationData={animationData} loop={false} />
```

Workflow:
1. Designer animates in After Effects.
2. Export with [Bodymovin plugin](https://aescripts.com/bodymovin/) → JSON.
3. Engineer drops JSON into runtime (React, RN, iOS, Android, web).

Strengths:
- **Designer-led** — designers create motion in their familiar tool.
- **Cross-platform** — same JSON runs on web, iOS, Android, RN.
- **Vector-based** — scales to any size cleanly.
- Best for: brand logos animated, success / error states with motion, hero illustrations.

When NOT to use:
- Interactive animations (Lottie can play / pause / scrub but not state-machine — use Rive instead).
- Animations that should respond to user input (use Rive).
- Tiny micro-interactions (overkill; CSS faster).

Bundle: lottie-web is ~150 kB. Use `lottie-react-light` (~50 kB) if you don't need all features.

### 5. Rive

**Use for**: interactive animations with state machines. Designer + engineer collaborate.

```tsx
import { useRive } from "@rive-app/react-canvas";

function HeartButton() {
  const { rive, RiveComponent } = useRive({
    src: "/animations/heart.riv",
    stateMachines: "Like Button",
    autoplay: true,
  });

  return (
    <button onClick={() => rive?.fireState("Like Button", "Click")}>
      <RiveComponent />
    </button>
  );
}
```

Strengths:
- **State machines** — animations respond to events / inputs.
- **Smaller files** than Lottie (binary format).
- **Designer-friendly** tool (rive.app).
- **Cross-platform**: web, iOS, Android, RN, Flutter, Unity, Unreal.

Best for:
- Interactive characters (mascots that react).
- Button states (idle → hover → press → success).
- Onboarding flow visuals.
- Game UI (character emotes, etc.).

When NOT to use:
- Static animation clips (Lottie is fine).
- Design-system-internal motion (CSS / Framer Motion fits closer to code).

Bundle: ~150 kB runtime.

### 6. react-spring (React)

**Use for**: physics-based motion that responds to user input naturally.

```tsx
import { useSpring, animated } from "@react-spring/web";

function Card() {
  const styles = useSpring({
    from: { scale: 0.9, opacity: 0 },
    to: { scale: 1, opacity: 1 },
    config: { tension: 280, friction: 60 },
  });

  return <animated.div style={styles}>...</animated.div>;
}
```

Strengths:
- **Spring physics** — natural feeling motion (no fixed durations).
- **Imperative + declarative APIs**.
- **Smaller** than Framer Motion (~17 kB).

When NOT to use:
- You don't need spring physics — Framer Motion is more featureful.
- You're outside React.

Bundle: ~17 kB.

## When to pick which (decision matrix)

| Need | Tool |
| --- | --- |
| Hover, press, focus rings | CSS |
| Loading shimmers | CSS |
| Page transitions in React | Framer Motion |
| Modal entrances in React | Framer Motion |
| List re-orders (FLIP) | Framer Motion `layout` prop |
| Hero / shared-element morph | Framer Motion `layoutId` OR View Transitions API |
| Scroll-driven parallax | GSAP ScrollTrigger |
| Marketing storyboard (3+ second sequence) | GSAP timeline OR Lottie |
| Brand-led illustrated success state | Lottie |
| Interactive mascot / character | Rive |
| Onboarding visuals that react | Rive |
| Drag-and-drop with physics | react-spring or Framer Motion |
| Cross-platform (web + iOS + Android) | Lottie or Rive |

## Performance comparison

| Tool | First load | Per-animation cost |
| --- | --- | --- |
| CSS | 0 kB | Minimal (GPU-composited) |
| Framer Motion | 7–30 kB gz | Low (DOM + transforms) |
| GSAP | 30–60 kB gz | Low (highly optimized) |
| Lottie | 50–150 kB | Medium (canvas / SVG rendering) |
| Rive | ~150 kB | Low (canvas, optimized) |
| react-spring | 17 kB | Low |

For most apps: CSS + Framer Motion ≈ 20-40 kB total motion budget. Don't add Lottie / Rive unless designer-created animation justifies it.

## Korean / Toss-style preference

Toss / KakaoBank-style apps often use:
- CSS for micro-interactions
- Framer Motion for app transitions
- Lottie for brand moments (success animations, money-flow demos)
- Rarely GSAP (less common in Korean tech stacks)

## Reduced motion handling

| Tool | Reduced-motion support |
| --- | --- |
| CSS | Native via `@media (prefers-reduced-motion: reduce)` |
| Framer Motion | `useReducedMotion()` hook |
| GSAP | Manual: check `matchMedia("(prefers-reduced-motion)")` and disable timelines |
| Lottie | Pause / show single frame |
| Rive | Pause state machine; show "rest" state |

Implement always. Don't ship without it.

## Don't

- Don't load Lottie just to do a fade-in.
- Don't import Framer Motion for one CSS-doable hover.
- Don't ship 4 different motion libraries in one app.
- Don't auto-play Lottie / Rive for purely decorative effect (battery drain).
- Don't use library-specific easings without exposing them as tokens.

## Cross-reference

- [`knowledge/motion/principles.md`](principles.md) — fundamentals
- [`knowledge/motion/micro-interactions.md`](micro-interactions.md) — when CSS is enough
- [`knowledge/motion/marketing-motion.md`](marketing-motion.md) — when GSAP is right
- [`knowledge/motion/app-loading-sequences.md`](app-loading-sequences.md) — Framer Motion patterns
- [`knowledge/motion/choreography-depth.md`](choreography-depth.md) — multi-element coordination
- [`examples/component-lottie-player.md`](../../examples/component-lottie-player.md) — Lottie integration spec
