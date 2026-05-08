<!-- hand-written -->
# Print spec: folding carton (Korean cosmetics, mid-tier)

> Worked example: spec for a Korean skincare brand's primary product carton. Covers dieline, regulatory content, color, finish, sustainability, and Korean labeling. Pairs with [`knowledge/print/packaging.md`](../knowledge/print/packaging.md) and [`knowledge/print/korean-print-conventions.md`](../knowledge/print/korean-print-conventions.md).

## Brief

- **Product**: 50ml moisturizer in glass jar, secondary carton
- **Brand**: Reun (가상의 한국 화장품 브랜드)
- **Tier**: Mid-premium (clean beauty, eco-aware audience)
- **Channel**: Korean online (Olive Young, Coupang) + retail (boutique stores)
- **Audience**: KR primary; some EN secondary copy for export potential
- **Volume**: 10,000 cartons initial run
- **Sustainability**: FSC-certified board, soy ink

## Specs

| Spec | Value |
| --- | --- |
| **Style** | Tuck-end folding carton (TT — top-tuck-bottom-tuck) |
| **Size** | 70mm × 70mm × 80mm (W×D×H) |
| **Material** | 350gsm SBS (solid bleached sulfate), FSC-certified |
| **Inside coat** | None (uncoated interior) |
| **Color** | CMYK + 1 spot Pantone (brand color) |
| **Finish** | Matte aqueous coating |
| **Special** | Spot UV on logo (front panel only); deboss on brand wordmark |
| **Inks** | Soy-based |
| **File** | PDF/X-1a, fonts outlined, dieline on separate non-printing layer |

### Color tokens

```
--brand-primary:       PANTONE 5807 C  (sage green)
--brand-text:          90% K
--brand-meta:          60% K (regulatory text)
--accent:              PANTONE warm gray 5 C (very subtle accent line)
```

### Dieline

```
                        Top tuck
                ┌──────────────────────┐
                │                      │
                │      TOP PANEL       │
                │      70 × 70mm       │
                │                      │
                ├───────────┬──────────┤
        ─ ─ ─ ─ │           │          │ ─ ─ ─ ─
                │           │          │
        Side    │   FRONT   │   RIGHT  │   Side
        panel   │  70 × 80  │  70 × 80 │   panel
        70×80   │           │          │   70×80
                │   PANEL   │   PANEL  │
        ─ ─ ─ ─ │           │          │ ─ ─ ─ ─
                ├───────────┴──────────┤
                │                      │
                │     BOTTOM PANEL     │
                │     70 × 70mm        │
                │                      │
                └──────────────────────┘
                       Bottom tuck

Lay flat with glue tab on outside-right; folds in.
Dotted lines = creases. Solid = cuts.
```

Total flat dimensions including bleed: ~330mm × 240mm.

## Panel content

### Front panel — brand-defining

```
┌─────────────────────────────┐
│                             │
│        ▣ REUN                │  ← logo, deboss + spot UV
│                             │     (top center, 30mm)
│                             │
│                             │
│      Calming Moisturizer    │  ← product name, 11pt
│      카밍 모이스처라이저        │  ← 10pt KR
│                             │
│                             │
│           50ml              │  ← net contents, 9pt 600
│                             │
└─────────────────────────────┘
```

### Right panel (and Left, symmetric) — story

```
┌─────────────────────────────┐
│                             │
│  센텔라와 약쑥이 진정시키는      │  ← KR copy, 8.5pt
│  데일리 수분 크림.             │
│                             │
│  Centella + mugwort calm    │  ← EN secondary, 8pt
│  irritated skin.            │
│                             │
│  • 7가지 식물 추출물            │  ← bullet feature list
│  • 무향료, 무알코올              │
│  • 비건 인증                   │
│                             │
└─────────────────────────────┘
```

### Back panel — regulatory + ingredient

KFDA-compliant cosmetics labeling:

```
┌─────────────────────────────┐
│ 화장품의 명칭                  │  ← 6.5pt headers
│ Calming Moisturizer          │
│                             │
│ 내용량 50ml                   │
│                             │
│ 제조판매업자                   │
│ (주)르운, 서울시 강남구 ...      │
│ 화장품 제조업 신고 제2024-...호  │
│                             │
│ 사용기한: 박스 측면 표기         │
│ (개봉 후 12개월)                │
│                             │
│ 전성분                        │
│ 정제수, 글리세린, 센텔라아시아티카  │  ← 6pt; all listed
│ 추출물, 인삼뿌리추출물,          │
│ 베타글루칸, 히알루론산, ...        │
│                             │
│ 사용 시 주의사항                │
│ 1. 화장품을 사용하여 다음과       │  ← KFDA-mandated text
│ 같은 이상이 있는 경우에는 ...      │
│                             │
│ 소비자 상담실 080-1234-5678     │
│                             │
│ 원산지: 한국                  │
│                             │
│ ┌─┐ ┌─┐  분리배출 표시:        │  ← recycling marks
│ │종│ │플│  종이/플라스틱           │     mandatory
│ └─┘ └─┘                      │
│                             │
│ [barcode 1.5cm × 3cm]       │
└─────────────────────────────┘
```

### Top panel — utility

```
┌─────────────────────────────┐
│                             │
│         ▣ REUN               │  ← small logo
│   Calming Moisturizer       │
│                             │
└─────────────────────────────┘
```

### Bottom panel

```
┌─────────────────────────────┐
│                             │
│  제조번호 / Lot:               │  ← will be ink-jet printed
│  사용기한 / Best by:           │     by manufacturer at fill
│                             │
│  Made in Korea              │
│                             │
└─────────────────────────────┘
```

## Regulatory checklist (Korean cosmetics)

- [x] **화장품의 명칭** (product name in Korean)
- [x] **내용량** (net contents) prominent
- [x] **제조판매업자** (manufacturer/distributor name + address)
- [x] **화장품 제조업 신고번호** (manufacturing license)
- [x] **사용기한 / 개봉 후 사용기간** (use-by or PAO)
- [x] **전성분** (full ingredients in INCI Korean naming)
- [x] **사용 시 주의사항** (KFDA-mandated standard text)
- [x] **소비자 상담실** (customer service phone)
- [x] **원산지** (country of origin)
- [x] **분리배출 표시** (recycling marks for paper + any plastic component)
- [x] **바코드** (barcode for retail)

## Sustainability + ESG callouts

Visible on packaging:
- **FSC certification mark** (small, on bottom panel or near recycling marks).
- **"100% recycled paperboard"** if applicable; for this case using FSC virgin fiber.
- **"Soy-based ink"** mentioned on product website + occasionally on packaging back.
- **No plastic window** — full opaque carton.

## Production rationale

| Decision | Why |
| --- | --- |
| Tuck-end folding carton | Standard, cost-effective for cosmetics |
| 350gsm SBS, FSC-certified | Premium feel + eco-aware audience |
| Matte aqueous coating | Soft, premium look without plastic-feel of UV varnish |
| Spot UV on logo only | Tactile signal; subtle |
| Deboss wordmark | Premium tactile detail |
| Soy ink | Aligns with eco brand voice |
| Pantone 5807 C (sage) | Brand consistency across runs; CMYK fallback for less critical surfaces |
| KR primary, EN secondary | Domestic primary audience; export-ready secondary |

## Cost estimate

| Item | Per unit (KRW) |
| --- | --- |
| 350gsm SBS, CMYK + 1 spot, matte aqueous, spot UV, deboss | 280-350 KRW |
| 10,000 unit run | 2,800,000-3,500,000 KRW |
| Dieline + setup (one-time) | 200,000-400,000 KRW |
| Press proof | 50,000 KRW |
| **Total initial run** | ~3,000,000-3,900,000 KRW |

For high-volume reorders (50,000+), per-unit drops to ~180-220 KRW.

## File delivery

1. **PDF/X-1a** with:
   - Dieline on separate non-printing layer (named `dieline`)
   - All artwork on print layers
   - 3mm bleed
   - Crop marks + dieline output marks
   - Fonts outlined
   - All images 300 DPI at final size, embedded
   - CMYK color + Pantone 5807 C as spot
   - ICC: Japan Color 2001 Coated
2. **Source files**: AI master + INDD if used; layered PSD for any photographic elements
3. **Spec sheet** (this document)
4. **Press proof** required before bulk run

## Pre-press checklist

- [ ] Dieline on separate layer, set non-printing
- [ ] Color mode: CMYK + Pantone 5807 C as spot
- [ ] Pantone color defined as spot (not silently converted)
- [ ] All fonts outlined
- [ ] All images embedded, 300+ DPI
- [ ] Bleed: 3mm all sides
- [ ] No critical content within 5mm of cut/fold lines
- [ ] All regulatory content present (checklist above)
- [ ] Recycling marks at minimum 8mm × 8mm
- [ ] Barcode scannable (test with phone)
- [ ] Total ink coverage: ≤ 280%
- [ ] Black: 100K for body, no rich black for small text
- [ ] Korean copy proofread by native speaker
- [ ] Korean regulatory text matches KFDA template exactly
- [ ] Spell check KR + EN

## Press proof approval

- [ ] Color matches Pantone 5807 C (visually + by colorimeter if available)
- [ ] Spot UV positioned correctly (only on logo)
- [ ] Deboss depth feels premium (not too shallow)
- [ ] Matte coating uniform (no streaks)
- [ ] Trim and crease lines clean
- [ ] Box folds correctly without breaking print
- [ ] Inside (uncoated) doesn't show through to outside
- [ ] Recycling marks legible

## Common things that go wrong

- **Sage green prints muddy** — Pantone match critical; press proof + sign-off mandatory.
- **Crease lines crack the print** — too-thick coating + sharp creases. Solution: ask printer to use scoring rule that pre-conditions paper.
- **Deboss feels weak** — depth too shallow. Specify minimum impression depth.
- **Regulatory text 6pt is too small to read at retail** — push to 7pt minimum where possible while staying within total panel content limits.
- **Korean ingredient list mistranslated** — INCI naming has standard Korean translations; use KFDA-approved table.

## Don't

- Don't skip the dieline. Designing without one means wrong fold positions.
- Don't put critical content within 5mm of cut or crease lines.
- Don't use rich black for ingredient text — registration shifts cause unreadable fringes.
- Don't approve a digital proof for color-critical packaging. Press proof is mandatory.
- Don't shrink regulatory text below KFDA minimum (typically 6pt for ingredients on small packages).
- Don't skip recycling marks. KFDA / Ministry of Environment can require recall.

## Cross-reference

- [`knowledge/print/print-fundamentals.md`](../knowledge/print/print-fundamentals.md) — CMYK, bleed, DPI
- [`knowledge/print/packaging.md`](../knowledge/print/packaging.md) — packaging fundamentals
- [`knowledge/print/korean-print-conventions.md`](../knowledge/print/korean-print-conventions.md) — KR regulatory
- [`knowledge/patterns/brand-identity.md`](../knowledge/patterns/brand-identity.md) — brand foundation
- [`knowledge/i18n/korean-document-style.md`](../knowledge/i18n/korean-document-style.md) — Korean voice
