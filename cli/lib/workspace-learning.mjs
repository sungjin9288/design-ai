// Learning profile/usage/eval readiness reports for `design-ai workspace`.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { existsSync as retrievalIndexFileExists } from "node:fs";

import {
  corpusIndexFile,
  learningIndexFile,
  retrievalIndexStatus,
} from "./retrieval-index.mjs";
import {
  defaultLearningFile,
  defaultLearningUsageFile,
  learningEvalReport,
  learningStats,
  learningUsageStats,
  listLearningRestoreBackups,
} from "./learn.mjs";

const DEFAULT_LEARNING_EVAL_FILE = "learning-eval.json";
const DEFAULT_LEARNING_CURATION_REPORT_FILE = "learning-curation-report.md";
const DEFAULT_RESTORE_BACKUP_KEEP = 5;

export function collectLearningReport({
  filePath = defaultLearningFile(),
  learningStatsProvider = learningStats,
} = {}) {
  const resolvedFile = path.resolve(filePath);
  try {
    const stats = learningStatsProvider({ filePath: resolvedFile });
    return {
      file: stats.file || resolvedFile,
      exists: Boolean(stats.exists),
      updatedAt: stats.updatedAt || "",
      count: Number.isInteger(stats.count) ? stats.count : 0,
      categoryCounts: stats.categoryCounts || {},
      sourceCounts: stats.sourceCounts || {},
      latestEntry: stats.latestEntry || null,
      auditSummary: stats.auditSummary || { status: "pass", failures: 0, warnings: 0 },
      error: "",
    };
  } catch (error) {
    return {
      file: resolvedFile,
      exists: existsSync(resolvedFile),
      updatedAt: "",
      count: 0,
      categoryCounts: {},
      sourceCounts: {},
      latestEntry: null,
      auditSummary: { status: "fail", failures: 1, warnings: 0 },
      error: error?.message || String(error),
    };
  }
}

export function collectLearningEvalReport({
  learningFilePath = defaultLearningFile(),
  learningEvalPath = "",
  learningEvalReportProvider = learningEvalReport,
} = {}) {
  if (!learningEvalPath) return null;

  const resolvedEvalPath = path.resolve(learningEvalPath);
  const resolvedLearningFile = path.resolve(learningFilePath);
  try {
    const evalText = readFileSync(resolvedEvalPath, "utf8");
    const report = learningEvalReportProvider({
      filePath: resolvedLearningFile,
      evalText,
      source: resolvedEvalPath,
    });
    return {
      source: resolvedEvalPath,
      file: report.file,
      status: report.status,
      caseCount: report.caseCount,
      passed: report.passed,
      warned: report.warned,
      failed: report.failed,
      generatedAt: report.generatedAt || "",
      sourceProfile: report.sourceProfile || null,
      profileExists: report.profileExists,
      profileEntryCount: report.profileEntryCount,
      auditSummary: report.auditSummary,
      privacy: report.privacy,
      error: "",
    };
  } catch (error) {
    return {
      source: resolvedEvalPath,
      file: resolvedLearningFile,
      status: "fail",
      caseCount: 0,
      passed: 0,
      warned: 0,
      failed: 0,
      generatedAt: "",
      sourceProfile: null,
      profileExists: existsSync(resolvedLearningFile),
      profileEntryCount: 0,
      auditSummary: { status: "fail", failures: 1, warnings: 0 },
      privacy: {
        storesRawBriefText: false,
        storesBriefHash: true,
        exposesMatchedTokens: false,
      },
      error: error?.message || String(error),
    };
  }
}

export function assessLearningRestoreBackupReadiness({
  totalCount = 0,
  keep = DEFAULT_RESTORE_BACKUP_KEEP,
  error = "",
} = {}) {
  if (error) {
    return {
      status: "fail",
      reason: "restore-backup-inventory-error",
      keep,
      totalCount,
      pruneCandidateCount: 0,
    };
  }

  if (totalCount <= 0) {
    return {
      status: "unknown",
      reason: "no restore rollback backups found",
      keep,
      totalCount,
      pruneCandidateCount: 0,
    };
  }

  const pruneCandidateCount = Math.max(0, totalCount - keep);
  if (pruneCandidateCount > 0) {
    return {
      status: "warn",
      reason: `${pruneCandidateCount} older restore rollback backup(s) can be pruned`,
      keep,
      totalCount,
      pruneCandidateCount,
    };
  }

  return {
    status: "pass",
    reason: "",
    keep,
    totalCount,
    pruneCandidateCount,
  };
}

export function collectLearningRestoreBackupsReport({
  learningFilePath = defaultLearningFile(),
  limit = DEFAULT_RESTORE_BACKUP_KEEP,
  keep = DEFAULT_RESTORE_BACKUP_KEEP,
  learningRestoreBackupsProvider = listLearningRestoreBackups,
} = {}) {
  const resolvedLearningFile = path.resolve(learningFilePath);

  try {
    const inventory = learningRestoreBackupsProvider({
      filePath: resolvedLearningFile,
      limit,
    });
    const totalCount = Number.isInteger(inventory.totalCount) ? inventory.totalCount : 0;
    if (totalCount <= 0) return null;

    const backups = Array.isArray(inventory.backups) ? inventory.backups : [];
    const readiness = assessLearningRestoreBackupReadiness({ totalCount, keep });

    return {
      file: inventory.file || resolvedLearningFile,
      directory: inventory.directory || path.dirname(resolvedLearningFile),
      pattern: inventory.pattern || "",
      generatedAt: inventory.generatedAt || "",
      limit: Number.isInteger(inventory.limit) ? inventory.limit : limit,
      totalCount,
      count: Number.isInteger(inventory.count) ? inventory.count : backups.length,
      latestBackup: backups[0] || null,
      backups,
      readiness,
      privacy: inventory.privacy || {
        storesRawBriefText: false,
        exposesEntryTextPreview: false,
        mutatesProfile: false,
      },
      error: "",
    };
  } catch (error) {
    const message = error?.message || String(error);
    return {
      file: resolvedLearningFile,
      directory: path.dirname(resolvedLearningFile),
      pattern: "",
      generatedAt: "",
      limit,
      totalCount: 0,
      count: 0,
      latestBackup: null,
      backups: [],
      readiness: assessLearningRestoreBackupReadiness({ totalCount: 0, keep, error: message }),
      privacy: {
        storesRawBriefText: false,
        exposesEntryTextPreview: false,
        mutatesProfile: false,
      },
      error: message,
    };
  }
}

export function defaultLearningEvalPath(learningFilePath = defaultLearningFile()) {
  return path.join(path.dirname(path.resolve(learningFilePath)), DEFAULT_LEARNING_EVAL_FILE);
}

export function defaultLearningUsagePath(learningFilePath = defaultLearningFile()) {
  return defaultLearningUsageFile(learningFilePath);
}

export function action(level, text, command = "") {
  return command ? { level, text, command } : { level, text };
}

export function quoteShellArg(value) {
  const text = String(value ?? "");
  if (/^[A-Za-z0-9_@%+=:,./-]+$/u.test(text)) return text;
  return `'${text.replace(/'/gu, "'\\''")}'`;
}

export function pushUniqueAction(actions, nextAction) {
  if (nextAction.command && actions.some((item) => item.command === nextAction.command)) return;
  actions.push(nextAction);
}

export function learningCurationCommand(learning, learningUsage = null) {
  const usagePart = learningUsage?.usageFile
    ? ` --usage-file ${quoteShellArg(learningUsage.usageFile)}`
    : "";
  return `design-ai learn --curate --file ${quoteShellArg(learning.file)}${usagePart}`;
}

export function defaultLearningCurationReportPath(learningFilePath = defaultLearningFile()) {
  return path.join(path.dirname(path.resolve(learningFilePath)), DEFAULT_LEARNING_CURATION_REPORT_FILE);
}

export function learningCurationReportCommand(learning, learningUsage = null) {
  return `${learningCurationCommand(learning, learningUsage)} --report --out ${quoteShellArg(defaultLearningCurationReportPath(learning.file))}`;
}

export function learningRestoreBackupsCommand(learning) {
  return `design-ai learn --restore-backups --file ${quoteShellArg(learning.file)}`;
}

export function learningRestoreBackupPruneCommand(learning, keep = DEFAULT_RESTORE_BACKUP_KEEP) {
  return `${learningRestoreBackupsCommand(learning)} --prune --keep ${keep}`;
}

function parsedTimestamp(value) {
  const time = Date.parse(String(value || ""));
  return Number.isNaN(time) ? null : time;
}

export function assessLearningEvalFreshness({ learning, learningEval } = {}) {
  const profileUpdatedAt = learning?.updatedAt || "";
  const checkpointGeneratedAt = learningEval?.generatedAt || "";
  const sourceProfile = learningEval?.sourceProfile || null;
  const issues = [];

  if (!learningEval) return null;

  if (sourceProfile?.file && path.resolve(sourceProfile.file) !== path.resolve(learning?.file || "")) {
    issues.push("source-profile-file-mismatch");
  }

  if (
    Number.isInteger(sourceProfile?.entryCount)
    && Number.isInteger(learning?.count)
    && sourceProfile.entryCount !== learning.count
  ) {
    issues.push("source-profile-entry-count-changed");
  }

  const profileUpdatedTime = parsedTimestamp(profileUpdatedAt);
  const checkpointGeneratedTime = parsedTimestamp(checkpointGeneratedAt);
  if (
    profileUpdatedTime !== null
    && checkpointGeneratedTime !== null
    && profileUpdatedTime > checkpointGeneratedTime
  ) {
    issues.push("profile-updated-after-checkpoint");
  }

  if (issues.length > 0) {
    return {
      status: "warn",
      stale: true,
      reason: issues.join(", "),
      profileUpdatedAt,
      checkpointGeneratedAt,
      sourceProfileFile: sourceProfile?.file || "",
      sourceProfileEntryCount: Number.isInteger(sourceProfile?.entryCount) ? sourceProfile.entryCount : null,
    };
  }

  if (!checkpointGeneratedAt && !sourceProfile) {
    return {
      status: "unknown",
      stale: false,
      reason: "checkpoint metadata unavailable",
      profileUpdatedAt,
      checkpointGeneratedAt,
      sourceProfileFile: "",
      sourceProfileEntryCount: null,
    };
  }

  return {
    status: "pass",
    stale: false,
    reason: "",
    profileUpdatedAt,
    checkpointGeneratedAt,
    sourceProfileFile: sourceProfile?.file || "",
    sourceProfileEntryCount: Number.isInteger(sourceProfile?.entryCount) ? sourceProfile.entryCount : null,
  };
}

export function collectLearningUsageReport({
  learningFilePath = defaultLearningFile(),
  learningUsagePath = "",
  learningUsageStatsProvider = learningUsageStats,
} = {}) {
  if (!learningUsagePath) return null;

  const resolvedLearningFile = path.resolve(learningFilePath);
  const resolvedUsagePath = path.resolve(learningUsagePath);
  try {
    const stats = learningUsageStatsProvider({
      filePath: resolvedLearningFile,
      usageFile: resolvedUsagePath,
    });
    return {
      file: stats.file || resolvedLearningFile,
      usageFile: stats.usageFile || resolvedUsagePath,
      exists: Boolean(stats.exists),
      profileExists: Boolean(stats.profileExists),
      profileFile: stats.profileFile || resolvedLearningFile,
      version: Number.isInteger(stats.version) ? stats.version : 1,
      updatedAt: stats.updatedAt || "",
      eventCount: Number.isInteger(stats.eventCount) ? stats.eventCount : 0,
      profileEntryCount: Number.isInteger(stats.profileEntryCount) ? stats.profileEntryCount : 0,
      usedEntryCount: Number.isInteger(stats.usedEntryCount) ? stats.usedEntryCount : 0,
      unusedEntryCount: Number.isInteger(stats.unusedEntryCount) ? stats.unusedEntryCount : 0,
      staleSelectedEntryCount: Number.isInteger(stats.staleSelectedEntryCount) ? stats.staleSelectedEntryCount : 0,
      commandCounts: stats.commandCounts || {},
      routeCounts: stats.routeCounts || {},
      categoryCounts: stats.categoryCounts || {},
      auditStatusCounts: stats.auditStatusCounts || {},
      latestEvent: stats.latestEvent || null,
      privacy: stats.privacy || {
        storesRawBriefText: false,
        storesBriefHash: true,
        storesSelectedEntryIds: true,
      },
      recommendations: Array.isArray(stats.recommendations) ? stats.recommendations : [],
      readiness: assessLearningUsageReadiness({ learningFilePath: resolvedLearningFile, usage: stats }),
      error: "",
    };
  } catch (error) {
    return {
      file: resolvedLearningFile,
      usageFile: resolvedUsagePath,
      exists: existsSync(resolvedUsagePath),
      profileExists: existsSync(resolvedLearningFile),
      profileFile: resolvedLearningFile,
      version: 1,
      updatedAt: "",
      eventCount: 0,
      profileEntryCount: 0,
      usedEntryCount: 0,
      unusedEntryCount: 0,
      staleSelectedEntryCount: 0,
      commandCounts: {},
      routeCounts: {},
      categoryCounts: {},
      auditStatusCounts: {},
      latestEvent: null,
      privacy: {
        storesRawBriefText: false,
        storesBriefHash: true,
        storesSelectedEntryIds: true,
      },
      recommendations: [],
      readiness: {
        status: "fail",
        reason: "usage-sidecar-error",
        profileFile: resolvedLearningFile,
        profileFileMatches: true,
        staleSelectedEntryCount: 0,
      },
      error: error?.message || String(error),
    };
  }
}

export function assessLearningUsageReadiness({ learningFilePath = defaultLearningFile(), usage } = {}) {
  if (!usage) return null;

  const resolvedLearningFile = path.resolve(learningFilePath);
  const profileFile = usage.profileFile ? path.resolve(usage.profileFile) : "";
  const profileFileMatches = profileFile ? profileFile === resolvedLearningFile : true;
  const staleSelectedEntryCount = Number.isInteger(usage.staleSelectedEntryCount)
    ? usage.staleSelectedEntryCount
    : 0;
  const issues = [];

  if (!profileFileMatches) issues.push("usage-profile-file-mismatch");
  if (staleSelectedEntryCount > 0) issues.push("stale-selected-entry-ids");

  if (issues.length > 0) {
    return {
      status: "warn",
      reason: issues.join(", "),
      profileFile: usage.profileFile || "",
      profileFileMatches,
      staleSelectedEntryCount,
    };
  }

  if (!usage.exists || usage.eventCount === 0) {
    return {
      status: "unknown",
      reason: usage.exists ? "usage sidecar has no events" : "usage sidecar unavailable",
      profileFile: usage.profileFile || "",
      profileFileMatches,
      staleSelectedEntryCount,
    };
  }

  return {
    status: "pass",
    reason: "",
    profileFile: usage.profileFile || "",
    profileFileMatches,
    staleSelectedEntryCount,
  };
}

// Retrieval-index readiness (docs/AI-LEARNING-PHASE2.md, Phase A): the index is an
// opt-in derived cache, so a missing index is "unused" (null section), while a
// present-but-stale or unreadable index is a readiness warning.
export function collectRetrievalIndexReport({
  sourceRoot,
  learningFilePath = defaultLearningFile(),
  retrievalIndexStatusProvider = retrievalIndexStatus,
} = {}) {
  const corpusFile = corpusIndexFile();
  const learningIdxFile = learningIndexFile();
  if (!retrievalIndexFileExists(corpusFile) && !retrievalIndexFileExists(learningIdxFile)) {
    return null;
  }

  const status = retrievalIndexStatusProvider({
    designAiPath: sourceRoot,
    learningFile: learningFilePath,
  });
  return {
    indexDir: status.indexDir,
    corpus: status.corpus,
    learning: status.learning,
    fresh: status.fresh,
    status: status.fresh ? "pass" : "warn",
    buildCommand: status.buildCommand,
  };
}
