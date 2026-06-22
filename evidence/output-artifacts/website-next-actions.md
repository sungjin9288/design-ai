Website Improvement next actions: Korean SaaS marketing site

Status: pass
Workspace status: pass
MCP status: pass
MCP probe status: pass
MCP probes: 4/4 passing, 0 warning, 0 failing
Actions: 3 (0 blocking, 0 warning)

Prioritized actions:
1. [implementation] Prepare Codex implementation prompt for task-homepage-cta
   Why: Clarify homepage CTA hierarchy is the highest-priority available refactor task.
   Command: `design-ai site /Users/sungjin/dev/design/evidence/output-artifacts/website-workspace-sample.json --prompt codex-implementation --task 1 --out codex-implementation.md`
   References: task-homepage-cta
2. [handoff] Create implementation evidence trail
   Why: Executed work or verification results are still empty, so the handoff report should capture what remains unverified.
   Command: `design-ai site /Users/sungjin/dev/design/evidence/output-artifacts/website-workspace-sample.json --report --out website-handoff.md`
   References: implementationEvidence
3. [handoff] Export portable handoff bundle
   Why: A bundle keeps summary, tasks, MCP evidence, prompts, and handoff report together for the target website repo workflow.
   Command: `design-ai site /Users/sungjin/dev/design/evidence/output-artifacts/website-workspace-sample.json --bundle --out website-handoff-bundle`
   References: bundle

Boundaries:
- This next-action report is deterministic and local.
- It does not call external MCPs, mutate the target website repo, run Lighthouse/axe, capture screenshots, or write deployment/CMS/Sentry data.
- MCP probes are read-only local URL/path/reference checks and do not connect to external MCP servers.
- Run implementation commands in the target website workflow after readiness blockers are cleared.
