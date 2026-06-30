import { SITE_BUNDLE_CHECKSUM_FILES } from "./site-content.mjs";
import { IMPLEMENTATION_EVIDENCE_KEYS } from "./site-evidence.mjs";

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
