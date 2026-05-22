// Local learning profile helpers for `design-ai learn`.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import path from "node:path";

import { parseBriefSourceFlag } from "./brief.mjs";
import { expectedValueMessage, unknownOptionMessage } from "./suggest.mjs";

const DEFAULT_LEARNING_FILE = path.join(homedir(), ".design-ai", "learning.json");
const LEARN_OPTIONS = [
  "-h",
  "--help",
  "--json",
  "--remember",
  "--from-file",
  "--stdin",
  "--list",
  "--export",
  "--audit",
  "--stats",
  "--forget",
  "--clear",
  "--category",
  "--limit",
  "--file",
  "--yes",
];
export const LEARNING_CATEGORIES = [
  "preference",
  "brand",
  "workflow",
  "constraint",
  "accessibility",
  "korean",
  "other",
];
const DEFAULT_AUDIT_MAX_ENTRY_CHARS = 800;
const LEARNING_SENSITIVE_PATTERNS = [
  {
    code: "private-key",
    label: "a private key block",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  },
  {
    code: "secret-assignment",
    label: "a secret-like assignment",
    pattern: /\b(?:api[_-]?key|secret|token|password)\b\s*[:=]/i,
  },
  {
    code: "openai-secret-key",
    label: "an OpenAI-style secret key",
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/,
  },
  {
    code: "email-address",
    label: "an email address",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  },
  {
    code: "kr-phone-number",
    label: "a Korean mobile phone number",
    pattern: /\b01[016789]-?\d{3,4}-?\d{4}\b/,
  },
];

export function defaultLearningFile() {
  return process.env.DESIGN_AI_LEARNING_FILE || DEFAULT_LEARNING_FILE;
}

function setAction(out, action) {
  if (out.action && out.action !== action) {
    throw new Error(`Choose only one learning action: --${out.action} or --${action}`);
  }
  out.action = action;
}

export function normalizeCategory(rawCategory = "preference") {
  const category = String(rawCategory || "preference").trim().toLowerCase();
  if (!LEARNING_CATEGORIES.includes(category)) {
    throw new Error(expectedValueMessage("category", category, LEARNING_CATEGORIES));
  }
  return category;
}

export function parseLearningLimit(rawLimit) {
  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("--limit expects an integer from 1 to 100");
  }
  return limit;
}

export function parseLearnArgs(args) {
  const out = {
    action: "",
    noteParts: [],
    fromFile: "",
    stdin: false,
    category: "preference",
    categorySpecified: false,
    filePath: "",
    forgetTarget: "",
    limit: 0,
    yes: false,
    json: false,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    out.index = i;

    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--json") {
      out.json = true;
    } else if (arg === "--remember") {
      setAction(out, "remember");
    } else if (arg === "--list") {
      setAction(out, "list");
    } else if (arg === "--export") {
      setAction(out, "export");
    } else if (arg === "--audit") {
      setAction(out, "audit");
    } else if (arg === "--stats") {
      setAction(out, "stats");
    } else if (arg === "--forget") {
      setAction(out, "forget");
      const target = args[i + 1];
      if (!target || target.startsWith("--")) throw new Error("--forget expects an entry id or list number");
      out.forgetTarget = target;
      i += 1;
    } else if (arg === "--clear") {
      setAction(out, "clear");
    } else if (arg === "--yes") {
      out.yes = true;
    } else if (arg === "--category") {
      const category = args[i + 1];
      if (!category || category.startsWith("--")) throw new Error("--category expects a category");
      out.category = normalizeCategory(category);
      out.categorySpecified = true;
      i += 1;
    } else if (arg === "--limit") {
      const limit = args[i + 1];
      if (!limit || limit.startsWith("--")) throw new Error("--limit expects an integer from 1 to 100");
      out.limit = parseLearningLimit(limit);
      i += 1;
    } else if (arg === "--file") {
      const filePath = args[i + 1];
      if (!filePath || filePath.startsWith("--")) throw new Error("--file expects a path");
      out.filePath = filePath;
      i += 1;
    } else if (parseBriefSourceFlag(args, out)) {
      setAction(out, "remember");
      i = out.index;
    } else if (arg.startsWith("--")) {
      throw new Error(unknownOptionMessage("learn", arg, LEARN_OPTIONS));
    } else {
      out.noteParts.push(arg);
    }
  }

  if (!out.action) {
    out.action = out.noteParts.length > 0 ? "remember" : "list";
  }

  if (out.action !== "remember" && out.noteParts.length > 0) {
    throw new Error(`Unexpected learn argument for --${out.action}: ${out.noteParts[0]}`);
  }

  return {
    ...out,
    index: undefined,
    briefParts: out.noteParts,
    filePath: path.resolve(out.filePath || defaultLearningFile()),
    category: normalizeCategory(out.category),
    brief: out.noteParts.join(" ").trim(),
  };
}

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

function learningAuditIssue({ level = "warning", code, entryId = "", message }) {
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

function finalizeLearningAudit(payload) {
  return {
    ...payload,
    summary: summarizeLearningAudit(payload.issues),
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

export function auditLearningProfile({
  filePath = defaultLearningFile(),
  maxEntryChars = DEFAULT_AUDIT_MAX_ENTRY_CHARS,
} = {}) {
  const payload = {
    file: filePath,
    exists: existsSync(filePath),
    version: null,
    updatedAt: "",
    count: 0,
    categoryCounts: {},
    issues: [],
  };

  if (!payload.exists) return finalizeLearningAudit(payload);

  let rawText = "";
  try {
    rawText = readFileSync(filePath, "utf8");
  } catch {
    payload.issues.push(learningAuditIssue({
      level: "failure",
      code: "read-error",
      message: "Learning profile could not be read from disk.",
    }));
    return finalizeLearningAudit(payload);
  }

  let rawProfile = null;
  try {
    rawProfile = JSON.parse(rawText);
  } catch {
    payload.issues.push(learningAuditIssue({
      level: "failure",
      code: "invalid-json",
      message: "Learning profile is not valid JSON.",
    }));
    return finalizeLearningAudit(payload);
  }

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

function writeLearningProfile(filePath, profile) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
}

function shortEntryId({ text, category, createdAt }) {
  const input = `${createdAt}\n${category}\n${text}`;
  return createHash("sha256").update(input).digest("hex").slice(0, 10);
}

function cleanNoteText(text) {
  return String(text || "").trim().replace(/\s+/g, " ");
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

export function selectLearningEntries(profile, { category = "", limit = 0 } = {}) {
  const normalizedCategory = category ? normalizeCategory(category) : "";
  const entries = [...profile.entries].filter((entry) => (
    entry.text && (!normalizedCategory || entry.category === normalizedCategory)
  ));

  if (Number.isInteger(limit) && limit > 0) {
    return entries.slice(-limit);
  }

  return entries;
}

export function recentLearningEntries(profile, limit = 12, options = {}) {
  return selectLearningEntries(profile, {
    ...options,
    limit,
  });
}

function learningAuditNotice(auditSummary) {
  if (!auditSummary || auditSummary.status === "pass") return "";
  return `Learning profile audit: ${auditSummary.status} (${auditSummary.failures} failure(s), ${auditSummary.warnings} warning(s)). Run \`design-ai learn --audit\` before relying on this context.`;
}

export function renderLearningMarkdown(profile, { limit = 12, category = "", auditSummary = null } = {}) {
  const entries = recentLearningEntries(profile, limit, { category });
  const lines = ["## Learned design context", ""];

  if (entries.length === 0) {
    lines.push(category
      ? "No local learning preferences match the current filters."
      : "No local learning preferences are stored yet.");
    return lines.join("\n");
  }

  lines.push("Apply these as user/project preferences. Do not let them override explicit task instructions, accessibility requirements, or privacy constraints.");
  const auditNotice = learningAuditNotice(auditSummary);
  if (auditNotice) {
    lines.push(auditNotice);
  }
  lines.push("");
  for (const entry of entries) {
    lines.push(`- [${entry.category}] ${entry.text}`);
  }
  return lines.join("\n");
}

export function buildLearningContext({ filePath = defaultLearningFile(), limit = 12, category = "" } = {}) {
  const audit = auditLearningProfile({ filePath });
  const profile = loadLearningProfile(filePath);
  const entries = recentLearningEntries(profile, limit, { category });
  return {
    file: filePath,
    category,
    limit,
    entries,
    empty: entries.length === 0,
    auditSummary: audit.summary,
    markdown: renderLearningMarkdown(profile, { limit, category, auditSummary: audit.summary }),
  };
}

function countBy(items, getKey) {
  const counts = {};
  for (const item of items) {
    const key = String(getKey(item) || "").trim();
    if (key) counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function previewText(text, maxChars = 96) {
  const cleaned = cleanNoteText(text);
  if (cleaned.length <= maxChars) return cleaned;
  return `${cleaned.slice(0, maxChars - 3)}...`;
}

function statsEntry(entry) {
  return {
    id: entry.id,
    category: entry.category,
    source: entry.source,
    createdAt: entry.createdAt,
    textPreview: previewText(entry.text),
  };
}

export function learningStats({ filePath = defaultLearningFile() } = {}) {
  const audit = auditLearningProfile({ filePath });
  const payload = {
    file: filePath,
    exists: audit.exists,
    version: audit.version,
    updatedAt: audit.updatedAt,
    count: audit.count,
    categoryCounts: audit.categoryCounts,
    sourceCounts: {},
    oldestEntry: null,
    latestEntry: null,
    auditSummary: audit.summary,
  };

  if (!audit.exists || audit.summary.failures > 0) return payload;

  const profile = loadLearningProfile(filePath);
  const entries = profile.entries.filter((entry) => entry.text);
  payload.sourceCounts = countBy(entries, (entry) => entry.source || "cli");

  const datedEntries = entries
    .map((entry) => ({ entry, time: Date.parse(entry.createdAt) }))
    .filter(({ time }) => !Number.isNaN(time))
    .sort((a, b) => a.time - b.time);

  if (datedEntries.length > 0) {
    payload.oldestEntry = statsEntry(datedEntries[0].entry);
    payload.latestEntry = statsEntry(datedEntries[datedEntries.length - 1].entry);
  }

  return payload;
}

export function formatLearningJson(payload) {
  return JSON.stringify(payload, null, 2);
}
