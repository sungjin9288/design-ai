# Website Improvement Console

The Website Improvement Console is a local control tower for improving an existing website without storing that site's source code in this repository.

Open the MVP app:

[Open Website Improvement Console](website-console/index.html)

For the first real company-site pilot, complete the [Company Website Intake Template](COMPANY-WEBSITE-INTAKE-TEMPLATE.md), then follow the [Company Website Dogfood Runbook](COMPANY-WEBSITE-DOGFOOD.md) before opening the target repository.

## What It Does

- Tracks a Site Profile with live URL, target repo reference, Figma link, pages, user flows, platform notes, and viewport coverage.
- Manages an Audit Pipeline across visual design, UX flow, responsive QA, accessibility, performance, SEO, technical quality, runtime issues, and content quality.
- Classifies MCP readiness as `required`, `optional`, `unused`, or `unavailable`.
- Converts audit findings into starter refactor tasks with impact, effort, priority, MCP recommendations, Codex prompts, verification steps, and risks.
- Renders a local Workflow Graph with workspace, profile, audit, MCP, task, prompt, handoff, bundle, and target-repo nodes plus deterministic edge rows.
- Generates prompts for Codex implementation work, Claude design review, competitor research, copy critique, visual QA, deployment verification, and final handoff.
- Tracks executed work, verification results, remaining risks, and next actions after target-repo implementation.
- Drafts a Markdown handoff report that includes before/after status, implementation evidence, verification evidence, and follow-up work.
- Preserves handoff evidence when exported JSON is processed by `design-ai site --report`, `--tasks`, or `--bundle`.
- Packages target-repo execution checklist guidance so implementation prompts require repo confirmation, architecture inspection, focused task scope, quality gates, and evidence recording.

## Boundaries

The console does not crawl pages, run Lighthouse, run axe, capture screenshots, call external AI APIs, connect directly to MCP tools, or modify target website repos. It stores state in browser `localStorage` and supports JSON export/import so the same workspace can be moved later to a server-backed store.

Actual code changes happen in the target website repository. Use the generated Codex prompts there, then paste verification evidence back into the handoff report.

## MVP Workflow

1. Fill or import a Site Profile.
2. Review the Audit Checklist and record findings.
3. Set the MCP Readiness Matrix so prompts include realistic tool assumptions.
4. Review the Workflow Graph to confirm audit, MCP, task, prompt, and handoff dependencies.
5. Generate starter refactor tasks from findings.
6. Copy a Codex or Claude prompt and run it in the right tool.
7. Record executed work, verification results, remaining risks, and next actions in the Handoff Report tab.
8. Export the handoff report after implementation and verification.

## CLI Export Workflow

Use `design-ai site` when a Website Improvement Console JSON export needs to leave the browser and become an operator artifact:

```bash
design-ai site --intake-template --out company-website-intake.md
design-ai site --intake-template --language ko --out company-website-intake.ko.md
design-ai site --from-intake company-website-intake.ko.md --out website-workspace.json
cat company-website-intake.ko.md | design-ai site --from-intake --stdin --out website-workspace.json --force
design-ai site --from-intake company-website-intake.ko.md --next-actions --out website-next-actions.md
cat company-website-intake.ko.md | design-ai site --from-intake --stdin --next-actions --out website-next-actions.md --force
design-ai site --from-intake company-website-intake.ko.md --bundle --out website-handoff-bundle
cat company-website-intake.ko.md | design-ai site --from-intake --stdin --bundle --out website-handoff-bundle
design-ai site --init --name "Company marketing site" --live-url https://example.com --repo-url https://github.com/acme/site --page / --page /pricing --flow "Visitor compares plans and starts signup" --out website-workspace.json
design-ai site --init --name "Company marketing site" --live-url https://example.com --repo-url https://github.com/acme/site --next-actions --out website-next-actions.md
design-ai site --init --name "Company marketing site" --live-url https://example.com --repo-url https://github.com/acme/site --bundle --out website-handoff-bundle
design-ai site --sample --out website-workspace.json
design-ai site website-workspace.json --tasks --out website-workspace.tasks.json
design-ai site website-workspace.json --json
design-ai site website-workspace.json --mcp-check --strict --json
design-ai site website-workspace.json --mcp-check --probes --json
design-ai site website-workspace.json --mcp-plan --out mcp-action-plan.md
design-ai site website-workspace.json --next-actions --json
design-ai site website-workspace.json --next-actions --out website-next-actions.md
design-ai site website-workspace.json --graph --json --out website-workflow-graph.json
design-ai site website-workspace.json --bundle --out website-handoff-bundle
design-ai site website-handoff-bundle --bundle-check --strict --json
design-ai site website-handoff-bundle --bundle-compare website-handoff-bundle.previous --strict --json
design-ai site website-handoff-bundle --bundle-handoff --strict --out target-repo-handoff.md
design-ai site website-workspace.json --report --out website-handoff.md
design-ai site website-workspace.json --prompts --out website-prompts.md
design-ai site website-workspace.json --prompt codex-implementation --out codex-implementation.md
design-ai site website-workspace.json --prompt codex-implementation --task task-accessibility --out task-accessibility.md
cat website-workspace.json | design-ai site --stdin --strict --json
```

`design-ai site --intake-template --language ko` emits Korean content, and `design-ai site --intake-template` emits the same blank company-site intake Markdown form linked from the docs, so operators can create `company-website-intake.md` before project details are ready for `--init`. Add `--json` when another wrapper needs template metadata, privacy boundaries, recommended follow-up commands, and the Markdown content in one payload. `design-ai site --from-intake company-website-intake.ko.md` converts a filled English or Korean intake Markdown file into deterministic workspace JSON, preserving site profile fields, priority pages, user flows, brand notes, MCP readiness statuses, and grounded initial audit findings. Use `design-ai site --from-intake --stdin` when the filled intake comes from a secure note, generated Markdown stream, or another local tool; stdin supports JSON stdout, `--out` workspace persistence, `--next-actions`, and `--bundle --out <dir>` with the same local/no-target-repo boundary. Add `--next-actions [--json]` to get a local runbook that starts by saving `website-workspace.json`; add `--bundle --out <dir>` to create the handoff bundle directly from the filled intake without retyping CLI fields. `design-ai site --init` creates the same real-project intake workspace from CLI fields, including site profile, default checklist notes, derived MCP readiness, default implementation evidence arrays, and no starter refactor tasks until audit findings exist. Add `--next-actions [--json]` to the same init command when you want a local operator runbook before saving or handing off the workspace; that runbook starts with the exact `site --init ... --out website-workspace.json` command and then lists the MCP check, task generation, handoff report, and bundle commands against `website-workspace.json`. Add `--bundle --out <dir>` to the same init command when you want a one-shot company dogfood handoff kit directly from project intake fields; it writes the same local bundle artifacts as the workspace-based bundle flow and still does not mutate the target website repo. Use `--sample` when you want the canned Korean SaaS fixture instead. `design-ai site --prompt-list --json` lists the available prompt template ids before you choose one. `design-ai site --mcp-check --json` checks local MCP readiness evidence and task/MCP gaps without calling external MCPs; add `--strict` to fail when required readiness evidence is missing. Add `--probes` to `--mcp-check` or `--mcp-plan` when you want read-only URL/path/tool-handoff probes for GitHub, Figma, Browser smoke targets, and deployment provider references; probes do not call external MCPs or write to any outside system. `design-ai site --mcp-plan` turns the same readiness state into an action plan with blocking items, warnings, task/MCP alignment, optional read-only probes, execution sequence, and follow-up commands; add `--json` when another agent, CI smoke, or handoff script needs the structured `website-improvement-mcp-action-plan` payload instead of Markdown. `design-ai site --next-actions [--json]` distills validation issues, MCP readiness, read-only MCP probe readiness and probe counts, task/MCP gaps, top refactor tasks, and handoff commands into a prioritized local operator checklist before you move into the target repo; omit `--json` and add `--out website-next-actions.md` when you want a Markdown runbook checkpoint. `design-ai site --graph --json` exports a portable Website Improvement workflow graph with workspace, site profile, audit, MCP readiness, refactor task, prompt template, handoff, bundle, and target-repo nodes plus deterministic edges; the graph is local/read-only and the static console can render the same workflow from browser state without adding a workflow runtime dependency. `design-ai site --bundle --out <dir>` writes a complete local handoff package with a README, summary JSON, generated tasks workspace, MCP readiness JSON, read-only MCP probe JSON, MCP action plan, handoff report, prompt bundle, and top-priority Codex implementation prompt. The bundle README and `summary.json.handoff` explain strict-ready state, recommended handoff command, strict command, draft command, verification command, target-repo execution checklist, and the boundary between planning-only draft prompts and implementation-authority strict prompts. `design-ai site <bundle-dir> --bundle-check --strict --json` validates the generated package before target-repo handoff by checking the file manifest, JSON consistency, recomputed MCP readiness and probe readiness, required Markdown anchors, `summary.json.handoff.executionChecklist`, SHA-256 checksums recorded in `summary.json`, and `summary.json.checksums.bundleDigest` bundle identity. `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json` compares two valid handoff bundles by bundle digest, file checksums, and summary metadata so operators can confirm whether an archived or regenerated bundle is identical before using it in a target repo. `design-ai site <bundle-dir> --bundle-handoff --strict --json` turns a verified handoff bundle into a target-repo Codex prompt that carries the bundle digest, bundle-check status, MCP probe status, MCP probe counts, implementation prompt, operating rules, target-repo execution checklist, and final response requirements. `design-ai site --tasks` expands audit findings into deterministic starter refactor tasks. `design-ai site --prompt <template-id>` exports one prompt template when you want to paste only the next Codex or Claude instruction into another tool. For implementation prompts, add `--task <id-or-number>` to target a specific refactor task instead of the default top-priority task. The command validates the local workspace schema, summarizes audit/MCP/task/probe readiness and probe counts, and generates prioritized next-action checklists, Markdown handoff reports, prompt bundles, structured MCP action plans, portable workflow graphs, complete handoff bundle directories, or target-repo handoff prompts. It still does not modify the target website repo or call external MCPs.

When a workspace JSON includes `implementationEvidence`, the CLI keeps it local and deterministic: `--json` reports evidence counts, `--tasks` preserves the evidence block, `--report` renders the evidence sections, and `--bundle` stores the same evidence in `website-workspace.tasks.json`, `website-handoff.md`, and `summary.json`.

## Accessibility And Responsive Notes

The app is desktop-first because the primary user is an operator planning website improvements, but controls remain usable on mobile. Interactive controls are keyboard reachable, focus-visible, and use text labels. Status and priority values are not represented by color alone; each status is printed as text.
