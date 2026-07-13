// Static Website Improvement content catalogs shared by the site CLI helpers.

export const SITE_INTAKE_TEMPLATE_SECTIONS = [
  "site-profile",
  "priority-pages",
  "primary-user-flows",
  "brand-and-content-notes",
  "mcp-readiness-notes",
  "initial-audit-findings",
  "first-bundle-commands",
  "target-repo-verification-plan",
  "stop-conditions",
];

export const SITE_INTAKE_TEMPLATE_MARKDOWN = `# Company Website Intake Template

Fill this template before the first Website Improvement dogfood pass. Keep sensitive credentials, private tokens, production secrets, and customer data out of this document.

## Site Profile

| Field | Value |
|---|---|
| Site name | |
| Live URL | |
| Target repo URL | |
| Target repo local path | |
| Figma URL | |
| Deploy provider | \`vercel\` / \`netlify\` / \`cloudflare\` / \`other\` / \`none\` |
| Sentry project | |
| CMS | \`sanity\` / \`contentful\` / \`wordpress\` / \`shopify\` / \`none\` / \`other\` |
| Database | \`supabase\` / \`neon\` / \`postgres\` / \`none\` / \`other\` |

## Priority Pages

List 2-5 pages for the first pilot. Start with pages that affect conversion, trust, signup, inquiry, purchase, or onboarding.

| Priority | Path or URL | Why it matters |
|---:|---|---|
| 1 | \`/\` | |
| 2 | | |
| 3 | | |
| 4 | | |
| 5 | | |

## Primary User Flows

| Priority | Flow | Success signal |
|---:|---|---|
| 1 | | |
| 2 | | |
| 3 | | |

## Brand And Content Notes

| Area | Notes |
|---|---|
| Brand tone | |
| Typography constraints | |
| Color constraints | |
| Korean copy rules | |
| Legal or compliance copy | |
| Trust signals | |
| Competitors or references | |

## MCP Readiness Notes

Mark each external system as \`required\`, \`optional\`, \`unused\`, or \`unavailable\`.

| System | Status | Evidence or fallback |
|---|---|---|
| GitHub | | |
| Figma | | |
| Browser / Playwright | | |
| Chrome DevTools | | |
| Deploy provider | | |
| Sentry | | |
| Database | | |
| CMS | | |
| Collaboration tool | | |
| Research tool | | |

## Initial Audit Findings

Capture only findings that are grounded in inspection. Do not invent Lighthouse, axe, crawler, or analytics results unless those tools were actually run in the target repo or browser.

| Category | Finding | Evidence | Page |
|---|---|---|---|
| Visual design | | | |
| UX flow | | | |
| Responsive | | | |
| Accessibility | | | |
| Performance | | | |
| SEO | | | |
| Technical quality | | | |
| Runtime issues | | | |
| Content quality | | | |

## First Bundle Commands

Replace placeholders and run from the \`design-ai\` repository.
Add \`--live-url <live-url>\` when a preview or deployed site already exists.

\`\`\`bash
design-ai site --init \\
  --name "<site name>" \\
  --local-path <absolute-target-repo-path> \\
  --page / \\
  --page <priority-page-2> \\
  --flow "<primary user flow>" \\
  --next-actions \\
  --out website-next-actions.md \\
  --force
\`\`\`

\`\`\`bash
design-ai site --init \\
  --name "<site name>" \\
  --local-path <absolute-target-repo-path> \\
  --page / \\
  --page <priority-page-2> \\
  --flow "<primary user flow>" \\
  --bundle \\
  --out website-handoff-bundle \\
  --strict \\
  --force
\`\`\`

\`\`\`bash
design-ai site website-handoff-bundle --bundle-check --strict --json --out website-bundle-check.json --force
design-ai site website-handoff-bundle --bundle-handoff --strict --out target-repo-handoff.md --force
\`\`\`

## Target Repo Verification Plan

Fill this before implementation so the target-repo agent has a clear quality gate.

| Gate | Command or manual check | Required for pilot |
|---|---|---:|
| Install | | yes |
| Lint | | yes |
| Typecheck | | if available |
| Unit tests | | if available |
| Build | | yes |
| Browser smoke | | yes |
| Accessibility spot check | | yes |
| Deployment preview | | if available |

## Stop Conditions

Stop before target-repo edits when any answer is unclear:

- Which repo and branch should be modified?
- Which single task should be implemented first?
- Which verification commands must pass?
- Which credentials or production systems are off limits?
- Where should implementation evidence be recorded after the target-repo pass?
`;

export const SITE_INTAKE_TEMPLATE_MARKDOWN_KO = `# 회사 웹사이트 Intake Template

첫 Website Improvement dogfood 전에 이 template을 채웁니다. 민감한 credential, private token, production secret, 고객 데이터는 이 문서에 적지 않습니다.

## Site Profile

| 항목 | 값 |
|---|---|
| 사이트 이름 | |
| Live URL | |
| 대상 repo URL | |
| 대상 repo local path | |
| Figma URL | |
| 배포 플랫폼 | \`vercel\` / \`netlify\` / \`cloudflare\` / \`other\` / \`none\` |
| Sentry 프로젝트 | |
| CMS | \`sanity\` / \`contentful\` / \`wordpress\` / \`shopify\` / \`none\` / \`other\` |
| Database | \`supabase\` / \`neon\` / \`postgres\` / \`none\` / \`other\` |

## 우선순위 페이지

첫 pilot에서는 2-5개 페이지를 고릅니다. 전환, 신뢰, 가입, 문의, 구매, 온보딩에 영향을 주는 페이지부터 시작합니다.

| 우선순위 | Path 또는 URL | 중요한 이유 |
|---:|---|---|
| 1 | \`/\` | |
| 2 | | |
| 3 | | |
| 4 | | |
| 5 | | |

## 주요 사용자 흐름

| 우선순위 | Flow | 성공 신호 |
|---:|---|---|
| 1 | | |
| 2 | | |
| 3 | | |

## Brand And Content Notes

| 영역 | 메모 |
|---|---|
| 브랜드 톤 | |
| 타이포그래피 제약 | |
| 컬러 제약 | |
| 한국어 카피 규칙 | |
| 법무 또는 compliance 문구 | |
| 신뢰 요소 | |
| 경쟁사 또는 레퍼런스 | |

## MCP Readiness Notes

각 외부 시스템을 \`required\`, \`optional\`, \`unused\`, \`unavailable\` 중 하나로 표시합니다.

| 시스템 | 상태 | 근거 또는 fallback |
|---|---|---|
| GitHub | | |
| Figma | | |
| Browser / Playwright | | |
| Chrome DevTools | | |
| 배포 플랫폼 | | |
| Sentry | | |
| Database | | |
| CMS | | |
| 협업 도구 | | |
| 리서치 도구 | | |

## 초기 Audit Findings

실제로 확인한 finding만 기록합니다. Lighthouse, axe, crawler, analytics를 실제로 실행하지 않았다면 해당 결과를 만들어 쓰지 않습니다.

| Category | Finding | Evidence | Page |
|---|---|---|---|
| Visual design | | | |
| UX flow | | | |
| Responsive | | | |
| Accessibility | | | |
| Performance | | | |
| SEO | | | |
| Technical quality | | | |
| Runtime issues | | | |
| Content quality | | | |

## 첫 Bundle Commands

placeholder를 바꾼 뒤 \`design-ai\` repo에서 실행합니다.
preview 또는 배포된 사이트가 이미 있으면 \`--live-url <live-url>\`을 추가합니다.

\`\`\`bash
design-ai site --init \\
  --name "<site name>" \\
  --local-path <absolute-target-repo-path> \\
  --page / \\
  --page <priority-page-2> \\
  --flow "<primary user flow>" \\
  --next-actions \\
  --out website-next-actions.md \\
  --force
\`\`\`

\`\`\`bash
design-ai site --init \\
  --name "<site name>" \\
  --local-path <absolute-target-repo-path> \\
  --page / \\
  --page <priority-page-2> \\
  --flow "<primary user flow>" \\
  --bundle \\
  --out website-handoff-bundle \\
  --strict \\
  --force
\`\`\`

\`\`\`bash
design-ai site website-handoff-bundle --bundle-check --strict --json --out website-bundle-check.json --force
design-ai site website-handoff-bundle --bundle-handoff --strict --out target-repo-handoff.md --force
\`\`\`

## Target Repo Verification Plan

구현 전에 채워서 target-repo agent가 명확한 quality gate를 갖게 합니다.

| Gate | 명령 또는 수동 확인 | Pilot 필수 |
|---|---|---:|
| Install | | 예 |
| Lint | | 예 |
| Typecheck | | 가능하면 |
| Unit tests | | 가능하면 |
| Build | | 예 |
| Browser smoke | | 예 |
| Accessibility spot check | | 예 |
| Deployment preview | | 가능하면 |

## Stop Conditions

아래 질문 중 하나라도 불명확하면 target repo 수정 전에 멈춥니다.

- 어떤 repo와 branch를 수정해야 하는가?
- 첫 번째로 구현할 single task는 무엇인가?
- 어떤 verification command가 반드시 통과해야 하는가?
- 어떤 credential 또는 production system이 off limits인가?
- target-repo pass 이후 implementation evidence를 어디에 기록해야 하는가?
`;

export const SITE_PROMPT_TEMPLATE_IDS = [
  "codex-repo-intake",
  "codex-implementation",
  "codex-visual-qa",
  "codex-deployment",
  "claude-design-review",
  "claude-competitor",
  "claude-copy-ux",
  "handoff-report",
];

export const SITE_BUNDLE_FILES = [
  "README.md",
  "summary.json",
  "website-workspace.tasks.json",
  "mcp-check.json",
  "mcp-probes.json",
  "mcp-action-plan.md",
  "website-handoff.md",
  "website-prompts.md",
  "codex-implementation.md",
];

export const SITE_BUNDLE_CHECKSUM_FILES = SITE_BUNDLE_FILES.filter((filePath) => filePath !== "summary.json");

export const SITE_PROMPT_TEMPLATES = [
  {
    id: "codex-repo-intake",
    label: "Codex repo intake",
    agent: "codex",
    output: "Repository inspection plan",
    description: "Inspect the target website repo and return structure, likely touch points, risks, and verification commands.",
    taskSelectable: false,
  },
  {
    id: "codex-implementation",
    label: "Codex implementation",
    agent: "codex",
    output: "Focused implementation prompt",
    description: "Implement the selected website improvement task in the target repo with scoped verification.",
    taskSelectable: true,
  },
  {
    id: "codex-visual-qa",
    label: "Codex visual QA",
    agent: "codex",
    output: "Browser/Playwright QA checklist",
    description: "Verify priority pages across configured viewports for layout, focus, console, and asset issues.",
    taskSelectable: false,
  },
  {
    id: "codex-deployment",
    label: "Codex deployment verification",
    agent: "codex",
    output: "Deployment verification prompt",
    description: "Check preview or production deployment, logs, metadata, user flows, and remaining launch risks.",
    taskSelectable: false,
  },
  {
    id: "claude-design-review",
    label: "Claude design review",
    agent: "claude",
    output: "Senior design critique",
    description: "Review visual hierarchy, layout rhythm, typography, CTA clarity, responsive behavior, and accessibility concerns.",
    taskSelectable: false,
  },
  {
    id: "claude-competitor",
    label: "Claude competitor research",
    agent: "claude",
    output: "Competitor opportunity map",
    description: "Compare relevant peer sites for structure, conversion path, proof, pricing, tone, content, and SEO positioning.",
    taskSelectable: false,
  },
  {
    id: "claude-copy-ux",
    label: "Claude copy/UX critique",
    agent: "claude",
    output: "Copy and UX improvement notes",
    description: "Critique copy, information architecture, trust signals, CTA language, and conversion flow.",
    taskSelectable: false,
  },
  {
    id: "handoff-report",
    label: "Final handoff report",
    agent: "codex-or-claude",
    output: "Final handoff report prompt",
    description: "Generate a final report covering target site info, audit summary, recommendations, executed work, verification, risks, and next actions.",
    taskSelectable: false,
  },
];

if (SITE_PROMPT_TEMPLATE_IDS.join("\n") !== SITE_PROMPT_TEMPLATES.map((template) => template.id).join("\n")) {
  throw new Error("SITE_PROMPT_TEMPLATES must match SITE_PROMPT_TEMPLATE_IDS order");
}
