# `InputOTP` (one-time password input) — spec

> Citing Ant Design `Input.OTP`, MUI (no built-in), shadcn-ui `input-otp`

## Purpose

A multi-cell input for one-time passwords / verification codes. Each digit lives in its own visual cell. Used for: SMS verification, 2FA codes, app verification (KakaoTalk login auth).

In Korean fintech: **mandatory** for SMS-based 본인인증 verification flows.

## Anatomy

```
┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐
│ 1│ │ 2│ │ 3│ │ 4│ │ 5│ │ 6│   ← 6-digit code (Korean SMS standard)
└──┘ └──┘ └──┘ └──┘ └──┘ └──┘
                                    [Resend] in 30s
```

| Slot | Required | Notes |
| --- | --- | --- |
| Cells | yes | One per digit, square boxes |
| Active cell indicator | yes | Cursor / border emphasis on current input |
| Resend button | optional | Below the input — re-request the code |

## API

```tsx
<InputOTP
  length={6}
  value={code}
  onValueChange={setCode}
  onComplete={(code) => verify(code)}
  autoFocus
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `length` | `number` | `6` | Number of cells |
| `value` | `string` | — | Current value |
| `onValueChange` | `(value: string) => void` | — | Fires on each cell change |
| `onComplete` | `(value: string) => void` | — | Fires when all cells filled |
| `autoFocus` | `boolean` | `false` | Focus first cell on mount |
| `disabled` | `boolean` | `false` | |
| `error` / `errorText` | — | — | |
| `pattern` | `"numeric" \| "alphanumeric"` | `"numeric"` | Allowed chars per cell |
| `mask` | `boolean` | `false` | Mask digits as ` • ` (security; rare for SMS codes) |
| `separator` | `ReactNode` | — | Visual separator after N cells (e.g., `-` after 3) |

## Behavior

### Per-cell typing

- User types in cell 1: digit appears, focus auto-advances to cell 2.
- Continues until all cells filled.
- On complete: `onComplete` fires.

### Backspace

- Backspace in an empty cell: focus moves back, deletes previous cell's digit.
- Backspace in a filled cell: deletes that digit, focus stays.

### Paste

User pastes a 6-digit code (e.g., from SMS). Distribute across cells:
- "123456" → cells become 1, 2, 3, 4, 5, 6.
- "12 34 56" → strip spaces, distribute.
- "123-456" → strip non-digits, distribute.
- Mid-paste: cursor lands on the last filled cell or after.

This is the most-tested path — get it right.

### Auto-fill (mobile)

iOS / Android can auto-fill SMS codes from the most recent text message. Set `autoComplete="one-time-code"` on the input:

```tsx
<input
  type="text"
  inputMode="numeric"
  autoComplete="one-time-code"
  pattern="[0-9]*"
  maxLength={1}
/>
```

iOS reads the SMS notification, extracts the code, and offers to autofill.

## States

| State | Visual |
| --- | --- |
| Empty | Cells empty, first cell focus ring |
| Active cell | Border highlighted (primary), cursor visible |
| Filled cell | Digit visible, border default |
| Complete | All filled; `onComplete` fired |
| Error | All cells red border |
| Disabled | Muted, no events |
| Loading (verifying) | Cells dimmed, spinner overlay |

## Sizes

| Size | Cell | Font | Gap |
| --- | --- | --- | --- |
| `sm` | 32×40 | 16px | 4px |
| `md` (default) | 40×48 | 20px | 8px |
| `lg` | 48×56 | 24px | 12px |

For mobile primary auth: `lg` is right (large touch targets, clear digits).

## Tokens consumed

```
--color-bg-default
--color-border-default       (cell border)
--color-border-strong         (hover)
--color-primary-default       (active cell, complete state)
--color-text-primary
--color-error                 (error state)
--color-focus-ring
--space-xs, --space-sm
--radius-md
--font-size-xl                (digit display)
--font-feature-amount: 'tnum' 1   (tabular numerals — digits align)
```

## Accessibility

- Container: `<fieldset>` with `<legend>` ("인증번호 입력").
- Each cell: `<input type="text" inputMode="numeric" maxLength={1}>` with `aria-label="N번째 자리"`.
- Group: `role="group"` for screen reader awareness.
- Error: `role="alert"` on errorText.

```html
<fieldset>
  <legend class="sr-only">인증번호 입력</legend>
  <div role="group">
    <input aria-label="1번째 자리" maxlength="1" inputmode="numeric" autocomplete="one-time-code" />
    <input aria-label="2번째 자리" maxlength="1" inputmode="numeric" />
    ...
  </div>
</fieldset>
```

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reach first cell |
| Type digit | Auto-advance to next |
| `Backspace` | Delete + go back |
| `←` / `→` | Move between cells |
| `Home` / `End` | First / last cell |
| `Cmd+V` / `Ctrl+V` | Paste full code |

## Korean SMS verification flow

Standard pattern in Korean fintech / banking:

1. User enters phone number.
2. App sends SMS via vendor (NICE, KCB, Toss).
3. SMS arrives: `[XXX 인증번호] 123456 입력해주세요.`
4. User enters code in InputOTP.
5. App verifies via vendor API.
6. Either: success → proceed; OR: 3+ failures → reset.

### Resend timer

Always include a "재전송" (resend) button with a 30–60s cooldown:

```tsx
<div>
  <InputOTP length={6} onComplete={verify} />
  <ResendButton cooldown={30} onResend={requestNewCode} />
  {/* Shows: "30초 후 재전송" → "재전송하기" after countdown */}
</div>
```

Rate-limit re-sends server-side (max 5/hour typical).

## Error states

| Cause | Message |
| --- | --- |
| Wrong code | "인증번호가 올바르지 않습니다." |
| Expired code | "인증번호가 만료되었습니다. 다시 발급해 주세요." |
| Too many attempts | "인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요." |
| Network | "네트워크 연결을 확인해 주세요." |

Clear the input on error so user can re-type.

## Code example

```tsx
function VerifyPhoneScreen({ phone }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useCountdown(30);

  const handleVerify = async (otpCode: string) => {
    setVerifying(true);
    try {
      await api.verifyCode({ phone, code: otpCode });
      navigation.navigate("Success");
    } catch (err) {
      setError(err.message);
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Page>
      <h1>인증번호 입력</h1>
      <p>{phone}로 보낸 6자리 인증번호를 입력해 주세요.</p>

      <InputOTP
        length={6}
        value={code}
        onValueChange={setCode}
        onComplete={handleVerify}
        autoFocus
        disabled={verifying}
        errorText={error}
      />

      <Button
        variant="link"
        onClick={() => { resendCode(); setCooldown(30); }}
        disabled={cooldown > 0}
      >
        {cooldown > 0 ? `${cooldown}초 후 재전송` : "재전송하기"}
      </Button>
    </Page>
  );
}
```

## Edge cases

- **Paste includes non-digits**: filter to digits only, distribute remaining across cells.
- **Paste shorter than length**: fill from start, leave rest empty.
- **Paste longer than length**: take first N digits.
- **User types fast**: each cell may flicker — make sure auto-advance doesn't skip.
- **Auto-fill replaces manual entry**: respect user's intent — auto-fill once if user hasn't typed yet; don't override mid-typing.
- **Lost focus**: when user dismisses keyboard then returns, focus the next empty cell.

## Don't

- Don't omit `autoComplete="one-time-code"` — auto-fill is a major UX win.
- Don't allow non-digit input (unless `pattern="alphanumeric"` for special cases).
- Don't reset entire input on error — let user just fix the wrong cells.
- Don't skip the resend cooldown — user-initiated DoS risk.
- Don't show the digits as plaintext in screen readers if `mask=true` was requested.
- Don't make cells too small to tap reliably (≥ 40px on mobile).

## References

- Ant Design: [`refs/ant-design/components/input/`](../refs/ant-design/components/input/) — `Input.OTP`. Length, formatting, paste handling.
- MUI: no built-in. Compose individual `<TextField>` cells.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/input-otp.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/input-otp.tsx) — wraps `input-otp` library. **Default for new projects.**

## Cross-reference

- [`examples/component-input.md`](component-input.md) — base Input
- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md) — phone-first auth + 본인인증
- [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md) — payment-related verification
- [`examples/component-biometric-gate.md`](component-biometric-gate.md) — biometric fallback path
