// Website Improvement handoff bundle builder.

import {
  buildSiteMcpActionPlan,
  buildSiteMcpCheckReport,
  combineStatuses,
  formatSiteMcpCheckJson,
} from "./site-mcp-report.mjs";
import { buildSiteMcpProbeReport } from "./site-mcp-probes.mjs";
import {
  buildSiteBundleImplementationPrompt,
  buildSiteHandoffReport,
  buildSitePromptBundle,
} from "./site-prompts.mjs";
import { countImplementationEvidence } from "./site-evidence.mjs";
import {
  SITE_BUNDLE_FILES,
} from "./site-content.mjs";
import { analyzeSiteWorkspace } from "./site-analysis.mjs";
import { generateSiteRefactorTasks } from "./site-tasks.mjs";
import { buildBundleChecksums } from "./site-bundle-files.mjs";
import {
  buildSiteBundleHandoffGuidance,
  buildSiteBundleReadme,
} from "./site-bundle-readme.mjs";

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
