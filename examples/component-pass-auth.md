# `PASSAuth` (custom — Korean 본인인증) — spec

> Korean fintech custom component. Wraps the PASS app / NICE / KCB 본인인증 flow into a single React component. Required for any Korean financial app handling transactions over ~₩500,000 OR account creation in regulated categories.

## Purpose

Verifies a Korean user's real-name identity via:
- **PASS app** — modern primary path (KT/SKT/LGU+ joint app)
- **SMS-based 본인인증** — fallback (older users, no PASS app)
- **공동인증서** — legacy path (rare, falling out of use)

Returns a `verificationToken` that the server can use to confirm with the vendor API (NICE / KCB / NICE-pass).

## When to use

| Required | Optional |
| --- | --- |
| Financial transactions > ~₩500K | Account creation (most apps) |
| Stock account opening | Subscription with auto-billing |
| Insurance enrollment | Refund processing for high-value |
| Real-name account verification | KYC for crypto exchanges |
| Age-gated content | |
| Mobile carrier signup | |
| Securities apps (legal) | |

## Anatomy

```
┌─────────────────────────────────────────────────┐
│                                                  │
│   본인인증이 필요합니다                            │  ← title
│   안전한 거래를 위해 본인인증을 진행해 주세요.       │  ← description
│                                                  │
│   ┌────────────────────────────────────┐         │
│   │ [PASS] PASS 앱으로 인증              │   →   │  ← primary path
│   └────────────────────────────────────┘         │
│   ┌────────────────────────────────────┐         │
│   │ [SMS] SMS로 인증                    │   →   │  ← fallback
│   └────────────────────────────────────┘         │
│                                                  │
│   ┌────────────────────────────────────┐         │
│   │ 공동인증서 (보안카드)               │   →   │  ← legacy, rare
│   └────────────────────────────────────┘         │
│                                                  │
│   인증 시 약 1분이 소요됩니다.                     │  ← duration hint
│                                                  │
└─────────────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Title | yes | "본인인증이 필요합니다" |
| Description | yes | Why; what happens next |
| PASS button | yes | Primary path (most users) |
| SMS button | yes | Fallback |
| 공동인증서 button | optional | Legacy; show only if needed |
| Duration hint | yes | Manages user expectations |

## API

```tsx
<PASSAuth
  vendor="nice"
  reason="송금을 위해 본인 확인이 필요합니다"
  amount={500000}                      // for high-value transactions
  onSuccess={(token) => {
    api.verifyTransaction(token);
    navigate("/transfer/confirm");
  }}
  onCancel={() => navigate(-1)}
  onError={(err) => toast.error(err.message)}
  preferredMethod="pass"
  allowedMethods={["pass", "sms"]}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `vendor` | `"nice" \| "kcb" \| "kakao"` | `"nice"` | Identity vendor |
| `reason` | `string` | — | Required. Shown to user + passed to vendor. |
| `amount` | `number` | — | Optional. For high-value transactions. |
| `onSuccess` | `(token: string, info: VerifiedInfo) => void` | — | |
| `onCancel` | `() => void` | — | |
| `onError` | `(error: VerificationError) => void` | — | |
| `preferredMethod` | `"pass" \| "sms" \| "cert"` | `"pass"` | Default highlighted button |
| `allowedMethods` | `Method[]` | `["pass", "sms"]` | Which methods to show |
| `requireRealName` | `boolean` | `true` | Require real-name verification (vs anonymous identity check) |

```ts
type VerifiedInfo = {
  name: string;             // real name
  birthDate: string;        // YYYYMMDD
  gender: "M" | "F";
  ci: string;               // 89-byte connecting info (server-stored only)
  di: string;               // duplicate info (per service)
  phoneNumber: string;
  carrier: "SKT" | "KT" | "LGU+" | "MVNO";
};

type VerificationError = {
  code: "user_cancel" | "timeout" | "info_mismatch" | "carrier_unsupported" | "vendor_error";
  message: string;
};
```

## Vendor differences

| Vendor | Strengths | Use |
| --- | --- | --- |
| **NICE** | Most market share, all 3 carriers, PASS support | Default for new fintech |
| **KCB** | Banking + securities focus | When already integrated for credit |
| **KakaoPay** (간편 본인인증) | Frictionless if user has Kakao | B2C consumer where Kakao is prevalent |

For most apps: NICE is the safe default.

## Behavior

### PASS app flow

1. User taps "PASS 앱으로 인증".
2. Component calls vendor SDK → opens PASS app.
3. User authenticates in PASS app (fingerprint / face / PIN).
4. PASS app returns to your app via deep link with token.
5. `onSuccess(token, info)` fires.

### SMS flow

1. User taps "SMS로 인증".
2. Sub-screen: phone input + carrier dropdown.
3. User enters phone number → SMS sent.
4. User enters 6-digit code in `InputOTP`.
5. Vendor verifies → `onSuccess`.

Cite [`examples/component-input-otp.md`](component-input-otp.md) for the OTP step.

### Error states

| Error | What user sees |
| --- | --- |
| `user_cancel` | Return to previous screen (no error toast) |
| `timeout` | "인증 시간이 초과되었습니다. 다시 시도해 주세요." |
| `info_mismatch` | "본인 정보가 일치하지 않습니다." (don't say which field) |
| `carrier_unsupported` | "이용하시는 통신사는 지원되지 않습니다. 고객센터로 문의해 주세요." |
| `vendor_error` | "일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요." |

## States

| State | Visual |
| --- | --- |
| Idle | Method buttons visible |
| Initiating PASS | "PASS 앱을 여는 중..." with spinner |
| In PASS / SMS flow | This component dimmed; vendor UI in foreground |
| Verifying | Spinner + "인증 확인 중..." |
| Success | Brief checkmark, then navigate (or instant) |
| Failed | Error message + retry CTA |

## Tokens consumed

```
--color-bg-default
--color-bg-elevated
--color-text-primary
--color-text-secondary
--color-primary-default       (preferred method button)
--color-error                  (error state)
--color-success                 (success)
--space-md, --space-lg
--radius-md
--font-size-base, --font-size-lg
--motion-default
```

## Accessibility

- Title is `<h1>` for the screen.
- Description is `<p>`.
- Method buttons: standard `<button>` with `aria-label` describing the method.
- For users without PASS app: SMS path must work fully.
- Sub-screen for SMS: focus trap + back button.

## Privacy + compliance

This is sensitive data. The component:
- **Does not log or persist `info` client-side.** Pass token + info to server immediately.
- **Server stores only what's necessary** (CI/DI typically; not full info).
- **No screenshots / screen recording** of the PASS / vendor screens.
- **Privacy disclosure**: app must declare 본인인증 in privacy policy.

Cite [`knowledge/i18n/korean-publishing.md`](../knowledge/i18n/korean-publishing.md) for legal requirements.

## Code example

```tsx
function HighValueTransferConfirm({ amount, recipient }: Props) {
  const [authOpen, setAuthOpen] = useState(false);

  const handleAuth = (token: string, info: VerifiedInfo) => {
    setAuthOpen(false);
    // Pass to server immediately; don't persist client-side
    executeTransfer({ amount, recipient, verificationToken: token });
  };

  return (
    <>
      <Page>
        <Heading>송금 확인</Heading>
        <p>{recipient.name} 님에게 ₩{amount.toLocaleString()} 송금</p>
        <Button onClick={() => setAuthOpen(true)}>본인인증 후 송금</Button>
      </Page>

      {authOpen && (
        <Sheet open onOpenChange={setAuthOpen}>
          <PASSAuth
            vendor="nice"
            reason={`${recipient.name} 님에게 ₩${amount.toLocaleString()} 송금`}
            amount={amount}
            onSuccess={handleAuth}
            onCancel={() => setAuthOpen(false)}
            preferredMethod="pass"
          />
        </Sheet>
      )}
    </>
  );
}
```

## Edge cases

- **No PASS app installed**: detection via deep link timeout. Fall back to SMS.
- **Foreign phone (no Korean carrier)**: SMS path fails. Show "한국 휴대폰만 지원됩니다" message.
- **Outdated PASS app**: prompt to update.
- **Vendor temporarily down**: show "일시적인 문제" with retry.
- **Parental verification** (under-14 users): different flow + parent's identity. Out of scope; document separately.
- **Foreign worker / 외국인등록증**: alternative ID flow; contact vendor for SDK options.

## Don't

- Don't roll your own verification — use a licensed vendor.
- Don't store CI / DI / personal info client-side.
- Don't let users skip 본인인증 for actions that legally require it.
- Don't show 본인인증 for trivial actions — user fatigue + cost (~₩70-200 per call).
- Don't omit privacy disclosure.
- Don't translate the vendor's UI — they handle locale.
- Don't take screenshots of the verification UI.

## References

This is a Korean-market-specific custom pattern. No upstream design system has it.

Vendor SDKs:
- NICE 본인인증: [niceapi.co.kr](https://www.niceapi.co.kr/)
- KCB 본인인증: [kcb.co.kr](https://www.kcb.co.kr/)
- PASS 인증: included in NICE/KCB SDK

For implementation: each vendor provides JS SDK + iOS / Android SDKs. React wrapper typically built in-house.

## Cross-reference

- [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md) — broader payment + 본인인증 context
- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md) — when 본인인증 is required
- [`knowledge/i18n/korean-publishing.md`](../knowledge/i18n/korean-publishing.md) — legal compliance
- [`examples/component-biometric-gate.md`](component-biometric-gate.md) — biometric (different from 본인인증)
- [`examples/component-input-otp.md`](component-input-otp.md) — SMS code input
- [`examples/component-modal.md`](component-modal.md) — Sheet wrapping
