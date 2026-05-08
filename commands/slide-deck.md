---
description: Generate a slide deck outline from a brief. Picks archetype (talk / pitch / reading), drafts message-led slide titles, specifies visuals per slide, applies brand. Korean-aware.
---

Apply the [`slide-deck-author` skill](../skills/slide-deck-author/PLAYBOOK.md) to the brief in `$ARGUMENTS`.

## Input

`$ARGUMENTS` should describe:
- Topic + thesis (one-line takeaway)
- Type — talk / pitch / reading (warn if reading)
- Length (minutes for talk; slide count for pitch)
- Audience
- Brand (color / font / logo / voice)
- Locale (Korean / English / both)

## Steps

1. Parse brief.
2. Pick archetype. If "reading deck": warn that documents render better, then proceed.
3. Apply [`skills/slide-deck-author/PLAYBOOK.md`](../skills/slide-deck-author/PLAYBOOK.md):
   - Outline slide-by-slide with message-led titles.
   - Pick one visual per slide.
   - Apply brand.
   - Add speaker notes for live decks.
4. Output: outline markdown + (optional) render-ready format.
5. Run verification phase.

## Examples

**Brief**: "20-min conference talk on design tokens for designers. Brand color teal."
→ 18-slide talk deck. Hook → 3 arguments → conclusion. Diagrams + before/after charts. Speaker notes for each slide.

**Brief**: "Seed pitch deck for a Korean fintech app. 12 slides max."
→ Sequoia-style pitch: hero / problem / solution / why-now / product / traction / business model / competition / team / ask. Korean copy. Toss-style aesthetic.

**Brief**: "Reading deck for an internal architecture review."
→ Warning that this should be a doc. If user insists: medium-density deck with each slide self-contained.

## Done when

- Outline markdown delivered with per-slide titles + visuals.
- Each title is a **message**, not a topic.
- One visual concept per slide.
- Brand applied.
- Verification phase from `slide-deck-author` passes.
