// Tests for cli/lib/workspace.mjs local dogfood diagnostics.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runWorkspace } from "../commands/workspace.mjs";
import {
  collectGitReport,
  collectRepositoryReport,
  collectWorkspaceReport,
  formatWorkspaceJson,
  hasWorkspaceStrictIssues,
  normalizeRepositoryUrl,
  parseWorkspaceArgs,
} from "./workspace.mjs";

function ok(stdout = "") {
  return { ok: true, status: 0, stdout, stderr: "", error: "" };
}

function fail(stderr = "") {
  return { ok: false, status: 1, stdout: "", stderr, error: "" };
}

function fakeGit(responses) {
  return (args) => responses[args.join(" ")] || fail("unexpected git command");
}

function withTempDir(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-workspace-"));
  const cleanup = () => rmSync(dir, { recursive: true, force: true });
  try {
    const result = fn(dir);
    if (result && typeof result.then === "function") {
      return result.finally(cleanup);
    }
    cleanup();
    return result;
  } catch (error) {
    cleanup();
    throw error;
  }
}

function writeSourceMetadata(sourceRoot, scripts = {}) {
  mkdirSync(path.join(sourceRoot, ".claude-plugin"), { recursive: true });
  writeFileSync(
    path.join(sourceRoot, "package.json"),
    JSON.stringify({
      name: "@design-ai/cli",
      version: "4.13.0",
      repository: { type: "git", url: "git+https://github.com/sungjin9288/design-ai.git" },
      homepage: "https://github.com/sungjin9288/design-ai#readme",
      bugs: { url: "https://github.com/sungjin9288/design-ai/issues" },
      scripts,
    }),
    "utf8",
  );
  writeFileSync(
    path.join(sourceRoot, ".claude-plugin", "plugin.json"),
    JSON.stringify({
      version: "4.13.0",
      homepage: "https://github.com/sungjin9288/design-ai",
      repository: "https://github.com/sungjin9288/design-ai",
    }),
    "utf8",
  );
}

function fullReleaseScripts() {
  return {
    test: "node --test cli/lib/*.test.mjs",
    "audit:strict": "python3 -B tools/audit/run-all.py --strict",
    "release:metadata": "python3 -B tools/audit/release-metadata.py",
    "release:self-test": "npm run smoke:assertions:self-test",
    "package:smoke": "python3 -B tools/audit/package-smoke.py --pack",
    "release:check": "npm test && npm run audit:strict",
    "ci:local": "python3 -B tools/audit/local-ci.py",
  };
}

async function captureConsole(fn) {
  const lines = [];
  const originalLog = console.log;
  const originalExitCode = process.exitCode;
  console.log = (...args) => {
    lines.push(args.join(" "));
  };
  process.exitCode = undefined;
  try {
    await fn();
    return {
      stdout: lines.join("\n"),
      exitCode: process.exitCode,
    };
  } finally {
    console.log = originalLog;
    process.exitCode = originalExitCode;
  }
}

async function captureStdout(fn) {
  const { stdout } = await captureConsole(fn);
  return stdout;
}

test("parseWorkspaceArgs supports root, learning-file, learning-eval, strict, json, and help", () => {
  assert.deepEqual(parseWorkspaceArgs(["--root", "repo", "--learning-file", "learning.json", "--learning-eval", "eval.json", "--strict", "--json"]), {
    help: false,
    json: true,
    strict: true,
    root: "repo",
    learningFilePath: "learning.json",
    learningEvalPath: "eval.json",
  });
  assert.equal(parseWorkspaceArgs(["--help"]).help, true);
  assert.throws(() => parseWorkspaceArgs(["--root"]), /--root expects a path/);
  assert.throws(() => parseWorkspaceArgs(["--learning-eval"]), /--learning-eval expects a path/);
  assert.throws(() => parseWorkspaceArgs(["--bad"]), /Unknown workspace option: --bad/);
});

test("collectGitReport reports a non-git workspace without throwing", () => {
  const report = collectGitReport({
    root: "/tmp/not-a-repo",
    gitRunner: fakeGit({
      "rev-parse --is-inside-work-tree": fail("fatal: not a git repository"),
    }),
  });

  assert.equal(report.isRepo, false);
  assert.equal(report.clean, true);
  assert.match(report.reason, /not a git repository/);
});

test("collectWorkspaceReport combines git, learning, and release readiness", () => withTempDir((dir) => {
  const repoRoot = path.join(dir, "repo");
  const sourceRoot = path.join(dir, "source");
  const learningFile = path.join(dir, "learning.json");
  mkdirSync(sourceRoot, { recursive: true });
  writeSourceMetadata(sourceRoot, {
    test: "node --test cli/lib/*.test.mjs",
    "audit:strict": "python3 -B tools/audit/run-all.py --strict",
    "package:smoke": "python3 -B tools/audit/package-smoke.py --pack",
  });

  const report = collectWorkspaceReport({
    root: repoRoot,
    sourceRoot,
    learningFilePath: learningFile,
    gitRunner: fakeGit({
      "rev-parse --is-inside-work-tree": ok("true\n"),
      "rev-parse --show-toplevel": ok(`${repoRoot}\n`),
      "branch --show-current": ok("codex/workspace-dogfood\n"),
      "status --short": ok(" M README.md\n?? notes.md\n"),
      "rev-parse --abbrev-ref --symbolic-full-name @{u}": ok("origin/codex/workspace-dogfood\n"),
      "rev-list --left-right --count @{u}...HEAD": ok("2\t3\n"),
      "config --get remote.origin.url": ok("https://github.com/sungjin9288/design-ai.git\n"),
      "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: dogfood workspace\n"),
    }),
    learningStatsProvider: ({ filePath }) => ({
      file: filePath,
      exists: true,
      count: 2,
      categoryCounts: { workflow: 1, korean: 1 },
      sourceCounts: { cli: 2 },
      latestEntry: {
        id: "learn_1",
        category: "workflow",
        source: "check:artifact",
        createdAt: "2026-05-27T00:00:00.000Z",
        textPreview: "Improve future outputs",
      },
      auditSummary: { status: "warn", failures: 0, warnings: 1 },
    }),
  });

  assert.equal(report.context.root, repoRoot);
  assert.equal(report.context.packageName, "@design-ai/cli");
  assert.equal(report.git.branch, "codex/workspace-dogfood");
  assert.equal(report.git.clean, false);
  assert.equal(report.git.ahead, 3);
  assert.equal(report.git.behind, 2);
  assert.equal(report.repository.slug, "sungjin9288/design-ai");
  assert.equal(report.repository.metadataAligned, true);
  assert.equal(report.repository.remoteAligned, true);
  assert.equal(report.learning.count, 2);
  assert.equal(report.learning.auditSummary.status, "warn");
  assert.deepEqual(report.release.available, ["test", "audit:strict", "package:smoke"]);
  assert.match(report.nextActions.map((item) => item.text).join("\n"), /Review local changes/);
  assert.match(report.nextActions.map((item) => item.command || "").join("\n"), /design-ai learn --audit/);
}));

test("hasWorkspaceStrictIssues treats warn and fail next actions as strict failures", () => {
  assert.equal(hasWorkspaceStrictIssues({ nextActions: [{ level: "pass" }, { level: "info" }] }), false);
  assert.equal(hasWorkspaceStrictIssues({ nextActions: [{ level: "warn" }] }), true);
  assert.equal(hasWorkspaceStrictIssues({ nextActions: [{ level: "fail" }] }), true);
});

test("collectWorkspaceReport includes optional local learning eval readiness", () => withTempDir((dir) => {
  const repoRoot = path.join(dir, "repo");
  const sourceRoot = path.join(dir, "source");
  const learningFile = path.join(dir, "learning.json");
  const evalFile = path.join(dir, "learning-eval.json");
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
    learningEvalPath: evalFile,
    gitRunner: fakeGit({
      "rev-parse --is-inside-work-tree": ok("true\n"),
      "rev-parse --show-toplevel": ok(`${repoRoot}\n`),
      "branch --show-current": ok("main\n"),
      "status --short": ok(""),
      "rev-parse --abbrev-ref --symbolic-full-name @{u}": ok("origin/main\n"),
      "rev-list --left-right --count @{u}...HEAD": ok("0\t0\n"),
      "config --get remote.origin.url": ok("https://github.com/sungjin9288/design-ai.git\n"),
      "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: workspace learning eval\n"),
    }),
  });

  assert.equal(report.learningEval.source, evalFile);
  assert.equal(report.learningEval.status, "pass");
  assert.equal(report.learningEval.caseCount, 1);
  assert.equal(report.learningEval.privacy.storesRawBriefText, false);
  assert.equal(report.nextActions.some((item) => item.text === "Learning eval checkpoints pass."), true);
  assert.equal(report.nextActions.some((item) => (item.command || "").includes("learn --eval-template")), false);
}));

test("collectWorkspaceReport suggests learning eval-template when profile has entries but no checkpoint", () => withTempDir((dir) => {
  const repoRoot = path.join(dir, "repo");
  const sourceRoot = path.join(dir, "source");
  const learningFile = path.join(dir, "learning.json");
  mkdirSync(sourceRoot, { recursive: true });
  writeSourceMetadata(sourceRoot, fullReleaseScripts());

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
      "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: workspace eval-template hint\n"),
    }),
    learningStatsProvider: ({ filePath }) => ({
      file: filePath,
      exists: true,
      count: 1,
      categoryCounts: { accessibility: 1 },
      sourceCounts: { test: 1 },
      latestEntry: {
        id: "learn-keyboard",
        category: "accessibility",
        source: "test",
        createdAt: "2026-05-27T00:00:00.000Z",
        textPreview: "Prioritize keyboard accessibility",
      },
      auditSummary: { status: "pass", failures: 0, warnings: 0 },
    }),
  });

  assert.equal(report.learningEval, null);
  const templateAction = report.nextActions.find((item) => (item.command || "").includes("learn --eval-template"));
  assert.equal(templateAction?.level, "info");
  assert.match(templateAction?.text || "", /Generate a local learning eval checkpoint/);
  assert.equal(
    templateAction?.command,
    `design-ai learn --eval-template --file ${learningFile} --out learning-eval.json`,
  );
}));

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

  assert.deepEqual(Object.keys(payload), ["context", "git", "repository", "learning", "learningEval", "release", "nextActions"]);
  assert.equal(payload.context.root, "/repo");
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
