---
description: Comprehensive design review — runs UX audit + a11y review + design critique in parallel and combines into one report.
---

You will produce a comprehensive design review of the artifact provided in `$ARGUMENTS`. The artifact may be a screenshot, Figma link, live URL, or HTML/code snippet.

## Steps

1. Identify the artifact, the user goal it serves, the platform (web / mobile / responsive), and the audience.

2. Spawn three reviews **in parallel** as subagents:
   - `agents/design-critic.md` — hierarchy, craft, decisions, top recommendation.
   - `agents/a11y-reviewer.md` — WCAG 2.1/2.2 AA pass, keyboard, focus, contrast, semantics.
   - Apply [`skills/ux-audit/PLAYBOOK.md`](../skills/ux-audit/PLAYBOOK.md) directly — UX best-practice issue catalog.

   For non-Claude-Code agents that can't spawn subagents, run the three sections sequentially in the same prompt.

3. Combine the three outputs into one report:

```markdown
# Design review: <artifact>

> Goal: <one sentence>
> Platform: <platform>
> Reviewer: design-review skill (critic + a11y + ux)

## Top recommendation
<single sentence — the design-critic's top recommendation>

## Critical (a11y + UX combined, n)
<all 🔴 issues from a11y-reviewer + ux-audit>

## High (n)
...

## Medium (n)
...

## Low (n)
...

## Hierarchy walk
<from design-critic>

## Craft notes
<from design-critic>

## Things that work well
<combined praise from all three>
```

4. **Deduplicate**: if a11y and ux both flag the same issue (e.g., "no focus indicator on button"), merge into one entry citing both severity rationales.

5. **Sort within each severity**: a11y issues first (legal/baseline), then UX, then craft. Surface the issues most blocking to the user goal at the top of each severity.

## Done when

- One report file produced.
- All three lenses are reflected.
- Top recommendation is a single sentence at the top.
- No duplicate issues.
- Praise section keeps the report constructive.
