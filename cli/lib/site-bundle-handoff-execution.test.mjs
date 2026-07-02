// Tests for bundle-handoff runbook stage execution maps and task catalog.

import { test } from "node:test";
import assert from "node:assert/strict";

import { SITE_BUNDLE_CHECKSUM_FILES } from "./site.mjs";
import { buildHandoffFixture, withTempDir } from "./site-test-support.mjs";

test("bundle-handoff runbook stage execution maps and task catalog", () => withTempDir((dir) => {
  const { bundle, human, json, report, summary, workspace } = buildHandoffFixture(dir);
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
}));
