---
description: Generate documentation (tutorial / how-to / reference / explanation) from a one-paragraph brief. Picks the right Diátaxis type, applies template, follows technical-writing voice rules.
---

Apply the [`document-author` skill](../skills/document-author/PLAYBOOK.md) to the brief in `$ARGUMENTS`.

## Input

`$ARGUMENTS` should describe:
- What's being documented (component / API / process / decision)
- Type if known (tutorial / how-to / reference / explanation) — else infer
- Audience (beginner / intermediate / advanced; technical / non-technical)
- Locale (Korean / English / both)
- Length target (under 500 / standard / long-form)

If ambiguous: ask one clarifying question.

## Steps

1. Parse the brief into structured spec.
2. Determine Diátaxis type if not stated. If brief mixes types: split into multiple docs.
3. Apply [`skills/document-author/PLAYBOOK.md`](../skills/document-author/PLAYBOOK.md) end-to-end.
4. Output the markdown file with frontmatter.
5. Run the skill's verification phase.

## Examples

**Brief**: "Document our REST API authentication endpoint. POST /auth/login. For technical readers."
→ Reference doc with signature, parameters, returns, errors, examples.

**Brief**: "Walk a new user through their first chart in our analytics product. Korean, friendly tone."
→ Tutorial with step-by-step + Korean ~해요 voice + screenshots references.

**Brief**: "Why we chose ClickHouse over Postgres for analytics."
→ Explanation doc with problem / alternatives / decision / tradeoffs.

**Brief**: "How to deploy the staging environment."
→ How-to with TL;DR + steps + variations + pitfalls.

## Done when

- One markdown file (or multi-file directory if split needed).
- Matches the chosen Diátaxis template.
- Frontmatter complete.
- Code samples runnable.
- Cross-reference section included.
- Verification phase from `document-author` passes.
