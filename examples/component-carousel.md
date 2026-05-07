# `Carousel` — spec

> Citing Ant Design `Carousel`, MUI (no built-in — composition), shadcn-ui `carousel` (Embla)

## Purpose

A horizontally rotating sequence of items. Used for: hero banners (marketing), product image galleries, onboarding screens, content highlights.

## When NOT to use a carousel

This is the most-misused component on the web. Before reaching for a carousel, ask:
- **"Will users actually scroll past slide 1?"** — Most don't. Average click-through on slide 2+ is < 5%.
- **"Is the content equally important?"** — If slide 1 is the priority, kill the carousel; commit to one hero.
- **"Is this auto-playing?"** — Auto-play hurts a11y, distracts users, and is widely disliked.

Use a carousel when:
- It's a genuine gallery (e.g., product photos — user expects multiple).
- Content is browsable (testimonials, news highlights — equally weighted).
- Touch swipe is the intended interaction model (mobile native pattern).

Don't use for:
- Hero banner where one message is the goal (use a single hero).
- Long-form content (use a list or scroll).
- Critical conversion elements (most users miss them past slide 1).

## Anatomy

```
       ◀  ┌──────────────────────────────────────┐  ▶
          │                                       │
          │           Slide 1 of 4                │
          │                                       │
          │                                       │
          └──────────────────────────────────────┘
                ●  ○  ○  ○      ← dot indicators
```

| Slot | Required | Notes |
| --- | --- | --- |
| Slide content | yes | The items |
| Previous arrow | usually (desktop) | Hidden on mobile (rely on swipe) |
| Next arrow | usually (desktop) | |
| Indicators (dots / numbers / thumbs) | yes for > 1 slide | Shows position + count |
| Auto-play controls | only if auto-playing | Pause/play button required |

## API

```tsx
<Carousel
  autoplay={false}
  loop
  showArrows
  showDots
  onSlideChange={setActive}
>
  <Carousel.Slide>{slide1}</Carousel.Slide>
  <Carousel.Slide>{slide2}</Carousel.Slide>
  <Carousel.Slide>{slide3}</Carousel.Slide>
</Carousel>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `autoplay` | `boolean` | `false` | Auto-advance |
| `autoplayInterval` | `number` | `5000` | ms between slides |
| `loop` | `boolean` | `true` | Wrap from last to first |
| `showArrows` | `boolean` | `true` (desktop) / `false` (mobile) | Prev/next buttons |
| `showDots` | `boolean` | `true` | Dot indicators |
| `dotsPosition` | `"bottom" \| "top" \| "side"` | `"bottom"` | |
| `slidesPerView` | `number` | `1` | Multi-slide view (e.g., 3 product cards visible) |
| `slidesPerScroll` | `number` | `1` | How many to advance per click |
| `gap` | `number` | `0` | Space between slides (when slidesPerView > 1) |
| `swipeable` | `boolean` | `true` (touch) | Touch/drag swipe |
| `effect` | `"slide" \| "fade"` | `"slide"` | Transition |
| `value` | `number` | — | Controlled active index |
| `onSlideChange` | `(index) => void` | — | |

## Behavior

### Navigation

- **Arrows** (desktop): click to advance one slide.
- **Dots**: click any dot to jump to that slide.
- **Swipe** (touch): horizontal swipe past 50% of slide width advances.
- **Keyboard**: `←` / `→` when carousel is focused.
- **Auto-play** (if enabled): advances every `autoplayInterval` ms; pauses on hover or focus inside; resumes on leave.

### Loop vs no loop

- `loop: true`: clicking next on last slide goes to first; previous on first goes to last.
- `loop: false`: arrows disabled at boundary. Last slide visually marks "end".

### Multi-slide view

For browse-style carousels (product cards):

```
slidesPerView: 3
[card 1] [card 2] [card 3] [card 4 (off-screen)] [card 5 (off-screen)]
```

Click next: scrolls by `slidesPerScroll` (often 1 for incremental browsing, full = slidesPerView for "page" navigation).

## Sizes

Carousel container takes its parent's dimensions. The slide aspect ratio depends on content:

| Use | Aspect ratio (desktop) |
| --- | --- |
| Hero banner | 16:9 or 21:9 wide |
| Product gallery | 1:1 (square) |
| Testimonial cards | 4:3 or 5:3 |
| Mobile portrait | 4:5 or 9:16 |

For responsive: `aspect-ratio: 16 / 9` and `width: 100%` lets it scale.

## States

| State | Visual |
| --- | --- |
| Settled | Slide visible, indicator highlighted |
| Sliding | 250–400ms transition (slide or fade) |
| Auto-advance pause | When user hovers, focuses, or `prefers-reduced-motion` is set |
| Loading slides (lazy) | Skeleton in slide area until image loads |

## Tokens consumed

```
--color-bg-default
--color-text-primary
--color-text-on-image          (text overlay on image carousels)
--color-bg-overlay              (subtle overlay for text legibility)
--color-primary-default         (active dot)
--color-text-tertiary           (inactive dots)
--space-md
--radius-md, --radius-lg        (rounded slide corners)
--motion-default, --motion-slow  (slide transitions)
--easing-out
```

## Accessibility — high stakes

Carousels are notorious for a11y problems. Get these right.

### ARIA

- `role="region" aria-roledescription="carousel" aria-label="..."` on the container.
- Each slide: `role="group" aria-roledescription="slide" aria-label="Slide N of M"`.
- Hidden slides should have `aria-hidden="true"` and `tabindex="-1"` on focusable elements (so tab doesn't reach off-screen content).
- Live region: `aria-live="polite"` on the slide container — but only when **not auto-playing** (auto-play would chatter). Set `aria-live="off"` while auto-playing.

### Auto-play

- **Don't auto-play by default**. WCAG 2.2.2 requires controls for moving content > 5 seconds.
- If auto-playing: provide visible Pause/Play button.
- Pause on hover, focus, and **`prefers-reduced-motion`** — these are not optional.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reach carousel (arrows + dots are tab stops) |
| `←` / `→` | Move slide (when carousel is focused) |
| Inside slide: `Tab` reaches links/buttons in the visible slide only |

### Touch

Swipe is a touch convention. For accessibility, ensure arrows are visible OR a clear alternative exists.

## Code example

```tsx
// Hero banner (no auto-play, single slide visible)
<Carousel showArrows showDots loop>
  {banners.map(banner => (
    <Carousel.Slide key={banner.id}>
      <BannerSlide banner={banner} />
    </Carousel.Slide>
  ))}
</Carousel>

// Product gallery (multi-slide, no auto-play, no loop)
<Carousel
  slidesPerView={4}
  slidesPerScroll={1}
  gap={16}
  loop={false}
  showArrows
  showDots={false}
>
  {products.map(product => (
    <Carousel.Slide key={product.id}>
      <ProductCard product={product} />
    </Carousel.Slide>
  ))}
</Carousel>

// Testimonials with auto-play (carefully)
<Carousel
  autoplay
  autoplayInterval={6000}
  loop
  showDots
  showArrows
  effect="fade"
>
  {testimonials.map(t => (
    <Carousel.Slide key={t.id}>
      <TestimonialCard testimonial={t} />
    </Carousel.Slide>
  ))}
</Carousel>

// Image gallery on a product detail page
<Carousel slidesPerView={1} loop showDots>
  {product.images.map(img => (
    <Carousel.Slide key={img.id}>
      <Image src={img.url} alt={img.alt} />
    </Carousel.Slide>
  ))}
</Carousel>
```

## Mobile-specific behaviors

- Arrows hidden by default (rely on swipe).
- Dots smaller (4–6px).
- Snap to slide (`scroll-snap-type: x mandatory`).
- Don't auto-play on mobile — wastes battery, reduces user agency.

## Edge cases

- **Single slide**: don't render arrows/dots. Just the slide.
- **Loading slides** (async): render skeleton until image loads. Don't block carousel rendering.
- **Different slide heights**: cap with `align-items: center` or set fixed height. Inconsistent heights cause carousel to "jump".
- **Long text in slides** (testimonials): cap height and add `overflow: scroll` per slide if needed.
- **Auto-play with focus inside**: pause until focus leaves.
- **RTL**: arrow icons flip; swipe direction inverts.
- **No JS / SSR**: render as a horizontal scroll list with snap points. Carousel chrome is enhancement.

## Don't

- Don't auto-play by default.
- Don't use carousel for primary CTAs (most users miss slide 2+).
- Don't combine fade and slide effects in the same carousel.
- Don't show 3+ rows of carousels on one page (visual chaos).
- Don't disable the user's swipe direction (force them to use arrows). Touch users expect swipe.
- Don't make dots invisible on dark slides — ensure 3:1 contrast.
- Don't put videos in auto-playing carousels — accessibility nightmare.

## References

- Ant Design: [`refs/ant-design/components/carousel/`](../refs/ant-design/components/carousel/) — `Carousel`. Wraps `react-slick`. Has `autoplay`, `dots`, `effect`. Solid baseline.
- MUI: no dedicated component. Use `react-slick` or `swiper`.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/carousel.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/carousel.tsx) — wraps **Embla** carousel. Modern, framework-agnostic, excellent accessibility. **Default for new projects.**

API choices made:
- **`autoplay: false` default**: matches a11y best practice. Most carousels don't need it.
- **`slidesPerView` exposed**: covers product gallery use case without separate component.
- **`effect`**: fade for hero (each slide is the message), slide for sequential browsing.

## Cross-reference

- [`knowledge/motion/principles.md`](../knowledge/motion/principles.md) — auto-play + reduced motion
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md) — carousel keyboard contract
- [WAI-ARIA Carousel Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
