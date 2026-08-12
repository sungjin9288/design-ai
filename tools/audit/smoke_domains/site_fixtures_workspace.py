from __future__ import annotations

import json


def passing_site_json() -> str:
    return json.dumps(
        {
            "filePath": "stdin",
            "valid": True,
            "status": "pass",
            "site": {
                "id": "sample-korean-saas",
                "name": "Korean SaaS marketing site",
                "liveUrl": "https://example.com",
                "repoUrl": "https://github.com/acme/korean-saas-site",
                "localPath": "/Users/you/dev/korean-saas-site",
                "deployProvider": "vercel",
                "cms": "sanity",
                "database": "none",
                "pages": ["/", "/pricing", "/signup", "/docs"],
                "userFlows": [
                    "Visitor compares pricing and starts signup",
                    "Existing customer finds feature proof before contacting sales",
                ],
                "viewports": ["desktop", "tablet", "mobile"],
            },
            "counts": {
                "pages": 4,
                "userFlows": 2,
                "viewports": 3,
                "auditCategories": 9,
                "auditFindings": 3,
                "refactorTasks": 1,
                "executedWork": 0,
                "verificationResults": 0,
                "remainingRisks": 3,
                "nextActions": 0,
                "requiredMcp": 3,
                "optionalMcp": 6,
                "unavailableMcp": 0,
            },
            "auditStatusCounts": {
                "todo": 7,
                "in-progress": 2,
                "done": 0,
                "blocked": 0,
            },
            "mcpStatusCounts": {
                "required": 3,
                "optional": 6,
                "unused": 1,
                "unavailable": 0,
            },
            "taskPriorityCounts": {
                "p0": 0,
                "p1": 1,
                "p2": 0,
                "p3": 0,
            },
            "requiredMcp": ["github", "browser", "deploy"],
            "topTasks": [
                {
                    "id": "task-homepage-cta",
                    "title": "Clarify homepage CTA hierarchy",
                    "priority": "p1",
                    "category": "visual-design",
                    "impact": "high",
                    "effort": "medium",
                    "pages": ["/"],
                },
            ],
            "issues": [
                {
                    "level": "pass",
                    "id": "workspace-ready",
                    "message": "Workspace is ready for report and prompt generation",
                },
            ],
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_site_next_actions_json() -> str:
    return json.dumps(
        {
            "kind": "website-improvement-next-actions",
            "version": 1,
            "filePath": "stdin",
            "status": "pass",
            "workspaceStatus": "pass",
            "mcpStatus": "pass",
            "mcpProbeStatus": "pass",
            "mcpProbeCounts": {
                "count": 4,
                "pass": 4,
                "warn": 0,
                "fail": 0,
            },
            "site": {
                "name": "Korean SaaS marketing site",
                "liveUrl": "https://example.com",
                "repoUrl": "https://github.com/acme/korean-saas-site",
                "localPath": "/Users/you/dev/korean-saas-site",
            },
            "counts": {
                "actions": 3,
                "blocking": 0,
                "warnings": 0,
                "tasks": 1,
                "requiredMcpMissing": 0,
                "taskGaps": 0,
                "probeGaps": 0,
            },
            "topTasks": [
                {
                    "id": "task-homepage-cta",
                    "title": "Clarify homepage CTA hierarchy",
                    "priority": "p1",
                    "category": "visual-design",
                    "impact": "high",
                    "effort": "medium",
                },
            ],
            "actions": [
                {
                    "rank": 1,
                    "severity": "implementation",
                    "title": "Prepare Codex implementation prompt for task-homepage-cta",
                    "reason": "Clarify homepage CTA hierarchy is the highest-priority available refactor task.",
                    "command": "design-ai site <workspace.json> --prompt codex-implementation --task 1 --out codex-implementation.md",
                    "references": ["task-homepage-cta"],
                },
                {
                    "rank": 2,
                    "severity": "handoff",
                    "title": "Create implementation evidence trail",
                    "reason": "Executed work or verification results are still empty, so the handoff report should capture what remains unverified.",
                    "command": "design-ai site <workspace.json> --report --out website-handoff.md",
                    "references": ["implementationEvidence"],
                },
                {
                    "rank": 3,
                    "severity": "handoff",
                    "title": "Export portable handoff bundle",
                    "reason": "A bundle keeps summary, tasks, MCP evidence, prompts, and handoff report together for the target website repo workflow.",
                    "command": "design-ai site <workspace.json> --bundle --out website-handoff-bundle",
                    "references": ["bundle"],
                },
            ],
            "commands": {
                "summary": "design-ai site <workspace.json> --json",
                "mcpCheck": "design-ai site <workspace.json> --mcp-check --strict --json",
                "mcpPlan": "design-ai site <workspace.json> --mcp-plan --out mcp-action-plan.md",
                "mcpCheckProbes": "design-ai site <workspace.json> --mcp-check --probes --json --out mcp-check-probes.json",
                "mcpPlanProbes": "design-ai site <workspace.json> --mcp-plan --probes --json --out mcp-action-plan-probes.json",
                "tasks": "design-ai site <workspace.json> --tasks --out website-workspace.tasks.json",
                "implementationPrompt": "design-ai site <workspace.json> --prompt codex-implementation --task 1 --out codex-implementation.md",
                "handoffReport": "design-ai site <workspace.json> --report --out website-handoff.md",
                "handoffBundle": "design-ai site <workspace.json> --bundle --out website-handoff-bundle",
            },
            "boundaries": [
                "This next-action report is deterministic and local.",
                "It does not call external MCPs, mutate the target website repo, run Lighthouse/axe, capture screenshots, or write deployment/CMS/Sentry data.",
                "MCP probes are read-only local URL/path/reference checks and do not connect to external MCP servers.",
                "Run implementation commands in the target website workflow after readiness blockers are cleared.",
            ],
            "externalCalls": False,
            "targetRepoMutation": False,
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_site_next_actions_human() -> str:
    return "\n".join(
        [
            "Website Improvement next actions: Korean SaaS marketing site",
            "",
            "Status: pass",
            "Workspace status: pass",
            "MCP status: pass",
            "MCP probe status: pass",
            "MCP probes: 4/4 passing, 0 warning, 0 failing",
            "Actions: 3 (0 blocking, 0 warning)",
            "",
            "Prioritized actions:",
            "1. [implementation] Prepare Codex implementation prompt for task-homepage-cta",
            "   Why: Clarify homepage CTA hierarchy is the highest-priority available refactor task.",
            "   Command: `design-ai site <workspace.json> --prompt codex-implementation --task 1 --out codex-implementation.md`",
            "   References: task-homepage-cta",
            "2. [handoff] Create implementation evidence trail",
            "   Why: Executed work or verification results are still empty, so the handoff report should capture what remains unverified.",
            "   Command: `design-ai site <workspace.json> --report --out website-handoff.md`",
            "   References: implementationEvidence",
            "3. [handoff] Export portable handoff bundle",
            "   Why: A bundle keeps summary, tasks, MCP evidence, prompts, and handoff report together for the target website repo workflow.",
            "   Command: `design-ai site <workspace.json> --bundle --out website-handoff-bundle`",
            "   References: bundle",
            "",
            "Boundaries:",
            "- This next-action report is deterministic and local.",
            "- It does not call external MCPs, mutate the target website repo, run Lighthouse/axe, capture screenshots, or write deployment/CMS/Sentry data.",
            "- MCP probes are read-only local URL/path/reference checks and do not connect to external MCP servers.",
            "- Run implementation commands in the target website workflow after readiness blockers are cleared.",
        ]
    )
