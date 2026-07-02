// Human-readable output for learn profile list/audit/curation/stats/usage results.

import {
  LEARNING_CATEGORIES,
  loadLearningProfile,
  selectLearningEntrySet,
} from "../lib/learn.mjs";
import { dim, header, info } from "../lib/log.mjs";

export function printLearningImportVerification(payload) {
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

export function learningFilter(parsed) {
  return {
    category: parsed.categorySpecified ? parsed.category : "",
    limit: parsed.limit,
    query: parsed.query,
  };
}

export function listPayload(filePath, parsed) {
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

export function printList(payload) {
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

export function printAudit(payload) {
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

export function printAuditFix(payload) {
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

export function printCuration(payload) {
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

export function printStats(payload) {
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

export function printUsage(payload) {
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
