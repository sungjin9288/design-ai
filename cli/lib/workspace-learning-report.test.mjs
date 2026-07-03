// Tests for workspace learning usage/eval/restore-backup readiness reports.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { defaultLearningRestoreBackupFile } from "./learn.mjs";
import {
  assessLearningEvalFreshness,
  assessLearningRestoreBackupReadiness,
  assessLearningUsageReadiness,
  buildWorkspaceNextActions,
  collectLearningRestoreBackupsReport,
  collectLearningUsageReport,
  collectRetrievalIndexReport,
  collectWorkspaceReport,
  defaultLearningCurationReportPath,
  defaultLearningEvalPath,
  defaultLearningUsagePath,
  hasWorkspaceStrictIssues,
  quoteShellArg,
} from "./workspace.mjs";
import { fail, fakeGit, fullReleaseScripts, ok, withTempDir, writeSourceMetadata } from "./workspace-test-support.mjs";

test("collectWorkspaceReport shell-quotes learning usage and eval next action paths", () => withTempDir((dir) => {
  const repoRoot = path.join(dir, "repo");
  const sourceRoot = path.join(dir, "source");
  const learningFile = path.join(dir, "learning profile's data.json");
  const usageFile = path.join(dir, "learning usage sidecar.json");
  const evalFile = path.join(dir, "learning eval checkpoint.json");
  mkdirSync(sourceRoot, { recursive: true });
  writeSourceMetadata(sourceRoot, fullReleaseScripts());

  const gitRunner = fakeGit({
    "rev-parse --is-inside-work-tree": ok("true\n"),
    "rev-parse --show-toplevel": ok(`${repoRoot}\n`),
    "branch --show-current": ok("main\n"),
    "status --short": ok(""),
    "rev-parse --abbrev-ref --symbolic-full-name @{u}": ok("origin/main\n"),
    "rev-list --left-right --count @{u}...HEAD": ok("0\t0\n"),
    "config --get remote.origin.url": ok("https://github.com/sungjin9288/design-ai.git\n"),
    "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: workspace quoted paths\n"),
  });
  const learningStatsProvider = ({ filePath }) => ({
    file: filePath,
    exists: true,
    count: 1,
    categoryCounts: { workflow: 1 },
    sourceCounts: { test: 1 },
    latestEntry: null,
    auditSummary: { status: "pass", failures: 0, warnings: 0 },
  });

  const templateReport = collectWorkspaceReport({
    root: repoRoot,
    sourceRoot,
    learningFilePath: learningFile,
    gitRunner,
    learningStatsProvider,
  });
  const templateAction = templateReport.nextActions.find((item) => (item.command || "").includes("learn --eval-template"));
  assert.equal(
    templateAction?.command,
    `design-ai learn --eval-template --file ${quoteShellArg(learningFile)} --out ${quoteShellArg(defaultLearningEvalPath(learningFile))}`,
  );

  const evalReport = collectWorkspaceReport({
    root: repoRoot,
    sourceRoot,
    learningFilePath: learningFile,
    learningUsagePath: usageFile,
    learningEvalPath: evalFile,
    gitRunner,
    learningStatsProvider,
    learningUsageStatsProvider: ({ filePath, usageFile }) => ({
      file: filePath,
      usageFile,
      exists: true,
      profileExists: true,
      profileFile: filePath,
      version: 1,
      updatedAt: "2026-05-22T00:00:03.000Z",
      eventCount: 1,
      profileEntryCount: 1,
      usedEntryCount: 1,
      unusedEntryCount: 0,
      staleSelectedEntryCount: 0,
      commandCounts: { prompt: 1 },
      routeCounts: { "component-spec": 1 },
      categoryCounts: { accessibility: 1 },
      auditStatusCounts: { pass: 1 },
      latestEvent: {
        id: "learn-use-1",
        command: "prompt",
        routeId: "component-spec",
        category: "accessibility",
        limit: 1,
        selectedEntryIds: ["learn-keyboard"],
        selectedCount: 1,
        candidateCount: 1,
        matchedCount: 1,
        fallbackCount: 0,
        queryTokenCount: 2,
        auditStatus: "pass",
        briefHash: "abc123",
        createdAt: "2026-05-22T00:00:03.000Z",
      },
      recommendations: [],
      privacy: {
        storesRawBriefText: false,
        storesBriefHash: true,
        storesSelectedEntryIds: true,
      },
    }),
    learningEvalReportProvider: ({ filePath, source }) => ({
      file: filePath,
      source,
      status: "pass",
      caseCount: 1,
      passed: 1,
      warned: 0,
      failed: 0,
      profileExists: true,
      profileEntryCount: 1,
      auditSummary: { status: "pass", failures: 0, warnings: 0 },
      privacy: {
        storesRawBriefText: false,
        storesBriefHash: true,
        exposesMatchedTokens: false,
      },
    }),
    learningRestoreBackupsProvider: ({ filePath }) => ({
      file: filePath,
      directory: path.dirname(filePath),
      pattern: "learning.restore-backup-*.json",
      generatedAt: "2026-05-22T00:06:00.000Z",
      limit: 5,
      totalCount: 6,
      count: 5,
      backups: [
        {
          file: path.join(dir, "learning.restore-backup-20260522T000600000Z.json"),
          name: "learning.restore-backup-20260522T000600000Z.json",
          createdAt: "2026-05-22T00:06:00.000Z",
          modifiedAt: "2026-05-22T00:06:00.000Z",
          sizeBytes: 100,
          updatedAt: "2026-05-22T00:06:00.000Z",
          entryCount: 1,
          auditSummary: { status: "pass", failures: 0, warnings: 0 },
          issueCount: 0,
          restorePreviewCommand: "design-ai learn --restore --dry-run",
        },
      ],
      privacy: {
        storesRawBriefText: false,
        exposesEntryTextPreview: false,
        mutatesProfile: false,
      },
    }),
  });
  const evalAction = evalReport.nextActions.find((item) => (item.command || "").includes("learn --eval --from-file"));
  const usageAction = evalReport.nextActions.find((item) => (item.command || "").includes("learn --usage"));
  const restoreBackupsAction = evalReport.nextActions.find((item) => (item.command || "").includes("learn --restore-backups"));
  assert.equal(
    usageAction?.command,
    `design-ai learn --usage --file ${quoteShellArg(learningFile)} --usage-file ${quoteShellArg(usageFile)}`,
  );
  assert.equal(
    evalAction?.command,
    `design-ai learn --eval --from-file ${quoteShellArg(evalFile)} --file ${quoteShellArg(learningFile)} --strict`,
  );
  assert.equal(
    restoreBackupsAction?.command,
    `design-ai learn --restore-backups --file ${quoteShellArg(learningFile)} --prune --keep 5`,
  );

  const warningReport = collectWorkspaceReport({
    root: repoRoot,
    sourceRoot,
    learningFilePath: learningFile,
    learningUsagePath: usageFile,
    gitRunner,
    learningStatsProvider: ({ filePath }) => ({
      file: filePath,
      exists: true,
      count: 2,
      categoryCounts: { workflow: 2 },
      sourceCounts: { test: 2 },
      latestEntry: null,
      auditSummary: { status: "warn", failures: 0, warnings: 1 },
    }),
    learningUsageStatsProvider: ({ filePath, usageFile }) => ({
      file: filePath,
      usageFile,
      exists: true,
      profileExists: true,
      profileFile: filePath,
      version: 1,
      updatedAt: "2026-05-22T00:00:03.000Z",
      eventCount: 1,
      profileEntryCount: 2,
      usedEntryCount: 1,
      unusedEntryCount: 1,
      staleSelectedEntryCount: 1,
      commandCounts: { prompt: 1 },
      routeCounts: { "component-spec": 1 },
      categoryCounts: { accessibility: 1 },
      auditStatusCounts: { pass: 1 },
      latestEvent: null,
      recommendations: [],
      privacy: {
        storesRawBriefText: false,
        storesBriefHash: true,
        storesSelectedEntryIds: true,
      },
    }),
  });
  const curationReportAction = warningReport.nextActions.find((item) => (item.command || "").includes("--report --out"));
  assert.equal(
    curationReportAction?.command,
    `design-ai learn --curate --file ${quoteShellArg(learningFile)} --usage-file ${quoteShellArg(usageFile)} --report --out ${quoteShellArg(defaultLearningCurationReportPath(learningFile))}`,
  );
}));

test("collectWorkspaceReport auto-detects sibling learning usage sidecar", () => withTempDir((dir) => {
  const repoRoot = path.join(dir, "repo");
  const sourceRoot = path.join(dir, "source");
  const learningFile = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsagePath(learningFile);
  mkdirSync(sourceRoot, { recursive: true });
  writeSourceMetadata(sourceRoot, fullReleaseScripts());
  writeFileSync(
    learningFile,
    JSON.stringify({
      version: 1,
      updatedAt: "2026-05-22T00:00:02.000Z",
      entries: [
        {
          id: "learn-keyboard",
          category: "accessibility",
          text: "Prioritize keyboard accessibility details for Button component API specs",
          source: "test",
          createdAt: "2026-05-22T00:00:01.000Z",
        },
      ],
    }),
    "utf8",
  );
  writeFileSync(
    usageFile,
    JSON.stringify({
      version: 1,
      updatedAt: "2026-05-22T00:00:03.000Z",
      profileFile: learningFile,
      events: [
        {
          id: "learn-use-1",
          command: "prompt",
          routeId: "component-spec",
          profileFile: learningFile,
          briefHash: "abc123",
          category: "accessibility",
          limit: 1,
          selectedEntryIds: ["learn-keyboard"],
          selectedCount: 1,
          candidateCount: 1,
          matchedCount: 1,
          fallbackCount: 0,
          queryTokenCount: 2,
          auditStatus: "pass",
          createdAt: "2026-05-22T00:00:03.000Z",
        },
      ],
    }),
    "utf8",
  );

  const report = collectWorkspaceReport({
    root: repoRoot,
    sourceRoot,
    learningFilePath: learningFile,
    gitRunner: fakeGit({
      "rev-parse --is-inside-work-tree": ok("true\n"),
      "rev-parse --show-toplevel": ok(`${repoRoot}\n`),
      "branch --show-current": ok("main\n"),
      "status --short": ok(""),
      "rev-parse --abbrev-ref --symbolic-full-name @{u}": ok("origin/main\n"),
      "rev-list --left-right --count @{u}...HEAD": ok("0\t0\n"),
      "config --get remote.origin.url": ok("https://github.com/sungjin9288/design-ai.git\n"),
      "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: workspace usage auto-discovery\n"),
    }),
  });

  assert.equal(report.learningUsage.usageFile, usageFile);
  assert.equal(report.learningUsage.eventCount, 1);
  assert.equal(report.learningUsage.readiness.status, "pass");
  assert.equal(report.nextActions.some((item) => item.text === "Learning usage sidecar is aligned with the active profile."), true);
}));

test("collectWorkspaceReport auto-detects sibling learning restore rollback backups", () => withTempDir((dir) => {
  const repoRoot = path.join(dir, "repo");
  const sourceRoot = path.join(dir, "source");
  const learningFile = path.join(dir, "learning.json");
  mkdirSync(sourceRoot, { recursive: true });
  writeSourceMetadata(sourceRoot, fullReleaseScripts());
  writeFileSync(
    learningFile,
    JSON.stringify({
      version: 1,
      updatedAt: "2026-05-22T00:06:00.000Z",
      entries: [
        {
          id: "learn-active",
          category: "workflow",
          text: "Run verification before handoff",
          source: "test",
          createdAt: "2026-05-22T00:06:00.000Z",
        },
      ],
    }),
    "utf8",
  );

  for (let minute = 1; minute <= 6; minute += 1) {
    const timestamp = `2026-05-22T00:0${minute}:00.000Z`;
    writeFileSync(
      defaultLearningRestoreBackupFile(learningFile, new Date(timestamp)),
      JSON.stringify({
        version: 1,
        updatedAt: timestamp,
        entries: [
          {
            id: `learn-backup-${minute}`,
            category: "brand",
            text: "Use quiet enterprise language",
            source: "backup",
            createdAt: timestamp,
          },
        ],
      }),
      "utf8",
    );
  }

  const report = collectWorkspaceReport({
    root: repoRoot,
    sourceRoot,
    learningFilePath: learningFile,
    gitRunner: fakeGit({
      "rev-parse --is-inside-work-tree": ok("true\n"),
      "rev-parse --show-toplevel": ok(`${repoRoot}\n`),
      "branch --show-current": ok("main\n"),
      "status --short": ok(""),
      "rev-parse --abbrev-ref --symbolic-full-name @{u}": ok("origin/main\n"),
      "rev-list --left-right --count @{u}...HEAD": ok("0\t0\n"),
      "config --get remote.origin.url": ok("https://github.com/sungjin9288/design-ai.git\n"),
      "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: workspace restore backups\n"),
    }),
  });

  assert.equal(report.learningRestoreBackups.totalCount, 6);
  assert.equal(report.learningRestoreBackups.count, 5);
  assert.match(report.learningRestoreBackups.latestBackup.name, /20260522T000600000Z/);
  assert.equal(report.learningRestoreBackups.readiness.status, "warn");
  assert.equal(report.learningRestoreBackups.readiness.pruneCandidateCount, 1);
  const pruneAction = report.nextActions.find((item) => (item.command || "").includes("--restore-backups --file"));
  assert.equal(pruneAction?.level, "info");
  assert.match(pruneAction?.text || "", /Preview pruning older learning restore rollback backups/);
  assert.match(pruneAction?.command || "", /--prune --keep 5/);
}));

test("collectLearningRestoreBackupsReport handles provider errors and readiness states", () => withTempDir((dir) => {
  const learningFile = path.join(dir, "learning.json");

  assert.equal(collectLearningRestoreBackupsReport({
    learningFilePath: learningFile,
    learningRestoreBackupsProvider: () => ({ totalCount: 0, backups: [] }),
  }), null);
  assert.equal(assessLearningRestoreBackupReadiness({ totalCount: 1, keep: 5 }).status, "pass");
  assert.equal(assessLearningRestoreBackupReadiness({ totalCount: 6, keep: 5 }).status, "warn");

  const report = collectLearningRestoreBackupsReport({
    learningFilePath: learningFile,
    learningRestoreBackupsProvider: () => {
      throw new Error("cannot read backups");
    },
  });
  assert.equal(report.readiness.status, "fail");
  assert.match(report.error, /cannot read backups/);
}));

test("collectLearningUsageReport warns on stale selected entry ids", () => withTempDir((dir) => {
  const learningFile = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  const report = collectLearningUsageReport({
    learningFilePath: learningFile,
    learningUsagePath: usageFile,
    learningUsageStatsProvider: ({ filePath, usageFile }) => ({
      file: filePath,
      usageFile,
      exists: true,
      profileExists: true,
      profileFile: filePath,
      version: 1,
      updatedAt: "2026-05-22T00:00:03.000Z",
      eventCount: 1,
      profileEntryCount: 1,
      usedEntryCount: 0,
      unusedEntryCount: 1,
      staleSelectedEntryCount: 1,
      commandCounts: { pack: 1 },
      routeCounts: { "component-spec": 1 },
      categoryCounts: { accessibility: 1 },
      auditStatusCounts: { pass: 1 },
      latestEvent: null,
      recommendations: [],
      privacy: {
        storesRawBriefText: false,
        storesBriefHash: true,
        storesSelectedEntryIds: true,
      },
    }),
  });

  assert.equal(report.readiness.status, "warn");
  assert.match(report.readiness.reason, /stale-selected-entry-ids/);
}));

test("assessLearningUsageReadiness detects usage profile file mismatch", () => {
  const readiness = assessLearningUsageReadiness({
    learningFilePath: "/tmp/current-learning.json",
    usage: {
      exists: true,
      eventCount: 1,
      profileFile: "/tmp/other-learning.json",
      staleSelectedEntryCount: 0,
    },
  });

  assert.equal(readiness.status, "warn");
  assert.match(readiness.reason, /usage-profile-file-mismatch/);
});

test("collectWorkspaceReport auto-detects sibling learning eval checkpoint", () => withTempDir((dir) => {
  const repoRoot = path.join(dir, "repo");
  const sourceRoot = path.join(dir, "source");
  const learningFile = path.join(dir, "learning.json");
  const evalFile = defaultLearningEvalPath(learningFile);
  mkdirSync(sourceRoot, { recursive: true });
  writeSourceMetadata(sourceRoot, fullReleaseScripts());
  writeFileSync(
    learningFile,
    JSON.stringify({
      version: 1,
      updatedAt: "2026-05-22T00:00:02.000Z",
      entries: [
        {
          id: "learn-keyboard",
          category: "accessibility",
          text: "Prioritize keyboard accessibility details for Button component API specs",
          source: "test",
          createdAt: "2026-05-22T00:00:01.000Z",
        },
      ],
    }),
    "utf8",
  );
  writeFileSync(
    evalFile,
    JSON.stringify({
      version: 1,
      cases: [
        {
          id: "button-keyboard",
          brief: "Spec a Button component API with keyboard accessibility",
          expectedSelectedIds: ["learn-keyboard"],
          minMatchedCount: 1,
          requireNoFallback: true,
        },
      ],
    }),
    "utf8",
  );

  const report = collectWorkspaceReport({
    root: repoRoot,
    sourceRoot,
    learningFilePath: learningFile,
    gitRunner: fakeGit({
      "rev-parse --is-inside-work-tree": ok("true\n"),
      "rev-parse --show-toplevel": ok(`${repoRoot}\n`),
      "branch --show-current": ok("main\n"),
      "status --short": ok(""),
      "rev-parse --abbrev-ref --symbolic-full-name @{u}": ok("origin/main\n"),
      "rev-list --left-right --count @{u}...HEAD": ok("0\t0\n"),
      "config --get remote.origin.url": ok("https://github.com/sungjin9288/design-ai.git\n"),
      "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: workspace eval auto-discovery\n"),
    }),
  });

  assert.equal(report.learningEval.source, evalFile);
  assert.equal(report.learningEval.status, "pass");
  assert.equal(report.nextActions.some((item) => (item.command || "").includes("learn --eval-template")), false);
  assert.equal(report.nextActions.some((item) => item.text === "Learning eval checkpoints pass."), true);
}));

test("collectWorkspaceReport warns when learning eval checkpoint is stale", () => withTempDir((dir) => {
  const repoRoot = path.join(dir, "repo");
  const sourceRoot = path.join(dir, "source");
  const learningFile = path.join(dir, "learning.json");
  const evalFile = defaultLearningEvalPath(learningFile);
  mkdirSync(sourceRoot, { recursive: true });
  writeSourceMetadata(sourceRoot, fullReleaseScripts());
  writeFileSync(
    learningFile,
    JSON.stringify({
      version: 1,
      updatedAt: "2026-05-23T00:00:00.000Z",
      entries: [
        {
          id: "learn-keyboard",
          category: "accessibility",
          text: "Prioritize keyboard accessibility details for Button component API specs",
          source: "test",
          createdAt: "2026-05-22T00:00:01.000Z",
        },
      ],
    }),
    "utf8",
  );
  writeFileSync(
    evalFile,
    JSON.stringify({
      version: 1,
      generatedAt: "2026-05-22T00:00:02.000Z",
      sourceProfile: {
        file: learningFile,
        exists: true,
        entryCount: 1,
        auditStatus: "pass",
        category: "",
        query: "",
        limit: 6,
      },
      cases: [
        {
          id: "button-keyboard",
          brief: "Spec a Button component API with keyboard accessibility",
          expectedSelectedIds: ["learn-keyboard"],
          minMatchedCount: 1,
          requireNoFallback: true,
        },
      ],
    }),
    "utf8",
  );

  const report = collectWorkspaceReport({
    root: repoRoot,
    sourceRoot,
    learningFilePath: learningFile,
    gitRunner: fakeGit({
      "rev-parse --is-inside-work-tree": ok("true\n"),
      "rev-parse --show-toplevel": ok(`${repoRoot}\n`),
      "branch --show-current": ok("main\n"),
      "status --short": ok(""),
      "rev-parse --abbrev-ref --symbolic-full-name @{u}": ok("origin/main\n"),
      "rev-list --left-right --count @{u}...HEAD": ok("0\t0\n"),
      "config --get remote.origin.url": ok("https://github.com/sungjin9288/design-ai.git\n"),
      "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: workspace eval freshness\n"),
    }),
  });

  assert.equal(report.learningEval.status, "pass");
  assert.equal(report.learningEval.generatedAt, "2026-05-22T00:00:02.000Z");
  assert.equal(report.learningEval.freshness.status, "warn");
  assert.equal(report.learningEval.freshness.stale, true);
  assert.match(report.learningEval.freshness.reason, /profile-updated-after-checkpoint/);
  assert.equal(report.nextActions.some((item) => item.level === "warn" && /Regenerate/.test(item.text)), true);
  assert.equal(hasWorkspaceStrictIssues(report), true);
}));

test("assessLearningEvalFreshness detects source profile drift", () => {
  const freshness = assessLearningEvalFreshness({
    learning: {
      file: "/tmp/current-learning.json",
      updatedAt: "2026-05-22T00:00:02.000Z",
      count: 2,
    },
    learningEval: {
      generatedAt: "2026-05-22T00:00:03.000Z",
      sourceProfile: {
        file: "/tmp/old-learning.json",
        entryCount: 1,
      },
    },
  });

  assert.equal(freshness.status, "warn");
  assert.match(freshness.reason, /source-profile-file-mismatch/);
  assert.match(freshness.reason, /source-profile-entry-count-changed/);
});

test("collectRetrievalIndexReport treats a missing index as unused and stale digests as a warning", () => {
  const unused = collectRetrievalIndexReport({
    sourceRoot: "/tmp/design-ai-nonexistent-source",
    learningFilePath: "/tmp/design-ai-nonexistent-learning.json",
  });
  assert.equal(unused, null);

  const previousIndexDir = process.env.DESIGN_AI_INDEX_DIR;
  const indexDir = mkdtempSync(path.join(tmpdir(), "design-ai-ws-retrieval-test-"));
  process.env.DESIGN_AI_INDEX_DIR = indexDir;
  try {
    writeFileSync(path.join(indexDir, "corpus-index.json"), "{}", "utf8");
    const staleStatus = {
      indexDir,
      corpus: { present: true, fresh: false },
      learning: { present: false, fresh: false },
      fresh: false,
      buildCommand: "design-ai index --build",
    };
    const stale = collectRetrievalIndexReport({
      sourceRoot: "/tmp/design-ai-source",
      learningFilePath: "/tmp/learning.json",
      retrievalIndexStatusProvider: () => staleStatus,
    });
    assert.equal(stale.status, "warn");
    assert.equal(stale.fresh, false);
    assert.equal(stale.buildCommand, "design-ai index --build");

    const fresh = collectRetrievalIndexReport({
      sourceRoot: "/tmp/design-ai-source",
      learningFilePath: "/tmp/learning.json",
      retrievalIndexStatusProvider: () => ({ ...staleStatus, fresh: true }),
    });
    assert.equal(fresh.status, "pass");
  } finally {
    if (previousIndexDir === undefined) delete process.env.DESIGN_AI_INDEX_DIR;
    else process.env.DESIGN_AI_INDEX_DIR = previousIndexDir;
    rmSync(indexDir, { recursive: true, force: true });
  }
});

test("buildWorkspaceNextActions warns with an index rebuild command only when the index is stale", () => {
  const base = {
    git: { isRepo: true, clean: true, hasIgnoredLocalArtifacts: false, upstream: "origin/main", branch: "main", behind: 0, ahead: 0 },
    repository: { checks: [] },
    learning: { exists: false, entryCount: 0, error: "", auditSummary: { status: "pass" } },
    learningUsage: null,
    learningEval: null,
    learningRestoreBackups: null,
    release: { missing: [], available: [] },
  };
  const stale = buildWorkspaceNextActions({
    ...base,
    retrievalIndex: { fresh: false, status: "warn", buildCommand: "design-ai index --build" },
  });
  const staleAction = stale.find((item) => item.command === "design-ai index --build");
  assert.ok(staleAction);
  assert.equal(staleAction.level, "warn");

  const freshActions = buildWorkspaceNextActions({
    ...base,
    retrievalIndex: { fresh: true, status: "pass", buildCommand: "design-ai index --build" },
  });
  assert.equal(freshActions.some((item) => item.command === "design-ai index --build"), false);

  const unusedActions = buildWorkspaceNextActions({ ...base, retrievalIndex: null });
  assert.equal(unusedActions.some((item) => item.command === "design-ai index --build"), false);
});
