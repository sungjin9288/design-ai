import { SITE_BUNDLE_CHECKSUM_FILES } from "./site-content.mjs";
import { IMPLEMENTATION_EVIDENCE_KEYS } from "./site-evidence.mjs";
import {
  addIssue,
  statusFromIssues,
} from "./site-analysis.mjs";
import { buildSiteBundleCheckReport } from "./site-bundle-check.mjs";

export function summarizeBundleForCompare(report) {
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

export function buildBundleMetadataChanges(left, right) {
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

export function buildBundleFileChanges(left, right) {
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
