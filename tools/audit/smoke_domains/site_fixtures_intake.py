from __future__ import annotations

import json


def passing_site_intake_template_json(language: str = "en") -> str:
    if language == "ko":
        recommended_file_name = "company-website-intake.ko.md"
        content = "\n".join(
            [
                "# 회사 웹사이트 Intake Template",
                "",
                "## Site Profile",
                "- 사이트 이름:",
                "- Live URL:",
                "- 대상 repo URL 또는 local path:",
                "",
                "## 우선순위 페이지",
                "- /",
                "",
                "## 주요 사용자 흐름",
                "- 방문자가 가치를 비교하고 signup을 시작",
                "",
                "## MCP Readiness Notes",
                "- GitHub: required",
                "",
                "## 초기 Audit Findings",
                "- Visual Design: todo",
                "",
                "## 첫 Bundle Commands",
                "design-ai site --init \\",
                "  --bundle \\",
                "  --out website-handoff-bundle \\",
                "",
                "## Target Repo Verification Plan",
                "- target repo에서 lint, typecheck, build, visual QA를 실행합니다.",
                "",
                "## Stop Conditions",
                "- production secret, 고객 데이터, live deployment 수정 전 멈춥니다.",
            ]
        )
    else:
        recommended_file_name = "company-website-intake.md"
        content = "\n".join(
            [
                "# Company Website Intake Template",
                "",
                "## Site Profile",
                "- Site name:",
                "- Live URL:",
                "- Target repo URL or local path:",
                "",
                "## Priority Pages",
                "- /",
                "",
                "## Primary User Flows",
                "- Visitor evaluates value and starts signup",
                "",
                "## MCP Readiness Notes",
                "- GitHub: required",
                "",
                "## Initial Audit Findings",
                "- Visual Design: todo",
                "",
                "## First Bundle Commands",
                "design-ai site --init \\",
                "  --bundle \\",
                "  --out website-handoff-bundle \\",
                "",
                "## Target Repo Verification Plan",
                "- Run lint, typecheck, build, and visual QA in the target repo.",
                "",
                "## Stop Conditions",
                "- Stop before mutating production secrets, customer data, or live deployments.",
            ]
        )
    return json.dumps(
        {
            "kind": "website-improvement-intake-template",
            "version": 1,
            "format": "markdown",
            "language": language,
            "recommendedFileName": recommended_file_name,
            "sections": [
                "site-profile",
                "priority-pages",
                "primary-user-flows",
                "brand-and-content-notes",
                "mcp-readiness-notes",
                "initial-audit-findings",
                "first-bundle-commands",
                "target-repo-verification-plan",
                "stop-conditions",
            ],
            "privacy": {
                "storesCredentials": False,
                "storesProductionSecrets": False,
                "storesCustomerData": False,
            },
            "commands": {
                "nextActions": "design-ai site --init --name \"<site name>\" --live-url <live-url> --local-path <absolute-target-repo-path> --next-actions --out website-next-actions.md --force",
                "bundle": "design-ai site --init --name \"<site name>\" --live-url <live-url> --local-path <absolute-target-repo-path> --bundle --out website-handoff-bundle --strict --force",
                "bundleCheck": "design-ai site website-handoff-bundle --bundle-check --strict --json --out website-bundle-check.json --force",
                "bundleHandoff": "design-ai site website-handoff-bundle --bundle-handoff --strict --out target-repo-handoff.md --force",
            },
            "content": content,
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_site_sample_json() -> str:
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
                "ux-flow": {"status": "todo", "notes": "Map visitor path from landing page to pricing and signup.", "findings": []},
                "responsive": {"status": "todo", "notes": "Check 1440, 1024, 390, and 360 width layouts.", "findings": []},
                "accessibility": {
                    "status": "todo",
                    "notes": "Keyboard and focus audit required for nav, pricing toggle, and forms.",
                    "findings": ["Focus state is not yet documented for the mobile menu"],
                },
                "performance": {"status": "todo", "notes": "Run Lighthouse after visual pass.", "findings": []},
                "seo": {"status": "todo", "notes": "Inspect title, description, heading order, canonical, OG.", "findings": []},
                "technical-quality": {"status": "todo", "notes": "Confirm component reuse before editing target repo.", "findings": []},
                "runtime-issues": {"status": "todo", "notes": "Open console/network once preview deploy is available.", "findings": []},
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
        indent=2,
    )


def passing_site_init_json() -> str:
    return json.dumps(
        {
            "version": 1,
            "updatedAt": "2026-06-17T00:00:00.000Z",
            "siteProfile": {
                "id": "company-marketing-site",
                "name": "Company marketing site",
                "liveUrl": "https://example.com",
                "repoUrl": "https://github.com/acme/site",
                "localPath": "",
                "figmaUrl": "",
                "brandNotes": "",
                "deployProvider": "vercel",
                "sentryProject": "",
                "cms": "none",
                "database": "none",
                "pages": ["/", "/pricing"],
                "userFlows": ["Visitor compares plans and starts signup"],
                "viewports": ["desktop", "mobile"],
            },
            "auditChecklist": {
                "visual-design": {
                    "status": "todo",
                    "notes": "Review layout, typography, color, spacing, hierarchy, and CTA treatment across /, /pricing.",
                    "findings": [],
                },
                "ux-flow": {
                    "status": "todo",
                    "notes": "Map and test the primary flow(s): Visitor compares plans and starts signup.",
                    "findings": [],
                },
                "responsive": {"status": "todo", "notes": "Verify configured viewports: desktop, mobile.", "findings": []},
                "accessibility": {"status": "todo", "notes": "Check keyboard navigation, focus indicators, semantic structure, ARIA usage, and contrast before implementation handoff.", "findings": []},
                "performance": {"status": "todo", "notes": "Run target-repo or deployment performance checks after the first visual/UX pass.", "findings": []},
                "seo": {"status": "todo", "notes": "Inspect title, description, canonical, OG metadata, sitemap exposure, and heading order for priority pages.", "findings": []},
                "technical-quality": {"status": "todo", "notes": "Inspect target repo architecture before editing; preserve existing components, tokens, styling conventions, and verification commands.", "findings": []},
                "runtime-issues": {"status": "todo", "notes": "Use Browser/Chrome DevTools or deployment logs to check console errors, network failures, hydration issues, and broken assets.", "findings": []},
                "content-quality": {"status": "todo", "notes": "Review copy clarity, information architecture, proof points, trust signals, Korean/English tone, and CTA wording.", "findings": []},
            },
            "mcpReadiness": {
                "github": "required",
                "figma": "unused",
                "browser": "required",
                "chromeDevtools": "optional",
                "deploy": "required",
                "sentry": "unused",
                "database": "unused",
                "cms": "unused",
                "collaboration": "optional",
                "research": "optional",
            },
            "refactorTasks": [],
            "implementationEvidence": {
                "executedWork": [],
                "verificationResults": [],
                "remainingRisks": [
                    "MCP readiness gaps may limit verification depth.",
                    "Copy or brand changes may require stakeholder review.",
                    "Automated performance/accessibility tooling is outside this MVP unless run in the target repo.",
                ],
                "nextActions": [
                    "Run `design-ai site <workspace.json> --mcp-check --probes --json` before target-repo implementation.",
                    "Add audit findings in the Website Console, then run `design-ai site <workspace.json> --tasks --out website-workspace.tasks.json`.",
                ],
            },
            "reportNotes": "Generated by `design-ai site --init` for real-project Website Improvement intake. Actual target repo code changes happen outside this design-ai repository.",
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_site_from_intake_json() -> str:
    payload = json.loads(passing_site_init_json())
    payload["siteProfile"]["viewports"] = ["desktop", "tablet", "mobile"]
    payload["auditChecklist"]["responsive"]["notes"] = "Verify configured viewports: desktop, tablet, mobile."
    payload["reportNotes"] = (
        "Generated by `design-ai site --from-intake company-website-intake.md` from a local company website "
        "intake Markdown file. Actual target repo code changes happen outside this design-ai repository."
    )
    return json.dumps(payload, ensure_ascii=False, indent=2)


def passing_site_tasks_json() -> str:
    payload = json.loads(passing_site_sample_json())
    payload["updatedAt"] = "2026-05-30T00:01:00.000Z"
    payload["refactorTasks"].extend([
        {
            "id": "task-accessibility",
            "title": "Resolve Accessibility finding",
            "category": "accessibility",
            "problem": "Focus state is not yet documented for the mobile menu",
            "evidence": "Audit finding captured in the Website Improvement Console.",
            "impact": "high",
            "effort": "medium",
            "priority": "p0",
            "pages": ["/", "/pricing", "/signup"],
            "recommendedMcp": ["browser", "chromeDevtools"],
            "codexPrompt": "You are working in the target website repo, not in design-ai.\nSite: Korean SaaS marketing site\nLive URL: https://example.com\nCategory: Accessibility\nProblem: Focus state is not yet documented for the mobile menu\n\nInspect the target repo first. Reuse existing architecture, UI components, state patterns, styling conventions, and design tokens. Do not add dependencies unless the existing codebase clearly requires them.\n\nImplement the smallest safe improvement, then verify desktop/tablet/mobile behavior, keyboard focus, screen-reader semantics where relevant, and the target repo's lint/typecheck/build commands.",
            "verification": [
                "Tab through all interactive controls",
                "Confirm visible focus and accessible names",
                "Run target repo lint/typecheck/build when available",
            ],
            "risks": [
                "Target repo architecture may constrain the fix",
                "Manual stakeholder review may be needed before changing copy or brand language",
            ],
        },
        {
            "id": "task-content-quality",
            "title": "Resolve Content Quality finding",
            "category": "content-quality",
            "problem": "Pricing page does not explain plan fit in the first viewport",
            "evidence": "Audit finding captured in the Website Improvement Console.",
            "impact": "medium",
            "effort": "medium",
            "priority": "p1",
            "pages": ["/", "/pricing", "/signup"],
            "recommendedMcp": ["figma", "research", "cms"],
            "codexPrompt": "You are working in the target website repo, not in design-ai.\nSite: Korean SaaS marketing site\nLive URL: https://example.com\nCategory: Content Quality\nProblem: Pricing page does not explain plan fit in the first viewport\n\nInspect the target repo first. Reuse existing architecture, UI components, state patterns, styling conventions, and design tokens. Do not add dependencies unless the existing codebase clearly requires them.\n\nImplement the smallest safe improvement, then verify desktop/tablet/mobile behavior, keyboard focus, screen-reader semantics where relevant, and the target repo's lint/typecheck/build commands.",
            "verification": [
                "Read the page as a first-time visitor",
                "Check whether claims have concrete proof",
                "Run target repo lint/typecheck/build when available",
            ],
            "risks": [
                "Target repo architecture may constrain the fix",
                "Manual stakeholder review may be needed before changing copy or brand language",
            ],
        },
    ])
    return json.dumps(payload, ensure_ascii=False, indent=2)
