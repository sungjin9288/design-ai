<!-- hand-written -->
---
title: Korean print conventions (regulations, formats, market)
applies_to: [print, korean, regulations, kr-market]
---

# Korean print conventions

Korean print has specific format standards, regulatory requirements, and market conventions that differ from Western/international defaults. This file documents what's specific to Korea.

Read [`print-fundamentals.md`](print-fundamentals.md) first.

## Standard sizes

Korea uses ISO A/B series + a few local conventions:

| Name | Size (mm) | Korean term | Use |
| --- | --- | --- | --- |
| 명함 | 90 × 50 | 명함 | Business card (KR-specific; bigger than international 85×55) |
| A4 | 210 × 297 | A4 | Letter, brochure, document |
| A5 | 148 × 210 | A5 | Half-letter, leaflet |
| A6 | 105 × 148 | A6 | Postcard |
| A3 | 297 × 420 | A3 | Small poster |
| A2 | 420 × 594 | A2 | Medium poster |
| A1 | 594 × 841 | A1 | Large poster |
| A0 | 841 × 1189 | A0 | Hero poster |
| B5 | 176 × 250 | B5 | Booklet (slightly smaller than A4) |
| B4 | 250 × 353 | B4 | Magazine spread |
| 국전지 | 636 × 939 | 국전지 | KR poster size, larger |
| 4x6 | 102 × 152 | 4x6 / 인화지 | Photo print |

**Korean business card 명함 is 90×50mm** — slightly larger than international 85×55. Western cards stick out of Korean wallets. Use Korean size for Korean primary audiences.

## File preparation conventions

### Color

- **CMYK** mandatory for offset / large run print.
- **Spot color (Pantone)** for brand-critical pieces.
- **Korean ICC profile**: most KR printers use **Japan Color 2001 Coated** or printer-specific profile.

### Resolution

- **300 DPI** at print size for photos / raster — same as international.
- **600 DPI** for line art / dense text — for sharpest character rendering of small Hangul.

Hangul characters are dense; small Hangul at low DPI looks fuzzy faster than Latin.

### File format

- **PDF/X-1a** is standard.
- Some KR printers also accept **AI / INDD** native files.
- Avoid: PSD without rasterization plan, Word documents (will reformat on printer's machine).

### Bleed

- **3mm minimum** (Korean standard, slightly less than US 1/8" / 3.175mm).
- Crop marks + bleed marks in PDF export.

## Korean typography for print

### Recommended fonts

| Font | Use | License |
| --- | --- | --- |
| **Pretendard** | Default modern UI/print | Open-source (free commercial) |
| **본명조 (BonMyeongjo)** | Premium serif | Open-source |
| **나눔스퀘어 (NanumSquare)** | Display, signage | Open-source |
| **나눔명조 (NanumMyeongjo)** | Body, classic | Open-source |
| **Spoqa Han Sans Neo** | Sans-serif body | Open-source |
| **Apple SD Gothic Neo** | Premium / Apple-aligned | Apple license (limit) |
| **SM 신신명조 / SM 견출명조** | Premium typography | Paid (SM 폰트) |
| **윤서체 시리즈** | Premium typography | Paid (윤디자인) |

Default modern: **Pretendard for sans**, **본명조 / NanumMyeongjo for serif**.

### Sizing for print

Hangul reads slightly larger than Latin at the same point size. Adjustments:

| Use | Latin | Korean |
| --- | --- | --- |
| Body in book | 11pt | 10-10.5pt |
| Brochure body | 9-10pt | 8.5-9.5pt |
| Caption | 7-8pt | 7pt |
| Business card text | 7-9pt | 7-8.5pt |

Don't go below 6pt for Korean. Hangul strokes get muddy.

### Line height (행간)

Korean needs more leading than Latin:

| Use | Latin (px) | Korean (px) |
| --- | --- | --- |
| Body 11pt | 1.4-1.5 line height | 1.6-1.8 |
| Headline | 1.2 | 1.3-1.4 |

Reason: Hangul has more visual density per line; tight leading feels cramped.

### Mixed Korean + English

Body text in mixed languages:
- Pretendard handles both at the same size.
- Adobe Source Han Sans (a.k.a. Noto Sans CJK) handles both.
- Mixing two fonts (Korean font + Latin font) requires careful x-height matching.

For headlines: pick a single CJK font that has both Korean and Latin glyphs.

### Word break / line break

Korean breaks differently from Latin:
- Korean breaks at any character boundary (not word).
- Don't break in middle of common compound words (회사명, 제품명).
- Hyphens (`-`) in Korean text feel awkward; use ellipsis or restart line.
- For long English words mixed with Korean: ensure the English word doesn't break Korean visual rhythm.

## Regulatory requirements

### Food packaging (식품 포장)

KFDA regulations specify:
- **Ingredients (원재료명)** in descending weight order.
- **Allergens (알레르기 유발 물질)** bolded or boxed; list of regulated allergens.
- **Net contents (내용량)** prominent — minimum size regulated.
- **Best-before (유통기한)** format: YYYY-MM-DD or YYYY.MM.DD.
- **Country of origin (원산지)**.
- **Manufacturer (제조원) and distributor (판매원)**.
- **Storage (보관 방법)**.
- **Nutrition facts (영양 성분)** in regulated table format for many categories.
- **Customer service (소비자 상담실)** phone.

Minimum font sizes are regulated. Submit packaging design to KFDA-registered consultant or printer with KR regulatory expertise.

### Cosmetics (화장품)

- All ingredients listed (INCI names + Korean).
- **Manufacturer (제조판매업자)** registered name.
- **Use-by / 사용기한** OR **Period after opening / 개봉 후 사용기간** (PAO icon).
- **Manufacturer license number (화장품 제조업 신고)**.
- **Net contents**.
- Marketing claims require pre-approval if making functional claims.

### Supplements / health-functional foods (건강기능식품)

- **건강기능식품 mark** (KFDA-issued icon).
- All claims pre-approved.
- Strict label format.

### Drug labeling (의약품)

- KFDA-controlled.
- All copy approved before printing.
- Specific font sizes, colors, formats.

### Recycling marks (분리배출 표시)

**Required on most packaging**. The mark is a regulated icon system:

| Material | Mark |
| --- | --- |
| Paper | 종이 |
| Plastic | 플라스틱 + 분류 (PE, PP, PET, PS, PVC, OTHER) |
| Vinyl | 비닐 |
| Can | 캔 (철 / 알미늄) |
| Glass | 유리 |
| Mixed material | 다중 |

Each mark has specific dimensions (minimum 8mm × 8mm typical) + Korean text.

Must be on the package itself (not just on a sticker). Government can fine for missing or incorrect marks.

### Advertising regulations

For 전단지 / marketing flyers:
- **Health/medical claims**: only approved language.
- **Financial product advertising**: must include risk warnings (정보통신망법 / 자본시장법).
- **Children's products**: stricter rules on imagery + claims.
- **Food**: no false health claims.

### Spam law (정보통신망법)

Marketing print materials don't fall under spam law (which is about emails/SMS), but if your print piece directs to digital marketing (QR → marketing list), the digital marketing must comply. See [`knowledge/patterns/email-design.md`](../patterns/email-design.md).

## Korean print market

### Print districts (Seoul)

- **충무로** — historic specialty print district. Premium quality, traditional finishes (letterpress, foil), proofing services.
- **을지로** — high-volume offset, specialty paper, mid-tier quality.
- **인천 (Incheon)** — large-scale offset runs, packaging, corrugated.
- **파주 (Paju)** — book printing concentration.

For small runs / online: **Snaps, Bizhows, 컴인쇄, Vistaprint Korea** — convenient, mid-quality, fast turnaround.

For brand-critical: traditional 충무로 / 을지로 printer with sample proof.

### Typical lead times

| Job | Lead time |
| --- | --- |
| Online business cards (Snaps, Bizhows) | 2-5 days |
| Premium business cards (충무로) | 5-10 days |
| Standard A5 flyers (online) | 3-7 days |
| Premium brochures | 7-14 days |
| Folding cartons (low volume) | 14-21 days |
| Folding cartons (high volume) | 30-45 days |
| Subway / OOH posters | 7-14 days from approval |
| Trade show backdrop | 5-10 days |

Add 5-10 days for revisions / proof rounds.

### Minimum order quantities

| Job | Typical MOQ |
| --- | --- |
| Business cards | 100-200 |
| Letterhead / envelopes | 500-1000 |
| A5 flyers | 500-1000 |
| Brochures | 500-1000 |
| Folding cartons | 1000-3000 |
| Custom shipping boxes | 1000+ |

Below MOQ: digital print (per-unit price 2-5× higher) or pay setup penalty for offset.

## Cost benchmarks (rough, 2024-2025 KRW)

Highly variable; benchmarks for budgeting:

| Job | Typical cost |
| --- | --- |
| 100 business cards (4-color, 300gsm) | 15,000-40,000 KRW |
| 100 premium cards (foil + soft-touch) | 80,000-200,000 KRW |
| 1000 A5 flyers (4-color) | 80,000-150,000 KRW |
| 1000 tri-fold A4 brochures | 200,000-400,000 KRW |
| 1000 folding cartons (cosmetics-tier) | 500,000-1,500,000 KRW |
| Subway B3 poster (3-day post) | 200,000-400,000 KRW per panel |

Get 2-3 quotes; pricing varies a lot.

## Korean print quality expectations

- **Color accuracy**: high. Korean clients notice color shifts.
- **Trim accuracy**: high. ±0.5mm tolerance is preferred (not just ±1mm).
- **Paper quality**: clients can spot cheap paper.
- **Finish quality**: foil shouldn't smudge; lamination shouldn't bubble.
- **On-time delivery**: critical. Late delivery = damaged relationship.

For premium brand work: pay for premium printer. Cost difference is real but reputational risk of cheap-looking print is bigger.

## Common Korean print mistakes (foreigners / non-KR-experienced designers)

- **Wrong business card size** (using 85×55 instead of 90×50).
- **Hangul too small** (using Latin point sizes for Korean).
- **Tight leading on Korean text** (uses Latin leading; reads cramped).
- **Wrong recycling marks** (or missing them).
- **English-first regulatory text** (Korean must be primary on KR-distributed packaging).
- **Wrong honorific level** in formal letters (using 해요체 where 합쇼체 expected).
- **Wrong date format** (using MM/DD/YYYY instead of YYYY.MM.DD or YYYY-MM-DD).

## Don't

- Don't use international business card size for Korean primary audiences. Wallets have specific 명함 pockets sized 90×50.
- Don't apply Latin typography rules to Korean. Leading, sizing, line breaks differ.
- Don't skip recycling marks. Government enforces.
- Don't translate marketing copy at the last minute. Korean expansion breaks layout.
- Don't ignore ICC profile differences. Korean coated press differs from US/EU presses.
- Don't go to a no-name print shop for brand-critical work. Vet the printer.
- Don't print regulatory content in 4-point type to fit. KFDA / KATS will reject.

## Cross-reference

- [`knowledge/print/print-fundamentals.md`](print-fundamentals.md) — CMYK, bleed, DPI
- [`knowledge/print/stationery.md`](stationery.md) — business cards
- [`knowledge/print/brochures-and-flyers.md`](brochures-and-flyers.md) — multi-page
- [`knowledge/print/signage-and-posters.md`](signage-and-posters.md) — large format
- [`knowledge/print/packaging.md`](packaging.md) — packaging regulatory
- [`knowledge/i18n/korean-typography.md`](../i18n/korean-typography.md) — Hangul typography
- [`knowledge/i18n/korean-document-style.md`](../i18n/korean-document-style.md) — honorific level
- [`knowledge/i18n/korean-app-store-visual.md`](../i18n/korean-app-store-visual.md) — visual conventions
- [`knowledge/typography/font-pairings.md`](../typography/font-pairings.md) — font pairings
