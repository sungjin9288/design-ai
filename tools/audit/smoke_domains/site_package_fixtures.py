"""Website Console package-smoke input fixtures and boundary payloads."""
from __future__ import annotations

import json
from pathlib import Path

SITE_EVIDENCE_VALUES = {
    "executedWork": "Implemented pricing CTA cleanup in the target repo",
    "verificationResults": "npm run lint passed in the target repo",
    "remainingRisks": "Preview deploy still needs analytics review",
    "nextActions": "Attach before/after screenshots",
}


SITE_EVIDENCE_COUNTS = {key: 1 for key in SITE_EVIDENCE_VALUES}


SITE_INIT_SMOKE_ARGS = [
    "site",
    "--init",
    "--name",
    "Company marketing site",
    "--live-url",
    "https://example.com",
    "--repo-url",
    "https://github.com/acme/site",
    "--deploy",
    "vercel",
    "--cms",
    "none",
    "--database",
    "none",
    "--page",
    "/",
    "--page",
    "/pricing",
    "--flow",
    "Visitor compares plans and starts signup",
    "--viewport",
    "desktop",
    "--viewport",
    "mobile",
]


SITE_FROM_INTAKE_SMOKE_MARKDOWN = """# Company Website Intake Template

## Site Profile

| Field | Value |
|---|---|
| Site name | Company marketing site |
| Live URL | https://example.com |
| Target repo URL | https://github.com/acme/site |
| Target repo local path | |
| Figma URL | |
| Deploy provider | vercel |
| Sentry project | |
| CMS | none |
| Database | none |

## Priority Pages

| Priority | Path or URL | Why it matters |
|---:|---|---|
| 1 | / | Primary conversion |
| 2 | /pricing | Pricing comparison |

## Primary User Flows

| Priority | Flow | Success signal |
|---:|---|---|
| 1 | Visitor compares plans and starts signup | Signup intent |

## Brand And Content Notes

| Area | Notes |
|---|---|
| Brand tone | |

## MCP Readiness Notes

| System | Status | Evidence or fallback |
|---|---|---|
| GitHub | required | repo reference |
| Figma | unused | no file |
| Browser / Playwright | required | live URL |
| Chrome DevTools | optional | manual debugging if needed |
| Deploy provider | required | vercel |
| Sentry | unused | none |
| Database | unused | none |
| CMS | unused | none |
| Collaboration tool | optional | internal review |
| Research tool | optional | competitor review |

## Initial Audit Findings

| Category | Finding | Evidence | Page |
|---|---|---|---|
| Visual design | | | |
"""


SITE_FROM_INTAKE_TASKS_SMOKE_MARKDOWN = """# Company Website Intake Template

## Site Profile

| Field | Value |
|---|---|
| Site name | Company marketing site |
| Live URL | https://example.com |
| Target repo URL | https://github.com/acme/site |
| Target repo local path | |
| Figma URL | |
| Deploy provider | vercel |
| Sentry project | |
| CMS | none |
| Database | none |

## Priority Pages

| Priority | Path or URL | Why it matters |
|---:|---|---|
| 1 | / | Primary conversion |
| 2 | /pricing | Pricing comparison |

## Primary User Flows

| Priority | Flow | Success signal |
|---:|---|---|
| 1 | Visitor compares plans and starts signup | Signup intent |

## MCP Readiness Notes

| System | Status | Evidence or fallback |
|---|---|---|
| GitHub | required | repo reference |
| Browser / Playwright | required | live URL |
| Deploy provider | required | vercel |

## Initial Audit Findings

| Category | Finding | Evidence | Page |
|---|---|---|---|
| Accessibility | Mobile nav focus is unclear | Keyboard focus ring is missing from the menu trigger | / |
"""


def site_workspace_fixture_json() -> str:
    return json.dumps(
        {
            "version": 1,
            "updatedAt": "2026-05-30T00:00:00.000Z",
            "siteProfile": {
                "id": "sample-korean-saas",
                "name": "Korean SaaS marketing site",
                "liveUrl": "https://example.com",
                "repoUrl": "https://github.com/acme/korean-saas-site",
                "localPath": "/Users/you/dev/korean-saas-site",
                "figmaUrl": "https://figma.com/file/example",
                "brandNotes": "Quiet B2B SaaS tone, Pretendard typography, dense but readable Korean product copy, indigo accent only for action and focus.",
                "deployProvider": "vercel",
                "sentryProject": "acme/korean-saas-web",
                "cms": "sanity",
                "database": "none",
                "pages": ["/", "/pricing", "/signup", "/docs"],
                "userFlows": [
                    "Visitor compares pricing and starts signup",
                    "Existing customer finds feature proof before contacting sales",
                ],
                "viewports": ["desktop", "tablet", "mobile"],
            },
            "auditChecklist": {
                "visual-design": {
                    "status": "in-progress",
                    "notes": "Hero hierarchy and CTA contrast need review before company pilot.",
                    "findings": ["Primary CTA competes with secondary link on the homepage"],
                },
                "ux-flow": {
                    "status": "todo",
                    "notes": "Map visitor path from landing page to pricing and signup.",
                    "findings": [],
                },
                "responsive": {
                    "status": "todo",
                    "notes": "Check 1440, 1024, 390, and 360 width layouts.",
                    "findings": [],
                },
                "accessibility": {
                    "status": "todo",
                    "notes": "Keyboard and focus audit required for nav, pricing toggle, and forms.",
                    "findings": ["Focus state is not yet documented for the mobile menu"],
                },
                "performance": {
                    "status": "todo",
                    "notes": "Run Lighthouse after visual pass.",
                    "findings": [],
                },
                "seo": {
                    "status": "todo",
                    "notes": "Inspect title, description, heading order, canonical, OG.",
                    "findings": [],
                },
                "technical-quality": {
                    "status": "todo",
                    "notes": "Confirm component reuse before editing target repo.",
                    "findings": [],
                },
                "runtime-issues": {
                    "status": "todo",
                    "notes": "Open console/network once preview deploy is available.",
                    "findings": [],
                },
                "content-quality": {
                    "status": "in-progress",
                    "notes": "Copy should lead with proof and reduce generic SaaS phrasing.",
                    "findings": ["Pricing page does not explain plan fit in the first viewport"],
                },
            },
            "mcpReadiness": {
                "github": "required",
                "figma": "optional",
                "browser": "required",
                "chromeDevtools": "optional",
                "deploy": "required",
                "sentry": "optional",
                "database": "unused",
                "cms": "optional",
                "collaboration": "optional",
                "research": "optional",
            },
            "refactorTasks": [
                {
                    "id": "task-homepage-cta",
                    "title": "Clarify homepage CTA hierarchy",
                    "category": "visual-design",
                    "problem": "Primary and secondary actions compete in the hero, which weakens the visitor's first decision.",
                    "evidence": "Sample finding: Primary CTA competes with secondary link on the homepage.",
                    "impact": "high",
                    "effort": "medium",
                    "priority": "p1",
                    "pages": ["/"],
                    "recommendedMcp": ["browser", "figma"],
                    "codexPrompt": "Inspect the target homepage implementation, preserve existing design system patterns, and revise the hero CTA hierarchy so the primary signup action is visually dominant while the secondary action remains available.",
                    "verification": [
                        "Run target repo lint/build",
                        "Verify desktop/tablet/mobile hero layout",
                        "Confirm focus indicators and text contrast",
                    ],
                    "risks": ["Could change conversion copy without stakeholder approval"],
                },
            ],
            "implementationEvidence": {
                "executedWork": [],
                "verificationResults": [],
                "remainingRisks": [
                    "MCP readiness gaps may limit verification depth.",
                    "Copy or brand changes may require stakeholder review.",
                    "Automated performance/accessibility tooling is outside this MVP unless run in the target repo.",
                ],
                "nextActions": [],
            },
            "reportNotes": "MVP audit is a planning console. Run the generated prompts inside the target website repo before marking implementation complete.",
        },
        ensure_ascii=False,
    )


def site_linked_preview_fixture_json(local_path: Path) -> str:
    payload = json.loads(site_workspace_fixture_json())
    payload["siteProfile"]["localPath"] = str(local_path)
    payload["siteProfile"]["liveUrl"] = "http://localhost:4173"
    return json.dumps(payload)


def site_workspace_evidence_fixture_json() -> str:
    payload = json.loads(site_workspace_fixture_json())
    payload["implementationEvidence"] = {
        key: [value]
        for key, value in SITE_EVIDENCE_VALUES.items()
    }
    return json.dumps(payload, ensure_ascii=False)


def site_workspace_warning_fixture_json() -> str:
    payload = json.loads(site_workspace_fixture_json())
    payload["siteProfile"]["sentryProject"] = ""
    return json.dumps(payload, ensure_ascii=False)
