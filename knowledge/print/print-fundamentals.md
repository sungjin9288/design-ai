<!-- hand-written -->
---
title: Print fundamentals (CMYK, bleed, trim, DPI, paper)
applies_to: [print, physical, production, prepress]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Print fundamentals

Designing for print is not designing for screen. The math is different (CMYK not RGB), the resolution is different (300 DPI not 72/96 PPI), and you can't undo a print run.

This file is the foundation. Read before [`stationery.md`](stationery.md), [`brochures-and-flyers.md`](brochures-and-flyers.md), [`signage-and-posters.md`](signage-and-posters.md), [`packaging.md`](packaging.md), or [`korean-print-conventions.md`](korean-print-conventions.md).

## Color: CMYK vs RGB vs Spot

| | RGB | CMYK | Spot (Pantone) |
| --- | --- | --- | --- |
| What | Additive (light) | Subtractive (ink) | Pre-mixed ink |
| Where | Screens | Most printers | Premium print runs |
| Range | Wide gamut | Narrower (~70% of RGB) | Specific colors only |
| Use | Web, app | Brochures, business cards | Brand-critical color (logo) |

### What this means in practice

- **A bright RGB color** (e.g., `#00B4FF`) won't print as that color in CMYK. The press converts it to the nearest CMYK; result is duller, slightly shifted.
- **Test colors on press proofs** before final run. A digital preview lies.
- **Brand colors** in print should be specified as Pantone (PMS) numbers, not just CMYK percentages. PMS guarantees consistency across print runs.
- **Black**: pure CMYK black is C:0 M:0 Y:0 K:100. **Rich black** (C:60 M:40 Y:40 K:100) prints darker and is used for large black areas. Don't use rich black for small text — registration mistakes show as colored fringes.

### Designing in CMYK

Most workflows: design in InDesign / Illustrator / Affinity with CMYK color profile from the start. Don't design in RGB and convert at the end — colors will shift and the design must be re-checked.

For brand-critical pieces (business card, packaging): build the color palette in CMYK + Pantone references at the start of the project.

## Resolution: DPI vs PPI

- **PPI** (pixels per inch) — for digital images, screens.
- **DPI** (dots per inch) — for printed output.

Practical rule: **300 DPI at final print size** for photos. 600 DPI for line art / text-heavy.

If a photo is 1000×1000 pixels and the print size is 4×4 inches: 250 DPI — borderline acceptable. If print size is 8×8 inches: 125 DPI — visibly pixelated.

| Print size (inches) | Image size needed at 300 DPI |
| --- | --- |
| 2 × 3.5 (business card) | 600 × 1050 px |
| 4 × 6 (postcard) | 1200 × 1800 px |
| 8.5 × 11 (letter / A4-ish) | 2550 × 3300 px |
| 11 × 17 (tabloid / A3) | 3300 × 5100 px |
| 24 × 36 (poster) | 7200 × 10800 px |

For posters viewed from a distance: 150 DPI can be acceptable. For business cards held in the hand: 300+ DPI mandatory.

## Bleed, trim, safe area

Print pieces have three concentric zones:

```
┌────────────────────────────────────┐
│   Bleed (3-5mm beyond trim)        │   ← color extends here
│                                    │
│   ┌──────────────────────────┐     │
│   │  Trim (the final size)   │     │   ← cutter cuts here (with ±1mm margin)
│   │                          │     │
│   │  ┌────────────────────┐  │     │
│   │  │  Safe area         │  │     │   ← keep text + critical content here
│   │  │  (3-5mm inside)    │  │     │
│   │  │                    │  │     │
│   │  └────────────────────┘  │     │
│   └──────────────────────────┘     │
│                                    │
└────────────────────────────────────┘
```

| Zone | Purpose | Typical size |
| --- | --- | --- |
| **Bleed** | Color extends past trim so cut doesn't show white edge | 3mm (Korean standard), 0.125" / 3.175mm (US) |
| **Trim** | Final size of the piece | Per design |
| **Safe area** | Critical content (text, logo) that won't get cut | 3-5mm inside trim |

### Why this matters

Cutters have ±1mm tolerance. Without bleed, a slight cut shift = white sliver on the edge. Without safe area, text gets clipped.

Set up your file with bleed from the start in InDesign / Illustrator. Don't try to add bleed after.

### Common sizes (Korean / international)

| Name | Dimensions (mm) | Use |
| --- | --- | --- |
| **Korean 명함 (business card)** | 90 × 50 | Korean business card |
| **International business card** | 85 × 55 | Most Western markets |
| **A4** | 210 × 297 | Letters, brochures |
| **A5** | 148 × 210 | Half-letter, leaflets |
| **A6** | 105 × 148 | Postcards |
| **A3** | 297 × 420 | Posters (small) |
| **A2** | 420 × 594 | Posters (medium) |
| **A1** | 594 × 841 | Posters (large) |
| **A0** | 841 × 1189 | Posters (huge) |
| **DL** | 99 × 210 | Tri-fold envelopes / flyers |

Korean default for most marketing pieces: A4 / A5 / 명함. International default: Letter (216 × 279mm) is rare in Korea.

## Paper: weight, finish, type

### Weight (gsm — grams per square meter)

| gsm | Feel | Use |
| --- | --- | --- |
| 70-90 | Thin, see-through | Inside book pages, drafts |
| 100-120 | Standard letterhead | Stationery |
| 150-180 | Light card | Postcards, leaflets |
| 200-250 | Sturdy card | Quality flyers |
| 300+ | Heavy card | Business cards, premium print |
| 350-400 | Very heavy | Premium business cards, packaging |

Korean business cards typically: **250-300gsm**. Premium: **350gsm** with finish.

### Finish

| Finish | Look | Feel | Use |
| --- | --- | --- | --- |
| Matte / 무광 | No reflection | Soft, premium | Most B2B materials |
| Glossy / 유광 | High reflection | Slick | Brochures with photos |
| Satin / Silk | Mid | Smooth | Magazines |
| Uncoated | None | Natural texture | Letterhead, environmental brands |
| Soft-touch | Velvety | Premium | High-end business cards |
| Linen | Textured | Tactile | Wedding stationery, formal |

Different finishes change perceived brand:
- Matte = professional, calm, premium-modern.
- Glossy = energetic, inexpensive (mass-market), or premium-photo-led.
- Uncoated = environmental, artisanal, raw.
- Soft-touch = luxury, modern.

### Special finishes (premium)

- **Spot UV** — glossy varnish on specific areas (logo). Adds tactile contrast on matte stock.
- **Foil stamp / 박** — metallic gold / silver / copper / holographic. Premium signal.
- **Emboss / 양각** — raised areas (logo). Tactile, classic.
- **Deboss / 음각** — recessed areas. Subtle, modern.
- **Letterpress** — antique-feel impression. Wedding / luxury stationery.
- **Die-cut / 도무송** — custom shapes (rounded corners, unique silhouettes).

Each of these adds significant cost (often 2-5× standard print).

## File preparation checklist

Before sending to print:

- [ ] Color mode: CMYK (not RGB)
- [ ] Resolution: 300 DPI at final size for photos / raster
- [ ] Vector elements stay vector (logos, type)
- [ ] Bleed: 3mm minimum on all sides
- [ ] Safe area: 3-5mm inside trim for text
- [ ] Fonts: outlined OR licensed for embedding
- [ ] Ink coverage: total ≤ 300% (some printers say 280%) — sum of CMYK percentages
- [ ] Black: pure 100% K for small text; rich black (60/40/40/100) only for large fills
- [ ] Spot colors: defined as Pantone, not converted to CMYK silently
- [ ] Final size is correct (Korean 명함 vs international card differ)
- [ ] Crop marks + bleed marks included in PDF export
- [ ] PDF version: PDF/X-1a or PDF/X-4 (printer's spec)
- [ ] File embedded all images (no linked external paths)
- [ ] Spell-check Korean + English (printers don't proofread)
- [ ] Final proof signed off by client (don't print without)

## File formats

| Format | Use |
| --- | --- |
| **PDF/X-1a** | Most reliable for print; flat CMYK |
| **PDF/X-4** | Newer; supports transparency |
| **AI** | Adobe Illustrator native (vector source) |
| **INDD** | InDesign (multi-page documents) |
| **TIFF** | High-quality raster |
| **EPS** | Older vector format; still accepted |

Default for delivery: **PDF/X-1a** with bleed + crop marks. Provide source files (AI / INDD) if requested.

## Color management — ICC profiles

Different printers have different presses with different color characteristics. Match output to the printer's ICC profile:

- **Korean coated paper press**: typically `Japan Color 2001 Coated` or printer-specific profile.
- **US sheet-fed**: `U.S. Web Coated (SWOP) v2`.
- **EU print**: `ISO Coated v2 (ECI)`.

Ask the printer for their preferred profile. Embed it in the PDF export. Without ICC matching, colors shift.

## Cost drivers

Things that increase cost:
- **Quantity** (lower per-unit at high volume; minimum cost at low volume)
- **Color count** (1-color < 4-color CMYK < CMYK + spot)
- **Paper weight + finish** (heavier / specialty stock = more)
- **Special finishes** (foil, spot UV, emboss, die-cut)
- **Double-sided** (~1.4× single-sided, not 2×)
- **Variable data** (each piece personalized — premium digital print)
- **Rush turnaround** (3-day vs 7-day vs 14-day)

For pricing: get quotes from 2-3 Korean printers (충무로, 을지로 area, online platforms like Snaps, Vistaprint Korea).

## Korean print market

- **Major print districts**: 충무로 (specialty / quality), 을지로 (variety / volume), 인천 (large-scale runs).
- **Online services**: Snaps, Bizhows, 컴인쇄, Vistaprint Korea — convenient, mid-quality.
- **Premium**: Designhouse, traditional print shops with letterpress / foil expertise.
- **Standard turnaround**: 3-7 days for standard orders; rush 1-2 days at premium.
- **Minimum orders**: business cards typically 100-200 minimum; flyers / brochures 500-1000 minimum at most printers.

For mass / cheap: online platforms.
For brand-critical (business cards, premium brochures): traditional printer with sample proof.

See [`korean-print-conventions.md`](korean-print-conventions.md) for Korean-specific format and content rules.

## Don't

- Don't design in RGB and convert at the end — colors shift unpredictably. Start in CMYK.
- Don't ignore bleed — the 1mm cut tolerance will leave white slivers.
- Don't use 72 DPI photos for print — they pixelate even at small sizes.
- Don't trust digital preview for color accuracy — get a press proof for brand-critical work.
- Don't use rich black for small text — registration shifts cause colored fringes.
- Don't ship a file with linked images instead of embedded — printer might miss them.
- Don't change the design after the press starts. Re-runs are full price.

## Cross-reference

- [`knowledge/print/stationery.md`](stationery.md) — business cards, letterhead, envelopes
- [`knowledge/print/brochures-and-flyers.md`](brochures-and-flyers.md) — multi-page + folded pieces
- [`knowledge/print/signage-and-posters.md`](signage-and-posters.md) — large format
- [`knowledge/print/packaging.md`](packaging.md) — boxes, labels, dielines
- [`knowledge/print/korean-print-conventions.md`](korean-print-conventions.md) — KR-specific
- [`knowledge/typography/type-scale-fundamentals.md`](../typography/type-scale-fundamentals.md) — typography fundamentals
- [`knowledge/colors/color-theory.md`](../colors/color-theory.md) — color theory
- [`knowledge/patterns/brand-identity.md`](../patterns/brand-identity.md) — brand foundation
