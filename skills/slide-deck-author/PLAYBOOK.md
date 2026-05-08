# slide-deck-author — playbook

Design and outline a slide deck (talk / pitch / reading deck). Outputs slide-by-slide content + design specs that a human or framework (Keynote, Figma Slides, reveal.js / Slidev) can render.

## When to use

- "Make a 10-min talk on X"
- "Pitch deck for our seed round"
- "Internal review deck for the new feature"
- "Conference talk on design tokens"

## Inputs (ask if missing)

1. **Type**:
   - **Talk deck** — presented live, supports speaker
   - **Pitch / sales deck** — sent + presented
   - **Reading deck** — sent only, read alone (warning: probably should be a doc)
2. **Topic + thesis** — what's the deck about? What's the one-line takeaway?
3. **Length** — minutes (talk) or slide count (pitch).
4. **Audience** — who's watching/reading?
5. **Brand** — color, font, logo, voice (or link to brand kit).
6. **Locale** — Korean / English / both.

## Steps

### 1. Pick the archetype

If unsure, decision rules from [`knowledge/patterns/slide-deck-design.md`](../../knowledge/patterns/slide-deck-design.md):

| Will it be sent + read alone? | Should be a doc, not a deck |
| Will it support a live presenter? | Talk deck (low density) |
| Will it be both sent + presented? | Pitch deck (medium density) |

If user insists on a "reading deck": warn that documents render better, then proceed.

### 2. Draft the outline

Slide-by-slide. Each entry has:
- Slide number
- Title (the message, not the topic)
- Visual (chart / image / mockup / nothing)
- Body text or speaker notes

For **talk deck** (10–25 slides typical):

```
1. Title slide — "Design Tokens, From First Principles"
2. Hook — the audience problem ("designers and devs say different colors")
3. Personal credibility (~5 sec, optional)
4. Argument 1 — "Tokens unify the language"
   - Chart / before-after image
5. Argument 2 — "Three-tier architecture"
   - Diagram
6. Argument 3 — ...
...
N. Conclusion / call to action
```

For **pitch deck** — Sequoia-style 12 slides:
```
1. Hero (company + tagline)
2. Problem
3. Solution
4. Why now
5. Product (demo screenshot)
6. Traction (chart)
7. Business model
8. Competition
9. Team
10. Financials / Ask
```

### 3. Headline-as-message

For each slide, the title states the **takeaway**, not the topic.

| Topic title (bad) | Message title (good) |
| --- | --- |
| "Revenue" | "Revenue tripled in Q4" |
| "Architecture" | "We chose 3-tier for upgrade safety" |
| "Onboarding flow" | "Onboarding completes in 30 seconds" |
| "Tokens" | "Tokens cut design-dev rework by 40%" |

If the audience reads only the slide titles, they get the deck's argument.

### 4. Choose visuals per slide

For each slide, pick **one** primary visual:
- Chart (per [`knowledge/patterns/chart-color-encoding.md`](../../knowledge/patterns/chart-color-encoding.md))
- Screenshot of product (with annotations)
- Diagram (architecture, workflow, hierarchy)
- Photo (for emotion / human moment, sparingly)
- Just text (when the message is the visual)

Don't combine multiple visuals on one slide. The visual proves the title.

### 5. Apply visual / brand

Cite [`knowledge/patterns/brand-identity.md`](../../knowledge/patterns/brand-identity.md):
- Logo top-left or bottom-right (small).
- Brand color for accents (highlights, callouts, chart series).
- One typographic family (display + body if pairing).
- Background: neutral white or branded solid (no gradient noise).

For Korean-audience decks, cite [`knowledge/i18n/korean-document-style.md`](../../knowledge/i18n/korean-document-style.md):
- Pretendard or similar.
- Slightly more text density than Western decks (Korean business convention).
- Numbered hierarchical sections.

### 6. Output spec

Two outputs:

#### A. Outline markdown (for review)

```markdown
# Deck: [title]

## Meta
- Type: talk deck
- Length: 10 min (~15 slides)
- Audience: senior designers
- Brand: design-ai

## Outline

### 1. Title
- Visual: company logo + tagline
- Notes: [what speaker says]

### 2. Hook — "Why design tokens matter"
- Visual: side-by-side photo (chaotic palette vs unified)
- Body text: none — image speaks
- Notes: [opening anecdote]

### 3. Argument 1 — "Tokens unify the design-dev handoff"
- Visual: chart of design-dev rework hours, before vs after tokens
- Body text: "Rework hours: -40% after token rollout"
- Notes: [story behind the chart]

...
```

#### B. Render-ready format (optional — based on tool)

For Figma Slides / Keynote: outline + visual spec is enough; designer renders.

For reveal.js / Slidev (markdown-based decks): generate the actual `.md` file:

```markdown
---
theme: default
title: Design Tokens
---

# Design Tokens
From First Principles

---

# The problem
[image: chaotic-palette.png]

---

# Tokens unify the language
[chart: rework-hours.png]
```

### 7. Verification

- [ ] Did I pick the right archetype (warn if reading-deck)?
- [ ] Is the title of every slide a **message** (not a topic)?
- [ ] Each slide has one visual + one message — no mixed?
- [ ] Brand applied (logo, color, type)?
- [ ] Slide count appropriate for length (15-25 for 20-min talk)?
- [ ] If Korean: voice level consistent (~합니다 vs ~해요)?
- [ ] Speaker notes for live talks?
- [ ] No 3D charts / clipart / stock photos of people pointing at laptops?

## Source files this skill reads

- [`knowledge/patterns/slide-deck-design.md`](../../knowledge/patterns/slide-deck-design.md) — full deck rules
- [`knowledge/patterns/brand-identity.md`](../../knowledge/patterns/brand-identity.md) — brand application
- [`knowledge/patterns/chart-color-encoding.md`](../../knowledge/patterns/chart-color-encoding.md) — charts on slides
- [`knowledge/patterns/document-typography.md`](../../knowledge/patterns/document-typography.md) — when reading-deck → doc
- [`knowledge/i18n/korean-document-style.md`](../../knowledge/i18n/korean-document-style.md)
- [`knowledge/patterns/information-architecture.md`](../../knowledge/patterns/information-architecture.md) — section structure for long decks

## Done when

- Outline markdown delivered, slide-by-slide.
- Each slide title is a message.
- Each slide has one visual concept + body text.
- Brand applied consistently.
- Speaker notes for live decks.
- (Optional) render-ready format for declarative tools (reveal.js / Slidev).
- Verification phase passes.
