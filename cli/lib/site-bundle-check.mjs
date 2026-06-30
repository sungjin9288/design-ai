// Handoff bundle validation for Website Improvement.

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import path from "node:path";

import { buildSiteMcpProbeReport } from "./site-mcp-probes.mjs";
import { buildSiteMcpCheckReport } from "./site-mcp-report.mjs";
import {
  IMPLEMENTATION_EVIDENCE_KEYS,
  countImplementationEvidence,
} from "./site-evidence.mjs";
import {
  SITE_BUNDLE_CHECKSUM_FILES,
  SITE_BUNDLE_FILES,
} from "./site-content.mjs";
import { normalizeObject } from "./site-workspace.mjs";
import {
  addIssue,
  analyzeSiteWorkspace,
  statusFromIssues,
} from "./site-analysis.mjs";
import {
  buildBundleRepairGuidance,
  formatBundleRepairGuidanceLines,
} from "./site-bundle-repair.mjs";
import {
  addBundleMarkdownIssue,
  arraysEqual,
  buildBundleDigest,
  parseBundleJson,
  sha256Hex,
} from "./site-bundle-files.mjs";
import {
  addBundleGeneratedContractIssues,
  buildBundleGeneratedContract,
  emptyBundleGeneratedContract,
  formatGeneratedContractDriftLines,
  formatGeneratedContractDriftSummary,
} from "./site-bundle-contract.mjs";
import { SITE_TARGET_REPO_EXECUTION_CHECKLIST } from "./site-bundle-handoff-summary.mjs";

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
