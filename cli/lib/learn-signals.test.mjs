// Tests for learning signal registry.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildLearningContext,
  buildLearningEvalTemplate,
  defaultLearningUsageFile,
  learningEvalReport,
  recordLearningUsage,
} from "./learn.mjs";
import { learningSignalRegistry, renderLearningSignalReport, summarizeSignalEvalFile } from "./signals.mjs";
import { withTempDir } from "./learn-test-support.mjs";

test("learningSignalRegistry joins audit, usage, eval, check capture, and workspace signals", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  const routeEvalFile = path.join(dir, "route-eval-report.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:01.000Z",
    entries: [
      {
        id: "learn-check",
        category: "accessibility",
        text: "Improve future outputs by addressing Keyboard and focus behavior: No keyboard or focus behavior note detected.",
        source: "check:component-spec",
        createdAt: "2026-06-02T00:00:01.000Z",
      },
      {
        id: "learn-brand",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "feedback:keep",
        createdAt: "2026-06-02T00:00:00.000Z",
      },
    ],
  }), "utf8");
  const learningContext = buildLearningContext({
    filePath,
    limit: 1,
    query: "Spec a Button component API with keyboard accessibility",
  });
  recordLearningUsage({
    command: "prompt",
    routeId: "component-spec",
    learningContext,
    usageFile,
    now: new Date("2026-06-02T00:00:02.000Z"),
  });
  writeFileSync(routeEvalFile, JSON.stringify({
    evalVersion: 1,
    generatedAt: "2026-06-02T00:00:03.000Z",
    status: "pass",
    summary: {
      total: 1,
      pass: 1,
      warn: 0,
      fail: 0,
    },
    cases: [
      {
        id: "component-spec-contract",
        status: "pass",
        expectedRouteId: "component-spec",
        topRouteId: "component-spec",
        issues: [],
      },
    ],
  }), "utf8");

  const signal = summarizeSignalEvalFile(routeEvalFile);
  assert.equal(signal.kind, "route-eval");
  assert.equal(signal.shape, "report");
  assert.equal(signal.status, "pass");

  const payload = learningSignalRegistry({
    filePath,
    usageFile,
    signalSource: dir,
    root: dir,
    now: new Date("2026-06-02T00:00:04.000Z"),
    workspaceReportProvider: () => ({
      context: {
        root: dir,
        version: "4.55.0",
      },
      git: {
        isRepo: true,
        branch: "main",
        clean: true,
        ahead: 0,
        behind: 0,
      },
      repository: {
        status: "pass",
        canonical: true,
      },
      learning: {
        readiness: {
          status: "pass",
          reason: "",
        },
        auditSummary: {
          status: "pass",
        },
      },
      learningUsage: {
        readiness: {
          status: "pass",
        },
      },
      learningEval: {
        freshness: {
          status: "pass",
        },
      },
      nextActions: [
        {
          level: "pass",
          text: "Learning usage sidecar is aligned with the active profile.",
        },
      ],
    }),
  });

  assert.equal(payload.status, "pass");
  assert.equal(payload.learning.count, 2);
  assert.equal(payload.usage.eventCount, 1);
  assert.equal(payload.evals.count, 1);
  assert.equal(payload.evals.files[0].kind, "route-eval");
  assert.equal(payload.checkCapture.count, 1);
  assert.equal(payload.checkCapture.latestEntries[0].id, "learn-check");
  assert.equal(payload.workspace.git.branch, "main");
  assert.equal(payload.privacy.mutatesProfile, false);
}));

test("learningSignalRegistry includes sibling learning eval checkpoints outside the signal source", () => withTempDir((dir) => {
  const signalDir = path.join(dir, "signals");
  const profileDir = path.join(dir, "profile");
  mkdirSync(signalDir, { recursive: true });
  mkdirSync(profileDir, { recursive: true });
  const filePath = path.join(profileDir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  const evalFile = path.join(profileDir, "learning-eval.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-11T00:00:01.000Z",
    entries: [
      {
        id: "learn-a11y",
        category: "accessibility",
        text: "Always include visible focus behavior.",
        source: "test",
        createdAt: "2026-06-11T00:00:01.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(evalFile, JSON.stringify(buildLearningEvalTemplate({
    filePath,
    query: "focus behavior",
    now: new Date("2026-06-11T00:00:02.000Z"),
  })), "utf8");

  const payload = learningSignalRegistry({
    filePath,
    usageFile,
    signalSource: signalDir,
    root: signalDir,
    now: new Date("2026-06-11T00:00:03.000Z"),
    workspaceReportProvider: () => ({
      context: { root: signalDir, version: "4.55.0" },
      git: { isRepo: true, branch: "main", clean: true, ahead: 0, behind: 0 },
      repository: { status: "pass", canonical: true },
      learning: { readiness: { status: "pass", reason: "" }, auditSummary: { status: "pass" } },
      learningUsage: null,
      learningEval: { readiness: { status: "pass" } },
      nextActions: [],
    }),
  });

  assert.equal(payload.evals.count, 1);
  assert.equal(payload.evals.files[0].file, evalFile);
  assert.equal(payload.evals.files[0].kind, "learning-eval");
  assert.equal(payload.evals.templates, 1);
  const replayAction = payload.agentDevelopment.actions.find((item) => item.id === "agent-eval-template-replay");
  assert.ok(replayAction);
  assert.deepEqual(replayAction.commandArgs, [
    "design-ai",
    "learn",
    "--eval",
    "--from-file",
    evalFile,
    "--file",
    filePath,
    "--strict",
    "--json",
    "--out",
    path.join(profileDir, "learning-eval-report.json"),
  ]);
  assert.equal(replayAction.evidence.templateFile, evalFile);
  assert.equal(replayAction.evidence.evalReportFile, path.join(profileDir, "learning-eval-report.json"));
}));

test("learningSignalRegistry treats sibling learning eval reports as executed evidence for templates", () => withTempDir((dir) => {
  const signalDir = path.join(dir, "signals");
  const profileDir = path.join(dir, "profile");
  mkdirSync(signalDir, { recursive: true });
  mkdirSync(profileDir, { recursive: true });
  const filePath = path.join(profileDir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  const evalFile = path.join(profileDir, "learning-eval.json");
  const evalReportFile = path.join(profileDir, "learning-eval-report.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-11T00:00:01.000Z",
    entries: [
      {
        id: "learn-a11y",
        category: "accessibility",
        text: "Always include visible focus behavior.",
        source: "test",
        createdAt: "2026-06-11T00:00:01.000Z",
      },
    ],
  }), "utf8");
  const evalTemplate = buildLearningEvalTemplate({
    filePath,
    query: "focus behavior",
    now: new Date("2026-06-11T00:00:02.000Z"),
  });
  writeFileSync(evalFile, JSON.stringify(evalTemplate), "utf8");
  writeFileSync(evalReportFile, JSON.stringify(learningEvalReport({
    filePath,
    evalText: JSON.stringify(evalTemplate),
    source: evalFile,
    now: new Date("2026-06-11T00:00:03.000Z"),
  })), "utf8");

  const payload = learningSignalRegistry({
    filePath,
    usageFile,
    signalSource: signalDir,
    root: signalDir,
    now: new Date("2026-06-11T00:00:04.000Z"),
    workspaceReportProvider: () => ({
      context: { root: signalDir, version: "4.55.0" },
      git: { isRepo: true, branch: "main", clean: true, ahead: 0, behind: 0 },
      repository: { status: "pass", canonical: true },
      learning: { readiness: { status: "pass", reason: "" }, auditSummary: { status: "pass" } },
      learningUsage: null,
      learningEval: { freshness: { status: "pass" } },
      nextActions: [],
    }),
  });

  assert.equal(payload.evals.count, 2);
  assert.equal(payload.evals.rawTemplates, 1);
  assert.equal(payload.evals.templates, 0);
  assert.equal(payload.evals.reports, 1);
  assert.equal(payload.evals.passed, 1);
  assert.equal(payload.evals.files.some((item) => item.file === evalReportFile && item.shape === "report"), true);
  assert.equal(payload.recommendations.some((item) => /templates rather than executed reports/.test(item.text)), false);
  assert.equal(payload.agentDevelopment.actions.some((item) => item.id === "agent-eval-template-replay"), false);
}));

test("learningSignalRegistry keeps missing check captures as advisory when all gates pass", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  const evalReportFile = path.join(dir, "learning-eval-report.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-12T00:00:01.000Z",
    entries: [
      {
        id: "learn-a11y",
        category: "accessibility",
        text: "Always include visible focus behavior.",
        source: "feedback:keep",
        createdAt: "2026-06-12T00:00:01.000Z",
      },
    ],
  }), "utf8");
  const learningContext = buildLearningContext({
    filePath,
    query: "visible focus behavior",
    limit: 1,
  });
  recordLearningUsage({
    command: "prompt",
    routeId: "component-spec",
    learningContext,
    usageFile,
    now: new Date("2026-06-12T00:00:02.000Z"),
  });
  writeFileSync(evalReportFile, JSON.stringify({
    evalVersion: 1,
    generatedAt: "2026-06-12T00:00:03.000Z",
    status: "pass",
    summary: {
      total: 1,
      pass: 1,
      warn: 0,
      fail: 0,
    },
    cases: [
      {
        id: "learning-selection",
        status: "pass",
        expectedSelectedIds: ["learn-a11y"],
        selectedEntryIds: ["learn-a11y"],
        issues: [],
      },
    ],
  }), "utf8");

  const payload = learningSignalRegistry({
    filePath,
    usageFile,
    signalSource: dir,
    root: dir,
    now: new Date("2026-06-12T00:00:04.000Z"),
    workspaceReportProvider: () => ({
      context: { root: dir, version: "4.55.0" },
      git: { isRepo: true, branch: "main", clean: true, ahead: 0, behind: 0 },
      repository: { status: "pass", canonical: true },
      learning: { readiness: { status: "pass", reason: "" }, auditSummary: { status: "pass" } },
      learningUsage: { readiness: { status: "pass" } },
      learningEval: { freshness: { status: "pass" } },
      nextActions: [],
    }),
  });

  assert.equal(payload.status, "pass");
  assert.equal(payload.checkCapture.count, 0);
  assert.deepEqual(payload.readiness, {
    version: 1,
    status: "pass",
    summary: "Required local learning signal surfaces are ready; optional evidence gaps remain.",
    requiredPassCount: 4,
    requiredCount: 4,
    requiredReady: true,
    blockingCount: 0,
    optionalGapCount: 1,
    blockingChecks: [],
    optionalGaps: ["check-capture"],
    optionalGapDetails: [
      {
        id: "check-capture",
        label: "Check learning capture",
        status: "info",
        summary: "No check-capture entries are present; this is advisory until real warn/fail checks are captured.",
        reason: "No real warn/fail check result has been intentionally captured into the local learning profile yet.",
        nextCondition: "Run `design-ai check <artifact.md> --learn --yes` only after reviewing an actual warning or failure that should improve future outputs.",
        automationPolicy: "Do not emit placeholder mutation commands for this advisory gap; wait for real check evidence.",
      },
    ],
    requiredCheckIds: ["learning-profile", "eval-signals", "workspace-readiness", "agent-development"],
    optionalCheckIds: ["usage-sidecar", "check-capture"],
    checkStatusById: {
      "learning-profile": "pass",
      "usage-sidecar": "pass",
      "eval-signals": "pass",
      "check-capture": "info",
      "workspace-readiness": "pass",
      "agent-development": "pass",
    },
    checkRequiredById: {
      "learning-profile": true,
      "usage-sidecar": false,
      "eval-signals": true,
      "check-capture": false,
      "workspace-readiness": true,
      "agent-development": true,
    },
    checkCountByStatus: {
      pass: 5,
      info: 1,
      warn: 0,
      fail: 0,
      missing: 0,
      template: 0,
      unknown: 0,
    },
    requiredCheckCountByStatus: {
      pass: 4,
      info: 0,
      warn: 0,
      fail: 0,
      missing: 0,
      template: 0,
      unknown: 0,
    },
    optionalCheckCountByStatus: {
      pass: 1,
      info: 1,
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
        summary: "Profile has 1 entries with 0 audit failure(s) and 0 warning(s).",
        evidence: {
          exists: true,
          entries: 1,
          failures: 0,
          warnings: 0,
        },
      },
      {
        id: "usage-sidecar",
        label: "Usage sidecar",
        status: "pass",
        required: false,
        summary: "Usage sidecar has 1 event(s) and 0 stale selected id(s).",
        evidence: {
          exists: true,
          events: 1,
          staleSelectedEntryCount: 0,
        },
      },
      {
        id: "eval-signals",
        label: "Eval signals",
        status: "pass",
        required: true,
        summary: "Eval signals include 1 report(s), 0 unresolved template(s), 0 failed report(s), and 0 warned report(s).",
        evidence: {
          files: 1,
          reports: 1,
          templates: 0,
          failed: 0,
          warned: 0,
        },
      },
      {
        id: "check-capture",
        label: "Check learning capture",
        status: "info",
        required: false,
        summary: "No check-capture entries are present; this is advisory until real warn/fail checks are captured.",
        evidence: {
          entries: 0,
          categoryCounts: {},
        },
      },
      {
        id: "workspace-readiness",
        label: "Workspace readiness",
        status: "pass",
        required: true,
        summary: "Workspace has 0 fail action(s), 0 warn action(s), and 0 total next action(s).",
        evidence: {
          fail: 0,
          warn: 0,
          nextActionCount: 0,
        },
      },
      {
        id: "agent-development",
        label: "Agent development backlog",
        status: "pass",
        required: true,
        summary: "Agent backlog has 0 action(s): 0 P0, 0 P1, 0 P2, 0 P3.",
        evidence: {
          actions: 0,
          p0: 0,
          p1: 0,
          p2: 0,
          p3: 0,
        },
      },
    ],
  });
  assert.equal(payload.agentDevelopment.status, "pass");
  assert.equal(payload.agentDevelopment.actionCount, 0);
  assert.equal(payload.agentDevelopment.p3Count, 0);
  assert.deepEqual(payload.agentDevelopment.actions, []);
  assert.equal(payload.recommendations.some((item) => /No check learning capture entries/.test(item.text)), true);
  assert.equal(payload.recommendations.some((item) => item.level === "warn" || item.level === "fail"), false);

  const markdown = renderLearningSignalReport(payload, { generatedAt: new Date("2026-06-12T00:00:04.000Z") });
  assert.match(markdown, /## Readiness Summary/);
  assert.match(markdown, /Required local learning signal surfaces are ready; optional evidence gaps remain/);
  assert.match(markdown, /Required checks: 4\/4/);
  assert.match(markdown, /Optional gaps: 1/);
  assert.match(markdown, /Readiness check index:/);
  assert.match(markdown, /Required ids: learning-profile, eval-signals, workspace-readiness, agent-development/);
  assert.match(markdown, /Optional ids: usage-sidecar, check-capture/);
  assert.match(markdown, /Status index: learning-profile=pass, usage-sidecar=pass, eval-signals=pass, check-capture=info, workspace-readiness=pass, agent-development=pass/);
  assert.match(markdown, /Required index: learning-profile=yes, usage-sidecar=no, eval-signals=yes, check-capture=no, workspace-readiness=yes, agent-development=yes/);
  assert.match(markdown, /Status counts: pass=5, info=1, warn=0, fail=0, missing=0, template=0, unknown=0/);
  assert.match(markdown, /Required status counts: pass=4, info=0, warn=0, fail=0, missing=0, template=0, unknown=0/);
  assert.match(markdown, /Optional status counts: pass=1, info=1, warn=0, fail=0, missing=0, template=0, unknown=0/);
  assert.match(markdown, /check-capture \[optional\] info: No check-capture entries are present/);
  assert.match(markdown, /Optional gap details:/);
  assert.match(markdown, /No real warn\/fail check result has been intentionally captured/);
  assert.match(markdown, /Do not emit placeholder mutation commands for this advisory gap/);
}));
