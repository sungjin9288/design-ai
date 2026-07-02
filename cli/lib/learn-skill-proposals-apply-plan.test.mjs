// Tests for buildSkillProposalApplyPlan derives command contracts from accepted reviews.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildAcceptedApplyPlanFixture,
  runStrictProposalsPayload,
  withTempDirAsync,
  writePendingReviewFile,
  writeStrictProposalsFixture,
} from "./learn-test-support.mjs";

test("buildSkillProposalApplyPlan derives command contracts from accepted reviews", () => withTempDirAsync(async (dir) => {
  const { filePath, usageFile, before } = writeStrictProposalsFixture(dir);
  const previousExitCode = process.exitCode;
  try {
    process.exitCode = undefined;
    const strictPayload = await runStrictProposalsPayload({ dir, filePath, usageFile });
    const reviewFile = writePendingReviewFile(dir, strictPayload);
    const { acceptedReviewFile, applyPlan, applyPlanContextArgs } = buildAcceptedApplyPlanFixture(dir, filePath, usageFile, strictPayload);
    assert.deepEqual(applyPlan.commandArgs.reviewCheckJson, [
      ...applyPlanContextArgs,
      "--review-check",
      "--json",
    ]);
    assert.deepEqual(applyPlan.commandArgs.reviewCheckReport, [
      ...applyPlanContextArgs,
      "--review-check",
      "--report",
      "--out",
      "skill-proposal-review-check.md",
    ]);
    assert.deepEqual(applyPlan.commandArgs.proposalPatchPreview, [
      ...applyPlanContextArgs,
      "--patch",
      "--out",
      "skill-proposals.patch",
    ]);
    assert.deepEqual(applyPlan.commandArgs.strictGate, [
      ...applyPlanContextArgs,
      "--strict",
      "--json",
    ]);
    assert.equal(applyPlan.commandContract.valid, true);
    assert.equal(applyPlan.commandContract.status, "pass");
    assert.equal(applyPlan.commandContract.commandCount, 4);
    assert.equal(applyPlan.commandContract.checkCount, 18);
    assert.equal(applyPlan.commandContract.passCount, 18);
    assert.equal(applyPlan.commandContract.warningCount, 0);
    assert.deepEqual(applyPlan.commandContract.requiredKeys, [
      "reviewCheckJson",
      "reviewCheckReport",
      "proposalPatchPreview",
      "strictGate",
    ]);
    assert.deepEqual(applyPlan.commandContract.missingCommandKeys, []);
    assert.deepEqual(applyPlan.commandContract.unexpectedCommandKeys, []);
    assert.deepEqual(applyPlan.commandContract.baseCommand, ["design-ai", "learn", "--propose-skills"]);
    assert.equal(applyPlan.commandContract.reviewFileRequired, true);
    assert.equal(applyPlan.commandContract.reviewFile, acceptedReviewFile);
    assert.deepEqual(applyPlan.commandContract.forbiddenFlags, ["--yes"]);
    assert.equal(applyPlan.commandContract.failureCount, 0);
    assert.deepEqual(applyPlan.commandContract.failedCheckIds, []);
    assert.deepEqual(applyPlan.commandContract.failedChecks, []);
    assert.equal(applyPlan.commandContract.nextCommandKey, "reviewCheckJson");
    assert.equal(applyPlan.commandContract.nextCommand, applyPlan.commands.reviewCheckJson);
    assert.deepEqual(applyPlan.commandContract.nextCommandArgs, applyPlan.commandArgs.reviewCheckJson);
    assert.equal(applyPlan.commandContract.nextCommandRunPolicy, "preview-only");
    assert.deepEqual(applyPlan.commandContract.nextCommandSafety, {
      level: "read-only",
      writesLocalFiles: false,
      mutatesLocalState: false,
      mutatesProfile: false,
      mutatesReviewFile: false,
      mutatesSkillFiles: false,
      callsExternalAiApis: false,
      requiresCleanWorkspace: false,
      reason: "The next apply-plan follow-up command only checks proposal review readiness and does not mutate local state.",
    });
    assert.equal(applyPlan.commandContract.commandSequenceCount, 4);
    assert.deepEqual(applyPlan.commandContract.commandSequenceSummary, {
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
    assert.deepEqual(applyPlan.commandContract.commandSequenceKeys, [
      "reviewCheckJson",
      "reviewCheckReport",
      "proposalPatchPreview",
      "strictGate",
    ]);
    assert.deepEqual(applyPlan.commandContract.commandSequence.map((item) => ({
      step: item.step,
      key: item.key,
      command: item.command,
      commandArgs: item.commandArgs,
      runPolicy: item.runPolicy,
      safetyLevel: item.safety.level,
      writesLocalFiles: item.safety.writesLocalFiles,
      writesOutputArtifact: item.safety.writesOutputArtifact,
      mutatesProfile: item.safety.mutatesProfile,
      mutatesReviewFile: item.safety.mutatesReviewFile,
      mutatesSkillFiles: item.safety.mutatesSkillFiles,
      callsExternalAiApis: item.safety.callsExternalAiApis,
    })), [
      {
        step: 1,
        key: "reviewCheckJson",
        command: applyPlan.commands.reviewCheckJson,
        commandArgs: applyPlan.commandArgs.reviewCheckJson,
        runPolicy: "preview-only",
        safetyLevel: "read-only",
        writesLocalFiles: false,
        writesOutputArtifact: false,
        mutatesProfile: false,
        mutatesReviewFile: false,
        mutatesSkillFiles: false,
        callsExternalAiApis: false,
      },
      {
        step: 2,
        key: "reviewCheckReport",
        command: applyPlan.commands.reviewCheckReport,
        commandArgs: applyPlan.commandArgs.reviewCheckReport,
        runPolicy: "output-artifact",
        safetyLevel: "local-output",
        writesLocalFiles: true,
        writesOutputArtifact: true,
        mutatesProfile: false,
        mutatesReviewFile: false,
        mutatesSkillFiles: false,
        callsExternalAiApis: false,
      },
      {
        step: 3,
        key: "proposalPatchPreview",
        command: applyPlan.commands.proposalPatchPreview,
        commandArgs: applyPlan.commandArgs.proposalPatchPreview,
        runPolicy: "output-artifact",
        safetyLevel: "local-output",
        writesLocalFiles: true,
        writesOutputArtifact: true,
        mutatesProfile: false,
        mutatesReviewFile: false,
        mutatesSkillFiles: false,
        callsExternalAiApis: false,
      },
      {
        step: 4,
        key: "strictGate",
        command: applyPlan.commands.strictGate,
        commandArgs: applyPlan.commandArgs.strictGate,
        runPolicy: "strict-readiness-gate",
        safetyLevel: "read-only",
        writesLocalFiles: false,
        writesOutputArtifact: false,
        mutatesProfile: false,
        mutatesReviewFile: false,
        mutatesSkillFiles: false,
        callsExternalAiApis: false,
      },
    ]);
    assert.deepEqual(Object.keys(applyPlan.commandContract.commandSequenceByKey), [
      "reviewCheckJson",
      "reviewCheckReport",
      "proposalPatchPreview",
      "strictGate",
    ]);
    assert.equal(applyPlan.commandContract.commandSequenceByKey.reviewCheckJson.command, applyPlan.commands.reviewCheckJson);
    assert.deepEqual(applyPlan.commandContract.commandSequenceByKey.reviewCheckReport.commandArgs, applyPlan.commandArgs.reviewCheckReport);
    assert.equal(applyPlan.commandContract.commandSequenceByKey.proposalPatchPreview.safety.level, "local-output");
    assert.equal(applyPlan.commandContract.commandSequenceByKey.strictGate.runPolicy, "strict-readiness-gate");
    assert.equal(applyPlan.commandContract.operatorRunbook.version, 1);
    assert.equal(applyPlan.commandContract.operatorRunbook.executable, true);
    assert.equal(applyPlan.commandContract.operatorRunbook.blocked, false);
    assert.equal(applyPlan.commandContract.operatorRunbook.stageCount, 4);
    assert.equal(applyPlan.commandContract.operatorRunbook.requiredStageCount, 3);
    assert.equal(applyPlan.commandContract.operatorRunbook.commandStageCount, 3);
    assert.equal(applyPlan.commandContract.operatorRunbook.nextStageKey, "previewArtifacts");
    assert.deepEqual(applyPlan.commandContract.operatorRunbook.nextStageCommandKeys, [
      "reviewCheckReport",
      "proposalPatchPreview",
    ]);
    assert.equal(applyPlan.commandContract.operatorRunbook.nextRequiredStageKey, "manualSkillEdit");
    assert.deepEqual(applyPlan.commandContract.operatorRunbook.nextRequiredStageCommandKeys, []);
    assert.equal(applyPlan.commandContract.operatorRunbook.nextRequiredCommandStageKey, "reviewReadiness");
    assert.deepEqual(applyPlan.commandContract.operatorRunbook.nextRequiredCommandStageCommandKeys, ["reviewCheckJson"]);
    assert.deepEqual(applyPlan.commandContract.operatorRunbook.stageSelection, {
      strategy: "optional-preview-before-required-manual-edit",
      decision: {
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
            command: applyPlan.commands.reviewCheckReport,
            commandArgs: applyPlan.commandArgs.reviewCheckReport,
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
            command: applyPlan.commands.proposalPatchPreview,
            commandArgs: applyPlan.commandArgs.proposalPatchPreview,
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
            command: applyPlan.commands.reviewCheckReport,
            commandArgs: applyPlan.commandArgs.reviewCheckReport,
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
            command: applyPlan.commands.proposalPatchPreview,
            commandArgs: applyPlan.commandArgs.proposalPatchPreview,
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
          reviewCheckReport: applyPlan.commandArgs.reviewCheckReport,
          proposalPatchPreview: applyPlan.commandArgs.proposalPatchPreview,
        },
        commandStringByKey: {
          reviewCheckReport: applyPlan.commands.reviewCheckReport,
          proposalPatchPreview: applyPlan.commands.proposalPatchPreview,
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
          command: applyPlan.commands.reviewCheckReport,
          commandArgs: applyPlan.commandArgs.reviewCheckReport,
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
        nextCommand: applyPlan.commands.reviewCheckReport,
        nextCommandArgs: applyPlan.commandArgs.reviewCheckReport,
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
      },
      stageOrder: ["previewArtifacts", "manualSkillEdit", "reviewReadiness", "strictGate"],
      nextStageKey: "previewArtifacts",
      nextStageCommandKeys: ["reviewCheckReport", "proposalPatchPreview"],
      nextStage: {
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
      },
      nextRequiredStageKey: "manualSkillEdit",
      nextRequiredStageCommandKeys: [],
      nextRequiredStage: {
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
      },
      nextRequiredCommandStageKey: "reviewReadiness",
      nextRequiredCommandStageCommandKeys: ["reviewCheckJson"],
      nextRequiredCommandStage: {
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
      },
      reason: "Offer optional local preview artifacts first, then require the manual skill edit before read-only review and strict gates.",
    });
    assert.deepEqual(applyPlan.commandContract.operatorRunbook.stageKeys, [
      "previewArtifacts",
      "manualSkillEdit",
      "reviewReadiness",
      "strictGate",
    ]);
    assert.deepEqual(Object.keys(applyPlan.commandContract.operatorRunbook.stageByKey), [
      "previewArtifacts",
      "manualSkillEdit",
      "reviewReadiness",
      "strictGate",
    ]);
    assert.equal(applyPlan.commandContract.operatorRunbook.stageByKey.previewArtifacts.kind, "local-output-preview");
    assert.deepEqual(applyPlan.commandContract.operatorRunbook.stageByKey.previewArtifacts.commandKeys, [
      "reviewCheckReport",
      "proposalPatchPreview",
    ]);
    assert.equal(applyPlan.commandContract.operatorRunbook.stageByKey.manualSkillEdit.required, true);
    assert.deepEqual(applyPlan.commandContract.operatorRunbook.stageByKey.reviewReadiness.commands.map((command) => command.key), ["reviewCheckJson"]);
    assert.deepEqual(applyPlan.commandContract.operatorRunbook.stageByKey.strictGate.commands.map((command) => command.key), ["strictGate"]);
    assert.deepEqual(applyPlan.commandContract.operatorRunbook.stages.map((stage) => ({
      step: stage.step,
      key: stage.key,
      kind: stage.kind,
      required: stage.required,
      commandKeys: stage.commandKeys,
      commandItemKeys: stage.commands.map((command) => command.key),
    })), [
      {
        step: 1,
        key: "previewArtifacts",
        kind: "local-output-preview",
        required: false,
        commandKeys: ["reviewCheckReport", "proposalPatchPreview"],
        commandItemKeys: ["reviewCheckReport", "proposalPatchPreview"],
      },
      {
        step: 2,
        key: "manualSkillEdit",
        kind: "manual-review",
        required: true,
        commandKeys: [],
        commandItemKeys: [],
      },
      {
        step: 3,
        key: "reviewReadiness",
        kind: "read-only-check",
        required: true,
        commandKeys: ["reviewCheckJson"],
        commandItemKeys: ["reviewCheckJson"],
      },
      {
        step: 4,
        key: "strictGate",
        kind: "read-only-gate",
        required: true,
        commandKeys: ["strictGate"],
        commandItemKeys: ["strictGate"],
      },
    ]);
    assert.match(applyPlan.commandContract.operatorRunbook.reason, /Generate optional local review artifacts/);
    assert.match(applyPlan.commandContract.nextAction, /Run reviewCheckJson after manual skill edits/);
    assert.equal(applyPlan.commandContract.summary.failures, 0);
    assert.equal(applyPlan.commandContract.summary.warnings, 0);
    assert.equal(applyPlan.commandContract.summary.passes, 18);
    assert.equal(applyPlan.commandContract.summary.total, 18);
    assert.equal(applyPlan.commandContract.checks.every((check) => check.passed), true);
  } finally {
    process.exitCode = previousExitCode;
  }
}));
