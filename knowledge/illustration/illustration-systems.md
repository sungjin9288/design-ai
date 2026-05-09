<!-- hand-written -->
---
title: Illustration systems (style, voice, system design)
applies_to: [illustration, brand, marketing, empty-states]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Illustration systems

Illustration is **brand-bearing** in a way most UI elements aren't. A button is a button. A spot illustration says "this is what we feel like." Inconsistent illustration reads as more amateurish than inconsistent typography.

This file is the foundation for [`spot-illustrations.md`](spot-illustrations.md), [`hero-illustrations.md`](hero-illustrations.md), [`mascot-design.md`](mascot-design.md), and [`svg-optimization.md`](svg-optimization.md). Read these first.

## What an illustration system is

A reusable, opinionated set of:
1. **Style rules** — line weight, color treatment, geometry, perspective.
2. **Voice rules** — what feeling illustrations should convey.
3. **Asset library** — the actual SVG / PNG / Lottie files.
4. **Usage guidelines** — when to use illustration vs photo vs icon vs nothing.
5. **Production rules** — how new illustrations are made consistent with existing.

Without these: every illustrator (or every AI prompt) outputs different work. The system breaks within 3 months.

## Six common illustration styles

| Style | Look | Use |
| --- | --- | --- |
| **Flat geometric** | 2-color, no gradients, hard edges | Default for SaaS, fintech, product UI |
| **Soft 3D** | Rounded, gradient-shaded, isometric | Premium consumer (Notion, Stripe ad units) |
| **Hand-drawn / sketchy** | Imperfect lines, organic | Approachable, casual brands (Linear illustrations, Mailchimp) |
| **Mascot-driven** | Recurring characters | Kakao, Toss, fintech consumer |
| **Editorial** | Magazine-style, sophisticated | Long-form content, publications |
| **Generative / AI hybrid** | Distinctive AI-look + human curation | Linear, Midjourney's own marketing, 2024+ |

A system picks **one** primary style. Not two. Mixing flat-geometric with soft-3D in the same product reads as different brands.

## Defining your style

Spec the following before producing any illustration:

### Geometric vs organic

| | Geometric | Organic |
| --- | --- | --- |
| Lines | Straight, 45°/90°, perfect arcs | Curved, hand-drawn, irregular |
| Shapes | Circles, rectangles, simple polygons | Blobs, irregular silhouettes |
| Feeling | Precise, technical, modern | Warm, approachable, human |

Pick one bias. Most fintech leans geometric; most consumer / wellness leans organic.

### Line weight

- **Stroke-only**: 1.5px or 2px stroke, no fill. Lightweight, modern.
- **Stroke + fill**: stroke for outline, flat fill inside. Most common.
- **Fill-only**: no stroke, color blocks define shapes. Cleanest at small sizes.
- **Mixed weights**: thicker outline + thinner internal lines. Editorial feel.

Stick to one rule. Don't have stroke widths varying between illustrations.

### Color treatment

- **Monochromatic** (one hue + tints/shades) — most restrained, brand-strong.
- **Brand palette** (uses 3-5 brand tokens only) — most common.
- **Limited extended** (brand + 2-3 accent neutrals) — for variety in long marketing pages.
- **Full color** — only for editorial / hero illustrations; usually wrong for systems.

Specify **which tokens** an illustration may use. E.g., "Spot illustrations use `--color-brand-default`, `--color-brand-light`, and `--color-fg-on-bg`. No other colors permitted."

### Geometry rules

- **Grid alignment** — all anchor points snap to 8px / 16px grid for crispness.
- **Corner radius** — all rounded corners share one radius (e.g., 4px), or follow a tier (4px small, 8px medium, 16px hero).
- **Stroke caps** — round vs square. Pick one.
- **Stroke joins** — round vs miter. Pick one.

### Perspective

- **Flat / 2D** — most flexible, easiest to produce.
- **Isometric** — 30°/60°/90° three-quarter view. Premium, more production cost.
- **Front-view only** — rigid but consistent.
- **Mixed** — usually wrong.

## Voice — what illustrations should *feel*

Illustration carries emotional weight. Define voice in 3-5 adjectives:

| Brand | Illustration voice |
| --- | --- |
| Toss | Calm, gentle, money-warm |
| Linear | Sharp, futuristic, controlled |
| Stripe | Refined, geometric, technical-but-elegant |
| Kakao | Friendly, character-driven, playful |
| Notion | Approachable, human, slightly hand-drawn |

Include voice in the system spec. Without voice, illustrators interpret style rules differently and the work drifts.

## When to use illustration

| Surface | Illustration appropriate? |
| --- | --- |
| Empty state | Yes — the canonical use |
| Success / error / warning state | Yes — adds emotional clarity |
| Onboarding | Yes — reduces friction |
| Marketing hero | Sometimes — competing with photo / video |
| Feature explanation | Yes — when concept is abstract |
| App icon | No — that's identity design |
| Inside dashboards / data UIs | No — visual noise |
| Inside forms | No — distracts from input |
| Inside dense product UI | No — generally |

Default: NO illustration in product UI surfaces. Reserve for moments where it adds emotional information (empty / success / error / onboarding / marketing).

## When NOT to use illustration

- "Just because the page looks empty." Empty pages aren't broken — they're informative. Use illustration only if the user needs encouragement to act.
- "To fill space." Whitespace is a feature.
- "Because the brand is fun." Personality belongs in voice, color, motion. Not every screen needs a character.
- "To replace explanation." Illustration supplements text, doesn't replace it.

## Illustration vs photo vs icon vs nothing

| | Illustration | Photo | Icon | Nothing |
| --- | --- | --- | --- | --- |
| Brand-bearing | High | Medium-low | Low | — |
| Production cost | Medium-high | High (good photos) | Low | Zero |
| Scales to size | Excellent (vector) | Limited | Excellent | — |
| Consistency in system | Hard but possible | Hardest | Easy | — |
| Performance cost | Low (SVG) | High (image) | Lowest | Zero |
| When right | Branded moments, emotional surfaces | Real-world products, testimonial portraits | Inline UI, navigation | Dense data, forms, lists |

Use the right one. Don't use illustration for everything.

## System governance

A real system needs:

1. **Source files** — Figma library or Adobe Illustrator masters in version control.
2. **Naming convention** — e.g., `illo-empty-search.svg`, `illo-success-payment.svg`, `illo-hero-onboarding-01.svg`.
3. **Required reviews** — every new illustration reviewed against style + voice rules before merging.
4. **Refresh cadence** — illustration ages faster than icons. Plan to refresh every 18-24 months.

## Illustration kit options

For teams without a custom system, start with a kit:

| Kit | Style | License | Cost |
| --- | --- | --- | --- |
| **unDraw** | Flat geometric, 1-color | MIT-ish | Free |
| **Storyset by Freepik** | Multiple styles, customizable | Free with attribution / Premium | Free / Paid |
| **IconScout illustrations** | Many styles | Premium | Paid |
| **Humaaans** | Mix-and-match characters | CC0 | Free |
| **Open Peeps** | Hand-drawn characters | CC0 | Free |
| **Blush** | Customizable scenes | Free / Paid | Mixed |

For Korean market: most kits are Western-coded (people, contexts). Custom or Kakao-style mascot work usually required for true Korean B2C.

## AI-assisted illustration

2024+: Midjourney, DALL-E, Adobe Firefly can produce illustrations in a defined style. Workflow:

1. **Train style** — generate 50+ samples of your defined style, curate the best.
2. **Use as reference** — feed best samples back as style references for new prompts.
3. **Always retouch** — AI output never ships raw. Adjust line weight, colors, anchor points to match system.
4. **License check** — verify AI tool's license permits commercial use; document provenance.

AI is good for:
- Iteration speed (50 directions in an hour)
- Inspiration / mood-board generation
- Filling gaps (one-off illustrations the system doesn't have)

AI is bad for:
- Consistent system production at scale (variance is the point of AI; consistency is the point of a system)
- Brand-critical hero illustrations (uncanny / generic risk)
- Mascot continuity (faces drift across generations)

## Korean illustration conventions

Korean B2C apps lean heavily into:
- **Mascots** (Kakao Friends — 라이언/어피치/무지, Toss money characters, NaverPay's caricatures).
- **Soft, rounded geometry** (warm consumer feel).
- **Pastel + warm-neutral palette** (less stark than Western minimal).
- **Character-driven empty states** (mascot expressing the empty state's emotion).

Korean B2B / fintech (Toss, KakaoBank) is more restrained: flat geometric with limited mascot use.

See [`mascot-design.md`](mascot-design.md) for character-design depth.

## Technical concerns

| Format | When | Pros | Cons |
| --- | --- | --- | --- |
| **SVG** | Default for UI illustration | Vector, themeable, small | More effort to author |
| **PNG (2x/3x)** | Complex shading, photo-realism | Easy to author | Bigger files, no theme |
| **WebP** | Photo-realistic, large | Smaller than PNG | Less broad support (now near-universal) |
| **Lottie** | Animated illustration | Designer-led motion | Larger runtime, see [`motion/motion-tools.md`](../motion/motion-tools.md) |
| **AVIF** | Highest compression | Smallest files | Tooling still maturing |

Default: **SVG**. Use Lottie when the illustration animates. Use PNG only when SVG can't represent the visual (heavy shading, watercolor, painterly).

For SVG specifics: see [`svg-optimization.md`](svg-optimization.md).

## Don't

- Don't mix illustration styles within a product. One bias per system.
- Don't ship illustrations with raw hex colors — use CSS variables / SVG `currentColor` for theming.
- Don't ignore dark mode — illustrations need a dark variant or token-aware coloring.
- Don't use stock illustrations without checking license + uniqueness — same illustration on 50 SaaS landing pages is bad branding.
- Don't ship 500kB illustrations — see [`svg-optimization.md`](svg-optimization.md).
- Don't make every screen "fun." Restraint is a feature.

## Cross-reference

- [`knowledge/illustration/spot-illustrations.md`](spot-illustrations.md) — empty / success / error / onboarding
- [`knowledge/illustration/hero-illustrations.md`](hero-illustrations.md) — marketing-led
- [`knowledge/illustration/mascot-design.md`](mascot-design.md) — character / mascot system
- [`knowledge/illustration/svg-optimization.md`](svg-optimization.md) — SVG specifics
- [`knowledge/patterns/brand-identity.md`](../patterns/brand-identity.md) — illustration as brand
- [`knowledge/icons/curated-sets.md`](../icons/curated-sets.md) — icons (different concern)
