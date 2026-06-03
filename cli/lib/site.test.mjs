// Tests for cli/lib/site.mjs Website Improvement Console workspace handling.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runSite } from "../commands/site.mjs";
import {
  analyzeSiteWorkspace,
  buildSiteBundleCompareReport,
  buildSiteBundleCheckReport,
  buildSiteHandoffReport,
  buildSiteHandoffBundle,
  buildSiteMcpActionPlan,
  buildSiteMcpCheckReport,
  buildSiteMcpProbeReport,
  buildSiteBundleHandoffReport,
  buildSitePrompt,
  buildSitePromptBundle,
  buildSiteReport,
  buildSiteWorkflowGraph,
  createSampleSiteWorkspace,
  SITE_BUNDLE_CHECKSUM_FILES,
  formatSiteBundleCheckHuman,
  formatSiteBundleCheckJson,
  formatSiteBundleCompareHuman,
  formatSiteBundleCompareJson,
  formatSiteJson,
  formatSiteBundleHandoffHuman,
  formatSiteBundleHandoffJson,
  formatSiteMcpCheckHuman,
  formatSiteMcpCheckJson,
  formatSitePromptTemplatesHuman,
  formatSitePromptTemplatesJson,
  formatSiteWorkflowGraphJson,
  formatSiteWorkflowGraphMarkdown,
  generateSiteRefactorTasks,
  parseSiteArgs,
} from "./site.mjs";

function sha256HexForTest(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function bundleDigestForTest(checksumFiles) {
  const manifest = SITE_BUNDLE_CHECKSUM_FILES.map((filePath) => `${filePath}\t${checksumFiles[filePath] || ""}`).join("\n");
  return sha256HexForTest(`${manifest}\n`);
}

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
    bundleCheck: false,
    bundleCompareTarget: "",
    bundleHandoff: false,
    promptList: false,
    mcpCheck: false,
    mcpPlan: false,
    graph: false,
    probes: false,
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
    bundleCheck: false,
    bundleCompareTarget: "",
    bundleHandoff: false,
    promptList: false,
    mcpCheck: false,
    mcpPlan: false,
    graph: false,
    probes: false,
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
  assert.equal(parseSiteArgs(["workspace.json", "--mcp-check", "--probes", "--json"]).probes, true);
  assert.equal(parseSiteArgs(["workspace.json", "--graph", "--json"]).graph, true);
  assert.equal(parseSiteArgs(["workspace.json", "--graph", "--out", "website-workflow-graph.md"]).outPath, "website-workflow-graph.md");
  assert.equal(parseSiteArgs(["workspace.json", "--tasks", "--out", "website-workspace.tasks.json"]).tasks, true);
  assert.equal(parseSiteArgs(["workspace.json", "--bundle", "--out", "handoff-bundle"]).bundle, true);
  assert.equal(parseSiteArgs(["handoff-bundle", "--bundle-check", "--json"]).bundleCheck, true);
  assert.equal(parseSiteArgs(["handoff-bundle", "--bundle-compare", "handoff-bundle.previous", "--json"]).bundleCompareTarget, "handoff-bundle.previous");
  assert.equal(parseSiteArgs(["handoff-bundle", "--bundle-handoff", "--json"]).bundleHandoff, true);
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
  assert.throws(() => parseSiteArgs(["--prompt-list", "--graph"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--bundle"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--bundle-check"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--bundle-handoff"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--strict"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-check", "--tasks"]), /Use --mcp-check without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-check", "--report"]), /Use --mcp-check without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-check", "--graph"]), /Use --mcp-check without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-plan", "--tasks"]), /Use --mcp-plan without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-plan", "--report"]), /Use --mcp-plan without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-plan", "--graph"]), /Use --mcp-plan without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--bundle"]), /--bundle requires --out directory/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--bundle", "--json", "--out", "bundle"]), /--json is not supported with --bundle/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--bundle", "--report", "--out", "bundle"]), /Use --bundle without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-check", "--bundle", "--out", "bundle"]), /Use --mcp-check without --sample/);
  assert.throws(() => parseSiteArgs(["--stdin", "--bundle-check"]), /Use --bundle-check with a handoff bundle directory path/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--bundle-check", "--bundle", "--out", "bundle"]), /Use --bundle-check without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--bundle-check", "--report"]), /Use --bundle-check without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-plan", "--bundle-check"]), /Use --mcp-plan without --sample/);
  assert.throws(() => parseSiteArgs(["--stdin", "--bundle-compare", "other-bundle"]), /Use --bundle-compare with handoff bundle directory paths/);
  assert.throws(() => parseSiteArgs(["--bundle-compare", "other-bundle"]), /--bundle-compare requires a primary handoff bundle directory path/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--bundle-compare"]), /--bundle-compare requires a second handoff bundle directory path/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--bundle-compare", "other-bundle", "--bundle-check"]), /Use --bundle-compare without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-plan", "--bundle-compare", "other-bundle"]), /Use --mcp-plan without --sample/);
  assert.throws(() => parseSiteArgs(["--stdin", "--bundle-handoff"]), /Use --bundle-handoff with a handoff bundle directory path/);
  assert.throws(() => parseSiteArgs(["--bundle-handoff"]), /--bundle-handoff requires a handoff bundle directory path/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--bundle-handoff", "--bundle-check"]), /Use --bundle-check without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--bundle-handoff", "--report"]), /Use --bundle-handoff without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-plan", "--bundle-handoff"]), /Use --mcp-plan without --sample/);
  assert.throws(() => parseSiteArgs(["--sample", "--report"]), /Use --sample without --report, --prompts, --prompt, or --graph/);
  assert.throws(() => parseSiteArgs(["--sample", "--prompt", "codex-repo-intake"]), /Use --sample without --report, --prompts, --prompt, or --graph/);
  assert.throws(() => parseSiteArgs(["--sample", "--graph"]), /Use --sample without --report, --prompts, --prompt, or --graph/);
  assert.throws(() => parseSiteArgs(["--sample", "--tasks"]), /Use only one generated workspace mode/);
  assert.throws(() => parseSiteArgs(["--sample", "--bundle", "--out", "bundle"]), /Use --bundle without --sample/);
  assert.throws(() => parseSiteArgs(["--sample", "--strict"]), /Use --sample without --strict/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--tasks", "--json"]), /Use --tasks without --json/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--tasks", "--report"]), /Use --tasks without --json/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--tasks", "--graph"]), /Use --tasks without --json, --graph/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--tasks", "--prompt", "codex-implementation"]), /Use --tasks without --prompt/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--report", "--prompts"]), /only one output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--prompts", "--prompt", "codex-implementation"]), /only one output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-check", "--mcp-plan"]), /only one output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--graph", "--report"]), /only one output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--probes"]), /Use --probes only with --mcp-check or --mcp-plan/);
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

test("buildSiteMcpCheckReport can include read-only MCP probes without changing default JSON shape", () => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "sample.json" });
  const defaultReport = buildSiteMcpCheckReport(workspace, summary);
  const probeReport = buildSiteMcpCheckReport(workspace, summary, { probes: true });
  const standaloneProbeReport = buildSiteMcpProbeReport(workspace);
  const human = formatSiteMcpCheckHuman(probeReport);

  assert.equal(Object.hasOwn(defaultReport, "probes"), false);
  assert.equal(probeReport.status, "pass");
  assert.equal(probeReport.probes.status, "pass");
  assert.equal(probeReport.probes.externalCalls, false);
  assert.equal(probeReport.probes.mode, "read-only-local");
  assert.equal(probeReport.probes.count, 4);
  assert.equal(probeReport.probes.pass, 4);
  assert.deepEqual(probeReport.probes.items.map((item) => item.id), [
    "github-repo-reference",
    "figma-url-reference",
    "browser-smoke-target",
    "deploy-provider-reference",
  ]);
  assert.equal(standaloneProbeReport.status, "pass");
  assert.match(human, /Read-only probes:/);
  assert.match(human, /GitHub repo reference/);

  const missingProbeWorkspace = {
    ...workspace,
    siteProfile: {
      ...workspace.siteProfile,
      repoUrl: "https://example.com/not-github",
      localPath: "/definitely/not/a/repo",
      figmaUrl: "not-a-figma-url",
      liveUrl: "",
      deployProvider: "none",
    },
  };
  const missingProbeReport = buildSiteMcpCheckReport(
    missingProbeWorkspace,
    analyzeSiteWorkspace(missingProbeWorkspace, { filePath: "missing-probes.json" }).summary,
    { probes: true },
  );
  assert.equal(missingProbeReport.status, "fail");
  assert.equal(missingProbeReport.probes.fail, 3);
  assert.equal(missingProbeReport.probes.warn, 1);
  assert.match(missingProbeReport.nextActions.join("\n"), /Probe github-repo-reference/);
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

  const probePlan = buildSiteMcpActionPlan(workspace, summary, { probes: true });
  assert.match(probePlan, /## Read-Only Probes/);
  assert.match(probePlan, /External calls: no/);
  assert.match(probePlan, /\| GitHub repo reference \| github \| pass \| pass \|/);

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

test("buildSiteWorkflowGraph exports a deterministic portable workflow graph", () => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "sample.json" });
  const graph = buildSiteWorkflowGraph(workspace, summary);
  const duplicateGraph = buildSiteWorkflowGraph(workspace, summary);
  const json = JSON.parse(formatSiteWorkflowGraphJson(graph));
  const markdown = formatSiteWorkflowGraphMarkdown(graph);

  assert.deepEqual(graph, duplicateGraph);
  assert.deepEqual(Object.keys(json), [
    "version",
    "kind",
    "generatedAt",
    "filePath",
    "status",
    "workspaceStatus",
    "mcpStatus",
    "externalCalls",
    "site",
    "summary",
    "nodes",
    "edges",
    "boundaries",
  ]);
  assert.equal(graph.kind, "website-improvement-workflow-graph");
  assert.equal(graph.status, "pass");
  assert.equal(graph.externalCalls, false);
  assert.equal(graph.summary.nodeCount, 35);
  assert.equal(graph.summary.edgeCount, 67);
  assert.equal(graph.summary.taskCount, 3);
  assert.equal(graph.summary.generatedTaskCount, 2);
  assert.equal(graph.summary.promptTemplateCount, 8);
  assert.deepEqual(graph.nodes.map((node) => node.id).slice(0, 4), [
    "workspace:intake",
    "profile:sample-korean-saas",
    "audit:visual-design",
    "audit:ux-flow",
  ]);
  assert.ok(graph.nodes.some((node) => node.id === "task:task-accessibility" && node.type === "refactor-task"));
  assert.ok(graph.nodes.some((node) => node.id === "prompt:codex-implementation" && node.type === "prompt-template"));
  assert.ok(graph.nodes.some((node) => node.id === "handoff:target-repo" && node.status === "external"));
  assert.ok(graph.edges.some((edge) => edge.from === "task:task-homepage-cta" && edge.to === "prompt:codex-implementation"));
  assert.ok(graph.edges.some((edge) => edge.from === "handoff:bundle" && edge.to === "handoff:target-repo"));
  assert.deepEqual(graph.boundaries, [
    "deterministic-local",
    "no-external-mcp-calls",
    "no-target-repo-mutation",
    "no-new-dependencies",
  ]);

  assert.match(markdown, /# Website improvement workflow graph: Korean SaaS marketing site/);
  assert.match(markdown, /Nodes: 35/);
  assert.match(markdown, /Edges: 67/);
  assert.match(markdown, /No external MCP calls are made/);
});

test("buildSiteHandoffBundle creates a complete deterministic handoff package", () => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "stdin" });
  const bundle = buildSiteHandoffBundle(workspace, summary);
  const duplicateBundle = buildSiteHandoffBundle(workspace, summary);
  const files = Object.fromEntries(bundle.files.map((file) => [file.path, file.content]));

  assert.equal(bundle.status, "pass");
  assert.deepEqual(
    Object.fromEntries(duplicateBundle.files.map((file) => [file.path, file.content])),
    files,
  );
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
  assert.equal(summaryPayload.generatedAt, workspace.updatedAt);
  assert.equal(summaryPayload.taskGeneration.totalTasks, 3);
  assert.equal(summaryPayload.taskGeneration.createdCount, 2);
  assert.deepEqual(summaryPayload.files, Object.keys(files));
  assert.equal(summaryPayload.checksums.algorithm, "sha256");
  assert.match(summaryPayload.checksums.bundleDigest, /^[a-f0-9]{64}$/);
  assert.deepEqual(Object.keys(summaryPayload.checksums.files), [
    "README.md",
    "website-workspace.tasks.json",
    "mcp-check.json",
    "mcp-action-plan.md",
    "website-handoff.md",
    "website-prompts.md",
    "codex-implementation.md",
  ]);
  for (const digest of Object.values(summaryPayload.checksums.files)) {
    assert.match(digest, /^[a-f0-9]{64}$/);
  }

  const tasksWorkspace = JSON.parse(files["website-workspace.tasks.json"]);
  assert.deepEqual(tasksWorkspace.refactorTasks.map((task) => task.id), [
    "task-homepage-cta",
    "task-accessibility",
    "task-content-quality",
  ]);
});

test("buildSiteBundleCheckReport validates a generated handoff bundle directory", () => withTempDir((dir) => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "stdin" });
  const bundle = buildSiteHandoffBundle(workspace, summary);
  const files = Object.fromEntries(bundle.files.map((file) => [file.path, file.content]));
  for (const file of bundle.files) {
    const target = path.join(dir, file.path);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, file.content, "utf8");
  }

  const report = buildSiteBundleCheckReport({ target: dir });
  const json = JSON.parse(formatSiteBundleCheckJson(report));
  const human = formatSiteBundleCheckHuman(report);

  assert.equal(report.status, "pass");
  assert.equal(report.valid, true);
  assert.equal(report.counts.expectedFiles, 8);
  assert.equal(report.counts.presentFiles, 8);
  assert.equal(report.counts.expectedChecksumFiles, 7);
  assert.equal(report.counts.verifiedChecksumFiles, 7);
  assert.equal(report.counts.checksumFailures, 0);
  assert.equal(report.counts.expectedGeneratedFiles, 7);
  assert.equal(report.counts.verifiedGeneratedFiles, 7);
  assert.equal(report.counts.generatedFailures, 0);
  assert.equal(report.generatedContract.available, true);
  assert.equal(report.generatedContract.expectedFiles, 7);
  assert.equal(report.generatedContract.verifiedFiles, 7);
  assert.deepEqual(report.generatedContract.driftFiles, []);
  assert.equal(report.generatedContract.files.length, 7);
  assert.ok(report.generatedContract.files.every((file) => file.present && file.matches));
  assert.ok(report.generatedContract.files.every((file) => /^[a-f0-9]{64}$/.test(file.expectedDigest)));
  assert.ok(report.generatedContract.files.every((file) => /^[a-f0-9]{64}$/.test(file.actualDigest)));
  assert.equal(report.repairGuidance.available, true);
  assert.equal(report.repairGuidance.targetRepoMutation, false);
  assert.equal(report.repairGuidance.externalCalls, false);
  assert.match(report.repairGuidance.command, /website-workspace\.tasks\.json --bundle --out .* --force/);
  assert.match(report.repairGuidance.verifyCommand, /--bundle-check --strict --json/);
  assert.equal(report.summary.siteName, "Korean SaaS marketing site");
  assert.equal(report.summary.totalTasks, 3);
  assert.deepEqual(report.summary.implementationEvidence, {
    executedWork: 0,
    verificationResults: 0,
    remainingRisks: 3,
    nextActions: 0,
  });
  assert.equal(report.summary.checksumAlgorithm, "sha256");
  assert.match(report.summary.checksumBundleDigest, /^[a-f0-9]{64}$/);
  assert.equal(json.issues[0].id, "bundle-ready");
  assert.deepEqual(json.generatedContract.driftFiles, []);
  assert.deepEqual(json.summary.implementationEvidence, {
    executedWork: 0,
    verificationResults: 0,
    remainingRisks: 3,
    nextActions: 0,
  });
  assert.match(human, /Website Improvement handoff bundle check/);
  assert.match(human, /Files: 8\/8/);
  assert.match(human, /Checksums: 7\/7 verified/);
  assert.match(human, /Generated contract: 7\/7 verified/);
  assert.match(human, /Generated drift files: none/);
  assert.match(human, /Generated contract drift:\n- none/);
  assert.match(human, /Repair guidance:\n- Available: yes/);
  assert.match(human, /Regenerate: design-ai site .*website-workspace\.tasks\.json --bundle --out .* --force/);
  assert.match(human, /Bundle digest: [a-f0-9]{64}/);
  assert.match(human, /Evidence: executed work 0, verification 0, risks 3, next actions 0/);
  assert.match(human, /bundle-ready/);

  const summaryPath = path.join(dir, "summary.json");
  const originalSummary = readFileSync(summaryPath, "utf8");
  const mismatchedSummary = JSON.parse(originalSummary);
  mismatchedSummary.implementationEvidence.remainingRisks = 0;
  writeFileSync(summaryPath, `${JSON.stringify(mismatchedSummary, null, 2)}\n`, "utf8");
  const evidenceMismatchReport = buildSiteBundleCheckReport({ target: dir });
  assert.equal(evidenceMismatchReport.status, "fail");
  assert.ok(evidenceMismatchReport.issues.some((issue) => issue.id === "bundle-implementation-evidence-remainingRisks"));
  writeFileSync(summaryPath, originalSummary, "utf8");

  const handoffPath = path.join(dir, "website-handoff.md");
  const originalHandoff = readFileSync(handoffPath, "utf8");
  const coherentlyTamperedHandoff = `${originalHandoff}\nCoherent manual edit after bundle export.\n`;
  const coherentlyTamperedSummary = JSON.parse(originalSummary);
  coherentlyTamperedSummary.checksums.files["website-handoff.md"] = sha256HexForTest(coherentlyTamperedHandoff);
  coherentlyTamperedSummary.checksums.bundleDigest = bundleDigestForTest(coherentlyTamperedSummary.checksums.files);
  writeFileSync(handoffPath, coherentlyTamperedHandoff, "utf8");
  writeFileSync(summaryPath, `${JSON.stringify(coherentlyTamperedSummary, null, 2)}\n`, "utf8");
  const generatedMismatchReport = buildSiteBundleCheckReport({ target: dir });
  assert.equal(generatedMismatchReport.status, "fail");
  assert.equal(generatedMismatchReport.counts.checksumFailures, 0);
  assert.equal(generatedMismatchReport.counts.generatedFailures, 1);
  assert.deepEqual(generatedMismatchReport.generatedContract.driftFiles, ["website-handoff.md"]);
  assert.equal(generatedMismatchReport.repairGuidance.available, true);
  assert.match(generatedMismatchReport.repairGuidance.command, /website-workspace\.tasks\.json --bundle --out .* --force/);
  const handoffDrift = generatedMismatchReport.generatedContract.files.find((file) => file.path === "website-handoff.md");
  assert.equal(handoffDrift.matches, false);
  assert.equal(handoffDrift.actualDigest, sha256HexForTest(coherentlyTamperedHandoff));
  assert.notEqual(handoffDrift.expectedDigest, handoffDrift.actualDigest);
  assert.ok(generatedMismatchReport.issues.some((issue) => (
    issue.id === "bundle-generated-website-handoff.md"
    && issue.message.includes(handoffDrift.expectedDigest.slice(0, 12))
    && issue.message.includes(handoffDrift.actualDigest.slice(0, 12))
  )));
  writeFileSync(handoffPath, originalHandoff, "utf8");
  writeFileSync(summaryPath, originalSummary, "utf8");

  writeFileSync(path.join(dir, "codex-implementation.md"), `${readFileSync(path.join(dir, "codex-implementation.md"), "utf8")}\nTampered after export.\n`, "utf8");
  const tamperedReport = buildSiteBundleCheckReport({ target: dir });
  assert.equal(tamperedReport.status, "fail");
  assert.equal(tamperedReport.valid, false);
  assert.equal(tamperedReport.counts.verifiedChecksumFiles, 6);
  assert.equal(tamperedReport.counts.checksumFailures, 2);
  assert.ok(tamperedReport.issues.some((issue) => issue.id === "bundle-checksum-codex-implementation.md"));
  assert.ok(tamperedReport.issues.some((issue) => issue.id === "bundle-checksum-bundle-digest"));

  writeFileSync(path.join(dir, "codex-implementation.md"), files["codex-implementation.md"], "utf8");
  rmSync(path.join(dir, "mcp-check.json"));
  const missingReport = buildSiteBundleCheckReport({ target: dir });
  assert.equal(missingReport.status, "fail");
  assert.equal(missingReport.valid, false);
  assert.ok(missingReport.issues.some((issue) => issue.id === "bundle-missing-mcp-check.json"));
}));

test("buildSiteBundleCompareReport compares handoff bundle fingerprints and changed files", () => withTempDir((dir) => {
  const leftDir = path.join(dir, "left");
  const rightDir = path.join(dir, "right");
  mkdirSync(leftDir);
  mkdirSync(rightDir);

  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "stdin" });
  const leftBundle = buildSiteHandoffBundle(workspace, summary);
  for (const file of leftBundle.files) {
    writeFileSync(path.join(leftDir, file.path), file.content, "utf8");
    writeFileSync(path.join(rightDir, file.path), file.content, "utf8");
  }

  const identical = buildSiteBundleCompareReport({ target: leftDir, compareTarget: rightDir });
  const identicalJson = JSON.parse(formatSiteBundleCompareJson(identical));
  const identicalHuman = formatSiteBundleCompareHuman(identical);

  assert.equal(identical.status, "pass");
  assert.equal(identical.valid, true);
  assert.equal(identical.sameBundle, true);
  assert.equal(identical.digestMatch, true);
  assert.equal(identical.counts.changedFiles, 0);
  assert.equal(identical.issues[0].id, "bundle-compare-identical");
  assert.equal(identicalJson.left.siteName, "Korean SaaS marketing site");
  assert.deepEqual(identicalJson.left.generatedDriftFiles, []);
  assert.deepEqual(identicalJson.right.generatedDriftFiles, []);
  assert.deepEqual(identicalJson.left.implementationEvidence, {
    executedWork: 0,
    verificationResults: 0,
    remainingRisks: 3,
    nextActions: 0,
  });
  assert.match(identicalHuman, /Same bundle: yes/);
  assert.match(identicalHuman, /Generated contract: left 7\/7, right 7\/7/);
  assert.match(identicalHuman, /Generated drift files: left none, right none/);

  const changedWorkspace = createSampleSiteWorkspace();
  changedWorkspace.auditChecklist["content-quality"].findings.push("FAQ page lacks proof for enterprise procurement teams");
  changedWorkspace.implementationEvidence.executedWork.push("Implemented homepage CTA contrast pass");
  const changedSummary = analyzeSiteWorkspace(changedWorkspace, { filePath: "stdin" }).summary;
  const rightBundle = buildSiteHandoffBundle(changedWorkspace, changedSummary);
  for (const file of rightBundle.files) {
    writeFileSync(path.join(rightDir, file.path), file.content, "utf8");
  }

  const changed = buildSiteBundleCompareReport({ target: leftDir, compareTarget: rightDir });
  assert.equal(changed.status, "warn");
  assert.equal(changed.valid, true);
  assert.equal(changed.sameBundle, false);
  assert.equal(changed.digestMatch, false);
  assert.ok(changed.changedFiles.some((file) => file.path === "website-workspace.tasks.json"));
  assert.ok(changed.changedFiles.some((file) => file.path === "website-handoff.md"));
  assert.ok(changed.metadataChanges.some((item) => item.key === "implementationEvidence.executedWork"));
  assert.equal(changed.issues[0].id, "bundle-compare-different");
  assert.match(formatSiteBundleCompareHuman(changed), /Changed files: [1-9]/);
}));

test("buildSiteBundleHandoffReport emits target-repo prompt from a verified bundle", () => withTempDir((dir) => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "stdin" });
  const bundle = buildSiteHandoffBundle(workspace, summary);
  for (const file of bundle.files) {
    writeFileSync(path.join(dir, file.path), file.content, "utf8");
  }

  const report = buildSiteBundleHandoffReport({ target: dir });
  const json = JSON.parse(formatSiteBundleHandoffJson(report));
  const human = formatSiteBundleHandoffHuman(report);

  assert.equal(report.status, "pass");
  assert.equal(report.valid, true);
  assert.equal(report.bundle.siteName, "Korean SaaS marketing site");
  assert.deepEqual(report.bundle.implementationEvidence, {
    executedWork: 0,
    verificationResults: 0,
    remainingRisks: 3,
    nextActions: 0,
  });
  assert.match(report.bundle.checksumBundleDigest, /^[a-f0-9]{64}$/);
  assert.equal(report.bundle.verifiedChecksumFiles, 7);
  assert.equal(report.bundle.verifiedGeneratedFiles, 7);
  assert.equal(report.bundle.generatedFailures, 0);
  assert.deepEqual(report.bundle.generatedDriftFiles, []);
  assert.equal(report.bundle.repairGuidance.available, true);
  assert.equal(report.bundle.repairGuidance.targetRepoMutation, false);
  assert.match(report.bundle.repairGuidance.command, /website-workspace\.tasks\.json --bundle --out .* --force/);
  assert.equal(report.files.find((file) => file.path === "codex-implementation.md").included, true);
  assert.match(report.prompt, /Website improvement target-repo handoff prompt/);
  assert.match(report.prompt, /You are Codex working in the target website repository, not in the design-ai repository/);
  assert.match(report.prompt, /SHA-256 bundle digest: [a-f0-9]{64}/);
  assert.match(report.prompt, /Evidence counts: executed work 0, verification 0, risks 3, next actions 0/);
  assert.match(report.prompt, /Generated files: 7\/7 match the current CLI bundle contract/);
  assert.match(report.prompt, /Generated drift files: none/);
  assert.match(report.prompt, /Repair guidance:\n- Available: yes/);
  assert.match(report.prompt, /Regenerate: design-ai site .*website-workspace\.tasks\.json --bundle --out .* --force/);
  assert.match(report.prompt, /# Codex implementation prompt/);
  assert.match(report.prompt, /Task ID: task-accessibility/);
  assert.match(report.prompt, /Required Final Response/);
  assert.equal(json.status, "pass");
  assert.deepEqual(json.bundle.implementationEvidence, {
    executedWork: 0,
    verificationResults: 0,
    remainingRisks: 3,
    nextActions: 0,
  });
  assert.equal(json.bundle.verifiedGeneratedFiles, 7);
  assert.equal(json.bundle.generatedFailures, 0);
  assert.deepEqual(json.bundle.generatedDriftFiles, []);
  assert.equal(json.bundle.repairGuidance.available, true);
  assert.match(json.prompt, /Primary Codex Implementation Prompt/);
  assert.match(human, /Bundle Gate/);

  writeFileSync(path.join(dir, "codex-implementation.md"), "tampered\n", "utf8");
  const tampered = buildSiteBundleHandoffReport({ target: dir });
  assert.equal(tampered.status, "fail");
  assert.equal(tampered.valid, false);
  assert.match(tampered.prompt, /did not fully pass local bundle-check validation/);
  assert.ok(tampered.issues.some((issue) => issue.id === "bundle-checksum-codex-implementation.md"));
}));

test("runSite prints and writes MCP readiness check output", async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, "workspace.json");
    const outFile = path.join(dir, "mcp-check.json");
    writeFileSync(file, JSON.stringify(createSampleSiteWorkspace()), "utf8");

    const jsonOutput = await captureConsole(() => runSite([file, "--mcp-check", "--json"]));
    const payload = JSON.parse(jsonOutput.stdout);
    assert.equal(payload.status, "pass");
    assert.equal(payload.items[0].key, "github");
    assert.equal(Object.hasOwn(payload, "probes"), false);
    assert.equal(jsonOutput.exitCode, undefined);

    const probeJsonOutput = await captureConsole(() => runSite([file, "--mcp-check", "--probes", "--json"]));
    const probePayload = JSON.parse(probeJsonOutput.stdout);
    assert.equal(probePayload.status, "pass");
    assert.equal(probePayload.probes.status, "pass");
    assert.equal(probePayload.probes.externalCalls, false);

    const humanOutput = await captureConsole(() => runSite([file, "--mcp-check"]));
    assert.match(humanOutput.stdout, /Website Improvement MCP readiness/);
    assert.match(humanOutput.stdout, /Task MCP gaps:\n- none/);

    const probeHumanOutput = await captureConsole(() => runSite([file, "--mcp-check", "--probes"]));
    assert.match(probeHumanOutput.stdout, /Read-only probes:/);
    assert.match(probeHumanOutput.stdout, /Browser smoke target/);

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

    const probePlanOutput = await captureConsole(() => runSite([file, "--mcp-plan", "--probes"]));
    assert.match(probePlanOutput.stdout, /## Read-Only Probes/);
    assert.match(probePlanOutput.stdout, /External calls: no/);

    const writeOutput = await captureConsole(() => runSite([file, "--mcp-plan", "--out", outFile]));
    assert.match(writeOutput.stdout, /Wrote /);
    assert.match(readFileSync(outFile, "utf8"), /Task\/MCP Alignment/);
  });
});

test("generateSiteRefactorTasks adds deterministic starter tasks from audit findings", () => {
  const workspace = createSampleSiteWorkspace();
  const result = generateSiteRefactorTasks(workspace);

  assert.equal(result.created.length, 2);
  assert.equal(result.workspace.updatedAt, workspace.updatedAt);
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
  workspace.implementationEvidence = {
    executedWork: ["Updated hero CTA hierarchy in the target repo"],
    verificationResults: ["npm run build passed in the target repo"],
    remainingRisks: ["Stakeholder copy approval remains open"],
    nextActions: ["Run Lighthouse after preview deploy"],
  };
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
  assert.match(report, /Updated hero CTA hierarchy in the target repo/);
  assert.match(report, /npm run build passed in the target repo/);
  assert.match(report, /Stakeholder copy approval remains open/);
  assert.match(report, /Run Lighthouse after preview deploy/);
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

test("site workspace normalization preserves handoff evidence for reports and bundles", () => {
  const workspace = createSampleSiteWorkspace();
  workspace.implementationEvidence = {
    executedWork: ["Implemented pricing CTA cleanup"],
    verificationResults: ["npm run lint passed"],
    remainingRisks: ["Preview deploy still needs analytics review"],
    nextActions: ["Attach before/after screenshots"],
  };

  const { workspace: normalized, summary } = analyzeSiteWorkspace(workspace, { filePath: "sample.json" });
  const taskWorkspace = generateSiteRefactorTasks(normalized).workspace;
  const report = buildSiteHandoffReport(taskWorkspace);
  const bundle = buildSiteHandoffBundle(normalized, summary);
  const summaryJson = JSON.parse(bundle.files.find((file) => file.path === "summary.json").content);
  const bundleWorkspace = JSON.parse(bundle.files.find((file) => file.path === "website-workspace.tasks.json").content);

  assert.equal(summary.counts.executedWork, 1);
  assert.equal(summary.counts.verificationResults, 1);
  assert.equal(summary.counts.remainingRisks, 1);
  assert.equal(summary.counts.nextActions, 1);
  assert.match(report, /Implemented pricing CTA cleanup/);
  assert.match(report, /npm run lint passed/);
  assert.match(report, /Preview deploy still needs analytics review/);
  assert.match(report, /Attach before\/after screenshots/);
  assert.deepEqual(summaryJson.implementationEvidence, {
    executedWork: 1,
    verificationResults: 1,
    remainingRisks: 1,
    nextActions: 1,
  });
  assert.deepEqual(bundleWorkspace.implementationEvidence.executedWork, ["Implemented pricing CTA cleanup"]);
});

test("analyzeSiteWorkspace validates optional handoff evidence shape", () => {
  const workspace = createSampleSiteWorkspace();
  workspace.implementationEvidence = {
    executedWork: "not-an-array",
    verificationResults: [],
    remainingRisks: [],
    nextActions: [],
  };

  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "sample.json" });

  assert.equal(summary.status, "fail");
  assert.ok(summary.issues.some((issue) => issue.id === "implementation-evidence-executedWork"));
});

test("runSite prints JSON and writes report/prompt artifacts", async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, "workspace.json");
    const handoff = path.join(dir, "out", "handoff.md");
    const prompts = path.join(dir, "out", "prompts.md");
    const singlePrompt = path.join(dir, "out", "codex-implementation.md");
    const promptList = path.join(dir, "out", "prompt-templates.json");
    const mcpCheck = path.join(dir, "out", "mcp-check.json");
    const mcpPlan = path.join(dir, "out", "mcp-action-plan.md");
    const workflowGraph = path.join(dir, "out", "website-workflow-graph.json");
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

    const graphJsonOutput = await captureConsole(() => runSite([file, "--graph", "--json"]));
    const graphPayload = JSON.parse(graphJsonOutput.stdout);
    assert.equal(graphPayload.kind, "website-improvement-workflow-graph");
    assert.equal(graphPayload.summary.nodeCount, 35);
    assert.equal(graphPayload.summary.edgeCount, 67);

    const graphHumanOutput = await captureConsole(() => runSite([file, "--graph"]));
    assert.match(graphHumanOutput.stdout, /Website improvement workflow graph/);
    assert.match(graphHumanOutput.stdout, /No external MCP calls/);

    const graphWriteOutput = await captureConsole(() => runSite([file, "--graph", "--json", "--out", workflowGraph]));
    assert.match(graphWriteOutput.stdout, /Wrote /);
    assert.equal(JSON.parse(readFileSync(workflowGraph, "utf8")).kind, "website-improvement-workflow-graph");

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

    const bundleCheckOutput = await captureConsole(() => runSite([bundleDir, "--bundle-check", "--json"]));
    const bundleCheckPayload = JSON.parse(bundleCheckOutput.stdout);
    assert.equal(bundleCheckPayload.status, "pass");
    assert.equal(bundleCheckPayload.counts.presentFiles, 8);
    assert.equal(bundleCheckPayload.counts.verifiedGeneratedFiles, 7);
    assert.equal(bundleCheckPayload.counts.generatedFailures, 0);
    assert.equal(bundleCheckPayload.generatedContract.available, true);
    assert.deepEqual(bundleCheckPayload.generatedContract.driftFiles, []);
    assert.equal(bundleCheckPayload.repairGuidance.available, true);
    assert.match(bundleCheckPayload.repairGuidance.command, /website-workspace\.tasks\.json --bundle --out .* --force/);
    assert.deepEqual(bundleCheckPayload.summary.implementationEvidence, {
      executedWork: 0,
      verificationResults: 0,
      remainingRisks: 3,
      nextActions: 0,
    });

    const bundleCheckFile = path.join(dir, "out", "handoff-bundle-check.json");
    const bundleCheckWriteOutput = await captureConsole(() => runSite([bundleDir, "--bundle-check", "--json", "--out", bundleCheckFile]));
    assert.match(bundleCheckWriteOutput.stdout, /Wrote /);
    assert.equal(JSON.parse(readFileSync(bundleCheckFile, "utf8")).summary.totalTasks, 3);

    const bundleCompareOutput = await captureConsole(() => runSite([bundleDir, "--bundle-compare", bundleDir, "--json"]));
    const bundleComparePayload = JSON.parse(bundleCompareOutput.stdout);
    assert.equal(bundleComparePayload.status, "pass");
    assert.equal(bundleComparePayload.sameBundle, true);
    assert.equal(bundleComparePayload.left.verifiedGeneratedFiles, 7);
    assert.equal(bundleComparePayload.right.verifiedGeneratedFiles, 7);
    assert.deepEqual(bundleComparePayload.left.generatedDriftFiles, []);
    assert.deepEqual(bundleComparePayload.right.generatedDriftFiles, []);
    assert.deepEqual(bundleComparePayload.left.implementationEvidence, {
      executedWork: 0,
      verificationResults: 0,
      remainingRisks: 3,
      nextActions: 0,
    });

    const bundleCompareFile = path.join(dir, "out", "handoff-bundle-compare.json");
    const bundleCompareWriteOutput = await captureConsole(() => runSite([bundleDir, "--bundle-compare", bundleDir, "--json", "--out", bundleCompareFile]));
    assert.match(bundleCompareWriteOutput.stdout, /Wrote /);
    assert.equal(JSON.parse(readFileSync(bundleCompareFile, "utf8")).digestMatch, true);

    const bundleHandoffOutput = await captureConsole(() => runSite([bundleDir, "--bundle-handoff"]));
    assert.match(bundleHandoffOutput.stdout, /Website improvement target-repo handoff prompt/);
    assert.match(bundleHandoffOutput.stdout, /Task ID: task-accessibility/);

    const bundleHandoffJsonOutput = await captureConsole(() => runSite([bundleDir, "--bundle-handoff", "--json"]));
    const bundleHandoffPayload = JSON.parse(bundleHandoffJsonOutput.stdout);
    assert.equal(bundleHandoffPayload.status, "pass");
    assert.match(bundleHandoffPayload.bundle.checksumBundleDigest, /^[a-f0-9]{64}$/);
    assert.equal(bundleHandoffPayload.bundle.verifiedGeneratedFiles, 7);
    assert.equal(bundleHandoffPayload.bundle.generatedFailures, 0);
    assert.deepEqual(bundleHandoffPayload.bundle.generatedDriftFiles, []);
    assert.equal(bundleHandoffPayload.bundle.repairGuidance.available, true);
    assert.deepEqual(bundleHandoffPayload.bundle.implementationEvidence, {
      executedWork: 0,
      verificationResults: 0,
      remainingRisks: 3,
      nextActions: 0,
    });
    assert.match(bundleHandoffPayload.prompt, /Primary Codex Implementation Prompt/);
    assert.match(bundleHandoffPayload.prompt, /Repair guidance:\n- Available: yes/);

    const bundleHandoffFile = path.join(dir, "out", "target-repo-handoff.md");
    const bundleHandoffWriteOutput = await captureConsole(() => runSite([bundleDir, "--bundle-handoff", "--out", bundleHandoffFile]));
    assert.match(bundleHandoffWriteOutput.stdout, /Wrote /);
    assert.match(readFileSync(bundleHandoffFile, "utf8"), /Website improvement target-repo handoff prompt/);
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
    assert.deepEqual(sample.implementationEvidence.executedWork, []);
    assert.equal(sample.implementationEvidence.remainingRisks.length, 3);
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
  assert.match(output.stdout, /design-ai site <workspace\.json> --mcp-check \[--probes\] \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --mcp-plan \[--probes\] \[--strict\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --graph \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --tasks \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --bundle --out dir \[--strict\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <bundle-dir> --bundle-check \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <bundle-dir> --bundle-compare other-bundle-dir \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <bundle-dir> --bundle-handoff \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --prompt template-id \[--task id-or-number\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /--sample\s+Emit a valid sample Website Improvement workspace JSON/);
  assert.match(output.stdout, /--prompt-list\s+List Website Improvement prompt template ids/);
  assert.match(output.stdout, /--mcp-check\s+Check MCP readiness evidence and task\/MCP gaps/);
  assert.match(output.stdout, /--probes\s+Add read-only local URL\/path\/tool-handoff probes/);
  assert.match(output.stdout, /--mcp-plan\s+Generate a Markdown MCP readiness action plan/);
  assert.match(output.stdout, /--graph\s+Export a portable Website Improvement workflow graph/);
  assert.match(output.stdout, /--tasks\s+Emit workspace JSON with starter refactor tasks generated from audit findings/);
  assert.match(output.stdout, /--bundle\s+Write a complete local handoff bundle directory/);
  assert.match(output.stdout, /--bundle-check\s+Validate a generated handoff bundle directory/);
  assert.match(output.stdout, /--bundle-compare dir\s+Compare two generated handoff bundles/);
  assert.match(output.stdout, /--bundle-handoff\s+Generate a target-repo Codex handoff prompt/);
  assert.match(output.stdout, /--report\s+Generate a Markdown website improvement handoff report/);
  assert.match(output.stdout, /--prompts\s+Generate a Markdown bundle of Codex and Claude prompts/);
  assert.match(output.stdout, /--prompt id Generate one Markdown prompt template/);
  assert.match(output.stdout, /--task id\s+Select a refactor task by id or 1-based top-task number/);
});
