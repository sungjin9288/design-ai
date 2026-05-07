# `QRCode` — spec

> Citing Ant Design `QRCode`, MUI (no built-in), shadcn-ui (no built-in)

## Purpose

Renders a QR code from a string (URL, payment ID, contact info). Used in Korean fintech (계좌이체 QR, KakaoPay QR), authentication flows, content sharing.

## Anatomy

```
┌─────────────────────┐
│ ▣ ▢ ▣ ▢ ▢ ▣ ▢ ▣    │
│ ▢ ▢ ▣ ▣ ▢ ▢ ▣ ▢    │
│ ▣ ▢ ▢ ▣ ▣ ▢ ▢ ▣    │  ← QR matrix
│ ▢ ▣ ▣ ▢ ▢ ▣ ▣ ▢    │
│ ▣ ▢ ▣ ▢ ▣ ▢ ▣ ▢    │
└─────────────────────┘
       [logo]                ← optional center logo
```

## API

```tsx
<QRCode
  value="https://app.example.com/pay/abc123"
  size={200}
  errorLevel="M"
  iconSrc="/logo.png"
  bgColor="#ffffff"
  fgColor="#000000"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | URL or text to encode |
| `size` | `number` | `160` | Pixel size (square) |
| `errorLevel` | `"L" \| "M" \| "Q" \| "H"` | `"M"` | Error correction; H tolerates more damage / supports center logo better |
| `bgColor` | `string` | `"#FFFFFF"` | |
| `fgColor` | `string` | `"#000000"` | |
| `iconSrc` | `string` | — | Center logo URL |
| `iconSize` | `number` | `40` | |
| `padding` | `number` | `16` | Quiet zone around code |
| `loading` | `boolean` | `false` | |
| `errorState` | `boolean` | `false` | Show error placeholder |

## Error correction levels

QR codes can recover from damage. Higher levels tolerate more but require more dense matrix:

| Level | Recovery | Use |
| --- | --- | --- |
| `L` | 7% | Print, small QRs without logos |
| `M` (default) | 15% | Most cases |
| `Q` | 25% | Outdoor / damaged contexts |
| `H` | 30% | Required if you put a center logo (logo replaces QR data) |

## Sizes

| Use | Size (px) |
| --- | --- |
| Inline (in a card) | 120–160 |
| Standard | 200–240 |
| Modal / dedicated screen | 280–320 |
| Full-screen sharing | 400+ |

Always render at integer pixel sizes (no fractional) — fractional pixels blur.

## Color customization

- **High contrast required**: `fg` and `bg` need ~7:1+ contrast for scanning reliability.
- **Brand colors**: tempting but risky. Black-on-white is most reliable. If using brand color: dark navy or deep purple work; avoid yellows / pastels.
- **Inverted (light fg on dark bg)**: scannable but less reliable on older devices.

## Center logo

Adding a center logo (brand mark) replaces some of the QR data. Requires error level `H` (30% recovery) for reliable scanning.

```tsx
<QRCode
  value="..."
  errorLevel="H"
  iconSrc="/logo.png"
  iconSize={size * 0.2}        // ~20% of total size
/>
```

Don't make the logo too large — exceeds QR's recovery capacity, fails to scan.

## States

| State | Visual |
| --- | --- |
| Default | QR rendered |
| Loading | Skeleton or spinner |
| Error (failed to encode) | Placeholder + retry |
| Refreshing | Brief fade (for time-limited QRs) |

For time-limited QRs (e.g., KakaoPay session-based codes): show a countdown OR auto-refresh before expiration.

## Tokens consumed

```
--color-bg-default            (default QR bg)
--color-text-primary          (default QR fg)
--color-bg-subtle             (loading skeleton)
--color-error                  (error state)
--space-md
--radius-md                    (around the QR container, not the QR itself)
```

## Accessibility

- Wrap in a labeled container: `<div role="img" aria-label="QR 코드: payment session abc123">`.
- Provide a **text alternative** as a fallback:
  ```tsx
  <QRCode value={url} />
  <p>또는 직접 방문: <a href={url}>{url}</a></p>
  ```
- For session-based QRs (KakaoPay, banking): provide an alternative input method (manual code entry).

## Korean fintech use cases

- **계좌이체 QR**: 송금자가 받는 계좌의 QR을 스캔 → 계좌번호 자동 입력
- **결제 QR**: 사장님 화면에 QR → 손님이 KakaoPay/NaverPay로 스캔 → 결제
- **인증 QR**: 본인인증 / 로그인 — 모바일 앱이 QR을 보여주고 데스크톱이 스캔 (또는 반대)
- **공유 QR**: 가게 정보, 친구 추천 코드 등

For 결제 QR: the QR usually encodes a session token + payment URL, refreshing every ~60s for security. Implement with `key={refreshKey}` to force re-render on refresh.

## Code example

```tsx
// Static URL
<QRCode value="https://example.com/me" size={200} />

// Payment QR with logo and time limit
function PaymentQRScreen({ session }) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      session.refresh();
      setRefreshKey(k => k + 1);
    }, 60_000);
    return () => clearInterval(timer);
  }, [session]);

  return (
    <div className="flex flex-col items-center">
      <QRCode
        key={refreshKey}
        value={session.paymentUrl}
        size={280}
        errorLevel="H"
        iconSrc="/brand.png"
        iconSize={56}
      />
      <p className="text-sm text-text-secondary">
        QR이 자동 갱신됩니다 · 60초 후 갱신
      </p>
      <p className="mt-2">
        결제 금액: <strong>₩{amount.toLocaleString()}</strong>
      </p>
    </div>
  );
}
```

## Edge cases

- **Very long URL** encoded: QR matrix becomes dense. Cap to ~500 chars; for longer, shorten via your own URL shortener service.
- **No internet** at scan time: pre-encode locally; don't rely on online encoding service.
- **Color-blind users**: don't use red/green for QR — black or dark navy on white.
- **Print at small size**: use error level `Q` or `H` and minimum 25mm physical size.
- **Encoding errors**: if `value` is unencodable (rare), show fallback with the text URL plain.

## Don't

- Don't restyle a QR with very low contrast — defeats the purpose.
- Don't put logo without error level `H`.
- Don't omit text alternative — assistive tech can't read QRs.
- Don't make the user wait > 1s for QR to render. Pre-compute when possible.
- Don't use animated QR (rotating, color-changing). It's a static identifier — animation breaks scans.

## References

- Ant Design: [`refs/ant-design/components/qr-code/`](../refs/ant-design/components/qr-code/) — `QRCode` with all options.
- MUI: no built-in. Use libraries like `qrcode.react` or `react-qr-code`.
- shadcn-ui: no built-in. Use libraries.

Common libraries:
- `qrcode` (Node-style, can run in browser)
- `qrcode.react` (React component)
- `react-qr-code` (lightweight)

## Cross-reference

- [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md) — KakaoPay/NaverPay QR contexts
- [`examples/component-payment-method-selector.md`](component-payment-method-selector.md) — QR as a payment option
