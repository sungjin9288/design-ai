// `design-ai learn` — manage a local learning profile for prompt personalization.

import path from "node:path";

import { resolveBriefInput } from "../lib/brief.mjs";
import {
  LEARNING_CATEGORIES,
  LEARNING_FEEDBACK_OUTCOMES,
  auditLearningProfile,
  applyLearningAuditFixes,
  buildLearningBackup,
  buildLearningContext,
  clearLearning,
  forgetLearning,
  formatLearningJson,
  importLearningProfile,
  learningStats,
  loadLearningProfile,
  parseLearnArgs,
  recordLearningFeedback,
  rememberLearning,
  selectLearningEntries,
  verifyLearningImportPayload,
} from "../lib/learn.mjs";
import { dim, header, info, success } from "../lib/log.mjs";

function printHelp() {
  console.log("Usage:  design-ai learn [--list] [--category kind] [--limit N] [--json]");
  console.log("        design-ai learn --remember text [--category kind] [--json]");
  console.log("        design-ai learn --feedback text [--outcome keep|improve|avoid] [--category kind] [--json]");
  console.log("        design-ai learn --feedback --from-file notes.md [--outcome keep|improve|avoid] [--category kind] [--json]");
  console.log("        cat notes.md | design-ai learn --feedback --stdin [--outcome keep|improve|avoid] [--category kind] [--json]");
  console.log("        design-ai learn --from-file notes.md [--category kind] [--json]");
  console.log("        cat notes.md | design-ai learn --stdin [--category kind] [--json]");
  console.log("        design-ai learn --export [--category kind] [--limit N] [--json]");
  console.log("        design-ai learn --backup [--json]");
  console.log("        design-ai learn --verify --from-file learning.json [--json]");
  console.log("        cat learning.json | design-ai learn --verify --stdin [--json]");
  console.log("        design-ai learn --import --from-file learning.json --dry-run [--json]");
  console.log("        cat learning.json | design-ai learn --import --stdin --yes [--json]");
  console.log("        design-ai learn --audit [--json]");
  console.log("        design-ai learn --audit --fix --dry-run [--json]");
  console.log("        design-ai learn --audit --fix --yes [--json]");
  console.log("        design-ai learn --stats [--json]");
  console.log("        design-ai learn --forget id-or-number --yes [--json]");
  console.log("        design-ai learn --clear --yes [--json]\n");
  console.log("Stores local design preferences for explicit prompt personalization.");
  console.log("This is local memory, not model training or fine-tuning.\n");
  console.log("Options:");
  console.log("  --remember text      Remember an inline preference or project constraint");
  console.log("  --feedback text      Convert outcome feedback into a reusable local learning note");
  console.log(`  --outcome kind       Feedback outcome: ${LEARNING_FEEDBACK_OUTCOMES.join(", ")}. Default: improve`);
  console.log("  --from-file file     Read remember/feedback text or import/verify JSON from a file");
  console.log("  --stdin              Read remember/feedback text or import/verify JSON from standard input");
  console.log("  --category kind      preference, brand, workflow, constraint, accessibility, korean, other");
  console.log("  --limit N            Limit list/export output to the N most recent matching entries, 1-100");
  console.log("  --list               List saved learning entries. Default when no action is given");
  console.log("  --export             Print the learned-context block used by --with-learning");
  console.log("  --backup             Print a full portable learning-profile backup; use --json for importable JSON");
  console.log("  --verify             Validate a portable learning JSON payload without importing it");
  console.log("  --import             Merge entries from a JSON learning profile or learn --export --json payload");
  console.log("  --audit              Inspect profile shape, sensitive content, and cleanup suggestions without changing it");
  console.log("  --fix                With --audit, prepare or apply safe cleanup suggestions");
  console.log("  --dry-run            Preview --audit --fix cleanup without changing the profile");
  console.log("  --stats              Summarize profile counts, recency, and audit status without changing it");
  console.log("  --forget id-or-number Remove one entry by id or 1-based list number; requires --yes");
  console.log("  --clear              Remove all saved learning entries; requires --yes");
  console.log("  --yes                Confirm destructive local profile changes");
  console.log("  --file path          Override the learning profile path");
  console.log("  --json               Emit machine-readable output");
  console.log("");
  console.log("Environment:");
  console.log("  DESIGN_AI_LEARNING_FILE=/path/learning.json  Override the default profile path");
  console.log("");
  console.log("Examples:");
  console.log("  design-ai learn --remember \"Prefer dense Korean product UI\" --category korean");
  console.log("  design-ai learn --feedback \"Keep audit findings short and evidence-led\" --outcome keep");
  console.log("  design-ai learn --feedback --from-file feedback.md --outcome improve");
  console.log("  cat feedback.md | design-ai learn --feedback --stdin --outcome avoid --category brand");
  console.log("  design-ai learn --list --category korean --limit 5");
  console.log("  design-ai learn --backup --json > learning-backup.json");
  console.log("  design-ai learn --verify --from-file learning-backup.json");
  console.log("  design-ai learn --import --from-file learning.json --dry-run");
  console.log("  design-ai learn --audit");
  console.log("  design-ai learn --audit --fix --dry-run");
  console.log("  design-ai learn --stats --json");
  console.log("  design-ai learn --forget learn-abc123def0 --yes");
  console.log("  design-ai prompt \"audit checkout UX\" --with-learning");
  console.log("  design-ai pack \"spec a pricing page\" --with-learning");
}

function printLearningImportVerification(payload) {
  header("design-ai learn", "Learning import verification");
  info(`Source: ${payload.source}`);
  info(`Importable: ${payload.importable ? "yes" : "no"}`);
  info(`Entries: ${payload.count}`);
  info(`Audit: ${payload.auditSummary.status} (${payload.auditSummary.failures} failure(s), ${payload.auditSummary.warnings} warning(s))`);
  console.log();

  if (payload.issues.length === 0) {
    console.log("No learning import issues found. No changes made.");
    return;
  }

  for (const issue of payload.issues) {
    const entry = issue.entryId ? ` (${issue.entryId})` : "";
    console.log(`${issue.level.toUpperCase()} ${issue.code}${entry}: ${issue.message}`);
  }
  console.log();
  console.log("No changes made. Review warnings before importing or using learned context.");
}

function learningFilter(parsed) {
  return {
    category: parsed.categorySpecified ? parsed.category : "",
    limit: parsed.limit,
  };
}

function listPayload(filePath, parsed) {
  const profile = loadLearningProfile(filePath);
  const filter = learningFilter(parsed);
  const entries = selectLearningEntries(profile, filter);
  return {
    file: filePath,
    version: profile.version,
    updatedAt: profile.updatedAt,
    category: filter.category,
    limit: filter.limit || null,
    entries,
    count: entries.length,
    totalCount: profile.entries.length,
  };
}

function printList(payload) {
  header("design-ai learn", "Local learning profile");
  info(`File: ${payload.file}`);
  info(`Entries: ${payload.count}/${payload.totalCount}`);
  if (payload.category) info(`Category: ${payload.category}`);
  if (payload.limit) info(`Limit: ${payload.limit}`);
  console.log();

  if (payload.entries.length === 0) {
    console.log(payload.category || payload.limit
      ? "No local learning preferences match the current filters."
      : "No local learning preferences are stored yet.");
    return;
  }

  for (let i = 0; i < payload.entries.length; i += 1) {
    const entry = payload.entries[i];
    console.log(`${i + 1}. [${entry.category}] ${entry.text}`);
    console.log(`   ${dim(`${entry.id} · ${entry.createdAt || "unknown time"}`)}`);
  }
}

function formatCategoryCounts(categoryCounts) {
  return LEARNING_CATEGORIES
    .filter((category) => categoryCounts[category])
    .map((category) => `${category} ${categoryCounts[category]}`)
    .join(", ");
}

function printAudit(payload) {
  header("design-ai learn", "Local learning profile audit");
  info(`File: ${payload.file}`);
  info(`Exists: ${payload.exists ? "yes" : "no"}`);
  info(`Entries: ${payload.count}`);
  info(`Status: ${payload.summary.status}`);
  info(`Issues: ${payload.summary.failures} failure(s), ${payload.summary.warnings} warning(s)`);

  const categories = formatCategoryCounts(payload.categoryCounts);
  if (categories) info(`Categories: ${categories}`);
  console.log();

  if (!payload.exists) {
    console.log("No local learning profile file exists yet.");
    return;
  }

  if (payload.issues.length === 0) {
    console.log("No learning profile issues found.");
    return;
  }

  for (const issue of payload.issues) {
    const entry = issue.entryId ? ` (${issue.entryId})` : "";
    console.log(`${issue.level.toUpperCase()} ${issue.code}${entry}: ${issue.message}`);
  }

  if (payload.suggestions.length > 0) {
    console.log();
    console.log("Suggested cleanup:");
    for (const suggestion of payload.suggestions) {
      const entry = suggestion.entryId ? ` (${suggestion.entryId})` : "";
      console.log(`- ${suggestion.action}${entry}: ${suggestion.message}`);
      if (suggestion.command) {
        console.log(`  ${dim(suggestion.command)}`);
      }
    }
  }
}

function printAuditFix(payload) {
  header("design-ai learn", payload.dryRun ? "Learning audit cleanup dry run" : "Learning audit cleanup applied");
  info(`File: ${payload.file}`);
  info(`Before: ${payload.before.status} (${payload.before.failures} failure(s), ${payload.before.warnings} warning(s))`);
  info(`Cleanup entries: ${payload.cleanupCount}`);
  if (payload.after) {
    info(`After: ${payload.after.status} (${payload.after.failures} failure(s), ${payload.after.warnings} warning(s))`);
  }
  console.log();

  if (payload.cleanup.length === 0) {
    console.log("No safe cleanup suggestions are available.");
  } else {
    console.log(payload.dryRun ? "Would remove:" : "Removed:");
    for (const fix of payload.cleanup) {
      console.log(`- ${fix.entryId}: ${fix.actions.join(", ")} (${fix.issueCodes.join(", ")})`);
      if (fix.command) {
        console.log(`  ${dim(fix.command)}`);
      }
    }
  }

  if (payload.skipped.length > 0) {
    console.log();
    console.log("Skipped:");
    for (const skipped of payload.skipped) {
      const entry = skipped.entryId ? ` (${skipped.entryId})` : "";
      console.log(`- ${skipped.reason}${entry}: ${skipped.message}`);
    }
  }

  if (payload.dryRun) {
    console.log();
    console.log("No changes made. Re-run with `--yes` instead of `--dry-run` to apply safe cleanup.");
  }
}

function printStats(payload) {
  header("design-ai learn", "Local learning profile stats");
  info(`File: ${payload.file}`);
  info(`Exists: ${payload.exists ? "yes" : "no"}`);
  info(`Entries: ${payload.count}`);
  info(`Updated: ${payload.updatedAt || "unknown"}`);
  info(`Audit: ${payload.auditSummary.status} (${payload.auditSummary.failures} failure(s), ${payload.auditSummary.warnings} warning(s))`);

  const categories = formatCategoryCounts(payload.categoryCounts);
  if (categories) info(`Categories: ${categories}`);

  const sources = Object.entries(payload.sourceCounts)
    .map(([source, count]) => `${source} ${count}`)
    .join(", ");
  if (sources) info(`Sources: ${sources}`);
  console.log();

  if (!payload.exists) {
    console.log("No local learning profile file exists yet.");
    return;
  }

  if (payload.auditSummary.failures > 0) {
    console.log("Profile stats are limited because the profile has audit failures. Run `design-ai learn --audit` for details.");
    return;
  }

  if (payload.count === 0) {
    console.log("No local learning preferences are stored yet.");
    return;
  }

  if (!payload.latestEntry) {
    console.log("No parseable learning entry timestamps found. Run `design-ai learn --audit` for details.");
    return;
  }

  if (payload.latestEntry) {
    console.log(`Latest: [${payload.latestEntry.category}] ${payload.latestEntry.textPreview}`);
    console.log(`        ${dim(`${payload.latestEntry.id} · ${payload.latestEntry.createdAt}`)}`);
  }
  if (payload.oldestEntry && payload.oldestEntry.id !== payload.latestEntry?.id) {
    console.log(`Oldest: [${payload.oldestEntry.category}] ${payload.oldestEntry.textPreview}`);
    console.log(`        ${dim(`${payload.oldestEntry.id} · ${payload.oldestEntry.createdAt}`)}`);
  }
}

function readLearningInput(parsed) {
  return resolveBriefInput(parsed);
}

function assertConfirmed(parsed, action) {
  if (!parsed.yes) {
    throw new Error(`Refusing to ${action} learning entries without --yes`);
  }
}

export async function runLearn(args) {
  const parsed = parseLearnArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  if (parsed.action === "remember") {
    const text = readLearningInput(parsed);
    const result = rememberLearning({
      text,
      category: parsed.category,
      filePath: parsed.filePath,
    });

    const payload = {
      file: result.file,
      entry: result.entry,
      count: result.profile.entries.length,
    };

    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }

    success(`Remembered ${result.entry.id}`);
    info(`File: ${result.file}`);
    info(`Category: ${result.entry.category}`);
    return;
  }

  if (parsed.action === "feedback") {
    const text = readLearningInput(parsed);
    const result = recordLearningFeedback({
      text,
      outcome: parsed.feedbackOutcome,
      category: parsed.category,
      filePath: parsed.filePath,
    });

    const payload = {
      file: result.file,
      feedback: {
        outcome: parsed.feedbackOutcome,
        category: result.entry.category,
        instruction: result.entry.text,
      },
      entry: result.entry,
      count: result.profile.entries.length,
    };

    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }

    success(`Recorded feedback ${result.entry.id}`);
    info(`File: ${result.file}`);
    info(`Outcome: ${parsed.feedbackOutcome}`);
    info(`Category: ${result.entry.category}`);
    return;
  }

  if (parsed.action === "export") {
    const filter = learningFilter(parsed);
    const context = buildLearningContext({
      filePath: parsed.filePath,
      category: filter.category,
      limit: filter.limit || 12,
    });
    if (parsed.json) {
      console.log(formatLearningJson(context));
      return;
    }
    console.log(context.markdown);
    return;
  }

  if (parsed.action === "import") {
    if (!parsed.dryRun) assertConfirmed(parsed, "import");
    const result = importLearningProfile({
      importText: readLearningInput(parsed),
      filePath: parsed.filePath,
      dryRun: parsed.dryRun,
    });
    const payload = {
      file: result.file,
      dryRun: result.dryRun,
      applied: result.applied,
      importedCount: result.importedCount,
      addedCount: result.addedCount,
      skippedCount: result.skippedCount,
      added: result.added,
      skipped: result.skipped,
      count: result.count,
    };

    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }

    header("design-ai learn", result.dryRun ? "Learning import dry run" : "Learning import applied");
    info(`File: ${result.file}`);
    info(`Imported: ${result.importedCount}`);
    info(`Added: ${result.addedCount}`);
    info(`Skipped: ${result.skippedCount}`);
    info(`Entries: ${result.count}`);
    if (result.dryRun) {
      console.log();
      console.log("No changes made. Re-run with `--yes` instead of `--dry-run` to import new entries.");
    }
    return;
  }

  if (parsed.action === "backup") {
    const payload = buildLearningBackup({ filePath: parsed.filePath });
    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }

    header("design-ai learn", "Learning profile backup");
    info(`File: ${payload.file}`);
    info(`Entries: ${payload.count}`);
    info(`Audit: ${payload.auditSummary.status} (${payload.auditSummary.failures} failure(s), ${payload.auditSummary.warnings} warning(s))`);
    info(`Exported: ${payload.exportedAt}`);
    console.log();
    console.log("Run `design-ai learn --backup --json > learning-backup.json` to save a full portable JSON backup.");
    return;
  }

  if (parsed.action === "verify") {
    const payload = verifyLearningImportPayload({
      importText: readLearningInput(parsed),
      source: parsed.fromFile ? path.resolve(parsed.fromFile) : "stdin",
    });
    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }

    printLearningImportVerification(payload);
    return;
  }

  if (parsed.action === "list") {
    const payload = listPayload(parsed.filePath, parsed);
    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }
    printList(payload);
    return;
  }

  if (parsed.action === "audit") {
    if (parsed.fix) {
      if (!parsed.dryRun) assertConfirmed(parsed, "apply audit cleanup fixes to");
      const payload = applyLearningAuditFixes({
        filePath: parsed.filePath,
        dryRun: parsed.dryRun,
      });
      if (parsed.json) {
        console.log(formatLearningJson(payload));
        return;
      }
      printAuditFix(payload);
      return;
    }

    const payload = auditLearningProfile({ filePath: parsed.filePath });
    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }
    printAudit(payload);
    return;
  }

  if (parsed.action === "stats") {
    const payload = learningStats({ filePath: parsed.filePath });
    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }
    printStats(payload);
    return;
  }

  if (parsed.action === "forget") {
    assertConfirmed(parsed, "forget");
    const result = forgetLearning({
      target: parsed.forgetTarget,
      filePath: parsed.filePath,
    });
    const payload = {
      file: result.file,
      removed: result.removed,
      count: result.count,
    };

    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }

    success(`Forgot ${result.removed.id}`);
    info(`File: ${result.file}`);
    info(`Entries: ${result.count}`);
    return;
  }

  if (parsed.action === "clear") {
    assertConfirmed(parsed, "clear");
    const result = clearLearning({ filePath: parsed.filePath });
    const payload = {
      file: result.file,
      removedCount: result.removedCount,
      count: result.profile.entries.length,
    };

    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }

    success(`Cleared ${result.removedCount} learning entr${result.removedCount === 1 ? "y" : "ies"}`);
    info(`File: ${result.file}`);
    return;
  }

  throw new Error(`Unsupported learn action: ${parsed.action}`);
}
