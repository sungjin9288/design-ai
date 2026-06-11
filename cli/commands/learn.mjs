// `design-ai learn` — manage a local learning profile for prompt personalization.

import path from "node:path";

import { resolveBriefInput } from "../lib/brief.mjs";
import {
  LEARNING_CATEGORIES,
  LEARNING_FEEDBACK_OUTCOMES,
  auditLearningProfile,
  applyLearningAuditFixes,
  applyLearningCurationPlan,
  buildLearningEvalTemplate,
  buildLearningBackup,
  buildLearningContext,
  diffLearningProfiles,
  buildRedactedLearningBackup,
  clearLearning,
  forgetLearning,
  formatLearningJson,
  importLearningProfile,
  initializeLearningProfile,
  learningEvalReport,
  learningStats,
  learningUsageStats,
  listLearningRestoreBackups,
  loadLearningProfile,
  parseLearnArgs,
  pruneLearningRestoreBackups,
  recordLearningFeedback,
  rememberLearning,
  renderLearningCurationReport,
  restoreLearningProfile,
  selectLearningEntrySet,
  verifyLearningImportPayload,
} from "../lib/learn.mjs";
import { dim, header, info, success } from "../lib/log.mjs";
import { writeOutputFile } from "../lib/output.mjs";
import { learningSignalRegistry } from "../lib/signals.mjs";
import {
  buildSkillEvolutionProposals,
  renderSkillProposalReviewTemplate,
  renderSkillEvolutionProposalPatch,
  renderSkillEvolutionProposalReport,
} from "../lib/skill-proposals.mjs";

function printHelp() {
  console.log("Usage:  design-ai learn [--list] [--category kind] [--query text] [--explain] [--limit N] [--json] [--out file] [--force]");
  console.log("        design-ai learn --init [--yes|--dry-run] [--json] [--out file] [--force]");
  console.log("        design-ai learn --remember text [--category kind] [--json] [--out file] [--force]");
  console.log("        design-ai learn --feedback text [--outcome keep|improve|avoid] [--category kind] [--json] [--out file] [--force]");
  console.log("        design-ai learn --feedback --from-file notes.md [--outcome keep|improve|avoid] [--category kind] [--json] [--out file] [--force]");
  console.log("        cat notes.md | design-ai learn --feedback --stdin [--outcome keep|improve|avoid] [--category kind] [--json] [--out file] [--force]");
  console.log("        design-ai learn --from-file notes.md [--category kind] [--json] [--out file] [--force]");
  console.log("        cat notes.md | design-ai learn --stdin [--category kind] [--json] [--out file] [--force]");
  console.log("        design-ai learn --export [--category kind] [--query text] [--limit N] [--json] [--out file] [--force]");
  console.log("        design-ai learn --backup [--json] [--out file] [--force]");
  console.log("        design-ai learn --redact [--json] [--out file] [--force]");
  console.log("        design-ai learn --redact --from-file learning-backup.json [--json] [--out file] [--force]");
  console.log("        cat learning-backup.json | design-ai learn --redact --stdin [--json] [--out file] [--force]");
  console.log("        design-ai learn --verify --from-file learning.json [--json] [--out file] [--force]");
  console.log("        cat learning.json | design-ai learn --verify --stdin [--json] [--out file] [--force]");
  console.log("        design-ai learn --diff --from-file learning.json [--json] [--out file] [--force]");
  console.log("        cat learning.json | design-ai learn --diff --stdin [--json] [--out file] [--force]");
  console.log("        design-ai learn --restore --from-file learning-backup.json [--dry-run|--yes] [--backup-file path] [--json] [--out file] [--force]");
  console.log("        cat learning-backup.json | design-ai learn --restore --stdin [--dry-run|--yes] [--backup-file path] [--json] [--out file] [--force]");
  console.log("        design-ai learn --restore-backups [--limit N] [--json] [--out file] [--force]");
  console.log("        design-ai learn --restore-backups --prune [--keep N] [--dry-run|--yes] [--json] [--out file] [--force]");
  console.log("        design-ai learn --import --from-file learning.json --dry-run [--json] [--out file] [--force]");
  console.log("        cat learning.json | design-ai learn --import --stdin --yes [--json] [--out file] [--force]");
  console.log("        design-ai learn --audit [--json] [--out file] [--force]");
  console.log("        design-ai learn --audit --fix --dry-run [--json] [--out file] [--force]");
  console.log("        design-ai learn --audit --fix --yes [--json] [--out file] [--force]");
  console.log("        design-ai learn --curate [--dry-run|--yes] [--usage-file path] [--json|--report] [--out file] [--force]");
  console.log("        design-ai learn --stats [--json] [--out file] [--force]");
  console.log("        design-ai learn --usage [--limit N] [--usage-file path] [--json] [--out file] [--force]");
  console.log("        design-ai learn --signals [--from-file signal-file-or-dir] [--usage-file path] [--strict] [--json] [--out file] [--force]");
  console.log("        design-ai learn --propose-skills [--from-file signal-file-or-dir] [--usage-file path] [--review-file path] [--min-evidence N] [--strict] [--json|--report|--patch|--review-template] [--out file] [--force]");
  console.log("        design-ai learn --eval-template [--query text] [--category kind] [--limit N] [--json] [--out file] [--force]");
  console.log("        design-ai learn --eval --from-file eval.json [--category kind] [--limit N] [--strict] [--json] [--out file] [--force]");
  console.log("        cat eval.json | design-ai learn --eval --stdin [--category kind] [--limit N] [--strict] [--json]");
  console.log("        design-ai learn --forget id-or-number --yes [--json] [--out file] [--force]");
  console.log("        design-ai learn --clear --yes [--json] [--out file] [--force]\n");
  console.log("Stores local design preferences for explicit prompt personalization.");
  console.log("This is local memory, not model training or fine-tuning.\n");
  console.log("Options:");
  console.log("  --init               Preview or apply starter local learning entries for dogfood use");
  console.log("  --remember text      Remember an inline preference or project constraint");
  console.log("  --feedback text      Convert outcome feedback into a reusable local learning note");
  console.log(`  --outcome kind       Feedback outcome: ${LEARNING_FEEDBACK_OUTCOMES.join(", ")}. Default: improve`);
  console.log("  --from-file file     Read remember/feedback text or import/verify/diff/restore/redact JSON from a file");
  console.log("  --stdin              Read remember/feedback text or import/verify/diff/restore/redact JSON from standard input");
  console.log("  --category kind      preference, brand, workflow, constraint, accessibility, korean, other");
  console.log("  --query text         Filter list/export output to entries whose category or text matches the query");
  console.log("  --explain            With --list, include selection score, matched tokens, and reason");
  console.log("  --limit N            Limit list/export output to the N most recent matching entries, 1-100");
  console.log("  --list               List saved learning entries. Default when no action is given");
  console.log("  --export             Print the learned-context block used by --with-learning");
  console.log("  --backup             Print a full portable learning-profile backup; use --json for importable JSON");
  console.log("  --redact             Print a portable JSON backup with sensitive-looking text redacted");
  console.log("  --verify             Validate a portable learning JSON payload without importing it");
  console.log("  --diff               Compare the active profile against a portable learning JSON payload without importing it");
  console.log("  --restore            Preview or apply replacing the active profile with a portable learning JSON payload");
  console.log("  --restore-backups    List sibling restore rollback backups for the active learning profile");
  console.log("  --prune              With --restore-backups, preview or delete older rollback backup files");
  console.log("  --keep N             With --restore-backups --prune, keep the N newest backups. Default: 5");
  console.log("  --backup-file path   With --restore, override the automatic rollback backup file path");
  console.log("  --import             Merge entries from a JSON learning profile or learn --export --json payload");
  console.log("  --audit              Inspect profile shape, sensitive content, and cleanup suggestions without changing it");
  console.log("  --fix                With --audit, prepare or apply safe cleanup suggestions");
  console.log("  --curate             Preview or apply archive-first curation for duplicate/sensitive entries, plus usage review hints");
  console.log("  --report             With --curate or --propose-skills, emit a Markdown review report instead of human console output");
  console.log("  --patch              With --propose-skills, emit a preview-only unified diff handoff without editing skill files");
  console.log("  --review-template    With --propose-skills, emit a JSON proposal review-file template without changing review decisions");
  console.log("  --dry-run            Preview --init, --import, --restore, --curate, --restore-backups --prune, or --audit --fix without changing files");
  console.log("  --stats              Summarize profile counts, recency, and audit status without changing it");
  console.log("  --usage              Summarize prompt/pack --with-learning usage sidecar events without changing files");
  console.log("  --signals            Summarize local learning, usage, eval, check-capture, agent backlog, and workspace readiness signals without changing files");
  console.log("  --propose-skills     Preview skill instruction deltas from repeated check-capture learning signals without changing files");
  console.log("  --min-evidence N     With --propose-skills, require N related check-capture entries before emitting a proposal. Default: 2");
  console.log("  --review-file path   With --propose-skills, read proposal review decisions without changing the review file");
  console.log("  --eval-template      Generate a runnable learning eval checkpoint from the active profile");
  console.log("  --eval               Run deterministic learning-selection checkpoint cases without changing files");
  console.log("  --strict             With --eval, --signals, or --propose-skills, exit non-zero when any checkpoint, signal gate, or skill proposal gate warns or fails");
  console.log("  --forget id-or-number Remove one entry by id or 1-based list number; requires --yes");
  console.log("  --clear              Remove all saved learning entries; requires --yes");
  console.log("  --yes                Confirm destructive local profile changes");
  console.log("  --file path          Override the learning profile path");
  console.log("  --usage-file path    Override the learning usage sidecar path used by --usage, --curate, --signals, or --propose-skills");
  console.log("  --json               Emit machine-readable output");
  console.log("  --out file           Write JSON output to a file, export Markdown for --export, or learning review report Markdown");
  console.log("  --force              Overwrite an existing --out file, or an existing --backup-file during --restore");
  console.log("");
  console.log("Environment:");
  console.log("  DESIGN_AI_LEARNING_FILE=/path/learning.json       Override the default profile path");
  console.log("  DESIGN_AI_LEARNING_USAGE_FILE=/path/usage.json    Override the default usage sidecar path");
  console.log("");
  console.log("Examples:");
  console.log("  design-ai learn --init");
  console.log("  design-ai learn --init --yes --json");
  console.log("  design-ai learn --remember \"Prefer dense Korean product UI\" --category korean");
  console.log("  design-ai learn --feedback \"Keep audit findings short and evidence-led\" --outcome keep");
  console.log("  design-ai learn --feedback --from-file feedback.md --outcome improve");
  console.log("  cat feedback.md | design-ai learn --feedback --stdin --outcome avoid --category brand");
  console.log("  design-ai learn --list --category korean --limit 5");
  console.log("  design-ai learn --list --query \"keyboard accessibility\" --explain --json");
  console.log("  design-ai learn --export --query \"pricing page\" --limit 3");
  console.log("  design-ai learn --backup --json --out learning-backup.json");
  console.log("  design-ai learn --redact --json --out learning-redacted.json");
  console.log("  design-ai learn --redact --from-file learning-backup.json --json --out learning-redacted.json --force");
  console.log("  design-ai learn --verify --from-file learning-backup.json");
  console.log("  design-ai learn --diff --from-file learning-backup.json --json");
  console.log("  design-ai learn --restore --from-file learning-backup.json --dry-run");
  console.log("  design-ai learn --restore --from-file learning-backup.json --yes --backup-file learning-before-restore.json");
  console.log("  design-ai learn --restore-backups --json");
  console.log("  design-ai learn --restore-backups --prune --keep 5");
  console.log("  design-ai learn --restore-backups --prune --keep 5 --yes");
  console.log("  design-ai learn --import --from-file learning.json --dry-run");
  console.log("  design-ai learn --audit");
  console.log("  design-ai learn --audit --fix --dry-run");
  console.log("  design-ai learn --curate");
  console.log("  design-ai learn --curate --usage-file ./learning.usage.json");
  console.log("  design-ai learn --curate --report --out learning-curation-report.md");
  console.log("  design-ai learn --curate --yes --json");
  console.log("  design-ai learn --stats --json");
  console.log("  design-ai learn --usage --json");
  console.log("  design-ai learn --signals --from-file . --json");
  console.log("  design-ai learn --propose-skills --from-file . --min-evidence 3 --json");
  console.log("  design-ai learn --propose-skills --from-file . --strict --json");
  console.log("  design-ai learn --propose-skills --from-file . --review-file skill-proposals.review.json --strict --json");
  console.log("  design-ai learn --propose-skills --from-file . --review-template --out skill-proposals.review.json");
  console.log("  design-ai learn --propose-skills --from-file . --report --out skill-proposals.md");
  console.log("  design-ai learn --propose-skills --from-file . --patch --out skill-proposals.patch");
  console.log("  design-ai learn --eval-template --query \"keyboard accessibility\" --out learning-eval.json");
  console.log("  design-ai learn --eval --from-file learning-eval.json --strict --json");
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
    query: parsed.query,
  };
}

function listPayload(filePath, parsed) {
  const profile = loadLearningProfile(filePath);
  const filter = learningFilter(parsed);
  const { entries, selection } = selectLearningEntrySet(profile, {
    ...filter,
    includeFallback: false,
  });
  const payload = {
    file: filePath,
    version: profile.version,
    updatedAt: profile.updatedAt,
    category: filter.category,
    query: filter.query,
    limit: filter.limit || null,
    entries,
    count: entries.length,
    totalCount: profile.entries.length,
  };
  if (parsed.explain) {
    payload.selection = selection;
  }
  return payload;
}

function printList(payload) {
  header("design-ai learn", "Local learning profile");
  info(`File: ${payload.file}`);
  info(`Entries: ${payload.count}/${payload.totalCount}`);
  if (payload.category) info(`Category: ${payload.category}`);
  if (payload.query) info(`Query: ${payload.query}`);
  if (payload.limit) info(`Limit: ${payload.limit}`);
  if (payload.selection) {
    info("Explain: selection score, matched tokens, and reason");
  }
  console.log();

  if (payload.entries.length === 0) {
    console.log(payload.category || payload.query || payload.limit
      ? "No local learning preferences match the current filters."
      : "No local learning preferences are stored yet.");
    return;
  }

  for (let i = 0; i < payload.entries.length; i += 1) {
    const entry = payload.entries[i];
    const selected = payload.selection?.selected?.[i];
    console.log(`${i + 1}. [${entry.category}] ${entry.text}`);
    console.log(`   ${dim(`${entry.id} · ${entry.createdAt || "unknown time"}`)}`);
    if (selected) {
      const matched = selected.matchedTokens.length > 0
        ? selected.matchedTokens.join(", ")
        : "none";
      console.log(`   ${dim(`score ${selected.score} · matched ${matched} · reason ${selected.reason}`)}`);
    }
  }
}

function formatCategoryCounts(categoryCounts) {
  return LEARNING_CATEGORIES
    .filter((category) => categoryCounts[category])
    .map((category) => `${category} ${categoryCounts[category]}`)
    .join(", ");
}

function formatCounts(counts) {
  return Object.entries(counts || {})
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => `${key} ${count}`)
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

function printCuration(payload) {
  header("design-ai learn", payload.dryRun ? "Learning curation preview" : "Learning curation applied");
  info(`File: ${payload.file}`);
  info(`Archive: ${payload.archiveFile}`);
  info(`Before: ${payload.before.status} (${payload.before.failures} failure(s), ${payload.before.warnings} warning(s))`);
  info(`Proposals: ${payload.proposalCount}`);
  info(`Archive candidates: ${payload.archiveCount}`);
  info(`Manual review: ${payload.manualReviewCount}`);
  if (payload.after) {
    info(`After: ${payload.after.status} (${payload.after.failures} failure(s), ${payload.after.warnings} warning(s))`);
  }
  console.log();

  if (payload.proposals.length === 0) {
    console.log("No learning curation candidates found.");
  } else {
    const archiveCandidates = payload.proposals.filter((proposal) => proposal.action === "archive");
    const manualCandidates = payload.proposals.filter((proposal) => proposal.action === "manual-review");
    if (archiveCandidates.length > 0) {
      console.log(payload.dryRun ? "Would archive:" : "Archived:");
      for (const proposal of archiveCandidates) {
        console.log(`- ${proposal.entryId}: ${proposal.reason} (${proposal.issueCodes.join(", ")})`);
        if (proposal.textPreview) console.log(`  ${dim(proposal.textPreview)}`);
      }
      console.log();
    }
    if (manualCandidates.length > 0) {
      console.log("Needs manual review:");
      for (const proposal of manualCandidates) {
        const label = proposal.entryId || "profile";
        console.log(`- ${label}: ${proposal.reason} (${proposal.issueCodes.join(", ")})`);
        if (proposal.textPreview) console.log(`  ${dim(proposal.textPreview)}`);
      }
      console.log();
    }
  }

  if (payload.skipped.length > 0) {
    console.log("Skipped:");
    for (const skipped of payload.skipped) {
      const entry = skipped.entryId ? `${skipped.entryId}: ` : "";
      console.log(`- ${entry}${skipped.reason}`);
    }
    console.log();
  }

  if (payload.usage?.exists || payload.usage?.error) {
    console.log("Usage review:");
    console.log(`- sidecar: ${payload.usage.usageFile}`);
    console.log(`- events: ${payload.usage.eventCount}`);
    console.log(`- review items: ${payload.usage.reviewCount}`);
    if (payload.usage.error) {
      console.log(`- error: ${payload.usage.error}`);
    } else if (payload.usage.reviews.length === 0) {
      console.log("- no usage-based curation review items found");
    } else {
      for (const review of payload.usage.reviews) {
        const label = review.entryId || "usage";
        console.log(`- ${label}: ${review.reason} (${review.action})`);
        if (review.textPreview) console.log(`  ${dim(review.textPreview)}`);
      }
    }
    console.log(dim("Usage review is advisory; --curate only archives duplicate/sensitive audit candidates."));
    console.log();
  }

  if (payload.dryRun) {
    console.log("No changes made. Re-run with `--yes` to move archive candidates into the learning archive.");
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

function printUsage(payload) {
  header("design-ai learn", "Local learning usage report");
  info(`File: ${payload.file}`);
  info(`Usage sidecar: ${payload.usageFile}`);
  info(`Usage exists: ${payload.exists ? "yes" : "no"}`);
  info(`Events: ${payload.eventCount}`);
  info(`Profile entries: ${payload.profileEntryCount}`);
  info(`Used entries: ${payload.usedEntryCount}`);
  info(`Unused entries: ${payload.unusedEntryCount}`);
  info(`Stale selected ids: ${payload.staleSelectedEntryCount}`);
  info(`Updated: ${payload.updatedAt || "unknown"}`);

  const commands = formatCounts(payload.commandCounts);
  if (commands) info(`Commands: ${commands}`);
  const routes = formatCounts(payload.routeCounts);
  if (routes) info(`Routes: ${routes}`);
  const categories = formatCounts(payload.categoryCounts);
  if (categories) info(`Categories: ${categories}`);
  console.log();

  if (!payload.exists) {
    console.log("No local learning usage sidecar exists yet.");
    console.log("Run `design-ai prompt \"...\" --with-learning` or `design-ai pack \"...\" --with-learning` to record usage metadata.");
    return;
  }

  if (payload.eventCount === 0) {
    console.log("No local learning usage events are stored yet.");
    return;
  }

  if (payload.topSelectedEntries.length > 0) {
    console.log("Top selected entries:");
    for (const entry of payload.topSelectedEntries) {
      console.log(`- ${entry.id}: ${entry.usageCount} use(s) [${entry.category}] ${entry.textPreview}`);
      if (entry.latestUsedAt) console.log(`  ${dim(`latest ${entry.latestUsedAt}`)}`);
    }
    console.log();
  }

  if (payload.recentEvents.length > 0) {
    console.log("Recent events:");
    for (const event of payload.recentEvents) {
      const route = event.routeId || "unrouted";
      const ids = event.selectedEntryIds.length > 0 ? event.selectedEntryIds.join(", ") : "none";
      console.log(`- ${event.createdAt}: ${event.command} / ${route} selected ${ids}`);
      console.log(`  ${dim(`briefHash ${event.briefHash || "none"} · matched ${event.matchedCount}/${event.candidateCount} · fallback ${event.fallbackCount}`)}`);
    }
    console.log();
  }

  if (payload.unusedEntryIds.length > 0) {
    console.log(`Unused active entry ids: ${payload.unusedEntryIds.join(", ")}`);
  }
  if (payload.staleSelectedEntryIds.length > 0) {
    console.log(`Stale selected entry ids: ${payload.staleSelectedEntryIds.join(", ")}`);
  }

  if (payload.recommendations.length > 0) {
    console.log();
    console.log("Recommendations:");
    for (const recommendation of payload.recommendations) {
      console.log(`- ${recommendation.level}: ${recommendation.text}`);
    }
  }

  console.log();
  console.log("Privacy: usage events store selected entry ids and a short brief hash, not raw brief text.");
}

function printSignals(payload) {
  header("design-ai learn", "Learning signal registry");
  info(`File: ${payload.file}`);
  info(`Status: ${payload.status}`);
  info(`Signal source: ${payload.signalSource}`);
  info(`Learning entries: ${payload.learning.count}`);
  info(`Learning audit: ${payload.learning.auditSummary.status} (${payload.learning.auditSummary.failures} failure(s), ${payload.learning.auditSummary.warnings} warning(s))`);
  info(`Usage events: ${payload.usage.eventCount}`);
  info(`Eval signals: ${payload.evals.count} (${payload.evals.reports} report(s), ${payload.evals.templates} template(s))`);
  info(`Check capture entries: ${payload.checkCapture.count}`);
  info(`Workspace next actions: ${payload.workspace.nextActionCount}`);
  console.log();

  if (payload.evals.files.length > 0) {
    console.log("Eval signals:");
    for (const item of payload.evals.files) {
      const label = path.basename(item.file);
      const counts = item.shape === "report"
        ? ` · pass ${item.passed} / warn ${item.warned} / fail ${item.failed}`
        : "";
      console.log(`- ${label}: ${item.kind} ${item.shape} ${item.status} (${item.caseCount} case(s))${counts}`);
      if (item.error) console.log(`  ${dim(item.error)}`);
    }
    console.log();
  }

  if (payload.checkCapture.latestEntries.length > 0) {
    console.log("Recent check captures:");
    for (const entry of payload.checkCapture.latestEntries) {
      console.log(`- ${entry.id}: [${entry.category}] ${entry.source}`);
      if (entry.textPreview) console.log(`  ${dim(entry.textPreview)}`);
    }
    console.log();
  }

  console.log("Workspace readiness:");
  console.log(`- branch: ${payload.workspace.git.branch || "unknown"} (${payload.workspace.git.clean ? "clean" : "dirty"})`);
  console.log(`- repository: ${payload.workspace.repository.status || "unknown"}`);
  console.log(`- learning usage: ${payload.workspace.learningUsage?.status || "not checked"}`);
  console.log(`- learning eval: ${payload.workspace.learningEval?.status || "not checked"}`);
  console.log();

  if (payload.agentDevelopment?.actions?.length > 0) {
    console.log("Agent development backlog:");
    for (const action of payload.agentDevelopment.actions.slice(0, 6)) {
      console.log(`- ${action.rank}. ${action.priority} ${action.category}: ${action.title}`);
      if (action.command) console.log(`  ${dim(action.command)}`);
    }
    console.log();
  }

  if (payload.recommendations.length > 0) {
    console.log("Recommendations:");
    for (const recommendation of payload.recommendations) {
      console.log(`- ${recommendation.level}: ${recommendation.text}`);
    }
    console.log();
  }

  console.log("Privacy: signal registry is read-only and does not mutate learning.json.");
}

function printSkillProposals(payload) {
  header("design-ai learn", "Skill evolution proposals");
  info(`File: ${payload.file}`);
  info(`Status: ${payload.status}`);
  info(`Signal source: ${payload.signalSource}`);
  info(`Signal status: ${payload.signalStatus}`);
  info(`Min evidence: ${payload.minEvidenceCount}`);
  info(`Check capture entries: ${payload.checkCaptureCount}`);
  info(`Candidates: ${payload.candidateCount}`);
  info(`Proposals: ${payload.proposalCount}`);
  info(`Pending review: ${payload.pendingReviewCount ?? payload.proposalCount}`);
  info(`Reviewed: ${payload.reviewedCount ?? 0}`);
  info(`Skipped: ${payload.skippedCount}`);
  if (payload.review?.file) {
    info(`Review file: ${payload.review.file}`);
    info(`Review status: ${payload.review.status} (${payload.review.matchedCount} matched, ${payload.review.staleCount} stale)`);
  }
  console.log();

  if (payload.proposals.length === 0) {
    console.log("No repeated check-capture groups crossed the proposal threshold.");
  } else {
    console.log("Proposed skill deltas:");
    for (const proposal of payload.proposals) {
      const routes = proposal.routeIds.length > 0 ? proposal.routeIds.join(", ") : "artifact";
      console.log(`- ${proposal.id}: ${proposal.candidateSkillPath}`);
      console.log(`  ${dim(`${proposal.sourceIssueCount} issue(s) · ${proposal.category} · routes ${routes} · risk ${proposal.riskLevel} · review ${proposal.reviewStatus || "pending"}`)}`);
      if (proposal.reviewDecision?.note) console.log(`  Review note: ${proposal.reviewDecision.note}`);
      console.log(`  Delta: ${proposal.proposedInstructionDelta}`);
      console.log(`  Verify: ${proposal.verificationCommand}`);
      for (const evidence of proposal.evidenceSources.slice(0, 3)) {
        console.log(`  Evidence: ${evidence.entryId} [${evidence.category}] ${evidence.source}`);
        if (evidence.textPreview) console.log(`    ${dim(evidence.textPreview)}`);
      }
    }
  }

  if (payload.skipped.length > 0) {
    console.log();
    console.log("Skipped groups:");
    for (const item of payload.skipped) {
      console.log(`- ${item.candidateSkillPath} [${item.category}]: ${item.reason}`);
    }
  }

  if (payload.review?.warnings?.length > 0) {
    console.log();
    console.log("Review file warnings:");
    for (const warning of payload.review.warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (payload.recommendations.length > 0) {
    console.log();
    console.log("Recommendations:");
    for (const recommendation of payload.recommendations) {
      console.log(`- ${recommendation.level}: ${recommendation.text}`);
    }
  }

  console.log();
  console.log("No changes made. This command is preview-only and does not edit skill files or learning.json.");
}

function printDiff(payload) {
  header("design-ai learn", "Learning profile diff");
  info(`File: ${payload.file}`);
  info(`Compare: ${payload.source}`);
  info(`Profile entries: ${payload.profileCount}`);
  info(`Comparison entries: ${payload.comparisonCount}`);
  info(`Profile-only: ${payload.profileOnlyCount}`);
  info(`Comparison-only: ${payload.comparisonOnlyCount}`);
  info(`Metadata changes: ${payload.metadataChangedCount}`);
  info(`ID conflicts: ${payload.idConflictCount}`);
  info(`Profile audit: ${payload.profileAuditSummary.status} (${payload.profileAuditSummary.failures} failure(s), ${payload.profileAuditSummary.warnings} warning(s))`);
  info(`Comparison audit: ${payload.comparisonAuditSummary.status} (${payload.comparisonAuditSummary.failures} failure(s), ${payload.comparisonAuditSummary.warnings} warning(s))`);
  console.log();

  if (
    payload.profileOnly.length === 0
    && payload.comparisonOnly.length === 0
    && payload.metadataChanged.length === 0
    && payload.idConflicts.length === 0
  ) {
    console.log("Profiles match by category, normalized text, id, source, and createdAt metadata.");
  }

  if (payload.profileOnly.length > 0) {
    console.log("Profile-only entries:");
    for (const entry of payload.profileOnly) {
      console.log(`- ${entry.id}: [${entry.category}] ${entry.textPreview}`);
    }
    console.log();
  }

  if (payload.comparisonOnly.length > 0) {
    console.log("Comparison-only entries:");
    for (const entry of payload.comparisonOnly) {
      console.log(`- ${entry.id}: [${entry.category}] ${entry.textPreview}`);
    }
    console.log();
  }

  if (payload.metadataChanged.length > 0) {
    console.log("Metadata changes:");
    for (const item of payload.metadataChanged) {
      console.log(`- ${item.profile.id}: ${item.changedFields.join(", ")}`);
      console.log(`  ${dim(`profile ${item.profile.source} · ${item.profile.createdAt}`)}`);
      console.log(`  ${dim(`comparison ${item.comparison.source} · ${item.comparison.createdAt}`)}`);
    }
    console.log();
  }

  if (payload.idConflicts.length > 0) {
    console.log("ID conflicts:");
    for (const item of payload.idConflicts) {
      console.log(`- ${item.id}`);
      console.log(`  profile: [${item.profile.category}] ${item.profile.textPreview}`);
      console.log(`  comparison: [${item.comparison.category}] ${item.comparison.textPreview}`);
    }
    console.log();
  }

  if (payload.recommendations.length > 0) {
    console.log("Recommendations:");
    for (const recommendation of payload.recommendations) {
      console.log(`- ${recommendation.level}: ${recommendation.text}`);
    }
    console.log();
  }

  console.log("No changes made. Use `design-ai learn --import --dry-run` if comparison-only entries should be added.");
}

function printRestore(payload) {
  header("design-ai learn", payload.dryRun ? "Learning restore preview" : "Learning restore applied");
  info(`File: ${payload.file}`);
  info(`Source: ${payload.source}`);
  info(`Restorable: ${payload.restorable ? "yes" : "no"}`);
  info(`Previous entries: ${payload.previousCount}`);
  info(`Restored entries: ${payload.restoredCount}`);
  info(`${payload.dryRun ? "Would remove" : "Removed"}: ${payload.removedCount}`);
  info(`${payload.dryRun ? "Would add" : "Added"}: ${payload.addedCount}`);
  info(`Metadata changes: ${payload.metadataChangedCount}`);
  info(`ID conflicts: ${payload.idConflictCount}`);
  info(`${payload.dryRun ? "Rollback backup target" : "Rollback backup"}: ${payload.backupFile}`);
  info(`Backup created: ${payload.backupCreated ? "yes" : "no"}`);
  info(`Restore audit: ${payload.auditSummary.status} (${payload.auditSummary.failures} failure(s), ${payload.auditSummary.warnings} warning(s))`);
  console.log();

  if (payload.issues.length > 0) {
    console.log("Restore source issues:");
    for (const issue of payload.issues) {
      const entry = issue.entryId ? ` (${issue.entryId})` : "";
      console.log(`- ${issue.level.toUpperCase()} ${issue.code}${entry}: ${issue.message}`);
    }
    console.log();
  }

  if (!payload.restorable) {
    console.log("No changes made. Fix the restore source audit failures before applying restore.");
    return;
  }

  if (payload.diff.profileOnly.length > 0) {
    console.log(payload.dryRun ? "Entries that would be removed:" : "Removed entries:");
    for (const entry of payload.diff.profileOnly) {
      console.log(`- ${entry.id}: [${entry.category}] ${entry.textPreview}`);
    }
    console.log();
  }

  if (payload.diff.comparisonOnly.length > 0) {
    console.log(payload.dryRun ? "Entries that would be added:" : "Added entries:");
    for (const entry of payload.diff.comparisonOnly) {
      console.log(`- ${entry.id}: [${entry.category}] ${entry.textPreview}`);
    }
    console.log();
  }

  if (payload.idConflictCount > 0) {
    console.log("ID conflicts:");
    for (const item of payload.diff.idConflicts) {
      console.log(`- ${item.id}`);
      console.log(`  active: [${item.profile.category}] ${item.profile.textPreview}`);
      console.log(`  restore: [${item.comparison.category}] ${item.comparison.textPreview}`);
    }
    console.log();
  }

  if (payload.dryRun) {
    console.log("No changes made. Re-run with `--yes` instead of `--dry-run` to replace the active learning profile.");
    console.log(`Rollback backup will be written before apply: ${payload.backupFile}`);
  } else {
    console.log(`Rollback preview: ${payload.rollbackCommand}`);
  }
}

function printRestoreBackups(payload) {
  header("design-ai learn", "Learning restore rollback backups");
  info(`File: ${payload.file}`);
  info(`Directory: ${payload.directory}`);
  info(`Pattern: ${payload.pattern}`);
  info(`Backups: ${payload.count}/${payload.totalCount}`);
  info(`Limit: ${payload.limit}`);
  console.log();

  if (payload.backups.length === 0) {
    console.log("No restore rollback backups found for this learning profile.");
    console.log("Confirmed `design-ai learn --restore --yes` runs create sibling rollback backups automatically.");
    return;
  }

  for (let i = 0; i < payload.backups.length; i += 1) {
    const backup = payload.backups[i];
    console.log(`${i + 1}. ${backup.name}`);
    console.log(`   ${dim(`created ${backup.createdAt || "unknown"} · modified ${backup.modifiedAt} · ${backup.sizeBytes} bytes`)}`);
    console.log(`   ${dim(`entries ${backup.entryCount} · updatedAt ${backup.updatedAt || "unknown"} · audit ${backup.auditSummary.status} (${backup.auditSummary.failures} failure(s), ${backup.auditSummary.warnings} warning(s))`)}`);
    if (backup.issueCount > 0) {
      console.log(`   ${dim(`issues ${backup.issueCount}`)}`);
    }
    console.log(`   Preview: ${backup.restorePreviewCommand}`);
  }

  console.log();
  console.log("No changes made. Run the preview command first, then add `--yes` only after reviewing the restore diff.");
}

function printRestoreBackupPrune(payload) {
  const prune = payload.prune;
  header("design-ai learn", prune.dryRun ? "Learning restore backup prune preview" : "Learning restore backup prune applied");
  info(`File: ${payload.file}`);
  info(`Directory: ${payload.directory}`);
  info(`Pattern: ${payload.pattern}`);
  info(`Backups: ${payload.totalCount}`);
  info(`Keep newest: ${prune.keep}`);
  info(`Prune candidates: ${prune.candidateCount}`);
  if (!prune.dryRun) {
    info(`Deleted: ${prune.deletedCount}`);
    if (prune.failureCount > 0) {
      info(`Failures: ${prune.failureCount}`);
    }
  }
  console.log();

  if (prune.candidateCount === 0) {
    console.log("No restore rollback backups are old enough to prune.");
    console.log("No changes made.");
    return;
  }

  const candidateLabel = prune.dryRun ? "Would delete:" : "Deleted:";
  const rows = prune.dryRun ? prune.candidates : prune.deleted;
  console.log(candidateLabel);
  for (const backup of rows) {
    console.log(`- ${backup.name}`);
    console.log(`  ${dim(`created ${backup.createdAt || "unknown"} · modified ${backup.modifiedAt} · ${backup.sizeBytes} bytes · audit ${backup.auditSummary.status}`)}`);
  }

  if (prune.failures.length > 0) {
    console.log();
    console.log("Delete failures:");
    for (const failure of prune.failures) {
      console.log(`- ${failure.name}: ${failure.message}`);
    }
  }

  console.log();
  if (prune.dryRun) {
    console.log("No changes made. Re-run with `--yes` after reviewing the prune candidates.");
  } else if (prune.failureCount > 0) {
    console.log("Some backup files could not be deleted. Review the failure list before retrying.");
  } else {
    console.log("Prune complete. Active learning profile was not changed.");
  }
}

function printEval(payload) {
  header("design-ai learn", "Local learning eval report");
  info(`File: ${payload.file}`);
  info(`Checkpoint: ${payload.source}`);
  info(`Status: ${payload.status}`);
  info(`Cases: ${payload.caseCount}`);
  info(`Passed: ${payload.passed}`);
  info(`Warned: ${payload.warned}`);
  info(`Failed: ${payload.failed}`);
  info(`Profile entries: ${payload.profileEntryCount}`);
  info(`Default limit: ${payload.defaultLimit}`);
  if (payload.defaultCategory) info(`Default category: ${payload.defaultCategory}`);
  console.log();

  for (const item of payload.cases) {
    const route = item.routeId ? ` / ${item.routeId}` : "";
    const category = item.category ? ` / ${item.category}` : "";
    console.log(`- ${item.id}${route}${category}: ${item.status}`);
    console.log(`  ${dim(`briefHash ${item.briefHash} · matched ${item.matchedCount}/${item.candidateCount} · selected ${item.selectedEntryIds.join(", ") || "none"} · fallback ${item.fallbackCount}`)}`);
    if (item.missingExpectedIds.length > 0) {
      console.log(`  missing expected: ${item.missingExpectedIds.join(", ")}`);
    }
    if (item.unexpectedAvoidedIds.length > 0) {
      console.log(`  avoided selected: ${item.unexpectedAvoidedIds.join(", ")}`);
    }
    for (const issue of item.issues) {
      console.log(`  ${issue.level.toUpperCase()} ${issue.code}: ${issue.message}`);
    }
  }

  if (payload.recommendations.length > 0) {
    console.log();
    console.log("Recommendations:");
    for (const recommendation of payload.recommendations) {
      console.log(`- ${recommendation.level}: ${recommendation.text}`);
    }
  }

  console.log();
  console.log("Privacy: eval reports expose brief hashes and selected ids, not raw brief text.");
}

function printEvalTemplate(payload) {
  header("design-ai learn", "Learning eval checkpoint template");
  info(`File: ${payload.sourceProfile.file}`);
  info(`Profile entries: ${payload.sourceProfile.entryCount}`);
  info(`Cases: ${payload.caseCount}`);
  info(`Limit: ${payload.sourceProfile.limit}`);
  if (payload.sourceProfile.category) info(`Category: ${payload.sourceProfile.category}`);
  if (payload.sourceProfile.query) info(`Query: ${payload.sourceProfile.query}`);
  console.log();

  if (payload.cases.length === 0) {
    console.log("No checkpoint cases generated.");
  } else {
    console.log("Generated cases:");
    for (const item of payload.cases) {
      const category = item.category ? ` / ${item.category}` : "";
      console.log(`- ${item.id}${category}: expects ${item.expectedSelectedIds.join(", ")}`);
    }
  }

  if (payload.recommendations.length > 0) {
    console.log();
    console.log("Recommendations:");
    for (const recommendation of payload.recommendations) {
      console.log(`- ${recommendation.level}: ${recommendation.text}`);
    }
  }

  console.log();
  console.log("Privacy: checkpoint templates store raw brief text so they can be re-run locally. Review before sharing.");
}

function applyEvalStrictExit(parsed, payload) {
  if (parsed.strict && payload.status !== "pass") {
    process.exitCode = 1;
  }
}

function applySignalsStrictExit(parsed, payload) {
  if (
    parsed.strict
    && (payload.status !== "pass" || payload.agentDevelopment?.status !== "pass")
  ) {
    process.exitCode = 1;
  }
}

function applySkillProposalsStrictExit(parsed, payload) {
  if (parsed.strict && payload.status !== "pass") {
    process.exitCode = 1;
  }
}

function printInit(payload) {
  header("design-ai learn", payload.dryRun ? "Learning profile init preview" : "Learning profile init applied");
  info(`File: ${payload.file}`);
  info(`Candidates: ${payload.candidateCount}`);
  info(`Added: ${payload.addedCount}`);
  info(`Skipped: ${payload.skippedCount}`);
  info(`Entries: ${payload.count}`);
  console.log();

  if (payload.entries.length > 0) {
    console.log(payload.dryRun ? "Would add:" : "Added:");
    for (const entry of payload.entries) {
      console.log(`- [${entry.category}] ${entry.text}`);
    }
  } else {
    console.log("No starter learning entries to add.");
  }

  if (payload.skipped.length > 0) {
    console.log();
    console.log("Skipped:");
    for (const skipped of payload.skipped) {
      console.log(`- [${skipped.category}] ${skipped.reason}: ${skipped.textPreview}`);
    }
  }

  if (payload.dryRun) {
    console.log();
    console.log("No changes made. Re-run with `--yes` to create the starter learning profile.");
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

function printOrWriteContent(parsed, content) {
  if (parsed.outPath) {
    const written = writeOutputFile({
      outPath: parsed.outPath,
      content,
      force: parsed.force,
    });
    success(`Wrote ${written}`);
    return;
  }

  console.log(content.trimEnd());
}

function printOrWriteJson(parsed, payload) {
  printOrWriteContent(parsed, `${formatLearningJson(payload)}\n`);
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
      printOrWriteJson(parsed, payload);
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
      printOrWriteJson(parsed, payload);
      return;
    }

    success(`Recorded feedback ${result.entry.id}`);
    info(`File: ${result.file}`);
    info(`Outcome: ${parsed.feedbackOutcome}`);
    info(`Category: ${result.entry.category}`);
    return;
  }

  if (parsed.action === "init") {
    const payload = initializeLearningProfile({
      filePath: parsed.filePath,
      dryRun: parsed.dryRun || !parsed.yes,
    });

    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    printInit(payload);
    return;
  }

  if (parsed.action === "export") {
    const filter = learningFilter(parsed);
    const context = buildLearningContext({
      filePath: parsed.filePath,
      category: filter.category,
      query: filter.query,
      limit: filter.limit || 12,
      includeFallback: false,
    });
    printOrWriteContent(
      parsed,
      parsed.json ? `${formatLearningJson(context)}\n` : `${context.markdown}\n`,
    );
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
      printOrWriteJson(parsed, payload);
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
      printOrWriteJson(parsed, payload);
      return;
    }

    header("design-ai learn", "Learning profile backup");
    info(`File: ${payload.file}`);
    info(`Entries: ${payload.count}`);
    info(`Audit: ${payload.auditSummary.status} (${payload.auditSummary.failures} failure(s), ${payload.auditSummary.warnings} warning(s))`);
    info(`Exported: ${payload.exportedAt}`);
    console.log();
    console.log("Run `design-ai learn --backup --json --out learning-backup.json` to save a full portable JSON backup.");
    return;
  }

  if (parsed.action === "redact") {
    const hasInputSource = parsed.fromFile || parsed.stdin;
    const payload = hasInputSource
      ? buildRedactedLearningBackup({
        importText: readLearningInput(parsed),
        source: parsed.fromFile ? path.resolve(parsed.fromFile) : "stdin",
      })
      : buildRedactedLearningBackup({ filePath: parsed.filePath });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    header("design-ai learn", "Redacted learning profile backup");
    info(`File: ${payload.file}`);
    info(`Entries: ${payload.count}`);
    info(`Redacted entries: ${payload.redactedCount}`);
    info(`Source audit: ${payload.sourceAuditSummary.status} (${payload.sourceAuditSummary.failures} failure(s), ${payload.sourceAuditSummary.warnings} warning(s))`);
    info(`Redacted audit: ${payload.auditSummary.status} (${payload.auditSummary.failures} failure(s), ${payload.auditSummary.warnings} warning(s))`);
    info(`Exported: ${payload.exportedAt}`);
    console.log();
    if (payload.redactions.length === 0) {
      console.log("No sensitive-looking learning text was redacted. No changes made.");
    } else {
      console.log("Redacted:");
      for (const redaction of payload.redactions) {
        console.log(`- ${redaction.entryId}: ${redaction.codes.join(", ")}`);
      }
      console.log();
      console.log("No changes made. Run `design-ai learn --redact --json --out learning-redacted.json` to save the redacted portable JSON.");
    }
    return;
  }

  if (parsed.action === "verify") {
    const payload = verifyLearningImportPayload({
      importText: readLearningInput(parsed),
      source: parsed.fromFile ? path.resolve(parsed.fromFile) : "stdin",
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    printLearningImportVerification(payload);
    return;
  }

  if (parsed.action === "diff") {
    const payload = diffLearningProfiles({
      filePath: parsed.filePath,
      compareText: readLearningInput(parsed),
      source: parsed.fromFile ? path.resolve(parsed.fromFile) : "stdin",
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    printDiff(payload);
    return;
  }

  if (parsed.action === "restore") {
    const payload = restoreLearningProfile({
      filePath: parsed.filePath,
      backupFilePath: parsed.backupFilePath,
      forceBackup: parsed.force,
      restoreText: readLearningInput(parsed),
      source: parsed.fromFile ? path.resolve(parsed.fromFile) : "stdin",
      dryRun: parsed.dryRun || !parsed.yes,
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    printRestore(payload);
    return;
  }

  if (parsed.action === "restore-backups") {
    const payload = parsed.prune
      ? pruneLearningRestoreBackups({
        filePath: parsed.filePath,
        keep: parsed.keep || 5,
        limit: parsed.limit || 10,
        dryRun: parsed.dryRun || !parsed.yes,
      })
      : listLearningRestoreBackups({
        filePath: parsed.filePath,
        limit: parsed.limit || 10,
      });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    if (parsed.prune) {
      printRestoreBackupPrune(payload);
    } else {
      printRestoreBackups(payload);
    }
    return;
  }

  if (parsed.action === "list") {
    const payload = listPayload(parsed.filePath, parsed);
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
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
        printOrWriteJson(parsed, payload);
        return;
      }
      printAuditFix(payload);
      return;
    }

    const payload = auditLearningProfile({ filePath: parsed.filePath });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }
    printAudit(payload);
    return;
  }

  if (parsed.action === "curate") {
    const dryRun = parsed.dryRun || !parsed.yes;
    if (!dryRun) assertConfirmed(parsed, "apply learning curation to");
    const payload = applyLearningCurationPlan({
      filePath: parsed.filePath,
      usageFile: parsed.usageFilePath,
      dryRun,
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }
    if (parsed.report) {
      printOrWriteContent(parsed, renderLearningCurationReport(payload));
      return;
    }
    printCuration(payload);
    return;
  }

  if (parsed.action === "stats") {
    const payload = learningStats({ filePath: parsed.filePath });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }
    printStats(payload);
    return;
  }

  if (parsed.action === "usage") {
    const payload = learningUsageStats({
      filePath: parsed.filePath,
      usageFile: parsed.usageFilePath,
      limit: parsed.limit || 10,
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }
    printUsage(payload);
    return;
  }

  if (parsed.action === "signals") {
    const payload = learningSignalRegistry({
      filePath: parsed.filePath,
      usageFile: parsed.usageFilePath,
      signalSource: parsed.fromFile,
      root: process.cwd(),
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      applySignalsStrictExit(parsed, payload);
      return;
    }
    printSignals(payload);
    applySignalsStrictExit(parsed, payload);
    return;
  }

  if (parsed.action === "propose-skills") {
    const payload = buildSkillEvolutionProposals({
      filePath: parsed.filePath,
      usageFile: parsed.usageFilePath,
      reviewFile: parsed.reviewFilePath,
      signalSource: parsed.fromFile,
      root: process.cwd(),
      minEvidenceCount: parsed.minEvidenceCount || undefined,
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      applySkillProposalsStrictExit(parsed, payload);
      return;
    }
    if (parsed.report) {
      printOrWriteContent(parsed, renderSkillEvolutionProposalReport(payload));
      applySkillProposalsStrictExit(parsed, payload);
      return;
    }
    if (parsed.reviewTemplate) {
      printOrWriteContent(parsed, renderSkillProposalReviewTemplate(payload));
      applySkillProposalsStrictExit(parsed, payload);
      return;
    }
    if (parsed.patch) {
      printOrWriteContent(parsed, renderSkillEvolutionProposalPatch(payload));
      applySkillProposalsStrictExit(parsed, payload);
      return;
    }
    printSkillProposals(payload);
    applySkillProposalsStrictExit(parsed, payload);
    return;
  }

  if (parsed.action === "eval-template") {
    const payload = buildLearningEvalTemplate({
      filePath: parsed.filePath,
      query: parsed.query,
      category: parsed.categorySpecified ? parsed.category : "",
      limit: parsed.limit || 6,
    });
    if (parsed.json || parsed.outPath) {
      printOrWriteJson(parsed, payload);
      return;
    }
    printEvalTemplate(payload);
    return;
  }

  if (parsed.action === "eval") {
    const payload = learningEvalReport({
      filePath: parsed.filePath,
      evalText: readLearningInput(parsed),
      source: parsed.fromFile ? path.resolve(parsed.fromFile) : "stdin",
      limit: parsed.limit || 12,
      category: parsed.categorySpecified ? parsed.category : "",
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      applyEvalStrictExit(parsed, payload);
      return;
    }
    printEval(payload);
    applyEvalStrictExit(parsed, payload);
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
      printOrWriteJson(parsed, payload);
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
      printOrWriteJson(parsed, payload);
      return;
    }

    success(`Cleared ${result.removedCount} learning entr${result.removedCount === 1 ? "y" : "ies"}`);
    info(`File: ${result.file}`);
    return;
  }

  throw new Error(`Unsupported learn action: ${parsed.action}`);
}
