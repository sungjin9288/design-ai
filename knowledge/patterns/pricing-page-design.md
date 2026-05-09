<!-- hand-written -->
---
title: Pricing page design
applies_to: [pricing, saas, marketing]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Pricing page design

The pricing page converts more or less than any other landing page section. This is the floor.

## Two surfaces

| Surface | Purpose |
| --- | --- |
| **Pricing block on landing** | Quick comparison; high-level decision |
| **Dedicated `/pricing` page** | Detailed comparison; all tiers; FAQ |

Most products need both. Land users on the landing pricing block; route to `/pricing` for full detail.

## Tier count

| Tiers | When |
| --- | --- |
| **2** | Free + Pro. Simplest, most B2C. |
| **3** | Free + Pro + Business. Most SaaS. |
| **4** | Free + 3 paid. Risk: analysis paralysis. |
| **5+** | Don't. Almost always wrong. |

3 is the sweet spot. The middle tier is where most signups go (anchoring effect).

## Anchoring strategy

The middle tier is where you nudge users:

```
₩0 / 월       ₩9,900 / 월       ₩29,000 / 월
Free          Pro              Business
              ⭐ 추천
```

Pro looks ~3x better value than Free, and Business looks 3x more expensive than Pro. Most users land on Pro.

### Don't make Free too good

If your Free tier covers 90% of needs, no one will pay. Strategically limit:
- **Volume**: "거래 내역 90일 보관" → unlimited only on Pro.
- **Features**: AI auto-categorization → Pro only.
- **Polish**: brand watermark on exports → Pro removes it.
- **Support**: community only → Pro adds 1:1.

Be honest about the limits. Don't bait users.

### Don't make Business inaccessible

Business / Enterprise tier should feel like a real product. Not just "contact sales for a number we won't tell you."

Modern pattern: show the price, even for Business:
```
₩29,000 / 월 (5명 기준)
+ ₩5,000 / 추가 사용자
```

For true enterprise (custom contracts, SOC 2, custom SLAs): "Contact sales" is OK.

## Display format

### Monthly vs annual toggle

```
[월간] [연간 -20%]
```

Most SaaS shows monthly by default, with annual discount toggleable. Korean apps trend slightly differently — annual is common default for fintech subscriptions (consumer trust in long-term commitment).

### Price formatting

Cite [`knowledge/patterns/money-and-amount.md`](money-and-amount.md):
- Korean consumer: `9,900원/월` or `₩9,900/월`
- Western SaaS: `$9.90/mo` or `$9.90 / month`
- Tabular numerals so prices align in column comparison

### Discount display

Show savings honestly:

```
연간 결제 시:    ₩99,000 / 년
                 (월 기준 ₩8,250 — 17% 할인)
```

NOT:
```
~~₩999,000~~  → ₩99,000  (90% off!)
```

The "fake high price → discount" pattern is illegal in Korea (e-commerce law) and reads as scam everywhere.

## Feature comparison

### Per-card feature list

In `PricingCards`: 4–8 features per tier, with ✓/✗ for inclusion.

```
Pro:
✓ 거래 내역 무제한
✓ AI 자동 분류
✓ 30개 은행 자동 연동
✓ 사용자 정의 카테고리
✗ 팀 공유
✗ 사업자 영수증 처리
```

### Full feature matrix (`/pricing` page)

Detailed table with rows = features, columns = tiers. For B2B users who need to confirm specific feature support.

```
| 기능                 | Free | Pro | Business |
| --- | --- | --- | --- |
| 거래 내역 보관 기간   | 90일 | 무제한 | 무제한 |
| AI 자동 분류          | ✗    | ✓   | ✓       |
| 은행 연동 (개수)      | 3    | 30  | 30      |
| 사용자 정의 카테고리  | ✗    | ✓   | ✓       |
| 팀 공유 (사용자 수)   | ✗    | ✗   | 10명    |
| 사업자 영수증 처리    | ✗    | ✗   | ✓       |
| 고객 지원              | 커뮤니티 | 1:1 (영업일) | 전담 |
```

## CTA per tier

| Tier | CTA |
| --- | --- |
| Free | "무료 시작" — direct signup, no card |
| Pro | "Pro 시작" — 14일 무료 체험 (typical) |
| Business / Enterprise | "상담 요청" — contact form |

Make the recommended-tier CTA visually dominant (filled, brand color). Other tiers: outline button.

### Free trial vs forever-free

Pro tier: "14일 무료 체험" → user must add payment method, billing starts after 14 days.

This costs some signups (don't want to add card) but converts paying customers better than forever-free.

For consumer fintech: forever-free + Pro upgrade is common. For B2B SaaS: 14-day trial.

## FAQ section

Below the pricing comparison, address objections:

| Common questions |
| --- |
| Q: 언제든 해지할 수 있나요? — A: 네. 결제일 전에 해지하시면 추가 결제 없이 사용 종료됩니다. |
| Q: Pro 사용 중 Free로 다운그레이드하면 어떻게 되나요? — A: 다음 결제일까지 Pro로 사용하실 수 있고, 이후 Free로 전환됩니다. |
| Q: 부가가치세는 별도인가요? — A: 표시 가격은 부가세 포함입니다. |
| Q: 환불 가능한가요? — A: 결제 후 7일 이내 미사용 시 전액 환불 가능합니다. (디지털 콘텐츠 — 청약철회 7일) |
| Q: 결제 수단은 무엇이 있나요? — A: 신용/체크카드, KakaoPay, NaverPay, Toss를 지원합니다. |

Korean fintech-specific:
- Q: 부가세 포함 여부 (always include for B2C consumer)
- Q: 청약철회 (디지털 콘텐츠 7-day cooldown)
- Q: 결제 수단 (per [`korean-payments.md`](../i18n/korean-payments.md))

## Trust signals on pricing pages

- Logos of customers ("Used by [logos]")
- "30,000+ 사용자가 매월 결제 중"
- Security badges: "AES-256 · ISO 27001 · 본인인증"
- Money-back guarantee: "30일 만족 보장 — 전액 환불"

## Subscription disclosure (Korean legal)

Required by Korean e-commerce law. Show before final purchase:

```
구독 정보:
- 월 ₩9,900 자동 결제
- 매월 N일에 결제됩니다
- 결제 수단: KB국민카드 ****-1234
- 언제든 해지 가능 (설정 > 구독 관리)

☐ 위 내용에 동의합니다 (필수)

[Pro 시작]
```

Required:
- Price + period explicit
- Next billing date
- Payment method
- Cancellation path stated
- Consent checkbox **unchecked by default**

Cite [`knowledge/i18n/korean-payments.md`](../i18n/korean-payments.md).

## Special pricing patterns

### Usage-based pricing

For API products: "사용량에 따른 결제":

```
₩0.005 / API 호출
첫 10,000 호출 무료
```

Show calculator: user enters expected volume → estimated monthly cost.

### Freemium with quota

```
Free: 3 프로젝트, 100MB 저장
Pro: 무제한 프로젝트, 100GB 저장
```

Make the quota explicit. Hidden quotas are friction.

### Per-seat (for teams)

```
Business: ₩9,900 / 사용자 / 월
- 5명까지 ₩49,500 / 월
- 사용자 추가 시 자동 청구
```

Team admin can add/remove users; pro-rated billing.

## Korean conventions

| Pattern | Note |
| --- | --- |
| Pricing display | 9,900원/월 (suffix) most common in consumer; ₩9,900/월 in fintech |
| Annual discount | 20% typical (10–30% range) |
| Billing date | Always 매월 N일 (specific day) — show on receipt |
| Trial length | 14일 / 30일 typical |
| Refund policy | 7일 청약철회 (legal minimum for digital) |
| Payment methods | Show all supported (Toss/Kakao/Naver + cards) |

## Anti-patterns

- **Hide pricing behind "Contact us"** for self-serve products — users bounce.
- **Pricing in USD only** for KR-targeted SaaS — convert to ₩ at minimum, ideally KR-native price.
- **"$9/mo" in Korean app** when actual price is monthly KRW — confuses.
- **"From $99" without specifying tier** — vague.
- **More than 4 tiers** — paralysis.
- **All-features-included on Free** — no incentive to upgrade.
- **"Get 50% off — limited time!"** scarcity tactics — reads as pushy in Korean B2B context.
- **No annual option** when annual makes business sense.
- **Pricing changes without grandfathering** existing customers.

## Cross-reference

- [`examples/component-pricing-cards.md`](../../examples/component-pricing-cards.md) — component
- [`knowledge/patterns/landing-hero-design.md`](landing-hero-design.md) — hero on pricing page
- [`knowledge/patterns/money-and-amount.md`](money-and-amount.md) — currency display
- [`knowledge/i18n/korean-payments.md`](../i18n/korean-payments.md) — payment methods + subscription disclosure
- [`knowledge/i18n/korean-publishing.md`](../i18n/korean-publishing.md) — legal compliance
