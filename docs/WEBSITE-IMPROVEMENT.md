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
- Generates the shared `implementation-plan`, `critique-loop`, and agent-readable `DESIGN.md` artifacts, plus prompts for Codex implementation work, Claude design review, competitor research, copy critique, visual QA, deployment verification, and final handoff.
- Tracks executed work, verification results, remaining risks, and next actions after target-repo implementation.
- Imports a `website-improvement-linked-preview` JSON report that shows the linked local path, detected framework/package manager, existing manual start command, and explicit not-started/not-probed/not-recorded runtime state.
- Imports `design-ai site <bundle-dir> --bundle-handoff --json` output as an Operator Runbook in the Report tab, including runbook metadata source pills, source-bundle provenance/detail review, copy-ready source-bundle source markers, source-bundle artifact-specific action labels, revalidation gate JSON action labels, source-bundle revalidation metadata badges, badge rows, warnings, Markdown gates, source/diagnostic-context-preserving gate-only JSON copy/export/import, focused provenance import source refresh, exported compact source markers, Markdown source markers, source-aware empty runbook Markdown, provenance-only notice source markers, JSON gate reason metadata, focused source-bundle JSON import, provenance-only review state and Markdown markers, guarded copy-ready strict source commands, source-bundle Markdown/JSON copy/export, task/command provenance chips, stage metrics, resettable action/evidence row filters, status indexes, evidence progress, copy-ready stage rows, row-level Markdown copy/export and line copy, guarded filtered-row Markdown copy/export, full Markdown export, and guarded next-line copy actions.
- Drafts a Markdown handoff report that includes before/after status, implementation evidence, verification evidence, and follow-up work.
- Preserves handoff evidence when exported JSON is processed by `design-ai site --report`, `--tasks`, or `--bundle`.
- Packages target-repo execution checklist guidance so implementation prompts require repo confirmation, architecture inspection, focused task scope, quality gates, and evidence recording.

## Boundaries

The console does not crawl pages, run Lighthouse, run axe, capture screenshots, call external AI APIs, connect directly to MCP tools, read local project folders from the browser, start preview processes, or modify target website repos. It stores state in browser `localStorage` and supports JSON export/import so the same workspace can be moved later to a server-backed store.

Actual code changes happen in the target website repository. Use the generated Codex prompts there, then paste verification evidence back into the handoff report.

The three shared artifact modes use the same `design-ai-artifact` schema as CLI `design-ai artifact`, SDK `artifact()`, and MCP `design_ai_artifact`. Website Console adds site profile, audit, MCP, and refactor-task context while preserving the same source-of-truth, workflow, approval, and verification headings.

## MVP Workflow

1. Fill or import a Site Profile.
2. Review the Audit Checklist and record findings.
3. Set the MCP Readiness Matrix so prompts include realistic tool assumptions.
4. Review the Workflow Graph to confirm audit, MCP, task, prompt, and handoff dependencies.
5. Generate starter refactor tasks from findings.
6. Copy a Codex or Claude prompt and run it in the right tool.
7. Generate `--linked-preview --json` from a workspace with an absolute local path and import it into the console.
8. Start the detected preview command manually after confirming the target repository, then run browser, responsive, accessibility, and runtime checks.
9. After generating a bundle handoff JSON, import it back into the console to review the Operator Runbook before moving into the target repo.
10. Record executed work, verification results, remaining risks, and next actions in the Handoff Report tab.
11. Export the handoff report after implementation and verification.

## Homepage Build And Refactor Workflow

Homepage implementation is supported as an approval-gated target-repo workflow, not as an in-repository code generator:

1. Capture the homepage profile, findings, target viewports, and selected implementation task.
2. Generate a bundle and pass `--bundle-check --strict`.
3. Call `design_ai_site_bundle_handoff` from Codex or Claude, or run the equivalent local `--bundle-handoff --strict --json` command.
4. Run `design-ai site <workspace.json> --linked-preview --strict --json --out linked-preview.json` or call `design_ai_site_linked_preview`, then import the report into the Console.
5. Inspect the target repository read-only and present the exact files, scope, risks, preview command, and target-repo verification commands.
6. Stop until the user explicitly approves the selected task and repository.
7. Implement using the target repo's existing components, tokens, state patterns, and styling conventions.
8. Start the preview command manually. The linked-preview operation itself never starts a process or probes a URL.
9. Verify real browser behavior at desktop, tablet, and mobile viewports, including keyboard/focus, contrast, screen-reader semantics, runtime errors, lint, tests, and build as applicable.
10. Record browser and command evidence in the target repo and Console; a configured URL alone is never treated as verification.
11. Request approval again before adding dependencies, widening scope, migrating data, deploying, committing, pushing, or performing another external write.

The handoff MCP tool remains local and read-only. It transports the verified bundle contract and a pending approval state; it does not mutate the target repository.

## CLI Export Workflow

Use `design-ai site` when a Website Improvement Console JSON export needs to leave the browser and become an operator artifact:

```bash
design-ai site --intake-template --out company-website-intake.md
design-ai site --intake-template --language ko --out company-website-intake.ko.md
design-ai site --from-intake company-website-intake.ko.md --out website-workspace.json
cat company-website-intake.ko.md | design-ai site --from-intake --stdin --out website-workspace.json --force
design-ai site --from-intake company-website-intake.ko.md --next-actions --out website-next-actions.md
cat company-website-intake.ko.md | design-ai site --from-intake --stdin --next-actions --out website-next-actions.md --force
design-ai site --from-intake company-website-intake.ko.md --tasks --out website-workspace.tasks.json
cat company-website-intake.ko.md | design-ai site --from-intake --stdin --tasks --out website-workspace.tasks.json --force
design-ai site --from-intake company-website-intake.ko.md --bundle --tasks --out website-handoff-bundle
cat company-website-intake.ko.md | design-ai site --from-intake --stdin --bundle --tasks --out website-handoff-bundle
design-ai site --init --name "Company marketing site" --live-url https://example.com --repo-url https://github.com/acme/site --page / --page /pricing --flow "Visitor compares plans and starts signup" --out website-workspace.json
design-ai site --init --name "Company marketing site" --live-url https://example.com --repo-url https://github.com/acme/site --next-actions --out website-next-actions.md
design-ai site --init --name "Company marketing site" --live-url https://example.com --repo-url https://github.com/acme/site --bundle --out website-handoff-bundle
design-ai site --sample --out website-workspace.json
design-ai site website-workspace.json --prompt implementation-plan --task 1 --out implementation-plan.md
design-ai site website-workspace.json --prompt critique-loop --task 1 --out critique-loop.md
design-ai site website-workspace.json --prompt design-contract --out DESIGN.md
design-ai site website-workspace.json --tasks --out website-workspace.tasks.json
design-ai site website-workspace.json --json
design-ai site website-workspace.json --mcp-check --strict --json
design-ai site website-workspace.json --mcp-check --probes --json
design-ai site website-workspace.json --mcp-plan --out mcp-action-plan.md
design-ai site website-workspace.json --linked-preview --strict --json --out linked-preview.json
design-ai site website-workspace.json --next-actions --json
design-ai site website-workspace.json --next-actions --out website-next-actions.md
design-ai site website-workspace.json --graph --json --out website-workflow-graph.json
design-ai site website-workspace.json --bundle --out website-handoff-bundle
design-ai site website-handoff-bundle --bundle-check --strict --json
design-ai site website-handoff-bundle --bundle-compare website-handoff-bundle.previous --strict --json
design-ai site website-handoff-bundle --bundle-handoff --strict --json --out target-repo-handoff.json --force
design-ai site website-handoff-bundle --bundle-handoff --strict --out target-repo-handoff.md
design-ai site website-handoff-bundle --bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff.md
design-ai site website-workspace.json --report --out website-handoff.md
design-ai site website-workspace.json --prompts --out website-prompts.md
design-ai site website-workspace.json --prompt codex-implementation --out codex-implementation.md
design-ai site website-workspace.json --prompt codex-implementation --task task-accessibility --out task-accessibility.md
cat website-workspace.json | design-ai site --stdin --strict --json
```

`--linked-preview` requires an absolute `siteProfile.localPath`. It reads only root `package.json`, a supported root lockfile, and whether root `index.html` exists. It detects an existing `dev`, `preview`, or `start` script, or suggests Python's static server for a root HTML entry. The report never installs a dependency, recursively scans source files, starts the command, probes the URL, or changes the linked repository. Import the JSON into Website Console to keep metadata readiness separate from runtime verification evidence.

For a greenfield homepage, the target repo or local path is sufficient before the first preview exists:

```bash
design-ai site --init --name "New company homepage" --local-path /absolute/path/to/site --deploy vercel --bundle --out website-handoff-bundle --strict
design-ai site website-handoff-bundle --bundle-check --strict --json
```

This pre-deployment bundle proves handoff readiness, not completed runtime QA. Add `--live-url` and record browser, accessibility, responsive, and deployment evidence after approved target-repo implementation starts a preview.

`design-ai site --intake-template --language ko` emits Korean content, and `design-ai site --intake-template` emits the same blank company-site intake Markdown form linked from the docs, so operators can create `company-website-intake.md` before project details are ready for `--init`. Add `--json` when another wrapper needs template metadata, privacy boundaries, recommended follow-up commands, and the Markdown content in one payload. `design-ai site --from-intake company-website-intake.ko.md` converts a filled English or Korean intake Markdown file into deterministic workspace JSON, preserving site profile fields, priority pages, user flows, brand notes, MCP readiness statuses, and grounded initial audit findings. Use `design-ai site --from-intake --stdin` when the filled intake comes from a secure note, generated Markdown stream, or another local tool; stdin supports JSON stdout, `--out` workspace persistence, `--next-actions`, `--tasks`, and `--bundle --tasks --out <dir>` with the same local/no-target-repo boundary. Add `--next-actions [--json]` to get a local runbook that starts by saving `website-workspace.json`; add `--tasks --out website-workspace.tasks.json` when the intake already contains initial audit findings and you want the first deterministic refactor tasks without an intermediate workspace command. Add `--bundle --tasks --out <dir>` to create the task-ready handoff bundle directly from the filled intake without retyping CLI fields. `design-ai site --init` creates the same real-project intake workspace from CLI fields, including site profile, default checklist notes, derived MCP readiness, default implementation evidence arrays, and no starter refactor tasks until audit findings exist. Add `--next-actions [--json]` to the same init command when you want a local operator runbook before saving or handing off the workspace; that runbook starts with the exact `site --init ... --out website-workspace.json` command and then lists the MCP check, task generation, handoff report, and bundle commands against `website-workspace.json`. Add `--bundle --out <dir>` to the same init command when you want a one-shot company dogfood handoff kit directly from project intake fields; it writes the same local bundle artifacts as the workspace-based bundle flow and still does not mutate the target website repo. Use `--sample` when you want the canned Korean SaaS fixture instead. `design-ai site --prompt-list --json` lists the available prompt template ids before you choose one. `design-ai site --mcp-check --json` checks local MCP readiness evidence and task/MCP gaps without calling external MCPs; add `--strict` to fail when required readiness evidence is missing. Add `--probes` to `--mcp-check` or `--mcp-plan` when you want read-only URL/path/tool-handoff probes for GitHub, Figma, Browser smoke targets, and deployment provider references; probes do not call external MCPs or write to any outside system. `design-ai site --mcp-plan` turns the same readiness state into an action plan with blocking items, warnings, task/MCP alignment, optional read-only probes, execution sequence, and follow-up commands; add `--json` when another agent, CI smoke, or handoff script needs the structured `website-improvement-mcp-action-plan` payload instead of Markdown. `design-ai site --next-actions [--json]` distills validation issues, MCP readiness, read-only MCP probe readiness and probe counts, task/MCP gaps, top refactor tasks, and handoff commands into a prioritized local operator checklist before you move into the target repo; omit `--json` and add `--out website-next-actions.md` when you want a Markdown runbook checkpoint. `design-ai site --graph --json` exports a portable Website Improvement workflow graph with workspace, site profile, audit, MCP readiness, refactor task, prompt template, handoff, bundle, and target-repo nodes plus deterministic edges; the graph is local/read-only and the static console can render the same workflow from browser state without adding a workflow runtime dependency. `design-ai site --bundle --out <dir>` writes a complete local handoff package with a README, summary JSON, generated tasks workspace, MCP readiness JSON, read-only MCP probe JSON, MCP action plan, handoff report, prompt bundle, and top-priority Codex implementation prompt. The bundle README and `summary.json.handoff` explain strict-ready state, recommended handoff command, strict command, draft command, verification command, target-repo execution checklist, and the boundary between planning-only draft prompts and implementation-authority strict prompts. `design-ai site <bundle-dir> --bundle-check --strict --json` validates the generated package before target-repo handoff by checking the file manifest, JSON consistency, recomputed MCP readiness and probe readiness, required Markdown anchors, `summary.json.handoff.executionChecklist`, SHA-256 checksums recorded in `summary.json`, and `summary.json.checksums.bundleDigest` bundle identity. `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json` compares two valid handoff bundles by bundle digest, file checksums, and summary metadata so operators can confirm whether an archived or regenerated bundle is identical before using it in a target repo. `design-ai site <bundle-dir> --bundle-handoff --strict --json` turns a verified handoff bundle into a target-repo Codex prompt that carries the bundle digest, bundle-check status, MCP probe status, MCP probe counts, implementation prompt, operating rules, target-repo execution checklist, and final response requirements plus an “Available Bundle Tasks” catalog with task numbers, ids, priority, impact, effort, pages, recommended MCPs, and copy-ready strict handoff commands; JSON output exposes the top-priority bundled task as `bundle.defaultTask` and the actual prompt target as `bundle.effectiveTask`, each with `handoffOutFile`, `handoffCommand`, and `strictHandoffCommand`; add `--task <id-or-number>` to regenerate that handoff prompt for a specific task from `website-workspace.tasks.json` while preserving verified bundle metadata and adding the selected task's own `handoffOutFile`, `handoffCommand`, and `strictHandoffCommand` to JSON `bundle.selectedTask`; `bundle.effectiveTask` then switches to that selected task. Save the JSON output with `--out target-repo-handoff.json --force` and import it through the console sidebar when you want the Report tab to show the Operator Runbook with stage metrics, status chips, evidence progress, and copy-ready next-line actions before entering the target repo. `design-ai site --tasks` expands audit findings into deterministic starter refactor tasks. `design-ai site --prompt <template-id>` exports one prompt template when you want to paste only the next Codex or Claude instruction into another tool. For implementation prompts, add `--task <id-or-number>` to target a specific refactor task instead of the default top-priority task. The command validates the local workspace schema, summarizes audit/MCP/task/probe readiness and probe counts, and generates prioritized next-action checklists, Markdown handoff reports, prompt bundles, structured MCP action plans, portable workflow graphs, complete handoff bundle directories, or target-repo handoff prompts. It still does not modify the target website repo or call external MCPs.

When a workspace JSON includes `implementationEvidence`, the CLI keeps it local and deterministic: `--json` reports evidence counts, `--tasks` preserves the evidence block, `--report` renders the evidence sections, and `--bundle` stores the same evidence in `website-workspace.tasks.json`, `website-handoff.md`, and `summary.json`.

## Accessibility And Responsive Notes

The app is desktop-first because the primary user is an operator planning website improvements, but controls remain usable on mobile. Interactive controls are keyboard reachable, focus-visible, and use text labels. Status and priority values are not represented by color alone; each status is printed as text.
