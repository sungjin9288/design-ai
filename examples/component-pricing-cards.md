# `PricingCards` — spec

> Marketing primitive. Renders 2–4 pricing tiers in a comparison grid. The single most-iterated section of any SaaS landing page after the hero.

## Purpose

Communicate pricing tiers + features per tier + CTA per tier. Used on `/pricing`, in landing pages, and in upgrade modals.

## When PricingCards vs PricingTable

| Pattern | Use |
| --- | --- |
| **PricingCards** | 2–4 tiers; mobile-friendly; consumer-coded |
| **PricingTable** (full feature matrix) | 4+ tiers OR detailed feature comparison; desktop-first; B2B-coded |

Most SaaS: cards on landing, full table on dedicated `/pricing` page.

## Anatomy

```
┌──────────────────────────────────────────────────────────────┐
│ ┌──────────┐  ┌──────────────┐  ┌──────────┐                │
│ │ Free     │  │ ⭐ Pro       │  │ Business │                │
│ │          │  │ ‹ 추천 ›       │  │          │                │
│ │ ₩0       │  │ ₩9,900/월    │  │ ₩29,000  │                │
│ │ /월      │  │              │  │ /월       │                │
│ │          │  │              │  │          │                │
│ │ ✓ 기능1  │  │ ✓ 기능1      │  │ ✓ 기능1  │                │
│ │ ✓ 기능2  │  │ ✓ 기능2      │  │ ✓ 기능2  │                │
│ │   기능3 ✕ │  │ ✓ 기능3      │  │ ✓ 기능3  │                │
│ │   기능4 ✕ │  │   기능4 ✕    │  │ ✓ 기능4  │                │
│ │          │  │              │  │          │                │
│ │ [무료 시작]│  │ [Pro 시작]   │  │ [상담 요청]│                │
│ └──────────┘  └──────────────┘  └──────────┘                │
└──────────────────────────────────────────────────────────────┘

Highlighted "추천" tier: visual emphasis (border, scale-up, accent background).
```

## API

```tsx
<PricingCards
  tiers={[
    {
      id: "free",
      name: "Free",
      price: { amount: 0, period: "month", currency: "KRW" },
      description: "개인 사용자용",
      features: [
        { included: true, label: "거래내역 저장 (90일)" },
        { included: true, label: "기본 카테고리" },
        { included: false, label: "AI 자동 분류" },
        { included: false, label: "은행 자동 연동" },
      ],
      cta: { label: "무료 시작", onClick: signupFree },
    },
    {
      id: "pro",
      name: "Pro",
      price: { amount: 9900, period: "month", currency: "KRW" },
      description: "개인 사용자용",
      features: [
        { included: true, label: "거래내역 저장 (무제한)" },
        { included: true, label: "사용자 정의 카테고리" },
        { included: true, label: "AI 자동 분류" },
        { included: false, label: "팀 공유" },
      ],
      cta: { label: "Pro 시작", onClick: signupPro, intent: "primary" },
      highlighted: true,
      badge: "추천",
    },
    {
      id: "business",
      name: "Business",
      price: { amount: 29000, period: "month", currency: "KRW" },
      description: "팀 / 사업자용",
      features: [
        { included: true, label: "Pro 모든 기능" },
        { included: true, label: "팀 공유 (최대 10명)" },
        { included: true, label: "사업자 영수증 처리" },
        { included: true, label: "전담 고객센터" },
      ],
      cta: { label: "상담 요청", onClick: contact },
    },
  ]}
  billingPeriod="monthly"
  onBillingPeriodChange={setBillingPeriod}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tiers` | `Tier[]` | — | Pricing tiers (2–4 typical) |
| `billingPeriod` | `"monthly" \| "yearly"` | `"monthly"` | |
| `onBillingPeriodChange` | `(period) => void` | — | Toggle handler |
| `yearlyDiscount` | `number` | — | "월 결제 대비 N% 할인" badge |
| `currency` | `"KRW" \| ...` | `"KRW"` | Display currency |

```ts
type Tier = {
  id: string;
  name: string;             // "Free" / "Pro" / "Business"
  price: { amount: number, period: "month" | "year", currency: string };
  description?: string;
  features: Feature[];
  cta: { label: string, onClick: () => void, intent?: "primary" | "secondary" };
  highlighted?: boolean;     // visual emphasis
  badge?: string;            // "추천" / "인기"
};

type Feature = {
  included: boolean;
  label: string;
  hint?: string;             // tooltip detail
};
```

## Tier visual

### Default tier (non-highlighted)

- Card with neutral border
- Standard padding
- Outline button CTA

### Highlighted tier ("recommended")

- Border in `--color-primary-default`
- Slightly bigger scale (`transform: scale(1.05)` desktop)
- Solid primary CTA
- "추천" badge above the card

The highlighted tier is the **default conversion target**. Be explicit about which tier you want users to pick.

## Feature display

```
✓ 기능 (included)
○ 기능 (not included)  — gray, muted
✓ 기능1 ⓘ              — with tooltip
```

| Approach | Use |
| --- | --- |
| Show all features in every tier (with ✓/○) | Full transparency, easy comparison |
| Show only included features per tier | Cleaner but harder comparison |
| Differentials only ("Everything in Free, plus...") | Hierarchical pricing — hides scope |

For most consumer fintech: show all features with ✓/○ per tier. Tooltip for explanation.

## Billing period toggle

Common: monthly vs yearly toggle above the tiers, with "save 20%" badge:

```
[월간] [연간 -20%]
```

Yearly discount must be **honest**:
- Monthly tier × 12 vs yearly: show the actual savings.
- "20% 할인" only if math checks out.

## Korean conventions

- **Currency**: ₩9,900 / 월 (prefix) or 9,900원/월 (suffix). Pick one. Most Korean SaaS uses 원/월.
- **Free tier name**: "무료" or "Free" — both work. KakaoBank-style products use "무료".
- **Recommended tier badge**: "추천" / "가장 인기" / "베스트셀러".
- **CTA verbs**: "시작" / "가입" / "결제" — short, action-led.
- **Yearly discount label**: "연간 결제 시 20% 할인" or "월 N원 (연 결제)".

## Tokens consumed

```
--color-bg-default
--color-bg-elevated         (highlighted tier)
--color-bg-subtle           (alternating rows in features list)
--color-primary-default     (highlighted border, primary CTA)
--color-primary-subtle-bg   (highlighted bg tint)
--color-text-primary
--color-text-secondary
--color-text-tertiary       (un-included features)
--color-success             (included checkmarks)
--color-border-default
--space-md, --space-lg, --space-xl
--radius-lg
--shadow-card               (highlighted tier elevation)
```

## Accessibility

- Render as `<section>` with `<h2>` for "Pricing".
- Each tier: `<article>` with `<h3>` for tier name.
- Price: prominent, with `aria-label="9,900원 매월"`.
- Feature list: `<ul>` with `<li>`. ✓/○ as `aria-hidden="true"`; "포함" / "미포함" prefix on each `<li>`'s screen-reader text.
- Highlighted tier: `aria-label="추천 요금제"`.
- Billing toggle: `<fieldset>` with radio buttons.

## Korean / English label mapping

| English | Korean |
| --- | --- |
| Free | 무료 |
| Pro | Pro |
| Business / Enterprise | Business / 비즈니스 / 엔터프라이즈 |
| Recommended | 추천 |
| Most popular | 가장 인기 |
| Best seller | 베스트셀러 |
| Get started | 시작하기 |
| Contact sales | 상담 요청 |
| Save N% | N% 할인 |
| / month | / 월 |
| / year | / 연 |

## Code example

(See API example above — fully fleshed out.)

## Edge cases

- **Custom pricing tier** ("Enterprise — Contact us"): no number, just "상담 후 결정". CTA opens contact form.
- **Free trial** for paid tier: indicate prominently — "14일 무료 체험" near price.
- **Annual-only / monthly-only**: hide the toggle if not applicable.
- **Multiple currencies**: detect locale, show appropriate. Fallback USD.
- **Per-seat pricing**: "₩9,900 / 사용자 / 월". Make explicit.

## Don't

- Don't have 5+ tiers — analysis paralysis.
- Don't hide the "free" tier if it exists.
- Don't auto-select a tier; let users click.
- Don't show "원래는 비싼" pricing without honest discount math.
- Don't make the highlighted tier look identical to others — defeats purpose.
- Don't use "Most popular" for a tier with no actual popularity data.
- Don't omit "월" / "연" suffix on prices — confusion follows.

## References

No upstream component matches exactly. Each marketing-builder (Webflow, Framer) has variants. Stripe's pricing page is canonical Western reference. Toss / KakaoBank are canonical Korean.

## Cross-reference

- [`knowledge/patterns/pricing-page-design.md`](../knowledge/patterns/pricing-page-design.md) — pricing strategy + design
- [`examples/component-card.md`](component-card.md) — base card primitive
- [`examples/component-button.md`](component-button.md) — CTA primitive
- [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md) — currency display
- [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md) — pricing in KR market
