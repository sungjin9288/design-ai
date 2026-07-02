// Tests for runSite sample/init/tasks/strict/help CLI flows.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runSite } from "../commands/site.mjs";
import {
  SITE_BUNDLE_FILES,
  buildSiteBundleCheckReport,
  buildSiteReport,
  createSampleSiteWorkspace,
} from "./site.mjs";
import { captureConsole, withTempDir } from "./site-test-support.mjs";

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
