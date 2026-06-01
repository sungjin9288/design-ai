// Tests for cli/lib/site.mjs Website Improvement Console workspace handling.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runSite } from "../commands/site.mjs";
import {
  analyzeSiteWorkspace,
  buildSiteHandoffReport,
  buildSiteHandoffBundle,
  buildSiteMcpActionPlan,
  buildSiteMcpCheckReport,
  buildSitePrompt,
  buildSitePromptBundle,
  buildSiteReport,
  createSampleSiteWorkspace,
  formatSiteJson,
  formatSiteMcpCheckHuman,
  formatSiteMcpCheckJson,
  formatSitePromptTemplatesHuman,
  formatSitePromptTemplatesJson,
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
    bundle: false,
    promptList: false,
    mcpCheck: false,
    mcpPlan: false,
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
    bundle: false,
    promptList: false,
    mcpCheck: false,
    mcpPlan: false,
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
  assert.equal(parseSiteArgs(["--prompt-list", "--json"]).promptList, true);
  assert.equal(parseSiteArgs(["workspace.json", "--mcp-check", "--json"]).mcpCheck, true);
  assert.equal(parseSiteArgs(["workspace.json", "--mcp-plan"]).mcpPlan, true);
  assert.equal(parseSiteArgs(["workspace.json", "--tasks", "--out", "website-workspace.tasks.json"]).tasks, true);
  assert.equal(parseSiteArgs(["workspace.json", "--bundle", "--out", "handoff-bundle"]).bundle, true);
});

test("parseSiteArgs rejects invalid combinations and unknown options", () => {
  assert.throws(() => parseSiteArgs(["workspace.json", "--stdin"]), /either a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--sample"]), /Use --sample without a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["--stdin", "--sample"]), /Use --sample without a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--prompt-list"]), /Use --prompt-list without a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["--stdin", "--prompt-list"]), /Use --prompt-list without a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--prompt", "codex-repo-intake"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--mcp-check"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--mcp-plan"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--bundle"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--strict"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-check", "--tasks"]), /Use --mcp-check without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-check", "--report"]), /Use --mcp-check without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-plan", "--tasks"]), /Use --mcp-plan without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-plan", "--report"]), /Use --mcp-plan without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--bundle"]), /--bundle requires --out directory/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--bundle", "--json", "--out", "bundle"]), /--json is only supported/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--bundle", "--report", "--out", "bundle"]), /Use --bundle without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-check", "--bundle", "--out", "bundle"]), /Use --mcp-check without --sample/);
  assert.throws(() => parseSiteArgs(["--sample", "--report"]), /Use --sample without --report, --prompts, or --prompt/);
  assert.throws(() => parseSiteArgs(["--sample", "--prompt", "codex-repo-intake"]), /Use --sample without --report, --prompts, or --prompt/);
  assert.throws(() => parseSiteArgs(["--sample", "--tasks"]), /Use only one generated workspace mode/);
  assert.throws(() => parseSiteArgs(["--sample", "--bundle", "--out", "bundle"]), /Use --bundle without --sample/);
  assert.throws(() => parseSiteArgs(["--sample", "--strict"]), /Use --sample without --strict/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--tasks", "--json"]), /Use --tasks without --json/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--tasks", "--report"]), /Use --tasks without --json/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--tasks", "--prompt", "codex-implementation"]), /Use --tasks without --prompt/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--report", "--prompts"]), /only one output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--prompts", "--prompt", "codex-implementation"]), /only one output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-check", "--mcp-plan"]), /only one output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--report", "--json"]), /--json is only supported/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-plan", "--json"]), /--json is only supported/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--prompt"]), /--prompt requires a template id/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--prompt", "bad-template"]), /--prompt must be one of/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--task"]), /--task requires a refactor task id/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--task", "task-homepage-cta"]), /Use --task only with --prompt/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--prompt", "claude-design-review", "--task", "task-homepage-cta"]), /Use --task only with --prompt codex-implementation/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--out", "x.md"]), /--out requires/);
  assert.throws(() => parseSiteArgs(["workspace.json", "extra.json"]), /Unexpected argument/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--jsn"]), /Did you mean `--json`\?/);
});

test("formatSitePromptTemplates lists all Website Improvement prompt templates", () => {
  const human = formatSitePromptTemplatesHuman();
  const json = JSON.parse(formatSitePromptTemplatesJson());

  assert.match(human, /Website Improvement prompt templates/);
  assert.match(human, /1\. codex-repo-intake/);
  assert.match(human, /2\. codex-implementation/);
  assert.match(human, /Task selectable: yes/);
  assert.match(human, /design-ai site <workspace\.json> --prompt codex-implementation --task <id-or-number>/);

  assert.deepEqual(Object.keys(json), ["count", "templates"]);
  assert.equal(json.count, 8);
  assert.deepEqual(json.templates.map((template) => template.id), [
    "codex-repo-intake",
    "codex-implementation",
    "codex-visual-qa",
    "codex-deployment",
    "claude-design-review",
    "claude-competitor",
    "claude-copy-ux",
    "handoff-report",
  ]);
  assert.equal(json.templates[1].taskSelectable, true);
  assert.equal(json.templates[1].agent, "codex");
});

test("buildSiteMcpCheckReport summarizes evidence and task/MCP gaps", () => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "sample.json" });
  const report = buildSiteMcpCheckReport(workspace, summary);
  const json = JSON.parse(formatSiteMcpCheckJson(report));
  const human = formatSiteMcpCheckHuman(report);

  assert.equal(report.status, "pass");
  assert.equal(report.counts.required, 3);
  assert.equal(report.counts.ready, 9);
  assert.equal(report.counts.missing, 0);
  assert.equal(report.items[0].key, "github");
  assert.equal(report.items[0].state, "ready");
  assert.deepEqual(report.taskGaps, []);
  assert.deepEqual(Object.keys(json), [
    "filePath",
    "status",
    "workspaceStatus",
    "site",
    "counts",
    "items",
    "taskGaps",
    "workspaceIssues",
    "nextActions",
  ]);
  assert.match(human, /Website Improvement MCP readiness/);
  assert.match(human, /GitHub \(required\) -> ready/);
  assert.match(human, /Task MCP gaps:\n- none/);

  const gapWorkspace = {
    ...workspace,
    mcpReadiness: {
      ...workspace.mcpReadiness,
      figma: "unused",
    },
  };
  const gapReport = buildSiteMcpCheckReport(gapWorkspace, analyzeSiteWorkspace(gapWorkspace, { filePath: "gap.json" }).summary);
  assert.equal(gapReport.status, "warn");
  assert.equal(gapReport.counts.taskGaps, 1);
  assert.match(gapReport.taskGaps[0].message, /recommends figma/);

  const missingRequiredWorkspace = {
    ...workspace,
    siteProfile: {
      ...workspace.siteProfile,
      repoUrl: "",
      localPath: "",
    },
  };
  const missingReport = buildSiteMcpCheckReport(
    missingRequiredWorkspace,
    analyzeSiteWorkspace(missingRequiredWorkspace, { filePath: "missing.json" }).summary,
  );
  assert.equal(missingReport.status, "fail");
  assert.equal(missingReport.items[0].level, "fail");
  assert.match(missingReport.nextActions.join("\n"), /siteProfile\.repoUrl/);
});

test("buildSiteMcpActionPlan turns MCP readiness into Markdown execution guidance", () => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "sample.json" });
  const plan = buildSiteMcpActionPlan(workspace, summary);

  assert.match(plan, /# Website improvement MCP action plan: Korean SaaS marketing site/);
  assert.match(plan, /## Readiness Matrix/);
  assert.match(plan, /\| GitHub \| required \| ready \| pass \|/);
  assert.match(plan, /## Blocking Items\n- No blocking readiness issues\./);
  assert.match(plan, /## Task\/MCP Alignment/);
  assert.match(plan, /task-homepage-cta/);
  assert.match(plan, /design-ai site sample\.json --mcp-check --strict --json/);
  assert.match(plan, /does not call external MCPs, mutate the target website repo/);

  const missingRequiredWorkspace = {
    ...workspace,
    siteProfile: {
      ...workspace.siteProfile,
      repoUrl: "",
      localPath: "",
    },
  };
  const missingPlan = buildSiteMcpActionPlan(
    missingRequiredWorkspace,
    analyzeSiteWorkspace(missingRequiredWorkspace, { filePath: "missing.json" }).summary,
  );
  assert.match(missingPlan, /Status: fail/);
  assert.match(missingPlan, /GitHub: Add siteProfile\.repoUrl or siteProfile\.localPath/);
});

test("buildSiteHandoffBundle creates a complete deterministic handoff package", () => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "stdin" });
  const bundle = buildSiteHandoffBundle(workspace, summary);
  const files = Object.fromEntries(bundle.files.map((file) => [file.path, file.content]));

  assert.equal(bundle.status, "pass");
  assert.deepEqual(Object.keys(files), [
    "README.md",
    "summary.json",
    "website-workspace.tasks.json",
    "mcp-check.json",
    "mcp-action-plan.md",
    "website-handoff.md",
    "website-prompts.md",
    "codex-implementation.md",
  ]);
  assert.match(files["README.md"], /Website improvement handoff bundle/);
  assert.match(files["README.md"], /does not call external MCPs/);
  assert.match(files["mcp-action-plan.md"], /Website improvement MCP action plan/);
  assert.match(files["website-handoff.md"], /Website improvement handoff/);
  assert.match(files["website-prompts.md"], /Website improvement prompt bundle/);
  assert.match(files["codex-implementation.md"], /# Codex implementation prompt/);

  const summaryPayload = JSON.parse(files["summary.json"]);
  assert.equal(summaryPayload.status, "pass");
  assert.equal(summaryPayload.taskGeneration.totalTasks, 3);
  assert.equal(summaryPayload.taskGeneration.createdCount, 2);
  assert.deepEqual(summaryPayload.files, Object.keys(files));

  const tasksWorkspace = JSON.parse(files["website-workspace.tasks.json"]);
  assert.deepEqual(tasksWorkspace.refactorTasks.map((task) => task.id), [
    "task-homepage-cta",
    "task-accessibility",
    "task-content-quality",
  ]);
});

test("runSite prints and writes MCP readiness check output", async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, "workspace.json");
    const outFile = path.join(dir, "mcp-check.json");
    writeFileSync(file, JSON.stringify(createSampleSiteWorkspace()), "utf8");

    const jsonOutput = await captureConsole(() => runSite([file, "--mcp-check", "--json"]));
    const payload = JSON.parse(jsonOutput.stdout);
    assert.equal(payload.status, "pass");
    assert.equal(payload.items[0].key, "github");
    assert.equal(jsonOutput.exitCode, undefined);

    const humanOutput = await captureConsole(() => runSite([file, "--mcp-check"]));
    assert.match(humanOutput.stdout, /Website Improvement MCP readiness/);
    assert.match(humanOutput.stdout, /Task MCP gaps:\n- none/);

    const writeOutput = await captureConsole(() => runSite([file, "--mcp-check", "--json", "--out", outFile]));
    assert.match(writeOutput.stdout, /Wrote /);
    assert.equal(JSON.parse(readFileSync(outFile, "utf8")).status, "pass");
  });
});

test("runSite prints and writes MCP readiness action plan output", async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, "workspace.json");
    const outFile = path.join(dir, "mcp-action-plan.md");
    writeFileSync(file, JSON.stringify(createSampleSiteWorkspace()), "utf8");

    const planOutput = await captureConsole(() => runSite([file, "--mcp-plan"]));
    assert.match(planOutput.stdout, /# Website improvement MCP action plan/);
    assert.match(planOutput.stdout, /## Execution Sequence/);
    assert.equal(planOutput.exitCode, undefined);

    const writeOutput = await captureConsole(() => runSite([file, "--mcp-plan", "--out", outFile]));
    assert.match(writeOutput.stdout, /Wrote /);
    assert.match(readFileSync(outFile, "utf8"), /Task\/MCP Alignment/);
  });
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
    const promptList = path.join(dir, "out", "prompt-templates.json");
    const mcpCheck = path.join(dir, "out", "mcp-check.json");
    const mcpPlan = path.join(dir, "out", "mcp-action-plan.md");
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

    const promptListOutput = await captureConsole(() => runSite(["--prompt-list", "--json", "--out", promptList]));
    assert.match(promptListOutput.stdout, /Wrote /);
    const promptListPayload = JSON.parse(readFileSync(promptList, "utf8"));
    assert.equal(promptListPayload.count, 8);
    assert.equal(promptListPayload.templates[1].id, "codex-implementation");

    const mcpCheckOutput = await captureConsole(() => runSite([file, "--mcp-check", "--json", "--out", mcpCheck]));
    assert.match(mcpCheckOutput.stdout, /Wrote /);
    assert.equal(JSON.parse(readFileSync(mcpCheck, "utf8")).status, "pass");

    const mcpPlanOutput = await captureConsole(() => runSite([file, "--mcp-plan", "--out", mcpPlan]));
    assert.match(mcpPlanOutput.stdout, /Wrote /);
    assert.match(readFileSync(mcpPlan, "utf8"), /Website improvement MCP action plan/);

    const bundleDir = path.join(dir, "out", "handoff-bundle");
    const bundleOutput = await captureConsole(() => runSite([file, "--bundle", "--out", bundleDir]));
    assert.match(bundleOutput.stdout, /Wrote Website Improvement handoff bundle/);
    assert.equal(existsSync(path.join(bundleDir, "README.md")), true);
    assert.equal(existsSync(path.join(bundleDir, "summary.json")), true);
    assert.equal(existsSync(path.join(bundleDir, "website-workspace.tasks.json")), true);
    assert.equal(existsSync(path.join(bundleDir, "mcp-check.json")), true);
    assert.equal(existsSync(path.join(bundleDir, "mcp-action-plan.md")), true);
    assert.equal(existsSync(path.join(bundleDir, "website-handoff.md")), true);
    assert.equal(existsSync(path.join(bundleDir, "website-prompts.md")), true);
    assert.equal(existsSync(path.join(bundleDir, "codex-implementation.md")), true);
    assert.equal(JSON.parse(readFileSync(path.join(bundleDir, "summary.json"), "utf8")).taskGeneration.totalTasks, 3);
    assert.equal(JSON.parse(readFileSync(path.join(bundleDir, "mcp-check.json"), "utf8")).status, "pass");
    assert.match(readFileSync(path.join(bundleDir, "codex-implementation.md"), "utf8"), /Task ID: task-accessibility/);
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
  assert.match(output.stdout, /design-ai site --prompt-list \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --mcp-check \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --mcp-plan \[--strict\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --tasks \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --bundle --out dir \[--strict\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --prompt template-id \[--task id-or-number\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /--sample\s+Emit a valid sample Website Improvement workspace JSON/);
  assert.match(output.stdout, /--prompt-list\s+List Website Improvement prompt template ids/);
  assert.match(output.stdout, /--mcp-check\s+Check MCP readiness evidence and task\/MCP gaps/);
  assert.match(output.stdout, /--mcp-plan\s+Generate a Markdown MCP readiness action plan/);
  assert.match(output.stdout, /--tasks\s+Emit workspace JSON with starter refactor tasks generated from audit findings/);
  assert.match(output.stdout, /--bundle\s+Write a complete local handoff bundle directory/);
  assert.match(output.stdout, /--report\s+Generate a Markdown website improvement handoff report/);
  assert.match(output.stdout, /--prompts\s+Generate a Markdown bundle of Codex and Claude prompts/);
  assert.match(output.stdout, /--prompt id Generate one Markdown prompt template/);
  assert.match(output.stdout, /--task id\s+Select a refactor task by id or 1-based top-task number/);
});
