// Tests for workspace args, git report, and combined readiness report.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  collectGitReport,
  collectWorkspaceReport,
  defaultLearningEvalPath,
  hasWorkspaceStrictIssues,
  parseWorkspaceArgs,
  quoteShellArg,
} from "./workspace.mjs";
import { fail, fakeGit, fullReleaseScripts, ok, withTempDir, writeSourceMetadata } from "./workspace-test-support.mjs";

test("parseWorkspaceArgs supports root, learning-file, learning-usage, learning-eval, strict, json, and help", () => {
  assert.deepEqual(parseWorkspaceArgs(["--root", "repo", "--learning-file", "learning.json", "--learning-usage", "usage.json", "--learning-eval", "eval.json", "--strict", "--json"]), {
    help: false,
    json: true,
    strict: true,
    root: "repo",
    learningFilePath: "learning.json",
    learningUsagePath: "usage.json",
    learningEvalPath: "eval.json",
  });
  assert.equal(parseWorkspaceArgs(["--help"]).help, true);
  assert.throws(() => parseWorkspaceArgs(["--root"]), /--root expects a path/);
  assert.throws(() => parseWorkspaceArgs(["--learning-usage"]), /--learning-usage expects a path/);
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

test("collectGitReport separates untracked local portfolio artifacts from active git status", () => withTempDir((dir) => {
  const report = collectGitReport({
    root: dir,
    gitRunner: fakeGit({
      "rev-parse --is-inside-work-tree": ok("true\n"),
      "rev-parse --show-toplevel": ok(`${dir}\n`),
      "branch --show-current": ok("main\n"),
      "status --short": ok([
        "?? DEV_LOG.md",
        "?? _portfolio_export/",
        "?? docs/case-study.md",
        "?? docs/project-card.md",
        "?? evidence/",
        "?? links.md",
        "?? portfolio_manifest.md",
      ].join("\n")),
      "rev-parse --abbrev-ref --symbolic-full-name @{u}": ok("origin/main\n"),
      "rev-list --left-right --count @{u}...HEAD": ok("0\t0\n"),
      "config --get remote.origin.url": ok("https://github.com/sungjin9288/design-ai.git\n"),
      "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: workspace ignored artifacts\n"),
    }),
  });

  assert.equal(report.clean, true);
  assert.deepEqual(report.statusShort, []);
  assert.equal(report.allStatusShort.length, 7);
  assert.deepEqual(report.ignoredStatusShort, report.allStatusShort);
  assert.equal(report.ignoredLocalArtifactCount, 7);
  assert.equal(report.hasIgnoredLocalArtifacts, true);
}));

test("collectGitReport keeps tracked changes and unknown untracked files active", () => withTempDir((dir) => {
  const report = collectGitReport({
    root: dir,
    gitRunner: fakeGit({
      "rev-parse --is-inside-work-tree": ok("true\n"),
      "rev-parse --show-toplevel": ok(`${dir}\n`),
      "branch --show-current": ok("main\n"),
      "status --short": ok(" M README.md\n?? evidence/\n?? notes.md\n"),
      "rev-parse --abbrev-ref --symbolic-full-name @{u}": ok("origin/main\n"),
      "rev-list --left-right --count @{u}...HEAD": ok("0\t0\n"),
      "config --get remote.origin.url": ok("https://github.com/sungjin9288/design-ai.git\n"),
      "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: workspace active changes\n"),
    }),
  });

  assert.equal(report.clean, false);
  assert.deepEqual(report.statusShort, [" M README.md", "?? notes.md"]);
  assert.deepEqual(report.ignoredStatusShort, ["?? evidence/"]);
  assert.equal(report.ignoredLocalArtifactCount, 1);
  assert.equal(report.hasIgnoredLocalArtifacts, true);
}));

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
  assert.match(report.nextActions.map((item) => item.text).join("\n"), /Preview archive-first learning curation/);
  assert.match(report.nextActions.map((item) => item.command || "").join("\n"), /design-ai learn --curate --file/);
  assert.match(report.nextActions.map((item) => item.text).join("\n"), /Markdown learning curation report/);
  assert.match(report.nextActions.map((item) => item.command || "").join("\n"), /--report --out/);
}));

test("collectWorkspaceReport does not strict-block on ignored local portfolio artifacts only", () => withTempDir((dir) => {
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
      "status --short": ok("?? DEV_LOG.md\n?? _portfolio_export/\n?? docs/project-card.md\n?? evidence/\n"),
      "rev-parse --abbrev-ref --symbolic-full-name @{u}": ok("origin/main\n"),
      "rev-list --left-right --count @{u}...HEAD": ok("0\t0\n"),
      "config --get remote.origin.url": ok("https://github.com/sungjin9288/design-ai.git\n"),
      "log -1 --pretty=%h%x09%s": ok("abc123\tfeat: workspace ignored artifacts\n"),
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
  });

  assert.equal(report.git.clean, true);
  assert.equal(report.git.ignoredLocalArtifactCount, 4);
  assert.equal(report.nextActions.some((item) => item.level === "warn" && /Review local changes/.test(item.text)), false);
  assert.equal(report.nextActions.some((item) => item.level === "info" && /Ignored local portfolio\/evidence artifacts/.test(item.text)), true);
  assert.equal(hasWorkspaceStrictIssues(report), false);
}));

test("hasWorkspaceStrictIssues treats warn and fail next actions as strict failures", () => {
  assert.equal(hasWorkspaceStrictIssues({ nextActions: [{ level: "pass" }, { level: "info" }] }), false);
  assert.equal(hasWorkspaceStrictIssues({ nextActions: [{ level: "warn" }] }), true);
  assert.equal(hasWorkspaceStrictIssues({ nextActions: [{ level: "fail" }] }), true);
});

test("quoteShellArg preserves safe args and quotes unsafe shell args", () => {
  assert.equal(quoteShellArg("learning.json"), "learning.json");
  assert.equal(quoteShellArg("/tmp/design-ai/learning.json"), "/tmp/design-ai/learning.json");
  assert.equal(quoteShellArg(""), "''");
  assert.equal(
    quoteShellArg("/tmp/design ai/owner's learning.json"),
    "'/tmp/design ai/owner'\\''s learning.json'",
  );
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
    `design-ai learn --eval-template --file ${learningFile} --out ${defaultLearningEvalPath(learningFile)}`,
  );
  const usageAction = report.nextActions.find((item) => (item.command || "").includes("--with-learning"));
  assert.equal(usageAction?.level, "info");
  assert.match(usageAction?.text || "", /learning usage sidecar/);
}));
