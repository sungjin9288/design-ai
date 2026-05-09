<!-- hand-written -->
---
title: Korean payments — vendor selection and integration UX
applies_to: [korean-market, fintech, e-commerce, payments]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Korean payments

Designing for Korean payments means choosing among a unique vendor landscape, then integrating each correctly. This is a decision document — pick a path, document why, ship.

## The vendor landscape

| Vendor | Type | Strengths | Notes |
| --- | --- | --- | --- |
| **Toss Payments** | PG (payment gateway) | Modern API, best DX, default for new fintech/SaaS | Toss the company, widely trusted brand |
| **NHN KCP** | PG | Enterprise-grade, deep B2B presence | Older API; more setup |
| **INICIS** (이니시스) | PG | Largest market share for traditional commerce | Legacy patterns; many Korean stores still default |
| **NICE Payments** | PG | Deep ESCROW + identity infrastructure | Common in finance, 본인인증 |
| **KakaoPay** | Wallet (간편결제) | Massive adoption (Kakao ecosystem) | Customer pays via KakaoPay app — UX shift |
| **NaverPay** | Wallet | Strong in commerce, Naver shopping | Similar UX shift |
| **Toss** (the wallet, not Toss Payments) | Wallet | Younger demographic, finance-first | Increasingly used as a payment method, separate from Toss Payments PG |
| **Samsung Pay** | Wallet | OEM card-on-device | Less common in standalone apps; embedded in Samsung phones |
| **PayPal Korea** | International gateway | When you need to accept overseas cards | Niche |
| **휴대폰결제 (Carrier billing)** | Telco-billed | Quick small-amount, no card needed | Mobile-game / digital-content category |
| **무통장입금 (Bank transfer)** | Direct deposit | Older demographics, distrust of cards | Shows virtual account; user transfers from bank app |
| **계좌이체 (Real-time bank transfer)** | Direct ACH | Lower fees than cards, common in B2B/large amounts | Friction: bank app handoff |

## Decision tree — which to integrate

```
Is the product:
├── Consumer mobile app (B2C)?
│   └── Required: Toss Payments PG (cards) + KakaoPay + NaverPay
│       Optional: Toss wallet, Samsung Pay
├── B2B / Enterprise?
│   └── Required: NHN KCP or NICE (legacy PG) + 무통장입금
│       Optional: 계좌이체 for invoiced amounts
├── Subscription SaaS?
│   └── Required: Toss Payments PG (best subscription API)
│       Optional: KakaoPay (recurring), NaverPay
├── Digital content / Game?
│   └── Required: 휴대폰결제 + Toss Payments PG
│       Optional: KakaoPay
├── E-commerce?
│   └── Required: Toss Payments + KakaoPay + NaverPay + 무통장입금
│       Optional: 계좌이체 for high-value, ESCROW for marketplace
└── Cross-border / Tourism?
    └── Required: PayPal + Toss Payments
        Optional: Alipay+ (for Chinese visitors)
```

**Rule of thumb for new B2C apps**: Toss Payments PG as the foundation (handles cards, subscriptions, virtual accounts). Add KakaoPay and NaverPay as one-tap shortcuts. That's ~95% of the market.

## Integration UX patterns

### The payment method selector

The order of payment methods on the selector screen carries weight in Korea:

```
[ ─ Recommended order for B2C consumer ─ ]
1. KakaoPay (yellow brand button)        ← top — most-used wallet
2. NaverPay (green brand button)         ← second wallet
3. Toss (blue)                           ← if your audience skews younger
─────────────────────
4. 신용/체크카드 (credit/debit card)       ← break, then cards
5. 휴대폰결제                              ← if applicable
6. 무통장입금                              ← always last for B2C
```

For older / B2B audiences:
```
1. 신용/체크카드
2. 무통장입금
3. 계좌이체
4. 휴대폰결제 (if applicable)
5. KakaoPay / NaverPay (below the fold)
```

Brand buttons (KakaoPay yellow, NaverPay green, Toss blue) carry recognition. Use the official assets — vendors require it as part of their brand guidelines.

### One-tap wallets vs card form

When a user picks KakaoPay/NaverPay:
- **Don't show a card form afterwards.** They've already chosen the wallet — switch to the wallet handoff immediately.
- Wallet flow: SDK opens an in-app browser or native wallet app → user authenticates → returns to your app with success/fail.
- Loading state while waiting on wallet callback: spinner + "결제 진행 중…" (do not show "Loading…" English).

When a user picks "신용/체크카드":
- Show card form: 카드번호, 유효기간, CVC, 카드명의자명.
- Toss Payments offers `requestPayment` SDK that renders this form with their UX — recommended over building it yourself.
- For first-time entry, ask for `이름` (cardholder name) per regulation.
- Save card option: present **after** successful first payment, not before. Korean users are wary of pre-checked save-card.

### Subscription disclosure (legal requirement)

E-commerce law mandates clear disclosure **before** the subscribe button:

```
┌─────────────────────────────────────┐
│ 구독 정보 (subscription details)     │
│                                     │
│ 월 ₩9,900 자동 결제                  │
│ 매월 7일에 결제됩니다                │
│ 카드: KB국민카드 ****-1234           │
│                                     │
│ [언제든 해지 가능 · 해지 방법 보기]    │
│                                     │
│ □ 위 내용에 동의합니다                │
│                                     │
│   [구독 시작]                        │
└─────────────────────────────────────┘
```

- Price in ₩, period explicit.
- Next billing date shown.
- Cancellation method explicitly stated and linked.
- **Consent checkbox required** — pre-checked is illegal under e-commerce law.
- After subscription, send a confirmation email (legal requirement) summarizing the same info.

### Refund / 청약철회

Korean e-commerce law gives consumers a **7-day cooldown** for digital goods (with caveats — opened software, used services may be excluded). UX must:
- Disclose this period at point of purchase.
- Provide an in-app refund/cancel path.
- Document exclusions clearly (e.g., "이미 다운로드한 콘텐츠는 환불 불가").

### Failed payment

Common Korean failure modes and the right error message:

| Cause | English equivalent | Korean message |
| --- | --- | --- |
| Card declined by issuer | Card declined | "카드사에서 거절되었습니다. 다른 카드를 시도해 주세요." |
| Insufficient funds | Insufficient funds | "잔액이 부족합니다." |
| Daily limit exceeded | Over daily limit | "1일 결제 한도를 초과했습니다." |
| Foreign card not allowed | International card blocked | "해외 카드는 이 결제에서 사용할 수 없습니다." |
| Wallet auth timeout | KakaoPay/NaverPay timed out | "인증 시간이 만료되었습니다. 다시 시도해 주세요." |
| Network | Connection lost | "네트워크 연결이 불안정합니다." |
| 본인인증 mismatch | Identity check failed | "본인 정보가 일치하지 않습니다. 입력 정보를 확인해 주세요." |

**Always provide a "다시 시도" (retry) button**, except for `본인인증` failures (which require user to fix the underlying data).

## 본인인증 (Identity verification)

Required for:
- Financial transactions over ~₩500,000 (varies by use case)
- Age-gated content
- Account creation in some categories (mobile carriers, securities)
- Real-name verified accounts (실명인증)

Vendors:
- **PASS app** — most modern, used by all 3 carriers (SKT/KT/LGU+). Native app handoff.
- **NICE 본인인증** — SMS-based or PASS-based, integrated into NICE's PG.
- **KCB 본인인증** — alternative to NICE.

**Never roll your own.** It requires real-name database integration only available via licensed vendors.

UX flow:
```
[현재 화면: 본인인증 필요]

  본인인증이 필요합니다
  안전한 결제를 위해 본인인증을 진행해주세요.

  [PASS 앱으로 인증]
  [SMS로 인증]
  [공동인증서로 인증]   ← rare, falling out of use

  > 본인인증은 약 1분 소요됩니다.
```

After success, return to the payment flow with `verificationToken` in the user's session.

## ESCROW (필수 in some categories)

Marketplaces (peer-to-peer commerce) and certain product categories legally require ESCROW — payment held by a 3rd party until the buyer confirms receipt.

- Vendor: NICE Payments, KCP, INICIS all offer ESCROW APIs.
- UX: buyer pays → ESCROW holds → seller ships → buyer confirms (or auto-confirms after N days) → ESCROW releases.
- Display "ESCROW 보호 거래" badge on listing/payment screen — Korean buyers look for it.

## Cost structure (high-level)

| Method | Typical fee | Notes |
| --- | --- | --- |
| Cards (PG) | 2.5–3.5% | Negotiable at scale; chargebacks possible |
| KakaoPay | 2.5–3.0% | Some products have lower wallet fees |
| NaverPay | 2.5–3.0% | |
| Bank transfer (계좌이체) | 0.5–1.0% | Cheapest; friction higher |
| 휴대폰결제 | 5–7% | Highest fee but trivial UX for small amounts |
| 무통장입금 | ~₩400 / transaction | Flat, near-zero percentage; manual reconciliation overhead |
| 본인인증 | ~₩70–200 / verification | Per-call vendor fee |

For a typical B2C consumer app with ~3% blended payment cost: assume **2.8%** as a planning number after KakaoPay/NaverPay/card mix.

## What designers (not just engineers) need to know

- Brand button colors and shapes are **regulated by the wallet vendors**. KakaoPay's button must be yellow with the official KakaoPay logo at the official aspect ratio. NaverPay must be green with the N. Don't restyle.
- The wallet handoff flow (in-app browser or native app) takes ~3–10 seconds. Design a clear loading state.
- "결제 완료" confirmation screens are expected — don't auto-navigate away. Show order/payment ID, copy-to-clipboard affordance, and a primary "내역 보기" / "주문 확인" CTA.
- For subscriptions, design the **cancel flow** as a first-class UI. Korean users expect to find "구독 해지" within 2 taps from settings.

## Cross-reference

- [knowledge/i18n/korean-product-conventions.md](korean-product-conventions.md) — broader Korean UX conventions
- [knowledge/i18n/korean-publishing.md](korean-publishing.md) — store submission requirements (privacy, marketing consent)
- [knowledge/patterns/form-design.md](../patterns/form-design.md) — payment form patterns (card, address)
