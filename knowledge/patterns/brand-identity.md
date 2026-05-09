<!-- hand-written -->
---
title: Brand identity foundations
applies_to: [brand, identity, logo, voice]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Brand identity

design-ai consumes brand inputs (colors, fonts, voice) to make design choices. This file covers the **brand fundamentals** every product design touches — even if you're not designing the brand itself.

## What brand identity contains

Brand identity is roughly 5 layers, from most-visible to least:

| Layer | Examples |
| --- | --- |
| **Logo** | Wordmark, lettermark, symbol, combination |
| **Color** | Primary, accent, neutrals (the palette your product uses) |
| **Typography** | Brand font(s) — used in marketing AND product |
| **Voice / tone** | How you write — playful vs serious, polite vs casual |
| **Imagery / illustration** | Photo style, illustration system, iconography |

A "brand guideline" document covers all five.

## Logo — fundamentals

design-ai doesn't generate logos but specs how they're used. Common rules:

### Anatomy

```
Lettermark:        Wordmark:           Symbol:           Combination:
   [T]                Toss               [○]                [○] Toss
                                                              brand
```

| Type | Use |
| --- | --- |
| **Lettermark** | Single letter (KakaoBank's "K", Toss's "T"). Compact, memorable. |
| **Wordmark** | Just the company name styled. (Google, Coupang) |
| **Symbol** | No text. Recognizable enough alone. (Apple's apple) |
| **Combination** | Symbol + wordmark. Most flexible. |

For Korean apps: lettermarks are common (한 글자 — K, T, N) due to Hangul/Latin compatibility.

### Logo rules

- **Minimum clear space**: padding around the logo equal to the cap-height of the wordmark (or radius of symbol).
- **Minimum size**: typically 16px (favicon) / 24px (standard). Below this: lettermark only.
- **Don't distort**: stretch, skew, gradient, drop-shadow on logos = brand violation.
- **Locked combinations**: if "logo + tagline" is locked, never split.
- **Color treatment**: brand color (default), white-on-dark (for dark backgrounds), 1-color (for ink-restrictive contexts).

### Logo variants per context

A real brand kit ships:

```
logo/
├── primary.svg              # default — full color
├── primary-white.svg        # for dark backgrounds
├── primary-black.svg        # 1-color, ink-only
├── lettermark.svg           # symbol-only
├── lettermark-white.svg
├── horizontal.svg           # stacked is default; horizontal for narrow placements
├── icon-32.png              # raster for app icon
└── icon-1024.png            # high-res for app store
```

Provide all variants — designers and devs grab what they need.

## Color (brand)

The brand color set is **input** to design-ai's `color-palette` skill. See [`knowledge/colors/color-theory.md`](../colors/color-theory.md) for ramp construction.

Brand color = **primary anchor**. Everything else is generated from it.

A brand kit specifies:
- **Primary** (the seed)
- **Optional secondary** (often a complementary or accent hue)
- **Neutral** (often a hue-tinted gray matched to the primary)
- **Forbidden colors** (e.g., "never use red except for errors")
- **Color usage rules** ("primary on hero only, accent for CTAs")

The **product's** semantic palette (text, bg, border) is derived. Brand provides hue; design system provides system.

## Typography (brand)

Brand fonts often differ from product fonts:

| Surface | Font choice |
| --- | --- |
| Marketing site (hero) | Display brand font — distinct, memorable |
| Marketing body | Brand font OR humanist sans |
| Product UI | Often a different font — system or workhorse sans |
| Documents | A serif or paired humanist sans |

For Korean apps: Pretendard often works at all surfaces. Trying to maintain "brand font in marketing, Pretendard in product" creates inconsistency.

Practical: pick **one font for product + secondary marketing surfaces**, and *one display* font for hero / landing if you want extra brand punch.

## Voice / tone

Voice and tone are different:

| | Definition |
| --- | --- |
| **Voice** | Personality. Stays consistent across all contexts. |
| **Tone** | Emotional register. Varies by context. |

Brand voice example: "Warm, direct, knowledgeable, never preachy."
Tone variations:
- Onboarding email: warmer, encouraging.
- Error message: direct, no apologies, action-oriented.
- Marketing landing page: confident, declarative.
- Customer support: warm, patient, problem-solving.

### Voice attributes (typical brand kit)

A voice kit defines 4–6 attributes with **what we are AND what we're not**:

```
We are: Warm
NOT: Sycophantic ("Hey friend!" is too much)

We are: Direct
NOT: Curt ("Done." is too cold)

We are: Knowledgeable
NOT: Condescending ("Obviously, you should..." — no.)

We are: Confident
NOT: Brash ("Best in the world!" — no.)
```

This dual definition prevents drift.

### Korean voice considerations

For Korean apps, choose a **honorific level** as part of voice:

| Level | When to use | Example |
| --- | --- | --- |
| 존댓말 (~합니다) | Formal — banking, fintech, B2B | "잠시 후 다시 시도해 주세요." |
| 존댓말 (~해요) | Friendly — consumer apps, casual | "다시 한번 시도해 주세요." |
| 반말 | **Don't use** in product UI | (avoid) |

Most consumer Korean apps use casual ~해요. Banking / fintech: ~합니다 / ~합니다 mixed.

## Imagery / illustration

Brand imagery is a hidden axis. Often missing from "I have a brand color" briefs.

| Style | Examples | Use |
| --- | --- | --- |
| **Photography (lifestyle)** | Real people, natural lighting | Marketing, e-commerce |
| **Photography (product)** | Hero shots, on-white | E-commerce |
| **Illustration (line)** | Single-color outline drawings | Tech docs, UI empty states |
| **Illustration (flat)** | Multi-color flat shapes | Marketing, onboarding |
| **Illustration (3D / Memphis)** | Dimensional shapes | Tech / fintech (Toss-style) |
| **Geometric / abstract** | Shapes, no people | Tech, B2B |

Pick one style for the brand. **Don't mix** illustration styles within the product — Apple-style 3D in onboarding + Memphis in errors = visual chaos.

For Korean apps: Toss-style 3D abstract is currently dominant in fintech. KakaoBank uses flat illustrations. Pick a side per product.

## Brand vs design system

Brand and design system are **adjacent but distinct**:

| | Brand | Design system |
| --- | --- | --- |
| **Owned by** | Marketing / leadership | Engineering / product design |
| **Audience** | Customers, market | Builders (designers, devs) |
| **Output** | Logo, voice, brand kit | Tokens, components, patterns |
| **Updated** | Rarely (every 3–5 years) | Frequently (per quarter) |
| **Source of truth** | Brand book | tokens/source.json + Storybook |

Design system **inherits** from brand:
- Brand primary → semantic primary token
- Brand font → product type stack
- Brand voice → component copy

design-ai's role: take brand inputs, produce the design system.

## Brand audit (against brand kit)

Use this checklist when reviewing whether a product matches its brand:

- [ ] Logo: rendered correctly, sized within bounds, in approved variants only.
- [ ] Color: primary used per spec; semantic tokens reference it; no rogue brand colors elsewhere.
- [ ] Typography: brand font used (or designed alternative); fallback chain correct.
- [ ] Voice: error messages, empty states, CTAs match voice attributes.
- [ ] Imagery: one illustration style; photos match brand guidelines (lifestyle / product / etc.).
- [ ] Iconography: single icon library, consistent stroke width.
- [ ] Motion: brand has motion language? Check that animations match.

Run as a once-per-quarter check.

## Brand kit format

A real brand kit is typically:

```
brand-kit/
├── README.md              # how to use this kit
├── logo/                  # SVG + PNG variants
├── color.json             # primary, secondary, neutrals, semantic
├── typography.md          # font choices, weights, scale, fallbacks
├── voice.md               # attributes, dos/don'ts, copy examples
├── imagery/               # reference images, illustration system
├── icons/                 # if custom icons exist
└── examples/              # marketing pages, ads, screenshots showing the brand
```

The "brand book" PDF (typical agency deliverable) is a presentation of this kit — the kit itself is the working artifact.

## When to invest in brand vs design system

If you have neither: **invest in design system first**. A working product with a thin brand beats a brand book with no product.

If you have a strong brand but inconsistent product: invest in design system. The brand will guide it.

If you have a working design system but no brand identity: a brand book solidifies decisions but isn't urgent unless marketing demands it.

For early-stage Korean fintech / startup: focus design system first; brand emerges via product use.

## Cross-reference

- [`knowledge/colors/color-theory.md`](../colors/color-theory.md) — palette construction from brand color
- [`knowledge/typography/font-pairings.md`](../typography/font-pairings.md) — font selection per mood
- [`knowledge/patterns/styles-catalog.md`](styles-catalog.md) — visual style families
- [`knowledge/patterns/brand-references.md`](brand-references.md) — peer brand references
- [`skills/design-system-builder/`](../../skills/design-system-builder/) — converts brand inputs to a system
- [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md) — Korean voice conventions
