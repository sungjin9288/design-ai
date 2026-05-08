<!-- hand-written -->
---
title: Landing hero design (variants and rationale)
applies_to: [landing, marketing, hero]
---

# Landing hero design

The hero is the first thing visitors see. It's the most-iterated section on any product website and the highest-leverage design surface. This file covers variants, rationale, and decision rules.

For the component spec: [`examples/component-hero-block.md`](../../examples/component-hero-block.md). This file covers **strategy** — which variant to pick, what to put in the headline, when to use video.

## What the hero must do

In 5 seconds, a visitor must understand:
1. **What the product does** (in their words)
2. **Why it matters** (problem solved)
3. **What to do next** (one obvious CTA)

Failure to communicate any of these = bounce.

## Six hero archetypes

### 1. Text-led hero (default)

```
Headline (large)
Sub-headline
[CTA] [Secondary]

[Hero visual on right or below]
```

When: most products. Easy to A/B test. Headline carries the message.

Pros: fast to load, accessible, testable.
Cons: less "wow factor" for brand-led products.

### 2. Visual-led hero

```
[Large product screenshot / mockup]

Caption underneath
[CTA]
```

When: product is visual (design tool, photo app, dashboard product). User needs to "see" it to understand.

Pros: shows the product immediately.
Cons: harder for accessibility (alt text only); larger file → slower load.

### 3. Video hero

```
[Background video — autoplay, muted, looped]
Overlay headline + CTA
```

When: product is dynamic (productivity tool with motion, communication app, anything that "comes alive" in motion).

Pros: high engagement when right.
Cons: bandwidth, accessibility, mobile battery drain. Many users hate auto-play.

### 4. Split-screen / 50-50

```
[Text / CTA]    |    [Visual]
```

When: balanced messaging — product is visual but you also have a strong tagline.

### 5. Single-message brutalist

```
                  Big headline.
                  That's it.

                  [CTA]
```

Centered, minimal. Famous for: Stripe, Linear, Vercel.

Pros: confident, brand-led.
Cons: doesn't differentiate (lots of products use this now).

### 6. Storyteller hero

```
Quote from a customer (large)
"Headline"
— Author

[CTA]
```

When: testimonial-driven, social-proof central to the brand.

Pros: trust on first impression.
Cons: depends on having a great quote. Most don't.

## Headline construction

### The "what + how" formula

```
[What the product does], [how it differs].
```

Examples:
- "가계부, 자동으로 채워줘요. 30개 은행 자동 연동."
- "Slack, but for designers. Real-time canvas."
- "Code reviews in 30 seconds. Powered by AI."

### The "outcome" formula

```
[Outcome the user gets]. [Optional: scale/proof].
```

Examples:
- "더 좋은 코드, 빨리 배포. 1만 개 팀이 사용 중."
- "Save 4 hours a week. Trusted by 10,000+ teams."

### The "transformation" formula

```
[Old way] is over. [New way] is here.
```

Examples:
- "은행 앱 30번씩 보지 마세요. 가계부가 알아서 합니다."
- "No more spreadsheets. Just answers."

### Anti-formulas (don't)

- "[Company name]. [Generic descriptor]." — "Toss. The future of finance." — content-free.
- "Welcome to [name]" — wastes the headline.
- "Revolutionary [thing] for the [industry]" — cliché-free zone.
- Ironic / clever / poetic without context — confusing.

### Korean-specific headlines

Korean consumer apps trend toward **declarative + colloquial**:
- "가계부, 자동으로 채워줘요" (declarative)
- "30초 만에 가입" (factual)
- "은행 앱은 그만!" (colloquial-imperative)

Avoid direct translation from English ("Welcome to..." → "환영합니다..." reads unnatural).

For B2B Korean: more formal — "팀의 생산성을 높입니다" / "AI로 더 빠르게".

## Sub-headline construction

The sub-headline supports the headline. ~20-30 words. One sentence.

| Pattern | Example |
| --- | --- |
| Problem + solution | "은행 앱을 30번씩 보지 않아도 가계부가 자동으로 채워집니다." |
| Differentiation | "수동 입력 없이, 첫 달 무료로 시작." |
| Social proof + result | "100만 명이 매달 평균 12만 원을 절약했어요." |
| Concrete capability | "30개 은행 자동 연동 + AI 카테고리 분류." |

Cut hedging:
- ✗ "가계부를 도와드릴 수 있습니다." (might help)
- ✓ "가계부가 자동으로 채워집니다." (does)

## CTA choice

Primary CTA: 1 word verb + value proposition

| Bad | Good |
| --- | --- |
| "Click here" | "무료 시작" |
| "Submit" | "Pro 시작" |
| "Sign up" | "지금 가입" |
| "Get started" | "30일 무료 체험" |

Secondary CTA: lower commitment

| Pattern | Example |
| --- | --- |
| "Learn more" | "기능 살펴보기" |
| "Watch demo" | "데모 보기" |
| "Login" | "로그인" |
| "Pricing" | "요금제 보기" |

## Background choices

| Style | Conversion impact (typical) |
| --- | --- |
| Plain white / off-white | Highest perceived trust, fastest load |
| Subtle brand tint (5–10% saturation) | Slight brand boost, no real downside |
| Solid brand color (full saturation) | Strong brand, but limits visual contrast |
| Gradient | Modern feel; risk of poor text contrast |
| Hero image (full-bleed) | Strong emotion; harder accessibility |
| Hero video | Highest engagement; bandwidth + a11y cost |

For Korean fintech: subtle tint or plain white dominates. Toss / KakaoBank style.

## Video heroes — when to use

Use video hero only if:
1. Product has clear motion benefit (Linear's keyboard demo, Cron's calendar interactions).
2. You have budget for: 4K source, multiple aspect ratios, mobile-optimized export, fallback poster image.
3. You'll respect `prefers-reduced-motion`.

Don't use video hero for:
- Static products (form builder, CMS, etc.)
- Mobile-primary audiences (battery drain)
- Slow-network audiences (Korean / SEA / EMEA)

If you do use video:
- Auto-play muted only (browser policy).
- Loop, no audio.
- 5–15 second loop.
- Fallback poster image for slow connections + reduced-motion.
- Total < 5MB optimized.

## Mobile considerations

- Hero stacks vertically (headline + sub-headline + CTA + visual stacked).
- Visual moves below text or hides on mobile.
- Headline drops to 32–40px (from 48–60).
- CTA full-width.
- Trust signal compresses to one line.

For Korean mobile: most landing traffic is mobile. Design mobile-first; desktop is the variant.

## Performance

Hero is above-the-fold. Performance matters disproportionately:

- **LCP target**: < 2.5s (the hero visual usually IS the LCP).
- **Image format**: WebP / AVIF, with PNG fallback.
- **Image dimensions**: serve 2x for retina, 1x for standard. Use `srcset`.
- **Font loading**: subset hero font; preload.
- **No render-blocking JavaScript** above the fold.

For Korean CDN: use Naver Cloud / KT CDN for KR-edge serving. AWS CloudFront's KR edge is decent but slower than Korean CDNs.

## A/B testing the hero

Most-tested variables:
1. **Headline copy** (highest impact)
2. **Primary CTA copy + color**
3. **Hero visual** (image vs video vs illustration)
4. **Layout** (text-left vs centered)
5. **Background** (white vs tinted vs image)

Common testing tools: Optimizely, VWO, Google Optimize (deprecated 2023, alternatives: PostHog, Mixpanel).

Test with traffic ≥ 1,000 visitors / variant. Below that, statistical significance is unreliable.

## Korean landing-page conventions

- **Big number + benefit**: "100만 명이 사용하는 가계부" / "30초 만에 등록 완료"
- **Trust signals dense**: stars, user count, awards stacked.
- **Less whitespace** than Western Toss/Linear-style minimalism (some Korean B2C apps lean dense).
- **Hangul + English mixed**: brand name in English, headline in Korean.
- **Bottom-of-fold scroll cue** common — arrow / "더 알아보기 ↓" — Korean users scroll less than expected without the cue.

## Anti-patterns

- **Vague headline**: "Better way to do X" doesn't say what X is or why better.
- **Multiple primary CTAs**: 4 buttons in the hero = nothing chosen.
- **Hero image of people pointing at laptops**: stock-photo cliché.
- **Auto-play video with sound**: instant unsubscribe.
- **Hero CTA doesn't lead to product**: clicks land on a marketing form.
- **Headline in image, not text**: bad for SEO + screen readers + responsive.
- **Background video without poster fallback**: blank screen on slow networks.
- **CTA below the fold**: most users won't scroll.

## Cross-reference

- [`examples/component-hero-block.md`](../../examples/component-hero-block.md) — component spec
- [`knowledge/patterns/landing-page-patterns.md`](landing-page-patterns.md) — full landing structure
- [`knowledge/patterns/brand-identity.md`](brand-identity.md) — voice + visual brand
- [`knowledge/patterns/pricing-page-design.md`](pricing-page-design.md) — pricing on landing
- [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md) — Korean design conventions
