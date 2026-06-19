// Website Improvement Console workspace helpers for `design-ai site`.

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

import { parseOutputFlags } from "./output.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

export const SITE_OPTIONS = [
  "-h",
  "--help",
  "--json",
  "--stdin",
  "--init",
  "--name",
  "--live-url",
  "--repo-url",
  "--local-path",
  "--figma-url",
  "--brand-notes",
  "--deploy",
  "--sentry",
  "--cms",
  "--database",
  "--page",
  "--flow",
  "--viewport",
  "--from-intake",
  "--language",
  "--intake-template",
  "--sample",
  "--tasks",
  "--bundle",
  "--bundle-check",
  "--bundle-compare",
  "--bundle-handoff",
  "--bundle-repair",
  "--next-actions",
  "--prompt-list",
  "--mcp-check",
  "--mcp-plan",
  "--graph",
  "--probes",
  "--prompt",
  "--task",
  "--strict",
  "--report",
  "--prompts",
  "--out",
  "--output",
  "--force",
  "--yes",
];

export const AUDIT_CATEGORIES = [
  {
    id: "visual-design",
    label: "Visual Design",
    defaultVerification: [
      "Compare spacing rhythm across target pages",
      "Check contrast ratios for key text pairs",
    ],
  },
  {
    id: "ux-flow",
    label: "UX Flow",
    defaultVerification: [
      "Complete the primary user flow on desktop and mobile",
      "Confirm one dominant CTA per decision point",
    ],
  },
  {
    id: "responsive",
    label: "Responsive QA",
    defaultVerification: [
      "Verify desktop, tablet, and mobile viewports",
      "Check text wrapping and touch targets",
    ],
  },
  {
    id: "accessibility",
    label: "Accessibility",
    defaultVerification: [
      "Tab through all interactive controls",
      "Confirm visible focus and accessible names",
    ],
  },
  {
    id: "performance",
    label: "Performance",
    defaultVerification: [
      "Run Lighthouse or deployment analytics when available",
      "Confirm image dimensions and lazy-loading",
    ],
  },
  {
    id: "seo",
    label: "SEO",
    defaultVerification: [
      "Inspect metadata for each priority page",
      "Validate heading order and canonical links",
    ],
  },
  {
    id: "technical-quality",
    label: "Technical Quality",
    defaultVerification: [
      "Inspect component ownership before editing",
      "Run target repo lint/typecheck/build",
    ],
  },
  {
    id: "runtime-issues",
    label: "Runtime Issues",
    defaultVerification: [
      "Open the site in Browser or Chrome DevTools",
      "Confirm console and network panels are clean",
    ],
  },
  {
    id: "content-quality",
    label: "Content Quality",
    defaultVerification: [
      "Read the page as a first-time visitor",
      "Check whether claims have concrete proof",
    ],
  },
];

export const MCP_ITEMS = [
  ["github", "GitHub"],
  ["figma", "Figma"],
  ["browser", "Browser/Playwright"],
  ["chromeDevtools", "Chrome DevTools"],
  ["deploy", "Deploy"],
  ["sentry", "Sentry"],
  ["database", "Database"],
  ["cms", "CMS"],
  ["collaboration", "Collaboration"],
  ["research", "Research"],
];

const DEPLOY_OPTIONS = ["vercel", "netlify", "cloudflare", "other", "none"];
const CMS_OPTIONS = ["sanity", "contentful", "wordpress", "shopify", "none", "other"];
const DATABASE_OPTIONS = ["supabase", "neon", "postgres", "none", "other"];
const VIEWPORT_OPTIONS = ["desktop", "tablet", "mobile"];
const SITE_INTAKE_TEMPLATE_LANGUAGE_OPTIONS = ["en", "ko"];
const CHECKLIST_STATUS_OPTIONS = ["todo", "in-progress", "done", "blocked"];
const MCP_STATUS_OPTIONS = ["required", "optional", "unused", "unavailable"];
const PRIORITY_OPTIONS = ["p0", "p1", "p2", "p3"];
const IMPACT_OPTIONS = ["high", "medium", "low"];
const EFFORT_OPTIONS = ["high", "medium", "low"];
const DEFAULT_IMPLEMENTATION_RISKS = [
  "MCP readiness gaps may limit verification depth.",
  "Copy or brand changes may require stakeholder review.",
  "Automated performance/accessibility tooling is outside this MVP unless run in the target repo.",
];
const IMPLEMENTATION_EVIDENCE_KEYS = ["executedWork", "verificationResults", "remainingRisks", "nextActions"];
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

const SITE_TARGET_REPO_EXECUTION_CHECKLIST = [
  {
    id: "confirm-target-repo",
    label: "Confirm target repo working directory",
    required: true,
    evidence: "State the target repo path and confirm it is not the design-ai repo before editing.",
  },
  {
    id: "inspect-architecture",
    label: "Inspect existing architecture and design system",
    required: true,
    evidence: "Name the routing, component, styling, token, and test/build surfaces inspected before implementation.",
  },
  {
    id: "apply-focused-task",
    label: "Apply one focused Website Improvement task",
    required: true,
    evidence: "Identify the completed task id/title, changed files, and why the scope stayed limited.",
  },
  {
    id: "verify-quality-gates",
    label: "Run target repo quality gates",
    required: true,
    evidence: "Record lint/typecheck/build/test results plus browser, viewport, accessibility, and deployment checks that were available.",
  },
  {
    id: "record-handoff-evidence",
    label: "Record implementation evidence and remaining risks",
    required: true,
    evidence: "Return executed work, verification results, remaining risks, next actions, and the bundle digest used.",
  },
];

const SITE_INTAKE_TEMPLATE_SECTIONS = [
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

const SITE_INTAKE_TEMPLATE_MARKDOWN = `# Company Website Intake Template

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

\`\`\`bash
design-ai site --init \\
  --name "<site name>" \\
  --live-url <live-url> \\
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
  --live-url <live-url> \\
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

const SITE_INTAKE_TEMPLATE_MARKDOWN_KO = `# 회사 웹사이트 Intake Template

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

\`\`\`bash
design-ai site --init \\
  --name "<site name>" \\
  --live-url <live-url> \\
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
  --live-url <live-url> \\
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

function readOptionValue(args, index, flag) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

export function parseSiteArgs(args) {
  const out = {
    target: "",
    stdin: false,
    init: false,
    initProfile: {
      name: "",
      liveUrl: "",
      repoUrl: "",
      localPath: "",
      figmaUrl: "",
      brandNotes: "",
      deployProvider: "none",
      sentryProject: "",
      cms: "none",
      database: "none",
      pages: [],
      userFlows: [],
      viewports: [],
    },
    fromIntake: false,
    fromIntakePath: "",
    intakeTemplate: false,
    language: "en",
    languageProvided: false,
    sample: false,
    tasks: false,
    bundle: false,
    bundleCheck: false,
    bundleCompareTarget: "",
    bundleHandoff: false,
    bundleRepair: false,
    nextActions: false,
    promptList: false,
    mcpCheck: false,
    mcpPlan: false,
    graph: false,
    probes: false,
    promptTemplate: "",
    taskSelector: "",
    json: false,
    strict: false,
    report: false,
    prompts: false,
    outPath: "",
    force: false,
    yes: false,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    out.index = i;

    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--json") {
      out.json = true;
    } else if (arg === "--stdin") {
      out.stdin = true;
    } else if (arg === "--init") {
      out.init = true;
    } else if (arg === "--name") {
      out.initProfile.name = readOptionValue(args, i, "--name");
      i += 1;
    } else if (arg === "--live-url") {
      out.initProfile.liveUrl = readOptionValue(args, i, "--live-url");
      i += 1;
    } else if (arg === "--repo-url") {
      out.initProfile.repoUrl = readOptionValue(args, i, "--repo-url");
      i += 1;
    } else if (arg === "--local-path") {
      out.initProfile.localPath = readOptionValue(args, i, "--local-path");
      i += 1;
    } else if (arg === "--figma-url") {
      out.initProfile.figmaUrl = readOptionValue(args, i, "--figma-url");
      i += 1;
    } else if (arg === "--brand-notes") {
      out.initProfile.brandNotes = readOptionValue(args, i, "--brand-notes");
      i += 1;
    } else if (arg === "--deploy") {
      const value = readOptionValue(args, i, "--deploy");
      if (!DEPLOY_OPTIONS.includes(value)) {
        throw new Error(`--deploy must be one of: ${DEPLOY_OPTIONS.join(", ")}`);
      }
      out.initProfile.deployProvider = value;
      i += 1;
    } else if (arg === "--sentry") {
      out.initProfile.sentryProject = readOptionValue(args, i, "--sentry");
      i += 1;
    } else if (arg === "--cms") {
      const value = readOptionValue(args, i, "--cms");
      if (!CMS_OPTIONS.includes(value)) {
        throw new Error(`--cms must be one of: ${CMS_OPTIONS.join(", ")}`);
      }
      out.initProfile.cms = value;
      i += 1;
    } else if (arg === "--database") {
      const value = readOptionValue(args, i, "--database");
      if (!DATABASE_OPTIONS.includes(value)) {
        throw new Error(`--database must be one of: ${DATABASE_OPTIONS.join(", ")}`);
      }
      out.initProfile.database = value;
      i += 1;
    } else if (arg === "--page") {
      out.initProfile.pages.push(readOptionValue(args, i, "--page"));
      i += 1;
    } else if (arg === "--flow") {
      out.initProfile.userFlows.push(readOptionValue(args, i, "--flow"));
      i += 1;
    } else if (arg === "--viewport") {
      const value = readOptionValue(args, i, "--viewport");
      if (!VIEWPORT_OPTIONS.includes(value)) {
        throw new Error(`--viewport must be one of: ${VIEWPORT_OPTIONS.join(", ")}`);
      }
      out.initProfile.viewports.push(value);
      i += 1;
    } else if (arg === "--from-intake") {
      out.fromIntake = true;
      const value = args[i + 1];
      if (value && !value.startsWith("--")) {
        out.fromIntakePath = value;
        i += 1;
      }
    } else if (arg === "--language") {
      const value = readOptionValue(args, i, "--language");
      if (!SITE_INTAKE_TEMPLATE_LANGUAGE_OPTIONS.includes(value)) {
        throw new Error(`--language must be one of: ${SITE_INTAKE_TEMPLATE_LANGUAGE_OPTIONS.join(", ")}`);
      }
      out.language = value;
      out.languageProvided = true;
      i += 1;
    } else if (arg === "--intake-template") {
      out.intakeTemplate = true;
    } else if (arg === "--sample") {
      out.sample = true;
    } else if (arg === "--tasks") {
      out.tasks = true;
    } else if (arg === "--bundle") {
      out.bundle = true;
    } else if (arg === "--bundle-check") {
      out.bundleCheck = true;
    } else if (arg === "--bundle-compare") {
      const value = args[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--bundle-compare requires a second handoff bundle directory path");
      }
      out.bundleCompareTarget = value;
      i += 1;
    } else if (arg === "--bundle-handoff") {
      out.bundleHandoff = true;
    } else if (arg === "--bundle-repair") {
      out.bundleRepair = true;
    } else if (arg === "--next-actions") {
      out.nextActions = true;
    } else if (arg === "--prompt-list") {
      out.promptList = true;
    } else if (arg === "--mcp-check") {
      out.mcpCheck = true;
    } else if (arg === "--mcp-plan") {
      out.mcpPlan = true;
    } else if (arg === "--graph") {
      out.graph = true;
    } else if (arg === "--probes") {
      out.probes = true;
    } else if (arg === "--prompt") {
      const value = args[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--prompt requires a template id");
      }
      if (!SITE_PROMPT_TEMPLATE_IDS.includes(value)) {
        throw new Error(`--prompt must be one of: ${SITE_PROMPT_TEMPLATE_IDS.join(", ")}`);
      }
      out.promptTemplate = value;
      i += 1;
    } else if (arg === "--task") {
      const value = args[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--task requires a refactor task id or 1-based task number");
      }
      out.taskSelector = value;
      i += 1;
    } else if (arg === "--strict") {
      out.strict = true;
    } else if (arg === "--report") {
      out.report = true;
    } else if (arg === "--prompts") {
      out.prompts = true;
    } else if (arg === "--yes") {
      out.yes = true;
    } else if (parseOutputFlags(args, out)) {
      i = out.index;
    } else if (arg.startsWith("--")) {
      throw new Error(unknownOptionMessage("site", arg, SITE_OPTIONS));
    } else if (!out.target) {
      out.target = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  const sources = [out.target ? "file path" : "", out.stdin ? "--stdin" : ""].filter(Boolean);
  if (sources.length > 1) {
    throw new Error("Use either a workspace JSON file path or --stdin, not both");
  }
  const hasInitProfileFields = Boolean(
    out.initProfile.name
      || out.initProfile.liveUrl
      || out.initProfile.repoUrl
      || out.initProfile.localPath
      || out.initProfile.figmaUrl
      || out.initProfile.brandNotes
      || out.initProfile.sentryProject
      || out.initProfile.deployProvider !== "none"
      || out.initProfile.cms !== "none"
      || out.initProfile.database !== "none"
      || out.initProfile.pages.length > 0
      || out.initProfile.userFlows.length > 0
      || out.initProfile.viewports.length > 0,
  );
  if (hasInitProfileFields && !out.init) {
    throw new Error("Use --name, --live-url, --repo-url, --local-path, --figma-url, --brand-notes, --deploy, --sentry, --cms, --database, --page, --flow, or --viewport only with --init");
  }
  if (out.init && sources.length > 0) {
    throw new Error("Use --init without a workspace JSON file path or --stdin");
  }
  if (out.fromIntake && out.target) {
    throw new Error("Use --from-intake without a workspace JSON file path");
  }
  if (out.fromIntake && out.stdin && out.fromIntakePath) {
    throw new Error("Use --from-intake with either a file path or --stdin, not both");
  }
  if (out.fromIntake && !out.fromIntakePath && !out.stdin) {
    throw new Error("--from-intake requires a file path or --stdin");
  }
  if (out.fromIntake && (out.init || hasInitProfileFields)) {
    throw new Error("Use --from-intake without --init or init profile fields");
  }
  if (out.intakeTemplate && (sources.length > 0 || out.init || hasInitProfileFields)) {
    throw new Error("Use --intake-template without a workspace JSON file path, --stdin, --init, or init profile fields");
  }
  if (out.languageProvided && !out.intakeTemplate) {
    throw new Error("Use --language only with --intake-template");
  }
  if (out.intakeTemplate && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.bundleRepair || out.nextActions || out.promptList || out.mcpCheck || out.mcpPlan || out.graph || out.probes || out.report || out.prompts || out.promptTemplate || out.strict || out.yes)) {
    throw new Error("Use --intake-template only with --language, --json, --out, or --force");
  }
  if (out.init && !out.initProfile.name.trim()) {
    throw new Error("--init requires --name");
  }
  if (out.init && !out.initProfile.liveUrl.trim()) {
    throw new Error("--init requires --live-url");
  }
  if (out.init && (out.sample || out.tasks || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.bundleRepair || out.promptList || out.mcpCheck || out.mcpPlan || out.graph || out.report || out.prompts || out.promptTemplate)) {
    throw new Error("Use --init without --sample, --tasks, --bundle-check, --bundle-compare, --bundle-handoff, --bundle-repair, --prompt-list, --mcp-check, --mcp-plan, --graph, --report, --prompts, or --prompt");
  }
  if (out.init && out.strict && !(out.nextActions || out.bundle)) {
    throw new Error("Use --init --strict only with --next-actions or --bundle");
  }
  if (out.fromIntake && (out.intakeTemplate || out.sample || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.bundleRepair || out.promptList || out.mcpCheck || out.mcpPlan || out.graph || out.report || out.prompts || out.promptTemplate || out.yes)) {
    throw new Error("Use --from-intake only with --json, --next-actions, --tasks, --bundle, --out, --strict, or --force");
  }
  if (out.fromIntake && out.strict && !(out.nextActions || out.tasks || out.bundle)) {
    throw new Error("Use --from-intake --strict only with --next-actions, --tasks, or --bundle");
  }
  if (out.sample && sources.length > 0) {
    throw new Error("Use --sample without a workspace JSON file path or --stdin");
  }
  if (out.promptList && sources.length > 0) {
    throw new Error("Use --prompt-list without a workspace JSON file path or --stdin");
  }
  if (out.sample && (out.report || out.prompts || out.promptTemplate || out.nextActions || out.graph)) {
    throw new Error("Use --sample without --report, --prompts, --prompt, --next-actions, or --graph");
  }
  if (out.promptList && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.bundleRepair || out.nextActions || out.mcpCheck || out.mcpPlan || out.graph || out.report || out.prompts || out.promptTemplate || out.strict)) {
    throw new Error("Use --prompt-list without --sample, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, --bundle-repair, --next-actions, --mcp-check, --mcp-plan, --graph, --report, --prompts, --prompt, or --strict");
  }
  if (out.mcpCheck && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.bundleRepair || out.nextActions || out.graph || out.report || out.prompts || out.promptTemplate)) {
    throw new Error("Use --mcp-check without --sample, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, --bundle-repair, --next-actions, --graph, --report, --prompts, or --prompt");
  }
  if (out.mcpPlan && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.bundleRepair || out.nextActions || out.graph || out.report || out.prompts || out.promptTemplate)) {
    throw new Error("Use --mcp-plan without --sample, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, --bundle-repair, --next-actions, --graph, --report, --prompts, or --prompt");
  }
  if (out.probes && !(out.mcpCheck || out.mcpPlan)) {
    throw new Error("Use --probes only with --mcp-check or --mcp-plan");
  }
  if (out.bundle && (out.sample || (out.tasks && !out.fromIntake) || out.graph || out.report || out.prompts || out.promptTemplate)) {
    throw new Error("Use --bundle without --sample, --tasks, --graph, --report, --prompts, or --prompt");
  }
  if (out.bundleCheck && out.stdin) {
    throw new Error("Use --bundle-check with a handoff bundle directory path, not --stdin");
  }
  if (out.bundleCheck && (out.sample || out.tasks || out.bundle || out.bundleHandoff || out.bundleRepair || out.nextActions || out.graph || out.report || out.prompts || out.promptTemplate || out.promptList || out.mcpCheck || out.mcpPlan)) {
    throw new Error("Use --bundle-check without --sample, --tasks, --bundle, --bundle-handoff, --bundle-repair, --next-actions, --graph, --report, --prompts, --prompt, --prompt-list, --mcp-check, or --mcp-plan");
  }
  if (out.bundleCompareTarget && out.stdin) {
    throw new Error("Use --bundle-compare with handoff bundle directory paths, not --stdin");
  }
  if (out.bundleCompareTarget && !out.target) {
    throw new Error("--bundle-compare requires a primary handoff bundle directory path");
  }
  if (out.bundleCompareTarget && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleHandoff || out.bundleRepair || out.nextActions || out.graph || out.report || out.prompts || out.promptTemplate || out.promptList || out.mcpCheck || out.mcpPlan)) {
    throw new Error("Use --bundle-compare without --sample, --tasks, --bundle, --bundle-check, --bundle-handoff, --bundle-repair, --next-actions, --graph, --report, --prompts, --prompt, --prompt-list, --mcp-check, or --mcp-plan");
  }
  if (out.bundleHandoff && out.stdin) {
    throw new Error("Use --bundle-handoff with a handoff bundle directory path, not --stdin");
  }
  if (out.bundleHandoff && !out.target) {
    throw new Error("--bundle-handoff requires a handoff bundle directory path");
  }
  if (out.bundleHandoff && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleCompareTarget || out.bundleRepair || out.nextActions || out.graph || out.report || out.prompts || out.promptTemplate || out.promptList || out.mcpCheck || out.mcpPlan)) {
    throw new Error("Use --bundle-handoff without --sample, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-repair, --next-actions, --graph, --report, --prompts, --prompt, --prompt-list, --mcp-check, or --mcp-plan");
  }
  if (out.bundleRepair && out.stdin) {
    throw new Error("Use --bundle-repair with a handoff bundle directory path, not --stdin");
  }
  if (out.bundleRepair && !out.target) {
    throw new Error("--bundle-repair requires a handoff bundle directory path");
  }
  if (out.bundleRepair && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.nextActions || out.graph || out.report || out.prompts || out.promptTemplate || out.promptList || out.mcpCheck || out.mcpPlan)) {
    throw new Error("Use --bundle-repair without --sample, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, --next-actions, --graph, --report, --prompts, --prompt, --prompt-list, --mcp-check, or --mcp-plan");
  }
  if (out.yes && !out.bundleRepair) {
    throw new Error("Use --yes only with --bundle-repair");
  }
  const initBundleMode = out.init && out.bundle;
  const fromIntakeBundleMode = out.fromIntake && out.bundle;
  const fromIntakeTasksMode = out.fromIntake && out.tasks;
  if (!initBundleMode && !fromIntakeBundleMode && !fromIntakeTasksMode && [out.init, out.fromIntake, out.intakeTemplate, out.sample, out.tasks, out.bundle].filter(Boolean).length > 1) {
    throw new Error("Use only one generated workspace mode: --init, --from-intake, --intake-template, --sample, --tasks, or --bundle");
  }
  if (out.sample && out.strict) {
    throw new Error("Use --sample without --strict; validate the generated file in a separate command");
  }
  if (out.taskSelector && !out.promptTemplate && !out.bundleHandoff) {
    throw new Error("Use --task only with --prompt or --bundle-handoff");
  }
  if (out.taskSelector && out.promptTemplate && out.promptTemplate !== "codex-implementation") {
    throw new Error("Use --task only with --prompt codex-implementation");
  }
  if (out.tasks && (out.json || out.nextActions || out.graph || out.report || out.prompts)) {
    throw new Error("Use --tasks without --json, --next-actions, --graph, --report, or --prompts; validate the generated file in a separate command");
  }
  if (out.tasks && out.promptTemplate) {
    throw new Error("Use --tasks without --prompt; generate tasks in a separate command first");
  }
  if (out.bundle && out.json) {
    throw new Error("--json is not supported with --bundle; use --bundle --out dir for bundle artifacts");
  }
  if (out.bundle && !out.outPath) {
    throw new Error("--bundle requires --out directory");
  }
  const outputModes = [out.report ? "--report" : "", out.prompts ? "--prompts" : "", out.promptTemplate ? "--prompt" : "", out.nextActions ? "--next-actions" : "", out.mcpCheck ? "--mcp-check" : "", out.mcpPlan ? "--mcp-plan" : "", out.graph ? "--graph" : "", out.bundle ? "--bundle" : "", out.bundleCheck ? "--bundle-check" : "", out.bundleCompareTarget ? "--bundle-compare" : "", out.bundleHandoff ? "--bundle-handoff" : "", out.bundleRepair ? "--bundle-repair" : ""].filter(Boolean);
  if (outputModes.length > 1) {
    throw new Error("Use only one output mode: --report, --prompts, --prompt, --next-actions, --mcp-check, --mcp-plan, --graph, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, or --bundle-repair");
  }
  if (out.json && (out.report || out.prompts || out.promptTemplate)) {
    throw new Error("--json is only supported for the site summary, --next-actions, --mcp-check, --mcp-plan, --graph, --bundle-check, --bundle-compare, --bundle-handoff, or --bundle-repair; use --out with --report, --prompts, or --prompt for Markdown artifacts");
  }
  if (out.outPath && !(out.json || out.report || out.prompts || out.promptTemplate || out.init || out.fromIntake || out.intakeTemplate || out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.bundleRepair || out.nextActions || out.promptList || out.mcpCheck || out.mcpPlan || out.graph)) {
    throw new Error("--out requires --json, --report, --prompts, --prompt, --init, --from-intake, --intake-template, --sample, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, --bundle-repair, --next-actions, --prompt-list, --mcp-check, --mcp-plan, or --graph");
  }

  const { index, languageProvided, ...parsed } = out;
  return parsed;
}

export function buildSiteIntakeTemplateMarkdown({ language = "en" } = {}) {
  if (!SITE_INTAKE_TEMPLATE_LANGUAGE_OPTIONS.includes(language)) {
    throw new Error(`language must be one of: ${SITE_INTAKE_TEMPLATE_LANGUAGE_OPTIONS.join(", ")}`);
  }
  return language === "ko" ? SITE_INTAKE_TEMPLATE_MARKDOWN_KO : SITE_INTAKE_TEMPLATE_MARKDOWN;
}

export function formatSiteIntakeTemplateJson({ language = "en" } = {}) {
  const content = buildSiteIntakeTemplateMarkdown({ language });
  return JSON.stringify({
    kind: "website-improvement-intake-template",
    version: 1,
    format: "markdown",
    language,
    recommendedFileName: language === "ko" ? "company-website-intake.ko.md" : "company-website-intake.md",
    sections: SITE_INTAKE_TEMPLATE_SECTIONS,
    privacy: {
      storesCredentials: false,
      storesProductionSecrets: false,
      storesCustomerData: false,
    },
    commands: {
      nextActions: "design-ai site --init --name \"<site name>\" --live-url <live-url> --local-path <absolute-target-repo-path> --next-actions --out website-next-actions.md --force",
      bundle: "design-ai site --init --name \"<site name>\" --live-url <live-url> --local-path <absolute-target-repo-path> --bundle --out website-handoff-bundle --strict --force",
      bundleCheck: "design-ai site website-handoff-bundle --bundle-check --strict --json --out website-bundle-check.json --force",
      bundleHandoff: "design-ai site website-handoff-bundle --bundle-handoff --strict --out target-repo-handoff.md --force",
    },
    content,
  }, null, 2);
}

function recommendedMcpForCategory(categoryId) {
  const map = {
    "visual-design": ["browser", "figma"],
    "ux-flow": ["browser", "github"],
    responsive: ["browser", "chromeDevtools"],
    accessibility: ["browser", "chromeDevtools"],
    performance: ["chromeDevtools", "deploy"],
    seo: ["browser", "deploy"],
    "technical-quality": ["github"],
    "runtime-issues": ["browser", "chromeDevtools", "sentry"],
    "content-quality": ["figma", "research", "cms"],
  };
  return map[categoryId] || ["github"];
}

function buildCodexTaskPrompt(workspace, categoryId, finding) {
  const profile = workspace.siteProfile;
  return [
    "You are working in the target website repo, not in design-ai.",
    `Site: ${profile.name}`,
    `Live URL: ${profile.liveUrl}`,
    `Category: ${categoryById(categoryId).label}`,
    `Problem: ${finding}`,
    "",
    "Inspect the target repo first. Reuse existing architecture, UI components, state patterns, styling conventions, and design tokens. Do not add dependencies unless the existing codebase clearly requires them.",
    "",
    "Implement the smallest safe improvement, then verify desktop/tablet/mobile behavior, keyboard focus, screen-reader semantics where relevant, and the target repo's lint/typecheck/build commands.",
  ].join("\n");
}

function taskFromCategory(workspace, category, finding) {
  const priority = category.id === "accessibility" || category.id === "runtime-issues" ? "p0" : "p1";
  const impact = priority === "p0" ? "high" : "medium";
  return {
    id: `task-${category.id}`,
    title: `Resolve ${category.label} finding`,
    category: category.id,
    problem: finding,
    evidence: "Audit finding captured in the Website Improvement Console.",
    impact,
    effort: "medium",
    priority,
    pages: workspace.siteProfile.pages.slice(0, 3),
    recommendedMcp: recommendedMcpForCategory(category.id),
    codexPrompt: buildCodexTaskPrompt(workspace, category.id, finding),
    verification: [
      ...category.defaultVerification,
      "Run target repo lint/typecheck/build when available",
    ],
    risks: [
      "Target repo architecture may constrain the fix",
      "Manual stakeholder review may be needed before changing copy or brand language",
    ],
  };
}

export function generateSiteRefactorTasks(workspaceInput) {
  const workspace = normalizeSiteWorkspace(workspaceInput);
  const existingIds = new Set(workspace.refactorTasks.map((task) => task.id));
  const existingCategories = new Set(workspace.refactorTasks.map((task) => task.category));
  const created = [];

  for (const category of AUDIT_CATEGORIES) {
    if (existingCategories.has(category.id)) continue;
    const row = workspace.auditChecklist[category.id];
    const findings = row.findings;
    if (findings.length === 0) continue;

    const task = taskFromCategory(workspace, category, findings[0]);
    if (existingIds.has(task.id)) continue;
    created.push(task);
    existingIds.add(task.id);
    existingCategories.add(category.id);
  }

  return {
    workspace: {
      ...workspace,
      updatedAt: workspace.updatedAt,
      refactorTasks: workspace.refactorTasks.concat(created),
    },
    created,
    skippedCount: AUDIT_CATEGORIES.filter((category) => existingCategories.has(category.id)).length - created.length,
  };
}

export function createSampleSiteWorkspace() {
  return {
    version: 1,
    updatedAt: "2026-05-30T00:00:00.000Z",
    siteProfile: {
      id: "sample-korean-saas",
      name: "Korean SaaS marketing site",
      liveUrl: "https://example.com",
      repoUrl: "https://github.com/acme/korean-saas-site",
      localPath: "/Users/you/dev/korean-saas-site",
      figmaUrl: "https://figma.com/file/example",
      brandNotes: "Quiet B2B SaaS tone, Pretendard typography, dense but readable Korean product copy, indigo accent only for action and focus.",
      deployProvider: "vercel",
      sentryProject: "acme/korean-saas-web",
      cms: "sanity",
      database: "none",
      pages: ["/", "/pricing", "/signup", "/docs"],
      userFlows: [
        "Visitor compares pricing and starts signup",
        "Existing customer finds feature proof before contacting sales",
      ],
      viewports: ["desktop", "tablet", "mobile"],
    },
    auditChecklist: {
      "visual-design": {
        status: "in-progress",
        notes: "Hero hierarchy and CTA contrast need review before company pilot.",
        findings: ["Primary CTA competes with secondary link on the homepage"],
      },
      "ux-flow": {
        status: "todo",
        notes: "Map visitor path from landing page to pricing and signup.",
        findings: [],
      },
      responsive: {
        status: "todo",
        notes: "Check 1440, 1024, 390, and 360 width layouts.",
        findings: [],
      },
      accessibility: {
        status: "todo",
        notes: "Keyboard and focus audit required for nav, pricing toggle, and forms.",
        findings: ["Focus state is not yet documented for the mobile menu"],
      },
      performance: {
        status: "todo",
        notes: "Run Lighthouse after visual pass.",
        findings: [],
      },
      seo: {
        status: "todo",
        notes: "Inspect title, description, heading order, canonical, OG.",
        findings: [],
      },
      "technical-quality": {
        status: "todo",
        notes: "Confirm component reuse before editing target repo.",
        findings: [],
      },
      "runtime-issues": {
        status: "todo",
        notes: "Open console/network once preview deploy is available.",
        findings: [],
      },
      "content-quality": {
        status: "in-progress",
        notes: "Copy should lead with proof and reduce generic SaaS phrasing.",
        findings: ["Pricing page does not explain plan fit in the first viewport"],
      },
    },
    mcpReadiness: {
      github: "required",
      figma: "optional",
      browser: "required",
      chromeDevtools: "optional",
      deploy: "required",
      sentry: "optional",
      database: "unused",
      cms: "optional",
      collaboration: "optional",
      research: "optional",
    },
    refactorTasks: [
      {
        id: "task-homepage-cta",
        title: "Clarify homepage CTA hierarchy",
        category: "visual-design",
        problem: "Primary and secondary actions compete in the hero, which weakens the visitor's first decision.",
        evidence: "Sample finding: Primary CTA competes with secondary link on the homepage.",
        impact: "high",
        effort: "medium",
        priority: "p1",
        pages: ["/"],
        recommendedMcp: ["browser", "figma"],
        codexPrompt: "Inspect the target homepage implementation, preserve existing design system patterns, and revise the hero CTA hierarchy so the primary signup action is visually dominant while the secondary action remains available.",
        verification: [
          "Run target repo lint/build",
          "Verify desktop/tablet/mobile hero layout",
          "Confirm focus indicators and text contrast",
        ],
        risks: ["Could change conversion copy without stakeholder approval"],
      },
    ],
    implementationEvidence: {
      executedWork: [],
      verificationResults: [],
      remainingRisks: [...DEFAULT_IMPLEMENTATION_RISKS],
      nextActions: [],
    },
    reportNotes: "MVP audit is a planning console. Run the generated prompts inside the target website repo before marking implementation complete.",
  };
}

function uniqueNormalizedStrings(items, fallback = []) {
  const seen = new Set();
  const result = [];
  const normalized = normalizeStringArray(items);
  const source = normalized.length > 0 ? normalized : normalizeStringArray(fallback);
  for (const item of source) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function slugifySiteId(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "website-project";
}

function buildInitAuditChecklist(profile) {
  const pageList = profile.pages.slice(0, 4).join(", ");
  const flowList = profile.userFlows.slice(0, 3).join("; ");
  return Object.fromEntries(
    AUDIT_CATEGORIES.map((category) => {
      const notes = {
        "visual-design": `Review layout, typography, color, spacing, hierarchy, and CTA treatment across ${pageList}.`,
        "ux-flow": `Map and test the primary flow(s): ${flowList}.`,
        responsive: `Verify configured viewports: ${profile.viewports.join(", ")}.`,
        accessibility: "Check keyboard navigation, focus indicators, semantic structure, ARIA usage, and contrast before implementation handoff.",
        performance: "Run target-repo or deployment performance checks after the first visual/UX pass.",
        seo: "Inspect title, description, canonical, OG metadata, sitemap exposure, and heading order for priority pages.",
        "technical-quality": "Inspect target repo architecture before editing; preserve existing components, tokens, styling conventions, and verification commands.",
        "runtime-issues": "Use Browser/Chrome DevTools or deployment logs to check console errors, network failures, hydration issues, and broken assets.",
        "content-quality": "Review copy clarity, information architecture, proof points, trust signals, Korean/English tone, and CTA wording.",
      }[category.id];
      return [
        category.id,
        {
          status: "todo",
          notes,
          findings: [],
        },
      ];
    }),
  );
}

function buildInitMcpReadiness(profile) {
  const hasRepoReference = Boolean(profile.repoUrl || profile.localPath);
  return {
    github: hasRepoReference ? "required" : "optional",
    figma: profile.figmaUrl ? "optional" : "unused",
    browser: "required",
    chromeDevtools: "optional",
    deploy: profile.deployProvider && profile.deployProvider !== "none" ? "required" : "optional",
    sentry: profile.sentryProject ? "optional" : "unused",
    database: profile.database && profile.database !== "none" ? "optional" : "unused",
    cms: profile.cms && profile.cms !== "none" ? "optional" : "unused",
    collaboration: "optional",
    research: "optional",
  };
}

export function createSiteWorkspaceFromInitOptions(options = {}) {
  const name = String(options.name || "").trim();
  const liveUrl = String(options.liveUrl || "").trim();
  if (!name) {
    throw new Error("--init requires --name");
  }
  if (!liveUrl) {
    throw new Error("--init requires --live-url");
  }

  const profile = {
    id: slugifySiteId(name),
    name,
    liveUrl,
    repoUrl: String(options.repoUrl || "").trim(),
    localPath: String(options.localPath || "").trim(),
    figmaUrl: String(options.figmaUrl || "").trim(),
    brandNotes: String(options.brandNotes || "").trim(),
    deployProvider: normalizeEnum(options.deployProvider, DEPLOY_OPTIONS, "none"),
    sentryProject: String(options.sentryProject || "").trim(),
    cms: normalizeEnum(options.cms, CMS_OPTIONS, "none"),
    database: normalizeEnum(options.database, DATABASE_OPTIONS, "none"),
    pages: uniqueNormalizedStrings(options.pages, ["/"]),
    userFlows: uniqueNormalizedStrings(options.userFlows, [
      "Visitor reviews the site and completes the primary conversion flow",
    ]),
    viewports: uniqueNormalizedStrings(options.viewports, ["desktop", "tablet", "mobile"])
      .filter((viewport) => VIEWPORT_OPTIONS.includes(viewport)),
  };
  if (profile.viewports.length === 0) {
    profile.viewports = ["desktop", "tablet", "mobile"];
  }

  return normalizeSiteWorkspace({
    version: 1,
    updatedAt: new Date().toISOString(),
    siteProfile: profile,
    auditChecklist: buildInitAuditChecklist(profile),
    mcpReadiness: buildInitMcpReadiness(profile),
    refactorTasks: [],
    implementationEvidence: {
      executedWork: [],
      verificationResults: [],
      remainingRisks: [...DEFAULT_IMPLEMENTATION_RISKS],
      nextActions: [
        "Run `design-ai site <workspace.json> --mcp-check --probes --json` before target-repo implementation.",
        "Add audit findings in the Website Console, then run `design-ai site <workspace.json> --tasks --out website-workspace.tasks.json`.",
      ],
    },
    reportNotes: "Generated by `design-ai site --init` for real-project Website Improvement intake. Actual target repo code changes happen outside this design-ai repository.",
  });
}

function normalizeIntakeLookupKey(value) {
  return String(value || "")
    .replace(/`/g, "")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanIntakeCell(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\\\|/g, "|")
    .replace(/^`|`$/g, "")
    .trim();
}

function isBlankIntakeCell(value) {
  const text = cleanIntakeCell(value);
  if (!text) return true;
  if (/^<[^>]+>$/.test(text)) return true;
  if (text.includes(" / ") && (text.match(/`/g) || []).length >= 4) return true;
  return false;
}

function intakeSection(markdown, headingNames) {
  const wanted = new Set(headingNames.map(normalizeIntakeLookupKey));
  const lines = String(markdown || "").split(/\r?\n/);
  const collected = [];
  let active = false;

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      const key = normalizeIntakeLookupKey(heading[1]);
      active = wanted.has(key);
      continue;
    }
    if (active) {
      collected.push(line);
    }
  }

  return collected.join("\n");
}

function intakeTableRows(section) {
  return String(section || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .filter((line) => !/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|$/.test(line))
    .map((line) => line.slice(1, -1).split("|").map(cleanIntakeCell));
}

function firstValidIntakeEnum(value, allowed, fallback = "none") {
  const text = cleanIntakeCell(value).replace(/`/g, "").trim().toLowerCase();
  if (!text || text.includes(" / ")) return fallback;
  return allowed.find((item) => text === item || text.includes(item)) || fallback;
}

function nonPlaceholderIntakeValue(value) {
  if (isBlankIntakeCell(value)) return "";
  const text = cleanIntakeCell(value);
  if (/^(field|value|항목|값|priority|우선순위|path or url|path 또는 url|flow|status|상태|finding|evidence|page|category)$/i.test(text)) {
    return "";
  }
  return text;
}

const INTAKE_PROFILE_FIELD_MAP = new Map([
  ["site name", "name"],
  ["사이트 이름", "name"],
  ["live url", "liveUrl"],
  ["target repo url", "repoUrl"],
  ["대상 repo url", "repoUrl"],
  ["target repo local path", "localPath"],
  ["대상 repo local path", "localPath"],
  ["figma url", "figmaUrl"],
  ["deploy provider", "deployProvider"],
  ["deploy platform", "deployProvider"],
  ["배포 플랫폼", "deployProvider"],
  ["sentry project", "sentryProject"],
  ["sentry 프로젝트", "sentryProject"],
  ["cms", "cms"],
  ["database", "database"],
]);

const INTAKE_MCP_FIELD_MAP = new Map([
  ["github", "github"],
  ["figma", "figma"],
  ["browser playwright", "browser"],
  ["chrome devtools", "chromeDevtools"],
  ["deploy provider", "deploy"],
  ["배포 플랫폼", "deploy"],
  ["sentry", "sentry"],
  ["database", "database"],
  ["cms", "cms"],
  ["collaboration tool", "collaboration"],
  ["협업 도구", "collaboration"],
  ["research tool", "research"],
  ["리서치 도구", "research"],
]);

const INTAKE_AUDIT_CATEGORY_MAP = new Map([
  ["visual design", "visual-design"],
  ["ux flow", "ux-flow"],
  ["responsive", "responsive"],
  ["accessibility", "accessibility"],
  ["performance", "performance"],
  ["seo", "seo"],
  ["technical quality", "technical-quality"],
  ["runtime issues", "runtime-issues"],
  ["content quality", "content-quality"],
]);

function parseSiteProfileFromIntake(markdown) {
  const profile = {
    name: "",
    liveUrl: "",
    repoUrl: "",
    localPath: "",
    figmaUrl: "",
    brandNotes: "",
    deployProvider: "none",
    sentryProject: "",
    cms: "none",
    database: "none",
    pages: [],
    userFlows: [],
    viewports: ["desktop", "tablet", "mobile"],
  };

  for (const row of intakeTableRows(intakeSection(markdown, ["Site Profile"]))) {
    const field = INTAKE_PROFILE_FIELD_MAP.get(normalizeIntakeLookupKey(row[0]));
    if (!field) continue;
    if (field === "deployProvider") {
      profile.deployProvider = firstValidIntakeEnum(row[1], DEPLOY_OPTIONS, "none");
    } else if (field === "cms") {
      profile.cms = firstValidIntakeEnum(row[1], CMS_OPTIONS, "none");
    } else if (field === "database") {
      profile.database = firstValidIntakeEnum(row[1], DATABASE_OPTIONS, "none");
    } else {
      profile[field] = nonPlaceholderIntakeValue(row[1]);
    }
  }

  const brandNotes = [];
  for (const row of intakeTableRows(intakeSection(markdown, ["Brand And Content Notes"]))) {
    const area = nonPlaceholderIntakeValue(row[0]);
    const note = nonPlaceholderIntakeValue(row[1]);
    if (area && note) {
      brandNotes.push(`${area}: ${note}`);
    }
  }
  if (brandNotes.length > 0) {
    profile.brandNotes = brandNotes.join("\n");
  }

  for (const row of intakeTableRows(intakeSection(markdown, ["Priority Pages", "우선순위 페이지"]))) {
    const page = nonPlaceholderIntakeValue(row[1]);
    if (page && !/^path\b/i.test(page)) {
      profile.pages.push(page);
    }
  }

  for (const row of intakeTableRows(intakeSection(markdown, ["Primary User Flows", "주요 사용자 흐름"]))) {
    const flow = nonPlaceholderIntakeValue(row[1]);
    if (flow && normalizeIntakeLookupKey(flow) !== "flow") {
      profile.userFlows.push(flow);
    }
  }

  return profile;
}

function applyMcpReadinessFromIntake(workspace, markdown) {
  const mcpReadiness = { ...workspace.mcpReadiness };
  for (const row of intakeTableRows(intakeSection(markdown, ["MCP Readiness Notes"]))) {
    const key = INTAKE_MCP_FIELD_MAP.get(normalizeIntakeLookupKey(row[0]));
    if (!key) continue;
    const status = firstValidIntakeEnum(row[1], MCP_STATUS_OPTIONS, "");
    if (status) {
      mcpReadiness[key] = status;
    }
  }
  return mcpReadiness;
}

function applyAuditFindingsFromIntake(workspace, markdown) {
  const auditChecklist = structuredClone(workspace.auditChecklist);
  const pages = new Set(workspace.siteProfile.pages);
  for (const row of intakeTableRows(intakeSection(markdown, ["Initial Audit Findings", "초기 Audit Findings"]))) {
    const categoryId = INTAKE_AUDIT_CATEGORY_MAP.get(normalizeIntakeLookupKey(row[0]));
    const finding = nonPlaceholderIntakeValue(row[1]);
    if (!categoryId || !finding) continue;

    const evidence = nonPlaceholderIntakeValue(row[2]);
    const page = nonPlaceholderIntakeValue(row[3]);
    const findingText = [
      finding,
      evidence ? `Evidence: ${evidence}` : "",
      page ? `Page: ${page}` : "",
    ].filter(Boolean).join(" | ");

    const current = auditChecklist[categoryId] || { status: "todo", notes: "", findings: [] };
    auditChecklist[categoryId] = {
      ...current,
      status: current.status === "done" || current.status === "blocked" ? current.status : "in-progress",
      findings: uniqueNormalizedStrings([...current.findings, findingText]),
    };
    if (page) {
      pages.add(page);
    }
  }
  return { auditChecklist, pages: Array.from(pages) };
}

export function createSiteWorkspaceFromIntakeMarkdown(markdown, { filePath = "company-website-intake.md" } = {}) {
  const profile = parseSiteProfileFromIntake(markdown);
  if (!profile.name) {
    throw new Error(`Intake template ${filePath} requires Site name`);
  }
  if (!profile.liveUrl) {
    throw new Error(`Intake template ${filePath} requires Live URL`);
  }

  const baseWorkspace = createSiteWorkspaceFromInitOptions(profile);
  const { auditChecklist, pages } = applyAuditFindingsFromIntake(baseWorkspace, markdown);
  const workspace = {
    ...baseWorkspace,
    siteProfile: {
      ...baseWorkspace.siteProfile,
      pages: uniqueNormalizedStrings(pages, ["/"]),
    },
    auditChecklist,
    mcpReadiness: applyMcpReadinessFromIntake(baseWorkspace, markdown),
    reportNotes: `Generated by \`design-ai site --from-intake ${filePath}\` from a local company website intake Markdown file. Actual target repo code changes happen outside this design-ai repository.`,
  };

  return normalizeSiteWorkspace(workspace);
}

function normalizeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function normalizeStringArray(value, fallback = []) {
  const source = Array.isArray(value) ? value : fallback;
  return source
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function defaultChecklist() {
  return Object.fromEntries(
    AUDIT_CATEGORIES.map((category) => [
      category.id,
      {
        status: "todo",
        notes: "",
        findings: [],
      },
    ]),
  );
}

function normalizeChecklist(value) {
  const source = normalizeObject(value);
  const fallback = defaultChecklist();
  return Object.fromEntries(
    AUDIT_CATEGORIES.map((category) => {
      const row = normalizeObject(source[category.id]);
      return [
        category.id,
        {
          status: normalizeEnum(row.status, CHECKLIST_STATUS_OPTIONS, fallback[category.id].status),
          notes: String(row.notes || ""),
          findings: normalizeStringArray(row.findings),
        },
      ];
    }),
  );
}

function normalizeMcpReadiness(value) {
  const source = normalizeObject(value);
  return Object.fromEntries(
    MCP_ITEMS.map(([key]) => [
      key,
      normalizeEnum(source[key], MCP_STATUS_OPTIONS, "unused"),
    ]),
  );
}

function categoryById(id) {
  return AUDIT_CATEGORIES.find((category) => category.id === id) || AUDIT_CATEGORIES[0];
}

function normalizeTasks(value) {
  if (!Array.isArray(value)) return [];
  const categoryIds = AUDIT_CATEGORIES.map((category) => category.id);
  return value.map((task, index) => {
    const item = normalizeObject(task);
    return {
      id: String(item.id || `task-${index + 1}`),
      title: String(item.title || "Untitled website improvement task"),
      category: normalizeEnum(item.category, categoryIds, "ux-flow"),
      problem: String(item.problem || ""),
      evidence: String(item.evidence || ""),
      impact: normalizeEnum(item.impact, IMPACT_OPTIONS, "medium"),
      effort: normalizeEnum(item.effort, EFFORT_OPTIONS, "medium"),
      priority: normalizeEnum(item.priority, PRIORITY_OPTIONS, "p2"),
      pages: normalizeStringArray(item.pages),
      recommendedMcp: normalizeStringArray(item.recommendedMcp),
      codexPrompt: String(item.codexPrompt || ""),
      verification: normalizeStringArray(item.verification),
      risks: normalizeStringArray(item.risks),
    };
  });
}

function normalizeImplementationEvidence(value) {
  const source = normalizeObject(value);
  return {
    executedWork: normalizeStringArray(source.executedWork),
    verificationResults: normalizeStringArray(source.verificationResults),
    remainingRisks: normalizeStringArray(source.remainingRisks, DEFAULT_IMPLEMENTATION_RISKS),
    nextActions: normalizeStringArray(source.nextActions),
  };
}

function countImplementationEvidence(value = {}) {
  const source = normalizeObject(value);
  return Object.fromEntries(IMPLEMENTATION_EVIDENCE_KEYS.map((key) => {
    const items = source[key];
    if (Array.isArray(items)) return [key, items.length];
    if (Number.isInteger(items) && items >= 0) return [key, items];
    return [key, 0];
  }));
}

export function normalizeSiteWorkspace(raw) {
  const fallback = createSampleSiteWorkspace();
  const source = normalizeObject(raw);
  const profile = normalizeObject(source.siteProfile);
  const viewports = normalizeStringArray(profile.viewports, fallback.siteProfile.viewports)
    .filter((viewport) => VIEWPORT_OPTIONS.includes(viewport));

  return {
    version: 1,
    updatedAt: String(source.updatedAt || fallback.updatedAt),
    siteProfile: {
      id: String(profile.id || fallback.siteProfile.id),
      name: String(profile.name || fallback.siteProfile.name),
      liveUrl: String(profile.liveUrl || ""),
      repoUrl: String(profile.repoUrl || ""),
      localPath: String(profile.localPath || ""),
      figmaUrl: String(profile.figmaUrl || ""),
      brandNotes: String(profile.brandNotes || ""),
      deployProvider: normalizeEnum(profile.deployProvider, DEPLOY_OPTIONS, "none"),
      sentryProject: String(profile.sentryProject || ""),
      cms: normalizeEnum(profile.cms, CMS_OPTIONS, "none"),
      database: normalizeEnum(profile.database, DATABASE_OPTIONS, "none"),
      pages: normalizeStringArray(profile.pages, fallback.siteProfile.pages),
      userFlows: normalizeStringArray(profile.userFlows, fallback.siteProfile.userFlows),
      viewports: viewports.length ? viewports : ["desktop"],
    },
    auditChecklist: normalizeChecklist(source.auditChecklist || fallback.auditChecklist),
    mcpReadiness: normalizeMcpReadiness(source.mcpReadiness || fallback.mcpReadiness),
    refactorTasks: normalizeTasks(source.refactorTasks || fallback.refactorTasks),
    implementationEvidence: normalizeImplementationEvidence(source.implementationEvidence || fallback.implementationEvidence),
    reportNotes: String(source.reportNotes || ""),
  };
}

function addIssue(issues, level, id, message) {
  issues.push({ level, id, message });
}

function assertEnumIssue(issues, value, allowed, id, label) {
  if (!allowed.includes(value)) {
    addIssue(issues, "fail", id, `${label} must be one of: ${allowed.join(", ")}`);
  }
}

function validateRawWorkspace(raw) {
  const issues = [];
  const root = normalizeObject(raw);
  const profile = normalizeObject(root.siteProfile);
  const checklist = normalizeObject(root.auditChecklist);
  const mcpReadiness = normalizeObject(root.mcpReadiness);

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    addIssue(issues, "fail", "workspace-object", "Workspace JSON must be an object");
    return issues;
  }
  if (root.version !== 1) {
    addIssue(issues, "fail", "workspace-version", "Workspace version must be 1");
  }
  if (!root.siteProfile || typeof root.siteProfile !== "object" || Array.isArray(root.siteProfile)) {
    addIssue(issues, "fail", "site-profile", "siteProfile object is required");
  }
  if (!root.auditChecklist || typeof root.auditChecklist !== "object" || Array.isArray(root.auditChecklist)) {
    addIssue(issues, "fail", "audit-checklist", "auditChecklist object is required");
  }
  if (!root.mcpReadiness || typeof root.mcpReadiness !== "object" || Array.isArray(root.mcpReadiness)) {
    addIssue(issues, "fail", "mcp-readiness", "mcpReadiness object is required");
  }
  if (!Array.isArray(root.refactorTasks)) {
    addIssue(issues, "fail", "refactor-tasks", "refactorTasks array is required");
  }
  if (root.implementationEvidence !== undefined) {
    const evidence = normalizeObject(root.implementationEvidence);
    if (root.implementationEvidence === null || typeof root.implementationEvidence !== "object" || Array.isArray(root.implementationEvidence)) {
      addIssue(issues, "fail", "implementation-evidence", "implementationEvidence must be an object when provided");
    } else {
      for (const key of IMPLEMENTATION_EVIDENCE_KEYS) {
        if (evidence[key] !== undefined && !Array.isArray(evidence[key])) {
          addIssue(issues, "fail", `implementation-evidence-${key}`, `implementationEvidence.${key} must be an array`);
        }
      }
    }
  }

  if (!String(profile.name || "").trim()) {
    addIssue(issues, "fail", "site-name", "siteProfile.name is required");
  }
  if (!String(profile.liveUrl || "").trim()) {
    addIssue(issues, "fail", "site-live-url", "siteProfile.liveUrl is required");
  }
  if (!Array.isArray(profile.pages) || normalizeStringArray(profile.pages).length === 0) {
    addIssue(issues, "warn", "site-pages", "siteProfile.pages should include at least one priority page");
  }
  if (!Array.isArray(profile.userFlows) || normalizeStringArray(profile.userFlows).length === 0) {
    addIssue(issues, "warn", "site-user-flows", "siteProfile.userFlows should include at least one primary user flow");
  }
  if (!Array.isArray(profile.viewports) || normalizeStringArray(profile.viewports).length === 0) {
    addIssue(issues, "warn", "site-viewports", "siteProfile.viewports should include desktop, tablet, or mobile");
  } else {
    for (const viewport of normalizeStringArray(profile.viewports)) {
      assertEnumIssue(issues, viewport, VIEWPORT_OPTIONS, "site-viewport-value", `Viewport '${viewport}'`);
    }
  }
  if (!String(profile.repoUrl || "").trim() && !String(profile.localPath || "").trim()) {
    addIssue(issues, "warn", "site-repo-location", "Provide siteProfile.repoUrl or siteProfile.localPath before Codex implementation handoff");
  }
  if (profile.deployProvider !== undefined) {
    assertEnumIssue(issues, profile.deployProvider, DEPLOY_OPTIONS, "deploy-provider", "siteProfile.deployProvider");
  }
  if (profile.cms !== undefined) {
    assertEnumIssue(issues, profile.cms, CMS_OPTIONS, "cms", "siteProfile.cms");
  }
  if (profile.database !== undefined) {
    assertEnumIssue(issues, profile.database, DATABASE_OPTIONS, "database", "siteProfile.database");
  }

  for (const category of AUDIT_CATEGORIES) {
    const row = normalizeObject(checklist[category.id]);
    if (!checklist[category.id]) {
      addIssue(issues, "warn", `audit-${category.id}`, `${category.label} audit row is missing`);
      continue;
    }
    assertEnumIssue(issues, row.status, CHECKLIST_STATUS_OPTIONS, `audit-${category.id}-status`, `${category.label} status`);
    if (row.findings !== undefined && !Array.isArray(row.findings)) {
      addIssue(issues, "fail", `audit-${category.id}-findings`, `${category.label} findings must be an array`);
    }
  }

  for (const [key, label] of MCP_ITEMS) {
    if (mcpReadiness[key] === undefined) {
      addIssue(issues, "warn", `mcp-${key}`, `${label} MCP readiness status is missing`);
      continue;
    }
    assertEnumIssue(issues, mcpReadiness[key], MCP_STATUS_OPTIONS, `mcp-${key}-status`, `${label} MCP status`);
  }

  if (Array.isArray(root.refactorTasks)) {
    for (const [index, task] of root.refactorTasks.entries()) {
      const item = normalizeObject(task);
      const label = item.title ? `Task '${item.title}'` : `Task ${index + 1}`;
      if (!String(item.title || "").trim()) {
        addIssue(issues, "warn", `task-${index + 1}-title`, `${label} should include a title`);
      }
      if (!String(item.problem || "").trim()) {
        addIssue(issues, "warn", `task-${index + 1}-problem`, `${label} should describe the problem`);
      }
      assertEnumIssue(
        issues,
        item.category,
        AUDIT_CATEGORIES.map((category) => category.id),
        `task-${index + 1}-category`,
        `${label} category`,
      );
      assertEnumIssue(issues, item.impact, IMPACT_OPTIONS, `task-${index + 1}-impact`, `${label} impact`);
      assertEnumIssue(issues, item.effort, EFFORT_OPTIONS, `task-${index + 1}-effort`, `${label} effort`);
      assertEnumIssue(issues, item.priority, PRIORITY_OPTIONS, `task-${index + 1}-priority`, `${label} priority`);
      if (!String(item.codexPrompt || "").trim()) {
        addIssue(issues, "warn", `task-${index + 1}-codex-prompt`, `${label} should include a Codex implementation prompt`);
      }
      if (!Array.isArray(item.verification) || normalizeStringArray(item.verification).length === 0) {
        addIssue(issues, "warn", `task-${index + 1}-verification`, `${label} should include verification steps`);
      }
    }
  }

  return issues;
}

function countBy(items, keyFn, allowed = []) {
  const counts = Object.fromEntries(allowed.map((item) => [item, 0]));
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function statusFromIssues(issues) {
  if (issues.some((issue) => issue.level === "fail")) return "fail";
  if (issues.some((issue) => issue.level === "warn")) return "warn";
  return "pass";
}

function summarizeWorkspace(workspace, issues, filePath) {
  const auditRows = AUDIT_CATEGORIES.map((category) => ({
    category,
    row: workspace.auditChecklist[category.id],
  }));
  const mcpRows = MCP_ITEMS.map(([key, label]) => ({
    key,
    label,
    status: workspace.mcpReadiness[key],
  }));
  const totalFindings = auditRows.reduce((sum, item) => sum + item.row.findings.length, 0);
  const requiredMcp = mcpRows.filter((item) => item.status === "required").map((item) => item.key);
  const evidence = normalizeImplementationEvidence(workspace.implementationEvidence);
  const topTasks = workspace.refactorTasks
    .slice()
    .sort((a, b) => PRIORITY_OPTIONS.indexOf(a.priority) - PRIORITY_OPTIONS.indexOf(b.priority))
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      category: task.category,
      impact: task.impact,
      effort: task.effort,
      pages: task.pages,
    }));

  return {
    filePath,
    valid: statusFromIssues(issues) !== "fail",
    status: statusFromIssues(issues),
    site: {
      id: workspace.siteProfile.id,
      name: workspace.siteProfile.name,
      liveUrl: workspace.siteProfile.liveUrl,
      repoUrl: workspace.siteProfile.repoUrl,
      localPath: workspace.siteProfile.localPath,
      deployProvider: workspace.siteProfile.deployProvider,
      cms: workspace.siteProfile.cms,
      database: workspace.siteProfile.database,
      pages: workspace.siteProfile.pages,
      userFlows: workspace.siteProfile.userFlows,
      viewports: workspace.siteProfile.viewports,
    },
    counts: {
      pages: workspace.siteProfile.pages.length,
      userFlows: workspace.siteProfile.userFlows.length,
      viewports: workspace.siteProfile.viewports.length,
      auditCategories: AUDIT_CATEGORIES.length,
      auditFindings: totalFindings,
      refactorTasks: workspace.refactorTasks.length,
      executedWork: evidence.executedWork.length,
      verificationResults: evidence.verificationResults.length,
      remainingRisks: evidence.remainingRisks.length,
      nextActions: evidence.nextActions.length,
      requiredMcp: requiredMcp.length,
      optionalMcp: mcpRows.filter((item) => item.status === "optional").length,
      unavailableMcp: mcpRows.filter((item) => item.status === "unavailable").length,
    },
    auditStatusCounts: countBy(auditRows, (item) => item.row.status, CHECKLIST_STATUS_OPTIONS),
    mcpStatusCounts: countBy(mcpRows, (item) => item.status, MCP_STATUS_OPTIONS),
    taskPriorityCounts: countBy(workspace.refactorTasks, (task) => task.priority, PRIORITY_OPTIONS),
    requiredMcp,
    topTasks,
    issues,
  };
}

export function analyzeSiteWorkspace(raw, { filePath = "workspace.json" } = {}) {
  const issues = validateRawWorkspace(raw);
  const workspace = normalizeSiteWorkspace(raw);
  const summary = summarizeWorkspace(workspace, issues, filePath);

  if (summary.status === "pass") {
    addIssue(summary.issues, "pass", "workspace-ready", "Workspace is ready for report and prompt generation");
  }

  return {
    workspace,
    summary: {
      ...summary,
      status: statusFromIssues(summary.issues),
      valid: statusFromIssues(summary.issues) !== "fail",
    },
  };
}

export function loadSiteWorkspaceInput({
  target = "",
  stdin = false,
  cwd = process.cwd(),
  readStdin = () => readFileSync(0, "utf8"),
} = {}) {
  const filePath = stdin ? "stdin" : path.resolve(cwd, target);
  const rawText = stdin ? String(readStdin()) : readFileSync(filePath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    throw new Error(`Invalid Website Improvement workspace JSON in ${filePath}: ${error.message}`);
  }
  return {
    filePath,
    rawText,
    raw: parsed,
  };
}

export function buildSiteReport({
  target = "",
  stdin = false,
  cwd = process.cwd(),
  readStdin,
} = {}) {
  const input = loadSiteWorkspaceInput({ target, stdin, cwd, readStdin });
  return analyzeSiteWorkspace(input.raw, { filePath: input.filePath });
}

export function formatSiteJson(report) {
  return JSON.stringify(report, null, 2);
}

export function formatSitePromptTemplatesJson() {
  return JSON.stringify({
    count: SITE_PROMPT_TEMPLATES.length,
    templates: SITE_PROMPT_TEMPLATES,
  }, null, 2);
}

export function formatSitePromptTemplatesHuman() {
  return [
    "Website Improvement prompt templates",
    "",
    ...SITE_PROMPT_TEMPLATES.flatMap((template, index) => [
      `${index + 1}. ${template.id}`,
      `   Label: ${template.label}`,
      `   Agent: ${template.agent}`,
      `   Output: ${template.output}`,
      `   Task selectable: ${template.taskSelectable ? "yes" : "no"}`,
      `   ${template.description}`,
    ]),
    "",
    "Use:",
    "  design-ai site <workspace.json> --prompt <template-id>",
    "  design-ai site <workspace.json> --prompt codex-implementation --task <id-or-number>",
  ].join("\n");
}

function isLikelyHttpUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function parseHttpUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed;
  } catch {
    return null;
  }
}

function probeLevel({ passed, requestedStatus }) {
  if (passed) return "pass";
  return requestedStatus === "required" ? "fail" : "warn";
}

function probeStatus(items) {
  if (items.some((item) => item.level === "fail")) return "fail";
  if (items.some((item) => item.level === "warn")) return "warn";
  return "pass";
}

function combineStatuses(...statuses) {
  if (statuses.includes("fail")) return "fail";
  if (statuses.includes("warn")) return "warn";
  return "pass";
}

function githubRepoSlug(repoUrl) {
  const parsed = parseHttpUrl(repoUrl);
  if (!parsed) return "";
  const host = parsed.hostname.toLowerCase();
  if (host !== "github.com" && !host.endsWith(".github.com")) return "";
  const parts = parsed.pathname.replace(/^\/+|\/+$/g, "").replace(/\.git$/i, "").split("/");
  if (parts.length < 2 || !parts[0] || !parts[1]) return "";
  return `${parts[0]}/${parts[1]}`;
}

function figmaFileReference(figmaUrl) {
  const parsed = parseHttpUrl(figmaUrl);
  if (!parsed) return "";
  const host = parsed.hostname.toLowerCase();
  if (host !== "figma.com" && !host.endsWith(".figma.com")) return "";
  const parts = parsed.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const supportedKinds = new Set(["design", "file", "board", "slides", "make"]);
  if (parts.length < 2 || !supportedKinds.has(parts[0]) || !parts[1]) return "";
  return `${parts[0]}/${parts[1]}`;
}

function pathExistsAsDirectory(localPath) {
  const raw = String(localPath || "").trim();
  if (!raw) return false;
  try {
    return existsSync(raw) && statSync(raw).isDirectory();
  } catch {
    return false;
  }
}

function buildProbeItem({ id, key, label, requestedStatus, passed, message, evidence = [], actions = [] }) {
  const level = probeLevel({ passed, requestedStatus });
  return {
    id,
    key,
    label,
    requestedStatus,
    level,
    passed,
    message,
    evidence,
    actions: passed ? [] : actions,
  };
}

function buildSiteMcpProbeItems(workspace) {
  const profile = workspace.siteProfile;
  const liveUrl = parseHttpUrl(profile.liveUrl);
  const repoSlug = githubRepoSlug(profile.repoUrl);
  const localRepoAvailable = pathExistsAsDirectory(profile.localPath);
  const figmaRef = figmaFileReference(profile.figmaUrl);
  const deployConfigured = profile.deployProvider !== "none";
  const browserTargetReady = Boolean(liveUrl && profile.viewports.length > 0);

  return [
    buildProbeItem({
      id: "github-repo-reference",
      key: "github",
      label: "GitHub repo reference",
      requestedStatus: workspace.mcpReadiness.github,
      passed: Boolean(repoSlug || localRepoAvailable),
      message: repoSlug || localRepoAvailable
        ? "Target repo reference is parseable for Codex handoff."
        : "Target repo reference is not probe-ready.",
      evidence: [
        repoSlug ? `github repo: ${repoSlug}` : "",
        localRepoAvailable ? `localPath exists: ${profile.localPath}` : "",
      ].filter(Boolean),
      actions: ["Add a github.com owner/repo URL or an existing local repo path before implementation handoff."],
    }),
    buildProbeItem({
      id: "figma-url-reference",
      key: "figma",
      label: "Figma file reference",
      requestedStatus: workspace.mcpReadiness.figma,
      passed: Boolean(figmaRef),
      message: figmaRef
        ? "Figma URL is parseable for design-context handoff."
        : "Figma URL is missing or not parseable.",
      evidence: figmaRef ? [`figma reference: ${figmaRef}`] : [],
      actions: ["Add a figma.com design/file/board/slides/make URL or mark Figma unused."],
    }),
    buildProbeItem({
      id: "browser-smoke-target",
      key: "browser",
      label: "Browser smoke target",
      requestedStatus: workspace.mcpReadiness.browser,
      passed: browserTargetReady,
      message: browserTargetReady
        ? "Browser smoke target and viewport set are ready for manual or MCP-driven QA."
        : "Browser smoke target is incomplete.",
      evidence: [
        liveUrl ? `liveUrl host: ${liveUrl.hostname}` : "",
        profile.viewports.length ? `viewports: ${profile.viewports.join(", ")}` : "",
      ].filter(Boolean),
      actions: ["Add a valid http(s) liveUrl and at least one viewport before Browser/Playwright QA."],
    }),
    buildProbeItem({
      id: "deploy-provider-reference",
      key: "deploy",
      label: "Deployment provider reference",
      requestedStatus: workspace.mcpReadiness.deploy,
      passed: Boolean(deployConfigured && liveUrl),
      message: deployConfigured && liveUrl
        ? "Deployment provider and live URL are configured for verification handoff."
        : "Deployment provider or live URL is not configured.",
      evidence: [
        `deployProvider: ${profile.deployProvider}`,
        liveUrl ? `liveUrl host: ${liveUrl.hostname}` : "",
      ].filter(Boolean),
      actions: ["Set siteProfile.deployProvider and liveUrl before deployment verification."],
    }),
  ];
}

export function buildSiteMcpProbeReport(workspace) {
  const items = buildSiteMcpProbeItems(workspace)
    .filter((item) => item.requestedStatus !== "unused" && item.requestedStatus !== "unavailable");
  const status = probeStatus(items);
  return {
    enabled: true,
    mode: "read-only-local",
    externalCalls: false,
    status,
    count: items.length,
    pass: items.filter((item) => item.level === "pass").length,
    warn: items.filter((item) => item.level === "warn").length,
    fail: items.filter((item) => item.level === "fail").length,
    items,
  };
}

function mcpReadinessEvidence(workspace, key) {
  const profile = workspace.siteProfile;
  const hasRepo = Boolean(profile.repoUrl || profile.localPath);
  const hasLiveUrl = isLikelyHttpUrl(profile.liveUrl);

  const map = {
    github: {
      ready: hasRepo,
      evidence: [
        profile.repoUrl ? `repoUrl: ${profile.repoUrl}` : "",
        profile.localPath ? `localPath: ${profile.localPath}` : "",
      ].filter(Boolean),
      actions: ["Add siteProfile.repoUrl or siteProfile.localPath before Codex implementation handoff."],
    },
    figma: {
      ready: Boolean(profile.figmaUrl),
      evidence: profile.figmaUrl ? [`figmaUrl: ${profile.figmaUrl}`] : [],
      actions: ["Add siteProfile.figmaUrl or mark Figma unused for this site."],
    },
    browser: {
      ready: hasLiveUrl && profile.viewports.length > 0,
      evidence: [
        hasLiveUrl ? `liveUrl: ${profile.liveUrl}` : "",
        profile.viewports.length ? `viewports: ${profile.viewports.join(", ")}` : "",
      ].filter(Boolean),
      actions: ["Add a valid siteProfile.liveUrl and at least one viewport for Browser/Playwright QA."],
    },
    chromeDevtools: {
      ready: hasLiveUrl,
      evidence: hasLiveUrl ? [`liveUrl: ${profile.liveUrl}`] : [],
      actions: ["Add a valid siteProfile.liveUrl before Chrome DevTools debugging."],
    },
    deploy: {
      ready: profile.deployProvider !== "none" && hasLiveUrl,
      evidence: [
        `deployProvider: ${profile.deployProvider}`,
        hasLiveUrl ? `liveUrl: ${profile.liveUrl}` : "",
      ].filter(Boolean),
      actions: ["Set siteProfile.deployProvider and liveUrl before deployment verification."],
    },
    sentry: {
      ready: Boolean(profile.sentryProject),
      evidence: profile.sentryProject ? [`sentryProject: ${profile.sentryProject}`] : [],
      actions: ["Add siteProfile.sentryProject or mark Sentry unused until production errors are in scope."],
    },
    database: {
      ready: profile.database !== "none",
      evidence: [`database: ${profile.database}`],
      actions: ["Set siteProfile.database to supabase, neon, postgres, or other when DB access is required."],
    },
    cms: {
      ready: profile.cms !== "none",
      evidence: [`cms: ${profile.cms}`],
      actions: ["Set siteProfile.cms to sanity, contentful, wordpress, shopify, or other when content access is required."],
    },
    collaboration: {
      ready: false,
      evidence: [],
      actions: ["Keep Collaboration optional/unused, or record the active Notion/Slack/Linear/Jira destination in reportNotes for handoff."],
    },
    research: {
      ready: hasLiveUrl,
      evidence: hasLiveUrl ? [`liveUrl: ${profile.liveUrl}`] : [],
      actions: ["Add siteProfile.liveUrl before competitor or external research prompts."],
    },
  };

  return map[key] || {
    ready: false,
    evidence: [],
    actions: [`Add readiness evidence for ${key}.`],
  };
}

function mcpItemReport(workspace, key, label) {
  const requestedStatus = workspace.mcpReadiness[key];
  const check = mcpReadinessEvidence(workspace, key);

  if (requestedStatus === "unused") {
    return {
      key,
      label,
      requestedStatus,
      state: "unused",
      level: "pass",
      evidence: ["Marked unused in mcpReadiness."],
      actions: [],
    };
  }

  if (requestedStatus === "unavailable") {
    return {
      key,
      label,
      requestedStatus,
      state: "unavailable",
      level: "pass",
      evidence: ["Marked unavailable in mcpReadiness; generated prompts should not assume this MCP."],
      actions: [],
    };
  }

  if (key === "collaboration" && requestedStatus === "optional") {
    return {
      key,
      label,
      requestedStatus,
      state: "ready",
      level: "pass",
      evidence: ["Optional collaboration is tracked in handoff notes for this local MVP."],
      actions: [],
    };
  }

  if (check.ready) {
    return {
      key,
      label,
      requestedStatus,
      state: "ready",
      level: "pass",
      evidence: check.evidence,
      actions: [],
    };
  }

  return {
    key,
    label,
    requestedStatus,
    state: "missing",
    level: requestedStatus === "required" ? "fail" : "warn",
    evidence: check.evidence,
    actions: check.actions,
  };
}

function normalizeMcpKey(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const canonical = {
    chrome: "chromeDevtools",
    chromeDevTools: "chromeDevtools",
    devtools: "chromeDevtools",
    playwright: "browser",
    browserplaywright: "browser",
    github: "github",
    figma: "figma",
    browser: "browser",
    chromeDevtools: "chromeDevtools",
    deploy: "deploy",
    sentry: "sentry",
    database: "database",
    cms: "cms",
    collaboration: "collaboration",
    research: "research",
  };
  return canonical[raw] || canonical[raw.replace(/[^a-zA-Z]/g, "")] || raw;
}

function mcpTaskGaps(workspace) {
  return workspace.refactorTasks.flatMap((task) => normalizeStringArray(task.recommendedMcp).flatMap((rawMcp) => {
    const key = normalizeMcpKey(rawMcp);
    if (!key || !workspace.mcpReadiness[key]) return [];
    const status = workspace.mcpReadiness[key];
    if (status !== "unused" && status !== "unavailable") return [];
    return [{
      taskId: task.id,
      title: task.title,
      mcp: key,
      status,
      level: "warn",
      message: `Task '${task.title}' recommends ${key}, but mcpReadiness marks it ${status}.`,
    }];
  }));
}

function siteMcpCheckStatus(items, taskGaps, workspaceIssues) {
  if (workspaceIssues.some((issue) => issue.level === "fail")) return "fail";
  if (items.some((item) => item.level === "fail")) return "fail";
  if (workspaceIssues.some((issue) => issue.level === "warn")) return "warn";
  if (items.some((item) => item.level === "warn") || taskGaps.length > 0) return "warn";
  return "pass";
}

function siteMcpCommandTarget(filePath) {
  return filePath === "stdin" ? "<workspace.json>" : filePath;
}

function buildSiteMcpProbeCommandSet(commandTarget) {
  return {
    mcpCheckProbesHumanOut: `design-ai site ${commandTarget} --mcp-check --probes --out mcp-check-probes.txt`,
    mcpCheckProbesJsonOut: `design-ai site ${commandTarget} --mcp-check --probes --json --out mcp-check-probes.json`,
    mcpPlanProbesJson: `design-ai site ${commandTarget} --mcp-plan --probes --json`,
    mcpPlanProbesJsonOut: `design-ai site ${commandTarget} --mcp-plan --probes --json --out mcp-action-plan-probes.json`,
  };
}

export function buildSiteMcpCheckReport(workspace, summary = {}, options = {}) {
  const items = MCP_ITEMS.map(([key, label]) => mcpItemReport(workspace, key, label));
  const taskGaps = mcpTaskGaps(workspace);
  const workspaceIssues = (summary.issues || []).filter((issue) => issue.level !== "pass");
  const baseStatus = siteMcpCheckStatus(items, taskGaps, workspaceIssues);
  const probes = options.probes ? buildSiteMcpProbeReport(workspace) : null;
  const status = probes ? combineStatuses(baseStatus, probes.status) : baseStatus;
  const nextActions = [
    ...items.flatMap((item) => item.actions),
    ...(probes ? probes.items.flatMap((item) => item.actions.map((action) => `Probe ${item.id}: ${action}`)) : []),
    ...taskGaps.map((gap) => `Align task '${gap.taskId}' recommendedMcp with mcpReadiness.${gap.mcp}.`),
  ];

  const report = {
    filePath: summary.filePath || "workspace.json",
    status,
    workspaceStatus: summary.status || "unknown",
    site: {
      name: workspace.siteProfile.name,
      liveUrl: workspace.siteProfile.liveUrl,
      repoUrl: workspace.siteProfile.repoUrl,
      localPath: workspace.siteProfile.localPath,
    },
    counts: {
      total: items.length,
      required: items.filter((item) => item.requestedStatus === "required").length,
      optional: items.filter((item) => item.requestedStatus === "optional").length,
      ready: items.filter((item) => item.state === "ready").length,
      missing: items.filter((item) => item.state === "missing").length,
      unused: items.filter((item) => item.state === "unused").length,
      unavailable: items.filter((item) => item.state === "unavailable").length,
      taskGaps: taskGaps.length,
    },
    items,
    taskGaps,
    workspaceIssues,
    nextActions,
  };
  if (probes) {
    report.probes = probes;
    report.commands = buildSiteMcpProbeCommandSet(siteMcpCommandTarget(report.filePath));
  }
  return report;
}

export function formatSiteMcpCheckJson(report) {
  return JSON.stringify(report, null, 2);
}

export function formatSiteMcpCheckHuman(report) {
  return [
    `Website Improvement MCP readiness: ${report.site.name}`,
    "",
    `Status: ${report.status}`,
    `Workspace status: ${report.workspaceStatus}`,
    `Required MCP: ${report.counts.required}`,
    `Ready: ${report.counts.ready}`,
    `Missing: ${report.counts.missing}`,
    `Task gaps: ${report.counts.taskGaps}`,
    "",
    "MCP checks:",
    ...report.items.map((item) => {
      const evidence = item.evidence.length ? item.evidence.join("; ") : "no evidence";
      const action = item.actions.length ? `\n   Next: ${item.actions.join(" ")}` : "";
      return `- [${item.level}] ${item.label} (${item.requestedStatus}) -> ${item.state}\n   Evidence: ${evidence}${action}`;
    }),
    "",
    "Task MCP gaps:",
    ...(report.taskGaps.length
      ? report.taskGaps.map((gap) => `- [${gap.level}] ${gap.taskId}: ${gap.message}`)
      : ["- none"]),
    ...(report.probes ? [
      "",
      "Read-only probes:",
      `Mode: ${report.probes.mode}; external calls: ${report.probes.externalCalls ? "yes" : "no"}; status: ${report.probes.status}`,
      ...report.probes.items.map((item) => {
        const evidence = item.evidence.length ? item.evidence.join("; ") : "no evidence";
        const action = item.actions.length ? `\n   Next: ${item.actions.join(" ")}` : "";
        return `- [${item.level}] ${item.label} (${item.requestedStatus}) -> ${item.passed ? "pass" : "needs attention"}\n   Evidence: ${evidence}${action}`;
      }),
    ] : []),
    ...(report.commands ? [
      "",
      "Probe commands:",
      `- Save readiness probe report: \`${report.commands.mcpCheckProbesHumanOut}\``,
      `- Save readiness probe JSON: \`${report.commands.mcpCheckProbesJsonOut}\``,
      `- Generate probe action plan JSON: \`${report.commands.mcpPlanProbesJson}\``,
      `- Save probe action plan JSON: \`${report.commands.mcpPlanProbesJsonOut}\``,
    ] : []),
    "",
    "Next actions:",
    ...(report.nextActions.length ? report.nextActions.map((action) => `- ${action}`) : ["- none"]),
  ].join("\n");
}

function markdownTable(headers, rows) {
  const escapeCell = (value) => String(value || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  return [
    `| ${headers.map(escapeCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`),
  ].join("\n");
}

function mcpActionPlanTaskRows(workspace, report) {
  const stateByKey = new Map(report.items.map((item) => [item.key, item.state]));
  const topTasks = workspace.refactorTasks
    .slice()
    .sort((a, b) => PRIORITY_OPTIONS.indexOf(a.priority) - PRIORITY_OPTIONS.indexOf(b.priority))
    .slice(0, 8);

  if (topTasks.length === 0) {
    return [["No refactor tasks", "n/a", "n/a", "Generate starter tasks with `design-ai site <workspace.json> --tasks`."]];
  }

  return topTasks.map((task) => {
    const mcps = normalizeStringArray(task.recommendedMcp);
    const states = mcps.length
      ? mcps.map((rawMcp) => {
        const key = normalizeMcpKey(rawMcp);
        return `${key}: ${stateByKey.get(key) || "unknown"}`;
      }).join(", ")
      : "none";
    return [
      task.id,
      `${task.priority} / ${task.impact}`,
      mcps.join(", ") || "none",
      states,
    ];
  });
}

export function buildSiteMcpActionPlanData(workspace, summary = {}, options = {}) {
  const report = buildSiteMcpCheckReport(workspace, summary, options);
  const filePath = report.filePath || "workspace.json";
  const commandTarget = siteMcpCommandTarget(filePath);
  const probeCommands = buildSiteMcpProbeCommandSet(commandTarget);
  const requiredGaps = report.items.filter((item) => item.requestedStatus === "required" && item.level !== "pass");
  const optionalGaps = report.items.filter((item) => item.requestedStatus === "optional" && item.level !== "pass");
  const blockingIssues = [
    ...report.workspaceIssues.filter((issue) => issue.level === "fail").map((issue) => `${issue.id}: ${issue.message}`),
    ...requiredGaps.map((item) => `${item.label}: ${item.actions.join(" ") || "Add required readiness evidence."}`),
  ];
  const warningIssues = [
    ...report.workspaceIssues.filter((issue) => issue.level === "warn").map((issue) => `${issue.id}: ${issue.message}`),
    ...optionalGaps.map((item) => `${item.label}: ${item.actions.join(" ") || "Add optional readiness evidence or mark unused."}`),
    ...report.taskGaps.map((gap) => `${gap.taskId}: ${gap.message}`),
  ];
  const taskAlignment = mcpActionPlanTaskRows(workspace, report).map((row) => ({
    task: row[0],
    priorityImpact: row[1],
    recommendedMcp: row[2],
    readinessState: row[3],
  }));
  const commands = {
    mcpCheck: `design-ai site ${commandTarget} --mcp-check --strict --json`,
    mcpCheckProbesHumanOut: probeCommands.mcpCheckProbesHumanOut,
    mcpCheckProbesJsonOut: probeCommands.mcpCheckProbesJsonOut,
    mcpPlanProbesJsonOut: probeCommands.mcpPlanProbesJsonOut,
    tasks: `design-ai site ${commandTarget} --tasks --out website-workspace.tasks.json`,
    implementationPrompt: `design-ai site ${commandTarget} --prompt codex-implementation --task 1 --out codex-implementation.md`,
    handoffReport: `design-ai site ${commandTarget} --report --out website-handoff.md`,
  };
  const executionSequence = [
    "Fix every blocking item before target-repo implementation handoff.",
    "Resolve warnings that affect the next selected refactor task, or mark the MCP unused when it is intentionally out of scope.",
    "Re-run the strict readiness gate and keep the JSON output with the handoff package.",
    "Generate or refresh starter tasks, then export the selected Codex implementation prompt.",
    "Run target-repo lint/typecheck/build plus desktop, tablet, mobile, keyboard, and screen-reader verification after implementation.",
  ];
  const boundaries = [
    "This plan is deterministic and local.",
    "It does not call external MCPs, mutate the target website repo, run Lighthouse/axe, capture screenshots, or write to deployment/CMS/Sentry systems.",
    "Run the generated Codex/Claude prompts in the target website workflow after this readiness plan is clean.",
  ];

  return {
    kind: "website-improvement-mcp-action-plan",
    version: 1,
    filePath,
    status: report.status,
    workspaceStatus: report.workspaceStatus,
    site: report.site,
    counts: report.counts,
    readinessMatrix: report.items,
    probes: report.probes || null,
    blockingItems: blockingIssues,
    warnings: warningIssues,
    taskAlignment,
    taskGaps: report.taskGaps,
    workspaceIssues: report.workspaceIssues,
    nextActions: report.nextActions,
    executionSequence,
    commands,
    boundaries,
    externalCalls: false,
    targetRepoMutation: false,
  };
}

export function formatSiteMcpActionPlanJson(plan) {
  return JSON.stringify(plan, null, 2);
}

export function buildSiteMcpActionPlan(workspace, summary = {}, options = {}) {
  const plan = buildSiteMcpActionPlanData(workspace, summary, options);

  return [
    `# Website improvement MCP action plan: ${plan.site.name}`,
    "",
    "## Summary",
    `- Source: ${plan.filePath}`,
    `- Status: ${plan.status}`,
    `- Workspace status: ${plan.workspaceStatus}`,
    `- Live URL: ${plan.site.liveUrl || "not provided"}`,
    `- Repo: ${plan.site.repoUrl || plan.site.localPath || "not provided"}`,
    `- Ready MCP: ${plan.counts.ready}/${plan.counts.total}`,
    `- Missing MCP: ${plan.counts.missing}`,
    `- Task/MCP gaps: ${plan.counts.taskGaps}`,
    "",
    "## Readiness Matrix",
    markdownTable(
      ["MCP", "Requested", "State", "Level", "Evidence"],
      plan.readinessMatrix.map((item) => [
        item.label,
        item.requestedStatus,
        item.state,
        item.level,
        item.evidence.length ? item.evidence.join("; ") : "none",
      ]),
    ),
    ...(plan.probes ? [
      "",
      "## Read-Only Probes",
      "",
      `- Probe status: ${plan.probes.status}`,
      `- Mode: ${plan.probes.mode}`,
      `- External calls: ${plan.probes.externalCalls ? "yes" : "no"}`,
      "",
      markdownTable(
        ["Probe", "MCP", "Level", "Result", "Evidence", "Next Action"],
        plan.probes.items.map((item) => [
          item.label,
          item.key,
          item.level,
          item.passed ? "pass" : "needs attention",
          item.evidence.length ? item.evidence.join("; ") : "none",
          item.actions.length ? item.actions.join(" ") : "none",
        ]),
      ),
    ] : []),
    "",
    "## Blocking Items",
    markdownList(plan.blockingItems, "No blocking readiness issues."),
    "",
    "## Warnings",
    markdownList(plan.warnings, "No optional readiness or task/MCP warnings."),
    "",
    "## Task/MCP Alignment",
    markdownTable(
      ["Task", "Priority / impact", "Recommended MCP", "Readiness state"],
      plan.taskAlignment.map((item) => [
        item.task,
        item.priorityImpact,
        item.recommendedMcp,
        item.readinessState,
      ]),
    ),
    "",
    "## Execution Sequence",
    ...plan.executionSequence.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## Commands",
    ...Object.values(plan.commands).map((command) => `- \`${command}\``),
    "",
    "## Boundaries",
    ...plan.boundaries.map((boundary) => `- ${boundary}`),
  ].join("\n");
}

function nextActionEntry({ severity, title, reason, command = "", references = [] }) {
  return {
    severity,
    title,
    reason,
    command,
    references,
  };
}

function buildSiteNextActionCommandSet(commandTarget) {
  return {
    summary: `design-ai site ${commandTarget} --json`,
    mcpCheck: `design-ai site ${commandTarget} --mcp-check --strict --json`,
    mcpPlan: `design-ai site ${commandTarget} --mcp-plan --out mcp-action-plan.md`,
    mcpCheckProbes: `design-ai site ${commandTarget} --mcp-check --probes --json --out mcp-check-probes.json`,
    mcpPlanProbes: `design-ai site ${commandTarget} --mcp-plan --probes --json --out mcp-action-plan-probes.json`,
    tasks: `design-ai site ${commandTarget} --tasks --out website-workspace.tasks.json`,
    implementationPrompt: `design-ai site ${commandTarget} --prompt codex-implementation --task 1 --out codex-implementation.md`,
    handoffReport: `design-ai site ${commandTarget} --report --out website-handoff.md`,
    handoffBundle: `design-ai site ${commandTarget} --bundle --out website-handoff-bundle`,
  };
}

function quoteCliValue(value) {
  const text = String(value || "");
  if (/^[A-Za-z0-9_./:@+-]+$/.test(text)) {
    return text;
  }
  return `'${text.replaceAll("'", "'\"'\"'")}'`;
}

function buildSiteInitCommand(profile, outPath = "website-workspace.json") {
  const args = [
    "design-ai site --init",
    "--name",
    quoteCliValue(profile.name),
    "--live-url",
    quoteCliValue(profile.liveUrl),
  ];
  if (profile.repoUrl) args.push("--repo-url", quoteCliValue(profile.repoUrl));
  if (profile.localPath) args.push("--local-path", quoteCliValue(profile.localPath));
  if (profile.figmaUrl) args.push("--figma-url", quoteCliValue(profile.figmaUrl));
  if (profile.brandNotes) args.push("--brand-notes", quoteCliValue(profile.brandNotes));
  if (profile.deployProvider && profile.deployProvider !== "none") args.push("--deploy", quoteCliValue(profile.deployProvider));
  if (profile.sentryProject) args.push("--sentry", quoteCliValue(profile.sentryProject));
  if (profile.cms && profile.cms !== "none") args.push("--cms", quoteCliValue(profile.cms));
  if (profile.database && profile.database !== "none") args.push("--database", quoteCliValue(profile.database));
  for (const page of profile.pages) args.push("--page", quoteCliValue(page));
  for (const flow of profile.userFlows) args.push("--flow", quoteCliValue(flow));
  for (const viewport of profile.viewports) args.push("--viewport", quoteCliValue(viewport));
  args.push("--out", quoteCliValue(outPath));
  return args.join(" ");
}

export function buildSiteNextActionsReport(workspace, summary = {}) {
  const filePath = summary.filePath || "workspace.json";
  const commandTarget = siteMcpCommandTarget(filePath);
  const commands = buildSiteNextActionCommandSet(commandTarget);
  const mcpReport = buildSiteMcpCheckReport(workspace, summary);
  const mcpProbeReport = buildSiteMcpProbeReport(workspace);
  const topTasks = workspace.refactorTasks
    .slice()
    .sort((a, b) => PRIORITY_OPTIONS.indexOf(a.priority) - PRIORITY_OPTIONS.indexOf(b.priority))
    .slice(0, 3);
  const actions = [];

  for (const issue of (summary.issues || []).filter((item) => item.level !== "pass")) {
    actions.push(nextActionEntry({
      severity: issue.level === "fail" ? "blocking" : "warning",
      title: `Fix workspace validation: ${issue.id}`,
      reason: issue.message,
      command: commands.summary,
      references: [issue.id],
    }));
  }

  for (const item of mcpReport.items.filter((mcp) => mcp.requestedStatus === "required" && mcp.level !== "pass")) {
    actions.push(nextActionEntry({
      severity: "blocking",
      title: `Add required MCP readiness: ${item.label}`,
      reason: item.actions.join(" ") || "Required MCP readiness is missing.",
      command: commands.mcpCheck,
      references: [item.key],
    }));
  }

  for (const item of mcpReport.items.filter((mcp) => mcp.requestedStatus === "optional" && mcp.level !== "pass")) {
    actions.push(nextActionEntry({
      severity: "warning",
      title: `Clarify optional MCP readiness: ${item.label}`,
      reason: item.actions.join(" ") || "Optional MCP readiness is missing; add evidence or mark it unused.",
      command: commands.mcpPlan,
      references: [item.key],
    }));
  }

  for (const gap of mcpReport.taskGaps) {
    actions.push(nextActionEntry({
      severity: "warning",
      title: `Align MCP status for ${gap.taskId}`,
      reason: gap.message,
      command: commands.mcpPlan,
      references: [gap.taskId, gap.mcp],
    }));
  }

  for (const item of mcpProbeReport.items.filter((probe) => probe.level !== "pass")) {
    actions.push(nextActionEntry({
      severity: item.level === "fail" ? "blocking" : "warning",
      title: `Resolve MCP probe readiness: ${item.label}`,
      reason: item.actions.join(" ") || item.message,
      command: item.level === "fail" ? commands.mcpCheckProbes : commands.mcpPlanProbes,
      references: [item.id, item.key],
    }));
  }

  if (workspace.refactorTasks.length === 0) {
    actions.push(nextActionEntry({
      severity: "setup",
      title: "Generate starter refactor tasks",
      reason: "No refactor tasks exist yet; generate task scaffolding from audit findings before implementation handoff.",
      command: commands.tasks,
      references: ["refactorTasks"],
    }));
  } else {
    const selected = topTasks[0];
    actions.push(nextActionEntry({
      severity: "implementation",
      title: `Prepare Codex implementation prompt for ${selected.id}`,
      reason: `${selected.title} is the highest-priority available refactor task.`,
      command: commands.implementationPrompt,
      references: [selected.id],
    }));
  }

  const evidenceCounts = countImplementationEvidence(summary.counts || workspace.implementationEvidence);
  if (evidenceCounts.executedWork === 0 || evidenceCounts.verificationResults === 0) {
    actions.push(nextActionEntry({
      severity: "handoff",
      title: "Create implementation evidence trail",
      reason: "Executed work or verification results are still empty, so the handoff report should capture what remains unverified.",
      command: commands.handoffReport,
      references: ["implementationEvidence"],
    }));
  }

  actions.push(nextActionEntry({
    severity: "handoff",
    title: "Export portable handoff bundle",
    reason: "A bundle keeps summary, tasks, MCP evidence, prompts, and handoff report together for the target website repo workflow.",
    command: commands.handoffBundle,
    references: ["bundle"],
  }));

  const severityOrder = {
    blocking: 0,
    warning: 1,
    setup: 2,
    implementation: 3,
    handoff: 4,
  };
  const rankedActions = actions
    .map((action, index) => ({ action, index }))
    .sort((a, b) => {
      const severityDiff = (severityOrder[a.action.severity] ?? 99) - (severityOrder[b.action.severity] ?? 99);
      return severityDiff || a.index - b.index;
    })
    .map(({ action }, index) => ({
      rank: index + 1,
      ...action,
    }));

  return {
    kind: "website-improvement-next-actions",
    version: 1,
    filePath,
    status: combineStatuses(summary.status || "pass", mcpReport.status, mcpProbeReport.status),
    workspaceStatus: summary.status || "unknown",
    mcpStatus: mcpReport.status,
    mcpProbeStatus: mcpProbeReport.status,
    mcpProbeCounts: {
      count: mcpProbeReport.count,
      pass: mcpProbeReport.pass,
      warn: mcpProbeReport.warn,
      fail: mcpProbeReport.fail,
    },
    site: {
      name: workspace.siteProfile.name,
      liveUrl: workspace.siteProfile.liveUrl,
      repoUrl: workspace.siteProfile.repoUrl,
      localPath: workspace.siteProfile.localPath,
    },
    counts: {
      actions: rankedActions.length,
      blocking: rankedActions.filter((action) => action.severity === "blocking").length,
      warnings: rankedActions.filter((action) => action.severity === "warning").length,
      tasks: workspace.refactorTasks.length,
      requiredMcpMissing: mcpReport.items.filter((item) => item.requestedStatus === "required" && item.level !== "pass").length,
      taskGaps: mcpReport.taskGaps.length,
      probeGaps: mcpProbeReport.items.filter((item) => item.level !== "pass").length,
    },
    topTasks: topTasks.map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      category: task.category,
      impact: task.impact,
      effort: task.effort,
    })),
    actions: rankedActions,
    commands,
    boundaries: [
      "This next-action report is deterministic and local.",
      "It does not call external MCPs, mutate the target website repo, run Lighthouse/axe, capture screenshots, or write deployment/CMS/Sentry data.",
      "MCP probes are read-only local URL/path/reference checks and do not connect to external MCP servers.",
      "Run implementation commands in the target website workflow after readiness blockers are cleared.",
    ],
    externalCalls: false,
    targetRepoMutation: false,
  };
}

export function buildSiteInitNextActionsReport(workspace, summary = {}) {
  const filePath = summary.filePath || "website-workspace.json";
  const report = buildSiteNextActionsReport(workspace, {
    ...summary,
    filePath,
  });
  const createWorkspaceCommand = buildSiteInitCommand(workspace.siteProfile, filePath);
  const createWorkspaceAction = {
    rank: 1,
    ...nextActionEntry({
      severity: "setup",
      title: "Save the generated Website Improvement workspace",
      reason: "The company dogfood flow needs a durable workspace JSON before MCP checks, task generation, handoff reports, or target-repo prompts can reference it.",
      command: createWorkspaceCommand,
      references: ["siteProfile", "workspace"],
    }),
  };
  const actions = [createWorkspaceAction, ...report.actions.map((action) => ({
    ...action,
    rank: action.rank + 1,
  }))];
  return {
    ...report,
    mode: "init-next-actions",
    counts: {
      ...report.counts,
      actions: actions.length,
      blocking: actions.filter((action) => action.severity === "blocking").length,
      warnings: actions.filter((action) => action.severity === "warning").length,
    },
    actions,
    commands: {
      createWorkspace: createWorkspaceCommand,
      ...report.commands,
    },
    boundaries: [
      "This init next-action report is deterministic and local.",
      "Save the workspace JSON first when you plan to continue in the Website Console or target website repo.",
      ...report.boundaries,
    ],
  };
}

export function buildSiteIntakeNextActionsReport(workspace, summary = {}, options = {}) {
  const intakePath = options.intakePath || "company-website-intake.md";
  const workspacePath = options.workspacePath || "website-workspace.json";
  const report = buildSiteNextActionsReport(workspace, {
    ...summary,
    filePath: workspacePath,
  });
  const createWorkspaceCommand = options.stdin
    ? `cat company-website-intake.md | design-ai site --from-intake --stdin --out ${quoteCliValue(workspacePath)} --force`
    : `design-ai site --from-intake ${quoteCliValue(intakePath)} --out ${quoteCliValue(workspacePath)} --force`;
  const createWorkspaceAction = {
    rank: 1,
    ...nextActionEntry({
      severity: "setup",
      title: "Save the parsed Website Improvement workspace",
      reason: "The filled intake Markdown should be converted into durable workspace JSON before MCP checks, task generation, handoff reports, or target-repo prompts reference it.",
      command: createWorkspaceCommand,
      references: ["intake", "workspace"],
    }),
  };
  const actions = [createWorkspaceAction, ...report.actions.map((action) => ({
    ...action,
    rank: action.rank + 1,
  }))];
  return {
    ...report,
    mode: "from-intake-next-actions",
    intakePath,
    counts: {
      ...report.counts,
      actions: actions.length,
      blocking: actions.filter((action) => action.severity === "blocking").length,
      warnings: actions.filter((action) => action.severity === "warning").length,
    },
    actions,
    commands: {
      createWorkspace: createWorkspaceCommand,
      ...report.commands,
    },
    boundaries: [
      "This intake next-action report is deterministic and local.",
      "Save the parsed workspace JSON first when you plan to continue in the Website Console or target website repo.",
      ...report.boundaries,
    ],
  };
}

export function formatSiteNextActionsJson(report) {
  return JSON.stringify(report, null, 2);
}

export function formatSiteNextActionsHuman(report) {
  return [
    `Website Improvement next actions: ${report.site.name}`,
    "",
    `Status: ${report.status}`,
    `Workspace status: ${report.workspaceStatus}`,
    `MCP status: ${report.mcpStatus}`,
    `MCP probe status: ${report.mcpProbeStatus}`,
    `MCP probes: ${report.mcpProbeCounts.pass}/${report.mcpProbeCounts.count} passing, ${report.mcpProbeCounts.warn} warning, ${report.mcpProbeCounts.fail} failing`,
    `Actions: ${report.counts.actions} (${report.counts.blocking} blocking, ${report.counts.warnings} warning)`,
    "",
    "Prioritized actions:",
    ...report.actions.map((action) => {
      const command = action.command ? `\n   Command: \`${action.command}\`` : "";
      const refs = action.references.length ? `\n   References: ${action.references.join(", ")}` : "";
      return `${action.rank}. [${action.severity}] ${action.title}\n   Why: ${action.reason}${command}${refs}`;
    }),
    "",
    "Boundaries:",
    ...report.boundaries.map((boundary) => `- ${boundary}`),
  ].join("\n");
}

function workflowNode(id, type, label, status, data = {}) {
  return {
    id,
    type,
    label,
    status,
    data,
  };
}

function workflowEdge(from, to, type, label) {
  return {
    id: `${from}->${to}:${type}`,
    from,
    to,
    type,
    label,
  };
}

function siteProfileNodeId(profile) {
  return `profile:${profile.id || "site"}`;
}

function workflowGraphMcpNodes(mcpReport) {
  return mcpReport.items.map((item) => workflowNode(
    `mcp:${item.key}`,
    "mcp-readiness",
    item.label,
    item.level,
    {
      key: item.key,
      requestedStatus: item.requestedStatus,
      state: item.state,
      evidence: item.evidence,
      actions: item.actions,
    },
  ));
}

function workflowGraphTaskNode(task) {
  return workflowNode(
    `task:${task.id}`,
    "refactor-task",
    task.title,
    "planned",
    {
      id: task.id,
      category: task.category,
      problem: task.problem,
      evidence: task.evidence,
      impact: task.impact,
      effort: task.effort,
      priority: task.priority,
      pages: task.pages,
      recommendedMcp: task.recommendedMcp,
      codexPrompt: task.codexPrompt,
      verification: task.verification,
      risks: task.risks,
    },
  );
}

export function buildSiteWorkflowGraph(workspaceInput, summary = {}) {
  const taskResult = generateSiteRefactorTasks(workspaceInput);
  const workspace = taskResult.workspace;
  const filePath = summary.filePath || "workspace.json";
  const { summary: taskSummary } = analyzeSiteWorkspace(workspace, { filePath });
  const mcpReport = buildSiteMcpCheckReport(workspace, taskSummary);
  const profile = workspace.siteProfile;
  const profileNodeId = siteProfileNodeId(profile);
  const orderedTasks = orderedRefactorTasks(workspace);
  const nodes = [];
  const edges = [];

  nodes.push(workflowNode(
    "workspace:intake",
    "workspace",
    "Workspace intake",
    taskSummary.status,
    {
      version: workspace.version,
      updatedAt: workspace.updatedAt,
      source: filePath,
      workspaceStatus: taskSummary.status,
      mcpStatus: mcpReport.status,
    },
  ));
  nodes.push(workflowNode(
    profileNodeId,
    "site-profile",
    profile.name,
    taskSummary.status,
    {
      id: profile.id,
      liveUrl: profile.liveUrl,
      repoUrl: profile.repoUrl,
      localPath: profile.localPath,
      figmaUrl: profile.figmaUrl,
      deployProvider: profile.deployProvider,
      cms: profile.cms,
      database: profile.database,
      pages: profile.pages,
      userFlows: profile.userFlows,
      viewports: profile.viewports,
      brandNotes: profile.brandNotes,
    },
  ));
  edges.push(workflowEdge("workspace:intake", profileNodeId, "profile", "Workspace defines the target site profile"));

  for (const category of AUDIT_CATEGORIES) {
    const row = workspace.auditChecklist[category.id];
    const nodeId = `audit:${category.id}`;
    nodes.push(workflowNode(
      nodeId,
      "audit-category",
      category.label,
      row.status,
      {
        category: category.id,
        notes: row.notes,
        findings: row.findings,
        findingCount: row.findings.length,
        defaultVerification: category.defaultVerification,
      },
    ));
    edges.push(workflowEdge(profileNodeId, nodeId, "audit-input", "Site context drives this audit category"));
  }

  const mcpNodes = workflowGraphMcpNodes(mcpReport);
  nodes.push(...mcpNodes);
  for (const node of mcpNodes) {
    edges.push(workflowEdge(profileNodeId, node.id, "readiness-input", "Site profile provides MCP readiness evidence"));
  }

  for (const task of orderedTasks) {
    const taskNode = workflowGraphTaskNode(task);
    nodes.push(taskNode);
    edges.push(workflowEdge(`audit:${task.category}`, taskNode.id, "finding-to-task", "Audit finding informs this refactor task"));
    edges.push(workflowEdge(profileNodeId, taskNode.id, "site-context", "Site profile scopes this refactor task"));
    for (const rawMcp of task.recommendedMcp) {
      const key = normalizeMcpKey(rawMcp);
      if (workspace.mcpReadiness[key]) {
        edges.push(workflowEdge(`mcp:${key}`, taskNode.id, "mcp-support", "MCP readiness supports task execution"));
      }
    }
  }

  for (const template of SITE_PROMPT_TEMPLATES) {
    const promptNodeId = `prompt:${template.id}`;
    nodes.push(workflowNode(
      promptNodeId,
      "prompt-template",
      template.label,
      "ready",
      {
        id: template.id,
        agent: template.agent,
        output: template.output,
        description: template.description,
        taskSelectable: template.taskSelectable,
      },
    ));
    edges.push(workflowEdge(profileNodeId, promptNodeId, "profile-context", "Prompt template receives site profile context"));
  }

  for (const task of orderedTasks) {
    edges.push(workflowEdge(`task:${task.id}`, "prompt:codex-implementation", "implementation-prompt", "Task can be exported as a Codex implementation prompt"));
  }

  nodes.push(workflowNode(
    "handoff:report",
    "handoff-report",
    "Handoff report",
    "ready",
    {
      output: "website-handoff.md",
      purpose: "Summarize site state, audit findings, priority improvements, verification, and remaining risk",
    },
  ));
  nodes.push(workflowNode(
    "handoff:bundle",
    "handoff-bundle",
    "Local handoff bundle",
    "ready",
    {
      output: "website-handoff-bundle",
      purpose: "Package the local Website Improvement plan without mutating the target repo",
    },
  ));
  nodes.push(workflowNode(
    "handoff:target-repo",
    "target-repo",
    "Target website repo",
    "external",
    {
      repoUrl: profile.repoUrl,
      localPath: profile.localPath,
      boundary: "Implementation happens outside the design-ai repository",
    },
  ));
  edges.push(workflowEdge(profileNodeId, "handoff:report", "handoff-input", "Site profile anchors the handoff report"));
  for (const task of orderedTasks) {
    edges.push(workflowEdge(`task:${task.id}`, "handoff:report", "handoff-input", "Refactor task is summarized in the handoff report"));
  }
  for (const item of mcpReport.items.filter((item) => item.requestedStatus !== "unused")) {
    edges.push(workflowEdge(`mcp:${item.key}`, "handoff:report", "readiness-input", "MCP readiness is summarized in the handoff report"));
  }
  for (const template of SITE_PROMPT_TEMPLATES) {
    edges.push(workflowEdge(`prompt:${template.id}`, "handoff:target-repo", "agent-prompt", "Prompt can be used in the target website workflow"));
  }
  edges.push(workflowEdge("handoff:report", "handoff:bundle", "bundle-input", "Handoff report can be packaged into a local bundle"));
  edges.push(workflowEdge("handoff:bundle", "handoff:target-repo", "handoff", "Verified bundle can become target-repo implementation context"));

  const status = combineStatuses(taskSummary.status, mcpReport.status);
  return {
    version: 1,
    kind: "website-improvement-workflow-graph",
    generatedAt: workspace.updatedAt,
    filePath,
    status,
    workspaceStatus: taskSummary.status,
    mcpStatus: mcpReport.status,
    externalCalls: false,
    site: {
      id: profile.id,
      name: profile.name,
      liveUrl: profile.liveUrl,
      repoUrl: profile.repoUrl,
      localPath: profile.localPath,
    },
    summary: {
      status,
      workspaceStatus: taskSummary.status,
      mcpStatus: mcpReport.status,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      auditCategoryCount: AUDIT_CATEGORIES.length,
      taskCount: orderedTasks.length,
      generatedTaskCount: taskResult.created.length,
      requiredMcpCount: mcpReport.counts.required,
      promptTemplateCount: SITE_PROMPT_TEMPLATES.length,
    },
    nodes,
    edges,
    boundaries: [
      "deterministic-local",
      "no-external-mcp-calls",
      "no-target-repo-mutation",
      "no-new-dependencies",
    ],
  };
}

export function formatSiteWorkflowGraphJson(graph) {
  return JSON.stringify(graph, null, 2);
}

export function formatSiteWorkflowGraphMarkdown(graph) {
  return [
    `# Website improvement workflow graph: ${graph.site.name}`,
    "",
    "## Summary",
    `- Source: ${graph.filePath}`,
    `- Status: ${graph.status}`,
    `- Workspace status: ${graph.workspaceStatus}`,
    `- MCP status: ${graph.mcpStatus}`,
    `- Nodes: ${graph.summary.nodeCount}`,
    `- Edges: ${graph.summary.edgeCount}`,
    `- Tasks: ${graph.summary.taskCount}`,
    `- Prompt templates: ${graph.summary.promptTemplateCount}`,
    `- External calls: ${graph.externalCalls ? "yes" : "no"}`,
    "",
    "## Nodes",
    markdownTable(
      ["ID", "Type", "Status", "Label"],
      graph.nodes.map((node) => [node.id, node.type, node.status, node.label]),
    ),
    "",
    "## Edges",
    markdownTable(
      ["From", "To", "Type", "Label"],
      graph.edges.map((edge) => [edge.from, edge.to, edge.type, edge.label]),
    ),
    "",
    "## Boundaries",
    "- This graph is deterministic and local.",
    "- No external MCP calls are made.",
    "- It does not mutate the target website repo, run Lighthouse/axe, crawl pages, add dependencies, or write to external systems.",
  ].join("\n");
}

function buildSiteBundleHandoffGuidance(bundleStatus) {
  const strictCommand = "design-ai site <bundle-dir> --bundle-handoff --strict --out target-repo-handoff.md";
  const draftCommand = "design-ai site <bundle-dir> --bundle-handoff --out target-repo-handoff.md";
  const verifyCommand = "design-ai site <bundle-dir> --bundle-check --strict --json";
  const strictReady = bundleStatus === "pass";
  return {
    strictReady,
    readiness: strictReady ? "ready-for-strict-handoff" : "review-warnings-before-strict-handoff",
    recommendedCommand: strictReady ? strictCommand : draftCommand,
    strictCommand,
    draftCommand,
    verifyCommand,
    note: strictReady
      ? "Use the strict handoff command before target-repo implementation."
      : "Use the draft handoff command only for planning while readiness warnings remain; use the strict handoff command before treating the bundle as implementation authority.",
    executionChecklist: SITE_TARGET_REPO_EXECUTION_CHECKLIST,
  };
}

function buildSiteBundleReadme(workspace, bundleSummary, mcpReport, mcpProbeReport, filePaths) {
  const commandTarget = bundleSummary.source === "stdin" ? "<workspace.json>" : bundleSummary.source;
  const handoff = bundleSummary.handoff;
  return [
    `# Website improvement handoff bundle: ${workspace.siteProfile.name}`,
    "",
    "> Generated by `design-ai site --bundle` from a Website Improvement Console workspace export.",
    "",
    "## Contents",
    markdownTable(
      ["File", "Purpose"],
      filePaths.map((filePath) => {
        const purpose = {
          "summary.json": "Machine-readable bundle manifest and readiness summary",
          "website-workspace.tasks.json": "Workspace JSON with deterministic starter refactor tasks added",
          "mcp-check.json": "Machine-readable MCP readiness gate output",
          "mcp-probes.json": "Machine-readable read-only MCP probe readiness output",
          "mcp-action-plan.md": "Operator-facing MCP readiness action plan",
          "website-handoff.md": "Markdown handoff report for implementation planning",
          "website-prompts.md": "Full Codex and Claude prompt bundle",
          "codex-implementation.md": "Top-priority Codex implementation prompt",
        }[filePath] || "Bundle artifact";
        return [filePath, purpose];
      }),
    ),
    "",
    "## Status",
    `- Bundle status: ${mcpReport.status}`,
    `- Workspace status: ${bundleSummary.workspaceStatus}`,
    `- Source: ${bundleSummary.source}`,
    `- Site: ${workspace.siteProfile.name}`,
    `- Live URL: ${workspace.siteProfile.liveUrl || "not provided"}`,
    `- Repo: ${workspace.siteProfile.repoUrl || workspace.siteProfile.localPath || "not provided"}`,
    `- Tasks: ${bundleSummary.taskGeneration.totalTasks}`,
    `- Evidence entries: ${bundleSummary.implementationEvidence.executedWork + bundleSummary.implementationEvidence.verificationResults}`,
    `- MCP ready: ${mcpReport.counts.ready}/${mcpReport.counts.total}`,
    `- MCP probes: ${mcpProbeReport.pass}/${mcpProbeReport.count} passing`,
    "",
    "## Handoff Readiness",
    `- Strict-ready: ${handoff.strictReady ? "yes" : "no"}`,
    `- Readiness: ${handoff.readiness}`,
    `- Recommended command: \`${handoff.recommendedCommand}\``,
    `- Strict command: \`${handoff.strictCommand}\``,
    `- Draft command: \`${handoff.draftCommand}\``,
    `- Verify command: \`${handoff.verifyCommand}\``,
    `- Note: ${handoff.note}`,
    "",
    "## Target Repo Execution Checklist",
    ...handoff.executionChecklist.map((item) => `- [ ] ${item.label}: ${item.evidence}`),
    "",
    "## Suggested Sequence",
    "1. Read `summary.json`, `mcp-check.json`, `mcp-probes.json`, and `mcp-action-plan.md` first.",
    "2. Run `design-ai site <bundle-dir> --bundle-check --strict --json`; if it exits non-zero, review the warnings or failures before implementation.",
    "3. Run the recommended handoff command above. Use the draft command only for planning while readiness warnings remain.",
    "4. Use `codex-implementation.md` in the target website repo for the top-priority task when you need the raw task prompt.",
    "5. Use `website-prompts.md` for deeper Codex/Claude review, visual QA, deployment verification, competitor research, and final handoff.",
    "6. Record target-repo executed work, verification results, remaining risks, and next actions in `website-handoff.md` after implementation.",
    "",
    "## Regenerate",
    `- \`design-ai site ${commandTarget} --bundle --out website-handoff-bundle --force\``,
    `- \`design-ai site ${commandTarget} --mcp-check --strict --json\``,
    `- \`design-ai site website-handoff-bundle --bundle-check --strict --json\``,
    `- \`design-ai site website-handoff-bundle --bundle-handoff --strict --out target-repo-handoff.md\``,
    "",
    "## Checksum Verification",
    "- `summary.json` records SHA-256 checksums for every generated bundle file except `summary.json` itself.",
    "- `summary.json.checksums.bundleDigest` records a deterministic fingerprint of the checksum manifest for quick bundle identity comparison.",
    "- `design-ai site <bundle-dir> --bundle-check --strict --json` recomputes those checksums so transferred or manually edited bundles fail before target-repo handoff.",
    "",
    "## Boundaries",
    "- This bundle is deterministic and local.",
    "- It does not call external MCPs, mutate the target website repo, run Lighthouse/axe, capture screenshots, or write to deployment/CMS/Sentry systems.",
  ].join("\n");
}

function sha256Hex(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function buildBundleDigest(checksumFiles) {
  const manifest = SITE_BUNDLE_CHECKSUM_FILES.map((filePath) => `${filePath}\t${checksumFiles[filePath] || ""}`).join("\n");
  return sha256Hex(`${manifest}\n`);
}

function buildBundleChecksums(files) {
  const checksumFiles = Object.fromEntries(
    files
      .filter((file) => file.path !== "summary.json")
      .map((file) => [file.path, sha256Hex(file.content)]),
  );
  return {
    algorithm: "sha256",
    bundleDigest: buildBundleDigest(checksumFiles),
    files: checksumFiles,
  };
}

export function buildSiteHandoffBundle(workspace, summary = {}) {
  const taskResult = generateSiteRefactorTasks(workspace);
  const taskWorkspace = taskResult.workspace;
  const source = summary.filePath || "workspace.json";
  const { summary: taskSummary } = analyzeSiteWorkspace(taskWorkspace, { filePath: source });
  const mcpReport = buildSiteMcpCheckReport(taskWorkspace, taskSummary);
  const mcpProbeReport = buildSiteMcpProbeReport(taskWorkspace);
  const filePaths = SITE_BUNDLE_FILES;
  const bundleStatus = combineStatuses(mcpReport.status, mcpProbeReport.status);
  const handoffGuidance = buildSiteBundleHandoffGuidance(bundleStatus);
  const bundleSummary = {
    version: 1,
    generatedAt: taskWorkspace.updatedAt,
    source,
    status: bundleStatus,
    workspaceStatus: taskSummary.status,
    site: taskSummary.site,
    counts: taskSummary.counts,
    taskGeneration: {
      createdCount: taskResult.created.length,
      skippedCount: taskResult.skippedCount,
      totalTasks: taskWorkspace.refactorTasks.length,
      created: taskResult.created.map((task) => ({
        id: task.id,
        title: task.title,
        category: task.category,
        priority: task.priority,
      })),
    },
    implementationEvidence: countImplementationEvidence(taskWorkspace.implementationEvidence),
    mcp: {
      status: mcpReport.status,
      counts: mcpReport.counts,
      taskGaps: mcpReport.taskGaps.length,
      probeStatus: mcpProbeReport.status,
      probeCounts: {
        count: mcpProbeReport.count,
        pass: mcpProbeReport.pass,
        warn: mcpProbeReport.warn,
        fail: mcpProbeReport.fail,
      },
    },
    files: filePaths,
    handoff: handoffGuidance,
    boundaries: [
      "deterministic-local",
      "no-external-mcp-calls",
      "no-target-repo-mutation",
      "no-lighthouse-axe-visual-diff",
    ],
  };

  const contentFiles = [
    {
      path: "README.md",
      content: `${buildSiteBundleReadme(taskWorkspace, bundleSummary, mcpReport, mcpProbeReport, filePaths)}\n`,
    },
    {
      path: "website-workspace.tasks.json",
      content: `${JSON.stringify(taskWorkspace, null, 2)}\n`,
    },
    {
      path: "mcp-check.json",
      content: `${formatSiteMcpCheckJson(mcpReport)}\n`,
    },
    {
      path: "mcp-probes.json",
      content: `${JSON.stringify(mcpProbeReport, null, 2)}\n`,
    },
    {
      path: "mcp-action-plan.md",
      content: `${buildSiteMcpActionPlan(taskWorkspace, taskSummary)}\n`,
    },
    {
      path: "website-handoff.md",
      content: `${buildSiteHandoffReport(taskWorkspace)}\n`,
    },
    {
      path: "website-prompts.md",
      content: `${buildSitePromptBundle(taskWorkspace)}\n`,
    },
    {
      path: "codex-implementation.md",
      content: `${buildSiteBundleImplementationPrompt(taskWorkspace)}\n`,
    },
  ];
  bundleSummary.checksums = buildBundleChecksums(contentFiles);

  return {
    status: bundleStatus,
    summary: bundleSummary,
    files: [
      contentFiles.find((file) => file.path === "README.md"),
      {
        path: "summary.json",
        content: `${JSON.stringify(bundleSummary, null, 2)}\n`,
      },
      ...contentFiles.filter((file) => file.path !== "README.md"),
    ],
  };
}

function buildSiteBundleImplementationPrompt(workspace) {
  const tasks = orderedRefactorTasks(workspace);
  if (tasks.length > 0) {
    return buildSitePrompt(workspace, "codex-implementation", { taskSelector: "1" });
  }

  return [
    "# Codex implementation prompt",
    profileBlock(workspace),
    "",
    mcpBlock(workspace),
    "",
    "Task ID: no-refactor-task-yet",
    "Goal: inspect the target website repository, confirm the website improvement workspace facts, and produce concrete audit findings before implementation starts.",
    "",
    "Rules:",
    "- Work in the target website repository, not in this design-ai repository.",
    "- Do not modify production code until you identify specific audit findings and implementation tasks.",
    "- Inspect existing architecture, components, state, styling, and design tokens before proposing edits.",
    "- Preserve accessibility: keyboard reachability, visible focus, semantic HTML, screen-reader labels, and WCAG 2.1 AA contrast.",
    "- Verify desktop, tablet, and mobile layouts before recommending implementation scope.",
    "",
    "Next step:",
    "- Add audit findings to the Website Improvement workspace, then run `design-ai site website-workspace.json --tasks --out website-workspace.tasks.json` and regenerate this implementation prompt with `design-ai site website-workspace.tasks.json --prompt codex-implementation --task 1 --out codex-implementation.md`.",
  ].join("\n");
}

function readBundleFile(directory, relativePath, issues) {
  const target = path.join(directory, relativePath);
  if (!existsSync(target)) {
    addIssue(issues, "fail", `bundle-missing-${relativePath}`, `Bundle file is missing: ${relativePath}`);
    return null;
  }
  if (!statSync(target).isFile()) {
    addIssue(issues, "fail", `bundle-file-${relativePath}`, `Bundle path must be a file: ${relativePath}`);
    return null;
  }
  return readFileSync(target, "utf8");
}

function parseBundleJson(directory, relativePath, issues) {
  const text = readBundleFile(directory, relativePath, issues);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    addIssue(issues, "fail", `bundle-json-${relativePath}`, `Bundle JSON is invalid in ${relativePath}: ${error.message}`);
    return null;
  }
}

function arraysEqual(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}

function addBundleMarkdownIssue(directory, relativePath, fragments, issues) {
  const text = readBundleFile(directory, relativePath, issues);
  if (text === null) return;
  for (const fragment of fragments) {
    if (!text.includes(fragment)) {
      addIssue(issues, "fail", `bundle-markdown-${relativePath}`, `${relativePath} is missing required text: ${fragment}`);
    }
  }
}

function shortDigest(digest) {
  return digest ? String(digest).slice(0, 12) : "missing";
}

function shellQuote(value) {
  const text = String(value || "");
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(text)) return text;
  return `'${text.replaceAll("'", "'\"'\"'")}'`;
}

function emptyBundleGeneratedContract(source = "") {
  return {
    available: false,
    source: source || "",
    expectedFiles: SITE_BUNDLE_CHECKSUM_FILES.length,
    verifiedFiles: 0,
    driftFiles: [],
    files: [],
  };
}

function buildBundleGeneratedContract(directory, workspace, source) {
  const contractSource = source || "website-workspace.tasks.json";
  const expectedBundle = buildSiteHandoffBundle(workspace, { filePath: contractSource });
  const expectedFiles = new Map(expectedBundle.files.map((file) => [file.path, file.content]));
  const files = SITE_BUNDLE_CHECKSUM_FILES.map((filePath) => {
    const expectedContent = expectedFiles.get(filePath);
    const expectedDigest = typeof expectedContent === "string" ? sha256Hex(expectedContent) : "";
    const targetPath = path.join(directory, filePath);
    const present = existsSync(targetPath) && statSync(targetPath).isFile();
    const actualDigest = present ? sha256Hex(readFileSync(targetPath, "utf8")) : "";
    return {
      path: filePath,
      present,
      matches: Boolean(present && expectedDigest && actualDigest === expectedDigest),
      expectedDigest,
      actualDigest,
    };
  });
  return {
    available: true,
    source: contractSource,
    expectedFiles: SITE_BUNDLE_CHECKSUM_FILES.length,
    verifiedFiles: files.filter((file) => file.matches).length,
    driftFiles: files.filter((file) => file.present && !file.matches).map((file) => file.path),
    files,
  };
}

function addBundleGeneratedContractIssues(generatedContract, issues) {
  if (!generatedContract.available) return;
  for (const file of generatedContract.files) {
    if (!file.present || file.matches) continue;
    addIssue(
      issues,
      "fail",
      `bundle-generated-${file.path}`,
      `${file.path} does not match the current CLI-generated bundle contract (expected ${shortDigest(file.expectedDigest)}, actual ${shortDigest(file.actualDigest)})`,
    );
  }
}

function formatGeneratedContractDriftLines(generatedContract) {
  const driftFiles = generatedContract.files.filter((file) => file.present && !file.matches);
  if (driftFiles.length === 0) return ["- none"];
  return driftFiles.map((file) => `- ${file.path}: expected ${shortDigest(file.expectedDigest)}, actual ${shortDigest(file.actualDigest)}`);
}

function formatGeneratedContractDriftSummary(generatedContract) {
  if (!generatedContract.driftFiles.length) return "none";
  return generatedContract.driftFiles.join(", ");
}

function buildBundleRepairGuidance(directory, generatedContract) {
  const workspacePath = path.join(directory, "website-workspace.tasks.json");
  const reportBaseName = path.basename(directory);
  const reportDirectory = path.dirname(directory);
  const previewReportPath = path.join(reportDirectory, `${reportBaseName}-repair-preview.json`);
  const appliedReportPath = path.join(reportDirectory, `${reportBaseName}-repair-applied.json`);
  const hasWorkspace = existsSync(workspacePath) && statSync(workspacePath).isFile();
  const available = Boolean(generatedContract.available && hasWorkspace);
  return {
    available,
    reason: available
      ? "Regenerate the bundle from its embedded website-workspace.tasks.json when generated contract drift is reported."
      : "Repair guidance requires a readable website-workspace.tasks.json and generated contract analysis.",
    command: available ? `design-ai site ${shellQuote(workspacePath)} --bundle --out ${shellQuote(directory)} --force` : "",
    previewCommand: available ? `design-ai site ${shellQuote(directory)} --bundle-repair --json` : "",
    applyCommand: available ? `design-ai site ${shellQuote(directory)} --bundle-repair --yes --json` : "",
    previewReportCommand: available ? `design-ai site ${shellQuote(directory)} --bundle-repair --json --out ${shellQuote(previewReportPath)}` : "",
    applyReportCommand: available ? `design-ai site ${shellQuote(directory)} --bundle-repair --yes --json --out ${shellQuote(appliedReportPath)}` : "",
    verifyCommand: available ? `design-ai site ${shellQuote(directory)} --bundle-check --strict --json` : "",
    mutates: available ? "handoff-bundle-directory-only" : "none",
    targetRepoMutation: false,
    externalCalls: false,
  };
}

function formatBundleRepairGuidanceLines(repairGuidance) {
  if (!repairGuidance.available) {
    return [
      `- Available: no`,
      `- Reason: ${repairGuidance.reason}`,
    ];
  }
  return [
    "- Available: yes",
    `- Reason: ${repairGuidance.reason}`,
    `- Regenerate: ${repairGuidance.command}`,
    `- Preview repair: ${repairGuidance.previewCommand}`,
    `- Apply repair: ${repairGuidance.applyCommand}`,
    `- Preview report: ${repairGuidance.previewReportCommand}`,
    `- Apply report: ${repairGuidance.applyReportCommand}`,
    `- Verify: ${repairGuidance.verifyCommand}`,
    `- Scope: ${repairGuidance.mutates}; target repo mutation ${repairGuidance.targetRepoMutation ? "yes" : "no"}; external calls ${repairGuidance.externalCalls ? "yes" : "no"}`,
  ];
}

function summarizeBundleRepairCheck(report) {
  return {
    status: report.status,
    valid: report.valid,
    checksumBundleDigest: report.summary.checksumBundleDigest || "",
    checksumFailures: report.counts.checksumFailures,
    generatedFailures: report.counts.generatedFailures,
    verifiedGeneratedFiles: report.counts.verifiedGeneratedFiles,
    expectedGeneratedFiles: report.counts.expectedGeneratedFiles,
    generatedDriftFiles: [...report.generatedContract.driftFiles],
    issueCount: report.issues.length,
  };
}

function buildSiteBundleRepairReportFromChecks({
  beforeReport,
  afterReport = null,
  written = null,
  applied = false,
} = {}) {
  const issues = [];
  const repairGuidance = beforeReport.repairGuidance;

  if (!repairGuidance.available) {
    addIssue(issues, "fail", "bundle-repair-unavailable", repairGuidance.reason);
  } else if (!applied) {
    addIssue(issues, "pass", "bundle-repair-preview-ready", "Bundle repair preview is ready; run again with --yes to rewrite the handoff bundle directory");
  } else if (!afterReport || afterReport.status !== "pass") {
    addIssue(issues, "fail", "bundle-repair-verify-fail", "Bundle repair applied, but the repaired bundle did not pass bundle-check verification");
  } else {
    addIssue(issues, "pass", "bundle-repair-applied", "Bundle repair applied and the regenerated bundle passed local bundle-check verification");
  }

  const status = statusFromIssues(issues);
  return {
    directory: beforeReport.directory,
    workspaceFile: path.join(beforeReport.directory, "website-workspace.tasks.json"),
    dryRun: !applied,
    applied,
    valid: status !== "fail",
    status,
    repairGuidance,
    before: summarizeBundleRepairCheck(beforeReport),
    after: afterReport ? summarizeBundleRepairCheck(afterReport) : null,
    written: written ? {
      directory: written.directory,
      files: written.files,
      count: written.files.length,
    } : null,
    issues,
  };
}

export function buildSiteBundleRepairPreview({
  target,
  cwd = process.cwd(),
} = {}) {
  const beforeReport = buildSiteBundleCheckReport({ target, cwd });
  return buildSiteBundleRepairReportFromChecks({ beforeReport });
}

export function buildSiteBundleRepairBundle({
  target,
  cwd = process.cwd(),
} = {}) {
  const beforeReport = buildSiteBundleCheckReport({ target, cwd });
  const preview = buildSiteBundleRepairReportFromChecks({ beforeReport });
  if (!preview.repairGuidance.available) {
    return {
      preview,
      beforeReport,
      bundle: null,
    };
  }

  const input = loadSiteWorkspaceInput({
    target: preview.workspaceFile,
    cwd,
  });
  const analyzed = analyzeSiteWorkspace(input.raw, { filePath: input.filePath });
  const bundle = buildSiteHandoffBundle(analyzed.workspace, analyzed.summary);
  return {
    preview,
    beforeReport,
    bundle,
  };
}

export function buildSiteBundleRepairAppliedReport({
  beforeReport,
  written,
  cwd = process.cwd(),
} = {}) {
  const afterReport = buildSiteBundleCheckReport({
    target: beforeReport.directory,
    cwd,
  });
  return buildSiteBundleRepairReportFromChecks({
    beforeReport,
    afterReport,
    written,
    applied: true,
  });
}

export function formatSiteBundleRepairJson(report) {
  return JSON.stringify(report, null, 2);
}

export function formatSiteBundleRepairHuman(report) {
  const afterLines = report.after ? [
    `After status: ${report.after.status}`,
    `After generated drift files: ${report.after.generatedDriftFiles.length ? report.after.generatedDriftFiles.join(", ") : "none"}`,
    `After bundle digest: ${report.after.checksumBundleDigest || "not recorded"}`,
  ] : [
    "After status: not applied",
  ];
  return [
    `Website Improvement handoff bundle repair: ${report.directory}`,
    "",
    `Status: ${report.status}`,
    `Dry run: ${report.dryRun ? "yes" : "no"}`,
    `Applied: ${report.applied ? "yes" : "no"}`,
    `Workspace: ${report.workspaceFile}`,
    `Before status: ${report.before.status}`,
    `Before generated drift files: ${report.before.generatedDriftFiles.length ? report.before.generatedDriftFiles.join(", ") : "none"}`,
    `Before bundle digest: ${report.before.checksumBundleDigest || "not recorded"}`,
    ...afterLines,
    ...(report.written ? [
      `Written directory: ${report.written.directory}`,
      `Written files: ${report.written.count}`,
    ] : []),
    "",
    "Repair guidance:",
    ...formatBundleRepairGuidanceLines(report.repairGuidance),
    "",
    "Issues:",
    ...report.issues.map((issue) => `- [${issue.level}] ${issue.id}: ${issue.message}`),
  ].join("\n");
}

function summarizeBundlePayload(summaryPayload) {
  const taskGeneration = normalizeObject(summaryPayload?.taskGeneration);
  const site = normalizeObject(summaryPayload?.site);
  const mcp = normalizeObject(summaryPayload?.mcp);
  const probeCounts = normalizeObject(mcp.probeCounts);
  const checksums = normalizeObject(summaryPayload?.checksums);
  const handoff = normalizeObject(summaryPayload?.handoff);
  return {
    source: String(summaryPayload?.source || ""),
    status: String(summaryPayload?.status || "unknown"),
    workspaceStatus: String(summaryPayload?.workspaceStatus || "unknown"),
    siteName: String(site.name || ""),
    totalTasks: Number.isFinite(taskGeneration.totalTasks) ? taskGeneration.totalTasks : 0,
    implementationEvidence: countImplementationEvidence(summaryPayload?.implementationEvidence),
    mcpStatus: String(mcp.status || "unknown"),
    mcpProbeStatus: String(mcp.probeStatus || "unknown"),
    mcpProbeCounts: {
      count: Number.isInteger(probeCounts.count) && probeCounts.count >= 0 ? probeCounts.count : 0,
      pass: Number.isInteger(probeCounts.pass) && probeCounts.pass >= 0 ? probeCounts.pass : 0,
      warn: Number.isInteger(probeCounts.warn) && probeCounts.warn >= 0 ? probeCounts.warn : 0,
      fail: Number.isInteger(probeCounts.fail) && probeCounts.fail >= 0 ? probeCounts.fail : 0,
    },
    files: Array.isArray(summaryPayload?.files) ? summaryPayload.files.map(String) : [],
    checksumAlgorithm: String(checksums.algorithm || ""),
    checksumBundleDigest: String(checksums.bundleDigest || ""),
    checksumFiles: normalizeObject(checksums.files),
    handoffExecutionChecklist: Array.isArray(handoff.executionChecklist)
      ? handoff.executionChecklist.map((item) => normalizeObject(item))
      : [],
  };
}

function validateBundleHandoffExecutionChecklist(summary, issues) {
  const expectedIds = SITE_TARGET_REPO_EXECUTION_CHECKLIST.map((item) => item.id);
  const actual = Array.isArray(summary.handoffExecutionChecklist) ? summary.handoffExecutionChecklist : [];
  const actualIds = actual.map((item) => String(item.id || ""));
  if (!arraysEqual(actualIds, expectedIds)) {
    addIssue(issues, "fail", "bundle-handoff-execution-checklist", "summary.json handoff.executionChecklist must match the target-repo execution checklist contract");
    return;
  }
  for (const [index, expected] of SITE_TARGET_REPO_EXECUTION_CHECKLIST.entries()) {
    const actualItem = actual[index] || {};
    if (actualItem.label !== expected.label) {
      addIssue(issues, "fail", `bundle-handoff-execution-checklist-${expected.id}-label`, `summary.json handoff.executionChecklist.${expected.id}.label changed`);
    }
    if (actualItem.required !== expected.required) {
      addIssue(issues, "fail", `bundle-handoff-execution-checklist-${expected.id}-required`, `summary.json handoff.executionChecklist.${expected.id}.required changed`);
    }
    if (actualItem.evidence !== expected.evidence) {
      addIssue(issues, "fail", `bundle-handoff-execution-checklist-${expected.id}-evidence`, `summary.json handoff.executionChecklist.${expected.id}.evidence changed`);
    }
  }
}

function summarizeBundleBoundaries(summaryPayload) {
  const boundaries = Array.isArray(summaryPayload?.boundaries)
    ? summaryPayload.boundaries.map(String)
    : [];
  return {
    boundaries,
    externalCalls: false,
    targetRepoMutation: false,
  };
}

export function buildSiteBundleCheckReport({
  target,
  cwd = process.cwd(),
} = {}) {
  const directory = path.resolve(cwd, String(target || ""));
  const issues = [];

  if (!target) {
    addIssue(issues, "fail", "bundle-directory-required", "A handoff bundle directory path is required");
  } else if (!existsSync(directory)) {
    addIssue(issues, "fail", "bundle-directory-missing", `Bundle directory does not exist: ${directory}`);
  } else if (!statSync(directory).isDirectory()) {
    addIssue(issues, "fail", "bundle-directory-type", `Bundle path must be a directory: ${directory}`);
  }

  const canReadDirectory = issues.every((issue) => !issue.id.startsWith("bundle-directory"));
  const expected = new Set(SITE_BUNDLE_FILES);
  const directEntries = canReadDirectory ? readdirSync(directory) : [];
  const directFiles = directEntries.filter((entry) => {
    const targetPath = path.join(directory, entry);
    return existsSync(targetPath) && statSync(targetPath).isFile();
  });
  const unexpectedFiles = directFiles.filter((entry) => !expected.has(entry)).sort();
  const files = SITE_BUNDLE_FILES.map((relativePath) => {
    const targetPath = path.join(directory, relativePath);
    const present = canReadDirectory && existsSync(targetPath) && statSync(targetPath).isFile();
    return {
      path: relativePath,
      present,
    };
  });

  if (canReadDirectory) {
    for (const file of SITE_BUNDLE_FILES) {
      const targetPath = path.join(directory, file);
      if (!existsSync(targetPath)) {
        addIssue(issues, "fail", `bundle-missing-${file}`, `Bundle file is missing: ${file}`);
      } else if (!statSync(targetPath).isFile()) {
        addIssue(issues, "fail", `bundle-file-${file}`, `Bundle path must be a file: ${file}`);
      }
    }
  }

  const summaryPayload = canReadDirectory ? parseBundleJson(directory, "summary.json", issues) : null;
  const workspacePayload = canReadDirectory ? parseBundleJson(directory, "website-workspace.tasks.json", issues) : null;
  const mcpPayload = canReadDirectory ? parseBundleJson(directory, "mcp-check.json", issues) : null;
  const mcpProbePayload = canReadDirectory ? parseBundleJson(directory, "mcp-probes.json", issues) : null;
  const summary = summarizeBundlePayload(summaryPayload);
  const boundarySummary = summarizeBundleBoundaries(summaryPayload);

  let workspaceSummary = null;
  let recomputedMcp = null;
  let recomputedMcpProbes = null;
  let generatedContract = emptyBundleGeneratedContract(summary.source);

  if (summaryPayload) {
    if (summaryPayload.version !== 1) {
      addIssue(issues, "fail", "bundle-summary-version", "summary.json version must be 1");
    }
    if (!["pass", "warn", "fail"].includes(summary.status)) {
      addIssue(issues, "fail", "bundle-summary-status", "summary.json status must be pass, warn, or fail");
    } else if (summary.status === "fail") {
      addIssue(issues, "fail", "bundle-readiness-fail", "summary.json reports a failing handoff bundle");
    } else if (summary.status === "warn") {
      addIssue(issues, "warn", "bundle-readiness-warn", "summary.json reports readiness warnings");
    }
    if (!arraysEqual(summary.files, SITE_BUNDLE_FILES)) {
      addIssue(issues, "fail", "bundle-summary-files", "summary.json files must match the expected handoff bundle manifest");
    }
    validateBundleHandoffExecutionChecklist(summary, issues);
    if (summaryPayload.implementationEvidence !== undefined) {
      const evidenceCounts = normalizeObject(summaryPayload.implementationEvidence);
      if (summaryPayload.implementationEvidence === null || typeof summaryPayload.implementationEvidence !== "object" || Array.isArray(summaryPayload.implementationEvidence)) {
        addIssue(issues, "fail", "bundle-summary-implementation-evidence", "summary.json implementationEvidence must be an object when provided");
      } else {
        for (const key of IMPLEMENTATION_EVIDENCE_KEYS) {
          if (!Number.isInteger(evidenceCounts[key]) || evidenceCounts[key] < 0) {
            addIssue(issues, "fail", `bundle-summary-implementation-evidence-${key}`, `summary.json implementationEvidence.${key} must be a non-negative integer`);
          }
        }
      }
    }
    const boundaries = Array.isArray(summaryPayload.boundaries) ? summaryPayload.boundaries : [];
    for (const boundary of ["deterministic-local", "no-external-mcp-calls", "no-target-repo-mutation"]) {
      if (!boundaries.includes(boundary)) {
        addIssue(issues, "warn", `bundle-boundary-${boundary}`, `summary.json boundaries should include ${boundary}`);
      }
    }

    if (!summaryPayload.checksums) {
      addIssue(issues, "warn", "bundle-checksums-missing", "summary.json should include SHA-256 checksums; regenerate the bundle with the current CLI");
    } else if (summary.checksumAlgorithm !== "sha256") {
      addIssue(issues, "fail", "bundle-checksum-algorithm", "summary.json checksums.algorithm must be sha256");
    } else {
      const checksumFiles = summary.checksumFiles;
      const checksumKeys = Object.keys(checksumFiles).sort();
      const expectedChecksumKeys = SITE_BUNDLE_CHECKSUM_FILES;
      if (!summary.checksumBundleDigest) {
        addIssue(issues, "warn", "bundle-checksum-bundle-digest-missing", "summary.json should include checksums.bundleDigest; regenerate the bundle with the current CLI");
      } else if (!/^[a-f0-9]{64}$/.test(summary.checksumBundleDigest)) {
        addIssue(issues, "fail", "bundle-checksum-bundle-digest-format", "summary.json checksums.bundleDigest must be a SHA-256 hex digest");
      } else {
        const manifestBundleDigest = buildBundleDigest(checksumFiles);
        if (manifestBundleDigest !== summary.checksumBundleDigest) {
          addIssue(issues, "fail", "bundle-checksum-bundle-digest-manifest", "summary.json checksums.bundleDigest does not match the checksum file manifest");
        }
      }
      for (const expectedPath of expectedChecksumKeys) {
        const expectedDigest = checksumFiles[expectedPath];
        if (!expectedDigest) {
          addIssue(issues, "fail", `bundle-checksum-missing-${expectedPath}`, `summary.json is missing a checksum for ${expectedPath}`);
          continue;
        }
        if (!/^[a-f0-9]{64}$/.test(String(expectedDigest))) {
          addIssue(issues, "fail", `bundle-checksum-format-${expectedPath}`, `summary.json checksum for ${expectedPath} must be a SHA-256 hex digest`);
        }
      }
      for (const checksumPath of checksumKeys) {
        if (!expectedChecksumKeys.includes(checksumPath)) {
          addIssue(issues, "fail", `bundle-checksum-unexpected-${checksumPath}`, `summary.json includes an unexpected checksum entry: ${checksumPath}`);
        }
      }
      if (canReadDirectory) {
        for (const expectedPath of expectedChecksumKeys) {
          const targetPath = path.join(directory, expectedPath);
          if (!existsSync(targetPath) || !statSync(targetPath).isFile()) continue;
          const expectedDigest = checksumFiles[expectedPath];
          if (!expectedDigest || !/^[a-f0-9]{64}$/.test(String(expectedDigest))) continue;
          const actualDigest = sha256Hex(readFileSync(targetPath, "utf8"));
          if (actualDigest !== expectedDigest) {
            addIssue(issues, "fail", `bundle-checksum-${expectedPath}`, `${expectedPath} checksum does not match summary.json`);
          }
        }
        if (summary.checksumBundleDigest && /^[a-f0-9]{64}$/.test(summary.checksumBundleDigest)) {
          const actualChecksumFiles = Object.fromEntries(
            expectedChecksumKeys
              .filter((filePath) => {
                const targetPath = path.join(directory, filePath);
                return existsSync(targetPath) && statSync(targetPath).isFile();
              })
              .map((filePath) => [filePath, sha256Hex(readFileSync(path.join(directory, filePath), "utf8"))]),
          );
          if (
            expectedChecksumKeys.every((filePath) => actualChecksumFiles[filePath])
            && buildBundleDigest(actualChecksumFiles) !== summary.checksumBundleDigest
          ) {
            addIssue(issues, "fail", "bundle-checksum-bundle-digest", "Current bundle files do not match summary.json checksums.bundleDigest");
          }
        }
      }
    }
  }

  if (workspacePayload) {
    const analyzed = analyzeSiteWorkspace(workspacePayload, {
      filePath: path.join(directory, "website-workspace.tasks.json"),
    });
    workspaceSummary = analyzed.summary;
    for (const issue of workspaceSummary.issues.filter((item) => item.level !== "pass")) {
      addIssue(issues, issue.level, `workspace-${issue.id}`, issue.message);
    }
    if (summaryPayload && summary.siteName && summary.siteName !== analyzed.workspace.siteProfile.name) {
      addIssue(issues, "fail", "bundle-site-name", "summary.json site name does not match website-workspace.tasks.json");
    }
    if (summaryPayload && summary.totalTasks !== analyzed.workspace.refactorTasks.length) {
      addIssue(issues, "fail", "bundle-task-count", "summary.json taskGeneration.totalTasks does not match website-workspace.tasks.json");
    }
    const workspaceEvidenceCounts = countImplementationEvidence(analyzed.workspace.implementationEvidence);
    if (summaryPayload && summaryPayload.implementationEvidence !== undefined) {
      for (const key of IMPLEMENTATION_EVIDENCE_KEYS) {
        if (summary.implementationEvidence[key] !== workspaceEvidenceCounts[key]) {
          addIssue(issues, "fail", `bundle-implementation-evidence-${key}`, `summary.json implementationEvidence.${key} does not match website-workspace.tasks.json`);
        }
      }
    } else {
      summary.implementationEvidence = workspaceEvidenceCounts;
    }
    if (canReadDirectory && workspaceSummary.status !== "fail") {
      generatedContract = buildBundleGeneratedContract(directory, analyzed.workspace, summary.source);
      addBundleGeneratedContractIssues(generatedContract, issues);
    }
    recomputedMcp = buildSiteMcpCheckReport(analyzed.workspace, analyzed.summary);
    recomputedMcpProbes = buildSiteMcpProbeReport(analyzed.workspace);
  }

  if (mcpPayload && recomputedMcp) {
    if (mcpPayload.status !== recomputedMcp.status) {
      addIssue(issues, "fail", "bundle-mcp-status", "mcp-check.json status does not match recomputed MCP readiness");
    }
    if (!arraysEqual((mcpPayload.items || []).map((item) => item.key), recomputedMcp.items.map((item) => item.key))) {
      addIssue(issues, "fail", "bundle-mcp-items", "mcp-check.json item order does not match the current MCP readiness contract");
    }
    if (JSON.stringify(mcpPayload.counts || {}) !== JSON.stringify(recomputedMcp.counts)) {
      addIssue(issues, "fail", "bundle-mcp-counts", "mcp-check.json counts do not match recomputed MCP readiness");
    }
    if (summaryPayload && summary.mcpStatus !== String(mcpPayload.status || "")) {
      addIssue(issues, "fail", "bundle-summary-mcp-status", "summary.json mcp.status does not match mcp-check.json");
    }
  }

  if (mcpProbePayload && recomputedMcpProbes) {
    if (mcpProbePayload.status !== recomputedMcpProbes.status) {
      addIssue(issues, "fail", "bundle-mcp-probe-status", "mcp-probes.json status does not match recomputed MCP probe readiness");
    }
    if (!arraysEqual((mcpProbePayload.items || []).map((item) => item.id), recomputedMcpProbes.items.map((item) => item.id))) {
      addIssue(issues, "fail", "bundle-mcp-probe-items", "mcp-probes.json item order does not match the current MCP probe contract");
    }
    for (const key of ["count", "pass", "warn", "fail"]) {
      if (mcpProbePayload[key] !== recomputedMcpProbes[key]) {
        addIssue(issues, "fail", `bundle-mcp-probe-${key}`, `mcp-probes.json ${key} does not match recomputed MCP probe readiness`);
      }
    }
    if (summaryPayload && summary.mcpProbeStatus !== String(mcpProbePayload.status || "")) {
      addIssue(issues, "fail", "bundle-summary-mcp-probe-status", "summary.json mcp.probeStatus does not match mcp-probes.json");
    }
    if (summaryPayload) {
      for (const key of ["count", "pass", "warn", "fail"]) {
        if (summary.mcpProbeCounts[key] !== mcpProbePayload[key]) {
          addIssue(issues, "fail", `bundle-summary-mcp-probe-counts-${key}`, `summary.json mcp.probeCounts.${key} does not match mcp-probes.json`);
        }
      }
    }
  }

  if (canReadDirectory) {
    addBundleMarkdownIssue(directory, "README.md", [
      "Website improvement handoff bundle",
      "does not call external MCPs",
      "Target Repo Execution Checklist",
      "Confirm target repo working directory",
    ], issues);
    addBundleMarkdownIssue(directory, "mcp-action-plan.md", [
      "# Website improvement MCP action plan",
    ], issues);
    addBundleMarkdownIssue(directory, "mcp-probes.json", [
      "\"mode\": \"read-only-local\"",
      "\"externalCalls\": false",
    ], issues);
    addBundleMarkdownIssue(directory, "website-handoff.md", [
      "# Website improvement handoff",
    ], issues);
    addBundleMarkdownIssue(directory, "website-prompts.md", [
      "# Website improvement prompt bundle",
    ], issues);
    addBundleMarkdownIssue(directory, "codex-implementation.md", [
      "# Codex implementation prompt",
      "Task ID:",
      "Work in the target website repository, not in this design-ai repository.",
    ], issues);
  }

  if (issues.length === 0) {
    addIssue(issues, "pass", "bundle-ready", "Handoff bundle is complete and internally consistent");
  }

  const status = statusFromIssues(issues);
  const repairGuidance = buildBundleRepairGuidance(directory, generatedContract);
  return {
    directory,
    valid: status !== "fail",
    status,
    counts: {
      expectedFiles: SITE_BUNDLE_FILES.length,
      presentFiles: files.filter((file) => file.present).length,
      missingFiles: files.filter((file) => !file.present).length,
      unexpectedFiles: unexpectedFiles.length,
      expectedChecksumFiles: SITE_BUNDLE_CHECKSUM_FILES.length,
      verifiedChecksumFiles: SITE_BUNDLE_CHECKSUM_FILES.filter((filePath) => {
        const expectedDigest = summary.checksumFiles[filePath];
        const targetPath = path.join(directory, filePath);
        if (!expectedDigest || !/^[a-f0-9]{64}$/.test(String(expectedDigest))) return false;
        if (!canReadDirectory || !existsSync(targetPath) || !statSync(targetPath).isFile()) return false;
        return sha256Hex(readFileSync(targetPath, "utf8")) === expectedDigest;
      }).length,
      checksumFailures: issues.filter((issue) => issue.level === "fail" && issue.id.startsWith("bundle-checksum-")).length,
      expectedGeneratedFiles: generatedContract.expectedFiles,
      verifiedGeneratedFiles: generatedContract.verifiedFiles,
      generatedFailures: issues.filter((issue) => issue.level === "fail" && issue.id.startsWith("bundle-generated-")).length,
      issues: issues.length,
      warnings: issues.filter((issue) => issue.level === "warn").length,
      failures: issues.filter((issue) => issue.level === "fail").length,
    },
    summary,
    workspaceStatus: workspaceSummary?.status || "unknown",
    mcpStatus: mcpPayload?.status || "unknown",
    mcpProbeStatus: mcpProbePayload?.status || "unknown",
    mcpProbeCounts: {
      count: Number.isInteger(mcpProbePayload?.count) && mcpProbePayload.count >= 0 ? mcpProbePayload.count : summary.mcpProbeCounts.count,
      pass: Number.isInteger(mcpProbePayload?.pass) && mcpProbePayload.pass >= 0 ? mcpProbePayload.pass : summary.mcpProbeCounts.pass,
      warn: Number.isInteger(mcpProbePayload?.warn) && mcpProbePayload.warn >= 0 ? mcpProbePayload.warn : summary.mcpProbeCounts.warn,
      fail: Number.isInteger(mcpProbePayload?.fail) && mcpProbePayload.fail >= 0 ? mcpProbePayload.fail : summary.mcpProbeCounts.fail,
    },
    boundaries: boundarySummary.boundaries,
    externalCalls: boundarySummary.externalCalls,
    targetRepoMutation: boundarySummary.targetRepoMutation,
    files,
    unexpectedFiles,
    generatedContract,
    repairGuidance,
    issues,
  };
}

export function formatSiteBundleCheckJson(report) {
  return JSON.stringify(report, null, 2);
}

export function formatSiteBundleCheckHuman(report) {
  return [
    `Website Improvement handoff bundle check: ${report.directory}`,
    "",
    `Status: ${report.status}`,
    `Files: ${report.counts.presentFiles}/${report.counts.expectedFiles}`,
    `Checksums: ${report.counts.verifiedChecksumFiles}/${report.counts.expectedChecksumFiles} verified`,
    `Generated contract: ${report.counts.verifiedGeneratedFiles}/${report.counts.expectedGeneratedFiles} verified`,
    `Bundle digest: ${report.summary.checksumBundleDigest || "not recorded"}`,
    `Unexpected files: ${report.unexpectedFiles.length ? report.unexpectedFiles.join(", ") : "none"}`,
    `Generated drift files: ${formatGeneratedContractDriftSummary(report.generatedContract)}`,
    `Source: ${report.summary.source || "unknown"}`,
    `Site: ${report.summary.siteName || "unknown"}`,
    `Tasks: ${report.summary.totalTasks}`,
    `Evidence: executed work ${report.summary.implementationEvidence.executedWork}, verification ${report.summary.implementationEvidence.verificationResults}, risks ${report.summary.implementationEvidence.remainingRisks}, next actions ${report.summary.implementationEvidence.nextActions}`,
    `MCP status: ${report.mcpStatus}`,
    `MCP probe status: ${report.mcpProbeStatus}`,
    `MCP probes: ${report.mcpProbeCounts.pass}/${report.mcpProbeCounts.count} passing, ${report.mcpProbeCounts.warn} warning, ${report.mcpProbeCounts.fail} failing`,
    `Boundary flags: external calls ${report.externalCalls ? "yes" : "no"}; target repo mutation ${report.targetRepoMutation ? "yes" : "no"}`,
    "",
    "Files:",
    ...report.files.map((file) => `- [${file.present ? "pass" : "fail"}] ${file.path}`),
    "",
    "Generated contract drift:",
    ...formatGeneratedContractDriftLines(report.generatedContract),
    "",
    "Repair guidance:",
    ...formatBundleRepairGuidanceLines(report.repairGuidance),
    "",
    "Bundle boundaries:",
    ...(report.boundaries.length ? report.boundaries.map((boundary) => `- ${boundary}`) : ["- none recorded"]),
    "",
    "Issues:",
    ...report.issues.map((issue) => `- [${issue.level}] ${issue.id}: ${issue.message}`),
  ].join("\n");
}

function summarizeBundleForCompare(report) {
  return {
    directory: report.directory,
    status: report.status,
    valid: report.valid,
    siteName: report.summary.siteName || "",
    source: report.summary.source || "",
    workspaceStatus: report.workspaceStatus || "unknown",
    mcpStatus: report.mcpStatus || "unknown",
    mcpProbeStatus: report.mcpProbeStatus || "unknown",
    mcpProbeCounts: { ...report.mcpProbeCounts },
    totalTasks: report.summary.totalTasks || 0,
    implementationEvidence: { ...report.summary.implementationEvidence },
    checksumAlgorithm: report.summary.checksumAlgorithm || "",
    checksumBundleDigest: report.summary.checksumBundleDigest || "",
    checksumFailures: report.counts.checksumFailures,
    generatedFailures: report.counts.generatedFailures,
    verifiedGeneratedFiles: report.counts.verifiedGeneratedFiles,
    generatedDriftFiles: [...report.generatedContract.driftFiles],
    issueCount: report.issues.length,
  };
}

function buildBundleMetadataChanges(left, right) {
  const pairs = [
    ["siteName", "Site name", left.summary.siteName || "", right.summary.siteName || ""],
    ["source", "Source", left.summary.source || "", right.summary.source || ""],
    ["workspaceStatus", "Workspace status", left.workspaceStatus || "unknown", right.workspaceStatus || "unknown"],
    ["mcpStatus", "MCP status", left.mcpStatus || "unknown", right.mcpStatus || "unknown"],
    ["mcpProbeStatus", "MCP probe status", left.mcpProbeStatus || "unknown", right.mcpProbeStatus || "unknown"],
    ...["count", "pass", "warn", "fail"].map((key) => [
      `mcpProbeCounts.${key}`,
      `MCP probe ${key}`,
      String(left.summary.mcpProbeCounts[key] || 0),
      String(right.summary.mcpProbeCounts[key] || 0),
    ]),
    ["totalTasks", "Task count", String(left.summary.totalTasks || 0), String(right.summary.totalTasks || 0)],
    ...IMPLEMENTATION_EVIDENCE_KEYS.map((key) => [
      `implementationEvidence.${key}`,
      `Evidence ${key}`,
      String(left.summary.implementationEvidence[key] || 0),
      String(right.summary.implementationEvidence[key] || 0),
    ]),
  ];
  return pairs
    .filter(([, , leftValue, rightValue]) => leftValue !== rightValue)
    .map(([key, label, leftValue, rightValue]) => ({ key, label, leftValue, rightValue }));
}

function buildBundleFileChanges(left, right) {
  return SITE_BUNDLE_CHECKSUM_FILES
    .map((filePath) => ({
      path: filePath,
      leftChecksum: String(left.summary.checksumFiles[filePath] || ""),
      rightChecksum: String(right.summary.checksumFiles[filePath] || ""),
    }))
    .filter((file) => file.leftChecksum !== file.rightChecksum);
}

export function buildSiteBundleCompareReport({ target, compareTarget }) {
  const left = buildSiteBundleCheckReport({ target });
  const right = buildSiteBundleCheckReport({ target: compareTarget });
  const issues = [];

  if (left.status === "fail") {
    addIssue(issues, "fail", "bundle-compare-left-invalid", "Primary bundle must pass bundle-check before comparison can be trusted");
  } else if (left.status === "warn") {
    addIssue(issues, "warn", "bundle-compare-left-warn", "Primary bundle has bundle-check warnings; review them before target-repo handoff");
  }
  if (right.status === "fail") {
    addIssue(issues, "fail", "bundle-compare-right-invalid", "Comparison bundle must pass bundle-check before comparison can be trusted");
  } else if (right.status === "warn") {
    addIssue(issues, "warn", "bundle-compare-right-warn", "Comparison bundle has bundle-check warnings; review them before target-repo handoff");
  }

  const leftDigest = left.summary.checksumBundleDigest || "";
  const rightDigest = right.summary.checksumBundleDigest || "";
  const digestMatch = Boolean(leftDigest && rightDigest && leftDigest === rightDigest);
  const changedFiles = buildBundleFileChanges(left, right);
  const metadataChanges = buildBundleMetadataChanges(left, right);
  const hasDifferences = !digestMatch || changedFiles.length > 0 || metadataChanges.length > 0;
  const hasFailures = issues.some((issue) => issue.level === "fail");

  if (issues.length === 0 && !hasDifferences) {
    addIssue(issues, "pass", "bundle-compare-identical", "Handoff bundles have the same bundle digest and checksum manifest");
  } else if (!hasFailures && hasDifferences) {
    addIssue(issues, "warn", "bundle-compare-different", "Handoff bundles differ; review changed files before target-repo handoff");
  }

  const status = statusFromIssues(issues);
  return {
    status,
    valid: left.valid && right.valid,
    sameBundle: !hasDifferences,
    digestMatch,
    left: summarizeBundleForCompare(left),
    right: summarizeBundleForCompare(right),
    counts: {
      changedFiles: changedFiles.length,
      metadataChanges: metadataChanges.length,
      leftIssues: left.issues.length,
      rightIssues: right.issues.length,
      issues: issues.length,
      warnings: issues.filter((issue) => issue.level === "warn").length,
      failures: issues.filter((issue) => issue.level === "fail").length,
    },
    changedFiles,
    metadataChanges,
    issues,
  };
}

export function formatSiteBundleCompareJson(report) {
  return JSON.stringify(report, null, 2);
}

function formatMcpProbeCounts(counts = {}) {
  return `${counts.pass || 0}/${counts.count || 0} passing, ${counts.warn || 0} warning, ${counts.fail || 0} failing`;
}

export function formatSiteBundleCompareHuman(report) {
  return [
    `Website Improvement handoff bundle compare: ${report.left.directory} -> ${report.right.directory}`,
    "",
    `Status: ${report.status}`,
    `Same bundle: ${report.sameBundle ? "yes" : "no"}`,
    `Digest match: ${report.digestMatch ? "yes" : "no"}`,
    `Left digest: ${report.left.checksumBundleDigest || "not recorded"}`,
    `Right digest: ${report.right.checksumBundleDigest || "not recorded"}`,
    `Changed files: ${report.counts.changedFiles}`,
    `Metadata changes: ${report.counts.metadataChanges}`,
    `Generated contract: left ${report.left.verifiedGeneratedFiles}/${SITE_BUNDLE_CHECKSUM_FILES.length}, right ${report.right.verifiedGeneratedFiles}/${SITE_BUNDLE_CHECKSUM_FILES.length}`,
    `Generated drift files: left ${report.left.generatedDriftFiles.length ? report.left.generatedDriftFiles.join(", ") : "none"}, right ${report.right.generatedDriftFiles.length ? report.right.generatedDriftFiles.join(", ") : "none"}`,
    `MCP probes: left ${formatMcpProbeCounts(report.left.mcpProbeCounts)}, right ${formatMcpProbeCounts(report.right.mcpProbeCounts)}`,
    "",
    "Changed files:",
    ...(report.changedFiles.length
      ? report.changedFiles.map((file) => `- ${file.path}`)
      : ["- none"]),
    "",
    "Metadata changes:",
    ...(report.metadataChanges.length
      ? report.metadataChanges.map((item) => `- ${item.label}: ${item.leftValue || "not recorded"} -> ${item.rightValue || "not recorded"}`)
      : ["- none"]),
    "",
    "Issues:",
    ...report.issues.map((issue) => `- [${issue.level}] ${issue.id}: ${issue.message}`),
  ].join("\n");
}

function readBundleTextIfPresent(directory, relativePath) {
  const targetPath = path.join(directory, relativePath);
  if (!existsSync(targetPath) || !statSync(targetPath).isFile()) return "";
  return readFileSync(targetPath, "utf8").trim();
}

function loadSiteBundleWorkspace(directory) {
  const relativePath = "website-workspace.tasks.json";
  const targetPath = path.join(directory, relativePath);
  if (!existsSync(targetPath) || !statSync(targetPath).isFile()) {
    throw new Error(`Cannot select a handoff task because ${relativePath} is missing from the bundle`);
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(targetPath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot select a handoff task because ${relativePath} is invalid JSON: ${error.message}`);
  }

  return analyzeSiteWorkspace(raw, { filePath: targetPath }).workspace;
}

function taskHandoffOutFile(task) {
  return `target-repo-${task.id}-handoff.md`;
}

function buildBundleTaskHandoffCommandArgs(directory, task, { strict = false } = {}) {
  const args = [
    "design-ai",
    "site",
    String(directory || ""),
    "--bundle-handoff",
    "--task",
    String(task.id || ""),
  ];
  if (strict) args.push("--strict");
  args.push("--out", taskHandoffOutFile(task));
  return args;
}

function buildBundleTaskHandoffCommand(directory, task, options = {}) {
  return commandFromArgs(buildBundleTaskHandoffCommandArgs(directory, task, options));
}

function buildBundleTaskHandoffCommandSafety(task, { strict = false } = {}) {
  return {
    runPolicy: "writes-local-file",
    safetyLevel: "local-output-file",
    writesLocalFile: true,
    outputFile: taskHandoffOutFile(task),
    mutates: "local-output-file-only",
    externalCalls: false,
    targetRepoMutation: false,
    requiresCleanWorkspace: false,
    requiresReviewBeforeMutation: false,
    strict: Boolean(strict),
  };
}

function buildBundleSourceCommandSafety({ strict = false } = {}) {
  return {
    runPolicy: "read-only",
    safetyLevel: "local-read-only",
    writesLocalFile: false,
    outputFile: "",
    mutates: "none",
    externalCalls: false,
    targetRepoMutation: false,
    requiresCleanWorkspace: false,
    requiresReviewBeforeMutation: false,
    strict: Boolean(strict),
  };
}

function commandFromArgs(args) {
  return args.map((arg) => shellQuote(arg)).join(" ");
}

function buildBundleCheckCommandArgs(directory, { strict = false } = {}) {
  const args = [
    "design-ai",
    "site",
    String(directory || ""),
    "--bundle-check",
  ];
  if (strict) args.push("--strict");
  args.push("--json");
  return args;
}

function buildBundleCheckCommand(directory, options = {}) {
  return commandFromArgs(buildBundleCheckCommandArgs(directory, options));
}

function buildBundleHandoffCommandArgs(directory, { strict = false } = {}) {
  const args = [
    "design-ai",
    "site",
    String(directory || ""),
    "--bundle-handoff",
  ];
  if (strict) args.push("--strict");
  args.push("--json");
  return args;
}

function buildBundleHandoffCommand(directory, options = {}) {
  return commandFromArgs(buildBundleHandoffCommandArgs(directory, options));
}

function summarizeBundleTaskItem(task, index, directory) {
  return {
    number: index + 1,
    id: task.id,
    title: task.title,
    category: task.category,
    priority: task.priority,
    impact: task.impact,
    effort: task.effort,
    pages: normalizeStringArray(task.pages),
    recommendedMcp: normalizeStringArray(task.recommendedMcp),
    handoffTaskArg: task.id,
    handoffOutFile: taskHandoffOutFile(task),
    handoffCommand: buildBundleTaskHandoffCommand(directory, task),
    handoffCommandArgs: buildBundleTaskHandoffCommandArgs(directory, task),
    handoffCommandRunPolicy: "writes-local-file",
    handoffCommandSafety: buildBundleTaskHandoffCommandSafety(task),
    strictHandoffCommand: buildBundleTaskHandoffCommand(directory, task, { strict: true }),
    strictHandoffCommandArgs: buildBundleTaskHandoffCommandArgs(directory, task, { strict: true }),
    strictHandoffCommandRunPolicy: "writes-local-file",
    strictHandoffCommandSafety: buildBundleTaskHandoffCommandSafety(task, { strict: true }),
  };
}

function summarizeBundleTaskCatalog(workspace, directory, selectedTask = null) {
  const items = orderedRefactorTasks(workspace).map((task, index) => summarizeBundleTaskItem(task, index, directory));
  const selectedTaskId = selectedTask?.id || "";
  return {
    source: "website-workspace.tasks.json",
    count: items.length,
    defaultTaskId: items[0]?.id || "",
    selectedTaskId,
    selectionMode: selectedTaskId ? "explicit" : "bundled-default",
    items,
  };
}

function emptyBundleTaskCatalog(error = "") {
  return {
    source: "website-workspace.tasks.json",
    count: 0,
    defaultTaskId: "",
    selectedTaskId: "",
    selectionMode: "unavailable",
    items: [],
    error,
  };
}

function summarizeSelectedTask(task, taskSelector, source, directory = "") {
  if (!task) return null;
  return {
    id: task.id,
    title: task.title,
    category: task.category,
    priority: task.priority,
    impact: task.impact,
    effort: task.effort,
    selector: String(taskSelector || "").trim(),
    source,
    handoffTaskArg: task.id,
    handoffOutFile: taskHandoffOutFile(task),
    handoffCommand: directory ? buildBundleTaskHandoffCommand(directory, task) : "",
    handoffCommandArgs: directory ? buildBundleTaskHandoffCommandArgs(directory, task) : [],
    handoffCommandRunPolicy: directory ? "writes-local-file" : "",
    handoffCommandSafety: directory ? buildBundleTaskHandoffCommandSafety(task) : null,
    strictHandoffCommand: directory ? buildBundleTaskHandoffCommand(directory, task, { strict: true }) : "",
    strictHandoffCommandArgs: directory ? buildBundleTaskHandoffCommandArgs(directory, task, { strict: true }) : [],
    strictHandoffCommandRunPolicy: directory ? "writes-local-file" : "",
    strictHandoffCommandSafety: directory ? buildBundleTaskHandoffCommandSafety(task, { strict: true }) : null,
  };
}

function formatBundleHandoffTaskCatalogLines(taskCatalog) {
  if (!taskCatalog || !Array.isArray(taskCatalog.items) || taskCatalog.items.length === 0) {
    const reason = taskCatalog?.error ? ` ${taskCatalog.error}` : "";
    return [`- No bundle task catalog is available.${reason}`];
  }
  return taskCatalog.items.map((task) => {
    const pages = task.pages.length ? task.pages.join(", ") : "all pages";
    const mcps = task.recommendedMcp.length ? task.recommendedMcp.join(", ") : "none";
    const command = task.strictHandoffCommand || task.handoffCommand || `design-ai site <bundle-dir> --bundle-handoff --task ${task.handoffTaskArg}`;
    return `- ${task.number}. [${task.priority}/${task.impact}/${task.effort}] ${task.id}: ${task.title} (pages: ${pages}; MCP: ${mcps}; command: \`${command}\`)`;
  });
}

function formatBundleHandoffIssueLines(issues) {
  const actionable = issues.filter((issue) => issue.level !== "pass");
  if (actionable.length === 0) return "- No blocking bundle-check issues were found.";
  return actionable.map((issue) => `- [${issue.level}] ${issue.id}: ${issue.message}`).join("\n");
}

function buildSiteBundleHandoffPrompt(checkReport, bundleTexts) {
  const bundleDigest = checkReport.summary.checksumBundleDigest || "not recorded";
  const checksumStatus = `${checkReport.counts.verifiedChecksumFiles}/${checkReport.counts.expectedChecksumFiles} verified`;
  const handoffBoundaries = buildSiteBundleHandoffBoundaries(checkReport);
  const taskSelectionLine = bundleTexts.selectedTask
    ? `${bundleTexts.selectedTask.id} (${bundleTexts.selectedTask.title}; ${bundleTexts.selectedTask.source})`
    : "bundled codex-implementation.md default";
  const bundleReadinessLine = checkReport.status === "pass"
    ? "The bundle passed local bundle-check validation. Proceed in the target website repo after confirming the repo path."
    : "The bundle did not fully pass local bundle-check validation. Resolve the listed bundle issues before treating this as implementation authority.";
  return [
    "# Website improvement target-repo handoff prompt",
    "",
    "You are Codex working in the target website repository, not in the design-ai repository.",
    "Use this verified Website Improvement handoff bundle as read-only planning evidence. Do not modify the design-ai repo while executing this prompt.",
    "",
    "## Verified Bundle",
    `- Bundle directory: ${checkReport.directory}`,
    `- Source bundle provenance: ${checkReport.status}/${checkReport.valid ? "valid" : "invalid"} from ${checkReport.directory}`,
    `- Source bundle strict check command: \`${buildBundleCheckCommand(checkReport.directory, { strict: true })}\``,
    `- Site: ${checkReport.summary.siteName || "unknown"}`,
    `- Source workspace: ${checkReport.summary.source || "unknown"}`,
    `- Bundle status: ${checkReport.status}`,
    `- Workspace status: ${checkReport.workspaceStatus}`,
    `- MCP status: ${checkReport.mcpStatus}`,
    `- MCP probe status: ${checkReport.mcpProbeStatus}`,
    `- MCP probes: ${checkReport.mcpProbeCounts.pass}/${checkReport.mcpProbeCounts.count} passing, ${checkReport.mcpProbeCounts.warn} warning, ${checkReport.mcpProbeCounts.fail} failing`,
    `- Tasks: ${checkReport.summary.totalTasks}`,
    `- Primary task selection: ${taskSelectionLine}`,
    `- Evidence counts: executed work ${checkReport.summary.implementationEvidence.executedWork}, verification ${checkReport.summary.implementationEvidence.verificationResults}, risks ${checkReport.summary.implementationEvidence.remainingRisks}, next actions ${checkReport.summary.implementationEvidence.nextActions}`,
    `- Generated files: ${checkReport.counts.verifiedGeneratedFiles}/${checkReport.counts.expectedGeneratedFiles} match the current CLI bundle contract`,
    `- Generated drift files: ${formatGeneratedContractDriftSummary(checkReport.generatedContract)}`,
    `- SHA-256 bundle digest: ${bundleDigest}`,
    `- Checksums: ${checksumStatus}`,
    `- Handoff generation boundary flags: external calls no; target repo mutation no`,
    `- Handoff boundaries: ${handoffBoundaries.join(", ")}`,
    "",
    "## Available Bundle Tasks",
    `Task catalog source: ${bundleTexts.taskCatalog?.source || "unknown"}`,
    `Default task: ${bundleTexts.taskCatalog?.defaultTaskId || "none"}`,
    ...(bundleTexts.defaultTask?.strictHandoffCommand
      ? [`Default task strict command: \`${bundleTexts.defaultTask.strictHandoffCommand}\``]
      : []),
    `Selected task: ${bundleTexts.taskCatalog?.selectedTaskId || "none"}`,
    ...(bundleTexts.selectedTask?.strictHandoffCommand
      ? [`Selected task strict command: \`${bundleTexts.selectedTask.strictHandoffCommand}\``]
      : []),
    `Effective task: ${bundleTexts.effectiveTask?.id || "none"}`,
    ...(bundleTexts.effectiveTask?.strictHandoffCommand
      ? [`Effective task strict command: \`${bundleTexts.effectiveTask.strictHandoffCommand}\``]
      : []),
    "To choose a specific task, re-run this handoff with `--task <number-or-id>`.",
    ...formatBundleHandoffTaskCatalogLines(bundleTexts.taskCatalog),
    "",
    "## Operator Runbook",
    `Runbook stages: ${bundleTexts.operatorRunbook?.stageCount || 0} (${bundleTexts.operatorRunbook?.requiredStageCount || 0} required, ${bundleTexts.operatorRunbook?.optionalStageCount || 0} optional)`,
    `Next command key: ${bundleTexts.operatorRunbook?.nextCommandKey || "none"}`,
    ...formatBundleHandoffOperatorRunbookLines(bundleTexts.operatorRunbook),
    "",
    "## Bundle Gate",
    bundleReadinessLine,
    formatBundleHandoffIssueLines(checkReport.issues),
    "",
    "Repair guidance:",
    ...formatBundleRepairGuidanceLines(checkReport.repairGuidance),
    "",
    "## Operating Rules",
    "1. Confirm the current working directory is the target website repo before editing files.",
    "2. Inspect the target repo architecture, existing components, design tokens, routing, styling, and test scripts before implementation.",
    "3. Reuse existing UI/system patterns and keep the change scoped to the selected improvement task.",
    "4. Do not add production dependencies unless the target repo clearly requires them and the tradeoff is documented.",
    "5. Preserve WCAG 2.1 AA expectations: visible focus, keyboard reachability, semantic structure, and text contrast.",
    "6. Verify desktop, tablet, and mobile behavior plus target repo lint/typecheck/build commands when available.",
    "7. Keep the handoff bundle files read-only; record implementation evidence in the target repo final response or report.",
    "",
    "## Target Repo Execution Checklist",
    ...SITE_TARGET_REPO_EXECUTION_CHECKLIST.map((item) => `- [ ] ${item.label}: ${item.evidence}`),
    "",
    "## Primary Codex Implementation Prompt",
    bundleTexts.codexImplementation || "_codex-implementation.md was not readable from the bundle._",
    "",
    "## Additional Bundle Context",
    "Use these files only as supporting evidence:",
    "- `website-handoff.md`: audit summary, priority recommendations, and remaining risk context.",
    "- `mcp-probes.json`: read-only MCP probe evidence for repo, Figma, Browser, and deployment references.",
    "- `mcp-action-plan.md`: MCP readiness gaps and operator sequence.",
    "- `website-prompts.md`: alternate Codex/Claude review, QA, deployment, research, and copy prompts.",
    "- `summary.json`: bundle manifest, source workspace, task count, and checksum digest.",
    "",
    "### Handoff Report Snapshot",
    bundleTexts.websiteHandoff || "_website-handoff.md was not readable from the bundle._",
    "",
    "## Required Final Response",
    "Return a concise implementation report with:",
    "- Files changed in the target repo",
    "- The specific website improvement task completed",
    "- Verification commands and browser/viewport checks performed",
    "- Remaining risks or follow-up work",
    `- Bundle digest used for handoff: ${bundleDigest}`,
  ].join("\n");
}

function buildSiteBundleHandoffBoundaries(checkReport) {
  return Array.from(new Set([
    ...normalizeStringArray(checkReport?.boundaries),
    "target-repo-work-after-handoff",
  ]));
}

function summarizeSiteBundleHandoffSource(checkReport) {
  return {
    directory: checkReport.directory,
    sourceWorkspace: checkReport.summary.source || "",
    siteName: checkReport.summary.siteName || "",
    status: checkReport.status,
    valid: checkReport.valid,
    workspaceStatus: checkReport.workspaceStatus || "unknown",
    mcpStatus: checkReport.mcpStatus || "unknown",
    mcpProbeStatus: checkReport.mcpProbeStatus || "unknown",
    checksumAlgorithm: checkReport.summary.checksumAlgorithm || "",
    checksumBundleDigest: checkReport.summary.checksumBundleDigest || "",
    verifiedChecksumFiles: checkReport.counts.verifiedChecksumFiles,
    expectedChecksumFiles: checkReport.counts.expectedChecksumFiles,
    verifiedGeneratedFiles: checkReport.counts.verifiedGeneratedFiles,
    expectedGeneratedFiles: checkReport.counts.expectedGeneratedFiles,
    issueCount: checkReport.issues.length,
    warningCount: checkReport.counts.warnings,
    failureCount: checkReport.counts.failures,
    checkCommand: buildBundleCheckCommand(checkReport.directory),
    checkCommandArgs: buildBundleCheckCommandArgs(checkReport.directory),
    checkCommandRunPolicy: "read-only",
    checkCommandSafety: buildBundleSourceCommandSafety(),
    strictCheckCommand: buildBundleCheckCommand(checkReport.directory, { strict: true }),
    strictCheckCommandArgs: buildBundleCheckCommandArgs(checkReport.directory, { strict: true }),
    strictCheckCommandRunPolicy: "read-only",
    strictCheckCommandSafety: buildBundleSourceCommandSafety({ strict: true }),
    handoffCommand: buildBundleHandoffCommand(checkReport.directory),
    handoffCommandArgs: buildBundleHandoffCommandArgs(checkReport.directory),
    handoffCommandRunPolicy: "read-only",
    handoffCommandSafety: buildBundleSourceCommandSafety(),
    strictHandoffCommand: buildBundleHandoffCommand(checkReport.directory, { strict: true }),
    strictHandoffCommandArgs: buildBundleHandoffCommandArgs(checkReport.directory, { strict: true }),
    strictHandoffCommandRunPolicy: "read-only",
    strictHandoffCommandSafety: buildBundleSourceCommandSafety({ strict: true }),
  };
}

function buildBundleHandoffCommandManifest({
  sourceBundle,
  taskCatalog,
  defaultTask = null,
  selectedTask = null,
  effectiveTask = null,
} = {}) {
  const commands = [];
  const pushCommand = (entry) => {
    if (!entry || !entry.command || !Array.isArray(entry.commandArgs) || entry.commandArgs.length === 0) return;
    commands.push(entry);
  };
  const pushSourceCommand = (key, label, commandKey, argsKey, policyKey, safetyKey) => {
    pushCommand({
      key,
      scope: "source-bundle",
      label,
      command: sourceBundle?.[commandKey] || "",
      commandArgs: sourceBundle?.[argsKey] || [],
      runPolicy: sourceBundle?.[policyKey] || "",
      safety: sourceBundle?.[safetyKey] || null,
      strict: Boolean(sourceBundle?.[safetyKey]?.strict),
      taskId: "",
      outputFile: "",
      defaultTask: false,
      selectedTask: false,
      effectiveTask: false,
    });
  };
  const pushTaskCommand = (task, { strict = false } = {}) => {
    if (!task?.id) return;
    const commandKey = strict ? "strictHandoffCommand" : "handoffCommand";
    const argsKey = strict ? "strictHandoffCommandArgs" : "handoffCommandArgs";
    const policyKey = strict ? "strictHandoffCommandRunPolicy" : "handoffCommandRunPolicy";
    const safetyKey = strict ? "strictHandoffCommandSafety" : "handoffCommandSafety";
    pushCommand({
      key: `task.${task.id}.handoff.${strict ? "strict" : "default"}`,
      scope: "task-handoff",
      label: `${strict ? "Strict " : ""}Task handoff: ${task.id}`,
      command: task[commandKey] || "",
      commandArgs: task[argsKey] || [],
      runPolicy: task[policyKey] || "",
      safety: task[safetyKey] || null,
      strict,
      taskId: task.id,
      taskNumber: Number.isInteger(task.number) ? task.number : null,
      outputFile: task.handoffOutFile || task[safetyKey]?.outputFile || "",
      defaultTask: task.id === defaultTask?.id,
      selectedTask: task.id === selectedTask?.id,
      effectiveTask: task.id === effectiveTask?.id,
    });
  };

  pushSourceCommand("source.bundleCheck", "Bundle check JSON", "checkCommand", "checkCommandArgs", "checkCommandRunPolicy", "checkCommandSafety");
  pushSourceCommand("source.bundleCheck.strict", "Strict bundle check JSON", "strictCheckCommand", "strictCheckCommandArgs", "strictCheckCommandRunPolicy", "strictCheckCommandSafety");
  pushSourceCommand("source.bundleHandoff", "Bundle handoff JSON", "handoffCommand", "handoffCommandArgs", "handoffCommandRunPolicy", "handoffCommandSafety");
  pushSourceCommand("source.bundleHandoff.strict", "Strict bundle handoff JSON", "strictHandoffCommand", "strictHandoffCommandArgs", "strictHandoffCommandRunPolicy", "strictHandoffCommandSafety");
  for (const task of taskCatalog?.items || []) {
    pushTaskCommand(task);
    pushTaskCommand(task, { strict: true });
  }

  const countBy = (predicate) => commands.filter(predicate).length;
  const effectiveTaskId = effectiveTask?.id || "";
  const selectedTaskId = selectedTask?.id || "";
  const defaultTaskId = defaultTask?.id || "";
  return {
    version: 1,
    source: "bundle-handoff",
    commandCount: commands.length,
    sourceCommandCount: countBy((command) => command.scope === "source-bundle"),
    taskCommandCount: countBy((command) => command.scope === "task-handoff"),
    readOnlyCount: countBy((command) => command.runPolicy === "read-only"),
    localOutputFileCount: countBy((command) => command.runPolicy === "writes-local-file"),
    externalCallCount: countBy((command) => command.safety?.externalCalls === true),
    targetRepoMutationCount: countBy((command) => command.safety?.targetRepoMutation === true),
    requiresCleanWorkspaceCount: countBy((command) => command.safety?.requiresCleanWorkspace === true),
    requiresReviewBeforeMutationCount: countBy((command) => command.safety?.requiresReviewBeforeMutation === true),
    defaultTaskId,
    selectedTaskId,
    effectiveTaskId,
    defaultStrictTaskCommandKey: defaultTaskId ? `task.${defaultTaskId}.handoff.strict` : "",
    selectedStrictTaskCommandKey: selectedTaskId ? `task.${selectedTaskId}.handoff.strict` : "",
    effectiveStrictTaskCommandKey: effectiveTaskId ? `task.${effectiveTaskId}.handoff.strict` : "",
    commands,
  };
}

function buildBundleHandoffOperatorRunbook(commandManifest) {
  const commands = Array.isArray(commandManifest?.commands) ? commandManifest.commands : [];
  const commandByKey = new Map(commands.map((command) => [command.key, command]));
  const buildStage = ({
    step,
    key,
    label,
    kind,
    required,
    commandKeys = [],
    reason,
    manual = false,
  }) => {
    const stageCommands = commandKeys
      .map((commandKey) => commandByKey.get(commandKey))
      .filter(Boolean);
    return {
      step,
      key,
      label,
      kind,
      required,
      commandKeys,
      commands: stageCommands,
      commandCount: stageCommands.length,
      runPolicy: manual ? "manual-target-repo" : (stageCommands[0]?.runPolicy || ""),
      safetyLevel: manual ? "operator-controlled-target-repo" : (stageCommands[0]?.safety?.safetyLevel || ""),
      writesLocalFile: stageCommands.some((command) => command.safety?.writesLocalFile === true),
      outputFiles: stageCommands.map((command) => command.outputFile).filter(Boolean),
      externalCalls: stageCommands.some((command) => command.safety?.externalCalls === true),
      targetRepoMutation: stageCommands.some((command) => command.safety?.targetRepoMutation === true),
      reason,
    };
  };
  const effectiveStrictTaskCommandKey = commandManifest?.effectiveStrictTaskCommandKey || "";
  const stages = [
    buildStage({
      step: 1,
      key: "verifySourceBundle",
      label: "Verify source bundle integrity",
      kind: "read-only-gate",
      required: true,
      commandKeys: ["source.bundleCheck.strict"],
      reason: "Confirm the bundle still matches its checksum and generated-file contract before handoff execution.",
    }),
    buildStage({
      step: 2,
      key: "refreshHandoffSnapshot",
      label: "Refresh strict handoff JSON snapshot",
      kind: "read-only-preview",
      required: false,
      commandKeys: ["source.bundleHandoff.strict"],
      reason: "Regenerate the machine-readable handoff snapshot when a wrapper or GUI needs the latest JSON contract.",
    }),
    buildStage({
      step: 3,
      key: "writeEffectiveTaskPrompt",
      label: "Write effective task handoff prompt",
      kind: "local-output",
      required: true,
      commandKeys: effectiveStrictTaskCommandKey ? [effectiveStrictTaskCommandKey] : [],
      reason: "Create the selected task prompt as a local file before moving into the target website repository.",
    }),
    buildStage({
      step: 4,
      key: "executeInTargetRepo",
      label: "Execute the task in the target website repo",
      kind: "manual-target-repo",
      required: true,
      manual: true,
      reason: "Open the generated task prompt in the target repo, inspect architecture first, then implement and verify there.",
    }),
    buildStage({
      step: 5,
      key: "recordEvidence",
      label: "Record implementation evidence",
      kind: "manual-reporting",
      required: true,
      manual: true,
      reason: "Return changed files, verification commands, browser/viewport checks, remaining risks, and the bundle digest.",
    }),
  ];
  const commandStages = stages.filter((stage) => stage.commandCount > 0);
  const stageKeys = stages.map((stage) => stage.key);
  const stageByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage]));
  const stageLabelByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.label]));
  const stageSummaryByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.reason]));
  const stageKindByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.kind]));
  const stageRequiredByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.required]));
  const stageRunPolicyByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.runPolicy]));
  const stageSafetyLevelByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.safetyLevel]));
  const stageCommandCountByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commandCount]));
  const stageOutputFilesByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.outputFiles]));
  const commandStageKeys = commandStages.map((stage) => stage.key);
  const manualStageKeys = stages.filter((stage) => stage.commandCount === 0).map((stage) => stage.key);
  const nextStageKey = "verifySourceBundle";
  const nextCommandKey = "source.bundleCheck.strict";
  const nextStage = stageByKey[nextStageKey] || null;
  const nextCommandEntry = commandByKey.get(nextCommandKey) || null;
  const countBy = (predicate) => stages.filter(predicate).length;
  return {
    version: 1,
    source: "bundle-handoff",
    stageCount: stages.length,
    commandStageCount: commandStages.length,
    manualStageCount: countBy((stage) => stage.commandCount === 0),
    requiredStageCount: countBy((stage) => stage.required),
    optionalStageCount: countBy((stage) => !stage.required),
    readOnlyCommandStageCount: countBy((stage) => stage.runPolicy === "read-only"),
    localOutputCommandStageCount: countBy((stage) => stage.runPolicy === "writes-local-file"),
    externalCallCommandStageCount: countBy((stage) => stage.externalCalls),
    targetRepoMutationCommandStageCount: countBy((stage) => stage.targetRepoMutation),
    effectiveTaskId: commandManifest?.effectiveTaskId || "",
    effectiveStrictTaskCommandKey,
    stageKeys,
    stageByKey,
    stageLabelByKey,
    stageSummaryByKey,
    stageKindByKey,
    stageRequiredByKey,
    stageRunPolicyByKey,
    stageSafetyLevelByKey,
    stageCommandCountByKey,
    stageOutputFilesByKey,
    commandStageKeys,
    manualStageKeys,
    nextStageKey,
    nextStage,
    nextStageLabel: nextStage?.label || "",
    nextStageSummary: nextStage?.reason || "",
    nextStageKind: nextStage?.kind || "",
    nextStageRequired: nextStage?.required === true,
    nextStageRunPolicy: nextStage?.runPolicy || "",
    nextStageSafetyLevel: nextStage?.safetyLevel || "",
    nextStageCommandCount: nextStage?.commandCount || 0,
    nextStageOutputFiles: nextStage?.outputFiles || [],
    nextStageCommandKeys: nextStage?.commandKeys || [],
    nextCommandKey,
    nextCommand: nextCommandEntry?.command || "",
    nextCommandArgs: nextCommandEntry?.commandArgs || [],
    nextCommandRunPolicy: nextCommandEntry?.runPolicy || "",
    nextCommandSafetyLevel: nextCommandEntry?.safety?.safetyLevel || "",
    nextCommandSafety: nextCommandEntry?.safety || null,
    nextCommandEntry,
    stages,
  };
}

function formatBundleHandoffOperatorRunbookLines(operatorRunbook) {
  if (!operatorRunbook || !Array.isArray(operatorRunbook.stages) || operatorRunbook.stages.length === 0) {
    return ["- No operator runbook is available."];
  }
  return operatorRunbook.stages.map((stage) => {
    const required = stage.required ? "required" : "optional";
    const commandText = stage.commands.length
      ? ` command: \`${stage.commands[0].command}\``
      : " command: manual";
    const outputText = stage.outputFiles.length ? ` output: ${stage.outputFiles.join(", ")}` : "";
    return `- ${stage.step}. ${stage.key} (${required}, ${stage.runPolicy || stage.kind}): ${stage.label}.${commandText}${outputText}`;
  });
}

export function buildSiteBundleHandoffReport({
  target,
  cwd = process.cwd(),
  taskSelector = "",
} = {}) {
  const checkReport = buildSiteBundleCheckReport({ target, cwd });
  const includedFilePaths = [
    "summary.json",
    "mcp-probes.json",
    "mcp-action-plan.md",
    "website-handoff.md",
    "website-prompts.md",
    "codex-implementation.md",
  ];
  let bundleWorkspace = null;
  let taskCatalogError = "";
  let selectedTask = null;
  let codexImplementation = readBundleTextIfPresent(checkReport.directory, "codex-implementation.md");
  try {
    bundleWorkspace = loadSiteBundleWorkspace(checkReport.directory);
  } catch (error) {
    taskCatalogError = error.message;
  }
  if (String(taskSelector || "").trim()) {
    if (!bundleWorkspace) {
      throw new Error(taskCatalogError || "Cannot select a handoff task because the bundle workspace is unavailable");
    }
    const task = resolveSitePromptTask(bundleWorkspace, taskSelector);
    selectedTask = summarizeSelectedTask(task, taskSelector, "bundle-workspace", checkReport.directory);
    codexImplementation = buildSitePrompt(bundleWorkspace, "codex-implementation", { taskSelector });
  }
  const taskCatalog = bundleWorkspace
    ? summarizeBundleTaskCatalog(bundleWorkspace, checkReport.directory, selectedTask)
    : emptyBundleTaskCatalog(taskCatalogError);
  const defaultTask = taskCatalog.items[0] || null;
  const effectiveTask = selectedTask || defaultTask;

  const bundleTexts = {
    taskCatalog,
    defaultTask,
    effectiveTask,
    selectedTask,
    codexImplementation,
    websiteHandoff: readBundleTextIfPresent(checkReport.directory, "website-handoff.md"),
  };
  const boundaries = buildSiteBundleHandoffBoundaries(checkReport);
  const sourceBundle = summarizeSiteBundleHandoffSource(checkReport);
  const commandManifest = buildBundleHandoffCommandManifest({
    sourceBundle,
    taskCatalog,
    defaultTask,
    selectedTask,
    effectiveTask,
  });
  const operatorRunbook = buildBundleHandoffOperatorRunbook(commandManifest);
  const runbookPrompt = buildSiteBundleHandoffPrompt(checkReport, {
    ...bundleTexts,
    operatorRunbook,
  });
  return {
    status: checkReport.status,
    valid: checkReport.valid,
    directory: checkReport.directory,
    sourceBundle,
    commandManifest,
    operatorRunbook,
    boundaries,
    externalCalls: false,
    targetRepoMutation: false,
    bundle: {
      directory: checkReport.directory,
      siteName: checkReport.summary.siteName || "",
      source: checkReport.summary.source || "",
      sourceBundle,
      workspaceStatus: checkReport.workspaceStatus || "unknown",
      mcpStatus: checkReport.mcpStatus || "unknown",
      mcpProbeStatus: checkReport.mcpProbeStatus || "unknown",
      mcpProbeCounts: { ...checkReport.mcpProbeCounts },
      totalTasks: checkReport.summary.totalTasks || 0,
      implementationEvidence: { ...checkReport.summary.implementationEvidence },
      checksumAlgorithm: checkReport.summary.checksumAlgorithm || "",
      checksumBundleDigest: checkReport.summary.checksumBundleDigest || "",
      expectedChecksumFiles: checkReport.counts.expectedChecksumFiles,
      verifiedChecksumFiles: checkReport.counts.verifiedChecksumFiles,
      checksumFailures: checkReport.counts.checksumFailures,
      expectedGeneratedFiles: checkReport.counts.expectedGeneratedFiles,
      verifiedGeneratedFiles: checkReport.counts.verifiedGeneratedFiles,
      generatedFailures: checkReport.counts.generatedFailures,
      generatedDriftFiles: [...checkReport.generatedContract.driftFiles],
      taskCatalog,
      defaultTask,
      effectiveTask,
      selectedTask,
      commandManifest,
      operatorRunbook,
      boundaries,
      externalCalls: false,
      targetRepoMutation: false,
      repairGuidance: { ...checkReport.repairGuidance },
      executionChecklist: SITE_TARGET_REPO_EXECUTION_CHECKLIST,
    },
    prompt: runbookPrompt,
    files: checkReport.files.map((file) => ({
      ...file,
      included: includedFilePaths.includes(file.path),
    })),
    issues: checkReport.issues,
  };
}

export function formatSiteBundleHandoffJson(report) {
  return JSON.stringify(report, null, 2);
}

export function formatSiteBundleHandoffHuman(report) {
  return report.prompt;
}

function markdownList(items, fallback) {
  const normalized = normalizeStringArray(items);
  if (normalized.length === 0) return `- ${fallback}`;
  return normalized.map((item) => `- ${item}`).join("\n");
}

function profileBlock(workspace) {
  const profile = workspace.siteProfile;
  return [
    "Site profile:",
    `- Name: ${profile.name}`,
    `- Live URL: ${profile.liveUrl || "not provided"}`,
    `- Repo URL: ${profile.repoUrl || "not provided"}`,
    `- Local path: ${profile.localPath || "not provided"}`,
    `- Figma URL: ${profile.figmaUrl || "not provided"}`,
    `- Deploy: ${profile.deployProvider}`,
    `- Sentry: ${profile.sentryProject || "not provided"}`,
    `- CMS: ${profile.cms}`,
    `- Database: ${profile.database}`,
    `- Viewports: ${profile.viewports.join(", ")}`,
    "",
    "Priority pages:",
    markdownList(profile.pages, "No pages listed"),
    "",
    "User flows:",
    markdownList(profile.userFlows, "No user flows listed"),
    "",
    "Brand/design notes:",
    profile.brandNotes || "No brand notes provided.",
  ].join("\n");
}

function auditBlock(workspace) {
  return AUDIT_CATEGORIES.map((category) => {
    const row = workspace.auditChecklist[category.id];
    return [
      `- ${category.label} [${row.status}]`,
      `  Notes: ${row.notes || "none"}`,
      `  Findings: ${row.findings.length ? row.findings.join("; ") : "none"}`,
    ].join("\n");
  }).join("\n");
}

function mcpBlock(workspace) {
  return MCP_ITEMS.map(([key, label]) => `- ${label}: ${workspace.mcpReadiness[key]}`).join("\n");
}

function taskBlock(task) {
  if (!task) return "No refactor task selected. Use the Refactor Plan section first.";
  return [
    "Selected task:",
    `- Task ID: ${task.id}`,
    `- Title: ${task.title}`,
    `- Category: ${categoryById(task.category).label}`,
    `- Problem: ${task.problem}`,
    `- Evidence: ${task.evidence || "not provided"}`,
    `- Impact: ${task.impact}`,
    `- Effort: ${task.effort}`,
    `- Priority: ${task.priority}`,
    `- Pages: ${task.pages.join(", ") || "not specified"}`,
    `- Recommended MCP: ${task.recommendedMcp.join(", ") || "none"}`,
    "",
    "Verification:",
    markdownList(task.verification, "Run target repo verification"),
    "",
    "Risks:",
    markdownList(task.risks, "No risks listed"),
  ].join("\n");
}

function primaryTask(workspace) {
  return orderedRefactorTasks(workspace)[0] || null;
}

function orderedRefactorTasks(workspace) {
  return workspace.refactorTasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      const priorityDelta = PRIORITY_OPTIONS.indexOf(a.task.priority) - PRIORITY_OPTIONS.indexOf(b.task.priority);
      if (priorityDelta !== 0) return priorityDelta;
      return a.index - b.index;
    })
    .map((item) => item.task);
}

export function resolveSitePromptTask(workspace, selector = "") {
  const tasks = orderedRefactorTasks(workspace);
  const trimmed = String(selector || "").trim();
  if (!trimmed) return tasks[0] || null;

  const byId = workspace.refactorTasks.find((task) => task.id === trimmed);
  if (byId) return byId;

  if (/^[1-9]\d*$/.test(trimmed)) {
    const index = Number.parseInt(trimmed, 10) - 1;
    if (tasks[index]) return tasks[index];
  }

  const ids = tasks.map((task, index) => `${index + 1}:${task.id}`).join(", ");
  throw new Error(`Unknown refactor task: ${trimmed}. Use one of: ${ids || "no tasks available"}`);
}

export function buildSitePrompt(workspace, templateId, { taskSelector = "" } = {}) {
  const profile = profileBlock(workspace);
  const audit = auditBlock(workspace);
  const mcp = mcpBlock(workspace);
  const task = taskBlock(resolveSitePromptTask(workspace, taskSelector));
  const commonRules = [
    "Rules:",
    "- Work in the target website repository, not in this design-ai repository.",
    "- Inspect existing architecture, components, state, styling, and design tokens before editing.",
    "- Keep changes scoped and avoid new dependencies unless clearly justified.",
    "- Preserve accessibility: keyboard reachability, visible focus, semantic HTML, screen-reader labels, and WCAG 2.1 AA contrast.",
    "- Verify desktop, tablet, and mobile layouts.",
  ].join("\n");

  const map = {
    "codex-repo-intake": [
      "# Codex repo intake prompt",
      profile,
      "",
      "Goal: inspect the target website repo and produce a concise implementation plan for website improvement work.",
      "",
      commonRules,
      "",
      "Read first:",
      "- package/dependency manifest",
      "- app/router entrypoints",
      "- layout and design system primitives",
      "- styling/token setup",
      "- test/build scripts",
      "",
      "Return: repo structure, routing, reusable components, state/data model, likely touch points, risks, and exact verification commands.",
    ],
    "codex-implementation": [
      "# Codex implementation prompt",
      profile,
      "",
      task,
      "",
      commonRules,
      "",
      "Implement the smallest safe fix. After editing, run the target repo's most relevant lint/typecheck/build/test command and summarize changed files plus verification.",
    ],
    "codex-visual-qa": [
      "# Codex visual QA prompt",
      profile,
      "",
      "Audit checklist state:",
      audit,
      "",
      `Use Browser/Playwright if available. Verify the priority pages across ${workspace.siteProfile.viewports.join(", ")}. Check layout, typography, CTA hierarchy, forms, focus indicators, console errors, and broken assets.`,
    ],
    "codex-deployment": [
      "# Codex deployment verification prompt",
      profile,
      "",
      "MCP readiness:",
      mcp,
      "",
      "Verify the deployment or preview URL, runtime logs, environment assumptions, SEO metadata, and major user flows. Report pass/fail evidence and remaining launch risks.",
    ],
    "claude-design-review": [
      "# Claude design review prompt",
      profile,
      "",
      "Review the live site or screenshots as a senior product designer. Focus on visual hierarchy, layout rhythm, typography, color, spacing, CTA clarity, responsive behavior, and accessibility concerns. Provide one best path and cite concrete evidence.",
    ],
    "claude-competitor": [
      "# Claude competitor research prompt",
      profile,
      "",
      "Research 3-5 relevant competitors or peer websites. Compare homepage structure, conversion path, proof points, pricing presentation, visual tone, content clarity, and SEO positioning. Return a concise opportunity map, not a generic benchmark.",
    ],
    "claude-copy-ux": [
      "# Claude copy/UX critique prompt",
      profile,
      "",
      "Critique the site's copy, information architecture, trust signals, CTA language, and conversion flow. Rewrite only the highest-impact sections and explain why the edits reduce user uncertainty.",
    ],
    "handoff-report": [
      "# Final handoff report prompt",
      profile,
      "",
      "Refactor plan:",
      workspace.refactorTasks.map((item) => `- [${item.priority}] ${item.title}: ${item.problem}`).join("\n") || "- No tasks listed",
      "",
      "Create a final handoff report with target site info, audit summary, priority recommendations, executed work, verification results, remaining risks, and next actions.",
    ],
  };

  return (map[templateId] || map["codex-repo-intake"]).join("\n");
}

export function buildSitePromptBundle(workspace) {
  return [
    `# Website improvement prompt bundle: ${workspace.siteProfile.name}`,
    "",
    "> Generated by design-ai site from a Website Improvement Console workspace export.",
    "",
    ...SITE_PROMPT_TEMPLATE_IDS.flatMap((templateId) => [
      `## ${templateId}`,
      "",
      buildSitePrompt(workspace, templateId),
      "",
    ]),
  ].join("\n").trimEnd();
}

export function buildSiteHandoffReport(workspace) {
  const profile = workspace.siteProfile;
  const tasks = workspace.refactorTasks;
  const evidence = normalizeImplementationEvidence(workspace.implementationEvidence);
  return [
    `# Website improvement handoff: ${profile.name}`,
    "",
    "> Generated by design-ai site from a Website Improvement Console workspace export.",
    "",
    "## Target site",
    "",
    `- Live URL: ${profile.liveUrl || "not provided"}`,
    `- Repo URL: ${profile.repoUrl || "not provided"}`,
    `- Local path: ${profile.localPath || "not provided"}`,
    `- Figma URL: ${profile.figmaUrl || "not provided"}`,
    `- Deploy provider: ${profile.deployProvider}`,
    `- CMS: ${profile.cms}`,
    `- Database: ${profile.database}`,
    `- Viewports: ${profile.viewports.join(", ")}`,
    "",
    "## Diagnostic summary",
    "",
    auditBlock(workspace),
    "",
    "## MCP Readiness",
    "",
    mcpBlock(workspace),
    "",
    "## Priority improvement plan",
    "",
    tasks.length ? tasks.map((task) => [
      `### [${task.priority.toUpperCase()}] ${task.title}`,
      "",
      `- Category: ${categoryById(task.category).label}`,
      `- Impact: ${task.impact}`,
      `- Effort: ${task.effort}`,
      `- Pages: ${task.pages.join(", ") || "not specified"}`,
      `- MCP: ${task.recommendedMcp.join(", ") || "none"}`,
      `- Problem: ${task.problem}`,
      `- Evidence: ${task.evidence || "not provided"}`,
      "",
      "Verification:",
      markdownList(task.verification, "Run target repo verification"),
      "",
      "Risks:",
      markdownList(task.risks, "No risks listed"),
    ].join("\n")).join("\n\n") : "No refactor tasks generated yet.",
    "",
    "## Executed work",
    "",
    markdownList(evidence.executedWork, "Not recorded yet. Add implementation notes after running Codex in the target repo."),
    "",
    "## Verification results",
    "",
    markdownList(evidence.verificationResults, "Not recorded yet. Paste target repo lint/typecheck/build, Browser QA, and deployment checks here."),
    "",
    "## Remaining risks",
    "",
    markdownList(evidence.remainingRisks, "No remaining risks recorded."),
    "",
    "## Next actions",
    "",
    markdownList(evidence.nextActions, "No next actions recorded."),
    "",
    "## Notes",
    "",
    workspace.reportNotes || "No notes recorded.",
  ].join("\n");
}
