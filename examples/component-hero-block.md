# `HeroBlock` (landing hero) — spec

> Marketing-page primitive. The first thing visitors see. Cite [`knowledge/patterns/landing-hero-design.md`](../knowledge/patterns/landing-hero-design.md) for variants and rationale.

## Purpose

The top of a landing page. Headline, supporting text, primary CTA, and supporting visual. The single most-iterated element on any product website.

## Anatomy

```
Pattern A (text-led, image right):
┌────────────────────────────────────────────────────────────┐
│                                                              │
│ Headline — what you do (40-60pt)                             │
│                                                              │
│ Sub-headline / problem-solution (16-20pt, ~25 words)         │
│                                                              │
│ [Primary CTA]    [Secondary CTA]                             │
│                                                              │
│ Trust signal (logos / "1,000+ 사용자")                       │
│                                                              │
└────────────────────────────────────────────────────────────┘
                        ┌──────────────────────────────────┐
                        │                                    │
                        │    [Hero visual]                  │
                        │    (product screenshot, photo,    │
                        │    illustration)                   │
                        │                                    │
                        └──────────────────────────────────┘

Pattern B (centered, image below):
              Headline
              Sub-headline
            [Primary] [Secondary]
              Trust signal
            ┌────────────────┐
            │  Hero visual   │
            └────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Headline | yes | The thing you do, in user words |
| Sub-headline | yes | One sentence that explains the headline |
| Primary CTA | yes | One clear action |
| Secondary CTA | optional | "Learn more" / "View demo" / "Login" |
| Trust signal | optional | Customer logos, user count, awards |
| Visual | optional | Image, video, illustration |

## API

```tsx
<HeroBlock
  headline="가계부, 자동으로 채워줘요"
  subheadline="은행 30곳 자동 연동. 첫 달 무료. 카드 등록 불필요."
  primaryCta={{ label: "무료 시작하기", onClick: signup }}
  secondaryCta={{ label: "데모 보기", onClick: demo }}
  trustSignal={{ type: "userCount", count: 1247000 }}
  visual={<ProductScreenshot />}
  layout="text-left"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `headline` | `string \| ReactNode` | — | Required. ≤ 12 words ideal. |
| `subheadline` | `string \| ReactNode` | — | One sentence (~25 words). |
| `primaryCta` | `CTA` | — | Required. |
| `secondaryCta` | `CTA` | — | Optional. |
| `trustSignal` | `TrustSignal` | — | Below CTAs |
| `visual` | `ReactNode` | — | Image / video / illustration |
| `layout` | `"text-left" \| "text-right" \| "centered" \| "split"` | `"text-left"` | |
| `background` | `"default" \| "tinted" \| "image" \| "video"` | `"default"` | |
| `backgroundImage` | `string` | — | When `background="image"` |
| `videoSrc` | `string` | — | When `background="video"` |

## Layout variants

| Layout | Use |
| --- | --- |
| `text-left` (most common) | Reading order LTR; image-led visual on right |
| `text-right` | RTL languages; or to vary template across landing pages |
| `centered` | Highest-conversion for B2C consumer; minimal layout |
| `split` | 50-50 image and text; demos product prominently |

## Headline rules

| Bad | Good |
| --- | --- |
| "Welcome to [Company Name]" | "가계부, 자동으로 채워줘요" |
| "Revolutionary platform" | "은행 30곳 자동 연동" |
| "Your finance, simplified" | "[concrete what]: [concrete how]" |

The headline answers "what does this do?" in user words.

For Korean: short, declarative. Verb-led when possible. ~합니다 too formal for marketing — use ~해요 OR colloquial-imperative.

## Sub-headline rules

| Pattern | Example |
| --- | --- |
| Problem + solution | "은행 앱을 30번씩 보지 않아도 가계부가 자동으로 채워집니다." |
| Differentiation | "수동 입력 없이, 첫 달 무료로 시작." |
| Social proof + result | "100만 명이 매달 평균 12만 원을 절약했어요." |

## CTA rules

- **Primary**: action-specific verb. "무료 시작" beats "시작하기". "지금 가입" beats "Sign up".
- **Secondary**: lower-commitment. "데모 보기" / "기능 살펴보기" / "로그인".
- **One primary**. Two competing primaries dilute.
- **Contrast**: primary CTA must have brand color + ≥ 7:1 contrast.

## Trust signals

5 patterns:

| Type | Example | When |
| --- | --- | --- |
| Customer logos | "Used by 토스, KakaoBank, ..." | B2B; logos must be permission-cleared |
| User count | "100만 명이 사용 중" | Consumer; needs to be honest |
| Awards | "App Store '오늘의 앱' 선정" | When awarded by reputable source |
| Reviews | "★★★★★ 평점 4.8" | Consumer; show star count |
| Press mentions | "TechCrunch에 소개됨" | Press mentions matter (rare to have) |

Below the CTA, small (smaller than sub-headline). Don't lead with trust signal — lead with the value proposition.

## Visual choices

| Visual | Use |
| --- | --- |
| Product screenshot | Most B2C / B2B; shows what the product looks like |
| Phone mockup | Mobile-first products |
| Illustration | When product is abstract or service-based |
| Photo (people using product) | Lifestyle products; risks looking generic |
| Animated GIF / video loop | Demonstrates interaction |
| Live interactive demo | Sophisticated; rare |

For Korean fintech landing pages: phone mockup with product screenshot is dominant pattern (Toss / KakaoBank style).

## Sizes / typography

| Element | Desktop | Mobile |
| --- | --- | --- |
| Headline font | 48–60px | 32–40px |
| Sub-headline | 18–22px | 16–18px |
| CTA button height | 56px | 48px |
| Hero visual width | ~50% column | full-width below |
| Total hero height | 70–90% viewport | scrollable |

## Background variants

### `default`

Solid `--color-bg-default` (white or near-white). Cleanest, fastest perceived load.

### `tinted`

Subtle brand-color background (`--color-primary-subtle-bg`). Adds brand personality without overwhelming.

### `image`

Full-bleed image with overlay scrim for text legibility (`linear-gradient(to right, rgba(0,0,0,0.6), transparent)` typical).

### `video`

Hero video (autoplay muted loop). Heavy bandwidth — use sparingly.
- `prefers-reduced-motion`: still poster image instead.
- File optimization: H.264 < 5MB, fallback poster always.

## Tokens consumed

```
--color-bg-default
--color-bg-tinted              (when tinted)
--color-text-primary           (headline)
--color-text-secondary         (sub-headline)
--color-primary-default        (primary CTA)
--color-on-primary
--space-lg, --space-xl, --space-2xl, --space-3xl
--font-size-3xl, --font-size-4xl, --font-size-5xl  (headline)
--font-size-lg, --font-size-xl                      (sub-headline)
--font-weight-bold, --font-weight-medium
--motion-default
```

## Accessibility

- Render as `<section role="banner">` or `<header>` for the page.
- Headline is `<h1>`.
- Sub-headline is `<p>` (not `<h2>` — that's the next section).
- Primary CTA is `<button>` or `<a href>` per action type.
- Background video: `<video>` with `aria-hidden="true"` (decorative).
- Alt text on hero image describes meaning, not "hero image".

## Korean considerations

- **Voice**: ~해요 (friendly, consumer) or ~합니다 (formal, B2B). Pick one.
- **Headline style**: declarative or colloquial-imperative. "가계부, 자동으로!" / "30초 만에 가입".
- **CTAs**: short. "무료 시작" / "지금 가입" / "체험하기" / "데모 보기".
- **Trust signals**: Korean star pattern (`★★★★★`) + count. "1,247,000명이 사용 중".

## Code example

```tsx
function LandingPage() {
  return (
    <main>
      <HeroBlock
        headline="가계부, 자동으로 채워줘요"
        subheadline="은행 30곳 자동 연동. 첫 달 무료. 카드 등록 불필요."
        primaryCta={{ label: "무료 시작", onClick: () => navigate("/signup") }}
        secondaryCta={{ label: "데모 보기", onClick: () => navigate("/demo") }}
        trustSignal={{
          type: "userCount",
          count: 1247000,
          label: "명이 매달 평균 12만 원 절약 중",
        }}
        visual={<PhoneMockup screen="dashboard" />}
        layout="text-left"
        background="tinted"
      />

      <FeatureGrid />
      <TestimonialCarousel />
      <PricingCards />
    </main>
  );
}
```

## Don't

- Don't use marketing prose ("revolutionary", "synergy") in the headline.
- Don't show 4+ buttons in the hero — clarity dies.
- Don't autoplay videos with sound.
- Don't ship a hero without `prefers-reduced-motion` handling for video / animations.
- Don't put critical info only in the hero image.
- Don't truncate the headline to fit the design — re-write the headline shorter.
- Don't make the primary CTA visually weaker than the secondary.

## References

- No upstream component is exactly this. Each landing-page builder (Webflow, Framer, Astro Themes) ships their own variant.
- Cite [`knowledge/patterns/landing-page-patterns.md`](../knowledge/patterns/landing-page-patterns.md) and [`knowledge/patterns/landing-hero-design.md`](../knowledge/patterns/landing-hero-design.md).

## Cross-reference

- [`knowledge/patterns/landing-hero-design.md`](../knowledge/patterns/landing-hero-design.md) — hero variants
- [`knowledge/patterns/landing-page-patterns.md`](../knowledge/patterns/landing-page-patterns.md) — full landing structure
- [`examples/component-button.md`](component-button.md) — CTA primitive
- [`knowledge/patterns/brand-identity.md`](../knowledge/patterns/brand-identity.md) — voice in marketing
