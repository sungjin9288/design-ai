# Website Improvement Console

The Website Improvement Console is a local control tower for improving an existing website without storing that site's source code in this repository.

Open the MVP app:

[Open Website Improvement Console](website-console/index.html)

## What It Does

- Tracks a Site Profile with live URL, target repo reference, Figma link, pages, user flows, platform notes, and viewport coverage.
- Manages an Audit Pipeline across visual design, UX flow, responsive QA, accessibility, performance, SEO, technical quality, runtime issues, and content quality.
- Classifies MCP readiness as `required`, `optional`, `unused`, or `unavailable`.
- Converts audit findings into starter refactor tasks with impact, effort, priority, MCP recommendations, Codex prompts, verification steps, and risks.
- Generates prompts for Codex implementation work, Claude design review, competitor research, copy critique, visual QA, deployment verification, and final handoff.
- Drafts a Markdown handoff report for before/after status and verification evidence.

## Boundaries

The console does not crawl pages, run Lighthouse, run axe, capture screenshots, call external AI APIs, connect directly to MCP tools, or modify target website repos. It stores state in browser `localStorage` and supports JSON export/import so the same workspace can be moved later to a server-backed store.

Actual code changes happen in the target website repository. Use the generated Codex prompts there, then paste verification evidence back into the handoff report.

## MVP Workflow

1. Fill or import a Site Profile.
2. Review the Audit Checklist and record findings.
3. Set the MCP Readiness Matrix so prompts include realistic tool assumptions.
4. Generate starter refactor tasks from findings.
5. Copy a Codex or Claude prompt and run it in the right tool.
6. Export the handoff report after implementation and verification.

## CLI Export Workflow

Use `design-ai site` when a Website Improvement Console JSON export needs to leave the browser and become an operator artifact:

```bash
design-ai site --sample --out website-workspace.json
design-ai site website-workspace.json --tasks --out website-workspace.tasks.json
design-ai site website-workspace.json --json
design-ai site website-workspace.json --mcp-check --strict --json
design-ai site website-workspace.json --mcp-plan --out mcp-action-plan.md
design-ai site website-workspace.json --report --out website-handoff.md
design-ai site website-workspace.json --prompts --out website-prompts.md
design-ai site website-workspace.json --prompt codex-implementation --out codex-implementation.md
design-ai site website-workspace.json --prompt codex-implementation --task task-accessibility --out task-accessibility.md
cat website-workspace.json | design-ai site --stdin --strict --json
```

`design-ai site --sample` creates a valid starter workspace JSON for file-first workflows. `design-ai site --prompt-list --json` lists the available prompt template ids before you choose one. `design-ai site --mcp-check --json` checks local MCP readiness evidence and task/MCP gaps without calling external MCPs; add `--strict` to fail when required readiness evidence is missing. `design-ai site --mcp-plan` turns the same readiness state into a Markdown action plan with blocking items, warnings, task/MCP alignment, execution sequence, and follow-up commands. `design-ai site --tasks` expands audit findings into deterministic starter refactor tasks. `design-ai site --prompt <template-id>` exports one prompt template when you want to paste only the next Codex or Claude instruction into another tool. For implementation prompts, add `--task <id-or-number>` to target a specific refactor task instead of the default top-priority task. The command validates the local workspace schema, summarizes audit/MCP/task readiness, and generates Markdown handoff reports or prompt bundles. It still does not modify the target website repo or call external MCPs.

## Accessibility And Responsive Notes

The app is desktop-first because the primary user is an operator planning website improvements, but controls remain usable on mobile. Interactive controls are keyboard reachable, focus-visible, and use text labels. Status and priority values are not represented by color alone; each status is printed as text.
