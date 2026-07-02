// Tests for runLearn --propose-skills --apply-plan emits JSON, human, and Markdown reports.

import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runLearn } from "../commands/learn.mjs";
import {
  buildAcceptedApplyPlanFixture,
  captureStdout,
  runStrictProposalsPayload,
  withTempDirAsync,
  writeStrictProposalsFixture,
} from "./learn-test-support.mjs";

test("runLearn --propose-skills --apply-plan emits JSON, human, and Markdown reports", () => withTempDirAsync(async (dir) => {
  const { filePath, usageFile, before, candidateSkillPath, candidateSkillBefore } = writeStrictProposalsFixture(dir);
  const previousExitCode = process.exitCode;
  try {
    process.exitCode = undefined;
    const strictPayload = await runStrictProposalsPayload({ dir, filePath, usageFile });
    const { acceptedReviewFile, acceptedReviewBefore, applyPlanContextArgs } = buildAcceptedApplyPlanFixture(dir, filePath, usageFile, strictPayload);
    const applyPlanJsonOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      acceptedReviewFile,
      "--apply-plan",
      "--json",
    ]));
    const applyPlanJsonPayload = JSON.parse(applyPlanJsonOutput);
    assert.equal(applyPlanJsonPayload.kind, "skill-proposal-apply-plan");
    assert.equal(applyPlanJsonPayload.acceptedCount, 1);
    assert.equal(applyPlanJsonPayload.count, 1);
    assert.equal(applyPlanJsonPayload.tasks[0].candidateSkillPath, "skills/website-improvement/SKILL.md");
    assert.deepEqual(applyPlanJsonPayload.commandArgs.strictGate, [
      ...applyPlanContextArgs,
      "--strict",
      "--json",
    ]);
    assert.deepEqual(applyPlanJsonPayload.commandArgs.proposalPatchPreview, [
      ...applyPlanContextArgs,
      "--patch",
      "--out",
      "skill-proposals.patch",
    ]);
    assert.equal(applyPlanJsonPayload.commandContract.valid, true);
    assert.equal(applyPlanJsonPayload.commandContract.status, "pass");
    assert.deepEqual(applyPlanJsonPayload.commandContract.requiredKeys, [
      "reviewCheckJson",
      "reviewCheckReport",
      "proposalPatchPreview",
      "strictGate",
    ]);
    assert.equal(applyPlanJsonPayload.commandContract.summary.failures, 0);
    assert.equal(applyPlanJsonPayload.commandContract.summary.warnings, 0);
    assert.equal(applyPlanJsonPayload.commandContract.summary.passes, 18);
    assert.equal(applyPlanJsonPayload.commandContract.checkCount, 18);
    assert.equal(applyPlanJsonPayload.commandContract.passCount, 18);
    assert.equal(applyPlanJsonPayload.commandContract.warningCount, 0);
    assert.equal(applyPlanJsonPayload.commandContract.failureCount, 0);
    assert.deepEqual(applyPlanJsonPayload.commandContract.failedCheckIds, []);
    assert.deepEqual(applyPlanJsonPayload.commandContract.failedChecks, []);
    assert.equal(applyPlanJsonPayload.commandContract.nextCommandKey, "reviewCheckJson");
    assert.equal(applyPlanJsonPayload.commandContract.nextCommand, applyPlanJsonPayload.commands.reviewCheckJson);
    assert.deepEqual(applyPlanJsonPayload.commandContract.nextCommandArgs, applyPlanJsonPayload.commandArgs.reviewCheckJson);
    assert.equal(applyPlanJsonPayload.commandContract.nextCommandRunPolicy, "preview-only");
    assert.equal(applyPlanJsonPayload.commandContract.nextCommandSafety.level, "read-only");
    assert.equal(applyPlanJsonPayload.commandContract.nextCommandSafety.mutatesLocalState, false);
    assert.equal(applyPlanJsonPayload.commandContract.nextCommandSafety.mutatesSkillFiles, false);
    assert.equal(applyPlanJsonPayload.commandContract.nextCommandSafety.callsExternalAiApis, false);
    assert.equal(applyPlanJsonPayload.commandContract.commandSequenceCount, 4);
    assert.deepEqual(applyPlanJsonPayload.commandContract.commandSequenceSummary, {
      executable: true,
      blocked: false,
      stepCount: 4,
      readOnlyStepCount: 2,
      localOutputStepCount: 2,
      writesLocalFiles: true,
      writesOutputArtifacts: true,
      mutatesProfile: false,
      mutatesReviewFile: false,
      mutatesSkillFiles: false,
      callsExternalAiApis: false,
      requiresCleanWorkspace: false,
      runPolicy: "mixed-preview-local-output",
      reason: "The sequence combines read-only readiness checks with local output artifact previews; it does not mutate learning, review, or skill files.",
    });
    assert.deepEqual(applyPlanJsonPayload.commandContract.commandSequenceKeys, [
      "reviewCheckJson",
      "reviewCheckReport",
      "proposalPatchPreview",
      "strictGate",
    ]);
    assert.deepEqual(applyPlanJsonPayload.commandContract.commandSequence.map((item) => [
      item.step,
      item.key,
      item.runPolicy,
      item.safety.level,
      item.safety.writesLocalFiles,
      item.safety.mutatesProfile,
      item.safety.mutatesReviewFile,
      item.safety.mutatesSkillFiles,
      item.safety.callsExternalAiApis,
    ]), [
      [1, "reviewCheckJson", "preview-only", "read-only", false, false, false, false, false],
      [2, "reviewCheckReport", "output-artifact", "local-output", true, false, false, false, false],
      [3, "proposalPatchPreview", "output-artifact", "local-output", true, false, false, false, false],
      [4, "strictGate", "strict-readiness-gate", "read-only", false, false, false, false, false],
    ]);
    assert.deepEqual(Object.keys(applyPlanJsonPayload.commandContract.commandSequenceByKey), [
      "reviewCheckJson",
      "reviewCheckReport",
      "proposalPatchPreview",
      "strictGate",
    ]);
    assert.equal(
      applyPlanJsonPayload.commandContract.commandSequenceByKey.reviewCheckJson.command,
      applyPlanJsonPayload.commands.reviewCheckJson,
    );
    assert.deepEqual(
      applyPlanJsonPayload.commandContract.commandSequenceByKey.reviewCheckReport.commandArgs,
      applyPlanJsonPayload.commandArgs.reviewCheckReport,
    );
    assert.equal(applyPlanJsonPayload.commandContract.commandSequenceByKey.proposalPatchPreview.safety.level, "local-output");
    assert.equal(applyPlanJsonPayload.commandContract.commandSequenceByKey.strictGate.runPolicy, "strict-readiness-gate");
    assert.equal(applyPlanJsonPayload.commandContract.operatorRunbook.executable, true);
    assert.equal(applyPlanJsonPayload.commandContract.operatorRunbook.stageCount, 4);
    assert.equal(applyPlanJsonPayload.commandContract.operatorRunbook.nextRequiredStageKey, "manualSkillEdit");
    assert.deepEqual(applyPlanJsonPayload.commandContract.operatorRunbook.nextRequiredStageCommandKeys, []);
    assert.equal(applyPlanJsonPayload.commandContract.operatorRunbook.nextRequiredCommandStageKey, "reviewReadiness");
    assert.deepEqual(applyPlanJsonPayload.commandContract.operatorRunbook.nextRequiredCommandStageCommandKeys, ["reviewCheckJson"]);
    assert.equal(
      applyPlanJsonPayload.commandContract.operatorRunbook.stageSelection.strategy,
      "optional-preview-before-required-manual-edit",
    );
    assert.deepEqual(applyPlanJsonPayload.commandContract.operatorRunbook.stageSelection.stageOrder, [
      "previewArtifacts",
      "manualSkillEdit",
      "reviewReadiness",
      "strictGate",
    ]);
    assert.deepEqual(applyPlanJsonPayload.commandContract.operatorRunbook.stageSelection.decision, {
      action: "offer-optional-preview",
      stageKey: "previewArtifacts",
      stageKind: "local-output-preview",
      required: false,
      hasCommands: true,
      commandCount: 2,
      commandKeys: ["reviewCheckReport", "proposalPatchPreview"],
      commands: [
        {
          step: 2,
          key: "reviewCheckReport",
          command: applyPlanJsonPayload.commands.reviewCheckReport,
          commandArgs: applyPlanJsonPayload.commandArgs.reviewCheckReport,
          runPolicy: "output-artifact",
          safetyLevel: "local-output",
          safety: {
            level: "local-output",
            writesLocalFiles: true,
            writesOutputArtifact: true,
            mutatesLocalState: true,
            mutatesProfile: false,
            mutatesReviewFile: false,
            mutatesSkillFiles: false,
            callsExternalAiApis: false,
            requiresCleanWorkspace: false,
            reason: "This follow-up command writes a local preview artifact with --out but does not mutate learning, review, or skill files.",
          },
          writesLocalFiles: true,
          writesOutputArtifact: true,
          mutatesLocalState: true,
          mutatesProfile: false,
          mutatesReviewFile: false,
          mutatesSkillFiles: false,
          callsExternalAiApis: false,
          requiresCleanWorkspace: false,
        },
        {
          step: 3,
          key: "proposalPatchPreview",
          command: applyPlanJsonPayload.commands.proposalPatchPreview,
          commandArgs: applyPlanJsonPayload.commandArgs.proposalPatchPreview,
          runPolicy: "output-artifact",
          safetyLevel: "local-output",
          safety: {
            level: "local-output",
            writesLocalFiles: true,
            writesOutputArtifact: true,
            mutatesLocalState: true,
            mutatesProfile: false,
            mutatesReviewFile: false,
            mutatesSkillFiles: false,
            callsExternalAiApis: false,
            requiresCleanWorkspace: false,
            reason: "This follow-up command writes a local preview artifact with --out but does not mutate learning, review, or skill files.",
          },
          writesLocalFiles: true,
          writesOutputArtifact: true,
          mutatesLocalState: true,
          mutatesProfile: false,
          mutatesReviewFile: false,
          mutatesSkillFiles: false,
          callsExternalAiApis: false,
          requiresCleanWorkspace: false,
        },
      ],
      commandByKey: {
        reviewCheckReport: {
          step: 2,
          key: "reviewCheckReport",
          command: applyPlanJsonPayload.commands.reviewCheckReport,
          commandArgs: applyPlanJsonPayload.commandArgs.reviewCheckReport,
          runPolicy: "output-artifact",
          safetyLevel: "local-output",
          safety: {
            level: "local-output",
            writesLocalFiles: true,
            writesOutputArtifact: true,
            mutatesLocalState: true,
            mutatesProfile: false,
            mutatesReviewFile: false,
            mutatesSkillFiles: false,
            callsExternalAiApis: false,
            requiresCleanWorkspace: false,
            reason: "This follow-up command writes a local preview artifact with --out but does not mutate learning, review, or skill files.",
          },
          writesLocalFiles: true,
          writesOutputArtifact: true,
          mutatesLocalState: true,
          mutatesProfile: false,
          mutatesReviewFile: false,
          mutatesSkillFiles: false,
          callsExternalAiApis: false,
          requiresCleanWorkspace: false,
        },
        proposalPatchPreview: {
          step: 3,
          key: "proposalPatchPreview",
          command: applyPlanJsonPayload.commands.proposalPatchPreview,
          commandArgs: applyPlanJsonPayload.commandArgs.proposalPatchPreview,
          runPolicy: "output-artifact",
          safetyLevel: "local-output",
          safety: {
            level: "local-output",
            writesLocalFiles: true,
            writesOutputArtifact: true,
            mutatesLocalState: true,
            mutatesProfile: false,
            mutatesReviewFile: false,
            mutatesSkillFiles: false,
            callsExternalAiApis: false,
            requiresCleanWorkspace: false,
            reason: "This follow-up command writes a local preview artifact with --out but does not mutate learning, review, or skill files.",
          },
          writesLocalFiles: true,
          writesOutputArtifact: true,
          mutatesLocalState: true,
          mutatesProfile: false,
          mutatesReviewFile: false,
          mutatesSkillFiles: false,
          callsExternalAiApis: false,
          requiresCleanWorkspace: false,
        },
      },
      commandStepByKey: {
        reviewCheckReport: 2,
        proposalPatchPreview: 3,
      },
      commandRunPolicyByKey: {
        reviewCheckReport: "output-artifact",
        proposalPatchPreview: "output-artifact",
      },
      commandSafetyLevelByKey: {
        reviewCheckReport: "local-output",
        proposalPatchPreview: "local-output",
      },
      commandArgsByKey: {
        reviewCheckReport: applyPlanJsonPayload.commandArgs.reviewCheckReport,
        proposalPatchPreview: applyPlanJsonPayload.commandArgs.proposalPatchPreview,
      },
      commandStringByKey: {
        reviewCheckReport: applyPlanJsonPayload.commands.reviewCheckReport,
        proposalPatchPreview: applyPlanJsonPayload.commands.proposalPatchPreview,
      },
      commandDisplayLabelByKey: {
        reviewCheckReport: "Review check Markdown report",
        proposalPatchPreview: "Skill proposal patch preview",
      },
      commandDescriptionByKey: {
        reviewCheckReport: "Generate a Markdown review-check artifact for accepted proposal readiness.",
        proposalPatchPreview: "Generate a unified diff preview for accepted skill proposal edits.",
      },
      commandOutputArtifactByKey: {
        reviewCheckReport: "skill-proposal-review-check.md",
        proposalPatchPreview: "skill-proposals.patch",
      },
      commandOutputArtifactTypeByKey: {
        reviewCheckReport: "markdown-report",
        proposalPatchPreview: "unified-diff",
      },
      commandOutputArtifactActionByKey: {
        reviewCheckReport: "render-markdown-report",
        proposalPatchPreview: "render-unified-diff-preview",
      },
      commandOutputArtifactMediaTypeByKey: {
        reviewCheckReport: "text/markdown",
        proposalPatchPreview: "text/x-diff",
      },
      commandOutputArtifactDispositionByKey: {
        reviewCheckReport: "review-only",
        proposalPatchPreview: "manual-apply-preview",
      },
      commandOutputArtifactManualApplyCandidateByKey: {
        reviewCheckReport: false,
        proposalPatchPreview: true,
      },
      commandOutputArtifactRequiresManualReviewByKey: {
        reviewCheckReport: false,
        proposalPatchPreview: true,
      },
      commandOutputArtifactReviewInstructionByKey: {
        reviewCheckReport: "Review the Markdown readiness report before changing proposal review status.",
        proposalPatchPreview: "Review the unified diff manually before applying any skill-file edits.",
      },
      commandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey: {
        reviewCheckReport: false,
        proposalPatchPreview: true,
      },
      commandOutputArtifactApplyPreconditionIdsByKey: {
        reviewCheckReport: [],
        proposalPatchPreview: ["manual-review", "clean-workspace"],
      },
      commandOutputArtifactApplyPreconditionLabelsByKey: {
        reviewCheckReport: [],
        proposalPatchPreview: ["Manual review completed", "Clean workspace confirmed"],
      },
      commandOutputArtifactApplyPreconditionsByKey: {
        reviewCheckReport: [],
        proposalPatchPreview: [
          { id: "manual-review", label: "Manual review completed", required: true },
          { id: "clean-workspace", label: "Clean workspace confirmed", required: true },
        ],
      },
      commandOutputArtifactApplyPreconditionCountByKey: {
        reviewCheckReport: 0,
        proposalPatchPreview: 2,
      },
      commandOutputArtifactRequiredApplyPreconditionCountByKey: {
        reviewCheckReport: 0,
        proposalPatchPreview: 2,
      },
      commandOutputArtifactSatisfiedApplyPreconditionCountByKey: {
        reviewCheckReport: 0,
        proposalPatchPreview: 0,
      },
      commandOutputArtifactPendingApplyPreconditionCountByKey: {
        reviewCheckReport: 0,
        proposalPatchPreview: 2,
      },
      commandOutputArtifactRequiredPendingApplyPreconditionCountByKey: {
        reviewCheckReport: 0,
        proposalPatchPreview: 2,
      },
      commandOutputArtifactManualApplyReadyByKey: {
        reviewCheckReport: false,
        proposalPatchPreview: false,
      },
      commandOutputArtifactManualApplyStatusByKey: {
        reviewCheckReport: "not-applicable",
        proposalPatchPreview: "blocked",
      },
      commandOutputArtifactManualApplyStatusLabelByKey: {
        reviewCheckReport: "Review only",
        proposalPatchPreview: "Blocked",
      },
      commandOutputArtifactManualApplyStatusToneByKey: {
        reviewCheckReport: "neutral",
        proposalPatchPreview: "warning",
      },
      commandOutputArtifactManualApplyBlockedReasonByKey: {
        reviewCheckReport: "This output artifact is review-only and cannot be applied.",
        proposalPatchPreview: "Complete required apply preconditions before applying this patch preview.",
      },
      commandOutputArtifactManualApplyBlockedReasonCodeByKey: {
        reviewCheckReport: "not-manual-apply-candidate",
        proposalPatchPreview: "required-preconditions-pending",
      },
      nextCommandEntry: {
        step: 2,
        key: "reviewCheckReport",
        command: applyPlanJsonPayload.commands.reviewCheckReport,
        commandArgs: applyPlanJsonPayload.commandArgs.reviewCheckReport,
        runPolicy: "output-artifact",
        safetyLevel: "local-output",
        safety: {
          level: "local-output",
          writesLocalFiles: true,
          writesOutputArtifact: true,
          mutatesLocalState: true,
          mutatesProfile: false,
          mutatesReviewFile: false,
          mutatesSkillFiles: false,
          callsExternalAiApis: false,
          requiresCleanWorkspace: false,
          reason: "This follow-up command writes a local preview artifact with --out but does not mutate learning, review, or skill files.",
        },
        writesLocalFiles: true,
        writesOutputArtifact: true,
        mutatesLocalState: true,
        mutatesProfile: false,
        mutatesReviewFile: false,
        mutatesSkillFiles: false,
        callsExternalAiApis: false,
        requiresCleanWorkspace: false,
      },
      nextCommandKey: "reviewCheckReport",
      nextCommandDisplayLabel: "Review check Markdown report",
      nextCommandDescription: "Generate a Markdown review-check artifact for accepted proposal readiness.",
      nextCommandOutputArtifact: "skill-proposal-review-check.md",
      nextCommandOutputArtifactType: "markdown-report",
      nextCommandOutputArtifactAction: "render-markdown-report",
      nextCommandOutputArtifactMediaType: "text/markdown",
      nextCommandOutputArtifactDisposition: "review-only",
      nextCommandOutputArtifactManualApplyCandidate: false,
      nextCommandOutputArtifactRequiresManualReview: false,
      nextCommandOutputArtifactReviewInstruction: "Review the Markdown readiness report before changing proposal review status.",
      nextCommandOutputArtifactRequiresCleanWorkspaceBeforeApply: false,
      nextCommandOutputArtifactApplyPreconditionIds: [],
      nextCommandOutputArtifactApplyPreconditionLabels: [],
      nextCommandOutputArtifactApplyPreconditions: [],
      nextCommandOutputArtifactApplyPreconditionCount: 0,
      nextCommandOutputArtifactRequiredApplyPreconditionCount: 0,
      nextCommandOutputArtifactSatisfiedApplyPreconditionCount: 0,
      nextCommandOutputArtifactPendingApplyPreconditionCount: 0,
      nextCommandOutputArtifactRequiredPendingApplyPreconditionCount: 0,
      nextCommandOutputArtifactManualApplyReady: false,
      nextCommandOutputArtifactManualApplyStatus: "not-applicable",
      nextCommandOutputArtifactManualApplyStatusLabel: "Review only",
      nextCommandOutputArtifactManualApplyStatusTone: "neutral",
      nextCommandOutputArtifactManualApplyBlockedReason: "This output artifact is review-only and cannot be applied.",
      nextCommandOutputArtifactManualApplyBlockedReasonCode: "not-manual-apply-candidate",
      nextCommandStep: 2,
      nextCommand: applyPlanJsonPayload.commands.reviewCheckReport,
      nextCommandArgs: applyPlanJsonPayload.commandArgs.reviewCheckReport,
      nextCommandRunPolicy: "output-artifact",
      nextCommandSafetyLevel: "local-output",
      nextCommandSafety: {
        level: "local-output",
        writesLocalFiles: true,
        writesOutputArtifact: true,
        mutatesLocalState: true,
        mutatesProfile: false,
        mutatesReviewFile: false,
        mutatesSkillFiles: false,
        callsExternalAiApis: false,
        requiresCleanWorkspace: false,
        reason: "This follow-up command writes a local preview artifact with --out but does not mutate learning, review, or skill files.",
      },
      runPolicy: "optional-local-output-preview",
      safety: {
        level: "local-output",
        writesLocalFiles: true,
        writesOutputArtifacts: true,
        mutatesLocalState: true,
        mutatesProfile: false,
        mutatesReviewFile: false,
        mutatesSkillFiles: false,
        callsExternalAiApis: false,
        requiresCleanWorkspace: false,
        reason: "The selected decision only writes optional local preview artifacts and does not mutate learning, review, or skill files.",
      },
      nextRequiredStageKey: "manualSkillEdit",
      nextRequiredCommandStageKey: "reviewReadiness",
      requiresOperatorActionBeforeRequiredCommands: true,
      reason: "Offer optional local preview artifacts first; the required path still starts with manual skill edits before read-only command gates.",
    });
    assert.equal(applyPlanJsonPayload.commandContract.operatorRunbook.stageSelection.nextRequiredStageKey, "manualSkillEdit");
    assert.deepEqual(applyPlanJsonPayload.commandContract.operatorRunbook.stageSelection.nextStage, {
      key: "previewArtifacts",
      step: 1,
      label: "Generate optional review artifacts",
      kind: "local-output-preview",
      required: false,
      hasCommands: true,
      commandCount: 2,
      commandKeys: ["reviewCheckReport", "proposalPatchPreview"],
      writesLocalFiles: true,
      writesOutputArtifacts: true,
      mutatesLocalState: true,
      mutatesProfile: false,
      mutatesReviewFile: false,
      mutatesSkillFiles: false,
      callsExternalAiApis: false,
      requiresCleanWorkspace: false,
      reason: "Optional Markdown review and patch preview artifacts can be generated before manual skill edits.",
    });
    assert.deepEqual(applyPlanJsonPayload.commandContract.operatorRunbook.stageSelection.nextRequiredStage, {
      key: "manualSkillEdit",
      step: 2,
      label: "Apply accepted skill deltas manually",
      kind: "manual-review",
      required: true,
      hasCommands: false,
      commandCount: 0,
      commandKeys: [],
      writesLocalFiles: false,
      writesOutputArtifacts: false,
      mutatesLocalState: false,
      mutatesProfile: false,
      mutatesReviewFile: false,
      mutatesSkillFiles: false,
      callsExternalAiApis: false,
      requiresCleanWorkspace: false,
      reason: "No apply-plan command mutates skill files; the operator must manually edit accepted skill deltas after review.",
    });
    assert.equal(applyPlanJsonPayload.commandContract.operatorRunbook.stageSelection.nextRequiredCommandStageKey, "reviewReadiness");
    assert.deepEqual(applyPlanJsonPayload.commandContract.operatorRunbook.stageSelection.nextRequiredCommandStage, {
      key: "reviewReadiness",
      step: 3,
      label: "Run review readiness check",
      kind: "read-only-check",
      required: true,
      hasCommands: true,
      commandCount: 1,
      commandKeys: ["reviewCheckJson"],
      writesLocalFiles: false,
      writesOutputArtifacts: false,
      mutatesLocalState: false,
      mutatesProfile: false,
      mutatesReviewFile: false,
      mutatesSkillFiles: false,
      callsExternalAiApis: false,
      requiresCleanWorkspace: false,
      reason: "Run the read-only review check after manual skill edits to verify proposal review state.",
    });
    assert.deepEqual(applyPlanJsonPayload.commandContract.operatorRunbook.stageKeys, [
      "previewArtifacts",
      "manualSkillEdit",
      "reviewReadiness",
      "strictGate",
    ]);
    assert.deepEqual(Object.keys(applyPlanJsonPayload.commandContract.operatorRunbook.stageByKey), [
      "previewArtifacts",
      "manualSkillEdit",
      "reviewReadiness",
      "strictGate",
    ]);
    assert.equal(applyPlanJsonPayload.commandContract.operatorRunbook.stageByKey.previewArtifacts.kind, "local-output-preview");
    assert.deepEqual(applyPlanJsonPayload.commandContract.operatorRunbook.stageByKey.previewArtifacts.commandKeys, [
      "reviewCheckReport",
      "proposalPatchPreview",
    ]);
    assert.equal(applyPlanJsonPayload.commandContract.operatorRunbook.stageByKey.manualSkillEdit.required, true);
    assert.deepEqual(applyPlanJsonPayload.commandContract.operatorRunbook.stageByKey.reviewReadiness.commands.map((command) => command.key), ["reviewCheckJson"]);
    assert.deepEqual(applyPlanJsonPayload.commandContract.operatorRunbook.stageByKey.strictGate.commands.map((command) => command.key), ["strictGate"]);
    assert.deepEqual(applyPlanJsonPayload.commandContract.operatorRunbook.nextStageCommandKeys, [
      "reviewCheckReport",
      "proposalPatchPreview",
    ]);
    assert.deepEqual(applyPlanJsonPayload.commandContract.operatorRunbook.stages.map((stage) => [
      stage.step,
      stage.key,
      stage.kind,
      stage.required,
      stage.commandKeys,
      stage.commands.map((command) => command.key),
    ]), [
      [1, "previewArtifacts", "local-output-preview", false, ["reviewCheckReport", "proposalPatchPreview"], ["reviewCheckReport", "proposalPatchPreview"]],
      [2, "manualSkillEdit", "manual-review", true, [], []],
      [3, "reviewReadiness", "read-only-check", true, ["reviewCheckJson"], ["reviewCheckJson"]],
      [4, "strictGate", "read-only-gate", true, ["strictGate"], ["strictGate"]],
    ]);
    assert.match(applyPlanJsonPayload.commandContract.nextAction, /Run reviewCheckJson after manual skill edits/);
    assert.equal(readFileSync(filePath, "utf8"), before);
    assert.equal(readFileSync(acceptedReviewFile, "utf8"), acceptedReviewBefore);
    assert.equal(readFileSync(candidateSkillPath, "utf8"), candidateSkillBefore);

    const applyPlanHumanOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      acceptedReviewFile,
      "--apply-plan",
    ]));
    assert.match(applyPlanHumanOutput, /Skill proposal apply plan/);
    assert.match(applyPlanHumanOutput, /Manual apply tasks:/);
    assert.match(applyPlanHumanOutput, /Command contract:/);
    assert.match(applyPlanHumanOutput, /- valid: yes/);
    assert.match(applyPlanHumanOutput, /- status: pass/);
    assert.match(applyPlanHumanOutput, /- required keys: reviewCheckJson, reviewCheckReport, proposalPatchPreview, strictGate/);
    assert.match(applyPlanHumanOutput, /- forbidden flags: --yes/);
    assert.match(applyPlanHumanOutput, /- check count: 18/);
    assert.match(applyPlanHumanOutput, /- pass count: 18/);
    assert.match(applyPlanHumanOutput, /- warning count: 0/);
    assert.match(applyPlanHumanOutput, /- failure count: 0/);
    assert.match(applyPlanHumanOutput, /- failed checks: none/);
    assert.match(applyPlanHumanOutput, /- next command key: reviewCheckJson/);
    assert.match(applyPlanHumanOutput, /- next command policy: preview-only/);
    assert.match(applyPlanHumanOutput, /- next command safety: read-only/);
    assert.match(applyPlanHumanOutput, /- next command: design-ai learn --propose-skills .* --review-check --json/);
    assert.match(applyPlanHumanOutput, /- command sequence count: 4/);
    assert.match(applyPlanHumanOutput, /- command sequence keys: reviewCheckJson, reviewCheckReport, proposalPatchPreview, strictGate/);
    assert.match(applyPlanHumanOutput, /- command sequence policy: mixed-preview-local-output/);
    assert.match(applyPlanHumanOutput, /- command sequence executable: yes/);
    assert.match(applyPlanHumanOutput, /- command sequence local outputs: 2/);
    assert.match(applyPlanHumanOutput, /- command sequence mutates profile: no/);
    assert.match(applyPlanHumanOutput, /- command sequence mutates review file: no/);
    assert.match(applyPlanHumanOutput, /- command sequence mutates skill files: no/);
    assert.match(applyPlanHumanOutput, /- command sequence calls external AI APIs: no/);
    assert.match(applyPlanHumanOutput, /- operator runbook stages: 4/);
    assert.match(applyPlanHumanOutput, /- operator runbook keys: previewArtifacts, manualSkillEdit, reviewReadiness, strictGate/);
    assert.match(applyPlanHumanOutput, /- operator runbook required stages: 3/);
    assert.match(applyPlanHumanOutput, /- operator runbook next stage: previewArtifacts/);
    assert.match(applyPlanHumanOutput, /- operator runbook next required stage: manualSkillEdit/);
    assert.match(applyPlanHumanOutput, /- operator runbook next required command stage: reviewReadiness/);
    assert.match(applyPlanHumanOutput, /- operator runbook stage selection: optional-preview-before-required-manual-edit/);
    assert.match(applyPlanHumanOutput, /- operator runbook decision: offer-optional-preview/);
    assert.match(applyPlanHumanOutput, /- operator runbook decision safety: local-output/);
    assert.match(applyPlanHumanOutput, /- operator runbook decision commands: reviewCheckReport, proposalPatchPreview/);
    assert.match(applyPlanHumanOutput, /- operator runbook decision next command: reviewCheckReport/);
    assert.match(applyPlanHumanOutput, /- operator runbook selected stage: previewArtifacts \(optional, local-output-preview\)/);
    assert.match(applyPlanHumanOutput, /Command sequence:/);
    assert.match(applyPlanHumanOutput, /- 1\. reviewCheckJson: preview-only \/ read-only/);
    assert.match(applyPlanHumanOutput, /- 2\. reviewCheckReport: output-artifact \/ local-output/);
    assert.match(applyPlanHumanOutput, /- 3\. proposalPatchPreview: output-artifact \/ local-output/);
    assert.match(applyPlanHumanOutput, /- 4\. strictGate: strict-readiness-gate \/ read-only/);
    assert.match(applyPlanHumanOutput, /Operator runbook:/);
    assert.match(applyPlanHumanOutput, /- 1\. previewArtifacts: optional \/ local-output-preview \/ reviewCheckReport, proposalPatchPreview/);
    assert.match(applyPlanHumanOutput, /- 2\. manualSkillEdit: required \/ manual-review \/ manual/);
    assert.match(applyPlanHumanOutput, /- 3\. reviewReadiness: required \/ read-only-check \/ reviewCheckJson/);
    assert.match(applyPlanHumanOutput, /- 4\. strictGate: required \/ read-only-gate \/ strictGate/);
    assert.match(applyPlanHumanOutput, /- next action: Run reviewCheckJson after manual skill edits, then use strictGate before marking proposals applied\./);
    assert.match(applyPlanHumanOutput, /Privacy: apply plan is read-only/);

    const applyPlanReportPath = path.join(dir, "skill-proposal-apply-plan.md");
    const applyPlanReportOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      acceptedReviewFile,
      "--apply-plan",
      "--report",
      "--out",
      applyPlanReportPath,
    ]));
    assert.match(applyPlanReportOutput, /Wrote /);
    const applyPlanReportFile = readFileSync(applyPlanReportPath, "utf8");
    assert.match(applyPlanReportFile, /^# Skill Proposal Apply Plan/);
    assert.match(applyPlanReportFile, /- Accepted proposals: 1/);
    assert.match(applyPlanReportFile, /## Command Contract/);
    assert.match(applyPlanReportFile, /- Valid: yes/);
    assert.match(applyPlanReportFile, /- Failed checks: none/);
    assert.match(applyPlanReportFile, /- Mutates skill files: no/);
    assert.equal(readFileSync(filePath, "utf8"), before);
    assert.equal(readFileSync(acceptedReviewFile, "utf8"), acceptedReviewBefore);

    process.exitCode = 0;
  } finally {
    process.exitCode = previousExitCode;
  }
}));
