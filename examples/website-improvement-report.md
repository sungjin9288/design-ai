# Website Improvement Plan: Korean SaaS Marketing Site

> Live URL: `https://example.com`
> Target repo: `https://github.com/acme/korean-saas-site`
> Viewports: desktop / tablet / mobile
> Status: planning

## Site Profile

- Name: Korean SaaS Marketing Site
- Live URL: `https://example.com`
- Repo URL: `https://github.com/acme/korean-saas-site`
- Local path: `/Users/team/dev/korean-saas-site`
- Figma URL: `https://figma.com/file/example`
- Deploy provider: Vercel
- Sentry project: `acme/korean-saas-web`
- CMS: Sanity
- Database: none
- Priority pages: `/`, `/pricing`, `/signup`, `/docs`
- Primary user flows: visitor compares pricing and starts signup; existing customer finds proof before contacting sales
- Brand/design notes: restrained B2B SaaS tone, Pretendard typography, dense Korean product UI, indigo accent for action/focus only

## Audit Summary

| Category | Status | Key findings |
| --- | --- | --- |
| Visual Design | in-progress | Hero CTA hierarchy is weak; primary and secondary actions compete. |
| UX Flow | not-started | Pricing-to-signup path needs Browser verification before implementation. |
| Responsive QA | not-started | Desktop, tablet, and mobile viewports need explicit QA because long Korean labels may wrap. |
| Accessibility | not-started | Mobile menu focus state, keyboard path, ARIA state, and screen-reader announcement behavior are not documented. |
| Performance | not-started | Run Lighthouse in the target repo or preview deploy before claiming Core Web Vitals. |
| SEO | not-started | Check title, description, canonical, OG metadata, sitemap, and heading order. |
| Technical Quality | not-started | Inspect component reuse before changing layout or adding styles. |
| Runtime Issues | not-started | Browser/Chrome DevTools should confirm console, network, hydration, and broken assets. |
| Content Quality | in-progress | Pricing page does not explain plan fit in the first viewport. |

## MCP Readiness

| MCP | Status | Reason |
| --- | --- | --- |
| GitHub | required | Target repo intake and PR review need repository context. |
| Figma | optional | Useful for checking design-token intent, but manual screenshot review can work. |
| Browser/Playwright | required | Responsive and runtime verification need real page interaction. |
| Chrome DevTools | optional | Needed for deeper console, network, and performance debugging. |
| Deploy | required | Vercel preview verifies real runtime output before handoff. |
| Sentry | optional | Useful for production errors, but not required for first planning pass. |
| Database | unused | Public marketing pages do not depend on direct database inspection. |
| CMS | optional | Sanity content may affect copy and information architecture. |
| Collaboration | optional | Use Notion/Slack/Linear only after findings are accepted. |
| Research | optional | Competitor research can improve messaging but is separate from implementation. |

## Refactor Plan

### [P1] Clarify homepage CTA hierarchy

- Category: Visual Design
- Problem: Primary and secondary actions compete in the hero, weakening the first visitor decision.
- Evidence: Visual Design finding from the console audit.
- Impact: high
- Effort: medium
- Pages: `/`
- Recommended MCP: Browser/Playwright, Figma
- Codex prompt: Inspect the target homepage implementation, reuse existing layout and token patterns, and revise the hero CTA hierarchy so the primary signup action is visually dominant while the secondary action remains available.
- Verification: run target repo lint/build; verify desktop/tablet/mobile hero layout; confirm keyboard focus and 4.5:1 body text contrast per `knowledge/a11y/contrast.md`.
- Risks: copy and conversion changes may require stakeholder approval.

### [P0] Document and verify mobile menu focus behavior

- Category: Accessibility
- Problem: The mobile menu focus path is not documented, so keyboard users may lose navigation context.
- Evidence: Accessibility finding from the console audit.
- Impact: high
- Effort: medium
- Pages: `/`, `/pricing`, `/signup`
- Recommended MCP: Browser/Playwright, Chrome DevTools
- Codex prompt: Inspect the mobile navigation component in the target repo. Preserve existing state management and styling conventions while adding or fixing keyboard reachability, visible focus, Escape/close behavior, and screen-reader labels.
- Verification: tab through the menu, confirm visible focus, confirm screen-reader labels, verify mobile and desktop breakpoints, and run target repo checks. Follow `knowledge/a11y/keyboard-and-focus.md`.
- Risks: the navigation may be shared across marketing and authenticated surfaces.

## Prompt Pack

### Codex repo intake

```text
Work in the target website repo, not in design-ai. Inspect routing, layout primitives, styling/tokens, state management, target pages, and verification scripts before editing. Return the smallest safe implementation plan for the homepage CTA and mobile menu focus work.
```

### Codex implementation

```text
First inspect the target repo read-only. Present the selected task, exact files, scope, risks, and verification commands, then stop until I explicitly approve that task and repository. After approval, implement the selected task in the target repo. Reuse existing components, design tokens, state patterns, and verification commands. Ask again before adding dependencies, widening scope, deploying, committing, or pushing. Verify desktop/tablet/mobile behavior, keyboard focus, screen-reader labels, and target repo lint/build.
```

### Claude design review

```text
Review the live site or screenshots as a senior product designer. Focus on hierarchy, layout rhythm, type, color, spacing, CTA clarity, accessibility, and Korean SaaS copy. Provide one best path with evidence.
```

## Handoff Report Draft

### Executed Work

- Not run yet; implementation happens in the target website repo.

### Verification Results

- Not run yet; expected checks are target repo lint/build, Browser responsive QA, focus QA, and Vercel preview verification.

### Remaining Risks

- Figma is optional, so design-token intent may need manual confirmation.
- Sanity content may require CMS access before copy fixes can ship.
- Performance and runtime findings are marked as unverified until Browser/Chrome DevTools or deployment checks run.

### Next Actions

- Generate and strictly verify the local handoff bundle.
- Call `design_ai_site_bundle_handoff` with the bundle directory and `task-homepage-cta`; confirm its approval state is pending and its target-repo mutation flag is false.
- Run the generated Codex repo intake prompt against the target website repo, review the exact scope, then explicitly approve or reject the selected task.
- Apply the P0 accessibility task before lower-priority visual polish.
- Use `design-ai check output.md --route website-improvement --strict` on the final handoff artifact.

## Accessibility, Responsive, And Grounding Notes

- Accessibility: keyboard/focus behavior and screen-reader labels must be verified against `knowledge/a11y/keyboard-and-focus.md`.
- Contrast: body text and CTA foreground/background pairs must be checked for at least 4.5:1 body text contrast per `knowledge/a11y/contrast.md`.
- Responsive: desktop, tablet, and mobile viewports must be checked because Korean labels can wrap differently from English copy.
- Source grounding: this plan uses `knowledge/PRINCIPLES.md`, `knowledge/patterns/ux-guidelines.md`, and `knowledge/patterns/report-design.md`.
- Avoid: do not run automatic crawling, external MCP writes, target repo mutation from design-ai, embeddings, fine-tuning, or backend sync in this MVP.
