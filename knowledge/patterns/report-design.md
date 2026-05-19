<!-- hand-written -->
---
title: Report design — research, audit, executive summary
applies_to: [reports, audits, research-findings, executive-summaries]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Report design

Reports are documents that **deliver findings** to a specific audience. Different from product docs (no API to look up) and from articles (purpose is decision, not exploration).

## Three report archetypes

| Type | Audience | Length | Decision driven |
| --- | --- | --- | --- |
| **Research findings** | Cross-functional team, leadership | 5–15 pages | "What did we learn?" → next steps |
| **Audit / assessment** | Engineering, design, product | 3–10 pages | "What's broken?" → fixes |
| **Executive summary** | Senior leadership | 1–3 pages | "Should we act?" → decision |

design-ai produces all three:
- `skills/ux-audit` → audit report
- `skills/design-system-qa` → audit report
- `skills/design-critique` → assessment report
- Custom: research synthesis from user interviews, surveys

## The pyramid principle

Every report follows the **inverted pyramid**:

```
┌─────────────────────────────────────┐
│ TL;DR — the answer / recommendation  │   ← what you'd tell someone in a hallway
├─────────────────────────────────────┤
│ Key findings (3–5 bullets)           │   ← what supports the answer
├─────────────────────────────────────┤
│ Detail / evidence per finding        │   ← prose backup
├─────────────────────────────────────┤
│ Methodology / appendix               │   ← how you got there
└─────────────────────────────────────┘
```

Senior readers stop at TL;DR. Engineers might read findings + relevant details. Stakeholders cherry-pick. **All audiences served by the same doc**.

This is **opposite of academic writing** (which builds context first, conclusion last). Reports lead with the answer.

## Report anatomy — full template

```markdown
# Report title

> Date: 2026.05.08
> Author: [name / agent]
> Audience: [team / role]
> Status: [draft / final / archived]

## TL;DR

[One paragraph answer. If the reader reads only this, they have what they need.]

## Key findings

1. **Finding 1 (bold lede)**. Quick supporting evidence. Severity if applicable.
2. **Finding 2**. ...
3. **Finding 3**. ...

## Recommendations

1. [Action] — owner: [name] — by: [date]
2. ...

---

## Detail

### Finding 1: [title]

[Multi-paragraph evidence, citations, examples.]

### Finding 2: [title]

...

## Methodology

[How the findings were derived. Sources, sample size, dates.]

## Appendix

- Raw data
- Detailed examples
- Cited sources
```

## TL;DR — the most important paragraph

Spend 30% of editing time on this. It's the only paragraph many readers will read.

### Rules

- **One paragraph.** Five sentences, max.
- **Lead with the answer.** "Yes, we should ship the redesign." or "The dashboard has 12 critical issues."
- **Numbers if applicable.** "47 components affected." "Cuts conversion by 8%."
- **No methodology.** "We tested with 12 users and..." — that's the Methodology section.
- **No marketing prose.** No "exciting" or "leverages synergy".

### Example TL;DR

```
Bad:
> This report explores the user journey through our checkout flow,
> based on extensive research with multiple users across various
> device types, and provides recommendations for improvement.

Good:
> The current checkout flow loses 32% of users at the address step.
> Three causes: required fields aren't visually distinct, the postal
> code lookup is slow, and validation fires too aggressively. Fixing
> these would recover an estimated $2.4M / year in lost orders.
```

The good version: question answered, scope clear, magnitude shown, action implied.

## Severity / impact ratings

For audit reports, classify findings consistently. Per [`knowledge/patterns/design-system-qa.md`](design-system-qa.md):

| Severity | Definition |
| --- | --- |
| 🔴 Critical | Blocks the goal OR fails compliance (a11y, security, legal). Must fix. |
| 🟠 High | Significantly slows / confuses. Fix this cycle. |
| 🟡 Medium | Inconsistency, minor friction. Schedule. |
| 🟢 Low | Polish, suggestion. Backlog. |

Always include severity counts in the TL;DR or Findings header:

```
## Findings (3 critical, 5 high, 2 medium)
```

## Visual style for reports

### Typography

Body 16–18px (lighter than full document — readers skim).
Headings smaller relative to body than in marketing docs (skim, not deep read).

### Color

| Use | Color |
| --- | --- |
| Severity (Critical) | `--color-error` |
| Severity (High) | `--color-warning` |
| Severity (Medium) | `--color-info` |
| Severity (Low) | `--color-text-tertiary` |
| Body text | `--color-text-primary` |
| Quotes / pull-out | `--color-bg-subtle` background |
| Charts | per [`chart-color-encoding.md`](chart-color-encoding.md) |

Avoid full-page color (e.g., red-banner for critical). Reports are sober documents.

### Layout

- Single-column body.
- Max-width ~720px (long-form reading width).
- Generous margins (top/bottom).
- Charts inline at body width, not full-bleed.
- Tables: clean, minimal borders.

## Charts in reports

Charts in reports differ from charts in dashboards (which differ from charts in slides):

| Context | Chart style |
| --- | --- |
| **Dashboard** | Live, interactive, dense | Many series, hover for detail |
| **Report** | Static, contextual | One message per chart, headline + chart |
| **Slide** | Static, glance-only | Most-stripped version, big takeaway |

Report chart conventions:
- Always include a chart title that's the **finding** ("Conversion drops at address step").
- Provide a 1–2 sentence caption below.
- Reference data source: "Source: Mixpanel, May 2026".
- Avoid 3D, decorative effects, gradient backgrounds.

## Citations

Reports must be citable. Every claim has a source:

| Claim type | Source format |
| --- | --- |
| Internal data | "Mixpanel event 'checkout_complete', n=12,453, 2026-04 to 2026-05" |
| User research | "Interview transcripts, 12 participants, 2026-04-15 to 2026-04-22" |
| Industry benchmark | "Baymard Institute checkout study, 2024 (link)" |
| Knowledge file | `knowledge/patterns/form-design.md` |

Don't claim without a source. Even "common knowledge" — say where you got it.

## Audit report specifically

For design-ai audit outputs (`skills/ux-audit`, `skills/design-system-qa`), use this canonical format:

```markdown
# UX Audit: <artifact>

> Reviewed: 2026.05.08 · Reviewer: design-ai
> Goal: <one sentence>
> Platform: <web / mobile / etc.>

## Summary
- 🔴 Critical: <n> (must fix before ship)
- 🟠 High: <n>
- 🟡 Medium: <n>
- 🟢 Low: <n>

## Top recommendation
[Single most important action.]

## Critical (must fix)

### 1. [Finding title]
**Where**: src/Button.tsx:23
**Issue**: <what's broken>
**Why**: <impact>
**Fix**: <specific recommendation>
**Reference**: [knowledge/colors/color-theory.md](...)

### 2. ...

## High
...

## Medium
...

## Low
...

## Things that work well
- [genuine praise — keeps the report constructive]
- ...

## Methodology
- Tools: axe-core, manual review
- Pages reviewed: dashboard, settings, profile
- Reviewed against: knowledge/PRINCIPLES.md, WCAG 2.1 AA
```

This format is consistent across all audit outputs. The system spec it well in `skills/ux-audit/PLAYBOOK.md`.

## Research findings report

Different from audit — synthesizes user research:

```markdown
# Research: [topic]

> Method: [interviews / survey / usability test]
> Participants: [count + demographics]
> Date: [start - end]

## TL;DR
...

## Key findings (themes)

### Theme 1: [name]
> "Quote that exemplifies this theme."
> — Participant 4

[Synthesis: how many participants raised this, what's the underlying pattern.]

### Theme 2: ...

## Recommendations

| Recommendation | Severity | Owner | Due |
| --- | --- | --- | --- |
| ... | High | Design | 2026.06.01 |

## Methodology

- Recruitment: [how participants were chosen]
- Protocol: [what was asked / observed]
- Analysis: [how raw data became themes]

## Appendix

- Raw notes [link]
- Screen recordings [link]
- Survey data [link]
```

## Korean reports

Korean business reports (보고서) tend to be **more formal and dense** than Western:

- 존댓말 always (~합니다, ~입니다).
- Numbered hierarchical sections (1, 1.1, 1.1.1).
- Numbered findings (가, 나, 다 OR 1, 2, 3).
- Conservative palette.
- Often: a 표지 (cover page) with org logo + report title + date — not common in Western SaaS.
- Acronyms English unless universally Korean (e.g., "AI" stays "AI", "사용자" stays Korean).

Korean fintech / startup reports trend lighter (Toss-style):
- Big numbers, lots of whitespace.
- Short paragraphs.
- Minimalist palette.

## Don't

- Don't bury the answer in paragraph 5 of the executive summary.
- Don't include methodology before findings (academic, wrong for reports).
- Don't omit numeric impact ("affects users" → "affects 12% of users").
- Don't use marketing language in audit findings.
- Don't apologize for findings ("unfortunately, we found..." — neutral tone).
- Don't deliver a 50-page report when 5 would suffice.
- Don't present 8+ recommendations — prioritize ruthlessly. Top 3 actionable.
- Don't omit citations.

## Cross-reference

- [`knowledge/patterns/document-typography.md`](document-typography.md) — visual styling
- [`knowledge/patterns/technical-writing.md`](technical-writing.md) — voice and structure
- [`knowledge/patterns/information-architecture.md`](information-architecture.md) — for longer reports
- [`knowledge/patterns/chart-color-encoding.md`](chart-color-encoding.md) — charts in reports
- [`knowledge/patterns/design-system-qa.md`](design-system-qa.md) — audit-specific format
- [`skills/ux-audit/PLAYBOOK.md`](../../skills/ux-audit/PLAYBOOK.md) — audit skill
- [`skills/design-critique/PLAYBOOK.md`](../../skills/design-critique/PLAYBOOK.md) — critique skill
