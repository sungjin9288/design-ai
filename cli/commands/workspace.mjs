// `design-ai workspace` — read-only dogfood workspace summary.

import {
  collectWorkspaceReport,
  formatWorkspaceJson,
  parseWorkspaceArgs,
} from "../lib/workspace.mjs";
import { dim, error, header, info, success, warn } from "../lib/log.mjs";

function printHelp() {
  console.log("Usage:  design-ai workspace [--root path] [--learning-file path] [--json]\n");
  console.log("Shows the current local dogfood workspace state without changing files.\n");
  console.log("Options:");
  console.log("  --root path           Inspect a specific git workspace root. Default: current directory");
  console.log("  --learning-file path  Inspect a specific learning profile. Default: DESIGN_AI_LEARNING_FILE or ~/.design-ai/learning.json");
  console.log("  --json                Emit machine-readable workspace diagnostics");
}

function formatCountMap(counts) {
  const entries = Object.entries(counts || {});
  if (entries.length === 0) return "none";
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => `${key}:${count}`)
    .join(", ");
}

function printAction(action) {
  const line = action.command ? `${action.text} ${dim(action.command)}` : action.text;
  if (action.level === "pass") {
    success(line);
  } else if (action.level === "fail") {
    error(line);
  } else if (action.level === "warn") {
    warn(line);
  } else {
    info(line);
  }
}

function printWorkspaceReport(report) {
  header("design-ai workspace", "Local dogfood readiness snapshot");

  info(`Root: ${report.context.root}`);
  info(`Source: ${report.context.sourceRoot}`);
  if (report.context.packageName || report.context.version) {
    info(`Package: ${report.context.packageName || "unknown"} ${report.context.version || ""}`.trim());
  }

  console.log("\nGit:");
  if (!report.git.isRepo) {
    warn(`Not a git repository: ${report.git.reason}`);
  } else {
    const sync = report.git.upstream
      ? `${report.git.upstream} (ahead ${report.git.ahead}, behind ${report.git.behind})`
      : "no upstream";
    const clean = report.git.clean ? "clean" : `${report.git.statusShort.length} changed path(s)`;
    info(`Branch: ${report.git.branch || "detached"} | ${clean} | ${sync}`);
    if (report.git.remote) info(`Remote: ${report.git.remote}`);
    if (report.git.lastCommit) {
      info(`Last commit: ${report.git.lastCommit.hash} ${report.git.lastCommit.subject}`);
    }
  }

  console.log("\nLearning:");
  const audit = report.learning.auditSummary;
  info(`File: ${report.learning.file}`);
  info(`Entries: ${report.learning.count} | audit ${audit.status} (${audit.failures} failure(s), ${audit.warnings} warning(s))`);
  info(`Categories: ${formatCountMap(report.learning.categoryCounts)}`);
  if (report.learning.latestEntry) {
    info(`Latest: ${report.learning.latestEntry.category} / ${report.learning.latestEntry.source}`);
  }
  if (report.learning.error) warn(`Learning profile error: ${report.learning.error}`);

  console.log("\nRepository:");
  info(`Canonical: ${report.repository.slug} (${report.repository.url})`);
  const remoteStatus = report.repository.remoteAligned === null
    ? "not checked"
    : report.repository.remoteAligned ? "aligned" : "mismatch";
  info(`Remote: ${report.repository.remoteUrl || "none"} | ${remoteStatus}`);
  if (report.repository.metadataAligned) {
    success("Package/plugin metadata aligned.");
  } else {
    warn("Package/plugin metadata mismatch detected.");
  }
  for (const issue of report.repository.issues) {
    warn(issue);
  }

  console.log("\nRelease scripts:");
  info(`Available: ${report.release.available.join(", ") || "none"}`);
  if (report.release.missing.length > 0) {
    warn(`Missing: ${report.release.missing.join(", ")}`);
  }

  console.log("\nNext actions:");
  for (const action of report.nextActions) {
    printAction(action);
  }
}

export async function runWorkspace(args, deps = {}) {
  const flags = parseWorkspaceArgs(args);
  if (flags.help) {
    printHelp();
    return;
  }

  const report = collectWorkspaceReport({
    root: flags.root || process.cwd(),
    learningFilePath: flags.learningFilePath || undefined,
    ...deps,
  });

  if (flags.json) {
    console.log(formatWorkspaceJson(report));
  } else {
    printWorkspaceReport(report);
  }
}
