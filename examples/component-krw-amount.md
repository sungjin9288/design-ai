# `KRWAmount` (custom — display-only currency formatter) — spec

> Custom component pattern. Display-only counterpart to AmountInput. Renders KRW amounts consistently across the app — receipts, balances, transaction details, summaries.

## Purpose

Formats and displays a KRW amount with the right separator, suffix/prefix, sign, and color. Read-only. Use everywhere money is displayed but not entered.

## Why a separate component (not just `formatKRW(...)`)

A centralized component:
- Consistent formatting across the entire app.
- Single place to switch convention (suffix `원` vs prefix `₩`).
- Tabular numerals applied consistently.
- Color semantics consistent (money-positive / money-negative / neutral).
- Smaller payload than AmountInput (no input wiring).

## Anatomy

```
Default:                  Negative (expense):           Hero (large display):
₩2,847,500                  -₩5,500                     ₩12,847,500
                                                          ↑ 12,500원 이번 달

Korean number format:    With sign explicit:           Foreign currency:
1,200만원                 +₩2,500,000                 $25.00 (약 ₩33,300)
```

## API

```tsx
<KRWAmount value={2847500} />
<KRWAmount value={-5500} type="expense" />
<KRWAmount value={user.balance} variant="hero" delta={{ value: 12500, period: "이번 달" }} />
<KRWAmount value={1200000} format="korean" />     // "1,200만원"
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | — | Amount in won (smallest unit) |
| `currency` | `"KRW"` (locked) | `"KRW"` | Reserved for future i18n |
| `type` | `"income" \| "expense" \| "transfer" \| "neutral"` | inferred from sign | Drives color |
| `variant` | `"default" \| "compact" \| "hero" \| "inline"` | `"default"` | Size + emphasis |
| `format` | `"comma" \| "korean"` | `"comma"` | "1,200,000" vs "120만" |
| `affixStyle` | `"prefix" \| "suffix"` | `"suffix"` | `1,200,000원` vs `₩1,200,000` |
| `showSign` | `boolean` | `false` | Force `+` for positive |
| `precision` | `number` | `0` | Decimals (always 0 for KRW) |
| `delta` | `Delta` | — | Below-amount comparison |
| `compactThreshold` | `number` | `10000` | When format=korean: only convert above this |

## Variants

### `default`

Standard inline display. Body-size text, tabular numerals.

```tsx
<KRWAmount value={2847500} />
```
Renders: `₩2,847,500` or `2,847,500원` depending on convention.

### `compact`

Smaller text, for table cells / sidebars.

```tsx
<KRWAmount value={2847500} variant="compact" />
```

### `hero`

Large display for hero amounts (account balance, total order):
- Font: 32–48px
- Weight: 700
- Tabular numerals
- Optional delta below

```tsx
<KRWAmount
  value={user.balance}
  variant="hero"
  delta={{ value: 12500, period: "이번 달", goalDirection: "up" }}
/>
```

Renders:
```
₩12,847,500
↑ 12,500원 이번 달
```

### `inline`

Minimal styling — fits inside a sentence:

```tsx
<p>총 결제 금액은 <KRWAmount value={45000} variant="inline" />입니다.</p>
```

## Format styles

### `comma` (default)

Standard thousands separator: `2,847,500원` or `₩2,847,500`.

### `korean`

Korean number names (만, 억) for compact display:
- < 10,000 won: `123원`
- 10,000–9,999,999 won: `1,234만원` (showing 만 as the unit)
- ≥ 10,000,000 won: `1억 2,345만원`

Use `korean` format for:
- Real estate prices (massive amounts)
- Investment account totals
- Hero displays in casual consumer apps

Don't use for transactional amounts (cart totals, transfers) — full digits required for accuracy.

## Type / color mapping

Per [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md):

| `type` | Color | Sign default |
| --- | --- | --- |
| `expense` | `--color-money-negative` | `-` |
| `income` | `--color-money-positive` | `+` (if `showSign`) |
| `transfer` | `--color-money-neutral` | `-` or none |
| `neutral` | `--color-text-primary` | none |

Inferred from sign by default; override with `type` prop.

## Tokens consumed

```
--color-text-primary
--color-money-positive
--color-money-negative
--color-money-neutral
--font-feature-amount: 'tnum' 1   (critical)
--font-size-sm, --font-size-base, --font-size-2xl, --font-size-4xl
--font-weight-semibold, --font-weight-bold
```

## Accessibility

- Render as `<span>` with semantic-aware `aria-label`:
  ```html
  <span aria-label="290만 원">₩2,847,500</span>
  ```
- For type="expense": `aria-label="5,500원 지출"`.
- For income: `aria-label="2,500,000원 수입"`.
- Color is supplementary; don't encode meaning by color alone — sign + label do the work for screen readers.

## Code examples

```tsx
// Transaction list cell
<KRWAmount value={tx.amount} type={tx.type} variant="compact" />

// Account balance hero
<KRWAmount
  value={account.balance}
  variant="hero"
  delta={{
    value: account.monthlyChange,
    period: "이번 달",
    goalDirection: account.balanceType === "savings" ? "up" : undefined,
  }}
/>

// Receipt total
<KRWAmount value={order.total} variant="default" affixStyle="prefix" />

// Inline in narrative
<p>이번 달 지출: <KRWAmount value={monthlyExpense} type="expense" variant="inline" /></p>

// Korean compact for property listing
<KRWAmount value={propertyPrice} format="korean" variant="hero" />
{/* Renders: 5억 2,000만원 */}

// Foreign equivalent
<div>
  <span>$25.00</span>
  <span className="text-text-secondary">
    (약 <KRWAmount value={33300} variant="inline" />)
  </span>
</div>
```

## Edge cases

- **Zero**: render as `0원` or `₩0` (not `-원`).
- **Negative amount with `showSign`**: prefer `-₩5,500` not `₩-5,500`.
- **Very large** (조 level): always full digits or with 조 unit. Don't crash.
- **Floating-point error in input**: round to integer at the boundary (`Math.round(value)`).
- **Currency conversion display**: pair with `KRWAmount` for the Korean half + native span for the foreign currency.

## Don't

- Don't show decimals for KRW. Round to integer at compute.
- Don't omit tabular numerals. Tables with mixed widths look broken.
- Don't auto-convert to `korean` format for transactional values — accuracy matters.
- Don't forget signed-amount color logic — silently positive amounts colored as negative is a real bug.
- Don't use `--color-error` for expense color. `money-negative` is its own axis.

## API rationale

- **`value` is a number, not a formatted string**: source of truth. KRWAmount is the single point of formatting.
- **`type` separate from sign**: a positive transfer (e.g., +₩100,000 to your savings account) is "neutral", not "income".
- **`format` opt-in for Korean compact**: full digits is the safer default; `korean` is the display option.

## Cross-reference

- [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md) — full money-display rules
- [`examples/component-amount-input.md`](component-amount-input.md) — editable counterpart
- [`examples/component-statistic.md`](component-statistic.md) — for KPI hero amounts (alternative)
- [`examples/component-transaction-list-item.md`](component-transaction-list-item.md) — uses KRWAmount internally
- [`examples/component-account-card.md`](component-account-card.md) — uses KRWAmount internally
