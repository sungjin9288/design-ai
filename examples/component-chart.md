# `Chart` — spec

> Synthesized from shadcn-ui `chart` (Recharts wrapper). Themed chart container that handles theming, tooltips, legends, and accessibility for data visualization. Pairs with [`knowledge/patterns/chart-types.md`](../knowledge/patterns/chart-types.md) for chart-type selection.

## When to use

- **Dashboards** with consistent chart styling.
- **Report / analytics** views.
- **In-product data viz** (account balance over time, usage stats).

When NOT to use:
- Single-value display (use `Statistic`).
- Tabular data (use `Table`).
- Maps / geographic (use a dedicated map component).

`Chart` is a **wrapper / theming layer**, not a chart engine. Underlying engine is Recharts (or D3 / VisX). The wrapper gives you brand-consistent tooltips, colors, legends, accessibility.

## Anatomy

```
┌─────────────────────────────────────────┐
│ Title                              [⋮]  │
├─────────────────────────────────────────┤
│  10K ┤                                  │
│      │       ╱─────╲                    │
│   5K ┤    ╱╱        ╲                    │
│      │ ╱╱            ╲╱╲╲                │
│      │                                  │
│   0K └────────────────────────────       │
│      Jan  Feb  Mar  Apr  May  Jun        │
│                                         │
│  ●  Revenue   ●  Cost                   │  ← legend
└─────────────────────────────────────────┘
```

## API

```tsx
<Chart
  config={{
    revenue: { label: "Revenue", color: "var(--chart-1)" },
    cost:    { label: "Cost", color: "var(--chart-2)" },
  }}
  className="h-72"
>
  <LineChart data={data}>
    <CartesianGrid />
    <XAxis dataKey="month" />
    <YAxis />
    <ChartTooltip content={<ChartTooltipContent />} />
    <ChartLegend content={<ChartLegendContent />} />
    <Line dataKey="revenue" stroke="var(--color-revenue)" />
    <Line dataKey="cost" stroke="var(--color-cost)" />
  </LineChart>
</Chart>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `config` | `{ [key: string]: { label, color } }` | required | Mapping of series key → label + color |
| `children` | `Recharts component tree` | — | The chart definition |
| `className` | `string` | — | Style override |

The `config` becomes CSS variables (`--color-{key}`) on the wrapper, so child Recharts components reference them as `stroke="var(--color-revenue)"`. Theming flows from the wrapper.

## Composition

| Part | Purpose |
| --- | --- |
| `Chart` (Container) | Wrapper; injects theme + a11y |
| `ChartTooltip` | Themed tooltip wrapper (Recharts Tooltip + custom content) |
| `ChartTooltipContent` | Default tooltip content with brand styling |
| `ChartLegend` | Themed legend wrapper |
| `ChartLegendContent` | Default legend content |
| `ChartStyle` | Auto-injects CSS variables from `config` |

User wraps Recharts primitives (`LineChart`, `BarChart`, `Line`, `Bar`, `XAxis`, etc.) inside `Chart`.

## Chart types (engine-agnostic)

The wrapper supports any Recharts chart type. See [`knowledge/patterns/chart-types.md`](../knowledge/patterns/chart-types.md) for selection guidance.

| Chart type | Use |
| --- | --- |
| Line | Trend over continuous (time, scale) |
| Area | Trend with cumulative emphasis |
| Bar | Discrete comparison |
| Stacked bar | Composition over discrete |
| Pie / donut | Part-of-whole (max 5 slices) |
| Scatter | Correlation between two variables |
| Radar | Multi-dimensional comparison |
| Heatmap | Density across two dimensions |
| Treemap | Hierarchy with size encoding |

Each becomes a Recharts `<XYZChart>` inside `<Chart>`.

## Korean stock convention (CRITICAL)

Korean stock charts use **inverted color encoding**: red = up, blue = down (opposite of Western convention).

```tsx
<Chart config={{
  rise: { label: "상승", color: "var(--color-stock-up)" },    // red in KR
  fall: { label: "하락", color: "var(--color-stock-down)" },  // blue in KR
}}>
  ...
</Chart>
```

Tokens cascade through theme. See [`knowledge/patterns/chart-color-encoding.md`](../knowledge/patterns/chart-color-encoding.md) and [`examples/component-stock-chart.md`](component-stock-chart.md) for KR-specific stock chart spec.

For non-stock data viz: use Western convention (green=up, red=down).

## States

| State | Visual |
| --- | --- |
| Loading | Skeleton showing chart shape; Recharts won't render until data arrives |
| Empty (no data) | Empty state message in chart area |
| Hover (data point) | Tooltip with series + value |
| Hover (series legend) | Other series dimmed, hovered series emphasized |
| Active selection | Persistent selected point / range |

## Tokens consumed

```
--chart-1  through  --chart-N         (series color palette; typically 8-12 distinct hues)
--chart-grid                           (background gridlines)
--chart-axis                           (axis labels, ticks)
--chart-tooltip-bg                     (tooltip surface)
--chart-tooltip-border
--chart-tooltip-fg
--chart-legend-fg
--color-stock-up                       (Korean: red)
--color-stock-down                     (Korean: blue)
```

shadcn names them `--chart-1` ... `--chart-5` (5 distinct series colors). For more series, extend with `--chart-6+` or use ordinal palette generation.

## Accessibility

- Chart container: `<figure>` with `<figcaption>` for the chart title.
- `role="img"` + `aria-label` describing the chart's main takeaway ("Revenue rose 30% from Jan to Jun").
- **Provide a data table alternative** for screen reader users: hidden `<table>` adjacent OR toggleable "View as table" button.
- Legend items: focusable; activating legend toggles series visibility.
- Tooltip: `aria-live="polite"` so changes announce on hover / focus.
- High contrast mode: ensure series colors are distinguishable (don't rely on hue alone — use shape encoding for points or pattern for areas).

```tsx
<Chart config={config} aria-label="월별 매출 추이">
  ...
</Chart>
<details>
  <summary>표로 보기</summary>
  <table>{/* same data as table */}</table>
</details>
```

## Code example — Korean fintech dashboard

```tsx
function RevenueChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>월별 매출</CardTitle>
        <CardDescription>2025년 6월부터 11월까지</CardDescription>
      </CardHeader>
      <CardContent>
        <Chart
          config={{
            revenue: { label: "매출", color: "var(--chart-1)" },
            cost:    { label: "비용", color: "var(--chart-2)" },
            profit:  { label: "이익", color: "var(--chart-3)" },
          }}
          className="h-72"
        >
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={(m) => `${m}월`}
            />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K원`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} />
            <Line dataKey="cost" stroke="var(--color-cost)" strokeWidth={2} />
            <Line dataKey="profit" stroke="var(--color-profit)" strokeWidth={2} />
          </LineChart>
        </Chart>
      </CardContent>
    </Card>
  );
}
```

## Edge cases

- **Empty data**: render empty state inside chart area, not a broken axis.
- **Single data point**: line / area charts can't render lines; consider Statistic + sparkline instead.
- **Very long X-axis** (60+ ticks): rotate labels OR aggregate (week vs day).
- **Mixed scale** (e.g., revenue in won, count in units): use dual axis (Recharts `<YAxis yAxisId="right">`).
- **Color-blind users**: redundant encoding — series color + line style (solid / dashed / dotted) + point shape (circle / square / triangle).
- **RTL**: Recharts handles axis direction via `reverse` prop.
- **Reduced motion**: disable Recharts default animations (`isAnimationActive={false}`).
- **Dark mode**: tokens cascade; verify chart bg, gridlines, tooltip remain visible.

## Performance

- For large datasets (10K+ points): consider downsampling or windowing.
- Recharts uses SVG; very large charts may slow. Canvas-based engines (Visx, Plot) faster.
- Avoid re-rendering the whole chart on every state change; memoize data transforms.

## Don't

- Don't use Western color convention for Korean stock charts. Red=up.
- Don't use 5+ series in one line/bar chart — visual noise. Split or aggregate.
- Don't omit data table alternative for screen reader users.
- Don't rely on color alone for series differentiation.
- Don't auto-animate every render — disorienting; use only on initial draw.
- Don't put title inside the chart (use Card / heading above) — better legibility.
- Don't crop axis to make small differences look big — misleading. Start at 0 unless explicitly justified.

## References

- shadcn-ui: [`chart`](../docs/reference/shadcn-ui.md#chart) (Recharts wrapper)
- Recharts: <https://recharts.org/>
- Edward Tufte's *The Visual Display of Quantitative Information* — chart design fundamentals

## Cross-reference

- [`examples/component-stock-chart.md`](component-stock-chart.md) — KR stock convention specifics
- [`knowledge/patterns/chart-types.md`](../knowledge/patterns/chart-types.md) — chart-type selection
- [`knowledge/patterns/chart-color-encoding.md`](../knowledge/patterns/chart-color-encoding.md) — color encoding
- [`knowledge/patterns/dashboard-composition.md`](../knowledge/patterns/dashboard-composition.md) — dashboard layout
- [`examples/component-statistic.md`](component-statistic.md) — single-value alternative
