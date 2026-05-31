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
  buildSitePrompt,
  buildSitePromptBundle,
  buildSiteReport,
  createSampleSiteWorkspace,
  formatSiteJson,
  generateSiteRefactorTasks,
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
    sample: false,
    tasks: false,
    promptTemplate: "",
    taskSelector: "",
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
    sample: false,
    tasks: false,
    promptTemplate: "",
    taskSelector: "",
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
  assert.equal(parseSiteArgs(["workspace.json", "--prompt", "codex-implementation"]).promptTemplate, "codex-implementation");
  assert.equal(parseSiteArgs(["workspace.json", "--prompt", "codex-implementation", "--task", "task-accessibility"]).taskSelector, "task-accessibility");
  assert.equal(parseSiteArgs(["--sample", "--out", "website-workspace.json"]).sample, true);
  assert.equal(parseSiteArgs(["workspace.json", "--tasks", "--out", "website-workspace.tasks.json"]).tasks, true);
});

test("parseSiteArgs rejects invalid combinations and unknown options", () => {
  assert.throws(() => parseSiteArgs(["workspace.json", "--stdin"]), /either a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--sample"]), /Use --sample without a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["--stdin", "--sample"]), /Use --sample without a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["--sample", "--report"]), /Use --sample without --report, --prompts, or --prompt/);
  assert.throws(() => parseSiteArgs(["--sample", "--prompt", "codex-repo-intake"]), /Use --sample without --report, --prompts, or --prompt/);
  assert.throws(() => parseSiteArgs(["--sample", "--tasks"]), /Use only one generated workspace mode/);
  assert.throws(() => parseSiteArgs(["--sample", "--strict"]), /Use --sample without --strict/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--tasks", "--json"]), /Use --tasks without --json/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--tasks", "--report"]), /Use --tasks without --json/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--tasks", "--prompt", "codex-implementation"]), /Use --tasks without --prompt/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--report", "--prompts"]), /only one Markdown output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--prompts", "--prompt", "codex-implementation"]), /only one Markdown output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--report", "--json"]), /--json is only supported/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--prompt"]), /--prompt requires a template id/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--prompt", "bad-template"]), /--prompt must be one of/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--task"]), /--task requires a refactor task id/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--task", "task-homepage-cta"]), /Use --task only with --prompt/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--prompt", "claude-design-review", "--task", "task-homepage-cta"]), /Use --task only with --prompt codex-implementation/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--out", "x.md"]), /--out requires/);
  assert.throws(() => parseSiteArgs(["workspace.json", "extra.json"]), /Unexpected argument/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--jsn"]), /Did you mean `--json`\?/);
});

test("generateSiteRefactorTasks adds deterministic starter tasks from audit findings", () => {
  const workspace = createSampleSiteWorkspace();
  const result = generateSiteRefactorTasks(workspace);

  assert.equal(result.created.length, 2);
  assert.deepEqual(result.created.map((task) => task.id), ["task-accessibility", "task-content-quality"]);
  assert.equal(result.workspace.refactorTasks.length, 3);
  assert.equal(result.workspace.refactorTasks[1].priority, "p0");
  assert.equal(result.workspace.refactorTasks[1].impact, "high");
  assert.deepEqual(result.workspace.refactorTasks[1].recommendedMcp, ["browser", "chromeDevtools"]);
  assert.match(result.workspace.refactorTasks[1].codexPrompt, /target website repo, not in design-ai/);
  assert.match(result.workspace.refactorTasks[2].problem, /Pricing page does not explain plan fit/);

  const duplicateRun = generateSiteRefactorTasks(result.workspace);
  assert.equal(duplicateRun.created.length, 0);
  assert.equal(duplicateRun.workspace.refactorTasks.length, 3);
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
  const generatedWorkspace = generateSiteRefactorTasks(workspace).workspace;
  const report = buildSiteHandoffReport(workspace);
  const prompt = buildSitePrompt(workspace, "codex-implementation");
  const selectedPrompt = buildSitePrompt(generatedWorkspace, "codex-implementation", { taskSelector: "task-accessibility" });
  const selectedByNumberPrompt = buildSitePrompt(generatedWorkspace, "codex-implementation", { taskSelector: "2" });
  const numericIdWorkspace = {
    ...generatedWorkspace,
    refactorTasks: generatedWorkspace.refactorTasks.map((task, index) => (index === 0 ? { ...task, id: "2" } : task)),
  };
  const selectedByExactNumericIdPrompt = buildSitePrompt(numericIdWorkspace, "codex-implementation", { taskSelector: "2" });
  const prompts = buildSitePromptBundle(workspace);

  assert.match(report, /# Website improvement handoff: Korean SaaS marketing site/);
  assert.match(report, /## MCP Readiness/);
  assert.match(report, /Clarify homepage CTA hierarchy/);
  assert.match(report, /Not recorded in this MVP/);
  assert.match(prompt, /# Codex implementation prompt/);
  assert.match(prompt, /Selected task:/);
  assert.match(prompt, /Task ID: task-homepage-cta/);
  assert.match(prompt, /Work in the target website repository, not in this design-ai repository/);
  assert.match(selectedPrompt, /Task ID: task-accessibility/);
  assert.match(selectedPrompt, /Resolve Accessibility finding/);
  assert.doesNotMatch(selectedPrompt, /Clarify homepage CTA hierarchy/);
  assert.match(selectedByNumberPrompt, /Task ID: task-homepage-cta/);
  assert.match(selectedByExactNumericIdPrompt, /Task ID: 2/);
  assert.match(selectedByExactNumericIdPrompt, /Clarify homepage CTA hierarchy/);
  assert.throws(
    () => buildSitePrompt(generatedWorkspace, "codex-implementation", { taskSelector: "missing-task" }),
    /Unknown refactor task: missing-task/,
  );
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
    const singlePrompt = path.join(dir, "out", "codex-implementation.md");
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

    const promptOutput = await captureConsole(() => runSite([file, "--prompt", "codex-implementation", "--task", "1", "--out", singlePrompt]));
    assert.match(promptOutput.stdout, /Wrote /);
    assert.match(readFileSync(singlePrompt, "utf8"), /# Codex implementation prompt/);
    assert.match(readFileSync(singlePrompt, "utf8"), /Task ID: task-homepage-cta/);
    assert.doesNotMatch(readFileSync(singlePrompt, "utf8"), /Website improvement prompt bundle/);
  });
});

test("runSite emits and writes a valid sample workspace", async () => {
  await withTempDir(async (dir) => {
    const outFile = path.join(dir, "website-workspace.json");

    const sampleOutput = await captureConsole(() => runSite(["--sample"]));
    const sample = JSON.parse(sampleOutput.stdout);
    assert.equal(sample.version, 1);
    assert.equal(sample.siteProfile.name, "Korean SaaS marketing site");
    assert.deepEqual(sample.siteProfile.viewports, ["desktop", "tablet", "mobile"]);
    assert.equal(sampleOutput.exitCode, undefined);

    const writeOutput = await captureConsole(() => runSite(["--sample", "--out", outFile]));
    assert.match(writeOutput.stdout, /Wrote /);

    const report = buildSiteReport({ target: outFile });
    assert.equal(report.summary.status, "pass");
    assert.equal(report.summary.counts.refactorTasks, 1);
  });
});

test("runSite emits and writes workspace JSON with generated refactor tasks", async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, "workspace.json");
    const outFile = path.join(dir, "workspace.tasks.json");
    writeFileSync(file, JSON.stringify(createSampleSiteWorkspace()), "utf8");

    const tasksOutput = await captureConsole(() => runSite([file, "--tasks"]));
    const generated = JSON.parse(tasksOutput.stdout);
    assert.equal(generated.refactorTasks.length, 3);
    assert.deepEqual(generated.refactorTasks.map((task) => task.id), [
      "task-homepage-cta",
      "task-accessibility",
      "task-content-quality",
    ]);
    assert.equal(tasksOutput.exitCode, undefined);

    const writeOutput = await captureConsole(() => runSite([file, "--tasks", "--out", outFile]));
    assert.match(writeOutput.stdout, /Wrote /);

    const report = buildSiteReport({ target: outFile });
    assert.equal(report.summary.status, "pass");
    assert.equal(report.summary.counts.refactorTasks, 3);
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
  assert.match(output.stdout, /design-ai site --sample \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --tasks \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --prompt template-id \[--task id-or-number\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /--sample\s+Emit a valid sample Website Improvement workspace JSON/);
  assert.match(output.stdout, /--tasks\s+Emit workspace JSON with starter refactor tasks generated from audit findings/);
  assert.match(output.stdout, /--report\s+Generate a Markdown website improvement handoff report/);
  assert.match(output.stdout, /--prompts\s+Generate a Markdown bundle of Codex and Claude prompts/);
  assert.match(output.stdout, /--prompt id Generate one Markdown prompt template/);
  assert.match(output.stdout, /--task id\s+Select a refactor task by id or 1-based top-task number/);
});
