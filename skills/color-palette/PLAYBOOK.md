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

## Done when

- Every token has a name, a hex, and a role.
- Every UI-relevant pair has a contrast number.
- Code blocks for at least one target framework are paste-ready.
- A "use guidance" section tells the user when to reach for primary vs accent vs neutral.
- Dark mode is recomputed (if requested), not inverted.
