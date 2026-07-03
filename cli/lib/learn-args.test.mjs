// Tests for learn CLI argument parsing.

import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { normalizeCategory, normalizeFeedbackOutcome, parseLearnArgs } from "./learn.mjs";

test("parseLearnArgs supports bare subcommand aliases for mode flags", () => {
  assert.deepEqual(parseLearnArgs(["signals", "--json"]), parseLearnArgs(["--signals", "--json"]));
  assert.deepEqual(parseLearnArgs(["recall", "korean", "payment"]), parseLearnArgs(["--recall", "korean", "payment"]));
  const recallAlias = parseLearnArgs(["recall", "korean", "payment"]);
  assert.equal(recallAlias.action, "recall");
  assert.equal(recallAlias.brief, "korean payment");
  assert.deepEqual(parseLearnArgs(["restore-backups", "--prune", "--keep", "3"]), parseLearnArgs(["--restore-backups", "--prune", "--keep", "3"]));
  assert.deepEqual(parseLearnArgs(["forget", "abc123"]), parseLearnArgs(["--forget", "abc123"]));
  assert.equal(parseLearnArgs(["propose-skills", "--strict"]).action, "propose-skills");
  const note = parseLearnArgs(["remembering", "tables"]);
  assert.equal(note.action, "remember");
  assert.deepEqual(note.briefParts, ["remembering", "tables"]);
});

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

  const proposeSkillsReviewCheckArgs = parseLearnArgs(["--propose-skills", "--from-file", "signals", "--review-file", "skill-proposals.review.json", "--review-check", "--json"]);
  assert.equal(proposeSkillsReviewCheckArgs.action, "propose-skills");
  assert.equal(proposeSkillsReviewCheckArgs.fromFile, "signals");
  assert.equal(proposeSkillsReviewCheckArgs.reviewFilePath, path.resolve("skill-proposals.review.json"));
  assert.equal(proposeSkillsReviewCheckArgs.reviewCheck, true);
  assert.equal(proposeSkillsReviewCheckArgs.json, true);

  const proposeSkillsApplyPlanArgs = parseLearnArgs(["--propose-skills", "--from-file", "signals", "--review-file", "skill-proposals.review.json", "--apply-plan", "--report", "--out", "skill-proposal-apply-plan.md"]);
  assert.equal(proposeSkillsApplyPlanArgs.action, "propose-skills");
  assert.equal(proposeSkillsApplyPlanArgs.fromFile, "signals");
  assert.equal(proposeSkillsApplyPlanArgs.reviewFilePath, path.resolve("skill-proposals.review.json"));
  assert.equal(proposeSkillsApplyPlanArgs.applyPlan, true);
  assert.equal(proposeSkillsApplyPlanArgs.report, true);
  assert.equal(proposeSkillsApplyPlanArgs.outPath, "skill-proposal-apply-plan.md");

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
    () => parseLearnArgs(["--signals", "--review-check"]),
    /--review-check can only be used with --propose-skills/,
  );
  assert.throws(
    () => parseLearnArgs(["--signals", "--apply-plan"]),
    /--apply-plan can only be used with --propose-skills/,
  );
  assert.throws(
    () => parseLearnArgs(["--propose-skills", "--review-check"]),
    /--review-check requires --review-file/,
  );
  assert.throws(
    () => parseLearnArgs(["--propose-skills", "--review-file", "skill-proposals.review.json", "--review-check", "--patch"]),
    /--review-check cannot be combined with --patch or --review-template/,
  );
  assert.throws(
    () => parseLearnArgs(["--propose-skills", "--review-file", "skill-proposals.review.json", "--review-check", "--review-template"]),
    /--review-check cannot be combined with --patch or --review-template/,
  );
  assert.throws(
    () => parseLearnArgs(["--propose-skills", "--apply-plan"]),
    /--apply-plan requires --review-file/,
  );
  assert.throws(
    () => parseLearnArgs(["--propose-skills", "--review-file", "skill-proposals.review.json", "--apply-plan", "--patch"]),
    /--apply-plan cannot be combined with --patch, --review-template, or --review-check/,
  );
  assert.throws(
    () => parseLearnArgs(["--propose-skills", "--review-file", "skill-proposals.review.json", "--apply-plan", "--review-template"]),
    /--apply-plan cannot be combined with --patch, --review-template, or --review-check/,
  );
  assert.throws(
    () => parseLearnArgs(["--propose-skills", "--review-file", "skill-proposals.review.json", "--apply-plan", "--review-check"]),
    /--review-check cannot be combined with --patch or --review-template|--apply-plan cannot be combined/,
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
