// Tests for workspace repository report, JSON format, and runWorkspace CLI flows.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runWorkspace } from "../commands/workspace.mjs";
import { collectRepositoryReport, formatWorkspaceJson, normalizeRepositoryUrl } from "./workspace.mjs";
import { captureConsole, captureStdout, fakeGit, fullReleaseScripts, ok, withTempDir, writeSourceMetadata } from "./workspace-test-support.mjs";

test("collectRepositoryReport normalizes remote forms and reports metadata drift", () => withTempDir((dir) => {
  const sourceRoot = path.join(dir, "source");
  mkdirSync(path.join(sourceRoot, ".claude-plugin"), { recursive: true });
  writeFileSync(
    path.join(sourceRoot, "package.json"),
    JSON.stringify({
      name: "@design-ai/cli",
      version: "4.13.0",
      repository: { type: "git", url: "git+https://github.com/stale/design-ai.git" },
      homepage: "https://github.com/stale/design-ai#readme",
      bugs: { url: "https://github.com/sungjin9288/design-ai/issues" },
    }),
    "utf8",
  );
  writeFileSync(
    path.join(sourceRoot, ".claude-plugin", "plugin.json"),
    JSON.stringify({
      version: "4.13.0",
      homepage: "https://github.com/sungjin9288/design-ai",
      repository: "https://github.com/stale/design-ai",
    }),
    "utf8",
  );

  assert.equal(
    normalizeRepositoryUrl("git@github.com:sungjin9288/design-ai.git"),
    "https://github.com/sungjin9288/design-ai",
  );

  const report = collectRepositoryReport({
    sourceRoot,
    git: {
      isRepo: true,
      remote: "git@github.com:other/design-ai.git",
    },
  });

  assert.equal(report.metadataAligned, false);
  assert.equal(report.remoteSlug, "other/design-ai");
  assert.equal(report.remoteAligned, false);
  assert.match(report.issues.join("\n"), /package\.repository\.url mismatch/);
  assert.match(report.issues.join("\n"), /plugin\.repository mismatch/);
  assert.match(report.issues.join("\n"), /git remote origin points to other\/design-ai/);
}));

test("formatWorkspaceJson emits a stable machine-readable object", () => {
  const formatted = formatWorkspaceJson({
    context: { root: "/repo" },
    git: { isRepo: false },
    repository: { slug: "sungjin9288/design-ai" },
    learning: { count: 0 },
    release: { available: [] },
    nextActions: [],
  });
  const payload = JSON.parse(formatted);

  assert.deepEqual(Object.keys(payload), ["context", "git", "repository", "learning", "learningUsage", "learningEval", "learningRestoreBackups", "release", "nextActions"]);
  assert.equal(payload.context.root, "/repo");
  assert.equal(payload.learningRestoreBackups, null);
});

test("runWorkspace supports JSON output with injected collectors", async () => withTempDir(async (dir) => {
  const sourceRoot = path.join(dir, "source");
  const learningFile = path.join(dir, "learning.json");
  mkdirSync(sourceRoot, { recursive: true });
  writeSourceMetadata(sourceRoot, { test: "node --test" });

  const output = await captureStdout(() => runWorkspace(
    ["--root", dir, "--learning-file", learningFile, "--json"],
    {
      sourceRoot,
      gitRunner: fakeGit({
        "rev-parse --is-inside-work-tree": ok("true\n"),
        "rev-parse --show-toplevel": ok(`${dir}\n`),
        "branch --show-current": ok("codex/workspace-dogfood\n"),
        "status --short": ok(""),
        "rev-parse --abbrev-ref --symbolic-full-name @{u}": ok("origin/codex/workspace-dogfood\n"),
        "rev-list --left-right --count @{u}...HEAD": ok("0\t0\n"),
        "config --get remote.origin.url": ok("https://github.com/sungjin9288/design-ai.git\n"),
        "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: dogfood workspace\n"),
      }),
      learningStatsProvider: ({ filePath }) => ({
        file: filePath,
        exists: false,
        count: 0,
        categoryCounts: {},
        sourceCounts: {},
        latestEntry: null,
        auditSummary: { status: "pass", failures: 0, warnings: 0 },
      }),
    },
  ));
  const payload = JSON.parse(output);

  assert.equal(payload.context.root, dir);
  assert.equal(payload.git.clean, true);
  assert.equal(payload.repository.metadataAligned, true);
  assert.equal(payload.repository.remoteAligned, true);
  assert.equal(payload.learning.file, learningFile);
  assert.equal(payload.learningUsage, null);
  assert.equal(payload.release.available.includes("test"), true);
  assert.equal(payload.nextActions.some((item) => item.command === "npm test"), true);
}));

test("runWorkspace prints learning eval section and strict fails eval warnings", async () => withTempDir(async (dir) => {
  const sourceRoot = path.join(dir, "source");
  const learningFile = path.join(dir, "learning.json");
  const evalFile = path.join(dir, "learning-eval.json");
  mkdirSync(sourceRoot, { recursive: true });
  writeSourceMetadata(sourceRoot, fullReleaseScripts());
  writeFileSync(evalFile, JSON.stringify({ version: 1, cases: [{ id: "case-1", brief: "Button accessibility" }] }), "utf8");

  const cleanGitRunner = fakeGit({
    "rev-parse --is-inside-work-tree": ok("true\n"),
    "rev-parse --show-toplevel": ok(`${dir}\n`),
    "branch --show-current": ok("main\n"),
    "status --short": ok(""),
    "rev-parse --abbrev-ref --symbolic-full-name @{u}": ok("origin/main\n"),
    "rev-list --left-right --count @{u}...HEAD": ok("0\t0\n"),
    "config --get remote.origin.url": ok("https://github.com/sungjin9288/design-ai.git\n"),
    "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: workspace learning eval\n"),
  });
  const learningStatsProvider = ({ filePath }) => ({
    file: filePath,
    exists: true,
    count: 1,
    categoryCounts: { accessibility: 1 },
    sourceCounts: { test: 1 },
    latestEntry: null,
    auditSummary: { status: "pass", failures: 0, warnings: 0 },
  });
  const learningEvalReportProvider = ({ filePath, source }) => ({
    file: filePath,
    source,
    status: "warn",
    caseCount: 1,
    passed: 0,
    warned: 1,
    failed: 0,
    profileExists: true,
    profileEntryCount: 1,
    auditSummary: { status: "pass", failures: 0, warnings: 0 },
    privacy: {
      storesRawBriefText: false,
      storesBriefHash: true,
      exposesMatchedTokens: false,
    },
  });

  const humanRun = await captureConsole(() => runWorkspace(
    ["--root", dir, "--learning-file", learningFile, "--learning-eval", evalFile],
    {
      sourceRoot,
      gitRunner: cleanGitRunner,
      learningStatsProvider,
      learningEvalReportProvider,
    },
  ));
  assert.match(humanRun.stdout, /Learning eval:/);
  assert.match(humanRun.stdout, /Status: warn \| cases 1/);

  const strictRun = await captureConsole(() => runWorkspace(
    ["--root", dir, "--learning-file", learningFile, "--learning-eval", evalFile, "--strict", "--json"],
    {
      sourceRoot,
      gitRunner: cleanGitRunner,
      learningStatsProvider,
      learningEvalReportProvider,
    },
  ));
  const payload = JSON.parse(strictRun.stdout);
  assert.equal(strictRun.exitCode, 1);
  assert.equal(payload.learningEval.status, "warn", JSON.stringify(payload.learningEval));
  assert.equal(payload.nextActions.some((item) => (item.command || "").includes("design-ai learn --eval")), true);
}));

test("runWorkspace prints learning usage section and strict fails usage warnings", async () => withTempDir(async (dir) => {
  const sourceRoot = path.join(dir, "source");
  const learningFile = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  mkdirSync(sourceRoot, { recursive: true });
  writeSourceMetadata(sourceRoot, fullReleaseScripts());

  const cleanGitRunner = fakeGit({
    "rev-parse --is-inside-work-tree": ok("true\n"),
    "rev-parse --show-toplevel": ok(`${dir}\n`),
    "branch --show-current": ok("main\n"),
    "status --short": ok(""),
    "rev-parse --abbrev-ref --symbolic-full-name @{u}": ok("origin/main\n"),
    "rev-list --left-right --count @{u}...HEAD": ok("0\t0\n"),
    "config --get remote.origin.url": ok("https://github.com/sungjin9288/design-ai.git\n"),
    "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: workspace learning usage\n"),
  });
  const learningStatsProvider = ({ filePath }) => ({
    file: filePath,
    exists: true,
    count: 1,
    categoryCounts: { accessibility: 1 },
    sourceCounts: { test: 1 },
    latestEntry: null,
    auditSummary: { status: "pass", failures: 0, warnings: 0 },
  });
  const learningUsageStatsProvider = ({ filePath, usageFile }) => ({
    file: filePath,
    usageFile,
    exists: true,
    profileExists: true,
    profileFile: path.join(dir, "old-learning.json"),
    version: 1,
    updatedAt: "2026-05-22T00:00:03.000Z",
    eventCount: 1,
    profileEntryCount: 1,
    usedEntryCount: 0,
    unusedEntryCount: 1,
    staleSelectedEntryCount: 1,
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
      selectedEntryIds: ["learn-stale"],
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
  });

  const humanRun = await captureConsole(() => runWorkspace(
    ["--root", dir, "--learning-file", learningFile, "--learning-usage", usageFile],
    {
      sourceRoot,
      gitRunner: cleanGitRunner,
      learningStatsProvider,
      learningUsageStatsProvider,
    },
  ));
  assert.match(humanRun.stdout, /Learning usage:/);
  assert.match(humanRun.stdout, /Events: 1 \| used 0\/1 \| stale 1/);
  assert.match(humanRun.stdout, /Readiness: warn/);

  const strictRun = await captureConsole(() => runWorkspace(
    ["--root", dir, "--learning-file", learningFile, "--learning-usage", usageFile, "--strict", "--json"],
    {
      sourceRoot,
      gitRunner: cleanGitRunner,
      learningStatsProvider,
      learningUsageStatsProvider,
    },
  ));
  const payload = JSON.parse(strictRun.stdout);
  assert.equal(strictRun.exitCode, 1);
  assert.equal(payload.learningUsage.readiness.status, "warn");
  const curationAction = payload.nextActions.find((item) => (item.command || "").includes("design-ai learn --curate"));
  assert.equal(curationAction?.level, "warn");
  assert.match(curationAction?.text || "", /usage-aware learning curation/);
  assert.match(curationAction?.command || "", /--usage-file/);
  const reportAction = payload.nextActions.find((item) => (item.command || "").includes("--report --out"));
  assert.equal(reportAction?.level, "info");
  assert.match(reportAction?.text || "", /Markdown usage-aware learning curation report/);
  assert.match(reportAction?.command || "", /--usage-file/);
  assert.match(reportAction?.command || "", /learning-curation-report\.md/);
}));

test("runWorkspace strict fails readiness warnings and passes info-only readiness", async () => withTempDir(async (dir) => {
  const sourceRoot = path.join(dir, "source");
  const learningFile = path.join(dir, "learning.json");
  mkdirSync(sourceRoot, { recursive: true });
  writeSourceMetadata(sourceRoot, fullReleaseScripts());

  const cleanGitRunner = fakeGit({
    "rev-parse --is-inside-work-tree": ok("true\n"),
    "rev-parse --show-toplevel": ok(`${dir}\n`),
    "branch --show-current": ok("main\n"),
    "status --short": ok(""),
    "rev-parse --abbrev-ref --symbolic-full-name @{u}": ok("origin/main\n"),
    "rev-list --left-right --count @{u}...HEAD": ok("0\t0\n"),
    "config --get remote.origin.url": ok("https://github.com/sungjin9288/design-ai.git\n"),
    "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: workspace strict\n"),
  });
  const learningStatsProvider = ({ filePath }) => ({
    file: filePath,
    exists: false,
    count: 0,
    categoryCounts: {},
    sourceCounts: {},
    latestEntry: null,
    auditSummary: { status: "pass", failures: 0, warnings: 0 },
  });

  const cleanRun = await captureConsole(() => runWorkspace(
    ["--root", dir, "--learning-file", learningFile, "--strict", "--json"],
    {
      sourceRoot,
      gitRunner: cleanGitRunner,
      learningStatsProvider,
    },
  ));
  assert.equal(cleanRun.exitCode, undefined);

  const dirtyRun = await captureConsole(() => runWorkspace(
    ["--root", dir, "--learning-file", learningFile, "--strict", "--json"],
    {
      sourceRoot,
      gitRunner: fakeGit({
        "rev-parse --is-inside-work-tree": ok("true\n"),
        "rev-parse --show-toplevel": ok(`${dir}\n`),
        "branch --show-current": ok("main\n"),
        "status --short": ok(" M README.md\n"),
        "rev-parse --abbrev-ref --symbolic-full-name @{u}": ok("origin/main\n"),
        "rev-list --left-right --count @{u}...HEAD": ok("0\t0\n"),
        "config --get remote.origin.url": ok("https://github.com/sungjin9288/design-ai.git\n"),
        "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: workspace strict\n"),
      }),
      learningStatsProvider,
    },
  ));
  assert.equal(dirtyRun.exitCode, 1);
  assert.equal(JSON.parse(dirtyRun.stdout).nextActions.some((item) => item.level === "warn"), true);
}));
