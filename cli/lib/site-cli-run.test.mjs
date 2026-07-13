// Tests for runSite report/prompt/intake CLI flows.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runSite } from "../commands/site.mjs";
import {
  SITE_BUNDLE_CHECKSUM_FILES,
  SITE_BUNDLE_FILES,
  buildSiteReport,
  createSampleSiteWorkspace,
} from "./site.mjs";
import { captureConsole, withTempDir } from "./site-test-support.mjs";

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
    assert.equal(promptListPayload.count, 11);
    assert.equal(promptListPayload.templates[0].id, "implementation-plan");
    assert.equal(promptListPayload.templates[4].id, "codex-implementation");

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
    assert.equal(graphPayload.summary.nodeCount, 38);
    assert.equal(graphPayload.summary.edgeCount, 73);

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
