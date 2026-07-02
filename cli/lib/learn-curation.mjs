// Learning archive and curation flow for `design-ai learn`.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { normalizeCategory } from "./learn-args.mjs";
import { auditLearningProfile, loadLearningProfile } from "./learn-profile.mjs";
import {
  defaultLearningFile,
  defaultLearningUsageFile,
  previewText,
  writeLearningProfile,
} from "./learn-shared.mjs";
import { learningUsageStats } from "./learn-usage.mjs";

export function defaultLearningArchiveFile(filePath = defaultLearningFile()) {
  const parsed = path.parse(filePath);
  const ext = parsed.ext || ".json";
  const base = parsed.ext ? parsed.name : parsed.base;
  return path.join(parsed.dir || ".", `${base}.archive${ext}`);
}

export function emptyLearningArchive(sourceFile = defaultLearningFile()) {
  return {
    version: 1,
    updatedAt: "",
    sourceFile,
    entries: [],
  };
}

function normalizeLearningArchive(rawArchive, { sourceFile = defaultLearningFile() } = {}) {
  const archive = emptyLearningArchive(sourceFile);
  if (!rawArchive || typeof rawArchive !== "object" || Array.isArray(rawArchive)) {
    return archive;
  }

  archive.version = Number.isInteger(rawArchive.version) ? rawArchive.version : 1;
  archive.updatedAt = String(rawArchive.updatedAt || "").trim();
  archive.sourceFile = String(rawArchive.sourceFile || sourceFile).trim() || sourceFile;
  archive.entries = Array.isArray(rawArchive.entries)
    ? rawArchive.entries
      .filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry))
      .map((entry) => {
        let category = "other";
        try {
          category = normalizeCategory(entry.category || "other");
        } catch {
          category = "other";
        }
        return {
          id: String(entry.id || "").trim(),
          category,
          text: String(entry.text || "").trim(),
          source: String(entry.source || "archive").trim() || "archive",
          createdAt: String(entry.createdAt || "").trim(),
          archivedAt: String(entry.archivedAt || "").trim(),
          archiveReason: String(entry.archiveReason || "curation").trim() || "curation",
          issueCodes: Array.isArray(entry.issueCodes)
            ? entry.issueCodes.map((code) => String(code || "").trim()).filter(Boolean)
            : [],
          originalFile: String(entry.originalFile || sourceFile).trim() || sourceFile,
        };
      })
      .filter((entry) => entry.id && entry.text)
    : [];
  return archive;
}

export function loadLearningArchive(archiveFile = defaultLearningArchiveFile(), {
  sourceFile = defaultLearningFile(),
} = {}) {
  if (!existsSync(archiveFile)) return emptyLearningArchive(sourceFile);
  const raw = readFileSync(archiveFile, "utf8");
  try {
    return normalizeLearningArchive(JSON.parse(raw), { sourceFile });
  } catch {
    throw new Error(`Learning archive is not valid JSON: ${archiveFile}`);
  }
}

function writeLearningArchive(archiveFile, archive) {
  mkdirSync(path.dirname(archiveFile), { recursive: true });
  writeFileSync(archiveFile, `${JSON.stringify(archive, null, 2)}\n`, "utf8");
}

function learningCurationIssueAction(issue, { ambiguousEntryIds = new Set() } = {}) {
  if (!issue.entryId) {
    return {
      action: "manual-review",
      reason: "profile-level-issue",
    };
  }
  if (ambiguousEntryIds.has(issue.entryId)) {
    return {
      action: "manual-review",
      reason: "ambiguous-entry-id",
    };
  }
  if (issue.code === "duplicate-entry-text") {
    return {
      action: "archive",
      reason: "duplicate-entry",
    };
  }
  if (issue.code.startsWith("sensitive-")) {
    return {
      action: "archive",
      reason: "sensitive-content",
    };
  }
  return {
    action: "manual-review",
    reason: issue.level === "failure" ? "manual-profile-repair" : "manual-quality-review",
  };
}

function issueIsHigherPriority(nextAction, currentAction) {
  if (!currentAction) return true;
  if (nextAction.action === "archive" && currentAction.action !== "archive") return true;
  return false;
}

function buildCurationProposal({ entry, issue, issueAction, existing }) {
  const currentAction = existing
    ? { action: existing.action, reason: existing.reason }
    : null;
  const nextAction = issueIsHigherPriority(issueAction, currentAction)
    ? issueAction
    : currentAction;
  const issueCodes = existing?.issueCodes || [];
  if (!issueCodes.includes(issue.code)) issueCodes.push(issue.code);

  const messages = existing?.messages || [];
  if (issue.message && !messages.includes(issue.message)) messages.push(issue.message);

  return {
    entryId: issue.entryId || "",
    action: nextAction.action,
    reason: nextAction.reason,
    issueCodes,
    messages,
    ...(entry ? {
      category: entry.category,
      source: entry.source,
      createdAt: entry.createdAt,
      textPreview: previewText(entry.text),
    } : {}),
  };
}

function learningUsageReviewItem({ level, action, reason, entryId, usageCount = 0, entry = null, message }) {
  return {
    level,
    action,
    reason,
    entryId,
    usageCount,
    message,
    ...(entry ? {
      category: entry.category,
      source: entry.source,
      createdAt: entry.createdAt,
      textPreview: previewText(entry.text),
    } : {}),
  };
}

function emptyLearningUsageCurationReview({
  filePath,
  usageFile,
  exists = false,
  profileFile = "",
  profileFileMatches = true,
  error = "",
}) {
  return {
    file: path.resolve(filePath),
    usageFile: path.resolve(usageFile),
    profileFile: profileFile ? path.resolve(profileFile) : path.resolve(filePath),
    profileFileMatches,
    exists,
    eventCount: 0,
    usedEntryCount: 0,
    unusedEntryCount: 0,
    staleSelectedEntryCount: 0,
    reviewCount: 0,
    unusedReviewCount: 0,
    staleReviewCount: 0,
    reviews: [],
    recommendations: [],
    error,
    privacy: {
      storesRawBriefText: false,
      storesBriefHash: true,
      storesSelectedEntryIds: true,
    },
    autoArchive: false,
  };
}

function learningUsageCurationReview({
  filePath = defaultLearningFile(),
  usageFile = defaultLearningUsageFile(filePath),
} = {}) {
  const resolvedFile = path.resolve(filePath);
  const resolvedUsageFile = path.resolve(usageFile);

  try {
    const stats = learningUsageStats({
      filePath: resolvedFile,
      usageFile: resolvedUsageFile,
      limit: 10,
    });
    const statsProfileFile = stats.profileFile ? path.resolve(stats.profileFile) : resolvedFile;
    const profileFileMatches = statsProfileFile === resolvedFile;

    if (!stats.exists) {
      return {
        ...emptyLearningUsageCurationReview({
          filePath: resolvedFile,
          usageFile: resolvedUsageFile,
          profileFile: statsProfileFile,
          profileFileMatches,
          exists: false,
        }),
        recommendations: stats.recommendations || [],
      };
    }

    const profile = loadLearningProfile(resolvedFile);
    const entriesById = new Map(profile.entries.map((entry) => [entry.id, entry]));
    const reviews = [];
    const recommendations = [...(stats.recommendations || [])];

    if (!profileFileMatches) {
      reviews.push(learningUsageReviewItem({
        level: "warning",
        action: "review-usage-sidecar",
        reason: "usage-profile-file-mismatch",
        entryId: "",
        usageCount: stats.eventCount,
        message: "Usage sidecar was recorded for a different learning profile path.",
      }));
      recommendations.push({
        level: "warning",
        text: "Usage sidecar profile path differs from the active learning profile.",
      });
    }

    for (const entryId of stats.staleSelectedEntryIds || []) {
      reviews.push(learningUsageReviewItem({
        level: "warning",
        action: "review-usage-sidecar",
        reason: "stale-selected-entry-id",
        entryId,
        usageCount: stats.selectedEntryCounts?.[entryId] || 0,
        message: "Usage sidecar selected an entry id that is no longer present in the active learning profile.",
      }));
    }

    if (stats.eventCount > 0) {
      for (const entryId of stats.unusedEntryIds || []) {
        const entry = entriesById.get(entryId);
        if (!entry) continue;
        reviews.push(learningUsageReviewItem({
          level: "info",
          action: "manual-review",
          reason: stats.eventCount >= 5
            ? "unused-in-observed-usage"
            : "unused-with-limited-history",
          entryId,
          entry,
          message: "Active entry has not been selected in recorded prompt/pack usage; review manually before archiving.",
        }));
      }
    }

    const unusedReviewCount = reviews.filter((review) => review.reason.startsWith("unused-")).length;
    const staleReviewCount = reviews.filter((review) => review.reason === "stale-selected-entry-id").length;

    return {
      file: stats.file,
      usageFile: stats.usageFile,
      profileFile: statsProfileFile,
      profileFileMatches,
      exists: true,
      eventCount: stats.eventCount,
      usedEntryCount: stats.usedEntryCount,
      unusedEntryCount: stats.unusedEntryCount,
      staleSelectedEntryCount: stats.staleSelectedEntryCount,
      reviewCount: reviews.length,
      unusedReviewCount,
      staleReviewCount,
      reviews,
      recommendations,
      error: "",
      privacy: stats.privacy || {
        storesRawBriefText: false,
        storesBriefHash: true,
        storesSelectedEntryIds: true,
      },
      autoArchive: false,
    };
  } catch (error) {
    return emptyLearningUsageCurationReview({
      filePath: resolvedFile,
      usageFile: resolvedUsageFile,
      exists: existsSync(resolvedUsageFile),
      error: error?.message || String(error),
    });
  }
}

export function buildLearningCurationPlan({
  filePath = defaultLearningFile(),
  archiveFile = defaultLearningArchiveFile(filePath),
  usageFile = defaultLearningUsageFile(filePath),
} = {}) {
  const audit = auditLearningProfile({ filePath });
  const payload = {
    file: filePath,
    archiveFile,
    usage: learningUsageCurationReview({ filePath, usageFile }),
    before: audit.summary,
    proposalCount: 0,
    archiveCount: 0,
    manualReviewCount: 0,
    proposals: [],
    skipped: [],
    count: audit.count,
  };

  if (!audit.exists) {
    payload.skipped.push({
      reason: "profile-missing",
      message: "No local learning profile exists yet.",
    });
    return payload;
  }

  if (audit.summary.failures > 0) {
    payload.skipped.push({
      reason: "profile-has-failures",
      message: "Repair failing learning profile issues before automated curation.",
    });
    return payload;
  }

  const profile = loadLearningProfile(filePath);
  const entriesById = new Map(profile.entries.map((entry) => [entry.id, entry]));
  const ambiguousEntryIds = new Set(
    audit.issues
      .filter((issue) => issue.code === "duplicate-entry-id" && issue.entryId)
      .map((issue) => issue.entryId),
  );
  const proposalsByEntryId = new Map();

  for (const issue of audit.issues) {
    const issueAction = learningCurationIssueAction(issue, { ambiguousEntryIds });
    const entry = issue.entryId ? entriesById.get(issue.entryId) : null;
    if (issue.entryId && !entry) {
      payload.skipped.push({
        entryId: issue.entryId,
        issueCode: issue.code,
        reason: "entry-not-found",
        message: "The audited entry was not present in the normalized learning profile.",
      });
      continue;
    }

    const key = issue.entryId || `profile:${issue.code}`;
    const proposal = buildCurationProposal({
      entry,
      issue,
      issueAction,
      existing: proposalsByEntryId.get(key),
    });
    proposalsByEntryId.set(key, proposal);
  }

  payload.proposals = [...proposalsByEntryId.values()];
  payload.proposalCount = payload.proposals.length;
  payload.archiveCount = payload.proposals.filter((proposal) => proposal.action === "archive").length;
  payload.manualReviewCount = payload.proposals.filter((proposal) => proposal.action === "manual-review").length;
  return payload;
}

export function applyLearningCurationPlan({
  filePath = defaultLearningFile(),
  archiveFile = defaultLearningArchiveFile(filePath),
  usageFile = defaultLearningUsageFile(filePath),
  dryRun = true,
  now = new Date(),
} = {}) {
  const plan = buildLearningCurationPlan({ filePath, archiveFile, usageFile });
  const payload = {
    ...plan,
    dryRun,
    applied: !dryRun,
    archived: [],
    after: null,
  };

  if (dryRun || plan.archiveCount === 0) {
    return payload;
  }

  const archiveIds = new Set(
    plan.proposals
      .filter((proposal) => proposal.action === "archive")
      .map((proposal) => proposal.entryId),
  );
  const proposalByEntryId = new Map(plan.proposals.map((proposal) => [proposal.entryId, proposal]));
  const profile = loadLearningProfile(filePath);
  const archived = [];
  const remaining = [];
  const archivedAt = now.toISOString();

  for (const entry of profile.entries) {
    if (!archiveIds.has(entry.id)) {
      remaining.push(entry);
      continue;
    }

    const proposal = proposalByEntryId.get(entry.id);
    archived.push({
      id: entry.id,
      category: entry.category,
      text: entry.text,
      source: entry.source,
      createdAt: entry.createdAt,
      archivedAt,
      archiveReason: proposal?.reason || "curation",
      issueCodes: proposal?.issueCodes || [],
      originalFile: filePath,
    });
  }

  const archivedIds = new Set(archived.map((entry) => entry.id));
  for (const entryId of archiveIds) {
    if (!archivedIds.has(entryId)) {
      payload.skipped.push({
        entryId,
        reason: "entry-not-found",
        message: "The entry was not present when applying learning curation.",
      });
    }
  }

  const updatedAt = now.toISOString();
  writeLearningProfile(filePath, {
    version: 1,
    updatedAt,
    entries: remaining,
  });

  if (archived.length > 0) {
    const archive = loadLearningArchive(archiveFile, { sourceFile: filePath });
    writeLearningArchive(archiveFile, {
      version: 1,
      updatedAt,
      sourceFile: filePath,
      entries: [...archive.entries, ...archived],
    });
  }

  const afterAudit = auditLearningProfile({ filePath });
  return {
    ...payload,
    archiveCount: archived.length,
    archived,
    after: afterAudit.summary,
    count: remaining.length,
  };
}

export function clearLearning({
  filePath = defaultLearningFile(),
  now = new Date(),
} = {}) {
  const profile = loadLearningProfile(filePath);
  const updatedAt = now.toISOString();
  const nextProfile = {
    version: 1,
    updatedAt,
    entries: [],
  };

  writeLearningProfile(filePath, nextProfile);

  return {
    file: filePath,
    removedCount: profile.entries.length,
    profile: nextProfile,
  };
}

function formatLearningSummary(summary) {
  if (!summary) return "unknown";
  return `${summary.status} (${summary.failures} failure(s), ${summary.warnings} warning(s))`;
}

function yesNo(value) {
  return value ? "yes" : "no";
}

function learningReportListItem(label, value) {
  return `- ${label}: ${value}`;
}

export function renderLearningCurationReport(payload, {
  generatedAt = new Date(),
} = {}) {
  const generatedAtText = generatedAt instanceof Date ? generatedAt.toISOString() : String(generatedAt || "");
  const mode = payload.applied ? "applied" : "preview";
  const lines = [
    "# Learning Curation Report",
    "",
    learningReportListItem("Generated", generatedAtText),
    learningReportListItem("Mode", mode),
    learningReportListItem("File", payload.file),
    learningReportListItem("Archive", payload.archiveFile),
    learningReportListItem("Before", formatLearningSummary(payload.before)),
    learningReportListItem("After", payload.after ? formatLearningSummary(payload.after) : "not applied"),
    learningReportListItem("Proposals", payload.proposalCount),
    learningReportListItem("Archive candidates", payload.archiveCount),
    learningReportListItem("Manual review", payload.manualReviewCount),
    "",
    "## Archive Candidates",
    "",
  ];

  const archiveCandidates = (payload.proposals || []).filter((proposal) => proposal.action === "archive");
  if (archiveCandidates.length === 0) {
    lines.push("No archive candidates found.");
  } else {
    for (const proposal of archiveCandidates) {
      lines.push(`- \`${proposal.entryId}\`: ${proposal.reason}`);
      lines.push(`  - Issues: ${(proposal.issueCodes || []).join(", ") || "none"}`);
      if (proposal.category) lines.push(`  - Category: ${proposal.category}`);
      if (proposal.textPreview) lines.push(`  - Preview: ${proposal.textPreview}`);
    }
  }

  lines.push("", "## Manual Review", "");
  const manualCandidates = (payload.proposals || []).filter((proposal) => proposal.action === "manual-review");
  if (manualCandidates.length === 0) {
    lines.push("No profile curation items need manual review.");
  } else {
    for (const proposal of manualCandidates) {
      const label = proposal.entryId || "profile";
      lines.push(`- \`${label}\`: ${proposal.reason}`);
      lines.push(`  - Issues: ${(proposal.issueCodes || []).join(", ") || "none"}`);
      if (proposal.textPreview) lines.push(`  - Preview: ${proposal.textPreview}`);
    }
  }

  lines.push("", "## Usage Review", "");
  const usage = payload.usage || {};
  lines.push(learningReportListItem("Sidecar", usage.usageFile || "not available"));
  lines.push(learningReportListItem("Exists", yesNo(Boolean(usage.exists))));
  lines.push(learningReportListItem("Profile file", usage.profileFile || payload.file));
  lines.push(learningReportListItem("Profile file matches", yesNo(usage.profileFileMatches !== false)));
  lines.push(learningReportListItem("Events", usage.eventCount || 0));
  lines.push(learningReportListItem("Review items", usage.reviewCount || 0));
  lines.push(learningReportListItem("Auto archive from usage", yesNo(Boolean(usage.autoArchive))));
  if (usage.error) lines.push(learningReportListItem("Error", usage.error));

  if (Array.isArray(usage.reviews) && usage.reviews.length > 0) {
    lines.push("");
    for (const review of usage.reviews) {
      const label = review.entryId || "usage";
      lines.push(`- \`${label}\`: ${review.reason} (${review.action})`);
      if (review.level) lines.push(`  - Level: ${review.level}`);
      if (Number.isInteger(review.usageCount)) lines.push(`  - Usage count: ${review.usageCount}`);
      if (review.textPreview) lines.push(`  - Preview: ${review.textPreview}`);
    }
  } else {
    lines.push("");
    lines.push("No usage-based curation review items found.");
  }

  lines.push("", "## Skipped", "");
  if (!Array.isArray(payload.skipped) || payload.skipped.length === 0) {
    lines.push("No curation steps were skipped.");
  } else {
    for (const skipped of payload.skipped) {
      const label = skipped.entryId ? `\`${skipped.entryId}\`` : "profile";
      lines.push(`- ${label}: ${skipped.reason}`);
      if (skipped.message) lines.push(`  - ${skipped.message}`);
    }
  }

  lines.push("", "## Privacy", "");
  lines.push("- Report text may include learning entry previews, but usage review does not include raw prompt or pack brief text.");
  lines.push("- Usage sidecars store selected entry ids and short brief hashes; usage review remains advisory and never archives entries by itself.");

  lines.push("", "## Next Steps", "");
  if (payload.applied) {
    lines.push("- Review the archive file before sharing or deleting local learning history.");
    lines.push("- Run `design-ai learn --audit` and `design-ai workspace --strict` after curation to confirm readiness.");
  } else if ((payload.archiveCount || 0) > 0) {
    lines.push("- Review archive candidates, then rerun `design-ai learn --curate --yes` only if the proposed archive actions are correct.");
    lines.push("- Keep usage-only review items as manual signals until enough prompt/pack usage has accumulated.");
  } else {
    lines.push("- No archive action is required from this curation report.");
    lines.push("- Continue recording prompt/pack usage with `--with-learning` before making usage-based decisions.");
  }

  return `${lines.join("\n")}\n`;
}
