# color-palette — playbook

Generate a complete, accessible color palette from a single seed (brand color, mood word, or product category).

## When to use

- "Build me a color palette for a fintech app" → product category input.
- "I have brand red `#E63946`, build the system" → seed color input.
- "Generate a calm, premium palette" → mood input.

## Inputs (ask if missing)

1. **Seed** — one of:
   - A hex (brand primary).
   - A product category (e.g., `e-commerce`, `health-tech`, `developer-tools`).
   - A mood (e.g., `playful`, `editorial`, `brutalist`).
2. **Light + dark, or light only?** — default both.
3. **Target framework** — `tailwind v4`, `shadcn-ui`, `mui`, `antd`, `css variables`. Default: tailwind v4.
4. **Korean / CJK content?** — affects neutral choice (slight warm bias often reads cleaner with Hangul).

## Steps

### 1. If seed is a category or mood, find a reference

Open [`knowledge/colors/palettes-by-product-type.md`](../../knowledge/colors/palettes-by-product-type.md). Match by **Product type** column. Pull the row's tokens as a starting point. Do **not** copy verbatim — adapt.

If mood-based, open [`knowledge/patterns/styles-catalog.md`](../../knowledge/patterns/styles-catalog.md) and pull the matching style's `Primary Colors` and `Secondary Colors`.

#### Mood → hue mapping (when no reference matches)

When neither a hex nor a category is given — only mood words like "trustworthy", "energetic", "calm" — translate to a starting hue + chroma + lightness range. These are starting points; adjust based on differentiation needs (every fintech being blue is the trap).

| Mood | Hue family (OKLCH H) | Chroma | Lightness anchor (step 600) |
| --- | --- | --- | --- |
| Trustworthy / financial | Blue 230–250°, teal 170–195° | 0.18–0.24 | L ~ 50% |
| Energetic / playful | Red-orange 20–60°, magenta 0–30°, yellow 70–100° | 0.20–0.28 (high) | L ~ 55–65% |
| Calm / wellness | Green 130–160°, soft blue 200–230°, sage | 0.10–0.16 (muted) | L ~ 50–60% |
| Premium / luxury | Near-monochrome — purple 290–320° low chroma, charcoal | 0.05–0.12 | L ~ 35–50% (darker anchor) |
| Editorial / refined | Burgundy 0–20°, sage 130–160°, deep blue 230–260° | 0.12–0.18 | L ~ 40–50% |
| Youthful / approachable | Coral 10–30°, mint 160–180°, lavender 280–300° | 0.16–0.22 | L ~ 60–70% (lighter) |
| Tech / futuristic | Electric blue 240–260°, cyan 195–215°, magenta 290–320° | 0.20–0.28 | L ~ 55–65% |
| Natural / organic | Earth green 100–140°, brown 30–60°, ochre 70–90° | 0.10–0.16 | L ~ 45–55% |
| Brutalist / bold | Pure primaries 0°/240°/60°, plus near-black + white | 0.25+ (max) | L ~ 50% |
| Minimal / Swiss | Near-neutral, single accent | < 0.05 | L ~ 30% (dark accent on white) |

Combining moods: bias by primary mood, then adjust toward secondary. "Trustworthy + Youthful" → start at trustworthy blue/teal, shift L up to ~60%, slightly raise C.

#### Differentiation check

Before committing to the mood-derived anchor, check the local market's dominant brands in the same category:

```
Korean fintech competitors:
- Toss: blue #3182F6
- KakaoBank: yellow + accent #FFEB00
- Naver Pay: green
- Shinhan: blue
- KB Star: blue

→ Avoid: another blue at L=50%, H=230°. Differentiate with teal,
  warmer accent, or shift hue 30°+ from competitors.
```

Cite [`knowledge/patterns/brand-references.md`](../../knowledge/patterns/brand-references.md) for visual peer comparison if available.

#### Korean considerations

For Korean-primary apps:
- Slight warm bias on neutrals (slate H ~ 240–260° preferred over cool steel-gray) — reads cleaner with Hangul.
- For stock/trading apps: account for Korean color convention (red=up, blue=down) — see [`knowledge/patterns/money-and-amount.md`](../../knowledge/patterns/money-and-amount.md).
- For consumer/B2C: avoid pure yellow primary (Kakao-coded) and pure green (Naver-coded) unless intentional brand alignment.

### 2. Convert seed to OKLCH

Stay in OKLCH for the entire generation. Only convert to HEX/RGB at output. See [`knowledge/colors/color-theory.md`](../../knowledge/colors/color-theory.md) for why.

### 3. Build the primary ramp

11 stops: `50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`.

- `L` (lightness) starts at ~98% (step 50), decreases by ~8% per step, ending at ~12% (step 950).
- `C` (chroma) peaks at step 500–600 (where the brand sits) and falls toward both ends.
- `H` (hue) **stays constant**.

Validate: step 600 must clear **4.5:1 against white** for body text. If not, the seed is too light — raise the seed's chroma or shift the ramp anchor up by one step.

### 4. Pick semantic anchors from the ramp

```
--color-primary-default: <step that hits 4.5:1 on white, usually 600>
--color-primary-hover:   <one step darker, 700>
--color-primary-active:  <two steps darker, 800>
--color-primary-subtle:  <step 50 or 100, for backgrounds>
--color-on-primary:      <white if primary-default L < 60%, else step 950>
```

### 5. Build accent and neutrals

- **Accent**: rotate hue by 60–120° in OKLCH from primary, hold L/C constant. Build a parallel 11-step ramp.
- **Neutrals**: build a gray ramp with **slight chroma matching primary's hue** (C ≈ 0.01–0.02). Pure C=0 reads cold.
- **Semantic non-brand**: green-600 (success), amber-500 (warning), red-600 (error), blue-600 or primary (info). Build full ramps for each.

### 6. Validate WCAG

Build a contrast matrix:

```
            on white  on neutral-50  on neutral-900
primary-600    X.X       X.X            X.X
text-primary   X.X        ✓              ✓
text-secondary X.X        ✓              ✓
border         3.0+      3.0+           3.0+
```

Every cell that hosts UI must hit:
- 4.5:1 if it's text on a background.
- 3:1 if it's a border, icon, or large text.

Cite [`knowledge/a11y/contrast.md`](../../knowledge/a11y/contrast.md) when explaining failures.

### 7. Build dark mode

Don't invert. Recompute:

- New `background-default`: OKLCH(0.18 0.005 H_neutral) — near-black with the neutral hue.
- New `background-elevated`: +0.02 L from default.
- Increase chroma on accents by 10–20% — low-light eye is less saturated.
- `primary-default` for dark mode = a step closer to step 400 from the original ramp (lighter so it reads against the dark BG).
- Re-run the contrast matrix for dark mode.

### 8. Output

Use the [TEMPLATE.md](TEMPLATE.md) format. Always emit:

1. **Reasoning paragraph** — why this palette fits the brief.
2. **Token table** — all named tokens with hex values.
3. **Code blocks** — one per requested framework (CSS vars + Tailwind config + JSON).
4. **Contrast matrix** — pass/fail for every UI-relevant pair.
5. **Use guidance** — when to use primary vs accent, what NOT to do.
6. **Dark mode** (if requested) — same shape, separate section.

## Source files this skill reads

- [`knowledge/colors/color-theory.md`](../../knowledge/colors/color-theory.md)
- [`knowledge/colors/palettes-by-product-type.md`](../../knowledge/colors/palettes-by-product-type.md)
- [`knowledge/colors/mui-palette-structure.md`](../../knowledge/colors/mui-palette-structure.md)
- [`knowledge/a11y/contrast.md`](../../knowledge/a11y/contrast.md)
- [`knowledge/design-tokens/ant-design.md`](../../knowledge/design-tokens/ant-design.md)
- [`knowledge/patterns/styles-catalog.md`](../../knowledge/patterns/styles-catalog.md) — only when mood-based input
- [`knowledge/patterns/brand-references.md`](../../knowledge/patterns/brand-references.md) — for differentiation against peers
- [`knowledge/patterns/money-and-amount.md`](../../knowledge/patterns/money-and-amount.md) — when palette is for fintech / money-aware UI

## Verification phase (run before declaring done)

Self-check the output against this checklist. If any answer is "no" or "unsure", revise.

- [ ] Did I cite at least one knowledge file for each major claim category (palette construction, contrast, dark mode)?
- [ ] Does every UI-relevant text-on-bg pair have an explicit contrast ratio in the matrix?
- [ ] Does the matrix flag ✓ for AA where required and identify failures (rather than silently omit)?
- [ ] If mood-based: did I document **why** I picked this hue family (which mood mapping)?
- [ ] If category-based: did I cite the source row from `palettes-by-product-type.md`?
- [ ] Is the differentiation check articulated (which competitors I'm avoiding)?
- [ ] Is dark mode recomputed (separate values) or just stated to be inverted? (Should be recomputed.)
- [ ] Is the focus-ring color verified at 3:1 against BOTH page bg AND the primary button bg?
- [ ] Are money-positive / money-negative tokens included if the palette is for fintech?
- [ ] Are the code blocks for the target framework actually paste-ready (no placeholder values)?

## Done when

- Every token has a name, a hex, and a role.
- Every UI-relevant pair has a contrast number.
- Code blocks for at least one target framework are paste-ready.
- A "use guidance" section tells the user when to reach for primary vs accent vs neutral.
- Dark mode is recomputed (if requested), not inverted.
- The verification phase checklist passes.
