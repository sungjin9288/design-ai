// Tests for runLearn --propose-skills strict review/apply-plan flow.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { defaultLearningUsageFile } from "./learn.mjs";
import {
  buildSkillEvolutionProposals,
  buildSkillProposalApplyPlan,
  buildSkillProposalReviewCheck,
  renderSkillProposalApplyPlanReport,
  renderSkillProposalReviewCheckReport,
} from "./skill-proposals.mjs";
import { runLearn } from "../commands/learn.mjs";
import { captureStdout, withTempDirAsync } from "./learn-test-support.mjs";

test("runLearn --propose-skills --strict exits non-zero when proposal review is pending", () => withTempDirAsync(async (dir) => {
  const previousExitCode = process.exitCode;
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-10T00:00:02.000Z",
    entries: [
      {
        id: "learn-check-a",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No mobile behavior note detected.",
        source: "check:website-improvement",
        createdAt: "2026-06-10T00:00:01.000Z",
      },
      {
        id: "learn-check-b",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No tablet behavior note detected.",
        source: "check:website-improvement",
        createdAt: "2026-06-10T00:00:02.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-10T00:00:02.000Z",
    profileFile: filePath,
    events: [],
  }), "utf8");
  const before = readFileSync(filePath, "utf8");
  const candidateSkillPath = path.resolve("skills/website-improvement/SKILL.md");
  const candidateSkillBefore = readFileSync(candidateSkillPath, "utf8");

  try {
    process.exitCode = undefined;
    const strictOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--strict",
      "--json",
    ]));
    const strictPayload = JSON.parse(strictOutput);
    assert.equal(strictPayload.status, "warn");
    assert.equal(strictPayload.proposalCount, 1);
    assert.equal(strictPayload.pendingReviewCount, 1);
    assert.equal(process.exitCode, 1);
    assert.equal(readFileSync(filePath, "utf8"), before);

    process.exitCode = 0;
    const reviewTemplateOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-template",
    ]));
    const reviewTemplatePayload = JSON.parse(reviewTemplateOutput);
    assert.equal(reviewTemplatePayload.version, 1);
    assert.equal(reviewTemplatePayload.source, "design-ai learn --propose-skills --review-template");
    assert.equal(reviewTemplatePayload.summary.templateDecisionCount, 1);
    assert.equal(reviewTemplatePayload.decisions[0].proposalId, strictPayload.proposals[0].id);
    assert.equal(reviewTemplatePayload.decisions[0].status, "deferred");
    assert.equal(readFileSync(filePath, "utf8"), before);

    const reviewFile = path.join(dir, "skill-proposals.review.json");
    writeFileSync(reviewFile, JSON.stringify({
      version: 1,
      decisions: [
        {
          proposalId: strictPayload.proposals[0].id,
          status: "applied",
          reviewedAt: "2026-06-10T00:05:00.000Z",
          reviewer: "local-operator",
          note: "Instruction delta was manually reviewed and applied.",
        },
        {
          proposalId: "skill-proposal-stale",
          status: "rejected",
          reviewedAt: "2026-06-09T00:00:00.000Z",
        },
      ],
    }), "utf8");

    process.exitCode = 0;
    const reviewedStrictOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      reviewFile,
      "--strict",
      "--json",
    ]));
    const reviewedStrictPayload = JSON.parse(reviewedStrictOutput);
    assert.equal(reviewedStrictPayload.status, "warn");
    assert.equal(reviewedStrictPayload.signalStatus, "warn");
    assert.equal(reviewedStrictPayload.pendingReviewCount, 0);
    assert.equal(reviewedStrictPayload.review.appliedCount, 1);
    assert.equal(reviewedStrictPayload.review.staleCount, 1);
    assert.equal(reviewedStrictPayload.proposals[0].reviewStatus, "applied");
    assert.equal(process.exitCode, 1);
    assert.equal(readFileSync(filePath, "utf8"), before);

    const proposalGatePayload = buildSkillEvolutionProposals({
      filePath,
      usageFile,
      signalSource: dir,
      root: dir,
      reviewFile,
      signalRegistryProvider: ({ signalSource }) => ({
        status: "pass",
        signalSource: path.resolve(signalSource),
      }),
    });
    assert.equal(proposalGatePayload.status, "pass");
    assert.equal(proposalGatePayload.pendingReviewCount, 0);
    assert.equal(proposalGatePayload.review.appliedCount, 1);

    const proposalReviewCheck = buildSkillProposalReviewCheck(proposalGatePayload, {
      generatedAt: new Date("2026-06-10T00:10:00.000Z"),
    });
    assert.equal(proposalReviewCheck.kind, "skill-proposal-review-check");
    assert.equal(proposalReviewCheck.status, "warn");
    assert.equal(proposalReviewCheck.proposalStatus, "pass");
    assert.equal(proposalReviewCheck.review.staleCount, 1);
    assert.equal(proposalReviewCheck.privacy.mutatesSkillFiles, false);
    const proposalReviewCheckReport = renderSkillProposalReviewCheckReport(proposalReviewCheck, {
      generatedAt: new Date("2026-06-10T00:11:00.000Z"),
    });
    assert.match(proposalReviewCheckReport, /^# Skill Proposal Review Check/);
    assert.match(proposalReviewCheckReport, /- Status: warn/);
    assert.match(proposalReviewCheckReport, /- Mutates skill files: no/);

    const cleanReviewFile = path.join(dir, "skill-proposals.clean.review.json");
    writeFileSync(cleanReviewFile, JSON.stringify({
      version: 1,
      decisions: [
        {
          proposalId: strictPayload.proposals[0].id,
          status: "applied",
          reviewedAt: "2026-06-10T00:06:00.000Z",
          reviewer: "local-operator",
          note: "Instruction delta was manually reviewed and applied.",
        },
      ],
    }), "utf8");
    const cleanReviewBefore = readFileSync(cleanReviewFile, "utf8");

    process.exitCode = 0;
    const reviewCheckJsonOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      cleanReviewFile,
      "--review-check",
      "--strict",
      "--json",
    ]));
    const reviewCheckJsonPayload = JSON.parse(reviewCheckJsonOutput);
    assert.equal(reviewCheckJsonPayload.kind, "skill-proposal-review-check");
    assert.equal(reviewCheckJsonPayload.status, "pass");
    assert.equal(reviewCheckJsonPayload.proposalStatus, "warn");
    assert.equal(reviewCheckJsonPayload.pendingReviewCount, 0);
    assert.equal(reviewCheckJsonPayload.review.appliedCount, 1);
    assert.equal(reviewCheckJsonPayload.review.staleCount, 0);
    assert.equal(reviewCheckJsonPayload.summary.failures, 0);
    assert.equal(reviewCheckJsonPayload.summary.warnings, 0);
    assert.equal(process.exitCode, 0);
    assert.equal(readFileSync(filePath, "utf8"), before);
    assert.equal(readFileSync(cleanReviewFile, "utf8"), cleanReviewBefore);

    const reviewCheckHumanOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      cleanReviewFile,
      "--review-check",
    ]));
    assert.match(reviewCheckHumanOutput, /Skill proposal review check/);
    assert.match(reviewCheckHumanOutput, /Status: pass/);
    assert.match(reviewCheckHumanOutput, /Privacy: review check is read-only/);

    const reviewCheckReportPath = path.join(dir, "skill-proposals-review-check.md");
    const reviewCheckReportOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      cleanReviewFile,
      "--review-check",
      "--report",
      "--out",
      reviewCheckReportPath,
    ]));
    assert.match(reviewCheckReportOutput, /Wrote /);
    const reviewCheckReport = readFileSync(reviewCheckReportPath, "utf8");
    assert.match(reviewCheckReport, /^# Skill Proposal Review Check/);
    assert.match(reviewCheckReport, /- Status: pass/);
    assert.match(reviewCheckReport, /- Mutates skill files: no/);
    assert.equal(readFileSync(filePath, "utf8"), before);

    const acceptedReviewFile = path.join(dir, "skill-proposals.accepted.review.json");
    writeFileSync(acceptedReviewFile, JSON.stringify({
      version: 1,
      decisions: [
        {
          proposalId: strictPayload.proposals[0].id,
          status: "accepted",
          reviewedAt: "2026-06-10T00:07:00.000Z",
          reviewer: "local-operator",
          note: "Instruction delta is accepted for manual skill editing.",
        },
      ],
    }), "utf8");
    const acceptedReviewBefore = readFileSync(acceptedReviewFile, "utf8");
    const acceptedProposalPayload = buildSkillEvolutionProposals({
      filePath,
      usageFile,
      signalSource: dir,
      root: dir,
      reviewFile: acceptedReviewFile,
      signalRegistryProvider: ({ signalSource }) => ({
        status: "pass",
        signalSource: path.resolve(signalSource),
      }),
    });
    const applyPlan = buildSkillProposalApplyPlan(acceptedProposalPayload, {
      generatedAt: new Date("2026-06-10T00:12:00.000Z"),
    });
    assert.equal(applyPlan.kind, "skill-proposal-apply-plan");
    assert.equal(applyPlan.status, "warn");
    assert.equal(applyPlan.acceptedCount, 1);
    assert.equal(applyPlan.tasks[0].proposalId, strictPayload.proposals[0].id);
    assert.equal(applyPlan.tasks[0].candidateSkillPath, "skills/website-improvement/SKILL.md");
    assert.match(applyPlan.tasks[0].manualSteps.join("\n"), /update the review decision from `accepted` to `applied`/);
    assert.match(applyPlan.commands.reviewCheckJson, /--file /);
    assert.match(applyPlan.commands.reviewCheckJson, /--usage-file /);
    assert.match(applyPlan.commands.reviewCheckJson, /--from-file /);
    assert.match(applyPlan.commands.reviewCheckJson, /--review-check --json/);
    const applyPlanContextArgs = [
      "design-ai",
      "learn",
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      acceptedReviewFile,
    ];
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
    const reviewedPatchOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      reviewFile,
      "--patch",
    ]));
    assert.match(reviewedPatchOutput, /No pending skill proposal deltas remain after review-file decisions/);
    assert.doesNotMatch(reviewedPatchOutput, /diff --git/);

    const reviewedTemplateFile = path.join(dir, "review-template.json");
    const reviewedTemplateWriteOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      reviewFile,
      "--review-template",
      "--out",
      reviewedTemplateFile,
    ]));
    assert.match(reviewedTemplateWriteOutput, /Wrote /);
    const reviewedTemplatePayload = JSON.parse(readFileSync(reviewedTemplateFile, "utf8"));
    assert.equal(reviewedTemplatePayload.summary.templateDecisionCount, 0);
    assert.deepEqual(reviewedTemplatePayload.decisions, []);
    assert.equal(readFileSync(filePath, "utf8"), before);
    assert.equal(readFileSync(reviewFile, "utf8"), JSON.stringify({
      version: 1,
      decisions: [
        {
          proposalId: strictPayload.proposals[0].id,
          status: "applied",
          reviewedAt: "2026-06-10T00:05:00.000Z",
          reviewer: "local-operator",
          note: "Instruction delta was manually reviewed and applied.",
        },
        {
          proposalId: "skill-proposal-stale",
          status: "rejected",
          reviewedAt: "2026-06-09T00:00:00.000Z",
        },
      ],
    }));
  } finally {
    process.exitCode = previousExitCode;
  }
}));
