<!-- hand-written -->
---
title: Money and amount — display, input, color semantics
applies_to: [fintech, e-commerce, all-money-aware-ui]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Money and amount

Designing UIs that display and accept money has its own rules. Get them wrong and users misread their balance, miscount their cart, or miss-key a transfer. This is the floor for any product where money is on screen.

## Currency display rules

### Format

| Locale | Recommended | Examples |
| --- | --- | --- |
| Korea (consumer) | `1,200,000원` (suffix style) | `12,500원` `1,234,567원` |
| Korea (fintech / Western-coded) | `₩1,200,000` (prefix style) | `₩12,500` `₩1,234,567` |
| US | `$1,234.56` | `$25.00` `$1,234.56` |
| Japan | `¥1,234` (no decimal) | `¥250` `¥1,234,567` |
| EU | `1.234,56 €` (varies) | `25,00 €` `1.234.567,89 €` |

For Korean apps:
- **Suffix `원`** reads as consumer/local — coffee shops, e-commerce, 가계부.
- **Prefix `₩`** reads as fintech/professional — investment apps, banking, B2B.
- **Pick one and stay consistent throughout the product.**

### Thousands separator

Always show. `1234567` is unreadable; `1,234,567` is parseable at a glance.

In Korean: comma every 3 digits is the universal convention for the **arabic-numeral** form. The Korean-number form (`123만 4,567`) is used in display contexts (charts, summaries) but not in transactional contexts.

### Decimals

KRW has no sub-unit (no jeon in modern usage). **Always integer.**
- Don't display `.00` for KRW. `12,500원`, not `12,500.00원`.
- For currencies with subunits (USD, JPY without decimals, EUR with), display 2 decimals consistently (or 0 for JPY).

### Tabular numerals

When amounts appear in lists or tables, use `font-feature-settings: 'tnum' 1` (or a font with built-in tabular figures). This makes digits the same width — `1,234,567` aligns with `1,000,000` cleanly:

```
proportional:        tabular:
₩1,234,567           ₩1,234,567
₩  100,000           ₩  100,000
₩    9,500           ₩    9,500
```

The tabular column is scannable; the proportional one looks staggered.

Pretendard supports `tnum` natively (set via CSS). Most variable fonts do.

### Korean number names (만, 억) for display contexts

For very large amounts in summaries / hero displays, Korean readers parse `1.2억` faster than `120,000,000`. Common for:
- Real estate (price)
- Investment account totals
- Large transactions

Format: `<truncated number>억`, `<truncated number>만`, or full form. Examples:

| Raw | Compact | Use |
| --- | --- | --- |
| `1,234,567` | `123만 4,567원` | rarely worth the verbosity |
| `12,345,678` | `1,234만원` | compact display |
| `123,456,789` | `1억 2,345만원` | hero |
| `1,234,567,890` | `12억 3,457만원` | hero |

**Don't use this format for transactional amounts** (cart totals, transfer amounts) — only for high-level summary displays. Transactional needs full digits for accuracy.

## Color semantics for money

This is its own axis, **separate from primary/accent/error**.

```
✓ Money colors (semantic):
  --color-money-positive   (income, deposit, balance increase)
  --color-money-negative   (expense, withdrawal, balance decrease)
  --color-money-neutral    (transfer, unchanged)
```

| Color | Convention | Example |
| --- | --- | --- |
| Positive (Korean) | **Red `#DC2626`** for stock gains (Korean reads red as "rising") OR green `#16A34A` for income/deposit | Korean stock apps: red gain, blue loss. Korean banking: green deposit, red withdrawal. |
| Positive (US/Western) | Green | Standard everywhere except KR/JP/CN stocks |
| Negative (Korean) | **Blue `#2563EB`** for stock losses OR red `#DC2626` for expenses/withdrawals | Korean stock apps: blue. Korean banking: red. |
| Negative (US/Western) | Red | Standard |
| Neutral | Neutral text color (`--color-text-primary`) | Transfer, account balance display |

### The Korean stock convention is INVERTED from the West

Korean stock apps (and Japanese, Chinese):
- 🔴 **Red = up / gain / 상승**
- 🔵 **Blue = down / loss / 하락**

This comes from cultural color associations (red = celebration, blue = somber). Western traders working in Korean apps often misread.

If your app handles stocks/crypto for Korean users: **use the Korean convention by default**. Provide a settings toggle for "Western color scheme" but don't default-flip.

If your app is Korean banking/fintech (NOT stocks): use the universal expense-red, income-green convention. KakaoBank, Toss show deposit-green, withdrawal-red.

### Don't use `--color-error` for negative amounts

`--color-error` means **something went wrong**. A negative balance, an outgoing payment, a stock loss — none of those are errors. They're values that happen to be negative. Use `--color-money-negative`.

A user who paid for groceries didn't make an error. Coloring the expense as `--color-error` reads as "this expense was a mistake."

### Don't use `--color-success` for positive amounts

Same reasoning. Income isn't a "success state" of the system; it's a fact about a number.

## Display patterns

### Hero balance display

```
┌─────────────────────────────────┐
│ 사용 가능 금액                    │
│                                 │
│   ₩2,847,500                    │   ← display variant, 38px+, semibold, tnum
│                                 │
│ +12,500원 이번 달                │   ← caption, money-positive color
└─────────────────────────────────┘
```

- The amount is the largest text on the screen.
- Sub-line (delta, period, label) immediately below — small caption with semantic color.
- Optional comparison ("이번 달 +12,500원" or "+0.4% 어제 대비").

### Transaction row

```
┌──────────────────────────────────────────────┐
│ 🍽 점심 식사                          -12,500원 │   ← right-aligned tabular num
│    스타벅스 강남점 · 12:34            ─2,832,500원 │   ← post-transaction balance
└──────────────────────────────────────────────┘
```

- Icon (category emoji or icon) on the left.
- Amount and post-balance on the right, right-aligned.
- Use tabular numerals so the column is clean across many rows.
- Sign convention: `-12,500원` for outflow, `+12,500원` for inflow, no sign for neutral. Don't use parentheses `(12,500원)` — Korean readers parse `-` more naturally.

### Cart / order summary

```
상품 합계         ₩45,000
배송비            ₩3,000
할인             -₩5,000        ← negative (discount), money-positive color (it's good for the user)
─────────────────────────
총 결제 금액      ₩43,000        ← bolder, larger, hero tier
```

The convention here is interesting: discount is a **negative number** in the math but a **positive event** for the user. Color it as `--color-money-positive` (green/blue) — the discount is a benefit, not a charge. Then the final total uses neutral / heavy text.

### Account balance breakdown

```
┌───────────────────────────────┐
│ 자유적금                       │
│ 신한은행 ****-321              │
│                               │
│ ₩5,200,000                    │ ← amount in display tier
│                               │
│ 매월 ₩100,000 자동이체          │ ← caption, neutral
└───────────────────────────────┘
```

## Amount input patterns

### Auto-format on input

User types `1234567`; field shows `1,234,567`. Caret position must NOT jump.

Implementation note: format on every keystroke, then carefully restore caret position. Most amount-input libraries (Cleave.js, react-number-format) handle this.

### Suffix inside the field

```
┌─────────────────────────────┐
│ 1,234,567                원  │
└─────────────────────────────┘
```

Or prefix:
```
┌─────────────────────────────┐
│ ₩    1,234,567              │
└─────────────────────────────┘
```

The suffix/prefix is **not editable** — it's a visual affordance. User types only digits.

### Accepting paste

User pastes `12,500.00`. The field should:
1. Strip non-digits except the decimal point.
2. For KRW (no decimals), strip the decimal point and following digits.
3. Re-format with thousands separators.
4. Land on `12,500`.

Pasting `₩12,500` or `$12.50` should work too — strip currency symbols.

### Quick-amount chips

For common amounts, offer chips above the input:

```
[+1만]  [+5만]  [+10만]  [+100만]
┌─────────────────────────────┐
│ 0                       원   │
└─────────────────────────────┘
```

Tapping `+5만` adds 50,000 to the current value. This is universal in Korean transfer/송금 apps.

### Maximum amount affordance

For "send all balance" actions:

```
┌─────────────────────────────┐
│ 1,000,000             원  ✕ │
└─────────────────────────────┘
잔액 ₩1,234,567   [전액 보내기]
```

The "전액" (all) button populates the full balance. Common in transfer/send-money apps.

### Input mode

```html
<input type="text" inputmode="numeric" autocomplete="transaction-amount" />
```

`type="number"` is wrong for currency — strips leading zeros, rejects `,` formatting, scrolls on accidental wheel.

`type="text" inputmode="numeric"` triggers the numeric keypad on mobile while letting you control formatting.

For RN: `<TextInput keyboardType="number-pad" />`.

### Validation timing

- **On input**: format only. Don't show errors yet.
- **On blur**: validate (min/max, balance sufficient). Show error.
- **On submit**: re-validate, including server-side balance check.

## Edge cases

### Zero
`0원` (not `₩0` for consumer; `₩0` for fintech). Don't render the amount line at all if it would be zero AND the line is decorative ("you saved ₩0 this month").

### Negative balance
Allow display, but with care:
- `-₩5,000` (overdraft) — color `--color-money-negative`, not `--color-error`.
- Add an explicit annotation: "마이너스 통장 사용 중" or "(overdraft)".

### Very large numbers
Beyond `999조` (999 trillion), Korean number names break down for most users. Don't try to format these prettily — it's a corner case (tax authority, central bank). Display as `1,000,000,000,000,000원` and accept readability tradeoff.

### Foreign currency in Korean app
Display the foreign amount + KRW equivalent:
```
$25.00 (약 ₩33,300)
```
- Foreign first if the source is foreign (international purchase).
- KRW first if source is KRW (overseas trip planning, conversion display).
- "약" (approximately) is required when the conversion is approximate.

### Rounding
- KRW: always integer. Round at the **point of computation**, not display.
- Foreign currency display: round to the currency's natural precision (USD: 2 decimals).
- Tax: separate line, use the country's rounding rule (Korean VAT rounds down per item but up on total — server-side concern, designer just shows the line).

### Comma vs period locale issues
A user pastes a number with `.` as thousands separator (German format, `1.234.567`). Strip and reformat.

## Don't

- Don't color expenses with `--color-error`. Negative ≠ error.
- Don't show `.00` for KRW.
- Don't use `type="number"` for currency input.
- Don't auto-fill the suffix `원` into the value — keep the raw value as digits only.
- Don't truncate digits silently for "very large" amounts. Display fully, accept aesthetics.
- Don't use parentheses for negatives (`(₩12,500)`) in Korean apps. Use `-`.
- Don't mix `원` and `₩` styles in the same product.
- Don't right-align amounts with proportional numerals — use tabular.
- Don't show currency conversions without "약" (approx) annotation when the rate is not real-time.
- Don't display balance updates with disruptive animation (number-tick animation is fine; flash/shake is not).

## Cross-reference

- [knowledge/typography/type-scale-fundamentals.md](../typography/type-scale-fundamentals.md) — tabular numerals
- [knowledge/colors/color-theory.md](../colors/color-theory.md) — semantic naming
- [knowledge/i18n/korean-payments.md](../i18n/korean-payments.md) — payment-specific UX
- [knowledge/patterns/form-design.md](form-design.md) — number input patterns
