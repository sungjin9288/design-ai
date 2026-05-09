<!-- hand-written -->
---
title: Korean product UX conventions
applies_to: [korean-market, mobile, web, payments]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Korean product UX conventions

Patterns Korean users expect from local apps. Designs that ignore these read as "translated foreign apps" and lose trust.

## Authentication

| Pattern | Korean expectation |
| --- | --- |
| Phone-first signup | Most consumer apps require **phone number + SMS verification** as the primary identity. Email is secondary or optional. |
| KakaoTalk login | The dominant social login in Korea. Treat it like Apple/Google ID elsewhere. Place above email login. |
| Naver login | Second most common. Used in news/portal/shopping. |
| Apple/Google login | Required for app store policy compliance, but place below Kakao/Naver in the visual order for Korean apps. |
| 본인인증 (Identity verification) | Real-name verification via PASS app or SMS. Required for finance, ticketing, certain age-gated content. **Never implement this yourself** — use a vendor (KCB, NICE, Toss). |

## Payments

| Pattern | Korean expectation |
| --- | --- |
| **Toss / KakaoPay / NaverPay** | One-tap payment apps. Most consumer flows show these as primary tabs in the payment selector. |
| Credit card | Local cards (BC, Shinhan, KB, etc.). Stripe ≠ payment processor here — use Toss Payments, NHN KCP, INICIS, KakaoPay for Business. |
| 무통장입금 (Bank transfer) | Still common for older demographics, certain B2C. Provide a virtual account. |
| 휴대폰결제 (Mobile carrier billing) | Small-amount purchases (< ~₩500K). Common in mobile gaming, digital content. |
| Subscription disclosures | Korea's e-commerce law requires explicit recurring charge disclosure with all prices in ₩, before the subscribe button. |
| 청약철회 (Right to withdraw) | 7-day cooldown for digital goods is legally required to be disclosed. |

## Forms

- **Address**: Korean addresses use postal-code lookup (도로명주소 / 지번주소) — never free-form. Use the **Daum Postcode API** (free, ubiquitous). Never ask the user to type their full address.
- **Birth date**: 6-digit `YYMMDD` with regional/gender suffix (resident registration number) — **don't ever ask for the full RRN**. For age, ask for birth year only or full DOB.
- **Name**: single field "이름". Do not split first/last — Korean names are written 성 + 이름 (family-given) without space. Don't apply Western "first/last" splitting.
- **Phone**: 11-digit mobile (`010-####-####`). Validate with regex `/^01[0-9]-?\d{3,4}-?\d{4}$/`.
- **Email**: standard. Korean users frequently use Naver (`@naver.com`) and Daum (`@hanmail.net`); make sure your validator accepts both common patterns.

## Navigation patterns

- **Bottom tab bar (mobile)**: 4–5 tabs. Korean apps frequently use **icon + Korean label** — labels are not optional.
- **Hamburger menu**: less common as a primary nav in Korean consumer apps. Korean users prefer visible tabs.
- **Back button**: respect device-native back. Custom back buttons in headers are still common (left-positioned chevron) but don't replace the system gesture.
- **Search**: prominent, often as a top-bar icon or persistent input. Korean users search more than browse compared to Western patterns.

## Content density

Korean consumer apps tend toward **higher density** than Western apps:
- More items per screen (lists, feeds, dashboards).
- Smaller padding between elements.
- More text per card.

This is not "cluttered design" — it matches reading pace and screen-time habits. When porting a Western design, be prepared to reduce padding by 15–25% and increase items-per-fold.

Reference: see how Coupang, Naver, KakaoTalk, Toss differ from Amazon, Google, WhatsApp, Robinhood.

## Color associations

Different from Western color symbolism:

| Color | Korean association | Use for |
| --- | --- | --- |
| Red | Risk, sale, **but not death** | error, sale price, urgency. Korean ecommerce "할인" (sale) badges are red. |
| Blue | Trust, finance | primary CTAs, fintech, banking |
| Green | Growth, "go" | success, environmental, **not money** (unlike US green=$) |
| Yellow | KakaoTalk-coded | branded only — most users associate yellow with Kakao. Use cautiously as a primary brand color. |
| Black + gold | Luxury, premium | high-end shopping, premium tiers |
| Pink / coral | Beauty, fashion, K-beauty | cosmetics, lifestyle apps |

## Error and empty states

- Tone: be apologetic, not casual. "오류가 발생했습니다" (an error occurred) over "Oops!"
- Provide a recovery action — Korean users expect a "다시 시도" (retry) button or contact path.
- "Empty cart" / "no results" should suggest next steps (popular items, recommendations).

## Customer service expectations

- 1:1 inquiry (1:1 문의) is a standard pattern — a chat or form within the app.
- Phone customer service hours (KST) are commonly displayed.
- "고객센터" (customer center) is the standard term for support.

## Compliance notes

- **개인정보처리방침 (Privacy policy)** — required link, often in app settings.
- **이용약관 (Terms of service)** — required, must be agreed at signup with separate checkboxes for required vs marketing-opt-in items.
- **마케팅 수신 동의** (Marketing consent) — must be a separate opt-in from required terms. Pre-checked is illegal.
- **앱 권한 안내** (App permissions disclosure) — Google Play Korea requires a clear in-app disclosure of why each permission is requested.

## Cross-reference

- [knowledge/i18n/korean-typography.md](korean-typography.md)
- (TODO) [knowledge/i18n/korean-publishing.md](korean-publishing.md) — store-listing rules
