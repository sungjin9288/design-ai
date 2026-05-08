# `EmailLayout` — spec

> The standard responsive email layout. Wraps content in the table-based scaffolding required for cross-client compatibility.

## Purpose

Provides the canonical email body structure: centered 600px container, table-based layout, inline CSS, mobile-responsive media queries. Use for both transactional and marketing emails.

## Anatomy

```
┌────────────────────────────────────────────────┐
│  outer wrapper (full-width, bg color)          │
│  ┌──────────────────────────────────────────┐  │
│  │  inner wrapper (600px max, centered)      │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │ Header (logo)                       │  │  │
│  │  ├────────────────────────────────────┤  │  │
│  │  │                                     │  │  │
│  │  │ Body content                        │  │  │
│  │  │                                     │  │  │
│  │  ├────────────────────────────────────┤  │  │
│  │  │ Footer (legal, unsubscribe)         │  │  │
│  │  └────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

## API (React Email-flavored)

```tsx
<EmailLayout
  preheader="Your tracking number is FX12345..."
  brandColor="#7C3AED"
>
  <EmailLayout.Header>
    <Logo />
  </EmailLayout.Header>

  <EmailLayout.Body>
    <Heading>주문이 발송되었습니다</Heading>
    <Paragraph>안녕하세요, 김민지 님.</Paragraph>
    <Paragraph>주문번호 #1234가 방금 발송되었습니다.</Paragraph>
    <Button href="https://...">배송 조회</Button>
  </EmailLayout.Body>

  <EmailLayout.Footer>
    <UnsubscribeLink />
    <CompanyInfo />
  </EmailLayout.Footer>
</EmailLayout>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `preheader` | `string` | — | Preview text shown in inbox; hidden in body |
| `brandColor` | `string` | system | Used for buttons, links |
| `bgColor` | `string` | `"#FAFAFA"` | Outer wrapper bg |
| `width` | `number` | `600` | Inner container width |
| `subject` | `string` | — | Used for `<title>` (read by some clients) |
| `lang` | `string` | `"ko"` | HTML `lang` attribute |
| `dir` | `"ltr" \| "rtl"` | `"ltr"` | |
| `children` | `ReactNode` | — | Body |

## Generated HTML structure

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>{subject}</title>
  <style>
    @media (max-width: 480px) {
      .container { width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#FAFAFA;">

<!-- Preheader (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;">{preheader}</div>

<!-- Outer table -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr>
    <td align="center" style="padding: 24px 0;">
      <!-- Inner container -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container" width="600" style="max-width: 600px;">
        <tr><td>{header}</td></tr>
        <tr><td>{body}</td></tr>
        <tr><td>{footer}</td></tr>
      </table>
    </td>
  </tr>
</table>

</body>
</html>
```

## Sub-components

### `<EmailLayout.Header>`

Top of email — logo. Padding 24px around.

```tsx
<EmailLayout.Header>
  <Img src="/logo.png" alt="Brand" width="120" height="40" />
</EmailLayout.Header>
```

### `<EmailLayout.Body>`

Main content. Padding 24px. White bg by default.

Composition: `<Heading>`, `<Paragraph>`, `<Button>`, `<Hr>` etc.

### `<EmailLayout.Footer>`

Legal info, unsubscribe. Smaller text.

For Korean: must include sender's company info per Korean spam law:

```
[회사명] · 사업자등록번호 123-45-67890
[서울시 강남구 테헤란로 123] · 대표 [이름]
문의: support@example.com

수신거부: [unsubscribe link]
```

## Inline CSS

All styles must be inline. Frameworks (react-email, mjml) do this automatically.

For hand-written: use a tool like `juice` or `inline-css` to inline `<style>` rules.

## Tokens consumed

Email tokens are a **subset** of the broader design system — limited to email-safe values:

```
brand color, brand-on-color, neutral-bg, neutral-bg-elevated,
text-primary, text-secondary, text-on-brand,
border-default, link-color
```

Plus typography:
- font-family-stack (with system fallback)
- font-size-xs through font-size-2xl

Don't reference tokens via CSS variables — inline only.

## Buttons (bulletproof)

The "Track order" button uses the bulletproof button pattern (table cell + styled `<a>`):

```html
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td bgcolor="#7C3AED" style="border-radius: 8px;">
      <a href="..." style="display: inline-block; padding: 14px 32px; color: #FFFFFF; text-decoration: none; font-family: sans-serif; font-size: 16px; font-weight: 600; border-radius: 8px;">
        Track order
      </a>
    </td>
  </tr>
</table>
```

Wrap as a sub-component:

```tsx
<Button href="..." style={{ background: "#7C3AED", color: "#FFFFFF" }}>
  Track order
</Button>
```

## Korean transactional template

```tsx
<EmailLayout preheader="주문번호 #1234가 발송되었습니다" lang="ko">
  <EmailLayout.Header>
    <Img src="/logo.png" alt="회사명" width="120" height="40" />
  </EmailLayout.Header>

  <EmailLayout.Body>
    <Heading style={{ fontSize: 24, fontWeight: 700 }}>
      주문이 발송되었습니다
    </Heading>

    <Paragraph>안녕하세요, {{first_name}} 님.</Paragraph>
    <Paragraph>
      주문번호 <strong>#1234</strong>가 방금 발송되었습니다.
      예상 도착일은 {{delivery_date}}입니다.
    </Paragraph>

    <Button href="https://...">배송 조회</Button>

    <Paragraph style={{ color: "#64748B", fontSize: 14, marginTop: 32 }}>
      문의사항이 있으시면 언제든 답장해 주세요.
    </Paragraph>
  </EmailLayout.Body>

  <EmailLayout.Footer>
    <Paragraph style={{ fontSize: 12, color: "#94A3B8" }}>
      [회사명] · 사업자등록번호 123-45-67890<br />
      서울시 강남구 테헤란로 123<br />
      문의: <Link href="mailto:support@example.com">support@example.com</Link>
    </Paragraph>
    <Paragraph style={{ fontSize: 12, color: "#94A3B8" }}>
      <Link href="...">수신거부</Link>
    </Paragraph>
  </EmailLayout.Footer>
</EmailLayout>
```

## Mobile responsive

The `@media (max-width: 480px)` rules in the inline `<style>` block:
- `.container { width: 100% !important; }`
- Reduce padding (24px → 16px).
- Stack horizontal items vertically.

For multi-column layouts: wrap each column in a `class="stack"` and have the media query unset float / inline-block.

## Don't

- Don't put critical info only in images (image-load-blocked clients see nothing).
- Don't use `<button>` — Outlook ignores styles.
- Don't use SVG (Outlook breaks it; use PNG).
- Don't use flexbox / grid (Outlook breaks).
- Don't use web fonts as the only font (Outlook desktop falls back).
- Don't omit preheader text.
- Don't omit unsubscribe (legal in many jurisdictions including Korea).
- Don't omit `[광고]` prefix on Korean marketing emails (legal requirement).

## References

- React Email: [react.email](https://react.email/) — modern React-based authoring.
- MJML: [mjml.io](https://mjml.io/) — markup language for emails.
- Litmus: [litmus.com](https://www.litmus.com/) — preview across clients.
- Korean spam law (정보통신망 이용촉진 및 정보보호 등에 관한 법률) — see [`knowledge/i18n/korean-publishing.md`](../knowledge/i18n/korean-publishing.md).

## Cross-reference

- [`knowledge/patterns/email-design.md`](../knowledge/patterns/email-design.md) — broader email design rules
- [`knowledge/patterns/document-typography.md`](../knowledge/patterns/document-typography.md) — body type rules
- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md) — Korean voice
- [`knowledge/i18n/korean-publishing.md`](../knowledge/i18n/korean-publishing.md) — Korean spam law
