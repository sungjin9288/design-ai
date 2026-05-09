<!-- hand-written -->
---
title: Korean app store & publishing requirements
applies_to: [korean-market, ios, android, app-store-connect, google-play, onestore]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Korean app store & publishing requirements

What designers need to know to ship into the Korean market without rejections or last-minute scrambles. This is a pre-flight checklist, not legal advice.

## The three Korean stores

| Store | Why it exists | Designer impact |
| --- | --- | --- |
| **App Store (iOS)** | Required for iPhone | Korean metadata in App Store Connect; KCC age rating |
| **Google Play Korea** | Default for Android | Korean store listing, KOPECO age rating, in-app permission disclosure popup |
| **ONE store (원스토어)** | KT/SKT/LG U+ joint platform; required for some carrier promotions and game/finance categories | Separate store listing, separate APK, separate review queue |

Most consumer apps publish to App Store + Google Play. Games + finance + telecom-bundled apps add ONE store.

## Mandatory metadata (Korean store listings)

### Names and descriptions
- **App name**: ≤ 30 characters Korean. Trademark-safe (Korea's trademark database is hostile to generic English names).
- **Subtitle / Promo text**: must be in Korean.
- **Description**: write Korean-native, not machine-translated. Include 5–7 keywords naturally for App Store search.

### Screenshots
| Spec | iPhone 6.5" / 6.7" / 6.9" | Android |
| --- | --- | --- |
| Resolution | 1290×2796, 1284×2778, 1242×2688 | 1080×1920+ |
| Count | 3–10, **first 3 are critical** (visible without scroll) | 2–8 |
| Korean text | **Required.** Translated screenshots only — do not ship English-text screenshots to Korean storefront. |
| Density | High — Korean stores expect 50–70% of screen area to be feature copy + UI, not blank backgrounds. |

Korean screenshot conventions:
- Bold, high-contrast typography.
- 1–2 lines of bold benefit copy per screenshot.
- App UI partially shown (cropped) under the copy.
- Often with a phone-frame mockup.

### App icon
- 1024×1024 master.
- Test at 60×60 — Korean store grids are dense; the icon must read at thumbnail size.
- Hangul "글자" inside icon is acceptable and common (e.g., 토스 = "T", 카카오톡 = "톡"). Use only when the brand is the letter.
- Avoid: photos, gradients with text overlay, complex illustrations.

## Age ratings (필수)

### iOS — App Store Connect
- Standard 4+ / 9+ / 12+ / 17+ ratings apply.
- Korea also enforces the **GRAC (게임물관리위원회)** rating for **games specifically**. If your app is categorized as a game, it must have a separate Korean GRAC rating displayed.

### Android — Google Play
- Uses **KOPECO** (한국게임정책자율기구) rating for games or **KMRB (영상물등급위원회)** for video content.
- Non-game apps use Google's standard IARC rating.

For games:
- Get the GRAC rating before submission. The number must appear in the listing.
- Categories: 전체이용가 (All), 12세이용가, 15세이용가, 청소년이용불가 (18+).

## In-app required disclosures

Korean law and store policy require these to be **in-app**, not just in store:

### Privacy
- Privacy policy link in **app settings or sign-up flow**, not just the store listing.
- 개인정보처리방침 (privacy policy) must be Korean and disclose: data types collected, purpose, retention period, third-party sharing.

### Terms
- 이용약관 must be agreed at sign-up via a checkbox. Can be a single combined agreement, but marketing consent must be a **separate, opt-in** checkbox.

### Permissions (Android, Google Play Korea-specific)
- Before requesting any sensitive permission (location, camera, mic, contacts, storage), show an in-app dialog explaining:
  - Which permission is being requested.
  - Why it's needed for which feature.
  - Whether it's required vs optional.
- This is in addition to the OS prompt. Google Play Korea will reject without this in-app disclosure.

### Subscriptions / IAP
- Show price in ₩ before purchase.
- Show recurring schedule (월 / 연 / 회).
- Show cancellation method explicitly: "구독은 [iOS Settings / Google Play] 에서 해지할 수 있습니다."

## Common rejection reasons (App Store, KR)

1. **Missing Korean screenshots** — English screenshots in Korean storefront.
2. **Missing Korean privacy policy URL** — must resolve to a Korean-language page.
3. **Permission requested without in-app explanation** — Apple's "Why does your app need this?" string is per-permission and must be Korean.
4. **Login required to demo without test credentials** — provide test account for review team.
5. **Subscription without restore-purchase** — required for paid apps.
6. **External payment links** — apps targeting Korea got an exemption (2023+) but still must use approved alternative-payment flow if not using Apple IAP.

## Common rejection reasons (Google Play, KR)

1. **No in-app permission explanation popup** before requesting sensitive permissions.
2. **Sensitive content without age gate** — even text/article apps with adult content need explicit age verification.
3. **Misleading screenshots** — Korean store reviewers check screenshots match actual UI more strictly than US.
4. **Inadequate Korean translation** — partial Korean (some screens English, some Korean) is grounds for rejection.

## ONE store specifics (원스토어)

If publishing to ONE store:
- Separate APK signing (different signing key allowed; many devs use the same as Play).
- Separate app icon (same asset acceptable).
- ONE store has its own in-app billing SDK — separate from Google Play Billing.
- Smaller share of market but required for some carrier-bundled placements.
- Approval queue is 5–7 business days; typically less strict than Google Play KR.

## Localization reminders

- **Currency**: ₩ everywhere. Localize prices for KRW market — `$1.99` → `₩2,500` (round to natural Korean price tiers, not direct conversion).
- **Date / time**: Korea Standard Time (KST, UTC+9). No DST.
- **Phone**: 010-####-####.
- **Address**: Daum Postcode API for forms.
- **Customer service**: business hours stated on contact pages, in KST.

## Pre-submission checklist

- [ ] App name reserved on App Store Connect / Play Console / ONE store.
- [ ] Korean app description (not machine-translated).
- [ ] All screenshots include Korean text overlays.
- [ ] Privacy policy URL resolves to Korean-language page.
- [ ] Terms of service in-app, separate marketing-consent checkbox.
- [ ] Permission rationale strings localized to Korean.
- [ ] In-app permission disclosure popup (Android).
- [ ] GRAC age rating obtained (games only).
- [ ] Test account credentials provided to reviewer.
- [ ] All currency formatted ₩ with comma separator.
- [ ] Subscription cancellation path stated in-app.
- [ ] Customer service contact path in-app (1:1 inquiry, email, or phone).

## Cross-reference

- [knowledge/i18n/korean-typography.md](korean-typography.md)
- [knowledge/i18n/korean-product-conventions.md](korean-product-conventions.md)
