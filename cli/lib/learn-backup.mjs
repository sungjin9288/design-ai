// Learning profile backup, restore, import, redact, and diff for `design-ai learn`.

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "node:fs";
import path from "node:path";

import { normalizeCategory } from "./learn-args.mjs";
import {
  auditLearningProfile,
  auditLearningProfileObject,
  emptyLearningProfile,
  learningAuditIssue,
  loadLearningProfile,
  normalizeLearningProfile,
} from "./learn-profile.mjs";
import {
  LEARNING_SENSITIVE_PATTERNS,
  cleanNoteText,
  commandFromArgs,
  defaultLearningFile,
  defaultLearningRestoreBackupFile,
  learningEntryMergeKey,
  parseLearningProfilePayload,
  previewText,
  shortEntryId,
  statsEntry,
  uniqueImportedEntryId,
  writeLearningProfile,
} from "./learn-shared.mjs";

function learningRestoreBackupPattern(filePath = defaultLearningFile()) {
  const resolvedFile = path.resolve(filePath);
  const parsed = path.parse(resolvedFile);
  const ext = parsed.ext || ".json";
  return {
    directory: parsed.dir,
    prefix: `${parsed.name}.restore-backup-`,
    ext,
    glob: `${parsed.name}.restore-backup-*${ext}`,
  };
}

function parseRestoreBackupCreatedAt(fileName, { prefix, ext }) {
  if (!fileName.startsWith(prefix) || !fileName.endsWith(ext)) return "";
  const timestamp = fileName.slice(prefix.length, fileName.length - ext.length);
  const match = timestamp.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(\d{3})Z$/);
  if (!match) return "";
  const [, year, month, day, hour, minute, second, millisecond] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}Z`;
}

function normalizeImportedLearningEntry(entry, index, now) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error(`Learning import entry ${index + 1} must be an object`);
  }

  const text = cleanNoteText(entry.text);
  if (!text) throw new Error(`Learning import entry ${index + 1} has empty text`);

  const category = normalizeCategory(entry.category || "preference");
  const rawCreatedAt = String(entry.createdAt || "").trim();
  const createdAt = rawCreatedAt && !Number.isNaN(Date.parse(rawCreatedAt))
    ? rawCreatedAt
    : now.toISOString();
  const rawSource = String(entry.source || "cli").trim() || "cli";
  const source = rawSource.startsWith("import") ? rawSource : `import:${rawSource}`;
  const rawId = String(entry.id || "").trim();

  return {
    id: rawId || `learn-${shortEntryId({ text, category, createdAt })}`,
    category,
    text,
    source,
    createdAt,
  };
}

function parseLearningImportEntries(importText, now) {
  const payload = parseLearningProfilePayload(importText, "Learning import");
  if (payload.entries.length === 0) {
    throw new Error("Learning import has no entries");
  }

  return payload.entries.map((entry, index) => normalizeImportedLearningEntry(entry, index, now));
}

export function importLearningProfile({
  importText,
  filePath = defaultLearningFile(),
  dryRun = true,
  now = new Date(),
} = {}) {
  const importedEntries = parseLearningImportEntries(String(importText || ""), now);
  const profile = loadLearningProfile(filePath);
  const existingKeys = new Set(profile.entries.map(learningEntryMergeKey));
  const usedIds = new Set(profile.entries.map((entry) => entry.id).filter(Boolean));
  const added = [];
  const skipped = [];

  for (const importedEntry of importedEntries) {
    const mergeKey = learningEntryMergeKey(importedEntry);
    if (existingKeys.has(mergeKey)) {
      skipped.push({
        ...statsEntry(importedEntry),
        reason: "duplicate-entry-text",
      });
      continue;
    }

    const entry = {
      ...importedEntry,
      id: uniqueImportedEntryId(importedEntry, usedIds),
    };
    usedIds.add(entry.id);
    existingKeys.add(mergeKey);
    added.push(entry);
  }

  const updatedAt = added.length > 0 ? now.toISOString() : profile.updatedAt;
  const nextProfile = {
    version: 1,
    updatedAt,
    entries: [...profile.entries, ...added],
  };

  if (!dryRun && added.length > 0) {
    writeLearningProfile(filePath, nextProfile);
  }

  return {
    file: filePath,
    dryRun,
    applied: !dryRun,
    importedCount: importedEntries.length,
    addedCount: added.length,
    skippedCount: skipped.length,
    added: added.map(statsEntry),
    skipped,
    count: nextProfile.entries.length,
    profile: nextProfile,
  };
}

export function verifyLearningImportPayload({
  importText,
  source = "input",
  now = new Date(),
} = {}) {
  const importedEntries = parseLearningImportEntries(String(importText || ""), now);
  const profile = {
    version: 1,
    updatedAt: "",
    entries: importedEntries,
  };
  const audit = auditLearningProfileObject(profile, {
    filePath: source,
    exists: true,
  });

  return {
    source,
    importable: audit.summary.failures === 0,
    count: importedEntries.length,
    auditSummary: audit.summary,
    issues: audit.issues,
    entries: importedEntries.map(statsEntry),
  };
}

function invalidLearningBackupAudit(filePath, message) {
  return {
    file: filePath,
    exists: true,
    version: null,
    updatedAt: "",
    count: 0,
    categoryCounts: {},
    issues: [
      learningAuditIssue({
        level: "failure",
        code: "invalid-json",
        message,
      }),
    ],
    summary: {
      status: "fail",
      failures: 1,
      warnings: 0,
    },
    suggestions: [],
  };
}

function inspectRestoreBackupFile(filePath, fileName, pattern, activeFile) {
  const stat = statSync(filePath);
  const createdAt = parseRestoreBackupCreatedAt(fileName, pattern);
  let rawProfile = null;
  let audit = null;

  try {
    rawProfile = JSON.parse(readFileSync(filePath, "utf8"));
    audit = auditLearningProfileObject(rawProfile, {
      filePath,
      exists: true,
    });
  } catch (error) {
    audit = invalidLearningBackupAudit(filePath, "Rollback backup is not valid JSON.");
  }

  return {
    file: filePath,
    name: fileName,
    createdAt,
    modifiedAt: stat.mtime.toISOString(),
    sizeBytes: stat.size,
    updatedAt: audit.updatedAt || "",
    entryCount: audit.count || 0,
    auditSummary: audit.summary,
    issueCount: audit.issues.length,
    restorePreviewCommand: commandFromArgs([
      "design-ai",
      "learn",
      "--restore",
      "--from-file",
      filePath,
      "--file",
      activeFile,
      "--dry-run",
    ]),
  };
}

export function listLearningRestoreBackups({
  filePath = defaultLearningFile(),
  limit = 10,
  now = new Date(),
} = {}) {
  const resolvedFile = path.resolve(filePath);
  const pattern = learningRestoreBackupPattern(resolvedFile);
  const directoryExists = existsSync(pattern.directory);
  const files = directoryExists
    ? readdirSync(pattern.directory)
      .filter((fileName) => fileName.startsWith(pattern.prefix) && fileName.endsWith(pattern.ext))
      .map((fileName) => ({
        fileName,
        filePath: path.join(pattern.directory, fileName),
      }))
      .filter(({ filePath: backupPath }) => statSync(backupPath).isFile())
    : [];

  const backups = files
    .map(({ fileName, filePath: backupPath }) => inspectRestoreBackupFile(backupPath, fileName, pattern, resolvedFile))
    .sort((a, b) => {
      const aKey = a.createdAt || a.modifiedAt || a.name;
      const bKey = b.createdAt || b.modifiedAt || b.name;
      return bKey.localeCompare(aKey);
    });
  const limitedBackups = backups.slice(0, limit || 10);

  return {
    file: resolvedFile,
    directory: pattern.directory,
    pattern: pattern.glob,
    generatedAt: now.toISOString(),
    limit: limit || 10,
    totalCount: backups.length,
    count: limitedBackups.length,
    backups: limitedBackups,
    privacy: {
      storesRawBriefText: false,
      exposesEntryTextPreview: false,
      mutatesProfile: false,
    },
  };
}

export function pruneLearningRestoreBackups({
  filePath = defaultLearningFile(),
  keep = 5,
  limit = 10,
  dryRun = true,
  now = new Date(),
} = {}) {
  const maxKeep = Number.isInteger(keep) && keep > 0 ? keep : 5;
  const visibleLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  const inventory = listLearningRestoreBackups({
    filePath,
    limit: Number.MAX_SAFE_INTEGER,
    now,
  });
  const retained = inventory.backups.slice(0, maxKeep);
  const candidates = inventory.backups.slice(maxKeep);
  const deleted = [];
  const failures = [];

  if (!dryRun) {
    for (const backup of candidates) {
      try {
        unlinkSync(backup.file);
        deleted.push(backup);
      } catch (error) {
        failures.push({
          file: backup.file,
          name: backup.name,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return {
    ...inventory,
    limit: visibleLimit,
    count: inventory.backups.slice(0, visibleLimit).length,
    backups: inventory.backups.slice(0, visibleLimit),
    prune: {
      dryRun,
      applied: !dryRun,
      keep: maxKeep,
      retainedCount: retained.length,
      candidateCount: candidates.length,
      deletedCount: deleted.length,
      failureCount: failures.length,
      retained,
      candidates,
      deleted,
      failures,
    },
    privacy: {
      storesRawBriefText: false,
      exposesEntryTextPreview: false,
      mutatesProfile: false,
      deletesBackupFiles: !dryRun && deleted.length > 0,
    },
  };
}

export function restoreLearningProfile({
  restoreText,
  filePath = defaultLearningFile(),
  backupFilePath = "",
  forceBackup = false,
  source = "input",
  dryRun = true,
  now = new Date(),
} = {}) {
  const resolvedFile = path.resolve(filePath);
  const resolvedSource = source === "stdin" ? "stdin" : String(source || "input");
  const generatedAt = now.toISOString();
  const resolvedBackupFile = path.resolve(backupFilePath || defaultLearningRestoreBackupFile(resolvedFile, now));
  const rawRestore = parseLearningProfilePayload(String(restoreText || ""), "Learning restore");
  const restoreAudit = auditLearningProfileObject(rawRestore, {
    filePath: resolvedSource,
    exists: true,
  });
  const profileExists = existsSync(resolvedFile);
  const currentProfile = loadLearningProfile(resolvedFile);
  const restorable = restoreAudit.summary.failures === 0;

  if (!dryRun && !restorable) {
    throw new Error("Refusing to restore learning profile with audit failures");
  }
  if (!dryRun && resolvedBackupFile === resolvedFile) {
    throw new Error("Learning restore backup file must be different from the active learning profile");
  }
  if (!dryRun && resolvedSource !== "stdin" && path.resolve(resolvedSource) === resolvedBackupFile) {
    throw new Error("Learning restore backup file must be different from the restore source");
  }
  if (!dryRun && existsSync(resolvedBackupFile) && !forceBackup) {
    throw new Error("Learning restore backup file already exists; pass --force to overwrite or choose another --backup-file path");
  }

  const restoredProfile = restorable ? normalizeLearningProfile(rawRestore) : emptyLearningProfile();
  const targetProfile = {
    version: 1,
    updatedAt: restoredProfile.updatedAt || now.toISOString(),
    entries: restoredProfile.entries,
  };
  const diff = restorable
    ? diffLearningProfiles({
      filePath: resolvedFile,
      compareText: restoreText,
      source: resolvedSource,
      now,
    })
    : {
      sameTextCount: 0,
      profileOnlyCount: 0,
      comparisonOnlyCount: 0,
      metadataChangedCount: 0,
      idConflictCount: 0,
      profileOnly: [],
      comparisonOnly: [],
      metadataChanged: [],
      idConflicts: [],
  };

  if (!dryRun) {
    writeLearningProfile(resolvedBackupFile, currentProfile);
    writeLearningProfile(resolvedFile, targetProfile);
  }

  return {
    file: resolvedFile,
    source: resolvedSource,
    generatedAt,
    dryRun,
    applied: !dryRun,
    restorable,
    profileExists,
    backupFile: resolvedBackupFile,
    backupCreated: !dryRun,
    backupEntryCount: currentProfile.entries.length,
    backupUpdatedAt: currentProfile.updatedAt,
    rollbackCommand: commandFromArgs([
      "design-ai",
      "learn",
      "--restore",
      "--from-file",
      resolvedBackupFile,
      "--file",
      resolvedFile,
      "--dry-run",
    ]),
    previousUpdatedAt: currentProfile.updatedAt,
    restoredUpdatedAt: targetProfile.updatedAt,
    previousCount: currentProfile.entries.length,
    restoredCount: targetProfile.entries.length,
    removedCount: diff.profileOnlyCount,
    addedCount: diff.comparisonOnlyCount,
    sameTextCount: diff.sameTextCount,
    metadataChangedCount: diff.metadataChangedCount,
    idConflictCount: diff.idConflictCount,
    auditSummary: restoreAudit.summary,
    issues: restoreAudit.issues,
    diff: {
      profileOnlyCount: diff.profileOnlyCount,
      comparisonOnlyCount: diff.comparisonOnlyCount,
      metadataChangedCount: diff.metadataChangedCount,
      idConflictCount: diff.idConflictCount,
      profileOnly: diff.profileOnly,
      comparisonOnly: diff.comparisonOnly,
      metadataChanged: diff.metadataChanged,
      idConflicts: diff.idConflicts,
    },
    privacy: {
      storesRawBriefText: false,
      exposesEntryTextPreview: true,
      mutatesProfile: !dryRun,
    },
  };
}

function globalSensitivePattern(pattern) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  return new RegExp(pattern.source, flags);
}

function redactLearningText(text) {
  let redactedText = String(text || "");
  const codes = [];

  for (const sensitivePattern of LEARNING_SENSITIVE_PATTERNS) {
    const pattern = globalSensitivePattern(sensitivePattern.pattern);
    if (!pattern.test(redactedText)) continue;

    codes.push(`sensitive-${sensitivePattern.code}`);
    redactedText = redactedText.replace(pattern, `[REDACTED:${sensitivePattern.code}]`);
  }

  return {
    text: redactedText,
    codes,
    redacted: codes.length > 0,
  };
}

function buildRedactedLearningPayload({
  profile,
  source,
  sourceAudit,
  now = new Date(),
}) {
  const redactions = [];
  const entries = profile.entries.map((entry) => {
    const redacted = redactLearningText(entry.text);
    if (!redacted.redacted) return entry;

    const nextEntry = {
      ...entry,
      text: redacted.text,
    };
    redactions.push({
      entryId: entry.id,
      category: entry.category,
      codes: redacted.codes,
      textPreview: previewText(nextEntry.text),
    });
    return nextEntry;
  });
  const redactedProfile = {
    version: profile.version,
    updatedAt: profile.updatedAt,
    entries,
  };
  const redactedAudit = auditLearningProfileObject(redactedProfile, {
    filePath: source,
    exists: sourceAudit.exists,
  });

  return {
    file: source,
    version: profile.version,
    updatedAt: profile.updatedAt,
    exportedAt: now.toISOString(),
    redacted: true,
    count: entries.length,
    redactedCount: redactions.length,
    sourceAuditSummary: sourceAudit.summary,
    auditSummary: redactedAudit.summary,
    redactions,
    entries,
  };
}

export function buildRedactedLearningBackup({
  filePath = defaultLearningFile(),
  importText,
  source = "",
  now = new Date(),
} = {}) {
  if (importText !== undefined) {
    const sourceLabel = source || "input";
    const rawProfile = parseLearningProfilePayload(String(importText || ""), "Learning redaction input");
    const profile = normalizeLearningProfile(rawProfile);
    const sourceAudit = auditLearningProfileObject(rawProfile, {
      filePath: sourceLabel,
      exists: true,
    });

    return buildRedactedLearningPayload({
      profile,
      source: sourceLabel,
      sourceAudit,
      now,
    });
  }

  const sourceAudit = auditLearningProfile({ filePath });
  const profile = loadLearningProfile(filePath);

  return buildRedactedLearningPayload({
    profile,
    source: filePath,
    sourceAudit,
    now,
  });
}

export function buildLearningBackup({ filePath = defaultLearningFile(), now = new Date() } = {}) {
  const audit = auditLearningProfile({ filePath });
  const profile = loadLearningProfile(filePath);
  return {
    file: filePath,
    version: profile.version,
    updatedAt: profile.updatedAt,
    exportedAt: now.toISOString(),
    count: profile.entries.length,
    auditSummary: audit.summary,
    entries: profile.entries,
  };
}

function firstEntryByMergeKey(entries) {
  const map = new Map();
  for (const entry of entries) {
    const key = learningEntryMergeKey(entry);
    if (!map.has(key)) map.set(key, entry);
  }
  return map;
}

function firstEntryById(entries) {
  const map = new Map();
  for (const entry of entries) {
    if (entry.id && !map.has(entry.id)) map.set(entry.id, entry);
  }
  return map;
}

function metadataDiffFields(profileEntry, comparisonEntry) {
  return ["id", "source", "createdAt"].filter((field) => (
    String(profileEntry?.[field] || "") !== String(comparisonEntry?.[field] || "")
  ));
}

function learningDiffItem({ key, profileEntry, comparisonEntry, changedFields }) {
  return {
    key,
    changedFields,
    profile: statsEntry(profileEntry),
    comparison: statsEntry(comparisonEntry),
  };
}

function learningIdConflict({ id, profileEntry, comparisonEntry }) {
  return {
    id,
    profile: statsEntry(profileEntry),
    comparison: statsEntry(comparisonEntry),
  };
}

export function diffLearningProfiles({
  filePath = defaultLearningFile(),
  compareText = "",
  source = "input",
  now = new Date(),
} = {}) {
  const resolvedFile = path.resolve(filePath);
  const resolvedSource = source === "stdin" ? "stdin" : String(source || "input");
  const profileExists = existsSync(resolvedFile);
  const profile = loadLearningProfile(resolvedFile);
  const profileAudit = auditLearningProfile({ filePath: resolvedFile });
  const rawComparison = parseLearningProfilePayload(String(compareText || ""), "Learning diff comparison");
  const comparison = normalizeLearningProfile(rawComparison);
  const comparisonAudit = auditLearningProfileObject(rawComparison, {
    filePath: resolvedSource,
    exists: true,
  });

  const profileByKey = firstEntryByMergeKey(profile.entries);
  const comparisonByKey = firstEntryByMergeKey(comparison.entries);
  const profileKeys = new Set(profileByKey.keys());
  const comparisonKeys = new Set(comparisonByKey.keys());
  const commonKeys = [...profileKeys].filter((key) => comparisonKeys.has(key)).sort();
  const profileOnly = [...profile.entries]
    .filter((entry) => !comparisonKeys.has(learningEntryMergeKey(entry)))
    .map(statsEntry);
  const comparisonOnly = [...comparison.entries]
    .filter((entry) => !profileKeys.has(learningEntryMergeKey(entry)))
    .map(statsEntry);
  const metadataChanged = commonKeys
    .map((key) => {
      const profileEntry = profileByKey.get(key);
      const comparisonEntry = comparisonByKey.get(key);
      const changedFields = metadataDiffFields(profileEntry, comparisonEntry);
      return changedFields.length > 0
        ? learningDiffItem({ key, profileEntry, comparisonEntry, changedFields })
        : null;
    })
    .filter(Boolean);

  const profileById = firstEntryById(profile.entries);
  const comparisonById = firstEntryById(comparison.entries);
  const idConflicts = [...profileById.keys()]
    .filter((id) => comparisonById.has(id))
    .map((id) => {
      const profileEntry = profileById.get(id);
      const comparisonEntry = comparisonById.get(id);
      return learningEntryMergeKey(profileEntry) !== learningEntryMergeKey(comparisonEntry)
        ? learningIdConflict({ id, profileEntry, comparisonEntry })
        : null;
    })
    .filter(Boolean);

  const recommendations = [];
  if (!profileExists) {
    recommendations.push({
      level: "warning",
      text: "Active learning profile does not exist; comparison is against an empty local profile.",
    });
  }
  if (profileAudit.summary.status !== "pass") {
    recommendations.push({
      level: profileAudit.summary.failures > 0 ? "warning" : "info",
      text: "Run `design-ai learn --audit` on the active profile before applying import or restore decisions.",
    });
  }
  if (comparisonAudit.summary.status !== "pass") {
    recommendations.push({
      level: comparisonAudit.summary.failures > 0 ? "warning" : "info",
      text: "Review comparison profile audit issues before importing or restoring entries from it.",
    });
  }
  if (idConflicts.length > 0) {
    recommendations.push({
      level: "warning",
      text: "Matching ids with different learning text were found; inspect manually before importing or restoring.",
    });
  }
  if (comparisonOnly.length > 0) {
    recommendations.push({
      level: "info",
      text: "Run `design-ai learn --import --from-file <profile.json> --dry-run` to preview adding comparison-only entries.",
    });
  }
  if (profileOnly.length > 0) {
    recommendations.push({
      level: "info",
      text: "Profile-only entries would be absent if the comparison profile were used as the restore source.",
    });
  }
  if (
    profileOnly.length === 0
    && comparisonOnly.length === 0
    && metadataChanged.length === 0
    && idConflicts.length === 0
  ) {
    recommendations.push({
      level: "info",
      text: "No learning profile diff action is needed.",
    });
  }

  return {
    file: resolvedFile,
    source: resolvedSource,
    generatedAt: now.toISOString(),
    profileExists,
    profileUpdatedAt: profile.updatedAt,
    comparisonUpdatedAt: comparison.updatedAt,
    profileCount: profile.entries.length,
    comparisonCount: comparison.entries.length,
    profileAuditSummary: profileAudit.summary,
    comparisonAuditSummary: comparisonAudit.summary,
    sameTextCount: commonKeys.length,
    profileOnlyCount: profileOnly.length,
    comparisonOnlyCount: comparisonOnly.length,
    metadataChangedCount: metadataChanged.length,
    idConflictCount: idConflicts.length,
    profileOnly,
    comparisonOnly,
    metadataChanged,
    idConflicts,
    recommendations,
    privacy: {
      storesRawBriefText: false,
      exposesEntryTextPreview: true,
      mutatesProfile: false,
    },
  };
}
