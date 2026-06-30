// Website Improvement Console workspace helpers for `design-ai site`.

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import path from "node:path";

import { buildSiteMcpProbeReport } from "./site-mcp-probes.mjs";
import {
  buildSiteMcpActionPlan,
  buildSiteMcpActionPlanData,
  buildSiteMcpCheckReport,
  combineStatuses,
  formatSiteMcpActionPlanJson,
  formatSiteMcpCheckHuman,
  formatSiteMcpCheckJson,
  normalizeMcpKey,
} from "./site-mcp-report.mjs";
import {
  buildSiteInitNextActionsReport,
  buildSiteIntakeNextActionsReport,
  buildSiteNextActionsReport,
  formatSiteNextActionsHuman,
  formatSiteNextActionsJson,
} from "./site-next-actions.mjs";
import {
  buildSiteBundleImplementationPrompt,
  buildSiteHandoffReport,
  buildSitePrompt,
  buildSitePromptBundle,
  formatSitePromptTemplatesHuman,
  formatSitePromptTemplatesJson,
  orderedRefactorTasks,
  resolveSitePromptTask,
} from "./site-prompts.mjs";
import { markdownList, markdownTable, normalizeStringArray } from "./site-strings.mjs";
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
  categoryById,
} from "./site-options.mjs";
import {
  IMPLEMENTATION_EVIDENCE_KEYS,
  countImplementationEvidence,
  normalizeImplementationEvidence,
} from "./site-evidence.mjs";
import {
  SITE_BUNDLE_CHECKSUM_FILES,
  SITE_BUNDLE_FILES,
  SITE_PROMPT_TEMPLATES,
} from "./site-content.mjs";
import {
  normalizeObject,
  normalizeSiteWorkspace,
} from "./site-workspace.mjs";
import { buildBundleCheckCommand } from "./site-bundle-commands.mjs";
import {
  buildBundleRepairGuidance,
  formatBundleRepairGuidanceLines,
  summarizeBundleRepairCheck,
} from "./site-bundle-repair.mjs";
import {
  buildSiteBundleHandoffGuidance,
  buildSiteBundleReadme,
} from "./site-bundle-readme.mjs";
import {
  buildBundleFileChanges,
  buildBundleMetadataChanges,
  formatSiteBundleCompareHuman,
  formatSiteBundleCompareJson,
  summarizeBundleForCompare,
} from "./site-bundle-compare.mjs";
import {
  buildBundleHandoffCommandManifest,
  buildBundleHandoffOperatorRunbook,
  formatBundleHandoffOperatorRunbookLines,
} from "./site-bundle-handoff-runbook.mjs";
import {
  SITE_TARGET_REPO_EXECUTION_CHECKLIST,
  buildSiteBundleHandoffBoundaries,
  emptyBundleTaskCatalog,
  formatBundleHandoffIssueLines,
  formatBundleHandoffTaskCatalogLines,
  summarizeBundleTaskCatalog,
  summarizeSelectedTask,
  summarizeSiteBundleHandoffSource,
} from "./site-bundle-handoff-summary.mjs";
import {
  addBundleMarkdownIssue,
  arraysEqual,
  buildBundleChecksums,
  buildBundleDigest,
  parseBundleJson,
  readBundleTextIfPresent,
  sha256Hex,
  shortDigest,
} from "./site-bundle-files.mjs";

export {
  buildSiteInitNextActionsReport,
  buildSiteIntakeNextActionsReport,
  buildSiteNextActionsReport,
  formatSiteNextActionsHuman,
  formatSiteNextActionsJson,
} from "./site-next-actions.mjs";

export {
  buildSiteMcpActionPlan,
  buildSiteMcpActionPlanData,
  buildSiteMcpCheckReport,
  formatSiteMcpActionPlanJson,
  formatSiteMcpCheckHuman,
  formatSiteMcpCheckJson,
} from "./site-mcp-report.mjs";

export {
  buildSiteMcpProbeReport,
} from "./site-mcp-probes.mjs";

export {
  formatSiteBundleCompareHuman,
  formatSiteBundleCompareJson,
} from "./site-bundle-compare.mjs";

export {
  AUDIT_CATEGORIES,
  MCP_ITEMS,
} from "./site-options.mjs";

export {
  parseSiteArgs,
  SITE_OPTIONS,
} from "./site-args.mjs";

export {
  buildSiteBundleImplementationPrompt,
  buildSiteHandoffReport,
  buildSitePrompt,
  buildSitePromptBundle,
  formatSitePromptTemplatesHuman,
  formatSitePromptTemplatesJson,
  resolveSitePromptTask,
} from "./site-prompts.mjs";

export {
  SITE_BUNDLE_CHECKSUM_FILES,
  SITE_BUNDLE_FILES,
  SITE_PROMPT_TEMPLATE_IDS,
  SITE_PROMPT_TEMPLATES,
} from "./site-content.mjs";

export {
  buildSiteIntakeTemplateMarkdown,
  createSampleSiteWorkspace,
  formatSiteIntakeTemplateJson,
} from "./site-starter.mjs";

export {
  createSiteWorkspaceFromInitOptions,
  createSiteWorkspaceFromIntakeMarkdown,
  normalizeSiteWorkspace,
} from "./site-workspace.mjs";

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
