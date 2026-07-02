// Tests for task selection and tampered bundle detection.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildSiteBundleHandoffReport, formatSiteBundleHandoffJson } from "./site.mjs";
import { buildHandoffFixture, withTempDir } from "./site-test-support.mjs";

test("buildSiteBundleHandoffReport task selection and tampered bundle detection", () => withTempDir((dir) => {
  const { bundle, workspace } = buildHandoffFixture(dir);
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
