# document-author — playbook

Write and structure technical or product documentation. Outputs ready-to-publish markdown matching one of the four Diátaxis types (tutorial / how-to / reference / explanation).

## When to use

- "Write a tutorial for getting started with our API"
- "Document the deployment process"
- "Create a reference for our SDK"
- "Write the 'why we chose Postgres' explainer"
- Any documentation work, technical or product-facing.

## Inputs (ask if missing)

1. **Type** — tutorial / how-to / reference / explanation. If unsure, see decision rules below.
2. **Topic** — what's being documented.
3. **Audience** — beginner / intermediate / advanced; technical / non-technical.
4. **Length** — under 500 words / standard (~1500) / long-form (~3000+).
5. **Locale** — Korean / English / both.
6. **Existing system** — design system / docs site to match style with.

## Steps

### 1. Pick the right Diátaxis type

If the user says "documentation," they often mean specifically:

| User says | They probably want |
| --- | --- |
| "How do I [verb a goal]?" | **How-to guide** |
| "Walk me through [feature]" | **Tutorial** |
| "What does [API/component/method] do?" | **Reference** |
| "Why did we [decision]?" | **Explanation** |

If genuinely mixed: **split into multiple docs** rather than one mongrel.

Cite [`knowledge/patterns/information-architecture.md`](../../knowledge/patterns/information-architecture.md) for type definitions.

### 2. Apply the right template

Open the template for the chosen type from [`knowledge/patterns/information-architecture.md`](../../knowledge/patterns/information-architecture.md):

- Tutorial: time estimate + audience + prerequisites + numbered steps + "what's next"
- How-to: TL;DR + steps + variations + pitfalls
- Reference: signature + parameters + returns + throws + examples per item
- Explanation: problem + alternatives + decision + tradeoffs

### 3. Write per voice rules

Cite [`knowledge/patterns/technical-writing.md`](../../knowledge/patterns/technical-writing.md):

- Active voice, second person, imperative for instructions.
- Sentences ≤ 25 words; one idea each.
- Cut throat-clearing on every pass.
- Concrete over abstract.
- Verb-strong.

For **Korean docs**: cite [`knowledge/i18n/korean-document-style.md`](../../knowledge/i18n/korean-document-style.md):
- 합쇼체 (~합니다) for formal / B2B / technical.
- 해요체 (~해요) for friendly / consumer / tutorials.
- Korean prose + English code identifiers.
- No italic on Hangul.

### 4. Add code samples

Cite [`knowledge/patterns/technical-writing.md`](../../knowledge/patterns/technical-writing.md) on code samples:
- Must run.
- Strip noise.
- Show context, not full files.
- Comment surprising lines inline.
- Simplest example that demonstrates.

For Korean docs: prose Korean, code English. Example:

```markdown
이 함수는 사용자 정보를 조회합니다.

```ts
const user = await getUserById("u_123");
console.log(user.email);
```

`getUserById`은 `User | null`을 반환합니다. 사용자가 존재하지 않으면 `null`입니다.
```

### 5. Add the right embellishments

| Type | Add | Skip |
| --- | --- | --- |
| Tutorial | Screenshots, "what you'll build" preview, encouraging callouts | Reference tables, dense API docs |
| How-to | TL;DR snippet, numbered steps, "common pitfalls" | Long preamble, motivation |
| Reference | Tables, code per signature, exhaustive | Narrative, "why we built this" |
| Explanation | Comparison tables, prose, citations | Step-by-step instructions |

Use `Callout` for important asides. See [`examples/component-callout.md`](../../examples/component-callout.md).

### 6. Layout for the medium

If the doc renders on a doc site (Docusaurus / Nextra / etc.): use MDX with the site's components.

If standalone markdown: plain markdown that renders on GitHub.

For long docs: include in-page TOC pattern that the [`component-doc-page.md`](../../examples/component-doc-page.md) describes (most doc sites auto-generate from h2/h3).

### 7. Write the metadata

Every doc page should have:

```markdown
---
title: <title>
description: <1-2 sentence lede>
type: tutorial | how-to | reference | explanation
audience: <who>
last_updated: 2026-05-08
---

# <Title>

<Lede paragraph — 1-2 sentences. What this doc is about.>

<Body...>

## Cross-reference

- [Related doc 1](path)
- [Related doc 2](path)
```

### 8. Cross-reference + cite

Every doc should:
- Link to **related docs** in the same site (cross-reference section at end).
- Cite **knowledge files** (in design-ai's case) or other authoritative sources.
- Link to upstream / official docs (e.g., MDN for web APIs).

## Verification phase (run before declaring done)

- [ ] Did I pick the right Diátaxis type, or split into multiple docs?
- [ ] Did I follow the type's template?
- [ ] Did I cite relevant knowledge files (`knowledge/patterns/document-typography.md`, etc.)?
- [ ] Are sentences ≤ 25 words and one-idea-each?
- [ ] Are code samples runnable + minimal?
- [ ] If Korean: is voice level (~합니다 vs ~해요) consistent throughout?
- [ ] Do I have a "Cross-reference" section linking related docs?
- [ ] Did I avoid throat-clearing intros / conclusions?
- [ ] Is the lede answer-led, not preamble?

## Source files this skill reads

- [`knowledge/patterns/document-typography.md`](../../knowledge/patterns/document-typography.md)
- [`knowledge/patterns/information-architecture.md`](../../knowledge/patterns/information-architecture.md)
- [`knowledge/patterns/technical-writing.md`](../../knowledge/patterns/technical-writing.md)
- [`knowledge/patterns/report-design.md`](../../knowledge/patterns/report-design.md) — for report-style docs
- [`knowledge/i18n/korean-document-style.md`](../../knowledge/i18n/korean-document-style.md) — Korean conventions
- [`examples/component-callout.md`](../../examples/component-callout.md) — for callouts
- [`examples/component-doc-page.md`](../../examples/component-doc-page.md) — for layout

## Done when

- One markdown file (or set of files for a multi-doc deliverable).
- Frontmatter complete.
- Lede paragraph leads with the answer / what this is.
- Body matches the chosen Diátaxis template.
- Code samples are runnable.
- Cross-reference section links related docs.
- Verification phase passes.
