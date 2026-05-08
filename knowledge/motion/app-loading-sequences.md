<!-- hand-written -->
---
title: App loading sequences
applies_to: [splash, app-launch, route-transitions, progressive-load]
---

# App loading sequences

The first 3 seconds of an app launch decide whether users feel the app is fast or slow. **Perceived performance** > actual performance. Design the loading sequence intentionally.

## Three loading moments

| Moment | Duration | UX goal |
| --- | --- | --- |
| **Cold launch** (app first opens) | 0–3s | Make waiting feel intentional |
| **Warm launch** (app already in memory) | 0–500ms | Hide the load entirely |
| **Route change** (user navigates within app) | 0–500ms | Smooth transition |

Each needs different patterns.

## Cold launch — splash + first paint

Native apps (iOS / Android) show a splash screen during launch. Web / PWA does similar via service worker + first paint.

### Splash screen rules

- **Brand-led** — logo + brand color. No spinner.
- **Static or minimal motion**. Looping spinner reads as loading-stuck.
- **Match the first screen** — splash's bg color = first screen's bg color, so transition is seamless.
- **iOS / Android handle splash automatically** in many cases (LaunchScreen.storyboard / SplashScreen API).

### iOS splash strategy

Use LaunchScreen.storyboard:
- Centered logo on brand background.
- No spinner (Apple HIG explicitly says no).
- Disappears as soon as React Native / web view is ready.

### Android splash (API 31+)

Native SplashScreen API:
- Animated icon support
- Brand background color
- Auto-handles transition to app

For older Android: simple solid-color screen with logo.

## Warm launch — invisible

When app is already in memory, launch should feel instant. < 500ms.

If you can't hit < 500ms:
- Show **same splash** (consistency).
- Or: snapshot of last app state (iOS does this automatically).

## Route changes within app

Web / SPA / native apps: navigating between screens.

### Three transition patterns

| Pattern | Use |
| --- | --- |
| **Cross-fade** | Default for content-led transitions. 200ms opacity. Calm. |
| **Slide-in** | Native iOS pattern. New screen slides from right; old slides left. |
| **Hero / shared element** | Element from old screen "transforms" into element on new screen (Material's shared transitions). |

### Cross-fade (web default)

```css
.page-transition-enter {
  opacity: 0;
}
.page-transition-enter-active {
  opacity: 1;
  transition: opacity 200ms;
}
.page-transition-exit {
  opacity: 1;
}
.page-transition-exit-active {
  opacity: 0;
  transition: opacity 200ms;
}
```

For React Router with Framer Motion or React Transition Group: 5 lines.

For modern web: **View Transitions API** (browser-native, 2024+):

```js
document.startViewTransition(() => {
  // Update DOM
});
```

Browser handles the cross-fade. Cleanest path for modern Chrome / Edge / Safari.

### Slide-in (native pattern)

iOS native: `pushViewController` slides new screen from right. Back swipe slides it back.

For web: use Framer Motion `<AnimatePresence>` with `x` translation.

For React Native: `@react-navigation/native` handles it automatically.

### Shared element / hero transitions

Most sophisticated. Element from screen A morphs into element on screen B.

```
Screen A: [Card with image]
              ↓ tap
Screen B: [Image full-bleed, card details below]

The image element animates (FLIP technique) from card position → full-bleed
```

Tools:
- **Material You shared transitions** (Android native)
- **Framer Motion `layoutId`** (React)
- **View Transitions API** (web, with named transitions)
- **react-native-shared-element** (RN)

When to use:
- Photo gallery → detail view
- Card-grid → card-detail
- Logo persistence across pages

When to skip:
- Simple route changes (overkill)
- Rapid-tap navigation (animation can't keep up)

## Progressive content loading

Once app is rendered, content arrives async. Three patterns:

### 1. Skeleton coordination

Multiple skeletons load simultaneously. **Stagger the resolve** to avoid simultaneous flash:

```
Fetch 3 sections in parallel:
  - Header data: arrives at 200ms
  - Body data: arrives at 350ms
  - Footer data: arrives at 500ms

Don't replace each skeleton instantly. Coordinate:
  - At 500ms (when slowest is ready), reveal all three with 50ms stagger.
  - Total settle: 650ms with smooth orchestrated reveal.
```

Or simpler: replace each skeleton as data arrives. Less coordinated but faster to ship.

### 2. Pull-to-refresh

Mobile-native pattern. User pulls down → refresh indicator → data fetched → indicator hides.

| Phase | Behavior |
| --- | --- |
| Pull (1–80px) | List moves with finger |
| Past threshold (80px+) | Indicator appears |
| Release | List bounces back; indicator stays during fetch (typical 1–3s) |
| Done | Indicator fades; new content (if any) at top |

Cite [`knowledge/patterns/list-and-feed.md`](../patterns/list-and-feed.md).

### 3. Infinite scroll triggers

User scrolls near bottom → next page loads.

```
Scroll position 80% of total → trigger fetch
Spinner at bottom while loading
New items append (with 50ms entrance stagger)
```

Don't:
- Reset scroll on append.
- Auto-scroll to new items (user is reading something).

## Page state transitions

Beyond just loading: empty → loading → content → error states all need motion-aware transitions.

```
Empty state visible
  ↓ user adds item
  ↓ list animates with new item entering
Content visible
  ↓ user filters to nothing
  ↓ items fade out
Empty state slides in (filtered variant)
```

Each state-to-state transition is ~200ms. Cross-fade is the safe default.

## Korean fintech app launch convention

Korean fintech apps (Toss, KakaoBank) often have:
- **Solid brand color splash** — yellow (Kakao) / blue (Toss).
- **No logo animation** — stays clean.
- **Biometric gate** appears immediately on launch (Face ID / Fingerprint).
- **After auth**: cross-fade to dashboard.

Total cold launch experience: 1.5–3s. The biometric gate is the bulk; actual app load hides under it.

Cite [`examples/component-biometric-gate.md`](../../examples/component-biometric-gate.md).

## Reduced motion

For loading sequences:
- Splash: still show (brand recognition matters more than "no motion").
- Route transitions: instant cross-fade, no slide.
- Skeleton entrance: still show skeleton, but no shimmer animation.
- Hero / shared element: skip the morph, just instant layout change.

## Performance — perceived vs actual

| Strategy | Perceived speed |
| --- | --- |
| Show app chrome (header, nav) immediately, content later | Faster |
| Show skeleton matching final layout | Faster |
| Animate progress (even fake) | Feels active |
| Optimistic UI (act on click before server confirms) | Instant |
| Keep stale data visible during refresh | Faster |

vs:

| Strategy | Slower perceived speed |
| --- | --- |
| Blank screen during load | Slowest |
| Spinner with no context | Slow |
| Block all interaction until loaded | Slow |

## Code example — page transition wrapper (Framer Motion)

```tsx
import { motion, AnimatePresence } from "framer-motion";

function PageTransition({ children, route }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={route}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

## Don't

- Don't show looping spinner on splash. Brand-led is calmer.
- Don't animate route changes longer than 300ms.
- Don't transition every state change with motion. Only meaningful ones.
- Don't auto-replay splash on every cold launch — user has seen it.
- Don't ignore `prefers-reduced-motion` in transitions.
- Don't block interactivity during transitions (button clicks during fade should still work).

## Cross-reference

- [`knowledge/motion/principles.md`](principles.md) — duration / easing fundamentals
- [`knowledge/motion/marketing-motion.md`](marketing-motion.md) — hero entrances
- [`knowledge/motion/choreography-depth.md`](choreography-depth.md) — multi-element coordination
- [`knowledge/motion/motion-tools.md`](motion-tools.md) — tool comparison
- [`knowledge/patterns/list-and-feed.md`](../patterns/list-and-feed.md) — pull-to-refresh + infinite scroll
- [`examples/component-biometric-gate.md`](../../examples/component-biometric-gate.md) — Korean launch gate
