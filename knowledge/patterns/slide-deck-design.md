<!-- hand-written -->
---
title: Slide deck design
applies_to: [presentations, slide-decks, pitch-decks, conference-talks]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Slide deck design

Slide decks have their own rules. They're built for **presentation in front of an audience** (not solo reading) — so layout, density, and pacing differ from documents.

If your "deck" is meant to be sent as a PDF and read alone, that's a **document**, not a deck. See [`document-typography.md`](document-typography.md). Many "decks" should be docs.

## Three slide-deck archetypes

| Type | Use | Density |
| --- | --- | --- |
| **Talk deck** | Presented live, supports the speaker | Very low (1 idea per slide) |
| **Sales / pitch deck** | Sent OR presented; persuasion + reading | Medium |
| **Reading deck (deck-as-document)** | Read solo, structured like slides | High — but consider doc instead |

Don't mix archetypes in one deck. A talk deck sent as PDF reads as confusingly sparse.

## Talk deck rules — the strict ones

### One idea per slide

If a slide has 3 different points, it's 3 slides.

### Big text

Body text on slides: **24pt minimum**. From the back of a room, anything smaller is unreadable. For body content: 32–40pt.

Heading: 60–96pt.

### Few words

Maximum **6 lines × 6 words** rule (rough). If your slide has more, you're reading slides at the audience — bad presenting.

### High contrast

Black on white. Or white on near-black. No gray-on-gray.

### No animations except for purpose

Auto-transitions, fade-ins, "flying text" — kill them all. Animations should:
- Reveal information progressively (e.g., bullet by bullet during a build-up).
- Show physical change (a chart updating).
- Create surprise (rare, intentional).

Default: no animation. Only add when justified.

## Sales/pitch deck rules

Different: this deck stands alone (sent via email) AND gets presented.

### Higher density allowed

Body 18–24pt is fine. Subtitle/caption 14–16pt.

### Each slide self-contained

Sender isn't there to explain. Each slide should communicate without the speaker.

### Strong visual brand

Colors, fonts, illustrations match brand. The deck IS a brand artifact.

### Standard structure (SaaS pitch)

```
1. Hero — company + tagline
2. Problem — what's broken in the world
3. Solution — what we do
4. Why now — market timing
5. Product / Demo
6. Traction — metrics, customers, growth
7. Business model
8. Competition / market
9. Team
10. Financials / Ask (for fundraising) OR pricing
```

Variations exist; this is the typical SaaS pitch deck. Keep it ≤ 12 slides for first send.

## Anatomy of a great slide

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│      Headline — what this slide says                         │  ← center-aligned, bold
│                                                              │
│      [Visual / chart / image — main proof]                   │
│                                                              │
│      Sub-text or caption (optional)                          │
│                                                              │
│                                                              │
│  [logo]                                  [page #] / [N]      │  ← chrome at bottom
└─────────────────────────────────────────────────────────────┘
```

| Slot | Use |
| --- | --- |
| Headline | The one thing — prose, not heading |
| Visual | The proof — chart, image, demo screenshot |
| Sub-text | Secondary detail (small, low-priority) |
| Chrome | Logo + page numbers (small, persistent) |

Every slide has these elements. Variation comes from layout (visual top vs left vs bottom) — but the slots are consistent.

## Title-as-message

Bad title (boring): "Revenue".
Good title (the message): "Revenue tripled in Q4."

The title makes the case. The chart proves it.

If audience reads only the titles, they get the deck's argument. That's the goal.

## Visual hierarchy

Slide audiences scan in seconds. Hierarchy must be unambiguous:

1. **Largest visual element wins.** If your chart is small and the heading is huge, the heading is the message. Verify intent.
2. **Color contrast wins second.** A red number on a gray slide draws first.
3. **Position last.** Everything else equal, top-left wins (LTR).

Test: glance at slide for 2 seconds. What do you see?

## Color in decks

| Use | Color |
| --- | --- |
| Brand primary | Headlines, key callouts |
| Neutral dark | Body text |
| Neutral light | Background |
| Money / status | One semantic accent (positive trend, etc.) |

Cap palette at **4–6 colors** for the whole deck. More is brand chaos.

For chart slides: use the chart palette rules from [`knowledge/patterns/chart-color-encoding.md`](chart-color-encoding.md).

## Typography in decks

| Slot | Web/screen | Print/PDF |
| --- | --- | --- |
| Title | 60–96pt | 36–48pt |
| Body | 24–32pt | 14–18pt |
| Caption | 16–20pt | 10–12pt |
| Code (rare) | 22–28pt monospace | 12–14pt |

Pick **one font**. Maybe two (heading + body if they pair). More is brand inconsistency.

For Korean: Pretendard works at all sizes. Avoid mixing Hangul fonts within one deck.

## Layout templates

### Title slide

```
┌──────────────────────────────────────┐
│                                       │
│  [Big bold title]                     │
│                                       │
│  Subtitle / tagline                   │
│                                       │
│  Author · Date · Venue                │
│                                       │
└──────────────────────────────────────┘
```

### Section divider

```
┌──────────────────────────────────────┐
│                                       │
│  Part 02                              │
│  Section name                         │
│                                       │
└──────────────────────────────────────┘
```

Used between major parts of the deck. Helps audience reset.

### Content slide (one image, one message)

```
┌──────────────────────────────────────┐
│ Title                                  │
│                                       │
│  [Large image / chart]                │
│                                       │
│ Caption                               │
└──────────────────────────────────────┘
```

### Comparison slide (2-up)

```
┌──────────────────────────────────────┐
│ Title — the comparison itself         │
├─────────────┬───────────────────────┤
│             │                        │
│ Option A    │ Option B               │
│             │                        │
│ ✓ benefit   │ ✓ benefit              │
│ ✓ benefit   │ ✗ drawback             │
│             │                        │
└─────────────┴───────────────────────┘
```

Two columns; clearly delineated. Avoid 3+ columns (cramped).

### Quote slide

```
┌──────────────────────────────────────┐
│                                       │
│  "Quote text, large, italic or         │
│   distinct font."                      │
│                                       │
│  — Attribution                        │
│                                       │
└──────────────────────────────────────┘
```

Used for testimonials in sales decks, framing quotes in talks.

## Charts on slides

| Rule | Why |
| --- | --- |
| **Headline tells the story** | Audience reads the headline, glances at chart for confirmation |
| **Drop chart noise** (gridlines, redundant labels) | Slide is glance-only, less is better |
| **Highlight the takeaway** | Color one bar / line differently to indicate "this is the point" |
| **Single message per chart** | Don't show 5 series unless the comparison is the point |
| **No 3D charts** | Always confusing |

Cite [`knowledge/patterns/chart-color-encoding.md`](chart-color-encoding.md).

## Demo / screenshot slides

For product walkthroughs:
- Screenshot fills most of the slide.
- Annotate with arrows / circles / numbered callouts.
- For UI demos: cover sensitive data (use placeholder).
- Optimize image — slide PDF can balloon to 100MB if uncompressed.

## Tools

| Tool | Best for |
| --- | --- |
| **Keynote** (Mac) | Live talks, smooth animations |
| **Google Slides** | Collaboration, real-time editing |
| **PowerPoint** | Corporate, advanced layout |
| **Figma Slides** | Brand-led decks with rich design |
| **Pitch** | Sales decks, modern collaboration |
| **Markdown → reveal.js / Slidev** | Engineer-friendly, code-heavy talks |

For consistency with design-ai's design system: Figma Slides + tokens (Phase 9 Figma MCP) is the cleanest path.

## Deck structure decisions

### How long?

| Use | Slide count |
| --- | --- |
| 5-min lightning talk | 8–10 slides |
| 20-min conference talk | 15–25 slides |
| 30-min keynote | 30–40 slides |
| Sales pitch (sent) | 10–15 slides |
| Investor pitch | 12 slides (Sequoia-style) or 8–10 (Y Combinator-style) |
| Internal team review | 15–25 slides |

More important than count: **rhythm**. A 30-slide deck with 10 dense slides + 20 simple slides reads better than 30 medium-density slides.

### One presenter or several?

Multi-presenter decks need clear handoffs. Add a "next presenter" cue between sections (a slide with the next person's name + topic).

## Korean conventions

Korean business decks (보고서/제안서):
- Heavier on text than Western (Korean business context expects detail).
- Hierarchy via numbered sections (1, 1.1, 1.1.1).
- Polite tone (~합니다).
- Conservative palette — corporate gray + brand color, less saturation.

Korean talk decks at conferences (PyCon Korea, FEKR, etc.):
- Lighter, more Western-style.
- English code samples on Korean explanation slides is standard.

For Korean fintech pitch decks: per Toss-style aesthetic — minimal, single primary color, lots of whitespace, big numbers.

## Common deck design mistakes

- **Walls of bullets** — death by PowerPoint.
- **Reading slides verbatim** — "I'll let the slide speak for itself" is the slide's failure.
- **Tiny text** at the back of the room.
- **Auto-advance** — robs presenter of pacing control.
- **Stock photography of people pointing at laptops** — instantly cliché.
- **Pie charts with 8+ slices**.
- **3D anything**.
- **Slide numbers in the title** — irrelevant during the talk.
- **Same template for every slide type** — title slide, section divider, content slide should look distinct.

## Cross-reference

- [`knowledge/patterns/document-typography.md`](document-typography.md) — when "deck" is actually a doc
- [`knowledge/patterns/chart-color-encoding.md`](chart-color-encoding.md) — chart-on-slide
- [`knowledge/patterns/information-architecture.md`](information-architecture.md) — structuring sections
- [`knowledge/colors/color-theory.md`](../colors/color-theory.md) — palette construction
- [`skills/slide-deck-author/`](../../skills/slide-deck-author/) — authoring skill (uses these rules)
