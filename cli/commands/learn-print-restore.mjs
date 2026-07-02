// Human-readable output for learn diff/restore/eval/init results and strict exits.

import { dim, header, info } from "../lib/log.mjs";

export function printDiff(payload) {
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

export function printRestore(payload) {
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

export function printRestoreBackups(payload) {
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

export function printRestoreBackupPrune(payload) {
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

export function printEval(payload) {
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

export function printEvalTemplate(payload) {
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

export function applyEvalStrictExit(parsed, payload) {
  if (parsed.strict && payload.status !== "pass") {
    process.exitCode = 1;
  }
}

export function applySignalsStrictExit(parsed, payload) {
  if (
    parsed.strict
    && (payload.status !== "pass" || payload.agentDevelopment?.status !== "pass")
  ) {
    process.exitCode = 1;
  }
}

export function applyAgentBacklogStrictExit(parsed, payload) {
  if (parsed.strict && (payload.status !== "pass" || payload.signalStatus === "fail")) {
    process.exitCode = 1;
  }
}

export function applySkillProposalsStrictExit(parsed, payload) {
  if (parsed.strict && payload.status !== "pass") {
    process.exitCode = 1;
  }
}

export function printInit(payload) {
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
