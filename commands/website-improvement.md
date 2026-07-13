---
description: Plan a website improvement project with Site Profile, audit checklist, MCP readiness, refactor tasks, prompts, and handoff report.
---

You will produce a Website Improvement plan for the site described in `$ARGUMENTS`. This includes new homepage implementation and existing homepage refactoring. The target website source code does not live in design-ai; implementation happens later in the target website repository after explicit human approval.

## Steps

1. Read the workflow source:
   - `skills/website-improvement/PLAYBOOK.md`
   - `skills/website-improvement/TEMPLATE.md`
   - `knowledge/PRINCIPLES.md`
   - `knowledge/patterns/ux-guidelines.md`
   - `knowledge/a11y/contrast.md`
   - `knowledge/a11y/keyboard-and-focus.md`
   - `knowledge/layout/spacing-and-grid.md`
   - `knowledge/patterns/report-design.md`
   - `docs/MCP-INTEGRATION.md`

2. Build a Site Profile:
   - site name
   - live URL when a preview or deployed site exists
   - repo URL or local path
   - priority pages
   - Figma URL
   - brand/design notes
   - deploy provider
   - Sentry project
   - CMS and database
   - user flows
   - desktop/tablet/mobile viewports

3. Create an Audit Checklist across:
   - Visual Design
   - UX Flow
   - Responsive QA
   - Accessibility
   - Performance
   - SEO
   - Technical Quality
   - Runtime Issues
   - Content Quality

4. Create an MCP Readiness Matrix. Use only `required`, `optional`, `unused`, or `unavailable`. Do not claim live MCP access unless the current agent actually has it.

5. Convert findings into Refactor Tasks. Each task must include:
   - problem
   - evidence
   - impact
   - effort
   - priority
   - pages
   - recommended MCP
   - Codex prompt
   - verification
   - risks

6. Generate prompt templates for:
   - Codex repo intake
   - Codex implementation
   - Codex visual QA
   - Codex deployment verification
   - Claude design review
   - Claude competitor research
   - Claude copy/UX critique
   - final handoff report

7. Draft the Handoff Report with target site information, diagnostic summary, priority recommendations, executed work placeholders, verification placeholders, remaining risks, and next actions.

8. Prepare target-repo execution in two phases:
   - Phase A is read-only: verify the local handoff bundle, call `design_ai_site_bundle_handoff` or run the equivalent `design-ai site <bundle-dir> --bundle-handoff --strict --json`, inspect the target repo, and present exact scope, risks, files, and verification commands.
   - Phase B starts only after explicit human approval: implement in the target repo, preserve its architecture and design system, and collect browser, accessibility, responsive, lint, test, and build evidence.
   - Request approval again before adding dependencies, widening scope, migrating data, deploying, committing, pushing, or performing another external write not covered by the original approval.

## Output

Follow `skills/website-improvement/TEMPLATE.md`. Keep the report dense and operational. Cite checked knowledge files when making design, accessibility, UX, or report-structure recommendations.

## Done when

- The artifact can be checked with `design-ai check output.md --route website-improvement --strict`.
- The MCP handoff returns a pending human-approval contract and does not mutate the target repo.
- The MVP boundary is explicit: no automatic crawling, unapproved external writes, target repo mutation from design-ai, embeddings, fine-tuning, or backend sync.
