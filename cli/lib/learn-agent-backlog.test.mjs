// Tests for agent development backlog reports.

import { test } from "node:test";
import assert from "node:assert/strict";

import { agentBacklogReport, renderAgentBacklogReport } from "./signals.mjs";

test("agentBacklogReport extracts a focused local agent development backlog", () => {
  const now = new Date("2026-06-02T00:00:00.000Z");
  const profilePath = "/tmp/design-ai-learning.json";
  const usagePath = "/tmp/design-ai-learning.usage.json";
  const signalSource = "/tmp/design-ai-signals";
  const refreshCommandArgs = [
    "design-ai",
    "learn",
    "--agent-backlog",
    "--from-file",
    signalSource,
    "--file",
    profilePath,
    "--usage-file",
    usagePath,
    "--strict",
    "--json",
  ];
  const refreshCommand = "design-ai learn --agent-backlog --from-file /tmp/design-ai-signals --file /tmp/design-ai-learning.json --usage-file /tmp/design-ai-learning.usage.json --strict --json";
  const payload = agentBacklogReport({
    filePath: profilePath,
    usageFile: usagePath,
    signalSource,
    root: "/tmp",
    now,
    signalRegistryProvider: () => ({
      version: 1,
      generatedAt: now.toISOString(),
      status: "pass",
      file: profilePath,
      signalSource,
      learning: { count: 2 },
      usage: { usageFile: usagePath, eventCount: 1 },
      evals: { count: 1 },
      checkCapture: { count: 2 },
      workspace: { nextActionCount: 0 },
      readiness: {
        version: 1,
        status: "pass",
        summary: "Required and optional local learning signal surfaces are complete.",
        requiredPassCount: 4,
        requiredCount: 4,
        requiredReady: true,
        blockingCount: 0,
        optionalGapCount: 0,
        blockingChecks: [],
        optionalGaps: [],
        optionalGapDetails: [],
        requiredCheckIds: ["learning-profile"],
        optionalCheckIds: ["check-capture"],
        checkStatusById: {
          "learning-profile": "pass",
          "check-capture": "pass",
        },
        checkRequiredById: {
          "learning-profile": true,
          "check-capture": false,
        },
        checkCountByStatus: {
          pass: 2,
          info: 0,
          warn: 0,
          fail: 0,
          missing: 0,
          template: 0,
          unknown: 0,
        },
        requiredCheckCountByStatus: {
          pass: 1,
          info: 0,
          warn: 0,
          fail: 0,
          missing: 0,
          template: 0,
          unknown: 0,
        },
        optionalCheckCountByStatus: {
          pass: 1,
          info: 0,
          warn: 0,
          fail: 0,
          missing: 0,
          template: 0,
          unknown: 0,
        },
        checks: [
          {
            id: "learning-profile",
            label: "Learning profile",
            status: "pass",
            required: true,
            summary: "Profile has 2 entries with 0 audit failure(s) and 0 warning(s).",
            evidence: { entries: 2 },
          },
          {
            id: "check-capture",
            label: "Check learning capture",
            status: "pass",
            required: false,
            summary: "Profile includes 2 check-capture learning entries.",
            evidence: { entries: 2 },
          },
        ],
      },
      agentDevelopment: {
        status: "pass",
        actionCount: 1,
        p0Count: 0,
        p1Count: 0,
        p2Count: 1,
        p3Count: 0,
        actions: [
          {
            rank: 1,
            id: "agent-skill-proposal-preview",
            priority: "p2",
            category: "skill-evolution",
            title: "Preview skill instruction deltas from repeated check-capture signals.",
            rationale: "Captured warn/fail check results can become deterministic skill improvements without mutating skill files automatically.",
            command: "design-ai learn --propose-skills --json",
            commandArgs: ["design-ai", "learn", "--propose-skills", "--json"],
            evidence: { checkCaptureCount: 2 },
          },
        ],
      },
      recommendations: [
        {
          level: "info",
          text: "Keep local agent development evidence deterministic.",
        },
      ],
    }),
  });

  assert.equal(payload.version, 1);
  assert.equal(payload.status, "pass");
  assert.equal(payload.signalStatus, "pass");
  assert.equal(payload.file, profilePath);
  assert.equal(payload.usageFile, usagePath);
  assert.equal(payload.signalSource, signalSource);
  assert.equal(payload.counts.actions, 1);
  assert.equal(payload.counts.p2, 1);
  assert.equal(payload.counts.learningEntries, 2);
  assert.equal(payload.counts.usageEvents, 1);
  assert.equal(payload.counts.evalSignals, 1);
  assert.equal(payload.counts.checkCaptures, 2);
  assert.deepEqual(payload.readiness, {
    version: 1,
    status: "pass",
    summary: "Required and optional local learning signal surfaces are complete.",
    requiredPassCount: 4,
    requiredCount: 4,
    requiredReady: true,
    blockingCount: 0,
    optionalGapCount: 0,
    blockingChecks: [],
    optionalGaps: [],
    optionalGapDetails: [],
    requiredCheckIds: ["learning-profile"],
    optionalCheckIds: ["check-capture"],
    checkStatusById: {
      "learning-profile": "pass",
      "check-capture": "pass",
    },
    checkRequiredById: {
      "learning-profile": true,
      "check-capture": false,
    },
    checkCountByStatus: {
      pass: 2,
      info: 0,
      warn: 0,
      fail: 0,
      missing: 0,
      template: 0,
      unknown: 0,
    },
    requiredCheckCountByStatus: {
      pass: 1,
      info: 0,
      warn: 0,
      fail: 0,
      missing: 0,
      template: 0,
      unknown: 0,
    },
    optionalCheckCountByStatus: {
      pass: 1,
      info: 0,
      warn: 0,
      fail: 0,
      missing: 0,
      template: 0,
      unknown: 0,
    },
    checks: [
      {
        id: "learning-profile",
        label: "Learning profile",
        status: "pass",
        required: true,
        summary: "Profile has 2 entries with 0 audit failure(s) and 0 warning(s).",
        evidence: { entries: 2 },
      },
      {
        id: "check-capture",
        label: "Check learning capture",
        status: "pass",
        required: false,
        summary: "Profile includes 2 check-capture learning entries.",
        evidence: { entries: 2 },
      },
    ],
  });
  assert.equal(payload.actions[0].id, "agent-skill-proposal-preview");
  assert.equal(payload.actionPlan.version, 1);
  assert.equal(payload.actionPlan.stepCount, 1);
  assert.equal(payload.actionPlan.nextStep.actionId, "agent-skill-proposal-preview");
  assert.equal(payload.actionPlan.safetySummary.total, 1);
  assert.equal(payload.actionPlan.safetySummary.readOnly, 1);
  assert.equal(payload.actionPlan.safetySummary.writesLocalFile, 0);
  assert.equal(payload.actionPlan.safetySummary.mutatesLocalState, 0);
  assert.equal(payload.actionPlan.safetySummary.requiresReviewBeforeMutation, 0);
  assert.equal(payload.actionPlan.executionQueue.previewCount, 1);
  assert.equal(payload.actionPlan.executionQueue.fileWriteReviewCount, 0);
  assert.equal(payload.actionPlan.executionQueue.mutationReviewCount, 0);
  assert.equal(payload.actionPlan.executionQueue.orderedCount, 1);
  assert.equal(payload.actionPlan.executionQueue.commandManifestCount, 1);
  assert.equal(payload.actionPlan.executionQueue.nextActionId, "agent-skill-proposal-preview");
  assert.match(payload.actionPlan.executionQueue.nextCommand, /design-ai learn --propose-skills --json/);
  assert.deepEqual(payload.actionPlan.executionQueue.nextCommandArgs, ["design-ai", "learn", "--propose-skills", "--json"]);
  assert.equal(payload.actionPlan.executionQueue.nextCommandRunPolicy, "preview-only");
  assert.deepEqual(payload.actionPlan.executionQueue.nextCommandSelection, {
    strategy: "first-command-in-safety-ordered-queue",
    safetyOrder: ["read-only", "writes-local-file", "mutates-local-state"],
    actionId: "agent-skill-proposal-preview",
    rank: 1,
    safetyLevel: "read-only",
    runPolicy: "preview-only",
    planNextActionId: "agent-skill-proposal-preview",
    planNextActionRank: 1,
    matchesPlanNextAction: true,
    reason: "Selected the ranked next action because it is first in the safety-ordered queue.",
  });
  assert.deepEqual(payload.actionPlan.executionQueue.nextCommandAlignment, {
    strategy: "compare-operator-runbook-next-command-to-execution-queue-next-command",
    operatorStage: "execute",
    operatorActionId: "agent-skill-proposal-preview",
    operatorCommand: "design-ai learn --propose-skills --json",
    operatorCommandArgs: ["design-ai", "learn", "--propose-skills", "--json"],
    queueActionId: "agent-skill-proposal-preview",
    queueCommand: "design-ai learn --propose-skills --json",
    queueCommandArgs: ["design-ai", "learn", "--propose-skills", "--json"],
    rankedNextActionId: "agent-skill-proposal-preview",
    matchesQueueNextCommand: true,
    matchesQueueNextAction: true,
    operatorRunsBeforeQueueCommand: false,
    queueMatchesRankedNextAction: true,
    reason: "Operator runbook starts with the same command as the safety-ordered execution queue.",
  });
  assert.deepEqual(payload.actionPlan.executionQueue.operatorHandoff, {
    version: 1,
    decision: "run-shared-command",
    state: {
      version: 1,
      status: "ready",
      ready: true,
      hasCommand: true,
      complete: false,
      canRunWithoutReview: true,
      requiresGate: false,
      requiresRefresh: true,
      summary: "The handoff command can be presented or run, then refreshed with the focused backlog check.",
    },
    source: "operator-runbook",
    phase: "execute",
    label: "Run agent-skill-proposal-preview",
    command: "design-ai learn --propose-skills --json",
    commandArgs: ["design-ai", "learn", "--propose-skills", "--json"],
    actionId: "agent-skill-proposal-preview",
    rank: 1,
    runPolicy: "preview-only",
    required: true,
    isGate: false,
    nextQueueActionId: "agent-skill-proposal-preview",
    nextQueueCommand: "design-ai learn --propose-skills --json",
    nextQueueCommandArgs: ["design-ai", "learn", "--propose-skills", "--json"],
    nextQueueCommandRequiresGate: false,
    operatorGateAppliesToNextQueueAction: false,
    nextQueueActionBlockedByGate: false,
    refreshCommand,
    refreshCommandArgs,
    refreshCommandLabel: "Refresh focused agent backlog after review",
    refreshCommandRequired: true,
    reviewLevel: "clear",
    requiresOperatorReview: false,
    reason: "Run the shared operator and queue command next.",
  });
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.totalCommands, 1);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.outputTargetCount, 0);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.profileTargetCount, 0);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.usageTargetCount, 0);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.mutationFlagCount, 0);
  assert.equal(payload.actionPlan.executionQueue.commandEffectReview.level, "clear");
  assert.equal(payload.actionPlan.executionQueue.commandEffectReview.requiresOperatorReview, false);
  assert.match(payload.actionPlan.executionQueue.commandEffectReview.headline, /No command target/);
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectReview.gatePhaseSummary, {
    count: 1,
    requiredCount: 1,
    optionalCount: 0,
    phases: ["refresh"],
    hasBefore: false,
    hasAfter: false,
    hasRefresh: true,
  });
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectReview.gateRunbook, {
    before: [],
    after: [],
    refresh: [
      {
        phase: "refresh",
        label: "Refresh focused agent backlog after review",
        command: refreshCommand,
        commandArgs: refreshCommandArgs,
        required: true,
      },
    ],
    other: [],
  });
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectReview.gateCommands, [
    {
      phase: "refresh",
      label: "Refresh focused agent backlog after review",
      command: refreshCommand,
      commandArgs: refreshCommandArgs,
      required: true,
    },
  ]);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.version, 1);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.stageCount, 4);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.commandCount, 2);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.requiredCommandCount, 2);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.reviewLevel, "clear");
  assert.deepEqual(payload.actionPlan.executionQueue.operatorRunbook.phases, ["before", "execute", "after", "refresh"]);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextStage, "execute");
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommandLabel, "Run agent-skill-proposal-preview");
  assert.match(payload.actionPlan.executionQueue.operatorRunbook.nextCommand, /learn --propose-skills --json/);
  assert.deepEqual(payload.actionPlan.executionQueue.operatorRunbook.nextCommandArgs, ["design-ai", "learn", "--propose-skills", "--json"]);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommandRequired, true);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommandRunPolicy, "preview-only");
  assert.deepEqual(payload.actionPlan.executionQueue.operatorRunbook.nextCommandSelection, {
    strategy: "first-command-in-operator-runbook-stage-order",
    stageOrder: ["before", "execute", "after", "refresh"],
    stage: "execute",
    label: "Run agent-skill-proposal-preview",
    command: "design-ai learn --propose-skills --json",
    commandArgs: ["design-ai", "learn", "--propose-skills", "--json"],
    actionId: "agent-skill-proposal-preview",
    rank: 1,
    required: true,
    runPolicy: "preview-only",
    reason: "Selected the first command in the execute stage using operator runbook stage order.",
  });
  assert.deepEqual(
    payload.actionPlan.executionQueue.operatorRunbook.stages.map((stage) => [stage.phase, stage.commandCount, stage.requiredCount]),
    [
      ["before", 0, 0],
      ["execute", 1, 1],
      ["after", 0, 0],
      ["refresh", 1, 1],
    ],
  );
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.stages[1].commands[0].actionId, "agent-skill-proposal-preview");
  assert.deepEqual(payload.actionPlan.executionQueue.operatorRunbook.stages[1].commands[0].commandArgs, ["design-ai", "learn", "--propose-skills", "--json"]);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.stages[1].commands[0].runPolicy, "preview-only");
  assert.match(payload.actionPlan.executionQueue.operatorRunbook.stages[3].commands[0].command, /learn --agent-backlog .*--strict --json/);
  assert.equal(payload.actionPlan.executionQueue.ordered[0].actionId, "agent-skill-proposal-preview");
  assert.equal(payload.actionPlan.executionQueue.ordered[0].runPolicy, "preview-only");
  assert.equal(payload.actionPlan.executionQueue.commandManifest[0].actionId, "agent-skill-proposal-preview");
  assert.deepEqual(payload.actionPlan.executionQueue.commandManifest[0].commandArgs, ["design-ai", "learn", "--propose-skills", "--json"]);
  assert.equal(payload.actionPlan.executionQueue.commandManifest[0].runPolicy, "preview-only");
  assert.deepEqual(payload.actionPlan.executionQueue.commandManifest[0].commandEffects.outputTargets, []);
  assert.deepEqual(payload.actionPlan.executionQueue.commandManifest[0].commandEffects.mutationFlags, []);
  assert.equal(payload.actionPlan.executionQueue.preview[0].actionId, "agent-skill-proposal-preview");
  assert.equal(payload.actionPlan.steps[0].requiresReviewBeforeMutation, false);
  assert.equal(payload.actionPlan.steps[0].commandSafety.level, "read-only");
  assert.equal(payload.actionPlan.steps[0].commandSafety.writesLocalFiles, false);
  assert.equal(payload.actionPlan.steps[0].commandSafety.mutatesLocalState, false);
  assert.match(payload.actionPlan.steps[0].verification.join("\n"), /agent-backlog --strict --json/);
  assert.match(payload.actionPlan.verification[0].command, /design-ai learn --signals/);
  assert.equal(payload.actionPlan.boundaries.reportCallsExternalAiApis, false);
  assert.match(payload.commands.signalsJson, /design-ai learn --signals/);
  assert.equal(payload.privacy.mutatesProfile, false);
  assert.equal(payload.privacy.mutatesSkillFiles, false);
  assert.equal(payload.privacy.callsExternalAiApis, false);

  const markdown = renderAgentBacklogReport(payload, { generatedAt: now });
  assert.match(markdown, /# Agent Development Backlog Report/);
  assert.match(markdown, /## Signal Readiness/);
  assert.match(markdown, /Required and optional local learning signal surfaces are complete/);
  assert.match(markdown, /Required checks: 4\/4/);
  assert.match(markdown, /Readiness check index:/);
  assert.match(markdown, /Required ids: learning-profile/);
  assert.match(markdown, /Optional ids: check-capture/);
  assert.match(markdown, /Status index: learning-profile=pass, check-capture=pass/);
  assert.match(markdown, /Required index: learning-profile=yes, check-capture=no/);
  assert.match(markdown, /Status counts: pass=2, info=0, warn=0, fail=0, missing=0, template=0, unknown=0/);
  assert.match(markdown, /Required status counts: pass=1, info=0, warn=0, fail=0, missing=0, template=0, unknown=0/);
  assert.match(markdown, /Optional status counts: pass=1, info=0, warn=0, fail=0, missing=0, template=0, unknown=0/);
  assert.match(markdown, /check-capture \[optional\] pass: Profile includes 2 check-capture learning entries/);
  assert.match(markdown, /## Backlog Actions/);
  assert.match(markdown, /design-ai learn --propose-skills --json/);
  assert.match(markdown, /## Action Plan/);
  assert.match(markdown, /Safety summary:/);
  assert.match(markdown, /Read-only: 1/);
  assert.match(markdown, /Writes local file: 0/);
  assert.match(markdown, /Mutates local state: 0/);
  assert.match(markdown, /Execution queue:/);
  assert.match(markdown, /Preview\/read-only commands: 1/);
  assert.match(markdown, /Local file-write review commands: 0/);
  assert.match(markdown, /Ordered commands: 1/);
  assert.match(markdown, /Command manifest entries: 1/);
  assert.match(markdown, /Command effect targets: output 0, profile 0, usage 0, mutation flags 0/);
  assert.match(markdown, /Command effect review: No command target or mutation flag exposure detected/);
  assert.match(markdown, /Command effect gate phases: refresh \(1\/1 required\)/);
  assert.match(markdown, /Command effect gate runbook: before 0, after 0, refresh 1/);
  assert.match(markdown, /Command effect gates:/);
  assert.match(markdown, /refresh: Refresh focused agent backlog after review/);
  assert.match(markdown, /design-ai learn --agent-backlog --from-file \/tmp\/design-ai-signals --file \/tmp\/design-ai-learning\.json --usage-file \/tmp\/design-ai-learning\.usage\.json --strict --json/);
  assert.match(markdown, /Operator runbook: 4 stage\(s\), 2 command\(s\), 2 required/);
  assert.match(markdown, /Operator next command: execute: `design-ai learn --propose-skills --json`/);
  assert.match(markdown, /Operator next command selection: first-command-in-operator-runbook-stage-order/);
  assert.match(markdown, /Recommended next action: agent-skill-proposal-preview/);
  assert.match(markdown, /Recommended next command policy: preview-only/);
  assert.match(markdown, /Recommended next command selection: first-command-in-safety-ordered-queue/);
  assert.match(markdown, /Ranked next action: agent-skill-proposal-preview; matches recommended command: yes/);
  assert.match(markdown, /Operator\/queue next command alignment: same/);
  assert.match(markdown, /Operator handoff: execute operator-runbook/);
  assert.match(markdown, /Operator handoff state: ready; ready yes; can run without review yes; refresh required/);
  assert.match(markdown, /Operator handoff refresh: design-ai learn --agent-backlog --from-file \/tmp\/design-ai-signals --file \/tmp\/design-ai-learning\.json --usage-file \/tmp\/design-ai-learning\.usage\.json --strict --json/);
  assert.match(markdown, /Recommended next command:/);
  assert.match(markdown, /Queue order:/);
  assert.match(markdown, /1\. agent-skill-proposal-preview \(read-only, preview-only\)/);
  assert.match(markdown, /Command manifest:/);
  assert.match(markdown, /1\. agent-skill-proposal-preview - preview-only \(read-only\)/);
  assert.match(markdown, /Command safety: read-only/);
  assert.match(markdown, /Writes local files: no/);
  assert.match(markdown, /Mutates local state: no/);
  assert.match(markdown, /Requires mutation review: no/);
  assert.match(markdown, /agent-backlog .*--strict --json/);
  assert.match(markdown, /## Follow-Up Commands/);
  assert.match(markdown, /design-ai learn --signals/);
  assert.match(markdown, /This report is read-only evidence/);
});

test("agentBacklogReport marks no-command pass state as complete without required refresh", () => {
  const now = new Date("2026-06-02T00:00:00.000Z");
  const profilePath = "/tmp/design-ai-learning.json";
  const usagePath = "/tmp/design-ai-learning.usage.json";
  const signalSource = "/tmp/design-ai-signals";
  const payload = agentBacklogReport({
    filePath: profilePath,
    usageFile: usagePath,
    signalSource,
    root: "/tmp",
    now,
    signalRegistryProvider: () => ({
      version: 1,
      generatedAt: now.toISOString(),
      status: "pass",
      file: profilePath,
      signalSource,
      learning: { count: 2 },
      usage: { usageFile: usagePath, eventCount: 1 },
      evals: { count: 1 },
      checkCapture: { count: 0 },
      workspace: { nextActionCount: 0 },
      agentDevelopment: {
        status: "pass",
        actionCount: 0,
        p0Count: 0,
        p1Count: 0,
        p2Count: 0,
        p3Count: 0,
        actions: [],
      },
      recommendations: [
        {
          level: "info",
          text: "No check learning capture entries are present yet; run check --learn --yes on real warnings/failures when appropriate.",
        },
      ],
    }),
  });

  assert.equal(payload.status, "pass");
  assert.equal(payload.counts.actions, 0);
  assert.equal(payload.actionPlan.stepCount, 0);
  assert.equal(payload.actionPlan.executionQueue.orderedCount, 0);
  assert.equal(payload.actionPlan.executionQueue.nextCommand, "");
  assert.deepEqual(payload.actionPlan.executionQueue.nextCommandArgs, []);
  assert.deepEqual(payload.actionPlan.executionQueue.operatorHandoff.state, {
    version: 1,
    status: "no-command",
    ready: true,
    hasCommand: false,
    complete: true,
    canRunWithoutReview: false,
    requiresGate: false,
    requiresRefresh: false,
    summary: "Focused agent backlog is clear; no handoff command is required.",
  });
  assert.equal(payload.actionPlan.executionQueue.operatorHandoff.decision, "none");
  assert.equal(
    payload.actionPlan.executionQueue.operatorHandoff.reason,
    "No handoff command is required; optional refresh command remains available as status metadata.",
  );
  assert.equal(payload.actionPlan.executionQueue.operatorHandoff.command, "");
  assert.deepEqual(payload.actionPlan.executionQueue.operatorHandoff.commandArgs, []);
  assert.equal(payload.actionPlan.executionQueue.operatorHandoff.refreshCommandRequired, false);
  assert.match(payload.actionPlan.executionQueue.operatorHandoff.refreshCommand, /design-ai learn --agent-backlog/);
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectReview.gatePhaseSummary, {
    count: 1,
    requiredCount: 0,
    optionalCount: 1,
    phases: ["refresh"],
    hasBefore: false,
    hasAfter: false,
    hasRefresh: true,
  });
  assert.equal(payload.actionPlan.executionQueue.commandEffectReview.gateRunbook.refresh[0].required, false);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.commandCount, 1);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.requiredCommandCount, 0);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextStage, "refresh");
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommandRequired, false);
  assert.equal(
    payload.actionPlan.executionQueue.operatorRunbook.nextCommandSelection.reason,
    "Optional refresh command is available as status metadata; no executable backlog handoff command is selected.",
  );
  assert.equal(
    payload.actionPlan.executionQueue.nextCommandAlignment.reason,
    "Operator runbook exposes an optional refresh command while the safety-ordered execution queue is empty.",
  );

  const markdown = renderAgentBacklogReport(payload, { generatedAt: now });
  assert.match(markdown, /No agent development backlog actions emitted./);
  assert.match(markdown, /Command effect gate phases: refresh \(0\/1 required\)/);
  assert.match(markdown, /Operator runbook: 4 stage\(s\), 1 command\(s\), 0 required/);
  assert.match(markdown, /Optional refresh command is available as status metadata; no executable backlog handoff command is selected/);
  assert.match(markdown, /Operator runbook exposes an optional refresh command while the safety-ordered execution queue is empty/);
  assert.match(markdown, /No handoff command is required; optional refresh command remains available as status metadata/);
  assert.match(markdown, /Operator handoff state: no-command; ready yes; can run without review no; refresh optional/);
  assert.match(markdown, /Focused agent backlog is clear; no handoff command is required/);
});
