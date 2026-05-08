---
description: Spec a print piece — business card, brochure, poster, packaging, or stationery system. CMYK + Pantone, bleed, finish, file delivery; Korean print conventions baked in.
---

You will produce a print-ready spec for the piece described in `$ARGUMENTS`.

## Input

Parse `$ARGUMENTS`. Expect:
- A piece type ("business card", "tri-fold brochure", "subway poster", "cosmetics carton").
- Optionally: brand, audience (Korean / international), tier (basic / premium), quantity, special requirements.

If ambiguous, ask one clarifying question — but only one. Otherwise apply reasonable defaults and proceed.

## Steps

1. **Pick the right piece category** (stationery / brochures / signage / packaging) and consult the matching knowledge file.

2. **Apply the [print-designer playbook](../skills/print-designer/PLAYBOOK.md)**:
   - Spec dimensions + bleed + safe area.
   - Pick paper / material.
   - Pick color (CMYK + Pantone).
   - Pick finish + special effects.
   - Spec typography.
   - Apply regulatory content if required (food / cosmetics / supplements).
   - Spec file delivery format (PDF/X-1a + outlined fonts + embedded images + ICC).

3. **Apply Korean print conventions** if KR audience:
   - 명함 90×50 (not 85×55).
   - Pretendard typography defaults.
   - KFDA / KATS regulatory content.
   - 분리배출 표시 recycling marks for packaging.

4. **Output** using the structure in PLAYBOOK.md step 9.

## Done when

- Dimensions + bleed (3mm min) + safe area.
- Paper / material + finish + special effects.
- Color (CMYK + Pantone explicit).
- Typography (fonts, sizes, weights per role).
- Layout (per panel for multi-panel pieces).
- Regulatory checklist if applicable.
- Cost estimate.
- File delivery format (PDF/X-1a + outlined fonts).
- Pre-press checklist.
- Press proof step for brand-critical color.
- "Don't" section catches 2-3 misuses.
- Verification phase from PLAYBOOK.md passes.
