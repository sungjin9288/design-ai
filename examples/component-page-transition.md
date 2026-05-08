<!-- hand-written -->
# `PageTransition` (custom — route-level animation wrapper) — spec

> Wraps the route outlet of an SPA to animate transitions between pages. One component handles cross-fade, slide-in, and shared-element variants. Pairs with [`knowledge/motion/app-loading-sequences.md`](../knowledge/motion/app-loading-sequences.md) and [`knowledge/motion/choreography-depth.md`](../knowledge/motion/choreography-depth.md).

## Purpose

- Smooth transitions between routes without per-page boilerplate.
- One opinion per app (cross-fade vs slide vs hero), not per-screen ad-hoc choices.
- Reduced-motion safe.
- Compatible with React Router, TanStack Router, Next.js App Router.

Without this: route change is an instant DOM swap. Reads as a page reload, breaks spatial sense.

## Anatomy

```
<RootLayout>
  <Header />
  <PageTransition variant="fade">
    {/* current route */}
    <Outlet />
  </PageTransition>
  <Footer />
</RootLayout>
```

Or for slide-style native iOS feel:

```
<PageTransition variant="slide" direction={navDirection}>
  <Outlet />
</PageTransition>
```

## API

```tsx
<PageTransition
  variant="fade"          // "fade" | "slide" | "hero"
  routeKey={pathname}     // change → trigger transition
  direction="forward"     // for slide variant
  duration={200}
  reducedMotionFallback="instant"  // "instant" | "fade-only"
>
  {children}
</PageTransition>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `"fade" \| "slide" \| "hero"` | `"fade"` | Transition style |
| `routeKey` | `string` | — | Unique key per route (typically pathname); change = transition |
| `direction` | `"forward" \| "back"` | `"forward"` | Slide direction (slide variant only) |
| `duration` | `number` | `200` | Ms; capped at 300 even if higher passed |
| `easing` | `string` | `"ease-out"` | CSS easing (typically `var(--ease-out)`) |
| `reducedMotionFallback` | `"instant" \| "fade-only"` | `"fade-only"` | What to do when user prefers reduced motion |
| `onTransitionEnd` | `() => void` | — | Fires after exit + enter complete |
| `children` | `ReactNode` | — | Current route content |

## Variants

### `fade` (default)

200ms cross-fade. Calm, content-led. Default for content apps (docs, dashboards, forms).

```css
.page--enter { opacity: 0; transform: translateY(8px); }
.page--enter-active { opacity: 1; transform: translateY(0); transition: 200ms ease-out; }
.page--exit { opacity: 1; }
.page--exit-active { opacity: 0; transition: 150ms ease-out; }
```

### `slide` (native iOS feel)

New page slides in from right (forward) or left (back). Old page slides off the opposite side.

```
forward:    [old]────► offscreen left   [new]◄──── from right
back:       [old]────► offscreen right  [new]◄──── from left
```

For slide direction tracking, expose it via router state (e.g. `useNavigationDirection()` hook returning `"forward" | "back"`).

### `hero` (shared element)

Uses View Transitions API or Framer Motion `layoutId`. An element on outgoing page morphs into an element on incoming page.

```tsx
// On screen A:
<motion.img layoutId="user-avatar-42" src={avatar} />

// On screen B (detail view):
<motion.img layoutId="user-avatar-42" src={avatar} />
// Same id = morph between positions
```

For browser-native (Chrome / Edge / Safari TP):

```css
.user-avatar { view-transition-name: user-avatar-42; }
```

```js
document.startViewTransition(() => {
  navigate("/users/42");
});
```

## States

| State | Visual |
| --- | --- |
| `idle` | Current route fully visible |
| `exiting` | Outgoing page transitioning out (opacity fade or x-translate) |
| `entering` | Incoming page transitioning in |
| `done` | New route fully visible; `onTransitionEnd` fires |

`exiting` and `entering` overlap during cross-fade; for slide they sequence.

## Tokens consumed

```
--motion-fast      (150ms exit)
--motion-medium    (200ms enter)
--motion-slow      (300ms slide)
--ease-out         (default)
--ease-in-out      (slide)
--space-sm         (translate-Y for fade)
```

## Behavior rules

- **Don't transition on initial mount** — first render is not a navigation. Watch for `routeKey` change after mount only.
- **Don't transition between hash changes** on same path (`/page#a` → `/page#b`).
- **Cancel previous transition** if route changes mid-transition (rapid back-tap during animation). Snap to new route.
- **Maintain scroll position**: page-transition wrapper does NOT manage scroll; router does. But the wrapper must not interfere (e.g., `overflow: hidden` on root breaks scroll-restoration).

## Reduced motion

```tsx
const reduced = useReducedMotion();
const effectiveVariant = reduced
  ? (reducedMotionFallback === "instant" ? null : "fade")
  : variant;
```

| Setting | Behavior |
| --- | --- |
| `instant` | No transition; instant DOM swap |
| `fade-only` (default) | Cross-fade at duration 100ms regardless of variant; no translate / slide |

Slide and hero variants both downgrade to fade-only — translation triggers vestibular issues.

## Implementation — Framer Motion

```tsx
import { AnimatePresence, motion } from "framer-motion";

function PageTransition({ children, routeKey, variant = "fade", duration = 200 }: Props) {
  const reduced = useReducedMotion();

  const variants = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : variantsByName[variant];

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{ duration: duration / 1000, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

const variantsByName = {
  fade: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  slide: {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  },
  // hero handled via layoutId on individual elements; this wrapper just cross-fades the rest
  hero: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
};
```

## Implementation — View Transitions API (modern web)

```tsx
function PageTransition({ children, routeKey }: Props) {
  const previousKey = useRef(routeKey);

  useLayoutEffect(() => {
    if (previousKey.current === routeKey) return;
    if (!document.startViewTransition) {
      previousKey.current = routeKey;
      return;
    }
    document.startViewTransition(() => {
      previousKey.current = routeKey;
      // React already updated; this just signals the browser to capture before/after
    });
  }, [routeKey]);

  return <>{children}</>;
}
```

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 200ms;
  animation-timing-function: var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
  }
}
```

## Korean app convention

- **Mobile webview / hybrid app**: prefer `slide` variant — matches native iOS / Android feel users expect from Toss / KakaoBank.
- **Desktop web (toss.im, naver.com)**: `fade` is standard.
- **Marketing landing pages**: skip PageTransition entirely; full reload feel is fine.

## Accessibility

- `aria-live="polite"` on the page region so screen readers announce route change. (Don't use `assertive`; that interrupts.)
- After transition: focus moves to `<h1>` of new page (router-level concern, not PageTransition's).
- `prefers-reduced-motion`: enforce via the variant downgrade above.
- For long transitions (>250ms), risk of focus loss; keep transitions short.

## Edge cases

- **Modal-on-route**: don't apply page transition when the route change is just opening a modal (use `<Outlet />` only on actual page changes; modals stack above).
- **Tab-style navigation**: tabs that swap content within the same route should NOT trigger PageTransition. Use a separate `<Tabs>` animation.
- **Programmatic navigation during transition**: cancel current transition; new one wins. Framer Motion's `mode="wait"` handles this.
- **Server-rendered first paint**: first hydration must not trigger transition. Use `initial={false}` (Framer Motion) or check `previousKey.current` (View Transitions).
- **Memory of scroll position**: each route should restore its scroll. PageTransition itself doesn't scroll; do this via router scroll-restoration.

## Don't

- Don't use slide variant on desktop wide screens — large translation feels heavy.
- Don't transition every route — landing → app, login → dashboard, payment success — sometimes reset feels right.
- Don't apply PageTransition twice (e.g., wrapping both layout + page). Pick one level.
- Don't run more than 300ms — feels slow on rapid-tap navigation.
- Don't animate `width`/`height` of the wrapper — causes layout thrash.

## References

Patterns drawn from:
- React Router v6 + Framer Motion AnimatePresence patterns
- Next.js 14 App Router + View Transitions API
- React Native Stack Navigator transition presets

## Cross-reference

- [`knowledge/motion/app-loading-sequences.md`](../knowledge/motion/app-loading-sequences.md) — when to use which variant
- [`knowledge/motion/choreography-depth.md`](../knowledge/motion/choreography-depth.md) — shared-element / hero patterns
- [`knowledge/motion/principles.md`](../knowledge/motion/principles.md) — duration tiers
- [`examples/component-loading-sequence.md`](component-loading-sequence.md) — splash before first route
- [`examples/component-scroll-reveal.md`](component-scroll-reveal.md) — within-page motion
