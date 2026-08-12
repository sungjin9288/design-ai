from __future__ import annotations

import json


def passing_site_mcp_check_json() -> str:
    items = [
        {
            "key": "github",
            "label": "GitHub",
            "requestedStatus": "required",
            "state": "ready",
            "level": "pass",
            "evidence": [
                "repoUrl: https://github.com/acme/korean-saas-site",
                "localPath: /Users/you/dev/korean-saas-site",
            ],
            "actions": [],
        },
        {
            "key": "figma",
            "label": "Figma",
            "requestedStatus": "optional",
            "state": "ready",
            "level": "pass",
            "evidence": ["figmaUrl: https://figma.com/file/example"],
            "actions": [],
        },
        {
            "key": "browser",
            "label": "Browser/Playwright",
            "requestedStatus": "required",
            "state": "ready",
            "level": "pass",
            "evidence": ["liveUrl: https://example.com", "viewports: desktop, tablet, mobile"],
            "actions": [],
        },
        {
            "key": "chromeDevtools",
            "label": "Chrome DevTools",
            "requestedStatus": "optional",
            "state": "ready",
            "level": "pass",
            "evidence": ["liveUrl: https://example.com"],
            "actions": [],
        },
        {
            "key": "deploy",
            "label": "Deploy",
            "requestedStatus": "required",
            "state": "ready",
            "level": "pass",
            "evidence": ["deployProvider: vercel", "liveUrl: https://example.com"],
            "actions": [],
        },
        {
            "key": "sentry",
            "label": "Sentry",
            "requestedStatus": "optional",
            "state": "ready",
            "level": "pass",
            "evidence": ["sentryProject: acme/korean-saas-web"],
            "actions": [],
        },
        {
            "key": "database",
            "label": "Database",
            "requestedStatus": "unused",
            "state": "unused",
            "level": "pass",
            "evidence": ["Marked unused in mcpReadiness."],
            "actions": [],
        },
        {
            "key": "cms",
            "label": "CMS",
            "requestedStatus": "optional",
            "state": "ready",
            "level": "pass",
            "evidence": ["cms: sanity"],
            "actions": [],
        },
        {
            "key": "collaboration",
            "label": "Collaboration",
            "requestedStatus": "optional",
            "state": "ready",
            "level": "pass",
            "evidence": ["Optional collaboration is tracked in handoff notes for this local MVP."],
            "actions": [],
        },
        {
            "key": "research",
            "label": "Research",
            "requestedStatus": "optional",
            "state": "ready",
            "level": "pass",
            "evidence": ["liveUrl: https://example.com"],
            "actions": [],
        },
    ]
    return json.dumps(
        {
            "filePath": "stdin",
            "status": "pass",
            "workspaceStatus": "pass",
            "site": {
                "name": "Korean SaaS marketing site",
                "liveUrl": "https://example.com",
                "repoUrl": "https://github.com/acme/korean-saas-site",
                "localPath": "/Users/you/dev/korean-saas-site",
            },
            "counts": {
                "total": 10,
                "required": 3,
                "optional": 6,
                "ready": 9,
                "missing": 0,
                "unused": 1,
                "unavailable": 0,
                "taskGaps": 0,
            },
            "items": items,
            "taskGaps": [],
            "workspaceIssues": [],
            "nextActions": [],
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_site_mcp_check_probes_json() -> str:
    payload = json.loads(passing_site_mcp_check_json())
    payload["probes"] = {
        "enabled": True,
        "mode": "read-only-local",
        "externalCalls": False,
        "status": "pass",
        "count": 4,
        "pass": 4,
        "warn": 0,
        "fail": 0,
        "items": [
            {
                "id": "github-repo-reference",
                "key": "github",
                "label": "GitHub repo reference",
                "requestedStatus": "required",
                "level": "pass",
                "passed": True,
                "message": "Target repo reference is parseable for Codex handoff.",
                "evidence": ["github repo: acme/korean-saas-site"],
                "actions": [],
            },
            {
                "id": "figma-url-reference",
                "key": "figma",
                "label": "Figma file reference",
                "requestedStatus": "optional",
                "level": "pass",
                "passed": True,
                "message": "Figma URL is parseable for design-context handoff.",
                "evidence": ["figma reference: file/example"],
                "actions": [],
            },
            {
                "id": "browser-smoke-target",
                "key": "browser",
                "label": "Browser smoke target",
                "requestedStatus": "required",
                "level": "pass",
                "passed": True,
                "message": "Browser smoke target and viewport set are ready for manual or MCP-driven QA.",
                "evidence": ["liveUrl host: example.com", "viewports: desktop, tablet, mobile"],
                "actions": [],
            },
            {
                "id": "deploy-provider-reference",
                "key": "deploy",
                "label": "Deployment provider reference",
                "requestedStatus": "required",
                "level": "pass",
                "passed": True,
                "message": "Deployment provider and live URL are configured for verification handoff.",
                "evidence": ["deployProvider: vercel", "liveUrl host: example.com"],
                "actions": [],
            },
        ],
    }
    payload["commands"] = {
        "mcpCheckProbesHumanOut": "design-ai site <workspace.json> --mcp-check --probes --out mcp-check-probes.txt",
        "mcpCheckProbesJsonOut": "design-ai site <workspace.json> --mcp-check --probes --json --out mcp-check-probes.json",
        "mcpPlanProbesJson": "design-ai site <workspace.json> --mcp-plan --probes --json",
        "mcpPlanProbesJsonOut": "design-ai site <workspace.json> --mcp-plan --probes --json --out mcp-action-plan-probes.json",
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def passing_site_mcp_check_probes_human() -> str:
    return """Website Improvement MCP readiness: Korean SaaS marketing site

Status: pass
Workspace status: pass
Required MCP: 3
Ready: 9
Missing: 0
Task gaps: 0

MCP checks:
- [pass] GitHub (required) -> ready
   Evidence: repoUrl: https://github.com/acme/korean-saas-site; localPath: /Users/you/dev/korean-saas-site
- [pass] Figma (optional) -> ready
   Evidence: figmaUrl: https://figma.com/file/example
- [pass] Browser/Playwright (required) -> ready
   Evidence: liveUrl: https://example.com; viewports: desktop, tablet, mobile
- [pass] Chrome DevTools (optional) -> ready
   Evidence: liveUrl: https://example.com
- [pass] Deploy (required) -> ready
   Evidence: deployProvider: vercel; liveUrl: https://example.com
- [pass] Sentry (optional) -> ready
   Evidence: sentryProject: acme/korean-saas-web
- [pass] Database (unused) -> unused
   Evidence: Marked unused in mcpReadiness.
- [pass] CMS (optional) -> ready
   Evidence: cms: sanity
- [pass] Collaboration (optional) -> ready
   Evidence: Optional collaboration is tracked in handoff notes for this local MVP.
- [pass] Research (optional) -> ready
   Evidence: liveUrl: https://example.com

Task MCP gaps:
- none

Read-only probes:
Mode: read-only-local; external calls: no; status: pass
- [pass] GitHub repo reference (required) -> pass
   Evidence: github repo: acme/korean-saas-site
- [pass] Figma file reference (optional) -> pass
   Evidence: figma reference: file/example
- [pass] Browser smoke target (required) -> pass
   Evidence: liveUrl host: example.com; viewports: desktop, tablet, mobile
- [pass] Deployment provider reference (required) -> pass
   Evidence: deployProvider: vercel; liveUrl host: example.com

Probe commands:
- Save readiness probe report: `design-ai site <workspace.json> --mcp-check --probes --out mcp-check-probes.txt`
- Save readiness probe JSON: `design-ai site <workspace.json> --mcp-check --probes --json --out mcp-check-probes.json`
- Generate probe action plan JSON: `design-ai site <workspace.json> --mcp-plan --probes --json`
- Save probe action plan JSON: `design-ai site <workspace.json> --mcp-plan --probes --json --out mcp-action-plan-probes.json`

Next actions:
- none
"""
