---
description: Generate a full color palette (ramps + semantic aliases + dark mode + contrast matrix) from a brand input (hex, product category, or mood).
---

You will produce a full color palette using the [`color-palette` skill playbook](../skills/color-palette/PLAYBOOK.md).

## Input

Parse `$ARGUMENTS`. The user will provide one of:
- A hex (e.g., `#7C3AED`)
- A product category (e.g., `fintech`, `e-commerce`, `health-tech`)
- A mood word (e.g., `playful`, `editorial`, `brutalist`)
- Multiple of these, comma-separated

If the input is ambiguous or missing, ask one clarifying question before proceeding.

## Steps

1. Determine the seed:
   - If hex: it's the primary.
   - If category: pull a starter from [`knowledge/colors/palettes-by-product-type.md`](../knowledge/colors/palettes-by-product-type.md).
   - If mood: pull primary/accent from [`knowledge/patterns/styles-catalog.md`](../knowledge/patterns/styles-catalog.md).

2. Apply the [`color-palette` playbook](../skills/color-palette/PLAYBOOK.md) end-to-end:
   - OKLCH ramp generation
   - Semantic anchors (default, hover, active, subtle, on-color)
   - Accent + neutrals
   - WCAG validation (matrix)
   - Dark mode (recomputed, not inverted)

3. Output using [`skills/color-palette/TEMPLATE.md`](../skills/color-palette/TEMPLATE.md):
   - Reasoning paragraph
   - Token table (light + dark)
   - Code blocks for the requested framework (default: Tailwind v4 + shadcn-ui CSS vars + Style Dictionary JSON)
   - Contrast matrix
   - Use guidance

## Default assumptions if not specified

- Both light and dark mode.
- Tailwind v4 + shadcn-ui CSS vars + Style Dictionary JSON output.
- WCAG AA target (not AAA).
- 11-step ramps (`50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`).

## Done when

- Every UI-relevant pair has a contrast number.
- Dark mode is genuinely recomputed.
- Code blocks for at least Tailwind + shadcn vars are paste-ready.
- Use guidance addresses primary vs accent vs neutral selection.
