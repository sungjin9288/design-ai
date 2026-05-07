# `TransactionListItem` (custom — Korean fintech / 가계부) — spec

> Custom component pattern. The most-rendered row in any 가계부 / banking / payment app. Many tens of these per screen — performance + visual consistency matters.

## Purpose

A single row in a transaction list — date, category, description, amount. Tappable to open detail.

## Anatomy

```
┌─────────────────────────────────────────────────────────┐
│ [icon]  Description                       -₩12,500       │
│         Subtitle (category, payment method, time)        │
└─────────────────────────────────────────────────────────┘

Example (expense):
🍽  스타벅스 강남점                              -₩5,500
    카페 · 12:34

Example (income):
💰  급여                                       +₩2,500,000
    회사 · 09:00

Example (transfer between own accounts):
🔄  자동이체 (적금)                              ₩-100,000
    국민은행 → 우리은행 · 어제 17:00
```

| Slot | Required | Notes |
| --- | --- | --- |
| Category icon | yes | Emoji or icon (matches CategoryPicker) |
| Title | yes | Merchant name or transaction description |
| Subtitle | yes | Category / payment method / time |
| Amount | yes | Right-aligned, tabular numerals, signed |
| Trailing chevron | optional | Drill-in affordance |
| Status badge | optional | "취소" (cancelled), "보류" (pending) |

## API

```tsx
<TransactionListItem
  icon="🍽"
  title="스타벅스 강남점"
  subtitle="카페 · 12:34"
  amount={-5500}
  type="expense"
  onClick={() => openTransaction(id)}
/>

<TransactionListItem
  icon="💰"
  title="급여"
  subtitle="회사 · 09:00"
  amount={2500000}
  type="income"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `icon` | `string \| ReactNode` | — | Emoji or icon (typically matches CategoryPicker) |
| `title` | `string \| ReactNode` | — | Merchant or description |
| `subtitle` | `string \| ReactNode` | — | Category · time / payment method |
| `amount` | `number` | — | Signed amount in smallest unit (won) |
| `type` | `"expense" \| "income" \| "transfer" \| "neutral"` | inferred from sign | Drives amount color |
| `currency` | `"KRW" \| ...` | `"KRW"` | Format |
| `onClick` | `() => void` | — | Drill-in handler |
| `status` | `"pending" \| "cancelled" \| "settled"` | `"settled"` | Optional status badge |
| `trailingMeta` | `ReactNode` | — | After amount; e.g., balance after this transaction |

## Amount color (critical)

Per [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md):

| Type | Color | Sign |
| --- | --- | --- |
| `expense` | `--color-money-negative` | `-` (e.g., `-₩5,500`) |
| `income` | `--color-money-positive` | `+` (e.g., `+₩2,500,000`) |
| `transfer` | `--color-money-neutral` (gray) | `-` or no sign |
| `neutral` | `--color-text-primary` | based on amount |

For Korean banking (not stocks): `money-positive` is green, `money-negative` is red. For Korean stock convention (red=up): different rules apply, but stock apps don't use `TransactionListItem` typically.

## Sizes

| Size | Row height | Icon | Title font | Subtitle font | Amount font |
| --- | --- | --- | --- | --- | --- |
| `compact` | 56px | 32px | 14px | 12px | 14px |
| `default` | 64px | 40px | 15px | 13px | 15px |
| `comfortable` | 72px | 48px | 16px | 14px | 17px |

Korean consumer apps: `default` is the right balance.

## States

| State | Visual |
| --- | --- |
| Default | resting |
| Hover | bg `--color-bg-subtle` |
| Pressed (tap) | bg `--color-bg-elevated` (mobile feedback) |
| Focus-visible | 2px ring around the row |
| Pending | "보류" badge + reduced opacity 0.7 |
| Cancelled | "취소" badge + strikethrough on amount |

## Tokens consumed

```
--color-bg-default
--color-bg-subtle              (hover)
--color-bg-elevated            (pressed)
--color-text-primary
--color-text-secondary         (subtitle)
--color-money-positive
--color-money-negative
--color-money-neutral
--color-text-tertiary           (separator dot, "·")
--color-warning                  (pending badge)
--color-error                    (cancelled badge)
--color-focus-ring
--space-sm, --space-md
--font-feature-amount: 'tnum' 1  (tabular numerals — critical)
--font-size-sm, --font-size-base
--radius-full                    (icon container)
```

## Accessibility

- Render as `<button>` (or `<a>` if `onClick` is navigation). Don't use `<div onClick>`.
- Icon: `aria-hidden="true"` — the title carries meaning.
- `aria-label` on the row for screen readers, including amount and date:
  ```html
  <button aria-label="스타벅스 강남점, 카페, 12:34, 5,500원 지출">
    ...
  </button>
  ```
- For lists, `<ul>` + `<li>` containers.
- Touch target: ≥ 44×44 pt — `default` size at 64px exceeds.

## List performance

Lists of 100+ transactions:
- **Virtualize** with FlatList (React Native) or react-virtual / @tanstack/react-virtual (web).
- Memoize the row component to prevent re-renders.
- Lazy-load icons if using SVG imports.

Per [`knowledge/patterns/list-and-feed.md`](../knowledge/patterns/list-and-feed.md).

## Date / time grouping

Most apps group transactions by date with sticky headers:

```
─── 5월 7일 (목) ────────────────────
🍽 스타벅스 강남점          -₩5,500
🚌 지하철                   -₩1,500

─── 5월 6일 (수) ────────────────────
💰 급여                    +₩2,500,000
🛍 마켓컬리                  -₩48,000
```

Header style: small (12-13px), `--color-text-tertiary`, sticky on scroll.

For "오늘" (today) and "어제" (yesterday): use the words instead of dates.

## Mobile patterns

### Swipe actions

iOS-style swipe to reveal actions (delete, edit, pin):

```
[🍽 스타벅스 ...]  ←(swipe)  [Edit] [Delete]
```

Use sparingly per [`knowledge/patterns/list-and-feed.md`](../knowledge/patterns/list-and-feed.md).

### Long-press menu

Long-press opens a contextual action sheet:
- 수정 (Edit)
- 카테고리 변경 (Change category)
- 메모 추가 (Add memo)
- 삭제 (Delete)

Common in Korean 가계부 apps.

## Code example

```tsx
function TransactionList({ transactions }: Props) {
  const groupedByDate = useMemo(() => groupByDate(transactions), [transactions]);

  return (
    <FlatList
      data={groupedByDate}
      keyExtractor={(item) => item.date}
      renderItem={({ item: group }) => (
        <>
          <DateHeader sticky>{formatDate(group.date)}</DateHeader>
          {group.transactions.map((tx) => (
            <TransactionListItem
              key={tx.id}
              icon={tx.category.icon}
              title={tx.merchant}
              subtitle={`${tx.category.label} · ${formatTime(tx.time)}`}
              amount={tx.amount}
              type={tx.type}
              onClick={() => navigation.navigate("TransactionDetail", { id: tx.id })}
            />
          ))}
        </>
      )}
    />
  );
}
```

## Don't

- Don't omit tabular numerals — amounts won't align in column.
- Don't use `--color-error` for expense color. Use `--color-money-negative`.
- Don't omit category icon — Korean users scan by emoji.
- Don't render 1000+ rows without virtualization.
- Don't truncate the amount — full precision matters in financial UI.
- Don't show "0원" for zero-amount placeholder rows. Hide them.
- Don't right-align title. Left-align (LTR) — only amount is right-aligned.

## API rationale

- **`amount: number` not formatted string**: source of truth is the integer; formatting is presentation. AmountInput stores numbers; consistent with this.
- **`type` separate from amount sign**: positive amount might still be a "transfer" (visually neutral), not income.
- **Icon as string accepts emoji**: Korean apps use emoji directly; allows flexibility for icons too.

## Cross-reference

- [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md) — money color semantics
- [`knowledge/patterns/list-and-feed.md`](../knowledge/patterns/list-and-feed.md) — list patterns, virtualization
- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md) — Korean fintech conventions
- [`examples/component-category-picker.md`](component-category-picker.md) — paired with CategoryPicker
- [`examples/component-amount-input.md`](component-amount-input.md) — paired in transaction forms
- [`examples/component-card.md`](component-card.md) — TransactionListItem is essentially a list-row card
