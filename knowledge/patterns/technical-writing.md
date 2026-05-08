<!-- hand-written -->
---
title: Technical writing — voice, structure, common pitfalls
applies_to: [docs, technical-writing, api-docs, guides]
---

# Technical writing

The non-design half of documentation: how to write the words. Same readers will judge your docs primarily by readability, not visuals.

## The four virtues

| Virtue | Means |
| --- | --- |
| **Clarity** | One reading is enough. No ambiguity. |
| **Concision** | Every word earns its place. Trim relentlessly. |
| **Completeness** | Cover all the user needs to know — no surprises. |
| **Correctness** | Code samples actually work. Numbers are right. |

Hierarchy: clarity > concision > completeness > correctness. The first three are writing; the fourth is QA.

## Voice

### Active over passive

| Active | Passive |
| --- | --- |
| The handler returns a Promise. | A Promise is returned by the handler. |
| Set the API key in `.env`. | The API key should be set in `.env`. |

Active is shorter, clearer, and identifies the actor. Passive obscures who/what.

Exception: when the actor is unknown or irrelevant ("The function is called when the page loads.").

### Second person ("you") over third

| Second person | Third / first |
| --- | --- |
| You configure the route. | One configures the route. / We configure the route. |
| You'll see an error. | The user will see an error. |

Direct address is friendlier. Avoid "we" except in tutorial contexts ("Let's build it.").

### Imperative for instructions

| Imperative | Wordy |
| --- | --- |
| Save the file. | You should save the file. |
| Run `npm install`. | The next thing to do is to run `npm install`. |

Strip the throat-clearing.

## Sentence-level rules

| Rule | Example |
| --- | --- |
| **Short sentences** (15–20 words ideal, 25 max) | A 50-word sentence usually has at least three sentences hidden inside it. |
| **One idea per sentence** | Don't pack multiple thoughts into commas-and-clauses. |
| **No throat-clearing** | "It is important to note that…" → cut. |
| **Concrete over abstract** | "Faster page loads" not "improved performance characteristics". |
| **Verb-strong** | "X validates Y" not "X performs validation on Y". |

### Trimmable phrases

These add no information; cut on first edit:

```
in order to → to
make use of → use
due to the fact that → because
in the event that → if
at this point in time → now
the question as to whether → whether
prior to → before
subsequent to → after
take action / take steps → act
```

## Headings

Headings are scan-bait. Make them work.

### Be specific

| Vague | Specific |
| --- | --- |
| Background | Why we use Postgres |
| Configuration | Configure your API key |
| Considerations | Tradeoffs of caching |

### Match the reader's question

For tutorials/how-tos: heading = the user's question.

| Reader's mental question | Heading |
| --- | --- |
| "How do I deploy this?" | How to deploy |
| "What's a token?" | What is a design token? |
| "When should I use this?" | When to use color-palette |

### No clickbait

Documentation isn't blog. "10 things you didn't know about X" is wrong.

## Lists

Use bulleted/numbered lists for:
- Sequential steps (numbered).
- Parallel options (bulleted).
- More than 3 items inline that breaks reading flow.

Don't use lists for:
- Two items (write as a sentence: "Option A and option B").
- Prose disguised as bullets (the items are full paragraphs — they should be paragraphs).

### List parallelism

All items in a list start with the same part of speech:

```
✓ Bulleted (verb-led):
- Validate the input
- Save to database
- Return the response

✗ Mixed:
- Validate the input
- The data goes to the database
- Returns the response
```

## Code samples

Code samples in docs need their own discipline.

### Rules

- **They must run.** Test every code sample. Stale samples are worse than none.
- **Include imports.** Don't show `myFunction()` and assume reader knows where it's from.
- **Show context, not full files.** Strip noise. Show what matters.
- **Comment surprising lines** inline, not in surrounding prose.
- **Use the simplest example that demonstrates the point.** Don't show 50 lines when 5 will do.

### Bad code sample (too much)

```ts
// Configure the entire app
import { App } from "@my/framework";
import { ConfigProvider } from "@my/config";
import { Theme } from "@my/theme";
// ... 20 more imports

const app = new App({
  // ...50 lines of unrelated config
  authToken: process.env.AUTH_TOKEN,
  // ...50 more lines
});
```

### Good code sample (focused)

```ts
import { App } from "@my/framework";

const app = new App({
  authToken: process.env.AUTH_TOKEN,  // see "Auth setup" below
});
```

The principle: code samples illustrate; they don't replace.

## Voice for different doc types

Per [`knowledge/patterns/information-architecture.md`](information-architecture.md):

| Type | Voice |
| --- | --- |
| **Tutorial** | Friendly, encouraging, hand-holding. "Let's", "you'll", "great job". |
| **How-to** | Direct, imperative, no fluff. "Run", "set", "verify". |
| **Reference** | Neutral, terse, exhaustive. "Returns…", "Throws if…". |
| **Explanation** | Discursive but rigorous. "We chose X because Y, accepting tradeoff Z". |

A reference page that reads like a tutorial is wrong. So is the reverse.

## "Don't" sections

A "Don't" section in any doc is high-leverage. Lists 2–3 misuses with reasoning.

```markdown
## Don't

- Don't use this for X — use Y instead. (X has a different semantic.)
- Don't combine X with Y — leads to ambiguity in result.
- Don't omit the Z step — silently fails on edge cases.
```

The reader saves a debug session for every "don't" they read.

## Acronyms and jargon

| Rule | Example |
| --- | --- |
| Spell out on first use | "JSON Web Token (JWT)" |
| Then use acronym | "...the JWT contains..." |
| Define jargon if not universal | "(in this app, *namespace* means a Kubernetes namespace, not a JS namespace)" |
| Don't define what every reader knows | "JSON (JavaScript Object Notation)" — overkill for technical docs |

For Korean docs: Anglo acronyms are usually NOT translated. "API", "URL", "OAuth", "PDF" stay English.

## Numbers and units

| Rule | Example |
| --- | --- |
| Spell out one through nine; numerals 10+ | "three components", "47 errors" |
| Always numeral with units | "5 ms" (not "five milliseconds") |
| Always numeral in code/CLI/config | `--port 3000` |
| Korean: numerals always | "거래 5건", not "다섯 건" |

Use SI / standard units. Don't invent abbreviations.

## Errors and edge cases

When documenting error states, include:
- **What error**: the exact message or HTTP status.
- **What it means**: plain language.
- **What caused it**: most likely root cause.
- **How to fix**: actionable step.

```
Error: "Token expired"
Status: 401 Unauthorized

What it means: your authentication token is past its valid period.
Cause: tokens expire every 24 hours by default.
Fix: refresh the token via /auth/refresh, OR re-authenticate.
```

## Examples placement

Each major concept should have an example:
- **At the top** — quick "this is what you do" snippet, before the deep explanation.
- **Inline** — small examples woven into prose.
- **At the end** — a complete, runnable example pulling it all together.

A doc with no examples is a doc users skim and bounce from.

## Korean technical writing conventions

Per [`knowledge/i18n/korean-document-style.md`](../i18n/korean-document-style.md):

- 존댓말 (`~합니다` / `~입니다`) for technical docs.
- 반말 (`~해요`) for friendly tutorials in consumer products.
- Code identifiers stay English (`API`, `function name`, etc.).
- Korean explanation, English code: standard pattern.
- Punctuation: Korean ones (。、) for purely Korean prose; Latin (.,) when mixed with code/identifiers.

Common patterns:
- "이 함수는 ... 반환합니다." (This function returns ...)
- "다음과 같이 사용하세요:" (Use as follows:)
- "주의: ..." (Note: ...)

## Common technical writing mistakes

- **Throat-clearing intros**: "In this section, we will discuss…"
- **Future tense for behavior**: "The function will return…" → "returns"
- **Hedging**: "may possibly return" → "returns" (or document "returns null when…")
- **Author voice intrudes**: "I think this is the best approach."
- **Vague pronouns**: "It does this" — unclear what "it" refers to.
- **Inconsistent terminology**: "user" / "customer" / "account" mixed without clear distinction.
- **Repeating information** in multiple sections without cross-linking.
- **No examples** for abstract concepts.
- **Stale examples** (out-of-date code that no longer runs).
- **Marketing language in technical docs**: "revolutionary new way to…" — strip it.

## Editing pass — do this every time

After drafting, edit in two passes:

### Pass 1 — content

- Is each paragraph necessary?
- Is the structure clear (intro → body → next-step)?
- Is each example correct + minimal?
- Is the voice right for the doc type?

### Pass 2 — line by line

- Cut throat-clearing.
- Cut redundant words.
- Replace passive with active.
- Replace abstract with concrete.
- Trim sentences > 25 words.
- Verify code samples run.

A doc that's been edited twice reads 30% shorter than the first draft. That's the win.

## Cross-reference

- [`knowledge/patterns/document-typography.md`](document-typography.md) — visual styling
- [`knowledge/patterns/information-architecture.md`](information-architecture.md) — structure
- [`knowledge/i18n/korean-document-style.md`](../i18n/korean-document-style.md) — Korean conventions
- [The Documentation System](https://documentation.divio.com/) — Diátaxis origin
- [Google Developer Documentation Style Guide](https://developers.google.com/style)
