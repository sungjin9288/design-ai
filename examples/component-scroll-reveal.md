<!-- hand-written -->
# `ScrollReveal` (custom — viewport-triggered animation primitive) — spec

> Animates a child element into view when it enters the viewport. One-shot by default. Used heavily in marketing pages and feature grids; restraint required in product UI. Pairs with [`knowledge/motion/marketing-motion.md`](../knowledge/motion/marketing-motion.md).

## Purpose

- Reveal sections / cards / images as user scrolls them into view.
- One-shot per element (no replaying on every scroll up/down).
- Reduced-motion safe (instantly visible).
- Compose with stagger for parent → children sequences.

Without this: every team hand-rolls IntersectionObserver wrappers and gets the threshold / once-only / reduced-motion logic subtly wrong.

## Anatomy

```
[viewport edge]
─────────────────────────────────
                                       ← ScrollReveal child sits below fold
                                          (opacity 0, translateY +16px)

  ↓ user scrolls; element crosses 80% threshold

[viewport edge]
─────────────────────────────────
[ScrollReveal child]                   ← animates into place
                                          (200ms fade + translateY → 0)
```

## API

```tsx
<ScrollReveal>
  <FeatureCard title="..." />
</ScrollReveal>

// With stagger across siblings:
<ScrollReveal staggerChildren={60}>
  <FeatureCard title="A" />
  <FeatureCard title="B" />
  <FeatureCard title="C" />
</ScrollReveal>

// Custom motion:
<ScrollReveal effect="fade-up" delay={100} duration={300}>
  <Hero />
</ScrollReveal>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `effect` | `"fade" \| "fade-up" \| "fade-in-blur" \| "scale-in"` | `"fade-up"` | Entrance style |
| `threshold` | `number` | `0.2` | IntersectionObserver threshold (0–1) |
| `rootMargin` | `string` | `"0px 0px -10% 0px"` | IO margin (negative bottom = trigger before bottom edge) |
| `once` | `boolean` | `true` | Trigger only on first intersection |
| `delay` | `number` | `0` | Ms before animation starts after threshold crossed |
| `duration` | `number` | `200` | Ms |
| `easing` | `string` | `"var(--ease-out)"` | CSS easing |
| `staggerChildren` | `number` | `0` | Ms between sibling reveals (only on direct children) |
| `disabled` | `boolean` | auto via `prefers-reduced-motion` | Skip animation; show instantly |
| `as` | `keyof JSX.IntrinsicElements` | `"div"` | Wrapper element |
| `onReveal` | `() => void` | — | Fires when reveal starts |

## Effects

### `fade-up` (default)

Most common. Element rises 16px and fades in.

```css
[data-reveal][data-state="hidden"] {
  opacity: 0;
  transform: translateY(16px);
}
[data-reveal][data-state="visible"] {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 200ms var(--ease-out), transform 200ms var(--ease-out);
}
```

### `fade`

Pure opacity. Used when motion would compete with surrounding context (e.g., dense data tables).

### `fade-in-blur`

Adds `filter: blur(4px) → blur(0)`. Premium / brand feel; expensive on mobile (avoid on long lists).

### `scale-in`

`transform: scale(0.95) → scale(1)` + opacity. Used for hero illustrations, feature cards.

## States

| State | data-state | Visual |
| --- | --- | --- |
| Hidden (not yet intersected) | `hidden` | Pre-animation transform applied; opacity 0 |
| Revealing (intersected; transition in flight) | `revealing` | Animating to visible |
| Visible | `visible` | Final state; transitions removed |
| Reduced motion / disabled | `visible` | Instant final state, no transition |

## Tokens consumed

```
--motion-medium         (200ms default)
--ease-out
--space-md              (16px translate distance for fade-up)
```

## Stagger behavior

When `staggerChildren` is set, ScrollReveal applies a CSS variable `--reveal-delay` to each direct child based on its index:

```tsx
<ScrollReveal staggerChildren={60}>
  {/* index 0: delay 0ms */}
  {/* index 1: delay 60ms */}
  {/* index 2: delay 120ms */}
</ScrollReveal>
```

Cap stagger at 5 children. Beyond that:
- Total delay > 300ms feels glacial.
- Use a single reveal for the whole group, or paginate the reveal.

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  [data-reveal] {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

The element is **always visible** in reduced-motion mode. Don't hide it — that breaks layout for users who never see the animation trigger.

## Implementation

```tsx
import { useEffect, useRef, useState, Children, cloneElement } from "react";

function ScrollReveal({
  children,
  effect = "fade-up",
  threshold = 0.2,
  rootMargin = "0px 0px -10% 0px",
  once = true,
  delay = 0,
  duration = 200,
  staggerChildren = 0,
  as: Tag = "div",
  onReveal,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || !ref.current) {
      setRevealed(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          onReveal?.();
          if (once) obs.disconnect();
        } else if (!once) {
          setRevealed(false);
        }
      },
      { threshold, rootMargin }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [reduced, threshold, rootMargin, once, onReveal]);

  const state = revealed ? "visible" : "hidden";

  return (
    <Tag
      ref={ref}
      data-reveal={effect}
      data-state={state}
      style={{
        "--reveal-duration": `${duration}ms`,
        "--reveal-delay": `${delay}ms`,
      } as React.CSSProperties}
    >
      {staggerChildren > 0
        ? Children.map(children, (child, i) =>
            cloneElement(child as React.ReactElement, {
              style: {
                ...(child as any).props?.style,
                "--reveal-delay": `${delay + i * staggerChildren}ms`,
                transitionDelay: revealed ? `${delay + i * staggerChildren}ms` : "0ms",
              },
            })
          )
        : children}
    </Tag>
  );
}
```

CSS:

```css
[data-reveal] {
  transition-property: opacity, transform, filter;
  transition-duration: var(--reveal-duration, 200ms);
  transition-timing-function: var(--ease-out);
  transition-delay: var(--reveal-delay, 0ms);
}

[data-reveal="fade-up"][data-state="hidden"] {
  opacity: 0;
  transform: translateY(16px);
}
[data-reveal="fade"][data-state="hidden"] { opacity: 0; }
[data-reveal="fade-in-blur"][data-state="hidden"] {
  opacity: 0;
  filter: blur(4px);
}
[data-reveal="scale-in"][data-state="hidden"] {
  opacity: 0;
  transform: scale(0.95);
}

[data-reveal][data-state="visible"] {
  opacity: 1;
  transform: none;
  filter: none;
}

@media (prefers-reduced-motion: reduce) {
  [data-reveal] {
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
    transition: none !important;
  }
}
```

## Where to use vs not

### Good fits

- Marketing landing-page sections (hero next, features, testimonials, CTA).
- Long-scroll storytelling / case-study pages.
- Pricing tier reveal as user scrolls.
- Feature grid / icon row entrances.

### Bad fits

- Data tables / dense product UIs (motion competes with reading).
- Above-the-fold content (no scroll happens; element flashes in).
- Lists with > 20 items (cumulative motion fatigue; use simple fade-in or none).
- Critical content (CTAs, errors, prices) — never gate on intersection.

## Korean market note

Korean B2C landing pages often skip ScrollReveal entirely and lean denser, faster-loading static content. Toss-style minimal sites use it sparingly. Naver-style dense pages don't use it. Use restraint — over-revealed sections read as foreign / over-designed in Korean context.

## Accessibility

- Element is in DOM and accessible to screen readers regardless of visual state. SR users see "hidden" only as a visual.
- Don't use `display: none` or `visibility: hidden` for hidden state — those remove from a11y tree.
- `prefers-reduced-motion`: enforced via the CSS media query. ScrollReveal becomes a no-op.
- For decorative reveals (purely visual), leave the wrapper without role.
- For meaningful content (e.g., a stat or testimonial): the wrapper should pass through ARIA from children.

## Edge cases

- **Element taller than viewport**: with default `threshold: 0.2`, element triggers when 20% visible. For very tall sections, lower to `0.05`.
- **Element starts inside viewport on page load**: IntersectionObserver fires immediately on observe; element reveals on first frame. Fine.
- **User opens page already scrolled (deep link to mid-page)**: IO fires on already-visible elements; reveals trigger correctly.
- **Element wrapped in conditional rendering**: ensure ref is stable; use `key` on parent if remounting.
- **Multiple ScrollReveal nested**: each operates independently. Avoid > 2 levels of nesting (motion fatigue).
- **`once: false` + rapid scroll up/down**: element re-animates each time. Annoying. Default to `once: true` always.

## Performance

- IntersectionObserver is cheap (passive). 100+ instances per page is fine.
- `transform` and `opacity` are GPU-composited. Don't extend to `width`/`height`.
- `filter: blur()` (fade-in-blur) is expensive on low-end mobile. Avoid on lists.
- Stagger across many children: prefer CSS-driven (set delay per child) over JS-driven setTimeout chains.

## Don't

- Don't trigger ScrollReveal on every scroll direction. Default `once: true` for sanity.
- Don't reveal critical content on scroll — error messages, prices, CTAs must be present immediately.
- Don't use heavy effects (blur, large translate) on > 5 items in a row.
- Don't nest ScrollReveal inside ScrollReveal — coordination breaks.
- Don't skip reduced-motion handling — vestibular triggers are real for some users.
- Don't use ScrollReveal in product UI just because marketing uses it — different motion language.

## References

Patterns drawn from:
- AOS (Animate On Scroll) library
- Framer Motion `whileInView` API
- View Timeline API (CSS scroll-driven animations, modern web)

For 2025+: explore CSS-only via `animation-timeline: view()` — ScrollReveal becomes purely CSS in Chrome / Edge. Keep JS implementation as fallback.

## Cross-reference

- [`knowledge/motion/marketing-motion.md`](../knowledge/motion/marketing-motion.md) — when scroll-triggered reveals fit
- [`knowledge/motion/choreography-depth.md`](../knowledge/motion/choreography-depth.md) — stagger formulas
- [`knowledge/motion/principles.md`](../knowledge/motion/principles.md) — duration / easing tokens
- [`examples/component-feature-grid.md`](component-feature-grid.md) — common ScrollReveal wrapper
- [`examples/component-page-transition.md`](component-page-transition.md) — route-level transitions (different concern)
