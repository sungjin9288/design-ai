import {
  buildBundleCheckCommand,
  buildBundleCheckCommandArgs,
  buildBundleHandoffCommand,
  buildBundleHandoffCommandArgs,
  buildBundleSourceCommandSafety,
  buildBundleTaskHandoffCommand,
  buildBundleTaskHandoffCommandArgs,
  buildBundleTaskHandoffCommandSafety,
  taskHandoffOutFile,
} from "./site-bundle-commands.mjs";
import { orderedRefactorTasks } from "./site-prompts.mjs";
import { normalizeStringArray } from "./site-strings.mjs";

export const SITE_TARGET_REPO_EXECUTION_CHECKLIST = [
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

export function summarizeBundleTaskCatalog(workspace, directory, selectedTask = null) {
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

export function emptyBundleTaskCatalog(error = "") {
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

export function summarizeSelectedTask(task, taskSelector, source, directory = "") {
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

export function formatBundleHandoffTaskCatalogLines(taskCatalog) {
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

export function formatBundleHandoffIssueLines(issues) {
  const actionable = issues.filter((issue) => issue.level !== "pass");
  if (actionable.length === 0) return "- No blocking bundle-check issues were found.";
  return actionable.map((issue) => `- [${issue.level}] ${issue.id}: ${issue.message}`).join("\n");
}

export function buildSiteBundleHandoffBoundaries(checkReport) {
  return Array.from(new Set([
    ...normalizeStringArray(checkReport?.boundaries),
    "target-repo-work-after-handoff",
  ]));
}

export function summarizeSiteBundleHandoffSource(checkReport) {
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
