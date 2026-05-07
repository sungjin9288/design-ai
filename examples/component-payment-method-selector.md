# `PaymentMethodSelector` (custom — Korean) — spec

> Custom component pattern. The payment method selector is the highest-stakes screen in any e-commerce / fintech checkout. Korean conventions differ significantly from Western ones.
>
> Cited knowledge: [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md), [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md)

## Purpose

Lets the user pick how to pay during checkout: cards, wallets (KakaoPay/NaverPay/Toss), bank transfer (무통장입금), carrier billing (휴대폰결제), real-time bank transfer (계좌이체).

The order, grouping, and visual emphasis matter — Korean users have strong expectations.

## Anatomy

```
┌──────────────────────────────────────────────────┐
│ 결제 수단 선택                                     │
│                                                  │
│ ─── 간편결제 ─────────────────────────────────── │
│  ◯ [💛 KakaoPay 로고]                       >    │
│  ◯ [💚 NaverPay 로고]                        >    │
│  ◯ [💙 Toss 로고]                             >    │
│                                                  │
│ ─── 카드 ─────────────────────────────────────── │
│  ◯ 신용/체크카드                              >    │
│      [등록된 카드: 국민카드 ****-1234]              │
│                                                  │
│ ─── 기타 ─────────────────────────────────────── │
│  ◯ 휴대폰 결제                                >    │
│  ◯ 무통장 입금                                >    │
└──────────────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Section header per group | yes | "간편결제", "카드", "기타" |
| Method row | yes | Radio + brand logo + label + chevron |
| Saved-method indicator | optional | "등록된 카드: ..." |
| Selection indicator | yes | Radio (`◯` / `●`) or selected state |
| Drill-in chevron | optional | When picking opens detail screen (card list, account input) |

## API

```tsx
<PaymentMethodSelector
  value={selectedMethod}
  onValueChange={setSelectedMethod}
  availableMethods={["kakaopay", "naverpay", "toss", "card", "phone", "vbank"]}
  savedCards={user.savedCards}
  audience="consumer"
  amount={45000}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `Method \| null` | — | Selected method |
| `onValueChange` | `(method) => void` | — | |
| `availableMethods` | `Method[]` | all | Server-allowed methods |
| `savedCards` | `Card[]` | `[]` | User's pre-registered cards (display next to "신용카드") |
| `audience` | `"consumer" \| "b2b" \| "b2b-young"` | `"consumer"` | Drives ordering + emphasis |
| `amount` | `number` | — | Used to filter (e.g., 휴대폰결제 only for < ₩500K) |
| `showFees` | `boolean` | `false` | Show per-method fee disclosure |
| `disabled` | `boolean` | `false` | |

```ts
type Method =
  | "kakaopay"      // KakaoPay wallet
  | "naverpay"      // Naver Pay wallet
  | "toss"          // Toss wallet
  | "samsungpay"    // Samsung Pay
  | "card"          // Credit / debit card
  | "phone"         // 휴대폰 결제
  | "vbank"         // 무통장 입금 (virtual account)
  | "transfer";     // 계좌이체 (real-time)
```

## Method ordering by audience

Per [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md):

### Consumer (default)

```
1. KakaoPay         ← top — most-used wallet
2. NaverPay
3. Toss
─── 카드 ───────
4. Credit/debit card
─── 기타 ───────
5. 휴대폰 결제 (if amount eligible)
6. 무통장 입금
```

### B2B / Older audience

```
1. Credit/debit card     ← cards first
2. 무통장 입금
3. 계좌이체
─── 간편결제 ───────
4. KakaoPay (below the fold)
5. NaverPay
```

### Young / fintech-coded

```
1. Toss              ← Toss-first for young audience
2. KakaoPay
3. Card
4. 무통장 입금
```

## Brand button design

Each wallet brand has official assets — **don't restyle**:

| Brand | Color | Logo |
| --- | --- | --- |
| KakaoPay | Yellow `#FFCD00` | "KakaoPay" wordmark + speech-bubble icon |
| NaverPay | Green `#00C73C` | "NaverPay" wordmark + N icon |
| Toss | Blue `#3182F6` | "toss" wordmark + dot icon |
| Samsung Pay | Black + brand red | "Samsung Pay" wordmark |
| Apple Pay | Black | "Apple Pay" wordmark per Apple guidelines |

When rendering as a brand button (selected, primary CTA), use the official color as background. When rendering as a list option (radio button), brand logo on left + neutral text label on right.

See `component-payment-brand-button.md` for the brand button itself.

## Behavior

### Selection

- Click a row: select that method.
- For methods needing more info (card → which card?, vbank → which bank?): drill into a detail screen on selection.
- For one-tap wallets: just select and let the parent flow proceed.

### Saved card display

If user has saved cards and picks "신용카드":
- Show the most-recent card inline ("등록된 카드: 국민카드 ****-1234").
- Drill into card list on tap to choose another or add new.

### Method filtering by amount

Example: 휴대폰결제 typically maxes out at ₩500,000. If `amount > 500000`, hide phone option (or show disabled with "한도 초과" hint).

### Disabled methods

Server might disable certain methods per-merchant or per-user. Disabled methods stay visible but greyed out, with a brief "사용할 수 없습니다" hint.

## States

| State | Visual |
| --- | --- |
| Default | Method visible, radio empty |
| Selected | Filled radio + slight bg highlight |
| Disabled | Muted, no events, hint text |
| Hover | Bg slightly darker |

## Tokens consumed

```
--color-bg-default
--color-bg-elevated         (selected row bg)
--color-bg-subtle           (hover)
--color-primary-default     (selected radio)
--color-text-primary
--color-text-secondary       (saved-method indicator)
--color-text-tertiary        (disabled hint)
--color-text-disabled
--color-border-default
--color-focus-ring
--space-md, --space-lg
--radius-md
```

Brand colors (from each vendor's official guidelines):

```
--color-kakaopay-yellow:  #FFCD00
--color-kakaopay-text:    #000000
--color-naverpay-green:   #00C73C
--color-naverpay-text:    #FFFFFF
--color-toss-blue:        #3182F6
--color-toss-text:        #FFFFFF
```

## Accessibility

- Radio group: `<fieldset>` + `<legend>결제 수단</legend>`.
- Each row: `<input type="radio">` + `<label>`.
- Brand logos: `alt` attribute or `aria-label` (e.g., "KakaoPay 로고").
- Section headers: `<h3>` (or appropriate) for each group.
- Disabled rows: `aria-disabled="true"` with `aria-describedby` pointing to the disabled hint.
- Saved card info: announced as part of the radio label ("Credit card. 등록된 카드: 국민카드 ****-1234").

## Code example

```tsx
function CheckoutPaymentScreen() {
  const [method, setMethod] = useState<Method | null>(null);
  const user = useUser();
  const { amount } = useCart();

  const handleProceed = () => {
    if (!method) return;
    if (method === "card") {
      navigate("/checkout/select-card");
    } else if (method === "kakaopay") {
      initiateKakaoPay({ amount });
    } else if (method === "naverpay") {
      initiateNaverPay({ amount });
    }
    // ...
  };

  return (
    <Page>
      <PaymentMethodSelector
        value={method}
        onValueChange={setMethod}
        availableMethods={availableMethods}
        savedCards={user.savedCards}
        audience="consumer"
        amount={amount}
      />
      <FixedFooter>
        <p className="font-medium">총 결제 금액: ₩{amount.toLocaleString()}</p>
        <Button size="lg" disabled={!method} onClick={handleProceed}>
          결제하기
        </Button>
      </FixedFooter>
    </Page>
  );
}
```

## Edge cases

- **Saved card expired**: show with warning marker, prevent selection or prompt to update.
- **All methods disabled** (rare server config issue): show error state suggesting contact support.
- **Method selected but server rejects on attempt** (e.g., card declined): keep selection, show error, suggest different method.
- **First-time user with no saved data**: all rows show; "신용카드" requires entering card on next screen.
- **Quick-checkout with one default method**: hide selector entirely; show one row "결제: KakaoPay [변경]".
- **Multiple saved cards of same type**: show count ("등록된 카드 3장").
- **International tourist using KR app**: PayPal or 신용카드 (international) — most apps don't support; explain.

## Don't

- Don't restyle brand logos / colors — vendors require official assets.
- Don't put all methods in one flat list. Group them.
- Don't reorder by personal preference. Korean conventions are strong.
- Don't auto-select a default method. Let user choose.
- Don't show 8+ methods. If you have more, group "기타" with a drill-in.
- Don't gate the selector behind login. Allow guest checkout where possible (with explicit signup nudge).
- Don't omit fee disclosure if fees apply (legal in Korea for some categories).
- Don't make wallets less prominent than cards in consumer flows.

## API rationale

- **`audience` prop**: ordering varies dramatically. A B2B SaaS shouldn't show KakaoPay first.
- **`availableMethods` server-driven**: not all merchants accept all methods; server is the source of truth.
- **`amount` prop**: enables method filtering (휴대폰결제 cap, etc.) without consumer logic in the parent.

## Cross-reference

- [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md) — vendor selection, ordering rules, integration UX
- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md) — Korean payment conventions
- [`examples/component-payment-brand-button.md`](component-payment-brand-button.md) — the actual brand button rendering
- [`examples/component-form-controls.md`](component-form-controls.md) — radio group pattern
