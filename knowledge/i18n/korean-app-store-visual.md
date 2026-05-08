<!-- hand-written -->
---
title: Korean app store visual design
applies_to: [app-icon, app-store-screenshots, korean-app-store, ios, android]
---

# Korean app store visual design

The visual assets that get your app into the Korean App Store + Google Play Korea + ONE store: **app icon** and **screenshots**. This is design work distinct from in-app UI — it's marketing in a constrained, very-public surface.

For submission requirements (sizes, copy, age ratings): [`knowledge/i18n/korean-publishing.md`](korean-publishing.md). This file covers the **design** side.

## App icon

The single most-seen brand asset. On a phone home screen, your icon competes with 50 others.

### Conventions for Korean apps

- **Hangul letter inside icon** is acceptable and common. KakaoTalk uses "톡", Naver Pay uses "N", Toss uses "T". Single character or 2-char compounds.
- **English letter or wordmark** also common (KakaoBank uses dark blue with bird, Toss uses just "T" + dot).
- **Photo or detailed illustration** rare in Korean apps — most use flat geometric or single character.
- **Square corners** — iOS and Android both round corners automatically. Don't pre-round your icon.

### iOS icon spec

- Master at **1024×1024** PNG.
- No transparency (PNG-24 with solid bg).
- No padding — fill to the edges (iOS adds the rounded mask).
- Submit one icon — iOS handles all the @2x / @3x sizes.
- Color profile: sRGB.

### Android icon spec

- Master at **512×512** PNG (Play Console requires this).
- Adaptive icon: 108×108 dp foreground + 108×108 dp background, with the central 72×72 dp safe area.
- Provide foreground + background separately for adaptive icons.

### Test at thumbnail size

The first sign of a bad icon: it's unreadable at 60×60. Test at:

- 60px (iOS home screen at thumbnail density)
- 24px (notification, mini-icon contexts)
- 16px (favicon — if also used as web favicon)

If your icon is unreadable at 60: simplify. Drop fine details.

### Don't

- Don't put fine text (smaller than ~50px height in the master image) — illegible at thumbnail.
- Don't use photos.
- Don't use rounded corners pre-applied (iOS / Android apply their own mask).
- Don't use excessive gradients — read flat at thumbnail.
- Don't change icon between updates without warning users — recognition loss.

### Korean fintech / consumer icon trends

- Bold, single Hangul letter on solid bg (Toss "T", KakaoBank "tt").
- Brand color dominant.
- Often slight gradient OR flat solid.
- Rarely photo / illustration / 3D.

## Screenshots

Korean app stores reward screenshots that **sell the app, not show it**.

### Spec (App Store iOS)

| Device | Size | Required? |
| --- | --- | --- |
| iPhone 6.9" (Pro Max) | 1290 × 2796 | required |
| iPhone 6.5" / 6.7" | 1284 × 2778 / 1290 × 2796 | required |
| iPhone 6.1" | 1170 × 2532 | optional |
| iPad Pro 12.9" | 2048 × 2732 | required if iPad supported |
| iPad Pro 11" | 1668 × 2388 | required if iPad supported |

Submit one set; iOS scales for older devices.

### Spec (Google Play)

| Field | Spec |
| --- | --- |
| Phone screenshots | 16:9 to 9:16 ratio. 1080 × 1920 minimum. |
| 7-inch tablet | 1024 × 600 minimum |
| 10-inch tablet | 1280 × 800 minimum |
| Count | 2–8 (3+ recommended) |

### Korean screenshot conventions

Korean storefront expects much higher density than Western apps. Typical structure per screenshot:

```
┌──────────────────────────────────────┐
│                                       │
│    LARGE BENEFIT COPY (1-2 lines)    │  ← top 30%, bold, Korean
│    Sub-line                           │
│                                       │
│  ┌─────────────────┐                  │
│  │                  │                  │
│  │  [Phone frame    │                  │
│  │   with screen]   │                  │  ← center, mockup of in-app screen
│  │                  │                  │
│  │                  │                  │
│  └─────────────────┘                  │
│                                       │
│       Background color                │  ← brand color or gradient
└──────────────────────────────────────┘
```

| Slot | Notes |
| --- | --- |
| Benefit copy | "30초만에 완료" / "은행 따로 안 가요" — sells the value, not the feature |
| Phone mockup | App screen inside a phone frame for "this is how it looks" credibility |
| Background | Brand color or simple gradient — never plain white (looks unfinished) |

Western "minimal screenshot" (just the app screen on white) is **uncommon and underperforms** in the Korean storefront. Add the marketing layer.

### First 3 screenshots are critical

The Korean storefront shows 3 screenshots without scrolling. Front-load:

1. **Hero benefit** — the #1 reason to install ("가계부 자동 입력")
2. **Differentiation** — what's different from competitors ("연동 은행 30곳, 1초 동기화")
3. **Trust signal** — proof point ("100만 사용자, 평점 4.8")

Subsequent screenshots dive into specific features.

### Screenshot copy

| Korean | English equivalent | Use |
| --- | --- | --- |
| 30초만에 완료 | "Done in 30 seconds" | Speed |
| 한 번에 보는 | "All in one view" | Comprehensiveness |
| 자동으로 분류 | "Auto-categorized" | Effort-saving |
| 매일 알려드려요 | "Daily updates" | Habit |
| 계좌 연동 N개 | "N banks connected" | Coverage |
| ★★★★★ 평점 4.8 | "★★★★★ 4.8 rating" | Social proof |
| 비밀번호 없이 | "No password" | Convenience |
| 모든 카드 한 곳에 | "All cards in one place" | Aggregation |

Voice: short, declarative, action-led. Avoid hedging ("쉽게", "편리하게" alone — be specific).

### Localization

For multi-locale apps:
- Submit Korean screenshots for KR storefront.
- Submit English screenshots for US storefront.
- Don't send English to KR — instant rejection on App Store.

This is non-trivial work. Plan in your release timeline.

## Promo / featured assets

For App Store featuring (the "Today" tab):
- Hero image: 1920 × 1080 or 1242 × 2688
- Promo text: 170 chars max
- Different from regular store listing — submit if you're chasing featured slots.

For Google Play featured: similar but spec varies by promo type.

## Trends in Korean app store design

Korean App Store + Play KR converge on a few visual languages:

### Toss-style

Minimalist, single-color background, big bold Korean text, clean phone mockup. Feels modern, finance-coded.

### Kakao-style

Yellow + black palette, friendly illustrations alongside mockups. Warmer, consumer-coded.

### Naver-style

Green palette, more dense (more text per screenshot), portal-coded.

### Government / 공공기관

Blue palette, formal sans-serif, screenshot-heavy with conservative copy. Government apps are visually distinct.

Pick one direction; stay consistent across all 3+ screenshots.

## Don't

- Don't ship English screenshots to Korean storefront.
- Don't ship plain "screenshot of in-app UI on white" — looks unfinished.
- Don't use stock illustrations of people pointing at phones.
- Don't have 4+ benefit lines on one screenshot — cluttered.
- Don't use brand colors that fail dark/light contrast tests in store search results.
- Don't promise features that aren't in the app (App Store rejects, users 1-star).
- Don't update only screenshots without updating the app description / version notes.

## Tools

| Tool | Use |
| --- | --- |
| **Figma** | Design screenshots; phone-frame templates |
| **Screenshot.rocks** | Quick mockup generator |
| **AppLaunchpad** | Korean storefront-aware templates |
| **fastlane snapshot** | Auto-generate iOS screenshots from UI tests |
| **Screenshot Studio** | Sketch/Figma-friendly mockup |

For consistency: design screenshots in Figma with brand tokens (per design-ai's color/type tokens).

## Iteration / A/B testing

Apple App Store + Google Play both support **screenshot A/B tests**. Test:
- First-screenshot benefit copy.
- Whether to include phone frame.
- Brand color saturation.

20–30% changes in install conversion are not unusual. Worth testing.

## Cross-reference

- [`knowledge/i18n/korean-publishing.md`](korean-publishing.md) — submission requirements + age ratings
- [`knowledge/i18n/korean-product-conventions.md`](korean-product-conventions.md) — broader KR app conventions
- [`knowledge/patterns/brand-identity.md`](../patterns/brand-identity.md) — logo + brand applied to icon design
- [`knowledge/patterns/slide-deck-design.md`](../patterns/slide-deck-design.md) — similar headline-led visual strategy
- App Store / Play Store official guidelines (linked from korean-publishing.md)
