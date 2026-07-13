// Tests for emits target-repo prompt from a verified bundle.

import { test } from "node:test";
import assert from "node:assert/strict";

import { SITE_BUNDLE_CHECKSUM_FILES } from "./site.mjs";
import { buildHandoffFixture, withTempDir } from "./site-test-support.mjs";

test("buildSiteBundleHandoffReport emits target-repo prompt from a verified bundle", () => withTempDir((dir) => {
  const { bundle, json, report, summary } = buildHandoffFixture(dir);
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
  assert.deepEqual(report.approval, {
    requiredBeforeTargetRepoMutation: true,
    status: "pending-human-approval",
    taskId: "task-accessibility",
    scope: "selected-target-repo-task",
    targetRepo: "/Users/you/dev/korean-saas-site",
    confirmation: "Approve task-accessibility for /Users/you/dev/korean-saas-site",
  });
  assert.deepEqual(report.bundle.approval, report.approval);
  assert.deepEqual(json.approval, report.approval);
  assert.match(report.prompt, /## Human Approval Gate/);
  assert.match(report.prompt, /wait for explicit human approval before editing target-repo files/);
  assert.match(report.prompt, /Approve task-accessibility for \/Users\/you\/dev\/korean-saas-site/);
  assert.match(report.prompt, /stop before editing files, installing dependencies, running migrations, creating commits, pushing, deploying/);
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
}));
