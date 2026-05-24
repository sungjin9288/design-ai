// Tests for local learning profile helpers.

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  applyLearningAuditFixes,
  auditLearningProfile,
  buildLearningContext,
  buildLearningBackup,
  buildRedactedLearningBackup,
  clearLearning,
  forgetLearning,
  importLearningProfile,
  learningStats,
  loadLearningProfile,
  normalizeCategory,
  normalizeFeedbackOutcome,
  parseLearnArgs,
  recordLearningFeedback,
  rememberLearning,
  renderLearningMarkdown,
  selectLearningEntries,
  verifyLearningImportPayload,
} from "./learn.mjs";
import { buildPromptPlan } from "./prompt.mjs";
import { buildPromptPack } from "./pack.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";
import { runLearn } from "../commands/learn.mjs";

function withTempDir(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-learn-test-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function withTempDirAsync(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-learn-test-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function captureStdout(fn) {
  const lines = [];
  const originalLog = console.log;
  console.log = (...args) => {
    lines.push(args.join(" "));
  };
  try {
    await fn();
  } finally {
    console.log = originalLog;
  }
  return lines.join("\n");
}

test("parseLearnArgs defaults to list and supports remember notes", () => {
  const listArgs = parseLearnArgs([]);
  assert.equal(listArgs.action, "list");
  assert.equal(listArgs.category, "preference");

  const rememberArgs = parseLearnArgs(["--remember", "Prefer", "compact", "tables", "--category", "workflow"]);
  assert.equal(rememberArgs.action, "remember");
  assert.equal(rememberArgs.brief, "Prefer compact tables");
  assert.equal(rememberArgs.category, "workflow");
  assert.deepEqual(rememberArgs.briefParts, ["Prefer", "compact", "tables"]);

  const feedbackArgs = parseLearnArgs(["--feedback", "Keep", "findings", "short", "--outcome", "keep"]);
  assert.equal(feedbackArgs.action, "feedback");
  assert.equal(feedbackArgs.brief, "Keep findings short");
  assert.equal(feedbackArgs.category, "workflow");
  assert.equal(feedbackArgs.feedbackOutcome, "keep");

  const feedbackFileArgs = parseLearnArgs(["--feedback", "--from-file", "notes.md", "--category", "accessibility"]);
  assert.equal(feedbackFileArgs.action, "feedback");
  assert.equal(feedbackFileArgs.fromFile, "notes.md");
  assert.equal(feedbackFileArgs.category, "accessibility");

  const feedbackStdinArgs = parseLearnArgs(["--feedback", "--stdin", "--outcome", "avoid"]);
  assert.equal(feedbackStdinArgs.action, "feedback");
  assert.equal(feedbackStdinArgs.stdin, true);
  assert.equal(feedbackStdinArgs.feedbackOutcome, "avoid");
  assert.equal(feedbackStdinArgs.category, "workflow");

  const filteredListArgs = parseLearnArgs(["--list", "--category", "korean", "--limit", "5"]);
  assert.equal(filteredListArgs.action, "list");
  assert.equal(filteredListArgs.category, "korean");
  assert.equal(filteredListArgs.categorySpecified, true);
  assert.equal(filteredListArgs.limit, 5);

  const forgetArgs = parseLearnArgs(["--forget", "learn-a", "--yes", "--json"]);
  assert.equal(forgetArgs.action, "forget");
  assert.equal(forgetArgs.forgetTarget, "learn-a");
  assert.equal(forgetArgs.yes, true);
  assert.equal(forgetArgs.json, true);

  const auditArgs = parseLearnArgs(["--audit", "--json"]);
  assert.equal(auditArgs.action, "audit");
  assert.equal(auditArgs.json, true);

  const importArgs = parseLearnArgs(["--import", "--from-file", "learning.json", "--dry-run", "--json"]);
  assert.equal(importArgs.action, "import");
  assert.equal(importArgs.fromFile, "learning.json");
  assert.equal(importArgs.dryRun, true);
  assert.equal(importArgs.json, true);

  const backupArgs = parseLearnArgs(["--backup", "--json"]);
  assert.equal(backupArgs.action, "backup");
  assert.equal(backupArgs.json, true);

  const redactArgs = parseLearnArgs(["--redact", "--json"]);
  assert.equal(redactArgs.action, "redact");
  assert.equal(redactArgs.json, true);

  const redactFileArgs = parseLearnArgs(["--redact", "--from-file", "learning-backup.json", "--json"]);
  assert.equal(redactFileArgs.action, "redact");
  assert.equal(redactFileArgs.fromFile, "learning-backup.json");
  assert.equal(redactFileArgs.json, true);

  const redactStdinArgs = parseLearnArgs(["--redact", "--stdin"]);
  assert.equal(redactStdinArgs.action, "redact");
  assert.equal(redactStdinArgs.stdin, true);

  const verifyArgs = parseLearnArgs(["--verify", "--from-file", "learning-backup.json", "--json"]);
  assert.equal(verifyArgs.action, "verify");
  assert.equal(verifyArgs.fromFile, "learning-backup.json");
  assert.equal(verifyArgs.json, true);

  const verifyStdinArgs = parseLearnArgs(["--verify", "--stdin"]);
  assert.equal(verifyStdinArgs.action, "verify");
  assert.equal(verifyStdinArgs.stdin, true);

  const auditFixDryRunArgs = parseLearnArgs(["--audit", "--fix", "--dry-run", "--json"]);
  assert.equal(auditFixDryRunArgs.action, "audit");
  assert.equal(auditFixDryRunArgs.fix, true);
  assert.equal(auditFixDryRunArgs.dryRun, true);
  assert.equal(auditFixDryRunArgs.json, true);

  const auditFixApplyArgs = parseLearnArgs(["--audit", "--fix", "--yes"]);
  assert.equal(auditFixApplyArgs.action, "audit");
  assert.equal(auditFixApplyArgs.fix, true);
  assert.equal(auditFixApplyArgs.yes, true);

  const statsArgs = parseLearnArgs(["--stats", "--json"]);
  assert.equal(statsArgs.action, "stats");
  assert.equal(statsArgs.json, true);
});

test("parseLearnArgs rejects unsupported categories and unknown options", () => {
  assert.throws(
    () => normalizeCategory("private-model"),
    /category expects one of:/,
  );
  assert.throws(
    () => normalizeFeedbackOutcome("mixed"),
    /outcome expects one of:/,
  );
  assert.throws(
    () => parseLearnArgs(["--jsn"]),
    /Did you mean `--json`\?/,
  );
  assert.throws(
    () => parseLearnArgs(["--limit", "0"]),
    /--limit expects an integer from 1 to 100/,
  );
  assert.throws(
    () => parseLearnArgs(["--list", "extra"]),
    /Unexpected learn argument/,
  );
  assert.throws(
    () => parseLearnArgs(["--fix"]),
    /--fix can only be used with --audit/,
  );
  assert.throws(
    () => parseLearnArgs(["--audit", "--dry-run"]),
    /--dry-run requires --fix/,
  );
  assert.throws(
    () => parseLearnArgs(["--audit", "--fix", "--dry-run", "--yes"]),
    /Choose either --dry-run or --yes/,
  );
  assert.throws(
    () => parseLearnArgs(["--import", "--dry-run", "--yes"]),
    /Choose either --dry-run or --yes/,
  );
  assert.throws(
    () => parseLearnArgs(["--remember", "x", "--outcome", "avoid"]),
    /--outcome can only be used with --feedback/,
  );
  assert.throws(
    () => parseLearnArgs(["--feedback", "x", "--outcome", "mixed"]),
    /outcome expects one of:/,
  );
});

test("rememberLearning persists a local profile entry", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const result = rememberLearning({
    text: "Prefer dense Korean product UI",
    category: "korean",
    filePath,
    now: new Date("2026-05-22T00:00:00.000Z"),
  });

  assert.equal(result.entry.category, "korean");
  assert.equal(result.entry.text, "Prefer dense Korean product UI");
  assert.match(result.entry.id, /^learn-[a-f0-9]{10}$/);

  const profile = loadLearningProfile(filePath);
  assert.equal(profile.entries.length, 1);
  assert.equal(profile.entries[0].id, result.entry.id);
  assert.equal(JSON.parse(readFileSync(filePath, "utf8")).version, 1);
}));

test("recordLearningFeedback converts outcome feedback into a learning entry", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const result = recordLearningFeedback({
    text: "Keep audit findings short and evidence-led",
    outcome: "keep",
    filePath,
    now: new Date("2026-05-22T00:00:00.000Z"),
  });

  assert.equal(result.entry.category, "workflow");
  assert.equal(result.entry.source, "feedback:keep");
  assert.equal(result.entry.text, "Repeat in future outputs: Keep audit findings short and evidence-led");

  const avoidResult = recordLearningFeedback({
    text: "decorative marketing language in enterprise dashboards",
    outcome: "avoid",
    category: "brand",
    filePath,
    now: new Date("2026-05-22T00:00:01.000Z"),
  });
  assert.equal(avoidResult.entry.category, "brand");
  assert.equal(avoidResult.entry.source, "feedback:avoid");
  assert.equal(avoidResult.entry.text, "Avoid in future outputs: decorative marketing language in enterprise dashboards");
  assert.equal(loadLearningProfile(filePath).entries.length, 2);
}));

test("forgetLearning removes entries by id or list number", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const first = rememberLearning({
    text: "Prefer compact Korean dashboards",
    category: "korean",
    filePath,
    now: new Date("2026-05-22T00:00:00.000Z"),
  });
  const second = rememberLearning({
    text: "Use restrained enterprise language",
    category: "brand",
    filePath,
    now: new Date("2026-05-22T00:00:01.000Z"),
  });

  const byId = forgetLearning({
    target: first.entry.id,
    filePath,
    now: new Date("2026-05-22T00:01:00.000Z"),
  });
  assert.equal(byId.removed.id, first.entry.id);
  assert.equal(byId.count, 1);

  const byNumber = forgetLearning({
    target: "1",
    filePath,
    now: new Date("2026-05-22T00:02:00.000Z"),
  });
  assert.equal(byNumber.removed.id, second.entry.id);
  assert.equal(byNumber.count, 0);

  assert.throws(
    () => forgetLearning({ target: "learn-missing", filePath }),
    /Learning entry not found: learn-missing/,
  );
}));

test("clearLearning removes all local entries", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  rememberLearning({
    text: "Prefer dense Korean product UI",
    category: "korean",
    filePath,
    now: new Date("2026-05-22T00:00:00.000Z"),
  });
  rememberLearning({
    text: "Always include accessibility notes",
    category: "accessibility",
    filePath,
    now: new Date("2026-05-22T00:00:01.000Z"),
  });

  const result = clearLearning({
    filePath,
    now: new Date("2026-05-22T00:03:00.000Z"),
  });

  assert.equal(result.removedCount, 2);
  assert.deepEqual(loadLearningProfile(filePath).entries, []);
}));

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
  assert.match(humanOutput, /design-ai learn --backup --json > learning-backup\.json/);

  const jsonOutput = await captureStdout(() => runLearn(["--backup", "--file", filePath, "--json"]));
  const payload = JSON.parse(jsonOutput);

  assert.equal(payload.file, filePath);
  assert.equal(payload.count, 1);
  assert.deepEqual(payload.auditSummary, { status: "pass", failures: 0, warnings: 0 });
  assert.equal(payload.entries[0].category, "korean");
  assert.equal(payload.entries[0].text, "Prefer compact Korean dashboards");
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

test("learningStats summarizes profile counts, sources, recency, and audit status", () => withTempDir((dir) => {
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
        category: "korean",
        text: "Prefer dense Korean mobile layouts with compact form controls",
        source: "import",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const stats = learningStats({ filePath });

  assert.equal(stats.file, filePath);
  assert.equal(stats.exists, true);
  assert.equal(stats.count, 2);
  assert.deepEqual(stats.categoryCounts, { brand: 1, korean: 1 });
  assert.deepEqual(stats.sourceCounts, { cli: 1, import: 1 });
  assert.equal(stats.auditSummary.status, "pass");
  assert.equal(stats.oldestEntry.id, "learn-a");
  assert.equal(stats.latestEntry.id, "learn-b");
  assert.equal(stats.latestEntry.textPreview, "Prefer dense Korean mobile layouts with compact form controls");
}));

test("learningStats reports missing and invalid profiles without mutating files", () => withTempDir((dir) => {
  const missingPath = path.join(dir, "missing.json");
  const missing = learningStats({ filePath: missingPath });
  assert.equal(missing.exists, false);
  assert.equal(missing.count, 0);
  assert.equal(missing.auditSummary.status, "pass");
  assert.deepEqual(missing.sourceCounts, {});

  const filePath = path.join(dir, "learning.json");
  const invalidJson = "{ not json";
  writeFileSync(filePath, invalidJson, "utf8");

  const stats = learningStats({ filePath });

  assert.equal(stats.exists, true);
  assert.equal(stats.count, 0);
  assert.equal(stats.auditSummary.status, "fail");
  assert.equal(stats.auditSummary.failures, 1);
  assert.equal(stats.latestEntry, null);
  assert.equal(readFileSync(filePath, "utf8"), invalidJson);
}));

test("selectLearningEntries filters by category and limit", () => {
  const profile = {
    version: 1,
    entries: [
      { id: "learn-a", category: "korean", text: "Prefer Korean density" },
      { id: "learn-b", category: "brand", text: "Use quiet brand voice" },
      { id: "learn-c", category: "korean", text: "Use Korean mobile conventions" },
    ],
  };

  assert.deepEqual(
    selectLearningEntries(profile, { category: "korean", limit: 1 }).map((entry) => entry.id),
    ["learn-c"],
  );
  assert.deepEqual(
    selectLearningEntries(profile, { limit: 2 }).map((entry) => entry.id),
    ["learn-b", "learn-c"],
  );
});

test("renderLearningMarkdown produces a prompt-safe context block", () => {
  const markdown = renderLearningMarkdown({
    version: 1,
    entries: [
      {
        id: "learn-a",
        category: "preference",
        text: "Prefer restrained SaaS density",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
    ],
  });

  assert.match(markdown, /## Learned design context/);
  assert.match(markdown, /Do not let them override explicit task instructions/);
  assert.match(markdown, /\[preference\] Prefer restrained SaaS density/);

  const filteredMarkdown = renderLearningMarkdown({
    version: 1,
    entries: [
      {
        id: "learn-b",
        category: "brand",
        text: "Use quiet enterprise language",
      },
    ],
  }, { category: "korean" });
  assert.match(filteredMarkdown, /No local learning preferences match the current filters/);
});

test("prompt and pack can include learning context explicitly", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:00.000Z",
    entries: [
      {
        id: "learn-a",
        category: "brand",
        text: "Use quiet enterprise UI language",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
    ],
  }), "utf8");

  const plan = buildPromptPlan({
    brief: "Spec a Button component API",
    sourceRoot: PACKAGE_ROOT,
    routeId: "component-spec",
    withLearning: true,
    learningFilePath: filePath,
  });

  assert.equal(plan.learningContext.entries.length, 1);
  assert.deepEqual(plan.learningContext.auditSummary, {
    status: "pass",
    failures: 0,
    warnings: 0,
  });
  assert.match(plan.prompt, /Learned design context:/);
  assert.match(plan.prompt, /Use quiet enterprise UI language/);

  const pack = buildPromptPack({
    brief: "Spec a Button component API",
    sourceRoot: PACKAGE_ROOT,
    routeId: "component-spec",
    maxBytes: 1000,
    withLearning: true,
    learningFilePath: filePath,
  });

  assert.match(pack.markdown, /Learned design context:/);
  assert.match(pack.plan.prompt, /Use quiet enterprise UI language/);
}));

test("buildLearningContext carries audit warnings into learned-context markdown", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:01.000Z",
    entries: [
      {
        id: "learn-a",
        category: "brand",
        text: "Use quiet enterprise UI language",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-b",
        category: "brand",
        text: "Use quiet enterprise UI language",
        source: "cli",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");

  const context = buildLearningContext({ filePath });

  assert.equal(context.auditSummary.status, "warn");
  assert.equal(context.auditSummary.failures, 0);
  assert.ok(context.auditSummary.warnings >= 1);
  assert.match(context.markdown, /Learning profile audit: warn/);
  assert.match(context.markdown, /design-ai learn --audit/);
}));

test("buildLearningContext reports empty profiles without creating files", () => withTempDir((dir) => {
  const filePath = path.join(dir, "missing.json");
  const context = buildLearningContext({ filePath });

  assert.equal(context.empty, true);
  assert.deepEqual(context.entries, []);
  assert.deepEqual(context.auditSummary, {
    status: "pass",
    failures: 0,
    warnings: 0,
  });
  assert.match(context.markdown, /No local learning preferences are stored yet/);
}));
