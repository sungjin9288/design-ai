# Company Website Dogfood Runbook

Use this runbook when applying `design-ai` to a real company website for the first internal pilot. The goal is to create a verified Website Improvement handoff bundle in this repository, then execute the generated implementation prompt inside the target website repository.

This repository remains the planning and handoff control tower. Do not copy the target website source code into this repository.

## Required Intake

Collect these values before generating the first bundle:

| Field | Required | Example |
|---|---:|---|
| Site name | yes | `Company marketing site` |
| Live URL | yes | `https://www.example.com` |
| Target repo URL or local path | yes | `https://github.com/company/site` or `/Users/me/work/site` |
| Priority pages | yes | `/`, `/pricing`, `/contact` |
| Primary user flows | yes | `Visitor compares plans and requests a demo` |
| Figma URL | optional | `https://www.figma.com/file/...` |
| Deploy provider | optional | `vercel`, `netlify`, `cloudflare`, `other`, `none` |
| CMS / DB / Sentry notes | optional | `Sanity`, `Supabase`, `Sentry project slug` |
| Brand constraints | optional | Tone, typography, color, legal copy, Korean copy rules |

## Step 1: Generate The Workspace And Bundle

Run this from the `design-ai` repository:

```bash
design-ai site --init \
  --name "Company marketing site" \
  --live-url https://www.example.com \
  --repo-url https://github.com/company/site \
  --page / \
  --page /pricing \
  --page /contact \
  --flow "Visitor compares plans and requests a demo" \
  --next-actions \
  --out website-next-actions.md
```

Then create the portable handoff bundle:

```bash
design-ai site --init \
  --name "Company marketing site" \
  --live-url https://www.example.com \
  --repo-url https://github.com/company/site \
  --page / \
  --page /pricing \
  --page /contact \
  --flow "Visitor compares plans and requests a demo" \
  --bundle \
  --out website-handoff-bundle \
  --strict
```

If the target repo is already cloned locally, prefer `--local-path /absolute/path/to/site` instead of `--repo-url`.

## Step 2: Verify The Bundle Before Target Repo Work

```bash
design-ai site website-handoff-bundle --bundle-check --strict --json --out website-bundle-check.json
design-ai site website-handoff-bundle --bundle-handoff --strict --out target-repo-handoff.md
```

The bundle is ready for implementation only when `bundle-check` passes. The handoff prompt must carry:

- target repo confirmation rules
- architecture and design-system inspection requirements
- focused task scope
- quality gate commands to run in the target repo
- implementation evidence and remaining-risk requirements

## Step 3: Execute In The Target Website Repo

Open the target website repository in Codex or Claude Code and paste `target-repo-handoff.md`.

The implementation agent must:

1. Confirm the target repo path and current branch.
2. Inspect the existing framework, routing, styling, components, and design tokens before editing.
3. Apply one focused refactor task, not a broad redesign.
4. Run the target repo's relevant checks: lint, typecheck, tests, build, browser smoke, or deployment preview verification.
5. Return changed files, verification output, screenshots when relevant, remaining risks, and the next recommended task.

## Step 4: Record Evidence Back In design-ai

After target repo implementation, copy the evidence back into the Website Improvement Console or workspace JSON:

| Evidence area | What to record |
|---|---|
| Executed work | Changed pages/components, commit/PR link, scope decisions |
| Verification results | Commands run, pass/fail status, browser or deployment smoke notes |
| Remaining risks | Items not verified, production data dependencies, unresolved accessibility or SEO findings |
| Next actions | The next task candidate and why it should come next |

Then regenerate the report:

```bash
design-ai site website-workspace.json --report --out website-handoff.md --force
design-ai site website-workspace.json --bundle --out website-handoff-bundle.after --strict
design-ai site website-handoff-bundle --bundle-compare website-handoff-bundle.after --strict --json
```

## Stop Conditions

Stop before implementation if any of these are true:

- The target repo path is unclear.
- The live URL is unavailable or points at the wrong site.
- The bundle check fails under `--strict`.
- Required MCP readiness is marked `unavailable` without a manual fallback.
- The target repo has no runnable verification command and no manual smoke path.
- The requested change requires credentials, production writes, or destructive migration approval.

## First Pilot Definition Of Done

The first company dogfood pass is complete when:

- A verified `website-handoff-bundle` exists.
- `target-repo-handoff.md` has been used inside the real target repo.
- One focused improvement task is implemented and verified.
- Evidence is copied back into the Website Improvement workspace.
- A final `website-handoff.md` report records what changed, what passed, what remains risky, and what should happen next.
