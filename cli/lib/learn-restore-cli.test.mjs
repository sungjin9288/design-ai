// Tests for runLearn diff/restore/restore-backups CLI flows.

import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { defaultLearningRestoreBackupFile, loadLearningProfile } from "./learn.mjs";
import { runLearn } from "../commands/learn.mjs";
import { captureStdout, withTempDirAsync } from "./learn-test-support.mjs";

test("runLearn emits profile diff JSON without importing comparison entries", async () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const comparisonPath = path.join(dir, "comparison.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:00.000Z",
    entries: [
      {
        id: "learn-a",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(comparisonPath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:01.000Z",
    entries: [
      {
        id: "learn-a",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-b",
        category: "workflow",
        text: "Keep release notes evidence-led",
        source: "backup",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");

  const output = await captureStdout(() => runLearn([
    "--diff",
    "--from-file",
    comparisonPath,
    "--file",
    filePath,
    "--json",
  ]));
  const payload = JSON.parse(output);

  assert.equal(payload.file, filePath);
  assert.equal(payload.source, comparisonPath);
  assert.equal(payload.profileOnlyCount, 0);
  assert.equal(payload.comparisonOnlyCount, 1);
  assert.equal(payload.comparisonOnly[0].id, "learn-b");
  assert.equal(loadLearningProfile(filePath).entries.length, 1);
}));

test("runLearn restore previews by default and applies only with confirmation", async () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const restorePath = path.join(dir, "learning-backup.json");
  const rollbackPath = path.join(dir, "learning-rollback.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:00.000Z",
    entries: [
      {
        id: "learn-active",
        category: "workflow",
        text: "Run verification before handoff",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(restorePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:01:00.000Z",
    entries: [
      {
        id: "learn-restored",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "backup",
        createdAt: "2026-05-22T00:01:00.000Z",
      },
    ],
  }), "utf8");

  const previewOutput = await captureStdout(() => runLearn([
    "--restore",
    "--from-file",
    restorePath,
    "--file",
    filePath,
  ]));
  assert.match(previewOutput, /Learning restore preview/);
  assert.match(previewOutput, /No changes made/);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-active"]);

  const jsonPreviewOutput = await captureStdout(() => runLearn([
    "--restore",
    "--from-file",
    restorePath,
    "--file",
    filePath,
    "--dry-run",
    "--json",
  ]));
  const preview = JSON.parse(jsonPreviewOutput);
  assert.equal(preview.applied, false);
  assert.equal(preview.restorable, true);
  assert.equal(preview.removedCount, 1);
  assert.equal(preview.addedCount, 1);
  assert.equal(preview.backupCreated, false);
  assert.match(preview.backupFile, /learning\.restore-backup-/);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-active"]);

  const applyOutput = await captureStdout(() => runLearn([
    "--restore",
    "--from-file",
    restorePath,
    "--file",
    filePath,
    "--backup-file",
    rollbackPath,
    "--yes",
    "--json",
  ]));
  const applied = JSON.parse(applyOutput);
  assert.equal(applied.applied, true);
  assert.equal(applied.dryRun, false);
  assert.equal(applied.restoredCount, 1);
  assert.equal(applied.backupFile, rollbackPath);
  assert.equal(applied.backupCreated, true);
  assert.equal(applied.backupEntryCount, 1);
  assert.match(applied.rollbackCommand, /learning-rollback\.json/);
  assert.deepEqual(loadLearningProfile(rollbackPath).entries.map((entry) => entry.id), ["learn-active"]);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-restored"]);
}));

test("runLearn restore-backups lists rollback backup inventory", async () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const backupPath = defaultLearningRestoreBackupFile(filePath, new Date("2026-05-22T00:01:00.000Z"));
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:02:00.000Z",
    entries: [
      {
        id: "learn-active",
        category: "workflow",
        text: "Run verification before handoff",
        source: "cli",
        createdAt: "2026-05-22T00:02:00.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(backupPath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:01:00.000Z",
    entries: [
      {
        id: "learn-backup",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "backup",
        createdAt: "2026-05-22T00:01:00.000Z",
      },
    ],
  }), "utf8");

  const humanOutput = await captureStdout(() => runLearn(["--restore-backups", "--file", filePath]));
  assert.match(humanOutput, /Learning restore rollback backups/);
  assert.match(humanOutput, /learning\.restore-backup-20260522T000100000Z\.json/);
  assert.match(humanOutput, /Preview: design-ai learn --restore --from-file/);

  const jsonOutput = await captureStdout(() => runLearn(["--restore-backups", "--file", filePath, "--json"]));
  const payload = JSON.parse(jsonOutput);
  assert.equal(payload.file, filePath);
  assert.equal(payload.totalCount, 1);
  assert.equal(payload.backups[0].file, backupPath);
  assert.equal(payload.backups[0].entryCount, 1);
  assert.equal(payload.backups[0].auditSummary.status, "pass");
  assert.equal(payload.privacy.mutatesProfile, false);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-active"]);
}));

test("runLearn restore-backups prune previews and applies backup file deletion", async () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const olderBackupPath = defaultLearningRestoreBackupFile(filePath, new Date("2026-05-22T00:01:00.000Z"));
  const newerBackupPath = defaultLearningRestoreBackupFile(filePath, new Date("2026-05-22T00:02:00.000Z"));
  const activeProfile = {
    version: 1,
    updatedAt: "2026-05-22T00:03:00.000Z",
    entries: [
      {
        id: "learn-active",
        category: "workflow",
        text: "Run verification before handoff",
        source: "cli",
        createdAt: "2026-05-22T00:03:00.000Z",
      },
    ],
  };
  const backupProfile = {
    version: 1,
    updatedAt: "2026-05-22T00:01:00.000Z",
    entries: [
      {
        id: "learn-backup",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "backup",
        createdAt: "2026-05-22T00:01:00.000Z",
      },
    ],
  };
  writeFileSync(filePath, JSON.stringify(activeProfile), "utf8");
  writeFileSync(olderBackupPath, JSON.stringify(backupProfile), "utf8");
  writeFileSync(newerBackupPath, JSON.stringify(backupProfile), "utf8");

  const previewOutput = await captureStdout(() => runLearn([
    "--restore-backups",
    "--prune",
    "--keep",
    "1",
    "--file",
    filePath,
  ]));
  assert.match(previewOutput, /Learning restore backup prune preview/);
  assert.match(previewOutput, /Would delete:/);
  assert.match(previewOutput, /learning\.restore-backup-20260522T000100000Z\.json/);
  assert.equal(existsSync(olderBackupPath), true);
  assert.equal(existsSync(newerBackupPath), true);

  const applyOutput = await captureStdout(() => runLearn([
    "--restore-backups",
    "--prune",
    "--keep",
    "1",
    "--file",
    filePath,
    "--yes",
    "--json",
  ]));
  const applied = JSON.parse(applyOutput);
  assert.equal(applied.prune.applied, true);
  assert.equal(applied.prune.keep, 1);
  assert.equal(applied.prune.candidateCount, 1);
  assert.equal(applied.prune.deletedCount, 1);
  assert.equal(applied.prune.deleted[0].file, olderBackupPath);
  assert.equal(applied.privacy.mutatesProfile, false);
  assert.equal(applied.privacy.deletesBackupFiles, true);
  assert.equal(existsSync(olderBackupPath), false);
  assert.equal(existsSync(newerBackupPath), true);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-active"]);
}));
