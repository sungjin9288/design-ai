<!-- hand-written -->
---
title: Information architecture for documents
applies_to: [docs, knowledge-base, technical-docs, product-docs]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Information architecture

Information architecture (IA) is the structure of content. For documentation: how docs are grouped, navigated, named, cross-linked. Get IA right and users find what they need; get it wrong and they bounce to Google.

## The four-types model (Diátaxis)

The most useful IA framework for technical docs. Different content has different purposes:

| Type | Purpose | Audience state | Example |
| --- | --- | --- | --- |
| **Tutorial** | Learning by doing | New user | "Build your first chart" |
| **How-to guide** | Solving a specific problem | Experienced user with goal | "How to deploy to staging" |
| **Reference** | Looking up specifics | Implementing | "API endpoint reference" |
| **Explanation** | Understanding (background) | Curious / debugging | "Why we chose Kafka" |

Each type has different writing style, structure, length. Mixing them in one doc confuses readers.

```
Tutorial: step-by-step, success-driven, hand-holding
How-to: numbered list, problem→solution, no fluff
Reference: tables, exhaustive, no narrative
Explanation: prose, motivation, "why"
```

Most docs sites should have all four types **separated**, not interleaved.

## Top-level IA — three options

### A. By type (Diátaxis canonical)

```
docs/
├── tutorials/
├── how-to/
├── reference/
└── explanation/
```

Pure but rare in practice — users don't always know what type they need.

### B. By topic, type within

```
docs/
├── components/
│   ├── overview.md            (explanation)
│   ├── getting-started.md     (tutorial)
│   ├── how-to-customize.md    (how-to)
│   └── api-reference.md       (reference)
├── tokens/
│   └── ...
└── workflows/
    └── ...
```

Most common. Topic is the entry point; type is the second level.

### C. By user journey

```
docs/
├── new-here/                  (onboarding tutorials)
├── building-with-design-ai/   (how-tos)
├── reference/                 (everything for lookup)
└── concepts/                  (explanations)
```

Optimized for new vs experienced split.

For most projects: **(B) by topic** is the right default.

## Navigation hierarchy

Users navigate by:
1. **Sidebar** — visible always, lists everything.
2. **In-page TOC** (right rail) — current page sections.
3. **Search** — keyword based.
4. **Cross-links** — from one page to related.
5. **Breadcrumbs** — show current position in hierarchy.

A docs site needs **at least 3 of 5** working well.

### Sidebar depth

Cap at 3 levels:
```
✓ Components > Button > API
✗ Components > Forms > Inputs > Text > Variants > API
```

Past 3 levels, users get lost. If your structure needs deeper: rethink categorization.

### Sidebar width

200–280px typical. Fixed (sticky on scroll). Collapsible on mobile.

## Page anatomy — the canonical doc page

```
┌──────────────────────────────────────────────────────────────────────┐
│ [logo]                                              [Search] [GitHub] │  ← top app bar
├──────────────┬─────────────────────────────────────────┬─────────────┤
│              │                                          │              │
│ Components   │ # Button                                 │ ## Anatomy   │  ← right TOC
│ ▸ Button     │ A short description of what it does.     │ ## API       │
│ ▸ Card       │                                          │ ## States    │
│ ▸ Input      │ ## Anatomy                               │ ## Examples  │
│ ▸ Modal      │ [diagram]                                │ ## See also  │
│              │                                          │              │
│ Tokens       │ ## API                                   │              │
│ ▸ Color      │ <prop table>                             │              │
│ ▸ Spacing    │                                          │              │
│              │ ## States                                │              │
│              │ ...                                      │              │
│              │                                          │              │
│              │ ## See also                              │              │
│              │ - [Card](../card)                        │              │
│              │ - [Form](../form)                        │              │
└──────────────┴─────────────────────────────────────────┴─────────────┘
```

| Region | Purpose |
| --- | --- |
| Top app bar | Brand + search + external links |
| Sidebar (left) | Site-wide navigation |
| Main content | The doc itself |
| TOC (right) | Within-page navigation |
| Footer (below content) | "See also", prev/next, edit on GitHub |

## Page metadata

Every doc page should have, in roughly this order:

1. **Title** (h1)
2. **Brief summary / lede** (1–2 sentences, what this is about)
3. **Status** (stable / beta / deprecated / experimental) — if applicable
4. **Last updated date** — small, in metadata strip
5. **Edit on GitHub** link — for community contributions

Optional:
- Reading time estimate
- Audience (beginner / intermediate / advanced)
- Prerequisites
- Related pages

## Naming conventions

Page URLs and titles matter for searchability + memorability:

| Good | Bad |
| --- | --- |
| `/components/button` | `/d/c/button-comp` |
| "Build your first chart" | "Tutorial 1" |
| "How to deploy" | "Deployment guide" (too generic) |
| "API: Authentication" | "Auth docs" |

Rules:
- **Lowercase, kebab-case** URLs.
- **Verb-led titles for tutorials/how-tos** ("How to deploy", not "Deployment").
- **Noun-led titles for reference/explanation** ("Authentication API", "Why Kafka").
- **No version numbers in URLs** (use a separate domain or path: `v2.docs.example.com`).

## Cross-linking strategy

Documents shouldn't be islands. Link liberally:

- **Inline links** when concept is mentioned: `...uses [tokens](../tokens) to...`
- **See also section** at the bottom of each page: 3–5 related pages.
- **Prerequisites** at the top: `This guide assumes familiarity with [tokens](../tokens).`
- **Next step / Continue** at the bottom for sequential content.

Don't:
- Link the same word multiple times in a paragraph.
- Link generic words ("the documentation says...") without context.
- Use "click here" / "this link" — bad for accessibility (screen readers read the link text alone).

## Search strategy

Most users search before browse. Good search needs:

- **Full-text search** of all docs (Algolia, MeiliSearch, Pagefind).
- **Search-as-you-type** with results dropdown.
- **Keyboard shortcut** (Cmd+K / Ctrl+K).
- **Result preview** with matched substring highlighted.
- **Categories** — "Component" vs "Tutorial" vs "API" labels.

Cite [`knowledge/patterns/search-ux.md`](search-ux.md) for the input UX. The IA piece is what gets indexed:

- All page text.
- Page titles (highest weight).
- Headings.
- Code samples (sometimes — depends on if your audience searches by code).
- Skip: nav text, footer, repeated chrome.

## Versioning

When the documented thing has versions (API v1 / v2, library 3.x / 4.x):

| Strategy | Use |
| --- | --- |
| **Latest only** | When version stability is high (Stripe API). |
| **Latest + previous** | Most common. Older versions accessible but not default. |
| **All versions** | When users span many versions (Django). |

URL strategies:
- `docs.example.com` (latest) + `docs-v1.example.com` (legacy)
- `docs.example.com/v2/` + `docs.example.com/v1/`
- Banner at top of older-version pages: "You're viewing v1. v2 docs are at..."

## Korean documentation

Per [`knowledge/i18n/korean-document-style.md`](../i18n/korean-document-style.md):

- Polite (`~합니다`) tone for technical docs.
- Casual (`~해요`) for getting-started / tutorials in consumer-facing products.
- Section headings in Korean, code in English (don't translate API names).
- 영문 약어 (acronyms) typically NOT translated: "API", "URL", "JSON" stay English.
- Long technical terms: provide Korean + English on first use, English thereafter ("애플리케이션 프로그래밍 인터페이스(API)").

## Migration / refactoring IA

When you rename a page:
1. **Don't break URLs.** Add a 301 redirect from old to new.
2. Update all internal links to the new URL.
3. Mention the rename in the changelog.

When you delete a page:
1. Add a 301 to the closest equivalent.
2. If no equivalent: redirect to the parent section.
3. Don't 404 — frustrates users.

When you reorganize the sidebar:
1. Rare. Big-bang reorgs disorient users with bookmarks.
2. If necessary: do it once, communicate clearly, accept the cost.
3. Don't reorganize quarterly.

## Templates per doc type

Each Diátaxis type has a canonical template:

### Tutorial template

```markdown
# Build your first <thing>

> Time: 15 minutes · Audience: New users

## What you'll build
[Screenshot / GIF of the end result]

## Prerequisites
- ...

## Step 1 — ...
[do this]
[expected result]

## Step 2 — ...
...

## What's next
- Try [related tutorial]
- Read [reference] for full API
```

### How-to template

```markdown
# How to <verb a goal>

When you need to: <use case>.

## TL;DR
[1-2 sentences with the core command/code]

## Steps
1. ...
2. ...

## Variations
- ...

## Common pitfalls
- ...
```

### Reference template

```markdown
# <Thing> API

| Method | Returns | Description |
|---|---|---|
| `getX()` | `X` | Get the X. |
| `setX(v)` | void | Set the X to v. |

## getX()
### Signature
### Parameters
### Returns
### Throws
### Examples
```

### Explanation template

```markdown
# Why <design decision>

## The problem
...

## What we considered
- Option A: ...
- Option B: ...

## What we chose
...

## Tradeoffs
...
```

Use these templates as starting points. They're not laws — adapt.

## Cross-reference

- [`knowledge/patterns/document-typography.md`](document-typography.md) — visual styling
- [`knowledge/patterns/technical-writing.md`](technical-writing.md) — voice and structure
- [`knowledge/patterns/search-ux.md`](search-ux.md) — search input pattern
- [`knowledge/i18n/korean-document-style.md`](../i18n/korean-document-style.md)
- [Diátaxis framework](https://diataxis.fr/) (the canonical reference)
