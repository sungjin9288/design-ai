# illustration-designer — playbook

Design and spec an illustration system, OR a single illustration within an existing system. Output is a markdown spec a designer / illustrator can produce against, OR direct SVG output for simple cases.

## When to use

- "We need an illustration system for our SaaS landing page."
- "Spec the empty state illustrations for our product."
- "Design a mascot for our Korean fintech app."
- "Should we use Lottie or SVG for the hero?"
- "Optimize this SVG."

## Inputs (ask if missing)

1. **Scope** — full system, OR single illustration.
2. **Surface** — empty state / hero / onboarding / spot / mascot.
3. **Brand voice** — 3-5 adjectives (e.g., calm, gentle, money-warm; or sharp, futuristic, controlled).
4. **Existing system?** — if yes, follow its style. If no, this skill defines one.
5. **Color tokens** — which brand tokens are available.
6. **Format constraint** — SVG / Lottie / PNG / WebP / mixed.
7. **Korean market?** — affects mascot vs minimal-geometric default.
8. **Production budget** — solo designer, agency, AI-assisted, none yet.

## Steps

### 1. Classify the work

| Task | Approach |
| --- | --- |
| Define a new system | All 5 knowledge files in [`knowledge/illustration/`](../../knowledge/illustration/) apply |
| Add to existing system | Follow style guide; don't redefine |
| Single spot illustration | [`spot-illustrations.md`](../../knowledge/illustration/spot-illustrations.md) |
| Hero illustration | [`hero-illustrations.md`](../../knowledge/illustration/hero-illustrations.md) |
| Mascot work | [`mascot-design.md`](../../knowledge/illustration/mascot-design.md) |
| SVG technical / optimization | [`svg-optimization.md`](../../knowledge/illustration/svg-optimization.md) |

### 2. If defining a system — set the style

From [`illustration-systems.md`](../../knowledge/illustration/illustration-systems.md):

- **Geometric vs organic** — pick one.
- **Line weight rule** — stroke-only / fill-only / mixed; one stroke width.
- **Color treatment** — monochromatic / brand-palette / limited-extended.
- **Geometry rules** — grid, corner radius, stroke caps.
- **Perspective** — flat / isometric / front-view.
- **Voice** — 3-5 adjectives.

State each choice with reasoning.

### 3. Pick the format

| Format | Use |
| --- | --- |
| SVG | Default; vector, themeable |
| Lottie | Animated illustration |
| PNG / WebP | Heavy shading, painterly, photo-realistic |
| AVIF | Highest compression for raster |

For most: SVG. Lottie when motion is the point. Raster only when SVG can't represent the visual.

### 4. Per-illustration spec

For each illustration:

```
Name: <kebab-case, prefixed by category>
       e.g., illo-empty-search.svg, illo-hero-onboarding-01.svg
Surface: <empty-state | error-state | onboarding-step-2 | hero-section-3>
Subject: <one sentence — what's depicted>
Voice: <encouraging | calm | celebratory | apologetic>
Size: <display dimensions>
Format: <SVG | Lottie | PNG>
Tokens used: <list of CSS variables / brand colors>
Animation? <static | subtle loop | one-shot>
Accessibility: <decorative | meaningful + alt text>
Production hours: <estimate>
```

### 5. Apply Korean conventions (if applicable)

- Heavy mascot use? See [`mascot-design.md`](../../knowledge/illustration/mascot-design.md).
- Soft, rounded, warm geometry preferred for B2C.
- Hero illustrations: less abstract, more concrete (real character / real action).
- See [`knowledge/i18n/korean-app-store-visual.md`](../../knowledge/i18n/korean-app-store-visual.md).

### 6. Optimize the SVG

For each shipped SVG:

- [ ] Run SVGO with config from [`svg-optimization.md`](../../knowledge/illustration/svg-optimization.md)
- [ ] Replace brand color hex with `currentColor` or CSS variable
- [ ] Verify viewBox preserved
- [ ] Verify no embedded raster
- [ ] Verify no editor metadata
- [ ] Verify size targets: < 1kB icon, < 10kB spot, < 50kB hero
- [ ] Test at 1×, 2×, 3×
- [ ] Test in light + dark modes

### 7. Accessibility

- Decorative: `aria-hidden="true"` on illustration.
- Meaningful: `role="img"` + `aria-label`.
- Animated: respect `prefers-reduced-motion`.

### 8. Output

Use this structure:

```markdown
# Illustration spec: <system or piece name>

> Scope: <system | single piece>
> Style: <flat geometric | soft 3D | hand-drawn | mascot-driven | editorial | generative>
> Voice: <3-5 adjectives>
> Format: <SVG | Lottie | mixed>

## Style rules
<line weight, color treatment, geometry, perspective>

## Color tokens
<list of brand tokens permitted>

## Asset list
| Name | Surface | Size | Format | Tokens | Anim? |

## Production checklist
<checklist per illustration>

## Don't
<2-3 specific misuses>
```

## Source files this skill reads

- [`knowledge/illustration/illustration-systems.md`](../../knowledge/illustration/illustration-systems.md) — system foundation
- [`knowledge/illustration/spot-illustrations.md`](../../knowledge/illustration/spot-illustrations.md) — small purposeful
- [`knowledge/illustration/hero-illustrations.md`](../../knowledge/illustration/hero-illustrations.md) — large brand-led
- [`knowledge/illustration/mascot-design.md`](../../knowledge/illustration/mascot-design.md) — character work
- [`knowledge/illustration/svg-optimization.md`](../../knowledge/illustration/svg-optimization.md) — SVG production
- [`knowledge/patterns/brand-identity.md`](../../knowledge/patterns/brand-identity.md) — brand foundation
- [`knowledge/motion/motion-tools.md`](../../knowledge/motion/motion-tools.md) — Lottie when animated
- [`knowledge/i18n/korean-app-store-visual.md`](../../knowledge/i18n/korean-app-store-visual.md) — Korean market visual
- [`examples/component-empty-state.md`](../../examples/component-empty-state.md) — empty state spec
- [`examples/component-illustration.md`](../../examples/component-illustration.md) — generic display

## Verification phase (run before declaring done)

- [ ] If defining a system: are style + voice + color rules all explicit?
- [ ] Is the format chosen consciously (SVG default; Lottie / PNG only with reason)?
- [ ] Are color tokens listed (no raw hex in the spec body)?
- [ ] Are illustrations sized per category (1kB icon / 10kB spot / 50kB hero)?
- [ ] Is accessibility specified (decorative vs meaningful + alt text)?
- [ ] If animated: is reduced-motion fallback specified?
- [ ] If Korean B2C: are mascot conventions or Toss-style restraint applied?
- [ ] If shipping SVG: is SVGO + currentColor + viewBox checklist passed?
- [ ] Does the "Don't" section catch 2-3 specific misuses?

## Done when

- One markdown spec.
- Style + voice + format choices explicit and reasoned.
- Color tokens listed.
- Asset list with sizes, formats, accessibility.
- Production checklist.
- "Don't" section.
- Verification passes.
