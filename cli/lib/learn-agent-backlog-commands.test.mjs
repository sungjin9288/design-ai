// Tests for agent backlog command safety and command strings.

import { test } from "node:test";
import assert from "node:assert/strict";

import { agentBacklogReport } from "./signals.mjs";

test("agentBacklogReport classifies action plan command safety", () => {
  const now = new Date("2026-06-02T00:00:00.000Z");
  const refreshCommandArgs = [
    "design-ai",
    "learn",
    "--agent-backlog",
    "--from-file",
    "/tmp/design-ai-signals",
    "--file",
    "/tmp/design-ai-learning.json",
    "--usage-file",
    "/tmp/design-ai-learning.usage.json",
    "--strict",
    "--json",
  ];
  const refreshCommand = "design-ai learn --agent-backlog --from-file /tmp/design-ai-signals --file /tmp/design-ai-learning.json --usage-file /tmp/design-ai-learning.usage.json --strict --json";
  const payload = agentBacklogReport({
    filePath: "/tmp/design-ai-learning.json",
    usageFile: "/tmp/design-ai-learning.usage.json",
    signalSource: "/tmp/design-ai-signals",
    root: "/tmp",
    now,
    signalRegistryProvider: () => ({
      version: 1,
      generatedAt: now.toISOString(),
      status: "warn",
      file: "/tmp/design-ai-learning.json",
      signalSource: "/tmp/design-ai-signals",
      learning: { count: 1 },
      usage: { usageFile: "/tmp/design-ai-learning.usage.json", eventCount: 0 },
      evals: { count: 0 },
      checkCapture: { count: 0 },
      workspace: { nextActionCount: 0 },
      agentDevelopment: {
        status: "warn",
        actionCount: 3,
        p0Count: 0,
        p1Count: 2,
        p2Count: 1,
        p3Count: 0,
        actions: [
          {
            rank: 1,
            id: "agent-eval-checkpoint-generate",
            priority: "p1",
            category: "eval-harness",
            title: "Generate eval checkpoint.",
            rationale: "Write a replayable checkpoint file.",
            command: "design-ai learn --eval-template --json --out learning-eval.json",
            commandArgs: ["design-ai", "learn", "--eval-template", "--json", "--out", "learning-eval.json"],
            evidence: {},
          },
          {
            rank: 2,
            id: "agent-learning-profile-init",
            priority: "p1",
            category: "learning-profile",
            title: "Initialize profile.",
            rationale: "Preview local profile seed entries.",
            command: "design-ai learn --init --dry-run --file /tmp/design-ai-learning.json",
            commandArgs: ["design-ai", "learn", "--init", "--dry-run", "--file", "/tmp/design-ai-learning.json"],
            applyCommand: "design-ai learn --init --yes --file /tmp/design-ai-learning.json",
            applyCommandArgs: ["design-ai", "learn", "--init", "--yes", "--file", "/tmp/design-ai-learning.json"],
            evidence: {},
          },
          {
            rank: 3,
            id: "agent-check-capture-seed",
            priority: "p2",
            category: "skill-evolution",
            title: "Capture check feedback.",
            rationale: "Apply local check captures.",
            command: "design-ai check artifact.md --learn --yes",
            commandArgs: ["design-ai", "check", "artifact.md", "--learn", "--yes"],
            evidence: {},
          },
        ],
      },
      recommendations: [],
    }),
  });

  const stepsById = new Map(payload.actionPlan.steps.map((step) => [step.actionId, step]));
  assert.equal(payload.actionPlan.safetySummary.total, 3);
  assert.equal(payload.actionPlan.safetySummary.readOnly, 1);
  assert.equal(payload.actionPlan.safetySummary.writesLocalFile, 1);
  assert.equal(payload.actionPlan.safetySummary.mutatesLocalState, 1);
  assert.equal(payload.actionPlan.safetySummary.requiresCleanWorkspace, 2);
  assert.equal(payload.actionPlan.safetySummary.requiresReviewBeforeMutation, 2);
  assert.equal(payload.actionPlan.executionQueue.previewCount, 1);
  assert.equal(payload.actionPlan.executionQueue.fileWriteReviewCount, 1);
  assert.equal(payload.actionPlan.executionQueue.mutationReviewCount, 1);
  assert.equal(payload.actionPlan.executionQueue.orderedCount, 3);
  assert.equal(payload.actionPlan.executionQueue.commandManifestCount, 3);
  assert.equal(payload.actionPlan.executionQueue.nextActionId, "agent-learning-profile-init");
  assert.deepEqual(payload.actionPlan.executionQueue.nextCommandArgs, ["design-ai", "learn", "--init", "--dry-run", "--file", "/tmp/design-ai-learning.json"]);
  assert.equal(payload.actionPlan.executionQueue.nextCommandRunPolicy, "preview-only");
  assert.deepEqual(payload.actionPlan.executionQueue.nextCommandSelection, {
    strategy: "first-command-in-safety-ordered-queue",
    safetyOrder: ["read-only", "writes-local-file", "mutates-local-state"],
    actionId: "agent-learning-profile-init",
    rank: 2,
    safetyLevel: "read-only",
    runPolicy: "preview-only",
    planNextActionId: "agent-eval-checkpoint-generate",
    planNextActionRank: 1,
    matchesPlanNextAction: false,
    reason: "Selected the first command in the safety-ordered queue before higher-risk ranked actions.",
  });
  assert.deepEqual(payload.actionPlan.executionQueue.nextCommandAlignment, {
    strategy: "compare-operator-runbook-next-command-to-execution-queue-next-command",
    operatorStage: "before",
    operatorActionId: "",
    operatorCommand: "git status --short",
    operatorCommandArgs: ["git", "status", "--short"],
    queueActionId: "agent-learning-profile-init",
    queueCommand: "design-ai learn --init --dry-run --file /tmp/design-ai-learning.json",
    queueCommandArgs: ["design-ai", "learn", "--init", "--dry-run", "--file", "/tmp/design-ai-learning.json"],
    rankedNextActionId: "agent-eval-checkpoint-generate",
    matchesQueueNextCommand: false,
    matchesQueueNextAction: false,
    operatorRunsBeforeQueueCommand: true,
    queueMatchesRankedNextAction: false,
    reason: "Operator runbook starts with a before-stage gate before the safety-ordered queue command.",
  });
  assert.deepEqual(payload.actionPlan.executionQueue.operatorHandoff, {
    version: 1,
    decision: "run-queue-command",
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
    source: "execution-queue",
    phase: "execute",
    label: "agent-learning-profile-init",
    command: "design-ai learn --init --dry-run --file /tmp/design-ai-learning.json",
    commandArgs: ["design-ai", "learn", "--init", "--dry-run", "--file", "/tmp/design-ai-learning.json"],
    actionId: "agent-learning-profile-init",
    rank: 2,
    runPolicy: "preview-only",
    required: true,
    isGate: false,
    nextQueueActionId: "agent-learning-profile-init",
    nextQueueCommand: "design-ai learn --init --dry-run --file /tmp/design-ai-learning.json",
    nextQueueCommandArgs: ["design-ai", "learn", "--init", "--dry-run", "--file", "/tmp/design-ai-learning.json"],
    nextQueueCommandRequiresGate: false,
    operatorGateAppliesToNextQueueAction: false,
    nextQueueActionBlockedByGate: false,
    refreshCommand,
    refreshCommandArgs,
    refreshCommandLabel: "Refresh focused agent backlog after review",
    refreshCommandRequired: true,
    reviewLevel: "clear",
    requiresOperatorReview: false,
    reason: "Run the safety-ordered queue command next.",
  });
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.totalCommands, 3);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.outputTargetCount, 1);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.profileTargetCount, 1);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.usageTargetCount, 0);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.mutationFlagCount, 1);
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectSummary.outputTargets, [{ flag: "--out", value: "learning-eval.json" }]);
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectSummary.profileTargets, [{ flag: "--file", value: "/tmp/design-ai-learning.json" }]);
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectSummary.mutationFlags, ["--yes"]);
  assert.equal(payload.actionPlan.executionQueue.commandEffectReview.level, "mutation-review");
  assert.equal(payload.actionPlan.executionQueue.commandEffectReview.requiresOperatorReview, true);
  assert.match(payload.actionPlan.executionQueue.commandEffectReview.headline, /Mutation-capable commands/);
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectReview.checklist, [
    "Review mutation flags and run in a clean workspace before applying.",
    "Inspect explicit output targets before committing generated files.",
    "Confirm learning profile and usage sidecar targets are intentional.",
  ]);
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectReview.gatePhaseSummary, {
    count: 3,
    requiredCount: 3,
    optionalCount: 0,
    phases: ["before", "after", "refresh"],
    hasBefore: true,
    hasAfter: true,
    hasRefresh: true,
  });
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectReview.gateRunbook, {
    before: [
      {
        phase: "before",
        label: "Confirm clean workspace before execution",
        command: "git status --short",
        commandArgs: ["git", "status", "--short"],
        required: true,
      },
    ],
    after: [
      {
        phase: "after",
        label: "Inspect local file changes after execution",
        command: "git diff --stat",
        commandArgs: ["git", "diff", "--stat"],
        required: true,
      },
    ],
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
      phase: "before",
      label: "Confirm clean workspace before execution",
      command: "git status --short",
      commandArgs: ["git", "status", "--short"],
      required: true,
    },
    {
      phase: "after",
      label: "Inspect local file changes after execution",
      command: "git diff --stat",
      commandArgs: ["git", "diff", "--stat"],
      required: true,
    },
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
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.commandCount, 6);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.requiredCommandCount, 6);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.reviewLevel, "mutation-review");
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.requiresOperatorReview, true);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextStage, "before");
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommandLabel, "Confirm clean workspace before execution");
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommand, "git status --short");
  assert.deepEqual(payload.actionPlan.executionQueue.operatorRunbook.nextCommandArgs, ["git", "status", "--short"]);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommandRequired, true);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommandRunPolicy, "");
  assert.deepEqual(payload.actionPlan.executionQueue.operatorRunbook.nextCommandSelection, {
    strategy: "first-command-in-operator-runbook-stage-order",
    stageOrder: ["before", "execute", "after", "refresh"],
    stage: "before",
    label: "Confirm clean workspace before execution",
    command: "git status --short",
    commandArgs: ["git", "status", "--short"],
    actionId: "",
    rank: null,
    required: true,
    runPolicy: "",
    reason: "Selected the first command in the before stage using operator runbook stage order.",
  });
  assert.deepEqual(
    payload.actionPlan.executionQueue.operatorRunbook.stages.map((stage) => [stage.phase, stage.commandCount, stage.requiredCount]),
    [
      ["before", 1, 1],
      ["execute", 3, 3],
      ["after", 1, 1],
      ["refresh", 1, 1],
    ],
  );
  assert.deepEqual(
    payload.actionPlan.executionQueue.operatorRunbook.stages[1].commands.map((item) => item.actionId),
    [
      "agent-learning-profile-init",
      "agent-eval-checkpoint-generate",
      "agent-check-capture-seed",
    ],
  );
  assert.deepEqual(
    payload.actionPlan.executionQueue.operatorRunbook.stages[1].commands.map((item) => item.runPolicy),
    [
      "preview-only",
      "review-before-file-write",
      "review-before-mutation",
    ],
  );
  assert.deepEqual(payload.actionPlan.executionQueue.ordered.map((item) => item.actionId), [
    "agent-learning-profile-init",
    "agent-eval-checkpoint-generate",
    "agent-check-capture-seed",
  ]);
  assert.deepEqual(payload.actionPlan.executionQueue.commandManifest.map((item) => item.runPolicy), [
    "preview-only",
    "review-before-file-write",
    "review-before-mutation",
  ]);
  assert.deepEqual(
    payload.actionPlan.executionQueue.commandManifest[1].commandEffects.outputTargets,
    [{ flag: "--out", value: "learning-eval.json" }],
  );
  assert.deepEqual(
    payload.actionPlan.executionQueue.commandManifest[0].commandEffects.profileTargets,
    [{ flag: "--file", value: "/tmp/design-ai-learning.json" }],
  );
  assert.deepEqual(payload.actionPlan.executionQueue.commandManifest[2].commandEffects.mutationFlags, ["--yes"]);
  assert.equal(payload.actionPlan.executionQueue.preview[0].actionId, "agent-learning-profile-init");
  assert.equal(payload.actionPlan.executionQueue.fileWriteReview[0].actionId, "agent-eval-checkpoint-generate");
  assert.equal(payload.actionPlan.executionQueue.mutationReview[0].actionId, "agent-check-capture-seed");
  assert.match(payload.actionPlan.executionQueue.nextCommand, /design-ai learn --init/);
  assert.equal(stepsById.get("agent-eval-checkpoint-generate").commandSafety.level, "writes-local-file");
  assert.equal(stepsById.get("agent-eval-checkpoint-generate").commandSafety.writesLocalFiles, true);
  assert.equal(stepsById.get("agent-eval-checkpoint-generate").commandSafety.mutatesLocalState, false);
  assert.deepEqual(stepsById.get("agent-eval-checkpoint-generate").commandSafety.outputTargets, [{ flag: "--out", value: "learning-eval.json" }]);
  assert.equal(stepsById.get("agent-eval-checkpoint-generate").requiresReviewBeforeMutation, true);
  assert.match(stepsById.get("agent-eval-checkpoint-generate").verification[0], /clean working tree/);
  assert.equal(stepsById.get("agent-learning-profile-init").commandSafety.level, "read-only");
  assert.deepEqual(stepsById.get("agent-learning-profile-init").commandSafety.profileTargets, [{ flag: "--file", value: "/tmp/design-ai-learning.json" }]);
  assert.equal(stepsById.get("agent-learning-profile-init").requiresReviewBeforeMutation, false);
  assert.equal(stepsById.get("agent-learning-profile-init").applyCommand, "design-ai learn --init --yes --file /tmp/design-ai-learning.json");
  assert.deepEqual(stepsById.get("agent-learning-profile-init").applyCommandArgs, ["design-ai", "learn", "--init", "--yes", "--file", "/tmp/design-ai-learning.json"]);
  assert.equal(stepsById.get("agent-learning-profile-init").applyCommandSafety.level, "mutates-local-state");
  assert.equal(stepsById.get("agent-learning-profile-init").applyCommandSafety.mutatesLocalState, true);
  assert.deepEqual(stepsById.get("agent-learning-profile-init").applyCommandSafety.mutationFlags, ["--yes"]);
  assert.equal(stepsById.get("agent-learning-profile-init").applyRequiresReviewBeforeMutation, true);
  assert.match(stepsById.get("agent-learning-profile-init").verification[0], /preview command first/);
  assert.match(stepsById.get("agent-learning-profile-init").verification[1], /apply command only after operator review/);
  assert.equal(payload.actionPlan.executionQueue.commandManifest[0].applyCommand, "design-ai learn --init --yes --file /tmp/design-ai-learning.json");
  assert.equal(payload.actionPlan.executionQueue.commandManifest[0].applyCommandSafety.mutatesLocalState, true);
  assert.equal(payload.actionPlan.executionQueue.commandManifest[0].applyRequiresReviewBeforeMutation, true);
  assert.equal(stepsById.get("agent-check-capture-seed").commandSafety.level, "mutates-local-state");
  assert.equal(stepsById.get("agent-check-capture-seed").commandSafety.mutatesLocalState, true);
  assert.deepEqual(stepsById.get("agent-check-capture-seed").commandSafety.mutationFlags, ["--yes"]);
  assert.equal(stepsById.get("agent-check-capture-seed").requiresReviewBeforeMutation, true);
});

test("agentBacklogReport derives command strings from structured command args", () => {
  const now = new Date("2026-06-02T00:00:00.000Z");
  const payload = agentBacklogReport({
    filePath: "/tmp/design-ai-learning.json",
    usageFile: "/tmp/design-ai-learning.usage.json",
    signalSource: "/tmp/design-ai-signals",
    root: "/tmp",
    now,
    signalRegistryProvider: () => ({
      version: 1,
      generatedAt: now.toISOString(),
      status: "warn",
      file: "/tmp/design-ai-learning.json",
      signalSource: "/tmp/design-ai-signals",
      learning: { count: 1 },
      usage: { usageFile: "/tmp/design-ai-learning.usage.json", eventCount: 0 },
      evals: { count: 0 },
      checkCapture: { count: 0 },
      workspace: { nextActionCount: 0 },
      agentDevelopment: {
        status: "warn",
        actionCount: 1,
        p0Count: 0,
        p1Count: 1,
        p2Count: 0,
        p3Count: 0,
        actions: [
          {
            rank: 1,
            id: "agent-command-args-only",
            priority: "p1",
            category: "eval-harness",
            title: "Run a command from structured args only.",
            rationale: "External providers may emit args without a shell-rendered command.",
            commandArgs: ["design-ai", "learn", "--eval-template", "--json", "--out", "learning eval.json"],
            evidence: {},
          },
        ],
      },
      recommendations: [],
    }),
  });

  assert.equal(payload.actionPlan.steps[0].command, "design-ai learn --eval-template --json --out 'learning eval.json'");
  assert.deepEqual(payload.actionPlan.steps[0].commandArgs, ["design-ai", "learn", "--eval-template", "--json", "--out", "learning eval.json"]);
  assert.equal(payload.actionPlan.executionQueue.commandManifest[0].command, "design-ai learn --eval-template --json --out 'learning eval.json'");
  assert.deepEqual(payload.actionPlan.executionQueue.nextCommandArgs, ["design-ai", "learn", "--eval-template", "--json", "--out", "learning eval.json"]);
  assert.equal(payload.actionPlan.executionQueue.nextCommandSelection.matchesPlanNextAction, true);
  assert.equal(payload.actionPlan.executionQueue.nextCommandSelection.actionId, "agent-command-args-only");
  assert.deepEqual(payload.actionPlan.executionQueue.commandManifest[0].commandArgs, ["design-ai", "learn", "--eval-template", "--json", "--out", "learning eval.json"]);
  assert.deepEqual(payload.actionPlan.executionQueue.operatorRunbook.stages[1].commands[0].commandArgs, ["design-ai", "learn", "--eval-template", "--json", "--out", "learning eval.json"]);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommandSelection.stage, "before");
  assert.deepEqual(payload.actionPlan.executionQueue.operatorRunbook.nextCommandSelection.commandArgs, ["git", "status", "--short"]);
  assert.equal(payload.actionPlan.executionQueue.nextCommandAlignment.operatorRunsBeforeQueueCommand, true);
  assert.equal(payload.actionPlan.executionQueue.nextCommandAlignment.matchesQueueNextCommand, false);
  assert.equal(payload.actionPlan.executionQueue.operatorHandoff.isGate, true);
  assert.equal(payload.actionPlan.executionQueue.operatorHandoff.decision, "run-operator-gate");
  assert.equal(payload.actionPlan.executionQueue.operatorHandoff.state.status, "gate-required");
  assert.equal(payload.actionPlan.executionQueue.operatorHandoff.state.canRunWithoutReview, false);
  assert.deepEqual(payload.actionPlan.executionQueue.operatorHandoff.refreshCommandArgs, [
    "design-ai",
    "learn",
    "--agent-backlog",
    "--from-file",
    "/tmp/design-ai-signals",
    "--file",
    "/tmp/design-ai-learning.json",
    "--usage-file",
    "/tmp/design-ai-learning.usage.json",
    "--strict",
    "--json",
  ]);
  assert.equal(payload.actionPlan.executionQueue.operatorHandoff.nextQueueActionBlockedByGate, true);
});
