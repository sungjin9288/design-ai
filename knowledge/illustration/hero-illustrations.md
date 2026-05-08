<!-- hand-written -->
---
title: Hero illustrations (marketing landing-page artwork)
applies_to: [illustration, marketing, hero, landing]
---

# Hero illustrations

Hero illustrations are large, brand-led illustrations that anchor a landing page or major marketing surface. Larger investment, longer-lasting, harder to get right than spot illustrations.

## What "hero" means

- 480–1200px wide (display).
- Often above-the-fold or above-the-section-fold.
- Carries significant brand weight — replaces the photo / video that would otherwise be in that slot.
- Usually one per major page section (1 in hero, 1 per feature, etc.).

## Three hero illustration archetypes

### 1. Conceptual / metaphorical

The illustration represents an abstract concept the product enables.

```
"Money flows automatically" → illustration of stylized money trails connecting accounts.
"Code reviews in 30 seconds" → illustration of code with checkmarks emerging.
"Your team, in sync" → people visualized as gears or musical notes harmonizing.
```

Strengths:
- Evocative, memorable.
- Communicates value beyond what a screenshot shows.

Risks:
- Easy to be vague ("clouds and arrows" mean nothing).
- Easy to be cliché (lightbulb = idea, gears = work).

### 2. Product-in-context (illustrated mockup)

A stylized illustration of the product being used — phone in hand, laptop with the dashboard rendered as illustration.

```
[Illustrated phone outline] [actual screenshot inside]
```

Or fully illustrated:

```
[Illustrated person] [holding illustrated phone] [showing illustrated app]
```

Strengths:
- Shows the product without committing to a real screenshot (which dates fast).
- Easier to make consistent across pages.

Risks:
- Can feel less authentic than a real screenshot.
- Detail level must match throughout.

### 3. Character-driven scene

Mascot or human characters in a scene that depicts product usage or value.

```
[Character A using product, Character B receiving the result]
```

Strengths:
- Strong emotional connection.
- Memorable.

Risks:
- Production cost (good character art is expensive).
- Inclusivity concerns (characters represent people; representation matters).
- Drift across illustrations (hard to keep characters on-model).

## Production scope

Hero illustrations are an order of magnitude more work than spot illustrations:

| Type | Production hours (rough) |
| --- | --- |
| Spot illustration (existing system) | 2-6 |
| Spot illustration (new style) | 8-16 |
| Hero illustration (existing system) | 12-24 |
| Hero illustration (new style / character) | 40-80+ |

Plan accordingly. Hero illustrations should be high-leverage (used on the landing page for years) — don't make a custom hero for every minor page.

## Composition

### Subject placement

| Pattern | Use |
| --- | --- |
| Centered | Brutalist hero, balanced text-illustration relationship |
| Right-anchored | Text-led layout (text left, illustration right) |
| Left-anchored | Illustration-led layout (illustration left, text right) |
| Diagonal / dynamic | Stronger motion / energy |
| Background-spanning | Full-bleed, text overlays on safe area |

The illustration's placement must coordinate with the page layout.

### Eye flow

Illustration directs the eye. If a character is looking at something, the user follows that gaze. Use this:

- Character looking at the headline → user reads headline.
- Character looking at CTA → user clicks CTA.
- Character looking at viewer → user feels addressed (works for testimonials).

Don't have characters looking off-frame at nothing — wastes attention.

### Aspect ratio

| Surface | Ratio |
| --- | --- |
| Desktop hero | 16:9 or 4:3 |
| Mobile hero | 4:5 or 1:1 (taller, fewer landscape illustrations work on phone) |
| Sidebar / column | 1:1 |
| Section banner | 16:5 (wide thin) |

Plan multiple aspect ratios from the start. Cropping a 16:9 illustration to 4:5 on mobile rarely works.

## Color and brand

Hero illustrations carry more brand color than spot illustrations:

- **Primary brand color**: 30-50% of illustration's visual weight.
- **Secondary brand colors**: 20-30%.
- **Neutrals (light/mid/dark)**: 20-30%.
- **Accent colors**: max 10%, only if system permits.

Avoid 5+ colors of equal weight — looks chaotic.

Bake colors into tokens, not raw hex. For dark mode: produce a separate variant or use `currentColor` + CSS variables strategically.

## Detail level

A hero illustration has more detail than a spot. Define the level:

| Level | Lines | Shapes | Surface |
| --- | --- | --- | --- |
| Low detail | 5-15 | 10-25 | Most spots |
| Medium detail | 15-50 | 25-100 | Most heroes |
| High detail | 50+ | 100+ | Editorial heroes |

Match across the system. Don't have one feature page with a 20-shape illustration and another with a 200-shape illustration.

## Animation in heroes

Hero illustrations can be:
- **Static** (default) — fastest load, most reliable.
- **Looped** (subtle ambient motion — floating shapes, breathing) — adds life, watch performance.
- **Scroll-driven** — illustration changes as user scrolls (advanced; performance-heavy).

If animating: see [`motion/marketing-motion.md`](../motion/marketing-motion.md) and [`motion/motion-tools.md`](../motion/motion-tools.md). Lottie or Rive likely.

## Performance

Heroes are above-the-fold. They impact LCP:

| Format | Typical hero file size | LCP impact |
| --- | --- | --- |
| SVG (medium detail) | 30-100kB | Negligible |
| SVG (high detail) | 100-400kB | Moderate; consider WebP fallback |
| PNG (1x) | 200-800kB | High |
| PNG (2x retina) | 800kB-3MB | Severe |
| WebP | 100-400kB (vs PNG) | Better than PNG |
| Lottie JSON | 50-300kB | Moderate (renders after JSON parse) |
| Lottie .lottie binary | 30-150kB | Moderate |

For SVG with > 200 shapes: bench against bitmap. Sometimes a 200kB WebP is faster to render than a 100kB SVG with hundreds of paths.

Always: lazy-load below-the-fold heroes; preload above-the-fold; provide poster image for animated heroes.

## Korean market — hero illustrations

Korean B2C / fintech hero illustrations follow distinct conventions:

- **Mascot-led** — Kakao Friends (라이언/어피치), Toss money characters, NaverPay characters dominate. Big-name brands.
- **Soft, rounded, warm** — pastel + brand color, less stark than Western minimal.
- **Less abstract** — Korean B2C audiences trend toward concrete imagery (a real character, a real action) over abstract metaphor.
- **High emotion** — characters express clear feelings (joy, calm, focus). Not the cool detachment of Linear / Stripe illustrations.

For Korean B2B (enterprise SaaS): still leans more abstract / geometric, similar to Western styles.

See [`mascot-design.md`](mascot-design.md) for character work depth.

## Inclusive representation

Hero illustrations with characters have representation concerns:

- **Skin tones**: include a range, not all one tone.
- **Body types**: not all thin / all stylized in one direction.
- **Ages**: include older / younger characters where appropriate to the audience.
- **Disability**: include canes, wheelchairs, hearing aids when relevant (and not just in "accessibility-themed" sections).
- **Gender**: don't default all professional roles to one gender.

For Korean market: same principles apply, with Korean / Asian feature representation as primary. Avoid Western-coded features in mascot characters intended for Korean audiences (looks foreign).

## Consistency across heroes

For multi-page sites with multiple heroes:

- Same character set (or same mascot) across all heroes.
- Same line weight / fill rules.
- Same color palette.
- Same perspective (all front-view, or all isometric — don't mix).
- Same level of detail.

Create a **hero illustration spec sheet** at the system level with these rules locked.

## Don't

- Don't ship a hero illustration that doesn't match the headline. Visual + text dissonance.
- Don't use stock hero illustrations on a serious B2B SaaS landing page — every product has the same Storyset hero.
- Don't ignore mobile aspect ratio at hero design time. Phone-first redesign is more expensive than dual-aspect from the start.
- Don't bake brand color as raw hex — use tokens / CSS vars.
- Don't go above 400kB without a strong reason. There's almost always a smaller way.
- Don't auto-loop a busy hero (motion fatigue, battery drain).

## Cross-reference

- [`knowledge/illustration/illustration-systems.md`](illustration-systems.md) — system foundation
- [`knowledge/illustration/spot-illustrations.md`](spot-illustrations.md) — small purposeful illustrations
- [`knowledge/illustration/mascot-design.md`](mascot-design.md) — character work
- [`knowledge/illustration/svg-optimization.md`](svg-optimization.md) — performance
- [`knowledge/patterns/landing-hero-design.md`](../patterns/landing-hero-design.md) — overall hero strategy
- [`knowledge/motion/marketing-motion.md`](../motion/marketing-motion.md) — animating heroes
- [`examples/component-hero-block.md`](../../examples/component-hero-block.md) — hero component spec
