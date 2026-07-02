// Tests for learning redact/verify/audit and related CLI flows.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  applyLearningAuditFixes,
  auditLearningProfile,
  buildRedactedLearningBackup,
  loadLearningProfile,
  rememberLearning,
  verifyLearningImportPayload,
} from "./learn.mjs";
import { runLearn } from "../commands/learn.mjs";
import { captureStdout, withTempDir, withTempDirAsync } from "./learn-test-support.mjs";

test("buildRedactedLearningBackup returns an importable profile with sensitive text redacted", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:01.000Z",
    entries: [
      {
        id: "learn-a",
        category: "constraint",
        text: "Never include api_key: sk-test12345678901234567890 in examples",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-b",
        category: "korean",
        text: "Prefer compact Korean mobile layouts",
        source: "cli",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");

  const redacted = buildRedactedLearningBackup({
    filePath,
    now: new Date("2026-05-22T00:02:00.000Z"),
  });

  assert.equal(redacted.file, filePath);
  assert.equal(redacted.exportedAt, "2026-05-22T00:02:00.000Z");
  assert.equal(redacted.redacted, true);
  assert.equal(redacted.count, 2);
  assert.equal(redacted.redactedCount, 1);
  assert.equal(redacted.sourceAuditSummary.status, "warn");
  assert.equal(redacted.auditSummary.status, "pass");
  assert.deepEqual(redacted.redactions[0].codes, ["sensitive-secret-assignment", "sensitive-openai-secret-key"]);
  assert.match(redacted.entries[0].text, /\[REDACTED:secret-assignment\]/);
  assert.match(redacted.entries[0].text, /\[REDACTED:openai-secret-key\]/);
  assert.doesNotMatch(redacted.entries[0].text, /sk-test/);
  assert.equal(redacted.entries[1].text, "Prefer compact Korean mobile layouts");
  assert.equal(loadLearningProfile(filePath).entries[0].text, "Never include api_key: sk-test12345678901234567890 in examples");
}));

test("buildRedactedLearningBackup redacts a portable JSON payload from text", () => {
  const redacted = buildRedactedLearningBackup({
    source: "learning-backup.json",
    now: new Date("2026-05-22T00:02:00.000Z"),
    importText: JSON.stringify({
      version: 1,
      updatedAt: "2026-05-22T00:00:01.000Z",
      entries: [
        {
          id: "learn-a",
          category: "constraint",
          text: "Do not share password: sk-test12345678901234567890 in handoff notes",
          source: "cli",
          createdAt: "2026-05-22T00:00:00.000Z",
        },
      ],
    }),
  });

  assert.equal(redacted.file, "learning-backup.json");
  assert.equal(redacted.exportedAt, "2026-05-22T00:02:00.000Z");
  assert.equal(redacted.redactedCount, 1);
  assert.equal(redacted.sourceAuditSummary.status, "warn");
  assert.equal(redacted.auditSummary.status, "pass");
  assert.deepEqual(redacted.redactions[0].codes, ["sensitive-secret-assignment", "sensitive-openai-secret-key"]);
  assert.doesNotMatch(redacted.entries[0].text, /sk-test/);
  assert.match(redacted.entries[0].text, /\[REDACTED:secret-assignment\]/);
  assert.match(redacted.entries[0].text, /\[REDACTED:openai-secret-key\]/);
});

test("verifyLearningImportPayload validates portable learning JSON without importing", () => {
  const payload = verifyLearningImportPayload({
    source: "learning-backup.json",
    now: new Date("2026-05-22T00:02:00.000Z"),
    importText: JSON.stringify({
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
    }),
  });

  assert.equal(payload.source, "learning-backup.json");
  assert.equal(payload.importable, true);
  assert.equal(payload.count, 2);
  assert.deepEqual(payload.auditSummary, { status: "warn", failures: 0, warnings: 1 });
  assert.equal(payload.entries[0].source, "import:cli");
  assert.ok(payload.issues.some((issue) => issue.code === "duplicate-entry-text" && issue.entryId === "learn-b"));
});

test("loadLearningProfile normalizes legacy entries without ids", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    entries: [
      {
        category: "preference",
        text: "Prefer compact Korean dashboards",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
    ],
  }), "utf8");

  const profile = loadLearningProfile(filePath);

  assert.equal(profile.entries.length, 1);
  assert.match(profile.entries[0].id, /^learn-[a-f0-9]{10}$/);
}));

test("auditLearningProfile reports shape, duplicate, and sensitive-content issues", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:02.000Z",
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
      {
        id: "learn-c",
        category: "other",
        text: "api_key: sk-test12345678901234567890",
        source: "cli",
        createdAt: "not-a-date",
      },
    ],
  }), "utf8");

  const audit = auditLearningProfile({ filePath });

  assert.equal(audit.file, filePath);
  assert.equal(audit.exists, true);
  assert.equal(audit.count, 3);
  assert.deepEqual(audit.categoryCounts, { brand: 2, other: 1 });
  assert.equal(audit.summary.status, "warn");
  assert.equal(audit.summary.failures, 0);
  assert.ok(audit.summary.warnings >= 4);
  assert.ok(audit.issues.some((issue) => issue.code === "duplicate-entry-text" && issue.entryId === "learn-b"));
  assert.ok(audit.issues.some((issue) => issue.code === "invalid-created-at" && issue.entryId === "learn-c"));
  assert.ok(audit.issues.some((issue) => issue.code === "sensitive-secret-assignment" && issue.entryId === "learn-c"));
  assert.ok(audit.issues.some((issue) => issue.code === "sensitive-openai-secret-key" && issue.entryId === "learn-c"));
  assert.ok(audit.suggestions.some((suggestion) => (
    suggestion.action === "remove-duplicate"
    && suggestion.entryId === "learn-b"
    && suggestion.commandArgs.includes("--forget")
    && suggestion.command.includes("design-ai learn --file")
  )));
  assert.ok(audit.suggestions.some((suggestion) => (
    suggestion.action === "remove-or-redact-sensitive-content"
    && suggestion.entryId === "learn-c"
    && suggestion.commandArgs.includes("learn-c")
  )));
}));

test("runLearn audit prints suggested cleanup commands for warning profiles", () => withTempDirAsync(async (dir) => {
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

  const output = await captureStdout(() => runLearn(["--audit", "--file", filePath]));

  assert.match(output, /Suggested cleanup:/);
  assert.match(output, /remove-duplicate \(learn-b\)/);
  assert.match(output, /design-ai learn --file/);
  assert.match(output, /--forget learn-b --yes/);
}));

test("runLearn feedback stores structured feedback entries in human and JSON modes", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const humanOutput = await captureStdout(() => runLearn([
    "--feedback",
    "Keep release notes evidence-led",
    "--outcome",
    "keep",
    "--file",
    filePath,
  ]));

  assert.match(humanOutput, /Recorded feedback learn-/);
  assert.match(humanOutput, /Outcome: keep/);
  assert.match(humanOutput, /Category: workflow/);

  const jsonOutput = await captureStdout(() => runLearn([
    "--feedback",
    "decorative marketing language in enterprise dashboards",
    "--outcome",
    "avoid",
    "--category",
    "brand",
    "--file",
    filePath,
    "--json",
  ]));
  const payload = JSON.parse(jsonOutput);

  assert.equal(payload.feedback.outcome, "avoid");
  assert.equal(payload.feedback.category, "brand");
  assert.equal(payload.entry.source, "feedback:avoid");
  assert.equal(payload.entry.text, "Avoid in future outputs: decorative marketing language in enterprise dashboards");
  assert.equal(payload.count, 2);

  const notePath = path.join(dir, "feedback.md");
  writeFileSync(notePath, "Prefer keyboard-first critique notes\n", "utf8");
  const fileOutput = await captureStdout(() => runLearn([
    "--feedback",
    "--from-file",
    notePath,
    "--outcome",
    "improve",
    "--category",
    "accessibility",
    "--file",
    filePath,
    "--json",
  ]));
  const filePayload = JSON.parse(fileOutput);

  assert.equal(filePayload.feedback.outcome, "improve");
  assert.equal(filePayload.feedback.category, "accessibility");
  assert.equal(filePayload.entry.source, "feedback:improve");
  assert.equal(filePayload.entry.text, "Improve future outputs by: Prefer keyboard-first critique notes");
  assert.equal(filePayload.count, 3);
}));

test("runLearn init previews starter entries and applies only after confirmation", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const previewOutput = await captureStdout(() => runLearn(["--init", "--file", filePath]));

  assert.match(previewOutput, /Learning profile init preview/);
  assert.match(previewOutput, /Would add:/);
  assert.match(previewOutput, /No changes made/);
  assert.equal(loadLearningProfile(filePath).entries.length, 0);

  const applyOutput = await captureStdout(() => runLearn(["--init", "--yes", "--file", filePath, "--json"]));
  const payload = JSON.parse(applyOutput);

  assert.equal(payload.applied, true);
  assert.equal(payload.dryRun, false);
  assert.equal(payload.source, "init:local-dogfood");
  assert.equal(payload.candidateCount, 6);
  assert.equal(payload.addedCount, 6);
  assert.equal(payload.skippedCount, 0);
  assert.equal(payload.count, 6);
  assert.equal(payload.entries[2].category, "accessibility");
  assert.equal(loadLearningProfile(filePath).entries.length, 6);

  const duplicateOutput = await captureStdout(() => runLearn(["--init", "--yes", "--file", filePath, "--json"]));
  const duplicatePayload = JSON.parse(duplicateOutput);

  assert.equal(duplicatePayload.addedCount, 0);
  assert.equal(duplicatePayload.skippedCount, 6);
  assert.equal(duplicatePayload.count, 6);
  assert.equal(loadLearningProfile(filePath).entries.length, 6);
}));

test("runLearn import supports dry-run and confirmed JSON apply", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
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
  const importPath = path.join(dir, "portable-learning.json");
  writeFileSync(importPath, JSON.stringify({
    entries: [
      {
        id: "learn-b",
        category: "workflow",
        text: "Keep audit findings evidence-led",
        source: "cli",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");

  const dryRunOutput = await captureStdout(() => runLearn([
    "--import",
    "--from-file",
    importPath,
    "--dry-run",
    "--file",
    filePath,
    "--json",
  ]));
  const dryRunPayload = JSON.parse(dryRunOutput);
  assert.equal(dryRunPayload.dryRun, true);
  assert.equal(dryRunPayload.applied, false);
  assert.equal(dryRunPayload.addedCount, 1);
  assert.equal(loadLearningProfile(filePath).entries.length, 1);

  await assert.rejects(
    () => runLearn(["--import", "--from-file", importPath, "--file", filePath]),
    /Refusing to import learning entries without --yes/,
  );

  const applyOutput = await captureStdout(() => runLearn([
    "--import",
    "--from-file",
    importPath,
    "--yes",
    "--file",
    filePath,
    "--json",
  ]));
  const payload = JSON.parse(applyOutput);
  assert.equal(payload.applied, true);
  assert.equal(payload.addedCount, 1);
  assert.equal(payload.count, 2);
  assert.equal(payload.added[0].source, "import:cli");
  assert.equal(loadLearningProfile(filePath).entries.length, 2);
}));

test("runLearn backup emits human summary and portable JSON payload", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  rememberLearning({
    text: "Prefer compact Korean dashboards",
    category: "korean",
    filePath,
    now: new Date("2026-05-22T00:00:00.000Z"),
  });

  const humanOutput = await captureStdout(() => runLearn(["--backup", "--file", filePath]));
  assert.match(humanOutput, /Learning profile backup/);
  assert.match(humanOutput, /Entries: 1/);
  assert.match(humanOutput, /design-ai learn --backup --json --out learning-backup\.json/);

  const jsonOutput = await captureStdout(() => runLearn(["--backup", "--file", filePath, "--json"]));
  const payload = JSON.parse(jsonOutput);

  assert.equal(payload.file, filePath);
  assert.equal(payload.count, 1);
  assert.deepEqual(payload.auditSummary, { status: "pass", failures: 0, warnings: 0 });
  assert.equal(payload.entries[0].category, "korean");
  assert.equal(payload.entries[0].text, "Prefer compact Korean dashboards");

  const outPath = path.join(dir, "learning-backup-out.json");
  const wroteOutput = await captureStdout(() => runLearn(["--backup", "--file", filePath, "--json", "--out", outPath]));
  assert.match(wroteOutput, /Wrote /);
  const filePayload = JSON.parse(readFileSync(outPath, "utf8"));
  assert.equal(filePayload.file, filePath);
  assert.equal(filePayload.count, 1);

  await assert.rejects(
    () => runLearn(["--backup", "--file", filePath, "--json", "--out", outPath]),
    /Output file already exists/,
  );
}));

test("runLearn redact emits human summary and redacted portable JSON without mutating the profile", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:00.000Z",
    entries: [
      {
        id: "learn-a",
        category: "constraint",
        text: "Avoid storing token=sk-test12345678901234567890 in learning notes",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
    ],
  }), "utf8");

  const humanOutput = await captureStdout(() => runLearn(["--redact", "--file", filePath]));
  assert.match(humanOutput, /Redacted learning profile backup/);
  assert.match(humanOutput, /Redacted entries: 1/);
  assert.match(humanOutput, /learn-a: sensitive-secret-assignment, sensitive-openai-secret-key/);
  assert.match(humanOutput, /No changes made/);

  const jsonOutput = await captureStdout(() => runLearn(["--redact", "--file", filePath, "--json"]));
  const payload = JSON.parse(jsonOutput);

  assert.equal(payload.file, filePath);
  assert.equal(payload.redacted, true);
  assert.equal(payload.redactedCount, 1);
  assert.equal(payload.auditSummary.status, "pass");
  assert.doesNotMatch(payload.entries[0].text, /sk-test/);
  assert.match(payload.entries[0].text, /\[REDACTED:secret-assignment\]/);
  assert.equal(loadLearningProfile(filePath).entries[0].text, "Avoid storing token=sk-test12345678901234567890 in learning notes");

  const portablePath = path.join(dir, "learning-backup.json");
  writeFileSync(portablePath, JSON.stringify({
    entries: [
      {
        id: "learn-portable",
        category: "constraint",
        text: "Never paste api_key: sk-test12345678901234567890 into examples",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
    ],
  }), "utf8");

  const fileJsonOutput = await captureStdout(() => runLearn(["--redact", "--from-file", portablePath, "--json"]));
  const filePayload = JSON.parse(fileJsonOutput);
  assert.equal(filePayload.file, portablePath);
  assert.equal(filePayload.redactedCount, 1);
  assert.doesNotMatch(filePayload.entries[0].text, /sk-test/);
  assert.match(filePayload.entries[0].text, /\[REDACTED:secret-assignment\]/);
  assert.match(readFileSync(portablePath, "utf8"), /sk-test12345678901234567890/);

  const outPath = path.join(dir, "learning-redacted.json");
  const wroteOutput = await captureStdout(() => runLearn([
    "--redact",
    "--from-file",
    portablePath,
    "--json",
    "--out",
    outPath,
  ]));
  assert.match(wroteOutput, /Wrote /);
  const outPayload = JSON.parse(readFileSync(outPath, "utf8"));
  assert.equal(outPayload.file, portablePath);
  assert.equal(outPayload.redactedCount, 1);
  assert.doesNotMatch(outPayload.entries[0].text, /sk-test/);
}));

test("runLearn verify validates portable learning JSON without mutating the target profile", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  rememberLearning({
    text: "Existing local preference",
    category: "preference",
    filePath,
    now: new Date("2026-05-22T00:00:00.000Z"),
  });
  const importPath = path.join(dir, "learning-backup.json");
  writeFileSync(importPath, JSON.stringify({
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

  const humanOutput = await captureStdout(() => runLearn(["--verify", "--from-file", importPath, "--file", filePath]));
  assert.match(humanOutput, /Learning import verification/);
  assert.match(humanOutput, /Importable: yes/);
  assert.match(humanOutput, /No learning import issues found\. No changes made\./);
  assert.equal(loadLearningProfile(filePath).entries.length, 1);

  const jsonOutput = await captureStdout(() => runLearn(["--verify", "--from-file", importPath, "--file", filePath, "--json"]));
  const payload = JSON.parse(jsonOutput);

  assert.equal(payload.source, importPath);
  assert.equal(payload.importable, true);
  assert.equal(payload.count, 1);
  assert.deepEqual(payload.auditSummary, { status: "pass", failures: 0, warnings: 0 });
  assert.equal(payload.entries[0].source, "import:cli");
  assert.equal(loadLearningProfile(filePath).entries.length, 1);
}));

test("applyLearningAuditFixes previews and applies safe audit cleanup", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:02.000Z",
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
    ],
  }), "utf8");

  const dryRun = applyLearningAuditFixes({ filePath, dryRun: true });
  assert.equal(dryRun.dryRun, true);
  assert.equal(dryRun.applied, false);
  assert.equal(dryRun.before.status, "warn");
  assert.equal(dryRun.cleanupCount, 2);
  assert.deepEqual(dryRun.cleanup.map((fix) => fix.entryId), ["learn-b", "learn-c"]);
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-a", "learn-b", "learn-c"]);

  const applied = applyLearningAuditFixes({
    filePath,
    dryRun: false,
    now: new Date("2026-05-22T00:03:00.000Z"),
  });
  assert.equal(applied.dryRun, false);
  assert.equal(applied.applied, true);
  assert.equal(applied.cleanupCount, 2);
  assert.deepEqual(applied.removed.map((entry) => entry.id), ["learn-b", "learn-c"]);
  assert.equal(applied.after.status, "pass");
  assert.deepEqual(loadLearningProfile(filePath).entries.map((entry) => entry.id), ["learn-a"]);
}));
