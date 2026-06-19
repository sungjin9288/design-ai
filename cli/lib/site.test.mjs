// Tests for cli/lib/site.mjs Website Improvement Console workspace handling.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
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
  buildSiteInitNextActionsReport,
  buildSiteIntakeNextActionsReport,
  buildSiteIntakeTemplateMarkdown,
  buildSiteBundleRepairBundle,
  buildSiteBundleRepairPreview,
  buildSiteMcpActionPlan,
  buildSiteMcpActionPlanData,
  buildSiteMcpCheckReport,
  buildSiteMcpProbeReport,
  buildSiteNextActionsReport,
  buildSiteBundleHandoffReport,
  buildSitePrompt,
  buildSitePromptBundle,
  buildSiteReport,
  buildSiteWorkflowGraph,
  createSiteWorkspaceFromInitOptions,
  createSiteWorkspaceFromIntakeMarkdown,
  createSampleSiteWorkspace,
  SITE_BUNDLE_FILES,
  SITE_BUNDLE_CHECKSUM_FILES,
  formatSiteBundleCheckHuman,
  formatSiteBundleCheckJson,
  formatSiteBundleCompareHuman,
  formatSiteBundleCompareJson,
  formatSiteJson,
  formatSiteIntakeTemplateJson,
  formatSiteBundleHandoffHuman,
  formatSiteBundleHandoffJson,
  formatSiteBundleRepairHuman,
  formatSiteBundleRepairJson,
  formatSiteMcpCheckHuman,
  formatSiteMcpCheckJson,
  formatSiteMcpActionPlanJson,
  formatSiteNextActionsHuman,
  formatSiteNextActionsJson,
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
    init: false,
    initProfile: {
      name: "",
      liveUrl: "",
      repoUrl: "",
      localPath: "",
      figmaUrl: "",
      brandNotes: "",
      deployProvider: "none",
      sentryProject: "",
      cms: "none",
      database: "none",
      pages: [],
      userFlows: [],
      viewports: [],
    },
    fromIntake: false,
    fromIntakePath: "",
    intakeTemplate: false,
    language: "en",
    sample: false,
    tasks: false,
    bundle: false,
    bundleCheck: false,
    bundleCompareTarget: "",
    bundleHandoff: false,
    bundleRepair: false,
    nextActions: false,
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
    yes: false,
    help: false,
  });

  assert.deepEqual(parseSiteArgs(["--stdin", "--report", "--out", "handoff.md", "--force"]), {
    target: "",
    stdin: true,
    init: false,
    initProfile: {
      name: "",
      liveUrl: "",
      repoUrl: "",
      localPath: "",
      figmaUrl: "",
      brandNotes: "",
      deployProvider: "none",
      sentryProject: "",
      cms: "none",
      database: "none",
      pages: [],
      userFlows: [],
      viewports: [],
    },
    fromIntake: false,
    fromIntakePath: "",
    intakeTemplate: false,
    language: "en",
    sample: false,
    tasks: false,
    bundle: false,
    bundleCheck: false,
    bundleCompareTarget: "",
    bundleHandoff: false,
    bundleRepair: false,
    nextActions: false,
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
    yes: false,
    help: false,
  });

  assert.equal(parseSiteArgs(["--help"]).help, true);
  assert.equal(parseSiteArgs(["workspace.json", "--prompts"]).prompts, true);
  assert.equal(parseSiteArgs(["workspace.json", "--prompt", "codex-implementation"]).promptTemplate, "codex-implementation");
  assert.equal(parseSiteArgs(["workspace.json", "--prompt", "codex-implementation", "--task", "task-accessibility"]).taskSelector, "task-accessibility");
  assert.equal(parseSiteArgs(["--sample", "--out", "website-workspace.json"]).sample, true);
  assert.equal(parseSiteArgs(["--intake-template", "--out", "company-website-intake.md"]).intakeTemplate, true);
  assert.equal(parseSiteArgs(["--intake-template", "--json"]).json, true);
  assert.equal(parseSiteArgs(["--intake-template", "--language", "ko"]).language, "ko");
  assert.equal(parseSiteArgs(["--from-intake", "--stdin", "--json"]).fromIntake, true);
  assert.equal(parseSiteArgs(["--from-intake", "--stdin", "--json"]).stdin, true);
  assert.equal(parseSiteArgs(["--from-intake", "company-website-intake.ko.md", "--next-actions", "--json"]).fromIntakePath, "company-website-intake.ko.md");
  assert.equal(parseSiteArgs(["--from-intake", "company-website-intake.ko.md", "--tasks", "--out", "website-workspace.tasks.json"]).tasks, true);
  assert.equal(parseSiteArgs(["--from-intake", "--stdin", "--tasks", "--out", "website-workspace.tasks.json"]).stdin, true);
  assert.equal(parseSiteArgs(["--from-intake", "company-website-intake.ko.md", "--bundle", "--out", "handoff-bundle"]).bundle, true);
  assert.equal(parseSiteArgs(["--from-intake", "company-website-intake.ko.md", "--bundle", "--tasks", "--out", "handoff-bundle"]).tasks, true);
  assert.equal(parseSiteArgs(["--prompt-list", "--json"]).promptList, true);
  assert.equal(parseSiteArgs(["workspace.json", "--mcp-check", "--json"]).mcpCheck, true);
  assert.equal(parseSiteArgs(["workspace.json", "--mcp-plan"]).mcpPlan, true);
  assert.equal(parseSiteArgs(["workspace.json", "--mcp-plan", "--json"]).json, true);
  assert.equal(parseSiteArgs(["workspace.json", "--mcp-check", "--probes", "--json"]).probes, true);
  assert.equal(parseSiteArgs(["workspace.json", "--next-actions", "--json"]).nextActions, true);
  assert.equal(parseSiteArgs(["--init", "--name", "Company", "--live-url", "https://example.com", "--next-actions", "--json"]).nextActions, true);
  assert.equal(parseSiteArgs(["--init", "--name", "Company", "--live-url", "https://example.com", "--bundle", "--out", "handoff-bundle"]).bundle, true);
  assert.equal(parseSiteArgs(["workspace.json", "--graph", "--json"]).graph, true);
  assert.equal(parseSiteArgs(["workspace.json", "--graph", "--out", "website-workflow-graph.md"]).outPath, "website-workflow-graph.md");
  assert.equal(parseSiteArgs(["workspace.json", "--tasks", "--out", "website-workspace.tasks.json"]).tasks, true);
  assert.equal(parseSiteArgs(["workspace.json", "--bundle", "--out", "handoff-bundle"]).bundle, true);
  assert.equal(parseSiteArgs(["handoff-bundle", "--bundle-check", "--json"]).bundleCheck, true);
  assert.equal(parseSiteArgs(["handoff-bundle", "--bundle-compare", "handoff-bundle.previous", "--json"]).bundleCompareTarget, "handoff-bundle.previous");
  assert.equal(parseSiteArgs(["handoff-bundle", "--bundle-handoff", "--json"]).bundleHandoff, true);
  assert.equal(parseSiteArgs(["handoff-bundle", "--bundle-handoff", "--task", "task-content-quality", "--json"]).taskSelector, "task-content-quality");
  assert.equal(parseSiteArgs(["handoff-bundle", "--bundle-repair", "--json"]).bundleRepair, true);
  assert.equal(parseSiteArgs(["handoff-bundle", "--bundle-repair", "--yes", "--json"]).yes, true);
  assert.equal(parseSiteArgs(["handoff-bundle", "--bundle-repair", "--json", "--out", "repair.json"]).outPath, "repair.json");
});

test("parseSiteArgs supports Website Improvement project init fields", () => {
  const parsed = parseSiteArgs([
    "--init",
    "--name",
    "Company marketing site",
    "--live-url",
    "https://example.com",
    "--repo-url",
    "https://github.com/acme/site",
    "--local-path",
    "/Users/sungjin/dev/acme-site",
    "--figma-url",
    "https://figma.com/file/acme",
    "--brand-notes",
    "Korean B2B SaaS tone",
    "--deploy",
    "vercel",
    "--sentry",
    "acme/site",
    "--cms",
    "sanity",
    "--database",
    "supabase",
    "--page",
    "/",
    "--page",
    "/pricing",
    "--flow",
    "Visitor compares plans and starts signup",
    "--flow",
    "Buyer checks proof before contacting sales",
    "--viewport",
    "desktop",
    "--viewport",
    "mobile",
    "--out",
    "website-workspace.json",
    "--force",
  ]);

  assert.equal(parsed.init, true);
  assert.equal(parsed.outPath, "website-workspace.json");
  assert.equal(parsed.force, true);
  assert.deepEqual(parsed.initProfile, {
    name: "Company marketing site",
    liveUrl: "https://example.com",
    repoUrl: "https://github.com/acme/site",
    localPath: "/Users/sungjin/dev/acme-site",
    figmaUrl: "https://figma.com/file/acme",
    brandNotes: "Korean B2B SaaS tone",
    deployProvider: "vercel",
    sentryProject: "acme/site",
    cms: "sanity",
    database: "supabase",
    pages: ["/", "/pricing"],
    userFlows: [
      "Visitor compares plans and starts signup",
      "Buyer checks proof before contacting sales",
    ],
    viewports: ["desktop", "mobile"],
  });
});

test("parseSiteArgs rejects invalid combinations and unknown options", () => {
  assert.throws(() => parseSiteArgs(["workspace.json", "--stdin"]), /either a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["--init"]), /--init requires --name/);
  assert.throws(() => parseSiteArgs(["--init", "--name", "Company"]), /--init requires --live-url/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--init", "--name", "Company", "--live-url", "https://example.com"]), /Use --init without a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["--stdin", "--init", "--name", "Company", "--live-url", "https://example.com"]), /Use --init without a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["--name", "Company"]), /only with --init/);
  assert.throws(() => parseSiteArgs(["--init", "--name"]), /--name requires a value/);
  assert.throws(() => parseSiteArgs(["--init", "--name", "Company", "--live-url", "https://example.com", "--deploy", "bad"]), /--deploy must be one of/);
  assert.throws(() => parseSiteArgs(["--init", "--name", "Company", "--live-url", "https://example.com", "--cms", "bad"]), /--cms must be one of/);
  assert.throws(() => parseSiteArgs(["--init", "--name", "Company", "--live-url", "https://example.com", "--database", "bad"]), /--database must be one of/);
  assert.throws(() => parseSiteArgs(["--init", "--name", "Company", "--live-url", "https://example.com", "--viewport", "watch"]), /--viewport must be one of/);
  assert.throws(() => parseSiteArgs(["--init", "--name", "Company", "--live-url", "https://example.com", "--sample"]), /Use --init without --sample/);
  assert.throws(() => parseSiteArgs(["--init", "--name", "Company", "--live-url", "https://example.com", "--mcp-check"]), /Use --init without --sample/);
  assert.throws(() => parseSiteArgs(["--init", "--name", "Company", "--live-url", "https://example.com", "--strict"]), /Use --init --strict only with --next-actions or --bundle/);
  assert.throws(() => parseSiteArgs(["--init", "--name", "Company", "--live-url", "https://example.com", "--bundle"]), /--bundle requires --out directory/);
  assert.throws(() => parseSiteArgs(["--init", "--name", "Company", "--live-url", "https://example.com", "--bundle", "--json", "--out", "bundle"]), /--json is not supported with --bundle/);
  assert.throws(() => parseSiteArgs(["--init", "--name", "Company", "--live-url", "https://example.com", "--bundle", "--next-actions", "--out", "bundle"]), /only one output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--intake-template"]), /Use --intake-template without a workspace JSON file path/);
  assert.throws(() => parseSiteArgs(["--stdin", "--intake-template"]), /Use --intake-template without a workspace JSON file path/);
  assert.throws(() => parseSiteArgs(["--intake-template", "--init"]), /Use --intake-template without a workspace JSON file path/);
  assert.throws(() => parseSiteArgs(["--intake-template", "--sample"]), /Use --intake-template only with --language, --json, --out, or --force/);
  assert.throws(() => parseSiteArgs(["--intake-template", "--strict"]), /Use --intake-template only with --language, --json, --out, or --force/);
  assert.throws(() => parseSiteArgs(["--intake-template", "--mcp-check"]), /Use --intake-template only with --language, --json, --out, or --force/);
  assert.throws(() => parseSiteArgs(["--intake-template", "--language"]), /--language requires a value/);
  assert.throws(() => parseSiteArgs(["--intake-template", "--language", "jp"]), /--language must be one of: en, ko/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--language", "ko"]), /Use --language only with --intake-template/);
  assert.throws(() => parseSiteArgs(["--from-intake"]), /--from-intake requires a file path or --stdin/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--from-intake", "company-website-intake.md"]), /Use --from-intake without a workspace JSON file path/);
  assert.throws(() => parseSiteArgs(["--from-intake", "company-website-intake.md", "--stdin"]), /Use --from-intake with either a file path or --stdin/);
  assert.throws(() => parseSiteArgs(["--from-intake", "company-website-intake.md", "--init"]), /Use --from-intake without --init or init profile fields/);
  assert.throws(() => parseSiteArgs(["--from-intake", "company-website-intake.md", "--name", "Company"]), /only with --init/);
  assert.throws(() => parseSiteArgs(["--from-intake", "company-website-intake.md", "--mcp-check"]), /Use --from-intake only with --json, --next-actions, --tasks, --bundle, --out, --strict, or --force/);
  assert.throws(() => parseSiteArgs(["--from-intake", "company-website-intake.md", "--strict"]), /Use --from-intake --strict only with --next-actions, --tasks, or --bundle/);
  assert.throws(() => parseSiteArgs(["--from-intake", "company-website-intake.md", "--bundle"]), /--bundle requires --out directory/);
  assert.throws(() => parseSiteArgs(["--from-intake", "company-website-intake.md", "--bundle", "--json", "--out", "bundle"]), /--json is not supported with --bundle/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--sample"]), /Use --sample without a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["--stdin", "--sample"]), /Use --sample without a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--prompt-list"]), /Use --prompt-list without a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["--stdin", "--prompt-list"]), /Use --prompt-list without a workspace JSON file path or --stdin/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--prompt", "codex-repo-intake"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--mcp-check"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--mcp-plan"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--next-actions"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--graph"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--bundle"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--bundle-check"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--bundle-handoff"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--bundle-repair"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["--prompt-list", "--strict"]), /Use --prompt-list without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-check", "--tasks"]), /Use --mcp-check without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-check", "--report"]), /Use --mcp-check without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-check", "--graph"]), /Use --mcp-check without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-plan", "--tasks"]), /Use --mcp-plan without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-plan", "--report"]), /Use --mcp-plan without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-plan", "--graph"]), /Use --mcp-plan without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-plan", "--next-actions"]), /Use --mcp-plan without --sample/);
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
  assert.throws(() => parseSiteArgs(["--stdin", "--bundle-repair"]), /Use --bundle-repair with a handoff bundle directory path/);
  assert.throws(() => parseSiteArgs(["--bundle-repair"]), /--bundle-repair requires a handoff bundle directory path/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--bundle-repair", "--bundle-check"]), /Use --bundle-check without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--bundle-repair", "--report"]), /Use --bundle-repair without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-plan", "--bundle-repair"]), /Use --mcp-plan without --sample/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--yes"]), /Use --yes only with --bundle-repair/);
  assert.throws(() => parseSiteArgs(["--sample", "--report"]), /Use --sample without --report, --prompts, --prompt, --next-actions, or --graph/);
  assert.throws(() => parseSiteArgs(["--sample", "--prompt", "codex-repo-intake"]), /Use --sample without --report, --prompts, --prompt, --next-actions, or --graph/);
  assert.throws(() => parseSiteArgs(["--sample", "--next-actions"]), /Use --sample without --report, --prompts, --prompt, --next-actions, or --graph/);
  assert.throws(() => parseSiteArgs(["--sample", "--graph"]), /Use --sample without --report, --prompts, --prompt, --next-actions, or --graph/);
  assert.throws(() => parseSiteArgs(["--sample", "--tasks"]), /Use only one generated workspace mode/);
  assert.throws(() => parseSiteArgs(["--sample", "--bundle", "--out", "bundle"]), /Use --bundle without --sample/);
  assert.throws(() => parseSiteArgs(["--sample", "--strict"]), /Use --sample without --strict/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--tasks", "--json"]), /Use --tasks without --json/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--tasks", "--next-actions"]), /Use --tasks without --json, --next-actions/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--tasks", "--report"]), /Use --tasks without --json/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--tasks", "--graph"]), /Use --tasks without --json, --next-actions, --graph/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--tasks", "--prompt", "codex-implementation"]), /Use --tasks without --prompt/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--bundle", "--tasks", "--out", "bundle"]), /Use --bundle without --sample, --tasks/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--report", "--prompts"]), /only one output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--prompts", "--prompt", "codex-implementation"]), /only one output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--mcp-check", "--mcp-plan"]), /only one output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--next-actions", "--graph"]), /only one output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--graph", "--report"]), /only one output mode/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--probes"]), /Use --probes only with --mcp-check or --mcp-plan/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--report", "--json"]), /--json is only supported/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--prompt"]), /--prompt requires a template id/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--prompt", "bad-template"]), /--prompt must be one of/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--task"]), /--task requires a refactor task id/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--task", "task-homepage-cta"]), /Use --task only with --prompt or --bundle-handoff/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--prompt", "claude-design-review", "--task", "task-homepage-cta"]), /Use --task only with --prompt codex-implementation/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--out", "x.md"]), /--out requires/);
  assert.throws(() => parseSiteArgs(["workspace.json", "extra.json"]), /Unexpected argument/);
  assert.throws(() => parseSiteArgs(["workspace.json", "--jsn"]), /Did you mean `--json`\?/);
});

test("createSiteWorkspaceFromInitOptions creates a valid real-project workspace", () => {
  const workspace = createSiteWorkspaceFromInitOptions({
    name: "Company marketing site",
    liveUrl: "https://example.com",
    repoUrl: "https://github.com/acme/site",
    localPath: "/Users/sungjin/dev/acme-site",
    figmaUrl: "https://figma.com/file/acme",
    brandNotes: "Korean B2B SaaS tone",
    deployProvider: "vercel",
    sentryProject: "acme/site",
    cms: "sanity",
    database: "supabase",
    pages: ["/", "/pricing", "/pricing"],
    userFlows: ["Visitor compares plans and starts signup"],
    viewports: ["desktop", "mobile"],
  });
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "company.json" });

  assert.equal(workspace.version, 1);
  assert.match(workspace.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(workspace.siteProfile.id, "company-marketing-site");
  assert.equal(workspace.siteProfile.name, "Company marketing site");
  assert.equal(workspace.siteProfile.liveUrl, "https://example.com");
  assert.deepEqual(workspace.siteProfile.pages, ["/", "/pricing"]);
  assert.deepEqual(workspace.siteProfile.viewports, ["desktop", "mobile"]);
  assert.equal(workspace.mcpReadiness.github, "required");
  assert.equal(workspace.mcpReadiness.browser, "required");
  assert.equal(workspace.mcpReadiness.deploy, "required");
  assert.equal(workspace.mcpReadiness.figma, "optional");
  assert.equal(workspace.mcpReadiness.cms, "optional");
  assert.equal(workspace.mcpReadiness.database, "optional");
  assert.deepEqual(workspace.refactorTasks, []);
  assert.match(workspace.auditChecklist["ux-flow"].notes, /Visitor compares plans/);
  assert.match(workspace.reportNotes, /design-ai site --init/);
  assert.equal(summary.status, "pass");
  assert.equal(summary.counts.pages, 2);
  assert.equal(summary.counts.refactorTasks, 0);

  const minimal = createSiteWorkspaceFromInitOptions({
    name: "Internal site",
    liveUrl: "https://internal.example.com",
  });
  assert.deepEqual(minimal.siteProfile.pages, ["/"]);
  assert.deepEqual(minimal.siteProfile.viewports, ["desktop", "tablet", "mobile"]);
  assert.equal(minimal.mcpReadiness.github, "optional");
  assert.equal(minimal.mcpReadiness.deploy, "optional");
  assert.equal(minimal.mcpReadiness.figma, "unused");
  assert.equal(minimal.mcpReadiness.cms, "unused");
  assert.equal(minimal.mcpReadiness.database, "unused");
});

test("buildSiteInitNextActionsReport prepends a durable workspace save action", () => {
  const workspace = createSiteWorkspaceFromInitOptions({
    name: "Company marketing site",
    liveUrl: "https://example.com",
    repoUrl: "https://github.com/acme/site",
    deployProvider: "vercel",
    pages: ["/", "/pricing"],
    userFlows: ["Visitor compares plans and starts signup"],
    viewports: ["desktop", "mobile"],
  });
  const report = buildSiteInitNextActionsReport(workspace);
  const json = JSON.parse(formatSiteNextActionsJson(report));
  const human = formatSiteNextActionsHuman(report);

  assert.equal(json.kind, "website-improvement-next-actions");
  assert.equal(json.mode, "init-next-actions");
  assert.equal(json.filePath, "website-workspace.json");
  assert.equal(json.actions[0].title, "Save the generated Website Improvement workspace");
  assert.match(json.actions[0].command, /design-ai site --init/);
  assert.match(json.actions[0].command, /--out website-workspace\.json/);
  assert.equal(json.commands.createWorkspace, json.actions[0].command);
  assert.match(json.commands.tasks, /design-ai site website-workspace\.json --tasks/);
  assert.match(human, /Save the generated Website Improvement workspace/);
  assert.match(human, /This init next-action report is deterministic and local/);
});

test("createSiteWorkspaceFromIntakeMarkdown parses a filled Korean company intake", () => {
  const markdown = `# 회사 웹사이트 Intake Template

## Site Profile

| 항목 | 값 |
|---|---|
| 사이트 이름 | RAPA company site |
| Live URL | https://rapa.example.com |
| 대상 repo URL | https://github.com/acme/rapa-site |
| 대상 repo local path | /Users/sungjin/dev/rapa-site |
| Figma URL | https://figma.com/file/rapa |
| 배포 플랫폼 | vercel |
| Sentry 프로젝트 | acme/rapa-web |
| CMS | wordpress |
| Database | none |

## 우선순위 페이지

| 우선순위 | Path 또는 URL | 중요한 이유 |
|---:|---|---|
| 1 | / | 첫 인상과 CTA |
| 2 | /programs | 교육 과정 전환 |

## 주요 사용자 흐름

| 우선순위 | Flow | 성공 신호 |
|---:|---|---|
| 1 | 방문자가 교육 과정을 비교하고 신청 CTA를 클릭 | 신청 CTA 클릭 |

## Brand And Content Notes

| 영역 | 메모 |
|---|---|
| 브랜드 톤 | 공공기관 신뢰감과 명확한 한국어 카피 |
| 한국어 카피 규칙 | 과장 표현을 피하고 지원 요건을 먼저 보여줌 |

## MCP Readiness Notes

| 시스템 | 상태 | 근거 또는 fallback |
|---|---|---|
| GitHub | required | repo 접근 필요 |
| Figma | optional | 디자인 파일 확인 가능 |
| Browser / Playwright | required | 실제 페이지 QA |
| Chrome DevTools | optional | console/network 확인 |
| 배포 플랫폼 | required | Vercel preview 확인 |
| Sentry | optional | production issue 확인 |
| Database | unused | DB 없음 |
| CMS | required | WordPress 콘텐츠 |
| 협업 도구 | optional | 내부 피드백 |
| 리서치 도구 | unused | 이번 pilot 제외 |

## 초기 Audit Findings

| Category | Finding | Evidence | Page |
|---|---|---|---|
| Visual design | Hero CTA hierarchy is weak | Primary and secondary buttons compete | / |
| Accessibility | Mobile menu focus state is unclear | Keyboard focus ring not documented | / |
`;

  const workspace = createSiteWorkspaceFromIntakeMarkdown(markdown, {
    filePath: "company-website-intake.ko.md",
  });
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "website-workspace.json" });
  const taskWorkspace = generateSiteRefactorTasks(workspace).workspace;
  const nextActions = buildSiteIntakeNextActionsReport(workspace, summary, {
    intakePath: "company-website-intake.ko.md",
  });

  assert.equal(workspace.siteProfile.id, "rapa-company-site");
  assert.equal(workspace.siteProfile.name, "RAPA company site");
  assert.equal(workspace.siteProfile.liveUrl, "https://rapa.example.com");
  assert.equal(workspace.siteProfile.repoUrl, "https://github.com/acme/rapa-site");
  assert.equal(workspace.siteProfile.localPath, "/Users/sungjin/dev/rapa-site");
  assert.equal(workspace.siteProfile.deployProvider, "vercel");
  assert.equal(workspace.siteProfile.cms, "wordpress");
  assert.deepEqual(workspace.siteProfile.pages, ["/", "/programs"]);
  assert.deepEqual(workspace.siteProfile.userFlows, ["방문자가 교육 과정을 비교하고 신청 CTA를 클릭"]);
  assert.match(workspace.siteProfile.brandNotes, /공공기관 신뢰감/);
  assert.equal(workspace.mcpReadiness.github, "required");
  assert.equal(workspace.mcpReadiness.cms, "required");
  assert.equal(workspace.mcpReadiness.research, "unused");
  assert.equal(workspace.auditChecklist["visual-design"].status, "in-progress");
  assert.match(workspace.auditChecklist["visual-design"].findings[0], /Hero CTA hierarchy is weak/);
  assert.match(workspace.auditChecklist.accessibility.findings[0], /Keyboard focus ring not documented/);
  assert.match(workspace.reportNotes, /--from-intake company-website-intake\.ko\.md/);
  assert.equal(summary.status, "pass");
  assert.ok(taskWorkspace.refactorTasks.some((task) => task.id === "task-visual-design"));
  assert.ok(taskWorkspace.refactorTasks.some((task) => task.id === "task-accessibility"));
  assert.equal(nextActions.mode, "from-intake-next-actions");
  assert.equal(nextActions.actions[0].title, "Save the parsed Website Improvement workspace");
  assert.equal(nextActions.commands.createWorkspace, "design-ai site --from-intake company-website-intake.ko.md --out website-workspace.json --force");
});

test("buildSiteIntakeTemplateMarkdown emits a company pilot intake form", () => {
  const markdown = buildSiteIntakeTemplateMarkdown();
  const json = JSON.parse(formatSiteIntakeTemplateJson());

  assert.match(markdown, /^# Company Website Intake Template/);
  assert.match(markdown, /Keep sensitive credentials, private tokens, production secrets, and customer data out of this document/);
  assert.match(markdown, /## Site Profile/);
  assert.match(markdown, /## Priority Pages/);
  assert.match(markdown, /## MCP Readiness Notes/);
  assert.match(markdown, /design-ai site --init \\/);
  assert.match(markdown, /design-ai site website-handoff-bundle --bundle-check --strict --json/);
  assert.match(markdown, /## Target Repo Verification Plan/);
  assert.match(markdown, /## Stop Conditions/);

  assert.deepEqual(Object.keys(json), [
    "kind",
    "version",
    "format",
    "language",
    "recommendedFileName",
    "sections",
    "privacy",
    "commands",
    "content",
  ]);
  assert.equal(json.kind, "website-improvement-intake-template");
  assert.equal(json.version, 1);
  assert.equal(json.format, "markdown");
  assert.equal(json.language, "en");
  assert.equal(json.recommendedFileName, "company-website-intake.md");
  assert.deepEqual(json.privacy, {
    storesCredentials: false,
    storesProductionSecrets: false,
    storesCustomerData: false,
  });
  assert.equal(json.sections.includes("first-bundle-commands"), true);
  assert.match(json.commands.bundle, /--bundle --out website-handoff-bundle --strict/);
  assert.equal(json.content, markdown);

  const koreanMarkdown = buildSiteIntakeTemplateMarkdown({ language: "ko" });
  const koreanJson = JSON.parse(formatSiteIntakeTemplateJson({ language: "ko" }));
  assert.match(koreanMarkdown, /^# 회사 웹사이트 Intake Template/);
  assert.match(koreanMarkdown, /민감한 credential, private token, production secret, 고객 데이터/);
  assert.match(koreanMarkdown, /## 우선순위 페이지/);
  assert.match(koreanMarkdown, /## 주요 사용자 흐름/);
  assert.match(koreanMarkdown, /## 초기 Audit Findings/);
  assert.match(koreanMarkdown, /design-ai site --init \\/);
  assert.equal(koreanJson.language, "ko");
  assert.equal(koreanJson.recommendedFileName, "company-website-intake.ko.md");
  assert.equal(koreanJson.content, koreanMarkdown);
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
  assert.doesNotMatch(human, /Probe commands:/);

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
  const probeJson = JSON.parse(formatSiteMcpCheckJson(probeReport));
  const standaloneProbeReport = buildSiteMcpProbeReport(workspace);
  const human = formatSiteMcpCheckHuman(probeReport);

  assert.equal(Object.hasOwn(defaultReport, "probes"), false);
  assert.equal(Object.hasOwn(defaultReport, "commands"), false);
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
  assert.deepEqual(Object.keys(probeJson), [
    "filePath",
    "status",
    "workspaceStatus",
    "site",
    "counts",
    "items",
    "taskGaps",
    "workspaceIssues",
    "nextActions",
    "probes",
    "commands",
  ]);
  assert.equal(
    probeJson.commands.mcpCheckProbesHumanOut,
    "design-ai site sample.json --mcp-check --probes --out mcp-check-probes.txt",
  );
  assert.equal(
    probeJson.commands.mcpCheckProbesJsonOut,
    "design-ai site sample.json --mcp-check --probes --json --out mcp-check-probes.json",
  );
  assert.equal(
    probeJson.commands.mcpPlanProbesJson,
    "design-ai site sample.json --mcp-plan --probes --json",
  );
  assert.equal(
    probeJson.commands.mcpPlanProbesJsonOut,
    "design-ai site sample.json --mcp-plan --probes --json --out mcp-action-plan-probes.json",
  );
  assert.equal(standaloneProbeReport.status, "pass");
  assert.match(human, /Read-only probes:/);
  assert.match(human, /GitHub repo reference/);
  assert.match(human, /Probe commands:/);
  assert.match(human, /Save readiness probe report: `design-ai site sample\.json --mcp-check --probes --out mcp-check-probes\.txt`/);
  assert.match(human, /Save readiness probe JSON: `design-ai site sample\.json --mcp-check --probes --json --out mcp-check-probes\.json`/);
  assert.match(human, /Generate probe action plan JSON: `design-ai site sample\.json --mcp-plan --probes --json`/);
  assert.match(human, /Save probe action plan JSON: `design-ai site sample\.json --mcp-plan --probes --json --out mcp-action-plan-probes\.json`/);

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

test("buildSiteNextActionsReport ranks local operator actions", () => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "sample.json" });
  const report = buildSiteNextActionsReport(workspace, summary);
  const json = JSON.parse(formatSiteNextActionsJson(report));
  const human = formatSiteNextActionsHuman(report);

  assert.equal(report.kind, "website-improvement-next-actions");
  assert.equal(report.version, 1);
  assert.equal(report.status, "pass");
  assert.equal(report.workspaceStatus, "pass");
  assert.equal(report.mcpStatus, "pass");
  assert.equal(report.mcpProbeStatus, "pass");
  assert.deepEqual(report.mcpProbeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.equal(report.externalCalls, false);
  assert.equal(report.targetRepoMutation, false);
  assert.equal(report.counts.blocking, 0);
  assert.equal(report.counts.tasks, 1);
  assert.equal(report.counts.probeGaps, 0);
  assert.deepEqual(report.actions.map((action) => action.rank), [1, 2, 3]);
  assert.deepEqual(report.commands, {
    summary: "design-ai site sample.json --json",
    mcpCheck: "design-ai site sample.json --mcp-check --strict --json",
    mcpPlan: "design-ai site sample.json --mcp-plan --out mcp-action-plan.md",
    mcpCheckProbes: "design-ai site sample.json --mcp-check --probes --json --out mcp-check-probes.json",
    mcpPlanProbes: "design-ai site sample.json --mcp-plan --probes --json --out mcp-action-plan-probes.json",
    tasks: "design-ai site sample.json --tasks --out website-workspace.tasks.json",
    implementationPrompt: "design-ai site sample.json --prompt codex-implementation --task 1 --out codex-implementation.md",
    handoffReport: "design-ai site sample.json --report --out website-handoff.md",
    handoffBundle: "design-ai site sample.json --bundle --out website-handoff-bundle",
  });
  assert.deepEqual(json.commands, report.commands);

  const stdinSummary = analyzeSiteWorkspace(workspace, { filePath: "stdin" }).summary;
  const stdinReport = buildSiteNextActionsReport(workspace, stdinSummary);
  const stdinJson = JSON.parse(formatSiteNextActionsJson(stdinReport));
  assert.equal(stdinReport.filePath, "stdin");
  assert.deepEqual(stdinReport.commands, {
    summary: "design-ai site <workspace.json> --json",
    mcpCheck: "design-ai site <workspace.json> --mcp-check --strict --json",
    mcpPlan: "design-ai site <workspace.json> --mcp-plan --out mcp-action-plan.md",
    mcpCheckProbes: "design-ai site <workspace.json> --mcp-check --probes --json --out mcp-check-probes.json",
    mcpPlanProbes: "design-ai site <workspace.json> --mcp-plan --probes --json --out mcp-action-plan-probes.json",
    tasks: "design-ai site <workspace.json> --tasks --out website-workspace.tasks.json",
    implementationPrompt: "design-ai site <workspace.json> --prompt codex-implementation --task 1 --out codex-implementation.md",
    handoffReport: "design-ai site <workspace.json> --report --out website-handoff.md",
    handoffBundle: "design-ai site <workspace.json> --bundle --out website-handoff-bundle",
  });
  assert.deepEqual(stdinJson.commands, stdinReport.commands);

  const baseTask = workspace.refactorTasks[0];
  const priorityWorkspace = {
    ...workspace,
    refactorTasks: [
      baseTask,
      {
        ...baseTask,
        id: "task-secondary-content",
        title: "Tune secondary content proof",
        category: "content-quality",
        priority: "p2",
        recommendedMcp: ["research"],
      },
      {
        ...baseTask,
        id: "task-critical-accessibility",
        title: "Fix critical navigation accessibility",
        category: "accessibility",
        priority: "p0",
        recommendedMcp: ["browser"],
      },
      {
        ...baseTask,
        id: "task-later-polish",
        title: "Polish lower-priority page details",
        category: "visual-design",
        priority: "p3",
        recommendedMcp: ["browser"],
      },
    ],
  };
  const prioritySummary = analyzeSiteWorkspace(priorityWorkspace, { filePath: "priority.json" }).summary;
  const priorityReport = buildSiteNextActionsReport(priorityWorkspace, prioritySummary);
  assert.equal(priorityReport.counts.tasks, 4);
  assert.equal(priorityReport.topTasks.length, 3);
  assert.deepEqual(priorityReport.topTasks.map((task) => task.id), [
    "task-critical-accessibility",
    "task-homepage-cta",
    "task-secondary-content",
  ]);
  assert.equal(priorityReport.topTasks.some((task) => task.id === "task-later-polish"), false);
  assert.deepEqual(priorityReport.topTasks.map((task) => task.priority), ["p0", "p1", "p2"]);
  assert.equal(priorityReport.actions[0].severity, "implementation");
  assert.equal(priorityReport.actions[0].title, "Prepare Codex implementation prompt for task-critical-accessibility");
  assert.match(priorityReport.actions[0].reason, /highest-priority available refactor task/);

  assert.equal(report.actions[0].severity, "implementation");
  assert.equal(report.actions[0].command, "design-ai site sample.json --prompt codex-implementation --task 1 --out codex-implementation.md");
  const evidenceAction = report.actions.find((action) => action.title === "Create implementation evidence trail");
  assert.equal(evidenceAction?.severity, "handoff");
  assert.equal(evidenceAction?.command, "design-ai site sample.json --report --out website-handoff.md");
  assert.equal(report.actions.at(-1).command, "design-ai site sample.json --bundle --out website-handoff-bundle");
  assert.deepEqual(Object.keys(json), [
    "kind",
    "version",
    "filePath",
    "status",
    "workspaceStatus",
    "mcpStatus",
    "mcpProbeStatus",
    "mcpProbeCounts",
    "site",
    "counts",
    "topTasks",
    "actions",
    "commands",
    "boundaries",
    "externalCalls",
    "targetRepoMutation",
  ]);
  assert.match(human, /Website Improvement next actions: Korean SaaS marketing site/);
  assert.match(human, /MCP probe status: pass/);
  assert.match(human, /MCP probes: 4\/4 passing, 0 warning, 0 failing/);
  assert.match(human, /1\. \[implementation\] Prepare Codex implementation prompt/);
  assert.match(human, /Command: `design-ai site sample\.json --prompt codex-implementation --task 1 --out codex-implementation\.md`/);
  assert.match(human, /Create implementation evidence trail/);
  assert.match(human, /Command: `design-ai site sample\.json --report --out website-handoff\.md`/);
  assert.match(human, /does not call external MCPs, mutate the target website repo/);

  const evidenceReadyWorkspace = {
    ...workspace,
    implementationEvidence: {
      executedWork: ["Implemented homepage CTA hierarchy"],
      verificationResults: ["npm run build passed"],
      remainingRisks: [],
      nextActions: [],
    },
  };
  const evidenceReadySummary = analyzeSiteWorkspace(evidenceReadyWorkspace, { filePath: "evidence-ready.json" }).summary;
  const evidenceReadyReport = buildSiteNextActionsReport(evidenceReadyWorkspace, evidenceReadySummary);
  assert.equal(evidenceReadyReport.status, "pass");
  assert.equal(evidenceReadyReport.actions.some((action) => action.title === "Create implementation evidence trail"), false);
  assert.equal(evidenceReadyReport.actions[0].severity, "implementation");
  assert.equal(evidenceReadyReport.actions.at(-1).command, "design-ai site evidence-ready.json --bundle --out website-handoff-bundle");

  const optionalMissingWorkspace = {
    ...workspace,
    siteProfile: {
      ...workspace.siteProfile,
      sentryProject: "",
    },
  };
  const optionalMissingSummary = analyzeSiteWorkspace(optionalMissingWorkspace, { filePath: "optional-missing.json" }).summary;
  const optionalMissingReport = buildSiteNextActionsReport(optionalMissingWorkspace, optionalMissingSummary);
  const optionalMissingHuman = formatSiteNextActionsHuman(optionalMissingReport);
  assert.equal(optionalMissingReport.status, "warn");
  assert.deepEqual(optionalMissingReport.actions.map((action) => action.rank), [1, 2, 3, 4]);
  assert.equal(optionalMissingReport.actions[0].severity, "warning");
  assert.equal(optionalMissingReport.actions[0].title, "Clarify optional MCP readiness: Sentry");
  assert.equal(optionalMissingReport.actions[0].command, "design-ai site optional-missing.json --mcp-plan --out mcp-action-plan.md");
  assert.match(optionalMissingReport.actions[0].reason, /siteProfile\.sentryProject/);
  assert.match(optionalMissingHuman, /1\. \[warning\] Clarify optional MCP readiness: Sentry/);
  assert.match(optionalMissingHuman, /Command: `design-ai site optional-missing\.json --mcp-plan --out mcp-action-plan\.md`/);

  const taskGapWorkspace = {
    ...workspace,
    mcpReadiness: {
      ...workspace.mcpReadiness,
      figma: "unused",
    },
  };
  const taskGapSummary = analyzeSiteWorkspace(taskGapWorkspace, { filePath: "task-gap.json" }).summary;
  const taskGapReport = buildSiteNextActionsReport(taskGapWorkspace, taskGapSummary);
  assert.equal(taskGapReport.status, "warn");
  assert.equal(taskGapReport.counts.taskGaps, 1);
  assert.equal(taskGapReport.actions[0].severity, "warning");
  assert.equal(taskGapReport.actions[0].title, "Align MCP status for task-homepage-cta");
  assert.equal(taskGapReport.actions[0].command, "design-ai site task-gap.json --mcp-plan --out mcp-action-plan.md");
  assert.deepEqual(taskGapReport.actions[0].references, ["task-homepage-cta", "figma"]);
  assert.match(taskGapReport.actions[0].reason, /recommends figma/);

  const probeGapWorkspace = {
    ...workspace,
    siteProfile: {
      ...workspace.siteProfile,
      repoUrl: "https://example.com/not-github",
      localPath: "/definitely/not/a/repo",
      figmaUrl: "not-a-figma-url",
    },
  };
  const probeGapSummary = analyzeSiteWorkspace(probeGapWorkspace, { filePath: "probe-gap.json" }).summary;
  const probeGapReport = buildSiteNextActionsReport(probeGapWorkspace, probeGapSummary);
  const probeGapHuman = formatSiteNextActionsHuman(probeGapReport);
  assert.equal(probeGapReport.status, "fail");
  assert.equal(probeGapReport.mcpStatus, "pass");
  assert.equal(probeGapReport.mcpProbeStatus, "fail");
  assert.deepEqual(probeGapReport.mcpProbeCounts, {
    count: 4,
    pass: 2,
    warn: 1,
    fail: 1,
  });
  assert.equal(probeGapReport.counts.probeGaps, 2);
  assert.deepEqual(probeGapReport.actions.map((action) => action.rank), [1, 2, 3, 4, 5]);
  assert.equal(probeGapReport.actions[0].severity, "blocking");
  assert.equal(probeGapReport.actions[0].title, "Resolve MCP probe readiness: GitHub repo reference");
  assert.equal(probeGapReport.actions[0].command, "design-ai site probe-gap.json --mcp-check --probes --json --out mcp-check-probes.json");
  assert.deepEqual(probeGapReport.actions[0].references, ["github-repo-reference", "github"]);
  assert.equal(probeGapReport.actions[1].severity, "warning");
  assert.equal(probeGapReport.actions[1].title, "Resolve MCP probe readiness: Figma file reference");
  assert.equal(probeGapReport.actions[1].command, "design-ai site probe-gap.json --mcp-plan --probes --json --out mcp-action-plan-probes.json");
  assert.deepEqual(probeGapReport.actions[1].references, ["figma-url-reference", "figma"]);
  assert.match(probeGapHuman, /MCP probe status: fail/);
  assert.match(probeGapHuman, /MCP probes: 2\/4 passing, 1 warning, 1 failing/);
  assert.match(probeGapHuman, /Resolve MCP probe readiness: GitHub repo reference/);
  assert.match(probeGapHuman, /Command: `design-ai site probe-gap\.json --mcp-check --probes --json --out mcp-check-probes\.json`/);

  const setupWorkspace = {
    ...workspace,
    refactorTasks: [],
  };
  const setupSummary = analyzeSiteWorkspace(setupWorkspace, { filePath: "setup.json" }).summary;
  const setupReport = buildSiteNextActionsReport(setupWorkspace, setupSummary);
  const setupHuman = formatSiteNextActionsHuman(setupReport);
  assert.equal(setupReport.status, "pass");
  assert.equal(setupReport.counts.tasks, 0);
  assert.deepEqual(setupReport.topTasks, []);
  assert.equal(setupReport.actions[0].severity, "setup");
  assert.equal(setupReport.actions[0].title, "Generate starter refactor tasks");
  assert.equal(setupReport.actions[0].command, "design-ai site setup.json --tasks --out website-workspace.tasks.json");
  assert.match(setupHuman, /1\. \[setup\] Generate starter refactor tasks/);
  assert.match(setupHuman, /Command: `design-ai site setup\.json --tasks --out website-workspace\.tasks\.json`/);

  const blockedWorkspace = {
    ...workspace,
    siteProfile: {
      ...workspace.siteProfile,
      repoUrl: "",
      localPath: "",
    },
  };
  const blockedSummary = analyzeSiteWorkspace(blockedWorkspace, { filePath: "blocked.json" }).summary;
  const blockedReport = buildSiteNextActionsReport(blockedWorkspace, blockedSummary);
  const blockedJson = JSON.parse(formatSiteNextActionsJson(blockedReport));
  const blockedHuman = formatSiteNextActionsHuman(blockedReport);
  assert.equal(blockedReport.status, "fail");
  assert.equal(blockedReport.counts.blocking, 2);
  assert.deepEqual(blockedReport.actions.map((action) => action.rank), blockedReport.actions.map((_, index) => index + 1));
  assert.equal(blockedReport.actions[0].rank, 1);
  assert.equal(blockedReport.actions[0].title, "Add required MCP readiness: GitHub");
  assert.match(blockedReport.actions[0].reason, /siteProfile\.repoUrl/);
  assert.equal(blockedJson.counts.requiredMcpMissing, 1);
  assert.equal(blockedJson.actions[0].severity, "blocking");
  assert.equal(blockedJson.actions[0].command, "design-ai site blocked.json --mcp-check --strict --json");
  assert.equal(blockedJson.actions[1].title, "Resolve MCP probe readiness: GitHub repo reference");
  assert.equal(blockedJson.actions[1].command, "design-ai site blocked.json --mcp-check --probes --json --out mcp-check-probes.json");
  assert.match(blockedHuman, /1\. \[blocking\] Add required MCP readiness: GitHub/);
  assert.match(blockedHuman, /Command: `design-ai site blocked\.json --mcp-check --strict --json`/);
  assert.match(blockedHuman, /2\. \[blocking\] Resolve MCP probe readiness: GitHub repo reference/);
});

test("buildSiteMcpActionPlan turns MCP readiness into Markdown execution guidance", () => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "sample.json" });
  const data = buildSiteMcpActionPlanData(workspace, summary);
  const json = JSON.parse(formatSiteMcpActionPlanJson(data));
  const plan = buildSiteMcpActionPlan(workspace, summary);

  assert.equal(data.kind, "website-improvement-mcp-action-plan");
  assert.equal(data.version, 1);
  assert.equal(data.status, "pass");
  assert.equal(data.filePath, "sample.json");
  assert.equal(data.externalCalls, false);
  assert.equal(data.targetRepoMutation, false);
  assert.equal(data.readinessMatrix[0].key, "github");
  assert.equal(data.taskAlignment[0].task, "task-homepage-cta");
  assert.match(data.commands.mcpCheck, /design-ai site sample\.json --mcp-check --strict --json/);
  assert.equal(
    data.commands.mcpCheckProbesHumanOut,
    "design-ai site sample.json --mcp-check --probes --out mcp-check-probes.txt",
  );
  assert.equal(
    data.commands.mcpCheckProbesJsonOut,
    "design-ai site sample.json --mcp-check --probes --json --out mcp-check-probes.json",
  );
  assert.equal(
    data.commands.mcpPlanProbesJsonOut,
    "design-ai site sample.json --mcp-plan --probes --json --out mcp-action-plan-probes.json",
  );
  assert.deepEqual(Object.keys(json), [
    "kind",
    "version",
    "filePath",
    "status",
    "workspaceStatus",
    "site",
    "counts",
    "readinessMatrix",
    "probes",
    "blockingItems",
    "warnings",
    "taskAlignment",
    "taskGaps",
    "workspaceIssues",
    "nextActions",
    "executionSequence",
    "commands",
    "boundaries",
    "externalCalls",
    "targetRepoMutation",
  ]);
  assert.match(plan, /# Website improvement MCP action plan: Korean SaaS marketing site/);
  assert.match(plan, /## Readiness Matrix/);
  assert.match(plan, /\| GitHub \| required \| ready \| pass \|/);
  assert.match(plan, /## Blocking Items\n- No blocking readiness issues\./);
  assert.match(plan, /## Task\/MCP Alignment/);
  assert.match(plan, /task-homepage-cta/);
  assert.match(plan, /design-ai site sample\.json --mcp-check --strict --json/);
  assert.match(plan, /design-ai site sample\.json --mcp-check --probes --out mcp-check-probes\.txt/);
  assert.match(plan, /design-ai site sample\.json --mcp-check --probes --json --out mcp-check-probes\.json/);
  assert.match(plan, /design-ai site sample\.json --mcp-plan --probes --json --out mcp-action-plan-probes\.json/);
  assert.match(plan, /does not call external MCPs, mutate the target website repo/);

  const probePlan = buildSiteMcpActionPlan(workspace, summary, { probes: true });
  const probeJson = JSON.parse(formatSiteMcpActionPlanJson(buildSiteMcpActionPlanData(workspace, summary, { probes: true })));
  assert.equal(probeJson.probes.status, "pass");
  assert.equal(probeJson.probes.externalCalls, false);
  assert.equal(probeJson.probes.items[0].id, "github-repo-reference");
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
    "mcp-probes.json",
    "mcp-action-plan.md",
    "website-handoff.md",
    "website-prompts.md",
    "codex-implementation.md",
  ]);
  assert.match(files["README.md"], /Website improvement handoff bundle/);
  assert.match(files["README.md"], /does not call external MCPs/);
  assert.match(files["README.md"], /MCP probes: 4\/4 passing/);
  assert.match(files["README.md"], /Strict-ready: yes/);
  assert.match(files["README.md"], /Recommended command: `design-ai site <bundle-dir> --bundle-handoff --strict --out target-repo-handoff\.md`/);
  assert.match(files["README.md"], /Target Repo Execution Checklist/);
  assert.match(files["README.md"], /Confirm target repo working directory/);
  assert.match(files["mcp-probes.json"], /"mode": "read-only-local"/);
  assert.match(files["mcp-probes.json"], /"externalCalls": false/);
  assert.match(files["mcp-action-plan.md"], /Website improvement MCP action plan/);
  assert.match(files["website-handoff.md"], /Website improvement handoff/);
  assert.match(files["website-prompts.md"], /Website improvement prompt bundle/);
  assert.match(files["codex-implementation.md"], /# Codex implementation prompt/);

  const summaryPayload = JSON.parse(files["summary.json"]);
  assert.equal(summaryPayload.status, "pass");
  assert.equal(summaryPayload.generatedAt, workspace.updatedAt);
  assert.deepEqual(summaryPayload.handoff, {
    strictReady: true,
    readiness: "ready-for-strict-handoff",
    recommendedCommand: "design-ai site <bundle-dir> --bundle-handoff --strict --out target-repo-handoff.md",
    strictCommand: "design-ai site <bundle-dir> --bundle-handoff --strict --out target-repo-handoff.md",
    draftCommand: "design-ai site <bundle-dir> --bundle-handoff --out target-repo-handoff.md",
    verifyCommand: "design-ai site <bundle-dir> --bundle-check --strict --json",
    note: "Use the strict handoff command before target-repo implementation.",
    executionChecklist: [
      {
        id: "confirm-target-repo",
        label: "Confirm target repo working directory",
        required: true,
        evidence: "State the target repo path and confirm it is not the design-ai repo before editing.",
      },
      {
        id: "inspect-architecture",
        label: "Inspect existing architecture and design system",
        required: true,
        evidence: "Name the routing, component, styling, token, and test/build surfaces inspected before implementation.",
      },
      {
        id: "apply-focused-task",
        label: "Apply one focused Website Improvement task",
        required: true,
        evidence: "Identify the completed task id/title, changed files, and why the scope stayed limited.",
      },
      {
        id: "verify-quality-gates",
        label: "Run target repo quality gates",
        required: true,
        evidence: "Record lint/typecheck/build/test results plus browser, viewport, accessibility, and deployment checks that were available.",
      },
      {
        id: "record-handoff-evidence",
        label: "Record implementation evidence and remaining risks",
        required: true,
        evidence: "Return executed work, verification results, remaining risks, next actions, and the bundle digest used.",
      },
    ],
  });
  assert.equal(summaryPayload.taskGeneration.totalTasks, 3);
  assert.equal(summaryPayload.taskGeneration.createdCount, 2);
  assert.equal(summaryPayload.mcp.probeStatus, "pass");
  assert.deepEqual(summaryPayload.mcp.probeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.deepEqual(summaryPayload.files, Object.keys(files));
  assert.equal(summaryPayload.checksums.algorithm, "sha256");
  assert.match(summaryPayload.checksums.bundleDigest, /^[a-f0-9]{64}$/);
  assert.deepEqual(Object.keys(summaryPayload.checksums.files), [
    "README.md",
    "website-workspace.tasks.json",
    "mcp-check.json",
    "mcp-probes.json",
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
  assert.equal(report.counts.expectedFiles, SITE_BUNDLE_FILES.length);
  assert.equal(report.counts.presentFiles, SITE_BUNDLE_FILES.length);
  assert.equal(report.counts.expectedChecksumFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.counts.verifiedChecksumFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.counts.checksumFailures, 0);
  assert.equal(report.counts.expectedGeneratedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.counts.verifiedGeneratedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.counts.generatedFailures, 0);
  assert.equal(report.generatedContract.available, true);
  assert.equal(report.generatedContract.expectedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.generatedContract.verifiedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.deepEqual(report.generatedContract.driftFiles, []);
  assert.equal(report.generatedContract.files.length, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.ok(report.generatedContract.files.every((file) => file.present && file.matches));
  assert.ok(report.generatedContract.files.every((file) => /^[a-f0-9]{64}$/.test(file.expectedDigest)));
  assert.ok(report.generatedContract.files.every((file) => /^[a-f0-9]{64}$/.test(file.actualDigest)));
  assert.equal(report.repairGuidance.available, true);
  assert.equal(report.repairGuidance.targetRepoMutation, false);
  assert.equal(report.repairGuidance.externalCalls, false);
  assert.match(report.repairGuidance.command, /website-workspace\.tasks\.json --bundle --out .* --force/);
  assert.match(report.repairGuidance.previewReportCommand, /--bundle-repair --json --out .*repair-preview\.json/);
  assert.match(report.repairGuidance.applyReportCommand, /--bundle-repair --yes --json --out .*repair-applied\.json/);
  assert.match(report.repairGuidance.verifyCommand, /--bundle-check --strict --json/);
  assert.equal(report.summary.siteName, "Korean SaaS marketing site");
  assert.equal(report.summary.totalTasks, 3);
  assert.equal(report.summary.mcpProbeStatus, "pass");
  assert.deepEqual(report.summary.mcpProbeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.equal(report.mcpProbeStatus, "pass");
  assert.deepEqual(report.mcpProbeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.deepEqual(report.boundaries, [
    "deterministic-local",
    "no-external-mcp-calls",
    "no-target-repo-mutation",
    "no-lighthouse-axe-visual-diff",
  ]);
  assert.equal(report.externalCalls, false);
  assert.equal(report.targetRepoMutation, false);
  assert.deepEqual(report.summary.implementationEvidence, {
    executedWork: 0,
    verificationResults: 0,
    remainingRisks: 3,
    nextActions: 0,
  });
  assert.equal(report.summary.checksumAlgorithm, "sha256");
  assert.match(report.summary.checksumBundleDigest, /^[a-f0-9]{64}$/);
  assert.equal(json.issues[0].id, "bundle-ready");
  assert.deepEqual(json.mcpProbeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.deepEqual(json.boundaries, [
    "deterministic-local",
    "no-external-mcp-calls",
    "no-target-repo-mutation",
    "no-lighthouse-axe-visual-diff",
  ]);
  assert.equal(json.externalCalls, false);
  assert.equal(json.targetRepoMutation, false);
  assert.deepEqual(json.generatedContract.driftFiles, []);
  assert.deepEqual(json.summary.implementationEvidence, {
    executedWork: 0,
    verificationResults: 0,
    remainingRisks: 3,
    nextActions: 0,
  });
  assert.match(human, /Website Improvement handoff bundle check/);
  assert.match(human, new RegExp(`Files: ${SITE_BUNDLE_FILES.length}/${SITE_BUNDLE_FILES.length}`));
  assert.match(human, new RegExp(`Checksums: ${SITE_BUNDLE_CHECKSUM_FILES.length}/${SITE_BUNDLE_CHECKSUM_FILES.length} verified`));
  assert.match(human, new RegExp(`Generated contract: ${SITE_BUNDLE_CHECKSUM_FILES.length}/${SITE_BUNDLE_CHECKSUM_FILES.length} verified`));
  assert.match(human, /Generated drift files: none/);
  assert.match(human, /Generated contract drift:\n- none/);
  assert.match(human, /Repair guidance:\n- Available: yes/);
  assert.match(human, /Regenerate: design-ai site .*website-workspace\.tasks\.json --bundle --out .* --force/);
  assert.match(human, /Preview report: design-ai site .* --bundle-repair --json --out .*repair-preview\.json/);
  assert.match(human, /Apply report: design-ai site .* --bundle-repair --yes --json --out .*repair-applied\.json/);
  assert.match(human, /Bundle digest: [a-f0-9]{64}/);
  assert.match(human, /Evidence: executed work 0, verification 0, risks 3, next actions 0/);
  assert.match(human, /MCP probe status: pass/);
  assert.match(human, /MCP probes: 4\/4 passing, 0 warning, 0 failing/);
  assert.match(human, /Boundary flags: external calls no; target repo mutation no/);
  assert.match(human, /Bundle boundaries:\n- deterministic-local\n- no-external-mcp-calls\n- no-target-repo-mutation\n- no-lighthouse-axe-visual-diff/);
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

  const probeCountMismatchSummary = JSON.parse(originalSummary);
  probeCountMismatchSummary.mcp.probeCounts.pass = 3;
  writeFileSync(summaryPath, `${JSON.stringify(probeCountMismatchSummary, null, 2)}\n`, "utf8");
  const probeCountMismatchReport = buildSiteBundleCheckReport({ target: dir });
  assert.equal(probeCountMismatchReport.status, "fail");
  assert.ok(probeCountMismatchReport.issues.some((issue) => issue.id === "bundle-summary-mcp-probe-counts-pass"));
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
  assert.equal(tamperedReport.counts.verifiedChecksumFiles, SITE_BUNDLE_CHECKSUM_FILES.length - 1);
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

test("buildSiteBundleRepairPreview reports local bundle repair without mutating files", () => withTempDir((dir) => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "stdin" });
  const bundle = buildSiteHandoffBundle(workspace, summary);
  for (const file of bundle.files) {
    writeFileSync(path.join(dir, file.path), file.content, "utf8");
  }

  const handoffPath = path.join(dir, "website-handoff.md");
  const originalHandoff = readFileSync(handoffPath, "utf8");
  const tamperedHandoff = `${originalHandoff}\nManual edit before repair.\n`;
  writeFileSync(handoffPath, tamperedHandoff, "utf8");

  const preview = buildSiteBundleRepairPreview({ target: dir });
  const json = JSON.parse(formatSiteBundleRepairJson(preview));
  const human = formatSiteBundleRepairHuman(preview);

  assert.equal(preview.status, "pass");
  assert.equal(preview.valid, true);
  assert.equal(preview.dryRun, true);
  assert.equal(preview.applied, false);
  assert.equal(preview.repairGuidance.available, true);
  assert.equal(preview.repairGuidance.targetRepoMutation, false);
  assert.equal(preview.repairGuidance.externalCalls, false);
  assert.match(preview.repairGuidance.applyCommand, /--bundle-repair --yes --json/);
  assert.match(preview.repairGuidance.previewReportCommand, /--bundle-repair --json --out .*repair-preview\.json/);
  assert.match(preview.repairGuidance.applyReportCommand, /--bundle-repair --yes --json --out .*repair-applied\.json/);
  assert.equal(preview.before.status, "fail");
  assert.deepEqual(preview.before.generatedDriftFiles, ["website-handoff.md"]);
  assert.equal(preview.after, null);
  assert.equal(preview.written, null);
  assert.equal(json.dryRun, true);
  assert.match(human, /Website Improvement handoff bundle repair/);
  assert.match(human, /Dry run: yes/);
  assert.match(human, /Apply repair: design-ai site .* --bundle-repair --yes --json/);
  assert.match(human, /Preview report: design-ai site .* --bundle-repair --json --out .*repair-preview\.json/);
  assert.match(human, /Apply report: design-ai site .* --bundle-repair --yes --json --out .*repair-applied\.json/);
  assert.equal(readFileSync(handoffPath, "utf8"), tamperedHandoff);

  const repair = buildSiteBundleRepairBundle({ target: dir });
  assert.equal(repair.preview.dryRun, true);
  assert.equal(repair.beforeReport.status, "fail");
  assert.equal(repair.bundle.files.length, SITE_BUNDLE_FILES.length);
  assert.equal(repair.bundle.files.find((file) => file.path === "website-handoff.md").content, originalHandoff);
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
  assert.deepEqual(identicalJson.left.mcpProbeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.deepEqual(identicalJson.left.generatedDriftFiles, []);
  assert.deepEqual(identicalJson.right.generatedDriftFiles, []);
  assert.deepEqual(identicalJson.left.implementationEvidence, {
    executedWork: 0,
    verificationResults: 0,
    remainingRisks: 3,
    nextActions: 0,
  });
  assert.match(identicalHuman, /Same bundle: yes/);
  assert.match(identicalHuman, new RegExp(`Generated contract: left ${SITE_BUNDLE_CHECKSUM_FILES.length}/${SITE_BUNDLE_CHECKSUM_FILES.length}, right ${SITE_BUNDLE_CHECKSUM_FILES.length}/${SITE_BUNDLE_CHECKSUM_FILES.length}`));
  assert.match(identicalHuman, /Generated drift files: left none, right none/);
  assert.match(identicalHuman, /MCP probes: left 4\/4 passing, 0 warning, 0 failing, right 4\/4 passing, 0 warning, 0 failing/);

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
  assert.deepEqual(report.boundaries, [
    "deterministic-local",
    "no-external-mcp-calls",
    "no-target-repo-mutation",
    "no-lighthouse-axe-visual-diff",
    "target-repo-work-after-handoff",
  ]);
  assert.equal(report.externalCalls, false);
  assert.equal(report.targetRepoMutation, false);
  assert.equal(report.bundle.siteName, "Korean SaaS marketing site");
  assert.deepEqual(report.sourceBundle, report.bundle.sourceBundle);
  assert.equal(report.sourceBundle.directory, dir);
  assert.equal(report.sourceBundle.sourceWorkspace, "stdin");
  assert.equal(report.sourceBundle.siteName, "Korean SaaS marketing site");
  assert.equal(report.sourceBundle.status, "pass");
  assert.equal(report.sourceBundle.valid, true);
  assert.equal(report.sourceBundle.verifiedChecksumFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.sourceBundle.verifiedGeneratedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.match(report.sourceBundle.checkCommand, /design-ai site .* --bundle-check --json/);
  assert.deepEqual(report.sourceBundle.checkCommandArgs, ["design-ai", "site", dir, "--bundle-check", "--json"]);
  assert.equal(report.sourceBundle.checkCommandRunPolicy, "read-only");
  assert.deepEqual(report.sourceBundle.checkCommandSafety, {
    runPolicy: "read-only",
    safetyLevel: "local-read-only",
    writesLocalFile: false,
    outputFile: "",
    mutates: "none",
    externalCalls: false,
    targetRepoMutation: false,
    requiresCleanWorkspace: false,
    requiresReviewBeforeMutation: false,
    strict: false,
  });
  assert.match(report.sourceBundle.strictCheckCommand, /design-ai site .* --bundle-check --strict --json/);
  assert.deepEqual(report.sourceBundle.strictCheckCommandArgs, ["design-ai", "site", dir, "--bundle-check", "--strict", "--json"]);
  assert.equal(report.sourceBundle.strictCheckCommandRunPolicy, "read-only");
  assert.equal(report.sourceBundle.strictCheckCommandSafety.strict, true);
  assert.equal(report.sourceBundle.strictCheckCommandSafety.externalCalls, false);
  assert.equal(report.sourceBundle.strictCheckCommandSafety.targetRepoMutation, false);
  assert.match(report.sourceBundle.handoffCommand, /design-ai site .* --bundle-handoff --json/);
  assert.deepEqual(report.sourceBundle.handoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--json"]);
  assert.equal(report.sourceBundle.handoffCommandRunPolicy, "read-only");
  assert.equal(report.sourceBundle.handoffCommandSafety.writesLocalFile, false);
  assert.equal(report.sourceBundle.handoffCommandSafety.mutates, "none");
  assert.match(report.sourceBundle.strictHandoffCommand, /design-ai site .* --bundle-handoff --strict --json/);
  assert.deepEqual(report.sourceBundle.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--strict", "--json"]);
  assert.equal(report.sourceBundle.strictHandoffCommandRunPolicy, "read-only");
  assert.deepEqual(report.sourceBundle.strictHandoffCommandSafety, {
    runPolicy: "read-only",
    safetyLevel: "local-read-only",
    writesLocalFile: false,
    outputFile: "",
    mutates: "none",
    externalCalls: false,
    targetRepoMutation: false,
    requiresCleanWorkspace: false,
    requiresReviewBeforeMutation: false,
    strict: true,
  });
  assert.deepEqual(report.commandManifest, report.bundle.commandManifest);
  assert.equal(report.commandManifest.version, 1);
  assert.equal(report.commandManifest.source, "bundle-handoff");
  assert.equal(report.commandManifest.commandCount, 10);
  assert.equal(report.commandManifest.sourceCommandCount, 4);
  assert.equal(report.commandManifest.taskCommandCount, 6);
  assert.equal(report.commandManifest.readOnlyCount, 4);
  assert.equal(report.commandManifest.localOutputFileCount, 6);
  assert.equal(report.commandManifest.externalCallCount, 0);
  assert.equal(report.commandManifest.targetRepoMutationCount, 0);
  assert.equal(report.commandManifest.requiresCleanWorkspaceCount, 0);
  assert.equal(report.commandManifest.requiresReviewBeforeMutationCount, 0);
  assert.equal(report.commandManifest.defaultTaskId, "task-accessibility");
  assert.equal(report.commandManifest.selectedTaskId, "");
  assert.equal(report.commandManifest.effectiveTaskId, "task-accessibility");
  assert.equal(report.commandManifest.defaultStrictTaskCommandKey, "task.task-accessibility.handoff.strict");
  assert.equal(report.commandManifest.selectedStrictTaskCommandKey, "");
  assert.equal(report.commandManifest.effectiveStrictTaskCommandKey, "task.task-accessibility.handoff.strict");
  assert.deepEqual(report.commandManifest.commands.map((command) => command.key), [
    "source.bundleCheck",
    "source.bundleCheck.strict",
    "source.bundleHandoff",
    "source.bundleHandoff.strict",
    "task.task-accessibility.handoff.default",
    "task.task-accessibility.handoff.strict",
    "task.task-homepage-cta.handoff.default",
    "task.task-homepage-cta.handoff.strict",
    "task.task-content-quality.handoff.default",
    "task.task-content-quality.handoff.strict",
  ]);
  assert.equal(report.commandManifest.commands[0].scope, "source-bundle");
  assert.equal(report.commandManifest.commands[0].runPolicy, "read-only");
  assert.deepEqual(report.commandManifest.commands[0].commandArgs, ["design-ai", "site", dir, "--bundle-check", "--json"]);
  assert.equal(report.commandManifest.commands[0].safety.safetyLevel, "local-read-only");
  assert.equal(report.commandManifest.commands[5].scope, "task-handoff");
  assert.equal(report.commandManifest.commands[5].taskId, "task-accessibility");
  assert.equal(report.commandManifest.commands[5].taskNumber, 1);
  assert.equal(report.commandManifest.commands[5].runPolicy, "writes-local-file");
  assert.equal(report.commandManifest.commands[5].outputFile, "target-repo-task-accessibility-handoff.md");
  assert.equal(report.commandManifest.commands[5].defaultTask, true);
  assert.equal(report.commandManifest.commands[5].selectedTask, false);
  assert.equal(report.commandManifest.commands[5].effectiveTask, true);
  assert.equal(report.commandManifest.commands[5].safety.outputFile, "target-repo-task-accessibility-handoff.md");
  assert.deepEqual(report.operatorRunbook, report.bundle.operatorRunbook);
  assert.equal(report.operatorRunbook.version, 1);
  assert.equal(report.operatorRunbook.source, "bundle-handoff");
  assert.equal(report.operatorRunbook.stageCount, 5);
  assert.equal(report.operatorRunbook.commandStageCount, 3);
  assert.equal(report.operatorRunbook.manualStageCount, 2);
  assert.equal(report.operatorRunbook.requiredStageCount, 4);
  assert.equal(report.operatorRunbook.optionalStageCount, 1);
  assert.equal(report.operatorRunbook.readOnlyCommandStageCount, 2);
  assert.equal(report.operatorRunbook.localOutputCommandStageCount, 1);
  assert.equal(report.operatorRunbook.externalCallCommandStageCount, 0);
  assert.equal(report.operatorRunbook.targetRepoMutationCommandStageCount, 0);
  assert.equal(report.operatorRunbook.effectiveTaskId, "task-accessibility");
  assert.equal(report.operatorRunbook.effectiveStrictTaskCommandKey, "task.task-accessibility.handoff.strict");
  assert.equal(report.operatorRunbook.nextStageKey, "verifySourceBundle");
  assert.equal(report.operatorRunbook.nextCommandKey, "source.bundleCheck.strict");
  const expectedRunbookStageKeys = [
    "verifySourceBundle",
    "refreshHandoffSnapshot",
    "writeEffectiveTaskPrompt",
    "executeInTargetRepo",
    "recordEvidence",
  ];
  assert.deepEqual(report.operatorRunbook.stages.map((stage) => stage.key), expectedRunbookStageKeys);
  assert.deepEqual(report.operatorRunbook.stageKeys, expectedRunbookStageKeys);
  assert.deepEqual(Object.keys(report.operatorRunbook.stageByKey), expectedRunbookStageKeys);
  assert.deepEqual(report.operatorRunbook.stageLabelByKey, {
    verifySourceBundle: "Verify source bundle integrity",
    refreshHandoffSnapshot: "Refresh strict handoff JSON snapshot",
    writeEffectiveTaskPrompt: "Write effective task handoff prompt",
    executeInTargetRepo: "Execute the task in the target website repo",
    recordEvidence: "Record implementation evidence",
  });
  assert.equal(
    report.operatorRunbook.stageSummaryByKey.verifySourceBundle,
    report.operatorRunbook.stages[0].reason,
  );
  assert.equal(
    report.operatorRunbook.stageSummaryByKey.writeEffectiveTaskPrompt,
    report.operatorRunbook.stages[2].reason,
  );
  assert.deepEqual(report.operatorRunbook.stageActionTypeByKey, {
    verifySourceBundle: "run-local-gate",
    refreshHandoffSnapshot: "refresh-local-preview",
    writeEffectiveTaskPrompt: "write-local-output",
    executeInTargetRepo: "manual-target-repo",
    recordEvidence: "manual-evidence",
  });
  assert.deepEqual(report.operatorRunbook.stageActionLabelByKey, {
    verifySourceBundle: "Run strict bundle check",
    refreshHandoffSnapshot: "Refresh strict handoff JSON",
    writeEffectiveTaskPrompt: "Write selected task prompt",
    executeInTargetRepo: "Implement in target repo",
    recordEvidence: "Record verification evidence",
  });
  assert.deepEqual(report.operatorRunbook.stageActionButtonLabelsByKey, {
    verifySourceBundle: "Run Check",
    refreshHandoffSnapshot: "Refresh JSON",
    writeEffectiveTaskPrompt: "Write Prompt",
    executeInTargetRepo: "Open Target Repo",
    recordEvidence: "Record Evidence",
  });
  assert.deepEqual(report.operatorRunbook.stageActionAffordanceByKey, {
    verifySourceBundle: "primary-command-button",
    refreshHandoffSnapshot: "secondary-command-button",
    writeEffectiveTaskPrompt: "local-output-button",
    executeInTargetRepo: "manual-target-repo-step",
    recordEvidence: "manual-evidence-step",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEnabledByKey, {
    verifySourceBundle: true,
    refreshHandoffSnapshot: true,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: false,
    recordEvidence: false,
  });
  assert.deepEqual(report.operatorRunbook.stageActionStatusByKey, {
    verifySourceBundle: "ready",
    refreshHandoffSnapshot: "optional",
    writeEffectiveTaskPrompt: "ready",
    executeInTargetRepo: "manual",
    recordEvidence: "manual",
  });
  assert.deepEqual(report.operatorRunbook.stageActionStatusLabelsByKey, {
    verifySourceBundle: "Ready",
    refreshHandoffSnapshot: "Optional",
    writeEffectiveTaskPrompt: "Ready",
    executeInTargetRepo: "Manual",
    recordEvidence: "Manual",
  });
  assert.deepEqual(report.operatorRunbook.stageActionStatusToneByKey, {
    verifySourceBundle: "success",
    refreshHandoffSnapshot: "neutral",
    writeEffectiveTaskPrompt: "success",
    executeInTargetRepo: "info",
    recordEvidence: "info",
  });
  assert.deepEqual(report.operatorRunbook.stageActionDisabledReasonCodeByKey, {
    verifySourceBundle: "",
    refreshHandoffSnapshot: "",
    writeEffectiveTaskPrompt: "",
    executeInTargetRepo: "manual-target-repo-step",
    recordEvidence: "manual-evidence-step",
  });
  assert.equal(
    report.operatorRunbook.stageActionDisabledReasonByKey.executeInTargetRepo,
    "No local design-ai command is available for this stage; execute the generated prompt inside the target website repo.",
  );
  assert.equal(
    report.operatorRunbook.stageActionDisabledReasonByKey.recordEvidence,
    "No local design-ai command is available for this stage; record evidence after target-repo implementation and verification.",
  );
  assert.deepEqual(report.operatorRunbook.stageActionPrerequisiteKeysByKey, {
    verifySourceBundle: [],
    refreshHandoffSnapshot: [],
    writeEffectiveTaskPrompt: ["verifySourceBundle"],
    executeInTargetRepo: ["verifySourceBundle", "writeEffectiveTaskPrompt"],
    recordEvidence: ["executeInTargetRepo"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionPrerequisiteLabelsByKey.writeEffectiveTaskPrompt, [
    "Verify source bundle integrity",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionPrerequisiteLabelsByKey.executeInTargetRepo, [
    "Verify source bundle integrity",
    "Write effective task handoff prompt",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionPrerequisiteCountByKey, {
    verifySourceBundle: 0,
    refreshHandoffSnapshot: 0,
    writeEffectiveTaskPrompt: 1,
    executeInTargetRepo: 2,
    recordEvidence: 1,
  });
  assert.deepEqual(report.operatorRunbook.stageActionHasPrerequisitesByKey, {
    verifySourceBundle: false,
    refreshHandoffSnapshot: false,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: true,
    recordEvidence: true,
  });
  assert.deepEqual(report.operatorRunbook.stageActionDependencyReasonCodeByKey, {
    verifySourceBundle: "",
    refreshHandoffSnapshot: "",
    writeEffectiveTaskPrompt: "requires-prerequisite-actions",
    executeInTargetRepo: "requires-prerequisite-actions",
    recordEvidence: "requires-prerequisite-actions",
  });
  assert.deepEqual(report.operatorRunbook.stageActionDependencyReasonByKey, {
    verifySourceBundle: "",
    refreshHandoffSnapshot: "",
    writeEffectiveTaskPrompt: "Complete Verify source bundle integrity before writing the selected task prompt.",
    executeInTargetRepo: "Complete Verify source bundle integrity and Write effective task handoff prompt before implementing in the target website repo.",
    recordEvidence: "Complete Execute the task in the target website repo before recording implementation evidence.",
  });
  assert.deepEqual(report.operatorRunbook.stageActionBlockedStageKeysByKey, {
    verifySourceBundle: ["writeEffectiveTaskPrompt", "executeInTargetRepo"],
    refreshHandoffSnapshot: [],
    writeEffectiveTaskPrompt: ["executeInTargetRepo"],
    executeInTargetRepo: ["recordEvidence"],
    recordEvidence: [],
  });
  assert.deepEqual(report.operatorRunbook.stageActionBlockedStageLabelsByKey.executeInTargetRepo, [
    "Record implementation evidence",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionBlockedStageCountByKey, {
    verifySourceBundle: 2,
    refreshHandoffSnapshot: 0,
    writeEffectiveTaskPrompt: 1,
    executeInTargetRepo: 1,
    recordEvidence: 0,
  });
  assert.deepEqual(report.operatorRunbook.stageActionBlocksStagesByKey, {
    verifySourceBundle: true,
    refreshHandoffSnapshot: false,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: true,
    recordEvidence: false,
  });
  assert.deepEqual(report.operatorRunbook.stageActionCompletionCriteriaByKey.verifySourceBundle, [
    "Strict bundle check status is pass.",
    "Checksum and generated-file drift counts are zero.",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionCompletionCriteriaByKey.executeInTargetRepo, [
    "Target website repo has scoped implementation changes for the selected task.",
    "Target repo lint/typecheck/build or equivalent verification has been run.",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionCompletionCriteriaCountByKey, {
    verifySourceBundle: 2,
    refreshHandoffSnapshot: 1,
    writeEffectiveTaskPrompt: 2,
    executeInTargetRepo: 2,
    recordEvidence: 1,
  });
  assert.deepEqual(report.operatorRunbook.stageActionHasCompletionCriteriaByKey, {
    verifySourceBundle: true,
    refreshHandoffSnapshot: true,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: true,
    recordEvidence: true,
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceRequirementsByKey.verifySourceBundle, [
    "Strict bundle-check command output or JSON status.",
    "Bundle digest and zero drift counts.",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceRequirementsByKey.executeInTargetRepo, [
    "Target repo changed file list.",
    "Target repo verification command results.",
    "Viewport and accessibility check notes for affected pages.",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceRequirementCountByKey, {
    verifySourceBundle: 2,
    refreshHandoffSnapshot: 1,
    writeEffectiveTaskPrompt: 2,
    executeInTargetRepo: 3,
    recordEvidence: 1,
  });
  assert.deepEqual(report.operatorRunbook.stageActionRequiresEvidenceByKey, {
    verifySourceBundle: true,
    refreshHandoffSnapshot: true,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: true,
    recordEvidence: true,
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceTargetByKey, {
    verifySourceBundle: "local-command-output",
    refreshHandoffSnapshot: "local-command-output",
    writeEffectiveTaskPrompt: "local-output-file",
    executeInTargetRepo: "target-repo-working-tree",
    recordEvidence: "handoff-evidence-record",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceTargetLabelByKey, {
    verifySourceBundle: "Local command output",
    refreshHandoffSnapshot: "Local command output",
    writeEffectiveTaskPrompt: "Local output file",
    executeInTargetRepo: "Target repo working tree",
    recordEvidence: "Handoff evidence record",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldKeysByKey, {
    verifySourceBundle: ["strictBundleCheckOutput", "bundleDigest"],
    refreshHandoffSnapshot: ["handoffJsonSnapshot"],
    writeEffectiveTaskPrompt: ["promptOutputFile", "selectedTaskId"],
    executeInTargetRepo: [
      "targetRepoChangedFiles",
      "targetRepoVerificationResults",
      "viewportAccessibilityNotes",
    ],
    recordEvidence: ["finalEvidenceRecord", "remainingRisks"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldLabelsByKey.verifySourceBundle, [
    "Strict bundle-check output",
    "Bundle digest",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldPlaceholdersByKey.verifySourceBundle, [
    "Paste the strict bundle-check pass output or JSON status.",
    "Record the bundle digest or checksum summary.",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldRequirementLabelsByKey, {
    verifySourceBundle: ["Required", "Required"],
    refreshHandoffSnapshot: ["Optional"],
    writeEffectiveTaskPrompt: ["Required", "Required"],
    executeInTargetRepo: ["Required", "Required", "Required"],
    recordEvidence: ["Required", "Required"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldAriaLabelsByKey.verifySourceBundle, [
    "Strict bundle-check output evidence (required)",
    "Bundle digest evidence (required)",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldHelpTextsByKey.verifySourceBundle, [
    "Required: paste a passing strict bundle-check result.",
    "Required: record a digest, checksum, or equivalent bundle integrity summary.",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldSectionKeysByKey, {
    verifySourceBundle: ["source-bundle-verification", "source-bundle-verification"],
    refreshHandoffSnapshot: ["handoff-snapshot"],
    writeEffectiveTaskPrompt: ["handoff-prompt-output", "handoff-prompt-output"],
    executeInTargetRepo: [
      "target-repo-changes",
      "target-repo-verification",
      "viewport-accessibility-qa",
    ],
    recordEvidence: ["final-handoff-evidence", "risk-record"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldSectionLabelsByKey.verifySourceBundle, [
    "Source bundle verification",
    "Source bundle verification",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureSectionKeysByKey, {
    verifySourceBundle: ["source-bundle-verification"],
    refreshHandoffSnapshot: ["handoff-snapshot"],
    writeEffectiveTaskPrompt: ["handoff-prompt-output"],
    executeInTargetRepo: [
      "target-repo-changes",
      "target-repo-verification",
      "viewport-accessibility-qa",
    ],
    recordEvidence: ["final-handoff-evidence", "risk-record"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureSectionLabelsByKey.recordEvidence, [
    "Final handoff evidence",
    "Risk record",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureSectionCountByKey, {
    verifySourceBundle: 1,
    refreshHandoffSnapshot: 1,
    writeEffectiveTaskPrompt: 1,
    executeInTargetRepo: 3,
    recordEvidence: 2,
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldPayloadNamespacesByKey, {
    verifySourceBundle: ["sourceBundle", "sourceBundle"],
    refreshHandoffSnapshot: ["handoffSnapshot"],
    writeEffectiveTaskPrompt: ["handoffPrompt", "handoffPrompt"],
    executeInTargetRepo: ["targetRepo", "targetRepo", "targetRepo"],
    recordEvidence: ["handoffEvidence", "handoffEvidence"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldPayloadPathsByKey, {
    verifySourceBundle: [
      "sourceBundle.verification.strictBundleCheckOutput",
      "sourceBundle.verification.bundleDigest",
    ],
    refreshHandoffSnapshot: ["handoffSnapshot.strictJson"],
    writeEffectiveTaskPrompt: ["handoffPrompt.outputFile", "handoffPrompt.selectedTaskId"],
    executeInTargetRepo: [
      "targetRepo.changedFiles",
      "targetRepo.verificationResults",
      "targetRepo.viewportAccessibilityNotes",
    ],
    recordEvidence: ["handoffEvidence.finalRecord", "handoffEvidence.remainingRisks"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCapturePayloadNamespacesByKey, {
    verifySourceBundle: ["sourceBundle"],
    refreshHandoffSnapshot: ["handoffSnapshot"],
    writeEffectiveTaskPrompt: ["handoffPrompt"],
    executeInTargetRepo: ["targetRepo"],
    recordEvidence: ["handoffEvidence"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCapturePayloadNamespaceCountByKey, {
    verifySourceBundle: 1,
    refreshHandoffSnapshot: 1,
    writeEffectiveTaskPrompt: 1,
    executeInTargetRepo: 1,
    recordEvidence: 1,
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCapturePayloadTemplateByKey, {
    verifySourceBundle: {
      sourceBundle: {
        verification: {
          strictBundleCheckOutput: "",
          bundleDigest: "",
        },
      },
    },
    refreshHandoffSnapshot: {
      handoffSnapshot: {
        strictJson: "",
      },
    },
    writeEffectiveTaskPrompt: {
      handoffPrompt: {
        outputFile: "",
        selectedTaskId: "",
      },
    },
    executeInTargetRepo: {
      targetRepo: {
        changedFiles: [],
        verificationResults: "",
        viewportAccessibilityNotes: "",
      },
    },
    recordEvidence: {
      handoffEvidence: {
        finalRecord: "",
        remainingRisks: "",
      },
    },
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCapturePayloadFlatTemplateByKey, {
    verifySourceBundle: {
      "sourceBundle.verification.strictBundleCheckOutput": "",
      "sourceBundle.verification.bundleDigest": "",
    },
    refreshHandoffSnapshot: {
      "handoffSnapshot.strictJson": "",
    },
    writeEffectiveTaskPrompt: {
      "handoffPrompt.outputFile": "",
      "handoffPrompt.selectedTaskId": "",
    },
    executeInTargetRepo: {
      "targetRepo.changedFiles": [],
      "targetRepo.verificationResults": "",
      "targetRepo.viewportAccessibilityNotes": "",
    },
    recordEvidence: {
      "handoffEvidence.finalRecord": "",
      "handoffEvidence.remainingRisks": "",
    },
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCapturePayloadBindingsByKey.verifySourceBundle, [
    {
      key: "strictBundleCheckOutput",
      label: "Strict bundle-check output",
      payloadNamespace: "sourceBundle",
      payloadPath: "sourceBundle.verification.strictBundleCheckOutput",
      inputType: "textarea",
      valueShape: "long-text",
      acceptsMultiple: false,
      required: true,
      requirementLabel: "Required",
      emptyValue: "",
      validationRule: "non-empty-text",
      minLength: 20,
      sectionKey: "source-bundle-verification",
      sectionLabel: "Source bundle verification",
      ariaLabel: "Strict bundle-check output evidence (required)",
    },
    {
      key: "bundleDigest",
      label: "Bundle digest",
      payloadNamespace: "sourceBundle",
      payloadPath: "sourceBundle.verification.bundleDigest",
      inputType: "text",
      valueShape: "short-text",
      acceptsMultiple: false,
      required: true,
      requirementLabel: "Required",
      emptyValue: "",
      validationRule: "checksum-or-digest-text",
      minLength: 8,
      sectionKey: "source-bundle-verification",
      sectionLabel: "Source bundle verification",
      ariaLabel: "Bundle digest evidence (required)",
    },
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCapturePayloadBindingsByKey.executeInTargetRepo[0], {
    key: "targetRepoChangedFiles",
    label: "Target repo changed files",
    payloadNamespace: "targetRepo",
    payloadPath: "targetRepo.changedFiles",
    inputType: "list",
    valueShape: "string-list",
    acceptsMultiple: true,
    required: true,
    requirementLabel: "Required",
    emptyValue: [],
    validationRule: "non-empty-file-list",
    minLength: 1,
    sectionKey: "target-repo-changes",
    sectionLabel: "Target repo changes",
    ariaLabel: "Target repo changed files evidence (required)",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureValidationSpecsByKey.verifySourceBundle, [
    {
      key: "strictBundleCheckOutput",
      label: "Strict bundle-check output",
      rule: "non-empty-text",
      severity: "error",
      required: true,
      allowsEmpty: false,
      minLength: 20,
      valueShape: "long-text",
      acceptsMultiple: false,
      emptyValue: "",
      message: "Required: paste a passing strict bundle-check result.",
      failureMessage: "Provide strict bundle-check output before marking this action complete.",
    },
    {
      key: "bundleDigest",
      label: "Bundle digest",
      rule: "checksum-or-digest-text",
      severity: "error",
      required: true,
      allowsEmpty: false,
      minLength: 8,
      valueShape: "short-text",
      acceptsMultiple: false,
      emptyValue: "",
      message: "Required: record a digest, checksum, or equivalent bundle integrity summary.",
      failureMessage: "Provide bundle digest before marking this action complete.",
    },
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureValidationSpecsByKey.refreshHandoffSnapshot[0], {
    key: "handoffJsonSnapshot",
    label: "Strict handoff JSON snapshot",
    rule: "optional-json-snapshot",
    severity: "info",
    required: false,
    allowsEmpty: true,
    minLength: 0,
    valueShape: "long-text",
    acceptsMultiple: false,
    emptyValue: "",
    message: "Optional: paste the refreshed strict handoff JSON snapshot when available.",
    failureMessage: "Optional: provide strict handoff json snapshot when available.",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureValidationSpecsByKey.executeInTargetRepo[0], {
    key: "targetRepoChangedFiles",
    label: "Target repo changed files",
    rule: "non-empty-file-list",
    severity: "error",
    required: true,
    allowsEmpty: false,
    minLength: 1,
    valueShape: "string-list",
    acceptsMultiple: true,
    emptyValue: [],
    message: "Required: list at least one changed target-repo file or a no-change justification.",
    failureMessage: "Provide target repo changed files before marking this action complete.",
  });
  const expectedNextInitialValidationStates = [
    {
      key: "strictBundleCheckOutput",
      label: "Strict bundle-check output",
      rule: "non-empty-text",
      status: "missing-required",
      valid: false,
      blocking: true,
      severity: "error",
      required: true,
      allowsEmpty: false,
      touched: false,
      dirty: false,
      valuePresent: false,
      valueLength: 0,
      minLength: 20,
      valueShape: "long-text",
      acceptsMultiple: false,
      emptyValue: "",
      payloadPath: "sourceBundle.verification.strictBundleCheckOutput",
      message: "Provide strict bundle-check output before marking this action complete.",
    },
    {
      key: "bundleDigest",
      label: "Bundle digest",
      rule: "checksum-or-digest-text",
      status: "missing-required",
      valid: false,
      blocking: true,
      severity: "error",
      required: true,
      allowsEmpty: false,
      touched: false,
      dirty: false,
      valuePresent: false,
      valueLength: 0,
      minLength: 8,
      valueShape: "short-text",
      acceptsMultiple: false,
      emptyValue: "",
      payloadPath: "sourceBundle.verification.bundleDigest",
      message: "Provide bundle digest before marking this action complete.",
    },
  ];
  assert.deepEqual(
    report.operatorRunbook.stageActionEvidenceCaptureInitialValidationStatesByKey.verifySourceBundle,
    expectedNextInitialValidationStates,
  );
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureInitialValidationStatesByKey.refreshHandoffSnapshot[0], {
    key: "handoffJsonSnapshot",
    label: "Strict handoff JSON snapshot",
    rule: "optional-json-snapshot",
    status: "optional-empty",
    valid: true,
    blocking: false,
    severity: "info",
    required: false,
    allowsEmpty: true,
    touched: false,
    dirty: false,
    valuePresent: false,
    valueLength: 0,
    minLength: 0,
    valueShape: "long-text",
    acceptsMultiple: false,
    emptyValue: "",
    payloadPath: "handoffSnapshot.strictJson",
    message: "Optional: paste the refreshed strict handoff JSON snapshot when available.",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureInitialValidationStatesByKey.executeInTargetRepo[0], {
    key: "targetRepoChangedFiles",
    label: "Target repo changed files",
    rule: "non-empty-file-list",
    status: "missing-required",
    valid: false,
    blocking: true,
    severity: "error",
    required: true,
    allowsEmpty: false,
    touched: false,
    dirty: false,
    valuePresent: false,
    valueLength: 0,
    minLength: 1,
    valueShape: "string-list",
    acceptsMultiple: true,
    emptyValue: [],
    payloadPath: "targetRepo.changedFiles",
    message: "Provide target repo changed files before marking this action complete.",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldInputTypesByKey, {
    verifySourceBundle: ["textarea", "text"],
    refreshHandoffSnapshot: ["textarea"],
    writeEffectiveTaskPrompt: ["file-path", "text"],
    executeInTargetRepo: ["list", "textarea", "textarea"],
    recordEvidence: ["textarea", "textarea"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldValueShapesByKey, {
    verifySourceBundle: ["long-text", "short-text"],
    refreshHandoffSnapshot: ["long-text"],
    writeEffectiveTaskPrompt: ["file-path", "short-text"],
    executeInTargetRepo: ["string-list", "long-text", "long-text"],
    recordEvidence: ["long-text", "long-text"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldAcceptsMultipleByKey, {
    verifySourceBundle: [false, false],
    refreshHandoffSnapshot: [false],
    writeEffectiveTaskPrompt: [false, false],
    executeInTargetRepo: [true, false, false],
    recordEvidence: [false, false],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldDefaultValuesByKey, {
    verifySourceBundle: ["", ""],
    refreshHandoffSnapshot: [""],
    writeEffectiveTaskPrompt: ["", ""],
    executeInTargetRepo: [[], "", ""],
    recordEvidence: ["", ""],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldEmptyValuesByKey, {
    verifySourceBundle: ["", ""],
    refreshHandoffSnapshot: [""],
    writeEffectiveTaskPrompt: ["", ""],
    executeInTargetRepo: [[], "", ""],
    recordEvidence: ["", ""],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldValidationRulesByKey, {
    verifySourceBundle: ["non-empty-text", "checksum-or-digest-text"],
    refreshHandoffSnapshot: ["optional-json-snapshot"],
    writeEffectiveTaskPrompt: ["local-markdown-file-path", "task-id"],
    executeInTargetRepo: ["non-empty-file-list", "verification-results", "viewport-accessibility-notes"],
    recordEvidence: ["final-evidence-record", "risk-notes"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldMinLengthsByKey, {
    verifySourceBundle: [20, 8],
    refreshHandoffSnapshot: [0],
    writeEffectiveTaskPrompt: [12, 5],
    executeInTargetRepo: [1, 20, 20],
    recordEvidence: [30, 10],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldExamplesByKey.verifySourceBundle, [
    "Status: pass; checksumFailures: 0; generatedFailures: 0",
    "7685113af4744990fadf301b220b4739066e5f6ec2c40857825211e1167241aa",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldValidationHintsByKey.verifySourceBundle, [
    "Required: paste a passing strict bundle-check result.",
    "Required: record a digest, checksum, or equivalent bundle integrity summary.",
  ]);
  assert.deepEqual(report.operatorRunbook.stageActionRequiredEvidenceCaptureFieldKeysByKey, {
    verifySourceBundle: ["strictBundleCheckOutput", "bundleDigest"],
    refreshHandoffSnapshot: [],
    writeEffectiveTaskPrompt: ["promptOutputFile", "selectedTaskId"],
    executeInTargetRepo: [
      "targetRepoChangedFiles",
      "targetRepoVerificationResults",
      "viewportAccessibilityNotes",
    ],
    recordEvidence: ["finalEvidenceRecord", "remainingRisks"],
  });
  assert.deepEqual(report.operatorRunbook.stageActionOptionalEvidenceCaptureFieldKeysByKey, {
    verifySourceBundle: [],
    refreshHandoffSnapshot: ["handoffJsonSnapshot"],
    writeEffectiveTaskPrompt: [],
    executeInTargetRepo: [],
    recordEvidence: [],
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldCountByKey, {
    verifySourceBundle: 2,
    refreshHandoffSnapshot: 1,
    writeEffectiveTaskPrompt: 2,
    executeInTargetRepo: 3,
    recordEvidence: 2,
  });
  assert.deepEqual(report.operatorRunbook.stageActionRequiredEvidenceCaptureFieldCountByKey, {
    verifySourceBundle: 2,
    refreshHandoffSnapshot: 0,
    writeEffectiveTaskPrompt: 2,
    executeInTargetRepo: 3,
    recordEvidence: 2,
  });
  assert.deepEqual(report.operatorRunbook.stageActionOptionalEvidenceCaptureFieldCountByKey, {
    verifySourceBundle: 0,
    refreshHandoffSnapshot: 1,
    writeEffectiveTaskPrompt: 0,
    executeInTargetRepo: 0,
    recordEvidence: 0,
  });
  assert.deepEqual(report.operatorRunbook.stageActionHasEvidenceCaptureFieldsByKey, {
    verifySourceBundle: true,
    refreshHandoffSnapshot: true,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: true,
    recordEvidence: true,
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldsByKey.verifySourceBundle[0], {
    key: "strictBundleCheckOutput",
    label: "Strict bundle-check output",
    inputType: "textarea",
    required: true,
    evidenceTarget: "local-command-output",
    placeholder: "Paste the strict bundle-check pass output or JSON status.",
    validationRule: "non-empty-text",
    minLength: 20,
    example: "Status: pass; checksumFailures: 0; generatedFailures: 0",
    validationHint: "Required: paste a passing strict bundle-check result.",
    valueShape: "long-text",
    acceptsMultiple: false,
    defaultValue: "",
    emptyValue: "",
    requirementLabel: "Required",
    ariaLabel: "Strict bundle-check output evidence (required)",
    helpText: "Required: paste a passing strict bundle-check result.",
    sectionKey: "source-bundle-verification",
    sectionLabel: "Source bundle verification",
    payloadNamespace: "sourceBundle",
    payloadPath: "sourceBundle.verification.strictBundleCheckOutput",
  });
  assert.deepEqual(report.operatorRunbook.stageActionEvidenceCaptureFieldsByKey.executeInTargetRepo[2], {
    key: "viewportAccessibilityNotes",
    label: "Viewport and accessibility notes",
    inputType: "textarea",
    required: true,
    evidenceTarget: "target-repo-working-tree",
    placeholder: "Record desktop/tablet/mobile checks, keyboard focus, contrast, and screen-reader notes.",
    validationRule: "viewport-accessibility-notes",
    minLength: 20,
    example: "desktop/tablet/mobile checked; focus visible; contrast AA",
    validationHint: "Required: document viewport coverage plus keyboard, contrast, and screen-reader notes.",
    valueShape: "long-text",
    acceptsMultiple: false,
    defaultValue: "",
    emptyValue: "",
    requirementLabel: "Required",
    ariaLabel: "Viewport and accessibility notes evidence (required)",
    helpText: "Required: document viewport coverage plus keyboard, contrast, and screen-reader notes.",
    sectionKey: "viewport-accessibility-qa",
    sectionLabel: "Viewport and accessibility QA",
    payloadNamespace: "targetRepo",
    payloadPath: "targetRepo.viewportAccessibilityNotes",
  });
  assert.equal(
    report.operatorRunbook.stageActionInstructionsByKey.verifySourceBundle,
    "Run the strict local bundle check and resolve any checksum or generated-file drift before handoff.",
  );
  assert.equal(
    report.operatorRunbook.stageActionInstructionsByKey.writeEffectiveTaskPrompt,
    "Write the selected task prompt to a local Markdown file before switching into the target website repo.",
  );
  assert.equal(
    report.operatorRunbook.stageActionInstructionsByKey.executeInTargetRepo,
    "Manual: open the generated prompt in the target website repo, inspect architecture, implement the scoped task, and run target-repo verification.",
  );
  assert.deepEqual(report.operatorRunbook.stageActionRows.map((stage) => ({
    key: stage.key,
    actionType: stage.actionType,
    actionLabel: stage.actionLabel,
    actionButtonLabel: stage.actionButtonLabel,
    actionAffordance: stage.actionAffordance,
    actionEnabled: stage.actionEnabled,
    actionStatus: stage.actionStatus,
    actionStatusLabel: stage.actionStatusLabel,
    actionStatusTone: stage.actionStatusTone,
    actionDisabledReasonCode: stage.actionDisabledReasonCode,
    actionPrerequisiteKeys: stage.actionPrerequisiteKeys,
    actionPrerequisiteCount: stage.actionPrerequisiteCount,
    actionHasPrerequisites: stage.actionHasPrerequisites,
    actionDependencyReasonCode: stage.actionDependencyReasonCode,
    actionBlockedStageKeys: stage.actionBlockedStageKeys,
    actionBlockedStageCount: stage.actionBlockedStageCount,
    actionBlocksStages: stage.actionBlocksStages,
    actionCompletionCriteriaCount: stage.actionCompletionCriteriaCount,
    actionHasCompletionCriteria: stage.actionHasCompletionCriteria,
    actionEvidenceRequirementCount: stage.actionEvidenceRequirementCount,
    actionRequiresEvidence: stage.actionRequiresEvidence,
    actionEvidenceTarget: stage.actionEvidenceTarget,
    actionEvidenceTargetLabel: stage.actionEvidenceTargetLabel,
    actionEvidenceCaptureFieldKeys: stage.actionEvidenceCaptureFieldKeys,
    actionEvidenceCaptureFieldLabels: stage.actionEvidenceCaptureFieldLabels,
    actionEvidenceCaptureFieldPlaceholders: stage.actionEvidenceCaptureFieldPlaceholders,
    actionEvidenceCaptureFieldRequirementLabels: stage.actionEvidenceCaptureFieldRequirementLabels,
    actionEvidenceCaptureFieldAriaLabels: stage.actionEvidenceCaptureFieldAriaLabels,
    actionEvidenceCaptureFieldHelpTexts: stage.actionEvidenceCaptureFieldHelpTexts,
    actionEvidenceCaptureFieldSectionKeys: stage.actionEvidenceCaptureFieldSectionKeys,
    actionEvidenceCaptureFieldSectionLabels: stage.actionEvidenceCaptureFieldSectionLabels,
    actionEvidenceCaptureSectionKeys: stage.actionEvidenceCaptureSectionKeys,
    actionEvidenceCaptureSectionLabels: stage.actionEvidenceCaptureSectionLabels,
    actionEvidenceCaptureSectionCount: stage.actionEvidenceCaptureSectionCount,
    actionEvidenceCaptureFieldPayloadNamespaces: stage.actionEvidenceCaptureFieldPayloadNamespaces,
    actionEvidenceCaptureFieldPayloadPaths: stage.actionEvidenceCaptureFieldPayloadPaths,
    actionEvidenceCapturePayloadNamespaces: stage.actionEvidenceCapturePayloadNamespaces,
    actionEvidenceCapturePayloadNamespaceCount: stage.actionEvidenceCapturePayloadNamespaceCount,
    actionEvidenceCapturePayloadTemplate: stage.actionEvidenceCapturePayloadTemplate,
    actionEvidenceCapturePayloadFlatTemplate: stage.actionEvidenceCapturePayloadFlatTemplate,
    actionEvidenceCaptureFieldInputTypes: stage.actionEvidenceCaptureFieldInputTypes,
    actionEvidenceCaptureFieldValueShapes: stage.actionEvidenceCaptureFieldValueShapes,
    actionEvidenceCaptureFieldAcceptsMultiple: stage.actionEvidenceCaptureFieldAcceptsMultiple,
    actionEvidenceCaptureFieldDefaultValues: stage.actionEvidenceCaptureFieldDefaultValues,
    actionEvidenceCaptureFieldEmptyValues: stage.actionEvidenceCaptureFieldEmptyValues,
    actionEvidenceCaptureFieldValidationRules: stage.actionEvidenceCaptureFieldValidationRules,
    actionEvidenceCaptureFieldMinLengths: stage.actionEvidenceCaptureFieldMinLengths,
    actionRequiredEvidenceCaptureFieldKeys: stage.actionRequiredEvidenceCaptureFieldKeys,
    actionOptionalEvidenceCaptureFieldKeys: stage.actionOptionalEvidenceCaptureFieldKeys,
    actionEvidenceCaptureFieldCount: stage.actionEvidenceCaptureFieldCount,
    actionRequiredEvidenceCaptureFieldCount: stage.actionRequiredEvidenceCaptureFieldCount,
    actionOptionalEvidenceCaptureFieldCount: stage.actionOptionalEvidenceCaptureFieldCount,
    actionHasEvidenceCaptureFields: stage.actionHasEvidenceCaptureFields,
    required: stage.required,
    runPolicy: stage.runPolicy,
    safetyLevel: stage.safetyLevel,
    commandCount: stage.commandCount,
    outputFiles: stage.outputFiles,
    manual: stage.manual,
    writesLocalFile: stage.writesLocalFile,
    externalCalls: stage.externalCalls,
    targetRepoMutation: stage.targetRepoMutation,
  })), [
    {
      key: "verifySourceBundle",
      actionType: "run-local-gate",
      actionLabel: "Run strict bundle check",
      actionButtonLabel: "Run Check",
      actionAffordance: "primary-command-button",
      actionEnabled: true,
      actionStatus: "ready",
      actionStatusLabel: "Ready",
      actionStatusTone: "success",
      actionDisabledReasonCode: "",
      actionPrerequisiteKeys: [],
      actionPrerequisiteCount: 0,
      actionHasPrerequisites: false,
      actionDependencyReasonCode: "",
      actionBlockedStageKeys: ["writeEffectiveTaskPrompt", "executeInTargetRepo"],
      actionBlockedStageCount: 2,
      actionBlocksStages: true,
      actionCompletionCriteriaCount: 2,
      actionHasCompletionCriteria: true,
      actionEvidenceRequirementCount: 2,
      actionRequiresEvidence: true,
      actionEvidenceTarget: "local-command-output",
      actionEvidenceTargetLabel: "Local command output",
      actionEvidenceCaptureFieldKeys: ["strictBundleCheckOutput", "bundleDigest"],
      actionEvidenceCaptureFieldLabels: ["Strict bundle-check output", "Bundle digest"],
      actionEvidenceCaptureFieldPlaceholders: [
        "Paste the strict bundle-check pass output or JSON status.",
        "Record the bundle digest or checksum summary.",
      ],
      actionEvidenceCaptureFieldRequirementLabels: ["Required", "Required"],
      actionEvidenceCaptureFieldAriaLabels: [
        "Strict bundle-check output evidence (required)",
        "Bundle digest evidence (required)",
      ],
      actionEvidenceCaptureFieldHelpTexts: [
        "Required: paste a passing strict bundle-check result.",
        "Required: record a digest, checksum, or equivalent bundle integrity summary.",
      ],
      actionEvidenceCaptureFieldSectionKeys: ["source-bundle-verification", "source-bundle-verification"],
      actionEvidenceCaptureFieldSectionLabels: [
        "Source bundle verification",
        "Source bundle verification",
      ],
      actionEvidenceCaptureSectionKeys: ["source-bundle-verification"],
      actionEvidenceCaptureSectionLabels: ["Source bundle verification"],
      actionEvidenceCaptureSectionCount: 1,
      actionEvidenceCaptureFieldPayloadNamespaces: ["sourceBundle", "sourceBundle"],
      actionEvidenceCaptureFieldPayloadPaths: [
        "sourceBundle.verification.strictBundleCheckOutput",
        "sourceBundle.verification.bundleDigest",
      ],
      actionEvidenceCapturePayloadNamespaces: ["sourceBundle"],
      actionEvidenceCapturePayloadNamespaceCount: 1,
      actionEvidenceCapturePayloadTemplate: {
        sourceBundle: {
          verification: {
            strictBundleCheckOutput: "",
            bundleDigest: "",
          },
        },
      },
      actionEvidenceCapturePayloadFlatTemplate: {
        "sourceBundle.verification.strictBundleCheckOutput": "",
        "sourceBundle.verification.bundleDigest": "",
      },
      actionEvidenceCaptureFieldInputTypes: ["textarea", "text"],
      actionEvidenceCaptureFieldValueShapes: ["long-text", "short-text"],
      actionEvidenceCaptureFieldAcceptsMultiple: [false, false],
      actionEvidenceCaptureFieldDefaultValues: ["", ""],
      actionEvidenceCaptureFieldEmptyValues: ["", ""],
      actionEvidenceCaptureFieldValidationRules: ["non-empty-text", "checksum-or-digest-text"],
      actionEvidenceCaptureFieldMinLengths: [20, 8],
      actionRequiredEvidenceCaptureFieldKeys: ["strictBundleCheckOutput", "bundleDigest"],
      actionOptionalEvidenceCaptureFieldKeys: [],
      actionEvidenceCaptureFieldCount: 2,
      actionRequiredEvidenceCaptureFieldCount: 2,
      actionOptionalEvidenceCaptureFieldCount: 0,
      actionHasEvidenceCaptureFields: true,
      required: true,
      runPolicy: "read-only",
      safetyLevel: "local-read-only",
      commandCount: 1,
      outputFiles: [],
      manual: false,
      writesLocalFile: false,
      externalCalls: false,
      targetRepoMutation: false,
    },
    {
      key: "refreshHandoffSnapshot",
      actionType: "refresh-local-preview",
      actionLabel: "Refresh strict handoff JSON",
      actionButtonLabel: "Refresh JSON",
      actionAffordance: "secondary-command-button",
      actionEnabled: true,
      actionStatus: "optional",
      actionStatusLabel: "Optional",
      actionStatusTone: "neutral",
      actionDisabledReasonCode: "",
      actionPrerequisiteKeys: [],
      actionPrerequisiteCount: 0,
      actionHasPrerequisites: false,
      actionDependencyReasonCode: "",
      actionBlockedStageKeys: [],
      actionBlockedStageCount: 0,
      actionBlocksStages: false,
      actionCompletionCriteriaCount: 1,
      actionHasCompletionCriteria: true,
      actionEvidenceRequirementCount: 1,
      actionRequiresEvidence: true,
      actionEvidenceTarget: "local-command-output",
      actionEvidenceTargetLabel: "Local command output",
      actionEvidenceCaptureFieldKeys: ["handoffJsonSnapshot"],
      actionEvidenceCaptureFieldLabels: ["Strict handoff JSON snapshot"],
      actionEvidenceCaptureFieldPlaceholders: [
        "Paste or link the refreshed strict handoff JSON snapshot when used.",
      ],
      actionEvidenceCaptureFieldRequirementLabels: ["Optional"],
      actionEvidenceCaptureFieldAriaLabels: [
        "Strict handoff JSON snapshot evidence (optional)",
      ],
      actionEvidenceCaptureFieldHelpTexts: [
        "Optional: paste the refreshed strict handoff JSON snapshot when available.",
      ],
      actionEvidenceCaptureFieldSectionKeys: ["handoff-snapshot"],
      actionEvidenceCaptureFieldSectionLabels: ["Handoff snapshot"],
      actionEvidenceCaptureSectionKeys: ["handoff-snapshot"],
      actionEvidenceCaptureSectionLabels: ["Handoff snapshot"],
      actionEvidenceCaptureSectionCount: 1,
      actionEvidenceCaptureFieldPayloadNamespaces: ["handoffSnapshot"],
      actionEvidenceCaptureFieldPayloadPaths: ["handoffSnapshot.strictJson"],
      actionEvidenceCapturePayloadNamespaces: ["handoffSnapshot"],
      actionEvidenceCapturePayloadNamespaceCount: 1,
      actionEvidenceCapturePayloadTemplate: {
        handoffSnapshot: {
          strictJson: "",
        },
      },
      actionEvidenceCapturePayloadFlatTemplate: {
        "handoffSnapshot.strictJson": "",
      },
      actionEvidenceCaptureFieldInputTypes: ["textarea"],
      actionEvidenceCaptureFieldValueShapes: ["long-text"],
      actionEvidenceCaptureFieldAcceptsMultiple: [false],
      actionEvidenceCaptureFieldDefaultValues: [""],
      actionEvidenceCaptureFieldEmptyValues: [""],
      actionEvidenceCaptureFieldValidationRules: ["optional-json-snapshot"],
      actionEvidenceCaptureFieldMinLengths: [0],
      actionRequiredEvidenceCaptureFieldKeys: [],
      actionOptionalEvidenceCaptureFieldKeys: ["handoffJsonSnapshot"],
      actionEvidenceCaptureFieldCount: 1,
      actionRequiredEvidenceCaptureFieldCount: 0,
      actionOptionalEvidenceCaptureFieldCount: 1,
      actionHasEvidenceCaptureFields: true,
      required: false,
      runPolicy: "read-only",
      safetyLevel: "local-read-only",
      commandCount: 1,
      outputFiles: [],
      manual: false,
      writesLocalFile: false,
      externalCalls: false,
      targetRepoMutation: false,
    },
    {
      key: "writeEffectiveTaskPrompt",
      actionType: "write-local-output",
      actionLabel: "Write selected task prompt",
      actionButtonLabel: "Write Prompt",
      actionAffordance: "local-output-button",
      actionEnabled: true,
      actionStatus: "ready",
      actionStatusLabel: "Ready",
      actionStatusTone: "success",
      actionDisabledReasonCode: "",
      actionPrerequisiteKeys: ["verifySourceBundle"],
      actionPrerequisiteCount: 1,
      actionHasPrerequisites: true,
      actionDependencyReasonCode: "requires-prerequisite-actions",
      actionBlockedStageKeys: ["executeInTargetRepo"],
      actionBlockedStageCount: 1,
      actionBlocksStages: true,
      actionCompletionCriteriaCount: 2,
      actionHasCompletionCriteria: true,
      actionEvidenceRequirementCount: 2,
      actionRequiresEvidence: true,
      actionEvidenceTarget: "local-output-file",
      actionEvidenceTargetLabel: "Local output file",
      actionEvidenceCaptureFieldKeys: ["promptOutputFile", "selectedTaskId"],
      actionEvidenceCaptureFieldLabels: ["Prompt output file", "Selected task id"],
      actionEvidenceCaptureFieldPlaceholders: ["target-repo-task-...-handoff.md", "task-..."],
      actionEvidenceCaptureFieldRequirementLabels: ["Required", "Required"],
      actionEvidenceCaptureFieldAriaLabels: [
        "Prompt output file evidence (required)",
        "Selected task id evidence (required)",
      ],
      actionEvidenceCaptureFieldHelpTexts: [
        "Required: record the local Markdown prompt file path generated for the selected task.",
        "Required: record the bundle task id used for the target-repo handoff prompt.",
      ],
      actionEvidenceCaptureFieldSectionKeys: ["handoff-prompt-output", "handoff-prompt-output"],
      actionEvidenceCaptureFieldSectionLabels: [
        "Handoff prompt output",
        "Handoff prompt output",
      ],
      actionEvidenceCaptureSectionKeys: ["handoff-prompt-output"],
      actionEvidenceCaptureSectionLabels: ["Handoff prompt output"],
      actionEvidenceCaptureSectionCount: 1,
      actionEvidenceCaptureFieldPayloadNamespaces: ["handoffPrompt", "handoffPrompt"],
      actionEvidenceCaptureFieldPayloadPaths: [
        "handoffPrompt.outputFile",
        "handoffPrompt.selectedTaskId",
      ],
      actionEvidenceCapturePayloadNamespaces: ["handoffPrompt"],
      actionEvidenceCapturePayloadNamespaceCount: 1,
      actionEvidenceCapturePayloadTemplate: {
        handoffPrompt: {
          outputFile: "",
          selectedTaskId: "",
        },
      },
      actionEvidenceCapturePayloadFlatTemplate: {
        "handoffPrompt.outputFile": "",
        "handoffPrompt.selectedTaskId": "",
      },
      actionEvidenceCaptureFieldInputTypes: ["file-path", "text"],
      actionEvidenceCaptureFieldValueShapes: ["file-path", "short-text"],
      actionEvidenceCaptureFieldAcceptsMultiple: [false, false],
      actionEvidenceCaptureFieldDefaultValues: ["", ""],
      actionEvidenceCaptureFieldEmptyValues: ["", ""],
      actionEvidenceCaptureFieldValidationRules: ["local-markdown-file-path", "task-id"],
      actionEvidenceCaptureFieldMinLengths: [12, 5],
      actionRequiredEvidenceCaptureFieldKeys: ["promptOutputFile", "selectedTaskId"],
      actionOptionalEvidenceCaptureFieldKeys: [],
      actionEvidenceCaptureFieldCount: 2,
      actionRequiredEvidenceCaptureFieldCount: 2,
      actionOptionalEvidenceCaptureFieldCount: 0,
      actionHasEvidenceCaptureFields: true,
      required: true,
      runPolicy: "writes-local-file",
      safetyLevel: "local-output-file",
      commandCount: 1,
      outputFiles: ["target-repo-task-accessibility-handoff.md"],
      manual: false,
      writesLocalFile: true,
      externalCalls: false,
      targetRepoMutation: false,
    },
    {
      key: "executeInTargetRepo",
      actionType: "manual-target-repo",
      actionLabel: "Implement in target repo",
      actionButtonLabel: "Open Target Repo",
      actionAffordance: "manual-target-repo-step",
      actionEnabled: false,
      actionStatus: "manual",
      actionStatusLabel: "Manual",
      actionStatusTone: "info",
      actionDisabledReasonCode: "manual-target-repo-step",
      actionPrerequisiteKeys: ["verifySourceBundle", "writeEffectiveTaskPrompt"],
      actionPrerequisiteCount: 2,
      actionHasPrerequisites: true,
      actionDependencyReasonCode: "requires-prerequisite-actions",
      actionBlockedStageKeys: ["recordEvidence"],
      actionBlockedStageCount: 1,
      actionBlocksStages: true,
      actionCompletionCriteriaCount: 2,
      actionHasCompletionCriteria: true,
      actionEvidenceRequirementCount: 3,
      actionRequiresEvidence: true,
      actionEvidenceTarget: "target-repo-working-tree",
      actionEvidenceTargetLabel: "Target repo working tree",
      actionEvidenceCaptureFieldKeys: [
        "targetRepoChangedFiles",
        "targetRepoVerificationResults",
        "viewportAccessibilityNotes",
      ],
      actionEvidenceCaptureFieldLabels: [
        "Target repo changed files",
        "Target repo verification results",
        "Viewport and accessibility notes",
      ],
      actionEvidenceCaptureFieldPlaceholders: [
        "List changed files from the target website repo.",
        "Record lint, typecheck, build, test, or equivalent command results.",
        "Record desktop/tablet/mobile checks, keyboard focus, contrast, and screen-reader notes.",
      ],
      actionEvidenceCaptureFieldRequirementLabels: ["Required", "Required", "Required"],
      actionEvidenceCaptureFieldAriaLabels: [
        "Target repo changed files evidence (required)",
        "Target repo verification results evidence (required)",
        "Viewport and accessibility notes evidence (required)",
      ],
      actionEvidenceCaptureFieldHelpTexts: [
        "Required: list at least one changed target-repo file or a no-change justification.",
        "Required: record target-repo verification commands and results.",
        "Required: document viewport coverage plus keyboard, contrast, and screen-reader notes.",
      ],
      actionEvidenceCaptureFieldSectionKeys: [
        "target-repo-changes",
        "target-repo-verification",
        "viewport-accessibility-qa",
      ],
      actionEvidenceCaptureFieldSectionLabels: [
        "Target repo changes",
        "Target repo verification",
        "Viewport and accessibility QA",
      ],
      actionEvidenceCaptureSectionKeys: [
        "target-repo-changes",
        "target-repo-verification",
        "viewport-accessibility-qa",
      ],
      actionEvidenceCaptureSectionLabels: [
        "Target repo changes",
        "Target repo verification",
        "Viewport and accessibility QA",
      ],
      actionEvidenceCaptureSectionCount: 3,
      actionEvidenceCaptureFieldPayloadNamespaces: ["targetRepo", "targetRepo", "targetRepo"],
      actionEvidenceCaptureFieldPayloadPaths: [
        "targetRepo.changedFiles",
        "targetRepo.verificationResults",
        "targetRepo.viewportAccessibilityNotes",
      ],
      actionEvidenceCapturePayloadNamespaces: ["targetRepo"],
      actionEvidenceCapturePayloadNamespaceCount: 1,
      actionEvidenceCapturePayloadTemplate: {
        targetRepo: {
          changedFiles: [],
          verificationResults: "",
          viewportAccessibilityNotes: "",
        },
      },
      actionEvidenceCapturePayloadFlatTemplate: {
        "targetRepo.changedFiles": [],
        "targetRepo.verificationResults": "",
        "targetRepo.viewportAccessibilityNotes": "",
      },
      actionEvidenceCaptureFieldInputTypes: ["list", "textarea", "textarea"],
      actionEvidenceCaptureFieldValueShapes: ["string-list", "long-text", "long-text"],
      actionEvidenceCaptureFieldAcceptsMultiple: [true, false, false],
      actionEvidenceCaptureFieldDefaultValues: [[], "", ""],
      actionEvidenceCaptureFieldEmptyValues: [[], "", ""],
      actionEvidenceCaptureFieldValidationRules: [
        "non-empty-file-list",
        "verification-results",
        "viewport-accessibility-notes",
      ],
      actionEvidenceCaptureFieldMinLengths: [1, 20, 20],
      actionRequiredEvidenceCaptureFieldKeys: [
        "targetRepoChangedFiles",
        "targetRepoVerificationResults",
        "viewportAccessibilityNotes",
      ],
      actionOptionalEvidenceCaptureFieldKeys: [],
      actionEvidenceCaptureFieldCount: 3,
      actionRequiredEvidenceCaptureFieldCount: 3,
      actionOptionalEvidenceCaptureFieldCount: 0,
      actionHasEvidenceCaptureFields: true,
      required: true,
      runPolicy: "manual-target-repo",
      safetyLevel: "operator-controlled-target-repo",
      commandCount: 0,
      outputFiles: [],
      manual: true,
      writesLocalFile: false,
      externalCalls: false,
      targetRepoMutation: false,
    },
    {
      key: "recordEvidence",
      actionType: "manual-evidence",
      actionLabel: "Record verification evidence",
      actionButtonLabel: "Record Evidence",
      actionAffordance: "manual-evidence-step",
      actionEnabled: false,
      actionStatus: "manual",
      actionStatusLabel: "Manual",
      actionStatusTone: "info",
      actionDisabledReasonCode: "manual-evidence-step",
      actionPrerequisiteKeys: ["executeInTargetRepo"],
      actionPrerequisiteCount: 1,
      actionHasPrerequisites: true,
      actionDependencyReasonCode: "requires-prerequisite-actions",
      actionBlockedStageKeys: [],
      actionBlockedStageCount: 0,
      actionBlocksStages: false,
      actionCompletionCriteriaCount: 1,
      actionHasCompletionCriteria: true,
      actionEvidenceRequirementCount: 1,
      actionRequiresEvidence: true,
      actionEvidenceTarget: "handoff-evidence-record",
      actionEvidenceTargetLabel: "Handoff evidence record",
      actionEvidenceCaptureFieldKeys: ["finalEvidenceRecord", "remainingRisks"],
      actionEvidenceCaptureFieldLabels: ["Final evidence record", "Remaining risks"],
      actionEvidenceCaptureFieldPlaceholders: [
        "Summarize changed files, verification, viewport/accessibility checks, risks, and digest.",
        "List unresolved risks, skipped checks, or follow-up tasks.",
      ],
      actionEvidenceCaptureFieldRequirementLabels: ["Required", "Required"],
      actionEvidenceCaptureFieldAriaLabels: [
        "Final evidence record evidence (required)",
        "Remaining risks evidence (required)",
      ],
      actionEvidenceCaptureFieldHelpTexts: [
        "Required: summarize changes, verification, viewport/accessibility checks, risks, and digest.",
        "Required: record unresolved risks, skipped checks, or confirm none remain.",
      ],
      actionEvidenceCaptureFieldSectionKeys: ["final-handoff-evidence", "risk-record"],
      actionEvidenceCaptureFieldSectionLabels: ["Final handoff evidence", "Risk record"],
      actionEvidenceCaptureSectionKeys: ["final-handoff-evidence", "risk-record"],
      actionEvidenceCaptureSectionLabels: ["Final handoff evidence", "Risk record"],
      actionEvidenceCaptureSectionCount: 2,
      actionEvidenceCaptureFieldPayloadNamespaces: ["handoffEvidence", "handoffEvidence"],
      actionEvidenceCaptureFieldPayloadPaths: [
        "handoffEvidence.finalRecord",
        "handoffEvidence.remainingRisks",
      ],
      actionEvidenceCapturePayloadNamespaces: ["handoffEvidence"],
      actionEvidenceCapturePayloadNamespaceCount: 1,
      actionEvidenceCapturePayloadTemplate: {
        handoffEvidence: {
          finalRecord: "",
          remainingRisks: "",
        },
      },
      actionEvidenceCapturePayloadFlatTemplate: {
        "handoffEvidence.finalRecord": "",
        "handoffEvidence.remainingRisks": "",
      },
      actionEvidenceCaptureFieldInputTypes: ["textarea", "textarea"],
      actionEvidenceCaptureFieldValueShapes: ["long-text", "long-text"],
      actionEvidenceCaptureFieldAcceptsMultiple: [false, false],
      actionEvidenceCaptureFieldDefaultValues: ["", ""],
      actionEvidenceCaptureFieldEmptyValues: ["", ""],
      actionEvidenceCaptureFieldValidationRules: ["final-evidence-record", "risk-notes"],
      actionEvidenceCaptureFieldMinLengths: [30, 10],
      actionRequiredEvidenceCaptureFieldKeys: ["finalEvidenceRecord", "remainingRisks"],
      actionOptionalEvidenceCaptureFieldKeys: [],
      actionEvidenceCaptureFieldCount: 2,
      actionRequiredEvidenceCaptureFieldCount: 2,
      actionOptionalEvidenceCaptureFieldCount: 0,
      actionHasEvidenceCaptureFields: true,
      required: true,
      runPolicy: "manual-target-repo",
      safetyLevel: "operator-controlled-target-repo",
      commandCount: 0,
      outputFiles: [],
      manual: true,
      writesLocalFile: false,
      externalCalls: false,
      targetRepoMutation: false,
    },
  ]);
  assert.deepEqual(report.operatorRunbook.actionSummary, {
    totalActionCount: 5,
    commandActionCount: 3,
    manualActionCount: 2,
    enabledActionCount: 3,
    disabledActionCount: 2,
    manualDisabledActionCount: 2,
    actionWithPrerequisiteCount: 3,
    maxActionPrerequisiteCount: 2,
    actionWithDependencyReasonCount: 3,
    actionBlockingOtherActionCount: 3,
    maxActionBlockedStageCount: 2,
    actionWithCompletionCriteriaCount: 5,
    totalActionCompletionCriteriaCount: 8,
    maxActionCompletionCriteriaCount: 2,
    actionRequiringEvidenceCount: 5,
    totalActionEvidenceRequirementCount: 9,
    maxActionEvidenceRequirementCount: 3,
    localCommandEvidenceActionCount: 2,
    localOutputEvidenceActionCount: 1,
    targetRepoEvidenceActionCount: 1,
    handoffRecordEvidenceActionCount: 1,
    actionWithEvidenceCaptureFieldCount: 5,
    actionWithRequiredEvidenceCaptureFieldCount: 4,
    actionWithOptionalEvidenceCaptureFieldCount: 1,
    totalActionEvidenceCaptureFieldCount: 10,
    totalRequiredActionEvidenceCaptureFieldCount: 9,
    totalOptionalActionEvidenceCaptureFieldCount: 1,
    maxActionEvidenceCaptureFieldCount: 3,
    textareaEvidenceCaptureFieldCount: 6,
    textEvidenceCaptureFieldCount: 2,
    filePathEvidenceCaptureFieldCount: 1,
    listEvidenceCaptureFieldCount: 1,
    longTextEvidenceCaptureFieldCount: 6,
    shortTextEvidenceCaptureFieldCount: 2,
    filePathValueEvidenceCaptureFieldCount: 1,
    stringListEvidenceCaptureFieldCount: 1,
    multiValueEvidenceCaptureFieldCount: 1,
    singleValueEvidenceCaptureFieldCount: 9,
    emptyStringEvidenceCaptureFieldCount: 9,
    emptyListEvidenceCaptureFieldCount: 1,
    placeholderEvidenceCaptureFieldCount: 10,
    ariaLabelEvidenceCaptureFieldCount: 10,
    helpTextEvidenceCaptureFieldCount: 10,
    sectionedEvidenceCaptureFieldCount: 10,
    uniqueEvidenceCaptureSectionCount: 8,
    actionWithMultipleEvidenceCaptureSectionCount: 2,
    maxActionEvidenceCaptureSectionCount: 3,
    payloadMappedEvidenceCaptureFieldCount: 10,
    uniqueEvidenceCapturePayloadNamespaceCount: 5,
    actionWithMultipleEvidenceCapturePayloadNamespaceCount: 0,
    maxActionEvidenceCapturePayloadNamespaceCount: 1,
    actionWithEvidenceCapturePayloadTemplateCount: 5,
    evidenceCapturePayloadTemplatePathCount: 10,
    maxActionEvidenceCapturePayloadTemplatePathCount: 3,
    actionWithEvidenceCapturePayloadBindingCount: 5,
    evidenceCapturePayloadBindingCount: 10,
    requiredEvidenceCapturePayloadBindingCount: 9,
    optionalEvidenceCapturePayloadBindingCount: 1,
    multiValueEvidenceCapturePayloadBindingCount: 1,
    actionWithEvidenceCaptureValidationSpecCount: 5,
    evidenceCaptureValidationSpecCount: 10,
    requiredEvidenceCaptureValidationSpecCount: 9,
    optionalEvidenceCaptureValidationSpecCount: 1,
    errorEvidenceCaptureValidationSpecCount: 9,
    infoEvidenceCaptureValidationSpecCount: 1,
    multiValueEvidenceCaptureValidationSpecCount: 1,
    actionWithEvidenceCaptureInitialValidationStateCount: 5,
    evidenceCaptureInitialValidationStateCount: 10,
    validInitialEvidenceCaptureStateCount: 1,
    invalidInitialEvidenceCaptureStateCount: 9,
    blockingInitialEvidenceCaptureStateCount: 9,
    optionalEmptyInitialEvidenceCaptureStateCount: 1,
    missingRequiredInitialEvidenceCaptureStateCount: 9,
    pristineInitialEvidenceCaptureStateCount: 10,
    validatedEvidenceCaptureFieldCount: 10,
    requiredValidatedEvidenceCaptureFieldCount: 9,
    optionalValidatedEvidenceCaptureFieldCount: 1,
    minEvidenceCaptureFieldLengthTotal: 126,
    maxEvidenceCaptureFieldMinLength: 30,
    requiredActionCount: 4,
    optionalActionCount: 1,
    readOnlyActionCount: 2,
    localOutputActionCount: 1,
    outputFileActionCount: 1,
    externalCallActionCount: 0,
    targetRepoMutationActionCount: 0,
    nextActionKey: "verifySourceBundle",
    nextActionType: "run-local-gate",
    nextActionLabel: "Run strict bundle check",
    nextActionEnabled: true,
    nextActionStatus: "ready",
    nextActionStatusLabel: "Ready",
    nextActionStatusTone: "success",
    nextActionDisabledReasonCode: "",
    nextActionPrerequisiteKeys: [],
    nextActionPrerequisiteLabels: [],
    nextActionPrerequisiteCount: 0,
    nextActionHasPrerequisites: false,
    nextActionDependencyReasonCode: "",
    nextActionDependencyReason: "",
    nextActionBlockedStageKeys: ["writeEffectiveTaskPrompt", "executeInTargetRepo"],
    nextActionBlockedStageLabels: ["Write effective task handoff prompt", "Execute the task in the target website repo"],
    nextActionBlockedStageCount: 2,
    nextActionBlocksStages: true,
    nextActionCompletionCriteria: [
      "Strict bundle check status is pass.",
      "Checksum and generated-file drift counts are zero.",
    ],
    nextActionCompletionCriteriaCount: 2,
    nextActionHasCompletionCriteria: true,
    nextActionEvidenceRequirements: [
      "Strict bundle-check command output or JSON status.",
      "Bundle digest and zero drift counts.",
    ],
    nextActionEvidenceRequirementCount: 2,
    nextActionRequiresEvidence: true,
    nextActionEvidenceTarget: "local-command-output",
    nextActionEvidenceTargetLabel: "Local command output",
    nextActionEvidenceCaptureFields: [
      {
        key: "strictBundleCheckOutput",
        label: "Strict bundle-check output",
        inputType: "textarea",
        required: true,
        evidenceTarget: "local-command-output",
        placeholder: "Paste the strict bundle-check pass output or JSON status.",
        validationRule: "non-empty-text",
        minLength: 20,
        example: "Status: pass; checksumFailures: 0; generatedFailures: 0",
        validationHint: "Required: paste a passing strict bundle-check result.",
        valueShape: "long-text",
        acceptsMultiple: false,
        defaultValue: "",
        emptyValue: "",
        requirementLabel: "Required",
        ariaLabel: "Strict bundle-check output evidence (required)",
        helpText: "Required: paste a passing strict bundle-check result.",
        sectionKey: "source-bundle-verification",
        sectionLabel: "Source bundle verification",
        payloadNamespace: "sourceBundle",
        payloadPath: "sourceBundle.verification.strictBundleCheckOutput",
      },
      {
        key: "bundleDigest",
        label: "Bundle digest",
        inputType: "text",
        required: true,
        evidenceTarget: "local-command-output",
        placeholder: "Record the bundle digest or checksum summary.",
        validationRule: "checksum-or-digest-text",
        minLength: 8,
        example: "7685113af4744990fadf301b220b4739066e5f6ec2c40857825211e1167241aa",
        validationHint: "Required: record a digest, checksum, or equivalent bundle integrity summary.",
        valueShape: "short-text",
        acceptsMultiple: false,
        defaultValue: "",
        emptyValue: "",
        requirementLabel: "Required",
        ariaLabel: "Bundle digest evidence (required)",
        helpText: "Required: record a digest, checksum, or equivalent bundle integrity summary.",
        sectionKey: "source-bundle-verification",
        sectionLabel: "Source bundle verification",
        payloadNamespace: "sourceBundle",
        payloadPath: "sourceBundle.verification.bundleDigest",
      },
    ],
    nextActionEvidenceCaptureFieldKeys: ["strictBundleCheckOutput", "bundleDigest"],
    nextActionEvidenceCaptureFieldLabels: ["Strict bundle-check output", "Bundle digest"],
    nextActionEvidenceCaptureFieldPlaceholders: [
      "Paste the strict bundle-check pass output or JSON status.",
      "Record the bundle digest or checksum summary.",
    ],
    nextActionEvidenceCaptureFieldRequirementLabels: ["Required", "Required"],
    nextActionEvidenceCaptureFieldAriaLabels: [
      "Strict bundle-check output evidence (required)",
      "Bundle digest evidence (required)",
    ],
    nextActionEvidenceCaptureFieldHelpTexts: [
      "Required: paste a passing strict bundle-check result.",
      "Required: record a digest, checksum, or equivalent bundle integrity summary.",
    ],
    nextActionEvidenceCaptureFieldSectionKeys: ["source-bundle-verification", "source-bundle-verification"],
    nextActionEvidenceCaptureFieldSectionLabels: [
      "Source bundle verification",
      "Source bundle verification",
    ],
    nextActionEvidenceCaptureSectionKeys: ["source-bundle-verification"],
    nextActionEvidenceCaptureSectionLabels: ["Source bundle verification"],
    nextActionEvidenceCaptureSectionCount: 1,
    nextActionEvidenceCaptureFieldPayloadNamespaces: ["sourceBundle", "sourceBundle"],
    nextActionEvidenceCaptureFieldPayloadPaths: [
      "sourceBundle.verification.strictBundleCheckOutput",
      "sourceBundle.verification.bundleDigest",
    ],
    nextActionEvidenceCapturePayloadNamespaces: ["sourceBundle"],
    nextActionEvidenceCapturePayloadNamespaceCount: 1,
    nextActionEvidenceCapturePayloadTemplate: {
      sourceBundle: {
        verification: {
          strictBundleCheckOutput: "",
          bundleDigest: "",
        },
      },
    },
    nextActionEvidenceCapturePayloadFlatTemplate: {
      "sourceBundle.verification.strictBundleCheckOutput": "",
      "sourceBundle.verification.bundleDigest": "",
    },
    nextActionEvidenceCapturePayloadBindings: [
      {
        key: "strictBundleCheckOutput",
        label: "Strict bundle-check output",
        payloadNamespace: "sourceBundle",
        payloadPath: "sourceBundle.verification.strictBundleCheckOutput",
        inputType: "textarea",
        valueShape: "long-text",
        acceptsMultiple: false,
        required: true,
        requirementLabel: "Required",
        emptyValue: "",
        validationRule: "non-empty-text",
        minLength: 20,
        sectionKey: "source-bundle-verification",
        sectionLabel: "Source bundle verification",
        ariaLabel: "Strict bundle-check output evidence (required)",
      },
      {
        key: "bundleDigest",
        label: "Bundle digest",
        payloadNamespace: "sourceBundle",
        payloadPath: "sourceBundle.verification.bundleDigest",
        inputType: "text",
        valueShape: "short-text",
        acceptsMultiple: false,
        required: true,
        requirementLabel: "Required",
        emptyValue: "",
        validationRule: "checksum-or-digest-text",
        minLength: 8,
        sectionKey: "source-bundle-verification",
        sectionLabel: "Source bundle verification",
        ariaLabel: "Bundle digest evidence (required)",
      },
    ],
    nextActionEvidenceCaptureValidationSpecs: [
      {
        key: "strictBundleCheckOutput",
        label: "Strict bundle-check output",
        rule: "non-empty-text",
        severity: "error",
        required: true,
        allowsEmpty: false,
        minLength: 20,
        valueShape: "long-text",
        acceptsMultiple: false,
        emptyValue: "",
        message: "Required: paste a passing strict bundle-check result.",
        failureMessage: "Provide strict bundle-check output before marking this action complete.",
      },
      {
        key: "bundleDigest",
        label: "Bundle digest",
        rule: "checksum-or-digest-text",
        severity: "error",
        required: true,
        allowsEmpty: false,
        minLength: 8,
        valueShape: "short-text",
        acceptsMultiple: false,
        emptyValue: "",
        message: "Required: record a digest, checksum, or equivalent bundle integrity summary.",
        failureMessage: "Provide bundle digest before marking this action complete.",
      },
    ],
    nextActionEvidenceCaptureInitialValidationStates: expectedNextInitialValidationStates,
    nextActionEvidenceCaptureFieldInputTypes: ["textarea", "text"],
    nextActionEvidenceCaptureFieldValueShapes: ["long-text", "short-text"],
    nextActionEvidenceCaptureFieldAcceptsMultiple: [false, false],
    nextActionEvidenceCaptureFieldDefaultValues: ["", ""],
    nextActionEvidenceCaptureFieldEmptyValues: ["", ""],
    nextActionEvidenceCaptureFieldValidationRules: ["non-empty-text", "checksum-or-digest-text"],
    nextActionEvidenceCaptureFieldMinLengths: [20, 8],
    nextActionEvidenceCaptureFieldExamples: [
      "Status: pass; checksumFailures: 0; generatedFailures: 0",
      "7685113af4744990fadf301b220b4739066e5f6ec2c40857825211e1167241aa",
    ],
    nextActionEvidenceCaptureFieldValidationHints: [
      "Required: paste a passing strict bundle-check result.",
      "Required: record a digest, checksum, or equivalent bundle integrity summary.",
    ],
    nextActionRequiredEvidenceCaptureFieldKeys: ["strictBundleCheckOutput", "bundleDigest"],
    nextActionOptionalEvidenceCaptureFieldKeys: [],
    nextActionEvidenceCaptureFieldCount: 2,
    nextActionRequiredEvidenceCaptureFieldCount: 2,
    nextActionOptionalEvidenceCaptureFieldCount: 0,
    nextActionHasEvidenceCaptureFields: true,
    nextActionRunPolicy: "read-only",
    nextActionSafetyLevel: "local-read-only",
    firstRequiredCommandStageKey: "verifySourceBundle",
    firstLocalOutputStageKey: "writeEffectiveTaskPrompt",
    firstManualStageKey: "executeInTargetRepo",
    firstRequiredManualStageKey: "executeInTargetRepo",
    firstEvidenceStageKey: "recordEvidence",
    firstActionWithPrerequisiteKey: "writeEffectiveTaskPrompt",
    firstManualActionWithPrerequisiteKey: "executeInTargetRepo",
    firstEvidenceActionWithPrerequisiteKey: "recordEvidence",
    firstActionWithDependencyReasonKey: "writeEffectiveTaskPrompt",
    firstActionBlockingOtherActionKey: "verifySourceBundle",
    firstActionWithCompletionCriteriaKey: "verifySourceBundle",
    firstManualActionWithCompletionCriteriaKey: "executeInTargetRepo",
    firstActionRequiringEvidenceKey: "verifySourceBundle",
    firstManualActionRequiringEvidenceKey: "executeInTargetRepo",
    firstEvidenceRecordingActionKey: "recordEvidence",
    firstTargetRepoEvidenceActionKey: "executeInTargetRepo",
    firstLocalOutputEvidenceActionKey: "writeEffectiveTaskPrompt",
    firstActionWithEvidenceCaptureFieldKey: "verifySourceBundle",
    firstActionWithOptionalEvidenceCaptureFieldKey: "refreshHandoffSnapshot",
    firstManualActionWithEvidenceCaptureFieldKey: "executeInTargetRepo",
    firstTextareaEvidenceCaptureActionKey: "verifySourceBundle",
    firstMultiValueEvidenceCaptureActionKey: "executeInTargetRepo",
    firstValidationRuleEvidenceCaptureActionKey: "verifySourceBundle",
    requiresTargetRepoWork: true,
    requiresEvidenceReturn: true,
    externalCalls: false,
    targetRepoMutation: false,
  });
  assert.deepEqual(report.operatorRunbook.stageKindByKey, {
    verifySourceBundle: "read-only-gate",
    refreshHandoffSnapshot: "read-only-preview",
    writeEffectiveTaskPrompt: "local-output",
    executeInTargetRepo: "manual-target-repo",
    recordEvidence: "manual-reporting",
  });
  assert.deepEqual(report.operatorRunbook.stageRequiredByKey, {
    verifySourceBundle: true,
    refreshHandoffSnapshot: false,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: true,
    recordEvidence: true,
  });
  assert.deepEqual(report.operatorRunbook.stageRunPolicyByKey, {
    verifySourceBundle: "read-only",
    refreshHandoffSnapshot: "read-only",
    writeEffectiveTaskPrompt: "writes-local-file",
    executeInTargetRepo: "manual-target-repo",
    recordEvidence: "manual-target-repo",
  });
  assert.deepEqual(report.operatorRunbook.stageSafetyLevelByKey, {
    verifySourceBundle: "local-read-only",
    refreshHandoffSnapshot: "local-read-only",
    writeEffectiveTaskPrompt: "local-output-file",
    executeInTargetRepo: "operator-controlled-target-repo",
    recordEvidence: "operator-controlled-target-repo",
  });
  assert.deepEqual(report.operatorRunbook.stageCommandCountByKey, {
    verifySourceBundle: 1,
    refreshHandoffSnapshot: 1,
    writeEffectiveTaskPrompt: 1,
    executeInTargetRepo: 0,
    recordEvidence: 0,
  });
  assert.deepEqual(report.operatorRunbook.stageCommandKeysByKey, {
    verifySourceBundle: ["source.bundleCheck.strict"],
    refreshHandoffSnapshot: ["source.bundleHandoff.strict"],
    writeEffectiveTaskPrompt: ["task.task-accessibility.handoff.strict"],
    executeInTargetRepo: [],
    recordEvidence: [],
  });
  assert.deepEqual(report.operatorRunbook.stageCommandLabelsByKey.verifySourceBundle, [
    "Strict bundle check JSON",
  ]);
  assert.deepEqual(report.operatorRunbook.stageCommandLabelsByKey.writeEffectiveTaskPrompt, [
    "Strict Task handoff: task-accessibility",
  ]);
  assert.deepEqual(report.operatorRunbook.stageCommandStringsByKey.verifySourceBundle, [
    report.commandManifest.commands[1].command,
  ]);
  assert.deepEqual(report.operatorRunbook.stageCommandStringsByKey.writeEffectiveTaskPrompt, [
    report.commandManifest.commands[5].command,
  ]);
  assert.deepEqual(report.operatorRunbook.stageCommandArgsByKey.verifySourceBundle, [
    ["design-ai", "site", dir, "--bundle-check", "--strict", "--json"],
  ]);
  assert.deepEqual(report.operatorRunbook.stageCommandArgsByKey.writeEffectiveTaskPrompt, [
    ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--strict", "--out", "target-repo-task-accessibility-handoff.md"],
  ]);
  assert.deepEqual(report.operatorRunbook.stageCommandRunPoliciesByKey, {
    verifySourceBundle: ["read-only"],
    refreshHandoffSnapshot: ["read-only"],
    writeEffectiveTaskPrompt: ["writes-local-file"],
    executeInTargetRepo: [],
    recordEvidence: [],
  });
  assert.deepEqual(report.operatorRunbook.stageCommandSafetyLevelsByKey, {
    verifySourceBundle: ["local-read-only"],
    refreshHandoffSnapshot: ["local-read-only"],
    writeEffectiveTaskPrompt: ["local-output-file"],
    executeInTargetRepo: [],
    recordEvidence: [],
  });
  assert.deepEqual(report.operatorRunbook.stageOutputFilesByKey, {
    verifySourceBundle: [],
    refreshHandoffSnapshot: [],
    writeEffectiveTaskPrompt: ["target-repo-task-accessibility-handoff.md"],
    executeInTargetRepo: [],
    recordEvidence: [],
  });
  assert.deepEqual(report.operatorRunbook.stageHasCommandsByKey, {
    verifySourceBundle: true,
    refreshHandoffSnapshot: true,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: false,
    recordEvidence: false,
  });
  assert.deepEqual(report.operatorRunbook.stageManualByKey, {
    verifySourceBundle: false,
    refreshHandoffSnapshot: false,
    writeEffectiveTaskPrompt: false,
    executeInTargetRepo: true,
    recordEvidence: true,
  });
  assert.deepEqual(report.operatorRunbook.stageWritesLocalFileByKey, {
    verifySourceBundle: false,
    refreshHandoffSnapshot: false,
    writeEffectiveTaskPrompt: true,
    executeInTargetRepo: false,
    recordEvidence: false,
  });
  assert.deepEqual(report.operatorRunbook.stageExternalCallsByKey, {
    verifySourceBundle: false,
    refreshHandoffSnapshot: false,
    writeEffectiveTaskPrompt: false,
    executeInTargetRepo: false,
    recordEvidence: false,
  });
  assert.deepEqual(report.operatorRunbook.stageTargetRepoMutationByKey, {
    verifySourceBundle: false,
    refreshHandoffSnapshot: false,
    writeEffectiveTaskPrompt: false,
    executeInTargetRepo: false,
    recordEvidence: false,
  });
  assert.deepEqual(report.operatorRunbook.commandStageKeys, [
    "verifySourceBundle",
    "refreshHandoffSnapshot",
    "writeEffectiveTaskPrompt",
  ]);
  assert.deepEqual(report.operatorRunbook.manualStageKeys, [
    "executeInTargetRepo",
    "recordEvidence",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStage, report.operatorRunbook.stages[0]);
  assert.equal(report.operatorRunbook.nextStageLabel, "Verify source bundle integrity");
  assert.equal(report.operatorRunbook.nextStageSummary, report.operatorRunbook.stages[0].reason);
  assert.equal(report.operatorRunbook.nextStageActionType, "run-local-gate");
  assert.equal(report.operatorRunbook.nextStageActionLabel, "Run strict bundle check");
  assert.equal(
    report.operatorRunbook.nextStageActionInstruction,
    "Run the strict local bundle check and resolve any checksum or generated-file drift before handoff.",
  );
  assert.equal(report.operatorRunbook.nextStageActionButtonLabel, "Run Check");
  assert.equal(report.operatorRunbook.nextStageActionAffordance, "primary-command-button");
  assert.equal(report.operatorRunbook.nextStageActionEnabled, true);
  assert.equal(report.operatorRunbook.nextStageActionStatus, "ready");
  assert.equal(report.operatorRunbook.nextStageActionStatusLabel, "Ready");
  assert.equal(report.operatorRunbook.nextStageActionStatusTone, "success");
  assert.equal(report.operatorRunbook.nextStageActionDisabledReasonCode, "");
  assert.equal(report.operatorRunbook.nextStageActionDisabledReason, "");
  assert.deepEqual(report.operatorRunbook.nextStageActionPrerequisiteKeys, []);
  assert.deepEqual(report.operatorRunbook.nextStageActionPrerequisiteLabels, []);
  assert.equal(report.operatorRunbook.nextStageActionPrerequisiteCount, 0);
  assert.equal(report.operatorRunbook.nextStageActionHasPrerequisites, false);
  assert.equal(report.operatorRunbook.nextStageActionDependencyReasonCode, "");
  assert.equal(report.operatorRunbook.nextStageActionDependencyReason, "");
  assert.deepEqual(report.operatorRunbook.nextStageActionBlockedStageKeys, [
    "writeEffectiveTaskPrompt",
    "executeInTargetRepo",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionBlockedStageLabels, [
    "Write effective task handoff prompt",
    "Execute the task in the target website repo",
  ]);
  assert.equal(report.operatorRunbook.nextStageActionBlockedStageCount, 2);
  assert.equal(report.operatorRunbook.nextStageActionBlocksStages, true);
  assert.deepEqual(report.operatorRunbook.nextStageActionCompletionCriteria, [
    "Strict bundle check status is pass.",
    "Checksum and generated-file drift counts are zero.",
  ]);
  assert.equal(report.operatorRunbook.nextStageActionCompletionCriteriaCount, 2);
  assert.equal(report.operatorRunbook.nextStageActionHasCompletionCriteria, true);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceRequirements, [
    "Strict bundle-check command output or JSON status.",
    "Bundle digest and zero drift counts.",
  ]);
  assert.equal(report.operatorRunbook.nextStageActionEvidenceRequirementCount, 2);
  assert.equal(report.operatorRunbook.nextStageActionRequiresEvidence, true);
  assert.equal(report.operatorRunbook.nextStageActionEvidenceTarget, "local-command-output");
  assert.equal(report.operatorRunbook.nextStageActionEvidenceTargetLabel, "Local command output");
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldKeys, [
    "strictBundleCheckOutput",
    "bundleDigest",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldLabels, [
    "Strict bundle-check output",
    "Bundle digest",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldPlaceholders, [
    "Paste the strict bundle-check pass output or JSON status.",
    "Record the bundle digest or checksum summary.",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldRequirementLabels, [
    "Required",
    "Required",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldAriaLabels, [
    "Strict bundle-check output evidence (required)",
    "Bundle digest evidence (required)",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldHelpTexts, [
    "Required: paste a passing strict bundle-check result.",
    "Required: record a digest, checksum, or equivalent bundle integrity summary.",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldSectionKeys, [
    "source-bundle-verification",
    "source-bundle-verification",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldSectionLabels, [
    "Source bundle verification",
    "Source bundle verification",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureSectionKeys, [
    "source-bundle-verification",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureSectionLabels, [
    "Source bundle verification",
  ]);
  assert.equal(report.operatorRunbook.nextStageActionEvidenceCaptureSectionCount, 1);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldPayloadNamespaces, [
    "sourceBundle",
    "sourceBundle",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldPayloadPaths, [
    "sourceBundle.verification.strictBundleCheckOutput",
    "sourceBundle.verification.bundleDigest",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCapturePayloadNamespaces, [
    "sourceBundle",
  ]);
  assert.equal(report.operatorRunbook.nextStageActionEvidenceCapturePayloadNamespaceCount, 1);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCapturePayloadTemplate, {
    sourceBundle: {
      verification: {
        strictBundleCheckOutput: "",
        bundleDigest: "",
      },
    },
  });
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCapturePayloadFlatTemplate, {
    "sourceBundle.verification.strictBundleCheckOutput": "",
    "sourceBundle.verification.bundleDigest": "",
  });
  assert.deepEqual(
    report.operatorRunbook.nextStageActionEvidenceCapturePayloadBindings,
    report.operatorRunbook.stageActionEvidenceCapturePayloadBindingsByKey.verifySourceBundle,
  );
  assert.deepEqual(
    report.operatorRunbook.nextStageActionEvidenceCaptureValidationSpecs,
    report.operatorRunbook.stageActionEvidenceCaptureValidationSpecsByKey.verifySourceBundle,
  );
  assert.deepEqual(
    report.operatorRunbook.nextStageActionEvidenceCaptureInitialValidationStates,
    report.operatorRunbook.stageActionEvidenceCaptureInitialValidationStatesByKey.verifySourceBundle,
  );
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldInputTypes, ["textarea", "text"]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldValueShapes, ["long-text", "short-text"]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldAcceptsMultiple, [false, false]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldDefaultValues, ["", ""]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldEmptyValues, ["", ""]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldValidationRules, [
    "non-empty-text",
    "checksum-or-digest-text",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldMinLengths, [20, 8]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldExamples, [
    "Status: pass; checksumFailures: 0; generatedFailures: 0",
    "7685113af4744990fadf301b220b4739066e5f6ec2c40857825211e1167241aa",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFieldValidationHints, [
    "Required: paste a passing strict bundle-check result.",
    "Required: record a digest, checksum, or equivalent bundle integrity summary.",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionRequiredEvidenceCaptureFieldKeys, [
    "strictBundleCheckOutput",
    "bundleDigest",
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageActionOptionalEvidenceCaptureFieldKeys, []);
  assert.equal(report.operatorRunbook.nextStageActionEvidenceCaptureFieldCount, 2);
  assert.equal(report.operatorRunbook.nextStageActionRequiredEvidenceCaptureFieldCount, 2);
  assert.equal(report.operatorRunbook.nextStageActionOptionalEvidenceCaptureFieldCount, 0);
  assert.equal(report.operatorRunbook.nextStageActionHasEvidenceCaptureFields, true);
  assert.deepEqual(report.operatorRunbook.nextStageActionEvidenceCaptureFields[1], {
    key: "bundleDigest",
    label: "Bundle digest",
    inputType: "text",
    required: true,
    evidenceTarget: "local-command-output",
    placeholder: "Record the bundle digest or checksum summary.",
    validationRule: "checksum-or-digest-text",
    minLength: 8,
    example: "7685113af4744990fadf301b220b4739066e5f6ec2c40857825211e1167241aa",
    validationHint: "Required: record a digest, checksum, or equivalent bundle integrity summary.",
    valueShape: "short-text",
    acceptsMultiple: false,
    defaultValue: "",
    emptyValue: "",
    requirementLabel: "Required",
    ariaLabel: "Bundle digest evidence (required)",
    helpText: "Required: record a digest, checksum, or equivalent bundle integrity summary.",
    sectionKey: "source-bundle-verification",
    sectionLabel: "Source bundle verification",
    payloadNamespace: "sourceBundle",
    payloadPath: "sourceBundle.verification.bundleDigest",
  });
  assert.equal(report.operatorRunbook.nextStageKind, "read-only-gate");
  assert.equal(report.operatorRunbook.nextStageRequired, true);
  assert.equal(report.operatorRunbook.nextStageRunPolicy, "read-only");
  assert.equal(report.operatorRunbook.nextStageSafetyLevel, "local-read-only");
  assert.equal(report.operatorRunbook.nextStageCommandCount, 1);
  assert.deepEqual(report.operatorRunbook.nextStageCommandLabels, ["Strict bundle check JSON"]);
  assert.deepEqual(report.operatorRunbook.nextStageCommands, [report.commandManifest.commands[1].command]);
  assert.deepEqual(report.operatorRunbook.nextStageCommandArgsList, [
    ["design-ai", "site", dir, "--bundle-check", "--strict", "--json"],
  ]);
  assert.deepEqual(report.operatorRunbook.nextStageCommandRunPolicies, ["read-only"]);
  assert.deepEqual(report.operatorRunbook.nextStageCommandSafetyLevels, ["local-read-only"]);
  assert.deepEqual(report.operatorRunbook.nextStageOutputFiles, []);
  assert.equal(report.operatorRunbook.nextStageHasCommands, true);
  assert.equal(report.operatorRunbook.nextStageManual, false);
  assert.equal(report.operatorRunbook.nextStageWritesLocalFile, false);
  assert.equal(report.operatorRunbook.nextStageExternalCalls, false);
  assert.equal(report.operatorRunbook.nextStageTargetRepoMutation, false);
  assert.deepEqual(report.operatorRunbook.nextStageCommandKeys, ["source.bundleCheck.strict"]);
  assert.equal(report.operatorRunbook.nextCommand, report.commandManifest.commands[1].command);
  assert.deepEqual(report.operatorRunbook.nextCommandArgs, ["design-ai", "site", dir, "--bundle-check", "--strict", "--json"]);
  assert.equal(report.operatorRunbook.nextCommandRunPolicy, "read-only");
  assert.equal(report.operatorRunbook.nextCommandSafetyLevel, "local-read-only");
  assert.deepEqual(report.operatorRunbook.nextCommandSafety, report.commandManifest.commands[1].safety);
  assert.deepEqual(report.operatorRunbook.nextCommandEntry, report.commandManifest.commands[1]);
  assert.deepEqual(report.operatorRunbook.stages[0].commandKeys, ["source.bundleCheck.strict"]);
  assert.deepEqual(report.operatorRunbook.stageByKey.verifySourceBundle, report.operatorRunbook.stages[0]);
  assert.equal(report.operatorRunbook.stages[0].runPolicy, "read-only");
  assert.equal(report.operatorRunbook.stages[0].safetyLevel, "local-read-only");
  assert.deepEqual(report.operatorRunbook.stages[2].commandKeys, ["task.task-accessibility.handoff.strict"]);
  assert.deepEqual(report.operatorRunbook.stageByKey.writeEffectiveTaskPrompt, report.operatorRunbook.stages[2]);
  assert.equal(report.operatorRunbook.stages[2].runPolicy, "writes-local-file");
  assert.deepEqual(report.operatorRunbook.stages[2].outputFiles, ["target-repo-task-accessibility-handoff.md"]);
  assert.equal(report.operatorRunbook.stages[3].runPolicy, "manual-target-repo");
  assert.equal(report.operatorRunbook.stages[3].commandCount, 0);
  assert.equal(report.bundle.selectedTask, null);
  assert.equal(report.bundle.taskCatalog.count, 3);
  assert.equal(report.bundle.taskCatalog.defaultTaskId, "task-accessibility");
  assert.equal(report.bundle.taskCatalog.selectedTaskId, "");
  assert.equal(report.bundle.taskCatalog.selectionMode, "bundled-default");
  assert.equal(report.bundle.defaultTask.id, "task-accessibility");
  assert.equal(report.bundle.defaultTask.handoffOutFile, "target-repo-task-accessibility-handoff.md");
  assert.match(report.bundle.defaultTask.strictHandoffCommand, /--bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md/);
  assert.deepEqual(report.bundle.defaultTask.handoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.deepEqual(report.bundle.defaultTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--strict", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.equal(report.bundle.defaultTask.handoffCommandRunPolicy, "writes-local-file");
  assert.deepEqual(report.bundle.defaultTask.strictHandoffCommandSafety, {
    runPolicy: "writes-local-file",
    safetyLevel: "local-output-file",
    writesLocalFile: true,
    outputFile: "target-repo-task-accessibility-handoff.md",
    mutates: "local-output-file-only",
    externalCalls: false,
    targetRepoMutation: false,
    requiresCleanWorkspace: false,
    requiresReviewBeforeMutation: false,
    strict: true,
  });
  assert.equal(report.bundle.effectiveTask.id, "task-accessibility");
  assert.equal(report.bundle.effectiveTask.handoffOutFile, "target-repo-task-accessibility-handoff.md");
  assert.match(report.bundle.effectiveTask.strictHandoffCommand, /--bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md/);
  assert.deepEqual(report.bundle.effectiveTask.handoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.deepEqual(report.bundle.effectiveTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--strict", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.equal(report.bundle.effectiveTask.strictHandoffCommandRunPolicy, "writes-local-file");
  assert.equal(report.bundle.effectiveTask.strictHandoffCommandSafety.targetRepoMutation, false);
  assert.equal(report.bundle.effectiveTask.strictHandoffCommandSafety.externalCalls, false);
  assert.deepEqual(report.bundle.taskCatalog.items.map((task) => `${task.number}:${task.id}`), [
    "1:task-accessibility",
    "2:task-homepage-cta",
    "3:task-content-quality",
  ]);
  assert.equal(report.bundle.taskCatalog.items[0].handoffOutFile, "target-repo-task-accessibility-handoff.md");
  assert.match(report.bundle.taskCatalog.items[0].handoffCommand, /design-ai site .* --bundle-handoff --task task-accessibility --out target-repo-task-accessibility-handoff\.md/);
  assert.deepEqual(report.bundle.taskCatalog.items[0].handoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.match(report.bundle.taskCatalog.items[0].strictHandoffCommand, /design-ai site .* --bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md/);
  assert.deepEqual(report.bundle.taskCatalog.items[0].strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--strict", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.equal(report.bundle.taskCatalog.items[0].handoffCommandSafety.strict, false);
  assert.equal(report.bundle.taskCatalog.items[0].strictHandoffCommandSafety.strict, true);
  assert.equal(report.bundle.taskCatalog.items[0].strictHandoffCommandSafety.outputFile, "target-repo-task-accessibility-handoff.md");
  assert.equal(report.bundle.mcpProbeStatus, "pass");
  assert.deepEqual(report.bundle.mcpProbeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.deepEqual(report.bundle.implementationEvidence, {
    executedWork: 0,
    verificationResults: 0,
    remainingRisks: 3,
    nextActions: 0,
  });
  assert.match(report.bundle.checksumBundleDigest, /^[a-f0-9]{64}$/);
  assert.equal(report.bundle.verifiedChecksumFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.bundle.verifiedGeneratedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(report.bundle.generatedFailures, 0);
  assert.deepEqual(report.bundle.generatedDriftFiles, []);
  assert.deepEqual(report.bundle.boundaries, report.boundaries);
  assert.equal(report.bundle.externalCalls, false);
  assert.equal(report.bundle.targetRepoMutation, false);
  assert.equal(report.bundle.repairGuidance.available, true);
  assert.equal(report.bundle.repairGuidance.targetRepoMutation, false);
  assert.deepEqual(report.bundle.executionChecklist.map((item) => item.id), [
    "confirm-target-repo",
    "inspect-architecture",
    "apply-focused-task",
    "verify-quality-gates",
    "record-handoff-evidence",
  ]);
  assert.match(report.bundle.repairGuidance.command, /website-workspace\.tasks\.json --bundle --out .* --force/);
  assert.match(report.bundle.repairGuidance.previewReportCommand, /--bundle-repair --json --out .*repair-preview\.json/);
  assert.match(report.bundle.repairGuidance.applyReportCommand, /--bundle-repair --yes --json --out .*repair-applied\.json/);
  assert.equal(report.files.find((file) => file.path === "codex-implementation.md").included, true);
  assert.match(report.prompt, /Website improvement target-repo handoff prompt/);
  assert.match(report.prompt, /You are Codex working in the target website repository, not in the design-ai repository/);
  assert.match(report.prompt, /Source bundle provenance: pass\/valid from /);
  assert.match(report.prompt, /Source bundle strict check command: `design-ai site .* --bundle-check --strict --json`/);
  assert.match(report.prompt, /SHA-256 bundle digest: [a-f0-9]{64}/);
  assert.match(report.prompt, /Evidence counts: executed work 0, verification 0, risks 3, next actions 0/);
  assert.match(report.prompt, new RegExp(`Generated files: ${SITE_BUNDLE_CHECKSUM_FILES.length}/${SITE_BUNDLE_CHECKSUM_FILES.length} match the current CLI bundle contract`));
  assert.match(report.prompt, /MCP probe status: pass/);
  assert.match(report.prompt, /Primary task selection: bundled codex-implementation\.md default/);
  assert.match(report.prompt, /Available Bundle Tasks/);
  assert.match(report.prompt, /Default task: task-accessibility/);
  assert.match(report.prompt, /Default task strict command: `design-ai site .* --bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md`/);
  assert.match(report.prompt, /Selected task: none/);
  assert.match(report.prompt, /Effective task: task-accessibility/);
  assert.match(report.prompt, /Effective task strict command: `design-ai site .* --bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md`/);
  assert.match(report.prompt, /1\. \[p0\/high\/medium\] task-accessibility:/);
  assert.match(report.prompt, /command: `design-ai site .* --bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md`/);
  assert.match(report.prompt, /3\. \[p1\/medium\/medium\] task-content-quality:/);
  assert.match(report.prompt, /## Operator Runbook/);
  assert.match(report.prompt, /Runbook stages: 5 \(4 required, 1 optional\)/);
  assert.match(report.prompt, /Next command key: source\.bundleCheck\.strict/);
  assert.match(report.prompt, /1\. verifySourceBundle \(required, read-only\): Verify source bundle integrity\. command: `design-ai site .* --bundle-check --strict --json`/);
  assert.match(report.prompt, /3\. writeEffectiveTaskPrompt \(required, writes-local-file\): Write effective task handoff prompt\. command: `design-ai site .* --bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md` output: target-repo-task-accessibility-handoff\.md/);
  assert.match(report.prompt, /4\. executeInTargetRepo \(required, manual-target-repo\): Execute the task in the target website repo\. command: manual/);
  assert.match(report.prompt, /MCP probes: 4\/4 passing, 0 warning, 0 failing/);
  assert.match(report.prompt, /mcp-probes\.json/);
  assert.match(report.prompt, /Generated drift files: none/);
  assert.match(report.prompt, /Handoff generation boundary flags: external calls no; target repo mutation no/);
  assert.match(report.prompt, /Handoff boundaries: deterministic-local, no-external-mcp-calls, no-target-repo-mutation, no-lighthouse-axe-visual-diff, target-repo-work-after-handoff/);
  assert.match(report.prompt, /Target Repo Execution Checklist/);
  assert.match(report.prompt, /Run target repo quality gates/);
  assert.match(report.prompt, /Repair guidance:\n- Available: yes/);
  assert.match(report.prompt, /Regenerate: design-ai site .*website-workspace\.tasks\.json --bundle --out .* --force/);
  assert.match(report.prompt, /Preview report: design-ai site .* --bundle-repair --json --out .*repair-preview\.json/);
  assert.match(report.prompt, /Apply report: design-ai site .* --bundle-repair --yes --json --out .*repair-applied\.json/);
  assert.match(report.prompt, /# Codex implementation prompt/);
  assert.match(report.prompt, /Task ID: task-accessibility/);
  assert.match(report.prompt, /Required Final Response/);
  assert.equal(json.status, "pass");
  assert.deepEqual(json.sourceBundle, report.sourceBundle);
  assert.deepEqual(json.bundle.sourceBundle, report.sourceBundle);
  assert.deepEqual(json.commandManifest, report.commandManifest);
  assert.deepEqual(json.bundle.commandManifest, report.commandManifest);
  assert.deepEqual(json.operatorRunbook, report.operatorRunbook);
  assert.deepEqual(json.bundle.operatorRunbook, report.operatorRunbook);
  assert.equal(json.commandManifest.commandCount, 10);
  assert.equal(json.commandManifest.readOnlyCount, 4);
  assert.equal(json.commandManifest.localOutputFileCount, 6);
  assert.equal(json.commandManifest.effectiveStrictTaskCommandKey, "task.task-accessibility.handoff.strict");
  assert.equal(json.commandManifest.commands[3].key, "source.bundleHandoff.strict");
  assert.equal(json.commandManifest.commands[3].safety.strict, true);
  assert.equal(json.commandManifest.commands[5].key, "task.task-accessibility.handoff.strict");
  assert.equal(json.commandManifest.commands[5].safety.targetRepoMutation, false);
  assert.equal(json.sourceBundle.checkCommandRunPolicy, "read-only");
  assert.equal(json.sourceBundle.checkCommandSafety.safetyLevel, "local-read-only");
  assert.equal(json.sourceBundle.strictCheckCommandSafety.strict, true);
  assert.equal(json.sourceBundle.handoffCommandRunPolicy, "read-only");
  assert.equal(json.sourceBundle.handoffCommandSafety.targetRepoMutation, false);
  assert.equal(json.sourceBundle.strictHandoffCommandSafety.externalCalls, false);
  assert.deepEqual(json.boundaries, report.boundaries);
  assert.equal(json.externalCalls, false);
  assert.equal(json.targetRepoMutation, false);
  assert.equal(json.bundle.mcpProbeStatus, "pass");
  assert.deepEqual(json.bundle.mcpProbeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.deepEqual(json.bundle.implementationEvidence, {
    executedWork: 0,
    verificationResults: 0,
    remainingRisks: 3,
    nextActions: 0,
  });
  assert.equal(json.bundle.verifiedGeneratedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
  assert.equal(json.bundle.generatedFailures, 0);
  assert.deepEqual(json.bundle.generatedDriftFiles, []);
  assert.deepEqual(json.bundle.boundaries, report.boundaries);
  assert.equal(json.bundle.externalCalls, false);
  assert.equal(json.bundle.targetRepoMutation, false);
  assert.equal(json.bundle.repairGuidance.available, true);
  assert.equal(json.bundle.selectedTask, null);
  assert.equal(json.bundle.taskCatalog.count, 3);
  assert.equal(json.bundle.defaultTask.id, "task-accessibility");
  assert.match(json.bundle.defaultTask.strictHandoffCommand, /--bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md/);
  assert.deepEqual(json.bundle.defaultTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--strict", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.equal(json.bundle.defaultTask.strictHandoffCommandRunPolicy, "writes-local-file");
  assert.equal(json.bundle.defaultTask.strictHandoffCommandSafety.writesLocalFile, true);
  assert.equal(json.bundle.effectiveTask.id, "task-accessibility");
  assert.match(json.bundle.effectiveTask.strictHandoffCommand, /--bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md/);
  assert.deepEqual(json.bundle.effectiveTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-accessibility", "--strict", "--out", "target-repo-task-accessibility-handoff.md"]);
  assert.equal(json.bundle.effectiveTask.strictHandoffCommandSafety.safetyLevel, "local-output-file");
  assert.deepEqual(json.bundle.taskCatalog.items.map((task) => task.id), [
    "task-accessibility",
    "task-homepage-cta",
    "task-content-quality",
  ]);
  assert.equal(json.bundle.taskCatalog.items[2].handoffOutFile, "target-repo-task-content-quality-handoff.md");
  assert.match(json.bundle.taskCatalog.items[2].strictHandoffCommand, /--task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md/);
  assert.deepEqual(json.bundle.taskCatalog.items[2].strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-content-quality", "--strict", "--out", "target-repo-task-content-quality-handoff.md"]);
  assert.deepEqual(json.bundle.taskCatalog.items[2].strictHandoffCommandSafety, {
    runPolicy: "writes-local-file",
    safetyLevel: "local-output-file",
    writesLocalFile: true,
    outputFile: "target-repo-task-content-quality-handoff.md",
    mutates: "local-output-file-only",
    externalCalls: false,
    targetRepoMutation: false,
    requiresCleanWorkspace: false,
    requiresReviewBeforeMutation: false,
    strict: true,
  });
  assert.match(json.prompt, /Primary Codex Implementation Prompt/);
  assert.match(human, /Bundle Gate/);

  const selectedReport = buildSiteBundleHandoffReport({ target: dir, taskSelector: "task-content-quality" });
  const selectedJson = JSON.parse(formatSiteBundleHandoffJson(selectedReport));
  assert.equal(selectedReport.status, "pass");
  assert.equal(selectedReport.bundle.selectedTask.id, "task-content-quality");
  assert.equal(selectedReport.bundle.selectedTask.source, "bundle-workspace");
  assert.equal(selectedReport.bundle.selectedTask.handoffOutFile, "target-repo-task-content-quality-handoff.md");
  assert.match(selectedReport.bundle.selectedTask.handoffCommand, /--bundle-handoff --task task-content-quality --out target-repo-task-content-quality-handoff\.md/);
  assert.deepEqual(selectedReport.bundle.selectedTask.handoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-content-quality", "--out", "target-repo-task-content-quality-handoff.md"]);
  assert.equal(selectedReport.bundle.selectedTask.handoffCommandSafety.outputFile, "target-repo-task-content-quality-handoff.md");
  assert.match(selectedReport.bundle.selectedTask.strictHandoffCommand, /--bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md/);
  assert.deepEqual(selectedReport.bundle.selectedTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-content-quality", "--strict", "--out", "target-repo-task-content-quality-handoff.md"]);
  assert.equal(selectedReport.bundle.selectedTask.strictHandoffCommandRunPolicy, "writes-local-file");
  assert.equal(selectedReport.bundle.selectedTask.strictHandoffCommandSafety.strict, true);
  assert.equal(selectedReport.bundle.effectiveTask.id, "task-content-quality");
  assert.equal(selectedReport.bundle.effectiveTask.handoffOutFile, "target-repo-task-content-quality-handoff.md");
  assert.match(selectedReport.bundle.effectiveTask.strictHandoffCommand, /--bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md/);
  assert.deepEqual(selectedReport.bundle.effectiveTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-content-quality", "--strict", "--out", "target-repo-task-content-quality-handoff.md"]);
  assert.equal(selectedReport.bundle.effectiveTask.strictHandoffCommandSafety.outputFile, "target-repo-task-content-quality-handoff.md");
  assert.equal(selectedReport.bundle.taskCatalog.selectedTaskId, "task-content-quality");
  assert.equal(selectedReport.bundle.taskCatalog.selectionMode, "explicit");
  assert.equal(selectedReport.commandManifest.defaultTaskId, "task-accessibility");
  assert.equal(selectedReport.commandManifest.selectedTaskId, "task-content-quality");
  assert.equal(selectedReport.commandManifest.effectiveTaskId, "task-content-quality");
  assert.equal(selectedReport.commandManifest.defaultStrictTaskCommandKey, "task.task-accessibility.handoff.strict");
  assert.equal(selectedReport.commandManifest.selectedStrictTaskCommandKey, "task.task-content-quality.handoff.strict");
  assert.equal(selectedReport.commandManifest.effectiveStrictTaskCommandKey, "task.task-content-quality.handoff.strict");
  assert.equal(selectedReport.commandManifest.commandCount, 10);
  assert.equal(selectedReport.commandManifest.commands[9].taskId, "task-content-quality");
  assert.equal(selectedReport.commandManifest.commands[9].defaultTask, false);
  assert.equal(selectedReport.commandManifest.commands[9].selectedTask, true);
  assert.equal(selectedReport.commandManifest.commands[9].effectiveTask, true);
  assert.equal(selectedReport.operatorRunbook.effectiveTaskId, "task-content-quality");
  assert.equal(selectedReport.operatorRunbook.effectiveStrictTaskCommandKey, "task.task-content-quality.handoff.strict");
  assert.deepEqual(selectedReport.operatorRunbook.stages[2].commandKeys, ["task.task-content-quality.handoff.strict"]);
  assert.deepEqual(selectedReport.operatorRunbook.stageByKey.writeEffectiveTaskPrompt.commandKeys, ["task.task-content-quality.handoff.strict"]);
  assert.deepEqual(selectedReport.operatorRunbook.stages[2].outputFiles, ["target-repo-task-content-quality-handoff.md"]);
  assert.equal(selectedJson.bundle.selectedTask.selector, "task-content-quality");
  assert.equal(selectedJson.commandManifest.selectedStrictTaskCommandKey, "task.task-content-quality.handoff.strict");
  assert.equal(selectedJson.bundle.commandManifest.effectiveStrictTaskCommandKey, "task.task-content-quality.handoff.strict");
  assert.equal(selectedJson.operatorRunbook.effectiveStrictTaskCommandKey, "task.task-content-quality.handoff.strict");
  assert.equal(selectedJson.bundle.operatorRunbook.stages[2].commands[0].key, "task.task-content-quality.handoff.strict");
  assert.equal(selectedJson.operatorRunbook.stageByKey.writeEffectiveTaskPrompt.commands[0].key, "task.task-content-quality.handoff.strict");
  assert.equal(selectedJson.bundle.operatorRunbook.nextCommandEntry.key, "source.bundleCheck.strict");
  assert.equal(selectedJson.bundle.selectedTask.handoffOutFile, "target-repo-task-content-quality-handoff.md");
  assert.match(selectedJson.bundle.selectedTask.strictHandoffCommand, /--bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md/);
  assert.deepEqual(selectedJson.bundle.selectedTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-content-quality", "--strict", "--out", "target-repo-task-content-quality-handoff.md"]);
  assert.equal(selectedJson.bundle.selectedTask.strictHandoffCommandSafety.targetRepoMutation, false);
  assert.equal(selectedJson.bundle.effectiveTask.id, "task-content-quality");
  assert.match(selectedJson.bundle.effectiveTask.strictHandoffCommand, /--bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md/);
  assert.deepEqual(selectedJson.bundle.effectiveTask.strictHandoffCommandArgs, ["design-ai", "site", dir, "--bundle-handoff", "--task", "task-content-quality", "--strict", "--out", "target-repo-task-content-quality-handoff.md"]);
  assert.equal(selectedJson.bundle.effectiveTask.strictHandoffCommandSafety.externalCalls, false);
  assert.equal(selectedJson.bundle.taskCatalog.selectedTaskId, "task-content-quality");
  assert.match(selectedReport.prompt, /Primary task selection: task-content-quality/);
  assert.match(selectedReport.prompt, /Selected task: task-content-quality/);
  assert.match(selectedReport.prompt, /Selected task strict command: `design-ai site .* --bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md`/);
  assert.match(selectedReport.prompt, /Effective task: task-content-quality/);
  assert.match(selectedReport.prompt, /Effective task strict command: `design-ai site .* --bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md`/);
  assert.match(selectedReport.prompt, /Task ID: task-content-quality/);

  const selectedByNumberReport = buildSiteBundleHandoffReport({ target: dir, taskSelector: "3" });
  assert.equal(selectedByNumberReport.bundle.selectedTask.id, "task-content-quality");
  assert.match(selectedByNumberReport.prompt, /Task ID: task-content-quality/);
  assert.throws(
    () => buildSiteBundleHandoffReport({ target: dir, taskSelector: "missing-task" }),
    /Unknown refactor task: missing-task/,
  );

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
    assert.match(probePayload.commands.mcpCheckProbesHumanOut, /--mcp-check --probes --out mcp-check-probes\.txt/);
    assert.match(probePayload.commands.mcpCheckProbesJsonOut, /--mcp-check --probes --json --out mcp-check-probes\.json/);
    assert.match(probePayload.commands.mcpPlanProbesJson, /--mcp-plan --probes --json/);
    assert.match(probePayload.commands.mcpPlanProbesJsonOut, /--mcp-plan --probes --json --out mcp-action-plan-probes\.json/);

    const humanOutput = await captureConsole(() => runSite([file, "--mcp-check"]));
    assert.match(humanOutput.stdout, /Website Improvement MCP readiness/);
    assert.match(humanOutput.stdout, /Task MCP gaps:\n- none/);
    assert.doesNotMatch(humanOutput.stdout, /Probe commands:/);

    const probeHumanOutput = await captureConsole(() => runSite([file, "--mcp-check", "--probes"]));
    assert.match(probeHumanOutput.stdout, /Read-only probes:/);
    assert.match(probeHumanOutput.stdout, /Browser smoke target/);
    assert.match(probeHumanOutput.stdout, /Probe commands:/);
    assert.match(probeHumanOutput.stdout, /--mcp-check --probes --out mcp-check-probes\.txt/);
    assert.match(probeHumanOutput.stdout, /--mcp-check --probes --json --out mcp-check-probes\.json/);
    assert.match(probeHumanOutput.stdout, /--mcp-plan --probes --json/);
    assert.match(probeHumanOutput.stdout, /--mcp-plan --probes --json --out mcp-action-plan-probes\.json/);

    const probeHumanOutFile = path.join(dir, "mcp-check-probes.txt");
    const probeHumanWriteOutput = await captureConsole(() => runSite([file, "--mcp-check", "--probes", "--out", probeHumanOutFile]));
    assert.match(probeHumanWriteOutput.stdout, /Wrote /);
    const probeHumanFile = readFileSync(probeHumanOutFile, "utf8");
    assert.match(probeHumanFile, /Read-only probes:/);
    assert.match(probeHumanFile, /Probe commands:/);
    assert.match(probeHumanFile, /--mcp-check --probes --json --out mcp-check-probes\.json/);

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

    const jsonOutput = await captureConsole(() => runSite([file, "--mcp-plan", "--probes", "--json"]));
    const json = JSON.parse(jsonOutput.stdout);
    assert.equal(json.kind, "website-improvement-mcp-action-plan");
    assert.equal(json.probes.status, "pass");
    assert.equal(json.externalCalls, false);
    assert.equal(json.targetRepoMutation, false);
    assert.match(json.commands.mcpCheck, /--mcp-check --strict --json/);
    assert.match(json.commands.mcpCheckProbesHumanOut, /--mcp-check --probes --out mcp-check-probes\.txt/);
    assert.match(json.commands.mcpCheckProbesJsonOut, /--mcp-check --probes --json --out mcp-check-probes\.json/);
    assert.match(json.commands.mcpPlanProbesJsonOut, /--mcp-plan --probes --json --out mcp-action-plan-probes\.json/);
    assert.equal(jsonOutput.exitCode, undefined);

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
    const nextActions = path.join(dir, "out", "next-actions.json");
    const nextActionsHuman = path.join(dir, "out", "next-actions.md");
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

    const nextActionsHumanOutput = await captureConsole(() => runSite([file, "--next-actions"]));
    assert.match(nextActionsHumanOutput.stdout, /Website Improvement next actions/);
    assert.match(nextActionsHumanOutput.stdout, /Prepare Codex implementation prompt/);

    writeFileSync(nextActionsHuman, "stale next actions\n", "utf8");
    const nextActionsHumanWriteOutput = await captureConsole(() => runSite([file, "--next-actions", "--out", nextActionsHuman, "--force"]));
    assert.match(nextActionsHumanWriteOutput.stdout, /Wrote /);
    const nextActionsHumanFile = readFileSync(nextActionsHuman, "utf8");
    assert.match(nextActionsHumanFile, /Website Improvement next actions: Korean SaaS marketing site/);
    assert.match(nextActionsHumanFile, /Actions: 3 \(0 blocking, 0 warning\)/);
    assert.match(nextActionsHumanFile, new RegExp(`Command: \`design-ai site ${file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} --prompt codex-implementation --task 1 --out codex-implementation\\.md\``));
    assert.match(nextActionsHumanFile, /does not call external MCPs, mutate the target website repo/);
    assert.doesNotMatch(nextActionsHumanFile, /stale next actions/);
    assert.doesNotMatch(nextActionsHumanFile, /"kind": "website-improvement-next-actions"/);

    const nextActionsOutput = await captureConsole(() => runSite([file, "--next-actions", "--json", "--out", nextActions]));
    assert.match(nextActionsOutput.stdout, /Wrote /);
    const nextActionsPayload = JSON.parse(readFileSync(nextActions, "utf8"));
    assert.equal(nextActionsPayload.kind, "website-improvement-next-actions");
    assert.equal(nextActionsPayload.status, "pass");
    assert.equal(nextActionsPayload.actions[0].command, `design-ai site ${file} --prompt codex-implementation --task 1 --out codex-implementation.md`);

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
    assert.equal(existsSync(path.join(bundleDir, "mcp-probes.json")), true);
    assert.equal(existsSync(path.join(bundleDir, "mcp-action-plan.md")), true);
    assert.equal(existsSync(path.join(bundleDir, "website-handoff.md")), true);
    assert.equal(existsSync(path.join(bundleDir, "website-prompts.md")), true);
    assert.equal(existsSync(path.join(bundleDir, "codex-implementation.md")), true);
    assert.equal(JSON.parse(readFileSync(path.join(bundleDir, "summary.json"), "utf8")).taskGeneration.totalTasks, 3);
    assert.equal(JSON.parse(readFileSync(path.join(bundleDir, "mcp-check.json"), "utf8")).status, "pass");
    assert.equal(JSON.parse(readFileSync(path.join(bundleDir, "mcp-probes.json"), "utf8")).status, "pass");
    assert.match(readFileSync(path.join(bundleDir, "codex-implementation.md"), "utf8"), /Task ID: task-accessibility/);

    const bundleCheckOutput = await captureConsole(() => runSite([bundleDir, "--bundle-check", "--json"]));
    const bundleCheckPayload = JSON.parse(bundleCheckOutput.stdout);
    assert.equal(bundleCheckPayload.status, "pass");
    assert.equal(bundleCheckPayload.counts.presentFiles, SITE_BUNDLE_FILES.length);
    assert.equal(bundleCheckPayload.counts.verifiedGeneratedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
    assert.equal(bundleCheckPayload.counts.generatedFailures, 0);
    assert.equal(bundleCheckPayload.generatedContract.available, true);
    assert.deepEqual(bundleCheckPayload.generatedContract.driftFiles, []);
    assert.equal(bundleCheckPayload.repairGuidance.available, true);
    assert.match(bundleCheckPayload.repairGuidance.command, /website-workspace\.tasks\.json --bundle --out .* --force/);
    assert.match(bundleCheckPayload.repairGuidance.previewReportCommand, /--bundle-repair --json --out .*repair-preview\.json/);
    assert.match(bundleCheckPayload.repairGuidance.applyReportCommand, /--bundle-repair --yes --json --out .*repair-applied\.json/);
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
    assert.equal(bundleComparePayload.left.verifiedGeneratedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
    assert.equal(bundleComparePayload.right.verifiedGeneratedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
    assert.deepEqual(bundleComparePayload.left.generatedDriftFiles, []);
    assert.deepEqual(bundleComparePayload.right.generatedDriftFiles, []);
    assert.deepEqual(bundleComparePayload.left.implementationEvidence, {
      executedWork: 0,
      verificationResults: 0,
      remainingRisks: 3,
      nextActions: 0,
    });

    const bundleCompareHumanOutput = await captureConsole(() => runSite([bundleDir, "--bundle-compare", bundleDir]));
    assert.match(bundleCompareHumanOutput.stdout, /Website Improvement handoff bundle compare/);
    assert.match(bundleCompareHumanOutput.stdout, /MCP probes: left 4\/4 passing, 0 warning, 0 failing, right 4\/4 passing, 0 warning, 0 failing/);

    const bundleCompareFile = path.join(dir, "out", "handoff-bundle-compare.json");
    const bundleCompareWriteOutput = await captureConsole(() => runSite([bundleDir, "--bundle-compare", bundleDir, "--json", "--out", bundleCompareFile]));
    assert.match(bundleCompareWriteOutput.stdout, /Wrote /);
    assert.equal(JSON.parse(readFileSync(bundleCompareFile, "utf8")).digestMatch, true);

    const bundleHandoffOutput = await captureConsole(() => runSite([bundleDir, "--bundle-handoff"]));
    assert.match(bundleHandoffOutput.stdout, /Website improvement target-repo handoff prompt/);
    assert.match(bundleHandoffOutput.stdout, /Task ID: task-accessibility/);
    assert.match(bundleHandoffOutput.stdout, /Effective task: task-accessibility/);
    assert.match(bundleHandoffOutput.stdout, /Effective task strict command: `design-ai site .* --bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md`/);

    const bundleHandoffJsonOutput = await captureConsole(() => runSite([bundleDir, "--bundle-handoff", "--json"]));
    const bundleHandoffPayload = JSON.parse(bundleHandoffJsonOutput.stdout);
    assert.equal(bundleHandoffPayload.status, "pass");
    assert.deepEqual(bundleHandoffPayload.sourceBundle, bundleHandoffPayload.bundle.sourceBundle);
    assert.equal(bundleHandoffPayload.sourceBundle.directory, bundleDir);
    assert.equal(bundleHandoffPayload.sourceBundle.sourceWorkspace, file);
    assert.equal(bundleHandoffPayload.sourceBundle.status, "pass");
    assert.equal(bundleHandoffPayload.sourceBundle.valid, true);
    assert.match(bundleHandoffPayload.sourceBundle.strictCheckCommand, /design-ai site .* --bundle-check --strict --json/);
    assert.deepEqual(bundleHandoffPayload.sourceBundle.strictCheckCommandArgs, ["design-ai", "site", bundleDir, "--bundle-check", "--strict", "--json"]);
    assert.match(bundleHandoffPayload.sourceBundle.strictHandoffCommand, /design-ai site .* --bundle-handoff --strict --json/);
    assert.deepEqual(bundleHandoffPayload.sourceBundle.strictHandoffCommandArgs, ["design-ai", "site", bundleDir, "--bundle-handoff", "--strict", "--json"]);
    assert.match(bundleHandoffPayload.bundle.checksumBundleDigest, /^[a-f0-9]{64}$/);
    assert.equal(bundleHandoffPayload.bundle.verifiedGeneratedFiles, SITE_BUNDLE_CHECKSUM_FILES.length);
    assert.equal(bundleHandoffPayload.bundle.generatedFailures, 0);
    assert.deepEqual(bundleHandoffPayload.bundle.generatedDriftFiles, []);
    assert.equal(bundleHandoffPayload.bundle.taskCatalog.count, 3);
    assert.equal(bundleHandoffPayload.bundle.taskCatalog.defaultTaskId, "task-accessibility");
    assert.equal(bundleHandoffPayload.bundle.defaultTask.id, "task-accessibility");
    assert.match(bundleHandoffPayload.bundle.defaultTask.strictHandoffCommand, /--task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md/);
    assert.deepEqual(bundleHandoffPayload.bundle.defaultTask.strictHandoffCommandArgs, ["design-ai", "site", bundleDir, "--bundle-handoff", "--task", "task-accessibility", "--strict", "--out", "target-repo-task-accessibility-handoff.md"]);
    assert.equal(bundleHandoffPayload.bundle.defaultTask.strictHandoffCommandRunPolicy, "writes-local-file");
    assert.equal(bundleHandoffPayload.bundle.defaultTask.strictHandoffCommandSafety.outputFile, "target-repo-task-accessibility-handoff.md");
    assert.equal(bundleHandoffPayload.bundle.defaultTask.strictHandoffCommandSafety.targetRepoMutation, false);
    assert.equal(bundleHandoffPayload.bundle.effectiveTask.id, "task-accessibility");
    assert.match(bundleHandoffPayload.bundle.effectiveTask.strictHandoffCommand, /--task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md/);
    assert.deepEqual(bundleHandoffPayload.bundle.effectiveTask.strictHandoffCommandArgs, ["design-ai", "site", bundleDir, "--bundle-handoff", "--task", "task-accessibility", "--strict", "--out", "target-repo-task-accessibility-handoff.md"]);
    assert.equal(bundleHandoffPayload.bundle.effectiveTask.strictHandoffCommandSafety.externalCalls, false);
    assert.deepEqual(bundleHandoffPayload.bundle.taskCatalog.items.map((task) => `${task.number}:${task.id}`), [
      "1:task-accessibility",
      "2:task-homepage-cta",
      "3:task-content-quality",
    ]);
    assert.equal(bundleHandoffPayload.bundle.taskCatalog.items[0].handoffOutFile, "target-repo-task-accessibility-handoff.md");
    assert.match(bundleHandoffPayload.bundle.taskCatalog.items[0].strictHandoffCommand, /--task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md/);
    assert.deepEqual(bundleHandoffPayload.bundle.taskCatalog.items[0].strictHandoffCommandArgs, ["design-ai", "site", bundleDir, "--bundle-handoff", "--task", "task-accessibility", "--strict", "--out", "target-repo-task-accessibility-handoff.md"]);
    assert.equal(bundleHandoffPayload.bundle.taskCatalog.items[0].strictHandoffCommandRunPolicy, "writes-local-file");
    assert.equal(bundleHandoffPayload.bundle.taskCatalog.items[0].strictHandoffCommandSafety.writesLocalFile, true);
    assert.equal(bundleHandoffPayload.bundle.repairGuidance.available, true);
    assert.match(bundleHandoffPayload.bundle.repairGuidance.previewReportCommand, /--bundle-repair --json --out .*repair-preview\.json/);
    assert.match(bundleHandoffPayload.bundle.repairGuidance.applyReportCommand, /--bundle-repair --yes --json --out .*repair-applied\.json/);
    assert.deepEqual(bundleHandoffPayload.bundle.implementationEvidence, {
      executedWork: 0,
      verificationResults: 0,
      remainingRisks: 3,
      nextActions: 0,
    });
    assert.match(bundleHandoffPayload.prompt, /Primary Codex Implementation Prompt/);
    assert.match(bundleHandoffPayload.prompt, /Source bundle provenance: pass\/valid from /);
    assert.match(bundleHandoffPayload.prompt, /Source bundle strict check command: `design-ai site .* --bundle-check --strict --json`/);
    assert.match(bundleHandoffPayload.prompt, /Default task strict command: `design-ai site .* --bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md`/);
    assert.match(bundleHandoffPayload.prompt, /Effective task strict command: `design-ai site .* --bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md`/);
    assert.match(bundleHandoffPayload.prompt, /command: `design-ai site .* --bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff\.md`/);
    assert.match(bundleHandoffPayload.prompt, /Repair guidance:\n- Available: yes/);
    assert.match(bundleHandoffPayload.prompt, /Preview report: design-ai site .* --bundle-repair --json --out .*repair-preview\.json/);
    assert.match(bundleHandoffPayload.prompt, /Apply report: design-ai site .* --bundle-repair --yes --json --out .*repair-applied\.json/);

    const selectedBundleHandoffJsonOutput = await captureConsole(() => runSite([bundleDir, "--bundle-handoff", "--task", "task-content-quality", "--json"]));
    const selectedBundleHandoffPayload = JSON.parse(selectedBundleHandoffJsonOutput.stdout);
    assert.equal(selectedBundleHandoffPayload.status, "pass");
    assert.equal(selectedBundleHandoffPayload.bundle.selectedTask.id, "task-content-quality");
    assert.equal(selectedBundleHandoffPayload.bundle.selectedTask.handoffOutFile, "target-repo-task-content-quality-handoff.md");
    assert.match(selectedBundleHandoffPayload.bundle.selectedTask.strictHandoffCommand, /--bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md/);
    assert.deepEqual(selectedBundleHandoffPayload.bundle.selectedTask.strictHandoffCommandArgs, ["design-ai", "site", bundleDir, "--bundle-handoff", "--task", "task-content-quality", "--strict", "--out", "target-repo-task-content-quality-handoff.md"]);
    assert.equal(selectedBundleHandoffPayload.bundle.selectedTask.strictHandoffCommandRunPolicy, "writes-local-file");
    assert.equal(selectedBundleHandoffPayload.bundle.selectedTask.strictHandoffCommandSafety.outputFile, "target-repo-task-content-quality-handoff.md");
    assert.equal(selectedBundleHandoffPayload.bundle.effectiveTask.id, "task-content-quality");
    assert.match(selectedBundleHandoffPayload.bundle.effectiveTask.strictHandoffCommand, /--bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md/);
    assert.deepEqual(selectedBundleHandoffPayload.bundle.effectiveTask.strictHandoffCommandArgs, ["design-ai", "site", bundleDir, "--bundle-handoff", "--task", "task-content-quality", "--strict", "--out", "target-repo-task-content-quality-handoff.md"]);
    assert.equal(selectedBundleHandoffPayload.bundle.effectiveTask.strictHandoffCommandSafety.targetRepoMutation, false);
    assert.equal(selectedBundleHandoffPayload.bundle.taskCatalog.selectedTaskId, "task-content-quality");
    assert.match(selectedBundleHandoffPayload.prompt, /Selected task strict command: `design-ai site .* --bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md`/);
    assert.match(selectedBundleHandoffPayload.prompt, /Effective task strict command: `design-ai site .* --bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md`/);
    assert.match(selectedBundleHandoffPayload.prompt, /Task ID: task-content-quality/);

    const bundleHandoffFile = path.join(dir, "out", "target-repo-handoff.md");
    const bundleHandoffWriteOutput = await captureConsole(() => runSite([bundleDir, "--bundle-handoff", "--out", bundleHandoffFile]));
    assert.match(bundleHandoffWriteOutput.stdout, /Wrote /);
    assert.match(readFileSync(bundleHandoffFile, "utf8"), /Website improvement target-repo handoff prompt/);

    const selectedBundleHandoffFile = path.join(dir, "out", "target-repo-task-handoff.md");
    const selectedBundleHandoffWriteOutput = await captureConsole(() => runSite([bundleDir, "--bundle-handoff", "--task", "3", "--out", selectedBundleHandoffFile]));
    assert.match(selectedBundleHandoffWriteOutput.stdout, /Wrote /);
    assert.match(readFileSync(selectedBundleHandoffFile, "utf8"), /Task ID: task-content-quality/);
    assert.match(readFileSync(selectedBundleHandoffFile, "utf8"), /Effective task: task-content-quality/);
    assert.match(readFileSync(selectedBundleHandoffFile, "utf8"), /Effective task strict command: `design-ai site .* --bundle-handoff --task task-content-quality --strict --out target-repo-task-content-quality-handoff\.md`/);

    const repairHandoffPath = path.join(bundleDir, "website-handoff.md");
    const originalRepairHandoff = readFileSync(repairHandoffPath, "utf8");
    const tamperedRepairHandoff = `${originalRepairHandoff}\nManual edit before bundle repair.\n`;
    writeFileSync(repairHandoffPath, tamperedRepairHandoff, "utf8");

    const repairPreviewOutput = await captureConsole(() => runSite([bundleDir, "--bundle-repair", "--json"]));
    const repairPreviewPayload = JSON.parse(repairPreviewOutput.stdout);
    assert.equal(repairPreviewPayload.status, "pass");
    assert.equal(repairPreviewPayload.dryRun, true);
    assert.equal(repairPreviewPayload.applied, false);
    assert.equal(repairPreviewPayload.before.status, "fail");
    assert.deepEqual(repairPreviewPayload.before.generatedDriftFiles, ["website-handoff.md"]);
    assert.match(repairPreviewPayload.repairGuidance.previewReportCommand, /--bundle-repair --json --out .*repair-preview\.json/);
    assert.match(repairPreviewPayload.repairGuidance.applyReportCommand, /--bundle-repair --yes --json --out .*repair-applied\.json/);
    assert.equal(readFileSync(repairHandoffPath, "utf8"), tamperedRepairHandoff);

    const repairPreviewFile = path.join(dir, "bundle-repair-preview.json");
    const repairPreviewWriteOutput = await captureConsole(() => runSite([bundleDir, "--bundle-repair", "--json", "--out", repairPreviewFile]));
    assert.match(repairPreviewWriteOutput.stdout, /Wrote /);
    const repairPreviewFilePayload = JSON.parse(readFileSync(repairPreviewFile, "utf8"));
    assert.equal(repairPreviewFilePayload.dryRun, true);
    assert.equal(repairPreviewFilePayload.applied, false);
    assert.equal(readFileSync(repairHandoffPath, "utf8"), tamperedRepairHandoff);

    const repairApplyFile = path.join(dir, "bundle-repair-applied.json");
    const repairApplyOutput = await captureConsole(() => runSite([bundleDir, "--bundle-repair", "--yes", "--json", "--out", repairApplyFile]));
    assert.match(repairApplyOutput.stdout, /Wrote /);
    const repairApplyPayload = JSON.parse(readFileSync(repairApplyFile, "utf8"));
    assert.equal(repairApplyPayload.status, "pass");
    assert.equal(repairApplyPayload.dryRun, false);
    assert.equal(repairApplyPayload.applied, true);
    assert.equal(repairApplyPayload.before.status, "fail");
    assert.equal(repairApplyPayload.after.status, "pass");
    assert.deepEqual(repairApplyPayload.after.generatedDriftFiles, []);
    assert.equal(repairApplyPayload.written.count, SITE_BUNDLE_FILES.length);
    assert.equal(readFileSync(repairHandoffPath, "utf8"), originalRepairHandoff);

    const repairedBundleCheckOutput = await captureConsole(() => runSite([bundleDir, "--bundle-check", "--strict", "--json"]));
    assert.equal(JSON.parse(repairedBundleCheckOutput.stdout).status, "pass");
  });
});

test("runSite emits and writes a company website intake template", async () => {
  await withTempDir(async (dir) => {
    const markdownFile = path.join(dir, "company-website-intake.md");
    const jsonFile = path.join(dir, "company-website-intake.json");

    const markdownOutput = await captureConsole(() => runSite(["--intake-template"]));
    assert.match(markdownOutput.stdout, /^# Company Website Intake Template/);
    assert.match(markdownOutput.stdout, /## Target Repo Verification Plan/);
    assert.equal(markdownOutput.exitCode, undefined);

    const jsonOutput = await captureConsole(() => runSite(["--intake-template", "--json"]));
    const payload = JSON.parse(jsonOutput.stdout);
    assert.equal(payload.kind, "website-improvement-intake-template");
    assert.equal(payload.language, "en");
    assert.match(payload.content, /^# Company Website Intake Template/);
    assert.equal(payload.commands.bundleCheck, "design-ai site website-handoff-bundle --bundle-check --strict --json --out website-bundle-check.json --force");

    const koreanJsonOutput = await captureConsole(() => runSite(["--intake-template", "--language", "ko", "--json"]));
    const koreanPayload = JSON.parse(koreanJsonOutput.stdout);
    assert.equal(koreanPayload.language, "ko");
    assert.equal(koreanPayload.recommendedFileName, "company-website-intake.ko.md");
    assert.match(koreanPayload.content, /^# 회사 웹사이트 Intake Template/);

    const markdownWriteOutput = await captureConsole(() => runSite(["--intake-template", "--out", markdownFile]));
    assert.match(markdownWriteOutput.stdout, /Wrote /);
    assert.match(readFileSync(markdownFile, "utf8"), /Keep sensitive credentials/);

    const jsonWriteOutput = await captureConsole(() => runSite(["--intake-template", "--json", "--out", jsonFile]));
    assert.match(jsonWriteOutput.stdout, /Wrote /);
    assert.equal(JSON.parse(readFileSync(jsonFile, "utf8")).recommendedFileName, "company-website-intake.md");

    const koreanMarkdownFile = path.join(dir, "company-website-intake.ko.md");
    const koreanMarkdownWriteOutput = await captureConsole(() => runSite(["--intake-template", "--language", "ko", "--out", koreanMarkdownFile]));
    assert.match(koreanMarkdownWriteOutput.stdout, /Wrote /);
    assert.match(readFileSync(koreanMarkdownFile, "utf8"), /^# 회사 웹사이트 Intake Template/);
  });
});

test("runSite converts a filled intake Markdown into workspace outputs", async () => {
  await withTempDir(async (dir) => {
    const intakeFile = path.join(dir, "company-website-intake.ko.md");
    const workspaceFile = path.join(dir, "website-workspace.json");
    const tasksFile = path.join(dir, "website-workspace.tasks.json");
    const stdinTasksFile = path.join(dir, "website-workspace.stdin.tasks.json");
    const nextActionsFile = path.join(dir, "website-next-actions.json");
    const bundleDir = path.join(dir, "website-handoff-bundle");
    const taskBundleDir = path.join(dir, "website-task-handoff-bundle");

    writeFileSync(intakeFile, `# 회사 웹사이트 Intake Template

## Site Profile

| 항목 | 값 |
|---|---|
| 사이트 이름 | RAPA company site |
| Live URL | https://rapa.example.com |
| 대상 repo URL | https://github.com/acme/rapa-site |
| 배포 플랫폼 | vercel |
| CMS | wordpress |

## 우선순위 페이지

| 우선순위 | Path 또는 URL | 중요한 이유 |
|---:|---|---|
| 1 | / | 첫 인상 |
| 2 | /programs | 전환 |

## 주요 사용자 흐름

| 우선순위 | Flow | 성공 신호 |
|---:|---|---|
| 1 | 방문자가 프로그램을 비교하고 신청 CTA를 클릭 | 신청 CTA 클릭 |

## MCP Readiness Notes

| 시스템 | 상태 | 근거 또는 fallback |
|---|---|---|
| GitHub | required | repo 접근 |
| Browser / Playwright | required | 실제 페이지 QA |
| 배포 플랫폼 | required | preview 확인 |
| CMS | required | WordPress 콘텐츠 |

## 초기 Audit Findings

| Category | Finding | Evidence | Page |
|---|---|---|---|
| Accessibility | Mobile menu focus state is unclear | Keyboard focus ring not documented | / |
`, "utf8");

    const workspaceOutput = await captureConsole(() => runSite(["--from-intake", intakeFile, "--out", workspaceFile]));
    assert.match(workspaceOutput.stdout, /Wrote /);
    const workspace = JSON.parse(readFileSync(workspaceFile, "utf8"));
    assert.equal(workspace.siteProfile.name, "RAPA company site");
    assert.equal(workspace.siteProfile.liveUrl, "https://rapa.example.com");
    assert.deepEqual(workspace.siteProfile.pages, ["/", "/programs"]);
    assert.equal(workspace.mcpReadiness.cms, "required");
    assert.match(workspace.auditChecklist.accessibility.findings[0], /Mobile menu focus state is unclear/);

    const jsonOutput = await captureConsole(() => runSite(["--from-intake", intakeFile, "--json"]));
    assert.equal(JSON.parse(jsonOutput.stdout).siteProfile.name, "RAPA company site");

    const stdinJsonOutput = spawnSync(
      process.execPath,
      [path.join(process.cwd(), "cli/bin/design-ai.mjs"), "site", "--from-intake", "--stdin", "--json"],
      {
        input: readFileSync(intakeFile, "utf8"),
        encoding: "utf8",
      },
    );
    assert.equal(stdinJsonOutput.status, 0, stdinJsonOutput.stderr);
    const stdinWorkspace = JSON.parse(stdinJsonOutput.stdout);
    assert.equal(stdinWorkspace.siteProfile.name, "RAPA company site");
    assert.match(stdinWorkspace.reportNotes, /design-ai site --from-intake --stdin/);

    const stdinNextActionsOutput = spawnSync(
      process.execPath,
      [path.join(process.cwd(), "cli/bin/design-ai.mjs"), "site", "--from-intake", "--stdin", "--next-actions", "--json"],
      {
        input: readFileSync(intakeFile, "utf8"),
        encoding: "utf8",
      },
    );
    assert.equal(stdinNextActionsOutput.status, 0, stdinNextActionsOutput.stderr);
    const stdinNextActions = JSON.parse(stdinNextActionsOutput.stdout);
    assert.equal(stdinNextActions.mode, "from-intake-next-actions");
    assert.match(stdinNextActions.commands.createWorkspace, /--from-intake --stdin/);

    const nextActionsOutput = await captureConsole(() => runSite(["--from-intake", intakeFile, "--next-actions", "--json", "--out", nextActionsFile]));
    assert.match(nextActionsOutput.stdout, /Wrote /);
    const nextActions = JSON.parse(readFileSync(nextActionsFile, "utf8"));
    assert.equal(nextActions.mode, "from-intake-next-actions");
    assert.match(nextActions.commands.createWorkspace, /design-ai site --from-intake/);

    const tasksOutput = await captureConsole(() => runSite(["--from-intake", intakeFile, "--tasks", "--out", tasksFile]));
    assert.match(tasksOutput.stdout, /Wrote /);
    const tasksWorkspace = JSON.parse(readFileSync(tasksFile, "utf8"));
    assert.equal(tasksWorkspace.siteProfile.name, "RAPA company site");
    assert.deepEqual(tasksWorkspace.refactorTasks.map((task) => task.id), ["task-accessibility"]);
    assert.match(tasksWorkspace.refactorTasks[0].problem, /Mobile menu focus state is unclear/);

    const stdinTasksOutput = spawnSync(
      process.execPath,
      [path.join(process.cwd(), "cli/bin/design-ai.mjs"), "site", "--from-intake", "--stdin", "--tasks", "--out", stdinTasksFile, "--force"],
      {
        input: readFileSync(intakeFile, "utf8"),
        encoding: "utf8",
      },
    );
    assert.equal(stdinTasksOutput.status, 0, stdinTasksOutput.stderr);
    assert.match(stdinTasksOutput.stdout, /Wrote /);
    const stdinTasksWorkspace = JSON.parse(readFileSync(stdinTasksFile, "utf8"));
    assert.equal(stdinTasksWorkspace.siteProfile.name, "RAPA company site");
    assert.deepEqual(stdinTasksWorkspace.refactorTasks.map((task) => task.id), ["task-accessibility"]);

    const bundleOutput = await captureConsole(() => runSite(["--from-intake", intakeFile, "--bundle", "--out", bundleDir]));
    assert.match(bundleOutput.stdout, /Wrote Website Improvement handoff bundle/);
    assert.equal(existsSync(path.join(bundleDir, "summary.json")), true);
    assert.equal(JSON.parse(readFileSync(path.join(bundleDir, "summary.json"), "utf8")).taskGeneration.totalTasks, 1);

    const taskBundleOutput = await captureConsole(() => runSite(["--from-intake", intakeFile, "--bundle", "--tasks", "--out", taskBundleDir]));
    assert.match(taskBundleOutput.stdout, /Wrote Website Improvement handoff bundle/);
    const taskBundleSummary = JSON.parse(readFileSync(path.join(taskBundleDir, "summary.json"), "utf8"));
    const taskBundleWorkspace = JSON.parse(readFileSync(path.join(taskBundleDir, "website-workspace.tasks.json"), "utf8"));
    assert.equal(taskBundleSummary.taskGeneration.totalTasks, 1);
    assert.deepEqual(taskBundleWorkspace.refactorTasks.map((task) => task.id), ["task-accessibility"]);
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

test("runSite emits and writes a valid project init workspace", async () => {
  await withTempDir(async (dir) => {
    const outFile = path.join(dir, "company-workspace.json");
    const nextActionsFile = path.join(dir, "company-next-actions.md");

    const initOutput = await captureConsole(() => runSite([
      "--init",
      "--name",
      "Company marketing site",
      "--live-url",
      "https://example.com",
      "--repo-url",
      "https://github.com/acme/site",
      "--page",
      "/",
      "--page",
      "/pricing",
      "--flow",
      "Visitor compares plans and starts signup",
      "--viewport",
      "desktop",
      "--viewport",
      "mobile",
    ]));
    const workspace = JSON.parse(initOutput.stdout);
    assert.equal(workspace.siteProfile.name, "Company marketing site");
    assert.equal(workspace.siteProfile.id, "company-marketing-site");
    assert.deepEqual(workspace.siteProfile.pages, ["/", "/pricing"]);
    assert.deepEqual(workspace.siteProfile.viewports, ["desktop", "mobile"]);
    assert.equal(workspace.mcpReadiness.github, "required");
    assert.equal(workspace.mcpReadiness.browser, "required");
    assert.deepEqual(workspace.refactorTasks, []);
    assert.equal(initOutput.exitCode, undefined);

    const nextActionsOutput = await captureConsole(() => runSite([
      "--init",
      "--name",
      "Company marketing site",
      "--live-url",
      "https://example.com",
      "--repo-url",
      "https://github.com/acme/site",
      "--page",
      "/",
      "--flow",
      "Visitor compares plans and starts signup",
      "--next-actions",
      "--json",
    ]));
    const nextActionsPayload = JSON.parse(nextActionsOutput.stdout);
    assert.equal(nextActionsPayload.kind, "website-improvement-next-actions");
    assert.equal(nextActionsPayload.mode, "init-next-actions");
    assert.equal(nextActionsPayload.actions[0].title, "Save the generated Website Improvement workspace");
    assert.match(nextActionsPayload.commands.createWorkspace, /--out website-workspace\.json/);
    assert.equal(nextActionsOutput.exitCode, undefined);

    const nextActionsWriteOutput = await captureConsole(() => runSite([
      "--init",
      "--name",
      "Company marketing site",
      "--live-url",
      "https://example.com",
      "--repo-url",
      "https://github.com/acme/site",
      "--next-actions",
      "--out",
      nextActionsFile,
    ]));
    assert.match(nextActionsWriteOutput.stdout, /Wrote /);
    assert.match(readFileSync(nextActionsFile, "utf8"), /Website Improvement next actions: Company marketing site/);
    assert.match(readFileSync(nextActionsFile, "utf8"), /Save the generated Website Improvement workspace/);

    const bundleDir = path.join(dir, "company-handoff-bundle");
    const bundleOutput = await captureConsole(() => runSite([
      "--init",
      "--name",
      "Company marketing site",
      "--live-url",
      "https://example.com",
      "--repo-url",
      "https://github.com/acme/site",
      "--page",
      "/",
      "--flow",
      "Visitor compares plans and starts signup",
      "--bundle",
      "--out",
      bundleDir,
    ]));
    assert.match(bundleOutput.stdout, /Wrote Website Improvement handoff bundle/);
    for (const filePath of SITE_BUNDLE_FILES) {
      assert.equal(existsSync(path.join(bundleDir, filePath)), true, `${filePath} should be written`);
    }
    const bundleSummary = JSON.parse(readFileSync(path.join(bundleDir, "summary.json"), "utf8"));
    assert.equal(bundleSummary.site.name, "Company marketing site");
    assert.equal(bundleSummary.source, "website-workspace.json");
    assert.equal(bundleSummary.counts.refactorTasks, 0);
    assert.equal(bundleSummary.taskGeneration.totalTasks, 0);
    assert.deepEqual(bundleSummary.handoff, {
      strictReady: false,
      readiness: "review-warnings-before-strict-handoff",
    recommendedCommand: "design-ai site <bundle-dir> --bundle-handoff --out target-repo-handoff.md",
    strictCommand: "design-ai site <bundle-dir> --bundle-handoff --strict --out target-repo-handoff.md",
    draftCommand: "design-ai site <bundle-dir> --bundle-handoff --out target-repo-handoff.md",
    verifyCommand: "design-ai site <bundle-dir> --bundle-check --strict --json",
    note: "Use the draft handoff command only for planning while readiness warnings remain; use the strict handoff command before treating the bundle as implementation authority.",
    executionChecklist: [
      {
        id: "confirm-target-repo",
        label: "Confirm target repo working directory",
        required: true,
        evidence: "State the target repo path and confirm it is not the design-ai repo before editing.",
      },
      {
        id: "inspect-architecture",
        label: "Inspect existing architecture and design system",
        required: true,
        evidence: "Name the routing, component, styling, token, and test/build surfaces inspected before implementation.",
      },
      {
        id: "apply-focused-task",
        label: "Apply one focused Website Improvement task",
        required: true,
        evidence: "Identify the completed task id/title, changed files, and why the scope stayed limited.",
      },
      {
        id: "verify-quality-gates",
        label: "Run target repo quality gates",
        required: true,
        evidence: "Record lint/typecheck/build/test results plus browser, viewport, accessibility, and deployment checks that were available.",
      },
      {
        id: "record-handoff-evidence",
        label: "Record implementation evidence and remaining risks",
        required: true,
        evidence: "Return executed work, verification results, remaining risks, next actions, and the bundle digest used.",
      },
    ],
  });
    assert.match(readFileSync(path.join(bundleDir, "README.md"), "utf8"), /Strict-ready: no/);
    assert.match(readFileSync(path.join(bundleDir, "README.md"), "utf8"), /Recommended command: `design-ai site <bundle-dir> --bundle-handoff --out target-repo-handoff\.md`/);
    assert.equal(JSON.parse(readFileSync(path.join(bundleDir, "website-workspace.tasks.json"), "utf8")).siteProfile.name, "Company marketing site");
    assert.equal(buildSiteBundleCheckReport({ target: bundleDir }).valid, true);

    const writeOutput = await captureConsole(() => runSite([
      "--init",
      "--name",
      "Company marketing site",
      "--live-url",
      "https://example.com",
      "--repo-url",
      "https://github.com/acme/site",
      "--deploy",
      "vercel",
      "--cms",
      "none",
      "--database",
      "none",
      "--out",
      outFile,
    ]));
    assert.match(writeOutput.stdout, /Wrote /);

    const report = buildSiteReport({ target: outFile });
    assert.equal(report.summary.status, "pass");
    assert.equal(report.summary.site.name, "Company marketing site");
    assert.equal(report.summary.counts.refactorTasks, 0);
    assert.ok(report.summary.issues.some((issue) => issue.id === "workspace-ready"));
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

    const nextActionsStrict = await captureConsole(() => runSite([file, "--next-actions", "--strict", "--json"]));
    const nextActionsPayload = JSON.parse(nextActionsStrict.stdout);
    assert.equal(nextActionsPayload.status, "fail");
    assert.equal(nextActionsPayload.counts.blocking, 2);
    assert.equal(nextActionsPayload.actions[0].severity, "blocking");
    assert.match(nextActionsPayload.actions[0].command, /--mcp-check --strict --json/);
    assert.match(nextActionsPayload.actions[1].command, /--mcp-check --probes --json/);
    assert.equal(nextActionsStrict.exitCode, 1);

    const warningOnlyRaw = createSampleSiteWorkspace();
    warningOnlyRaw.siteProfile.sentryProject = "";
    const warningOnlyFile = path.join(dir, "warning-only.json");
    writeFileSync(warningOnlyFile, JSON.stringify(warningOnlyRaw), "utf8");

    const warningOnlyMcpCheckStrict = await captureConsole(() =>
      runSite([warningOnlyFile, "--mcp-check", "--strict", "--json"]),
    );
    const warningOnlyMcpCheckPayload = JSON.parse(warningOnlyMcpCheckStrict.stdout);
    const warningOnlySentryItem = warningOnlyMcpCheckPayload.items.find((item) => item.key === "sentry");
    assert.equal(warningOnlyMcpCheckPayload.status, "warn");
    assert.equal(warningOnlyMcpCheckPayload.counts.missing, 1);
    assert.equal(warningOnlySentryItem.requestedStatus, "optional");
    assert.equal(warningOnlySentryItem.state, "missing");
    assert.equal(warningOnlySentryItem.level, "warn");
    assert.equal(warningOnlyMcpCheckStrict.exitCode, 1);

    const warningOnlyStrict = await captureConsole(() => runSite([warningOnlyFile, "--next-actions", "--strict", "--json"]));
    const warningOnlyPayload = JSON.parse(warningOnlyStrict.stdout);
    assert.equal(warningOnlyPayload.status, "warn");
    assert.equal(warningOnlyPayload.counts.blocking, 0);
    assert.equal(warningOnlyPayload.actions[0].severity, "warning");
    assert.equal(warningOnlyPayload.actions[0].title, "Clarify optional MCP readiness: Sentry");
    assert.equal(warningOnlyStrict.exitCode, 1);

    const warningOnlyMcpPlanStrict = await captureConsole(() =>
      runSite([warningOnlyFile, "--mcp-plan", "--strict", "--json"]),
    );
    const warningOnlyMcpPlanPayload = JSON.parse(warningOnlyMcpPlanStrict.stdout);
    assert.equal(warningOnlyMcpPlanPayload.status, "warn");
    assert.equal(warningOnlyMcpPlanPayload.blockingItems.length, 0);
    assert.ok(warningOnlyMcpPlanPayload.warnings.some((item) => /Sentry/.test(item)));
    assert.match(warningOnlyMcpPlanPayload.commands.mcpCheck, /--mcp-check --strict --json/);
    assert.equal(warningOnlyMcpPlanStrict.exitCode, 1);

    const warningOnlyGraphStrict = await captureConsole(() =>
      runSite([warningOnlyFile, "--graph", "--strict", "--json"]),
    );
    const warningOnlyGraphPayload = JSON.parse(warningOnlyGraphStrict.stdout);
    assert.equal(warningOnlyGraphPayload.status, "warn");
    assert.equal(warningOnlyGraphPayload.workspaceStatus, "pass");
    assert.equal(warningOnlyGraphPayload.mcpStatus, "warn");
    assert.equal(warningOnlyGraphPayload.summary.mcpStatus, "warn");
    assert.equal(warningOnlyGraphStrict.exitCode, 1);

    const warningOnlyBundleDir = path.join(dir, "warning-only-bundle");
    const warningOnlyBundleStrict = await captureConsole(() =>
      runSite([warningOnlyFile, "--bundle", "--out", warningOnlyBundleDir, "--strict"]),
    );
    assert.match(warningOnlyBundleStrict.stdout, /Wrote Website Improvement handoff bundle/);
    assert.equal(JSON.parse(readFileSync(path.join(warningOnlyBundleDir, "summary.json"), "utf8")).status, "warn");
    assert.equal(JSON.parse(readFileSync(path.join(warningOnlyBundleDir, "mcp-check.json"), "utf8")).status, "warn");
    assert.equal(warningOnlyBundleStrict.exitCode, 1);

    const warningOnlyBundleCheckStrict = await captureConsole(() =>
      runSite([warningOnlyBundleDir, "--bundle-check", "--strict", "--json"]),
    );
    const warningOnlyBundleCheckPayload = JSON.parse(warningOnlyBundleCheckStrict.stdout);
    assert.equal(warningOnlyBundleCheckPayload.status, "warn");
    assert.equal(warningOnlyBundleCheckPayload.valid, true);
    assert.equal(warningOnlyBundleCheckPayload.summary.status, "warn");
    assert.equal(warningOnlyBundleCheckPayload.mcpStatus, "warn");
    assert.ok(warningOnlyBundleCheckPayload.issues.some((issue) => issue.id === "bundle-readiness-warn"));
    assert.equal(warningOnlyBundleCheckStrict.exitCode, 1);

    const warningOnlyBundleHandoffStrict = await captureConsole(() =>
      runSite([warningOnlyBundleDir, "--bundle-handoff", "--strict", "--json"]),
    );
    const warningOnlyBundleHandoffPayload = JSON.parse(warningOnlyBundleHandoffStrict.stdout);
    assert.equal(warningOnlyBundleHandoffPayload.status, "warn");
    assert.equal(warningOnlyBundleHandoffPayload.valid, true);
    assert.equal(warningOnlyBundleHandoffPayload.bundle.mcpStatus, "warn");
    assert.ok(warningOnlyBundleHandoffPayload.issues.some((issue) => issue.id === "bundle-readiness-warn"));
    assert.match(warningOnlyBundleHandoffPayload.prompt, /did not fully pass local bundle-check validation/);
    assert.equal(warningOnlyBundleHandoffStrict.exitCode, 1);

    const warningOnlyBundleCompareStrict = await captureConsole(() =>
      runSite([warningOnlyBundleDir, "--bundle-compare", warningOnlyBundleDir, "--strict", "--json"]),
    );
    const warningOnlyBundleComparePayload = JSON.parse(warningOnlyBundleCompareStrict.stdout);
    assert.equal(warningOnlyBundleComparePayload.status, "warn");
    assert.equal(warningOnlyBundleComparePayload.valid, true);
    assert.equal(warningOnlyBundleComparePayload.sameBundle, true);
    assert.equal(warningOnlyBundleComparePayload.digestMatch, true);
    assert.equal(warningOnlyBundleComparePayload.left.status, "warn");
    assert.equal(warningOnlyBundleComparePayload.right.status, "warn");
    assert.ok(warningOnlyBundleComparePayload.issues.some((issue) => issue.id === "bundle-compare-left-warn"));
    assert.ok(warningOnlyBundleComparePayload.issues.some((issue) => issue.id === "bundle-compare-right-warn"));
    assert.equal(warningOnlyBundleCompareStrict.exitCode, 1);

    const warningOnlyBundleRepairApplyStrict = await captureConsole(() =>
      runSite([warningOnlyBundleDir, "--bundle-repair", "--yes", "--strict", "--json"]),
    );
    const warningOnlyBundleRepairApplyPayload = JSON.parse(warningOnlyBundleRepairApplyStrict.stdout);
    assert.equal(warningOnlyBundleRepairApplyPayload.status, "fail");
    assert.equal(warningOnlyBundleRepairApplyPayload.applied, true);
    assert.equal(warningOnlyBundleRepairApplyPayload.before.status, "warn");
    assert.equal(warningOnlyBundleRepairApplyPayload.after.status, "warn");
    assert.ok(warningOnlyBundleRepairApplyPayload.issues.some((issue) => issue.id === "bundle-repair-verify-fail"));
    assert.equal(warningOnlyBundleRepairApplyStrict.exitCode, 1);
  });
});

test("runSite prints command-specific help", async () => {
  const output = await captureConsole(() => runSite(["--help"]));
  assert.match(output.stdout, /Usage:\s+design-ai site <workspace\.json>/);
  assert.match(output.stdout, /design-ai site --init --name name --live-url url/);
  assert.match(output.stdout, /design-ai site --init --name name --live-url url --next-actions \[--json\] \[--out file\]/);
  assert.match(output.stdout, /design-ai site --init --name name --live-url url --bundle --out dir \[--strict\] \[--force\]/);
  assert.match(output.stdout, /design-ai site --from-intake file\.md\|--stdin \[--json\|--next-actions \[--json\]\|--tasks\|--bundle \[--tasks\] --out dir\] \[--out file\] \[--strict\] \[--force\]/);
  assert.match(output.stdout, /design-ai site --intake-template \[--language en\|ko\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site --sample \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site --prompt-list \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --mcp-check \[--probes\] \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --mcp-plan \[--probes\] \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --next-actions \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --graph \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --tasks \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --bundle --out dir \[--strict\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <bundle-dir> --bundle-check \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <bundle-dir> --bundle-compare other-bundle-dir \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <bundle-dir> --bundle-handoff \[--task id-or-number\] \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /design-ai site <workspace\.json> --prompt template-id \[--task id-or-number\] \[--out file\] \[--force\]/);
  assert.match(output.stdout, /--init\s+Generate a real-project Website Improvement workspace JSON from CLI fields/);
  assert.match(output.stdout, /--name text Site name for --init/);
  assert.match(output.stdout, /--live-url url/);
  assert.match(output.stdout, /--page path Add a priority page for --init; repeatable/);
  assert.match(output.stdout, /--viewport kind/);
  assert.match(output.stdout, /--from-intake file\|--stdin\s+Generate a workspace, task-ready workspace, next-actions report, or handoff bundle from a filled intake Markdown file or stdin/);
  assert.match(output.stdout, /--intake-template\s+Emit a blank company website intake Markdown template/);
  assert.match(output.stdout, /--language code\s+With --intake-template, emit en or ko template content/);
  assert.match(output.stdout, /--sample\s+Emit a valid sample Website Improvement workspace JSON/);
  assert.match(output.stdout, /--prompt-list\s+List Website Improvement prompt template ids/);
  assert.match(output.stdout, /--mcp-check\s+Check MCP readiness evidence and task\/MCP gaps/);
  assert.match(output.stdout, /--probes\s+Add read-only local URL\/path\/tool-handoff probes/);
  assert.match(output.stdout, /--mcp-plan\s+Generate a Markdown or JSON MCP readiness action plan/);
  assert.match(output.stdout, /can be combined with --init/);
  assert.match(output.stdout, /design-ai site --init --name "Company marketing site"/);
  assert.match(output.stdout, /design-ai site --init --name "Company marketing site".*--next-actions --out website-next-actions\.md/);
  assert.match(output.stdout, /design-ai site --init --name "Company marketing site".*--bundle --out website-handoff-bundle/);
  assert.match(output.stdout, /design-ai site --from-intake company-website-intake\.ko\.md --out website-workspace\.json/);
  assert.match(output.stdout, /cat company-website-intake\.ko\.md \| design-ai site --from-intake --stdin --out website-workspace\.json --force/);
  assert.match(output.stdout, /design-ai site --from-intake company-website-intake\.ko\.md --next-actions --out website-next-actions\.md/);
  assert.match(output.stdout, /cat company-website-intake\.ko\.md \| design-ai site --from-intake --stdin --next-actions --out website-next-actions\.md --force/);
  assert.match(output.stdout, /design-ai site --from-intake company-website-intake\.ko\.md --tasks --out website-workspace\.tasks\.json/);
  assert.match(output.stdout, /cat company-website-intake\.ko\.md \| design-ai site --from-intake --stdin --tasks --out website-workspace\.tasks\.json --force/);
  assert.match(output.stdout, /design-ai site --from-intake company-website-intake\.ko\.md --bundle --tasks --out website-handoff-bundle/);
  assert.match(output.stdout, /cat company-website-intake\.ko\.md \| design-ai site --from-intake --stdin --bundle --tasks --out website-handoff-bundle/);
  assert.match(output.stdout, /design-ai site --intake-template --out company-website-intake\.md/);
  assert.match(output.stdout, /design-ai site --intake-template --language ko --out company-website-intake\.ko\.md/);
  assert.match(output.stdout, /design-ai site website-workspace\.json --mcp-check --probes --json --out mcp-check-probes\.json/);
  assert.match(output.stdout, /design-ai site website-workspace\.json --mcp-plan --probes --json --out mcp-action-plan-probes\.json/);
  assert.match(output.stdout, /design-ai site website-handoff-bundle --bundle-handoff --task task-accessibility --out target-repo-task-prompt\.md/);
  assert.match(output.stdout, /--graph\s+Export a portable Website Improvement workflow graph/);
  assert.match(output.stdout, /--tasks\s+Emit workspace JSON with starter refactor tasks generated from audit findings/);
  assert.match(output.stdout, /--bundle\s+Write a complete local handoff bundle directory; can be combined with --init/);
  assert.match(output.stdout, /--bundle-check\s+Validate a generated handoff bundle directory/);
  assert.match(output.stdout, /--bundle-compare dir\s+Compare two generated handoff bundles/);
  assert.match(output.stdout, /--bundle-handoff\s+Generate a target-repo Codex handoff prompt/);
  assert.match(output.stdout, /--report\s+Generate a Markdown website improvement handoff report/);
  assert.match(output.stdout, /--prompts\s+Generate a Markdown bundle of Codex and Claude prompts/);
  assert.match(output.stdout, /--prompt id Generate one Markdown prompt template/);
  assert.match(output.stdout, /--task id\s+Select a refactor task by id or 1-based top-task number/);
});
