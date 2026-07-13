# website-improvement — playbook

Plan and coordinate professional website implementation and improvement work. This includes building a new homepage and refactoring an existing site. The skill does not modify the target website repository directly; it prepares the audit, MCP readiness, task plan, prompts, and approval-gated handoff that another agent can execute in the target repo.

## When to use

- "Improve this homepage."
- "Build this homepage in our product repo."
- "Refactor the existing homepage without replacing our design system."
- "Audit our website before a redesign sprint."
- "Create a Codex prompt to refactor the pricing page."
- "Plan MCP setup for a site improvement project."
- "Turn website audit findings into implementation tasks."

## Inputs

1. **Site Profile** — name, repo URL/local path, live URL when a preview or deployed site exists, priority pages, user flows, Figma URL, brand notes, deploy provider, Sentry, CMS, database, and target viewports.
2. **Audit findings** — visual design, UX flow, responsive QA, accessibility, performance, SEO, technical quality, runtime issues, and content quality.
3. **MCP readiness** — GitHub, Figma, Browser/Playwright, Chrome DevTools, deploy provider, Sentry, database, CMS, collaboration, and research status.
4. **Execution target** — Codex for repo work, Claude for design/research/copy review, or final handoff.
5. **Reference set** — optional competitor sites, inspiration repos, pattern libraries, or Korean app examples to mine for taxonomy and constraints.

## Steps

### 1. Establish the Site Profile

Capture only operational metadata needed for planning. Do not copy private source code into design-ai. Treat Figma URLs, repo paths, Sentry project names, CMS details, and local filesystem paths as sensitive project metadata.

### 2. Run the Audit Pipeline

Evaluate each category and record findings:

| Category | Check |
| --- | --- |
| Visual Design | Layout, type, color, spacing, visual hierarchy |
| UX Flow | Navigation, CTA, forms, conversion flow, confusion points |
| Responsive QA | Desktop, tablet, mobile layout and text wrapping |
| Accessibility | Keyboard, focus, contrast, semantic HTML, ARIA |
| Performance | Core Web Vitals, images, bundle size, render bottlenecks |
| SEO | Title, description, headings, canonical, OG, sitemap |
| Technical Quality | Component structure, style duplication, dead code, dependency risk |
| Runtime Issues | Console errors, network errors, hydration issues, broken assets |
| Content Quality | Copy clarity, IA, proof, trust, CTA language |

Use the relevant design-ai knowledge files when making judgments:

- [`knowledge/PRINCIPLES.md`](../../knowledge/PRINCIPLES.md)
- [`knowledge/patterns/ux-guidelines.md`](../../knowledge/patterns/ux-guidelines.md)
- [`knowledge/a11y/contrast.md`](../../knowledge/a11y/contrast.md)
- [`knowledge/a11y/keyboard-and-focus.md`](../../knowledge/a11y/keyboard-and-focus.md)
- [`knowledge/layout/spacing-and-grid.md`](../../knowledge/layout/spacing-and-grid.md)
- [`knowledge/typography/type-scale-fundamentals.md`](../../knowledge/typography/type-scale-fundamentals.md)
- [`knowledge/patterns/technical-writing.md`](../../knowledge/patterns/technical-writing.md)
- [`knowledge/patterns/report-design.md`](../../knowledge/patterns/report-design.md)
- [`knowledge/patterns/agentic-design-workflows.md`](../../knowledge/patterns/agentic-design-workflows.md)

### 2.5. Mine References Without Copying Them

When the user supplies inspiration repos or sites, treat them as reference taxonomy, not a source of UI to clone. For each reference, capture:

- pattern category: flow, component, layout, motion, artifact contract, or operational workflow
- reusable rule in your own words
- local mapping: audit category, refactor task, prompt, or verification check
- explicit "do not copy" boundary

For Korean product references, map examples by industry -> flow -> component before making a recommendation. Do not claim a market convention from one app.

### 3. Classify MCP Readiness

Set each MCP to one of:

- `required` — needed before implementation or verification can be trusted.
- `optional` — useful, but a manual fallback is acceptable.
- `unused` — not relevant to this site/project phase.
- `unavailable` — relevant, but not connected; mention as a risk.

Do not invent live MCP results. If a tool was not actually connected and checked, state that it is readiness planning only.

### 4. Generate Refactor Tasks

Convert findings into task units with:

- problem
- evidence
- impact
- effort
- priority
- related pages
- related MCP
- Codex implementation prompt
- verification method
- risks

Tasks should be scoped enough for Codex to run in the target website repo after repo intake. Avoid tasks that mix unrelated design, copy, and technical work unless they are one user-flow fix.

### 5. Generate Prompts

Generate the appropriate prompt:

- Codex repo intake
- Codex implementation
- Codex visual QA
- Codex deployment verification
- Claude design review
- Claude competitor research
- Claude copy/UX critique
- final handoff report

Every Codex prompt must say that the work happens in the target website repo and must preserve the target repo's architecture, components, state patterns, styling conventions, and verification commands.

For prompts that create issues, pages, messages, deployments, or other external writes, include an explicit human approval gate. The prompt should show destination, action summary, verification plan, and a Create/Cancel or proceed/stop boundary before the write.

### 5.5. Hand Off To The Target Repository

Use the verified bundle as the implementation boundary:

1. Generate and strictly verify the local bundle.
2. Call `design_ai_site_bundle_handoff` with the absolute bundle directory, or run the equivalent `design-ai site <bundle-dir> --bundle-handoff --strict --json` command.
3. Confirm that the returned approval state is `pending-human-approval` and that both external calls and target-repo mutation remain false.
4. Let the consuming agent inspect the target repository read-only and present the exact files, scope, risks, and verification commands.
5. Stop until the user explicitly approves the selected task and target repository.
6. After approval, implement in the target repo and collect browser evidence at desktop, tablet, and mobile viewports plus keyboard/focus, contrast, screen-reader, lint, test, and build evidence where applicable.
7. Ask again before any broader scope, new dependency, migration, deploy, commit, push, or external write.

The MCP tool transports a verified execution contract. It does not grant implementation authority and never edits the target repository itself.

### 6. Produce Handoff Report

The report should include target site information, diagnostic summary, major issues, priority recommendations, executed work, verification results, remaining risks, and next tasks.

## Output Template

Use [`TEMPLATE.md`](TEMPLATE.md) for the final report or planning artifact.

## Verification phase

- [ ] Site Profile includes a target repo reference, pages, user flows, viewports, platform notes, and a live URL when a preview or deployed site exists.
- [ ] Audit categories cover visual, UX, responsive, accessibility, performance, SEO, technical, runtime, and content quality.
- [ ] MCP readiness uses only `required`, `optional`, `unused`, or `unavailable`.
- [ ] Refactor tasks include problem, evidence, impact, effort, priority, pages, MCP, prompt, verification, and risks.
- [ ] External references were mined into taxonomy/rules, with a clear do-not-copy boundary.
- [ ] Codex prompts clearly state that implementation happens in the target website repo.
- [ ] The target-repo handoff identifies the selected task and remains pending until explicit human approval.
- [ ] Homepage build/refactor tasks require real browser checks at desktop, tablet, and mobile viewports.
- [ ] Any external write or publish path includes an approval or verification gate.
- [ ] Handoff report includes verification evidence or explicit placeholders for evidence not yet run.
- [ ] Accessibility, responsive, and source-grounding notes are present.

## Done when

- One Website Improvement plan or handoff report is produced.
- The plan can be executed by Codex in the target repo without requiring design-ai to contain the target source.
- The MVP boundary is explicit: no automatic crawling, unapproved external writes, model training, embeddings, or target repo mutation from design-ai.
