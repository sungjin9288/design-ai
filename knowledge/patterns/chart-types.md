---
title: Chart type selection guide
source: refs/ui-ux-pro-max/src/ui-ux-pro-max/data/charts.csv
upstream: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
extracted_at: 2026-10-20
applies_to: [data-visualization, dashboard, web]
version: 1.0.0
last_updated: 2026-05
stability: stable
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
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Use solid, dashed, and dotted line styles plus direct series labels; never distinguish series by hue alone.
- **A11y fallback**: Visible data table plus concise trend summary. Keyboard: focus reveals hover values; +/- buttons zoom; Reset restores the full range.
- **Library**: Chart.js, Recharts, ApexCharts
- **Interactive level**: Hover + Zoom

### 2. Compare Categories → Bar Chart (Horizontal or Vertical)

- **When to use**: Comparing discrete categories by magnitude; ranking or ordering is the core insight; categories ≤ 15
- **When NOT to use**: Categories > 15 (use table or search); data has time dimension (use line); showing proportions (use waffle/stacked)
- **Volume threshold**: <20 categories: vertical bar; 20–50: horizontal bar; >50: paginated table
- **Color guidance**: Each bar: distinct color. Grouped: same hue family. Always sort descending by value
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Use direct category/value labels and group outlines or patterns; never encode category solely by bar color. Do not rely on color alone.
- **A11y fallback**: Visible sortable data table plus concise comparison summary. Keyboard: focus reveals hover values; focusable headers with Enter/Space sort and aria-sort reports direction.
- **Library**: Chart.js, Recharts, D3.js
- **Interactive level**: Hover + Sort

### 3. Part-to-Whole → Pie Chart or Donut

- **When to use**: ≤5 categories; one dominant segment vs rest; emphasis on visual proportion over exact values
- **When NOT to use**: Categories > 5; slice differences < 5% (visually indistinguishable); user needs precise values; accessibility-first context
- **Volume threshold**: Max 6 slices; beyond that switch to stacked bar 100%
- **Color guidance**: 5–6 max colors. Contrasting palette. Largest slice at 12 o'clock. Always label slices with %
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Pie charts do not inherently fail WCAG; unlabeled color-only slices are inaccessible. Use direct labels and patterns, with a non-pie fallback. Do not rely on color alone.
- **A11y fallback**: Percentage data table and concise part-to-whole summary; offer a stacked bar view. Keyboard: focus reveals slice values; Enter/Space drills in; Back button returns.
- **Library**: Chart.js, Recharts, D3.js
- **Interactive level**: Hover + Drill

### 4. Correlation / Distribution → Scatter Plot or Bubble Chart

- **When to use**: Exploring relationship between two continuous variables; identifying clusters or outliers in a dataset
- **When NOT to use**: Variables are categorical (use grouped bar); fewer than 20 points (patterns aren't meaningful); mobile-primary context
- **Volume threshold**: <500 pts: SVG; 500–5000: Canvas at 0.6–0.8 opacity; >5000: hexbin or aggregate first
- **Color guidance**: Color axis: gradient (blue → red). Bubble size: relative to 3rd variable. Opacity: 0.6–0.8 to show density
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Combine marker shapes with direct group labels; color may reinforce but must not be the only distinction.
- **A11y fallback**: Visible data table plus correlation summary. Keyboard: focus reveals point values; labeled start/end range inputs replace brush dragging.
- **Library**: D3.js, Plotly, Recharts
- **Interactive level**: Hover + Brush

### 5. Heatmap / Intensity → Heat Map or Choropleth

- **When to use**: Showing intensity/density across a 2D grid; time-based patterns (e.g., activity by hour × day)
- **When NOT to use**: Fewer than 20 cells (use bar); user needs to read exact values; colorblind users without pattern fallback
- **Volume threshold**: Up to 10,000 cells efficiently; beyond that aggregate; calendar heatmap: 365 cells max per SVG
- **Color guidance**: Gradient: Cool (blue) to Hot (red). Divergent scale for ±data. Always include numeric color legend
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Print values or symbols in cells and use texture/labels in addition to the color scale. Do not rely on color alone.
- **A11y fallback**: Grid data table plus intensity summary. Keyboard: focus reveals cell values; +/- buttons zoom; Reset restores the grid.
- **Library**: D3.js, Plotly, ApexCharts
- **Interactive level**: Hover + Zoom

### 6. Geographic Data → Choropleth Map or Bubble Map

- **When to use**: Data has a regional/location dimension; spatial distribution is the core insight for the user
- **When NOT to use**: Regions have very different sizes making visual comparison misleading (use bar); mobile-primary context
- **Volume threshold**: <1000 regions: SVG; ≥1000: Canvas/WebGL (Deck.gl); global maps: tile-based rendering
- **Color guidance**: Single color gradient per region group. Categorized colors for discrete types. Legend with clear scale breaks
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Label regions directly and pair fills with boundaries or patterns; location meaning cannot depend on color alone.
- **A11y fallback**: Sortable region table plus geographic summary. Keyboard: arrow keys or labeled pan buttons move the map; +/- buttons zoom; Enter drills into a focused region; Back returns.
- **Library**: D3.js, Mapbox, Leaflet
- **Interactive level**: Pan + Zoom + Drill

### 7. Funnel / Flow → Funnel Chart or Sankey

- **When to use**: Sequential multi-stage process; showing conversion or drop-off rates between defined stages
- **When NOT to use**: Stages aren't sequential; values don't decrease monotonically (use bar); fewer than 3 stages
- **Volume threshold**: 3–8 stages optimal; beyond 8 stages group minor steps into 'Other'
- **Color guidance**: Stages: single color gradient (start → end). Show conversion % between each stage. Highlight biggest drop
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Keep stage names and values visible and distinguish stages with text and boundaries, not only a gradient. Do not rely on color alone.
- **A11y fallback**: Linear stage table/list plus conversion summary. Keyboard: focus reveals stage values; Enter/Space drills in; Back returns.
- **Library**: D3.js, Recharts, Custom SVG
- **Interactive level**: Hover + Drill

### 8. Performance vs Target → Gauge Chart or Bullet Chart

- **When to use**: Single KPI measured against a defined target or threshold; dashboard summary context
- **When NOT to use**: No target or benchmark exists; comparing multiple KPIs at once (use bullet chart grid)
- **Volume threshold**: Single metric per gauge; for 3+ KPIs use bullet chart grid layout
- **Color guidance**: Performance: Red → Yellow → Green gradient. Target: marker line. Threshold zones clearly differentiated
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Place the number and target text beside the gauge and label threshold zones; red/yellow/green alone is insufficient.
- **A11y fallback**: Visible KPI/target text and a one-row data table plus status summary. Keyboard: focus reveals the same detail as hover.
- **Library**: D3.js, ApexCharts, Custom SVG
- **Interactive level**: Hover

### 9. Time-Series Forecast → Line with Confidence Band

- **When to use**: Historical data + model predictions; communicating uncertainty range to non-technical stakeholders
- **When NOT to use**: No historical baseline; prediction confidence is too low to be useful; audience is not data-literate
- **Volume threshold**: Keep historical window to 30–90 days for readability; forecast horizon ≤ 30% of visible x-axis range
- **Color guidance**: Actual: solid line #0080FF. Forecast: dashed #FF9500. Confidence band: 15% opacity fill same hue
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Use solid actual and dashed forecast lines, direct labels, and a named confidence range; hue alone is insufficient.
- **A11y fallback**: Visible forecast table plus uncertainty summary. Keyboard: focus reveals hover values; buttons toggle actual/forecast; +/- buttons zoom; Reset restores range.
- **Library**: Chart.js, ApexCharts, Plotly
- **Interactive level**: Hover + Toggle

### 10. Anomaly Detection → Line Chart with Highlights

- **When to use**: Monitoring a time-series for outliers; alerting users to unexpected spikes or dips in operational data
- **When NOT to use**: Anomalies are predefined categories (use bar with highlight); real-time context without a pause control
- **Volume threshold**: Stream at ≤60fps with Canvas; batch: up to 10,000 pts; mark anomalies as a separate data layer
- **Color guidance**: Normal: #0080FF solid line. Anomaly marker: #FF0000 circle + filled. Alert band: #FFF3CD background zone
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Mark anomalies with a distinct shape and text annotation as well as color. Do not rely on color alone.
- **A11y fallback**: Anomaly event list/table plus narrative alert summary. Keyboard: focus reveals point details; alerts are available in the persistent list without hover.
- **Library**: D3.js, Plotly, ApexCharts
- **Interactive level**: Hover + Alert

### 11. Hierarchical / Nested Data → Treemap

- **When to use**: Showing size relationships within a hierarchy; overview of proportional structure (e.g., budget breakdown)
- **When NOT to use**: Hierarchy depth > 3 levels (too complex to read); user needs to compare sibling values precisely
- **Volume threshold**: <200 nodes: SVG; 200–1000: Canvas; >1000: paginate or pre-filter before rendering
- **Color guidance**: Parent nodes: distinct hues. Children: lighter shades of same hue. White separator borders: 2–3px
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Label hierarchy nodes and use borders/patterns as well as hue; make the tree table the primary accessible view. Do not rely on color alone.
- **A11y fallback**: Collapsible tree table plus hierarchy summary; treemap remains supplementary. Keyboard: focus reveals hover values; Enter/Space drills or expands; Back collapses/returns.
- **Library**: D3.js, Recharts, ApexCharts
- **Interactive level**: Hover + Drilldown

### 12. Flow / Process Data → Sankey Diagram

- **When to use**: Showing how quantities flow between nodes; multi-source multi-target distribution
- **When NOT to use**: Flow directions form loops (use network graph); fewer than 3 source-target pairs; mobile-primary context
- **Volume threshold**: <50 flows: SVG; ≥50: Canvas; >200 flows: aggregate minor flows into 'Other' node
- **Color guidance**: Gradient from source to target color. Flow opacity: 0.4–0.6. Node labels always visible
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Label source, target, and value; use line style or node symbols in addition to gradient color. Do not rely on color alone.
- **A11y fallback**: Source-to-target flow table plus flow summary. Keyboard: focus reveals hover values; Enter/Space drills into a node; Back returns.
- **Library**: D3.js (d3-sankey), Plotly
- **Interactive level**: Hover + Drilldown

### 13. Cumulative Changes → Waterfall Chart

- **When to use**: Showing how individual positive/negative components add up to a final total (e.g., P&L, budget variance)
- **When NOT to use**: Changes are not additive; more than 12 bars (readability breaks); audience expects a simple total
- **Volume threshold**: 4–12 bars optimal; beyond 12 aggregate minor items into a single 'Other' bar
- **Color guidance**: Increases: #4CAF50. Decreases: #F44336. Start total: #2196F3. End total: #0D47A1. Running total line: dashed
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Pair increase/decrease bars with signed values and directional icons, not red/green alone. Do not rely on color alone.
- **A11y fallback**: Running-total table plus variance summary. Keyboard: focus reveals the same value as hover.
- **Library**: ApexCharts, Highcharts, Plotly
- **Interactive level**: Hover

### 14. Multi-Variable Comparison → Radar / Spider Chart

- **When to use**: Comparing multiple entities across the same fixed set of attributes (e.g., product feature comparison)
- **When NOT to use**: Axes > 8 (unreadable); values need precise comparison (use grouped bar); audience unfamiliar with radar charts
- **Volume threshold**: 2–3 datasets maximum per chart; 5–8 axes; beyond 8 axes switch to parallel coordinates
- **Color guidance**: Single dataset: #0080FF at 20% fill. Multiple: distinct hues with 30% fill. Border: full opacity
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Use line styles, point shapes, and direct series labels in addition to color. Do not rely on color alone.
- **A11y fallback**: Raw data table and grouped-bar alternative plus comparison summary. Keyboard: focus reveals values; buttons toggle series.
- **Library**: Chart.js, Recharts, ApexCharts
- **Interactive level**: Hover + Toggle

### 15. Stock / Trading OHLC → Candlestick Chart

- **When to use**: Financial time-series with Open/High/Low/Close data; trading or investment product context only
- **When NOT to use**: Non-financial audience; no OHLC data available (use line chart); accessibility-first context
- **Volume threshold**: Real-time: Canvas required. Historical: paginate by time range. Max 500 candles visible at once
- **Color guidance**: Bullish: #26A69A. Bearish: #EF5350. Volume bars: 40% opacity below. Body fill vs hollow for OHLC style
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Use filled versus hollow candles and OHLC text values; bullish/bearish meaning cannot depend on color. Do not rely on color alone.
- **A11y fallback**: Sortable OHLC table plus daily-change summary. Keyboard: focus reveals candle values; +/- buttons zoom; Reset restores range; live updates do not steal focus.
- **Library**: Lightweight Charts (TradingView), ApexCharts
- **Interactive level**: Real-time + Hover + Zoom

### 16. Relationship / Connection Data → Network Graph

- **When to use**: Mapping connections between entities; network topology or social graph exploration context
- **When NOT to use**: Node count > 500 without clustering pre-applied; user needs precise connection counts; mobile context
- **Volume threshold**: ≤100 nodes: SVG; 101–500: Canvas; >500: must apply clustering/LOD before rendering
- **Color guidance**: Node types: categorical colors. Edges: #90A4AE at 60% opacity. Highlight path: #F59E0B
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Use labeled node types, shapes, and edge styles in addition to color; the adjacency view is the accessible source of truth. Do not rely on color alone.
- **A11y fallback**: Adjacency list/table and relationship summary; tree view when applicable. Keyboard: focus reveals node details; Enter drills; Move up/down/left/right buttons replace drag.
- **Library**: D3.js (d3-force), Vis.js, Cytoscape.js
- **Interactive level**: Drilldown + Hover + Drag

### 17. Distribution / Statistical → Box Plot

- **When to use**: Showing spread, median, and outliers of a dataset; comparing distributions across multiple groups
- **When NOT to use**: Fewer than 20 data points per group (distribution is not meaningful); audience unfamiliar with statistical charts
- **Volume threshold**: Any sample size; aggregated representation so rendering is ⚡ Excellent at any volume
- **Color guidance**: Box fill: #BBDEFB. Border: #1976D2. Median line: #D32F2F bold. Outlier dots: #F44336
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Label median, quartiles, whiskers, and outliers directly; do not use color alone for statistical roles.
- **A11y fallback**: Statistics table plus distribution summary. Keyboard: focus reveals the same statistics as hover.
- **Library**: Plotly, D3.js, Chart.js (plugin)
- **Interactive level**: Hover

### 18. Performance vs Target (Compact) → Bullet Chart

- **When to use**: Dashboard with multiple KPIs side by side; space-constrained contexts where a gauge is too large
- **When NOT to use**: Single KPI with emphasis (use gauge); data has no defined target range; fewer than 3 KPIs
- **Volume threshold**: Ideal for 3–10 bullet charts in a grid; scales to any count efficiently
- **Color guidance**: Qualitative ranges: #FFCDD2 / #FFF9C4 / #C8E6C9 (bad/ok/good). Performance bar: #1976D2. Target: black 3px marker
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Label every qualitative range and target with text; color is supplementary.
- **A11y fallback**: Visible KPI/target table plus status summary. Keyboard: focus reveals the same detail as hover.
- **Library**: D3.js, Plotly, Custom SVG
- **Interactive level**: Hover

### 19. Proportional / Percentage → Waffle Chart

- **When to use**: Showing what fraction of a whole is filled; percentage progress in a visually engaging and accessible format
- **When NOT to use**: More than 5 categories (use stacked bar); exact values matter over visual proportion; very tight space
- **Volume threshold**: 10×10 grid standard (100 cells); for > 5 categories switch to stacked 100% bar
- **Color guidance**: 3–5 categories max. 2–3px gap between cells. Each category a distinct accessible color pair
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Label each category and percentage and add patterns or symbols; filled-cell color alone is insufficient.
- **A11y fallback**: Percentage table/list plus part-to-whole summary. Keyboard: focus reveals each cell value.
- **Library**: D3.js, React-Waffle, Custom CSS Grid
- **Interactive level**: Hover

### 20. Hierarchical Proportional → Sunburst Chart

- **When to use**: Exploring nested proportions where both hierarchy and relative size matter (e.g., org spend breakdown)
- **When NOT to use**: More than 3 hierarchy levels (outer rings become unreadable); precision matters over overview; mobile
- **Volume threshold**: <100 nodes: SVG; 100–500: Canvas; >500: filter to top N before rendering
- **Color guidance**: Center to outer: darker to lighter hue. Each level 15–20% lighter. Contrasting border between sectors
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Label hierarchy levels and segments and use boundaries/patterns as well as hue; the indented list is primary. Do not rely on color alone.
- **A11y fallback**: Collapsible indented list/table plus hierarchy summary and breadcrumbs. Keyboard: Enter/Space drills or expands; Back button returns; focus reveals hover detail.
- **Library**: D3.js (d3-hierarchy), Recharts, ApexCharts
- **Interactive level**: Drilldown + Hover

### 21. Root Cause Analysis → Decomposition Tree

- **When to use**: Decomposing a metric into contributing factors; AI-assisted analysis or BI drill-down scenarios
- **When NOT to use**: No clear parent-child causal relationship; audience expects a summary rather than exploration
- **Volume threshold**: Up to 5 levels deep; limit visible nodes to 20 per level for readability; lazy-load deeper levels
- **Color guidance**: Positive impact nodes: #2563EB. Negative impact nodes: #EF4444. Neutral connectors: #94A3B8
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Name each node and contribution and use shapes/connector styles in addition to color. Do not rely on color alone.
- **A11y fallback**: Expandable tree table plus root-cause summary. Keyboard: Enter/Space drills and expands; Back collapses; dedicated expand/collapse buttons expose the same operations.
- **Library**: Power BI (native), React-Flow, Custom D3.js
- **Interactive level**: Drill + Expand

### 22. 3D Spatial Data → 3D Scatter / Surface Plot

- **When to use**: Scientific/engineering context where Z-axis carries essential info not expressible in 2D
- **When NOT to use**: 2D projection conveys the same insight; mobile context; accessibility-required environments; standard business dashboards
- **Volume threshold**: WebGL required. Deck.gl: up to 1M points. Three.js: LOD required beyond 50,000 pts
- **Color guidance**: Depth cues: lighting and shading. Z-axis: color gradient (cool → warm). Transparent overlapping: opacity 0.4
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Use labels, shapes, and depth-independent cues; color and 3D position cannot be the only carriers of meaning.
- **A11y fallback**: Mandatory 2D projection, data table, and spatial summary. Keyboard: rotate/pan buttons and +/- zoom controls replace pointer/VR manipulation; Reset returns the camera.
- **Library**: Three.js, Deck.gl, Plotly 3D
- **Interactive level**: Rotate + Zoom + VR

### 23. Real-Time Streaming → Streaming Area Chart

- **When to use**: Live monitoring dashboards; IoT/ops data updating at ≥1 Hz; user needs current value at a glance
- **When NOT to use**: Update frequency < 1/min (use periodic-refresh line chart); flashing content without reduced-motion support
- **Volume threshold**: Canvas/WebGL required. Buffer last 60–300s of data. Downsample older data on scroll
- **Color guidance**: Current pulse: #00FF00 (dark theme) or #0080FF (light theme). History: fading opacity. Grid: dark background
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Show the current value and status text and use line styles or markers in addition to color. Do not rely on color alone.
- **A11y fallback**: Streaming data table plus current-value/trend summary. Keyboard: Pause/Resume button controls updates; focus reveals values; +/- buttons zoom; Reset restores range.
- **Library**: Smoothed D3.js, CanvasJS
- **Interactive level**: Real-time + Pause + Zoom

### 24. Sentiment / Emotion → Word Cloud with Sentiment

- **When to use**: NLP output visualization; exploratory analysis of text corpus sentiment; frequency-weighted keyword overview
- **When NOT to use**: Precise values matter (word size is inherently imprecise); screen-reader context; corpus < 50 items
- **Volume threshold**: 50–5000 terms optimal. Beyond 5000: apply top-N filtering before render. Avoid on mobile
- **Color guidance**: Positive: #22C55E. Negative: #EF4444. Neutral: #94A3B8. Word size maps to frequency
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Expose every term, count, and sentiment as text; size and color are supplementary only.
- **A11y fallback**: Sortable term table/list plus sentiment summary; word cloud is supplementary. Keyboard: focus reveals word details; labeled controls filter with Space/Enter.
- **Library**: D3-cloud, Highcharts, Nivo
- **Interactive level**: Hover + Filter

### 25. Process Mining → Process Map / Graph

- **When to use**: Analyzing event logs to visualize actual process flows; identifying bottlenecks and deviations in ops/product funnels
- **When NOT to use**: No event log data available; audience expects a static flowchart (use diagram tool); node count > 100 without pre-filtering
- **Volume threshold**: <30 nodes: SVG; 30–100: Canvas; >100: apply variant filtering (top 80% of cases) before rendering
- **Color guidance**: Happy path: #10B981 thick line. Deviations: #F59E0B thin line. Bottleneck nodes: #EF4444 fill
- **A11y grade**: deprecated: use Accessibility Risk
- **A11y notes**: Label nodes and paths and use shapes/line styles in addition to color; bottlenecks require text annotations. Do not rely on color alone.
- **A11y fallback**: Path summary table plus bottleneck narrative. Keyboard: Move buttons replace drag; focus reveals node details; Enter activates a node; Back returns.
- **Library**: React-Flow, Cytoscape.js, Recharts
- **Interactive level**: Drag + Node-Click
