// Tests for bundle-handoff runbook next-action initial validation contract.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildExpectedInitialValidationChecklistSummary,
  buildExpectedNextInitialValidation,
} from "./site-bundle-handoff-expected.mjs";
import { buildHandoffFixture, withTempDir } from "./site-test-support.mjs";

test("bundle-handoff runbook next-action initial validation contract", () => withTempDir((dir) => {
  const { bundle, json, report, summary } = buildHandoffFixture(dir);
  const {
    expectedNextInitialValidationChecklist,
    expectedNextInitialValidationChecklistSummary,
    expectedNextInitialValidationDisplayMetadata,
    expectedNextInitialValidationStates,
    expectedNextInitialValidationSummary,
  } = buildExpectedNextInitialValidation(bundle);
  assert.deepEqual(
    report.operatorRunbook.stageActionEvidenceCaptureInitialValidationStatesByKey.verifySourceBundle,
    expectedNextInitialValidationStates,
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
}));
