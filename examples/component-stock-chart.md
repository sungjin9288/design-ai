# `StockChart` (custom — Korean stock convention) — spec

> Custom component pattern. Korean stock apps use **inverted color convention** — red for gains, blue for losses. Critical to get right.

## Purpose

Renders stock price data: candlestick chart, line chart, or volume bars. Used in: Korean stock trading apps (Kiwoom, NH투자, Toss Securities, Samsung Securities).

## Korean color convention (CRITICAL)

| Direction | Korean stock convention | Western convention |
| --- | --- | --- |
| Up / Gain | 🔴 **Red** | 🟢 Green |
| Down / Loss | 🔵 **Blue** | 🔴 Red |
| Unchanged | Gray | Gray |

This is **inverted from Western** apps. Cite [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md).

For multi-locale apps: provide a settings toggle ("색상 표시: 한국 / 서양") but **default to Korean for KR users**.

## Anatomy

```
   1. Candlestick:                  2. Line + area:               3. Volume:
   ┃     ┃▲                                                   ┃ ┃   ┃
  ┃▲ ┃▲ ┃                          ─╮  ╭─╮                  ┃ ┃ ┃ ┃ ┃
  ┃ ┃ ┃                            ╱  ╲╱  ╲                 ┃ ┃ ┃ ┃ ┃
   ┃▼  ┃▼                       ──╯              ╲          ┃ ┃ ┃ ┃ ┃
       ┃                                          ╲─        ┃ ┃ ┃ ┃ ┃

  Date axis →
```

| Slot | Required | Notes |
| --- | --- | --- |
| Chart area | yes | Candle / line / bar rendering |
| Time-range tabs | usually | 1일 / 1주 / 1개월 / 6개월 / 1년 / 5년 / 전체 |
| Y-axis labels | yes | Price points, formatted as KRW |
| X-axis labels | yes | Dates |
| Crosshair (hover) | optional | Vertical + horizontal line + price + date callout |
| Volume sub-chart | optional | Below price chart |

## API

```tsx
<StockChart
  data={priceData}
  type="candle"
  range="1month"
  onRangeChange={setRange}
  showVolume
  korConvention                // explicit toggle
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `PricePoint[]` | — | Series of price points |
| `type` | `"candle" \| "line" \| "area"` | `"candle"` | Chart type |
| `range` | `"1day" \| "1week" \| "1month" \| "3month" \| "6month" \| "1year" \| "5year" \| "all"` | `"1month"` | Time window |
| `onRangeChange` | `(range) => void` | — | |
| `showVolume` | `boolean` | `true` | Render volume bars below |
| `korConvention` | `boolean` | `true` (KR locale) | Red=up, blue=down |
| `crosshair` | `boolean` | `true` | Hover indicator |
| `tooltip` | `boolean \| (point) => ReactNode` | `true` | |
| `loading` | `boolean` | `false` | |
| `onCrosshairChange` | `(point) => void` | — | When user hovers |
| `compareSeries` | `PriceSeries[]` | — | Overlay another stock for comparison |

```ts
type PricePoint = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
```

## Color tokens

```
--color-stock-up           = #DC2626   (red — Korean) / #16A34A (green — Western)
--color-stock-down         = #2563EB   (blue — Korean) / #DC2626 (red — Western)
--color-stock-unchanged    = --color-text-tertiary
--color-stock-volume       = --color-text-tertiary (subdued)
--color-chart-grid         = --color-border-default
--color-chart-axis         = --color-text-tertiary
--color-chart-bg           = --color-bg-default
--color-crosshair          = --color-text-secondary
```

Toggle via theme based on user's locale or preference.

## Behavior

### Range selector

Above or below the chart:
```
[1일] [1주] [1개월] [3개월] [6개월] [1년] [5년] [전체]
              ↑ active
```

Click → re-fetches and re-renders.

### Crosshair on hover

Hover over the chart shows:
- Vertical line at the date hovered
- Horizontal line at the price
- Tooltip: date + open/high/low/close + volume

```
2026.05.07
시가: ₩78,500
고가: ₩79,200
저가: ₩78,200
종가: ₩78,800
거래량: 1.2M
```

For touch devices: tap to show, tap elsewhere to dismiss.

### Crosshair sync

If volume sub-chart is shown: crosshair vertical line spans both charts.

## States

| State | Visual |
| --- | --- |
| Default | Chart rendered |
| Loading | Skeleton showing chart shape |
| Error | "차트를 불러올 수 없어요" with retry |
| Empty (no data) | "데이터가 없습니다" |
| Hover (desktop) | Crosshair + tooltip |
| Touch (mobile) | Tap to show crosshair, swipe to scrub |

## Performance

Stock charts can have 1000s of points. Optimize:

- Use **Canvas / WebGL** rendering, not SVG (SVG breaks down past ~500 nodes).
- Libraries: `lightweight-charts` (TradingView's), `recharts` (SVG-based, smaller datasets), `apexcharts`.
- Aggregate data on long ranges (e.g., 5년 view shows monthly candles, not daily).
- Throttle hover updates to 60fps max.

For Korean apps: TradingView's `lightweight-charts` is widely used (small bundle, performant).

## Tokens consumed

```
--color-stock-up
--color-stock-down
--color-stock-unchanged
--color-stock-volume
--color-chart-grid
--color-chart-axis
--color-chart-bg
--color-crosshair
--color-text-primary, --color-text-secondary
--font-mono                 (price labels — tabular numerals)
--font-feature-amount: 'tnum' 1
--space-md
--motion-fast
```

## Accessibility

Charts are visual — ensure text alternatives:

- `<figure aria-label="삼성전자 1개월 주가 차트">`
- Provide a "데이터 표 보기" link that opens a tabular view of the same data.
- Crosshair tooltip should be visible (not just hover-only) — tap pattern on mobile.
- Text alternative: range, current price, change %, time period.

```html
<figure aria-label="삼성전자 1개월 차트, 종가 ₩78,800, 1.5% 상승">
  <Chart />
  <button onClick={openTableView}>데이터 표 보기</button>
</figure>
```

## Code example

```tsx
function StockDetailScreen({ symbol }: Props) {
  const [range, setRange] = useState("1month");
  const { data, loading } = useStockHistory(symbol, range);
  const userPrefersKorean = useUserPreference("stockColors") === "korean";

  return (
    <div>
      <StockChart
        data={data}
        type="candle"
        range={range}
        onRangeChange={setRange}
        showVolume
        korConvention={userPrefersKorean}
        loading={loading}
      />

      <RangeSelector value={range} onChange={setRange} />

      <Stat label="종가" value={data?.[data.length - 1]?.close} type="amount" />
      <Stat
        label="등락"
        value={data?.[data.length - 1]?.changePercent}
        valueColor={getStockColor(change, userPrefersKorean)}
      />
    </div>
  );
}
```

## Edge cases

- **Pre-market / after-hours data**: dim or annotate. Korean exchanges (KOSPI/KOSDAQ) trade 9:00–15:30 KST.
- **Holiday gaps**: skip (don't show empty space). Korean holidays affect the calendar.
- **Stock splits / dividends**: annotate with markers on the date.
- **Currency**: KRW (no decimals). Some stocks are USD (US-listed); show currency in label.
- **Pinch-zoom on mobile**: support if range is "all" or longer.
- **Crosshair on tiny screens**: tooltip should adjust to not overflow.

## Don't

- Don't use Western (green=up) colors in Korean apps without an explicit toggle.
- Don't use red and green as the only signals (color-blind users) — pair with arrows or text.
- Don't render 5,000+ candles as SVG — use canvas.
- Don't show the chart without OHLC values somewhere accessible.
- Don't auto-update the chart while user is hovering (jarring).

## References

No upstream component is exactly this — Korean stock convention is non-standard. Closest:
- TradingView's `lightweight-charts` library (most popular)
- Apache ECharts `candlestick` series
- Recharts `Line` + custom candle rendering

This is a **custom pattern + library wrapper** specific to Korean fintech.

## Cross-reference

- [`knowledge/patterns/money-and-amount.md`](../knowledge/patterns/money-and-amount.md) — Korean stock color convention
- [`knowledge/patterns/chart-color-encoding.md`](../knowledge/patterns/chart-color-encoding.md) — chart color rules
- [`knowledge/patterns/chart-types.md`](../knowledge/patterns/chart-types.md) — when candle vs line vs area
- [`knowledge/patterns/realtime-data.md`](../knowledge/patterns/realtime-data.md) — live price updates pattern
- [`knowledge/i18n/korean-payments.md`](../knowledge/i18n/korean-payments.md) — Korean fintech context
