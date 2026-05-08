# print-designer — playbook

Design and spec a print piece. Output is a print-ready spec a designer can deliver to a printer with confidence — sizes, paper, finish, color, bleed, regulatory content, file delivery format.

## When to use

- "Spec a business card for our Korean fintech."
- "Design a tri-fold brochure for the new product."
- "Build a folding carton for our cosmetics line."
- "Create a subway poster spec."
- "What paper / finish should we choose?"

## Inputs (ask if missing)

1. **Piece type** — business card / letterhead / envelope / flyer / brochure / poster / packaging / signage.
2. **Audience** — Korean primary / international primary / mixed.
3. **Tier** — basic / mid / premium / luxury.
4. **Quantity** — affects MOQ + cost.
5. **Budget**.
6. **Special requirements** — regulatory (food / cosmetics), sustainability, brand-critical color (Pantone match).
7. **Existing brand assets** — logo, colors, fonts.
8. **Distribution / use** — retail / mailing / hand-out / OOH.

## Steps

### 1. Pick the right piece

Use the type to select primary knowledge:

| Piece | Read |
| --- | --- |
| Business card / letterhead / envelope | [`stationery.md`](../../knowledge/print/stationery.md) |
| Flyer / leaflet / brochure / booklet | [`brochures-and-flyers.md`](../../knowledge/print/brochures-and-flyers.md) |
| Poster / banner / signage / OOH | [`signage-and-posters.md`](../../knowledge/print/signage-and-posters.md) |
| Box / carton / label / mailer | [`packaging.md`](../../knowledge/print/packaging.md) |

Always also read [`print-fundamentals.md`](../../knowledge/print/print-fundamentals.md). For Korean: [`korean-print-conventions.md`](../../knowledge/print/korean-print-conventions.md).

### 2. Spec dimensions

| Piece | Korean default | International default |
| --- | --- | --- |
| Business card | 90×50mm | 85×55mm |
| Flyer / leaflet | A5 (148×210) | Letter (216×279) |
| Brochure | A4 / A4 tri-fold | Letter |
| Poster | A2 / A1 / A0 | Tabloid / Arch |
| Box | per dieline | per dieline |

Always include bleed: **3mm minimum**. State trim AND bleed dimensions.

### 3. Pick paper / material

For each paper choice, consider:
- **Weight (gsm)** — sets perceived premium.
- **Finish** — matte / glossy / uncoated / soft-touch / linen.
- **Coating** — uncoated / aqueous / UV / lamination.
- **Color** — white / off-white / kraft / colored stock.
- **Sustainability** — FSC / recycled content.

Defaults:
- Business card: 300-350gsm matte coated or uncoated.
- Brochure: 150-200gsm coated.
- Folding carton: 350gsm SBS.
- Mailer: 120-200gsm corrugated E-flute.
- Poster: 150-200gsm coated for indoor; vinyl for outdoor.

### 4. Pick color system

| Need | Use |
| --- | --- |
| Standard 4-color | CMYK |
| Brand-critical accent | CMYK + 1-2 Pantone spots |
| Single-color (1-color) | 1 Pantone or 100K |
| Premium metallic | Foil stamp (gold/silver/copper/holo) |
| Neon / day-glo | Pantone special inks |

State Pantone numbers + CMYK fallback. Don't trust silent conversion.

### 5. Pick finish + special effects

Common combinations:
- **Matte + spot UV on logo** — premium tactile contrast.
- **Soft-touch lamination + emboss / deboss** — luxury feel.
- **Glossy + foil stamp** — vibrant + metallic.
- **Uncoated + letterpress** — artisanal / wedding.

Each special effect adds 20-100% cost. Cap at 1-2 per piece for restraint.

### 6. Typography

Pick fonts that:
- Print clearly (test small sizes).
- Have weights that suit each role (display, body, caption).
- Support all required scripts (KR + EN if bilingual).
- Are licensed for print use (verify, not just web).

Korean default: **Pretendard** for sans (free, modern, multi-lingual). 본명조 for serif. Adobe paid families if budget permits.

Sizing:
- Body 9-11pt; smaller for Korean than Latin.
- Headlines 18-72pt depending on piece.
- Captions 6.5-8pt.

### 7. Regulatory content (if applicable)

- **Food**: KFDA — ingredients, allergens, nutrition, manufacturer, country of origin.
- **Cosmetics**: KFDA — ingredients (Korean INCI), manufacturer, manufacturing license, expiry.
- **Health-functional foods**: KFDA — strict format, approved claims only.
- **Drugs**: KFDA — pre-approved copy, regulated formats.
- **Recycling marks (분리배출 표시)**: required on most consumer packaging.

See [`korean-print-conventions.md`](../../knowledge/print/korean-print-conventions.md) for details.

### 8. File delivery

Required:
- **PDF/X-1a** export (or PDF/X-4 if printer accepts).
- **3mm bleed** + crop marks + bleed marks.
- **Fonts outlined** (or licensed for embedding).
- **All images embedded** (no linked external).
- **CMYK** color mode + Pantone spots defined.
- **ICC profile** matching printer (Japan Color 2001 Coated for KR).
- **Total ink coverage ≤ 300%** (some printers say 280%).

Optional:
- Source AI / INDD files.
- Spec sheet with paper + finish + special-effect details.
- Sign-off press proof.

### 9. Output

Use this structure:

```markdown
# Print spec: <piece name>

> Brand: <...>
> Audience: <KR / international / mixed>
> Tier: <basic / mid / premium / luxury>
> Quantity: <...>

## Specs
| Spec | Value |
... dimensions, paper, finish, color, file format

## Color tokens
<CMYK + Pantone>

## Typography
<fonts, sizes, weights>

## Layout
<panel-by-panel for multi-panel pieces>

## Regulatory checklist (if applicable)

## Cost estimate

## File delivery

## Pre-press checklist

## Press proof approval

## Don't
```

## Source files this skill reads

- [`knowledge/print/print-fundamentals.md`](../../knowledge/print/print-fundamentals.md) — CMYK, bleed, DPI
- [`knowledge/print/stationery.md`](../../knowledge/print/stationery.md) — business cards, letterhead
- [`knowledge/print/brochures-and-flyers.md`](../../knowledge/print/brochures-and-flyers.md) — multi-page
- [`knowledge/print/signage-and-posters.md`](../../knowledge/print/signage-and-posters.md) — large format
- [`knowledge/print/packaging.md`](../../knowledge/print/packaging.md) — boxes, dielines
- [`knowledge/print/korean-print-conventions.md`](../../knowledge/print/korean-print-conventions.md) — KR conventions
- [`knowledge/typography/font-pairings.md`](../../knowledge/typography/font-pairings.md) — Pretendard pairings
- [`knowledge/patterns/brand-identity.md`](../../knowledge/patterns/brand-identity.md) — brand foundation
- [`knowledge/i18n/korean-document-style.md`](../../knowledge/i18n/korean-document-style.md) — Korean voice
- [`examples/print-business-card-spec.md`](../../examples/print-business-card-spec.md) — reference spec
- [`examples/print-packaging-spec.md`](../../examples/print-packaging-spec.md) — reference spec

## Verification phase (run before declaring done)

- [ ] Are dimensions stated AND bleed (3mm min) included?
- [ ] Is color mode CMYK + Pantone explicitly defined (not silent)?
- [ ] Is paper weight + finish specified?
- [ ] Are fonts named with sizes + weights for each role?
- [ ] If regulatory (food / cosmetics): is the regulatory checklist applied?
- [ ] If Korean piece: is 명함 90×50 used (vs international 85×55)?
- [ ] Are recycling marks specified for KR packaging?
- [ ] Is total ink coverage ≤ 300% noted?
- [ ] Is press proof step included for brand-critical color?
- [ ] Does the "Don't" section catch 2-3 specific misuses?

## Done when

- One markdown spec.
- Dimensions + bleed + safe area.
- Paper + finish + special effects.
- Color (CMYK + Pantone).
- Typography.
- Layout (per panel for multi-panel pieces).
- Regulatory checklist if applicable.
- Cost estimate.
- File delivery format.
- Pre-press checklist.
- Press proof step.
- "Don't" section.
- Verification passes.
