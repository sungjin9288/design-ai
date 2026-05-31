// Tests for cli/lib/site.mjs Website Improvement Console workspace handling.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runSite } from "../commands/site.mjs";
import {
  analyzeSiteWorkspace,
  buildSiteHandoffReport,
  buildSitePromptBundle,
  buildSiteReport,
  createSampleSiteWorkspace,
  formatSiteJson,
  parseSiteArgs,
} from "./site.mjs";

async function captureConsole(fn) {
  const stdout = [];
  const originalLog = console.log;
  const originalExitCode = process.exitCode;
  console.log = (...args) => {
    stdout.push(args.join(" "));
  };
  process.exitCode = undefined;
  try {
    await fn();
    return {
      stdout: stdout.join("\n"),
      exitCode: process.exitCode,
    };
  } finally {
    console.log = originalLog;
    process.exitCode = originalExitCode;
  }
}

async function withTempDir(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-site-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("parseSiteArgs supports file, stdin, strict, json, report, prompts, and output", () => {
  assert.deepEqual(parseSiteArgs(["workspace.json", "--strict", "--json"]), {
    target: "workspace.json",
    stdin: false,
    json: true,
    strict: true,
    report: false,
    prompts: false,
    outPath: "",
    force: false,
    help: false,
  });

  assert.deepEqual(parseSiteArgs(["--stdin", "--report", "--out", "handoff.md", "--force"]), {
    target: "",
    stdin: true,
    json: false,
    strict: false,
    report: true,
    prompts: false,
    outPath: "handoff.md",
    force: true,
    help: false,
  });

  assert.equal(parseSiteArgs(["--help"]).help, true);
  assert.equal(parseSiteArgs(["workspace.json", "--prompts"]).prompts, true);
});

test("parseSiteArgs rejects invalid combinations and unknown options", () => {
  assert.throws(() => parseSiteArgs(["workspace.json", "--stdin"]), /either a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--report", "--prompts"]), /only one output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--report", "--json"]), /--json is only supported/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--out", "x.md"]), /--out requires/);
  assert.throws(() => parseSiteArgs(["workspace.json", "extra.json"]), /Unexpected argument/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--jsn"]), /Did you mean `--json`\?/);
});

test("analyzeSiteWorkspace summarizes a valid Website Improvement Console export", () => {
  const { workspace, summary } = analyzeSiteWorkspace(createSampleSiteWorkspace(), {
    filePath: "sample.json",
  });

  assert.equal(summary.valid, true);
  assert.equal(summary.status, "pass");
  assert.equal(summary.site.name, "Korean SaaS marketing site");
  assert.equal(summary.counts.pages, 4);
  assert.equal(summary.counts.auditFindings, 3);
  assert.equal(summary.counts.refactorTasks, 1);
  assert.deepEqual(summary.requiredMcp, ["github", "browser", "deploy"]);
  assert.equal(summary.auditStatusCounts["in-progress"], 2);
  assert.equal(summary.mcpStatusCounts.required, 3);
  assert.equal(summary.taskPriorityCounts.p1, 1);
  assert.equal(summary.issues[0].id, "workspace-ready");
  assert.equal(workspace.siteProfile.viewports.join(","), "desktop,tablet,mobile");
});

test("analyzeSiteWorkspace reports schema failures and readiness warnings", () => {
  const raw = createSampleSiteWorkspace();
  raw.version = 2;
  raw.siteProfile.name = "";
  raw.siteProfile.liveUrl = "";
  raw.siteProfile.repoUrl = "";
  raw.siteProfile.localPath = "";
  raw.auditChecklist.accessibility.status = "waiting";
  raw.mcpReadiness.browser = "connected";
  raw.refactorTasks[0].codexPrompt = "";
  raw.refactorTasks[0].verification = [];

  const { summary } = analyzeSiteWorkspace(raw, { filePath: "bad.json" });
  const messages = summary.issues.map((issue) => `${issue.level}:${issue.id}`);

  assert.equal(summary.valid, false);
  assert.equal(summary.status, "fail");
  assert.ok(messages.includes("fail:workspace-version"));
  assert.ok(messages.includes("fail:site-name"));
  assert.ok(messages.includes("fail:site-live-url"));
  assert.ok(messages.includes("warn:site-repo-location"));
  assert.ok(messages.includes("fail:audit-accessibility-status"));
  assert.ok(messages.includes("fail:mcp-browser-status"));
  assert.ok(messages.includes("warn:task-1-codex-prompt"));
  assert.ok(messages.includes("warn:task-1-verification"));
});

test("formatSiteJson preserves summary payload order and readable Korean text", () => {
  const { summary } = analyzeSiteWorkspace({
    ...createSampleSiteWorkspace(),
    siteProfile: {
      ...createSampleSiteWorkspace().siteProfile,
      name: "한국어 사이트",
    },
  }, { filePath: "ko.json" });
  const formatted = formatSiteJson(summary);
  const parsed = JSON.parse(formatted);

  assert.deepEqual(Object.keys(parsed), [
    "filePath",
    "valid",
    "status",
    "site",
    "counts",
    "auditStatusCounts",
    "mcpStatusCounts",
    "taskPriorityCounts",
    "requiredMcp",
    "topTasks",
    "issues",
  ]);
  assert.equal(parsed.site.name, "한국어 사이트");
  assert.ok(formatted.includes("한국어 사이트"));
  assert.ok(!formatted.includes("\\u"));
});

test("buildSiteHandoffReport and prompt bundle include operational boundaries", () => {
  const workspace = createSampleSiteWorkspace();
  const report = buildSiteHandoffReport(workspace);
  const prompts = buildSitePromptBundle(workspace);

  assert.match(report, /# Website improvement handoff: Korean SaaS marketing site/);
  assert.match(report, /## MCP Readiness/);
  assert.match(report, /Clarify homepage CTA hierarchy/);
  assert.match(report, /Not recorded in this MVP/);
  assert.match(prompts, /# Website improvement prompt bundle: Korean SaaS marketing site/);
  assert.match(prompts, /## codex-repo-intake/);
  assert.match(prompts, /## claude-competitor/);
  assert.match(prompts, /Work in the target website repository, not in this design-ai repository/);
});

test("buildSiteReport supports file and stdin input", () => withTempDir((dir) => {
  const file = path.join(dir, "workspace.json");
  writeFileSync(file, JSON.stringify(createSampleSiteWorkspace()), "utf8");

  const fromFile = buildSiteReport({ target: file });
  const fromStdin = buildSiteReport({
    stdin: true,
    readStdin: () => readFileSync(file, "utf8"),
  });

  assert.equal(fromFile.summary.status, "pass");
  assert.equal(fromStdin.summary.filePath, "stdin");
  assert.equal(fromStdin.summary.counts.refactorTasks, 1);
}));

test("runSite prints JSON and writes report/prompt artifacts", async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, "workspace.json");
    const handoff = path.join(dir, "out", "handoff.md");
    const prompts = path.join(dir, "out", "prompts.md");
    writeFileSync(file, JSON.stringify(createSampleSiteWorkspace()), "utf8");

    const jsonOutput = await captureConsole(() => runSite([file, "--json"]));
    const payload = JSON.parse(jsonOutput.stdout);
    assert.equal(payload.status, "pass");
    assert.equal(jsonOutput.exitCode, undefined);

    const reportOutput = await captureConsole(() => runSite([file, "--report", "--out", handoff]));
    assert.match(reportOutput.stdout, /Wrote /);
    assert.match(readFileSync(handoff, "utf8"), /Website improvement handoff/);

    const promptsOutput = await captureConsole(() => runSite([file, "--prompts", "--out", prompts]));
    assert.match(promptsOutput.stdout, /Wrote /);
    assert.match(readFileSync(prompts, "utf8"), /Website improvement prompt bundle/);
  });
});

test("runSite strict exits non-zero on warnings", async () => {
  await withTempDir(async (dir) => {
    const raw = createSampleSiteWorkspace();
    raw.siteProfile.repoUrl = "";
    raw.siteProfile.localPath = "";
    const file = path.join(dir, "workspace.json");
    writeFileSync(file, JSON.stringify(raw), "utf8");

    const relaxed = await captureConsole(() => runSite([file, "--json"]));
    assert.equal(JSON.parse(relaxed.stdout).status, "warn");
    assert.equal(relaxed.exitCode, undefined);

    const strict = await captureConsole(() => runSite([file, "--strict", "--json"]));
    assert.equal(JSON.parse(strict.stdout).status, "warn");
    assert.equal(strict.exitCode, 1);
  });
});

test("runSite prints command-specific help", async () => {
  const output = await captureConsole(() => runSite(["--help"]));
  assert.match(output.stdout, /Usage:\s+design-ai site <workspace\.json>/);
  assert.match(output.stdout, /--report\s+Generate a Markdown website improvement handoff report/);
  assert.match(output.stdout, /--prompts\s+Generate a Markdown bundle of Codex and Claude prompts/);
});
