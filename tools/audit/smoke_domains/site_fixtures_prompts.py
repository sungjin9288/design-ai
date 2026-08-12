from __future__ import annotations

import json


def passing_site_prompt_markdown() -> str:
    return """# Codex implementation prompt
Site profile:
- Name: Korean SaaS marketing site
- Live URL: https://example.com
- Repo URL: https://github.com/acme/korean-saas-site
- Local path: /Users/you/dev/korean-saas-site
- Figma URL: https://figma.com/file/example
- Deploy: vercel
- Sentry: acme/korean-saas-web
- CMS: sanity
- Database: none
- Viewports: desktop, tablet, mobile

Priority pages:
- /
- /pricing
- /signup
- /docs

User flows:
- Visitor compares pricing and starts signup
- Existing customer finds feature proof before contacting sales

Brand/design notes:
Quiet B2B SaaS tone, Pretendard typography, dense but readable Korean product copy, indigo accent only for action and focus.

Selected task:
- Task ID: task-homepage-cta
- Title: Clarify homepage CTA hierarchy
- Category: Visual Design
- Problem: Primary and secondary actions compete in the hero, which weakens the visitor's first decision.
- Evidence: Sample finding: Primary CTA competes with secondary link on the homepage.
- Impact: high
- Effort: medium
- Priority: p1
- Pages: /
- Recommended MCP: browser, figma

Verification:
- Run target repo lint/build
- Verify desktop/tablet/mobile hero layout
- Confirm focus indicators and text contrast

Risks:
- Could change conversion copy without stakeholder approval

Rules:
- Work in the target website repository, not in this design-ai repository.
- Inspect existing architecture, components, state, styling, and design tokens before editing.
- Keep changes scoped and avoid new dependencies unless clearly justified.
- Preserve accessibility: keyboard reachability, visible focus, semantic HTML, screen-reader labels, and WCAG 2.1 AA contrast.
- Verify desktop, tablet, and mobile layouts.

Implement the smallest safe fix. After editing, run the target repo's most relevant lint/typecheck/build/test command and summarize changed files plus verification.
"""


def passing_site_prompt_templates_json() -> str:
    templates = [
        {
            "id": "implementation-plan",
            "label": "Implementation plan",
            "agent": "codex-or-claude",
            "output": "Portable implementation plan",
            "description": "Plan one website improvement task with source, approval, and verification evidence.",
            "taskSelectable": True,
        },
        {
            "id": "critique-loop",
            "label": "Critique loop",
            "agent": "codex-or-claude",
            "output": "Observed critique and revision loop",
            "description": "Review, revise, and re-observe one website decision without losing the evidence trail.",
            "taskSelectable": True,
        },
        {
            "id": "design-contract",
            "label": "Agent-readable DESIGN.md",
            "agent": "codex-or-claude",
            "output": "DESIGN.md contract",
            "description": "Create the canonical brand, component, motion, accessibility, and responsive contract for agents.",
            "taskSelectable": False,
        },
        {
            "id": "codex-repo-intake",
            "label": "Codex repo intake",
            "agent": "codex",
            "output": "Repository inspection plan",
            "description": "Inspect the target website repo and return structure, likely touch points, risks, and verification commands.",
            "taskSelectable": False,
        },
        {
            "id": "codex-implementation",
            "label": "Codex implementation",
            "agent": "codex",
            "output": "Focused implementation prompt",
            "description": "Implement the selected website improvement task in the target repo with scoped verification.",
            "taskSelectable": True,
        },
        {
            "id": "codex-visual-qa",
            "label": "Codex visual QA",
            "agent": "codex",
            "output": "Browser/Playwright QA checklist",
            "description": "Verify priority pages across configured viewports for layout, focus, console, and asset issues.",
            "taskSelectable": False,
        },
        {
            "id": "codex-deployment",
            "label": "Codex deployment verification",
            "agent": "codex",
            "output": "Deployment verification prompt",
            "description": "Check preview or production deployment, logs, metadata, user flows, and remaining launch risks.",
            "taskSelectable": False,
        },
        {
            "id": "claude-design-review",
            "label": "Claude design review",
            "agent": "claude",
            "output": "Senior design critique",
            "description": "Review visual hierarchy, layout rhythm, typography, CTA clarity, responsive behavior, and accessibility concerns.",
            "taskSelectable": False,
        },
        {
            "id": "claude-competitor",
            "label": "Claude competitor research",
            "agent": "claude",
            "output": "Competitor opportunity map",
            "description": "Compare relevant peer sites for structure, conversion path, proof, pricing, tone, content, and SEO positioning.",
            "taskSelectable": False,
        },
        {
            "id": "claude-copy-ux",
            "label": "Claude copy/UX critique",
            "agent": "claude",
            "output": "Copy and UX improvement notes",
            "description": "Critique copy, information architecture, trust signals, CTA language, and conversion flow.",
            "taskSelectable": False,
        },
        {
            "id": "handoff-report",
            "label": "Final handoff report",
            "agent": "codex-or-claude",
            "output": "Final handoff report prompt",
            "description": "Generate a final report covering target site info, audit summary, recommendations, executed work, verification, risks, and next actions.",
            "taskSelectable": False,
        },
    ]
    return json.dumps({"count": len(templates), "templates": templates}, ensure_ascii=False, indent=2)
