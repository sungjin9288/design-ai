// Tests for runLearn --signals / --agent-backlog CLI flows.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { defaultLearningUsageFile } from "./learn.mjs";
import { runLearn } from "../commands/learn.mjs";
import { captureStdout, withTempDirAsync } from "./learn-test-support.mjs";

test("runLearn --signals reports registry JSON and human output without mutating the profile", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  const routeEvalFile = path.join(dir, "route-eval-report.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:01.000Z",
    entries: [
      {
        id: "learn-check",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No mobile behavior note detected.",
        source: "check:artifact",
        createdAt: "2026-06-02T00:00:01.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:02.000Z",
    profileFile: filePath,
    events: [],
  }), "utf8");
  writeFileSync(routeEvalFile, JSON.stringify({
    evalVersion: 1,
    status: "pass",
    summary: {
      total: 1,
      pass: 1,
      warn: 0,
      fail: 0,
    },
    cases: [
      {
        id: "website-improvement-control-tower",
        status: "pass",
        expectedRouteId: "website-improvement",
        topRouteId: "website-improvement",
        issues: [],
      },
    ],
  }), "utf8");
  const before = readFileSync(filePath, "utf8");

  const jsonOutput = await captureStdout(() => runLearn([
    "--signals",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--json",
  ]));
  const payload = JSON.parse(jsonOutput);
  assert.equal(payload.file, filePath);
  assert.equal(payload.evals.count, 1);
  assert.equal(payload.checkCapture.count, 1);
  assert.equal(payload.agentDevelopment.privacy.callsExternalAiApis, false);
  assert.equal(payload.agentDevelopment.actions.some((item) => item.id === "agent-skill-proposal-preview"), true);
  assert.match(payload.agentDevelopment.actions.find((item) => item.id === "agent-skill-proposal-preview")?.command || "", /learn --propose-skills/);
  assert.equal(payload.privacy.mutatesProfile, false);
  assert.equal(readFileSync(filePath, "utf8"), before);

  const humanOutput = await captureStdout(() => runLearn([
    "--signals",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
  ]));
  assert.match(humanOutput, /Learning signal registry/);
  assert.match(humanOutput, /Eval signals:/);
  assert.match(humanOutput, /Recent check captures:/);
  assert.match(humanOutput, /Agent development backlog:/);
  assert.match(humanOutput, /learn --propose-skills/);
  assert.match(humanOutput, /Privacy: signal registry is read-only/);

  const reportOutput = await captureStdout(() => runLearn([
    "--signals",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--report",
  ]));
  assert.match(reportOutput, /# Learning Signal Registry Report/);
  assert.match(reportOutput, /## Agent Development Backlog/);
  assert.match(reportOutput, /```bash\n.*learn --propose-skills/s);
  assert.match(reportOutput, /This report is read-only evidence/);
  assert.equal(readFileSync(filePath, "utf8"), before);

  const reportFile = path.join(dir, "learning-signals.md");
  const reportWriteOutput = await captureStdout(() => runLearn([
    "--signals",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--report",
    "--out",
    reportFile,
  ]));
  assert.match(reportWriteOutput, /Wrote /);
  assert.match(readFileSync(reportFile, "utf8"), /# Learning Signal Registry Report/);
  assert.equal(readFileSync(filePath, "utf8"), before);
}));

test("runLearn --agent-backlog reports JSON, human, and Markdown without mutating the profile", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  const routeEvalFile = path.join(dir, "route-eval-report.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:01.000Z",
    entries: [
      {
        id: "learn-check",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No mobile behavior note detected.",
        source: "check:artifact",
        createdAt: "2026-06-02T00:00:01.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:02.000Z",
    profileFile: filePath,
    events: [],
  }), "utf8");
  writeFileSync(routeEvalFile, JSON.stringify({
    evalVersion: 1,
    status: "pass",
    summary: {
      total: 1,
      pass: 1,
      warn: 0,
      fail: 0,
    },
    cases: [
      {
        id: "website-improvement-control-tower",
        status: "pass",
        expectedRouteId: "website-improvement",
        topRouteId: "website-improvement",
        issues: [],
      },
    ],
  }), "utf8");
  const before = readFileSync(filePath, "utf8");

  const jsonOutput = await captureStdout(() => runLearn([
    "--agent-backlog",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--json",
  ]));
  const payload = JSON.parse(jsonOutput);
  assert.equal(payload.version, 1);
  assert.equal(payload.file, filePath);
  assert.equal(payload.usageFile, usageFile);
  assert.equal(payload.counts.checkCaptures, 1);
  assert.equal(payload.counts.evalSignals, 1);
  assert.equal(payload.actions.some((item) => item.id === "agent-skill-proposal-preview"), true);
  assert.equal(payload.actionPlan.stepCount, payload.actions.length);
  assert.equal(payload.actionPlan.steps.some((item) => item.actionId === "agent-skill-proposal-preview"), true);
  const workspaceReadinessStep = payload.actionPlan.steps.find((item) => item.actionId === "agent-workspace-readiness-review");
  if (workspaceReadinessStep) {
    assert.deepEqual(workspaceReadinessStep.commandSafety.profileTargets, [{ flag: "--learning-file", value: filePath }]);
    assert.deepEqual(workspaceReadinessStep.commandSafety.usageTargets, [{ flag: "--learning-usage", value: usageFile }]);
  }
  const usageRecordStep = payload.actionPlan.steps.find((item) => item.actionId === "agent-learning-usage-record");
  assert.ok(usageRecordStep);
  assert.equal(usageRecordStep.command, `env DESIGN_AI_LEARNING_FILE=${filePath} DESIGN_AI_LEARNING_USAGE_FILE=${usageFile} design-ai prompt 'audit a design artifact' --with-learning --json`);
  assert.deepEqual(usageRecordStep.commandArgs, [
    "env",
    `DESIGN_AI_LEARNING_FILE=${filePath}`,
    `DESIGN_AI_LEARNING_USAGE_FILE=${usageFile}`,
    "design-ai",
    "prompt",
    "audit a design artifact",
    "--with-learning",
    "--json",
  ]);
  assert.equal(usageRecordStep.commandSafety.level, "mutates-local-state");
  assert.equal(usageRecordStep.commandSafety.mutatesLocalState, true);
  assert.deepEqual(usageRecordStep.commandSafety.detectedFlags, ["--with-learning"]);
  assert.deepEqual(usageRecordStep.commandSafety.mutationFlags, ["--with-learning"]);
  assert.deepEqual(usageRecordStep.commandSafety.profileTargets, [{ flag: "DESIGN_AI_LEARNING_FILE", value: filePath }]);
  assert.deepEqual(usageRecordStep.commandSafety.usageTargets, [{ flag: "DESIGN_AI_LEARNING_USAGE_FILE", value: usageFile }]);
  assert.equal(usageRecordStep.requiresReviewBeforeMutation, true);
  assert.equal(payload.actionPlan.safetySummary.readOnly, payload.actions.length - 1);
  assert.equal(payload.actionPlan.safetySummary.writesLocalFile, 0);
  assert.equal(payload.actionPlan.safetySummary.mutatesLocalState, 1);
  assert.equal(payload.actionPlan.executionQueue.previewCount, payload.actions.length - 1);
  assert.equal(payload.actionPlan.executionQueue.fileWriteReviewCount, 0);
  assert.equal(payload.actionPlan.executionQueue.mutationReviewCount, 1);
  assert.equal(payload.actionPlan.executionQueue.orderedCount, payload.actions.length);
  assert.equal(payload.actionPlan.executionQueue.commandManifestCount, payload.actions.length);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.mutatesLocalStateCount, 1);
  const expectedUsageTargets = [
    ...(workspaceReadinessStep ? [{ flag: "--learning-usage", value: usageFile }] : []),
    { flag: "--usage-file", value: usageFile },
    { flag: "DESIGN_AI_LEARNING_USAGE_FILE", value: usageFile },
  ];
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.usageTargetCount, expectedUsageTargets.length);
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectSummary.usageTargets, expectedUsageTargets);
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectSummary.mutationFlags, ["--with-learning"]);
  assert.equal(
    payload.actionPlan.executionQueue.mutationReview.find((item) => item.actionId === "agent-learning-usage-record")?.runPolicy,
    "review-before-mutation",
  );
  assert.equal(payload.actionPlan.executionQueue.nextActionId, payload.actionPlan.executionQueue.ordered[0].actionId);
  assert.equal(payload.actionPlan.executionQueue.nextCommandRunPolicy, "preview-only");
  assert.match(payload.actionPlan.verification.map((item) => item.command).join("\n"), /agent-backlog .*--strict --json/);
  assert.equal(payload.privacy.mutatesProfile, false);
  assert.equal(payload.privacy.mutatesSkillFiles, false);
  assert.equal(payload.privacy.callsExternalAiApis, false);
  assert.equal(readFileSync(filePath, "utf8"), before);

  const humanOutput = await captureStdout(() => runLearn([
    "--agent-backlog",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
  ]));
  assert.match(humanOutput, /Agent development backlog/);
  assert.match(humanOutput, /Backlog actions:/);
  assert.match(humanOutput, /Action plan:/);
  assert.match(humanOutput, new RegExp(`safety summary: ${payload.actionPlan.safetySummary.readOnly} read-only, 0 writes-local-file, 1 mutates-local-state`));
  assert.match(humanOutput, new RegExp(`execution queue: ${payload.actionPlan.executionQueue.previewCount} preview, 0 file-write review, 1 mutation review`));
  assert.match(humanOutput, new RegExp(`command effects: 0 output, ${payload.actionPlan.executionQueue.commandEffectSummary.profileTargetCount} profile, ${payload.actionPlan.executionQueue.commandEffectSummary.usageTargetCount} usage, 1 mutation flags`));
  assert.match(humanOutput, /next action: /);
  assert.match(humanOutput, /next command: /);
  assert.match(humanOutput, /next command policy: preview-only/);
  assert.match(humanOutput, /queue order: /);
  assert.match(humanOutput, /command manifest: /);
  assert.match(humanOutput, /safety: read-only/);
  assert.match(humanOutput, /safety: mutates-local-state/);
  assert.match(humanOutput, /requires mutation review: no/);
  assert.match(humanOutput, /requires mutation review: yes/);
  assert.match(humanOutput, /DESIGN_AI_LEARNING_USAGE_FILE=/);
  assert.match(humanOutput, /learn --propose-skills/);
  assert.match(humanOutput, /Privacy: agent backlog is read-only/);
  assert.equal(readFileSync(filePath, "utf8"), before);

  const reportOutput = await captureStdout(() => runLearn([
    "--agent-backlog",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--report",
  ]));
  assert.match(reportOutput, /# Agent Development Backlog Report/);
  assert.match(reportOutput, /## Action Plan/);
  assert.match(reportOutput, /Safety summary:/);
  assert.match(reportOutput, new RegExp(`Read-only: ${payload.actionPlan.safetySummary.readOnly}`));
  assert.match(reportOutput, /Mutates local state: 1/);
  assert.match(reportOutput, /Execution queue:/);
  assert.match(reportOutput, new RegExp(`Preview/read-only commands: ${payload.actionPlan.executionQueue.previewCount}`));
  assert.match(reportOutput, /Local mutation review commands: 1/);
  assert.match(reportOutput, new RegExp(`Ordered commands: ${payload.actionPlan.executionQueue.orderedCount}`));
  assert.match(reportOutput, new RegExp(`Command manifest entries: ${payload.actionPlan.executionQueue.commandManifestCount}`));
  assert.match(reportOutput, /agent-learning-usage-record - review-before-mutation/);
  assert.match(reportOutput, /flags --with-learning/);
  assert.match(reportOutput, /Recommended next action:/);
  assert.match(reportOutput, /Recommended next command policy: preview-only/);
  assert.match(reportOutput, /Recommended next command:/);
  assert.match(reportOutput, /Queue order:/);
  assert.match(reportOutput, /Command manifest:/);
  assert.match(reportOutput, /Command safety: read-only/);
  assert.match(reportOutput, /Command safety: mutates-local-state/);
  assert.match(reportOutput, /## Follow-Up Commands/);
  assert.match(reportOutput, /This report is read-only evidence/);
  assert.equal(readFileSync(filePath, "utf8"), before);

  const reportFile = path.join(dir, "agent-backlog.md");
  const reportWriteOutput = await captureStdout(() => runLearn([
    "--agent-backlog",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--report",
    "--out",
    reportFile,
  ]));
  assert.match(reportWriteOutput, /Wrote /);
  assert.match(readFileSync(reportFile, "utf8"), /# Agent Development Backlog Report/);
  assert.match(readFileSync(reportFile, "utf8"), /## Action Plan/);
  assert.match(readFileSync(reportFile, "utf8"), /Safety summary:/);
  assert.match(readFileSync(reportFile, "utf8"), /Execution queue:/);
  assert.match(readFileSync(reportFile, "utf8"), /Command safety: read-only/);
  assert.match(readFileSync(reportFile, "utf8"), /Command safety: mutates-local-state/);
  assert.equal(readFileSync(filePath, "utf8"), before);
}));

test("runLearn --signals ranks profile initialization before eval checkpoint bootstrap", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "missing-learning.json");
  const usageFile = defaultLearningUsageFile(filePath);

  const jsonOutput = await captureStdout(() => runLearn([
    "--signals",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--json",
  ]));
  const payload = JSON.parse(jsonOutput);

  assert.equal(payload.learning.exists, false);
  const initAction = payload.agentDevelopment.actions.find((item) => item.id === "agent-learning-profile-init");
  const evalAction = payload.agentDevelopment.actions.find((item) => item.id === "agent-eval-checkpoint-generate");
  const workspaceAction = payload.agentDevelopment.actions.find((item) => item.id === "agent-workspace-readiness-review");
  assert.ok(initAction);
  assert.ok(evalAction);
  assert.equal(initAction.rank, 1);
  assert.equal(initAction.priority, "p1");
  assert.equal(evalAction.priority, "p1");
  assert.equal(evalAction.rank > initAction.rank, true);
  if (workspaceAction) {
    assert.equal(workspaceAction.rank > initAction.rank, true);
    assert.equal(workspaceAction.rank < evalAction.rank, true);
  }
  assert.equal(evalAction.command.includes(`--out ${path.join(dir, "learning-eval.json")}`), true);
  assert.equal(evalAction.evidence.evalOutputFile, path.join(dir, "learning-eval.json"));
}));

test("runLearn --signals --strict exits non-zero when signal registry is not pass", () => withTempDirAsync(async (dir) => {
  const previousExitCode = process.exitCode;
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-10T00:00:01.000Z",
    entries: [
      {
        id: "learn-workflow",
        category: "workflow",
        text: "Prefer deterministic local agent development gates.",
        source: "test",
        createdAt: "2026-06-10T00:00:01.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-10T00:00:02.000Z",
    profileFile: filePath,
    events: [],
  }), "utf8");

  try {
    process.exitCode = undefined;
    const strictOutput = await captureStdout(() => runLearn([
      "--signals",
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
    assert.equal(strictPayload.agentDevelopment.status, "warn");
    assert.equal(process.exitCode, 1);

    process.exitCode = 0;
    await captureStdout(() => runLearn([
      "--signals",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--json",
    ]));
    assert.equal(process.exitCode, 0);
  } finally {
    process.exitCode = previousExitCode;
  }
}));

test("runLearn --agent-backlog --strict exits non-zero when backlog warns", () => withTempDirAsync(async (dir) => {
  const previousExitCode = process.exitCode;
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-10T00:00:01.000Z",
    entries: [
      {
        id: "learn-workflow",
        category: "workflow",
        text: "Prefer deterministic local agent development gates.",
        source: "test",
        createdAt: "2026-06-10T00:00:01.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-10T00:00:02.000Z",
    profileFile: filePath,
    events: [],
  }), "utf8");

  try {
    process.exitCode = undefined;
    const strictOutput = await captureStdout(() => runLearn([
      "--agent-backlog",
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
    assert.equal(strictPayload.signalStatus, "warn");
    assert.equal(process.exitCode, 1);

    process.exitCode = 0;
    await captureStdout(() => runLearn([
      "--agent-backlog",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--json",
    ]));
    assert.equal(process.exitCode, 0);
  } finally {
    process.exitCode = previousExitCode;
  }
}));
