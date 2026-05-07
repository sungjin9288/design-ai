<!-- hand-written -->
---
title: Chart color encoding
applies_to: [data-visualization, dashboard, all-data-ui]
---

# Chart color encoding

Color in charts encodes meaning. Picking the wrong palette makes data unreadable; picking the right one makes it intuitive. This is the floor.

## Three palette types

| Palette | Use | Example |
| --- | --- | --- |
| **Sequential** | Ordered data (low → high), single direction | Heatmap of activity, choropleth map of population |
| **Diverging** | Data with a meaningful midpoint (positive ↔ negative) | Profit/loss, sentiment, deviation from average |
| **Categorical** | Distinct, unordered categories | Product types, regions, departments |

Pick the type that matches your data. Using categorical for ordered data hides the order; using sequential for categorical implies false ordering.

## Sequential palettes

Single hue progressing from light to dark (or vice versa).

```
Light blue → Dark blue:    ▁▂▃▄▅▆▇█
                            #DBEAFE → #1E3A8A
```

Properties:
- One hue, varying lightness (and chroma)
- Use for "more is more" relationships (revenue, count, density)
- Don't use for negative values

### Recommended sequential ramps

- **Blue ramp** (most universal): `#DBEAFE` → `#1E3A8A` (Tailwind blue-100 → blue-900)
- **Teal ramp** (modern, neutral): `#CCFBF1` → `#134E4A`
- **Viridis** (perceptually uniform, colorblind-safe): standard scientific viz palette
- **Brand-extended**: take your `--color-primary-50` → `--color-primary-900` ramp

For 5-step charts: pick steps `100, 300, 500, 700, 900`. Skip the very-light (50) and very-dark (950) — they don't read on common backgrounds.

## Diverging palettes

Two hues meeting at a neutral midpoint.

```
Red ←─── Light gray ───→ Blue:
█▆▄▂│▂▄▆█
```

Properties:
- Two opposing hues (often red ↔ blue)
- Lightest at the midpoint (neutral)
- Use when zero/baseline is meaningful

### Recommended diverging ramps

- **Red-Blue** (most universal): financial gain/loss in non-Korean contexts
- **Red-Green** (avoid): fails for red-green colorblind users (~8% of men)
- **Brown-Teal**: colorblind-friendly alternative to red-green

### Korean fintech consideration

Korean stock convention is **inverted**: red = up (gain), blue = down (loss). For non-stock financial data (banking, expense tracking) Korean apps usually follow Western convention (green = positive). Cite [`money-and-amount.md`](money-and-amount.md).

When designing for Korean stock UIs:
- Diverging: red ↔ blue with red = positive
- For other Korean financial: green = positive, red = negative

## Categorical palettes

Distinct hues for distinct categories.

### Rules

| Rule | Why |
| --- | --- |
| Use ≤ 8 colors | More than 8 → user can't track |
| Vary lightness AND hue | Pure hue rotation is hard to distinguish |
| Test for colorblindness | At least 4–5 colors should be distinguishable for protanopia / deuteranopia |
| Avoid hue similarity | Don't put similar greens / similar blues next to each other |
| Don't use semantic colors | Reserve red for error, green for success — using them as categorical 1 and 2 confuses |

### Recommended palettes

**Tableau 10** (industry standard, 10 colors):
```
#4E79A7  blue
#F28E2B  orange
#E15759  red
#76B7B2  teal
#59A14F  green
#EDC948  yellow
#B07AA1  purple
#FF9DA7  pink
#9C755F  brown
#BAB0AC  gray
```

**Material Design palette** (8 colors):
```
#1F77B4  blue
#FF7F0E  orange
#2CA02C  green
#D62728  red
#9467BD  purple
#8C564B  brown
#E377C2  pink
#7F7F7F  gray
```

**Brand-extended** (when categorical = your business):
- Primary brand color = category 1
- Accent color = category 2
- Cool blue + warm orange = categories 3, 4
- Etc.

### Order of categorical hues

When mapping to categories, assign by:
1. **Logical order** (if categories have one): "small / medium / large" → light to dark.
2. **Frequency** (if not): most-common category gets the most prominent color.
3. **Alphabetical**: only as last resort.

## Color blindness

Roughly 8% of men, 0.5% of women. Most common forms:
- **Deuteranopia** (red-green): can't distinguish red and green at similar lightness.
- **Protanopia** (red-green): similar.
- **Tritanopia** (blue-yellow): rare.

Test palettes with simulators:
- Sim Daltonism (Mac, free)
- Coblis (web, free)
- Browser DevTools (Chrome's "Emulate vision deficiencies")

### Rules

- **Don't use red+green as the only signal** (fails for ~8% of men).
- **Pair color with shape, pattern, or label** — color is one cue among many.
- **Sequential and diverging palettes** are usually safer than categorical.
- **Test legends specifically** — labels next to color swatches lose if labels are tiny.

## Color + meaning beyond palette

Charts encode information via:

| Encoding | Use |
| --- | --- |
| Hue | Categories |
| Saturation | Sequential intensity (low/high) |
| Lightness | Sequential intensity OR categorical with brightness contrast |
| Opacity | Confidence / uncertainty |
| Pattern (stripes, dots) | Categorical when color isn't enough |
| Texture | Same as pattern |

Layer encodings: a stacked bar can use **hue** for category and **opacity** for time period.

## Specific chart types

### Line chart

- One color per series.
- Up to 5 series before crowding.
- Match the line color to the legend; same on hover.
- For confidence intervals: same hue, lower opacity for the band.

### Bar chart

- All bars same color when comparing within one dimension (e.g., "monthly revenue").
- Different colors when comparing across dimensions ("by category").
- Sort descending by value (most apps) — leftmost bar is the highest.

### Stacked bar / area

- Each segment is a category — use categorical palette.
- Order by size (largest at the bottom of stack).
- Sequential palette if segments are ordered (small → medium → large customer).

### Pie / donut chart

- 2–6 slices max. More than that, use a bar chart.
- Sort by size (descending, clockwise from 12 o'clock).
- "Other" bucket if too many tiny slices.

### Heatmap

- **Sequential** palette is mandatory.
- Lightest at low value, darkest at high.
- Provide a numeric scale legend.

### Scatter plot

- Single category: one color.
- Multiple categories: ≤ 5 colors.
- Add transparency (`opacity: 0.6–0.8`) for overlap.

### Choropleth (map)

- Sequential or diverging palette.
- 5–7 bins typical.
- Provide value legend.

## Korean dashboard color palettes

Common patterns in Korean financial apps:

```
Toss-style (modern, monochromatic with accent):
- Background: white / near-white
- Primary: Toss blue #3182F6
- Sequential: blue 50 → blue 900
- Categorical: blue, teal, purple, gray (cool, calm)

KakaoBank-style (warm, brand-led):
- Background: warm white
- Primary: Kakao yellow #FFEB00 (used sparingly)
- Sequential: gold ramp
- Categorical: yellow, slate, navy, gray

Stock app (Korean inverted convention):
- Positive: red #DC2626
- Negative: blue #2563EB
- Neutral: gray
- No green/red diverging
```

## Background and chart elements

- **Chart background**: `--color-bg-default` or `--color-bg-elevated`. White is fine.
- **Gridlines**: very light (`--color-border-default` or lighter). They guide; they don't compete.
- **Axes**: `--color-text-tertiary`, thin (1px).
- **Axis labels**: `--color-text-secondary`, smaller font.
- **Annotations** (callouts, target lines): use a subtle accent color (often a lighter brand color).

## When to NOT use color

Sometimes black-and-white is better:
- Print contexts.
- Color-blind audience that's > the norm.
- Very dense charts where color noise hurts more than it helps.

Rely on:
- Patterns (stripes, dots) for categories
- Line styles (solid, dashed, dotted) for series
- Value labels (numbers next to bars)
- Annotations

## Tools

- **OKLCH picker**: generate perceptually uniform palettes
- **Coolors.co**: palette generation
- **ColorBrewer**: scientifically-backed palettes for cartography (works for any chart)
- **Material Theme Builder**: HCT-based palettes
- **Chroma.js**: programmatic generation
- **ggplot2 viridis**: perceptually uniform sequential palettes

## Cross-reference

- [`knowledge/colors/color-theory.md`](../colors/color-theory.md) — palette construction
- [`knowledge/patterns/chart-types.md`](chart-types.md) — choosing the right chart for the data
- [`knowledge/patterns/dashboard-composition.md`](dashboard-composition.md) — applying palettes in a dashboard
- [`knowledge/patterns/money-and-amount.md`](money-and-amount.md) — money color semantics, KR stock convention
- [`knowledge/a11y/contrast.md`](../a11y/contrast.md) — text on chart backgrounds
