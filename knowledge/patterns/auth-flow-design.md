<!-- hand-written -->
---
title: Authentication flow design
applies_to: [signup, login, password-reset, 2fa, all-auth]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Authentication flow design

The auth flow is the most-tested screen path in any product. Conversions die here. This is the floor.

## The four flows

| Flow | Purpose |
| --- | --- |
| **Signup** | New user creates account |
| **Login** | Returning user authenticates |
| **Password reset** | User forgot password, recover |
| **2FA / verification** | Confirm identity (SMS / authenticator / 본인인증) |

Each is its own design challenge. Common mistake: treating them as one flow.

## Signup — the highest-stakes screen

The user has chosen to commit. **Don't make them work harder than necessary.**

### Length matters

Each field added to signup costs ~5–10% conversion. Cut everything that isn't critical:

| Cut | Defer to |
| --- | --- |
| Phone number | First time it's needed (2FA setup, SMS receipt) |
| Address | First checkout |
| Profile photo | Profile completion later |
| Birth date | First age-gated feature |
| Bio | Profile setup later |

### Signup minimum

Korean fintech / consumer:
- Phone (with SMS verification) OR KakaoTalk login
- Optional email
- Required terms checkbox + separate marketing-consent (legal)

Western SaaS:
- Email
- Password (or magic-link / Google OAuth)
- Optional name

For Korean SaaS B2B:
- Email + password OR SSO

### Form structure

Single column. Cite [`knowledge/patterns/form-design.md`](form-design.md):
- Labels above inputs.
- One field per row (mobile-first; can two-column in desktop for email/password).
- Required fields marked clearly; optionals tagged `(선택)`.

### Social login order (Korea)

For Korean consumer apps:

```
1. KakaoTalk 로그인         ← top, yellow brand button
2. NaverPay (or 네이버 로그인)
3. Apple로 로그인           ← legally required for iOS
4. Google로 로그인          ← required for Android distribution
─────────────────
또는
─────────────────
이메일 / 휴대폰으로 가입
```

KakaoTalk login dominates Korean B2C. Burying it below email = 30%+ conversion loss.

For B2B SaaS in Korea: email/password first, then Google / Microsoft SSO. Kakao optional.

### Honest defaults

- Marketing consent: **unchecked** by default (legal in Korea — see [`korean-publishing.md`](../i18n/korean-publishing.md)).
- "Subscribe to newsletter": separate from required terms.
- "Remember me": opt-in.
- Country: detect from IP, allow override.

### Error handling

| Error | Message |
| --- | --- |
| Email taken | "이미 가입된 이메일입니다. [로그인하기]" with link |
| Phone taken | "이미 가입된 휴대폰입니다." |
| Weak password | "비밀번호는 8자 이상이어야 합니다." (during input, not on submit) |
| Network | "네트워크 연결을 확인해 주세요." |
| Vendor down (Kakao OAuth) | "카카오 로그인이 일시적으로 불가능합니다. 다른 방법으로 가입해 주세요." |

Cite [`knowledge/patterns/form-design.md`](form-design.md) for validation timing.

## Login — fast path

Returning users want **speed**. Get out of their way.

### Layout

```
┌──────────────────────────────────────┐
│ [Logo]                                │
│                                       │
│ 로그인                                 │
│                                       │
│ ┌─────────────────────────────┐     │
│ │ 이메일                        │     │
│ └─────────────────────────────┘     │
│ ┌─────────────────────────────┐     │
│ │ 비밀번호                  👁  │     │
│ └─────────────────────────────┘     │
│                                       │
│ ☐ 자동 로그인        비밀번호 찾기 →   │
│                                       │
│ [로그인]                               │
│                                       │
│ ── 또는 ──                            │
│                                       │
│ [KakaoTalk으로 로그인]                 │
│ [Google로 로그인]                      │
│                                       │
│ 계정이 없으신가요? 가입하기 →           │
└──────────────────────────────────────┘
```

### Best practices

- **Email and password autofill**: `autocomplete="email"`, `autocomplete="current-password"`. Enables password manager + browser save.
- **Show password toggle** (eye icon).
- **Caps Lock indicator** (when password field focused) — small UI win.
- **"Remember me" checkbox** — extends session beyond default.
- **"Forgot password" link** prominent — beside or below the password field.
- **"Sign up" link** at the bottom for users who landed on login by mistake.

### Korean fintech specifics

- **KakaoTalk login** as fast-path button (often above email/password for B2C).
- **Biometric quick-login** (Face ID / fingerprint) for return visits — see [`examples/component-biometric-gate.md`](../../examples/component-biometric-gate.md).
- **PIN-only login** for fast access (after initial setup) — common in finance apps.

## Password reset — the rescue

User is locked out. The flow must be:
1. Frictionless to start
2. Secure
3. Clear about timing

### Three-step flow

```
[Email input] → [Email sent screen] → [User clicks link in email] → [New password screen] → [Login automatically]
```

### Step 1: Email input

Minimum: just email field + submit. Don't ask for security questions; they're 2010-coded.

```
┌──────────────────────────────────────┐
│ 비밀번호 찾기                         │
│                                       │
│ 가입한 이메일을 입력하시면 재설정 링크를│
│ 보내드립니다.                          │
│                                       │
│ ┌─────────────────────────────┐     │
│ │ 이메일                        │     │
│ └─────────────────────────────┘     │
│                                       │
│ [재설정 링크 보내기]                    │
└──────────────────────────────────────┘
```

### Step 2: Email sent confirmation

Show same message regardless of whether email exists (security):

```
┌──────────────────────────────────────┐
│ 이메일을 확인하세요                    │
│                                       │
│ 입력한 이메일로 비밀번호 재설정 링크를   │
│ 보내드렸습니다. 메일이 오지 않으면       │
│ 스팸함을 확인해 주세요.                │
│                                       │
│ [메일 다시 보내기]                      │
└──────────────────────────────────────┘
```

**Don't reveal**: "이 이메일로 가입된 계정이 없습니다." — this leaks user enumeration data.

### Step 3: New password

Link in email opens new-password screen:

```
┌──────────────────────────────────────┐
│ 새 비밀번호 설정                       │
│                                       │
│ 새 비밀번호                            │
│ ┌─────────────────────────────┐     │
│ │ ••••••••                  👁  │     │
│ └─────────────────────────────┘     │
│ ✓ 8자 이상                            │
│ ✓ 숫자 포함                           │
│                                       │
│ [비밀번호 변경]                        │
└──────────────────────────────────────┘
```

After success: log them in automatically. Don't ask them to log in again.

### Token expiration

Reset links must expire (typical: 1 hour). Show the user when expired:

> "이 링크는 만료되었습니다. 다시 비밀번호 찾기를 해주세요."

## 2FA / verification

After password (or as primary auth via magic link), confirm identity.

### Methods

| Method | Strength | Use |
| --- | --- | --- |
| **SMS code** | Medium (sim swap risk) | Most consumer apps; Korean default |
| **Authenticator app** (Google Authenticator, Authy) | High | Power users, B2B |
| **Email code** | Low | Fallback |
| **Hardware key** (YubiKey, etc.) | Highest | Enterprise / dev tools |
| **Biometric** (FaceID/Fingerprint) | High (device) | Mobile re-auth |
| **본인인증 (PASS)** | High (Korea-specific) | Korean fintech / banking |

For Korean fintech: SMS + 본인인증 are required by law for many transactions.

### SMS verification flow

Cite [`examples/component-input-otp.md`](../../examples/component-input-otp.md) and [`examples/component-otp-countdown.md`](../../examples/component-otp-countdown.md).

```
[Enter phone] → SMS sent → [Enter 6-digit code] (with 3-min expiry + 30s resend cooldown) → [Verified]
```

### TOTP (authenticator app) setup

```
[Show QR code] → User scans with authenticator → [Confirm with first code] → [Save backup codes]
```

Provide:
- QR code (with manual key fallback for older authenticators)
- Backup codes (10 codes, single-use, downloadable)
- "Did this work?" verification step

### Recovery

Always provide a recovery path:
- Backup codes (TOTP)
- "Use a different method" (fallback chain)
- Customer support contact (last resort)

## Magic-link auth (passwordless)

Increasingly common alternative:

1. User enters email
2. App sends one-time login link
3. User clicks link → logged in

Pros: no password to forget, no password storage on your side.
Cons: depends on email reliability; slow if email is delayed.

For Korean: less common than KakaoTalk login but rising.

## Korean-specific patterns

Per [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md):

| Pattern | Use |
| --- | --- |
| Phone-first auth | Default for consumer |
| KakaoTalk OAuth | Fastest path for B2C |
| 본인인증 (PASS) | High-value fintech / banking transactions |
| 휴대폰 인증 + 6자리 SMS code | Most common 2FA |
| 자동 로그인 (remember me) | Default opt-in for fintech (with biometric backup) |
| 보안 카드 / 공동인증서 | Legacy banking — falling out of use |

## Anti-patterns

- **Password complexity rules that block password managers**: "must include 1 uppercase, 1 lowercase, 1 digit, 1 special char, no spaces, max 16 chars" — password managers can't generate or accept this. Allow long passphrases.
- **Hidden password field with no toggle**: users mistype constantly. Show toggle (eye icon).
- **Captcha at the end of long signup**: blocks valid users. Use invisible reCAPTCHA / hCaptcha.
- **Force email verification before any product use**: lets the user explore first; nag for verification on trigger.
- **"Are you human?" check on every login**: friction adds up. Reserve for suspicious activity.
- **Login redirect breaks deep links**: user clicks `/orders/123` → redirected to login → after login goes to home (not /orders/123). Always preserve intended URL.
- **No error message** when login fails — user can't tell if email is wrong, password is wrong, or account is locked.
- **Marketing-consent default-checked** (legal violation in Korea).
- **Mixed honorific level** in error messages (~합니다 in some, ~해요 in others).

## Cross-reference

- [`knowledge/patterns/form-design.md`](form-design.md) — form orchestration
- [`knowledge/patterns/error-states.md`](error-states.md) — auth-specific errors
- [`knowledge/patterns/onboarding.md`](onboarding.md) — what comes after signup
- [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md) — KR auth conventions
- [`knowledge/i18n/korean-payments.md`](../i18n/korean-payments.md) — 본인인증 details
- [`examples/component-input-otp.md`](../../examples/component-input-otp.md) — SMS code input
- [`examples/component-otp-countdown.md`](../../examples/component-otp-countdown.md) — timer
- [`examples/component-pass-auth.md`](../../examples/component-pass-auth.md) — Korean 본인인증
- [`examples/component-biometric-gate.md`](../../examples/component-biometric-gate.md) — biometric
