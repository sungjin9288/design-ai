// Tests for learning curation plan/report/apply and audit edge cases.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  applyLearningCurationPlan,
  auditLearningProfile,
  buildLearningCurationPlan,
  defaultLearningArchiveFile,
  loadLearningArchive,
  loadLearningProfile,
  renderLearningCurationReport,
} from "./learn.mjs";
import { runLearn } from "../commands/learn.mjs";
import { captureStdout, withTempDir, withTempDirAsync } from "./learn-test-support.mjs";

test("buildLearningCurationPlan previews archive-first duplicate and sensitive cleanup", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const archiveFile = defaultLearningArchiveFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:03.000Z",
    entries: [
      {
        id: "learn-a",
        category: "workflow",
        text: "Prefer release notes that state evidence before claims",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-b",
        category: "workflow",
        text: "Prefer release notes that state evidence before claims",
        source: "cli",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-c",
        category: "constraint",
        text: "Never include api_key=redacted placeholders in prompt context",
        source: "cli",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
      {
        id: "learn-d",
        category: "preference",
        text: "Keep this broad note for manual review. ".repeat(30),
        source: "cli",
        createdAt: "2026-05-22T00:00:03.000Z",
      },
    ],
  }), "utf8");

  const plan = buildLearningCurationPlan({ filePath });
  assert.equal(plan.file, filePath);
  assert.equal(plan.archiveFile, archiveFile);
  assert.equal(plan.before.status, "warn");
  assert.equal(plan.proposalCount, 3);
  assert.equal(plan.archiveCount, 2);
  assert.equal(plan.manualReviewCount, 1);
  assert.deepEqual(
    plan.proposals
      .filter((proposal) => proposal.action === "archive")
      .map((proposal) => [proposal.entryId, proposal.reason]),
    [
      ["learn-b", "duplicate-entry"],
      ["learn-c", "sensitive-content"],
    ],
  );
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-a", "learn-b", "learn-c", "learn-d"]);
}));

test("buildLearningCurationPlan includes usage review hints without auto-archiving unused entries", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:03.000Z",
    entries: [
      {
        id: "learn-a",
        category: "workflow",
        text: "Prefer implementation summaries with verification evidence",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-b",
        category: "brand",
        text: "Use restrained enterprise language for internal tools",
        source: "cli",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-c",
        category: "accessibility",
        text: "Always include keyboard focus and screen-reader behavior",
        source: "cli",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:10:00.000Z",
    profileFile: filePath,
    events: [
      {
        id: "learn-use-a",
        command: "prompt",
        routeId: "ux-audit",
        profileFile: filePath,
        briefHash: "abc123",
        category: "",
        limit: 12,
        selectedEntryIds: ["learn-a", "learn-stale"],
        selectedCount: 2,
        candidateCount: 3,
        matchedCount: 1,
        fallbackCount: 1,
        queryTokenCount: 3,
        auditStatus: "pass",
        createdAt: "2026-05-22T00:10:00.000Z",
      },
    ],
  }), "utf8");

  const plan = buildLearningCurationPlan({ filePath, usageFile });
  assert.equal(plan.proposalCount, 0);
  assert.equal(plan.archiveCount, 0);
  assert.equal(plan.manualReviewCount, 0);
  assert.equal(plan.usage.exists, true);
  assert.equal(plan.usage.profileFile, filePath);
  assert.equal(plan.usage.profileFileMatches, true);
  assert.equal(plan.usage.eventCount, 1);
  assert.equal(plan.usage.usedEntryCount, 1);
  assert.equal(plan.usage.unusedEntryCount, 2);
  assert.equal(plan.usage.staleSelectedEntryCount, 1);
  assert.equal(plan.usage.reviewCount, 3);
  assert.equal(plan.usage.unusedReviewCount, 2);
  assert.equal(plan.usage.staleReviewCount, 1);
  assert.equal(plan.usage.autoArchive, false);
  assert.deepEqual(
    plan.usage.reviews.map((review) => [review.entryId, review.reason, review.action]),
    [
      ["learn-stale", "stale-selected-entry-id", "review-usage-sidecar"],
      ["learn-b", "unused-with-limited-history", "manual-review"],
      ["learn-c", "unused-with-limited-history", "manual-review"],
    ],
  );

  const applied = applyLearningCurationPlan({ filePath, usageFile, dryRun: false });
  assert.equal(applied.applied, true);
  assert.equal(applied.archiveCount, 0);
  assert.deepEqual(applied.archived, []);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-a", "learn-b", "learn-c"]);
  assert.deepEqual(loadLearningArchive(defaultLearningArchiveFile(filePath), { sourceFile: filePath }).entries, []);
}));

test("buildLearningCurationPlan reports usage profile mismatch as advisory review", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  const oldProfile = path.join(dir, "old-learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:01.000Z",
    entries: [
      {
        id: "learn-a",
        category: "workflow",
        text: "Prefer implementation summaries with verification evidence",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:10:00.000Z",
    profileFile: oldProfile,
    events: [
      {
        id: "learn-use-stale",
        command: "pack",
        routeId: "design-review",
        profileFile: oldProfile,
        briefHash: "abc123",
        category: "",
        limit: 12,
        selectedEntryIds: ["learn-stale"],
        selectedCount: 1,
        candidateCount: 1,
        matchedCount: 1,
        fallbackCount: 0,
        queryTokenCount: 3,
        auditStatus: "pass",
        createdAt: "2026-05-22T00:10:00.000Z",
      },
    ],
  }), "utf8");

  const plan = buildLearningCurationPlan({ filePath, usageFile });
  assert.equal(plan.usage.exists, true);
  assert.equal(plan.usage.profileFile, oldProfile);
  assert.equal(plan.usage.profileFileMatches, false);
  assert.equal(plan.usage.reviewCount, 3);
  assert.equal(plan.usage.staleReviewCount, 1);
  assert.equal(plan.usage.autoArchive, false);
  assert.deepEqual(
    plan.usage.reviews.map((review) => [review.reason, review.action]),
    [
      ["usage-profile-file-mismatch", "review-usage-sidecar"],
      ["stale-selected-entry-id", "review-usage-sidecar"],
      ["unused-with-limited-history", "manual-review"],
    ],
  );
  assert.equal(plan.archiveCount, 0);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-a"]);
}));

test("renderLearningCurationReport creates a shareable Markdown audit trail", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:02.000Z",
    entries: [
      {
        id: "learn-a",
        category: "workflow",
        text: "Prefer concise implementation summaries",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-b",
        category: "workflow",
        text: "Prefer concise implementation summaries",
        source: "cli",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:10:00.000Z",
    profileFile: filePath,
    events: [
      {
        id: "learn-use-a",
        command: "prompt",
        routeId: "design-review",
        profileFile: filePath,
        briefHash: "abc123",
        category: "",
        limit: 12,
        selectedEntryIds: ["learn-a", "learn-stale"],
        selectedCount: 2,
        candidateCount: 2,
        matchedCount: 1,
        fallbackCount: 1,
        queryTokenCount: 2,
        auditStatus: "pass",
        createdAt: "2026-05-22T00:10:00.000Z",
      },
    ],
  }), "utf8");

  const payload = applyLearningCurationPlan({ filePath, usageFile, dryRun: true });
  const report = renderLearningCurationReport(payload, {
    generatedAt: new Date("2026-05-22T00:15:00.000Z"),
  });

  assert.match(report, /^# Learning Curation Report/);
  assert.match(report, /Generated: 2026-05-22T00:15:00\.000Z/);
  assert.match(report, /Mode: preview/);
  assert.match(report, /Archive candidates: 1/);
  assert.match(report, /`learn-b`: duplicate-entry/);
  assert.match(report, /`learn-stale`: stale-selected-entry-id/);
  assert.match(report, /Usage sidecars store selected entry ids and short brief hashes/);
  assert.match(report, /rerun `design-ai learn --curate --yes`/);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-a", "learn-b"]);
}));

test("applyLearningCurationPlan archives candidates without deleting audit history", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const archiveFile = defaultLearningArchiveFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:02.000Z",
    entries: [
      {
        id: "learn-a",
        category: "workflow",
        text: "Prefer concise implementation summaries",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-b",
        category: "workflow",
        text: "Prefer concise implementation summaries",
        source: "cli",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-c",
        category: "constraint",
        text: "Never include api_key=redacted placeholders in prompt context",
        source: "cli",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const dryRun = applyLearningCurationPlan({ filePath, dryRun: true });
  assert.equal(dryRun.dryRun, true);
  assert.equal(dryRun.applied, false);
  assert.equal(dryRun.archiveCount, 2);
  assert.equal(dryRun.archived.length, 0);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-a", "learn-b", "learn-c"]);
  assert.deepEqual(loadLearningArchive(archiveFile, { sourceFile: filePath }).entries, []);

  const applied = applyLearningCurationPlan({
    filePath,
    dryRun: false,
    now: new Date("2026-05-22T00:05:00.000Z"),
  });
  assert.equal(applied.dryRun, false);
  assert.equal(applied.applied, true);
  assert.equal(applied.archiveCount, 2);
  assert.deepEqual(applied.archived.map((entry) => entry.id), ["learn-b", "learn-c"]);
  assert.equal(applied.after.status, "pass");
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-a"]);

  const archive = loadLearningArchive(archiveFile, { sourceFile: filePath });
  assert.equal(archive.sourceFile, filePath);
  assert.deepEqual(archive.entries.map((entry) => entry.id), ["learn-b", "learn-c"]);
  assert.deepEqual(archive.entries.map((entry) => entry.archivedAt), [
    "2026-05-22T00:05:00.000Z",
    "2026-05-22T00:05:00.000Z",
  ]);
  assert.deepEqual(archive.entries.map((entry) => entry.archiveReason), ["duplicate-entry", "sensitive-content"]);
}));

test("runLearn curation previews by default and applies only with confirmation", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
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
        category: "brand",
        text: "Use quiet enterprise language",
        source: "cli",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");

  const previewOutput = await captureStdout(() => runLearn(["--curate", "--file", filePath]));
  assert.match(previewOutput, /Learning curation preview/);
  assert.match(previewOutput, /Would archive:/);
  assert.match(previewOutput, /learn-b: duplicate-entry/);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-a", "learn-b"]);

  const usageFile = path.join(dir, "learning.usage.json");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:10:00.000Z",
    profileFile: filePath,
    events: [
      {
        id: "learn-use-a",
        command: "pack",
        routeId: "design-review",
        profileFile: filePath,
        briefHash: "usagehash",
        category: "",
        limit: 12,
        selectedEntryIds: ["learn-a", "learn-stale"],
        selectedCount: 2,
        candidateCount: 2,
        matchedCount: 1,
        fallbackCount: 1,
        queryTokenCount: 2,
        auditStatus: "pass",
        createdAt: "2026-05-22T00:10:00.000Z",
      },
    ],
  }), "utf8");
  const usagePreviewOutput = await captureStdout(() => runLearn(["--curate", "--file", filePath, "--usage-file", usageFile]));
  assert.match(usagePreviewOutput, /Usage review:/);
  assert.match(usagePreviewOutput, /learn-stale: stale-selected-entry-id/);
  assert.match(usagePreviewOutput, /learn-b: unused-with-limited-history/);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-a", "learn-b"]);

  const reportPath = path.join(dir, "learning-curation-report.md");
  const reportOutput = await captureStdout(() => runLearn([
    "--curate",
    "--report",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--out",
    reportPath,
  ]));
  assert.match(reportOutput, /Wrote /);
  const report = readFileSync(reportPath, "utf8");
  assert.match(report, /^# Learning Curation Report/);
  assert.match(report, /Mode: preview/);
  assert.match(report, /`learn-b`: duplicate-entry/);
  assert.match(report, /`learn-stale`: stale-selected-entry-id/);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-a", "learn-b"]);

  const applyJsonOutput = await captureStdout(() => runLearn(["--curate", "--yes", "--file", filePath, "--json"]));
  const payload = JSON.parse(applyJsonOutput);
  assert.equal(payload.applied, true);
  assert.equal(payload.dryRun, false);
  assert.equal(payload.archiveCount, 1);
  assert.equal(payload.archived[0].id, "learn-b");
  assert.equal(payload.after.status, "pass");
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-a"]);
  assert.deepEqual(loadLearningArchive(defaultLearningArchiveFile(filePath), { sourceFile: filePath }).entries.map((entry) => entry.id), ["learn-b"]);
}));

test("runLearn audit fix supports dry-run and requires confirmation before applying", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
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
        category: "brand",
        text: "Use quiet enterprise language",
        source: "cli",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");

  const dryRunOutput = await captureStdout(() => runLearn(["--audit", "--fix", "--dry-run", "--file", filePath]));
  assert.match(dryRunOutput, /Learning audit cleanup dry run/);
  assert.match(dryRunOutput, /Would remove:/);
  assert.match(dryRunOutput, /learn-b: remove-duplicate/);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-a", "learn-b"]);

  await assert.rejects(
    () => runLearn(["--audit", "--fix", "--file", filePath]),
    /Refusing to apply audit cleanup fixes to learning entries without --yes/,
  );

  const applyJsonOutput = await captureStdout(() => runLearn(["--audit", "--fix", "--yes", "--file", filePath, "--json"]));
  const payload = JSON.parse(applyJsonOutput);
  assert.equal(payload.applied, true);
  assert.equal(payload.cleanupCount, 1);
  assert.equal(payload.after.status, "pass");
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-a"]);
}));

test("auditLearningProfile avoids forget commands when entry ids are ambiguous", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    entries: [
      {
        id: "learn-shared",
        category: "brand",
        text: "Use quiet enterprise language",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-shared",
        category: "brand",
        text: "Use quiet enterprise language",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");

  const audit = auditLearningProfile({ filePath });
  const duplicateTextSuggestion = audit.suggestions.find((suggestion) => (
    suggestion.issueCode === "duplicate-entry-text"
    && suggestion.entryId === "learn-shared"
  ));
  const duplicateIdSuggestion = audit.suggestions.find((suggestion) => (
    suggestion.issueCode === "duplicate-entry-id"
    && suggestion.entryId === "learn-shared"
  ));

  assert.equal(duplicateTextSuggestion.command, undefined);
  assert.equal(duplicateIdSuggestion.action, "manual-profile-edit");
}));

test("auditLearningProfile reports invalid profiles without mutating files", () => withTempDir((dir) => {
  const missingPath = path.join(dir, "missing.json");
  const missing = auditLearningProfile({ filePath: missingPath });
  assert.equal(missing.exists, false);
  assert.equal(missing.summary.status, "pass");
  assert.deepEqual(missing.issues, []);

  const filePath = path.join(dir, "learning.json");
  const invalidJson = "{ not json";
  writeFileSync(filePath, invalidJson, "utf8");

  const audit = auditLearningProfile({ filePath });

  assert.equal(audit.exists, true);
  assert.equal(audit.summary.status, "fail");
  assert.equal(audit.summary.failures, 1);
  assert.equal(audit.issues[0].code, "invalid-json");
  assert.equal(readFileSync(filePath, "utf8"), invalidJson);
}));
