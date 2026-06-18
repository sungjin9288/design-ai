# Company Website Intake Template

Fill this template before the first Website Improvement dogfood pass. Keep sensitive credentials, private tokens, production secrets, and customer data out of this document.

## Site Profile

| Field | Value |
|---|---|
| Site name | |
| Live URL | |
| Target repo URL | |
| Target repo local path | |
| Figma URL | |
| Deploy provider | `vercel` / `netlify` / `cloudflare` / `other` / `none` |
| Sentry project | |
| CMS | `sanity` / `contentful` / `wordpress` / `shopify` / `none` / `other` |
| Database | `supabase` / `neon` / `postgres` / `none` / `other` |

## Priority Pages

List 2-5 pages for the first pilot. Start with pages that affect conversion, trust, signup, inquiry, purchase, or onboarding.

| Priority | Path or URL | Why it matters |
|---:|---|---|
| 1 | `/` | |
| 2 | | |
| 3 | | |
| 4 | | |
| 5 | | |

## Primary User Flows

| Priority | Flow | Success signal |
|---:|---|---|
| 1 | | |
| 2 | | |
| 3 | | |

## Brand And Content Notes

| Area | Notes |
|---|---|
| Brand tone | |
| Typography constraints | |
| Color constraints | |
| Korean copy rules | |
| Legal or compliance copy | |
| Trust signals | |
| Competitors or references | |

## MCP Readiness Notes

Mark each external system as `required`, `optional`, `unused`, or `unavailable`.

| System | Status | Evidence or fallback |
|---|---|---|
| GitHub | | |
| Figma | | |
| Browser / Playwright | | |
| Chrome DevTools | | |
| Deploy provider | | |
| Sentry | | |
| Database | | |
| CMS | | |
| Collaboration tool | | |
| Research tool | | |

## Initial Audit Findings

Capture only findings that are grounded in inspection. Do not invent Lighthouse, axe, crawler, or analytics results unless those tools were actually run in the target repo or browser.

| Category | Finding | Evidence | Page |
|---|---|---|---|
| Visual design | | | |
| UX flow | | | |
| Responsive | | | |
| Accessibility | | | |
| Performance | | | |
| SEO | | | |
| Technical quality | | | |
| Runtime issues | | | |
| Content quality | | | |

## First Bundle Commands

Replace placeholders and run from the `design-ai` repository.

If this intake file is filled, use it directly:

```bash
design-ai site --from-intake company-website-intake.md --out website-workspace.json --force
design-ai site --from-intake company-website-intake.md --next-actions --out website-next-actions.md --force
design-ai site --from-intake company-website-intake.md --bundle --out website-handoff-bundle --strict --force
```

If no intake file is available, use direct fields:

```bash
design-ai site --init \
  --name "<site name>" \
  --live-url <live-url> \
  --local-path <absolute-target-repo-path> \
  --page / \
  --page <priority-page-2> \
  --flow "<primary user flow>" \
  --next-actions \
  --out website-next-actions.md \
  --force
```

```bash
design-ai site --init \
  --name "<site name>" \
  --live-url <live-url> \
  --local-path <absolute-target-repo-path> \
  --page / \
  --page <priority-page-2> \
  --flow "<primary user flow>" \
  --bundle \
  --out website-handoff-bundle \
  --strict \
  --force
```

```bash
design-ai site website-handoff-bundle --bundle-check --strict --json --out website-bundle-check.json --force
design-ai site website-handoff-bundle --bundle-handoff --strict --out target-repo-handoff.md --force
```

## Target Repo Verification Plan

Fill this before implementation so the target-repo agent has a clear quality gate.

| Gate | Command or manual check | Required for pilot |
|---|---|---:|
| Install | | yes |
| Lint | | yes |
| Typecheck | | if available |
| Unit tests | | if available |
| Build | | yes |
| Browser smoke | | yes |
| Accessibility spot check | | yes |
| Deployment preview | | if available |

## Stop Conditions

Stop before target-repo edits when any answer is unclear:

- Which repo and branch should be modified?
- Which single task should be implemented first?
- Which verification commands must pass?
- Which credentials or production systems are off limits?
- Where should implementation evidence be recorded after the target-repo pass?
