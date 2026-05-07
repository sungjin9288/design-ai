# `AmountInput` (custom) — spec

> Status: example artifact for **custom components** — not derived from Ant/MUI/shadcn. This is the kind of spec the system produces for product-specific components that don't exist upstream.
>
> Cited knowledge: [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md), [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md), [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md)

## Purpose

A specialized text input for entering currency amounts — the most-used input in any fintech / 가계부 / e-commerce product. Critical to get right because:

- Auto-formatting must not break caret position.
- Pasting and IME composition must work cleanly.
- Korean conventions differ from Latin (no decimals for KRW, suffix `원` vs prefix `₩`, comma separator).
- Validation (positive only, balance ceiling, max amount) is per-context.

This is **not a Slider, not a stepper** — it's a text input optimized for amounts.

## Anatomy

```
┌─────────────────────────────────────────┐
│  1,234,567                          원   │   ← suffix style (consumer)
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ₩    1,234,567                          │   ← prefix style (fintech)
└─────────────────────────────────────────┘

[+1만]  [+5만]  [+10만]  [+100만]              ← optional quick chips
┌─────────────────────────────────────────┐
│  0                              원   ✕   │
└─────────────────────────────────────────┘
잔액 ₩2,500,000   [전액 사용]                 ← optional balance + max button
```

| Slot | Required | Notes |
| --- | --- | --- |
| Input field | yes | Numeric-only via `inputmode="numeric"` |
| Affix (₩ prefix or 원 suffix) | yes | Decorative — visually inside the input but not editable |
| Clear button | optional | ✕ when value > 0 |
| Quick chips | optional | Pre-fill amounts (`+1만`, `+5만`, `+10만`, `+100만`) |
| Max affordance | optional | "전액" / "전액 사용" — populates with full balance |
| Balance display | optional | "잔액 ₩X" beside or below |
| Help / error text | optional | Standard Input pattern |

## API

```tsx
<AmountInput
  value={amount}
  onValueChange={setAmount}
  currency="KRW"
  affixStyle="suffix"
  max={balance}
  showBalance
  balance={balance}
  showQuickChips
  quickChipAmounts={[10000, 50000, 100000, 1000000]}
  showMaxButton
  errorText={amount > balance ? "잔액이 부족합니다" : undefined}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number \| null` | — | Numeric value (in smallest unit — won for KRW). |
| `onValueChange` | `(value: number \| null) => void` | — | Numeric, not formatted string |
| `currency` | `"KRW" \| "USD" \| "JPY" \| "EUR" \| "CNY"` | `"KRW"` | Drives format + decimal precision |
| `affixStyle` | `"prefix" \| "suffix"` | `"suffix"` (KRW consumer) / `"prefix"` (other) | |
| `min` | `number` | `0` | Smallest allowed |
| `max` | `number` | — | Largest (e.g., balance) |
| `step` | `number` | `1` (KRW) / `0.01` (USD) | Smallest increment |
| `placeholder` | `string` | `"0"` | |
| `showBalance` | `boolean` | `false` | Render balance below |
| `balance` | `number` | — | The user's balance (for display + validation) |
| `showQuickChips` | `boolean` | `false` | Render add-amount chips above |
| `quickChipAmounts` | `number[]` | `[10000, 50000, 100000, 1000000]` (KRW) | Chip amounts (added to current value) |
| `showMaxButton` | `boolean` | `false` | "전액 사용" affordance |
| `disabled` / `readOnly` | `boolean` | `false` | |
| `error` / `errorText` | — | — | Validation state |
| `label` / `helpText` | — | — | Inherited from Input |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |
| `autoFocus` | `boolean` | `false` | |

## Currency-driven format

| Currency | Decimal | Separator | Default affix | Example |
| --- | --- | --- | --- | --- |
| KRW (₩) | 0 | `,` | `원` suffix (consumer) / `₩` prefix (fintech) | `1,234,567원` / `₩1,234,567` |
| USD ($) | 2 | `,` decimal `.` | `$` prefix | `$1,234.56` |
| JPY (¥) | 0 | `,` | `¥` prefix | `¥1,234` |
| EUR (€) | 2 | `.` decimal `,` | `€` suffix or prefix (locale-dependent) | `1.234,56 €` |
| CNY (¥) | 2 | `,` decimal `.` | `¥` prefix | `¥1,234.56` |

Per [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md).

## Behavior

### Auto-format

- User types `1234567` → field shows `1,234,567`. Caret position must not jump.
- Implementation: format-on-input, with caret restored to the equivalent visual position.
- Use `react-number-format` or similar; don't roll from scratch (caret bugs).

### Pasting

User pastes `12,500.00` (or `₩12,500`, or `$12.50`). The input must:

1. Strip all non-digits except decimal separator.
2. For KRW (no decimals): strip everything after the decimal too.
3. Re-format with thousands separators.
4. Land on `12,500`.

For input mode in Korean apps, paste handling is the most common bug area — test with locale-formatted clipboard content.

### Quick chips

Tapping `+5만` adds 50,000 to the current value. Adds, doesn't replace:

```
Current: 12,000
After tap on [+5만]: 62,000
```

This is canonical in Korean transfer / 송금 apps.

### Max affordance

For "send all balance":
- "전액" or "전액 사용" button populates the field with the full balance.
- Useful in transfer flows.
- Validate that balance is fresh — don't overflow.

### IME composition

For Korean apps where Hangul keyboard is default:
- Hangul keys produce non-numeric input that should be filtered.
- Don't crash on weird character; just ignore non-digit keystrokes.
- `inputmode="numeric"` on mobile triggers numeric keypad — bypassing Hangul entry.

### Validation timing

| Trigger | What |
| --- | --- |
| Typing | Format only. No errors yet. |
| Blur | Validate (>= min, <= max). Show error. |
| Quick chip | Re-validate immediately. If exceeds max, cap or show error. |

For "send transfer" flows: server-side validation also runs at submit (balance might have changed).

## States

| State | Visual |
| --- | --- |
| Empty | Placeholder (`0`), affix in muted color |
| Typing | Live formatting with caret preserved |
| Filled | Value formatted, affix prominent |
| Focus-visible | 2px ring (matches Input spec) |
| Error | Border red, `errorText` shown |
| Disabled | Muted, no events |
| Over balance | Amber border + warning text "잔액이 부족합니다" |

## Sizes

Inherited from Input. `lg` is most common for primary amount inputs (transfer screens, payment) — large touch target + readable digits.

| Size | Height | Font | Suggested affix size |
| --- | --- | --- | --- |
| `sm` | 32px | 14px | 13px |
| `md` (default) | 40px | 16px | 15px |
| `lg` | 56px | 24px (numerals) | 18px |

For amounts in primary CTAs: bump font to `display` size — 28–32px tabular numerals.

## Tokens consumed

```
--color-bg-default
--color-border-default
--color-border-strong
--color-text-primary
--color-text-secondary       (affix when not focused)
--color-text-tertiary
--color-error
--color-warning              (over-balance state)
--color-focus-ring
--color-primary-default      (chip active state)
--color-primary-subtle-bg    (chip bg)
--space-md, --space-base
--radius-md
--font-feature-amount: 'tnum' 1   (tabular numerals — critical)
--font-size-base, --font-size-xl, --font-size-2xl
--motion-fast
```

## Accessibility

- Input role: standard `<input type="text" inputmode="numeric">` (not `type="number"` — see [`patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md)).
- `aria-label` if no visible label. For a transfer screen, "Amount to send".
- `aria-describedby` linking to balance / error / help text.
- `aria-invalid="true"` on error.
- For `step` semantics: not strictly needed (text input), but `aria-valuemin` / `aria-valuemax` can be added for assistive tech.
- Quick chips and max button: standard `<button>` with `aria-label` describing what they do.

## Code example

```tsx
function TransferScreen() {
  const [amount, setAmount] = useState<number | null>(null);
  const balance = useBalance();
  const isOverBalance = amount && amount > balance;

  return (
    <div>
      <AmountInput
        label="보낼 금액"
        value={amount}
        onValueChange={setAmount}
        currency="KRW"
        affixStyle="suffix"
        max={balance}
        size="lg"
        showQuickChips
        showMaxButton
        showBalance
        balance={balance}
        errorText={isOverBalance ? "잔액이 부족합니다" : undefined}
        autoFocus
      />

      <Button
        size="lg"
        disabled={!amount || isOverBalance}
        loading={isTransferring}
        onClick={() => transfer(amount)}
      >
        {amount ? `${formatKRW(amount)}원 보내기` : "금액을 입력하세요"}
      </Button>
    </div>
  );
}
```

## Edge cases

- **Pasted negative**: strip the `-`. Use `min` validation, don't allow negative entry.
- **Decimal in KRW**: strip. KRW is integer.
- **Very large numbers** (≥ 100조 / 100 trillion): allowed but may not format prettily (Korean number names break down). Display as comma-separated digits.
- **Amount equal to balance** (sending all): allow if `max=balance`; balance becomes 0 after.
- **Balance changes mid-edit** (background sync updates): re-validate on next blur. Don't reset typed amount.
- **Multi-currency conversion display**: outside this component's scope. Pair with a separate display.
- **Max button when balance not loaded**: disable until balance arrives.
- **Auto-fill leaves bad format**: most browsers don't autofill amount inputs. If they do, re-format on detection.
- **0 as a valid value**: usually invalid for transfers (can't send 0). For 가계부, 0 might be valid (record a free meal). Pass `min={0}` as appropriate.

## Don't

- Don't use `type="number"` — strips formatting, scrolls on wheel, rejects commas.
- Don't render the affix as an editable character.
- Don't auto-submit on Enter without confirmation modal for transfer-type actions.
- Don't show currency conversion approximation without "약" annotation.
- Don't display the value formatted in a way the user didn't type (e.g., user types `100`, you display `100원`, then on blur convert to `1만`). Stay literal.
- Don't allow negative amounts via input.
- Don't fire validation on every keystroke. Wait for blur.

## API rationale

- **`value: number` (not formatted string)**: the source of truth is the integer. Formatting is presentation. Always pass numbers between AmountInput and the rest of the app.
- **`currency` prop drives format**: avoids passing 5 separate format props (decimals, separator, affix). One declarative prop.
- **Quick chips + max button as opt-in**: not all amount inputs need them. Form-field amount in a 가계부 receipt doesn't need quick chips.

## Cross-reference

- [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md) — comprehensive money-display rules
- [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md) — payment UX context
- [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md) — IME composition handling
- [`examples/component-input.md`](component-input.md) — base Input spec this extends
- [`examples/component-form.md`](component-form.md) — form orchestration
