# `BiometricGate` (custom — Korean mobile fintech) — spec

> Custom component pattern. Required for Korean fintech / banking apps. No upstream design system has this — it's a domain-specific composition over OS APIs.
>
> Cited knowledge: [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md), [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md), [`knowledge/platforms/react-native.md`](../knowledge/platforms/react-native.md)

## Purpose

Gates app entry (or a sensitive flow) behind biometric authentication: Face ID / Touch ID (iOS), fingerprint / face recognition (Android).

Korean financial apps **almost universally implement this**. Users have come to expect it for any app touching money — banking, fintech, payments, asset management. Skipping it makes the app feel insecure or unfinished.

## When to use

| Use case | Required? |
| --- | --- |
| App open (banking, KakaoPay, Toss) | Strongly expected by users |
| Before transfer / payment | Common (configurable per user) |
| Before viewing sensitive details (account number, balance) | Sometimes |
| Before changing payment methods | Sometimes |
| Before changing security settings | Yes |
| First-time setup | No — biometric is enrolled later |

## Anatomy

```
┌─────────────────────────────────────────┐
│                                         │
│           [App logo]                    │
│                                         │
│           [biometric icon]              │   ← face/fingerprint icon
│              (~80px)                    │
│                                         │
│         Face ID로 인증해 주세요          │   ← title
│         (또는 Touch ID / 지문)           │
│                                         │
│                                         │
│         [📱 Face ID 사용]                │   ← primary CTA
│         [비밀번호로 로그인]               │   ← fallback
│                                         │
└─────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| App logo | optional | Reassures user this is the legitimate app |
| Biometric icon | yes | Matches the available method (face / fingerprint) |
| Title | yes | "Face ID로 인증해 주세요" or device-appropriate |
| Description | optional | Explanation if needed |
| Primary CTA | yes | Triggers the OS biometric prompt |
| Fallback CTA | yes | Password / PIN login (always provide) |

## API

```tsx
<BiometricGate
  required
  fallbackMethod="pin"
  onSuccess={() => navigate("/dashboard")}
  onFallback={() => navigate("/login/pin")}
  onCancel={() => navigate("/login")}
  reason="개인 정보 보호를 위해 인증이 필요합니다"
  appLogo={<Logo />}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `required` | `boolean` | `true` | If false, allow skip via close button |
| `fallbackMethod` | `"pin" \| "password" \| "pattern" \| "none"` | `"pin"` | Backup auth method |
| `onSuccess` | `() => void` | — | Called when biometric succeeds |
| `onFallback` | `() => void` | — | Called when user picks fallback |
| `onCancel` | `() => void` | — | (When `required: false`) close pressed |
| `reason` | `string` | — | Shown to user; also passed to OS prompt as the reason |
| `autoTrigger` | `boolean` | `true` | Trigger OS prompt on mount automatically |
| `appLogo` | `ReactNode` | — | Decorative logo |
| `errorText` | `string` | — | Error after a failed attempt |

## OS integration

### iOS (React Native)

```ts
import * as LocalAuthentication from "expo-local-authentication";

const triggerBiometric = async () => {
  const isCompatible = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isCompatible || !isEnrolled) {
    onFallback();
    return;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason || "본인 확인",
    fallbackLabel: "비밀번호로 로그인",
    cancelLabel: "취소",
    disableDeviceFallback: false,
  });

  if (result.success) onSuccess();
  else if (result.error === "user_cancel") onCancel();
  else if (result.error === "user_fallback") onFallback();
  else setErrorText("인증에 실패했습니다");
};
```

### Android (React Native)

Same `expo-local-authentication` API; falls back to fingerprint or face on supported devices.

### Web

Web's `WebAuthn` API exists but is rarely used in Korean consumer apps. For web fintech: typically a 6-digit PIN or 본인인증 (PASS / SMS) instead.

This spec primarily targets **mobile native apps** (React Native or platform native).

## Behavior

### On mount

1. Component renders with biometric icon + CTA.
2. If `autoTrigger: true`: OS prompt opens immediately.
3. User completes biometric → `onSuccess`.
4. User cancels → `onCancel` (or stay on screen if `required`).
5. User picks "Use password" → `onFallback`.

### After failed attempt

- iOS: 3 failed attempts disable biometric for that session; user must use fallback.
- Android: similar; OS handles lockout.
- Update `errorText` with "인증에 실패했습니다. 비밀번호를 사용해 주세요."
- Don't auto-retry. User decides.

### After lockout (5+ failures)

- Biometric disabled until app is reopened.
- Prompt user to use the fallback method.
- Optionally: log out and require full sign-in.

## States

| State | Visual |
| --- | --- |
| Idle (waiting for trigger) | Icon + CTA visible |
| Authenticating | Icon pulsing or spinner overlay |
| Success | Brief checkmark, then navigate (or instant navigate) |
| Failed | Error text below icon, CTA re-enabled to retry |
| Locked out | "Biometric unavailable" text, fallback only |
| OS prompt visible | Component is dimmed; OS handles input |

## Tokens consumed

```
--color-bg-default
--color-text-primary
--color-text-secondary
--color-primary-default      (icon, primary CTA)
--color-error                (error state)
--color-success              (success checkmark)
--space-lg, --space-xl, --space-2xl
--font-size-xl, --font-size-2xl
--motion-default             (icon pulse, success checkmark)
```

## Accessibility

- Title is `<h1>` — primary message of the screen.
- Biometric icon: `aria-hidden="true"` (decorative, the title carries meaning).
- CTA button: clear `aria-label` if icon-only ("Use Face ID to sign in").
- Fallback button: visible label, easy to find — don't bury it.
- Error text: `role="alert"` so screen reader announces.
- For users who can't use biometric: fallback path must be accessible without going through the biometric prompt.

## Korean copy patterns

| Method | Title (KR) |
| --- | --- |
| Face ID (iOS) | "Face ID로 인증해 주세요" |
| Touch ID (iOS) | "Touch ID로 인증해 주세요" |
| Fingerprint (Android) | "지문으로 인증해 주세요" |
| Face (Android) | "얼굴 인식으로 인증해 주세요" |
| Generic | "본인 확인" / "생체 인증" |

| Action | Korean |
| --- | --- |
| Use Face ID | Face ID 사용 |
| Use fingerprint | 지문 사용 |
| Use password | 비밀번호로 로그인 |
| Use PIN | PIN 입력 |
| Cancel | 취소 |
| Try again | 다시 시도 |

## Code example

```tsx
function AppLaunchGate() {
  const navigate = useNavigation();
  const [error, setError] = useState<string>();

  const handleSuccess = () => navigate("/dashboard");
  const handleFallback = () => navigate("/login/pin");

  return (
    <BiometricGate
      required
      autoTrigger
      reason="대시보드를 보려면 인증이 필요합니다"
      fallbackMethod="pin"
      onSuccess={handleSuccess}
      onFallback={handleFallback}
      errorText={error}
      appLogo={<Logo />}
    />
  );
}

// As an action gate (not full screen)
function TransferConfirm() {
  const [showGate, setShowGate] = useState(false);

  return (
    <>
      <Button onClick={() => setShowGate(true)}>송금하기</Button>
      {showGate && (
        <BiometricGate
          required={false}
          reason="송금을 위해 본인 확인이 필요합니다"
          onSuccess={() => { setShowGate(false); executeTransfer(); }}
          onCancel={() => setShowGate(false)}
        />
      )}
    </>
  );
}
```

## Edge cases

- **Biometric not enrolled** (user hasn't set up Face ID / fingerprint on device): show fallback as primary, with explanation.
- **Biometric hardware not available** (older device): same — fallback only.
- **User has enrolled but disabled biometric for this app** in OS settings: show fallback + link to settings.
- **Background return** (user backgrounds app, returns): re-trigger gate based on app's session policy (typically 30 sec timeout).
- **Multiple biometric methods on Android** (face + fingerprint): OS prompt handles selection. Don't try to manage in app.
- **Server-side rejection** (biometric ok locally but server doesn't accept token): show error and route to fallback. Treat as auth failure, not biometric failure.
- **Network offline at gate**: this is local auth — should work offline. The token is verified later when network returns.
- **First time biometric on this device**: prompt before triggering ("Use Face ID for faster sign-in?") — don't surprise the user with an OS prompt cold.

## Korean app submission considerations

Per [`knowledge/i18n/korean-publishing.md`](../knowledge/i18n/korean-publishing.md):

- iOS: `NSFaceIDUsageDescription` in `Info.plist` must be in Korean for KR storefront ("Face ID를 사용하여 안전하게 로그인합니다.").
- Android: permission `USE_BIOMETRIC` (or `USE_FINGERPRINT` for older API). Permission rationale popup required for KR Play Store.
- App Store Connect: privacy policy must mention biometric data (even though it's processed on-device).

## Don't

- Don't make biometric the **only** auth method. Always provide fallback.
- Don't auto-trigger biometric on every screen — user fatigue.
- Don't trigger biometric without user-initiated action (e.g., on app launch is OK; mid-scrolling is not).
- Don't process biometric data on server. Per OS APIs, biometric verification is on-device; the server gets a token, not biometric data.
- Don't gate trivial actions behind biometric. Reserve for sensitive operations.
- Don't show biometric on web without a serious WebAuthn implementation. Use PIN / 본인인증 instead.
- Don't store biometric "results" in app state beyond the session. Re-prompt next session.
- Don't omit privacy disclosure (Korean law requires it).

## API rationale

- **`required: true` default**: matches user expectation for fintech app launch. False is the in-app action gate case.
- **`autoTrigger: true` default**: a screen with biometric should immediately attempt — making the user tap the button first adds a step.
- **`fallbackMethod` typed**: PIN / password / pattern are the realistic options. "None" rare and discouraged.
- **`reason` passed to OS prompt**: iOS shows this as the prompt subtitle. Be specific.

## Cross-reference

- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md) — biometric expectations in KR
- [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md) — payment auth context
- [`knowledge/i18n/korean-publishing.md`](../knowledge/i18n/korean-publishing.md) — privacy disclosure requirements
- [`knowledge/platforms/react-native.md`](../knowledge/platforms/react-native.md) — RN-specific implementation
- [`examples/component-modal.md`](component-modal.md) — focus management when as inline gate
