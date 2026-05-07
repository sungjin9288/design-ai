# `AccountCard` (custom — Korean banking / fintech) — spec

> Custom component pattern. Korean banking apps universally render bank accounts as branded cards. KakaoBank, Toss, traditional bank apps all converge on this design.

## Purpose

Displays a bank account as a card: bank logo + nickname + masked account number + balance. Tappable to open transaction history.

## Anatomy

```
┌─────────────────────────────────────────────────┐
│ [bank logo]  국민 입출금                          │  ← bank brand + nickname
│              123-45-6789-012                     │  ← masked account number
│                                                  │
│  ₩2,847,500                                      │  ← balance (prominent)
│                                                  │
│  [송금] [QR 결제] [입금]                          │  ← optional quick actions
└─────────────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Bank logo | yes | Official asset; provides instant recognition |
| Nickname | yes | User-editable label (default: "통장 이름") |
| Account number | yes | Masked except last 4 digits |
| Balance | yes | Display tier, tabular numerals, prominent |
| Quick actions | optional | 송금 / 결제 / 입금 |
| Trailing chevron | optional | If tappable to navigate |
| Status badge | optional | "정지", "주거래" |

## API

```tsx
<AccountCard
  bank="KB국민은행"
  bankLogo="/banks/kb.png"
  nickname="국민 입출금"
  accountNumber="123-45-6789-012"
  balance={2847500}
  variant="hero"
  onClick={() => navigate(`/accounts/${id}`)}
  actions={[
    { label: "송금", onClick: openTransfer },
    { label: "QR 결제", onClick: openQrPay },
    { label: "입금", onClick: openDeposit },
  ]}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `bank` | `string` | — | Bank name (Korean) |
| `bankLogo` | `string \| ReactNode` | — | Logo asset |
| `bankColor` | `string` | derived from bank | Brand color for accent |
| `nickname` | `string` | — | User-editable label |
| `accountNumber` | `string` | — | Full or masked |
| `mask` | `boolean` | `true` | Auto-mask account number |
| `balance` | `number` | — | In smallest unit (won) |
| `currency` | `"KRW" \| ...` | `"KRW"` | |
| `variant` | `"compact" \| "default" \| "hero"` | `"default"` | |
| `actions` | `Action[]` | — | Quick actions row |
| `onClick` | `() => void` | — | Tap to drill in |
| `status` | `"active" \| "frozen" \| "primary"` | `"active"` | Optional badge |
| `loading` | `boolean` | `false` | Skeleton state |

## Variants

### Compact

For a list of accounts (account selector):
```
┌──────────────────────────────────────┐
│ [logo]  국민 입출금         ₩2,847,500│
│         ****-012                     │
└──────────────────────────────────────┘
```

Single row, minimal padding.

### Default

Standard card with balance prominent and actions:
```
┌─────────────────────────────────────┐
│ [logo]  국민 입출금                    │
│         ****-012                     │
│                                      │
│  ₩2,847,500                          │
│                                      │
│  [송금] [결제]                        │
└─────────────────────────────────────┘
```

### Hero

For the home screen / primary account:
```
┌─────────────────────────────────────────────┐
│  국민 입출금                                  │
│  ****-012                                    │
│                                              │
│  ₩2,847,500                                  │  ← extra large
│  ↑ 12,500원 이번 달                            │
│                                              │
│  [송금] [QR 결제] [입금]                      │
└─────────────────────────────────────────────┘
```

Larger amount, optional delta indicator, and full quick actions.

## Account number masking

| Format | Display | Use |
| --- | --- | --- |
| Full | `123-45-6789-012` | Detail screen with extra security |
| Last 4 only | `****-012` | List view, default |
| Hidden | `****-****` | When user has masking turned on |

The `mask` prop controls which. Mid-text mask uses asterisks per Korean banking convention (not bullets).

## Bank brand integration

Korean banks have official logos + brand colors. Don't restyle — use vendor assets:

| Bank | Brand color |
| --- | --- |
| KakaoBank | Yellow `#FFEB00` |
| KB국민은행 | Yellow + black |
| 신한은행 | Blue `#0046ff` |
| 우리은행 | Blue (different shade) |
| 하나은행 | Green |
| NH농협 | Green |
| Toss | Blue `#3182F6` |
| Naver Bank | Green |

Use brand color for:
- Card border accent
- Bank logo bg
- Subtle background tint (low-saturation)

Don't use for:
- Balance text (always neutral or money-positive/negative)
- Action button bg

## Sizes / variants → tokens

| Variant | Card padding | Balance font | Balance weight |
| --- | --- | --- | --- |
| `compact` | 12px | 16px | 600 |
| `default` | 16px | 24px | 600 |
| `hero` | 24px | 36px | 700 |

## States

| State | Visual |
| --- | --- |
| Default | Resting |
| Hover (interactive) | Subtle bg shift |
| Pressed | Slight scale 0.98 (mobile feedback) |
| Focus-visible | 2px ring |
| Loading | Skeleton: logo + text bars + balance bar |
| Frozen / 정지 | Gray bg + "정지" badge |
| Primary / 주거래 | "주거래" badge with star icon |

## Tokens consumed

```
--color-bg-default
--color-bg-elevated         (card surface)
--color-bg-subtle           (hover)
--color-text-primary        (balance, nickname)
--color-text-secondary       (account number, bank name)
--color-money-positive       (delta indicator if positive)
--color-money-negative
--color-money-neutral
--color-primary-default     (action button bg if appropriate)
--color-warning              ("정지" status)
--color-success              ("주거래" badge)
--color-border-default
--color-focus-ring
--space-sm, --space-md, --space-lg
--radius-lg                  (card corners)
--shadow-card                 (subtle elevation)
--font-feature-amount: 'tnum' 1
--font-size-sm, --font-size-base, --font-size-2xl
```

## Accessibility

- Render as `<button>` if interactive, `<article>` if static.
- Bank logo: `<img alt="KB국민은행 로고">`.
- Account number: render with semantic markup so screen readers don't read each digit ("일이삼"); use `aria-label`:
  ```html
  <span aria-label="계좌번호 마지막 네 자리, 영영일이">****-012</span>
  ```
- Balance: also include aria-label that's friendlier than the raw digits:
  ```html
  <span aria-label="잔액 290만 원">₩2,847,500</span>
  ```
- Action buttons: standard accessibility.

## Code example

```tsx
function AccountsScreen() {
  const accounts = useAccounts();

  return (
    <Page>
      <PageHeader>내 계좌</PageHeader>

      {/* Hero variant for primary */}
      {accounts.primary && (
        <AccountCard
          variant="hero"
          {...accounts.primary}
          actions={[
            { label: "송금", onClick: () => openTransfer(accounts.primary.id) },
            { label: "QR 결제", onClick: () => openQrPay(accounts.primary.id) },
            { label: "입금", onClick: () => openDeposit(accounts.primary.id) },
          ]}
        />
      )}

      {/* Compact for list */}
      <Section title="다른 계좌">
        {accounts.others.map(account => (
          <AccountCard
            key={account.id}
            variant="compact"
            {...account}
            onClick={() => navigate(`/accounts/${account.id}`)}
          />
        ))}
      </Section>
    </Page>
  );
}
```

## Edge cases

- **Negative balance** (overdraft): show with `--color-money-negative` + small "-" prefix or "(₩50,000)" parens. Clarify with subtitle "마이너스 통장".
- **Foreign currency account**: switch currency symbol; consider showing KRW conversion below.
- **Hidden balance** (user turned on privacy mode): show `***` instead of digits, with toggle.
- **Stale balance** (last sync > 1hr): show timestamp, prompt to refresh.
- **Loading**: skeleton matching the card shape — don't blank out.
- **Network error fetching balance**: show "잔액 불러오기 실패" with retry.
- **Empty bank logo**: render bank initial in a colored circle (use bankColor).

## Don't

- Don't show full account number by default. Mask except last 4.
- Don't omit bank logo — brand recognition is the entire point of the card.
- Don't restyle bank logos / brand colors.
- Don't use `--color-error` for negative balance — use `--color-money-negative`.
- Don't omit tabular numerals — balance won't align.
- Don't auto-refresh balance every second; respect bank API rate limits.
- Don't make actions invisible without tap. Show visible buttons.

## Korean considerations

- Account nickname is **user-editable** — letting users rename "통장이름" is a key Korean banking app feature.
- "주거래" (primary account) is a Korean banking concept; mark with badge.
- "송금 / 입금 / QR 결제 / 자동이체" are the canonical action labels.
- For business accounts (사업자 계좌): subtitle may include 사업자등록번호.
- For 외화 계좌 (foreign currency): clearly show currency symbol + KRW equivalent.

## API rationale

- **`balance: number`**: source of truth. Formatting via tabular numeric output.
- **`bankLogo` accepts both string (URL) and ReactNode**: flexibility for asset pipelines.
- **Three variants** capture the most common usage shapes; more is over-flexibility.
- **Quick actions as array**: each card might have different actions based on account type.

## Cross-reference

- [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md) — currency display, money color
- [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md) — Korean banking conventions
- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md) — broader KR app conventions
- [`examples/component-card.md`](component-card.md) — base card pattern
- [`examples/component-statistic.md`](component-statistic.md) — balance display style
- [`examples/component-transaction-list-item.md`](component-transaction-list-item.md) — drill-in target
