// Tests for site bundle check/repair/compare reports.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  SITE_BUNDLE_CHECKSUM_FILES,
  SITE_BUNDLE_FILES,
  analyzeSiteWorkspace,
  buildSiteBundleCheckReport,
  buildSiteBundleCompareReport,
  buildSiteBundleRepairBundle,
  buildSiteBundleRepairPreview,
  buildSiteHandoffBundle,
  createSampleSiteWorkspace,
  formatSiteBundleCheckHuman,
  formatSiteBundleCheckJson,
  formatSiteBundleCompareHuman,
  formatSiteBundleCompareJson,
  formatSiteBundleRepairHuman,
  formatSiteBundleRepairJson,
} from "./site.mjs";
import { bundleDigestForTest, sha256HexForTest, withTempDir } from "./site-test-support.mjs";

test("buildSiteBundleCheckReport validates a generated handoff bundle directory", () => withTempDir((dir) => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "stdin" });
  const bundle = buildSiteHandoffBundle(workspace, summary);
  const files = Object.fromEntries(bundle.files.map((file) => [file.path, file.content]));
  for (const file of bundle.files) {
    const target = path.join(dir, file.path);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, file.content, "utf8");
  }

  const report = buildSiteBundleCheckReport({ target: dir });
  const json = JSON.parse(formatSiteBundleCheckJson(report));
  const human = formatSiteBundleCheckHuman(report);

  assert.equal(report.status, "pass");
  assert.equal(report.valid, true);
  assert.equal(report.counts.expectedFiles, SITE_BUNDLE_FILES.length);
  assert.equal(report.counts.presentFiles, SITE_BUNDLE_FILES.length);
  assert.equal(report.counts.expectedChecksumFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.counts.verifiedChecksumFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.counts.checksumFailures, 0);
  assert.equal(report.counts.expectedGeneratedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.counts.verifiedGeneratedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.counts.generatedFailures, 0);
  assert.equal(report.generatedContract.available, true);
  assert.equal(report.generatedContract.expectedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.generatedContract.verifiedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.deepEqual(report.generatedContract.driftFiles, []);
  assert.equal(report.generatedContract.files.length, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.ok(report.generatedContract.files.every((file) => file.present && file.matches));
  assert.ok(report.generatedContract.files.every((file) => /^[a-f0-9]{64}$/.test(file.expectedDigest)));
  assert.ok(report.generatedContract.files.every((file) => /^[a-f0-9]{64}$/.test(file.actualDigest)));
  assert.equal(report.repairGuidance.available, true);
  assert.equal(report.repairGuidance.targetRepoMutation, false);
  assert.equal(report.repairGuidance.externalCalls, false);
  assert.match(report.repairGuidance.command, /website-workspace\.tasks\.json --bundle --out .* --force/);
  assert.match(report.repairGuidance.previewReportCommand, /--bundle-repair --json --out .*repair-preview\.json/);
  assert.match(report.repairGuidance.applyReportCommand, /--bundle-repair --yes --json --out .*repair-applied\.json/);
  assert.match(report.repairGuidance.verifyCommand, /--bundle-check --strict --json/);
  assert.equal(report.summary.siteName, "Korean SaaS marketing site");
  assert.equal(report.summary.totalTasks, 3);
  assert.equal(report.summary.mcpProbeStatus, "pass");
  assert.deepEqual(report.summary.mcpProbeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.equal(report.mcpProbeStatus, "pass");
  assert.deepEqual(report.mcpProbeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.deepEqual(report.boundaries, [
    "deterministic-local",
    "no-external-mcp-calls",
    "no-target-repo-mutation",
    "no-lighthouse-axe-visual-diff",
  ]);
  assert.equal(report.externalCalls, false);
  assert.equal(report.targetRepoMutation, false);
  assert.deepEqual(report.summary.implementationEvidence, {
    executedWork: 0,
    verificationResults: 0,
    remainingRisks: 3,
    nextActions: 0,
  });
  assert.equal(report.summary.checksumAlgorithm, "sha256");
  assert.match(report.summary.checksumBundleDigest, /^[a-f0-9]{64}$/);
  assert.equal(json.issues[0].id, "bundle-ready");
  assert.deepEqual(json.mcpProbeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.deepEqual(json.boundaries, [
    "deterministic-local",
    "no-external-mcp-calls",
    "no-target-repo-mutation",
    "no-lighthouse-axe-visual-diff",
  ]);
  assert.equal(json.externalCalls, false);
  assert.equal(json.targetRepoMutation, false);
  assert.deepEqual(json.generatedContract.driftFiles, []);
  assert.deepEqual(json.summary.implementationEvidence, {
    executedWork: 0,
    verificationResults: 0,
    remainingRisks: 3,
    nextActions: 0,
  });
  assert.match(human, /Website Improvement handoff bundle check/);
  assert.match(human, new RegExp(`Files: ${SITE_BUNDLE_FILES.length}/${SITE_BUNDLE_FILES.length}`));
  assert.match(human, new RegExp(`Checksums: ${SITE_BUNDLE_CHECKSUM_FILES.length}/${SITE_BUNDLE_CHECKSUM_FILES.length} verified`));
  assert.match(human, new RegExp(`Generated contract: ${SITE_BUNDLE_CHECKSUM_FILES.length}/${SITE_BUNDLE_CHECKSUM_FILES.length} verified`));
  assert.match(human, /Generated drift files: none/);
  assert.match(human, /Generated contract drift:\n- none/);
  assert.match(human, /Repair guidance:\n- Available: yes/);
  assert.match(human, /Regenerate: design-ai site .*website-workspace\.tasks\.json --bundle --out .* --force/);
  assert.match(human, /Preview report: design-ai site .* --bundle-repair --json --out .*repair-preview\.json/);
  assert.match(human, /Apply report: design-ai site .* --bundle-repair --yes --json --out .*repair-applied\.json/);
  assert.match(human, /Bundle digest: [a-f0-9]{64}/);
  assert.match(human, /Evidence: executed work 0, verification 0, risks 3, next actions 0/);
  assert.match(human, /MCP probe status: pass/);
  assert.match(human, /MCP probes: 4\/4 passing, 0 warning, 0 failing/);
  assert.match(human, /Boundary flags: external calls no; target repo mutation no/);
  assert.match(human, /Bundle boundaries:\n- deterministic-local\n- no-external-mcp-calls\n- no-target-repo-mutation\n- no-lighthouse-axe-visual-diff/);
  assert.match(human, /bundle-ready/);

  const summaryPath = path.join(dir, "summary.json");
  const originalSummary = readFileSync(summaryPath, "utf8");
  const mismatchedSummary = JSON.parse(originalSummary);
  mismatchedSummary.implementationEvidence.remainingRisks = 0;
  writeFileSync(summaryPath, `${JSON.stringify(mismatchedSummary, null, 2)}\n`, "utf8");
  const evidenceMismatchReport = buildSiteBundleCheckReport({ target: dir });
  assert.equal(evidenceMismatchReport.status, "fail");
  assert.ok(evidenceMismatchReport.issues.some((issue) => issue.id === "bundle-implementation-evidence-remainingRisks"));
  writeFileSync(summaryPath, originalSummary, "utf8");

  const probeCountMismatchSummary = JSON.parse(originalSummary);
  probeCountMismatchSummary.mcp.probeCounts.pass = 3;
  writeFileSync(summaryPath, `${JSON.stringify(probeCountMismatchSummary, null, 2)}\n`, "utf8");
  const probeCountMismatchReport = buildSiteBundleCheckReport({ target: dir });
  assert.equal(probeCountMismatchReport.status, "fail");
  assert.ok(probeCountMismatchReport.issues.some((issue) => issue.id === "bundle-summary-mcp-probe-counts-pass"));
  writeFileSync(summaryPath, originalSummary, "utf8");

  const handoffPath = path.join(dir, "website-handoff.md");
  const originalHandoff = readFileSync(handoffPath, "utf8");
  const coherentlyTamperedHandoff = `${originalHandoff}\nCoherent manual edit after bundle export.\n`;
  const coherentlyTamperedSummary = JSON.parse(originalSummary);
  coherentlyTamperedSummary.checksums.files["website-handoff.md"] = sha256HexForTest(coherentlyTamperedHandoff);
  coherentlyTamperedSummary.checksums.bundleDigest = bundleDigestForTest(coherentlyTamperedSummary.checksums.files);
  writeFileSync(handoffPath, coherentlyTamperedHandoff, "utf8");
  writeFileSync(summaryPath, `${JSON.stringify(coherentlyTamperedSummary, null, 2)}\n`, "utf8");
  const generatedMismatchReport = buildSiteBundleCheckReport({ target: dir });
  assert.equal(generatedMismatchReport.status, "fail");
  assert.equal(generatedMismatchReport.counts.checksumFailures, 0);
  assert.equal(generatedMismatchReport.counts.generatedFailures, 1);
  assert.deepEqual(generatedMismatchReport.generatedContract.driftFiles, ["website-handoff.md"]);
  assert.equal(generatedMismatchReport.repairGuidance.available, true);
  assert.match(generatedMismatchReport.repairGuidance.command, /website-workspace\.tasks\.json --bundle --out .* --force/);
  const handoffDrift = generatedMismatchReport.generatedContract.files.find((file) => file.path === "website-handoff.md");
  assert.equal(handoffDrift.matches, false);
  assert.equal(handoffDrift.actualDigest, sha256HexForTest(coherentlyTamperedHandoff));
  assert.notEqual(handoffDrift.expectedDigest, handoffDrift.actualDigest);
  assert.ok(generatedMismatchReport.issues.some((issue) => (
    issue.id === "bundle-generated-website-handoff.md"
    && issue.message.includes(handoffDrift.expectedDigest.slice(0, 12))
    && issue.message.includes(handoffDrift.actualDigest.slice(0, 12))
  )));
  writeFileSync(handoffPath, originalHandoff, "utf8");
  writeFileSync(summaryPath, originalSummary, "utf8");

  writeFileSync(path.join(dir, "codex-implementation.md"), `${readFileSync(path.join(dir, "codex-implementation.md"), "utf8")}\nTampered after export.\n`, "utf8");
  const tamperedReport = buildSiteBundleCheckReport({ target: dir });
  assert.equal(tamperedReport.status, "fail");
  assert.equal(tamperedReport.valid, false);
  assert.equal(tamperedReport.counts.verifiedChecksumFiles, SITE_BUNDLE_CHECKSUM_FILES.length - 1);
  assert.equal(tamperedReport.counts.checksumFailures, 2);
  assert.ok(tamperedReport.issues.some((issue) => issue.id === "bundle-checksum-codex-implementation.md"));
  assert.ok(tamperedReport.issues.some((issue) => issue.id === "bundle-checksum-bundle-digest"));

  writeFileSync(path.join(dir, "codex-implementation.md"), files["codex-implementation.md"], "utf8");
  rmSync(path.join(dir, "mcp-check.json"));
  const missingReport = buildSiteBundleCheckReport({ target: dir });
  assert.equal(missingReport.status, "fail");
  assert.equal(missingReport.valid, false);
  assert.ok(missingReport.issues.some((issue) => issue.id === "bundle-missing-mcp-check.json"));
}));

test("buildSiteBundleRepairPreview reports local bundle repair without mutating files", () => withTempDir((dir) => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "stdin" });
  const bundle = buildSiteHandoffBundle(workspace, summary);
  for (const file of bundle.files) {
    writeFileSync(path.join(dir, file.path), file.content, "utf8");
  }

  const handoffPath = path.join(dir, "website-handoff.md");
  const originalHandoff = readFileSync(handoffPath, "utf8");
  const tamperedHandoff = `${originalHandoff}\nManual edit before repair.\n`;
  writeFileSync(handoffPath, tamperedHandoff, "utf8");

  const preview = buildSiteBundleRepairPreview({ target: dir });
  const json = JSON.parse(formatSiteBundleRepairJson(preview));
  const human = formatSiteBundleRepairHuman(preview);

  assert.equal(preview.status, "pass");
  assert.equal(preview.valid, true);
  assert.equal(preview.dryRun, true);
  assert.equal(preview.applied, false);
  assert.equal(preview.repairGuidance.available, true);
  assert.equal(preview.repairGuidance.targetRepoMutation, false);
  assert.equal(preview.repairGuidance.externalCalls, false);
  assert.match(preview.repairGuidance.applyCommand, /--bundle-repair --yes --json/);
  assert.match(preview.repairGuidance.previewReportCommand, /--bundle-repair --json --out .*repair-preview\.json/);
  assert.match(preview.repairGuidance.applyReportCommand, /--bundle-repair --yes --json --out .*repair-applied\.json/);
  assert.equal(preview.before.status, "fail");
  assert.deepEqual(preview.before.generatedDriftFiles, ["website-handoff.md"]);
  assert.equal(preview.after, null);
  assert.equal(preview.written, null);
  assert.equal(json.dryRun, true);
  assert.match(human, /Website Improvement handoff bundle repair/);
  assert.match(human, /Dry run: yes/);
  assert.match(human, /Apply repair: design-ai site .* --bundle-repair --yes --json/);
  assert.match(human, /Preview report: design-ai site .* --bundle-repair --json --out .*repair-preview\.json/);
  assert.match(human, /Apply report: design-ai site .* --bundle-repair --yes --json --out .*repair-applied\.json/);
  assert.equal(readFileSync(handoffPath, "utf8"), tamperedHandoff);

  const repair = buildSiteBundleRepairBundle({ target: dir });
  assert.equal(repair.preview.dryRun, true);
  assert.equal(repair.beforeReport.status, "fail");
  assert.equal(repair.bundle.files.length, SITE_BUNDLE_FILES.length);
  assert.equal(repair.bundle.files.find((file) => file.path === "website-handoff.md").content, originalHandoff);
}));

test("buildSiteBundleCompareReport compares handoff bundle fingerprints and changed files", () => withTempDir((dir) => {
  const leftDir = path.join(dir, "left");
  const rightDir = path.join(dir, "right");
  mkdirSync(leftDir);
  mkdirSync(rightDir);

  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "stdin" });
  const leftBundle = buildSiteHandoffBundle(workspace, summary);
  for (const file of leftBundle.files) {
    writeFileSync(path.join(leftDir, file.path), file.content, "utf8");
    writeFileSync(path.join(rightDir, file.path), file.content, "utf8");
  }

  const identical = buildSiteBundleCompareReport({ target: leftDir, compareTarget: rightDir });
  const identicalJson = JSON.parse(formatSiteBundleCompareJson(identical));
  const identicalHuman = formatSiteBundleCompareHuman(identical);

  assert.equal(identical.status, "pass");
  assert.equal(identical.valid, true);
  assert.equal(identical.sameBundle, true);
  assert.equal(identical.digestMatch, true);
  assert.equal(identical.counts.changedFiles, 0);
  assert.equal(identical.issues[0].id, "bundle-compare-identical");
  assert.equal(identicalJson.left.siteName, "Korean SaaS marketing site");
  assert.deepEqual(identicalJson.left.mcpProbeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.deepEqual(identicalJson.left.generatedDriftFiles, []);
  assert.deepEqual(identicalJson.right.generatedDriftFiles, []);
  assert.deepEqual(identicalJson.left.implementationEvidence, {
    executedWork: 0,
    verificationResults: 0,
    remainingRisks: 3,
    nextActions: 0,
  });
  assert.match(identicalHuman, /Same bundle: yes/);
  assert.match(identicalHuman, new RegExp(`Generated contract: left ${SITE_BUNDLE_CHECKSUM_FILES.length}/${SITE_BUNDLE_CHECKSUM_FILES.length}, right ${SITE_BUNDLE_CHECKSUM_FILES.length}/${SITE_BUNDLE_CHECKSUM_FILES.length}`));
  assert.match(identicalHuman, /Generated drift files: left none, right none/);
  assert.match(identicalHuman, /MCP probes: left 4\/4 passing, 0 warning, 0 failing, right 4\/4 passing, 0 warning, 0 failing/);

  const changedWorkspace = createSampleSiteWorkspace();
  changedWorkspace.auditChecklist["content-quality"].findings.push("FAQ page lacks proof for enterprise procurement teams");
  changedWorkspace.implementationEvidence.executedWork.push("Implemented homepage CTA contrast pass");
  const changedSummary = analyzeSiteWorkspace(changedWorkspace, { filePath: "stdin" }).summary;
  const rightBundle = buildSiteHandoffBundle(changedWorkspace, changedSummary);
  for (const file of rightBundle.files) {
    writeFileSync(path.join(rightDir, file.path), file.content, "utf8");
  }

  const changed = buildSiteBundleCompareReport({ target: leftDir, compareTarget: rightDir });
  assert.equal(changed.status, "warn");
  assert.equal(changed.valid, true);
  assert.equal(changed.sameBundle, false);
  assert.equal(changed.digestMatch, false);
  assert.ok(changed.changedFiles.some((file) => file.path === "website-workspace.tasks.json"));
  assert.ok(changed.changedFiles.some((file) => file.path === "website-handoff.md"));
  assert.ok(changed.metadataChanges.some((item) => item.key === "implementationEvidence.executedWork"));
  assert.equal(changed.issues[0].id, "bundle-compare-different");
  assert.match(formatSiteBundleCompareHuman(changed), /Changed files: [1-9]/);
}));
