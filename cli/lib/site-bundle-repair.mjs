// Repair guidance helpers for Website Improvement handoff bundles.

import {
  existsSync,
  statSync,
} from "node:fs";
import path from "node:path";

import { shellQuote } from "./site-bundle-commands.mjs";

export function buildBundleRepairGuidance(directory, generatedContract) {
  const workspacePath = path.join(directory, "website-workspace.tasks.json");
  const reportBaseName = path.basename(directory);
  const reportDirectory = path.dirname(directory);
  const previewReportPath = path.join(reportDirectory, `${reportBaseName}-repair-preview.json`);
  const appliedReportPath = path.join(reportDirectory, `${reportBaseName}-repair-applied.json`);
  const hasWorkspace = existsSync(workspacePath) && statSync(workspacePath).isFile();
  const available = Boolean(generatedContract.available && hasWorkspace);
  return {
    available,
    reason: available
      ? "Regenerate the bundle from its embedded website-workspace.tasks.json when generated contract drift is reported."
      : "Repair guidance requires a readable website-workspace.tasks.json and generated contract analysis.",
    command: available ? `design-ai site ${shellQuote(workspacePath)} --bundle --out ${shellQuote(directory)} --force` : "",
    previewCommand: available ? `design-ai site ${shellQuote(directory)} --bundle-repair --json` : "",
    applyCommand: available ? `design-ai site ${shellQuote(directory)} --bundle-repair --yes --json` : "",
    previewReportCommand: available ? `design-ai site ${shellQuote(directory)} --bundle-repair --json --out ${shellQuote(previewReportPath)}` : "",
    applyReportCommand: available ? `design-ai site ${shellQuote(directory)} --bundle-repair --yes --json --out ${shellQuote(appliedReportPath)}` : "",
    verifyCommand: available ? `design-ai site ${shellQuote(directory)} --bundle-check --strict --json` : "",
    mutates: available ? "handoff-bundle-directory-only" : "none",
    targetRepoMutation: false,
    externalCalls: false,
  };
}

export function formatBundleRepairGuidanceLines(repairGuidance) {
  if (!repairGuidance.available) {
    return [
      `- Available: no`,
      `- Reason: ${repairGuidance.reason}`,
    ];
  }
  return [
    "- Available: yes",
    `- Reason: ${repairGuidance.reason}`,
    `- Regenerate: ${repairGuidance.command}`,
    `- Preview repair: ${repairGuidance.previewCommand}`,
    `- Apply repair: ${repairGuidance.applyCommand}`,
    `- Preview report: ${repairGuidance.previewReportCommand}`,
    `- Apply report: ${repairGuidance.applyReportCommand}`,
    `- Verify: ${repairGuidance.verifyCommand}`,
    `- Scope: ${repairGuidance.mutates}; target repo mutation ${repairGuidance.targetRepoMutation ? "yes" : "no"}; external calls ${repairGuidance.externalCalls ? "yes" : "no"}`,
  ];
}

export function summarizeBundleRepairCheck(report) {
  return {
    status: report.status,
    valid: report.valid,
    checksumBundleDigest: report.summary.checksumBundleDigest || "",
    checksumFailures: report.counts.checksumFailures,
    generatedFailures: report.counts.generatedFailures,
    verifiedGeneratedFiles: report.counts.verifiedGeneratedFiles,
    expectedGeneratedFiles: report.counts.expectedGeneratedFiles,
    generatedDriftFiles: [...report.generatedContract.driftFiles],
    issueCount: report.issues.length,
  };
}
