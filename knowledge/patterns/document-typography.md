<!-- hand-written -->
---
title: Document typography (long-form reading)
applies_to: [docs, articles, reports, books, marketing-prose]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Document typography

Designing for **reading** is fundamentally different from designing for **scanning** (UI). Long-form documents — articles, technical docs, reports, books — need different rules than product UIs.

The product UI rules in [`type-scale-fundamentals.md`](../typography/type-scale-fundamentals.md) bias toward scannable, dense, multi-purpose. Document typography biases toward sustained reading, lower fatigue, clear hierarchy.

## Body — the most important decision

Body text is what readers actually read. Get this right and everything else can be average; get it wrong and nothing else matters.

| Property | Document | Product UI |
| --- | --- | --- |
| Font size | **18–20px** (web) / 11–12pt (print) | 14–16px |
| Line height | **1.5–1.7** | 1.4–1.5 |
| Line length (measure) | **60–75 characters** | not constrained |
| Line color | `#1F2937` or similar (slightly off-black) | `#0F172A` |
| Font | Serif OR humanist sans | Geometric sans |

### Why bigger?

At "product UI" 14px, sustained reading is fatiguing. 18px+ is the comfort zone for paragraphs of prose.

### Why constrained measure?

Lines too long: eyes lose place returning to next line.
Lines too short: too many returns, choppy.

**60–75 characters per line** is the sweet spot. Use `max-width: 65ch` (CSS).

For Korean: 35–40 Hangul characters per line (Hangul syllables ~2× width of Latin chars).

### Why off-black?

Pure `#000` on `#FFF` has too much contrast (eye strain over long reads). `#1F2937` / `#272727` reduces glare while staying high-contrast.

Print: ≥ 90% black on white paper, never 100%.

## Heading hierarchy

Documents need **clearer hierarchy** than UIs. Readers skim before reading; headings are the skim path.

### Default scale (web)

| Level | Tag | Size | Weight | Line height | Top margin |
| --- | --- | --- | --- | --- | --- |
| Display | h1 | 48–60px | 700 | 1.1 | — |
| Section | h2 | 32–36px | 700 | 1.2 | 64px |
| Subsection | h3 | 24px | 600 | 1.3 | 48px |
| Sub-sub | h4 | 18–20px | 600 | 1.4 | 32px |
| Body | p | 18–20px | 400 | 1.6 | 16px |

The `top margin` matters: hierarchy is reinforced by space above the heading. h2 has more space than h3, signaling a bigger break.

### Korean adjustment

For Korean documents:
- Headings: same size, **weight 600** (heavier than Latin's typical 400 for h3+).
- Line height +10%: h2 1.3 → 1.35.
- Line break behavior: `word-break: keep-all` to avoid mid-syllable breaks.

## Vertical rhythm

A document with consistent vertical rhythm reads as composed. Inconsistent rhythm reads as messy.

### Single-axis baseline

Pick a base line-height (e.g., 32px). Every spacing decision is a multiple:

```
Body line-height: 32px
Body paragraph margin: 32px (= 1× line)
h2 top margin: 64px (= 2× lines)
h3 top margin: 48px (= 1.5× lines)
Image bottom margin: 32px
List item spacing: 16px (= 0.5× lines)
```

This is "vertical rhythm" — content sits on a consistent baseline, no awkward gaps.

CSS for it:

```css
body {
  --leading: 1.6em;
}
p, li, h1, h2, h3, h4 {
  margin-bottom: var(--leading);
}
h2 {
  margin-top: calc(var(--leading) * 2);
}
```

## Paragraph styling

| Property | Value | Why |
| --- | --- | --- |
| Indentation | None (modern web) OR 1em first-line (print/editorial) | Matches medium |
| Margin between | 1× line-height (no indentation), 0 (with indentation) | Two cues for paragraph break is redundant |
| First-letter drop cap | Editorial / hero sections only | Distractive in technical docs |
| Justify | No, on web (rivers and uneven spacing) | Use left-align (LTR) / right-align (RTL) |

### Korean paragraphs

- No indentation; modern Korean web/print convention.
- Paragraph spacing same as Latin (1 line-height).
- For mixed Korean-English (loanwords, technical terms): use a single font that handles both well (Pretendard, IBM Plex Sans KR).

## Inline text styles

| Style | Use | Style |
| --- | --- | --- |
| **Bold** | Genuine emphasis (sparingly) | weight 700 |
| _Italic_ | Title of work, emphasis (rare in tech) | font-style italic |
| `Code` | Inline code, paths, identifiers | font-family monospace, slight bg tint |
| ~~Strike~~ | Removed / superseded text | text-decoration line-through |
| <u>Underline</u> | Avoid for non-link text — confusing | underline reserved for links |

Korean-specific: italics don't render well for Hangul (no italic form). For emphasis, use:
- `font-weight: 600`
- Color shift (slightly darker)
- Or wrap in `<mark>` for annotation

## Links in long-form

Links break reading flow. Choices:

| Style | Use |
| --- | --- |
| Underline + brand color | Default. Most discoverable. |
| Underline only | Editorial / minimal style |
| Color only (no underline) | Avoid — fails for color-blind |
| Subtle (low contrast underline) | Footnotes, references |

For high-density link content (think Wikipedia): use subtle underline; underline-on-hover for less-noisy default.

## Pull quotes

Block quotes / pull quotes break monotony in long-form:

```html
<blockquote>
  <p>The quote text, often slightly larger and italic or in a contrasting color.</p>
  <cite>— Attribution</cite>
</blockquote>
```

Style:
- Larger font (1.25–1.5× body)
- Different color (`--color-text-secondary` works)
- Italic (Latin) / weight 500 (Hangul)
- Vertical bar on left OR centered with quote marks

Don't use for ordinary block content — reserve for actual quotes.

## Image / figure handling

In documents:
- Images full-width to the body container.
- Captions: smaller text below image (`figcaption`).
- Image padding: 1 line-height above and below.
- No drop shadows on documentation images (signals product UI, not editorial).
- Photographs: rounded corners are jarring for editorial context. Use square corners for serious docs.

## Code blocks in documents

Different from inline code:
- Full-bleed to container (or slightly inset).
- Background tint (slightly darker than body bg).
- Monospace font, 14–15px (smaller than body, intentional).
- Optional language label at top.
- Optional copy button (top-right, hover-only).
- Line numbers for very long blocks (>20 lines).

Cite [`examples/component-code.md`](../../examples/component-code.md).

## Tables in documents

Different from product UI tables:
- Border-bottom on every row (light) — easier reading.
- Header: bold + `border-bottom: 2px solid` to separate from body.
- Row striping: optional. Use `--color-bg-subtle` very lightly OR not at all.
- No filtering / sorting controls in document context (it's prose, not data).
- For large data: extract to a separate component, not inline in prose.

## Print-specific

For docs meant to be printed (manuals, reports, contracts):
- Body: 11pt (smaller than screen — print is denser).
- Margins: 1 inch (2.5 cm) all sides.
- Page breaks: avoid orphans/widows. CSS `orphans: 3; widows: 3;`.
- Page numbers: small, bottom-center or bottom-right.
- No light gray text — minimum 70% black.
- No background colors that bleed to edges (uses paper, looks weird).

## Document → web → print pipeline

A doc may need to render in three contexts:

```
Markdown source (canonical)
   ↓
Web (your docs site)
   ↓
PDF (download)
   ↓
Print (paper)
```

Each context overrides the base styling:

```css
body { font-size: 18px; line-height: 1.6; }

@media print {
  body { font-size: 11pt; line-height: 1.5; }
  a { color: #000; text-decoration: underline; }
  a::after { content: " (" attr(href) ")"; }  /* show URL after link in print */
}
```

## Common document typography mistakes

- **Body too small** (14px) — looks like a UI, fatiguing to read.
- **Lines too long** (no max-width) — eye fatigue.
- **Heading too close to next paragraph** — no margin separation.
- **All text justified** (web) — rivers, awkward gaps.
- **Pure black text** — eye strain.
- **Code blocks at body size** — should be slightly smaller.
- **Pull quotes overused** — every paragraph has one, lose all impact.
- **Multiple emphasis types in same paragraph** (bold + italic + code + link) — visual chaos.

## Cross-reference

- [`knowledge/typography/type-scale-fundamentals.md`](../typography/type-scale-fundamentals.md) — base scale concepts (UI-focused)
- [`knowledge/i18n/korean-typography.md`](../i18n/korean-typography.md) — Korean adjustments
- [`knowledge/i18n/korean-document-style.md`](../i18n/korean-document-style.md) — Korean doc-specific conventions
- [`knowledge/patterns/information-architecture.md`](information-architecture.md) — IA for long docs
- [`knowledge/patterns/technical-writing.md`](technical-writing.md) — voice and structure
