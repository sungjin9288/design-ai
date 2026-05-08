# `OTPCountdown` (custom — Korean SMS verification timer) — spec

> Korean fintech custom component. Pairs with `InputOTP` to manage SMS code resend cooldown + expiration timer. Shipped in every Korean SMS-auth flow.

## Purpose

Show:
1. **Time until code expires** (typically 3 minutes for SMS verification).
2. **Time until resend allowed** (typically 30–60 seconds cooldown).
3. **Resend button** when cooldown completes.

Without this: users frustrate themselves by tapping "재전송" repeatedly OR don't know when they can re-request.

## Anatomy

```
┌─────────────────────────────────────┐
│  인증번호 입력                        │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐    │
│  │ 1│ │ 2│ │ 3│ │ 4│ │ 5│ │ 6│    │  ← InputOTP
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘    │
│                                       │
│  남은 시간: 02:47                      │  ← code expiration
│  [재전송하기]                          │  ← becomes active after cooldown
│  (30초 후 재전송 가능)                  │  ← cooldown indicator (alternates with button)
└─────────────────────────────────────┘
```

## API

```tsx
<>
  <InputOTP length={6} value={code} onValueChange={setCode} onComplete={verify} />
  <OTPCountdown
    expiresAt={codeExpiresAt}             // 3 min from issue
    cooldownSeconds={30}                   // resend cooldown
    onResend={requestNewCode}
    onExpired={() => setError("인증번호가 만료되었습니다.")}
  />
</>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `expiresAt` | `Date \| number` | — | When the code expires (Date or unix ms) |
| `cooldownSeconds` | `number` | `30` | Seconds before resend allowed |
| `onResend` | `() => void \| Promise<void>` | — | Trigger new code request |
| `onExpired` | `() => void` | — | Fired when expiresAt reached |
| `expiredMessage` | `string` | `"인증번호가 만료되었습니다"` | When code expires |
| `disabled` | `boolean` | `false` | Disable both timer + resend |

## Behavior

### Expiration timer

- Counts down from now to `expiresAt`.
- Format: `mm:ss` for typical 3-min window. `0:30` when under 1 min.
- Color shift to warning when < 30s remaining.
- At 0: fires `onExpired`, shows expired message, disables InputOTP.

### Resend cooldown

- Starts at `cooldownSeconds` after component mount (or after each resend).
- Shows "30초 후 재전송 가능" while counting down.
- At 0: replaces with active "재전송하기" button.
- Tapping resend: triggers `onResend`, restarts both timers (cooldown + expiration).

### State machine

```
              ┌──────────┐
              │ initial  │ ← timer starts, cooldown counts down
              └─────┬────┘
                    │ cooldown reaches 0
                    ▼
              ┌──────────────┐
              │ resend ready │ ← button visible + active
              └─────┬────────┘
                    │ user taps resend
                    ▼
              ┌──────────┐
              │ resending│ ← spinner; new request to server
              └─────┬────┘
                    │ server returns new code expiry
                    ▼  (loop back to initial with new timers)

OR (independent):
                    │ expiresAt reached
                    ▼
              ┌──────────┐
              │ expired  │ ← onExpired fires; ui shows message
              └──────────┘
```

## States

| State | Visual |
| --- | --- |
| Initial — counting down | "남은 시간 02:47" + cooldown indicator |
| Cooldown done | "재전송하기" button active |
| Expiration warning (<30s) | Timer text in `--color-warning` |
| Expired | "인증번호가 만료되었습니다" + reload button |
| Resending | Button shows spinner; cooldown restarts after success |
| Disabled | All elements muted |

## Tokens consumed

```
--color-text-primary       (timer)
--color-text-secondary      (cooldown indicator)
--color-warning             (timer warning <30s)
--color-error               (expired)
--color-primary-default     (active resend button)
--color-text-tertiary       (disabled cooldown)
--space-sm, --space-md
--font-feature-amount: 'tnum'   (digits align)
--font-size-sm, --font-size-base
--motion-fast
```

## Tabular numerals (critical)

Timer "02:47" → "02:46" → "02:45" must not visually shift width. Use `font-feature-settings: 'tnum'` so digits are equal-width.

## Korean copy

| State | Copy |
| --- | --- |
| Time remaining | "남은 시간 mm:ss" or "유효시간 mm:ss" |
| Cooldown | "N초 후 재전송 가능" |
| Resend ready | "재전송하기" |
| Resending | "재전송 중..." |
| Expired | "인증번호가 만료되었습니다. 다시 발급받아 주세요." |
| Re-issue button | "인증번호 재발급" |

## Accessibility

- Timer in `<span aria-live="off">` — don't announce every second (chatter).
- Update `aria-label` at milestones: "1분 남음", "30초 남음", "만료됨".
- Resend button: standard a11y, `aria-disabled` when in cooldown.
- Screen reader on expiration: announce once via `role="alert"`.

## Implementation hints

```tsx
function OTPCountdown({ expiresAt, cooldownSeconds, onResend, ... }: Props) {
  const [now, setNow] = useState(Date.now());
  const [cooldownEnd, setCooldownEnd] = useState(Date.now() + cooldownSeconds * 1000);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);  // 500ms is enough; UI shows seconds
    return () => clearInterval(id);
  }, []);

  const expiresMs = Math.max(0, expiresAt - now);
  const cooldownMs = Math.max(0, cooldownEnd - now);

  // ... render based on state
}
```

For server clock skew: pair `expiresAt` from server with a periodic time-sync. For 3-min SMS windows, ±5 seconds skew is tolerable.

## Code example

```tsx
function VerifyPhoneScreen({ phone }: Props) {
  const [code, setCode] = useState("");
  const [codeIssue, setCodeIssue] = useState({
    expiresAt: Date.now() + 3 * 60 * 1000,
    issuedAt: Date.now(),
  });
  const [error, setError] = useState<string>();

  const handleResend = async () => {
    const result = await api.resendCode({ phone });
    setCodeIssue({
      expiresAt: result.expiresAt,
      issuedAt: Date.now(),
    });
    setCode("");  // clear input
  };

  const handleVerify = async (otpCode: string) => {
    try {
      await api.verifyCode({ phone, code: otpCode });
      navigate("/success");
    } catch (err) {
      setError(err.message);
      setCode("");
    }
  };

  return (
    <Page>
      <Heading>인증번호 입력</Heading>
      <p>{phone}로 보낸 6자리 인증번호를 입력해 주세요.</p>

      <InputOTP
        length={6}
        value={code}
        onValueChange={setCode}
        onComplete={handleVerify}
        autoFocus
        errorText={error}
      />

      <OTPCountdown
        expiresAt={codeIssue.expiresAt}
        cooldownSeconds={30}
        onResend={handleResend}
        onExpired={() => setError("인증번호가 만료되었습니다. 재발급 받아주세요.")}
      />
    </Page>
  );
}
```

## Edge cases

- **User backgrounds the app, returns minutes later**: timer continues based on real time (not React Time). On return: re-render with current diff.
- **Server-issued expiry slightly off from client clock**: tolerate ±5s.
- **Multiple rapid resends**: rate-limit via cooldown. If user spams tap: button stays cooldown.
- **Page navigation away + back**: timer state should persist (URL search params or shared store) — otherwise re-issuing on every nav is annoying.
- **Slow network on resend**: button stays in "재전송 중..." state until response. Don't allow second tap.

## Don't

- Don't restart the expiration timer on resend without re-issuing a new code from server.
- Don't omit cooldown — users will spam-resend, server-side rate-limit will kick in confusingly.
- Don't update timer every 100ms (60Hz updates are wasteful for a 1-second display).
- Don't expire silently — user must know.
- Don't allow more than 3-5 resends per session (typical Korean carrier limit).

## References

No upstream component matches exactly. This is a Korean-market-specific composition over `InputOTP` + countdown logic.

## Cross-reference

- [`examples/component-input-otp.md`](component-input-otp.md) — pairs with this
- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md) — Korean phone-auth conventions
- [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md) — broader 본인인증
- [`examples/component-pass-auth.md`](component-pass-auth.md) — full PASS / 본인인증 wrapper
