// Tests for site bundle handoff report and operator runbook contract.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  SITE_BUNDLE_CHECKSUM_FILES,
  analyzeSiteWorkspace,
  buildSiteBundleHandoffReport,
  buildSiteHandoffBundle,
  createSampleSiteWorkspace,
  formatSiteBundleHandoffHuman,
  formatSiteBundleHandoffJson,
} from "./site.mjs";
import { withTempDir } from "./site-test-support.mjs";

test("buildSiteBundleHandoffReport emits target-repo prompt from a verified bundle", () => withTempDir((dir) => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "stdin" });
  const bundle = buildSiteHandoffBundle(workspace, summary);
  for (const file of bundle.files) {
    writeFileSync(path.join(dir, file.path), file.content, "utf8");
  }

  const report = buildSiteBundleHandoffReport({ target: dir });
  const json = JSON.parse(formatSiteBundleHandoffJson(report));
  const human = formatSiteBundleHandoffHuman(report);

  assert.equal(report.status, "pass");
  assert.equal(report.valid, true);
  assert.deepEqual(report.boundaries, [
    "deterministic-local",
    "no-external-mcp-calls",
    "no-target-repo-mutation",
    "no-lighthouse-axe-visual-diff",
    "target-repo-work-after-handoff",
  ]);
  assert.equal(report.externalCalls, false);
  assert.equal(report.targetRepoMutation, false);
  assert.equal(report.bundle.siteName, "Korean SaaS marketing site");
  assert.deepEqual(report.sourceBundle, report.bundle.sourceBundle);
  assert.equal(report.sourceBundle.directory, dir);
  assert.equal(report.sourceBundle.sourceWorkspace, "stdin");
  assert.equal(report.sourceBundle.siteName, "Korean SaaS marketing site");
  assert.equal(report.sourceBundle.status, "pass");
  assert.equal(report.sourceBundle.valid, true);
  assert.equal(report.sourceBundle.verifiedChecksumFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.sourceBundle.verifiedGeneratedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.match(report.sourceBundle.checkCommand, /design-ai site .* --bundle-check --json/);
  assert.deepEqual(report.sourceBundle.checkCommandArgs, ["design-ai", "site", dir, "--bundle-check", "--json"]);
  assert.equal(report.sourceBundle.checkCommandRunPolicy, "read-only");
  assert.deepEqual(report.sourceBundle.checkCommandSafety, {
    runPolicy: "read-only",
    safetyLevel: "local-read-only",
    writesLocalFile: false,
    outputFile: "",
    mutates: "none",
    externalCalls: false,
    targetRepoMutation: false,
    requiresCleanWorkspace: false,
    requiresReviewBeforeMutation: false,
    strict: false,
  });
  assert.match(report.sourceBundle.strictCheckCommand, /design-ai site .* --bundle-check --strict --json/);
  assert.deepEqual(report.sourceBundle.strictCheckCommandArgs, ["design-ai", "site", dir, "--bundle-check", "--strict", "--json"]);
  assert.equal(report.sourceBundle.strictCheckCommandRunPolicy, "read-only");
  assert.equal(report.sourceBundle.strictCheckCommandSafety.strict, true);
  assert.equal(report.sourceBundle.strictCheckCommandSafety.externalCalls, false);
  assert.equal(report.sourceBundle.strictCheckCommandSafety.targetRepoMutation, false);
  assert.match(report.sourceBundle.handoffCommand, /design-ai site .* --bundle-handoff --json/);
  assert.deepEqual(report.sourceBundle.handoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--json"]);
  assert.equal(report.sourceBundle.handoffCommandRunPolicy, "read-only");
  assert.equal(report.sourceBundle.handoffCommandSafety.writesLocalFile, false);
  assert.equal(report.sourceBundle.handoffCommandSafety.mutates, "none");
  assert.match(report.sourceBundle.strictHandoffCommand, /design-ai site .* --bundle-handoff --strict --json/);
  assert.deepEqual(report.sourceBundle.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--strict", "--json"]);
  assert.equal(report.sourceBundle.strictHandoffCommandRunPolicy, "read-only");
  assert.deepEqual(report.sourceBundle.strictHandoffCommandSafety, {
    runPolicy: "read-only",
    safetyLevel: "local-read-only",
    writesLocalFile: false,
    outputFile: "",
    mutates: "none",
    externalCalls: false,
    targetRepoMutation: false,
    requiresCleanWorkspace: false,
    requiresReviewBeforeMutation: false,
    strict: true,
  });
  assert.deepEqual(report.commandManifest, report.bundle.commandManifest);
  assert.equal(report.commandManifest.version, 1);
  assert.equal(report.commandManifest.source, "bundle-handoff");
  assert.equal(report.commandManifest.commandCount, 10);
  assert.equal(report.commandManifest.sourceCommandCount, 4);
  assert.equal(report.commandManifest.taskCommandCount, 6);
  assert.equal(report.commandManifest.readOnlyCount, 4);
  assert.equal(report.commandManifest.localOutputFileCount, 6);
  assert.equal(report.commandManifest.externalCallCount, 0);
  assert.equal(report.commandManifest.targetRepoMutationCount, 0);
  assert.equal(report.commandManifest.requiresCleanWorkspaceCount, 0);
  assert.equal(report.commandManifest.requiresReviewBeforeMutationCount, 0);
  assert.equal(report.commandManifest.defaultTaskId, "task-accessibility");
  assert.equal(report.commandManifest.selectedTaskId, "");
  assert.equal(report.commandManifest.effectiveTaskId, "task-accessibility");
  assert.equal(report.commandManifest.defaultStrictTaskCommandKey, "task.task-accessibility.handoff.strict");
  assert.equal(report.commandManifest.selectedStrictTaskCommandKey, "");
  assert.equal(report.commandManifest.effectiveStrictTaskCommandKey, "task.task-accessibility.handoff.strict");
  assert.deepEqual(report.commandManifest.commands.map((command) => command.key), [
    "source.bundleCheck",
    "source.bundleCheck.strict",
    "source.bundleHandoff",
    "source.bundleHandoff.strict",
    "task.task-accessibility.handoff.default",
    "task.task-accessibility.handoff.strict",
    "task.task-homepage-cta.handoff.default",
    "task.task-homepage-cta.handoff.strict",
    "task.task-content-quality.handoff.default",
    "task.task-content-quality.handoff.strict",
  ]);
  assert.equal(report.commandManifest.commands[0].scope, "source-bundle");
  assert.equal(report.commandManifest.commands[0].runPolicy, "read-only");
  assert.deepEqual(report.commandManifest.commands[0].commandArgs, ["design-ai", "site", dir, "--bundle-check", "--json"]);
  assert.equal(report.commandManifest.commands[0].safety.safetyLevel, "local-read-only");
  assert.equal(report.commandManifest.commands[5].scope, "task-handoff");
  assert.equal(report.commandManifest.commands[5].taskId, "task-accessibility");
  assert.equal(report.commandManifest.commands[5].taskNumber, 1);
  assert.equal(report.commandManifest.commands[5].runPolicy, "writes-local-file");
  assert.equal(report.commandManifest.commands[5].outputFile, "target-repo-task-accessibility-handoff.md");
  assert.equal(report.commandManifest.commands[5].defaultTask, true);
  assert.equal(report.commandManifest.commands[5].selectedTask, false);
  assert.equal(report.commandManifest.commands[5].effectiveTask, true);
  assert.equal(report.commandManifest.commands[5].safety.outputFile, "target-repo-task-accessibility-handoff.md");
  assert.deepEqual(report.operatorRunbook, report.bundle.operatorRunbook);
  assert.equal(report.operatorRunbook.version, 1);
  assert.equal(report.operatorRunbook.source, "bundle-handoff");
  assert.equal(report.operatorRunbook.stageCount, 5);
  assert.equal(report.operatorRunbook.commandStageCount, 3);
  assert.equal(report.operatorRunbook.manualStageCount, 2);
  assert.equal(report.operatorRunbook.requiredStageCount, 4);
  assert.equal(report.operatorRunbook.optionalStageCount, 1);
  assert.equal(report.operatorRunbook.readOnlyCommandStageCount, 2);
  assert.equal(report.operatorRunbook.localOutputCommandStageCount, 1);
  assert.equal(report.operatorRunbook.externalCallCommandStageCount, 0);
  assert.equal(report.operatorRunbook.targetRepoMutationCommandStageCount, 0);
  assert.equal(report.operatorRunbook.effectiveTaskId, "task-accessibility");
  assert.equal(report.operatorRunbook.effectiveStrictTaskCommandKey, "task.task-accessibility.handoff.strict");
  assert.equal(report.operatorRunbook.nextStageKey, "verifySourceBundle");
  assert.equal(report.operatorRunbook.nextCommandKey, "source.bundleCheck.strict");
  const expectedRunbookStageKeys = [
    "verifySourceBundle",
    "refreshHandoffSnapshot",
    "writeEffectiveTaskPrompt",
    "executeInTargetRepo",
    "recordEvidence",
  ];
  assert.deepEqual(report.operatorRunbook.stages.map((stage) => stage.key), expectedRunbookStageKeys);
  assert.deepEqual(report.operatorRunbook.stageKeys, expectedRunbookStageKeys);
  assert.deepEqual(Object.keys(report.operatorRunbook.stageByKey), expectedRunbookStageKeys);
  assert.deepEqual(report.operatorRunbook.stageLabelByKey, {
    verifySourceBundle: "Verify source bundle integrity",
    refreshHandoffSnapshot: "Refresh strict handoff JSON snapshot",
    writeEffectiveTaskPrompt: "Write effective task handoff prompt",
    executeInTargetRepo: "Execute the task in the target website repo",
    recordEvidence: "Record implementation evidence",
  });
  assert.equal(report.operatorRunbook.stageHumanLines.length, 5);
  assert.equal(
    report.operatorRunbook.stageHumanLineByKey.verifySourceBundle,
    report.operatorRunbook.stageHumanLines[0],
  );
  assert.equal(report.operatorRunbook.nextStageHumanLine, report.operatorRunbook.stageHumanLines[0]);
  assert.deepEqual(report.operatorRunbook.stageHumanLineDisplayRows[0], {
    step: 1,
    key: "verifySourceBundle",
    label: "Verify source bundle integrity",
    line: report.operatorRunbook.stageHumanLines[0],
    required: true,
    manual: false,
    commandCount: 1,
    actionType: "run-local-gate",
    actionLabel: "Run strict bundle check",
    actionStatus: "ready",
    actionStatusLabel: "Ready",
    actionStatusTone: "success",
    hasEvidenceProgress: true,
    evidenceProgressStatus: "blocked",
    evidenceProgressStatusLabel: "Checklist blocked",
    evidenceProgressStatusTone: "danger",
    evidenceProgressIconName: "list-x",
    evidenceProgressLabel: "0/2 complete",
    evidenceCompletionPercent: 0,
    firstUncheckedEvidenceItemLabel: "Strict bundle-check output",
  });
  assert.deepEqual(
    report.operatorRunbook.stageHumanLineDisplayRowByKey.verifySourceBundle,
    report.operatorRunbook.stageHumanLineDisplayRows[0],
  );
  assert.deepEqual(
    report.operatorRunbook.nextStageHumanLineDisplayRow,
    report.operatorRunbook.stageHumanLineDisplayRows[0],
  );
  assert.deepEqual(report.operatorRunbook.stageHumanLineDisplayRowKeysByActionStatus, {
    ready: ["verifySourceBundle", "writeEffectiveTaskPrompt"],
    optional: ["refreshHandoffSnapshot"],
    manual: ["executeInTargetRepo", "recordEvidence"],
    blocked: [],
  });
  assert.deepEqual(report.operatorRunbook.stageHumanLineDisplayRowKeysByEvidenceProgressStatus, {
    blocked: ["verifySourceBundle", "writeEffectiveTaskPrompt", "executeInTargetRepo", "recordEvidence"],
    ready: ["refreshHandoffSnapshot"],
  });
  assert.deepEqual(report.operatorRunbook.stageHumanLineDisplayRowSummary, {
    count: 5,
    byKeyCount: 5,
    requiredCount: 4,
    optionalCount: 1,
    commandCount: 3,
    manualCount: 2,
    readyActionStatusCount: 2,
    optionalActionStatusCount: 1,
    manualActionStatusCount: 2,
    blockedActionStatusCount: 0,
    evidenceProgressCount: 5,
    blockedEvidenceProgressCount: 4,
    readyEvidenceProgressCount: 1,
    firstRowKey: "verifySourceBundle",
    firstReadyActionRowKey: "verifySourceBundle",
    firstOptionalActionRowKey: "refreshHandoffSnapshot",
    firstManualActionRowKey: "executeInTargetRepo",
    firstBlockedEvidenceProgressRowKey: "verifySourceBundle",
    firstReadyEvidenceProgressRowKey: "refreshHandoffSnapshot",
  });
  assert.deepEqual(report.operatorRunbook.stageHumanLineSummary, {
    count: 5,
    byKeyCount: 5,
    requiredCount: 4,
    optionalCount: 1,
    commandCount: 3,
    manualCount: 2,
    evidenceProgressCount: 5,
    blockedEvidenceProgressCount: 4,
    readyEvidenceProgressCount: 1,
    firstStageKey: "verifySourceBundle",
    firstLine: report.operatorRunbook.stageHumanLines[0],
    firstEvidenceProgressStageKey: "verifySourceBundle",
    firstBlockedEvidenceProgressStageKey: "verifySourceBundle",
  });
  assert.deepEqual(report.operatorRunbook.nextStageHumanLineSummary, {
    stageKey: "verifySourceBundle",
    line: report.operatorRunbook.stageHumanLines[0],
    hasEvidenceProgress: true,
    evidenceProgressStatus: "blocked",
    evidenceProgressLabel: "0/2 complete",
    firstUncheckedEvidenceItemLabel: "Strict bundle-check output",
  });
  assert.match(
    report.operatorRunbook.stageHumanLineByKey.verifySourceBundle,
    /1\. verifySourceBundle .* evidence: 0\/2 complete, Checklist blocked; next: Strict bundle-check output/,
  );
  assert.match(
    report.operatorRunbook.stageHumanLineByKey.refreshHandoffSnapshot,
    /2\. refreshHandoffSnapshot .* evidence: 1\/1 complete, Checklist ready/,
  );
  assert.match(
    report.operatorRunbook.stageHumanLineByKey.executeInTargetRepo,
    /4\. executeInTargetRepo .* evidence: 0\/3 complete, Checklist blocked; next: Target repo changed files/,
  );
  assert.equal(
    report.operatorRunbook.stageSummaryByKey.verifySourceBundle,
    report.operatorRunbook.stages[0].reason,
  );
  assert.equal(
    report.operatorRunbook.stageSummaryByKey.writeEffectiveTaskPrompt,
    report.operatorRunbook.stages[2].reason,
  );
  assert.deepEqual(report.operatorRunbook.stageActionTypeByKey, {
    verifySourceBundle: "run-local-gate",
    refreshHandoffSnapshot: "refresh-local-preview",
    writeEffectiveTaskPrompt: "write-local-output",
    executeInTargetRepo: "manual-target-repo",
    recordEvidence: "manual-evidence",
  });
  assert.deepEqual(report.operatorRunbook.stageActionLabelByKey, {
    verifySourceBundle: "Run strict bundle check",
    refreshHandoffSnapshot: "Refresh strict handoff JSON",
    writeEffectiveTaskPrompt: "Write selected task prompt",
    executeInTargetRepo: "Implement in target repo",
    recordEvidence: "Record verification evidence",
  });
  assert.deepEqual(report.operatorRunbook.stageActionButtonLabelsByKey, {
    verifySourceBundle: "Run Check",
    refreshHandoffSnapshot: "Refresh JSON",
    writeEffectiveTaskPrompt: "Write Prompt",
    executeInTargetRepo: "Open Target Repo",
    recordEvidence: "Record Evidence",
  });
  assert.deepEqual(report.operatorRunbook.stageActionAffordanceByKey, {
    verifySourceBundle: "primary-command-button",
    refreshHandoffSnapshot: "secondary-command-button",
    writeEffectiveTaskPrompt: "local-output-button",
    executeInTargetRepo: "manual-target-repo-step",
    recordEvidence: "manual-evidence-step",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEnabledByKey, {
    verifySourceBundle: true,
    refreshHandoffSnapshot: true,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: false,
    recordEvidence: false,
  });
  assert.deepEqual(report.operatorRunbook.stageActionStatusByKey, {
    verifySourceBundle: "ready",
    refreshHandoffSnapshot: "optional",
    writeEffectiveTaskPrompt: "ready",
    executeInTargetRepo: "manual",
    recordEvidence: "manual",
  });
  assert.deepEqual(report.operatorRunbook.stageActionStatusLabelsByKey, {
    verifySourceBundle: "Ready",
    refreshHandoffSnapshot: "Optional",
    writeEffectiveTaskPrompt: "Ready",
    executeInTargetRepo: "Manual",
    recordEvidence: "Manual",
  });
  assert.deepEqual(report.operatorRunbook.stageActionStatusToneByKey, {
    verifySourceBundle: "success",
    refreshHandoffSnapshot: "neutral",
    writeEffectiveTaskPrompt: "success",
    executeInTargetRepo: "info",
    recordEvidence: "info",
  });
  assert.deepEqual(report.operatorRunbook.stageActionDisabledReasonCodeByKey, {
    verifySourceBundle: "",
    refreshHandoffSnapshot: "",
    writeEffectiveTaskPrompt: "",
    executeInTargetRepo: "manual-target-repo-step",
    recordEvidence: "manual-evidence-step",
  });
  assert.equal(
    report.operatorRunbook.stageActionDisabledReasonByKey.executeInTargetRepo,
    "No local design-ai command is available for this stage; execute the generated prompt inside the target website repo.",
  );
  assert.equal(
    report.operatorRunbook.stageActionDisabledReasonByKey.recordEvidence,
    "No local design-ai command is available for this stage; record evidence after target-repo implementation and verification.",
  );
  assert.deepEqual(report.operatorRunbook.stageActionPrerequisiteKeysByKey, {
    verifySourceBundle: [],
    refreshHandoffSnapshot: [],
    writeEffectiveTaskPrompt: ["verifySourceBundle"],
    executeInTargetRepo: ["verifySourceBundle", "writeEffectiveTaskPrompt"],
    recordEvidence: ["executeInTargetRepo"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionPrerequisiteLabelsByKey.writeEffectiveTaskPrompt, [
    "Verify source bundle integrity",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionPrerequisiteLabelsByKey.executeInTargetRepo, [
    "Verify source bundle integrity",
    "Write effective task handoff prompt",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionPrerequisiteCountByKey, {
    verifySourceBundle: 0,
    refreshHandoffSnapshot: 0,
    writeEffectiveTaskPrompt: 1,
    executeInTargetRepo: 2,
    recordEvidence: 1,
  });
  assert.deepEqual(report.operatorRunbook.stageActionHasPrerequisitesByKey, {
    verifySourceBundle: false,
    refreshHandoffSnapshot: false,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: true,
    recordEvidence: true,
  });
  assert.deepEqual(report.operatorRunbook.stageActionDependencyReasonCodeByKey, {
    verifySourceBundle: "",
    refreshHandoffSnapshot: "",
    writeEffectiveTaskPrompt: "requires-prerequisite-actions",
    executeInTargetRepo: "requires-prerequisite-actions",
    recordEvidence: "requires-prerequisite-actions",
  });
  assert.deepEqual(report.operatorRunbook.stageActionDependencyReasonByKey, {
    verifySourceBundle: "",
    refreshHandoffSnapshot: "",
    writeEffectiveTaskPrompt: "Complete Verify source bundle integrity before writing the selected task prompt.",
    executeInTargetRepo: "Complete Verify source bundle integrity and Write effective task handoff prompt before implementing in the target website repo.",
    recordEvidence: "Complete Execute the task in the target website repo before recording implementation evidence.",
  });
  assert.deepEqual(report.operatorRunbook.stageActionBlockedStageKeysByKey, {
    verifySourceBundle: ["writeEffectiveTaskPrompt", "executeInTargetRepo"],
    refreshHandoffSnapshot: [],
    writeEffectiveTaskPrompt: ["executeInTargetRepo"],
    executeInTargetRepo: ["recordEvidence"],
    recordEvidence: [],
  });
  assert.deepEqual(report.operatorRunbook.stageActionBlockedStageLabelsByKey.executeInTargetRepo, [
    "Record implementation evidence",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionBlockedStageCountByKey, {
    verifySourceBundle: 2,
    refreshHandoffSnapshot: 0,
    writeEffectiveTaskPrompt: 1,
    executeInTargetRepo: 1,
    recordEvidence: 0,
  });
  assert.deepEqual(report.operatorRunbook.stageActionBlocksStagesByKey, {
    verifySourceBundle: true,
    refreshHandoffSnapshot: false,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: true,
    recordEvidence: false,
  });
  assert.deepEqual(report.operatorRunbook.stageActionCompletionCriteriaByKey.verifySourceBundle, [
    "Strict bundle check status is pass.",
    "Checksum and generated-file drift counts are zero.",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionCompletionCriteriaByKey.executeInTargetRepo, [
    "Target website repo has scoped implementation changes for the selected task.",
    "Target repo lint/typecheck/build or equivalent verification has been run.",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionCompletionCriteriaCountByKey, {
    verifySourceBundle: 2,
    refreshHandoffSnapshot: 1,
    writeEffectiveTaskPrompt: 2,
    executeInTargetRepo: 2,
    recordEvidence: 1,
  });
  assert.deepEqual(report.operatorRunbook.stageActionHasCompletionCriteriaByKey, {
    verifySourceBundle: true,
    refreshHandoffSnapshot: true,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: true,
    recordEvidence: true,
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceRequirementsByKey.verifySourceBundle, [
    "Strict bundle-check command output or JSON status.",
    "Bundle digest and zero drift counts.",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceRequirementsByKey.executeInTargetRepo, [
    "Target repo changed file list.",
    "Target repo verification command results.",
    "Viewport and accessibility check notes for affected pages.",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceRequirementCountByKey, {
    verifySourceBundle: 2,
    refreshHandoffSnapshot: 1,
    writeEffectiveTaskPrompt: 2,
    executeInTargetRepo: 3,
    recordEvidence: 1,
  });
  assert.deepEqual(report.operatorRunbook.stageActionRequiresEvidenceByKey, {
    verifySourceBundle: true,
    refreshHandoffSnapshot: true,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: true,
    recordEvidence: true,
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceTargetByKey, {
    verifySourceBundle: "local-command-output",
    refreshHandoffSnapshot: "local-command-output",
    writeEffectiveTaskPrompt: "local-output-file",
    executeInTargetRepo: "target-repo-working-tree",
    recordEvidence: "handoff-evidence-record",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceTargetLabelByKey, {
    verifySourceBundle: "Local command output",
    refreshHandoffSnapshot: "Local command output",
    writeEffectiveTaskPrompt: "Local output file",
    executeInTargetRepo: "Target repo working tree",
    recordEvidence: "Handoff evidence record",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldKeysByKey, {
    verifySourceBundle: ["strictBundleCheckOutput", "bundleDigest"],
    refreshHandoffSnapshot: ["handoffJsonSnapshot"],
    writeEffectiveTaskPrompt: ["promptOutputFile", "selectedTaskId"],
    executeInTargetRepo: [
      "targetRepoChangedFiles",
      "targetRepoVerificationResults",
      "viewportAccessibilityNotes",
    ],
    recordEvidence: ["finalEvidenceRecord", "remainingRisks"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldLabelsByKey.verifySourceBundle, [
    "Strict bundle-check output",
    "Bundle digest",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldPlaceholdersByKey.verifySourceBundle, [
    "Paste the strict bundle-check pass output or JSON status.",
    "Record the bundle digest or checksum summary.",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldRequirementLabelsByKey, {
    verifySourceBundle: ["Required", "Required"],
    refreshHandoffSnapshot: ["Optional"],
    writeEffectiveTaskPrompt: ["Required", "Required"],
    executeInTargetRepo: ["Required", "Required", "Required"],
    recordEvidence: ["Required", "Required"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldAriaLabelsByKey.verifySourceBundle, [
    "Strict bundle-check output evidence (required)",
    "Bundle digest evidence (required)",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldHelpTextsByKey.verifySourceBundle, [
    "Required: paste a passing strict bundle-check result.",
    "Required: record a digest, checksum, or equivalent bundle integrity summary.",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldSectionKeysByKey, {
    verifySourceBundle: ["source-bundle-verification", "source-bundle-verification"],
    refreshHandoffSnapshot: ["handoff-snapshot"],
    writeEffectiveTaskPrompt: ["handoff-prompt-output", "handoff-prompt-output"],
    executeInTargetRepo: [
      "target-repo-changes",
      "target-repo-verification",
      "viewport-accessibility-qa",
    ],
    recordEvidence: ["final-handoff-evidence", "risk-record"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldSectionLabelsByKey.verifySourceBundle, [
    "Source bundle verification",
    "Source bundle verification",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureSectionKeysByKey, {
    verifySourceBundle: ["source-bundle-verification"],
    refreshHandoffSnapshot: ["handoff-snapshot"],
    writeEffectiveTaskPrompt: ["handoff-prompt-output"],
    executeInTargetRepo: [
      "target-repo-changes",
      "target-repo-verification",
      "viewport-accessibility-qa",
    ],
    recordEvidence: ["final-handoff-evidence", "risk-record"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureSectionLabelsByKey.recordEvidence, [
    "Final handoff evidence",
    "Risk record",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureSectionCountByKey, {
    verifySourceBundle: 1,
    refreshHandoffSnapshot: 1,
    writeEffectiveTaskPrompt: 1,
    executeInTargetRepo: 3,
    recordEvidence: 2,
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldPayloadNamespacesByKey, {
    verifySourceBundle: ["sourceBundle", "sourceBundle"],
    refreshHandoffSnapshot: ["handoffSnapshot"],
    writeEffectiveTaskPrompt: ["handoffPrompt", "handoffPrompt"],
    executeInTargetRepo: ["targetRepo", "targetRepo", "targetRepo"],
    recordEvidence: ["handoffEvidence", "handoffEvidence"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldPayloadPathsByKey, {
    verifySourceBundle: [
      "sourceBundle.verification.strictBundleCheckOutput",
      "sourceBundle.verification.bundleDigest",
    ],
    refreshHandoffSnapshot: ["handoffSnapshot.strictJson"],
    writeEffectiveTaskPrompt: ["handoffPrompt.outputFile", "handoffPrompt.selectedTaskId"],
    executeInTargetRepo: [
      "targetRepo.changedFiles",
      "targetRepo.verificationResults",
      "targetRepo.viewportAccessibilityNotes",
    ],
    recordEvidence: ["handoffEvidence.finalRecord", "handoffEvidence.remainingRisks"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCapturePayloadNamespacesByKey, {
    verifySourceBundle: ["sourceBundle"],
    refreshHandoffSnapshot: ["handoffSnapshot"],
    writeEffectiveTaskPrompt: ["handoffPrompt"],
    executeInTargetRepo: ["targetRepo"],
    recordEvidence: ["handoffEvidence"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCapturePayloadNamespaceCountByKey, {
    verifySourceBundle: 1,
    refreshHandoffSnapshot: 1,
    writeEffectiveTaskPrompt: 1,
    executeInTargetRepo: 1,
    recordEvidence: 1,
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCapturePayloadTemplateByKey, {
    verifySourceBundle: {
      sourceBundle: {
        verification: {
          strictBundleCheckOutput: "",
          bundleDigest: "",
        },
      },
    },
    refreshHandoffSnapshot: {
      handoffSnapshot: {
        strictJson: "",
      },
    },
    writeEffectiveTaskPrompt: {
      handoffPrompt: {
        outputFile: "",
        selectedTaskId: "",
      },
    },
    executeInTargetRepo: {
      targetRepo: {
        changedFiles: [],
        verificationResults: "",
        viewportAccessibilityNotes: "",
      },
    },
    recordEvidence: {
      handoffEvidence: {
        finalRecord: "",
        remainingRisks: "",
      },
    },
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCapturePayloadFlatTemplateByKey, {
    verifySourceBundle: {
      "sourceBundle.verification.strictBundleCheckOutput": "",
      "sourceBundle.verification.bundleDigest": "",
    },
    refreshHandoffSnapshot: {
      "handoffSnapshot.strictJson": "",
    },
    writeEffectiveTaskPrompt: {
      "handoffPrompt.outputFile": "",
      "handoffPrompt.selectedTaskId": "",
    },
    executeInTargetRepo: {
      "targetRepo.changedFiles": [],
      "targetRepo.verificationResults": "",
      "targetRepo.viewportAccessibilityNotes": "",
    },
    recordEvidence: {
      "handoffEvidence.finalRecord": "",
      "handoffEvidence.remainingRisks": "",
    },
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCapturePayloadBindingsByKey.verifySourceBundle, [
    {
      key: "strictBundleCheckOutput",
      label: "Strict bundle-check output",
      payloadNamespace: "sourceBundle",
      payloadPath: "sourceBundle.verification.strictBundleCheckOutput",
      inputType: "textarea",
      valueShape: "long-text",
      acceptsMultiple: false,
      required: true,
      requirementLabel: "Required",
      emptyValue: "",
      validationRule: "non-empty-text",
      minLength: 20,
      sectionKey: "source-bundle-verification",
      sectionLabel: "Source bundle verification",
      ariaLabel: "Strict bundle-check output evidence (required)",
    },
    {
      key: "bundleDigest",
      label: "Bundle digest",
      payloadNamespace: "sourceBundle",
      payloadPath: "sourceBundle.verification.bundleDigest",
      inputType: "text",
      valueShape: "short-text",
      acceptsMultiple: false,
      required: true,
      requirementLabel: "Required",
      emptyValue: "",
      validationRule: "checksum-or-digest-text",
      minLength: 8,
      sectionKey: "source-bundle-verification",
      sectionLabel: "Source bundle verification",
      ariaLabel: "Bundle digest evidence (required)",
    },
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCapturePayloadBindingsByKey.executeInTargetRepo[0], {
    key: "targetRepoChangedFiles",
    label: "Target repo changed files",
    payloadNamespace: "targetRepo",
    payloadPath: "targetRepo.changedFiles",
    inputType: "list",
    valueShape: "string-list",
    acceptsMultiple: true,
    required: true,
    requirementLabel: "Required",
    emptyValue: [],
    validationRule: "non-empty-file-list",
    minLength: 1,
    sectionKey: "target-repo-changes",
    sectionLabel: "Target repo changes",
    ariaLabel: "Target repo changed files evidence (required)",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureValidationSpecsByKey.verifySourceBundle, [
    {
      key: "strictBundleCheckOutput",
      label: "Strict bundle-check output",
      rule: "non-empty-text",
      severity: "error",
      required: true,
      allowsEmpty: false,
      minLength: 20,
      valueShape: "long-text",
      acceptsMultiple: false,
      emptyValue: "",
      message: "Required: paste a passing strict bundle-check result.",
      failureMessage: "Provide strict bundle-check output before marking this action complete.",
    },
    {
      key: "bundleDigest",
      label: "Bundle digest",
      rule: "checksum-or-digest-text",
      severity: "error",
      required: true,
      allowsEmpty: false,
      minLength: 8,
      valueShape: "short-text",
      acceptsMultiple: false,
      emptyValue: "",
      message: "Required: record a digest, checksum, or equivalent bundle integrity summary.",
      failureMessage: "Provide bundle digest before marking this action complete.",
    },
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureValidationSpecsByKey.refreshHandoffSnapshot[0], {
    key: "handoffJsonSnapshot",
    label: "Strict handoff JSON snapshot",
    rule: "optional-json-snapshot",
    severity: "info",
    required: false,
    allowsEmpty: true,
    minLength: 0,
    valueShape: "long-text",
    acceptsMultiple: false,
    emptyValue: "",
    message: "Optional: paste the refreshed strict handoff JSON snapshot when available.",
    failureMessage: "Optional: provide strict handoff json snapshot when available.",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureValidationSpecsByKey.executeInTargetRepo[0], {
    key: "targetRepoChangedFiles",
    label: "Target repo changed files",
    rule: "non-empty-file-list",
    severity: "error",
    required: true,
    allowsEmpty: false,
    minLength: 1,
    valueShape: "string-list",
    acceptsMultiple: true,
    emptyValue: [],
    message: "Required: list at least one changed target-repo file or a no-change justification.",
    failureMessage: "Provide target repo changed files before marking this action complete.",
  });
  const expectedNextInitialValidationStates = [
    {
      key: "strictBundleCheckOutput",
      label: "Strict bundle-check output",
      rule: "non-empty-text",
      status: "missing-required",
      statusLabel: "Missing required",
      statusTone: "danger",
      iconName: "alert-circle",
      actionLabel: "Provide evidence",
      helperText: "Required before completion",
      valid: false,
      blocking: true,
      severity: "error",
      required: true,
      allowsEmpty: false,
      touched: false,
      dirty: false,
      valuePresent: false,
      valueLength: 0,
      minLength: 20,
      valueShape: "long-text",
      acceptsMultiple: false,
      emptyValue: "",
      payloadPath: "sourceBundle.verification.strictBundleCheckOutput",
      message: "Provide strict bundle-check output before marking this action complete.",
    },
    {
      key: "bundleDigest",
      label: "Bundle digest",
      rule: "checksum-or-digest-text",
      status: "missing-required",
      statusLabel: "Missing required",
      statusTone: "danger",
      iconName: "alert-circle",
      actionLabel: "Provide evidence",
      helperText: "Required before completion",
      valid: false,
      blocking: true,
      severity: "error",
      required: true,
      allowsEmpty: false,
      touched: false,
      dirty: false,
      valuePresent: false,
      valueLength: 0,
      minLength: 8,
      valueShape: "short-text",
      acceptsMultiple: false,
      emptyValue: "",
      payloadPath: "sourceBundle.verification.bundleDigest",
      message: "Provide bundle digest before marking this action complete.",
    },
  ];
  assert.deepEqual(
    report.operatorRunbook.stageActionEvidenceCaptureInitialValidationStatesByKey.verifySourceBundle,
    expectedNextInitialValidationStates,
  );
  const expectedNextInitialValidationDisplayMetadata = [
    {
      key: "strictBundleCheckOutput",
      label: "Strict bundle-check output",
      status: "missing-required",
      statusLabel: "Missing required",
      statusTone: "danger",
      iconName: "alert-circle",
      actionLabel: "Provide evidence",
      helperText: "Required before completion",
      blocking: true,
      required: true,
      message: "Provide strict bundle-check output before marking this action complete.",
    },
    {
      key: "bundleDigest",
      label: "Bundle digest",
      status: "missing-required",
      statusLabel: "Missing required",
      statusTone: "danger",
      iconName: "alert-circle",
      actionLabel: "Provide evidence",
      helperText: "Required before completion",
      blocking: true,
      required: true,
      message: "Provide bundle digest before marking this action complete.",
    },
  ];
  const expectedNextInitialValidationChecklist = expectedNextInitialValidationStates.map((state) => ({
    key: state.key,
    label: state.label,
    status: state.status,
    statusLabel: state.statusLabel,
    statusTone: state.statusTone,
    iconName: state.iconName,
    actionLabel: state.actionLabel,
    helperText: state.helperText,
    required: state.required,
    blocking: state.blocking,
    completionBlocking: state.blocking,
    checkedInitially: state.valid,
    disabled: false,
    message: state.message,
    payloadPath: state.payloadPath,
  }));
  const buildExpectedInitialValidationChecklistSummary = (checklist) => {
    const checkedItems = checklist.filter((item) => item.checkedInitially);
    const uncheckedItems = checklist.filter((item) => !item.checkedInitially);
    const blockingItems = checklist.filter((item) => item.completionBlocking);
    const blockingUncheckedItems = checklist.filter((item) => item.completionBlocking && !item.checkedInitially);
    const firstUncheckedItem = uncheckedItems[0] || {};
    const status = blockingUncheckedItems.length > 0 ? "blocked" : "ready";
    return {
      status,
      statusLabel: status === "blocked" ? "Checklist blocked" : "Checklist ready",
      statusTone: status === "blocked" ? "danger" : "success",
      iconName: status === "blocked" ? "list-x" : "list-checks",
      actionLabel: status === "blocked" ? "Complete required evidence" : "Continue",
      helperText: status === "blocked"
        ? `${blockingUncheckedItems.length} required checklist item(s) need evidence before completion.`
        : "No required checklist items are unchecked on first render.",
      itemCount: checklist.length,
      checkedCount: checkedItems.length,
      uncheckedCount: uncheckedItems.length,
      requiredCount: checklist.filter((item) => item.required).length,
      optionalCount: checklist.filter((item) => !item.required).length,
      blockingCount: blockingItems.length,
      blockingUncheckedCount: blockingUncheckedItems.length,
      nonBlockingCount: checklist.filter((item) => !item.completionBlocking).length,
      completionPercent: checklist.length > 0 ? Math.round((checkedItems.length / checklist.length) * 100) : 100,
      progressLabel: `${checkedItems.length}/${checklist.length} complete`,
      allCheckedInitially: uncheckedItems.length === 0,
      hasUncheckedItems: uncheckedItems.length > 0,
      hasBlockingUncheckedItems: blockingUncheckedItems.length > 0,
      canCompleteInitially: blockingUncheckedItems.length === 0,
      firstUncheckedItemKey: firstUncheckedItem.key || "",
      firstUncheckedItemLabel: firstUncheckedItem.label || "",
      firstUncheckedItemMessage: firstUncheckedItem.message || "",
    };
  };
  const expectedNextInitialValidationChecklistSummary = buildExpectedInitialValidationChecklistSummary(
    expectedNextInitialValidationChecklist,
  );
  assert.deepEqual(
    report.operatorRunbook.stageActionEvidenceCaptureInitialValidationDisplayMetadataByKey.verifySourceBundle,
    expectedNextInitialValidationDisplayMetadata,
  );
  assert.deepEqual(
    report.operatorRunbook.stageActionEvidenceCaptureInitialValidationChecklistByKey.verifySourceBundle,
    expectedNextInitialValidationChecklist,
  );
  assert.deepEqual(
    report.operatorRunbook.stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey.verifySourceBundle,
    expectedNextInitialValidationChecklistSummary,
  );
  const expectedNextInitialValidationSummary = {
    status: "blocked",
    statusLabel: "Blocked by required evidence",
    statusTone: "danger",
    iconName: "alert-circle",
    actionLabel: "Provide required evidence",
    helperText: "2 required evidence field(s) need input before completion.",
    fieldCount: 2,
    requiredCount: 2,
    optionalCount: 0,
    validCount: 0,
    invalidCount: 2,
    blockingCount: 2,
    nonBlockingCount: 0,
    missingRequiredCount: 2,
    optionalEmptyCount: 0,
    dangerDisplayCount: 2,
    infoDisplayCount: 0,
    allFieldsPristine: true,
    canCompleteInitially: false,
    firstBlockingFieldKey: "strictBundleCheckOutput",
    firstBlockingFieldLabel: "Strict bundle-check output",
    firstBlockingMessage: "Provide strict bundle-check output before marking this action complete.",
  };
  assert.deepEqual(
    report.operatorRunbook.stageActionEvidenceCaptureInitialValidationSummaryByKey.verifySourceBundle,
    expectedNextInitialValidationSummary,
  );
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureInitialValidationStatesByKey.refreshHandoffSnapshot[0], {
    key: "handoffJsonSnapshot",
    label: "Strict handoff JSON snapshot",
    rule: "optional-json-snapshot",
    status: "optional-empty",
    statusLabel: "Optional empty",
    statusTone: "info",
    iconName: "info",
    actionLabel: "Add optional evidence",
    helperText: "Can remain empty",
    valid: true,
    blocking: false,
    severity: "info",
    required: false,
    allowsEmpty: true,
    touched: false,
    dirty: false,
    valuePresent: false,
    valueLength: 0,
    minLength: 0,
    valueShape: "long-text",
    acceptsMultiple: false,
    emptyValue: "",
    payloadPath: "handoffSnapshot.strictJson",
    message: "Optional: paste the refreshed strict handoff JSON snapshot when available.",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureInitialValidationDisplayMetadataByKey.refreshHandoffSnapshot[0], {
    key: "handoffJsonSnapshot",
    label: "Strict handoff JSON snapshot",
    status: "optional-empty",
    statusLabel: "Optional empty",
    statusTone: "info",
    iconName: "info",
    actionLabel: "Add optional evidence",
    helperText: "Can remain empty",
    blocking: false,
    required: false,
    message: "Optional: paste the refreshed strict handoff JSON snapshot when available.",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureInitialValidationChecklistByKey.refreshHandoffSnapshot[0], {
    key: "handoffJsonSnapshot",
    label: "Strict handoff JSON snapshot",
    status: "optional-empty",
    statusLabel: "Optional empty",
    statusTone: "info",
    iconName: "info",
    actionLabel: "Add optional evidence",
    helperText: "Can remain empty",
    required: false,
    blocking: false,
    completionBlocking: false,
    checkedInitially: true,
    disabled: false,
    message: "Optional: paste the refreshed strict handoff JSON snapshot when available.",
    payloadPath: "handoffSnapshot.strictJson",
  });
  assert.deepEqual(
    report.operatorRunbook.stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey.refreshHandoffSnapshot,
    buildExpectedInitialValidationChecklistSummary(
      report.operatorRunbook.stageActionEvidenceCaptureInitialValidationChecklistByKey.refreshHandoffSnapshot,
    ),
  );
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureInitialValidationSummaryByKey.refreshHandoffSnapshot, {
    status: "ready",
    statusLabel: "Ready for completion",
    statusTone: "success",
    iconName: "check-circle",
    actionLabel: "Continue",
    helperText: "No required evidence is missing on first render.",
    fieldCount: 1,
    requiredCount: 0,
    optionalCount: 1,
    validCount: 1,
    invalidCount: 0,
    blockingCount: 0,
    nonBlockingCount: 1,
    missingRequiredCount: 0,
    optionalEmptyCount: 1,
    dangerDisplayCount: 0,
    infoDisplayCount: 1,
    allFieldsPristine: true,
    canCompleteInitially: true,
    firstBlockingFieldKey: "",
    firstBlockingFieldLabel: "",
    firstBlockingMessage: "",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureInitialValidationStatesByKey.executeInTargetRepo[0], {
    key: "targetRepoChangedFiles",
    label: "Target repo changed files",
    rule: "non-empty-file-list",
    status: "missing-required",
    statusLabel: "Missing required",
    statusTone: "danger",
    iconName: "alert-circle",
    actionLabel: "Provide evidence",
    helperText: "Required before completion",
    valid: false,
    blocking: true,
    severity: "error",
    required: true,
    allowsEmpty: false,
    touched: false,
    dirty: false,
    valuePresent: false,
    valueLength: 0,
    minLength: 1,
    valueShape: "string-list",
    acceptsMultiple: true,
    emptyValue: [],
    payloadPath: "targetRepo.changedFiles",
    message: "Provide target repo changed files before marking this action complete.",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureInitialValidationDisplayMetadataByKey.executeInTargetRepo[0], {
    key: "targetRepoChangedFiles",
    label: "Target repo changed files",
    status: "missing-required",
    statusLabel: "Missing required",
    statusTone: "danger",
    iconName: "alert-circle",
    actionLabel: "Provide evidence",
    helperText: "Required before completion",
    blocking: true,
    required: true,
    message: "Provide target repo changed files before marking this action complete.",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureInitialValidationChecklistByKey.executeInTargetRepo[0], {
    key: "targetRepoChangedFiles",
    label: "Target repo changed files",
    status: "missing-required",
    statusLabel: "Missing required",
    statusTone: "danger",
    iconName: "alert-circle",
    actionLabel: "Provide evidence",
    helperText: "Required before completion",
    required: true,
    blocking: true,
    completionBlocking: true,
    checkedInitially: false,
    disabled: false,
    message: "Provide target repo changed files before marking this action complete.",
    payloadPath: "targetRepo.changedFiles",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey.executeInTargetRepo, {
    status: "blocked",
    statusLabel: "Checklist blocked",
    statusTone: "danger",
    iconName: "list-x",
    actionLabel: "Complete required evidence",
    helperText: "3 required checklist item(s) need evidence before completion.",
    itemCount: 3,
    checkedCount: 0,
    uncheckedCount: 3,
    requiredCount: 3,
    optionalCount: 0,
    blockingCount: 3,
    blockingUncheckedCount: 3,
    nonBlockingCount: 0,
    completionPercent: 0,
    progressLabel: "0/3 complete",
    allCheckedInitially: false,
    hasUncheckedItems: true,
    hasBlockingUncheckedItems: true,
    canCompleteInitially: false,
    firstUncheckedItemKey: "targetRepoChangedFiles",
    firstUncheckedItemLabel: "Target repo changed files",
    firstUncheckedItemMessage: "Provide target repo changed files before marking this action complete.",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureInitialValidationSummaryByKey.executeInTargetRepo, {
    status: "blocked",
    statusLabel: "Blocked by required evidence",
    statusTone: "danger",
    iconName: "alert-circle",
    actionLabel: "Provide required evidence",
    helperText: "3 required evidence field(s) need input before completion.",
    fieldCount: 3,
    requiredCount: 3,
    optionalCount: 0,
    validCount: 0,
    invalidCount: 3,
    blockingCount: 3,
    nonBlockingCount: 0,
    missingRequiredCount: 3,
    optionalEmptyCount: 0,
    dangerDisplayCount: 3,
    infoDisplayCount: 0,
    allFieldsPristine: true,
    canCompleteInitially: false,
    firstBlockingFieldKey: "targetRepoChangedFiles",
    firstBlockingFieldLabel: "Target repo changed files",
    firstBlockingMessage: "Provide target repo changed files before marking this action complete.",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldInputTypesByKey, {
    verifySourceBundle: ["textarea", "text"],
    refreshHandoffSnapshot: ["textarea"],
    writeEffectiveTaskPrompt: ["file-path", "text"],
    executeInTargetRepo: ["list", "textarea", "textarea"],
    recordEvidence: ["textarea", "textarea"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldValueShapesByKey, {
    verifySourceBundle: ["long-text", "short-text"],
    refreshHandoffSnapshot: ["long-text"],
    writeEffectiveTaskPrompt: ["file-path", "short-text"],
    executeInTargetRepo: ["string-list", "long-text", "long-text"],
    recordEvidence: ["long-text", "long-text"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldAcceptsMultipleByKey, {
    verifySourceBundle: [false, false],
    refreshHandoffSnapshot: [false],
    writeEffectiveTaskPrompt: [false, false],
    executeInTargetRepo: [true, false, false],
    recordEvidence: [false, false],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldDefaultValuesByKey, {
    verifySourceBundle: ["", ""],
    refreshHandoffSnapshot: [""],
    writeEffectiveTaskPrompt: ["", ""],
    executeInTargetRepo: [[], "", ""],
    recordEvidence: ["", ""],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldEmptyValuesByKey, {
    verifySourceBundle: ["", ""],
    refreshHandoffSnapshot: [""],
    writeEffectiveTaskPrompt: ["", ""],
    executeInTargetRepo: [[], "", ""],
    recordEvidence: ["", ""],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldValidationRulesByKey, {
    verifySourceBundle: ["non-empty-text", "checksum-or-digest-text"],
    refreshHandoffSnapshot: ["optional-json-snapshot"],
    writeEffectiveTaskPrompt: ["local-markdown-file-path", "task-id"],
    executeInTargetRepo: ["non-empty-file-list", "verification-results", "viewport-accessibility-notes"],
    recordEvidence: ["final-evidence-record", "risk-notes"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldMinLengthsByKey, {
    verifySourceBundle: [20, 8],
    refreshHandoffSnapshot: [0],
    writeEffectiveTaskPrompt: [12, 5],
    executeInTargetRepo: [1, 20, 20],
    recordEvidence: [30, 10],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldExamplesByKey.verifySourceBundle, [
    "Status: pass; checksumFailures: 0; generatedFailures: 0",
    "7685113af4744990fadf301b220b4739066e5f6ec2c40857825211e1167241aa",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldValidationHintsByKey.verifySourceBundle, [
    "Required: paste a passing strict bundle-check result.",
    "Required: record a digest, checksum, or equivalent bundle integrity summary.",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionRequiredEvidenceCaptureFieldKeysByKey, {
    verifySourceBundle: ["strictBundleCheckOutput", "bundleDigest"],
    refreshHandoffSnapshot: [],
    writeEffectiveTaskPrompt: ["promptOutputFile", "selectedTaskId"],
    executeInTargetRepo: [
      "targetRepoChangedFiles",
      "targetRepoVerificationResults",
      "viewportAccessibilityNotes",
    ],
    recordEvidence: ["finalEvidenceRecord", "remainingRisks"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionOptionalEvidenceCaptureFieldKeysByKey, {
    verifySourceBundle: [],
    refreshHandoffSnapshot: ["handoffJsonSnapshot"],
    writeEffectiveTaskPrompt: [],
    executeInTargetRepo: [],
    recordEvidence: [],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldCountByKey, {
    verifySourceBundle: 2,
    refreshHandoffSnapshot: 1,
    writeEffectiveTaskPrompt: 2,
    executeInTargetRepo: 3,
    recordEvidence: 2,
  });
  assert.deepEqual(report.operatorRunbook.stageActionRequiredEvidenceCaptureFieldCountByKey, {
    verifySourceBundle: 2,
    refreshHandoffSnapshot: 0,
    writeEffectiveTaskPrompt: 2,
    executeInTargetRepo: 3,
    recordEvidence: 2,
  });
  assert.deepEqual(report.operatorRunbook.stageActionOptionalEvidenceCaptureFieldCountByKey, {
    verifySourceBundle: 0,
    refreshHandoffSnapshot: 1,
    writeEffectiveTaskPrompt: 0,
    executeInTargetRepo: 0,
    recordEvidence: 0,
  });
  assert.deepEqual(report.operatorRunbook.stageActionHasEvidenceCaptureFieldsByKey, {
    verifySourceBundle: true,
    refreshHandoffSnapshot: true,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: true,
    recordEvidence: true,
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldsByKey.verifySourceBundle[0], {
    key: "strictBundleCheckOutput",
    label: "Strict bundle-check output",
    inputType: "textarea",
    required: true,
    evidenceTarget: "local-command-output",
    placeholder: "Paste the strict bundle-check pass output or JSON status.",
    validationRule: "non-empty-text",
    minLength: 20,
    example: "Status: pass; checksumFailures: 0; generatedFailures: 0",
    validationHint: "Required: paste a passing strict bundle-check result.",
    valueShape: "long-text",
    acceptsMultiple: false,
    defaultValue: "",
    emptyValue: "",
    requirementLabel: "Required",
    ariaLabel: "Strict bundle-check output evidence (required)",
    helpText: "Required: paste a passing strict bundle-check result.",
    sectionKey: "source-bundle-verification",
    sectionLabel: "Source bundle verification",
    payloadNamespace: "sourceBundle",
    payloadPath: "sourceBundle.verification.strictBundleCheckOutput",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldsByKey.executeInTargetRepo[2], {
    key: "viewportAccessibilityNotes",
    label: "Viewport and accessibility notes",
    inputType: "textarea",
    required: true,
    evidenceTarget: "target-repo-working-tree",
    placeholder: "Record desktop/tablet/mobile checks, keyboard focus, contrast, and screen-reader notes.",
    validationRule: "viewport-accessibility-notes",
    minLength: 20,
    example: "desktop/tablet/mobile checked; focus visible; contrast AA",
    validationHint: "Required: document viewport coverage plus keyboard, contrast, and screen-reader notes.",
    valueShape: "long-text",
    acceptsMultiple: false,
    defaultValue: "",
    emptyValue: "",
    requirementLabel: "Required",
    ariaLabel: "Viewport and accessibility notes evidence (required)",
    helpText: "Required: document viewport coverage plus keyboard, contrast, and screen-reader notes.",
    sectionKey: "viewport-accessibility-qa",
    sectionLabel: "Viewport and accessibility QA",
    payloadNamespace: "targetRepo",
    payloadPath: "targetRepo.viewportAccessibilityNotes",
  });
  assert.equal(
    report.operatorRunbook.stageActionInstructionsByKey.verifySourceBundle,
    "Run the strict local bundle check and resolve any checksum or generated-file drift before handoff.",
  );
  assert.equal(
    report.operatorRunbook.stageActionInstructionsByKey.writeEffectiveTaskPrompt,
    "Write the selected task prompt to a local Markdown file before switching into the target website repo.",
  );
  assert.equal(
    report.operatorRunbook.stageActionInstructionsByKey.executeInTargetRepo,
    "Manual: open the generated prompt in the target website repo, inspect architecture, implement the scoped task, and run target-repo verification.",
  );
  assert.deepEqual(report.operatorRunbook.stageActionRows.map((stage) => ({
    key: stage.key,
    actionType: stage.actionType,
    actionLabel: stage.actionLabel,
    actionButtonLabel: stage.actionButtonLabel,
    actionAffordance: stage.actionAffordance,
    actionEnabled: stage.actionEnabled,
    actionStatus: stage.actionStatus,
    actionStatusLabel: stage.actionStatusLabel,
    actionStatusTone: stage.actionStatusTone,
    actionDisabledReasonCode: stage.actionDisabledReasonCode,
    actionPrerequisiteKeys: stage.actionPrerequisiteKeys,
    actionPrerequisiteCount: stage.actionPrerequisiteCount,
    actionHasPrerequisites: stage.actionHasPrerequisites,
    actionDependencyReasonCode: stage.actionDependencyReasonCode,
    actionBlockedStageKeys: stage.actionBlockedStageKeys,
    actionBlockedStageCount: stage.actionBlockedStageCount,
    actionBlocksStages: stage.actionBlocksStages,
    actionCompletionCriteriaCount: stage.actionCompletionCriteriaCount,
    actionHasCompletionCriteria: stage.actionHasCompletionCriteria,
    actionEvidenceRequirementCount: stage.actionEvidenceRequirementCount,
    actionRequiresEvidence: stage.actionRequiresEvidence,
    actionEvidenceTarget: stage.actionEvidenceTarget,
    actionEvidenceTargetLabel: stage.actionEvidenceTargetLabel,
    actionEvidenceCaptureFieldKeys: stage.actionEvidenceCaptureFieldKeys,
    actionEvidenceCaptureFieldLabels: stage.actionEvidenceCaptureFieldLabels,
    actionEvidenceCaptureFieldPlaceholders: stage.actionEvidenceCaptureFieldPlaceholders,
    actionEvidenceCaptureFieldRequirementLabels: stage.actionEvidenceCaptureFieldRequirementLabels,
    actionEvidenceCaptureFieldAriaLabels: stage.actionEvidenceCaptureFieldAriaLabels,
    actionEvidenceCaptureFieldHelpTexts: stage.actionEvidenceCaptureFieldHelpTexts,
    actionEvidenceCaptureFieldSectionKeys: stage.actionEvidenceCaptureFieldSectionKeys,
    actionEvidenceCaptureFieldSectionLabels: stage.actionEvidenceCaptureFieldSectionLabels,
    actionEvidenceCaptureSectionKeys: stage.actionEvidenceCaptureSectionKeys,
    actionEvidenceCaptureSectionLabels: stage.actionEvidenceCaptureSectionLabels,
    actionEvidenceCaptureSectionCount: stage.actionEvidenceCaptureSectionCount,
    actionEvidenceCaptureFieldPayloadNamespaces: stage.actionEvidenceCaptureFieldPayloadNamespaces,
    actionEvidenceCaptureFieldPayloadPaths: stage.actionEvidenceCaptureFieldPayloadPaths,
    actionEvidenceCapturePayloadNamespaces: stage.actionEvidenceCapturePayloadNamespaces,
    actionEvidenceCapturePayloadNamespaceCount: stage.actionEvidenceCapturePayloadNamespaceCount,
    actionEvidenceCapturePayloadTemplate: stage.actionEvidenceCapturePayloadTemplate,
    actionEvidenceCapturePayloadFlatTemplate: stage.actionEvidenceCapturePayloadFlatTemplate,
    actionEvidenceCaptureFieldInputTypes: stage.actionEvidenceCaptureFieldInputTypes,
    actionEvidenceCaptureFieldValueShapes: stage.actionEvidenceCaptureFieldValueShapes,
    actionEvidenceCaptureFieldAcceptsMultiple: stage.actionEvidenceCaptureFieldAcceptsMultiple,
    actionEvidenceCaptureFieldDefaultValues: stage.actionEvidenceCaptureFieldDefaultValues,
    actionEvidenceCaptureFieldEmptyValues: stage.actionEvidenceCaptureFieldEmptyValues,
    actionEvidenceCaptureFieldValidationRules: stage.actionEvidenceCaptureFieldValidationRules,
    actionEvidenceCaptureFieldMinLengths: stage.actionEvidenceCaptureFieldMinLengths,
    actionRequiredEvidenceCaptureFieldKeys: stage.actionRequiredEvidenceCaptureFieldKeys,
    actionOptionalEvidenceCaptureFieldKeys: stage.actionOptionalEvidenceCaptureFieldKeys,
    actionEvidenceCaptureFieldCount: stage.actionEvidenceCaptureFieldCount,
    actionRequiredEvidenceCaptureFieldCount: stage.actionRequiredEvidenceCaptureFieldCount,
    actionOptionalEvidenceCaptureFieldCount: stage.actionOptionalEvidenceCaptureFieldCount,
    actionHasEvidenceCaptureFields: stage.actionHasEvidenceCaptureFields,
    required: stage.required,
    runPolicy: stage.runPolicy,
    safetyLevel: stage.safetyLevel,
    commandCount: stage.commandCount,
    outputFiles: stage.outputFiles,
    manual: stage.manual,
    writesLocalFile: stage.writesLocalFile,
    externalCalls: stage.externalCalls,
    targetRepoMutation: stage.targetRepoMutation,
  })), [
    {
      key: "verifySourceBundle",
      actionType: "run-local-gate",
      actionLabel: "Run strict bundle check",
      actionButtonLabel: "Run Check",
      actionAffordance: "primary-command-button",
      actionEnabled: true,
      actionStatus: "ready",
      actionStatusLabel: "Ready",
      actionStatusTone: "success",
      actionDisabledReasonCode: "",
      actionPrerequisiteKeys: [],
      actionPrerequisiteCount: 0,
      actionHasPrerequisites: false,
      actionDependencyReasonCode: "",
      actionBlockedStageKeys: ["writeEffectiveTaskPrompt", "executeInTargetRepo"],
      actionBlockedStageCount: 2,
      actionBlocksStages: true,
      actionCompletionCriteriaCount: 2,
      actionHasCompletionCriteria: true,
      actionEvidenceRequirementCount: 2,
      actionRequiresEvidence: true,
      actionEvidenceTarget: "local-command-output",
      actionEvidenceTargetLabel: "Local command output",
      actionEvidenceCaptureFieldKeys: ["strictBundleCheckOutput", "bundleDigest"],
      actionEvidenceCaptureFieldLabels: ["Strict bundle-check output", "Bundle digest"],
      actionEvidenceCaptureFieldPlaceholders: [
        "Paste the strict bundle-check pass output or JSON status.",
        "Record the bundle digest or checksum summary.",
      ],
      actionEvidenceCaptureFieldRequirementLabels: ["Required", "Required"],
      actionEvidenceCaptureFieldAriaLabels: [
        "Strict bundle-check output evidence (required)",
        "Bundle digest evidence (required)",
      ],
      actionEvidenceCaptureFieldHelpTexts: [
        "Required: paste a passing strict bundle-check result.",
        "Required: record a digest, checksum, or equivalent bundle integrity summary.",
      ],
      actionEvidenceCaptureFieldSectionKeys: ["source-bundle-verification", "source-bundle-verification"],
      actionEvidenceCaptureFieldSectionLabels: [
        "Source bundle verification",
        "Source bundle verification",
      ],
      actionEvidenceCaptureSectionKeys: ["source-bundle-verification"],
      actionEvidenceCaptureSectionLabels: ["Source bundle verification"],
      actionEvidenceCaptureSectionCount: 1,
      actionEvidenceCaptureFieldPayloadNamespaces: ["sourceBundle", "sourceBundle"],
      actionEvidenceCaptureFieldPayloadPaths: [
        "sourceBundle.verification.strictBundleCheckOutput",
        "sourceBundle.verification.bundleDigest",
      ],
      actionEvidenceCapturePayloadNamespaces: ["sourceBundle"],
      actionEvidenceCapturePayloadNamespaceCount: 1,
      actionEvidenceCapturePayloadTemplate: {
        sourceBundle: {
          verification: {
            strictBundleCheckOutput: "",
            bundleDigest: "",
          },
        },
      },
      actionEvidenceCapturePayloadFlatTemplate: {
        "sourceBundle.verification.strictBundleCheckOutput": "",
        "sourceBundle.verification.bundleDigest": "",
      },
      actionEvidenceCaptureFieldInputTypes: ["textarea", "text"],
      actionEvidenceCaptureFieldValueShapes: ["long-text", "short-text"],
      actionEvidenceCaptureFieldAcceptsMultiple: [false, false],
      actionEvidenceCaptureFieldDefaultValues: ["", ""],
      actionEvidenceCaptureFieldEmptyValues: ["", ""],
      actionEvidenceCaptureFieldValidationRules: ["non-empty-text", "checksum-or-digest-text"],
      actionEvidenceCaptureFieldMinLengths: [20, 8],
      actionRequiredEvidenceCaptureFieldKeys: ["strictBundleCheckOutput", "bundleDigest"],
      actionOptionalEvidenceCaptureFieldKeys: [],
      actionEvidenceCaptureFieldCount: 2,
      actionRequiredEvidenceCaptureFieldCount: 2,
      actionOptionalEvidenceCaptureFieldCount: 0,
      actionHasEvidenceCaptureFields: true,
      required: true,
      runPolicy: "read-only",
      safetyLevel: "local-read-only",
      commandCount: 1,
      outputFiles: [],
      manual: false,
      writesLocalFile: false,
      externalCalls: false,
      targetRepoMutation: false,
    },
    {
      key: "refreshHandoffSnapshot",
      actionType: "refresh-local-preview",
      actionLabel: "Refresh strict handoff JSON",
      actionButtonLabel: "Refresh JSON",
      actionAffordance: "secondary-command-button",
      actionEnabled: true,
      actionStatus: "optional",
      actionStatusLabel: "Optional",
      actionStatusTone: "neutral",
      actionDisabledReasonCode: "",
      actionPrerequisiteKeys: [],
      actionPrerequisiteCount: 0,
      actionHasPrerequisites: false,
      actionDependencyReasonCode: "",
      actionBlockedStageKeys: [],
      actionBlockedStageCount: 0,
      actionBlocksStages: false,
      actionCompletionCriteriaCount: 1,
      actionHasCompletionCriteria: true,
      actionEvidenceRequirementCount: 1,
      actionRequiresEvidence: true,
      actionEvidenceTarget: "local-command-output",
      actionEvidenceTargetLabel: "Local command output",
      actionEvidenceCaptureFieldKeys: ["handoffJsonSnapshot"],
      actionEvidenceCaptureFieldLabels: ["Strict handoff JSON snapshot"],
      actionEvidenceCaptureFieldPlaceholders: [
        "Paste or link the refreshed strict handoff JSON snapshot when used.",
      ],
      actionEvidenceCaptureFieldRequirementLabels: ["Optional"],
      actionEvidenceCaptureFieldAriaLabels: [
        "Strict handoff JSON snapshot evidence (optional)",
      ],
      actionEvidenceCaptureFieldHelpTexts: [
        "Optional: paste the refreshed strict handoff JSON snapshot when available.",
      ],
      actionEvidenceCaptureFieldSectionKeys: ["handoff-snapshot"],
      actionEvidenceCaptureFieldSectionLabels: ["Handoff snapshot"],
      actionEvidenceCaptureSectionKeys: ["handoff-snapshot"],
      actionEvidenceCaptureSectionLabels: ["Handoff snapshot"],
      actionEvidenceCaptureSectionCount: 1,
      actionEvidenceCaptureFieldPayloadNamespaces: ["handoffSnapshot"],
      actionEvidenceCaptureFieldPayloadPaths: ["handoffSnapshot.strictJson"],
      actionEvidenceCapturePayloadNamespaces: ["handoffSnapshot"],
      actionEvidenceCapturePayloadNamespaceCount: 1,
      actionEvidenceCapturePayloadTemplate: {
        handoffSnapshot: {
          strictJson: "",
        },
      },
      actionEvidenceCapturePayloadFlatTemplate: {
        "handoffSnapshot.strictJson": "",
      },
      actionEvidenceCaptureFieldInputTypes: ["textarea"],
      actionEvidenceCaptureFieldValueShapes: ["long-text"],
      actionEvidenceCaptureFieldAcceptsMultiple: [false],
      actionEvidenceCaptureFieldDefaultValues: [""],
      actionEvidenceCaptureFieldEmptyValues: [""],
      actionEvidenceCaptureFieldValidationRules: ["optional-json-snapshot"],
      actionEvidenceCaptureFieldMinLengths: [0],
      actionRequiredEvidenceCaptureFieldKeys: [],
      actionOptionalEvidenceCaptureFieldKeys: ["handoffJsonSnapshot"],
      actionEvidenceCaptureFieldCount: 1,
      actionRequiredEvidenceCaptureFieldCount: 0,
      actionOptionalEvidenceCaptureFieldCount: 1,
      actionHasEvidenceCaptureFields: true,
      required: false,
      runPolicy: "read-only",
      safetyLevel: "local-read-only",
      commandCount: 1,
      outputFiles: [],
      manual: false,
      writesLocalFile: false,
      externalCalls: false,
      targetRepoMutation: false,
    },
    {
      key: "writeEffectiveTaskPrompt",
      actionType: "write-local-output",
      actionLabel: "Write selected task prompt",
      actionButtonLabel: "Write Prompt",
      actionAffordance: "local-output-button",
      actionEnabled: true,
      actionStatus: "ready",
      actionStatusLabel: "Ready",
      actionStatusTone: "success",
      actionDisabledReasonCode: "",
      actionPrerequisiteKeys: ["verifySourceBundle"],
      actionPrerequisiteCount: 1,
      actionHasPrerequisites: true,
      actionDependencyReasonCode: "requires-prerequisite-actions",
      actionBlockedStageKeys: ["executeInTargetRepo"],
      actionBlockedStageCount: 1,
      actionBlocksStages: true,
      actionCompletionCriteriaCount: 2,
      actionHasCompletionCriteria: true,
      actionEvidenceRequirementCount: 2,
      actionRequiresEvidence: true,
      actionEvidenceTarget: "local-output-file",
      actionEvidenceTargetLabel: "Local output file",
      actionEvidenceCaptureFieldKeys: ["promptOutputFile", "selectedTaskId"],
      actionEvidenceCaptureFieldLabels: ["Prompt output file", "Selected task id"],
      actionEvidenceCaptureFieldPlaceholders: ["target-repo-task-...-handoff.md", "task-..."],
      actionEvidenceCaptureFieldRequirementLabels: ["Required", "Required"],
      actionEvidenceCaptureFieldAriaLabels: [
        "Prompt output file evidence (required)",
        "Selected task id evidence (required)",
      ],
      actionEvidenceCaptureFieldHelpTexts: [
        "Required: record the local Markdown prompt file path generated for the selected task.",
        "Required: record the bundle task id used for the target-repo handoff prompt.",
      ],
      actionEvidenceCaptureFieldSectionKeys: ["handoff-prompt-output", "handoff-prompt-output"],
      actionEvidenceCaptureFieldSectionLabels: [
        "Handoff prompt output",
        "Handoff prompt output",
      ],
      actionEvidenceCaptureSectionKeys: ["handoff-prompt-output"],
      actionEvidenceCaptureSectionLabels: ["Handoff prompt output"],
      actionEvidenceCaptureSectionCount: 1,
      actionEvidenceCaptureFieldPayloadNamespaces: ["handoffPrompt", "handoffPrompt"],
      actionEvidenceCaptureFieldPayloadPaths: [
        "handoffPrompt.outputFile",
        "handoffPrompt.selectedTaskId",
      ],
      actionEvidenceCapturePayloadNamespaces: ["handoffPrompt"],
      actionEvidenceCapturePayloadNamespaceCount: 1,
      actionEvidenceCapturePayloadTemplate: {
        handoffPrompt: {
          outputFile: "",
          selectedTaskId: "",
        },
      },
      actionEvidenceCapturePayloadFlatTemplate: {
        "handoffPrompt.outputFile": "",
        "handoffPrompt.selectedTaskId": "",
      },
      actionEvidenceCaptureFieldInputTypes: ["file-path", "text"],
      actionEvidenceCaptureFieldValueShapes: ["file-path", "short-text"],
      actionEvidenceCaptureFieldAcceptsMultiple: [false, false],
      actionEvidenceCaptureFieldDefaultValues: ["", ""],
      actionEvidenceCaptureFieldEmptyValues: ["", ""],
      actionEvidenceCaptureFieldValidationRules: ["local-markdown-file-path", "task-id"],
      actionEvidenceCaptureFieldMinLengths: [12, 5],
      actionRequiredEvidenceCaptureFieldKeys: ["promptOutputFile", "selectedTaskId"],
      actionOptionalEvidenceCaptureFieldKeys: [],
      actionEvidenceCaptureFieldCount: 2,
      actionRequiredEvidenceCaptureFieldCount: 2,
      actionOptionalEvidenceCaptureFieldCount: 0,
      actionHasEvidenceCaptureFields: true,
      required: true,
      runPolicy: "writes-local-file",
      safetyLevel: "local-output-file",
      commandCount: 1,
      outputFiles: ["target-repo-task-accessibility-handoff.md"],
      manual: false,
      writesLocalFile: true,
      externalCalls: false,
      targetRepoMutation: false,
    },
    {
      key: "executeInTargetRepo",
      actionType: "manual-target-repo",
      actionLabel: "Implement in target repo",
      actionButtonLabel: "Open Target Repo",
      actionAffordance: "manual-target-repo-step",
      actionEnabled: false,
      actionStatus: "manual",
      actionStatusLabel: "Manual",
      actionStatusTone: "info",
      actionDisabledReasonCode: "manual-target-repo-step",
      actionPrerequisiteKeys: ["verifySourceBundle", "writeEffectiveTaskPrompt"],
      actionPrerequisiteCount: 2,
      actionHasPrerequisites: true,
      actionDependencyReasonCode: "requires-prerequisite-actions",
      actionBlockedStageKeys: ["recordEvidence"],
      actionBlockedStageCount: 1,
      actionBlocksStages: true,
      actionCompletionCriteriaCount: 2,
      actionHasCompletionCriteria: true,
      actionEvidenceRequirementCount: 3,
      actionRequiresEvidence: true,
      actionEvidenceTarget: "target-repo-working-tree",
      actionEvidenceTargetLabel: "Target repo working tree",
      actionEvidenceCaptureFieldKeys: [
        "targetRepoChangedFiles",
        "targetRepoVerificationResults",
        "viewportAccessibilityNotes",
      ],
      actionEvidenceCaptureFieldLabels: [
        "Target repo changed files",
        "Target repo verification results",
        "Viewport and accessibility notes",
      ],
      actionEvidenceCaptureFieldPlaceholders: [
        "List changed files from the target website repo.",
        "Record lint, typecheck, build, test, or equivalent command results.",
        "Record desktop/tablet/mobile checks, keyboard focus, contrast, and screen-reader notes.",
      ],
      actionEvidenceCaptureFieldRequirementLabels: ["Required", "Required", "Required"],
      actionEvidenceCaptureFieldAriaLabels: [
        "Target repo changed files evidence (required)",
        "Target repo verification results evidence (required)",
        "Viewport and accessibility notes evidence (required)",
      ],
      actionEvidenceCaptureFieldHelpTexts: [
        "Required: list at least one changed target-repo file or a no-change justification.",
        "Required: record target-repo verification commands and results.",
        "Required: document viewport coverage plus keyboard, contrast, and screen-reader notes.",
      ],
      actionEvidenceCaptureFieldSectionKeys: [
        "target-repo-changes",
        "target-repo-verification",
        "viewport-accessibility-qa",
      ],
      actionEvidenceCaptureFieldSectionLabels: [
        "Target repo changes",
        "Target repo verification",
        "Viewport and accessibility QA",
      ],
      actionEvidenceCaptureSectionKeys: [
        "target-repo-changes",
        "target-repo-verification",
        "viewport-accessibility-qa",
      ],
      actionEvidenceCaptureSectionLabels: [
        "Target repo changes",
        "Target repo verification",
        "Viewport and accessibility QA",
      ],
      actionEvidenceCaptureSectionCount: 3,
      actionEvidenceCaptureFieldPayloadNamespaces: ["targetRepo", "targetRepo", "targetRepo"],
      actionEvidenceCaptureFieldPayloadPaths: [
        "targetRepo.changedFiles",
        "targetRepo.verificationResults",
        "targetRepo.viewportAccessibilityNotes",
      ],
      actionEvidenceCapturePayloadNamespaces: ["targetRepo"],
      actionEvidenceCapturePayloadNamespaceCount: 1,
      actionEvidenceCapturePayloadTemplate: {
        targetRepo: {
          changedFiles: [],
          verificationResults: "",
          viewportAccessibilityNotes: "",
        },
      },
      actionEvidenceCapturePayloadFlatTemplate: {
        "targetRepo.changedFiles": [],
        "targetRepo.verificationResults": "",
        "targetRepo.viewportAccessibilityNotes": "",
      },
      actionEvidenceCaptureFieldInputTypes: ["list", "textarea", "textarea"],
      actionEvidenceCaptureFieldValueShapes: ["string-list", "long-text", "long-text"],
      actionEvidenceCaptureFieldAcceptsMultiple: [true, false, false],
      actionEvidenceCaptureFieldDefaultValues: [[], "", ""],
      actionEvidenceCaptureFieldEmptyValues: [[], "", ""],
      actionEvidenceCaptureFieldValidationRules: [
        "non-empty-file-list",
        "verification-results",
        "viewport-accessibility-notes",
      ],
      actionEvidenceCaptureFieldMinLengths: [1, 20, 20],
      actionRequiredEvidenceCaptureFieldKeys: [
        "targetRepoChangedFiles",
        "targetRepoVerificationResults",
        "viewportAccessibilityNotes",
      ],
      actionOptionalEvidenceCaptureFieldKeys: [],
      actionEvidenceCaptureFieldCount: 3,
      actionRequiredEvidenceCaptureFieldCount: 3,
      actionOptionalEvidenceCaptureFieldCount: 0,
      actionHasEvidenceCaptureFields: true,
      required: true,
      runPolicy: "manual-target-repo",
      safetyLevel: "operator-controlled-target-repo",
      commandCount: 0,
      outputFiles: [],
      manual: true,
      writesLocalFile: false,
      externalCalls: false,
      targetRepoMutation: false,
    },
    {
      key: "recordEvidence",
      actionType: "manual-evidence",
      actionLabel: "Record verification evidence",
      actionButtonLabel: "Record Evidence",
      actionAffordance: "manual-evidence-step",
      actionEnabled: false,
      actionStatus: "manual",
      actionStatusLabel: "Manual",
      actionStatusTone: "info",
      actionDisabledReasonCode: "manual-evidence-step",
      actionPrerequisiteKeys: ["executeInTargetRepo"],
      actionPrerequisiteCount: 1,
      actionHasPrerequisites: true,
      actionDependencyReasonCode: "requires-prerequisite-actions",
      actionBlockedStageKeys: [],
      actionBlockedStageCount: 0,
      actionBlocksStages: false,
      actionCompletionCriteriaCount: 1,
      actionHasCompletionCriteria: true,
      actionEvidenceRequirementCount: 1,
      actionRequiresEvidence: true,
      actionEvidenceTarget: "handoff-evidence-record",
      actionEvidenceTargetLabel: "Handoff evidence record",
      actionEvidenceCaptureFieldKeys: ["finalEvidenceRecord", "remainingRisks"],
      actionEvidenceCaptureFieldLabels: ["Final evidence record", "Remaining risks"],
      actionEvidenceCaptureFieldPlaceholders: [
        "Summarize changed files, verification, viewport/accessibility checks, risks, and digest.",
        "List unresolved risks, skipped checks, or follow-up tasks.",
      ],
      actionEvidenceCaptureFieldRequirementLabels: ["Required", "Required"],
      actionEvidenceCaptureFieldAriaLabels: [
        "Final evidence record evidence (required)",
        "Remaining risks evidence (required)",
      ],
      actionEvidenceCaptureFieldHelpTexts: [
        "Required: summarize changes, verification, viewport/accessibility checks, risks, and digest.",
        "Required: record unresolved risks, skipped checks, or confirm none remain.",
      ],
      actionEvidenceCaptureFieldSectionKeys: ["final-handoff-evidence", "risk-record"],
      actionEvidenceCaptureFieldSectionLabels: ["Final handoff evidence", "Risk record"],
      actionEvidenceCaptureSectionKeys: ["final-handoff-evidence", "risk-record"],
      actionEvidenceCaptureSectionLabels: ["Final handoff evidence", "Risk record"],
      actionEvidenceCaptureSectionCount: 2,
      actionEvidenceCaptureFieldPayloadNamespaces: ["handoffEvidence", "handoffEvidence"],
      actionEvidenceCaptureFieldPayloadPaths: [
        "handoffEvidence.finalRecord",
        "handoffEvidence.remainingRisks",
      ],
      actionEvidenceCapturePayloadNamespaces: ["handoffEvidence"],
      actionEvidenceCapturePayloadNamespaceCount: 1,
      actionEvidenceCapturePayloadTemplate: {
        handoffEvidence: {
          finalRecord: "",
          remainingRisks: "",
        },
      },
      actionEvidenceCapturePayloadFlatTemplate: {
        "handoffEvidence.finalRecord": "",
        "handoffEvidence.remainingRisks": "",
      },
      actionEvidenceCaptureFieldInputTypes: ["textarea", "textarea"],
      actionEvidenceCaptureFieldValueShapes: ["long-text", "long-text"],
      actionEvidenceCaptureFieldAcceptsMultiple: [false, false],
      actionEvidenceCaptureFieldDefaultValues: ["", ""],
      actionEvidenceCaptureFieldEmptyValues: ["", ""],
      actionEvidenceCaptureFieldValidationRules: ["final-evidence-record", "risk-notes"],
      actionEvidenceCaptureFieldMinLengths: [30, 10],
      actionRequiredEvidenceCaptureFieldKeys: ["finalEvidenceRecord", "remainingRisks"],
      actionOptionalEvidenceCaptureFieldKeys: [],
      actionEvidenceCaptureFieldCount: 2,
      actionRequiredEvidenceCaptureFieldCount: 2,
      actionOptionalEvidenceCaptureFieldCount: 0,
      actionHasEvidenceCaptureFields: true,
      required: true,
      runPolicy: "manual-target-repo",
      safetyLevel: "operator-controlled-target-repo",
      commandCount: 0,
      outputFiles: [],
      manual: true,
      writesLocalFile: false,
      externalCalls: false,
      targetRepoMutation: false,
    },
  ]);
  assert.deepEqual(report.operatorRunbook.actionSummary, {
    totalActionCount: 5,
    commandActionCount: 3,
    manualActionCount: 2,
    enabledActionCount: 3,
    disabledActionCount: 2,
    manualDisabledActionCount: 2,
    actionWithPrerequisiteCount: 3,
    maxActionPrerequisiteCount: 2,
    actionWithDependencyReasonCount: 3,
    actionBlockingOtherActionCount: 3,
    maxActionBlockedStageCount: 2,
    actionWithCompletionCriteriaCount: 5,
    totalActionCompletionCriteriaCount: 8,
    maxActionCompletionCriteriaCount: 2,
    actionRequiringEvidenceCount: 5,
    totalActionEvidenceRequirementCount: 9,
    maxActionEvidenceRequirementCount: 3,
    localCommandEvidenceActionCount: 2,
    localOutputEvidenceActionCount: 1,
    targetRepoEvidenceActionCount: 1,
    handoffRecordEvidenceActionCount: 1,
    actionWithEvidenceCaptureFieldCount: 5,
    actionWithRequiredEvidenceCaptureFieldCount: 4,
    actionWithOptionalEvidenceCaptureFieldCount: 1,
    totalActionEvidenceCaptureFieldCount: 10,
    totalRequiredActionEvidenceCaptureFieldCount: 9,
    totalOptionalActionEvidenceCaptureFieldCount: 1,
    maxActionEvidenceCaptureFieldCount: 3,
    textareaEvidenceCaptureFieldCount: 6,
    textEvidenceCaptureFieldCount: 2,
    filePathEvidenceCaptureFieldCount: 1,
    listEvidenceCaptureFieldCount: 1,
    longTextEvidenceCaptureFieldCount: 6,
    shortTextEvidenceCaptureFieldCount: 2,
    filePathValueEvidenceCaptureFieldCount: 1,
    stringListEvidenceCaptureFieldCount: 1,
    multiValueEvidenceCaptureFieldCount: 1,
    singleValueEvidenceCaptureFieldCount: 9,
    emptyStringEvidenceCaptureFieldCount: 9,
    emptyListEvidenceCaptureFieldCount: 1,
    placeholderEvidenceCaptureFieldCount: 10,
    ariaLabelEvidenceCaptureFieldCount: 10,
    helpTextEvidenceCaptureFieldCount: 10,
    sectionedEvidenceCaptureFieldCount: 10,
    uniqueEvidenceCaptureSectionCount: 8,
    actionWithMultipleEvidenceCaptureSectionCount: 2,
    maxActionEvidenceCaptureSectionCount: 3,
    payloadMappedEvidenceCaptureFieldCount: 10,
    uniqueEvidenceCapturePayloadNamespaceCount: 5,
    actionWithMultipleEvidenceCapturePayloadNamespaceCount: 0,
    maxActionEvidenceCapturePayloadNamespaceCount: 1,
    actionWithEvidenceCapturePayloadTemplateCount: 5,
    evidenceCapturePayloadTemplatePathCount: 10,
    maxActionEvidenceCapturePayloadTemplatePathCount: 3,
    actionWithEvidenceCapturePayloadBindingCount: 5,
    evidenceCapturePayloadBindingCount: 10,
    requiredEvidenceCapturePayloadBindingCount: 9,
    optionalEvidenceCapturePayloadBindingCount: 1,
    multiValueEvidenceCapturePayloadBindingCount: 1,
    actionWithEvidenceCaptureValidationSpecCount: 5,
    evidenceCaptureValidationSpecCount: 10,
    requiredEvidenceCaptureValidationSpecCount: 9,
    optionalEvidenceCaptureValidationSpecCount: 1,
    errorEvidenceCaptureValidationSpecCount: 9,
    infoEvidenceCaptureValidationSpecCount: 1,
    multiValueEvidenceCaptureValidationSpecCount: 1,
    actionWithEvidenceCaptureInitialValidationStateCount: 5,
    evidenceCaptureInitialValidationStateCount: 10,
    validInitialEvidenceCaptureStateCount: 1,
    invalidInitialEvidenceCaptureStateCount: 9,
    blockingInitialEvidenceCaptureStateCount: 9,
    optionalEmptyInitialEvidenceCaptureStateCount: 1,
    missingRequiredInitialEvidenceCaptureStateCount: 9,
    pristineInitialEvidenceCaptureStateCount: 10,
    actionWithEvidenceCaptureInitialValidationDisplayMetadataCount: 5,
    evidenceCaptureInitialValidationDisplayMetadataCount: 10,
    dangerInitialEvidenceCaptureDisplayMetadataCount: 9,
    infoInitialEvidenceCaptureDisplayMetadataCount: 1,
    blockingInitialEvidenceCaptureDisplayMetadataCount: 9,
    nonBlockingInitialEvidenceCaptureDisplayMetadataCount: 1,
    actionWithEvidenceCaptureInitialValidationSummaryCount: 5,
    blockedInitialEvidenceCaptureSummaryActionCount: 4,
    readyInitialEvidenceCaptureSummaryActionCount: 1,
    completableInitialEvidenceCaptureSummaryActionCount: 1,
    nonCompletableInitialEvidenceCaptureSummaryActionCount: 4,
    initialEvidenceCaptureSummaryBlockingFieldCount: 9,
    initialEvidenceCaptureSummaryMissingRequiredFieldCount: 9,
    initialEvidenceCaptureSummaryOptionalEmptyFieldCount: 1,
    actionWithEvidenceCaptureInitialValidationChecklistCount: 5,
    evidenceCaptureInitialValidationChecklistItemCount: 10,
    checkedInitialEvidenceCaptureChecklistItemCount: 1,
    uncheckedInitialEvidenceCaptureChecklistItemCount: 9,
    blockingInitialEvidenceCaptureChecklistItemCount: 9,
    nonBlockingInitialEvidenceCaptureChecklistItemCount: 1,
    requiredInitialEvidenceCaptureChecklistItemCount: 9,
    optionalInitialEvidenceCaptureChecklistItemCount: 1,
    actionWithEvidenceCaptureInitialValidationChecklistSummaryCount: 5,
    blockedInitialEvidenceCaptureChecklistSummaryActionCount: 4,
    readyInitialEvidenceCaptureChecklistSummaryActionCount: 1,
    completeInitialEvidenceCaptureChecklistSummaryActionCount: 1,
    incompleteInitialEvidenceCaptureChecklistSummaryActionCount: 4,
    initialEvidenceCaptureChecklistSummaryCheckedItemCount: 1,
    initialEvidenceCaptureChecklistSummaryUncheckedItemCount: 9,
    initialEvidenceCaptureChecklistSummaryBlockingUncheckedItemCount: 9,
    humanLineCount: 5,
    humanLineByKeyCount: 5,
    humanLineWithEvidenceProgressCount: 5,
    humanLineWithBlockedEvidenceProgressCount: 4,
    humanLineWithReadyEvidenceProgressCount: 1,
    humanLineDisplayRowCount: 5,
    humanLineDisplayRowByKeyCount: 5,
    humanLineDisplayRowWithEvidenceProgressCount: 5,
    humanLineDisplayRowWithBlockedEvidenceProgressCount: 4,
    humanLineDisplayRowWithReadyEvidenceProgressCount: 1,
    humanLineDisplayRowReadyActionCount: 2,
    humanLineDisplayRowManualActionCount: 2,
    validatedEvidenceCaptureFieldCount: 10,
    requiredValidatedEvidenceCaptureFieldCount: 9,
    optionalValidatedEvidenceCaptureFieldCount: 1,
    minEvidenceCaptureFieldLengthTotal: 126,
    maxEvidenceCaptureFieldMinLength: 30,
    requiredActionCount: 4,
    optionalActionCount: 1,
    readOnlyActionCount: 2,
    localOutputActionCount: 1,
    outputFileActionCount: 1,
    externalCallActionCount: 0,
    targetRepoMutationActionCount: 0,
    nextActionKey: "verifySourceBundle",
    nextActionType: "run-local-gate",
    nextActionLabel: "Run strict bundle check",
    nextActionEnabled: true,
    nextActionStatus: "ready",
    nextActionStatusLabel: "Ready",
    nextActionStatusTone: "success",
    nextActionDisabledReasonCode: "",
    nextActionPrerequisiteKeys: [],
    nextActionPrerequisiteLabels: [],
    nextActionPrerequisiteCount: 0,
    nextActionHasPrerequisites: false,
    nextActionDependencyReasonCode: "",
    nextActionDependencyReason: "",
    nextActionBlockedStageKeys: ["writeEffectiveTaskPrompt", "executeInTargetRepo"],
    nextActionBlockedStageLabels: ["Write effective task handoff prompt", "Execute the task in the target website repo"],
    nextActionBlockedStageCount: 2,
    nextActionBlocksStages: true,
    nextActionCompletionCriteria: [
      "Strict bundle check status is pass.",
      "Checksum and generated-file drift counts are zero.",
    ],
    nextActionCompletionCriteriaCount: 2,
    nextActionHasCompletionCriteria: true,
    nextActionEvidenceRequirements: [
      "Strict bundle-check command output or JSON status.",
      "Bundle digest and zero drift counts.",
    ],
    nextActionEvidenceRequirementCount: 2,
    nextActionRequiresEvidence: true,
    nextActionEvidenceTarget: "local-command-output",
    nextActionEvidenceTargetLabel: "Local command output",
    nextActionEvidenceCaptureFields: [
      {
        key: "strictBundleCheckOutput",
        label: "Strict bundle-check output",
        inputType: "textarea",
        required: true,
        evidenceTarget: "local-command-output",
        placeholder: "Paste the strict bundle-check pass output or JSON status.",
        validationRule: "non-empty-text",
        minLength: 20,
        example: "Status: pass; checksumFailures: 0; generatedFailures: 0",
        validationHint: "Required: paste a passing strict bundle-check result.",
        valueShape: "long-text",
        acceptsMultiple: false,
        defaultValue: "",
        emptyValue: "",
        requirementLabel: "Required",
        ariaLabel: "Strict bundle-check output evidence (required)",
        helpText: "Required: paste a passing strict bundle-check result.",
        sectionKey: "source-bundle-verification",
        sectionLabel: "Source bundle verification",
        payloadNamespace: "sourceBundle",
        payloadPath: "sourceBundle.verification.strictBundleCheckOutput",
      },
      {
        key: "bundleDigest",
        label: "Bundle digest",
        inputType: "text",
        required: true,
        evidenceTarget: "local-command-output",
        placeholder: "Record the bundle digest or checksum summary.",
        validationRule: "checksum-or-digest-text",
        minLength: 8,
        example: "7685113af4744990fadf301b220b4739066e5f6ec2c40857825211e1167241aa",
        validationHint: "Required: record a digest, checksum, or equivalent bundle integrity summary.",
        valueShape: "short-text",
        acceptsMultiple: false,
        defaultValue: "",
        emptyValue: "",
        requirementLabel: "Required",
        ariaLabel: "Bundle digest evidence (required)",
        helpText: "Required: record a digest, checksum, or equivalent bundle integrity summary.",
        sectionKey: "source-bundle-verification",
        sectionLabel: "Source bundle verification",
        payloadNamespace: "sourceBundle",
        payloadPath: "sourceBundle.verification.bundleDigest",
      },
    ],
    nextActionEvidenceCaptureFieldKeys: ["strictBundleCheckOutput", "bundleDigest"],
    nextActionEvidenceCaptureFieldLabels: ["Strict bundle-check output", "Bundle digest"],
    nextActionEvidenceCaptureFieldPlaceholders: [
      "Paste the strict bundle-check pass output or JSON status.",
      "Record the bundle digest or checksum summary.",
    ],
    nextActionEvidenceCaptureFieldRequirementLabels: ["Required", "Required"],
    nextActionEvidenceCaptureFieldAriaLabels: [
      "Strict bundle-check output evidence (required)",
      "Bundle digest evidence (required)",
    ],
    nextActionEvidenceCaptureFieldHelpTexts: [
      "Required: paste a passing strict bundle-check result.",
      "Required: record a digest, checksum, or equivalent bundle integrity summary.",
    ],
    nextActionEvidenceCaptureFieldSectionKeys: ["source-bundle-verification", "source-bundle-verification"],
    nextActionEvidenceCaptureFieldSectionLabels: [
      "Source bundle verification",
      "Source bundle verification",
    ],
    nextActionEvidenceCaptureSectionKeys: ["source-bundle-verification"],
    nextActionEvidenceCaptureSectionLabels: ["Source bundle verification"],
    nextActionEvidenceCaptureSectionCount: 1,
    nextActionEvidenceCaptureFieldPayloadNamespaces: ["sourceBundle", "sourceBundle"],
    nextActionEvidenceCaptureFieldPayloadPaths: [
      "sourceBundle.verification.strictBundleCheckOutput",
      "sourceBundle.verification.bundleDigest",
    ],
    nextActionEvidenceCapturePayloadNamespaces: ["sourceBundle"],
    nextActionEvidenceCapturePayloadNamespaceCount: 1,
    nextActionEvidenceCapturePayloadTemplate: {
      sourceBundle: {
        verification: {
          strictBundleCheckOutput: "",
          bundleDigest: "",
        },
      },
    },
    nextActionEvidenceCapturePayloadFlatTemplate: {
      "sourceBundle.verification.strictBundleCheckOutput": "",
      "sourceBundle.verification.bundleDigest": "",
    },
    nextActionEvidenceCapturePayloadBindings: [
      {
        key: "strictBundleCheckOutput",
        label: "Strict bundle-check output",
        payloadNamespace: "sourceBundle",
        payloadPath: "sourceBundle.verification.strictBundleCheckOutput",
        inputType: "textarea",
        valueShape: "long-text",
        acceptsMultiple: false,
        required: true,
        requirementLabel: "Required",
        emptyValue: "",
        validationRule: "non-empty-text",
        minLength: 20,
        sectionKey: "source-bundle-verification",
        sectionLabel: "Source bundle verification",
        ariaLabel: "Strict bundle-check output evidence (required)",
      },
      {
        key: "bundleDigest",
        label: "Bundle digest",
        payloadNamespace: "sourceBundle",
        payloadPath: "sourceBundle.verification.bundleDigest",
        inputType: "text",
        valueShape: "short-text",
        acceptsMultiple: false,
        required: true,
        requirementLabel: "Required",
        emptyValue: "",
        validationRule: "checksum-or-digest-text",
        minLength: 8,
        sectionKey: "source-bundle-verification",
        sectionLabel: "Source bundle verification",
        ariaLabel: "Bundle digest evidence (required)",
      },
    ],
    nextActionEvidenceCaptureValidationSpecs: [
      {
        key: "strictBundleCheckOutput",
        label: "Strict bundle-check output",
        rule: "non-empty-text",
        severity: "error",
        required: true,
        allowsEmpty: false,
        minLength: 20,
        valueShape: "long-text",
        acceptsMultiple: false,
        emptyValue: "",
        message: "Required: paste a passing strict bundle-check result.",
        failureMessage: "Provide strict bundle-check output before marking this action complete.",
      },
      {
        key: "bundleDigest",
        label: "Bundle digest",
        rule: "checksum-or-digest-text",
        severity: "error",
        required: true,
        allowsEmpty: false,
        minLength: 8,
        valueShape: "short-text",
        acceptsMultiple: false,
        emptyValue: "",
        message: "Required: record a digest, checksum, or equivalent bundle integrity summary.",
        failureMessage: "Provide bundle digest before marking this action complete.",
      },
    ],
    nextActionEvidenceCaptureInitialValidationStates: expectedNextInitialValidationStates,
    nextActionEvidenceCaptureInitialValidationDisplayMetadata: expectedNextInitialValidationDisplayMetadata,
    nextActionEvidenceCaptureInitialValidationChecklist: expectedNextInitialValidationChecklist,
    nextActionEvidenceCaptureInitialValidationChecklistSummary: expectedNextInitialValidationChecklistSummary,
    nextActionEvidenceCaptureInitialValidationSummary: expectedNextInitialValidationSummary,
    nextActionEvidenceCaptureFieldInputTypes: ["textarea", "text"],
    nextActionEvidenceCaptureFieldValueShapes: ["long-text", "short-text"],
    nextActionEvidenceCaptureFieldAcceptsMultiple: [false, false],
    nextActionEvidenceCaptureFieldDefaultValues: ["", ""],
    nextActionEvidenceCaptureFieldEmptyValues: ["", ""],
    nextActionEvidenceCaptureFieldValidationRules: ["non-empty-text", "checksum-or-digest-text"],
    nextActionEvidenceCaptureFieldMinLengths: [20, 8],
    nextActionEvidenceCaptureFieldExamples: [
      "Status: pass; checksumFailures: 0; generatedFailures: 0",
      "7685113af4744990fadf301b220b4739066e5f6ec2c40857825211e1167241aa",
    ],
    nextActionEvidenceCaptureFieldValidationHints: [
      "Required: paste a passing strict bundle-check result.",
      "Required: record a digest, checksum, or equivalent bundle integrity summary.",
    ],
    nextActionRequiredEvidenceCaptureFieldKeys: ["strictBundleCheckOutput", "bundleDigest"],
    nextActionOptionalEvidenceCaptureFieldKeys: [],
    nextActionEvidenceCaptureFieldCount: 2,
    nextActionRequiredEvidenceCaptureFieldCount: 2,
    nextActionOptionalEvidenceCaptureFieldCount: 0,
    nextActionHasEvidenceCaptureFields: true,
    nextActionRunPolicy: "read-only",
    nextActionSafetyLevel: "local-read-only",
    firstRequiredCommandStageKey: "verifySourceBundle",
    firstLocalOutputStageKey: "writeEffectiveTaskPrompt",
    firstManualStageKey: "executeInTargetRepo",
    firstRequiredManualStageKey: "executeInTargetRepo",
    firstEvidenceStageKey: "recordEvidence",
    firstActionWithPrerequisiteKey: "writeEffectiveTaskPrompt",
    firstManualActionWithPrerequisiteKey: "executeInTargetRepo",
    firstEvidenceActionWithPrerequisiteKey: "recordEvidence",
    firstActionWithDependencyReasonKey: "writeEffectiveTaskPrompt",
    firstActionBlockingOtherActionKey: "verifySourceBundle",
    firstActionWithCompletionCriteriaKey: "verifySourceBundle",
    firstManualActionWithCompletionCriteriaKey: "executeInTargetRepo",
    firstActionRequiringEvidenceKey: "verifySourceBundle",
    firstManualActionRequiringEvidenceKey: "executeInTargetRepo",
    firstEvidenceRecordingActionKey: "recordEvidence",
    firstTargetRepoEvidenceActionKey: "executeInTargetRepo",
    firstLocalOutputEvidenceActionKey: "writeEffectiveTaskPrompt",
    firstActionWithEvidenceCaptureFieldKey: "verifySourceBundle",
    firstActionWithOptionalEvidenceCaptureFieldKey: "refreshHandoffSnapshot",
    firstManualActionWithEvidenceCaptureFieldKey: "executeInTargetRepo",
    firstTextareaEvidenceCaptureActionKey: "verifySourceBundle",
    firstMultiValueEvidenceCaptureActionKey: "executeInTargetRepo",
    firstValidationRuleEvidenceCaptureActionKey: "verifySourceBundle",
    requiresTargetRepoWork: true,
    requiresEvidenceReturn: true,
    externalCalls: false,
    targetRepoMutation: false,
  });
  assert.deepEqual(report.operatorRunbook.stageKindByKey, {
    verifySourceBundle: "read-only-gate",
    refreshHandoffSnapshot: "read-only-preview",
    writeEffectiveTaskPrompt: "local-output",
    executeInTargetRepo: "manual-target-repo",
    recordEvidence: "manual-reporting",
  });
  assert.deepEqual(report.operatorRunbook.stageRequiredByKey, {
    verifySourceBundle: true,
    refreshHandoffSnapshot: false,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: true,
    recordEvidence: true,
  });
  assert.deepEqual(report.operatorRunbook.stageRunPolicyByKey, {
    verifySourceBundle: "read-only",
    refreshHandoffSnapshot: "read-only",
    writeEffectiveTaskPrompt: "writes-local-file",
    executeInTargetRepo: "manual-target-repo",
    recordEvidence: "manual-target-repo",
  });
  assert.deepEqual(report.operatorRunbook.stageSafetyLevelByKey, {
    verifySourceBundle: "local-read-only",
    refreshHandoffSnapshot: "local-read-only",
    writeEffectiveTaskPrompt: "local-output-file",
    executeInTargetRepo: "operator-controlled-target-repo",
    recordEvidence: "operator-controlled-target-repo",
  });
  assert.deepEqual(report.operatorRunbook.stageCommandCountByKey, {
    verifySourceBundle: 1,
    refreshHandoffSnapshot: 1,
    writeEffectiveTaskPrompt: 1,
    executeInTargetRepo: 0,
    recordEvidence: 0,
  });
  assert.deepEqual(report.operatorRunbook.stageCommandKeysByKey, {
    verifySourceBundle: ["source.bundleCheck.strict"],
    refreshHandoffSnapshot: ["source.bundleHandoff.strict"],
    writeEffectiveTaskPrompt: ["task.task-accessibility.handoff.strict"],
    executeInTargetRepo: [],
    recordEvidence: [],
  });
  assert.deepEqual(report.operatorRunbook.stageCommandLabelsByKey.verifySourceBundle, [
    "Strict bundle check JSON",
  ]);
  assert.deepEqual(report.operatorRunbook.stageCommandLabelsByKey.writeEffectiveTaskPrompt, [
    "Strict Task handoff: task-accessibility",
  ]);
  assert.deepEqual(report.operatorRunbook.stageCommandStringsByKey.verifySourceBundle, [
    report.commandManifest.commands[1].command,
  ]);
  assert.deepEqual(report.operatorRunbook.stageCommandStringsByKey.writeEffectiveTaskPrompt, [
    report.commandManifest.commands[5].command,
  ]);
  assert.deepEqual(report.operatorRunbook.stageCommandArgsByKey.verifySourceBundle, [
    ["design-ai", "site", dir, "--bundle-check", "--strict", "--json"],
  ]);
  assert.deepEqual(report.operatorRunbook.stageCommandArgsByKey.writeEffectiveTaskPrompt, [
    ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--strict", "--out", "target-repo-task-accessibility-handoff.md"],
  ]);
  assert.deepEqual(report.operatorRunbook.stageCommandRunPoliciesByKey, {
    verifySourceBundle: ["read-only"],
    refreshHandoffSnapshot: ["read-only"],
    writeEffectiveTaskPrompt: ["writes-local-file"],
    executeInTargetRepo: [],
    recordEvidence: [],
  });
  assert.deepEqual(report.operatorRunbook.stageCommandSafetyLevelsByKey, {
    verifySourceBundle: ["local-read-only"],
    refreshHandoffSnapshot: ["local-read-only"],
    writeEffectiveTaskPrompt: ["local-output-file"],
    executeInTargetRepo: [],
    recordEvidence: [],
  });
  assert.deepEqual(report.operatorRunbook.stageOutputFilesByKey, {
    verifySourceBundle: [],
    refreshHandoffSnapshot: [],
    writeEffectiveTaskPrompt: ["target-repo-task-accessibility-handoff.md"],
    executeInTargetRepo: [],
    recordEvidence: [],
  });
  assert.deepEqual(report.operatorRunbook.stageHasCommandsByKey, {
    verifySourceBundle: true,
    refreshHandoffSnapshot: true,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: false,
    recordEvidence: false,
  });
  assert.deepEqual(report.operatorRunbook.stageManualByKey, {
    verifySourceBundle: false,
    refreshHandoffSnapshot: false,
    writeEffectiveTaskPrompt: false,
    executeInTargetRepo: true,
    recordEvidence: true,
  });
  assert.deepEqual(report.operatorRunbook.stageWritesLocalFileByKey, {
    verifySourceBundle: false,
    refreshHandoffSnapshot: false,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: false,
    recordEvidence: false,
  });
  assert.deepEqual(report.operatorRunbook.stageExternalCallsByKey, {
    verifySourceBundle: false,
    refreshHandoffSnapshot: false,
    writeEffectiveTaskPrompt: false,
    executeInTargetRepo: false,
    recordEvidence: false,
  });
  assert.deepEqual(report.operatorRunbook.stageTargetRepoMutationByKey, {
    verifySourceBundle: false,
    refreshHandoffSnapshot: false,
    writeEffectiveTaskPrompt: false,
    executeInTargetRepo: false,
    recordEvidence: false,
  });
  assert.deepEqual(report.operatorRunbook.commandStageKeys, [
    "verifySourceBundle",
    "refreshHandoffSnapshot",
    "writeEffectiveTaskPrompt",
  ]);
  assert.deepEqual(report.operatorRunbook.manualStageKeys, [
    "executeInTargetRepo",
    "recordEvidence",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStage, report.operatorRunbook.stages[0]);
  assert.equal(report.operatorRunbook.nextStageLabel, "Verify source bundle integrity");
  assert.equal(report.operatorRunbook.nextStageSummary, report.operatorRunbook.stages[0].reason);
  assert.equal(report.operatorRunbook.nextStageActionType, "run-local-gate");
  assert.equal(report.operatorRunbook.nextStageActionLabel, "Run strict bundle check");
  assert.equal(
    report.operatorRunbook.nextStageActionInstruction,
    "Run the strict local bundle check and resolve any checksum or generated-file drift before handoff.",
  );
  assert.equal(report.operatorRunbook.nextStageActionButtonLabel, "Run Check");
  assert.equal(report.operatorRunbook.nextStageActionAffordance, "primary-command-button");
  assert.equal(report.operatorRunbook.nextStageActionEnabled, true);
  assert.equal(report.operatorRunbook.nextStageActionStatus, "ready");
  assert.equal(report.operatorRunbook.nextStageActionStatusLabel, "Ready");
  assert.equal(report.operatorRunbook.nextStageActionStatusTone, "success");
  assert.equal(report.operatorRunbook.nextStageActionDisabledReasonCode, "");
  assert.equal(report.operatorRunbook.nextStageActionDisabledReason, "");
  assert.deepEqual(report.operatorRunbook.nextStageActionPrerequisiteKeys, []);
  assert.deepEqual(report.operatorRunbook.nextStageActionPrerequisiteLabels, []);
  assert.equal(report.operatorRunbook.nextStageActionPrerequisiteCount, 0);
  assert.equal(report.operatorRunbook.nextStageActionHasPrerequisites, false);
  assert.equal(report.operatorRunbook.nextStageActionDependencyReasonCode, "");
  assert.equal(report.operatorRunbook.nextStageActionDependencyReason, "");
  assert.deepEqual(report.operatorRunbook.nextStageActionBlockedStageKeys, [
    "writeEffectiveTaskPrompt",
    "executeInTargetRepo",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionBlockedStageLabels, [
    "Write effective task handoff prompt",
    "Execute the task in the target website repo",
  ]);
  assert.equal(report.operatorRunbook.nextStageActionBlockedStageCount, 2);
  assert.equal(report.operatorRunbook.nextStageActionBlocksStages, true);
  assert.deepEqual(report.operatorRunbook.nextStageActionCompletionCriteria, [
    "Strict bundle check status is pass.",
    "Checksum and generated-file drift counts are zero.",
  ]);
  assert.equal(report.operatorRunbook.nextStageActionCompletionCriteriaCount, 2);
  assert.equal(report.operatorRunbook.nextStageActionHasCompletionCriteria, true);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceRequirements, [
    "Strict bundle-check command output or JSON status.",
    "Bundle digest and zero drift counts.",
  ]);
  assert.equal(report.operatorRunbook.nextStageActionEvidenceRequirementCount, 2);
  assert.equal(report.operatorRunbook.nextStageActionRequiresEvidence, true);
  assert.equal(report.operatorRunbook.nextStageActionEvidenceTarget, "local-command-output");
  assert.equal(report.operatorRunbook.nextStageActionEvidenceTargetLabel, "Local command output");
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldKeys, [
    "strictBundleCheckOutput",
    "bundleDigest",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldLabels, [
    "Strict bundle-check output",
    "Bundle digest",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldPlaceholders, [
    "Paste the strict bundle-check pass output or JSON status.",
    "Record the bundle digest or checksum summary.",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldRequirementLabels, [
    "Required",
    "Required",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldAriaLabels, [
    "Strict bundle-check output evidence (required)",
    "Bundle digest evidence (required)",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldHelpTexts, [
    "Required: paste a passing strict bundle-check result.",
    "Required: record a digest, checksum, or equivalent bundle integrity summary.",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldSectionKeys, [
    "source-bundle-verification",
    "source-bundle-verification",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldSectionLabels, [
    "Source bundle verification",
    "Source bundle verification",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureSectionKeys, [
    "source-bundle-verification",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureSectionLabels, [
    "Source bundle verification",
  ]);
  assert.equal(report.operatorRunbook.nextStageActionEvidenceCaptureSectionCount, 1);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldPayloadNamespaces, [
    "sourceBundle",
    "sourceBundle",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldPayloadPaths, [
    "sourceBundle.verification.strictBundleCheckOutput",
    "sourceBundle.verification.bundleDigest",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCapturePayloadNamespaces, [
    "sourceBundle",
  ]);
  assert.equal(report.operatorRunbook.nextStageActionEvidenceCapturePayloadNamespaceCount, 1);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCapturePayloadTemplate, {
    sourceBundle: {
      verification: {
        strictBundleCheckOutput: "",
        bundleDigest: "",
      },
    },
  });
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCapturePayloadFlatTemplate, {
    "sourceBundle.verification.strictBundleCheckOutput": "",
    "sourceBundle.verification.bundleDigest": "",
  });
  assert.deepEqual(
    report.operatorRunbook.nextStageActionEvidenceCapturePayloadBindings,
    report.operatorRunbook.stageActionEvidenceCapturePayloadBindingsByKey.verifySourceBundle,
  );
  assert.deepEqual(
    report.operatorRunbook.nextStageActionEvidenceCaptureValidationSpecs,
    report.operatorRunbook.stageActionEvidenceCaptureValidationSpecsByKey.verifySourceBundle,
  );
  assert.deepEqual(
    report.operatorRunbook.nextStageActionEvidenceCaptureInitialValidationStates,
    report.operatorRunbook.stageActionEvidenceCaptureInitialValidationStatesByKey.verifySourceBundle,
  );
  assert.deepEqual(
    report.operatorRunbook.nextStageActionEvidenceCaptureInitialValidationDisplayMetadata,
    report.operatorRunbook.stageActionEvidenceCaptureInitialValidationDisplayMetadataByKey.verifySourceBundle,
  );
  assert.deepEqual(
    report.operatorRunbook.nextStageActionEvidenceCaptureInitialValidationChecklist,
    report.operatorRunbook.stageActionEvidenceCaptureInitialValidationChecklistByKey.verifySourceBundle,
  );
  assert.deepEqual(
    report.operatorRunbook.nextStageActionEvidenceCaptureInitialValidationChecklistSummary,
    report.operatorRunbook.stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey.verifySourceBundle,
  );
  assert.deepEqual(
    report.operatorRunbook.nextStageActionEvidenceCaptureInitialValidationSummary,
    report.operatorRunbook.stageActionEvidenceCaptureInitialValidationSummaryByKey.verifySourceBundle,
  );
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldInputTypes, ["textarea", "text"]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldValueShapes, ["long-text", "short-text"]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldAcceptsMultiple, [false, false]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldDefaultValues, ["", ""]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldEmptyValues, ["", ""]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldValidationRules, [
    "non-empty-text",
    "checksum-or-digest-text",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldMinLengths, [20, 8]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldExamples, [
    "Status: pass; checksumFailures: 0; generatedFailures: 0",
    "7685113af4744990fadf301b220b4739066e5f6ec2c40857825211e1167241aa",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldValidationHints, [
    "Required: paste a passing strict bundle-check result.",
    "Required: record a digest, checksum, or equivalent bundle integrity summary.",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionRequiredEvidenceCaptureFieldKeys, [
    "strictBundleCheckOutput",
    "bundleDigest",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionOptionalEvidenceCaptureFieldKeys, []);
  assert.equal(report.operatorRunbook.nextStageActionEvidenceCaptureFieldCount, 2);
  assert.equal(report.operatorRunbook.nextStageActionRequiredEvidenceCaptureFieldCount, 2);
  assert.equal(report.operatorRunbook.nextStageActionOptionalEvidenceCaptureFieldCount, 0);
  assert.equal(report.operatorRunbook.nextStageActionHasEvidenceCaptureFields, true);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFields[1], {
    key: "bundleDigest",
    label: "Bundle digest",
    inputType: "text",
    required: true,
    evidenceTarget: "local-command-output",
    placeholder: "Record the bundle digest or checksum summary.",
    validationRule: "checksum-or-digest-text",
    minLength: 8,
    example: "7685113af4744990fadf301b220b4739066e5f6ec2c40857825211e1167241aa",
    validationHint: "Required: record a digest, checksum, or equivalent bundle integrity summary.",
    valueShape: "short-text",
    acceptsMultiple: false,
    defaultValue: "",
    emptyValue: "",
    requirementLabel: "Required",
    ariaLabel: "Bundle digest evidence (required)",
    helpText: "Required: record a digest, checksum, or equivalent bundle integrity summary.",
    sectionKey: "source-bundle-verification",
    sectionLabel: "Source bundle verification",
    payloadNamespace: "sourceBundle",
    payloadPath: "sourceBundle.verification.bundleDigest",
  });
  assert.equal(report.operatorRunbook.nextStageKind, "read-only-gate");
  assert.equal(report.operatorRunbook.nextStageRequired, true);
  assert.equal(report.operatorRunbook.nextStageRunPolicy, "read-only");
  assert.equal(report.operatorRunbook.nextStageSafetyLevel, "local-read-only");
  assert.equal(report.operatorRunbook.nextStageCommandCount, 1);
  assert.deepEqual(report.operatorRunbook.nextStageCommandLabels, ["Strict bundle check JSON"]);
  assert.deepEqual(report.operatorRunbook.nextStageCommands, [report.commandManifest.commands[1].command]);
  assert.deepEqual(report.operatorRunbook.nextStageCommandArgsList, [
    ["design-ai", "site", dir, "--bundle-check", "--strict", "--json"],
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageCommandRunPolicies, ["read-only"]);
  assert.deepEqual(report.operatorRunbook.nextStageCommandSafetyLevels, ["local-read-only"]);
  assert.deepEqual(report.operatorRunbook.nextStageOutputFiles, []);
  assert.equal(report.operatorRunbook.nextStageHasCommands, true);
  assert.equal(report.operatorRunbook.nextStageManual, false);
  assert.equal(report.operatorRunbook.nextStageWritesLocalFile, false);
  assert.equal(report.operatorRunbook.nextStageExternalCalls, false);
  assert.equal(report.operatorRunbook.nextStageTargetRepoMutation, false);
  assert.deepEqual(report.operatorRunbook.nextStageCommandKeys, ["source.bundleCheck.strict"]);
  assert.equal(report.operatorRunbook.nextCommand, report.commandManifest.commands[1].command);
  assert.deepEqual(report.operatorRunbook.nextCommandArgs, ["design-ai", "site", dir, "--bundle-check", "--strict", "--json"]);
  assert.equal(report.operatorRunbook.nextCommandRunPolicy, "read-only");
  assert.equal(report.operatorRunbook.nextCommandSafetyLevel, "local-read-only");
  assert.deepEqual(report.operatorRunbook.nextCommandSafety, report.commandManifest.commands[1].safety);
  assert.deepEqual(report.operatorRunbook.nextCommandEntry, report.commandManifest.commands[1]);
  assert.deepEqual(report.operatorRunbook.stages[0].commandKeys, ["source.bundleCheck.strict"]);
  assert.deepEqual(report.operatorRunbook.stageByKey.verifySourceBundle, report.operatorRunbook.stages[0]);
  assert.equal(report.operatorRunbook.stages[0].runPolicy, "read-only");
  assert.equal(report.operatorRunbook.stages[0].safetyLevel, "local-read-only");
  assert.deepEqual(report.operatorRunbook.stages[2].commandKeys, ["task.task-accessibility.handoff.strict"]);
  assert.deepEqual(report.operatorRunbook.stageByKey.writeEffectiveTaskPrompt, report.operatorRunbook.stages[2]);
  assert.equal(report.operatorRunbook.stages[2].runPolicy, "writes-local-file");
  assert.deepEqual(report.operatorRunbook.stages[2].outputFiles, ["target-repo-task-accessibility-handoff.md"]);
  assert.equal(report.operatorRunbook.stages[3].runPolicy, "manual-target-repo");
  assert.equal(report.operatorRunbook.stages[3].commandCount, 0);
  assert.equal(report.bundle.selectedTask, null);
  assert.equal(report.bundle.taskCatalog.count, 3);
  assert.equal(report.bundle.taskCatalog.defaultTaskId, "task-accessibility");
  assert.equal(report.bundle.taskCatalog.selectedTaskId, "");
  assert.equal(report.bundle.taskCatalog.selectionMode, "bundled-default");
  assert.equal(report.bundle.defaultTask.id, "task-accessibility");
  assert.equal(report.bundle.defaultTask.handoffOutFile, "target-repo-task-accessibility-handoff.md");
  assert.match(report.bundle.defaultTask.strictHandoffCommand, /--bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md/);
  assert.deepEqual(report.bundle.defaultTask.handoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.deepEqual(report.bundle.defaultTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--strict", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.equal(report.bundle.defaultTask.handoffCommandRunPolicy, "writes-local-file");
  assert.deepEqual(report.bundle.defaultTask.strictHandoffCommandSafety, {
    runPolicy: "writes-local-file",
    safetyLevel: "local-output-file",
    writesLocalFile: true,
    outputFile: "target-repo-task-accessibility-handoff.md",
    mutates: "local-output-file-only",
    externalCalls: false,
    targetRepoMutation: false,
    requiresCleanWorkspace: false,
    requiresReviewBeforeMutation: false,
    strict: true,
  });
  assert.equal(report.bundle.effectiveTask.id, "task-accessibility");
  assert.equal(report.bundle.effectiveTask.handoffOutFile, "target-repo-task-accessibility-handoff.md");
  assert.match(report.bundle.effectiveTask.strictHandoffCommand, /--bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md/);
  assert.deepEqual(report.bundle.effectiveTask.handoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.deepEqual(report.bundle.effectiveTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--strict", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.equal(report.bundle.effectiveTask.strictHandoffCommandRunPolicy, "writes-local-file");
  assert.equal(report.bundle.effectiveTask.strictHandoffCommandSafety.targetRepoMutation, false);
  assert.equal(report.bundle.effectiveTask.strictHandoffCommandSafety.externalCalls, false);
  assert.deepEqual(report.bundle.taskCatalog.items.map((task) => `${task.number}:${task.id}`), [
    "1:task-accessibility",
    "2:task-homepage-cta",
    "3:task-content-quality",
  ]);
  assert.equal(report.bundle.taskCatalog.items[0].handoffOutFile, "target-repo-task-accessibility-handoff.md");
  assert.match(report.bundle.taskCatalog.items[0].handoffCommand, /design-ai site .* --bundle-handoff --task task-accessibility --out target-repo-task-accessibility-handoff\.md/);
  assert.deepEqual(report.bundle.taskCatalog.items[0].handoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.match(report.bundle.taskCatalog.items[0].strictHandoffCommand, /design-ai site .* --bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md/);
  assert.deepEqual(report.bundle.taskCatalog.items[0].strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--strict", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.equal(report.bundle.taskCatalog.items[0].handoffCommandSafety.strict, false);
  assert.equal(report.bundle.taskCatalog.items[0].strictHandoffCommandSafety.strict, true);
  assert.equal(report.bundle.taskCatalog.items[0].strictHandoffCommandSafety.outputFile, "target-repo-task-accessibility-handoff.md");
  assert.equal(report.bundle.mcpProbeStatus, "pass");
  assert.deepEqual(report.bundle.mcpProbeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.deepEqual(report.bundle.implementationEvidence, {
    executedWork: 0,
    verificationResults: 0,
    remainingRisks: 3,
    nextActions: 0,
  });
  assert.match(report.bundle.checksumBundleDigest, /^[a-f0-9]{64}$/);
  assert.equal(report.bundle.verifiedChecksumFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.bundle.verifiedGeneratedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.bundle.generatedFailures, 0);
  assert.deepEqual(report.bundle.generatedDriftFiles, []);
  assert.deepEqual(report.bundle.boundaries, report.boundaries);
  assert.equal(report.bundle.externalCalls, false);
  assert.equal(report.bundle.targetRepoMutation, false);
  assert.equal(report.bundle.repairGuidance.available, true);
  assert.equal(report.bundle.repairGuidance.targetRepoMutation, false);
  assert.deepEqual(report.bundle.executionChecklist.map((item) => item.id), [
    "confirm-target-repo",
    "inspect-architecture",
    "apply-focused-task",
    "verify-quality-gates",
    "record-handoff-evidence",
  ]);
  assert.match(report.bundle.repairGuidance.command, /website-workspace\.tasks\.json --bundle --out .* --force/);
  assert.match(report.bundle.repairGuidance.previewReportCommand, /--bundle-repair --json --out .*repair-preview\.json/);
  assert.match(report.bundle.repairGuidance.applyReportCommand, /--bundle-repair --yes --json --out .*repair-applied\.json/);
  assert.equal(report.files.find((file) => file.path === "codex-implementation.md").included, true);
  assert.match(report.prompt, /Website improvement target-repo handoff prompt/);
  assert.match(report.prompt, /You are Codex working in the target website repository, not in the design-ai repository/);
  assert.match(report.prompt, /Source bundle provenance: pass\/valid from /);
  assert.match(report.prompt, /Source bundle strict check command: `design-ai site .* --bundle-check --strict --json`/);
  assert.match(report.prompt, /SHA-256 bundle digest: [a-f0-9]{64}/);
  assert.match(report.prompt, /Evidence counts: executed work 0, verification 0, risks 3, next actions 0/);
  assert.match(report.prompt, new RegExp(`Generated files: ${SITE_BUNDLE_CHECKSUM_FILES.length}/${SITE_BUNDLE_CHECKSUM_FILES.length} match the current CLI bundle contract`));
  assert.match(report.prompt, /MCP probe status: pass/);
  assert.match(report.prompt, /Primary task selection: bundled codex-implementation\.md default/);
  assert.match(report.prompt, /Available Bundle Tasks/);
  assert.match(report.prompt, /Default task: task-accessibility/);
  assert.match(report.prompt, /Default task strict command: `design-ai site .* --bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md`/);
  assert.match(report.prompt, /Selected task: none/);
  assert.match(report.prompt, /Effective task: task-accessibility/);
  assert.match(report.prompt, /Effective task strict command: `design-ai site .* --bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md`/);
  assert.match(report.prompt, /1\. \[p0\/high\/medium\] task-accessibility:/);
  assert.match(report.prompt, /command: `design-ai site .* --bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md`/);
  assert.match(report.prompt, /3\. \[p1\/medium\/medium\] task-content-quality:/);
  assert.match(report.prompt, /## Operator Runbook/);
  assert.match(report.prompt, /Runbook stages: 5 \(4 required, 1 optional\)/);
  assert.match(report.prompt, /Next command key: source\.bundleCheck\.strict/);
  assert.match(report.prompt, /1\. verifySourceBundle \(required, read-only\): Verify source bundle integrity\. command: `design-ai site .* --bundle-check --strict --json`/);
  assert.match(report.prompt, /1\. verifySourceBundle .* evidence: 0\/2 complete, Checklist blocked; next: Strict bundle-check output/);
  assert.match(report.prompt, /3\. writeEffectiveTaskPrompt \(required, writes-local-file\): Write effective task handoff prompt\. command: `design-ai site .* --bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md` output: target-repo-task-accessibility-handoff\.md/);
  assert.match(report.prompt, /2\. refreshHandoffSnapshot .* evidence: 1\/1 complete, Checklist ready/);
  assert.match(report.prompt, /4\. executeInTargetRepo .* evidence: 0\/3 complete, Checklist blocked; next: Target repo changed files/);
  assert.match(report.prompt, /4\. executeInTargetRepo \(required, manual-target-repo\): Execute the task in the target website repo\. command: manual/);
  assert.match(report.prompt, /MCP probes: 4\/4 passing, 0 warning, 0 failing/);
  assert.match(report.prompt, /mcp-probes\.json/);
  assert.match(report.prompt, /Generated drift files: none/);
  assert.match(report.prompt, /Handoff generation boundary flags: external calls no; target repo mutation no/);
  assert.match(report.prompt, /Handoff boundaries: deterministic-local, no-external-mcp-calls, no-target-repo-mutation, no-lighthouse-axe-visual-diff, target-repo-work-after-handoff/);
  assert.match(report.prompt, /Target Repo Execution Checklist/);
  assert.match(report.prompt, /Run target repo quality gates/);
  assert.match(report.prompt, /Repair guidance:\n- Available: yes/);
  assert.match(report.prompt, /Regenerate: design-ai site .*website-workspace\.tasks\.json --bundle --out .* --force/);
  assert.match(report.prompt, /Preview report: design-ai site .* --bundle-repair --json --out .*repair-preview\.json/);
  assert.match(report.prompt, /Apply report: design-ai site .* --bundle-repair --yes --json --out .*repair-applied\.json/);
  assert.match(report.prompt, /# Codex implementation prompt/);
  assert.match(report.prompt, /Task ID: task-accessibility/);
  assert.match(report.prompt, /Required Final Response/);
  assert.equal(json.status, "pass");
  assert.deepEqual(json.sourceBundle, report.sourceBundle);
  assert.deepEqual(json.bundle.sourceBundle, report.sourceBundle);
  assert.deepEqual(json.commandManifest, report.commandManifest);
  assert.deepEqual(json.bundle.commandManifest, report.commandManifest);
  assert.deepEqual(json.operatorRunbook, report.operatorRunbook);
  assert.deepEqual(json.bundle.operatorRunbook, report.operatorRunbook);
  assert.equal(json.commandManifest.commandCount, 10);
  assert.equal(json.commandManifest.readOnlyCount, 4);
  assert.equal(json.commandManifest.localOutputFileCount, 6);
  assert.equal(json.commandManifest.effectiveStrictTaskCommandKey, "task.task-accessibility.handoff.strict");
  assert.equal(json.commandManifest.commands[3].key, "source.bundleHandoff.strict");
  assert.equal(json.commandManifest.commands[3].safety.strict, true);
  assert.equal(json.commandManifest.commands[5].key, "task.task-accessibility.handoff.strict");
  assert.equal(json.commandManifest.commands[5].safety.targetRepoMutation, false);
  assert.equal(json.sourceBundle.checkCommandRunPolicy, "read-only");
  assert.equal(json.sourceBundle.checkCommandSafety.safetyLevel, "local-read-only");
  assert.equal(json.sourceBundle.strictCheckCommandSafety.strict, true);
  assert.equal(json.sourceBundle.handoffCommandRunPolicy, "read-only");
  assert.equal(json.sourceBundle.handoffCommandSafety.targetRepoMutation, false);
  assert.equal(json.sourceBundle.strictHandoffCommandSafety.externalCalls, false);
  assert.deepEqual(json.boundaries, report.boundaries);
  assert.equal(json.externalCalls, false);
  assert.equal(json.targetRepoMutation, false);
  assert.equal(json.bundle.mcpProbeStatus, "pass");
  assert.deepEqual(json.bundle.mcpProbeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.deepEqual(json.bundle.implementationEvidence, {
    executedWork: 0,
    verificationResults: 0,
    remainingRisks: 3,
    nextActions: 0,
  });
  assert.equal(json.bundle.verifiedGeneratedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(json.bundle.generatedFailures, 0);
  assert.deepEqual(json.bundle.generatedDriftFiles, []);
  assert.deepEqual(json.bundle.boundaries, report.boundaries);
  assert.equal(json.bundle.externalCalls, false);
  assert.equal(json.bundle.targetRepoMutation, false);
  assert.equal(json.bundle.repairGuidance.available, true);
  assert.equal(json.bundle.selectedTask, null);
  assert.equal(json.bundle.taskCatalog.count, 3);
  assert.equal(json.bundle.defaultTask.id, "task-accessibility");
  assert.match(json.bundle.defaultTask.strictHandoffCommand, /--bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md/);
  assert.deepEqual(json.bundle.defaultTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--strict", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.equal(json.bundle.defaultTask.strictHandoffCommandRunPolicy, "writes-local-file");
  assert.equal(json.bundle.defaultTask.strictHandoffCommandSafety.writesLocalFile, true);
  assert.equal(json.bundle.effectiveTask.id, "task-accessibility");
  assert.match(json.bundle.effectiveTask.strictHandoffCommand, /--bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md/);
  assert.deepEqual(json.bundle.effectiveTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--strict", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.equal(json.bundle.effectiveTask.strictHandoffCommandSafety.safetyLevel, "local-output-file");
  assert.deepEqual(json.bundle.taskCatalog.items.map((task) => task.id), [
    "task-accessibility",
    "task-homepage-cta",
    "task-content-quality",
  ]);
  assert.equal(json.bundle.taskCatalog.items[2].handoffOutFile, "target-repo-task-content-quality-handoff.md");
  assert.match(json.bundle.taskCatalog.items[2].strictHandoffCommand, /--task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md/);
  assert.deepEqual(json.bundle.taskCatalog.items[2].strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-content-quality", "--strict", "--out", "target-repo-task-content-quality-handoff.md"]);
  assert.deepEqual(json.bundle.taskCatalog.items[2].strictHandoffCommandSafety, {
    runPolicy: "writes-local-file",
    safetyLevel: "local-output-file",
    writesLocalFile: true,
    outputFile: "target-repo-task-content-quality-handoff.md",
    mutates: "local-output-file-only",
    externalCalls: false,
    targetRepoMutation: false,
    requiresCleanWorkspace: false,
    requiresReviewBeforeMutation: false,
    strict: true,
  });
  assert.match(json.prompt, /Primary Codex Implementation Prompt/);
  assert.match(human, /Bundle Gate/);

  const selectedReport = buildSiteBundleHandoffReport({ target: dir, taskSelector: "task-content-quality" });
  const selectedJson = JSON.parse(formatSiteBundleHandoffJson(selectedReport));
  assert.equal(selectedReport.status, "pass");
  assert.equal(selectedReport.bundle.selectedTask.id, "task-content-quality");
  assert.equal(selectedReport.bundle.selectedTask.source, "bundle-workspace");
  assert.equal(selectedReport.bundle.selectedTask.handoffOutFile, "target-repo-task-content-quality-handoff.md");
  assert.match(selectedReport.bundle.selectedTask.handoffCommand, /--bundle-handoff --task task-content-quality --out target-repo-task-content-quality-handoff\.md/);
  assert.deepEqual(selectedReport.bundle.selectedTask.handoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-content-quality", "--out", "target-repo-task-content-quality-handoff.md"]);
  assert.equal(selectedReport.bundle.selectedTask.handoffCommandSafety.outputFile, "target-repo-task-content-quality-handoff.md");
  assert.match(selectedReport.bundle.selectedTask.strictHandoffCommand, /--bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md/);
  assert.deepEqual(selectedReport.bundle.selectedTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-content-quality", "--strict", "--out", "target-repo-task-content-quality-handoff.md"]);
  assert.equal(selectedReport.bundle.selectedTask.strictHandoffCommandRunPolicy, "writes-local-file");
  assert.equal(selectedReport.bundle.selectedTask.strictHandoffCommandSafety.strict, true);
  assert.equal(selectedReport.bundle.effectiveTask.id, "task-content-quality");
  assert.equal(selectedReport.bundle.effectiveTask.handoffOutFile, "target-repo-task-content-quality-handoff.md");
  assert.match(selectedReport.bundle.effectiveTask.strictHandoffCommand, /--bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md/);
  assert.deepEqual(selectedReport.bundle.effectiveTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-content-quality", "--strict", "--out", "target-repo-task-content-quality-handoff.md"]);
  assert.equal(selectedReport.bundle.effectiveTask.strictHandoffCommandSafety.outputFile, "target-repo-task-content-quality-handoff.md");
  assert.equal(selectedReport.bundle.taskCatalog.selectedTaskId, "task-content-quality");
  assert.equal(selectedReport.bundle.taskCatalog.selectionMode, "explicit");
  assert.equal(selectedReport.commandManifest.defaultTaskId, "task-accessibility");
  assert.equal(selectedReport.commandManifest.selectedTaskId, "task-content-quality");
  assert.equal(selectedReport.commandManifest.effectiveTaskId, "task-content-quality");
  assert.equal(selectedReport.commandManifest.defaultStrictTaskCommandKey, "task.task-accessibility.handoff.strict");
  assert.equal(selectedReport.commandManifest.selectedStrictTaskCommandKey, "task.task-content-quality.handoff.strict");
  assert.equal(selectedReport.commandManifest.effectiveStrictTaskCommandKey, "task.task-content-quality.handoff.strict");
  assert.equal(selectedReport.commandManifest.commandCount, 10);
  assert.equal(selectedReport.commandManifest.commands[9].taskId, "task-content-quality");
  assert.equal(selectedReport.commandManifest.commands[9].defaultTask, false);
  assert.equal(selectedReport.commandManifest.commands[9].selectedTask, true);
  assert.equal(selectedReport.commandManifest.commands[9].effectiveTask, true);
  assert.equal(selectedReport.operatorRunbook.effectiveTaskId, "task-content-quality");
  assert.equal(selectedReport.operatorRunbook.effectiveStrictTaskCommandKey, "task.task-content-quality.handoff.strict");
  assert.deepEqual(selectedReport.operatorRunbook.stages[2].commandKeys, ["task.task-content-quality.handoff.strict"]);
  assert.deepEqual(selectedReport.operatorRunbook.stageByKey.writeEffectiveTaskPrompt.commandKeys, ["task.task-content-quality.handoff.strict"]);
  assert.deepEqual(selectedReport.operatorRunbook.stages[2].outputFiles, ["target-repo-task-content-quality-handoff.md"]);
  assert.equal(selectedJson.bundle.selectedTask.selector, "task-content-quality");
  assert.equal(selectedJson.commandManifest.selectedStrictTaskCommandKey, "task.task-content-quality.handoff.strict");
  assert.equal(selectedJson.bundle.commandManifest.effectiveStrictTaskCommandKey, "task.task-content-quality.handoff.strict");
  assert.equal(selectedJson.operatorRunbook.effectiveStrictTaskCommandKey, "task.task-content-quality.handoff.strict");
  assert.equal(selectedJson.bundle.operatorRunbook.stages[2].commands[0].key, "task.task-content-quality.handoff.strict");
  assert.equal(selectedJson.operatorRunbook.stageByKey.writeEffectiveTaskPrompt.commands[0].key, "task.task-content-quality.handoff.strict");
  assert.equal(selectedJson.bundle.operatorRunbook.nextCommandEntry.key, "source.bundleCheck.strict");
  assert.equal(selectedJson.bundle.selectedTask.handoffOutFile, "target-repo-task-content-quality-handoff.md");
  assert.match(selectedJson.bundle.selectedTask.strictHandoffCommand, /--bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md/);
  assert.deepEqual(selectedJson.bundle.selectedTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-content-quality", "--strict", "--out", "target-repo-task-content-quality-handoff.md"]);
  assert.equal(selectedJson.bundle.selectedTask.strictHandoffCommandSafety.targetRepoMutation, false);
  assert.equal(selectedJson.bundle.effectiveTask.id, "task-content-quality");
  assert.match(selectedJson.bundle.effectiveTask.strictHandoffCommand, /--bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md/);
  assert.deepEqual(selectedJson.bundle.effectiveTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-content-quality", "--strict", "--out", "target-repo-task-content-quality-handoff.md"]);
  assert.equal(selectedJson.bundle.effectiveTask.strictHandoffCommandSafety.externalCalls, false);
  assert.equal(selectedJson.bundle.taskCatalog.selectedTaskId, "task-content-quality");
  assert.match(selectedReport.prompt, /Primary task selection: task-content-quality/);
  assert.match(selectedReport.prompt, /Selected task: task-content-quality/);
  assert.match(selectedReport.prompt, /Selected task strict command: `design-ai site .* --bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md`/);
  assert.match(selectedReport.prompt, /Effective task: task-content-quality/);
  assert.match(selectedReport.prompt, /Effective task strict command: `design-ai site .* --bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md`/);
  assert.match(selectedReport.prompt, /Task ID: task-content-quality/);

  const selectedByNumberReport = buildSiteBundleHandoffReport({ target: dir, taskSelector: "3" });
  assert.equal(selectedByNumberReport.bundle.selectedTask.id, "task-content-quality");
  assert.match(selectedByNumberReport.prompt, /Task ID: task-content-quality/);
  assert.throws(
    () => buildSiteBundleHandoffReport({ target: dir, taskSelector: "missing-task" }),
    /Unknown refactor task: missing-task/,
  );

  writeFileSync(path.join(dir, "codex-implementation.md"), "tampered\n", "utf8");
  const tampered = buildSiteBundleHandoffReport({ target: dir });
  assert.equal(tampered.status, "fail");
  assert.equal(tampered.valid, false);
  assert.match(tampered.prompt, /did not fully pass local bundle-check validation/);
  assert.ok(tampered.issues.some((issue) => issue.id === "bundle-checksum-codex-implementation.md"));
}));
