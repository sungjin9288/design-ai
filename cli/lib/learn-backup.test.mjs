// Tests for learning profile import/backup/diff/restore.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildLearningBackup,
  defaultLearningRestoreBackupFile,
  diffLearningProfiles,
  importLearningProfile,
  listLearningRestoreBackups,
  loadLearningProfile,
  pruneLearningRestoreBackups,
  rememberLearning,
  restoreLearningProfile,
} from "./learn.mjs";
import { withTempDir } from "./learn-test-support.mjs";

test("importLearningProfile previews and applies portable learning profile entries", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:00.000Z",
    entries: [
      {
        id: "learn-existing",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
    ],
  }), "utf8");

  const importText = JSON.stringify({
    file: "/other/learning.json",
    entries: [
      {
        id: "learn-existing",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-existing",
        category: "korean",
        text: "Prefer dense Korean mobile layouts",
        source: "feedback:improve",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  });

  const dryRun = importLearningProfile({
    importText,
    filePath,
    dryRun: true,
    now: new Date("2026-05-22T00:01:00.000Z"),
  });
  assert.equal(dryRun.dryRun, true);
  assert.equal(dryRun.applied, false);
  assert.equal(dryRun.importedCount, 2);
  assert.equal(dryRun.addedCount, 1);
  assert.equal(dryRun.skippedCount, 1);
  assert.equal(dryRun.count, 2);
  assert.equal(dryRun.added[0].category, "korean");
  assert.equal(dryRun.added[0].source, "import:feedback:improve");
  assert.notEqual(dryRun.added[0].id, "learn-existing");
  assert.equal(dryRun.skipped[0].reason, "duplicate-entry-text");
  assert.equal(loadLearningProfile(filePath).entries.length, 1);

  const applied = importLearningProfile({
    importText,
    filePath,
    dryRun: false,
    now: new Date("2026-05-22T00:02:00.000Z"),
  });
  assert.equal(applied.applied, true);
  assert.equal(applied.addedCount, 1);
  assert.equal(applied.skippedCount, 1);
  assert.equal(loadLearningProfile(filePath).entries.length, 2);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.category), ["brand", "korean"]);
}));

test("buildLearningBackup returns a full importable learning profile payload", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  rememberLearning({
    text: "Prefer dense Korean product UI",
    category: "korean",
    filePath,
    now: new Date("2026-05-22T00:00:00.000Z"),
  });
  rememberLearning({
    text: "Keep release notes evidence-led",
    category: "workflow",
    filePath,
    now: new Date("2026-05-22T00:00:01.000Z"),
  });

  const backup = buildLearningBackup({
    filePath,
    now: new Date("2026-05-22T00:01:00.000Z"),
  });

  assert.equal(backup.file, filePath);
  assert.equal(backup.version, 1);
  assert.equal(backup.exportedAt, "2026-05-22T00:01:00.000Z");
  assert.equal(backup.count, 2);
  assert.deepEqual(backup.auditSummary, { status: "pass", failures: 0, warnings: 0 });
  assert.deepEqual(backup.entries.map((entry) => entry.category), ["korean", "workflow"]);
  assert.equal(backup.entries[0].text, "Prefer dense Korean product UI");
}));

test("diffLearningProfiles compares active and portable profiles without mutation", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:03.000Z",
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
        text: "Run verification before handoff",
        source: "cli",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-conflict",
        category: "accessibility",
        text: "Always include keyboard focus notes",
        source: "cli",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const before = readFileSync(filePath, "utf8");
  const diff = diffLearningProfiles({
    filePath,
    source: "learning-backup.json",
    now: new Date("2026-05-22T00:01:00.000Z"),
    compareText: JSON.stringify({
      version: 1,
      updatedAt: "2026-05-22T00:00:04.000Z",
      entries: [
        {
          id: "learn-a-restored",
          category: "brand",
          text: "Use quiet enterprise language",
          source: "backup",
          createdAt: "2026-05-22T00:00:04.000Z",
        },
        {
          id: "learn-c",
          category: "korean",
          text: "Prefer compact Korean mobile layouts",
          source: "backup",
          createdAt: "2026-05-22T00:00:05.000Z",
        },
        {
          id: "learn-conflict",
          category: "workflow",
          text: "Use a release checklist before handoff",
          source: "backup",
          createdAt: "2026-05-22T00:00:06.000Z",
        },
      ],
    }),
  });

  assert.equal(diff.file, filePath);
  assert.equal(diff.source, "learning-backup.json");
  assert.equal(diff.generatedAt, "2026-05-22T00:01:00.000Z");
  assert.equal(diff.profileCount, 3);
  assert.equal(diff.comparisonCount, 3);
  assert.equal(diff.sameTextCount, 1);
  assert.equal(diff.profileOnlyCount, 2);
  assert.equal(diff.comparisonOnlyCount, 2);
  assert.equal(diff.metadataChangedCount, 1);
  assert.equal(diff.idConflictCount, 1);
  assert.deepEqual(diff.metadataChanged[0].changedFields, ["id", "source", "createdAt"]);
  assert.equal(diff.idConflicts[0].id, "learn-conflict");
  assert.deepEqual(diff.profileAuditSummary, { status: "pass", failures: 0, warnings: 0 });
  assert.deepEqual(diff.comparisonAuditSummary, { status: "pass", failures: 0, warnings: 0 });
  assert.equal(diff.privacy.mutatesProfile, false);
  assert.ok(diff.recommendations.some((item) => item.text.includes("comparison-only entries")));
  assert.equal(readFileSync(filePath, "utf8"), before);
}));

test("restoreLearningProfile previews and applies a full profile replacement", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const rollbackPath = path.join(dir, "learning-before-restore.json");
  const restoreText = JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:02:00.000Z",
    entries: [
      {
        id: "learn-restored-brand",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "backup",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-restored-korean",
        category: "korean",
        text: "Prefer compact Korean mobile layouts",
        source: "backup",
        createdAt: "2026-05-22T00:01:00.000Z",
      },
    ],
  });
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:01:00.000Z",
    entries: [
      {
        id: "learn-active-brand",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-active-workflow",
        category: "workflow",
        text: "Run verification before handoff",
        source: "cli",
        createdAt: "2026-05-22T00:01:00.000Z",
      },
    ],
  }), "utf8");

  const before = readFileSync(filePath, "utf8");
  const preview = restoreLearningProfile({
    filePath,
    restoreText,
    source: "learning-backup.json",
    dryRun: true,
    now: new Date("2026-05-22T00:03:00.000Z"),
  });

  assert.equal(preview.dryRun, true);
  assert.equal(preview.applied, false);
  assert.equal(preview.restorable, true);
  assert.equal(preview.previousCount, 2);
  assert.equal(preview.restoredCount, 2);
  assert.equal(preview.removedCount, 1);
  assert.equal(preview.addedCount, 1);
  assert.equal(preview.metadataChangedCount, 1);
  assert.equal(preview.backupCreated, false);
  assert.equal(preview.backupEntryCount, 2);
  assert.equal(preview.backupUpdatedAt, "2026-05-22T00:01:00.000Z");
  assert.equal(preview.backupFile, defaultLearningRestoreBackupFile(filePath, new Date("2026-05-22T00:03:00.000Z")));
  assert.match(preview.rollbackCommand, /design-ai learn --restore --from-file/);
  assert.deepEqual(preview.auditSummary, { status: "pass", failures: 0, warnings: 0 });
  assert.equal(preview.privacy.mutatesProfile, false);
  assert.equal(readFileSync(filePath, "utf8"), before);
  assert.equal(existsSync(preview.backupFile), false);

  const applied = restoreLearningProfile({
    filePath,
    backupFilePath: rollbackPath,
    restoreText,
    source: "learning-backup.json",
    dryRun: false,
    now: new Date("2026-05-22T00:03:00.000Z"),
  });

  assert.equal(applied.applied, true);
  assert.equal(applied.dryRun, false);
  assert.equal(applied.backupFile, rollbackPath);
  assert.equal(applied.backupCreated, true);
  assert.equal(applied.rollbackCommand, `design-ai learn --restore --from-file ${rollbackPath} --file ${filePath} --dry-run`);
  assert.equal(applied.privacy.mutatesProfile, true);
  const rollbackProfile = loadLearningProfile(rollbackPath);
  assert.equal(rollbackProfile.updatedAt, "2026-05-22T00:01:00.000Z");
  assert.deepEqual(rollbackProfile.entries.map((entry) => entry.id), ["learn-active-brand", "learn-active-workflow"]);
  const restored = loadLearningProfile(filePath);
  assert.equal(restored.updatedAt, "2026-05-22T00:02:00.000Z");
  assert.deepEqual(restored.entries.map((entry) => entry.id), ["learn-restored-brand", "learn-restored-korean"]);
  assert.deepEqual(restored.entries.map((entry) => entry.source), ["backup", "backup"]);
}));

test("restoreLearningProfile protects rollback backup paths before apply", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const restorePath = path.join(dir, "learning-backup.json");
  const existingBackupPath = path.join(dir, "existing-rollback.json");
  const activeProfile = {
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
  };
  const restoreProfile = {
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
  };
  const restoreText = JSON.stringify(restoreProfile);
  writeFileSync(filePath, JSON.stringify(activeProfile), "utf8");
  writeFileSync(restorePath, restoreText, "utf8");
  writeFileSync(existingBackupPath, JSON.stringify(restoreProfile), "utf8");

  assert.throws(
    () => restoreLearningProfile({
      filePath,
      backupFilePath: filePath,
      restoreText,
      dryRun: false,
    }),
    /backup file must be different from the active learning profile/,
  );
  assert.throws(
    () => restoreLearningProfile({
      filePath,
      backupFilePath: restorePath,
      restoreText,
      source: restorePath,
      dryRun: false,
    }),
    /backup file must be different from the restore source/,
  );
  assert.throws(
    () => restoreLearningProfile({
      filePath,
      backupFilePath: existingBackupPath,
      restoreText,
      dryRun: false,
    }),
    /backup file already exists/,
  );

  const applied = restoreLearningProfile({
    filePath,
    backupFilePath: existingBackupPath,
    forceBackup: true,
    restoreText,
    dryRun: false,
  });

  assert.equal(applied.backupCreated, true);
  assert.deepEqual(loadLearningProfile(existingBackupPath).entries.map((entry) => entry.id), ["learn-active"]);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-restored"]);
}));

test("listLearningRestoreBackups scans sibling rollback backups without mutation", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const olderBackupPath = defaultLearningRestoreBackupFile(filePath, new Date("2026-05-22T00:01:00.000Z"));
  const invalidBackupPath = defaultLearningRestoreBackupFile(filePath, new Date("2026-05-22T00:02:00.000Z"));
  const newerBackupPath = defaultLearningRestoreBackupFile(filePath, new Date("2026-05-22T00:03:00.000Z"));
  const activeProfile = {
    version: 1,
    updatedAt: "2026-05-22T00:04:00.000Z",
    entries: [
      {
        id: "learn-active",
        category: "workflow",
        text: "Run verification before handoff",
        source: "cli",
        createdAt: "2026-05-22T00:04:00.000Z",
      },
    ],
  };
  const olderProfile = {
    version: 1,
    updatedAt: "2026-05-22T00:01:00.000Z",
    entries: [
      {
        id: "learn-older",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "backup",
        createdAt: "2026-05-22T00:01:00.000Z",
      },
    ],
  };
  const newerProfile = {
    version: 1,
    updatedAt: "2026-05-22T00:03:00.000Z",
    entries: [
      {
        id: "learn-newer-a",
        category: "accessibility",
        text: "Include keyboard focus evidence",
        source: "backup",
        createdAt: "2026-05-22T00:03:00.000Z",
      },
      {
        id: "learn-newer-b",
        category: "korean",
        text: "Use Korean line-height guidance",
        source: "backup",
        createdAt: "2026-05-22T00:03:01.000Z",
      },
    ],
  };
  writeFileSync(filePath, JSON.stringify(activeProfile), "utf8");
  writeFileSync(olderBackupPath, JSON.stringify(olderProfile), "utf8");
  writeFileSync(invalidBackupPath, "{", "utf8");
  writeFileSync(newerBackupPath, JSON.stringify(newerProfile), "utf8");
  writeFileSync(path.join(dir, "learning.unrelated.json"), JSON.stringify(olderProfile), "utf8");

  const payload = listLearningRestoreBackups({
    filePath,
    limit: 2,
    now: new Date("2026-05-22T00:05:00.000Z"),
  });

  assert.equal(payload.file, filePath);
  assert.equal(payload.directory, dir);
  assert.equal(payload.pattern, "learning.restore-backup-*.json");
  assert.equal(payload.totalCount, 3);
  assert.equal(payload.count, 2);
  assert.equal(payload.backups[0].file, newerBackupPath);
  assert.equal(payload.backups[0].createdAt, "2026-05-22T00:03:00.000Z");
  assert.equal(payload.backups[0].entryCount, 2);
  assert.equal(payload.backups[0].auditSummary.status, "pass");
  assert.equal(payload.backups[0].issueCount, 0);
  assert.equal(payload.backups[0].restorePreviewCommand, `design-ai learn --restore --from-file ${newerBackupPath} --file ${filePath} --dry-run`);
  assert.equal(payload.backups[1].file, invalidBackupPath);
  assert.equal(payload.backups[1].auditSummary.status, "fail");
  assert.equal(payload.backups[1].issueCount, 1);
  assert.equal(payload.privacy.mutatesProfile, false);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-active"]);
}));

test("pruneLearningRestoreBackups previews and deletes only older rollback backups", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const oldestBackupPath = defaultLearningRestoreBackupFile(filePath, new Date("2026-05-22T00:01:00.000Z"));
  const middleBackupPath = defaultLearningRestoreBackupFile(filePath, new Date("2026-05-22T00:02:00.000Z"));
  const newestBackupPath = defaultLearningRestoreBackupFile(filePath, new Date("2026-05-22T00:03:00.000Z"));
  const activeProfile = {
    version: 1,
    updatedAt: "2026-05-22T00:04:00.000Z",
    entries: [
      {
        id: "learn-active",
        category: "workflow",
        text: "Run verification before handoff",
        source: "cli",
        createdAt: "2026-05-22T00:04:00.000Z",
      },
    ],
  };
  const backupProfile = {
    version: 1,
    updatedAt: "2026-05-22T00:00:00.000Z",
    entries: [
      {
        id: "learn-backup",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "backup",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
    ],
  };
  writeFileSync(filePath, JSON.stringify(activeProfile), "utf8");
  writeFileSync(oldestBackupPath, JSON.stringify(backupProfile), "utf8");
  writeFileSync(middleBackupPath, JSON.stringify(backupProfile), "utf8");
  writeFileSync(newestBackupPath, JSON.stringify(backupProfile), "utf8");

  const preview = pruneLearningRestoreBackups({
    filePath,
    keep: 1,
    dryRun: true,
    now: new Date("2026-05-22T00:05:00.000Z"),
  });

  assert.equal(preview.prune.dryRun, true);
  assert.equal(preview.prune.applied, false);
  assert.equal(preview.prune.keep, 1);
  assert.equal(preview.prune.retainedCount, 1);
  assert.equal(preview.prune.candidateCount, 2);
  assert.equal(preview.prune.deletedCount, 0);
  assert.equal(preview.prune.retained[0].file, newestBackupPath);
  assert.deepEqual(preview.prune.candidates.map((backup) => backup.file), [middleBackupPath, oldestBackupPath]);
  assert.equal(preview.privacy.mutatesProfile, false);
  assert.equal(preview.privacy.deletesBackupFiles, false);
  assert.equal(existsSync(oldestBackupPath), true);
  assert.equal(existsSync(middleBackupPath), true);
  assert.equal(existsSync(newestBackupPath), true);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-active"]);

  const applied = pruneLearningRestoreBackups({
    filePath,
    keep: 1,
    dryRun: false,
    now: new Date("2026-05-22T00:06:00.000Z"),
  });

  assert.equal(applied.prune.dryRun, false);
  assert.equal(applied.prune.applied, true);
  assert.equal(applied.prune.deletedCount, 2);
  assert.equal(applied.prune.failureCount, 0);
  assert.deepEqual(applied.prune.deleted.map((backup) => backup.file), [middleBackupPath, oldestBackupPath]);
  assert.equal(applied.privacy.mutatesProfile, false);
  assert.equal(applied.privacy.deletesBackupFiles, true);
  assert.equal(existsSync(oldestBackupPath), false);
  assert.equal(existsSync(middleBackupPath), false);
  assert.equal(existsSync(newestBackupPath), true);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-active"]);
}));

test("restoreLearningProfile reports audit failures in preview and blocks apply", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:00.000Z",
    entries: [
      {
        id: "learn-active",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
    ],
  }), "utf8");
  const invalidRestore = JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:01:00.000Z",
    entries: [
      {
        id: "learn-invalid",
        category: "private-model",
        text: "Invalid category should block restore",
        source: "backup",
        createdAt: "2026-05-22T00:01:00.000Z",
      },
    ],
  });

  const preview = restoreLearningProfile({
    filePath,
    restoreText: invalidRestore,
    source: "invalid-backup.json",
    dryRun: true,
  });

  assert.equal(preview.restorable, false);
  assert.equal(preview.backupCreated, false);
  assert.equal(preview.auditSummary.status, "fail");
  assert.equal(preview.issues[0].code, "invalid-category");
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-active"]);

  assert.throws(
    () => restoreLearningProfile({
      filePath,
      restoreText: invalidRestore,
      source: "invalid-backup.json",
      dryRun: false,
    }),
    /Refusing to restore learning profile with audit failures/,
  );
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-active"]);
}));
