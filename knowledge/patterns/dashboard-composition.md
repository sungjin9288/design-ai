<!-- hand-written -->
---
title: Dashboard composition
applies_to: [analytics, fintech, b2b-saas, all-data-ui]
---

# Dashboard composition

A dashboard is a single screen showing multiple metrics, charts, and tables. The composition (what goes where, how dense, how it scrolls) determines whether users **understand** their data or get lost.

## Three dashboard archetypes

| Type | Use | Density |
| --- | --- | --- |
| **Operational** | Real-time monitoring (DevOps, customer support, ATC) | Very high |
| **Analytical** | Exploration, reports, deep dives | Medium-high |
| **Strategic / Executive** | High-level KPIs, trends | Low — few widgets, big numbers |

Don't conflate them. An operational dashboard with 3 KPI cards is wasteful. An executive dashboard with 30 metrics is unreadable.

## The information hierarchy

A dashboard reads in zones:

```
┌────────────────────────────────────────────────────────────┐
│ Title + filters + last updated                             │  ← chrome
├────────────────────────────────────────────────────────────┤
│  KPI 1     KPI 2     KPI 3     KPI 4                       │  ← top: hero stats
├────────────────────────────────────────────────────────────┤
│  [Primary chart — biggest, most important trend]           │  ← upper-mid: trend
├────────────────────────────────────────────────────────────┤
│  [Secondary chart] [Tertiary chart]                        │  ← lower-mid: comparisons
├────────────────────────────────────────────────────────────┤
│  [Detail table — filterable, sortable, paginated]          │  ← bottom: drill-in
└────────────────────────────────────────────────────────────┘
```

The order matches the **5-second test**: at a glance, what should the user know?

1. **Top row (KPIs)**: the answer to "are we OK?" — single numbers, big, glanceable.
2. **Upper-mid (trend chart)**: the answer to "what's been happening?" — line/area chart over time.
3. **Lower-mid (comparisons)**: "what's driving it?" — breakdown by category, source, region.
4. **Bottom (detail table)**: "let me dig in" — sortable rows for analysts.

## Top row: KPI cards

A row of `Statistic` components. See [`examples/component-statistic.md`](../../examples/component-statistic.md).

| Count | Use |
| --- | --- |
| 2 | Hero stat + comparison (revenue + growth) |
| 3 | Three independent KPIs |
| 4 | Standard executive dashboard (4-up grid) |
| 5–6 | Operational (more is worse but sometimes needed) |
| 7+ | Too many — group or move to filters |

Each KPI card:
- One number (the metric)
- Label
- Optional sparkline (mini line chart inline)
- Optional delta indicator (vs prior period)

```
┌────────────────────────┐
│ 이번 달 매출             │
│ ₩2,847,500   ↑ 12%     │
│ ▁▂▃▅▆▇                  │
└────────────────────────┘
```

## Primary chart placement

The main chart sits **directly below** the KPI row. It's:
- Wide (full container width — 12 columns, or all of mobile width)
- Tall enough to read trends (typically 240–360px)
- Time-series almost always (line or area chart)
- Shows the **same metric** as the hero KPI, but over time

If the hero KPI is "monthly revenue", the primary chart is "monthly revenue trend".

## Secondary charts: 2-up

Two charts side by side. Common pairs:
- Trend + Breakdown (line + pie/donut)
- Categorical comparison (two bar charts)
- Geographic + categorical (map + bar)

On mobile: stack vertically. Don't try to fit 2-up on phones.

## Bottom: detail table

For users who want to drill in. See [`examples/component-table.md`](../../examples/component-table.md).
- Filterable
- Sortable
- Paginated
- Often: click row to open detail (pop-up or new screen)

The table is the **escape hatch from "executive summary"** to "I want the raw data".

## Density decisions

### Comfortable

For executive / strategic dashboards. Lots of whitespace, few widgets per screen, big numbers.

```
[KPI]  [KPI]              ← only 2 KPIs, big
   [primary chart]
[secondary]  [secondary]
```

### Standard

The 4-up KPI + primary + 2-up secondary + table pattern above. Most dashboards.

### Dense (operational)

Many widgets, smaller. Use sparingly. Consider layout grids:

```
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│ KPI │ │ KPI │ │ KPI │ │ KPI │ │ KPI │
└────┘ └────┘ └────┘ └────┘ └────┘
[primary  full-width chart  ]
[chart] [chart] [chart]
[chart] [chart] [chart]
[detail table]
```

Operational dashboards are often **single-page no-scroll** — designed for wall-mounted displays or constant-attention screens. Different design language.

## Filters and global controls

Top of the dashboard: chrome row with:
- **Time range picker**: "오늘 / 7일 / 30일 / 90일 / 연도 / 사용자 지정"
- **Filter chips**: applied filters with close buttons
- **Last updated** indicator: "방금 업데이트됨" or "10분 전"
- **Refresh button** (optional, for non-realtime dashboards)
- **Export / share** (optional)

Filters apply to the **whole page**. URL-sync them so refresh + share preserves state.

```
┌──────────────────────────────────────────────────────────┐
│ Sales Dashboard                                           │
│                                                           │
│ [최근 30일 ▾]  [지역: 서울 ✕]  [카테고리 ✕]  · 방금 업데이트│
└──────────────────────────────────────────────────────────┘
```

## Mobile patterns

Mobile dashboards are constrained by vertical screen. Approaches:

1. **Stack everything vertically** — KPI cards full-width, charts full-width.
2. **Tabs at the top** — "Overview / Sales / Users / Settings" — let user pick what to see.
3. **Cards-in-a-list** — each section is a Card; user scrolls through.

For Korean consumer fintech apps (Toss / KakaoBank style):
- Big hero stat at top (account balance with delta)
- Quick action grid (송금, 결제, 가계부)
- Recent activity list
- Discover / promo cards

This is more "home screen" than "dashboard" — different pattern, but the principles overlap.

## Color in dashboards

A dashboard with 5 charts can be visually chaotic. Restrain the palette:

- **One primary brand color** for the main metric / chart fill.
- **One accent color** for comparisons.
- **Money colors** (`--color-money-positive` / `--color-money-negative`) for delta indicators.
- **Neutral grays** for axes, gridlines, labels.

For categorical breakdown (5+ series): use a sequential or diverging palette per [`chart-color-encoding.md`](chart-color-encoding.md). Don't pick 5 random brand colors.

## Refresh and freshness

Cite [`realtime-data.md`](realtime-data.md) for the deeper pattern. Quick rules:
- Show "last updated" timestamp.
- Auto-refresh every 30s–5min depending on data velocity.
- For genuinely real-time: WebSocket updates with subtle "ping" indicator on changed values.
- For batch-updated dashboards (every hour): static snapshot + "다음 업데이트: 14:00".

## Empty / loading / error states

Each widget independently:
- **Loading**: skeleton matching the widget's shape.
- **Empty**: "데이터가 없습니다" + suggestion if applicable.
- **Error**: "불러오기 실패" + retry — doesn't break other widgets.

Cite [`empty-states.md`](empty-states.md) and [`error-states.md`](error-states.md).

## Density & responsive — rules of thumb

| Container width | Dashboard layout |
| --- | --- |
| < 600px (mobile) | Single column, all widgets stacked, KPIs become a 2-up or scrollable horizontal row |
| 600–960px (tablet) | KPIs 4-up, primary full-width, secondary 1-up |
| 960–1440px (laptop) | Standard layout: 4 KPIs, primary, 2-up secondary, table |
| > 1440px (large desktop) | Up to 6 KPIs, primary chart, 2 or 3-up secondary, side panel for filters |

## Print

Dashboards print badly by default. If print matters:
- Hide nav, filters, header chrome.
- Force 1-up layout (one widget per page).
- Print "captured at" timestamp at the bottom.

Or: redirect to a PDF export endpoint that renders a print-optimized version server-side.

## Accessibility

- Use semantic landmarks: `<main>`, `<section>` per major area.
- Each widget has a heading (`<h2>` or appropriate).
- Charts: provide text/table alternative (toggle "show data table" link).
- Color is not the only signal — pair with patterns or labels in charts.
- Live region (`aria-live="polite"`) for KPI value updates if real-time.
- Keyboard reachable: every interactive widget tab-reachable.
- See [`a11y/contrast.md`](../a11y/contrast.md) for chart text/axis contrast requirements.

## Korean considerations

- "대시보드" or "현황" / "요약" depending on tone.
- Date format: "2026.05.07" compact for axes.
- Numerical units: "₩1.2M" or "₩120만" — pick one and be consistent. See [`money-and-amount.md`](money-and-amount.md).
- Colors: Korean stock convention (red=up) applies for financial dashboards.
- Time zone: KST always (UTC+9, no DST).

## Common dashboard anti-patterns

- **Too many widgets** — 12+ on one screen. User can't focus.
- **All charts the same color** — no information hierarchy.
- **Inconsistent time ranges across widgets** — KPI shows "this month", chart shows "last 30 days" → confusing.
- **No "last updated" indicator** — user can't tell if data is fresh.
- **Animated number tickers as decoration** — distracting, not informative.
- **Charts without titles or legends** — ambiguous.
- **Chart and adjacent number disagreeing** — different filters applied.
- **Dashboard is just a wall of tables** — tables are detail; charts are summary.
- **Mobile dashboard that requires horizontal scroll** — hostile.

## Code example structure

```tsx
function SalesDashboard() {
  const filters = useFilters();
  const data = useDashboardData(filters);

  return (
    <Page>
      <DashboardHeader>
        <PageTitle>매출 현황</PageTitle>
        <DashboardFilters value={filters} onChange={setFilters} />
        <LastUpdated timestamp={data.timestamp} />
      </DashboardHeader>

      {/* KPI row */}
      <KpiRow>
        <Statistic label="이번 달 매출" value={data.revenue} delta={data.revenueDelta} />
        <Statistic label="신규 가입" value={data.signups} delta={data.signupsDelta} />
        <Statistic label="활성 사용자" value={data.activeUsers} delta={data.usersDelta} />
        <Statistic label="평균 주문 금액" value={data.aov} delta={data.aovDelta} />
      </KpiRow>

      {/* Primary trend chart */}
      <ChartCard title="매출 추이" subtitle="지난 30일">
        <LineChart data={data.revenueTrend} />
      </ChartCard>

      {/* Secondary 2-up */}
      <Grid cols={2}>
        <ChartCard title="카테고리별 매출">
          <BarChart data={data.byCategory} />
        </ChartCard>
        <ChartCard title="지역별 매출">
          <PieChart data={data.byRegion} />
        </ChartCard>
      </Grid>

      {/* Detail table */}
      <Table data={data.transactions} columns={transactionColumns} pagination />
    </Page>
  );
}
```

## Cross-reference

- [`knowledge/patterns/chart-color-encoding.md`](chart-color-encoding.md) — palette choices for charts
- [`knowledge/patterns/realtime-data.md`](realtime-data.md) — live update patterns
- [`knowledge/patterns/chart-types.md`](chart-types.md) — picking the right chart
- [`examples/component-statistic.md`](../../examples/component-statistic.md) — KPI card primitive
- [`examples/component-table.md`](../../examples/component-table.md) — detail table
- [`knowledge/layout/spacing-and-grid.md`](../layout/spacing-and-grid.md) — grid system
