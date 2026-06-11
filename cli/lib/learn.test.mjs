// Tests for local learning profile helpers.

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  applyLearningAuditFixes,
  applyLearningCurationPlan,
  auditLearningProfile,
  buildLearningCurationPlan,
  buildLearningContext,
  buildLearningUsageEvent,
  buildLearningBackup,
  buildLearningEvalTemplate,
  buildRedactedLearningBackup,
  clearLearning,
  defaultLearningArchiveFile,
  defaultLearningRestoreBackupFile,
  defaultLearningUsageFile,
  diffLearningProfiles,
  forgetLearning,
  importLearningProfile,
  initializeLearningProfile,
  listLearningRestoreBackups,
  learningEvalReport,
  learningStats,
  learningUsageStats,
  loadLearningArchive,
  loadLearningProfile,
  loadLearningUsageLog,
  normalizeCategory,
  normalizeFeedbackOutcome,
  parseLearnArgs,
  pruneLearningRestoreBackups,
  recordLearningUsage,
  recordLearningFeedback,
  rememberLearning,
  renderLearningCurationReport,
  renderLearningMarkdown,
  restoreLearningProfile,
  selectLearningEntries,
  selectLearningEntrySet,
  verifyLearningImportPayload,
} from "./learn.mjs";
import { buildPromptPlan } from "./prompt.mjs";
import { buildPromptPack } from "./pack.mjs";
import {
  agentBacklogReport,
  learningSignalRegistry,
  renderAgentBacklogReport,
  summarizeSignalEvalFile,
} from "./signals.mjs";
import {
  buildSkillEvolutionProposals,
  renderSkillEvolutionProposalReport,
} from "./skill-proposals.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";
import { runLearn } from "../commands/learn.mjs";
import { runPrompt } from "../commands/prompt.mjs";
import { runPack } from "../commands/pack.mjs";

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

async function withLearningEnv({ learningFile, usageFile }, fn) {
  const previousLearningFile = process.env.DESIGN_AI_LEARNING_FILE;
  const previousUsageFile = process.env.DESIGN_AI_LEARNING_USAGE_FILE;
  process.env.DESIGN_AI_LEARNING_FILE = learningFile;
  process.env.DESIGN_AI_LEARNING_USAGE_FILE = usageFile;
  try {
    return await fn();
  } finally {
    if (previousLearningFile === undefined) {
      delete process.env.DESIGN_AI_LEARNING_FILE;
    } else {
      process.env.DESIGN_AI_LEARNING_FILE = previousLearningFile;
    }
    if (previousUsageFile === undefined) {
      delete process.env.DESIGN_AI_LEARNING_USAGE_FILE;
    } else {
      process.env.DESIGN_AI_LEARNING_USAGE_FILE = previousUsageFile;
    }
  }
}

test("parseLearnArgs defaults to list and supports remember notes", () => {
  const listArgs = parseLearnArgs([]);
  assert.equal(listArgs.action, "list");
  assert.equal(listArgs.category, "preference");

  const initArgs = parseLearnArgs(["--init", "--yes", "--json"]);
  assert.equal(initArgs.action, "init");
  assert.equal(initArgs.yes, true);
  assert.equal(initArgs.json, true);

  const initDryRunArgs = parseLearnArgs(["--init", "--dry-run"]);
  assert.equal(initDryRunArgs.action, "init");
  assert.equal(initDryRunArgs.dryRun, true);

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

  const queryListArgs = parseLearnArgs(["--list", "--query", "keyboard accessibility", "--explain", "--limit", "2"]);
  assert.equal(queryListArgs.action, "list");
  assert.equal(queryListArgs.query, "keyboard accessibility");
  assert.equal(queryListArgs.explain, true);
  assert.equal(queryListArgs.limit, 2);

  const queryDefaultArgs = parseLearnArgs(["--query", "pricing"]);
  assert.equal(queryDefaultArgs.action, "list");
  assert.equal(queryDefaultArgs.query, "pricing");

  const queryExportArgs = parseLearnArgs(["--export", "--query", "brand voice", "--json"]);
  assert.equal(queryExportArgs.action, "export");
  assert.equal(queryExportArgs.query, "brand voice");
  assert.equal(queryExportArgs.json, true);

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

  const backupOutArgs = parseLearnArgs(["--backup", "--json", "--out", "learning-backup.json", "--force"]);
  assert.equal(backupOutArgs.action, "backup");
  assert.equal(backupOutArgs.json, true);
  assert.equal(backupOutArgs.outPath, "learning-backup.json");
  assert.equal(backupOutArgs.force, true);

  const exportOutArgs = parseLearnArgs(["--export", "--out", "learned-context.md"]);
  assert.equal(exportOutArgs.action, "export");
  assert.equal(exportOutArgs.outPath, "learned-context.md");
  assert.equal(exportOutArgs.json, false);

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

  const diffArgs = parseLearnArgs(["--diff", "--from-file", "learning-backup.json", "--json"]);
  assert.equal(diffArgs.action, "diff");
  assert.equal(diffArgs.fromFile, "learning-backup.json");
  assert.equal(diffArgs.json, true);

  const diffStdinArgs = parseLearnArgs(["--diff", "--stdin"]);
  assert.equal(diffStdinArgs.action, "diff");
  assert.equal(diffStdinArgs.stdin, true);

  const restoreArgs = parseLearnArgs(["--restore", "--from-file", "learning-backup.json", "--dry-run", "--backup-file", "learning-before-restore.json", "--json"]);
  assert.equal(restoreArgs.action, "restore");
  assert.equal(restoreArgs.fromFile, "learning-backup.json");
  assert.equal(restoreArgs.dryRun, true);
  assert.equal(restoreArgs.backupFilePath, path.resolve("learning-before-restore.json"));
  assert.equal(restoreArgs.json, true);

  const restoreStdinArgs = parseLearnArgs(["--restore", "--stdin", "--yes"]);
  assert.equal(restoreStdinArgs.action, "restore");
  assert.equal(restoreStdinArgs.stdin, true);
  assert.equal(restoreStdinArgs.yes, true);

  const restoreBackupsArgs = parseLearnArgs(["--restore-backups", "--limit", "3", "--json"]);
  assert.equal(restoreBackupsArgs.action, "restore-backups");
  assert.equal(restoreBackupsArgs.limit, 3);
  assert.equal(restoreBackupsArgs.json, true);

  const restoreBackupsPruneArgs = parseLearnArgs(["--restore-backups", "--prune", "--keep", "2", "--dry-run", "--json"]);
  assert.equal(restoreBackupsPruneArgs.action, "restore-backups");
  assert.equal(restoreBackupsPruneArgs.prune, true);
  assert.equal(restoreBackupsPruneArgs.keep, 2);
  assert.equal(restoreBackupsPruneArgs.dryRun, true);
  assert.equal(restoreBackupsPruneArgs.json, true);

  const restoreBackupsPruneApplyArgs = parseLearnArgs(["--restore-backups", "--prune", "--keep", "2", "--yes"]);
  assert.equal(restoreBackupsPruneApplyArgs.action, "restore-backups");
  assert.equal(restoreBackupsPruneApplyArgs.prune, true);
  assert.equal(restoreBackupsPruneApplyArgs.keep, 2);
  assert.equal(restoreBackupsPruneApplyArgs.yes, true);

  const auditFixDryRunArgs = parseLearnArgs(["--audit", "--fix", "--dry-run", "--json"]);
  assert.equal(auditFixDryRunArgs.action, "audit");
  assert.equal(auditFixDryRunArgs.fix, true);
  assert.equal(auditFixDryRunArgs.dryRun, true);
  assert.equal(auditFixDryRunArgs.json, true);

  const auditFixApplyArgs = parseLearnArgs(["--audit", "--fix", "--yes"]);
  assert.equal(auditFixApplyArgs.action, "audit");
  assert.equal(auditFixApplyArgs.fix, true);
  assert.equal(auditFixApplyArgs.yes, true);

  const curateArgs = parseLearnArgs(["--curate", "--dry-run", "--json"]);
  assert.equal(curateArgs.action, "curate");
  assert.equal(curateArgs.dryRun, true);
  assert.equal(curateArgs.json, true);

  const curateUsageArgs = parseLearnArgs(["--curate", "--usage-file", "learning.usage.json", "--json"]);
  assert.equal(curateUsageArgs.action, "curate");
  assert.equal(curateUsageArgs.usageFilePath, path.resolve("learning.usage.json"));
  assert.equal(curateUsageArgs.json, true);

  const curateReportArgs = parseLearnArgs(["--curate", "--report", "--out", "learning-curation-report.md"]);
  assert.equal(curateReportArgs.action, "curate");
  assert.equal(curateReportArgs.report, true);
  assert.equal(curateReportArgs.outPath, "learning-curation-report.md");

  const curateApplyArgs = parseLearnArgs(["--curate", "--yes"]);
  assert.equal(curateApplyArgs.action, "curate");
  assert.equal(curateApplyArgs.yes, true);

  const statsArgs = parseLearnArgs(["--stats", "--json"]);
  assert.equal(statsArgs.action, "stats");
  assert.equal(statsArgs.json, true);

  const usageArgs = parseLearnArgs(["--usage", "--usage-file", "learning.usage.json", "--limit", "5", "--json"]);
  assert.equal(usageArgs.action, "usage");
  assert.equal(usageArgs.usageFilePath, path.resolve("learning.usage.json"));
  assert.equal(usageArgs.limit, 5);
  assert.equal(usageArgs.json, true);

  const signalsArgs = parseLearnArgs(["--signals", "--from-file", "signals", "--usage-file", "learning.usage.json", "--json"]);
  assert.equal(signalsArgs.action, "signals");
  assert.equal(signalsArgs.fromFile, "signals");
  assert.equal(signalsArgs.usageFilePath, path.resolve("learning.usage.json"));
  assert.equal(signalsArgs.json, true);

  const strictSignalsArgs = parseLearnArgs(["--signals", "--strict", "--json"]);
  assert.equal(strictSignalsArgs.action, "signals");
  assert.equal(strictSignalsArgs.strict, true);

  const signalsReportArgs = parseLearnArgs(["--signals", "--from-file", "signals", "--report", "--out", "learning-signals.md", "--force"]);
  assert.equal(signalsReportArgs.action, "signals");
  assert.equal(signalsReportArgs.fromFile, "signals");
  assert.equal(signalsReportArgs.report, true);
  assert.equal(signalsReportArgs.outPath, "learning-signals.md");
  assert.equal(signalsReportArgs.force, true);

  const agentBacklogArgs = parseLearnArgs(["--agent-backlog", "--from-file", "signals", "--usage-file", "learning.usage.json", "--strict", "--json"]);
  assert.equal(agentBacklogArgs.action, "agent-backlog");
  assert.equal(agentBacklogArgs.fromFile, "signals");
  assert.equal(agentBacklogArgs.usageFilePath, path.resolve("learning.usage.json"));
  assert.equal(agentBacklogArgs.strict, true);
  assert.equal(agentBacklogArgs.json, true);

  const agentBacklogReportArgs = parseLearnArgs(["--agent-backlog", "--from-file", "signals", "--report", "--out", "agent-backlog.md", "--force"]);
  assert.equal(agentBacklogReportArgs.action, "agent-backlog");
  assert.equal(agentBacklogReportArgs.fromFile, "signals");
  assert.equal(agentBacklogReportArgs.report, true);
  assert.equal(agentBacklogReportArgs.outPath, "agent-backlog.md");
  assert.equal(agentBacklogReportArgs.force, true);

  const proposeSkillsArgs = parseLearnArgs(["--propose-skills", "--from-file", "signals", "--usage-file", "learning.usage.json", "--review-file", "skill-proposals.review.json", "--min-evidence", "3", "--strict", "--json"]);
  assert.equal(proposeSkillsArgs.action, "propose-skills");
  assert.equal(proposeSkillsArgs.fromFile, "signals");
  assert.equal(proposeSkillsArgs.usageFilePath, path.resolve("learning.usage.json"));
  assert.equal(proposeSkillsArgs.reviewFilePath, path.resolve("skill-proposals.review.json"));
  assert.equal(proposeSkillsArgs.minEvidenceCount, 3);
  assert.equal(proposeSkillsArgs.strict, true);
  assert.equal(proposeSkillsArgs.json, true);

  const proposeSkillsReportArgs = parseLearnArgs(["--propose-skills", "--from-file", "signals", "--report", "--out", "skill-proposals.md", "--force"]);
  assert.equal(proposeSkillsReportArgs.action, "propose-skills");
  assert.equal(proposeSkillsReportArgs.report, true);
  assert.equal(proposeSkillsReportArgs.outPath, "skill-proposals.md");
  assert.equal(proposeSkillsReportArgs.force, true);

  const proposeSkillsPatchArgs = parseLearnArgs(["--propose-skills", "--from-file", "signals", "--patch", "--out", "skill-proposals.patch", "--force"]);
  assert.equal(proposeSkillsPatchArgs.action, "propose-skills");
  assert.equal(proposeSkillsPatchArgs.patch, true);
  assert.equal(proposeSkillsPatchArgs.outPath, "skill-proposals.patch");
  assert.equal(proposeSkillsPatchArgs.force, true);

  const proposeSkillsReviewTemplateArgs = parseLearnArgs(["--propose-skills", "--from-file", "signals", "--review-template", "--out", "skill-proposals.review.json", "--force"]);
  assert.equal(proposeSkillsReviewTemplateArgs.action, "propose-skills");
  assert.equal(proposeSkillsReviewTemplateArgs.reviewTemplate, true);
  assert.equal(proposeSkillsReviewTemplateArgs.outPath, "skill-proposals.review.json");
  assert.equal(proposeSkillsReviewTemplateArgs.force, true);

  const evalArgs = parseLearnArgs(["--eval", "--from-file", "learning-eval.json", "--category", "accessibility", "--limit", "2", "--strict", "--json"]);
  assert.equal(evalArgs.action, "eval");
  assert.equal(evalArgs.fromFile, "learning-eval.json");
  assert.equal(evalArgs.category, "accessibility");
  assert.equal(evalArgs.limit, 2);
  assert.equal(evalArgs.strict, true);
  assert.equal(evalArgs.json, true);

  const evalTemplateArgs = parseLearnArgs(["--eval-template", "--query", "keyboard accessibility", "--category", "accessibility", "--limit", "3", "--out", "learning-eval.json"]);
  assert.equal(evalTemplateArgs.action, "eval-template");
  assert.equal(evalTemplateArgs.query, "keyboard accessibility");
  assert.equal(evalTemplateArgs.category, "accessibility");
  assert.equal(evalTemplateArgs.limit, 3);
  assert.equal(evalTemplateArgs.outPath, "learning-eval.json");
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
    () => parseLearnArgs(["--keep", "0"]),
    /--keep expects an integer from 1 to 100/,
  );
  assert.throws(
    () => parseLearnArgs(["--query"]),
    /--query expects search text/,
  );
  assert.throws(
    () => parseLearnArgs(["--stats", "--query", "brand"]),
    /--query can only be used with --list, --export, or --eval-template/,
  );
  assert.throws(
    () => parseLearnArgs(["--stats", "--prune"]),
    /--prune can only be used with --restore-backups/,
  );
  assert.throws(
    () => parseLearnArgs(["--restore-backups", "--keep", "2"]),
    /--keep can only be used with --restore-backups --prune/,
  );
  assert.throws(
    () => parseLearnArgs(["--list", "extra"]),
    /Unexpected learn argument/,
  );
  assert.throws(
    () => parseLearnArgs(["--remember", "x", "--query", "brand"]),
    /--query can only be used with --list, --export, or --eval-template/,
  );
  assert.throws(
    () => parseLearnArgs(["--export", "--explain"]),
    /--explain can only be used with --list/,
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
    () => parseLearnArgs(["--curate", "--dry-run", "--yes"]),
    /Choose either --dry-run or --yes/,
  );
  assert.throws(
    () => parseLearnArgs(["--restore-backups", "--prune", "--dry-run", "--yes"]),
    /Choose either --dry-run or --yes/,
  );
  assert.throws(
    () => parseLearnArgs(["--restore-backups", "--yes"]),
    /--yes can only be used with --restore-backups --prune/,
  );
  assert.throws(
    () => parseLearnArgs(["--import", "--dry-run", "--yes"]),
    /Choose either --dry-run or --yes/,
  );
  assert.throws(
    () => parseLearnArgs(["--restore", "--dry-run", "--yes"]),
    /Choose either --dry-run or --yes/,
  );
  assert.throws(
    () => parseLearnArgs(["--init", "--dry-run", "--yes"]),
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
  assert.throws(
    () => parseLearnArgs(["--backup", "--out", "learning-backup.json"]),
    /--out requires --json/,
  );
  assert.throws(
    () => parseLearnArgs(["--stats", "--usage-file", "learning.usage.json"]),
    /--usage-file can only be used with --usage, --curate, --signals, --agent-backlog, or --propose-skills/,
  );
  assert.throws(
    () => parseLearnArgs(["--stats", "--review-file", "skill-proposals.review.json"]),
    /--review-file can only be used with --propose-skills/,
  );
  assert.throws(
    () => parseLearnArgs(["--stats", "--review-template"]),
    /--review-template can only be used with --propose-skills/,
  );
  assert.throws(
    () => parseLearnArgs(["--propose-skills", "--min-evidence", "0"]),
    /--min-evidence expects an integer from 1 to 100/,
  );
  assert.throws(
    () => parseLearnArgs(["--signals", "--min-evidence", "2"]),
    /--min-evidence can only be used with --propose-skills/,
  );
  assert.throws(
    () => parseLearnArgs(["--stats", "--backup-file", "learning-before-restore.json"]),
    /--backup-file can only be used with --restore/,
  );
  assert.throws(
    () => parseLearnArgs(["--restore", "--from-file", "learning.json", "--backup-file"]),
    /--backup-file expects a path/,
  );
  assert.throws(
    () => parseLearnArgs(["--stats", "--report"]),
    /--report can only be used with --curate, --signals, --agent-backlog, or --propose-skills/,
  );
  assert.throws(
    () => parseLearnArgs(["--curate", "--report", "--json"]),
    /Choose only one output mode/,
  );
  assert.throws(
    () => parseLearnArgs(["--propose-skills", "--report", "--json"]),
    /Choose only one output mode/,
  );
  assert.throws(
    () => parseLearnArgs(["--stats", "--patch"]),
    /--patch can only be used with --propose-skills/,
  );
  assert.throws(
    () => parseLearnArgs(["--propose-skills", "--patch", "--json"]),
    /Choose only one output mode/,
  );
  assert.throws(
    () => parseLearnArgs(["--propose-skills", "--patch", "--report"]),
    /Choose only one output mode/,
  );
  assert.throws(
    () => parseLearnArgs(["--propose-skills", "--json", "--review-template"]),
    /Choose only one output mode/,
  );
  assert.throws(
    () => parseLearnArgs(["--curate", "--out", "learning-curation-report.md"]),
    /--out requires --json/,
  );
  assert.throws(
    () => parseLearnArgs(["--propose-skills", "--out", "skill-proposals.md"]),
    /--out requires --json/,
  );
  assert.throws(
    () => parseLearnArgs(["--stats", "--strict"]),
    /--strict can only be used with --eval, --signals, --agent-backlog, or --propose-skills/,
  );
  assert.throws(
    () => parseLearnArgs(["--eval"]),
    /--eval requires --from-file or --stdin/,
  );
  assert.throws(
    () => parseLearnArgs(["--signals", "--stdin"]),
    /--signals does not support --stdin/,
  );
  assert.throws(
    () => parseLearnArgs(["--agent-backlog", "--stdin"]),
    /--agent-backlog does not support --stdin/,
  );
  assert.throws(
    () => parseLearnArgs(["--agent-backlog", "--yes"]),
    /--agent-backlog is read-only/,
  );
  assert.throws(
    () => parseLearnArgs(["--propose-skills", "--stdin"]),
    /--propose-skills does not support --stdin/,
  );
  assert.throws(
    () => parseLearnArgs(["--propose-skills", "--yes"]),
    /--propose-skills is preview-only/,
  );
  assert.throws(
    () => parseLearnArgs(["--diff"]),
    /--diff requires --from-file or --stdin/,
  );
  assert.throws(
    () => parseLearnArgs(["--restore"]),
    /--restore requires --from-file or --stdin/,
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

test("initializeLearningProfile previews, applies, and skips duplicate starter entries", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const now = new Date("2026-05-22T00:00:00.000Z");
  const preview = initializeLearningProfile({ filePath, dryRun: true, now });

  assert.equal(preview.dryRun, true);
  assert.equal(preview.applied, false);
  assert.equal(preview.source, "init:local-dogfood");
  assert.equal(preview.candidateCount, 6);
  assert.equal(preview.addedCount, 6);
  assert.equal(preview.skippedCount, 0);
  assert.equal(preview.count, 6);
  assert.equal(preview.entries[0].category, "preference");
  assert.equal(preview.entries[0].source, "init:local-dogfood");
  assert.equal(loadLearningProfile(filePath).entries.length, 0);

  const applied = initializeLearningProfile({ filePath, dryRun: false, now });
  assert.equal(applied.applied, true);
  assert.equal(applied.addedCount, 6);
  assert.equal(loadLearningProfile(filePath).entries.length, 6);

  const duplicate = initializeLearningProfile({
    filePath,
    dryRun: false,
    now: new Date("2026-05-22T00:01:00.000Z"),
  });
  assert.equal(duplicate.addedCount, 0);
  assert.equal(duplicate.skippedCount, 6);
  assert.equal(duplicate.count, 6);
  assert.equal(duplicate.skipped[0].reason, "duplicate-entry-text");
  assert.equal(loadLearningProfile(filePath).entries.length, 6);
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

test("runLearn list and export filter learned entries by query without fallback", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:02.000Z",
    entries: [
      {
        id: "learn-brand",
        category: "brand",
        text: "Use quiet enterprise brand language",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-a11y",
        category: "accessibility",
        text: "Prioritize keyboard accessibility in Button specs",
        source: "cli",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-korean",
        category: "korean",
        text: "Prefer dense Korean mobile layouts",
        source: "cli",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const listOutput = await captureStdout(() => runLearn([
    "--list",
    "--query",
    "keyboard accessibility",
    "--explain",
    "--file",
    filePath,
  ]));

  assert.match(listOutput, /Query: keyboard accessibility/);
  assert.match(listOutput, /Explain: selection score, matched tokens, and reason/);
  assert.match(listOutput, /\[accessibility\] Prioritize keyboard accessibility/);
  assert.match(listOutput, /score \d+ .* matched keyboard, accessibility .* reason brief-match/);
  assert.doesNotMatch(listOutput, /dense Korean mobile/);
  assert.doesNotMatch(listOutput, /quiet enterprise brand/);

  const listJsonOutput = await captureStdout(() => runLearn([
    "--list",
    "--query",
    "keyboard accessibility",
    "--explain",
    "--file",
    filePath,
    "--json",
  ]));
  const listPayload = JSON.parse(listJsonOutput);
  assert.equal(listPayload.query, "keyboard accessibility");
  assert.equal(listPayload.count, 1);
  assert.equal(listPayload.totalCount, 3);
  assert.deepEqual(listPayload.entries.map((entry) => entry.id), ["learn-a11y"]);
  assert.equal(listPayload.selection.mode, "brief-relevance");
  assert.equal(listPayload.selection.fallbackEnabled, false);
  assert.equal(listPayload.selection.selectedCount, 1);
  assert.equal(listPayload.selection.selected[0].id, "learn-a11y");
  assert.equal(listPayload.selection.selected[0].reason, "brief-match");
  assert.ok(listPayload.selection.selected[0].score > 0);
  assert.deepEqual(listPayload.selection.selected[0].matchedTokens, ["keyboard", "accessibility"]);

  const exportJsonOutput = await captureStdout(() => runLearn([
    "--export",
    "--query",
    "keyboard accessibility",
    "--file",
    filePath,
    "--json",
  ]));
  const exportPayload = JSON.parse(exportJsonOutput);
  assert.equal(exportPayload.query, "keyboard accessibility");
  assert.equal(exportPayload.selection.mode, "brief-relevance");
  assert.equal(exportPayload.selection.fallbackEnabled, false);
  assert.equal(exportPayload.selection.fallbackCount, 0);
  assert.equal(exportPayload.selection.selectedCount, 1);
  assert.deepEqual(exportPayload.entries.map((entry) => entry.id), ["learn-a11y"]);
  assert.match(exportPayload.markdown, /no recency fallback/);

  const emptyExport = await captureStdout(() => runLearn([
    "--export",
    "--query",
    "pricing page",
    "--file",
    filePath,
  ]));
  assert.match(emptyExport, /No local learning preferences match the current filters/);
}));

test("selectLearningEntries filters by category and limit", () => {
  const profile = {
    version: 1,
    entries: [
      {
        id: "learn-a",
        category: "korean",
        text: "Prefer Korean density",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-b",
        category: "brand",
        text: "Use quiet brand voice",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-c",
        category: "korean",
        text: "Use Korean mobile conventions",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
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
  assert.deepEqual(
    selectLearningEntries(profile, { limit: 1, query: "Korean mobile checkout UX" }).map((entry) => entry.id),
    ["learn-c"],
  );
  assert.deepEqual(
    selectLearningEntries(profile, { limit: 1, query: "enterprise brand voice" }).map((entry) => entry.id),
    ["learn-b"],
  );
  assert.deepEqual(
    selectLearningEntries(profile, {
      limit: 2,
      query: "enterprise brand voice",
      includeFallback: false,
    }).map((entry) => entry.id),
    ["learn-b"],
  );
  assert.deepEqual(
    selectLearningEntries(profile, {
      query: "pricing page",
      includeFallback: false,
    }).map((entry) => entry.id),
    [],
  );

  const explained = selectLearningEntrySet(profile, {
    query: "enterprise brand voice",
    includeFallback: false,
  });
  assert.deepEqual(explained.entries.map((entry) => entry.id), ["learn-b"]);
  assert.equal(explained.selection.selected[0].reason, "brief-match");
  assert.deepEqual(explained.selection.selected[0].matchedTokens, ["brand", "voice"]);
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

test("buildLearningContext ranks learned entries by brief relevance with recency fallback", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:02.000Z",
    entries: [
      {
        id: "learn-brand",
        category: "brand",
        text: "Use quiet enterprise brand language",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-korean",
        category: "korean",
        text: "Prefer dense Korean checkout and payment layouts",
        source: "cli",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-motion",
        category: "workflow",
        text: "Keep motion specs short",
        source: "cli",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const context = buildLearningContext({
    filePath,
    limit: 2,
    query: "Audit Korean checkout UX",
  });

  assert.equal(context.selection.mode, "brief-relevance");
  assert.equal(context.selection.candidateCount, 3);
  assert.equal(context.selection.matchedCount, 1);
  assert.equal(context.selection.queryTokenCount, 4);
  assert.equal(context.selection.selectedCount, 2);
  assert.equal(context.selection.fallbackCount, 1);
  assert.deepEqual(
    context.selection.selected.map((entry) => ({
      id: entry.id,
      score: entry.score,
      matchedTokens: entry.matchedTokens,
      reason: entry.reason,
    })),
    [
      {
        id: "learn-korean",
        score: 4,
        matchedTokens: ["korean", "checkout"],
        reason: "brief-match",
      },
      {
        id: "learn-motion",
        score: 0,
        matchedTokens: [],
        reason: "recency-fallback",
      },
    ],
  );
  assert.deepEqual(context.entries.map((entry) => entry.id), ["learn-korean", "learn-motion"]);
  assert.match(context.markdown, /Learning selection: brief relevance \(1\/3 matched/);
  assert.match(context.markdown, /\[korean\] Prefer dense Korean checkout and payment layouts/);
}));

test("buildLearningContext reports empty profiles without creating files", () => withTempDir((dir) => {
  const filePath = path.join(dir, "missing.json");
  const context = buildLearningContext({ filePath });

  assert.equal(context.empty, true);
  assert.deepEqual(context.entries, []);
  assert.deepEqual(context.selection.selected, []);
  assert.equal(context.selection.selectedCount, 0);
  assert.equal(context.selection.fallbackCount, 0);
  assert.deepEqual(context.auditSummary, {
    status: "pass",
    failures: 0,
    warnings: 0,
  });
  assert.match(context.markdown, /No local learning preferences are stored yet/);
}));

test("recordLearningUsage writes a privacy-preserving sidecar event", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:01.000Z",
    entries: [
      {
        id: "learn-relevant",
        category: "accessibility",
        text: "Prioritize keyboard accessibility details for Button component API specs",
        source: "test",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");

  const learningContext = buildLearningContext({
    filePath,
    limit: 1,
    query: "Spec a Button component API with keyboard accessibility",
  });
  const event = buildLearningUsageEvent({
    command: "prompt",
    routeId: "component-spec",
    learningContext,
    now: new Date("2026-06-01T00:00:00.000Z"),
  });

  assert.equal(event.command, "prompt");
  assert.equal(event.routeId, "component-spec");
  assert.equal(event.briefHash.length, 16);
  assert.deepEqual(event.selectedEntryIds, ["learn-relevant"]);
  assert.equal(event.selectedCount, 1);
  assert.equal(event.matchedCount, 1);
  assert.equal(event.auditStatus, "pass");
  assert.ok(!Object.hasOwn(event, "query"));

  const result = recordLearningUsage({
    command: "prompt",
    routeId: "component-spec",
    learningContext,
    usageFile,
    now: new Date("2026-06-01T00:00:00.000Z"),
  });

  assert.equal(result.recorded, true);
  assert.equal(result.file, usageFile);
  assert.equal(result.event.id, event.id);

  const log = loadLearningUsageLog(usageFile, { profileFile: filePath });
  assert.equal(log.version, 1);
  assert.equal(log.profileFile, filePath);
  assert.equal(log.events.length, 1);
  assert.deepEqual(log.events[0].selectedEntryIds, ["learn-relevant"]);

  const raw = readFileSync(usageFile, "utf8");
  assert.ok(!raw.includes("Spec a Button component API with keyboard accessibility"));
}));

test("learningUsageStats summarizes sidecar events without raw brief text", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:03.000Z",
    entries: [
      {
        id: "learn-relevant",
        category: "accessibility",
        text: "Prioritize keyboard accessibility details for Button component API specs",
        source: "test",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-unused",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "test",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const learningContext = buildLearningContext({
    filePath,
    limit: 1,
    query: "Spec a Button component API with keyboard accessibility",
  });
  recordLearningUsage({
    command: "prompt",
    routeId: "component-spec",
    learningContext,
    usageFile,
    now: new Date("2026-06-01T00:00:00.000Z"),
  });
  recordLearningUsage({
    command: "pack",
    routeId: "component-spec",
    learningContext,
    usageFile,
    now: new Date("2026-06-01T00:01:00.000Z"),
  });

  const payload = learningUsageStats({ filePath, usageFile, limit: 1 });
  assert.equal(payload.exists, true);
  assert.equal(payload.eventCount, 2);
  assert.equal(payload.profileEntryCount, 2);
  assert.equal(payload.usedEntryCount, 1);
  assert.equal(payload.unusedEntryCount, 1);
  assert.deepEqual(payload.commandCounts, { prompt: 1, pack: 1 });
  assert.deepEqual(payload.routeCounts, { "component-spec": 2 });
  assert.deepEqual(payload.selectedEntryCounts, { "learn-relevant": 2 });
  assert.deepEqual(payload.unusedEntryIds, ["learn-unused"]);
  assert.equal(payload.topSelectedEntries[0].id, "learn-relevant");
  assert.equal(payload.topSelectedEntries[0].usageCount, 2);
  assert.equal(payload.recentEvents.length, 1);
  assert.equal(payload.recentEvents[0].command, "pack");
  assert.equal(payload.privacy.storesRawBriefText, false);

  const raw = JSON.stringify(payload);
  assert.ok(!raw.includes("Spec a Button component API with keyboard accessibility"));
}));

test("runLearn --usage reports sidecar summaries in JSON and human output", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:01.000Z",
    entries: [
      {
        id: "learn-relevant",
        category: "accessibility",
        text: "Prioritize keyboard accessibility details for Button component API specs",
        source: "test",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");
  const learningContext = buildLearningContext({
    filePath,
    limit: 1,
    query: "Spec a Button component API with keyboard accessibility",
  });
  recordLearningUsage({
    command: "prompt",
    routeId: "component-spec",
    learningContext,
    usageFile,
    now: new Date("2026-06-01T00:00:00.000Z"),
  });

  const jsonOutput = await captureStdout(() => runLearn([
    "--usage",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--json",
  ]));
  const payload = JSON.parse(jsonOutput);
  assert.equal(payload.usageFile, usageFile);
  assert.equal(payload.eventCount, 1);
  assert.equal(payload.latestEvent.command, "prompt");

  const humanOutput = await captureStdout(() => runLearn([
    "--usage",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
  ]));
  assert.match(humanOutput, /Local learning usage report/);
  assert.match(humanOutput, /Usage sidecar:/);
  assert.match(humanOutput, /Events: 1/);
  assert.match(humanOutput, /Top selected entries:/);
  assert.match(humanOutput, /Privacy: usage events store selected entry ids and a short brief hash/);
}));

test("learningSignalRegistry joins audit, usage, eval, check capture, and workspace signals", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  const routeEvalFile = path.join(dir, "route-eval-report.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:01.000Z",
    entries: [
      {
        id: "learn-check",
        category: "accessibility",
        text: "Improve future outputs by addressing Keyboard and focus behavior: No keyboard or focus behavior note detected.",
        source: "check:component-spec",
        createdAt: "2026-06-02T00:00:01.000Z",
      },
      {
        id: "learn-brand",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "feedback:keep",
        createdAt: "2026-06-02T00:00:00.000Z",
      },
    ],
  }), "utf8");
  const learningContext = buildLearningContext({
    filePath,
    limit: 1,
    query: "Spec a Button component API with keyboard accessibility",
  });
  recordLearningUsage({
    command: "prompt",
    routeId: "component-spec",
    learningContext,
    usageFile,
    now: new Date("2026-06-02T00:00:02.000Z"),
  });
  writeFileSync(routeEvalFile, JSON.stringify({
    evalVersion: 1,
    generatedAt: "2026-06-02T00:00:03.000Z",
    status: "pass",
    summary: {
      total: 1,
      pass: 1,
      warn: 0,
      fail: 0,
    },
    cases: [
      {
        id: "component-spec-contract",
        status: "pass",
        expectedRouteId: "component-spec",
        topRouteId: "component-spec",
        issues: [],
      },
    ],
  }), "utf8");

  const signal = summarizeSignalEvalFile(routeEvalFile);
  assert.equal(signal.kind, "route-eval");
  assert.equal(signal.shape, "report");
  assert.equal(signal.status, "pass");

  const payload = learningSignalRegistry({
    filePath,
    usageFile,
    signalSource: dir,
    root: dir,
    now: new Date("2026-06-02T00:00:04.000Z"),
    workspaceReportProvider: () => ({
      context: {
        root: dir,
        version: "4.55.0",
      },
      git: {
        isRepo: true,
        branch: "main",
        clean: true,
        ahead: 0,
        behind: 0,
      },
      repository: {
        status: "pass",
        canonical: true,
      },
      learning: {
        readiness: {
          status: "pass",
          reason: "",
        },
        auditSummary: {
          status: "pass",
        },
      },
      learningUsage: {
        readiness: {
          status: "pass",
        },
      },
      learningEval: {
        freshness: {
          status: "pass",
        },
      },
      nextActions: [
        {
          level: "pass",
          text: "Learning usage sidecar is aligned with the active profile.",
        },
      ],
    }),
  });

  assert.equal(payload.status, "pass");
  assert.equal(payload.learning.count, 2);
  assert.equal(payload.usage.eventCount, 1);
  assert.equal(payload.evals.count, 1);
  assert.equal(payload.evals.files[0].kind, "route-eval");
  assert.equal(payload.checkCapture.count, 1);
  assert.equal(payload.checkCapture.latestEntries[0].id, "learn-check");
  assert.equal(payload.workspace.git.branch, "main");
  assert.equal(payload.privacy.mutatesProfile, false);
}));

test("agentBacklogReport extracts a focused local agent development backlog", () => {
  const now = new Date("2026-06-02T00:00:00.000Z");
  const profilePath = "/tmp/design-ai-learning.json";
  const usagePath = "/tmp/design-ai-learning.usage.json";
  const signalSource = "/tmp/design-ai-signals";
  const payload = agentBacklogReport({
    filePath: profilePath,
    usageFile: usagePath,
    signalSource,
    root: "/tmp",
    now,
    signalRegistryProvider: () => ({
      version: 1,
      generatedAt: now.toISOString(),
      status: "pass",
      file: profilePath,
      signalSource,
      learning: { count: 2 },
      usage: { usageFile: usagePath, eventCount: 1 },
      evals: { count: 1 },
      checkCapture: { count: 2 },
      workspace: { nextActionCount: 0 },
      agentDevelopment: {
        status: "pass",
        actionCount: 1,
        p0Count: 0,
        p1Count: 0,
        p2Count: 1,
        p3Count: 0,
        actions: [
          {
            rank: 1,
            id: "agent-skill-proposal-preview",
            priority: "p2",
            category: "skill-evolution",
            title: "Preview skill instruction deltas from repeated check-capture signals.",
            rationale: "Captured warn/fail check results can become deterministic skill improvements without mutating skill files automatically.",
            command: "design-ai learn --propose-skills --json",
            commandArgs: ["design-ai", "learn", "--propose-skills", "--json"],
            evidence: { checkCaptureCount: 2 },
          },
        ],
      },
      recommendations: [
        {
          level: "info",
          text: "Keep local agent development evidence deterministic.",
        },
      ],
    }),
  });

  assert.equal(payload.version, 1);
  assert.equal(payload.status, "pass");
  assert.equal(payload.signalStatus, "pass");
  assert.equal(payload.file, profilePath);
  assert.equal(payload.usageFile, usagePath);
  assert.equal(payload.signalSource, signalSource);
  assert.equal(payload.counts.actions, 1);
  assert.equal(payload.counts.p2, 1);
  assert.equal(payload.counts.learningEntries, 2);
  assert.equal(payload.counts.usageEvents, 1);
  assert.equal(payload.counts.evalSignals, 1);
  assert.equal(payload.counts.checkCaptures, 2);
  assert.equal(payload.actions[0].id, "agent-skill-proposal-preview");
  assert.equal(payload.actionPlan.version, 1);
  assert.equal(payload.actionPlan.stepCount, 1);
  assert.equal(payload.actionPlan.nextStep.actionId, "agent-skill-proposal-preview");
  assert.equal(payload.actionPlan.safetySummary.total, 1);
  assert.equal(payload.actionPlan.safetySummary.readOnly, 1);
  assert.equal(payload.actionPlan.safetySummary.writesLocalFile, 0);
  assert.equal(payload.actionPlan.safetySummary.mutatesLocalState, 0);
  assert.equal(payload.actionPlan.safetySummary.requiresReviewBeforeMutation, 0);
  assert.equal(payload.actionPlan.executionQueue.previewCount, 1);
  assert.equal(payload.actionPlan.executionQueue.fileWriteReviewCount, 0);
  assert.equal(payload.actionPlan.executionQueue.mutationReviewCount, 0);
  assert.equal(payload.actionPlan.executionQueue.orderedCount, 1);
  assert.equal(payload.actionPlan.executionQueue.commandManifestCount, 1);
  assert.equal(payload.actionPlan.executionQueue.nextActionId, "agent-skill-proposal-preview");
  assert.match(payload.actionPlan.executionQueue.nextCommand, /design-ai learn --propose-skills --json/);
  assert.equal(payload.actionPlan.executionQueue.nextCommandRunPolicy, "preview-only");
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.totalCommands, 1);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.outputTargetCount, 0);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.profileTargetCount, 0);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.usageTargetCount, 0);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.mutationFlagCount, 0);
  assert.equal(payload.actionPlan.executionQueue.commandEffectReview.level, "clear");
  assert.equal(payload.actionPlan.executionQueue.commandEffectReview.requiresOperatorReview, false);
  assert.match(payload.actionPlan.executionQueue.commandEffectReview.headline, /No command target/);
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectReview.gatePhaseSummary, {
    count: 1,
    requiredCount: 1,
    optionalCount: 0,
    phases: ["refresh"],
    hasBefore: false,
    hasAfter: false,
    hasRefresh: true,
  });
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectReview.gateRunbook, {
    before: [],
    after: [],
    refresh: [
      {
        phase: "refresh",
        label: "Refresh focused agent backlog after review",
        command: "design-ai learn --agent-backlog --strict --json",
        commandArgs: ["design-ai", "learn", "--agent-backlog", "--strict", "--json"],
        required: true,
      },
    ],
    other: [],
  });
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectReview.gateCommands, [
    {
      phase: "refresh",
      label: "Refresh focused agent backlog after review",
      command: "design-ai learn --agent-backlog --strict --json",
      commandArgs: ["design-ai", "learn", "--agent-backlog", "--strict", "--json"],
      required: true,
    },
  ]);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.version, 1);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.stageCount, 4);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.commandCount, 2);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.requiredCommandCount, 2);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.reviewLevel, "clear");
  assert.deepEqual(payload.actionPlan.executionQueue.operatorRunbook.phases, ["before", "execute", "after", "refresh"]);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextStage, "execute");
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommandLabel, "Run agent-skill-proposal-preview");
  assert.match(payload.actionPlan.executionQueue.operatorRunbook.nextCommand, /learn --propose-skills --json/);
  assert.deepEqual(payload.actionPlan.executionQueue.operatorRunbook.nextCommandArgs, ["design-ai", "learn", "--propose-skills", "--json"]);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommandRequired, true);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommandRunPolicy, "preview-only");
  assert.deepEqual(
    payload.actionPlan.executionQueue.operatorRunbook.stages.map((stage) => [stage.phase, stage.commandCount, stage.requiredCount]),
    [
      ["before", 0, 0],
      ["execute", 1, 1],
      ["after", 0, 0],
      ["refresh", 1, 1],
    ],
  );
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.stages[1].commands[0].actionId, "agent-skill-proposal-preview");
  assert.deepEqual(payload.actionPlan.executionQueue.operatorRunbook.stages[1].commands[0].commandArgs, ["design-ai", "learn", "--propose-skills", "--json"]);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.stages[1].commands[0].runPolicy, "preview-only");
  assert.match(payload.actionPlan.executionQueue.operatorRunbook.stages[3].commands[0].command, /learn --agent-backlog --strict --json/);
  assert.equal(payload.actionPlan.executionQueue.ordered[0].actionId, "agent-skill-proposal-preview");
  assert.equal(payload.actionPlan.executionQueue.ordered[0].runPolicy, "preview-only");
  assert.equal(payload.actionPlan.executionQueue.commandManifest[0].actionId, "agent-skill-proposal-preview");
  assert.deepEqual(payload.actionPlan.executionQueue.commandManifest[0].commandArgs, ["design-ai", "learn", "--propose-skills", "--json"]);
  assert.equal(payload.actionPlan.executionQueue.commandManifest[0].runPolicy, "preview-only");
  assert.deepEqual(payload.actionPlan.executionQueue.commandManifest[0].commandEffects.outputTargets, []);
  assert.deepEqual(payload.actionPlan.executionQueue.commandManifest[0].commandEffects.mutationFlags, []);
  assert.equal(payload.actionPlan.executionQueue.preview[0].actionId, "agent-skill-proposal-preview");
  assert.equal(payload.actionPlan.steps[0].requiresReviewBeforeMutation, false);
  assert.equal(payload.actionPlan.steps[0].commandSafety.level, "read-only");
  assert.equal(payload.actionPlan.steps[0].commandSafety.writesLocalFiles, false);
  assert.equal(payload.actionPlan.steps[0].commandSafety.mutatesLocalState, false);
  assert.match(payload.actionPlan.steps[0].verification.join("\n"), /agent-backlog --strict --json/);
  assert.match(payload.actionPlan.verification[0].command, /design-ai learn --signals/);
  assert.equal(payload.actionPlan.boundaries.reportCallsExternalAiApis, false);
  assert.match(payload.commands.signalsJson, /design-ai learn --signals/);
  assert.equal(payload.privacy.mutatesProfile, false);
  assert.equal(payload.privacy.mutatesSkillFiles, false);
  assert.equal(payload.privacy.callsExternalAiApis, false);

  const markdown = renderAgentBacklogReport(payload, { generatedAt: now });
  assert.match(markdown, /# Agent Development Backlog Report/);
  assert.match(markdown, /## Backlog Actions/);
  assert.match(markdown, /design-ai learn --propose-skills --json/);
  assert.match(markdown, /## Action Plan/);
  assert.match(markdown, /Safety summary:/);
  assert.match(markdown, /Read-only: 1/);
  assert.match(markdown, /Writes local file: 0/);
  assert.match(markdown, /Mutates local state: 0/);
  assert.match(markdown, /Execution queue:/);
  assert.match(markdown, /Preview\/read-only commands: 1/);
  assert.match(markdown, /Local file-write review commands: 0/);
  assert.match(markdown, /Ordered commands: 1/);
  assert.match(markdown, /Command manifest entries: 1/);
  assert.match(markdown, /Command effect targets: output 0, profile 0, usage 0, mutation flags 0/);
  assert.match(markdown, /Command effect review: No command target or mutation flag exposure detected/);
  assert.match(markdown, /Command effect gate phases: refresh \(1\/1 required\)/);
  assert.match(markdown, /Command effect gate runbook: before 0, after 0, refresh 1/);
  assert.match(markdown, /Command effect gates:/);
  assert.match(markdown, /refresh: Refresh focused agent backlog after review/);
  assert.match(markdown, /design-ai learn --agent-backlog --strict --json/);
  assert.match(markdown, /Operator runbook: 4 stage\(s\), 2 command\(s\), 2 required/);
  assert.match(markdown, /Operator next command: execute: `design-ai learn --propose-skills --json`/);
  assert.match(markdown, /Recommended next action: agent-skill-proposal-preview/);
  assert.match(markdown, /Recommended next command policy: preview-only/);
  assert.match(markdown, /Recommended next command:/);
  assert.match(markdown, /Queue order:/);
  assert.match(markdown, /1\. agent-skill-proposal-preview \(read-only, preview-only\)/);
  assert.match(markdown, /Command manifest:/);
  assert.match(markdown, /1\. agent-skill-proposal-preview - preview-only \(read-only\)/);
  assert.match(markdown, /Command safety: read-only/);
  assert.match(markdown, /Writes local files: no/);
  assert.match(markdown, /Mutates local state: no/);
  assert.match(markdown, /Requires mutation review: no/);
  assert.match(markdown, /agent-backlog --strict --json/);
  assert.match(markdown, /## Follow-Up Commands/);
  assert.match(markdown, /design-ai learn --signals/);
  assert.match(markdown, /This report is read-only evidence/);
});

test("agentBacklogReport classifies action plan command safety", () => {
  const now = new Date("2026-06-02T00:00:00.000Z");
  const payload = agentBacklogReport({
    filePath: "/tmp/design-ai-learning.json",
    usageFile: "/tmp/design-ai-learning.usage.json",
    signalSource: "/tmp/design-ai-signals",
    root: "/tmp",
    now,
    signalRegistryProvider: () => ({
      version: 1,
      generatedAt: now.toISOString(),
      status: "warn",
      file: "/tmp/design-ai-learning.json",
      signalSource: "/tmp/design-ai-signals",
      learning: { count: 1 },
      usage: { usageFile: "/tmp/design-ai-learning.usage.json", eventCount: 0 },
      evals: { count: 0 },
      checkCapture: { count: 0 },
      workspace: { nextActionCount: 0 },
      agentDevelopment: {
        status: "warn",
        actionCount: 3,
        p0Count: 0,
        p1Count: 2,
        p2Count: 1,
        p3Count: 0,
        actions: [
          {
            rank: 1,
            id: "agent-eval-checkpoint-generate",
            priority: "p1",
            category: "eval-harness",
            title: "Generate eval checkpoint.",
            rationale: "Write a replayable checkpoint file.",
            command: "design-ai learn --eval-template --json --out learning-eval.json",
            commandArgs: ["design-ai", "learn", "--eval-template", "--json", "--out", "learning-eval.json"],
            evidence: {},
          },
          {
            rank: 2,
            id: "agent-learning-profile-init",
            priority: "p1",
            category: "learning-profile",
            title: "Initialize profile.",
            rationale: "Preview local profile seed entries.",
            command: "design-ai learn --init --file /tmp/design-ai-learning.json",
            commandArgs: ["design-ai", "learn", "--init", "--file", "/tmp/design-ai-learning.json"],
            evidence: {},
          },
          {
            rank: 3,
            id: "agent-check-capture-seed",
            priority: "p2",
            category: "skill-evolution",
            title: "Capture check feedback.",
            rationale: "Apply local check captures.",
            command: "design-ai check artifact.md --learn --yes",
            commandArgs: ["design-ai", "check", "artifact.md", "--learn", "--yes"],
            evidence: {},
          },
        ],
      },
      recommendations: [],
    }),
  });

  const stepsById = new Map(payload.actionPlan.steps.map((step) => [step.actionId, step]));
  assert.equal(payload.actionPlan.safetySummary.total, 3);
  assert.equal(payload.actionPlan.safetySummary.readOnly, 1);
  assert.equal(payload.actionPlan.safetySummary.writesLocalFile, 1);
  assert.equal(payload.actionPlan.safetySummary.mutatesLocalState, 1);
  assert.equal(payload.actionPlan.safetySummary.requiresCleanWorkspace, 2);
  assert.equal(payload.actionPlan.safetySummary.requiresReviewBeforeMutation, 2);
  assert.equal(payload.actionPlan.executionQueue.previewCount, 1);
  assert.equal(payload.actionPlan.executionQueue.fileWriteReviewCount, 1);
  assert.equal(payload.actionPlan.executionQueue.mutationReviewCount, 1);
  assert.equal(payload.actionPlan.executionQueue.orderedCount, 3);
  assert.equal(payload.actionPlan.executionQueue.commandManifestCount, 3);
  assert.equal(payload.actionPlan.executionQueue.nextActionId, "agent-learning-profile-init");
  assert.equal(payload.actionPlan.executionQueue.nextCommandRunPolicy, "preview-only");
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.totalCommands, 3);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.outputTargetCount, 1);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.profileTargetCount, 1);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.usageTargetCount, 0);
  assert.equal(payload.actionPlan.executionQueue.commandEffectSummary.mutationFlagCount, 1);
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectSummary.outputTargets, [{ flag: "--out", value: "learning-eval.json" }]);
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectSummary.profileTargets, [{ flag: "--file", value: "/tmp/design-ai-learning.json" }]);
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectSummary.mutationFlags, ["--yes"]);
  assert.equal(payload.actionPlan.executionQueue.commandEffectReview.level, "mutation-review");
  assert.equal(payload.actionPlan.executionQueue.commandEffectReview.requiresOperatorReview, true);
  assert.match(payload.actionPlan.executionQueue.commandEffectReview.headline, /Mutation-capable commands/);
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectReview.checklist, [
    "Review mutation flags and run in a clean workspace before applying.",
    "Inspect explicit output targets before committing generated files.",
    "Confirm learning profile and usage sidecar targets are intentional.",
  ]);
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectReview.gatePhaseSummary, {
    count: 3,
    requiredCount: 3,
    optionalCount: 0,
    phases: ["before", "after", "refresh"],
    hasBefore: true,
    hasAfter: true,
    hasRefresh: true,
  });
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectReview.gateRunbook, {
    before: [
      {
        phase: "before",
        label: "Confirm clean workspace before execution",
        command: "git status --short",
        commandArgs: ["git", "status", "--short"],
        required: true,
      },
    ],
    after: [
      {
        phase: "after",
        label: "Inspect local file changes after execution",
        command: "git diff --stat",
        commandArgs: ["git", "diff", "--stat"],
        required: true,
      },
    ],
    refresh: [
      {
        phase: "refresh",
        label: "Refresh focused agent backlog after review",
        command: "design-ai learn --agent-backlog --strict --json",
        commandArgs: ["design-ai", "learn", "--agent-backlog", "--strict", "--json"],
        required: true,
      },
    ],
    other: [],
  });
  assert.deepEqual(payload.actionPlan.executionQueue.commandEffectReview.gateCommands, [
    {
      phase: "before",
      label: "Confirm clean workspace before execution",
      command: "git status --short",
      commandArgs: ["git", "status", "--short"],
      required: true,
    },
    {
      phase: "after",
      label: "Inspect local file changes after execution",
      command: "git diff --stat",
      commandArgs: ["git", "diff", "--stat"],
      required: true,
    },
    {
      phase: "refresh",
      label: "Refresh focused agent backlog after review",
      command: "design-ai learn --agent-backlog --strict --json",
      commandArgs: ["design-ai", "learn", "--agent-backlog", "--strict", "--json"],
      required: true,
    },
  ]);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.version, 1);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.stageCount, 4);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.commandCount, 6);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.requiredCommandCount, 6);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.reviewLevel, "mutation-review");
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.requiresOperatorReview, true);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextStage, "before");
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommandLabel, "Confirm clean workspace before execution");
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommand, "git status --short");
  assert.deepEqual(payload.actionPlan.executionQueue.operatorRunbook.nextCommandArgs, ["git", "status", "--short"]);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommandRequired, true);
  assert.equal(payload.actionPlan.executionQueue.operatorRunbook.nextCommandRunPolicy, "");
  assert.deepEqual(
    payload.actionPlan.executionQueue.operatorRunbook.stages.map((stage) => [stage.phase, stage.commandCount, stage.requiredCount]),
    [
      ["before", 1, 1],
      ["execute", 3, 3],
      ["after", 1, 1],
      ["refresh", 1, 1],
    ],
  );
  assert.deepEqual(
    payload.actionPlan.executionQueue.operatorRunbook.stages[1].commands.map((item) => item.actionId),
    [
      "agent-learning-profile-init",
      "agent-eval-checkpoint-generate",
      "agent-check-capture-seed",
    ],
  );
  assert.deepEqual(
    payload.actionPlan.executionQueue.operatorRunbook.stages[1].commands.map((item) => item.runPolicy),
    [
      "preview-only",
      "review-before-file-write",
      "review-before-mutation",
    ],
  );
  assert.deepEqual(payload.actionPlan.executionQueue.ordered.map((item) => item.actionId), [
    "agent-learning-profile-init",
    "agent-eval-checkpoint-generate",
    "agent-check-capture-seed",
  ]);
  assert.deepEqual(payload.actionPlan.executionQueue.commandManifest.map((item) => item.runPolicy), [
    "preview-only",
    "review-before-file-write",
    "review-before-mutation",
  ]);
  assert.deepEqual(
    payload.actionPlan.executionQueue.commandManifest[1].commandEffects.outputTargets,
    [{ flag: "--out", value: "learning-eval.json" }],
  );
  assert.deepEqual(
    payload.actionPlan.executionQueue.commandManifest[0].commandEffects.profileTargets,
    [{ flag: "--file", value: "/tmp/design-ai-learning.json" }],
  );
  assert.deepEqual(payload.actionPlan.executionQueue.commandManifest[2].commandEffects.mutationFlags, ["--yes"]);
  assert.equal(payload.actionPlan.executionQueue.preview[0].actionId, "agent-learning-profile-init");
  assert.equal(payload.actionPlan.executionQueue.fileWriteReview[0].actionId, "agent-eval-checkpoint-generate");
  assert.equal(payload.actionPlan.executionQueue.mutationReview[0].actionId, "agent-check-capture-seed");
  assert.match(payload.actionPlan.executionQueue.nextCommand, /design-ai learn --init/);
  assert.equal(stepsById.get("agent-eval-checkpoint-generate").commandSafety.level, "writes-local-file");
  assert.equal(stepsById.get("agent-eval-checkpoint-generate").commandSafety.writesLocalFiles, true);
  assert.equal(stepsById.get("agent-eval-checkpoint-generate").commandSafety.mutatesLocalState, false);
  assert.deepEqual(stepsById.get("agent-eval-checkpoint-generate").commandSafety.outputTargets, [{ flag: "--out", value: "learning-eval.json" }]);
  assert.equal(stepsById.get("agent-eval-checkpoint-generate").requiresReviewBeforeMutation, true);
  assert.match(stepsById.get("agent-eval-checkpoint-generate").verification[0], /clean working tree/);
  assert.equal(stepsById.get("agent-learning-profile-init").commandSafety.level, "read-only");
  assert.deepEqual(stepsById.get("agent-learning-profile-init").commandSafety.profileTargets, [{ flag: "--file", value: "/tmp/design-ai-learning.json" }]);
  assert.equal(stepsById.get("agent-learning-profile-init").requiresReviewBeforeMutation, false);
  assert.match(stepsById.get("agent-learning-profile-init").verification[0], /preview\/report output/);
  assert.equal(stepsById.get("agent-check-capture-seed").commandSafety.level, "mutates-local-state");
  assert.equal(stepsById.get("agent-check-capture-seed").commandSafety.mutatesLocalState, true);
  assert.deepEqual(stepsById.get("agent-check-capture-seed").commandSafety.mutationFlags, ["--yes"]);
  assert.equal(stepsById.get("agent-check-capture-seed").requiresReviewBeforeMutation, true);
});

test("agentBacklogReport derives command strings from structured command args", () => {
  const now = new Date("2026-06-02T00:00:00.000Z");
  const payload = agentBacklogReport({
    filePath: "/tmp/design-ai-learning.json",
    usageFile: "/tmp/design-ai-learning.usage.json",
    signalSource: "/tmp/design-ai-signals",
    root: "/tmp",
    now,
    signalRegistryProvider: () => ({
      version: 1,
      generatedAt: now.toISOString(),
      status: "warn",
      file: "/tmp/design-ai-learning.json",
      signalSource: "/tmp/design-ai-signals",
      learning: { count: 1 },
      usage: { usageFile: "/tmp/design-ai-learning.usage.json", eventCount: 0 },
      evals: { count: 0 },
      checkCapture: { count: 0 },
      workspace: { nextActionCount: 0 },
      agentDevelopment: {
        status: "warn",
        actionCount: 1,
        p0Count: 0,
        p1Count: 1,
        p2Count: 0,
        p3Count: 0,
        actions: [
          {
            rank: 1,
            id: "agent-command-args-only",
            priority: "p1",
            category: "eval-harness",
            title: "Run a command from structured args only.",
            rationale: "External providers may emit args without a shell-rendered command.",
            commandArgs: ["design-ai", "learn", "--eval-template", "--json", "--out", "learning eval.json"],
            evidence: {},
          },
        ],
      },
      recommendations: [],
    }),
  });

  assert.equal(payload.actionPlan.steps[0].command, "design-ai learn --eval-template --json --out 'learning eval.json'");
  assert.deepEqual(payload.actionPlan.steps[0].commandArgs, ["design-ai", "learn", "--eval-template", "--json", "--out", "learning eval.json"]);
  assert.equal(payload.actionPlan.executionQueue.commandManifest[0].command, "design-ai learn --eval-template --json --out 'learning eval.json'");
  assert.deepEqual(payload.actionPlan.executionQueue.commandManifest[0].commandArgs, ["design-ai", "learn", "--eval-template", "--json", "--out", "learning eval.json"]);
  assert.deepEqual(payload.actionPlan.executionQueue.operatorRunbook.stages[1].commands[0].commandArgs, ["design-ai", "learn", "--eval-template", "--json", "--out", "learning eval.json"]);
});

test("runLearn --signals reports registry JSON and human output without mutating the profile", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  const routeEvalFile = path.join(dir, "route-eval-report.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:01.000Z",
    entries: [
      {
        id: "learn-check",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No mobile behavior note detected.",
        source: "check:artifact",
        createdAt: "2026-06-02T00:00:01.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:02.000Z",
    profileFile: filePath,
    events: [],
  }), "utf8");
  writeFileSync(routeEvalFile, JSON.stringify({
    evalVersion: 1,
    status: "pass",
    summary: {
      total: 1,
      pass: 1,
      warn: 0,
      fail: 0,
    },
    cases: [
      {
        id: "website-improvement-control-tower",
        status: "pass",
        expectedRouteId: "website-improvement",
        topRouteId: "website-improvement",
        issues: [],
      },
    ],
  }), "utf8");
  const before = readFileSync(filePath, "utf8");

  const jsonOutput = await captureStdout(() => runLearn([
    "--signals",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--json",
  ]));
  const payload = JSON.parse(jsonOutput);
  assert.equal(payload.file, filePath);
  assert.equal(payload.evals.count, 1);
  assert.equal(payload.checkCapture.count, 1);
  assert.equal(payload.agentDevelopment.privacy.callsExternalAiApis, false);
  assert.equal(payload.agentDevelopment.actions.some((item) => item.id === "agent-skill-proposal-preview"), true);
  assert.match(payload.agentDevelopment.actions.find((item) => item.id === "agent-skill-proposal-preview")?.command || "", /learn --propose-skills/);
  assert.equal(payload.privacy.mutatesProfile, false);
  assert.equal(readFileSync(filePath, "utf8"), before);

  const humanOutput = await captureStdout(() => runLearn([
    "--signals",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
  ]));
  assert.match(humanOutput, /Learning signal registry/);
  assert.match(humanOutput, /Eval signals:/);
  assert.match(humanOutput, /Recent check captures:/);
  assert.match(humanOutput, /Agent development backlog:/);
  assert.match(humanOutput, /learn --propose-skills/);
  assert.match(humanOutput, /Privacy: signal registry is read-only/);

  const reportOutput = await captureStdout(() => runLearn([
    "--signals",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--report",
  ]));
  assert.match(reportOutput, /# Learning Signal Registry Report/);
  assert.match(reportOutput, /## Agent Development Backlog/);
  assert.match(reportOutput, /```bash\n.*learn --propose-skills/s);
  assert.match(reportOutput, /This report is read-only evidence/);
  assert.equal(readFileSync(filePath, "utf8"), before);

  const reportFile = path.join(dir, "learning-signals.md");
  const reportWriteOutput = await captureStdout(() => runLearn([
    "--signals",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--report",
    "--out",
    reportFile,
  ]));
  assert.match(reportWriteOutput, /Wrote /);
  assert.match(readFileSync(reportFile, "utf8"), /# Learning Signal Registry Report/);
  assert.equal(readFileSync(filePath, "utf8"), before);
}));

test("runLearn --agent-backlog reports JSON, human, and Markdown without mutating the profile", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  const routeEvalFile = path.join(dir, "route-eval-report.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:01.000Z",
    entries: [
      {
        id: "learn-check",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No mobile behavior note detected.",
        source: "check:artifact",
        createdAt: "2026-06-02T00:00:01.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:02.000Z",
    profileFile: filePath,
    events: [],
  }), "utf8");
  writeFileSync(routeEvalFile, JSON.stringify({
    evalVersion: 1,
    status: "pass",
    summary: {
      total: 1,
      pass: 1,
      warn: 0,
      fail: 0,
    },
    cases: [
      {
        id: "website-improvement-control-tower",
        status: "pass",
        expectedRouteId: "website-improvement",
        topRouteId: "website-improvement",
        issues: [],
      },
    ],
  }), "utf8");
  const before = readFileSync(filePath, "utf8");

  const jsonOutput = await captureStdout(() => runLearn([
    "--agent-backlog",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--json",
  ]));
  const payload = JSON.parse(jsonOutput);
  assert.equal(payload.version, 1);
  assert.equal(payload.file, filePath);
  assert.equal(payload.usageFile, usageFile);
  assert.equal(payload.counts.checkCaptures, 1);
  assert.equal(payload.counts.evalSignals, 1);
  assert.equal(payload.actions.some((item) => item.id === "agent-skill-proposal-preview"), true);
  assert.equal(payload.actionPlan.stepCount, payload.actions.length);
  assert.equal(payload.actionPlan.steps.some((item) => item.actionId === "agent-skill-proposal-preview"), true);
  assert.equal(payload.actionPlan.safetySummary.readOnly, payload.actions.length);
  assert.equal(payload.actionPlan.safetySummary.writesLocalFile, 0);
  assert.equal(payload.actionPlan.safetySummary.mutatesLocalState, 0);
  assert.equal(payload.actionPlan.executionQueue.previewCount, payload.actions.length);
  assert.equal(payload.actionPlan.executionQueue.fileWriteReviewCount, 0);
  assert.equal(payload.actionPlan.executionQueue.mutationReviewCount, 0);
  assert.equal(payload.actionPlan.executionQueue.orderedCount, payload.actions.length);
  assert.equal(payload.actionPlan.executionQueue.commandManifestCount, payload.actions.length);
  assert.equal(payload.actionPlan.executionQueue.nextActionId, payload.actionPlan.executionQueue.ordered[0].actionId);
  assert.equal(payload.actionPlan.executionQueue.nextCommandRunPolicy, "preview-only");
  assert.match(payload.actionPlan.verification.map((item) => item.command).join("\n"), /agent-backlog --strict --json/);
  assert.equal(payload.privacy.mutatesProfile, false);
  assert.equal(payload.privacy.mutatesSkillFiles, false);
  assert.equal(payload.privacy.callsExternalAiApis, false);
  assert.equal(readFileSync(filePath, "utf8"), before);

  const humanOutput = await captureStdout(() => runLearn([
    "--agent-backlog",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
  ]));
  assert.match(humanOutput, /Agent development backlog/);
  assert.match(humanOutput, /Backlog actions:/);
  assert.match(humanOutput, /Action plan:/);
  assert.match(humanOutput, /safety summary: 3 read-only, 0 writes-local-file, 0 mutates-local-state/);
  assert.match(humanOutput, /execution queue: 3 preview, 0 file-write review, 0 mutation review/);
  assert.match(humanOutput, /next action: /);
  assert.match(humanOutput, /next command: /);
  assert.match(humanOutput, /next command policy: preview-only/);
  assert.match(humanOutput, /queue order: /);
  assert.match(humanOutput, /command manifest: /);
  assert.match(humanOutput, /safety: read-only/);
  assert.match(humanOutput, /requires mutation review: no/);
  assert.match(humanOutput, /learn --propose-skills/);
  assert.match(humanOutput, /Privacy: agent backlog is read-only/);
  assert.equal(readFileSync(filePath, "utf8"), before);

  const reportOutput = await captureStdout(() => runLearn([
    "--agent-backlog",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--report",
  ]));
  assert.match(reportOutput, /# Agent Development Backlog Report/);
  assert.match(reportOutput, /## Action Plan/);
  assert.match(reportOutput, /Safety summary:/);
  assert.match(reportOutput, /Read-only: 3/);
  assert.match(reportOutput, /Execution queue:/);
  assert.match(reportOutput, /Preview\/read-only commands: 3/);
  assert.match(reportOutput, /Ordered commands: 3/);
  assert.match(reportOutput, /Command manifest entries: 3/);
  assert.match(reportOutput, /Recommended next action:/);
  assert.match(reportOutput, /Recommended next command policy: preview-only/);
  assert.match(reportOutput, /Recommended next command:/);
  assert.match(reportOutput, /Queue order:/);
  assert.match(reportOutput, /Command manifest:/);
  assert.match(reportOutput, /Command safety: read-only/);
  assert.match(reportOutput, /## Follow-Up Commands/);
  assert.match(reportOutput, /This report is read-only evidence/);
  assert.equal(readFileSync(filePath, "utf8"), before);

  const reportFile = path.join(dir, "agent-backlog.md");
  const reportWriteOutput = await captureStdout(() => runLearn([
    "--agent-backlog",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--report",
    "--out",
    reportFile,
  ]));
  assert.match(reportWriteOutput, /Wrote /);
  assert.match(readFileSync(reportFile, "utf8"), /# Agent Development Backlog Report/);
  assert.match(readFileSync(reportFile, "utf8"), /## Action Plan/);
  assert.match(readFileSync(reportFile, "utf8"), /Safety summary:/);
  assert.match(readFileSync(reportFile, "utf8"), /Execution queue:/);
  assert.match(readFileSync(reportFile, "utf8"), /Command safety: read-only/);
  assert.equal(readFileSync(filePath, "utf8"), before);
}));

test("runLearn --signals --strict exits non-zero when signal registry is not pass", () => withTempDirAsync(async (dir) => {
  const previousExitCode = process.exitCode;
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-10T00:00:01.000Z",
    entries: [
      {
        id: "learn-workflow",
        category: "workflow",
        text: "Prefer deterministic local agent development gates.",
        source: "test",
        createdAt: "2026-06-10T00:00:01.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-10T00:00:02.000Z",
    profileFile: filePath,
    events: [],
  }), "utf8");

  try {
    process.exitCode = undefined;
    const strictOutput = await captureStdout(() => runLearn([
      "--signals",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--strict",
      "--json",
    ]));
    const strictPayload = JSON.parse(strictOutput);
    assert.equal(strictPayload.status, "warn");
    assert.equal(strictPayload.agentDevelopment.status, "warn");
    assert.equal(process.exitCode, 1);

    process.exitCode = 0;
    await captureStdout(() => runLearn([
      "--signals",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--json",
    ]));
    assert.equal(process.exitCode, 0);
  } finally {
    process.exitCode = previousExitCode;
  }
}));

test("runLearn --agent-backlog --strict exits non-zero when backlog warns", () => withTempDirAsync(async (dir) => {
  const previousExitCode = process.exitCode;
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-10T00:00:01.000Z",
    entries: [
      {
        id: "learn-workflow",
        category: "workflow",
        text: "Prefer deterministic local agent development gates.",
        source: "test",
        createdAt: "2026-06-10T00:00:01.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-10T00:00:02.000Z",
    profileFile: filePath,
    events: [],
  }), "utf8");

  try {
    process.exitCode = undefined;
    const strictOutput = await captureStdout(() => runLearn([
      "--agent-backlog",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--strict",
      "--json",
    ]));
    const strictPayload = JSON.parse(strictOutput);
    assert.equal(strictPayload.status, "warn");
    assert.equal(strictPayload.signalStatus, "warn");
    assert.equal(process.exitCode, 1);

    process.exitCode = 0;
    await captureStdout(() => runLearn([
      "--agent-backlog",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--json",
    ]));
    assert.equal(process.exitCode, 0);
  } finally {
    process.exitCode = previousExitCode;
  }
}));

test("buildSkillEvolutionProposals groups repeated check captures into preview-only skill deltas", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:03.000Z",
    entries: [
      {
        id: "learn-check-a",
        category: "accessibility",
        text: "Improve future outputs by addressing Keyboard and focus behavior: No keyboard or focus behavior note detected.",
        source: "check:component-spec",
        createdAt: "2026-06-02T00:00:01.000Z",
      },
      {
        id: "learn-check-b",
        category: "accessibility",
        text: "Improve future outputs by addressing Screen reader behavior: No screen-reader behavior note detected.",
        source: "check:component-spec",
        createdAt: "2026-06-02T00:00:02.000Z",
      },
      {
        id: "learn-check-single",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No mobile behavior note detected.",
        source: "check:artifact",
        createdAt: "2026-06-02T00:00:03.000Z",
      },
    ],
  }), "utf8");

  const payload = buildSkillEvolutionProposals({
    filePath,
    usageFile,
    signalSource: dir,
    root: dir,
    now: new Date("2026-06-02T00:00:04.000Z"),
    signalRegistryProvider: ({ filePath: registryFile, usageFile: registryUsage, signalSource }) => ({
      status: "pass",
      signalSource: path.resolve(signalSource),
      file: registryFile,
      usageFile: registryUsage,
    }),
  });

  assert.equal(payload.dryRun, true);
  assert.equal(payload.applied, false);
  assert.equal(payload.status, "warn");
  assert.equal(payload.checkCaptureCount, 3);
  assert.equal(payload.candidateCount, 2);
  assert.equal(payload.proposalCount, 1);
  assert.equal(payload.skippedCount, 1);
  assert.equal(payload.proposals[0].candidateSkillPath, "skills/component-spec-writer/SKILL.md");
  assert.equal(payload.proposals[0].riskLevel, "low");
  assert.deepEqual(payload.proposals[0].routeIds, ["component-spec"]);
  assert.match(payload.proposals[0].proposedInstructionDelta, /accessibility checkpoint/);
  assert.match(payload.proposals[0].verificationCommand, /--route component-spec/);
  assert.equal(payload.proposals[0].evidenceSources.length, 2);
  assert.equal(payload.privacy.mutatesSkillFiles, false);
}));

test("buildSkillEvolutionProposals honors custom minimum evidence threshold", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:02.000Z",
    entries: [
      {
        id: "learn-check-a",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No mobile behavior note detected.",
        source: "check:website-improvement",
        createdAt: "2026-06-02T00:00:01.000Z",
      },
      {
        id: "learn-check-b",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No tablet behavior note detected.",
        source: "check:website-improvement",
        createdAt: "2026-06-02T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const payload = buildSkillEvolutionProposals({
    filePath,
    usageFile,
    signalSource: dir,
    root: dir,
    minEvidenceCount: 3,
    signalRegistryProvider: ({ signalSource }) => ({
      status: "pass",
      signalSource: path.resolve(signalSource),
    }),
  });

  assert.equal(payload.minEvidenceCount, 3);
  assert.equal(payload.proposalCount, 0);
  assert.equal(payload.skippedCount, 1);
  assert.match(payload.skipped[0].reason, /Needs at least 3/);
  assert.equal(payload.status, "pass");
}));

test("renderSkillEvolutionProposalReport emits reviewer-friendly Markdown without apply semantics", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:02.000Z",
    entries: [
      {
        id: "learn-check-a",
        category: "accessibility",
        text: "Improve future outputs by addressing Keyboard and focus behavior: No keyboard behavior note detected.",
        source: "check:component-spec",
        createdAt: "2026-06-02T00:00:01.000Z",
      },
      {
        id: "learn-check-b",
        category: "accessibility",
        text: "Improve future outputs by addressing Screen reader behavior: No screen-reader behavior note detected.",
        source: "check:component-spec",
        createdAt: "2026-06-02T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const payload = buildSkillEvolutionProposals({
    filePath,
    usageFile,
    signalSource: dir,
    root: dir,
    now: new Date("2026-06-02T00:00:03.000Z"),
    signalRegistryProvider: ({ signalSource }) => ({
      status: "pass",
      signalSource: path.resolve(signalSource),
    }),
  });
  const report = renderSkillEvolutionProposalReport(payload, {
    generatedAt: new Date("2026-06-02T00:00:04.000Z"),
  });

  assert.match(report, /^# Skill Evolution Proposal Report/);
  assert.match(report, /Status: warn/);
  assert.match(report, /Minimum evidence: 2/);
  assert.match(report, /## Proposed Skill Deltas/);
  assert.match(report, /skills\/component-spec-writer\/SKILL\.md/);
  assert.match(report, /```bash\nnode cli\/bin\/design-ai\.mjs check --examples --route component-spec --limit 1 --strict --json\n```/);
  assert.match(report, /Mutates skill files: no/);
  assert.match(report, /This report is preview-only evidence; it does not apply changes\./);
}));

test("runLearn --propose-skills reports JSON and human output without mutating the profile", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:02.000Z",
    entries: [
      {
        id: "learn-check-a",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No mobile behavior note detected.",
        source: "check:website-improvement",
        createdAt: "2026-06-02T00:00:01.000Z",
      },
      {
        id: "learn-check-b",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No tablet behavior note detected.",
        source: "check:website-improvement",
        createdAt: "2026-06-02T00:00:02.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:02.000Z",
    profileFile: filePath,
    events: [],
  }), "utf8");
  const before = readFileSync(filePath, "utf8");
  const candidateSkillPath = path.resolve("skills/website-improvement/SKILL.md");
  const candidateSkillBefore = readFileSync(candidateSkillPath, "utf8");

  const jsonOutput = await captureStdout(() => runLearn([
    "--propose-skills",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--min-evidence",
    "2",
    "--json",
  ]));
  const payload = JSON.parse(jsonOutput);
  assert.equal(payload.file, filePath);
  assert.equal(payload.status, "warn");
  assert.equal(payload.minEvidenceCount, 2);
  assert.equal(payload.proposalCount, 1);
  assert.equal(payload.proposals[0].candidateSkillPath, "skills/website-improvement/SKILL.md");
  assert.equal(payload.privacy.mutatesSkillFiles, false);
  assert.equal(readFileSync(filePath, "utf8"), before);

  const humanOutput = await captureStdout(() => runLearn([
    "--propose-skills",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
  ]));
  assert.match(humanOutput, /Skill evolution proposals/);
  assert.match(humanOutput, /Status: warn/);
  assert.match(humanOutput, /Min evidence: 2/);
  assert.match(humanOutput, /Proposed skill deltas:/);
  assert.match(humanOutput, /skills\/website-improvement\/SKILL\.md/);
  assert.match(humanOutput, /No changes made/);

  const reportPath = path.join(dir, "skill-proposals.md");
  const reportOutput = await captureStdout(() => runLearn([
    "--propose-skills",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--report",
    "--out",
    reportPath,
  ]));
  assert.match(reportOutput, /Wrote /);
  assert.equal(readFileSync(filePath, "utf8"), before);
  const report = readFileSync(reportPath, "utf8");
  assert.match(report, /^# Skill Evolution Proposal Report/);
  assert.match(report, /skills\/website-improvement\/SKILL\.md/);
  assert.match(report, /Mutates learning profile: no/);

  const patchPath = path.join(dir, "skill-proposals.patch");
  const patchOutput = await captureStdout(() => runLearn([
    "--propose-skills",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--patch",
    "--out",
    patchPath,
  ]));
  assert.match(patchOutput, /Wrote /);
  assert.equal(readFileSync(filePath, "utf8"), before);
  assert.equal(readFileSync(candidateSkillPath, "utf8"), candidateSkillBefore);
  const patch = readFileSync(patchPath, "utf8");
  assert.match(patch, /^# design-ai skill proposal patch preview/);
  assert.match(patch, /diff --git a\/skills\/website-improvement\/SKILL\.md b\/skills\/website-improvement\/SKILL\.md/);
  assert.match(patch, /\+## Local Learning Proposal: skill-proposal-website-improvement-/);
  assert.match(patch, /\+- Proposed instruction: Add a responsive QA checkpoint/);
  assert.match(patch, /\+- Verification: `node cli\/bin\/design-ai\.mjs check --examples --route website-improvement --limit 1 --strict --json`/);
}));

test("runLearn --propose-skills --strict exits non-zero when proposal review is pending", () => withTempDirAsync(async (dir) => {
  const previousExitCode = process.exitCode;
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-10T00:00:02.000Z",
    entries: [
      {
        id: "learn-check-a",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No mobile behavior note detected.",
        source: "check:website-improvement",
        createdAt: "2026-06-10T00:00:01.000Z",
      },
      {
        id: "learn-check-b",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No tablet behavior note detected.",
        source: "check:website-improvement",
        createdAt: "2026-06-10T00:00:02.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-10T00:00:02.000Z",
    profileFile: filePath,
    events: [],
  }), "utf8");
  const before = readFileSync(filePath, "utf8");

  try {
    process.exitCode = undefined;
    const strictOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--strict",
      "--json",
    ]));
    const strictPayload = JSON.parse(strictOutput);
    assert.equal(strictPayload.status, "warn");
    assert.equal(strictPayload.proposalCount, 1);
    assert.equal(strictPayload.pendingReviewCount, 1);
    assert.equal(process.exitCode, 1);
    assert.equal(readFileSync(filePath, "utf8"), before);

    process.exitCode = 0;
    const reviewTemplateOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-template",
    ]));
    const reviewTemplatePayload = JSON.parse(reviewTemplateOutput);
    assert.equal(reviewTemplatePayload.version, 1);
    assert.equal(reviewTemplatePayload.source, "design-ai learn --propose-skills --review-template");
    assert.equal(reviewTemplatePayload.summary.templateDecisionCount, 1);
    assert.equal(reviewTemplatePayload.decisions[0].proposalId, strictPayload.proposals[0].id);
    assert.equal(reviewTemplatePayload.decisions[0].status, "deferred");
    assert.equal(readFileSync(filePath, "utf8"), before);

    const reviewFile = path.join(dir, "skill-proposals.review.json");
    writeFileSync(reviewFile, JSON.stringify({
      version: 1,
      decisions: [
        {
          proposalId: strictPayload.proposals[0].id,
          status: "applied",
          reviewedAt: "2026-06-10T00:05:00.000Z",
          reviewer: "local-operator",
          note: "Instruction delta was manually reviewed and applied.",
        },
        {
          proposalId: "skill-proposal-stale",
          status: "rejected",
          reviewedAt: "2026-06-09T00:00:00.000Z",
        },
      ],
    }), "utf8");

    process.exitCode = 0;
    const reviewedStrictOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      reviewFile,
      "--strict",
      "--json",
    ]));
    const reviewedStrictPayload = JSON.parse(reviewedStrictOutput);
    assert.equal(reviewedStrictPayload.status, "warn");
    assert.equal(reviewedStrictPayload.signalStatus, "warn");
    assert.equal(reviewedStrictPayload.pendingReviewCount, 0);
    assert.equal(reviewedStrictPayload.review.appliedCount, 1);
    assert.equal(reviewedStrictPayload.review.staleCount, 1);
    assert.equal(reviewedStrictPayload.proposals[0].reviewStatus, "applied");
    assert.equal(process.exitCode, 1);
    assert.equal(readFileSync(filePath, "utf8"), before);

    const proposalGatePayload = buildSkillEvolutionProposals({
      filePath,
      usageFile,
      signalSource: dir,
      root: dir,
      reviewFile,
      signalRegistryProvider: ({ signalSource }) => ({
        status: "pass",
        signalSource: path.resolve(signalSource),
      }),
    });
    assert.equal(proposalGatePayload.status, "pass");
    assert.equal(proposalGatePayload.pendingReviewCount, 0);
    assert.equal(proposalGatePayload.review.appliedCount, 1);

    process.exitCode = 0;
    const reviewedPatchOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      reviewFile,
      "--patch",
    ]));
    assert.match(reviewedPatchOutput, /No pending skill proposal deltas remain after review-file decisions/);
    assert.doesNotMatch(reviewedPatchOutput, /diff --git/);

    const reviewedTemplateFile = path.join(dir, "review-template.json");
    const reviewedTemplateWriteOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      reviewFile,
      "--review-template",
      "--out",
      reviewedTemplateFile,
    ]));
    assert.match(reviewedTemplateWriteOutput, /Wrote /);
    const reviewedTemplatePayload = JSON.parse(readFileSync(reviewedTemplateFile, "utf8"));
    assert.equal(reviewedTemplatePayload.summary.templateDecisionCount, 0);
    assert.deepEqual(reviewedTemplatePayload.decisions, []);
    assert.equal(readFileSync(filePath, "utf8"), before);
    assert.equal(readFileSync(reviewFile, "utf8"), JSON.stringify({
      version: 1,
      decisions: [
        {
          proposalId: strictPayload.proposals[0].id,
          status: "applied",
          reviewedAt: "2026-06-10T00:05:00.000Z",
          reviewer: "local-operator",
          note: "Instruction delta was manually reviewed and applied.",
        },
        {
          proposalId: "skill-proposal-stale",
          status: "rejected",
          reviewedAt: "2026-06-09T00:00:00.000Z",
        },
      ],
    }));
  } finally {
    process.exitCode = previousExitCode;
  }
}));

test("learningEvalReport validates expected learning selection without raw brief text", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:03.000Z",
    entries: [
      {
        id: "learn-relevant",
        category: "accessibility",
        text: "Prioritize keyboard accessibility details for Button component API specs",
        source: "test",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-brand",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "test",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const evalText = JSON.stringify({
    version: 1,
    generatedAt: "2026-05-22T00:00:04.000Z",
    sourceProfile: {
      file: filePath,
      exists: true,
      entryCount: 2,
      auditStatus: "pass",
      category: "accessibility",
      query: "Spec a Button component API with keyboard accessibility",
      limit: 6,
    },
    cases: [
      {
        id: "button-accessibility",
        routeId: "component-spec",
        brief: "Spec a Button component API with keyboard accessibility",
        limit: 1,
        expectedSelectedIds: ["learn-relevant"],
        avoidedSelectedIds: ["learn-brand"],
        minMatchedCount: 1,
        requireNoFallback: true,
      },
      {
        id: "brand-avoidance",
        brief: "Spec a Button component API with keyboard accessibility",
        limit: 2,
        avoidedSelectedIds: ["learn-relevant"],
      },
    ],
  });

  const payload = learningEvalReport({
    filePath,
    evalText,
    source: "learning-eval.json",
    limit: 1,
  });

  assert.equal(payload.status, "fail");
  assert.equal(payload.caseCount, 2);
  assert.equal(payload.passed, 1);
  assert.equal(payload.failed, 1);
  assert.equal(payload.generatedAt, "2026-05-22T00:00:04.000Z");
  assert.equal(payload.sourceProfile.file, filePath);
  assert.equal(payload.sourceProfile.entryCount, 2);
  assert.equal(payload.sourceProfile.queryPresent, true);
  assert.equal(payload.sourceProfile.query, undefined);
  assert.equal(payload.cases[0].status, "pass");
  assert.deepEqual(payload.cases[0].selectedEntryIds, ["learn-relevant"]);
  assert.equal(payload.cases[0].briefHash.length, 16);
  assert.equal(payload.cases[1].unexpectedAvoidedIds[0], "learn-relevant");
  assert.equal(payload.privacy.storesRawBriefText, false);
  assert.equal(payload.privacy.exposesMatchedTokens, false);

  const raw = JSON.stringify(payload);
  assert.ok(!raw.includes("Spec a Button component API with keyboard accessibility"));
  assert.ok(!raw.includes("keyboard accessibility"));
}));

test("buildLearningEvalTemplate generates runnable checkpoints from profile selection", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:03.000Z",
    entries: [
      {
        id: "learn-relevant",
        category: "accessibility",
        text: "Prioritize keyboard accessibility details for Button component API specs",
        source: "test",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-brand",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "test",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const template = buildLearningEvalTemplate({
    filePath,
    query: "Spec a Button component API with keyboard accessibility",
    category: "accessibility",
    limit: 3,
    now: new Date("2026-05-22T00:00:04.000Z"),
  });

  assert.equal(template.version, 1);
  assert.equal(template.sourceProfile.file, filePath);
  assert.equal(template.sourceProfile.query, "Spec a Button component API with keyboard accessibility");
  assert.equal(template.caseCount, 1);
  assert.equal(template.cases[0].expectedSelectedIds[0], "learn-relevant");
  assert.equal(template.cases[0].limit, 1);
  assert.equal(template.cases[0].requireNoFallback, true);
  assert.equal(template.privacy.storesRawBriefText, true);

  const report = learningEvalReport({
    filePath,
    evalText: JSON.stringify(template),
    source: "generated-template",
  });
  assert.equal(report.status, "pass");
  assert.deepEqual(report.cases[0].selectedEntryIds, ["learn-relevant"]);
}));

test("runLearn --eval-template writes runnable checkpoint JSON without mutating profile", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const outPath = path.join(dir, "learning-eval.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:01.000Z",
    entries: [
      {
        id: "learn-keyboard",
        category: "accessibility",
        text: "Prioritize keyboard accessibility details for Button component API specs",
        source: "test",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");
  const before = readFileSync(filePath, "utf8");

  const wroteOutput = await captureStdout(() => runLearn([
    "--eval-template",
    "--query",
    "Spec a Button component API with keyboard accessibility",
    "--category",
    "accessibility",
    "--file",
    filePath,
    "--out",
    outPath,
  ]));
  assert.match(wroteOutput, /Wrote/);
  assert.equal(readFileSync(filePath, "utf8"), before);

  const template = JSON.parse(readFileSync(outPath, "utf8"));
  assert.equal(template.caseCount, 1);
  assert.equal(template.cases[0].expectedSelectedIds[0], "learn-keyboard");
  assert.equal(template.privacy.storesRawBriefText, true);

  const evalOutput = await captureStdout(() => runLearn([
    "--eval",
    "--from-file",
    outPath,
    "--file",
    filePath,
    "--strict",
    "--json",
  ]));
  assert.equal(JSON.parse(evalOutput).status, "pass");

  const humanOutput = await captureStdout(() => runLearn([
    "--eval-template",
    "--file",
    filePath,
  ]));
  assert.match(humanOutput, /Learning eval checkpoint template/);
  assert.match(humanOutput, /Privacy: checkpoint templates store raw brief text/);
}));

test("runLearn --eval reports checkpoint results in JSON and human output", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const evalFile = path.join(dir, "learning-eval.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:01.000Z",
    entries: [
      {
        id: "learn-relevant",
        category: "accessibility",
        text: "Prioritize keyboard accessibility details for Button component API specs",
        source: "test",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(evalFile, JSON.stringify({
    version: 1,
    cases: [
      {
        id: "button-accessibility",
        routeId: "component-spec",
        brief: "Spec a Button component API with keyboard accessibility",
        expectedSelectedIds: ["learn-relevant"],
        minMatchedCount: 1,
      },
    ],
  }), "utf8");

  const jsonOutput = await captureStdout(() => runLearn([
    "--eval",
    "--from-file",
    evalFile,
    "--file",
    filePath,
    "--limit",
    "1",
    "--json",
  ]));
  const payload = JSON.parse(jsonOutput);
  assert.equal(payload.source, evalFile);
  assert.equal(payload.status, "pass");
  assert.equal(payload.cases[0].selectedEntryIds[0], "learn-relevant");

  const humanOutput = await captureStdout(() => runLearn([
    "--eval",
    "--from-file",
    evalFile,
    "--file",
    filePath,
    "--limit",
    "1",
  ]));
  assert.match(humanOutput, /Local learning eval report/);
  assert.match(humanOutput, /button-accessibility \/ component-spec: pass/);
  assert.match(humanOutput, /Privacy: eval reports expose brief hashes and selected ids/);
}));

test("runLearn --eval --strict exits non-zero when checkpoints fail", () => withTempDirAsync(async (dir) => {
  const previousExitCode = process.exitCode;
  const filePath = path.join(dir, "learning.json");
  const evalFile = path.join(dir, "learning-eval.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:01.000Z",
    entries: [
      {
        id: "learn-relevant",
        category: "accessibility",
        text: "Prioritize keyboard accessibility details for Button component API specs",
        source: "test",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(evalFile, JSON.stringify({
    version: 1,
    cases: [
      {
        id: "button-accessibility",
        routeId: "component-spec",
        brief: "Spec a Button component API with keyboard accessibility",
        expectedSelectedIds: ["missing-entry"],
        minMatchedCount: 1,
      },
    ],
  }), "utf8");

  try {
    process.exitCode = undefined;
    const strictOutput = await captureStdout(() => runLearn([
      "--eval",
      "--from-file",
      evalFile,
      "--file",
      filePath,
      "--limit",
      "1",
      "--strict",
      "--json",
    ]));
    const strictPayload = JSON.parse(strictOutput);
    assert.equal(strictPayload.status, "fail");
    assert.equal(process.exitCode, 1);

    process.exitCode = 0;
    await captureStdout(() => runLearn([
      "--eval",
      "--from-file",
      evalFile,
      "--file",
      filePath,
      "--limit",
      "1",
      "--json",
    ]));
    assert.equal(process.exitCode, 0);
  } finally {
    process.exitCode = previousExitCode;
  }
}));

test("prompt and pack commands record --with-learning usage sidecar metadata", () => withTempDirAsync(async (dir) => {
  const learningFile = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  writeFileSync(learningFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:02.000Z",
    entries: [
      {
        id: "learn-relevant",
        category: "accessibility",
        text: "Prioritize keyboard accessibility details for Button component API specs",
        source: "test",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-unrelated",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "test",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  await withLearningEnv({ learningFile, usageFile }, async () => {
    const promptOutput = await captureStdout(() => runPrompt([
      "Spec a Button component API with keyboard accessibility",
      "--route",
      "component-spec",
      "--with-learning",
      "--learning-limit",
      "1",
      "--json",
    ]));
    const promptPayload = JSON.parse(promptOutput);
    assert.equal(promptPayload.learningUsage.recorded, true);
    assert.equal(promptPayload.learningUsage.event.command, "prompt");
    assert.deepEqual(promptPayload.learningUsage.event.selectedEntryIds, ["learn-relevant"]);

    const packOutput = await captureStdout(() => runPack([
      "Spec a Button component API with keyboard accessibility",
      "--route",
      "component-spec",
      "--with-learning",
      "--learning-limit",
      "1",
      "--max-bytes",
      "5000",
      "--json",
    ]));
    const packPayload = JSON.parse(packOutput);
    assert.equal(packPayload.learningUsage.recorded, true);
    assert.equal(packPayload.learningUsage.event.command, "pack");
    assert.equal(packPayload.plan.learningUsage.event.command, "pack");
  });

  const log = loadLearningUsageLog(usageFile, { profileFile: learningFile });
  assert.deepEqual(log.events.map((event) => event.command), ["prompt", "pack"]);
  assert.deepEqual(log.events.map((event) => event.selectedEntryIds), [
    ["learn-relevant"],
    ["learn-relevant"],
  ]);
}));
