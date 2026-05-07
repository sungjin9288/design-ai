# `Statistic` — spec

> Citing Ant Design `Statistic`, MUI (no direct equivalent — composition), shadcn-ui (composition)

## Purpose

Displays a single number prominently — a KPI, count, balance, or metric. The "hero number" of a card or dashboard tile.

## When Statistic vs alternatives

| Pattern | Use |
| --- | --- |
| **Statistic** | Single value with label + optional delta/trend |
| **AmountInput display** (read-only) | Editable monetary value |
| **Progress** | Completion % with bar/ring |
| **Chart** | Time-series or comparison data |
| **Card with body text** | Number is part of a paragraph |

Use Statistic when the number is the message. The label, delta, and unit are supporting cast.

## Anatomy

```
┌──────────────────────────────┐
│ 이번 달 매출                   │ ← label
│                              │
│ ₩2,847,500                   │ ← value (display tier, tabular numerals)
│                              │
│ ↑ 12% vs 지난 달               │ ← delta (optional, color-coded)
└──────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Label / title | yes | What this number is |
| Value | yes | The number itself, formatted |
| Prefix / suffix | optional | Currency symbol, unit |
| Delta indicator | optional | Trend arrow + comparison ("↑ 12%") |
| Tooltip / icon | optional | "i" icon for definition |
| Trend chart (sparkline) | optional | Tiny line chart inline |

## API

```tsx
<Statistic
  label="이번 달 매출"
  value={2847500}
  prefix="₩"
  precision={0}
  delta={{ value: 0.12, period: "지난 달 대비" }}
/>

<Statistic
  label="활성 사용자"
  value={1247}
  delta={{ value: -0.03, period: "지난 주" }}
  variant="compact"
/>

<Statistic
  label="응답 시간"
  value={328}
  suffix="ms"
  delta={{ value: -0.15, period: "지난 시간", goalDirection: "down" }}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string \| ReactNode` | — | Required. What the number is. |
| `value` | `number \| string` | — | Required. The number (or pre-formatted string). |
| `prefix` | `string \| ReactNode` | — | E.g., `₩`, `$`, icon |
| `suffix` | `string \| ReactNode` | — | E.g., `원`, `%`, `ms` |
| `precision` | `number` | `0` (KRW) / `2` (USD/EUR) | Decimal places |
| `groupSeparator` | `string` | `,` | Thousands separator |
| `decimalSeparator` | `string` | `.` | |
| `delta` | `Delta` | — | Comparison indicator |
| `variant` | `"default" \| "compact"` | `"default"` | |
| `size` | `"sm" \| "md" \| "lg" \| "xl"` | `"lg"` | Value font size |
| `loading` | `boolean` | `false` | Skeleton |
| `tooltip` | `string` | — | Hover definition (small `i` icon next to label) |
| `sparkline` | `number[]` | — | Optional inline mini chart |

```ts
type Delta = {
  value: number;            // 0.12 means +12%; -0.03 means -3%
  period: string;           // "지난 달 대비" / "vs last month"
  goalDirection?: "up" | "down" | "neutral";  // up=positive trend
};
```

## Sizes

| Size | Value font | Label | Use |
| --- | --- | --- | --- |
| `sm` | 18px | 12px | Sidebar, dashboard tile inside a card |
| `md` | 24px | 13px | Standard KPI card |
| `lg` (default) | 32px | 14px | Hero KPI in a dashboard |
| `xl` | 48px | 16px | Single hero stat (account balance display) |

For account balance / hero amounts: `xl` with `tnum` font feature for tabular numerals.

## Delta — color and direction semantics

The delta value's color depends on whether the trend is "good":

```ts
const goodTrend = delta.goalDirection === "up" ? delta.value > 0 : delta.value < 0;
const color = goodTrend ? "money-positive" : "money-negative";
```

| Stat | `goalDirection` | Positive delta = | Color |
| --- | --- | --- | --- |
| Revenue | `up` | Good | `money-positive` (green or red KR-stocks) |
| Errors / latency | `down` | Bad | `money-negative` |
| Conversion rate | `up` | Good | `money-positive` |
| Bounce rate | `down` | Bad | `money-negative` |
| Active users | `up` | Good | `money-positive` |

Default: `up`. Most metrics are "more is better".

For Korean stock UIs: see [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md) — color convention is inverted (red=up).

### Delta visual

```
↑ 12% vs 지난 달          ← positive trend, good direction (green/red)
↓ 3% vs 지난 주            ← negative trend, color depends on goalDirection
─ vs 지난 달               ← no change (gray)
```

Delta arrows: `↑` `↓` are most common. Some apps use `▲` `▼` for stocks.

## Variants

### Default

Vertical stack: label top, value middle, delta bottom.

### Compact

Single line: `Label  Value  ±Delta`.

```
이번 달 매출    ₩2,847,500    ↑ 12%
```

Use in dense table cells, sidebar lists.

### Hero

`xl` size, often with sparkline inline:

```
Account balance
₩2,847,500     ▁▂▃▅▆▇  ← sparkline
↑ 12% 이번 달
```

## Tokens consumed

```
--color-text-primary
--color-text-secondary           (label)
--color-text-tertiary
--color-money-positive            (good delta)
--color-money-negative            (bad delta)
--color-money-neutral             (no change)
--space-xs, --space-sm
--font-size-base, --font-size-xl, --font-size-2xl
--font-feature-amount: 'tnum' 1   (tabular numerals)
--font-weight-semibold (value)
--font-weight-regular (label)
```

## Sparkline (inline mini chart)

When passed `sparkline`:
- Renders a small line chart inside the Statistic body.
- Width: ~60–80px, height: 16–24px.
- Single line, no axes, no labels — just shape.
- Color matches the delta direction (or stays neutral).

For libraries: `react-sparklines`, `recharts` mini variant, or hand-roll an SVG.

## States

| State | Visual |
| --- | --- |
| Default | Resting |
| Loading | Skeleton placeholders for label + value |
| No data / undefined | Show `—` or "—" instead of "0" — clarifies vs zero |
| Error | "—" + tooltip explaining failure |

## Accessibility

- Label is associated with value via DOM proximity (no special wiring needed for static stats).
- Numeric value: `aria-label="이번 달 매출 ₩2,847,500"` if the visual format is hard for screen readers.
- Delta: also include in aria-label — "12% increase vs last month".
- Don't rely on color alone for delta direction — the arrow does the work.

```html
<div class="statistic">
  <div class="label">이번 달 매출</div>
  <div class="value" aria-label="이번 달 매출 290만 원, 지난 달 대비 12% 증가">
    ₩2,847,500
  </div>
  <div class="delta delta--positive" aria-hidden="true">↑ 12%</div>
</div>
```

## Code example

```tsx
// Hero balance
<Statistic
  label="사용 가능 금액"
  value={user.balance}
  prefix="₩"
  size="xl"
  delta={{ value: 0.04, period: "이번 달", goalDirection: "up" }}
/>

// KPI grid
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <Card><Statistic label="신규 가입" value={47} delta={{ value: 0.18, period: "지난 주" }} /></Card>
  <Card><Statistic label="활성 사용자" value={1247} delta={{ value: -0.03, period: "지난 주" }} /></Card>
  <Card><Statistic label="평균 응답 시간" value={328} suffix="ms" delta={{ value: -0.15, period: "지난 시간", goalDirection: "down" }} /></Card>
  <Card><Statistic label="에러율" value={0.012} suffix="%" delta={{ value: 0.005, period: "지난 시간", goalDirection: "down" }} precision={3} /></Card>
</div>

// Compact in a sidebar
<aside>
  <Statistic variant="compact" label="잔액" value={user.balance} prefix="₩" />
  <Statistic variant="compact" label="활동 수" value={user.activityCount} />
</aside>

// Loading state
<Statistic loading label="이번 달 매출" />

// No data
<Statistic label="평균 응답 시간" value="—" />
```

## Edge cases

- **Zero value with no delta**: render as `0` with no trend indicator.
- **Negative value** (loss, debt): use `--color-money-negative` for the value, optionally show `−` prefix.
- **Very large numbers** (1조+): display normally with separators; for hero contexts, consider Korean compact form ("1.2조원" instead of "1,200,000,000,000원").
- **Currency symbol with locale**: `₩` for KRW, `$` for USD; respect the user's locale preference.
- **Sparkline with insufficient data** (< 2 points): hide sparkline.
- **Delta of exactly 0**: render `─ vs 지난 달` (no arrow).
- **Time-period without comparison data**: omit delta entirely.
- **Stat that's a fraction** ("12 of 50"): render as compound — `<Statistic value="12 / 50" />` rather than just 12.

## Don't

- Don't put 10+ Statistics in one row. 4–6 max for a KPI grid.
- Don't use Statistic for non-numeric "stats" like "Most popular: Coffee" — that's a Card with body text.
- Don't auto-update Statistic without a visual cue. Number-tick animations are OK; flashes are not.
- Don't use `--color-error` for negative-trend values. Use `--color-money-negative`.
- Don't show delta for static values that don't change (e.g., "Member since 2024-01-15").
- Don't omit the label. "₩2,847,500" alone is unintelligible.
- Don't use proportional numerals — use tabular for column alignment.

## References

- Ant Design: [`refs/ant-design/components/statistic/`](../refs/ant-design/components/statistic/) — `Statistic` + `Statistic.Countdown` (auto-counting). Solid baseline.
- MUI: no dedicated component — compose `<Card><CardContent><Typography variant="overline">label</Typography>...`.
- shadcn-ui: no built-in. Compose from `Card` + Tailwind.

API choices made:
- **`delta` as a structured prop** rather than rendered string: enables consistent color/arrow logic.
- **`goalDirection` opt-in**: most metrics are "up = good"; let consumer flip when needed.
- **Tabular numerals enforced** via `font-feature-settings`: KPI grids align cleanly.

## Cross-reference

- [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md) — money color semantics + tabular numerals
- [`knowledge/patterns/dashboard-composition.md`](../knowledge/patterns/dashboard-composition.md) — placing Statistics in a dashboard
- [`examples/component-card.md`](component-card.md) — wrapping Statistic in a Card
- [`examples/component-progress.md`](component-progress.md) — alternative for completion-style metrics
