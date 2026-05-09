<!-- hand-written -->
---
title: Email design (transactional + marketing)
applies_to: [email, transactional, marketing-email, html-email]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Email design

Email is a constrained design medium. HTML email rendering is **stuck in 2005** for a meaningful percentage of clients. Designs that work on web break in Outlook. This file covers what actually works.

## Two archetypes

| Type | Use | Examples |
| --- | --- | --- |
| **Transactional** | Triggered by user action | Receipt, password reset, "order shipped", "verified" |
| **Marketing** | Broadcast, opt-in | Newsletter, promo, product updates, re-engagement |

Different rules for each. Transactional is **functional + minimal**; marketing is **brand-led + rich**.

## HTML email constraints (the painful reality)

Email clients render HTML wildly differently:

| Capability | Universal | Most | Some | Outlook (desktop) |
| --- | --- | --- | --- | --- |
| Tables | ✓ | ✓ | ✓ | ✓ (must use for layout!) |
| Inline CSS | ✓ | ✓ | ✓ | ✓ (must inline; <style> stripped) |
| Web fonts | — | ✓ | ✓ | partial (use fallbacks) |
| Flexbox / Grid | partial | ✓ | ✓ | **broken** |
| `:hover` | partial | ✓ | ✓ | **broken** |
| Dark mode | ✓ | ✓ | ✓ | partial |
| Animation / GIF | ✓ | ✓ | ✓ | ✓ (GIF stops at first frame in Outlook 2007) |
| Background images | ✓ | ✓ | ✓ | requires VML hack |
| `<button>` | — | — | — | **don't use** — fake with linked image or styled <a> |
| SVG | partial | partial | partial | **broken** — convert to PNG |

**The takeaway**: layout with `<table>` and inline CSS. Modern frameworks (`mjml`, `react-email`) generate this for you.

## Frameworks

Don't hand-write HTML email. Use a framework:

| Framework | Approach |
| --- | --- |
| **MJML** | Markup language → email HTML. Mature. |
| **react-email** | React components → email HTML. Modern. |
| **Maizzle** | Tailwind-flavored. Designer-friendly. |
| **Foundation for Emails** | CSS framework with email-tested components |

For new projects: `react-email` (if React stack) or `mjml` (if any). Both produce hardened HTML that works across clients.

## Layout — the table layout

```html
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr>
    <td align="center" style="padding: 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600">
        <!-- email body, max-width 600px, centered -->
      </td>
    </tr>
  </tr>
</table>
```

`role="presentation"` tells screen readers the table is for layout, not data.

### Width

| Width | Use |
| --- | --- |
| 600px | Standard email — the universal default |
| 480–540px | More conservative; works better on narrow mobile |
| 320px | Strict mobile (rare) |

Below 600px: contents may be cramped. Above 600px: gets clipped in some clients.

### Mobile

Use `@media` queries inline (yes, in `<style>` tags inside `<head>`) for responsive:

```html
<style>
  @media (max-width: 480px) {
    .container { width: 100% !important; }
    .stack { display: block !important; width: 100% !important; }
  }
</style>
```

`!important` is needed to override email-client defaults.

## Transactional email anatomy

```
┌──────────────────────────────────────────────┐
│ [Logo]                                        │  ← header (small, brand)
├──────────────────────────────────────────────┤
│                                                │
│  Hi {{first_name}},                            │  ← greeting
│                                                │
│  Your order #1234 has shipped.                 │  ← what happened
│                                                │
│  ┌──────────────────────────┐                 │
│  │ Order summary             │                 │
│  │ ...                        │                 │
│  └──────────────────────────┘                 │
│                                                │
│      [Track order]                             │  ← primary CTA
│                                                │
│  If you didn't expect this email, contact      │  ← contextual help
│  support@example.com.                          │
│                                                │
├──────────────────────────────────────────────┤
│ Footer: company info, legal, unsubscribe       │
└──────────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Logo | yes | Top, small (40–60px high), centered or left |
| Greeting | yes | Personalized when possible |
| Body | yes | What this email is about — plain language |
| Primary CTA | usually | One button, brand color |
| Help / contact | yes (transactional) | "If you have questions..." |
| Footer | yes (legal) | Sender info, address, unsubscribe (marketing only) |

### Transactional rules

- **One purpose per email.** Don't combine "your order shipped" + "check out our new products."
- **One CTA.** "Track order" or "View receipt" — not both.
- **No marketing in transactional.** It's an anti-pattern AND violates GDPR / Korean e-commerce law for some categories.
- **Sender from + reply-to**: a real address. `noreply@` is hostile.
- **Subject line**: action-specific. "Your order #1234 has shipped" beats "Order update."

## Marketing email anatomy

Looser rules, more brand-led:

```
┌──────────────────────────────────────────────┐
│ [Hero image — full width]                    │  ← hero
├──────────────────────────────────────────────┤
│                                                │
│  H1 Headline — what this email is about       │
│                                                │
│  Brief copy.                                   │
│                                                │
│      [CTA button]                              │
│                                                │
├──────────────────────────────────────────────┤
│  Section 2 (3-up)                             │
│  ┌────┐ ┌────┐ ┌────┐                        │
│  │ A  │ │ B  │ │ C  │                        │
│  └────┘ └────┘ └────┘                        │
├──────────────────────────────────────────────┤
│ Footer: brand, legal, unsubscribe              │
└──────────────────────────────────────────────┘
```

### Marketing rules

- **Hero matters most.** Above the fold = the only thing 60% of recipients see.
- **One primary message.** Multiple "secondary" calls dilute.
- **Visual hierarchy**: image > headline > body > CTA.
- **Mobile first**: 60%+ of email opens on mobile. Single column stacks.
- **Personalization** if data permits: `{{first_name}}`, recently-viewed items, location.
- **Unsubscribe link prominent** in footer. Hidden / tiny is illegal in many jurisdictions.

## Subject line

Most-skipped, most-important detail.

| Rule | Why |
| --- | --- |
| Under 50 characters | Mobile preview cuts off. Front-loaded. |
| Lowercase / sentence case | Title Case Reads Like Marketing — Skipped |
| No clickbait | "Your account is at risk" → unsubscribe |
| Specific over generic | "Order #1234 shipped" > "Order update" |
| Emoji optional | Sparingly. ❤️🎉 work; 🤖 spam-flag in some clients. |
| Korean: 1-2 phrases, similar rules | "5월 정기 결제 완료" |

## Preheader text

The "preview text" shown after subject in inbox lists. Many emails leave this as the email's first body line — wasteful.

Set it explicitly:

```html
<div style="display: none; max-height: 0; overflow: hidden;">
  Your tracking number is FX12345678 — see when it arrives.
</div>
```

This shows in inbox preview, hidden in email body.

40–100 character target.

## Color and typography

### Color

| Use | Convention |
| --- | --- |
| Background | White or very light (`#FAFAFA`) |
| Body text | `#1F2937` or similar (off-black) |
| Brand accent | One color, consistent across all email |
| Buttons | Brand primary fill, white text |
| Links | Brand accent, underlined |

For dark mode: most clients respect `prefers-color-scheme` if you provide a dark variant. Test in Apple Mail, Outlook, Gmail.

### Typography

Email-safe fonts:

```
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

Web fonts work in modern clients (Apple Mail, Gmail) but fail in Outlook desktop. Pair with a system fallback.

For Korean:
```
font-family: "Pretendard", -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
```

Pretendard ships fonts via CDN; works in Apple Mail / Gmail.

### Type sizes

| Element | Size |
| --- | --- |
| Body | 16px (web) — important for mobile readability |
| Heading | 24–32px |
| Button | 16px (text inside button) |
| Footer / legal | 12–14px |

Don't go below 14px body — too small on mobile.

## Buttons (the "bulletproof button" pattern)

Outlook strips `<button>` styles. The "bulletproof button" uses a styled `<a>` inside a styled table cell:

```html
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td bgcolor="#7C3AED" style="border-radius: 8px;">
      <a href="https://example.com/track"
         style="display: inline-block; padding: 14px 32px;
                color: #FFFFFF; text-decoration: none;
                font-family: sans-serif; font-size: 16px; font-weight: 600;
                border-radius: 8px;">
        Track order
      </a>
    </td>
  </tr>
</table>
```

This works in every email client. Use a framework — they generate this automatically.

## Korean email conventions

Per [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md):

- Subject lines in Korean for KR audience.
- Polite form (~합니다) for transactional.
- Casual (~해요) for friendly product newsletters.
- 한국어 사이트의 unsubscribe 링크: "수신거부", per Korean spam law (정보통신망법).
- Sender domain: typically a separate subdomain (`mail.example.com`) for SPF / DKIM clean separation.

Korean spam regulations:
- Marketing emails MUST include `[광고]` prefix in subject (e-commerce / promotional).
- Sender's company info + address + business registration number in footer.
- Unsubscribe link must be functional with no login required.

Skipping these = legal risk.

## Testing

Email rendering varies by client. Test in:
- Gmail (web + iOS app + Android app)
- Apple Mail (Mac + iOS)
- Outlook (desktop, mobile, web)
- Yahoo Mail
- For KR market: Naver Mail, Daum Hanmail

Tools:
- **Litmus** (paid, comprehensive client previews)
- **Email on Acid** (paid, similar)
- **MJML's online preview** (free, basic)

Test darkmode + light mode + mobile + desktop.

## Accessibility

- `role="presentation"` on layout tables (screen readers skip).
- `<img alt="">` on every image — even decorative ones (so screen readers don't read filenames).
- High contrast for text (≥ 4.5:1).
- Don't put critical info only in images — assume images blocked (Outlook default).
- Plain-text version: provide alongside HTML for plain-text-only readers.
- Unsubscribe link ≥ 14px with ≥ 4.5:1 contrast — don't bury legally-required text.

## Tracking

Most marketing emails embed tracking pixels (1×1 image fetched on open) and link wrapping (rewrites URLs to track clicks).

Privacy considerations:
- iOS 15+ Mail loads images automatically (defeats open tracking).
- Disclose tracking in privacy policy.
- Korean PIPA: image-load tracking is "personal information processing"; needs consent or legitimate-interest basis.

For transactional: don't track. It's not the user's intent.

## Don't

- Don't write HTML email by hand — use a framework.
- Don't use `<button>` in email — use bulletproof button pattern.
- Don't use SVG — convert to PNG.
- Don't put critical info only in images — show as text too.
- Don't forget the preheader text.
- Don't make the unsubscribe hard to find.
- Don't include `[광고]` in subject if it's actually transactional (legal misclassification).
- Don't mix transactional + marketing in one email.
- Don't ship without testing in Outlook (broken layouts are common there).

## Cross-reference

- [`knowledge/patterns/document-typography.md`](document-typography.md) — long-form reading rules
- [`knowledge/patterns/technical-writing.md`](technical-writing.md) — voice for transactional copy
- [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md) — Korean spam law
- [`knowledge/i18n/korean-publishing.md`](../i18n/korean-publishing.md) — Korean compliance
- [react-email docs](https://react.email/)
- [MJML docs](https://mjml.io/)
