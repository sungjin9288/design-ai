// Website Improvement workspace creation and normalization helpers.

import { normalizeStringArray } from "./site-strings.mjs";
import {
  AUDIT_CATEGORIES,
  CHECKLIST_STATUS_OPTIONS,
  CMS_OPTIONS,
  DATABASE_OPTIONS,
  DEPLOY_OPTIONS,
  EFFORT_OPTIONS,
  IMPACT_OPTIONS,
  MCP_ITEMS,
  MCP_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  VIEWPORT_OPTIONS,
} from "./site-options.mjs";
import {
  DEFAULT_IMPLEMENTATION_RISKS,
  normalizeImplementationEvidence,
} from "./site-evidence.mjs";
import { createSampleSiteWorkspace } from "./site-starter.mjs";

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

function normalizeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

export function normalizeObject(value) {
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
