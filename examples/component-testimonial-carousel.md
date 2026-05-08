# `TestimonialCarousel` — spec

> Marketing primitive. Rotates customer testimonials. Most-skipped section on landing pages — get it right or skip it entirely.

## Purpose

Display customer quotes / case studies / reviews. Used as social proof between feature display and pricing.

## When TestimonialCarousel vs static testimonials

| Pattern | Use |
| --- | --- |
| **Carousel** | Many testimonials (5+); horizontal screen real estate matters |
| **Static 3-up grid** | 3 strong testimonials; landing page already short |
| **No testimonials** | < 3 strong quotes, or audience won't care (developer tools rarely care about user testimonials) |

If you can't find 3 strong testimonials, **don't fake it**. Skip the section.

## Anatomy

```
┌────────────────────────────────────────────────────────────┐
│ Section title (optional)                                    │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ★★★★★                                                   │ │
│ │                                                          │ │
│ │ "은행 앱을 30번씩 보지 않아도 되니 너무 편해요.            │ │
│ │  처음엔 이게 정말 자동으로 분류될까 의심했는데              │ │
│ │  3주 쓰니 90% 이상 맞춰주네요."                          │ │
│ │                                                          │ │
│ │ ┌──┐ 김민지 · 마케터                                      │ │
│ │ └──┘ 사용 6개월                                           │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ●  ○  ○  ○  ○                                              │
└────────────────────────────────────────────────────────────┘
```

## API

```tsx
<TestimonialCarousel
  title="실제 사용자 후기"
  testimonials={[
    {
      quote: "은행 앱을 30번씩 보지 않아도 되니 너무 편해요.",
      authorName: "김민지",
      authorRole: "마케터",
      authorPhotoUrl: "/users/minji.jpg",
      authorBadge: "사용 6개월",
      rating: 5,
    },
    // ...
  ]}
  variant="single-large"
  autoplay={false}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Section heading |
| `testimonials` | `Testimonial[]` | — | Array of quotes |
| `variant` | `"single-large" \| "3-up-grid" \| "auto-scroll"` | `"single-large"` | Display layout |
| `autoplay` | `boolean` | `false` | (Default off — see deck-design rules) |
| `autoplayInterval` | `number` | `8000` | ms |
| `showNavigation` | `boolean` | `true` | Arrows + dots |
| `showRating` | `boolean` | `true` | Stars per testimonial |

```ts
type Testimonial = {
  quote: string;
  authorName: string;
  authorRole?: string;
  authorPhotoUrl?: string;
  authorBadge?: string;       // "사용 6개월", "Pro 회원"
  rating?: 1 | 2 | 3 | 4 | 5;
  source?: string;             // "App Store 리뷰" / "사용자 인터뷰"
};
```

## Variants

### `single-large` (default)

One testimonial visible at a time, large. Carousel moves to next on click / swipe.

```
"Quote text — large, focal."
— Author photo + name + role
```

Best for **hero quotes** that deserve full attention.

### `3-up-grid` (no carousel)

Three testimonials in a row. No rotation. Static.

Better when you want all 3 testimonials seen without interaction.

### `auto-scroll`

Continuous horizontal scroll (right-to-left), slow speed (~30 px/sec). Mimics infinite-marquee. Used for "logo wall" feel — many short quotes scrolling past.

Pause on hover. Respect `prefers-reduced-motion`.

## Quote rules

| Rule | Why |
| --- | --- |
| **Quote real customers**, with their permission. | Legal + trust. |
| **Use full names** (or initials with permission). | "JS, Seoul" reads as fake. |
| **Photos help** — match to name. | Real-people photos > stock photos. |
| **Specific quote** beats generic. | "Saves 4 hours / week" > "Great product!" |
| **Edit minimally** — typos OK to fix. | Don't reword to fit your marketing voice. |
| **Date or duration** matters. | "Used for 6 months" > undated. |

## Korean testimonial conventions

- Author name: 한국 이름 + 직책. "김민지 · 마케터".
- Photo: optional, but commonly included.
- Voice: ~해요 (casual) is most common in consumer testimonials. Don't overly formalize.
- "★★★★★ + 평점 4.8" — pair with overall rating if available.
- Source: "App Store 리뷰", "사용자 인터뷰", "Twitter" — adds legitimacy.

## States

| State | Visual |
| --- | --- |
| Default | One quote visible (single-large) |
| Auto-pause on hover | All variants |
| Reduced motion | Auto-scroll → static; auto-play → off |
| Loading | Skeleton matching quote shape |
| No testimonials | Render nothing (don't show empty section) |

## Tokens consumed

```
--color-bg-default
--color-bg-subtle          (alternate row in grid)
--color-text-primary        (quote text)
--color-text-secondary      (author name + role)
--color-text-tertiary       (date, source)
--color-warning             (star rating)
--space-lg, --space-xl
--radius-lg
--font-size-lg, --font-size-xl  (quote text — larger than body)
--font-weight-medium
--motion-default
```

## Sizes

| Element | Mobile | Desktop |
| --- | --- | --- |
| Quote font | 18px | 24–28px |
| Author name | 14px | 16px |
| Avatar | 40px | 48–56px |

## Accessibility

- Wrap in `<section>` with `<h2>` for section title.
- Each testimonial: `<blockquote>` with `<cite>` for attribution.
- Stars: `aria-label="평점 4점 / 5점"` (don't read each star separately).
- Carousel arrows: `aria-label="다음" / "이전"`.
- Auto-play: provide pause button (WCAG 2.2.2).
- For dot indicators: `aria-label="2 / 5번째"`.

## Code example

```tsx
<TestimonialCarousel
  title="실제 사용자 후기"
  testimonials={[
    {
      quote: "은행 앱을 30번씩 보지 않아도 되니 너무 편해요. 처음엔 이게 정말 자동으로 분류될까 의심했는데 3주 쓰니 90% 이상 맞춰주네요.",
      authorName: "김민지",
      authorRole: "마케터",
      authorPhotoUrl: "/users/minji.jpg",
      authorBadge: "사용 6개월",
      rating: 5,
      source: "App Store 리뷰",
    },
    {
      quote: "월급 받는 날 자동으로 적금에 옮겨주는 자동이체 룰이 신기해요.",
      authorName: "박지훈",
      authorRole: "개발자",
      authorPhotoUrl: "/users/jihoon.jpg",
      authorBadge: "사용 1년",
      rating: 5,
    },
    // ...
  ]}
  variant="single-large"
/>
```

## Don't

- Don't fabricate testimonials.
- Don't auto-play without pause control (WCAG fail).
- Don't use stock-photo "models" — readers spot it.
- Don't put 5-paragraph quotes in a carousel — readers won't read.
- Don't omit names — "Anonymous user" is suspicious.
- Don't mix testimonial format (some with stars, some without) — pick one.

## References

No upstream component is exactly this. Each marketing builder (Webflow, Framer) has variants.

## Cross-reference

- [`examples/component-carousel.md`](component-carousel.md) — base Carousel pattern
- [`examples/component-hero-block.md`](component-hero-block.md) — comes before
- [`examples/component-feature-grid.md`](component-feature-grid.md) — comes between
- [`examples/component-pricing-cards.md`](component-pricing-cards.md) — comes after
- [`knowledge/patterns/landing-page-patterns.md`](../knowledge/patterns/landing-page-patterns.md)
