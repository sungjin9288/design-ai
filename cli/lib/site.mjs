// Website Improvement Console workspace helpers for `design-ai site`.

import { readFileSync } from "node:fs";
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
  "--prompt",
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

export function parseSiteArgs(args) {
  const out = {
    target: "",
    stdin: false,
    sample: false,
    tasks: false,
    promptTemplate: "",
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
  if (out.sample && (out.report || out.prompts || out.promptTemplate)) {
    throw new Error("Use --sample without --report, --prompts, or --prompt");
  }
  if (out.sample && out.tasks) {
    throw new Error("Use only one generated workspace mode: --sample or --tasks");
  }
  if (out.sample && out.strict) {
    throw new Error("Use --sample without --strict; validate the generated file in a separate command");
  }
  if (out.tasks && (out.json || out.report || out.prompts)) {
    throw new Error("Use --tasks without --json, --report, or --prompts; validate the generated file in a separate command");
  }
  if (out.tasks && out.promptTemplate) {
    throw new Error("Use --tasks without --prompt; generate tasks in a separate command first");
  }
  const outputModes = [out.report ? "--report" : "", out.prompts ? "--prompts" : "", out.promptTemplate ? "--prompt" : ""].filter(Boolean);
  if (outputModes.length > 1) {
    throw new Error("Use only one Markdown output mode: --report, --prompts, or --prompt");
  }
  if (out.json && (out.report || out.prompts || out.promptTemplate)) {
    throw new Error("--json is only supported for the site summary; use --out with --report, --prompts, or --prompt for Markdown artifacts");
  }
  if (out.outPath && !(out.json || out.report || out.prompts || out.promptTemplate || out.sample || out.tasks)) {
    throw new Error("--out requires --json, --report, --prompts, --prompt, --sample, or --tasks");
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
  return workspace.refactorTasks
    .slice()
    .sort((a, b) => PRIORITY_OPTIONS.indexOf(a.priority) - PRIORITY_OPTIONS.indexOf(b.priority))[0] || null;
}

export function buildSitePrompt(workspace, templateId) {
  const profile = profileBlock(workspace);
  const audit = auditBlock(workspace);
  const mcp = mcpBlock(workspace);
  const task = taskBlock(primaryTask(workspace));
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
