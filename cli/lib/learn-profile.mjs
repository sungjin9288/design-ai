// Learning profile core: load/normalize/audit/mutate for `design-ai learn`.

import { existsSync, readFileSync } from "node:fs";

import {
  LEARNING_CATEGORIES,
  normalizeCategory,
  normalizeFeedbackOutcome,
} from "./learn-args.mjs";
import {
  LEARNING_SENSITIVE_PATTERNS,
  cleanNoteText,
  commandFromArgs,
  defaultLearningFile,
  learningEntryMergeKey,
  shortEntryId,
  statsEntry,
  uniqueImportedEntryId,
  writeLearningProfile,
} from "./learn-shared.mjs";

export const LEARNING_INIT_SOURCE = "init:local-dogfood";
export const LEARNING_INIT_ENTRIES = [
  {
    category: "preference",
    text: "Prefer concise, evidence-led design recommendations with one best path and explicit tradeoffs.",
  },
  {
    category: "workflow",
    text: "For implementation work, inspect repository context first, keep edits scoped, and run meaningful verification before handoff.",
  },
  {
    category: "accessibility",
    text: "For non-trivial UI, include keyboard navigation, visible focus, screen-reader behavior, and WCAG 2.1 AA contrast notes.",
  },
  {
    category: "korean",
    text: "When Korean users or Korean copy are involved, use Pretendard, Korean typography line-height, dense mobile conventions, and a consistent honorific level.",
  },
  {
    category: "brand",
    text: "Use restrained product UI language for internal tools and avoid decorative marketing phrasing unless explicitly requested.",
  },
  {
    category: "constraint",
    text: "Do not add external AI APIs, embeddings, telemetry, or fine-tuning behavior without explicit approval.",
  },
];
const DEFAULT_AUDIT_MAX_ENTRY_CHARS = 800;
export function emptyLearningProfile() {
  return {
    version: 1,
    updatedAt: "",
    entries: [],
  };
}

function normalizeEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const text = String(entry.text || "").trim();
  if (!text) return null;
  const createdAt = String(entry.createdAt || "").trim();
  return {
    id: String(entry.id || `learn-${shortEntryId({ text, category: entry.category || "preference", createdAt })}`).trim(),
    category: normalizeCategory(entry.category || "preference"),
    text,
    source: String(entry.source || "cli").trim() || "cli",
    createdAt,
  };
}

export function normalizeLearningProfile(rawProfile) {
  const profile = rawProfile && typeof rawProfile === "object" ? rawProfile : {};
  const entries = Array.isArray(profile.entries)
    ? profile.entries.map(normalizeEntry).filter(Boolean)
    : [];

  return {
    version: Number.isInteger(profile.version) ? profile.version : 1,
    updatedAt: String(profile.updatedAt || "").trim(),
    entries,
  };
}

export function loadLearningProfile(filePath = defaultLearningFile()) {
  if (!existsSync(filePath)) return emptyLearningProfile();
  const raw = readFileSync(filePath, "utf8");
  try {
    return normalizeLearningProfile(JSON.parse(raw));
  } catch (error) {
    throw new Error(`Learning profile is not valid JSON: ${filePath}`);
  }
}

export function learningAuditIssue({ level = "warning", code, entryId = "", message }) {
  return {
    level,
    code,
    ...(entryId ? { entryId } : {}),
    message,
  };
}

function summarizeLearningAudit(issues) {
  const failures = issues.filter((issue) => issue.level === "failure").length;
  const warnings = issues.filter((issue) => issue.level === "warning").length;
  return {
    status: failures > 0 ? "fail" : warnings > 0 ? "warn" : "pass",
    failures,
    warnings,
  };
}

function forgetCommand({ filePath, entryId }) {
  return ["design-ai", "learn", "--file", filePath, "--forget", entryId, "--yes"];
}

function commandSuggestion({ issue, action, message, commandArgs = [] }) {
  return {
    issueCode: issue.code,
    ...(issue.entryId ? { entryId: issue.entryId } : {}),
    action,
    message,
    ...(commandArgs.length > 0 ? {
      commandArgs,
      command: commandFromArgs(commandArgs),
    } : {}),
  };
}

function learningAuditSuggestion(issue, filePath, { ambiguousEntryIds = new Set() } = {}) {
  const hasStableEntryTarget = issue.entryId && ![
    "missing-entry-id",
    "duplicate-entry-id",
    "invalid-entry",
    "empty-entry-text",
    "invalid-category",
  ].includes(issue.code) && !ambiguousEntryIds.has(issue.entryId);
  const commandArgs = hasStableEntryTarget
    ? forgetCommand({ filePath, entryId: issue.entryId })
    : [];

  if (issue.code === "duplicate-entry-text") {
    return commandSuggestion({
      issue,
      action: "remove-duplicate",
      message: "Remove the duplicate entry, or rewrite it if it captures a distinct constraint.",
      commandArgs,
    });
  }

  if (issue.code.startsWith("sensitive-")) {
    return commandSuggestion({
      issue,
      action: "remove-or-redact-sensitive-content",
      message: "Remove this entry or re-add a redacted preference before using --with-learning.",
      commandArgs,
    });
  }

  if (issue.code === "long-entry-text") {
    return commandSuggestion({
      issue,
      action: "split-or-rewrite",
      message: "Split this note into smaller preference entries, or remove and re-add a focused version.",
      commandArgs,
    });
  }

  if (["missing-created-at", "invalid-created-at"].includes(issue.code)) {
    return commandSuggestion({
      issue,
      action: "refresh-entry-metadata",
      message: "Remove and re-add this entry if recency ordering matters for prompt personalization.",
      commandArgs,
    });
  }

  if (issue.code === "missing-entry-id") {
    return commandSuggestion({
      issue,
      action: "re-add-for-stable-id",
      message: "Re-add this note through `design-ai learn --remember` if you need a stable id for deletion and audit trails.",
    });
  }

  if (issue.code === "duplicate-entry-id") {
    return commandSuggestion({
      issue,
      action: "manual-profile-edit",
      message: "Inspect the profile manually before deleting because duplicate ids make id-based deletion ambiguous.",
    });
  }

  if (issue.level === "failure") {
    return commandSuggestion({
      issue,
      action: "manual-profile-repair",
      message: "Repair the local learning JSON manually, or clear the profile only after reviewing the file.",
    });
  }

  return commandSuggestion({
    issue,
    action: "manual-review",
    message: "Review this warning before exporting or injecting local learning context.",
    commandArgs,
  });
}

function learningAuditSuggestions(issues, { filePath }) {
  const ambiguousEntryIds = new Set(
    issues
      .filter((issue) => issue.code === "duplicate-entry-id" && issue.entryId)
      .map((issue) => issue.entryId),
  );
  return issues.map((issue) => learningAuditSuggestion(issue, filePath, { ambiguousEntryIds }));
}

function finalizeLearningAudit(payload) {
  const summary = summarizeLearningAudit(payload.issues);
  return {
    ...payload,
    summary,
    suggestions: learningAuditSuggestions(payload.issues, { filePath: payload.file }),
  };
}

function entryAuditId(entry, index) {
  return String(entry?.id || `entry-${index + 1}`).trim() || `entry-${index + 1}`;
}

function inspectLearningEntry({
  entry,
  index,
  issues,
  categoryCounts,
  seenIds,
  seenNotes,
  maxEntryChars,
}) {
  const entryId = entryAuditId(entry, index);

  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    issues.push(learningAuditIssue({
      level: "failure",
      code: "invalid-entry",
      entryId,
      message: "Entry must be an object with text, category, and metadata.",
    }));
    return;
  }

  if (!String(entry.id || "").trim()) {
    issues.push(learningAuditIssue({
      code: "missing-entry-id",
      entryId,
      message: "Entry is missing an id; list and export will generate one at runtime.",
    }));
  } else if (seenIds.has(entryId)) {
    issues.push(learningAuditIssue({
      code: "duplicate-entry-id",
      entryId,
      message: `Entry id duplicates ${seenIds.get(entryId)} and can make deletion ambiguous.`,
    }));
  } else {
    seenIds.set(entryId, entryId);
  }

  const text = String(entry.text || "").trim();
  if (!text) {
    issues.push(learningAuditIssue({
      level: "failure",
      code: "empty-entry-text",
      entryId,
      message: "Entry text is empty and will be ignored by prompt personalization.",
    }));
    return;
  }

  const rawCategory = String(entry.category || "preference").trim().toLowerCase();
  if (!LEARNING_CATEGORIES.includes(rawCategory)) {
    issues.push(learningAuditIssue({
      level: "failure",
      code: "invalid-category",
      entryId,
      message: `Category must be one of: ${LEARNING_CATEGORIES.join(", ")}.`,
    }));
  } else {
    categoryCounts[rawCategory] = (categoryCounts[rawCategory] || 0) + 1;
  }

  const noteKey = `${rawCategory}\n${cleanNoteText(text).toLowerCase()}`;
  if (seenNotes.has(noteKey)) {
    issues.push(learningAuditIssue({
      code: "duplicate-entry-text",
      entryId,
      message: `Entry duplicates ${seenNotes.get(noteKey)} in the same category.`,
    }));
  } else {
    seenNotes.set(noteKey, entryId);
  }

  const createdAt = String(entry.createdAt || "").trim();
  if (!createdAt) {
    issues.push(learningAuditIssue({
      code: "missing-created-at",
      entryId,
      message: "Entry is missing createdAt metadata, so recency is unclear.",
    }));
  } else if (Number.isNaN(Date.parse(createdAt))) {
    issues.push(learningAuditIssue({
      code: "invalid-created-at",
      entryId,
      message: "Entry createdAt metadata is not a parseable date.",
    }));
  }

  if (text.length > maxEntryChars) {
    issues.push(learningAuditIssue({
      code: "long-entry-text",
      entryId,
      message: `Entry is ${text.length} characters; keep learning notes under ${maxEntryChars} characters when possible.`,
    }));
  }

  for (const sensitivePattern of LEARNING_SENSITIVE_PATTERNS) {
    if (sensitivePattern.pattern.test(text)) {
      issues.push(learningAuditIssue({
        code: `sensitive-${sensitivePattern.code}`,
        entryId,
        message: `Entry may contain ${sensitivePattern.label}; remove or rewrite it before using --with-learning.`,
      }));
    }
  }
}

export function auditLearningProfileObject(rawProfile, {
  filePath = defaultLearningFile(),
  exists = true,
  maxEntryChars = DEFAULT_AUDIT_MAX_ENTRY_CHARS,
} = {}) {
  const payload = {
    file: filePath,
    exists,
    version: null,
    updatedAt: "",
    count: 0,
    categoryCounts: {},
    issues: [],
  };

  if (!payload.exists) return finalizeLearningAudit(payload);

  if (!rawProfile || typeof rawProfile !== "object" || Array.isArray(rawProfile)) {
    payload.issues.push(learningAuditIssue({
      level: "failure",
      code: "invalid-profile",
      message: "Learning profile root must be a JSON object.",
    }));
    return finalizeLearningAudit(payload);
  }

  payload.version = Number.isInteger(rawProfile.version) ? rawProfile.version : 1;
  payload.updatedAt = String(rawProfile.updatedAt || "").trim();

  if (rawProfile.version !== undefined && !Number.isInteger(rawProfile.version)) {
    payload.issues.push(learningAuditIssue({
      code: "invalid-version",
      message: "Profile version is not an integer; version 1 will be assumed.",
    }));
  }

  if (!Array.isArray(rawProfile.entries)) {
    payload.issues.push(learningAuditIssue({
      level: "failure",
      code: "invalid-entries",
      message: "Learning profile entries must be an array.",
    }));
    return finalizeLearningAudit(payload);
  }

  payload.count = rawProfile.entries.length;

  const seenIds = new Map();
  const seenNotes = new Map();
  for (let index = 0; index < rawProfile.entries.length; index += 1) {
    inspectLearningEntry({
      entry: rawProfile.entries[index],
      index,
      issues: payload.issues,
      categoryCounts: payload.categoryCounts,
      seenIds,
      seenNotes,
      maxEntryChars,
    });
  }

  payload.categoryCounts = Object.fromEntries(
    LEARNING_CATEGORIES
      .filter((category) => payload.categoryCounts[category])
      .map((category) => [category, payload.categoryCounts[category]]),
  );

  return finalizeLearningAudit(payload);
}

export function auditLearningProfile({
  filePath = defaultLearningFile(),
  maxEntryChars = DEFAULT_AUDIT_MAX_ENTRY_CHARS,
} = {}) {
  if (!existsSync(filePath)) {
    return auditLearningProfileObject(emptyLearningProfile(), {
      filePath,
      exists: false,
      maxEntryChars,
    });
  }

  let rawText = "";
  try {
    rawText = readFileSync(filePath, "utf8");
  } catch {
    return finalizeLearningAudit({
      file: filePath,
      exists: true,
      version: null,
      updatedAt: "",
      count: 0,
      categoryCounts: {},
      issues: [
        learningAuditIssue({
          level: "failure",
          code: "read-error",
          message: "Learning profile could not be read from disk.",
        }),
      ],
    });
  }

  let rawProfile = null;
  try {
    rawProfile = JSON.parse(rawText);
  } catch {
    return finalizeLearningAudit({
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
          message: "Learning profile is not valid JSON.",
        }),
      ],
    });
  }

  return auditLearningProfileObject(rawProfile, {
    filePath,
    exists: true,
    maxEntryChars,
  });
}

export function rememberLearning({
  text,
  category = "preference",
  filePath = defaultLearningFile(),
  now = new Date(),
  source = "cli",
}) {
  const note = cleanNoteText(text);
  if (!note) throw new Error("Learning note is empty");

  const normalizedCategory = normalizeCategory(category);
  const createdAt = now.toISOString();
  const entry = {
    id: `learn-${shortEntryId({ text: note, category: normalizedCategory, createdAt })}`,
    category: normalizedCategory,
    text: note,
    source,
    createdAt,
  };
  const profile = loadLearningProfile(filePath);
  const nextProfile = {
    version: 1,
    updatedAt: createdAt,
    entries: [...profile.entries, entry],
  };

  writeLearningProfile(filePath, nextProfile);

  return {
    file: filePath,
    entry,
    profile: nextProfile,
  };
}

function feedbackInstruction({ outcome, text }) {
  if (outcome === "keep") return `Repeat in future outputs: ${text}`;
  if (outcome === "avoid") return `Avoid in future outputs: ${text}`;
  return `Improve future outputs by: ${text}`;
}

export function recordLearningFeedback({
  text,
  outcome = "improve",
  category = "workflow",
  filePath = defaultLearningFile(),
  now = new Date(),
}) {
  const normalizedOutcome = normalizeFeedbackOutcome(outcome);
  const feedbackText = cleanNoteText(text);
  if (!feedbackText) throw new Error("Learning feedback is empty");

  return rememberLearning({
    text: feedbackInstruction({ outcome: normalizedOutcome, text: feedbackText }),
    category,
    filePath,
    now,
    source: `feedback:${normalizedOutcome}`,
  });
}

function offsetIsoDate(now, offsetMs) {
  const base = now instanceof Date ? now : new Date(now);
  return new Date(base.getTime() + offsetMs).toISOString();
}

export function captureLearningEntries({
  entries = [],
  source = "cli",
  filePath = defaultLearningFile(),
  dryRun = true,
  now = new Date(),
} = {}) {
  const profile = loadLearningProfile(filePath);
  const existingKeys = new Set(profile.entries.map(learningEntryMergeKey));
  const usedIds = new Set(profile.entries.map((entry) => entry.id).filter(Boolean));
  const added = [];
  const skipped = [];

  const candidates = entries.map((entry, index) => {
    const text = cleanNoteText(entry?.text);
    if (!text) throw new Error(`Learning capture entry ${index + 1} has empty text`);
    const category = normalizeCategory(entry?.category || "workflow");
    const createdAt = offsetIsoDate(now, index);
    const entrySource = String(entry?.source || source || "cli").trim() || "cli";
    return {
      id: `learn-${shortEntryId({ text, category, createdAt })}`,
      category,
      text,
      source: entrySource,
      createdAt,
    };
  });

  for (const candidate of candidates) {
    const mergeKey = learningEntryMergeKey(candidate);
    if (existingKeys.has(mergeKey)) {
      skipped.push({
        ...statsEntry(candidate),
        reason: "duplicate-entry-text",
      });
      continue;
    }

    const entry = {
      ...candidate,
      id: uniqueImportedEntryId(candidate, usedIds),
    };
    usedIds.add(entry.id);
    existingKeys.add(mergeKey);
    added.push(entry);
  }

  const updatedAt = added.length > 0 ? added[added.length - 1].createdAt : profile.updatedAt;
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
    source,
    candidateCount: candidates.length,
    addedCount: added.length,
    skippedCount: skipped.length,
    count: nextProfile.entries.length,
    entries: added,
    skipped,
  };
}

export function initializeLearningProfile({
  filePath = defaultLearningFile(),
  dryRun = true,
  now = new Date(),
} = {}) {
  return captureLearningEntries({
    entries: LEARNING_INIT_ENTRIES,
    source: LEARNING_INIT_SOURCE,
    filePath,
    dryRun,
    now,
  });
}

function resolveLearningEntryTarget(profile, target) {
  const normalizedTarget = String(target || "").trim();
  if (!normalizedTarget) throw new Error("--forget expects an entry id or list number");

  if (/^\d+$/.test(normalizedTarget)) {
    const index = Number(normalizedTarget) - 1;
    if (index >= 0 && index < profile.entries.length) {
      return { index, entry: profile.entries[index] };
    }
  }

  const index = profile.entries.findIndex((entry) => entry.id === normalizedTarget);
  if (index >= 0) return { index, entry: profile.entries[index] };

  throw new Error(`Learning entry not found: ${normalizedTarget}`);
}

export function forgetLearning({
  target,
  filePath = defaultLearningFile(),
  now = new Date(),
}) {
  const profile = loadLearningProfile(filePath);
  const { index, entry } = resolveLearningEntryTarget(profile, target);
  const updatedAt = now.toISOString();
  const nextProfile = {
    version: 1,
    updatedAt,
    entries: profile.entries.filter((_, entryIndex) => entryIndex !== index),
  };

  writeLearningProfile(filePath, nextProfile);

  return {
    file: filePath,
    removed: entry,
    count: nextProfile.entries.length,
    profile: nextProfile,
  };
}

function fixableLearningSuggestions(audit) {
  const byEntryId = new Map();
  const skipped = [];

  for (const suggestion of audit.suggestions || []) {
    if (!suggestion.entryId || !Array.isArray(suggestion.commandArgs) || suggestion.commandArgs.length === 0) {
      skipped.push({
        issueCode: suggestion.issueCode,
        ...(suggestion.entryId ? { entryId: suggestion.entryId } : {}),
        action: suggestion.action,
        reason: "manual-review-required",
        message: suggestion.message,
      });
      continue;
    }

    if (!byEntryId.has(suggestion.entryId)) {
      byEntryId.set(suggestion.entryId, {
        entryId: suggestion.entryId,
        issueCodes: [],
        actions: [],
        commandArgs: suggestion.commandArgs,
        command: suggestion.command,
      });
    }

    const fix = byEntryId.get(suggestion.entryId);
    if (!fix.issueCodes.includes(suggestion.issueCode)) fix.issueCodes.push(suggestion.issueCode);
    if (!fix.actions.includes(suggestion.action)) fix.actions.push(suggestion.action);
  }

  return {
    fixes: [...byEntryId.values()],
    skipped,
  };
}

export function applyLearningAuditFixes({
  filePath = defaultLearningFile(),
  dryRun = true,
  now = new Date(),
} = {}) {
  const beforeAudit = auditLearningProfile({ filePath });
  const { fixes, skipped } = fixableLearningSuggestions(beforeAudit);
  const payload = {
    file: filePath,
    dryRun,
    applied: !dryRun,
    before: beforeAudit.summary,
    cleanupCount: fixes.length,
    cleanup: fixes,
    skipped,
    removed: [],
    after: null,
  };

  if (dryRun || fixes.length === 0) {
    return payload;
  }

  const targetIds = new Set(fixes.map((fix) => fix.entryId));
  const profile = loadLearningProfile(filePath);
  const removed = [];
  const remaining = [];

  for (const entry of profile.entries) {
    if (targetIds.has(entry.id)) {
      removed.push(statsEntry(entry));
    } else {
      remaining.push(entry);
    }
  }

  const removedIds = new Set(removed.map((entry) => entry.id));
  for (const fix of fixes) {
    if (!removedIds.has(fix.entryId)) {
      skipped.push({
        entryId: fix.entryId,
        action: fix.actions.join(","),
        reason: "entry-not-found",
        message: "The entry was not present when applying audit cleanup.",
      });
    }
  }

  const updatedAt = now.toISOString();
  writeLearningProfile(filePath, {
    version: 1,
    updatedAt,
    entries: remaining,
  });

  const afterAudit = auditLearningProfile({ filePath });
  return {
    ...payload,
    cleanupCount: removed.length,
    cleanup: fixes.filter((fix) => removedIds.has(fix.entryId)),
    skipped,
    removed,
    after: afterAudit.summary,
  };
}
