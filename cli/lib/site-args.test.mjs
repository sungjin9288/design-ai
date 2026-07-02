// Tests for site CLI argument parsing.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseSiteArgs } from "./site.mjs";

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
