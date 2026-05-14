<!-- hand-written -->
# Print spec: business card (Korean 명함, premium tier)

> Worked example: spec for a Korean fintech startup's business card. Covers dimensions, paper, finish, color, typography, file delivery. Pairs with [`knowledge/print/stationery.md`](../knowledge/print/stationery.md) and [`knowledge/print/korean-print-conventions.md`](../knowledge/print/korean-print-conventions.md).

## Brief

- **Brand**: Aera (가상의 한국 핀테크 스타트업)
- **Audience**: Korean B2B (banks, partners), occasional international
- **Tier**: Premium (founder + senior staff cards)
- **Quantity**: 200 per person, 5 people
- **Budget**: 200,000 KRW total budget for 1000 cards

## Specs

| Spec | Value |
| --- | --- |
| **Size** | 90mm × 50mm (Korean 명함 standard) |
| **Bleed** | 3mm all sides → working size 96mm × 56mm |
| **Safe area** | 5mm inside trim → 80mm × 40mm |
| **Sides** | Double-sided (앞면 한국어, 뒷면 영어) |
| **Color mode** | CMYK + 1 spot Pantone (brand color) |
| **Paper** | 350gsm uncoated white card |
| **Finish** | Soft-touch lamination (front + back) |
| **Special** | Spot UV on logo (front only) |
| **File format** | PDF/X-1a, fonts outlined, 3mm bleed, crop marks |

### Color tokens used

```
--brand-primary:    PANTONE 2728 C  (CMYK 100/72/0/0 fallback)
--brand-text:       100% K (pure black)
--brand-meta:       80% K (dark gray for secondary)
```

No other colors. Brand discipline.

### Typography

| Element | Font | Size | Weight | Color |
| --- | --- | --- | --- | --- |
| 이름 (KR) | Pretendard | 11pt | 700 (Bold) | 100K |
| Name (EN) | Pretendard | 10pt | 700 | 100K |
| 직책 (KR) | Pretendard | 8.5pt | 500 | 80K |
| Title (EN) | Pretendard | 8pt | 500 | 80K |
| 회사 / Company | Pretendard | 8.5pt | 600 | Brand-primary |
| Contact info | Pretendard | 7.5pt | 400 | 80K |

Pretendard handles both Korean + English at the same size — no font-pair complexity.

## Layout

### Front (Korean primary)

```
┌─────────────────────────────────────┐
│                                     │
│  ▣ AERA                              │  ← logo, top-left, 14mm wide
│                                     │     spot UV applied here only
│                                     │
│                                     │
│  김철수                                │  ← 11pt 700
│  대표 / CEO                           │  ← 8.5pt 500
│                                     │
│  ─────                               │  ← 0.5pt rule, brand-primary
│                                     │
│  Aera Inc.                          │  ← 8.5pt 600
│  010-1234-5678                      │  ← 7.5pt
│  cheolsu@aera.kr                    │
│  서울시 강남구 테헤란로 ...             │
│                                     │
└─────────────────────────────────────┘
```

### Back (English mirror)

```
┌─────────────────────────────────────┐
│                                     │
│  ▣ AERA                              │
│                                     │
│                                     │
│                                     │
│  Cheolsu Kim                         │
│  CEO                                 │
│                                     │
│  ─────                               │
│                                     │
│  Aera Inc.                          │
│  +82 10 1234 5678                    │
│  cheolsu@aera.kr                    │
│  Tehran-ro, Gangnam, Seoul          │
│                                     │
└─────────────────────────────────────┘
```

Back follows same grid; symmetric, brand-feeling consistent.

## Production rationale

| Decision | Why |
| --- | --- |
| 90×50 (KR size) | Primary audience is Korean; KR wallets fit this size cleanly |
| 350gsm uncoated | Premium tactile feel without going luxury |
| Soft-touch lamination | Velvety, premium-modern feel; protects against finger oils |
| Spot UV on logo only | Tactile contrast (matte field + glossy logo); subtle premium signal |
| Pantone + CMYK | Pantone for brand-color consistency across runs; CMYK for everything else |
| Pretendard | Open-source, free commercial use, handles KR+EN, modern feel |
| Same font for KR and EN | Visual cohesion; avoids font-pairing complexity |
| Bilingual (KR front, EN back) | Primary audience KR; international fallback EN; not crammed onto one side |

## Cost estimate

| Item | KRW |
| --- | --- |
| 1000 cards, 350gsm uncoated, soft-touch + spot UV | 150,000-180,000 |
| Press proof (1 card, color check) | 10,000-20,000 |
| Total | 160,000-200,000 |

Within budget.

## Delivery

1. **Final PDF/X-1a** with:
   - 3mm bleed
   - Crop marks
   - Bleed marks
   - Fonts outlined
   - All images embedded
   - CMYK + Pantone 2728 C as spot
   - ICC profile: Japan Color 2001 Coated
2. **Source AI file** (Adobe Illustrator native) for printer's reference
3. **Spec sheet** (this document) included with delivery
4. **Press proof approval** required before bulk run

## Pre-press checklist

- [ ] Color mode: CMYK + 1 spot Pantone defined
- [ ] All RGB removed from artwork
- [ ] Pantone 2728 C defined as spot color (not converted to CMYK silently)
- [ ] All fonts outlined
- [ ] All images 300+ DPI at print size
- [ ] All images embedded (no linked external files)
- [ ] Bleed: 3mm all sides
- [ ] Crop marks + bleed marks visible in export
- [ ] Safe area: critical content stays 5mm inside trim
- [ ] Total ink coverage: ≤ 280%
- [ ] Black: pure 100K for body text (not rich black)
- [ ] PDF/X-1a export with embedded ICC
- [ ] Spell check: KR + EN
- [ ] Layout check at 100% size and 200% zoom
- [ ] Test print on 350gsm paper (home printer or quick-print) for layout sanity check

## Press proof approval

Before approving the press proof:

- [ ] Color matches brand spec (Pantone 2728 C visually correct)
- [ ] Type is crisp; no fuzzy edges
- [ ] Spot UV is correctly positioned (only on logo)
- [ ] Soft-touch finish feels right
- [ ] Trim is precise; no white edges from cut tolerance
- [ ] Both sides align (symmetric layout)
- [ ] No printing artifacts (banding, ink spread)

Sign-off in writing only after all of the above.

## Accessibility note for digital proofing

The printed card itself has no keyboard focus behavior, but the approval workflow still does. The PDF proof review page must keep the approve / request changes controls keyboard reachable, show a visible 2px focus ring with at least 3:1 contrast, and preserve logical tab order from front preview → back preview → approval actions.

Digital proof preview should be responsive across mobile and desktop review contexts, because founders often approve proofs from phones while printers inspect them on desktop. Screen reader labels must identify "front side", "back side", and "request changes" actions so non-visual approval is not blocked.

## What can go wrong

- **Pantone mismatch** — spot color prints duller than expected. Solution: press proof before bulk; brand QC sign-off.
- **Soft-touch wears unevenly** — cheap soft-touch films flake. Solution: specify quality lamination film grade.
- **Spot UV registration off** — UV varnish slightly offset from logo edge. Solution: tight specification of UV registration tolerance.
- **Cut crops content** — content too close to safe area. Solution: keep critical content 5mm inside trim minimum.

## Reorder considerations

This spec is good for 12-18 months. Reorder triggers:
- Personnel changes (anyone leaves, gets promoted, role changes).
- Address change.
- Brand color update.
- Logo update.

Reorders should match the original spec exactly. Don't make small "improvements" on each reorder — fragments the brand.

## Don't

- Don't switch to international 85×55mm size to "save cost" — the savings are minimal and KR audiences notice.
- Don't add personal social handles (Twitter, Instagram) on B2B cards. Phone + email is enough.
- Don't use 9pt or smaller for Korean primary copy — Hangul becomes hard to read at small sizes.
- Don't print without press proof for premium tier — color shifts can be visible.
- Don't use rich black (60/40/40/100) for body text — registration shifts cause colored edges. Pure 100K only.

## Cross-reference

- [`knowledge/print/print-fundamentals.md`](../knowledge/print/print-fundamentals.md) — CMYK, bleed, DPI
- [`knowledge/print/stationery.md`](../knowledge/print/stationery.md) — full stationery system
- [`knowledge/print/korean-print-conventions.md`](../knowledge/print/korean-print-conventions.md) — KR specifics
- [`knowledge/typography/font-pairings.md`](../knowledge/typography/font-pairings.md) — Pretendard pairings
- [`knowledge/patterns/brand-identity.md`](../knowledge/patterns/brand-identity.md) — brand foundation
