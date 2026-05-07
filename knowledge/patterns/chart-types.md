---
title: Chart type selection guide
source: refs/ui-ux-pro-max/src/ui-ux-pro-max/data/charts.csv
upstream: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
extracted_at: 2026-05-07
applies_to: [data-visualization, dashboard, web]
---

# Chart type selection guide

For each data type, the right chart, the wrong chart, and the accessibility floor. Use as a lookup before opening any charting library.

| # | Data type | Best chart | Secondary | When to use | When NOT to use |
| --- | --- | --- | --- | --- | --- |
| 1 | **Trend Over Time** | Line Chart | Area Chart, Smooth Area | Data has a time axis; user needs to observe rise/fall trends or rate of change o | Fewer than 4 data points (use stat card); more than 6 series (visual noise); no  |
| 2 | **Compare Categories** | Bar Chart (Horizontal or Vertical) | Column Chart, Grouped Bar | Comparing discrete categories by magnitude; ranking or ordering is the core insi | Categories > 15 (use table or search); data has time dimension (use line); showi |
| 3 | **Part-to-Whole** | Pie Chart or Donut | Stacked Bar, Waffle Chart | ≤5 categories; one dominant segment vs rest; emphasis on visual proportion over  | Categories > 5; slice differences < 5% (visually indistinguishable); user needs  |
| 4 | **Correlation / Distribution** | Scatter Plot or Bubble Chart | Heat Map, Matrix | Exploring relationship between two continuous variables; identifying clusters or | Variables are categorical (use grouped bar); fewer than 20 points (patterns aren |
| 5 | **Heatmap / Intensity** | Heat Map or Choropleth | Grid Heat Map, Bubble Heat | Showing intensity/density across a 2D grid; time-based patterns (e.g., activity  | Fewer than 20 cells (use bar); user needs to read exact values; colorblind users |
| 6 | **Geographic Data** | Choropleth Map or Bubble Map | Geographic Heat Map | Data has a regional/location dimension; spatial distribution is the core insight | Regions have very different sizes making visual comparison misleading (use bar); |
| 7 | **Funnel / Flow** | Funnel Chart or Sankey | Waterfall (for flows) | Sequential multi-stage process; showing conversion or drop-off rates between def | Stages aren't sequential; values don't decrease monotonically (use bar); fewer t |
| 8 | **Performance vs Target** | Gauge Chart or Bullet Chart | Dial, Thermometer | Single KPI measured against a defined target or threshold; dashboard summary con | No target or benchmark exists; comparing multiple KPIs at once (use bullet chart |
| 9 | **Time-Series Forecast** | Line with Confidence Band | Ribbon Chart | Historical data + model predictions; communicating uncertainty range to non-tech | No historical baseline; prediction confidence is too low to be useful; audience  |
| 10 | **Anomaly Detection** | Line Chart with Highlights | Scatter with Alert | Monitoring a time-series for outliers; alerting users to unexpected spikes or di | Anomalies are predefined categories (use bar with highlight); real-time context  |
| 11 | **Hierarchical / Nested Data** | Treemap | Sunburst, Nested Donut, Icicle | Showing size relationships within a hierarchy; overview of proportional structur | Hierarchy depth > 3 levels (too complex to read); user needs to compare sibling  |
| 12 | **Flow / Process Data** | Sankey Diagram | Alluvial, Chord Diagram | Showing how quantities flow between nodes; multi-source multi-target distributio | Flow directions form loops (use network graph); fewer than 3 source-target pairs |
| 13 | **Cumulative Changes** | Waterfall Chart | Stacked Bar, Cascade | Showing how individual positive/negative components add up to a final total (e.g | Changes are not additive; more than 12 bars (readability breaks); audience expec |
| 14 | **Multi-Variable Comparison** | Radar / Spider Chart | Parallel Coordinates, Grouped Bar | Comparing multiple entities across the same fixed set of attributes (e.g., produ | Axes > 8 (unreadable); values need precise comparison (use grouped bar); audienc |
| 15 | **Stock / Trading OHLC** | Candlestick Chart | OHLC Bar, Heikin-Ashi | Financial time-series with Open/High/Low/Close data; trading or investment produ | Non-financial audience; no OHLC data available (use line chart); accessibility-f |
| 16 | **Relationship / Connection Data** | Network Graph | Hierarchical Tree, Adjacency Matrix | Mapping connections between entities; network topology or social graph explorati | Node count > 500 without clustering pre-applied; user needs precise connection c |
| 17 | **Distribution / Statistical** | Box Plot | Violin Plot, Beeswarm | Showing spread, median, and outliers of a dataset; comparing distributions acros | Fewer than 20 data points per group (distribution is not meaningful); audience u |
| 18 | **Performance vs Target (Compact)** | Bullet Chart | Gauge, Progress Bar | Dashboard with multiple KPIs side by side; space-constrained contexts where a ga | Single KPI with emphasis (use gauge); data has no defined target range; fewer th |
| 19 | **Proportional / Percentage** | Waffle Chart | Pictogram, Stacked Bar 100% | Showing what fraction of a whole is filled; percentage progress in a visually en | More than 5 categories (use stacked bar); exact values matter over visual propor |
| 20 | **Hierarchical Proportional** | Sunburst Chart | Treemap, Icicle, Circle Packing | Exploring nested proportions where both hierarchy and relative size matter (e.g. | More than 3 hierarchy levels (outer rings become unreadable); precision matters  |
| 21 | **Root Cause Analysis** | Decomposition Tree | Decision Tree, Flow Chart | Decomposing a metric into contributing factors; AI-assisted analysis or BI drill | No clear parent-child causal relationship; audience expects a summary rather tha |
| 22 | **3D Spatial Data** | 3D Scatter / Surface Plot | Volumetric Rendering, Point Cloud | Scientific/engineering context where Z-axis carries essential info not expressib | 2D projection conveys the same insight; mobile context; accessibility-required e |
| 23 | **Real-Time Streaming** | Streaming Area Chart | Ticker Tape, Moving Gauge | Live monitoring dashboards; IoT/ops data updating at ≥1 Hz; user needs current v | Update frequency < 1/min (use periodic-refresh line chart); flashing content wit |
| 24 | **Sentiment / Emotion** | Word Cloud with Sentiment | Sentiment Arc, Radar Chart | NLP output visualization; exploratory analysis of text corpus sentiment; frequen | Precise values matter (word size is inherently imprecise); screen-reader context |
| 25 | **Process Mining** | Process Map / Graph | Directed Acyclic Graph (DAG), Petri Net | Analyzing event logs to visualize actual process flows; identifying bottlenecks  | No event log data available; audience expects a static flowchart (use diagram to |

## Detailed specs

### 1. Trend Over Time → Line Chart

- **When to use**: Data has a time axis; user needs to observe rise/fall trends or rate of change over a continuous period
- **When NOT to use**: Fewer than 4 data points (use stat card); more than 6 series (visual noise); no time dimension exists
- **Volume threshold**: <1000 pts: SVG; ≥1000 pts: Canvas + downsampling; >10000: aggregate to intervals
- **Color guidance**: Primary: #0080FF. Multiple series: distinct colors + distinct line styles. Fill: 20% opacity
- **A11y grade**: AA
- **A11y notes**: Differentiate series by line style (solid/dashed/dotted) not color alone. Add pattern overlays for colorblind users.
- **A11y fallback**: Dashed/dotted lines per series; togglable data table with timestamps and values
- **Library**: Chart.js, Recharts, ApexCharts
- **Interactive level**: Hover + Zoom

### 2. Compare Categories → Bar Chart (Horizontal or Vertical)

- **When to use**: Comparing discrete categories by magnitude; ranking or ordering is the core insight; categories ≤ 15
- **When NOT to use**: Categories > 15 (use table or search); data has time dimension (use line); showing proportions (use waffle/stacked)
- **Volume threshold**: <20 categories: vertical bar; 20–50: horizontal bar; >50: paginated table
- **Color guidance**: Each bar: distinct color. Grouped: same hue family. Always sort descending by value
- **A11y grade**: AAA
- **A11y notes**: Value labels on each bar by default. Sort control for user reordering.
- **A11y fallback**: Value labels always visible; provide CSV export
- **Library**: Chart.js, Recharts, D3.js
- **Interactive level**: Hover + Sort

### 3. Part-to-Whole → Pie Chart or Donut

- **When to use**: ≤5 categories; one dominant segment vs rest; emphasis on visual proportion over exact values
- **When NOT to use**: Categories > 5; slice differences < 5% (visually indistinguishable); user needs precise values; accessibility-first context
- **Volume threshold**: Max 6 slices; beyond that switch to stacked bar 100%
- **Color guidance**: 5–6 max colors. Contrasting palette. Largest slice at 12 o'clock. Always label slices with %
- **A11y grade**: C
- **A11y notes**: Pie charts fail WCAG for colorblind users. Slices rely on color alone. Avoid as primary chart in a11y contexts.
- **A11y fallback**: Must provide stacked bar alternative + percentage data table as mandatory fallback
- **Library**: Chart.js, Recharts, D3.js
- **Interactive level**: Hover + Drill

### 4. Correlation / Distribution → Scatter Plot or Bubble Chart

- **When to use**: Exploring relationship between two continuous variables; identifying clusters or outliers in a dataset
- **When NOT to use**: Variables are categorical (use grouped bar); fewer than 20 points (patterns aren't meaningful); mobile-primary context
- **Volume threshold**: <500 pts: SVG; 500–5000: Canvas at 0.6–0.8 opacity; >5000: hexbin or aggregate first
- **Color guidance**: Color axis: gradient (blue → red). Bubble size: relative to 3rd variable. Opacity: 0.6–0.8 to show density
- **A11y grade**: B
- **A11y notes**: Provide data table alternative. Combine color + shape distinction for colorblind users.
- **A11y fallback**: Data table with correlation coefficient annotation; shape markers (circle/square/triangle) per group
- **Library**: D3.js, Plotly, Recharts
- **Interactive level**: Hover + Brush

### 5. Heatmap / Intensity → Heat Map or Choropleth

- **When to use**: Showing intensity/density across a 2D grid; time-based patterns (e.g., activity by hour × day)
- **When NOT to use**: Fewer than 20 cells (use bar); user needs to read exact values; colorblind users without pattern fallback
- **Volume threshold**: Up to 10,000 cells efficiently; beyond that aggregate; calendar heatmap: 365 cells max per SVG
- **Color guidance**: Gradient: Cool (blue) to Hot (red). Divergent scale for ±data. Always include numeric color legend
- **A11y grade**: B
- **A11y notes**: Pattern overlay for colorblind users. Numerical value on hover. Legend must include scale ticks.
- **A11y fallback**: Numerical overlay on hover; downloadable grid table with row/column labels
- **Library**: D3.js, Plotly, ApexCharts
- **Interactive level**: Hover + Zoom

### 6. Geographic Data → Choropleth Map or Bubble Map

- **When to use**: Data has a regional/location dimension; spatial distribution is the core insight for the user
- **When NOT to use**: Regions have very different sizes making visual comparison misleading (use bar); mobile-primary context
- **Volume threshold**: <1000 regions: SVG; ≥1000: Canvas/WebGL (Deck.gl); global maps: tile-based rendering
- **Color guidance**: Single color gradient per region group. Categorized colors for discrete types. Legend with clear scale breaks
- **A11y grade**: B
- **A11y notes**: Include text labels for major regions. Provide keyboard navigation between regions.
- **A11y fallback**: Region text labels; sortable data table by region name and value; keyboard-navigable regions
- **Library**: D3.js, Mapbox, Leaflet
- **Interactive level**: Pan + Zoom + Drill

### 7. Funnel / Flow → Funnel Chart or Sankey

- **When to use**: Sequential multi-stage process; showing conversion or drop-off rates between defined stages
- **When NOT to use**: Stages aren't sequential; values don't decrease monotonically (use bar); fewer than 3 stages
- **Volume threshold**: 3–8 stages optimal; beyond 8 stages group minor steps into 'Other'
- **Color guidance**: Stages: single color gradient (start → end). Show conversion % between each stage. Highlight biggest drop
- **A11y grade**: AA
- **A11y notes**: Explicit conversion % as text per stage. Stage labels always visible. Linear list view as fallback.
- **A11y fallback**: Provide linear list view with stage name + count + drop-off %; keyboard traversal
- **Library**: D3.js, Recharts, Custom SVG
- **Interactive level**: Hover + Drill

### 8. Performance vs Target → Gauge Chart or Bullet Chart

- **When to use**: Single KPI measured against a defined target or threshold; dashboard summary context
- **When NOT to use**: No target or benchmark exists; comparing multiple KPIs at once (use bullet chart grid)
- **Volume threshold**: Single metric per gauge; for 3+ KPIs use bullet chart grid layout
- **Color guidance**: Performance: Red → Yellow → Green gradient. Target: marker line. Threshold zones clearly differentiated
- **A11y grade**: AA
- **A11y notes**: Always show numerical value + % of target as text beside chart. Never rely on color position alone.
- **A11y fallback**: Numerical value + % of target shown as visible text; ARIA live region for real-time updates
- **Library**: D3.js, ApexCharts, Custom SVG
- **Interactive level**: Hover

### 9. Time-Series Forecast → Line with Confidence Band

- **When to use**: Historical data + model predictions; communicating uncertainty range to non-technical stakeholders
- **When NOT to use**: No historical baseline; prediction confidence is too low to be useful; audience is not data-literate
- **Volume threshold**: Keep historical window to 30–90 days for readability; forecast horizon ≤ 30% of visible x-axis range
- **Color guidance**: Actual: solid line #0080FF. Forecast: dashed #FF9500. Confidence band: 15% opacity fill same hue
- **A11y grade**: AA
- **A11y notes**: Toggle between actual-only and forecast views. Legend must distinguish lines beyond color (solid vs dashed).
- **A11y fallback**: Toggle actual/forecast independently; legend labels must include line-style description
- **Library**: Chart.js, ApexCharts, Plotly
- **Interactive level**: Hover + Toggle

### 10. Anomaly Detection → Line Chart with Highlights

- **When to use**: Monitoring a time-series for outliers; alerting users to unexpected spikes or dips in operational data
- **When NOT to use**: Anomalies are predefined categories (use bar with highlight); real-time context without a pause control
- **Volume threshold**: Stream at ≤60fps with Canvas; batch: up to 10,000 pts; mark anomalies as a separate data layer
- **Color guidance**: Normal: #0080FF solid line. Anomaly marker: #FF0000 circle + filled. Alert band: #FFF3CD background zone
- **A11y grade**: AA
- **A11y notes**: Use shape marker (not color only) for anomaly points. Add text annotation per anomaly event.
- **A11y fallback**: Text alert annotation per anomaly; anomaly summary list panel alongside chart
- **Library**: D3.js, Plotly, ApexCharts
- **Interactive level**: Hover + Alert

### 11. Hierarchical / Nested Data → Treemap

- **When to use**: Showing size relationships within a hierarchy; overview of proportional structure (e.g., budget breakdown)
- **When NOT to use**: Hierarchy depth > 3 levels (too complex to read); user needs to compare sibling values precisely
- **Volume threshold**: <200 nodes: SVG; 200–1000: Canvas; >1000: paginate or pre-filter before rendering
- **Color guidance**: Parent nodes: distinct hues. Children: lighter shades of same hue. White separator borders: 2–3px
- **A11y grade**: C
- **A11y notes**: Poor baseline accessibility. Always provide table alternative as primary view. Label all large areas.
- **A11y fallback**: Collapsible tree table as primary view; treemap as supplementary visual only
- **Library**: D3.js, Recharts, ApexCharts
- **Interactive level**: Hover + Drilldown

### 12. Flow / Process Data → Sankey Diagram

- **When to use**: Showing how quantities flow between nodes; multi-source multi-target distribution
- **When NOT to use**: Flow directions form loops (use network graph); fewer than 3 source-target pairs; mobile-primary context
- **Volume threshold**: <50 flows: SVG; ≥50: Canvas; >200 flows: aggregate minor flows into 'Other' node
- **Color guidance**: Gradient from source to target color. Flow opacity: 0.4–0.6. Node labels always visible
- **A11y grade**: C
- **A11y notes**: Structural flow charts cannot be conveyed by color alone. Provide flow table. Avoid on mobile.
- **A11y fallback**: Flow table (Source → Target → Value); keyboard-traversable node list with tab stops
- **Library**: D3.js (d3-sankey), Plotly
- **Interactive level**: Hover + Drilldown

### 13. Cumulative Changes → Waterfall Chart

- **When to use**: Showing how individual positive/negative components add up to a final total (e.g., P&L, budget variance)
- **When NOT to use**: Changes are not additive; more than 12 bars (readability breaks); audience expects a simple total
- **Volume threshold**: 4–12 bars optimal; beyond 12 aggregate minor items into a single 'Other' bar
- **Color guidance**: Increases: #4CAF50. Decreases: #F44336. Start total: #2196F3. End total: #0D47A1. Running total line: dashed
- **A11y grade**: AA
- **A11y notes**: Color + directional arrow icon per bar (not color alone). Labels on every bar.
- **A11y fallback**: Table with running total column; directional arrow icons per row
- **Library**: ApexCharts, Highcharts, Plotly
- **Interactive level**: Hover

### 14. Multi-Variable Comparison → Radar / Spider Chart

- **When to use**: Comparing multiple entities across the same fixed set of attributes (e.g., product feature comparison)
- **When NOT to use**: Axes > 8 (unreadable); values need precise comparison (use grouped bar); audience unfamiliar with radar charts
- **Volume threshold**: 2–3 datasets maximum per chart; 5–8 axes; beyond 8 axes switch to parallel coordinates
- **Color guidance**: Single dataset: #0080FF at 20% fill. Multiple: distinct hues with 30% fill. Border: full opacity
- **A11y grade**: B
- **A11y notes**: Limit axes to 5–8. Always provide grouped bar chart alternative for precise reading.
- **A11y fallback**: Grouped bar chart as mandatory alternative; include raw data table
- **Library**: Chart.js, Recharts, ApexCharts
- **Interactive level**: Hover + Toggle

### 15. Stock / Trading OHLC → Candlestick Chart

- **When to use**: Financial time-series with Open/High/Low/Close data; trading or investment product context only
- **When NOT to use**: Non-financial audience; no OHLC data available (use line chart); accessibility-first context
- **Volume threshold**: Real-time: Canvas required. Historical: paginate by time range. Max 500 candles visible at once
- **Color guidance**: Bullish: #26A69A. Bearish: #EF5350. Volume bars: 40% opacity below. Body fill vs hollow for OHLC style
- **A11y grade**: B
- **A11y notes**: Provide OHLC data table. Colorblind: use fill vs outline pattern (bullish = filled, bearish = hollow).
- **A11y fallback**: OHLC data table with sortable columns; numeric summary panel (daily change %)
- **Library**: Lightweight Charts (TradingView), ApexCharts
- **Interactive level**: Real-time + Hover + Zoom

### 16. Relationship / Connection Data → Network Graph

- **When to use**: Mapping connections between entities; network topology or social graph exploration context
- **When NOT to use**: Node count > 500 without clustering pre-applied; user needs precise connection counts; mobile context
- **Volume threshold**: ≤100 nodes: SVG; 101–500: Canvas; >500: must apply clustering/LOD before rendering
- **Color guidance**: Node types: categorical colors. Edges: #90A4AE at 60% opacity. Highlight path: #F59E0B
- **A11y grade**: D
- **A11y notes**: Fundamentally inaccessible without alternative. Never use as sole representation. Always provide list alternative.
- **A11y fallback**: Adjacency list table (Node A → Node B → Weight); hierarchical tree view when structure allows
- **Library**: D3.js (d3-force), Vis.js, Cytoscape.js
- **Interactive level**: Drilldown + Hover + Drag

### 17. Distribution / Statistical → Box Plot

- **When to use**: Showing spread, median, and outliers of a dataset; comparing distributions across multiple groups
- **When NOT to use**: Fewer than 20 data points per group (distribution is not meaningful); audience unfamiliar with statistical charts
- **Volume threshold**: Any sample size; aggregated representation so rendering is ⚡ Excellent at any volume
- **Color guidance**: Box fill: #BBDEFB. Border: #1976D2. Median line: #D32F2F bold. Outlier dots: #F44336
- **A11y grade**: AA
- **A11y notes**: Include stats summary table. Annotate outlier count in chart subtitle.
- **A11y fallback**: Stats summary table (min / Q1 / median / Q3 / max / mean); outlier count annotation
- **Library**: Plotly, D3.js, Chart.js (plugin)
- **Interactive level**: Hover

### 18. Performance vs Target (Compact) → Bullet Chart

- **When to use**: Dashboard with multiple KPIs side by side; space-constrained contexts where a gauge is too large
- **When NOT to use**: Single KPI with emphasis (use gauge); data has no defined target range; fewer than 3 KPIs
- **Volume threshold**: Ideal for 3–10 bullet charts in a grid; scales to any count efficiently
- **Color guidance**: Qualitative ranges: #FFCDD2 / #FFF9C4 / #C8E6C9 (bad/ok/good). Performance bar: #1976D2. Target: black 3px marker
- **A11y grade**: AAA
- **A11y notes**: All values always visible as text. Color ranges are labeled with text thresholds not color alone.
- **A11y fallback**: Numerical values always visible (not hover-only); color ranges labeled with threshold text
- **Library**: D3.js, Plotly, Custom SVG
- **Interactive level**: Hover

### 19. Proportional / Percentage → Waffle Chart

- **When to use**: Showing what fraction of a whole is filled; percentage progress in a visually engaging and accessible format
- **When NOT to use**: More than 5 categories (use stacked bar); exact values matter over visual proportion; very tight space
- **Volume threshold**: 10×10 grid standard (100 cells); for > 5 categories switch to stacked 100% bar
- **Color guidance**: 3–5 categories max. 2–3px gap between cells. Each category a distinct accessible color pair
- **A11y grade**: AA
- **A11y notes**: Better than pie for accessibility. Percentage text label always visible. Each cell has aria-label.
- **A11y fallback**: Percentage text always visible; grid cells labeled with aria-label value; provide legend
- **Library**: D3.js, React-Waffle, Custom CSS Grid
- **Interactive level**: Hover

### 20. Hierarchical Proportional → Sunburst Chart

- **When to use**: Exploring nested proportions where both hierarchy and relative size matter (e.g., org spend breakdown)
- **When NOT to use**: More than 3 hierarchy levels (outer rings become unreadable); precision matters over overview; mobile
- **Volume threshold**: <100 nodes: SVG; 100–500: Canvas; >500: filter to top N before rendering
- **Color guidance**: Center to outer: darker to lighter hue. Each level 15–20% lighter. Contrasting border between sectors
- **A11y grade**: C
- **A11y notes**: Poor accessibility beyond 2 levels. Mandatory table alternative required for any production use.
- **A11y fallback**: Collapsible indented list with percentages; breadcrumb trail for current drill-down state
- **Library**: D3.js (d3-hierarchy), Recharts, ApexCharts
- **Interactive level**: Drilldown + Hover

### 21. Root Cause Analysis → Decomposition Tree

- **When to use**: Decomposing a metric into contributing factors; AI-assisted analysis or BI drill-down scenarios
- **When NOT to use**: No clear parent-child causal relationship; audience expects a summary rather than exploration
- **Volume threshold**: Up to 5 levels deep; limit visible nodes to 20 per level for readability; lazy-load deeper levels
- **Color guidance**: Positive impact nodes: #2563EB. Negative impact nodes: #EF4444. Neutral connectors: #94A3B8
- **A11y grade**: AA
- **A11y notes**: Keyboard-navigable expand/collapse. Screen reader announces node value and % contribution.
- **A11y fallback**: Keyboard expand/collapse tree; screen reader announces node label + value + % impact
- **Library**: Power BI (native), React-Flow, Custom D3.js
- **Interactive level**: Drill + Expand

### 22. 3D Spatial Data → 3D Scatter / Surface Plot

- **When to use**: Scientific/engineering context where Z-axis carries essential info not expressible in 2D
- **When NOT to use**: 2D projection conveys the same insight; mobile context; accessibility-required environments; standard business dashboards
- **Volume threshold**: WebGL required. Deck.gl: up to 1M points. Three.js: LOD required beyond 50,000 pts
- **Color guidance**: Depth cues: lighting and shading. Z-axis: color gradient (cool → warm). Transparent overlapping: opacity 0.4
- **A11y grade**: D
- **A11y notes**: 3D spatial charts are fundamentally inaccessible. Must not be used as primary chart type in any product UI.
- **A11y fallback**: Mandatory 2D projection view + data table; do not use as primary chart type in product UI
- **Library**: Three.js, Deck.gl, Plotly 3D
- **Interactive level**: Rotate + Zoom + VR

### 23. Real-Time Streaming → Streaming Area Chart

- **When to use**: Live monitoring dashboards; IoT/ops data updating at ≥1 Hz; user needs current value at a glance
- **When NOT to use**: Update frequency < 1/min (use periodic-refresh line chart); flashing content without reduced-motion support
- **Volume threshold**: Canvas/WebGL required. Buffer last 60–300s of data. Downsample older data on scroll
- **Color guidance**: Current pulse: #00FF00 (dark theme) or #0080FF (light theme). History: fading opacity. Grid: dark background
- **A11y grade**: B
- **A11y notes**: Pause/resume control required. Current value as large visible text KPI. Respect prefers-reduced-motion.
- **A11y fallback**: Pause/resume button required; current value shown as large text KPI; prefers-reduced-motion: freeze animation
- **Library**: Smoothed D3.js, CanvasJS
- **Interactive level**: Real-time + Pause + Zoom

### 24. Sentiment / Emotion → Word Cloud with Sentiment

- **When to use**: NLP output visualization; exploratory analysis of text corpus sentiment; frequency-weighted keyword overview
- **When NOT to use**: Precise values matter (word size is inherently imprecise); screen-reader context; corpus < 50 items
- **Volume threshold**: 50–5000 terms optimal. Beyond 5000: apply top-N filtering before render. Avoid on mobile
- **Color guidance**: Positive: #22C55E. Negative: #EF4444. Neutral: #94A3B8. Word size maps to frequency
- **A11y grade**: C
- **A11y notes**: Word clouds fail screen readers. Never use as sole output of NLP analysis. Always pair with list view.
- **A11y fallback**: Sortable list view by frequency with sentiment label column; word cloud as supplementary only
- **Library**: D3-cloud, Highcharts, Nivo
- **Interactive level**: Hover + Filter

### 25. Process Mining → Process Map / Graph

- **When to use**: Analyzing event logs to visualize actual process flows; identifying bottlenecks and deviations in ops/product funnels
- **When NOT to use**: No event log data available; audience expects a static flowchart (use diagram tool); node count > 100 without pre-filtering
- **Volume threshold**: <30 nodes: SVG; 30–100: Canvas; >100: apply variant filtering (top 80% of cases) before rendering
- **Color guidance**: Happy path: #10B981 thick line. Deviations: #F59E0B thin line. Bottleneck nodes: #EF4444 fill
- **A11y grade**: B
- **A11y notes**: Complex graphs are hard to navigate. Provide path summary text. Highlight top 3 bottlenecks as annotations.
- **A11y fallback**: Path summary table (variant → frequency → avg duration); top 3 bottlenecks as text annotation panel
- **Library**: React-Flow, Cytoscape.js, Recharts
- **Interactive level**: Drag + Node-Click
