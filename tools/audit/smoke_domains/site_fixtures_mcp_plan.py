from __future__ import annotations

import json

from .site_fixtures_mcp import (
    passing_site_mcp_check_json,
    passing_site_mcp_check_probes_json,
)


def passing_site_mcp_plan_markdown() -> str:
    return """# Website improvement MCP action plan: Korean SaaS marketing site

## Summary
- Source: stdin
- Status: pass
- Workspace status: pass
- Live URL: https://example.com
- Repo: https://github.com/acme/korean-saas-site
- Ready MCP: 9/10
- Missing MCP: 0
- Task/MCP gaps: 0

## Readiness Matrix
| MCP | Requested | State | Level | Evidence |
| --- | --- | --- | --- | --- |
| GitHub | required | ready | pass | repoUrl: https://github.com/acme/korean-saas-site; localPath: /Users/you/dev/korean-saas-site |
| Figma | optional | ready | pass | figmaUrl: https://figma.com/file/example |
| Browser/Playwright | required | ready | pass | liveUrl: https://example.com; viewports: desktop, tablet, mobile |

## Blocking Items
- No blocking readiness issues.

## Warnings
- No optional readiness or task/MCP warnings.

## Task/MCP Alignment
| Task | Priority / impact | Recommended MCP | Readiness state |
| --- | --- | --- | --- |
| task-homepage-cta | p1 / high | browser, figma | browser: ready, figma: ready |

## Execution Sequence
1. Fix every blocking item before target-repo implementation handoff.
2. Resolve warnings that affect the next selected refactor task, or mark the MCP unused when it is intentionally out of scope.
3. Re-run the strict readiness gate and keep the JSON output with the handoff package.
4. Generate or refresh starter tasks, then export the selected Codex implementation prompt.
5. Run target-repo lint/typecheck/build plus desktop, tablet, mobile, keyboard, and screen-reader verification after implementation.

## Commands
- `design-ai site <workspace.json> --mcp-check --strict --json`
- `design-ai site <workspace.json> --tasks --out website-workspace.tasks.json`
- `design-ai site <workspace.json> --prompt codex-implementation --task 1 --out codex-implementation.md`
- `design-ai site <workspace.json> --report --out website-handoff.md`

## Boundaries
- This plan is deterministic and local.
- It does not call external MCPs, mutate the target website repo, run Lighthouse/axe, capture screenshots, or write to deployment/CMS/Sentry systems.
- Run the generated Codex/Claude prompts in the target website workflow after this readiness plan is clean.
"""


def passing_site_mcp_plan_probes_markdown() -> str:
    return passing_site_mcp_plan_markdown().replace(
        "\n## Blocking Items",
        """
## Read-Only Probes

- Probe status: pass
- Mode: read-only-local
- External calls: no

| Probe | MCP | Level | Result | Evidence | Next Action |
| --- | --- | --- | --- | --- | --- |
| GitHub repo reference | github | pass | pass | github repo: acme/korean-saas-site | none |
| Figma file reference | figma | pass | pass | figma reference: file/example | none |
| Browser smoke target | browser | pass | pass | liveUrl host: example.com; viewports: desktop, tablet, mobile | none |
| Deployment provider reference | deploy | pass | pass | deployProvider: vercel; liveUrl host: example.com | none |

## Blocking Items""",
    )


def passing_site_mcp_plan_json(*, probes: bool = False) -> str:
    mcp_payload = json.loads(passing_site_mcp_check_probes_json() if probes else passing_site_mcp_check_json())
    payload = {
        "kind": "website-improvement-mcp-action-plan",
        "version": 1,
        "filePath": "stdin",
        "status": "pass",
        "workspaceStatus": "pass",
        "site": mcp_payload["site"],
        "counts": mcp_payload["counts"],
        "readinessMatrix": mcp_payload["items"],
        "probes": mcp_payload.get("probes") if probes else None,
        "blockingItems": [],
        "warnings": [],
        "taskAlignment": [
            {
                "task": "task-homepage-cta",
                "priorityImpact": "p1 / high",
                "recommendedMcp": "browser, figma",
                "readinessState": "browser: ready, figma: ready",
            },
        ],
        "taskGaps": [],
        "workspaceIssues": [],
        "nextActions": [],
        "executionSequence": [
            "Fix every blocking item before target-repo implementation handoff.",
            "Resolve warnings that affect the next selected refactor task, or mark the MCP unused when it is intentionally out of scope.",
            "Re-run the strict readiness gate and keep the JSON output with the handoff package.",
            "Generate or refresh starter tasks, then export the selected Codex implementation prompt.",
            "Run target-repo lint/typecheck/build plus desktop, tablet, mobile, keyboard, and screen-reader verification after implementation.",
        ],
        "commands": {
            "mcpCheck": "design-ai site <workspace.json> --mcp-check --strict --json",
            "mcpCheckProbesHumanOut": "design-ai site <workspace.json> --mcp-check --probes --out mcp-check-probes.txt",
            "mcpCheckProbesJsonOut": "design-ai site <workspace.json> --mcp-check --probes --json --out mcp-check-probes.json",
            "mcpPlanProbesJsonOut": "design-ai site <workspace.json> --mcp-plan --probes --json --out mcp-action-plan-probes.json",
            "tasks": "design-ai site <workspace.json> --tasks --out website-workspace.tasks.json",
            "implementationPrompt": "design-ai site <workspace.json> --prompt codex-implementation --task 1 --out codex-implementation.md",
            "handoffReport": "design-ai site <workspace.json> --report --out website-handoff.md",
        },
        "boundaries": [
            "This plan is deterministic and local.",
            "It does not call external MCPs, mutate the target website repo, run Lighthouse/axe, capture screenshots, or write to deployment/CMS/Sentry systems.",
            "Run the generated Codex/Claude prompts in the target website workflow after this readiness plan is clean.",
        ],
        "externalCalls": False,
        "targetRepoMutation": False,
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def passing_site_workflow_graph_json() -> str:
    categories = [
        ("visual-design", "Visual Design", "in-progress"),
        ("ux-flow", "UX Flow", "todo"),
        ("responsive", "Responsive QA", "todo"),
        ("accessibility", "Accessibility", "todo"),
        ("performance", "Performance", "todo"),
        ("seo", "SEO", "todo"),
        ("technical-quality", "Technical Quality", "todo"),
        ("runtime-issues", "Runtime Issues", "todo"),
        ("content-quality", "Content Quality", "in-progress"),
    ]
    mcps = [
        ("github", "GitHub", "required", "pass"),
        ("figma", "Figma", "optional", "pass"),
        ("browser", "Browser/Playwright", "required", "pass"),
        ("chromeDevtools", "Chrome DevTools", "optional", "pass"),
        ("deploy", "Deploy", "required", "pass"),
        ("sentry", "Sentry", "optional", "pass"),
        ("database", "Database", "unused", "pass"),
        ("cms", "CMS", "optional", "pass"),
        ("collaboration", "Collaboration", "optional", "pass"),
        ("research", "Research", "optional", "pass"),
    ]
    tasks = [
        ("task-accessibility", "Resolve Accessibility finding", "accessibility", ["browser", "chromeDevtools"]),
        ("task-homepage-cta", "Clarify homepage CTA hierarchy", "visual-design", ["browser", "figma"]),
        ("task-content-quality", "Resolve Content Quality finding", "content-quality", ["figma", "research", "cms"]),
    ]
    prompts = [
        ("implementation-plan", "Implementation plan"),
        ("critique-loop", "Critique loop"),
        ("design-contract", "Agent-readable DESIGN.md"),
        ("codex-repo-intake", "Codex repo intake"),
        ("codex-implementation", "Codex implementation"),
        ("codex-visual-qa", "Codex visual QA"),
        ("codex-deployment", "Codex deployment verification"),
        ("claude-design-review", "Claude design review"),
        ("claude-competitor", "Claude competitor research"),
        ("claude-copy-ux", "Claude copy/UX critique"),
        ("handoff-report", "Final handoff report"),
    ]
    nodes = [
        {"id": "workspace:intake", "type": "workspace", "label": "Workspace intake", "status": "pass", "data": {"source": "stdin"}},
        {"id": "profile:sample-korean-saas", "type": "site-profile", "label": "Korean SaaS marketing site", "status": "pass", "data": {"id": "sample-korean-saas"}},
    ]
    nodes.extend(
        {"id": f"audit:{category_id}", "type": "audit-category", "label": label, "status": status, "data": {"category": category_id}}
        for category_id, label, status in categories
    )
    nodes.extend(
        {
            "id": f"mcp:{key}",
            "type": "mcp-readiness",
            "label": label,
            "status": level,
            "data": {"key": key, "requestedStatus": requested},
        }
        for key, label, requested, level in mcps
    )
    nodes.extend(
        {
            "id": f"task:{task_id}",
            "type": "refactor-task",
            "label": title,
            "status": "planned",
            "data": {"id": task_id, "category": category},
        }
        for task_id, title, category, _recommended in tasks
    )
    nodes.extend(
        {
            "id": f"prompt:{prompt_id}",
            "type": "prompt-template",
            "label": label,
            "status": "ready",
            "data": {"id": prompt_id},
        }
        for prompt_id, label in prompts
    )
    nodes.extend([
        {"id": "handoff:report", "type": "handoff-report", "label": "Handoff report", "status": "ready", "data": {}},
        {"id": "handoff:bundle", "type": "handoff-bundle", "label": "Local handoff bundle", "status": "ready", "data": {}},
        {"id": "handoff:target-repo", "type": "target-repo", "label": "Target website repo", "status": "external", "data": {}},
    ])

    edges: list[dict[str, str]] = []

    def edge(from_id: str, to_id: str, edge_type: str, label: str) -> None:
        edges.append({
            "id": f"{from_id}->{to_id}:{edge_type}",
            "from": from_id,
            "to": to_id,
            "type": edge_type,
            "label": label,
        })

    edge("workspace:intake", "profile:sample-korean-saas", "profile", "Workspace defines the target site profile")
    for category_id, _label, _status in categories:
        edge("profile:sample-korean-saas", f"audit:{category_id}", "audit-input", "Site context drives this audit category")
    for key, _label, _requested, _level in mcps:
        edge("profile:sample-korean-saas", f"mcp:{key}", "readiness-input", "Site profile provides MCP readiness evidence")
    for task_id, _title, category, recommended in tasks:
        edge(f"audit:{category}", f"task:{task_id}", "finding-to-task", "Audit finding informs this refactor task")
        edge("profile:sample-korean-saas", f"task:{task_id}", "site-context", "Site profile scopes this refactor task")
        for key in recommended:
            edge(f"mcp:{key}", f"task:{task_id}", "mcp-support", "MCP readiness supports task execution")
    for prompt_id, _label in prompts:
        edge("profile:sample-korean-saas", f"prompt:{prompt_id}", "profile-context", "Prompt template receives site profile context")
    for task_id, _title, _category, _recommended in tasks:
        edge(f"task:{task_id}", "prompt:codex-implementation", "implementation-prompt", "Task can be exported as a Codex implementation prompt")
    edge("profile:sample-korean-saas", "handoff:report", "handoff-input", "Site profile anchors the handoff report")
    for task_id, _title, _category, _recommended in tasks:
        edge(f"task:{task_id}", "handoff:report", "handoff-input", "Refactor task is summarized in the handoff report")
    for key, _label, requested, _level in mcps:
        if requested != "unused":
            edge(f"mcp:{key}", "handoff:report", "readiness-input", "MCP readiness is summarized in the handoff report")
    for prompt_id, _label in prompts:
        edge(f"prompt:{prompt_id}", "handoff:target-repo", "agent-prompt", "Prompt can be used in the target website workflow")
    edge("handoff:report", "handoff:bundle", "bundle-input", "Handoff report can be packaged into a local bundle")
    edge("handoff:bundle", "handoff:target-repo", "handoff", "Verified bundle can become target-repo implementation context")

    return json.dumps(
        {
            "version": 1,
            "kind": "website-improvement-workflow-graph",
            "generatedAt": "2026-05-30T00:00:00.000Z",
            "filePath": "stdin",
            "status": "pass",
            "workspaceStatus": "pass",
            "mcpStatus": "pass",
            "externalCalls": False,
            "site": {
                "id": "sample-korean-saas",
                "name": "Korean SaaS marketing site",
                "liveUrl": "https://example.com",
                "repoUrl": "https://github.com/acme/korean-saas-site",
                "localPath": "/Users/you/dev/korean-saas-site",
            },
            "summary": {
                "status": "pass",
                "workspaceStatus": "pass",
                "mcpStatus": "pass",
                "nodeCount": len(nodes),
                "edgeCount": len(edges),
                "auditCategoryCount": 9,
                "taskCount": 3,
                "generatedTaskCount": 2,
                "requiredMcpCount": 3,
                "promptTemplateCount": 11,
            },
            "nodes": nodes,
            "edges": edges,
            "boundaries": [
                "deterministic-local",
                "no-external-mcp-calls",
                "no-target-repo-mutation",
                "no-new-dependencies",
            ],
        },
        ensure_ascii=False,
        indent=2,
    )
