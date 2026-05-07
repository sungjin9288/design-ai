# `PaymentReceipt` (custom — Korean fintech) — spec

> Custom component pattern. Korean payment apps render post-purchase receipts in a distinctive layout — dotted divider lines, structured price breakdown, KakaoPay-style summary card.

## Purpose

Displays a payment confirmation receipt: items, subtotal, discounts, fees, total, payment method, timestamp. Used after checkout, in transaction detail screens, in 1:1 inquiries.

## Anatomy

```
┌─────────────────────────────────────────┐
│      ✓                                  │
│   결제가 완료되었습니다                    │  ← header
│   2026.05.07 14:30:25                    │
│                                          │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│  ← dotted divider (Korean receipt convention)
│                                          │
│  주문번호  ORD-2026-001234                │
│  상점     스타벅스 강남점                   │
│  결제수단  KakaoPay                       │
│                                          │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│                                          │
│  아메리카노 (Tall)         ₩4,500         │  ← items
│  카페라떼 (Grande)         ₩5,500         │
│                                          │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│                                          │
│  상품 합계                ₩10,000          │  ← breakdown
│  할인                     -₩1,000          │
│  ─────────────                          │
│  총 결제 금액              ₩9,000          │  ← total (bold, larger)
│                                          │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│                                          │
│  [영수증 공유]   [재구매]                  │  ← actions
└─────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Header | yes | Status icon + "결제 완료" + timestamp |
| Order metadata | yes | 주문번호, 상점, 결제수단 |
| Items | usually | Each item with name + price |
| Subtotal breakdown | yes | 상품 합계, 할인, 배송, 부가세 |
| Total | yes | Bold, larger |
| Actions | optional | 영수증 공유 / 재구매 / 취소 |
| Dotted dividers | yes | Korean receipt convention |

## API

```tsx
<PaymentReceipt
  status="completed"
  timestamp={order.completedAt}
  orderId={order.id}
  merchant={order.merchant}
  paymentMethod="KakaoPay"
  items={order.items}
  subtotal={order.subtotal}
  discount={order.discount}
  shipping={order.shipping}
  tax={order.tax}
  total={order.total}
  actions={[
    { label: "영수증 공유", onClick: shareReceipt },
    { label: "재구매", onClick: reorder },
  ]}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `status` | `"completed" \| "pending" \| "cancelled" \| "refunded"` | — | Drives header icon + color |
| `timestamp` | `Date \| string` | — | When |
| `orderId` | `string` | — | |
| `merchant` | `string` | — | Store / business name |
| `paymentMethod` | `string` | — | "KakaoPay", "신한카드 ****-1234", etc. |
| `items` | `Item[]` | — | Line items |
| `subtotal` | `number` | — | Sum of items |
| `discount` | `number` | — | Negative number |
| `shipping` | `number` | — | |
| `tax` | `number` | — | |
| `total` | `number` | — | Final amount paid |
| `actions` | `Action[]` | — | Buttons at bottom |
| `cancellable` | `boolean` | `false` | Show cancel option |
| `refundable` | `boolean` | `false` | Show refund request option |

```ts
type Item = {
  name: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
};
```

## Status → header

| Status | Icon | Color | Title |
| --- | --- | --- | --- |
| `completed` | ✓ | success | "결제가 완료되었습니다" |
| `pending` | ⏳ | warning | "결제 처리 중입니다" |
| `cancelled` | ✕ | error | "결제가 취소되었습니다" |
| `refunded` | ↶ | neutral | "환불 완료" |

## Sizes / variants

| Variant | Use |
| --- | --- |
| `default` | Order detail screen / receipt detail |
| `compact` | List-row preview |
| `print` | Print-optimized (no actions, plain colors) |

## Dotted divider

The `─ ─ ─` dotted divider is a strong Korean receipt convention (mimicking thermal-printed paper receipts):

```css
.receipt-divider {
  border-top: 1px dashed var(--color-border-default);
  margin: 16px 0;
}
```

Optional: render as inline SVG for a more receipt-paper feel.

## Item row alignment

Item names left-aligned, prices right-aligned, tabular numerals. Quantity often shown as multiplier:

```
아메리카노 (Tall) × 2          ₩9,000
   ₩4,500 / 개                          ← optional unit price line
카페라떼                       ₩5,500
```

## States

| State | Visual |
| --- | --- |
| Completed | Success icon, full receipt visible |
| Pending | Warning icon, "처리 중" badge |
| Cancelled | Strikethrough on all amounts; cancellation reason |
| Refunded | "환불 처리됨" badge, refund timestamp |
| Loading | Skeleton matching receipt shape |
| Error | "영수증을 불러올 수 없어요" + retry |

## Tokens consumed

```
--color-bg-default
--color-bg-elevated
--color-text-primary
--color-text-secondary
--color-text-tertiary
--color-success            (completed)
--color-warning            (pending)
--color-error              (cancelled)
--color-money-negative      (discount)
--color-border-default      (divider)
--space-md, --space-base, --space-lg
--radius-md
--font-mono                 (order ID — alphanumeric clarity)
--font-feature-amount: 'tnum' 1
```

## Accessibility

- Receipt as `<article>` with `aria-label="결제 영수증"`.
- Status icon: `aria-hidden="true"` (header text carries meaning).
- Total amount: `aria-label="총 결제 금액 9,000원"`.
- Items list: `<dl>` for name → price pairs, OR `<table>` if quantities + unit prices.
- Actions: standard buttons.

## Print

Receipts are commonly printed:

```css
@media print {
  .receipt {
    background: white;
    color: black;
  }
  .receipt-actions {
    display: none;
  }
  /* Use solid black for divider — dashed renders inconsistently */
  .receipt-divider {
    border-top-style: solid;
  }
}
```

For Korean app store policy compliance: receipts must be printable / saveable as PDF.

## Korean conventions

- "결제가 완료되었습니다" — standard completion language.
- "총 결제 금액" — final total label.
- "주문번호" — order ID label.
- "상점" / "가맹점" — merchant.
- 영수증 공유: KakaoTalk share is the most common; SMS as backup.
- For 사업자 영수증 (business receipts): include 사업자등록번호 if applicable.
- Tax (부가세) shown as separate line if applicable. For most e-commerce, tax is included in price (VAT-included).

## Code example

```tsx
function OrderConfirmationScreen({ orderId }: Props) {
  const order = useOrder(orderId);

  return (
    <Page>
      <PaymentReceipt
        status={order.status}
        timestamp={order.completedAt}
        orderId={order.displayId}
        merchant={order.merchant}
        paymentMethod={order.paymentMethodLabel}
        items={order.items}
        subtotal={order.subtotal}
        discount={order.discountTotal}
        shipping={order.shippingFee}
        total={order.total}
        actions={[
          {
            label: "영수증 공유",
            onClick: () => share({ url: `/orders/${orderId}/receipt` }),
          },
          {
            label: "재구매",
            onClick: () => reorder(orderId),
          },
        ]}
        refundable={order.canRefund}
      />
    </Page>
  );
}
```

## Edge cases

- **Refunded items in a partially-fulfilled order**: show refund status per item with strikethrough.
- **Subscription receipts**: include "다음 결제일: 2026.06.07" in the metadata.
- **No items** (e.g., service charge, donation): hide items section, just show breakdown.
- **Discount > subtotal** (rare): show negative total OR cap at 0; handle case-by-case.
- **Tax-included vs tax-excluded**: clearly label. Korean apps default to tax-included; B2B may show separately.

## Don't

- Don't use heavy borders / boxes inside the receipt — keep it paper-like.
- Don't omit the timestamp.
- Don't show actions in print mode.
- Don't break dividers across pages on print.
- Don't shorten the order ID — full ID needed for support.
- Don't auto-redirect from the receipt screen — let user read.

## References

No upstream component is exactly this. The receipt pattern is universal but **Korean visual conventions** (dotted dividers, breakdown structure, share-receipt language) are domain-specific.

Closest analogs:
- Stripe Dashboard receipts (Western convention)
- KakaoBank / Toss receipt screens (Korean convention)

## Cross-reference

- [`examples/component-krw-amount.md`](component-krw-amount.md) — used internally for amounts
- [`examples/component-payment-method-selector.md`](component-payment-method-selector.md) — pre-checkout
- [`examples/component-result.md`](component-result.md) — result page (PaymentReceipt is its richer cousin)
- [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md) — Korean payment conventions
- [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md) — money display
