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
  "--sample",
  "--tasks",
  "--bundle",
  "--bundle-check",
  "--prompt-list",
  "--mcp-check",
  "--mcp-plan",
  "--prompt",
  "--task",
  "--strict",
  "--report",
  "--prompts",
  "--out",
  "--output",
  "--force",
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
const CHECKLIST_STATUS_OPTIONS = ["todo", "in-progress", "done", "blocked"];
const MCP_STATUS_OPTIONS = ["required", "optional", "unused", "unavailable"];
const PRIORITY_OPTIONS = ["p0", "p1", "p2", "p3"];
const IMPACT_OPTIONS = ["high", "medium", "low"];
const EFFORT_OPTIONS = ["high", "medium", "low"];
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

export function parseSiteArgs(args) {
  const out = {
    target: "",
    stdin: false,
    sample: false,
    tasks: false,
    bundle: false,
    bundleCheck: false,
    promptList: false,
    mcpCheck: false,
    mcpPlan: false,
    promptTemplate: "",
    taskSelector: "",
    json: false,
    strict: false,
    report: false,
    prompts: false,
    outPath: "",
    force: false,
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
    } else if (arg === "--sample") {
      out.sample = true;
    } else if (arg === "--tasks") {
      out.tasks = true;
    } else if (arg === "--bundle") {
      out.bundle = true;
    } else if (arg === "--bundle-check") {
      out.bundleCheck = true;
    } else if (arg === "--prompt-list") {
      out.promptList = true;
    } else if (arg === "--mcp-check") {
      out.mcpCheck = true;
    } else if (arg === "--mcp-plan") {
      out.mcpPlan = true;
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
  if (out.sample && sources.length > 0) {
    throw new Error("Use --sample without a workspace JSON file path or --stdin");
  }
  if (out.promptList && sources.length > 0) {
    throw new Error("Use --prompt-list without a workspace JSON file path or --stdin");
  }
  if (out.sample && (out.report || out.prompts || out.promptTemplate)) {
    throw new Error("Use --sample without --report, --prompts, or --prompt");
  }
  if (out.promptList && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.mcpCheck || out.mcpPlan || out.report || out.prompts || out.promptTemplate || out.strict)) {
    throw new Error("Use --prompt-list without --sample, --tasks, --bundle, --bundle-check, --mcp-check, --mcp-plan, --report, --prompts, --prompt, or --strict");
  }
  if (out.mcpCheck && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.report || out.prompts || out.promptTemplate)) {
    throw new Error("Use --mcp-check without --sample, --tasks, --bundle, --bundle-check, --report, --prompts, or --prompt");
  }
  if (out.mcpPlan && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.report || out.prompts || out.promptTemplate)) {
    throw new Error("Use --mcp-plan without --sample, --tasks, --bundle, --bundle-check, --report, --prompts, or --prompt");
  }
  if (out.bundle && (out.sample || out.tasks || out.report || out.prompts || out.promptTemplate)) {
    throw new Error("Use --bundle without --sample, --tasks, --report, --prompts, or --prompt");
  }
  if (out.bundleCheck && out.stdin) {
    throw new Error("Use --bundle-check with a handoff bundle directory path, not --stdin");
  }
  if (out.bundleCheck && (out.sample || out.tasks || out.bundle || out.report || out.prompts || out.promptTemplate || out.promptList || out.mcpCheck || out.mcpPlan)) {
    throw new Error("Use --bundle-check without --sample, --tasks, --bundle, --report, --prompts, --prompt, --prompt-list, --mcp-check, or --mcp-plan");
  }
  if (out.sample && (out.tasks || out.bundle)) {
    throw new Error("Use only one generated workspace mode: --sample, --tasks, or --bundle");
  }
  if (out.sample && out.strict) {
    throw new Error("Use --sample without --strict; validate the generated file in a separate command");
  }
  if (out.taskSelector && !out.promptTemplate) {
    throw new Error("Use --task only with --prompt");
  }
  if (out.taskSelector && out.promptTemplate !== "codex-implementation") {
    throw new Error("Use --task only with --prompt codex-implementation");
  }
  if (out.tasks && (out.json || out.report || out.prompts)) {
    throw new Error("Use --tasks without --json, --report, or --prompts; validate the generated file in a separate command");
  }
  if (out.tasks && out.promptTemplate) {
    throw new Error("Use --tasks without --prompt; generate tasks in a separate command first");
  }
  if (out.bundle && out.json) {
    throw new Error("--json is only supported for the site summary or --mcp-check; use --bundle --out dir for bundle artifacts");
  }
  if (out.bundle && !out.outPath) {
    throw new Error("--bundle requires --out directory");
  }
  const outputModes = [out.report ? "--report" : "", out.prompts ? "--prompts" : "", out.promptTemplate ? "--prompt" : "", out.mcpCheck ? "--mcp-check" : "", out.mcpPlan ? "--mcp-plan" : "", out.bundle ? "--bundle" : "", out.bundleCheck ? "--bundle-check" : ""].filter(Boolean);
  if (outputModes.length > 1) {
    throw new Error("Use only one output mode: --report, --prompts, --prompt, --mcp-check, --mcp-plan, --bundle, or --bundle-check");
  }
  if (out.json && (out.report || out.prompts || out.promptTemplate || out.mcpPlan)) {
    throw new Error("--json is only supported for the site summary, --mcp-check, or --bundle-check; use --out with --report, --prompts, --prompt, or --mcp-plan for Markdown artifacts");
  }
  if (out.outPath && !(out.json || out.report || out.prompts || out.promptTemplate || out.sample || out.tasks || out.bundle || out.bundleCheck || out.promptList || out.mcpCheck || out.mcpPlan)) {
    throw new Error("--out requires --json, --report, --prompts, --prompt, --sample, --tasks, --bundle, --bundle-check, --prompt-list, --mcp-check, or --mcp-plan");
  }

  const { index, ...parsed } = out;
  return parsed;
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
      updatedAt: new Date().toISOString(),
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
    reportNotes: "MVP audit is a planning console. Run the generated prompts inside the target website repo before marking implementation complete.",
  };
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

export function normalizeSiteWorkspace(raw) {
  const fallback = createSampleSiteWorkspace();
  const source = normalizeObject(raw);
  const profile = normalizeObject(source.siteProfile);
  const viewports = normalizeStringArray(profile.viewports, fallback.siteProfile.viewports)
    .filter((viewport) => VIEWPORT_OPTIONS.includes(viewport));

  return {
    version: 1,
    updatedAt: String(source.updatedAt || new Date().toISOString()),
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

export function buildSiteMcpCheckReport(workspace, summary = {}) {
  const items = MCP_ITEMS.map(([key, label]) => mcpItemReport(workspace, key, label));
  const taskGaps = mcpTaskGaps(workspace);
  const workspaceIssues = (summary.issues || []).filter((issue) => issue.level !== "pass");
  const status = siteMcpCheckStatus(items, taskGaps, workspaceIssues);
  const nextActions = [
    ...items.flatMap((item) => item.actions),
    ...taskGaps.map((gap) => `Align task '${gap.taskId}' recommendedMcp with mcpReadiness.${gap.mcp}.`),
  ];

  return {
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

export function buildSiteMcpActionPlan(workspace, summary = {}) {
  const report = buildSiteMcpCheckReport(workspace, summary);
  const filePath = report.filePath || "workspace.json";
  const commandTarget = filePath === "stdin" ? "<workspace.json>" : filePath;
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

  return [
    `# Website improvement MCP action plan: ${report.site.name}`,
    "",
    "## Summary",
    `- Source: ${filePath}`,
    `- Status: ${report.status}`,
    `- Workspace status: ${report.workspaceStatus}`,
    `- Live URL: ${report.site.liveUrl || "not provided"}`,
    `- Repo: ${report.site.repoUrl || report.site.localPath || "not provided"}`,
    `- Ready MCP: ${report.counts.ready}/${report.counts.total}`,
    `- Missing MCP: ${report.counts.missing}`,
    `- Task/MCP gaps: ${report.counts.taskGaps}`,
    "",
    "## Readiness Matrix",
    markdownTable(
      ["MCP", "Requested", "State", "Level", "Evidence"],
      report.items.map((item) => [
        item.label,
        item.requestedStatus,
        item.state,
        item.level,
        item.evidence.length ? item.evidence.join("; ") : "none",
      ]),
    ),
    "",
    "## Blocking Items",
    markdownList(blockingIssues, "No blocking readiness issues."),
    "",
    "## Warnings",
    markdownList(warningIssues, "No optional readiness or task/MCP warnings."),
    "",
    "## Task/MCP Alignment",
    markdownTable(
      ["Task", "Priority / impact", "Recommended MCP", "Readiness state"],
      mcpActionPlanTaskRows(workspace, report),
    ),
    "",
    "## Execution Sequence",
    "1. Fix every blocking item before target-repo implementation handoff.",
    "2. Resolve warnings that affect the next selected refactor task, or mark the MCP unused when it is intentionally out of scope.",
    "3. Re-run the strict readiness gate and keep the JSON output with the handoff package.",
    "4. Generate or refresh starter tasks, then export the selected Codex implementation prompt.",
    "5. Run target-repo lint/typecheck/build plus desktop, tablet, mobile, keyboard, and screen-reader verification after implementation.",
    "",
    "## Commands",
    `- \`design-ai site ${commandTarget} --mcp-check --strict --json\``,
    `- \`design-ai site ${commandTarget} --tasks --out website-workspace.tasks.json\``,
    `- \`design-ai site ${commandTarget} --prompt codex-implementation --task 1 --out codex-implementation.md\``,
    `- \`design-ai site ${commandTarget} --report --out website-handoff.md\``,
    "",
    "## Boundaries",
    "- This plan is deterministic and local.",
    "- It does not call external MCPs, mutate the target website repo, run Lighthouse/axe, capture screenshots, or write to deployment/CMS/Sentry systems.",
    "- Run the generated Codex/Claude prompts in the target website workflow after this readiness plan is clean.",
  ].join("\n");
}

function buildSiteBundleReadme(workspace, bundleSummary, mcpReport, filePaths) {
  const commandTarget = bundleSummary.source === "stdin" ? "<workspace.json>" : bundleSummary.source;
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
    `- MCP ready: ${mcpReport.counts.ready}/${mcpReport.counts.total}`,
    "",
    "## Suggested Sequence",
    "1. Read `summary.json` and `mcp-action-plan.md` first.",
    "2. Fix required MCP readiness gaps, then re-run the strict gate.",
    "3. Use `codex-implementation.md` in the target website repo for the top-priority task.",
    "4. Use `website-prompts.md` for deeper Codex/Claude review, visual QA, deployment verification, competitor research, and final handoff.",
    "5. Paste target-repo verification results into `website-handoff.md` after implementation.",
    "",
    "## Regenerate",
    `- \`design-ai site ${commandTarget} --bundle --out website-handoff-bundle --force\``,
    `- \`design-ai site ${commandTarget} --mcp-check --strict --json\``,
    `- \`design-ai site website-handoff-bundle --bundle-check --strict --json\``,
    "",
    "## Checksum Verification",
    "- `summary.json` records SHA-256 checksums for every generated bundle file except `summary.json` itself.",
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

function buildBundleChecksums(files) {
  return {
    algorithm: "sha256",
    files: Object.fromEntries(
      files
        .filter((file) => file.path !== "summary.json")
        .map((file) => [file.path, sha256Hex(file.content)]),
    ),
  };
}

export function buildSiteHandoffBundle(workspace, summary = {}) {
  const taskResult = generateSiteRefactorTasks(workspace);
  const taskWorkspace = taskResult.workspace;
  const source = summary.filePath || "workspace.json";
  const { summary: taskSummary } = analyzeSiteWorkspace(taskWorkspace, { filePath: source });
  const mcpReport = buildSiteMcpCheckReport(taskWorkspace, taskSummary);
  const filePaths = SITE_BUNDLE_FILES;
  const bundleSummary = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source,
    status: mcpReport.status,
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
    mcp: {
      status: mcpReport.status,
      counts: mcpReport.counts,
      taskGaps: mcpReport.taskGaps.length,
    },
    files: filePaths,
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
      content: `${buildSiteBundleReadme(taskWorkspace, bundleSummary, mcpReport, filePaths)}\n`,
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
      content: `${buildSitePrompt(taskWorkspace, "codex-implementation", { taskSelector: "1" })}\n`,
    },
  ];
  bundleSummary.checksums = buildBundleChecksums(contentFiles);

  return {
    status: mcpReport.status,
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

function summarizeBundlePayload(summaryPayload) {
  const taskGeneration = normalizeObject(summaryPayload?.taskGeneration);
  const site = normalizeObject(summaryPayload?.site);
  const mcp = normalizeObject(summaryPayload?.mcp);
  const checksums = normalizeObject(summaryPayload?.checksums);
  return {
    source: String(summaryPayload?.source || ""),
    status: String(summaryPayload?.status || "unknown"),
    workspaceStatus: String(summaryPayload?.workspaceStatus || "unknown"),
    siteName: String(site.name || ""),
    totalTasks: Number.isFinite(taskGeneration.totalTasks) ? taskGeneration.totalTasks : 0,
    mcpStatus: String(mcp.status || "unknown"),
    files: Array.isArray(summaryPayload?.files) ? summaryPayload.files.map(String) : [],
    checksumAlgorithm: String(checksums.algorithm || ""),
    checksumFiles: normalizeObject(checksums.files),
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
  const summary = summarizeBundlePayload(summaryPayload);

  let workspaceSummary = null;
  let recomputedMcp = null;

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
      const expectedChecksumKeys = SITE_BUNDLE_CHECKSUM_FILES.slice().sort();
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
    recomputedMcp = buildSiteMcpCheckReport(analyzed.workspace, analyzed.summary);
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

  if (canReadDirectory) {
    addBundleMarkdownIssue(directory, "README.md", [
      "Website improvement handoff bundle",
      "does not call external MCPs",
    ], issues);
    addBundleMarkdownIssue(directory, "mcp-action-plan.md", [
      "# Website improvement MCP action plan",
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
      issues: issues.length,
      warnings: issues.filter((issue) => issue.level === "warn").length,
      failures: issues.filter((issue) => issue.level === "fail").length,
    },
    summary,
    workspaceStatus: workspaceSummary?.status || "unknown",
    mcpStatus: mcpPayload?.status || "unknown",
    files,
    unexpectedFiles,
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
    `Unexpected files: ${report.unexpectedFiles.length ? report.unexpectedFiles.join(", ") : "none"}`,
    `Source: ${report.summary.source || "unknown"}`,
    `Site: ${report.summary.siteName || "unknown"}`,
    `Tasks: ${report.summary.totalTasks}`,
    `MCP status: ${report.mcpStatus}`,
    "",
    "Files:",
    ...report.files.map((file) => `- [${file.present ? "pass" : "fail"}] ${file.path}`),
    "",
    "Issues:",
    ...report.issues.map((issue) => `- [${issue.level}] ${issue.id}: ${issue.message}`),
  ].join("\n");
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
    "- Not recorded in this MVP. Add implementation notes after running Codex in the target repo.",
    "",
    "## Verification results",
    "",
    "- Not recorded in this MVP. Paste target repo lint/typecheck/build, Browser QA, and deployment checks here.",
    "",
    "## Remaining risks",
    "",
    "- MCP readiness gaps may limit verification depth.",
    "- Copy or brand changes may require stakeholder review.",
    "- Automated performance/accessibility tooling is outside this MVP unless run in the target repo.",
    "",
    "## Notes",
    "",
    workspace.reportNotes || "No notes recorded.",
  ].join("\n");
}
