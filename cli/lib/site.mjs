// Website Improvement Console workspace helpers for `design-ai site`.

import {
  existsSync,
  readFileSync,
  statSync,
} from "node:fs";
import path from "node:path";

import {
  buildSitePrompt,
  resolveSitePromptTask,
} from "./site-prompts.mjs";
import {
  addIssue,
  analyzeSiteWorkspace,
  loadSiteWorkspaceInput,
  statusFromIssues,
} from "./site-analysis.mjs";
import { generateSiteRefactorTasks } from "./site-tasks.mjs";
import { buildSiteHandoffBundle } from "./site-bundle-build.mjs";
import { buildBundleCheckCommand } from "./site-bundle-commands.mjs";
import {
  formatBundleRepairGuidanceLines,
  summarizeBundleRepairCheck,
} from "./site-bundle-repair.mjs";
import { buildSiteBundleCheckReport } from "./site-bundle-check.mjs";
import {
  buildBundleFileChanges,
  buildBundleMetadataChanges,
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
  readBundleTextIfPresent,
} from "./site-bundle-files.mjs";
import { formatGeneratedContractDriftSummary } from "./site-bundle-contract.mjs";

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
