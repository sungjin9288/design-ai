<!-- hand-written -->
---
title: Packaging design (boxes, labels, dielines)
applies_to: [print, packaging, label, dieline]
---

# Packaging

Packaging is the most physically intimate brand surface. Customers hold it, open it, sometimes keep it. Get it right and it becomes a brand asset; get it wrong and it's instant garbage.

Read [`print-fundamentals.md`](print-fundamentals.md) first.

## Categories

| Type | Use |
| --- | --- |
| **Folding cartons** | Cosmetics, electronics, food, supplements |
| **Rigid / setup boxes** | Premium products (luxury, gifts) |
| **Corrugated mailers** | Shipping boxes (especially DTC ecommerce) |
| **Pouches / sachets** | Food, beauty samples |
| **Labels (peel-and-stick)** | Bottles, jars, anything cylindrical |
| **Tags / hangtags** | Apparel, accessories |
| **Sleeves / wraps** | Coffee cups, tissue, secondary packaging |

This file focuses on **folding cartons, mailers, and labels** — the most common.

## Dieline — the single most important file

A **dieline** is a vector template showing where the cardboard will be cut, folded, and glued. It's the printer's instruction sheet.

```
                ↓ trim line (cut)
    ─────────────────────────────
     │            │            │
     │   Top      │   Right    │   ─── fold line
     │            │            │
     ─────────────────────────────
     │   Left     │   Front    │   Right    │   Back
     │   panel    │   panel    │   panel    │   panel
     │            │            │            │
     ─────────────────────────────
     │            │            │
     │   Bottom   │   (glue tab)             ─── crease + glue
     │            │            │
     ─────────────────────────────
```

Each line type:
- **Solid line** = cut.
- **Dashed line** = fold (crease).
- **Dotted line** = perforation (tear-away).
- **Tinted area** = glue tab.

### Getting a dieline

1. **From the printer** — most carton printers provide standard dielines for common box sizes. Ask for the dieline for your spec.
2. **From your structural designer** — for custom boxes, a structural designer creates the dieline.
3. **DIY** — only for very simple boxes. Use Esko ArtiosCAD or Adobe Illustrator with manual measurements. Test with paper mockup before committing.

### Working with the dieline

- Place dieline on its own layer in Illustrator / InDesign.
- **Don't move it**. The cut/fold positions are sacred.
- Set dieline layer to non-printing.
- Design panels respecting the cut/fold lines + bleed (3-5mm beyond cut).
- Critical content stays inside the safe area (5mm inside cut).

## Folding carton design

### Anatomy of a typical carton

```
┌──────────────────────────────────┐
│                                  │
│         FRONT PANEL              │   ← brand-defining; biggest visual
│         (logo + product name +   │
│          hero image / claim)     │
│                                  │
└──────────────────────────────────┘

LEFT  TOP                    RIGHT  BOTTOM  BACK
side  panel  ↓  Fold lines  ↓side   panel  panel
panel (close)              panel    (close) (info)
                                              ▾
                          ┌──────────────────┐
                          │ Ingredients      │
                          │ Manufacturer     │
                          │ Barcode          │
                          │ Net contents     │
                          │ Country of origin│
                          │ ...              │
                          └──────────────────┘
```

### Front panel — brand-defining

The most-photographed panel. Carries:
- **Logo** (top, centered or anchored)
- **Product name** (under logo or featured)
- **Variety / flavor / variant** ("Vanilla", "Sensitive Skin", etc.)
- **Hero image** OR illustration OR graphic
- **Net weight / volume** (regulatory + decision-making)

Compose for shelf impact. Test: stand 2m back. Can you read the product name?

### Side panels — narrative

Often product story, ingredients, or brand voice. Less critical but still designed.

### Back panel — regulatory + dense info

Most regulatory content lives here:
- **Ingredients list / 성분** (regulated order, regulated font size)
- **Manufacturer info** (legal requirement)
- **Net weight / 내용량**
- **Country of origin / 원산지**
- **Barcode** (with white quiet zone)
- **Best-before / 유통기한**
- **Lot number / 제조번호** (printed at fill, not at design)
- **Caution warnings**
- **Recycling marks**
- **Customer service contact**

In Korea: regulatory content is **specified by KFDA / KATS** depending on category (food, cosmetics, supplements). See [`korean-print-conventions.md`](korean-print-conventions.md) for KR-specific labeling.

### Top panel — product preview

Often an icon, simplified visual, or short product name. Visible when the box is on a shelf with similar boxes.

### Bottom panel — utility

Often the barcode + lot/best-before, hidden from primary view.

## Labels (bottles, jars, tubes)

### Categories

- **Front label** — primary brand surface
- **Back label** — regulatory info
- **Neck label** — premium accent (wines, premium products)
- **Top sticker** — simple identifier

### Material

- **Paper labels** — matte / glossy / textured. Cheaper, may water-damage.
- **Vinyl labels** — waterproof; for shower / bathroom products.
- **Metallic / foil labels** — premium look.
- **Clear (no-label look)** — premium minimalism (clear vinyl, transparent print).

### Curvature

Labels wrap around cylinders. The wrap distorts the design as it bends. Consider:
- **Center-aligned content** wraps cleanly.
- **Edge content** distorts on cylinder seams.
- **Hero image position**: typically front-and-center, not seam.

For tight cylinders (lipstick, small tubes): every angle of the label is visible at once. For large cylinders (water bottle, jar): one face dominates.

## Mailer / shipping box

For DTC ecommerce:

| Element | Use |
| --- | --- |
| **Outside** | Brand visible? Or stealth? Affects packaging cost + brand experience. |
| **Inside print** | Premium "unboxing" — branded interior delights customers. |
| **Tape** | Branded tape adds polish. |
| **Sticker / seal** | "Thank you" sticker on inner package. |
| **Insert card** | Welcome / how-to / discount for next purchase. |
| **Tissue / wrap** | Premium feel. |

Korean DTC trends 2024+:
- **Inside-printed mailers** — outside neutral / branded; inside surprises with bold color or art.
- **Eco messaging** — "100% recycled cardboard" / "Soy-based ink" prominently.
- **Reusable packaging** — packaging that customers keep (premium boxes).

### Shipping box specs

Standard sizes (mm) — pick based on product:
- 200×150×50 — small flat (apparel, books).
- 250×200×100 — small cube (cosmetics, accessories).
- 300×200×100 — medium flat (most products).
- 400×300×200 — medium cube (multi-item orders).

Custom sizes available but expensive at low volume. Use a standard size with internal void fill if possible.

## Color in packaging

- **Spot color** is more common in packaging than print collateral. Pantone-matched brand color ensures consistency from box to box, run to run.
- **Foil stamp** for premium products (gold, silver, copper, holographic).
- **Spot UV** for tactile contrast (matte box + glossy logo).
- **Soft-touch lamination** — velvety feel; popular in premium beauty.
- **Reverse-printed clear** (printing on the inside of a clear material; design shows through with depth).

### Accuracy

Packaging colors are **brand-defining**. The Coca-Cola red on every can has been Pantone-matched for decades.

For brand-critical packaging:
1. Specify exact Pantone (PMS) numbers.
2. Get press proof from each printer / each material.
3. Compare proofs in standardized lighting (D65 daylight standard).
4. Approve in writing.

## Substrate / material

Cardboard weight (gsm or pt):

| Use | Weight |
| --- | --- |
| Light folding carton (cosmetics insert) | 250-300gsm |
| Standard folding carton (most products) | 300-350gsm |
| Sturdy folding carton (electronics) | 350-400gsm |
| Premium rigid box (luxury) | 1000-1500gsm cardstock + wrap |
| Corrugated mailer | E-flute (1.5mm) or B-flute (3mm) |
| Heavy-duty corrugated | C-flute (4mm), B-C double wall |

White (SBS — solid bleached sulfate) is the most common board for color-printed cartons. Brown kraft signals natural / eco. Gray-back is cheaper but shows on inside.

## Production process

### Folding carton workflow

1. **Spec the box** — dimensions, material, finish, special effects.
2. **Get / create dieline**.
3. **Design on dieline** — keep critical content in safe areas.
4. **Press proof** — small run for color check.
5. **Bulk print** — usually offset for large runs (5000+); digital for small (< 1000).
6. **Cut + crease** — die-cut machine creates the precise cuts and crease lines.
7. **Glue + assemble** — glued or shipped flat.
8. **Pack** — products inserted; cartons sealed.

Lead time: 2-6 weeks for small runs; 4-12 weeks for large runs with custom finishing.

### Costs

Highly variable. Rough Korean pricing:
- Standard folding carton (CMYK, 350gsm, 1000-unit run): 300-800 KRW per unit.
- Premium with foil + spot UV: 1500-3000 KRW per unit.
- Rigid box (luxury): 5000-20000 KRW per unit.
- Custom shipping mailer: 200-800 KRW per unit at 1000+.

## Korean packaging regulations

Brief overview (always confirm with current KFDA / KATS / regulator):

### Food (식품)
- **Ingredients in descending weight order**.
- **Allergens (알레르기 표시) bolded**.
- **Net contents (내용량) prominent**.
- **Best-before (유통기한) format: YYYY-MM-DD**.
- **Country of origin (원산지)**.
- **Manufacturer (제조원) + distributor (판매원)**.
- **Storage instructions (보관방법)**.

### Cosmetics (화장품)
- **All ingredients listed**, including INCI names.
- **Manufacturer (제조판매업자)**.
- **Net contents**.
- **Use-by / expiry**.
- **Country of origin**.

### Supplements / health-functional foods (건강기능식품)
- Strict label format and approved claims only.
- **Health functional food (건강기능식품) mark required**.
- All claims pre-approved.

### Recycling marks (분리배출 표시)
Required on all packaging:
- 종이 (paper)
- 플라스틱 (plastic + resin code: PE, PP, PET, etc.)
- 비닐 (vinyl)
- 캔 (can)
- 유리 (glass)
- Multi-material: 다중구조

The recycling mark is a regulated icon + Korean text. Can't redesign for brand.

## Sustainability in packaging

2024+ trends:
- **Plastic-free packaging** — paper alternatives, no plastic windows.
- **Mono-material packaging** — easier to recycle than mixed.
- **Compostable / biodegradable** — for food, cosmetics.
- **Refillable / reusable** — premium positioning + eco.
- **Reduced packaging** — less material; right-sized boxes.
- **FSC certification** — sustainable forestry on paperboard.

Korean ESG-aware brands increasingly call this out on the packaging itself — "재활용 가능", "100% FSC", etc.

## Common packaging mistakes

- **Designing without a dieline** — content gets cut or folded incorrectly.
- **Critical content too close to fold** — gets creased / illegible.
- **Spot UV / foil overlapping each other** — registration issues.
- **Forgetting the back panel** — regulatory info missing.
- **Brand color wrong on press** — didn't proof; full run reprinted.
- **Wrong recycling mark** — KR regulator can require recall.
- **Ingredient font too small** — KFDA can reject.
- **Box doesn't fit the product** — too tight or too loose.

## Don't

- Don't design without a dieline. The whole project will need to be redone.
- Don't skip the press proof for brand-critical color. RGB → CMYK shift is real.
- Don't forget regulatory content — KFDA / KATS rejects can delay launch by weeks.
- Don't use thin paperboard for products that need to feel premium.
- Don't print on the inside of a recycled-kraft mailer with full bleed — kraft texture shows through.
- Don't mix metric and imperial in dieline measurements. Pick one.
- Don't design Korean labels in English then translate at the last minute. Korean expansion / contraction breaks layouts.

## Cross-reference

- [`knowledge/print/print-fundamentals.md`](print-fundamentals.md) — CMYK, bleed, DPI
- [`knowledge/print/korean-print-conventions.md`](korean-print-conventions.md) — KR regulatory
- [`knowledge/patterns/brand-identity.md`](../patterns/brand-identity.md) — brand foundation
- [`knowledge/illustration/illustration-systems.md`](../illustration/illustration-systems.md) — illustration on packaging
- [`knowledge/i18n/korean-document-style.md`](../i18n/korean-document-style.md) — Korean copy on packaging
