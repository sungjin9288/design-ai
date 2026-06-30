// Website Improvement Console workspace helpers for `design-ai site`.

import path from "node:path";

import {
  addIssue,
  analyzeSiteWorkspace,
  loadSiteWorkspaceInput,
  statusFromIssues,
} from "./site-analysis.mjs";
import { buildSiteHandoffBundle } from "./site-bundle-build.mjs";
import {
  formatBundleRepairGuidanceLines,
  summarizeBundleRepairCheck,
} from "./site-bundle-repair.mjs";
import { buildSiteBundleCheckReport } from "./site-bundle-check.mjs";

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
  buildSiteBundleCompareReport,
  formatSiteBundleCompareHuman,
  formatSiteBundleCompareJson,
} from "./site-bundle-compare.mjs";

export {
  buildSiteBundleHandoffReport,
  formatSiteBundleHandoffHuman,
  formatSiteBundleHandoffJson,
} from "./site-bundle-handoff.mjs";

export {
  buildSiteBundleCheckReport,
  formatSiteBundleCheckHuman,
  formatSiteBundleCheckJson,
} from "./site-bundle-check.mjs";

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

export {
  analyzeSiteWorkspace,
  buildSiteReport,
  formatSiteJson,
  loadSiteWorkspaceInput,
} from "./site-analysis.mjs";

export {
  generateSiteRefactorTasks,
} from "./site-tasks.mjs";

export {
  buildSiteWorkflowGraph,
  formatSiteWorkflowGraphJson,
  formatSiteWorkflowGraphMarkdown,
} from "./site-workflow-graph.mjs";

export {
  buildSiteHandoffBundle,
} from "./site-bundle-build.mjs";

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
