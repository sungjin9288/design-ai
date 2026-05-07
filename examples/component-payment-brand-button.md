# `PaymentBrandButton` (custom — Korean) — spec

> Custom component for KakaoPay / NaverPay / Toss / Apple Pay / Samsung Pay branded buttons.
>
> Vendors require their official asset use. Don't restyle. This component encapsulates correct rendering + interaction.

## Purpose

Renders a vendor-branded one-tap payment button. Used in:
- Checkout shortcut: "Pay with KakaoPay"
- Buy-now flows (Toss merchant button)
- Login shortcuts (KakaoPay / Toss are also identity providers)
- Standalone CTAs (Buy with NaverPay)

The selector ([`component-payment-method-selector.md`](component-payment-method-selector.md)) lists multiple methods; this component renders one method as a brand-styled CTA.

## Anatomy

```
KakaoPay (yellow):              NaverPay (green):
┌────────────────────────┐      ┌────────────────────────┐
│ [💛]  Pay with KakaoPay│      │ [N]  Pay with NaverPay │
└────────────────────────┘      └────────────────────────┘

Toss (blue):                    Apple Pay (black):
┌────────────────────────┐      ┌────────────────────────┐
│ [t.] Toss로 결제        │      │   [logo] Apple Pay     │
└────────────────────────┘      └────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Brand logo | yes | Official asset, fixed aspect ratio |
| Label | yes (most brands) | "Pay with [Brand]" or KR equivalent |
| Loading spinner | when authenticating | Replaces label, brand color background |

## API

```tsx
<PaymentBrandButton
  brand="kakaopay"
  amount={45000}
  onClick={initiateKakaoPay}
  loading={isInitiating}
  size="lg"
  fullWidth
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `brand` | `"kakaopay" \| "naverpay" \| "toss" \| "applepay" \| "samsungpay" \| "tosspayments"` | — | Required |
| `onClick` | `() => void` | — | Required. Triggers the brand SDK. |
| `amount` | `number` | — | Optional. Some brands display amount in button (e.g., "Pay ₩45,000 with KakaoPay") |
| `label` | `string` | derived from brand + locale | Override default label |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |
| `fullWidth` | `boolean` | `false` | |
| `loading` | `boolean` | `false` | Spinner replaces label |
| `disabled` | `boolean` | `false` | |

## Brand assets — official requirements

**Critical**: each vendor publishes brand guidelines. Following them is **required** by their merchant agreements.

| Brand | Background | Logo | Text color | Min height | Notes |
| --- | --- | --- | --- | --- | --- |
| **KakaoPay** | `#FFCD00` (yellow) | Speech-bubble icon + "kakao pay" wordmark | `#000000` (black) | 44px | Official assets at [pay.kakao.com](https://developers.kakaopay.com/) |
| **NaverPay** | `#00C73C` (green) | "N" + "Pay" wordmark | `#FFFFFF` (white) | 44px | Naver brand kit |
| **Toss** | `#3182F6` (blue) | "toss" lowercase wordmark | `#FFFFFF` (white) | 44px | Toss merchant guidelines |
| **Apple Pay** | `#000000` (black) | Apple Pay logo | `#FFFFFF` (white) | 44px | Strict — see Apple PassKit guidelines. Available only on iOS / Safari. |
| **Samsung Pay** | `#000000` (black) | Samsung Pay logo | `#FFFFFF` (white) | 44px | Samsung Pay developer guidelines |

**Don't**:
- Don't change the background color.
- Don't replace the logo with your own.
- Don't add additional brand colors (no 2-color KakaoPay).
- Don't add custom text styling that conflicts with the wordmark.
- Don't use the brand name without the logo.

## Korean localized labels

| Brand | Korean label |
| --- | --- |
| KakaoPay | "카카오페이 결제" or "카카오페이로 결제" |
| NaverPay | "네이버페이 결제" |
| Toss | "토스로 결제" |
| Apple Pay | "Apple Pay" (don't translate) |
| Samsung Pay | "Samsung Pay" (don't translate) |

If `amount` is provided:
- "카카오페이로 ₩45,000 결제"

## Sizes

Per brand guidelines, minimum height is **44px** (mobile touch target). Recommended:

| Size | Height | Min width | Use |
| --- | --- | --- | --- |
| `sm` | 36px | 120px | Inline with other content (rare) |
| `md` (default) | 44px | 160px | Standard CTA |
| `lg` | 56px | 240px | Hero / primary checkout |

For mobile primary checkout: `lg` + `fullWidth: true`.

## States

| State | Visual |
| --- | --- |
| Default | Brand color bg, logo + label |
| Hover | Subtle darken / opacity 0.92 |
| Active (press) | Slight darken / scale 0.98 |
| Focus-visible | 2px ring (use `--color-focus-ring`, ensure 3:1 against brand bg) |
| Loading | Logo + spinner replaces label; bg remains brand color |
| Disabled | Opacity 0.5, no events |

## Tokens consumed

In addition to the brand-specific tokens (above), inherits:

```
--color-focus-ring
--color-on-brand-yellow      (computed: #000 for KakaoPay, etc.)
--space-sm, --space-md
--radius-md
--font-size-base, --font-size-lg
--font-weight-semibold
--motion-fast, --easing-out
```

## Accessibility

- Render as `<button>`. Never `<div onClick>`.
- `aria-label` includes brand + action ("Pay 45,000 won with KakaoPay") if the visible text is just "KakaoPay 결제".
- Logo: `aria-hidden="true"` (the label carries meaning).
- Loading state: `aria-busy="true"`.
- Disabled state: `aria-disabled="true"` + native `disabled`.
- Focus indicator: brand-color buttons need a custom focus ring that clears 3:1 against the brand background. Often a 2px ring offset 2px in `--color-bg-default` works (page background visible behind ring).

## Behavior

### Click flow

1. User taps button.
2. Button enters loading state.
3. Brand SDK opens (popup, redirect, or wallet app handoff).
4. User authenticates / approves in the brand UX.
5. SDK callback returns success or failure.
6. Button exits loading; parent flow handles outcome.

### SDK initialization

This component wraps `onClick`. The `onClick` is responsible for calling the brand SDK:

```ts
const initiateKakaoPay = async () => {
  setLoading(true);
  try {
    const result = await window.Kakao.Pay.requestPayment({
      cid: "TC0ONETIME",
      partner_order_id: orderId,
      partner_user_id: userId,
      item_name: orderName,
      total_amount: amount,
      // ...
    });
    onSuccess(result);
  } catch (err) {
    onError(err);
  } finally {
    setLoading(false);
  }
};
```

The SDK setup (script load, init) happens at app bootstrap; the button just triggers.

## Code example

```tsx
function CheckoutFooter({ amount, orderId }: Props) {
  const [loading, setLoading] = useState<Brand | null>(null);

  const handlePay = async (brand: Brand) => {
    setLoading(brand);
    try {
      const result = await initiatePayment(brand, { amount, orderId });
      navigate(`/orders/${result.orderId}/success`);
    } catch (err) {
      toast.error("결제에 실패했습니다", { description: err.message });
    } finally {
      setLoading(null);
    }
  };

  return (
    <FixedFooter className="space-y-2">
      <PaymentBrandButton
        brand="kakaopay"
        amount={amount}
        size="lg"
        fullWidth
        loading={loading === "kakaopay"}
        disabled={loading !== null}
        onClick={() => handlePay("kakaopay")}
      />
      <PaymentBrandButton
        brand="naverpay"
        size="lg"
        fullWidth
        loading={loading === "naverpay"}
        disabled={loading !== null}
        onClick={() => handlePay("naverpay")}
      />
      <Button variant="outline" size="lg" fullWidth onClick={() => navigate("/checkout/card")}>
        다른 결제 수단
      </Button>
    </FixedFooter>
  );
}
```

## Edge cases

- **Brand not available on platform**: Apple Pay only on iOS Safari + WebKit-iOS. Hide the button on unsupported platforms; don't show as "disabled".
- **Brand SDK fails to load**: log + show non-brand fallback. Don't show a button that won't work.
- **User dismisses brand modal mid-flow**: button returns to default state, no error toast (user-cancelled, not failure).
- **Network drops mid-payment**: server-side webhook reconciles; UI shows "결제 처리 중..." until resolved.
- **A/B testing brand button styles**: don't. Brands require official assets — no creative variants.
- **Dark mode**: brand assets are designed for light bg. KakaoPay yellow on dark bg is jarring. Some brands publish dark-mode variants; check guidelines.

## Don't

- Don't restyle brand colors / logos / wordmarks.
- Don't omit the brand logo.
- Don't combine multiple brand logos in one button (e.g., "KakaoPay or NaverPay" — make them separate buttons).
- Don't disable the button after loading without showing an error.
- Don't show 5+ brand buttons on one screen — overwhelming. Group via `PaymentMethodSelector` instead.
- Don't translate the wordmark ("kakao pay" stays English even on Korean app — that's the brand).
- Don't use brand buttons for non-payment actions (login, sharing). Different buttons for different purposes.

## References

- KakaoPay Developers: [https://developers.kakaopay.com/](https://developers.kakaopay.com/)
- NaverPay merchant: [https://developer.pay.naver.com/](https://developer.pay.naver.com/)
- Toss Payments: [https://docs.tosspayments.com/](https://docs.tosspayments.com/)
- Apple Pay HIG: [https://developer.apple.com/design/human-interface-guidelines/apple-pay](https://developer.apple.com/design/human-interface-guidelines/apple-pay)
- Samsung Pay developers: [https://pay.samsung.com/developers](https://pay.samsung.com/developers)

## Cross-reference

- [`examples/component-payment-method-selector.md`](component-payment-method-selector.md) — selector that includes these buttons
- [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md) — vendor selection rules
- [`knowledge/a11y/contrast.md`](../knowledge/a11y/contrast.md) — focus ring contrast on brand-colored buttons
