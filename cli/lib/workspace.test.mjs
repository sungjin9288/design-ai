// Tests for cli/lib/workspace.mjs local dogfood diagnostics.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runWorkspace } from "../commands/workspace.mjs";
import {
  collectGitReport,
  collectWorkspaceReport,
  formatWorkspaceJson,
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
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function captureStdout(fn) {
  const lines = [];
  const originalLog = console.log;
  console.log = (...args) => {
    lines.push(args.join(" "));
  };
  try {
    await fn();
  } finally {
    console.log = originalLog;
  }
  return lines.join("\n");
}

test("parseWorkspaceArgs supports root, learning-file, json, and help", () => {
  assert.deepEqual(parseWorkspaceArgs(["--root", "repo", "--learning-file", "learning.json", "--json"]), {
    help: false,
    json: true,
    root: "repo",
    learningFilePath: "learning.json",
  });
  assert.equal(parseWorkspaceArgs(["--help"]).help, true);
  assert.throws(() => parseWorkspaceArgs(["--root"]), /--root expects a path/);
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
  writeFileSync(
    path.join(sourceRoot, "package.json"),
    JSON.stringify({
      name: "@design-ai/cli",
      version: "4.13.0",
      scripts: {
        test: "node --test cli/lib/*.test.mjs",
        "audit:strict": "python3 -B tools/audit/run-all.py --strict",
        "package:smoke": "python3 -B tools/audit/package-smoke.py --pack",
      },
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
  assert.equal(report.learning.count, 2);
  assert.equal(report.learning.auditSummary.status, "warn");
  assert.deepEqual(report.release.available, ["test", "audit:strict", "package:smoke"]);
  assert.match(report.nextActions.map((item) => item.text).join("\n"), /Review local changes/);
  assert.match(report.nextActions.map((item) => item.command || "").join("\n"), /design-ai learn --audit/);
}));

test("formatWorkspaceJson emits a stable machine-readable object", () => {
  const formatted = formatWorkspaceJson({
    context: { root: "/repo" },
    git: { isRepo: false },
    learning: { count: 0 },
    release: { available: [] },
    nextActions: [],
  });
  const payload = JSON.parse(formatted);

  assert.deepEqual(Object.keys(payload), ["context", "git", "learning", "release", "nextActions"]);
  assert.equal(payload.context.root, "/repo");
});

test("runWorkspace supports JSON output with injected collectors", async () => withTempDir(async (dir) => {
  const sourceRoot = path.join(dir, "source");
  const learningFile = path.join(dir, "learning.json");
  mkdirSync(sourceRoot, { recursive: true });
  writeFileSync(
    path.join(sourceRoot, "package.json"),
    JSON.stringify({ name: "@design-ai/cli", version: "4.13.0", scripts: { test: "node --test" } }),
    "utf8",
  );

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
  assert.equal(payload.learning.file, learningFile);
  assert.equal(payload.release.available.includes("test"), true);
  assert.equal(payload.nextActions.some((item) => item.command === "npm test"), true);
}));
