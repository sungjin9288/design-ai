// Tests for apply plan handles missing review files and renders reports.

import { test } from "node:test";
import assert from "node:assert/strict";

import { buildSkillProposalApplyPlan, renderSkillProposalApplyPlanReport } from "./skill-proposals.mjs";
import {
  buildAcceptedApplyPlanFixture,
  runStrictProposalsPayload,
  withTempDirAsync,
  writePendingReviewFile,
  writeStrictProposalsFixture,
} from "./learn-test-support.mjs";

test("apply plan handles missing review files and renders reports", () => withTempDirAsync(async (dir) => {
  const { filePath, usageFile, before } = writeStrictProposalsFixture(dir);
  const previousExitCode = process.exitCode;
  try {
    process.exitCode = undefined;
    const strictPayload = await runStrictProposalsPayload({ dir, filePath, usageFile });
    const reviewFile = writePendingReviewFile(dir, strictPayload);
    const { acceptedProposalPayload, applyPlan } = buildAcceptedApplyPlanFixture(dir, filePath, usageFile, strictPayload);
    const missingReviewFileApplyPlan = buildSkillProposalApplyPlan({
      ...acceptedProposalPayload,
      reviewFile: "",
      review: {
        ...acceptedProposalPayload.review,
        file: "",
      },
    }, {
      generatedAt: new Date("2026-06-10T00:12:30.000Z"),
    });
    assert.equal(missingReviewFileApplyPlan.commandContract.valid, false);
    assert.equal(missingReviewFileApplyPlan.commandContract.status, "fail");
    assert.equal(missingReviewFileApplyPlan.commandContract.checkCount, 18);
    assert.equal(missingReviewFileApplyPlan.commandContract.passCount, 14);
    assert.equal(missingReviewFileApplyPlan.commandContract.warningCount, 0);
    assert.equal(missingReviewFileApplyPlan.commandContract.failureCount, 4);
    assert.equal(missingReviewFileApplyPlan.commandContract.nextCommandKey, "");
    assert.equal(missingReviewFileApplyPlan.commandContract.nextCommand, "");
    assert.deepEqual(missingReviewFileApplyPlan.commandContract.nextCommandArgs, []);
    assert.equal(missingReviewFileApplyPlan.commandContract.nextCommandRunPolicy, "");
    assert.deepEqual(missingReviewFileApplyPlan.commandContract.nextCommandSafety, {});
    assert.equal(missingReviewFileApplyPlan.commandContract.commandSequenceCount, 0);
    assert.deepEqual(missingReviewFileApplyPlan.commandContract.commandSequence, []);
    assert.deepEqual(missingReviewFileApplyPlan.commandContract.commandSequenceKeys, []);
    assert.deepEqual(missingReviewFileApplyPlan.commandContract.commandSequenceByKey, {});
    assert.deepEqual(missingReviewFileApplyPlan.commandContract.operatorRunbook, {
      version: 1,
      executable: false,
      blocked: true,
      stageCount: 0,
      requiredStageCount: 0,
      commandStageCount: 0,
      nextStageKey: "",
      nextStageCommandKeys: [],
      nextRequiredStageKey: "",
      nextRequiredStageCommandKeys: [],
      nextRequiredCommandStageKey: "",
      nextRequiredCommandStageCommandKeys: [],
      stageSelection: {},
      stageKeys: [],
      stageByKey: {},
      stages: [],
      reason: "Command contract failures must be fixed before running the operator runbook.",
    });
    assert.deepEqual(missingReviewFileApplyPlan.commandContract.commandSequenceSummary, {
      executable: false,
      blocked: true,
      stepCount: 0,
      readOnlyStepCount: 0,
      localOutputStepCount: 0,
      writesLocalFiles: false,
      writesOutputArtifacts: false,
      mutatesProfile: false,
      mutatesReviewFile: false,
      mutatesSkillFiles: false,
      callsExternalAiApis: false,
      requiresCleanWorkspace: false,
      runPolicy: "blocked",
      reason: "Command contract failures must be fixed before running follow-up commands.",
    });
    assert.deepEqual(missingReviewFileApplyPlan.commandContract.failedCheckIds, [
      "reviewCheckJson-review-file-context",
      "reviewCheckReport-review-file-context",
      "proposalPatchPreview-review-file-context",
      "strictGate-review-file-context",
    ]);
    assert.match(missingReviewFileApplyPlan.commandContract.nextAction, /Fix command contract failures/);
    const missingReviewFileReport = renderSkillProposalApplyPlanReport(missingReviewFileApplyPlan, {
      generatedAt: new Date("2026-06-10T00:12:45.000Z"),
    });
    assert.match(missingReviewFileReport, /- Check count: 18/);
    assert.match(missingReviewFileReport, /- Pass count: 14/);
    assert.match(missingReviewFileReport, /- Warning count: 0/);
    assert.match(missingReviewFileReport, /- Failure count: 4/);
    assert.match(missingReviewFileReport, /- Failed checks: reviewCheckJson-review-file-context, reviewCheckReport-review-file-context, proposalPatchPreview-review-file-context, strictGate-review-file-context/);
    assert.match(missingReviewFileReport, /Failed command checks:/);
    assert.equal(applyPlan.privacy.mutatesReviewFile, false);
    assert.equal(applyPlan.privacy.mutatesSkillFiles, false);
    const applyPlanReport = renderSkillProposalApplyPlanReport(applyPlan, {
      generatedAt: new Date("2026-06-10T00:13:00.000Z"),
    });
    assert.match(applyPlanReport, /^# Skill Proposal Apply Plan/);
    assert.match(applyPlanReport, /Manual Apply Tasks/);
    assert.match(applyPlanReport, /After the skill edit and verification pass, update the review decision from `accepted` to `applied`/);
    assert.match(applyPlanReport, /## Command Contract/);
    assert.match(applyPlanReport, /- Valid: yes/);
    assert.match(applyPlanReport, /- Required keys: reviewCheckJson, reviewCheckReport, proposalPatchPreview, strictGate/);
    assert.match(applyPlanReport, /- Check count: 18/);
    assert.match(applyPlanReport, /- Pass count: 18/);
    assert.match(applyPlanReport, /- Warning count: 0/);
    assert.match(applyPlanReport, /- Failure count: 0/);
    assert.match(applyPlanReport, /- Failed checks: none/);
    assert.match(applyPlanReport, /- Next command key: reviewCheckJson/);
    assert.match(applyPlanReport, /- Next command policy: preview-only/);
    assert.match(applyPlanReport, /- Next command safety: read-only/);
    assert.match(applyPlanReport, /- Next command: `design-ai learn --propose-skills .* --review-check --json`/);
    assert.match(applyPlanReport, /- Command sequence count: 4/);
    assert.match(applyPlanReport, /- Command sequence keys: reviewCheckJson, reviewCheckReport, proposalPatchPreview, strictGate/);
    assert.match(applyPlanReport, /- Command sequence policy: mixed-preview-local-output/);
    assert.match(applyPlanReport, /- Command sequence executable: yes/);
    assert.match(applyPlanReport, /- Command sequence local outputs: 2/);
    assert.match(applyPlanReport, /- Command sequence mutates profile: no/);
    assert.match(applyPlanReport, /- Command sequence mutates review file: no/);
    assert.match(applyPlanReport, /- Command sequence mutates skill files: no/);
    assert.match(applyPlanReport, /- Command sequence calls external AI APIs: no/);
    assert.match(applyPlanReport, /- Operator runbook stages: 4/);
    assert.match(applyPlanReport, /- Operator runbook keys: previewArtifacts, manualSkillEdit, reviewReadiness, strictGate/);
    assert.match(applyPlanReport, /- Operator runbook required stages: 3/);
    assert.match(applyPlanReport, /- Operator runbook next stage: previewArtifacts/);
    assert.match(applyPlanReport, /- Operator runbook next required stage: manualSkillEdit/);
    assert.match(applyPlanReport, /- Operator runbook next required command stage: reviewReadiness/);
    assert.match(applyPlanReport, /- Operator runbook stage selection: optional-preview-before-required-manual-edit/);
    assert.match(applyPlanReport, /- Operator runbook decision: offer-optional-preview/);
    assert.match(applyPlanReport, /- Operator runbook decision safety: local-output/);
    assert.match(applyPlanReport, /- Operator runbook decision commands: reviewCheckReport, proposalPatchPreview/);
    assert.match(applyPlanReport, /- Operator runbook decision next command: reviewCheckReport/);
    assert.match(applyPlanReport, /- Operator runbook selected stage: previewArtifacts \(optional, local-output-preview\)/);
    assert.match(applyPlanReport, /Command sequence:/);
    assert.match(applyPlanReport, /- 1\. reviewCheckJson \(preview-only \/ read-only\): `design-ai learn --propose-skills .* --review-check --json`/);
    assert.match(applyPlanReport, /- 2\. reviewCheckReport \(output-artifact \/ local-output\): `design-ai learn --propose-skills .* --review-check --report --out skill-proposal-review-check\.md`/);
    assert.match(applyPlanReport, /- 3\. proposalPatchPreview \(output-artifact \/ local-output\): `design-ai learn --propose-skills .* --patch --out skill-proposals\.patch`/);
    assert.match(applyPlanReport, /- 4\. strictGate \(strict-readiness-gate \/ read-only\): `design-ai learn --propose-skills .* --strict --json`/);
    assert.match(applyPlanReport, /Operator runbook:/);
    assert.match(applyPlanReport, /- 1\. previewArtifacts \(optional \/ local-output-preview\): reviewCheckReport, proposalPatchPreview/);
    assert.match(applyPlanReport, /- 2\. manualSkillEdit \(required \/ manual-review\): manual/);
    assert.match(applyPlanReport, /- 3\. reviewReadiness \(required \/ read-only-check\): reviewCheckJson/);
    assert.match(applyPlanReport, /- 4\. strictGate \(required \/ read-only-gate\): strictGate/);
    assert.match(applyPlanReport, /- Next action: Run reviewCheckJson after manual skill edits, then use strictGate before marking proposals applied\./);
    assert.match(applyPlanReport, /- Mutates review file: no/);
  } finally {
    process.exitCode = previousExitCode;
  }
}));
