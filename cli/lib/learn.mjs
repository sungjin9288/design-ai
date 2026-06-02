// Local learning profile helpers for `design-ai learn`.

import {
  existsSync,
  unlinkSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import path from "node:path";

import { parseBriefSourceFlag } from "./brief.mjs";
import { parseOutputFlags } from "./output.mjs";
import { expectedValueMessage, unknownOptionMessage } from "./suggest.mjs";

const DEFAULT_LEARNING_FILE = path.join(homedir(), ".design-ai", "learning.json");
const DEFAULT_LEARNING_USAGE_EVENT_LIMIT = 500;
const LEARN_OPTIONS = [
  "-h",
  "--help",
  "--json",
  "--init",
  "--remember",
  "--feedback",
  "--from-file",
  "--stdin",
  "--out",
  "--output",
  "--force",
  "--query",
  "--explain",
  "--list",
  "--export",
  "--import",
  "--backup",
  "--verify",
  "--diff",
  "--restore",
  "--restore-backups",
  "--prune",
  "--redact",
  "--audit",
  "--stats",
  "--usage",
  "--eval",
  "--eval-template",
  "--strict",
  "--curate",
  "--report",
  "--fix",
  "--dry-run",
  "--outcome",
  "--forget",
  "--clear",
  "--category",
  "--limit",
  "--keep",
  "--file",
  "--usage-file",
  "--backup-file",
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
export const LEARNING_FEEDBACK_OUTCOMES = [
  "keep",
  "improve",
  "avoid",
];
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

export function defaultLearningUsageFile(filePath = defaultLearningFile()) {
  if (process.env.DESIGN_AI_LEARNING_USAGE_FILE) {
    return process.env.DESIGN_AI_LEARNING_USAGE_FILE;
  }

  const parsed = path.parse(filePath);
  const ext = parsed.ext || ".json";
  return path.join(parsed.dir, `${parsed.name}.usage${ext}`);
}

export function defaultLearningRestoreBackupFile(filePath = defaultLearningFile(), now = new Date()) {
  const resolvedFile = path.resolve(filePath);
  const parsed = path.parse(resolvedFile);
  const ext = parsed.ext || ".json";
  const timestamp = (now instanceof Date ? now : new Date(now))
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\./g, "");
  return path.join(parsed.dir, `${parsed.name}.restore-backup-${timestamp}${ext}`);
}

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

export function normalizeFeedbackOutcome(rawOutcome = "improve") {
  const outcome = String(rawOutcome || "improve").trim().toLowerCase();
  if (!LEARNING_FEEDBACK_OUTCOMES.includes(outcome)) {
    throw new Error(expectedValueMessage("outcome", outcome, LEARNING_FEEDBACK_OUTCOMES));
  }
  return outcome;
}

export function parseLearningLimit(rawLimit) {
  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("--limit expects an integer from 1 to 100");
  }
  return limit;
}

export function parseLearningKeep(rawKeep) {
  const keep = Number(rawKeep);
  if (!Number.isInteger(keep) || keep < 1 || keep > 100) {
    throw new Error("--keep expects an integer from 1 to 100");
  }
  return keep;
}

export function parseLearnArgs(args) {
  const out = {
    action: "",
    noteParts: [],
    fromFile: "",
    stdin: false,
    category: "preference",
    categorySpecified: false,
    feedbackOutcome: "improve",
    outcomeSpecified: false,
    filePath: "",
    usageFilePath: "",
    backupFilePath: "",
    outPath: "",
    force: false,
    query: "",
    explain: false,
    forgetTarget: "",
    limit: 0,
    keep: 0,
    fix: false,
    prune: false,
    dryRun: false,
    strict: false,
    report: false,
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
    } else if (arg === "--init") {
      setAction(out, "init");
    } else if (arg === "--remember") {
      setAction(out, "remember");
    } else if (arg === "--feedback") {
      setAction(out, "feedback");
    } else if (arg === "--list") {
      setAction(out, "list");
    } else if (arg === "--export") {
      setAction(out, "export");
    } else if (arg === "--import") {
      setAction(out, "import");
    } else if (arg === "--backup") {
      setAction(out, "backup");
    } else if (arg === "--verify") {
      setAction(out, "verify");
    } else if (arg === "--diff") {
      setAction(out, "diff");
    } else if (arg === "--restore") {
      setAction(out, "restore");
    } else if (arg === "--restore-backups") {
      setAction(out, "restore-backups");
    } else if (arg === "--prune") {
      out.prune = true;
    } else if (arg === "--redact") {
      setAction(out, "redact");
    } else if (arg === "--audit") {
      setAction(out, "audit");
    } else if (arg === "--stats") {
      setAction(out, "stats");
    } else if (arg === "--usage") {
      setAction(out, "usage");
    } else if (arg === "--eval") {
      setAction(out, "eval");
    } else if (arg === "--eval-template") {
      setAction(out, "eval-template");
    } else if (arg === "--curate") {
      setAction(out, "curate");
    } else if (arg === "--report") {
      out.report = true;
    } else if (arg === "--fix") {
      out.fix = true;
    } else if (arg === "--dry-run") {
      out.dryRun = true;
    } else if (arg === "--strict") {
      out.strict = true;
    } else if (arg === "--query") {
      const query = args[i + 1];
      if (!query || query.startsWith("--")) throw new Error("--query expects search text");
      out.query = String(query).trim();
      i += 1;
    } else if (arg === "--explain") {
      out.explain = true;
    } else if (arg === "--outcome") {
      const outcome = args[i + 1];
      if (!outcome || outcome.startsWith("--")) throw new Error("--outcome expects keep, improve, or avoid");
      out.feedbackOutcome = normalizeFeedbackOutcome(outcome);
      out.outcomeSpecified = true;
      i += 1;
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
    } else if (arg === "--keep") {
      const keep = args[i + 1];
      if (!keep || keep.startsWith("--")) throw new Error("--keep expects an integer from 1 to 100");
      out.keep = parseLearningKeep(keep);
      i += 1;
    } else if (arg === "--file") {
      const filePath = args[i + 1];
      if (!filePath || filePath.startsWith("--")) throw new Error("--file expects a path");
      out.filePath = filePath;
      i += 1;
    } else if (arg === "--usage-file") {
      const usageFilePath = args[i + 1];
      if (!usageFilePath || usageFilePath.startsWith("--")) throw new Error("--usage-file expects a path");
      out.usageFilePath = usageFilePath;
      i += 1;
    } else if (arg === "--backup-file") {
      const backupFilePath = args[i + 1];
      if (!backupFilePath || backupFilePath.startsWith("--")) throw new Error("--backup-file expects a path");
      out.backupFilePath = backupFilePath;
      i += 1;
    } else if (parseBriefSourceFlag(args, out)) {
      if (!out.action) {
        setAction(out, "remember");
      } else if (!["remember", "feedback", "import", "verify", "diff", "restore", "redact", "eval"].includes(out.action)) {
        setAction(out, "remember");
      }
      i = out.index;
    } else if (parseOutputFlags(args, out)) {
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

  if (!["remember", "feedback"].includes(out.action) && out.noteParts.length > 0) {
    throw new Error(`Unexpected learn argument for --${out.action}: ${out.noteParts[0]}`);
  }
  if (out.outcomeSpecified && out.action !== "feedback") {
    throw new Error("--outcome can only be used with --feedback");
  }
  if (out.fix && out.action !== "audit") {
    throw new Error("--fix can only be used with --audit");
  }
  if (out.prune && out.action !== "restore-backups") {
    throw new Error("--prune can only be used with --restore-backups");
  }
  if (out.keep && !(out.action === "restore-backups" && out.prune)) {
    throw new Error("--keep can only be used with --restore-backups --prune");
  }
  if (out.dryRun && !out.fix && !["import", "init", "curate", "restore"].includes(out.action) && !(out.action === "restore-backups" && out.prune)) {
    throw new Error("--dry-run requires --fix, --init, --import, --restore, --curate, or --restore-backups --prune");
  }
  if (out.fix && out.dryRun && out.yes) {
    throw new Error("Choose either --dry-run or --yes for --audit --fix");
  }
  if (out.action === "import" && out.dryRun && out.yes) {
    throw new Error("Choose either --dry-run or --yes for --import");
  }
  if (out.action === "restore" && out.dryRun && out.yes) {
    throw new Error("Choose either --dry-run or --yes for --restore");
  }
  if (out.action === "init" && out.dryRun && out.yes) {
    throw new Error("Choose either --dry-run or --yes for --init");
  }
  if (out.action === "curate" && out.dryRun && out.yes) {
    throw new Error("Choose either --dry-run or --yes for --curate");
  }
  if (out.action === "restore-backups" && out.prune && out.dryRun && out.yes) {
    throw new Error("Choose either --dry-run or --yes for --restore-backups --prune");
  }
  if (out.action === "restore-backups" && out.yes && !out.prune) {
    throw new Error("--yes can only be used with --restore-backups --prune");
  }
  if (out.action === "feedback" && !out.categorySpecified) {
    out.category = "workflow";
  }
  if (out.query && !["list", "export", "eval-template"].includes(out.action)) {
    throw new Error("--query can only be used with --list, --export, or --eval-template");
  }
  if (out.explain && out.action !== "list") {
    throw new Error("--explain can only be used with --list");
  }
  if (out.usageFilePath && !["usage", "curate"].includes(out.action)) {
    throw new Error("--usage-file can only be used with --usage or --curate");
  }
  if (out.backupFilePath && out.action !== "restore") {
    throw new Error("--backup-file can only be used with --restore");
  }
  if (out.report && out.action !== "curate") {
    throw new Error("--report can only be used with --curate");
  }
  if (out.report && out.json) {
    throw new Error("Choose either --json or --report for --curate");
  }
  if (out.strict && out.action !== "eval") {
    throw new Error("--strict can only be used with --eval");
  }
  if (out.action === "eval" && !out.fromFile && !out.stdin) {
    throw new Error("--eval requires --from-file or --stdin");
  }
  if (out.action === "diff" && !out.fromFile && !out.stdin) {
    throw new Error("--diff requires --from-file or --stdin");
  }
  if (out.action === "restore" && !out.fromFile && !out.stdin) {
    throw new Error("--restore requires --from-file or --stdin");
  }
  const allowsMarkdownOut = ["export", "eval-template"].includes(out.action)
    || (out.action === "curate" && out.report);
  if (!out.help && out.outPath && !allowsMarkdownOut && !out.json) {
    throw new Error("--out requires --json for learn actions other than --export, --eval-template, or --curate --report");
  }

  const resolvedFilePath = path.resolve(out.filePath || defaultLearningFile());
  return {
    ...out,
    index: undefined,
    briefParts: out.noteParts,
    filePath: resolvedFilePath,
    usageFilePath: path.resolve(out.usageFilePath || defaultLearningUsageFile(resolvedFilePath)),
    backupFilePath: out.backupFilePath ? path.resolve(out.backupFilePath) : "",
    category: normalizeCategory(out.category),
    feedbackOutcome: normalizeFeedbackOutcome(out.feedbackOutcome),
    query: out.query,
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

function shellQuote(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_/:=.,@%+-]+$/.test(text)) return text;
  return `'${text.replace(/'/g, "'\\''")}'`;
}

function commandFromArgs(args) {
  return args.map(shellQuote).join(" ");
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

function auditLearningProfileObject(rawProfile, {
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

function writeLearningProfile(filePath, profile) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
}

function shortEntryId({ text, category, createdAt }) {
  const input = `${createdAt}\n${category}\n${text}`;
  return createHash("sha256").update(input).digest("hex").slice(0, 10);
}

function shortHash(value) {
  return createHash("sha256").update(String(value || "")).digest("hex").slice(0, 16);
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

function learningEntryMergeKey(entry) {
  return `${entry.category}\n${cleanNoteText(entry.text).toLowerCase()}`;
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

function uniqueImportedEntryId(entry, usedIds) {
  if (entry.id && !usedIds.has(entry.id)) return entry.id;

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const suffix = attempt === 0 ? "" : `:${attempt}`;
    const candidate = `learn-${shortEntryId({
      text: entry.text,
      category: entry.category,
      createdAt: `${entry.createdAt}:${entry.source}${suffix}`,
    })}`;
    if (!usedIds.has(candidate)) return candidate;
  }

  throw new Error("Could not allocate a unique learning entry id during import");
}

function parseLearningProfilePayload(importText, label = "Learning import") {
  let payload = null;
  try {
    payload = JSON.parse(importText);
  } catch (error) {
    throw new Error(`${label} is not valid JSON`);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(`${label} must be a JSON object with an entries array`);
  }
  if (!Array.isArray(payload.entries)) {
    throw new Error(`${label} must include an entries array`);
  }

  return payload;
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

function learningQueryTokens(query) {
  return Array.from(new Set(
    String(query || "")
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) || [],
  )).filter((token) => token.length >= 2);
}

function learningEntryRelevance(entry, queryTokens) {
  if (queryTokens.length === 0) {
    return { score: 0, matchedTokens: [] };
  }

  const text = cleanNoteText(`${entry.category || ""} ${entry.text || ""}`).toLowerCase();
  if (!text) return { score: 0, matchedTokens: [] };

  let score = 0;
  const matchedTokens = [];
  for (const token of queryTokens) {
    if (text.includes(token)) {
      score += token.length >= 4 ? 2 : 1;
      matchedTokens.push(token);
    }
  }
  return { score, matchedTokens };
}

function learningEntryTime(entry) {
  const time = Date.parse(entry.createdAt || "");
  return Number.isNaN(time) ? 0 : time;
}

function rankLearningEntries(entries, { query = "" } = {}) {
  const queryTokens = learningQueryTokens(query);
  const ranked = entries.map((entry, index) => {
    const relevance = learningEntryRelevance(entry, queryTokens);
    return {
      entry,
      index,
      score: relevance.score,
      matchedTokens: relevance.matchedTokens,
      time: learningEntryTime(entry),
    };
  });

  if (queryTokens.length === 0) {
    return {
      entries,
      ranked,
      query: "",
      mode: "recency",
      candidateCount: entries.length,
      matchedCount: 0,
      queryTokenCount: 0,
    };
  }

  ranked.sort((a, b) => (
    b.score - a.score
    || b.time - a.time
    || b.index - a.index
  ));

  return {
    entries: ranked.map((item) => item.entry),
    ranked,
    query: String(query || "").trim(),
    mode: "brief-relevance",
    candidateCount: entries.length,
    matchedCount: ranked.filter((item) => item.score > 0).length,
    queryTokenCount: queryTokens.length,
  };
}

function learningSelectionReason(item, mode) {
  if (mode !== "brief-relevance") return "recency";
  return item.score > 0 ? "brief-match" : "recency-fallback";
}

function learningSelectionItem(item, mode) {
  return {
    id: item.entry.id,
    category: item.entry.category,
    score: item.score,
    matchedTokens: item.matchedTokens,
    reason: learningSelectionReason(item, mode),
  };
}

export function selectLearningEntrySet(profile, {
  category = "",
  limit = 0,
  query = "",
  includeFallback = true,
} = {}) {
  const normalizedCategory = category ? normalizeCategory(category) : "";
  const entries = [...profile.entries].filter((entry) => (
    entry.text && (!normalizedCategory || entry.category === normalizedCategory)
  ));
  const ranked = rankLearningEntries(entries, { query });
  const rankedItems = ranked.mode === "brief-relevance" && !includeFallback
    ? ranked.ranked.filter((item) => item.score > 0)
    : ranked.ranked;
  const selectedItems = Number.isInteger(limit) && limit > 0
    ? ranked.mode === "brief-relevance"
      ? rankedItems.slice(0, limit)
      : rankedItems.slice(-limit)
    : rankedItems;
  const selected = selectedItems.map((item) => item.entry);

  return {
    entries: selected,
    selection: {
      mode: ranked.mode,
      query: ranked.query,
      candidateCount: ranked.candidateCount,
      matchedCount: ranked.matchedCount,
      queryTokenCount: ranked.queryTokenCount,
      fallbackEnabled: ranked.mode === "brief-relevance" ? includeFallback : false,
      selectedCount: selected.length,
      fallbackCount: ranked.mode === "brief-relevance"
        ? selectedItems.filter((item) => item.score === 0).length
        : 0,
      selected: selectedItems.map((item) => learningSelectionItem(item, ranked.mode)),
    },
  };
}

export function selectLearningEntries(profile, {
  category = "",
  limit = 0,
  query = "",
  includeFallback = true,
} = {}) {
  return selectLearningEntrySet(profile, {
    category,
    limit,
    query,
    includeFallback,
  }).entries;
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

function learningSelectionNotice(selection) {
  if (!selection || selection.mode !== "brief-relevance") return "";
  const fallback = selection.fallbackEnabled
    ? "recency fallback for ties"
    : "no recency fallback";
  return `Learning selection: brief relevance (${selection.matchedCount}/${selection.candidateCount} matched; ${fallback}).`;
}

export function renderLearningMarkdown(profile, {
  limit = 12,
  category = "",
  query = "",
  includeFallback = true,
  auditSummary = null,
} = {}) {
  const { entries, selection } = selectLearningEntrySet(profile, {
    category,
    limit,
    query,
    includeFallback,
  });
  const lines = ["## Learned design context", ""];

  if (entries.length === 0) {
    lines.push(category || query
      ? "No local learning preferences match the current filters."
      : "No local learning preferences are stored yet.");
    return lines.join("\n");
  }

  lines.push("Apply these as user/project preferences. Do not let them override explicit task instructions, accessibility requirements, or privacy constraints.");
  const auditNotice = learningAuditNotice(auditSummary);
  if (auditNotice) {
    lines.push(auditNotice);
  }
  const selectionNotice = learningSelectionNotice(selection);
  if (selectionNotice) {
    lines.push(selectionNotice);
  }
  lines.push("");
  for (const entry of entries) {
    lines.push(`- [${entry.category}] ${entry.text}`);
  }
  return lines.join("\n");
}

export function buildLearningContext({
  filePath = defaultLearningFile(),
  limit = 12,
  category = "",
  query = "",
  includeFallback = true,
} = {}) {
  const audit = auditLearningProfile({ filePath });
  const profile = loadLearningProfile(filePath);
  const { entries, selection } = selectLearningEntrySet(profile, {
    category,
    limit,
    query,
    includeFallback,
  });
  return {
    file: filePath,
    category,
    limit,
    query: String(query || "").trim(),
    selection,
    entries,
    empty: entries.length === 0,
    auditSummary: audit.summary,
    markdown: renderLearningMarkdown(profile, {
      limit,
      category,
      query,
      includeFallback,
      auditSummary: audit.summary,
    }),
  };
}

export function emptyLearningUsageLog({ profileFile = "" } = {}) {
  return {
    version: 1,
    updatedAt: "",
    profileFile,
    events: [],
  };
}

function normalizeLearningUsageEvent(event) {
  if (!event || typeof event !== "object" || Array.isArray(event)) return null;
  const createdAt = String(event.createdAt || "").trim();
  const command = String(event.command || "").trim();
  const selectedEntryIds = Array.isArray(event.selectedEntryIds)
    ? event.selectedEntryIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];

  if (!createdAt || !command) return null;

  return {
    id: String(event.id || `learn-use-${shortHash(`${createdAt}\n${command}`)}`).trim(),
    command,
    routeId: String(event.routeId || "").trim(),
    profileFile: String(event.profileFile || "").trim(),
    briefHash: String(event.briefHash || "").trim(),
    category: String(event.category || "").trim(),
    limit: Number.isInteger(event.limit) ? event.limit : null,
    selectedEntryIds,
    selectedCount: Number.isInteger(event.selectedCount) ? event.selectedCount : selectedEntryIds.length,
    candidateCount: Number.isInteger(event.candidateCount) ? event.candidateCount : 0,
    matchedCount: Number.isInteger(event.matchedCount) ? event.matchedCount : 0,
    fallbackCount: Number.isInteger(event.fallbackCount) ? event.fallbackCount : 0,
    queryTokenCount: Number.isInteger(event.queryTokenCount) ? event.queryTokenCount : 0,
    auditStatus: String(event.auditStatus || "").trim(),
    createdAt,
  };
}

export function normalizeLearningUsageLog(rawLog, { profileFile = "" } = {}) {
  const log = rawLog && typeof rawLog === "object" ? rawLog : {};
  const events = Array.isArray(log.events)
    ? log.events.map(normalizeLearningUsageEvent).filter(Boolean)
    : [];

  return {
    version: Number.isInteger(log.version) ? log.version : 1,
    updatedAt: String(log.updatedAt || "").trim(),
    profileFile: String(log.profileFile || profileFile || "").trim(),
    events,
  };
}

export function loadLearningUsageLog(filePath = defaultLearningUsageFile(), { profileFile = "" } = {}) {
  if (!existsSync(filePath)) {
    return emptyLearningUsageLog({ profileFile });
  }

  const raw = readFileSync(filePath, "utf8");
  try {
    return normalizeLearningUsageLog(JSON.parse(raw), { profileFile });
  } catch {
    throw new Error(`Learning usage log is not valid JSON: ${filePath}`);
  }
}

function writeLearningUsageLog(filePath, log) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(log, null, 2)}\n`, "utf8");
}

export function buildLearningUsageEvent({
  command,
  routeId = "",
  learningContext,
  now = new Date(),
} = {}) {
  if (!learningContext) return null;

  const createdAt = now.toISOString();
  const selection = learningContext.selection || {};
  const selectedEntryIds = Array.isArray(selection.selected) && selection.selected.length > 0
    ? selection.selected.map((item) => item?.id).filter(Boolean)
    : (learningContext.entries || []).map((entry) => entry.id).filter(Boolean);
  const normalizedCommand = String(command || "").trim();

  return {
    id: `learn-use-${shortHash([
      createdAt,
      normalizedCommand,
      routeId,
      selectedEntryIds.join(","),
      learningContext.query || "",
    ].join("\n"))}`,
    command: normalizedCommand,
    routeId: String(routeId || "").trim(),
    profileFile: String(learningContext.file || "").trim(),
    briefHash: shortHash(learningContext.query || ""),
    category: String(learningContext.category || "").trim(),
    limit: Number.isInteger(learningContext.limit) ? learningContext.limit : null,
    selectedEntryIds,
    selectedCount: Number.isInteger(selection.selectedCount) ? selection.selectedCount : selectedEntryIds.length,
    candidateCount: Number.isInteger(selection.candidateCount) ? selection.candidateCount : 0,
    matchedCount: Number.isInteger(selection.matchedCount) ? selection.matchedCount : 0,
    fallbackCount: Number.isInteger(selection.fallbackCount) ? selection.fallbackCount : 0,
    queryTokenCount: Number.isInteger(selection.queryTokenCount) ? selection.queryTokenCount : 0,
    auditStatus: String(learningContext.auditSummary?.status || "").trim(),
    createdAt,
  };
}

export function recordLearningUsage({
  command,
  routeId = "",
  learningContext,
  usageFile = defaultLearningUsageFile(learningContext?.file || defaultLearningFile()),
  now = new Date(),
  eventLimit = DEFAULT_LEARNING_USAGE_EVENT_LIMIT,
} = {}) {
  const event = buildLearningUsageEvent({
    command,
    routeId,
    learningContext,
    now,
  });
  const resolvedUsageFile = path.resolve(usageFile);

  if (!event) {
    return {
      file: resolvedUsageFile,
      recorded: false,
      reason: "missing-learning-context",
      count: 0,
      event: null,
    };
  }

  const log = loadLearningUsageLog(resolvedUsageFile, { profileFile: event.profileFile });
  const updatedAt = event.createdAt;
  const maxEvents = Number.isInteger(eventLimit) && eventLimit > 0
    ? eventLimit
    : DEFAULT_LEARNING_USAGE_EVENT_LIMIT;
  const events = [...log.events, event].slice(-maxEvents);
  const nextLog = {
    version: 1,
    updatedAt,
    profileFile: event.profileFile || log.profileFile,
    events,
  };

  writeLearningUsageLog(resolvedUsageFile, nextLog);

  return {
    file: resolvedUsageFile,
    recorded: true,
    event,
    count: nextLog.events.length,
    eventLimit: maxEvents,
  };
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

function usageEventTime(event) {
  const time = Date.parse(event.createdAt);
  return Number.isNaN(time) ? 0 : time;
}

function usageEventSummary(event) {
  return {
    id: event.id,
    command: event.command,
    routeId: event.routeId,
    category: event.category,
    limit: event.limit,
    selectedEntryIds: event.selectedEntryIds,
    selectedCount: event.selectedCount,
    candidateCount: event.candidateCount,
    matchedCount: event.matchedCount,
    fallbackCount: event.fallbackCount,
    queryTokenCount: event.queryTokenCount,
    auditStatus: event.auditStatus,
    briefHash: event.briefHash,
    createdAt: event.createdAt,
  };
}

function incrementUsageEntry(entryUsage, entryId, event) {
  if (!entryId) return;
  const existing = entryUsage.get(entryId) || {
    id: entryId,
    count: 0,
    commands: {},
    routes: {},
    latestUsedAt: "",
  };
  existing.count += 1;
  if (event.command) existing.commands[event.command] = (existing.commands[event.command] || 0) + 1;
  if (event.routeId) existing.routes[event.routeId] = (existing.routes[event.routeId] || 0) + 1;
  if (!existing.latestUsedAt || usageEventTime(event) >= Date.parse(existing.latestUsedAt || "1970-01-01T00:00:00.000Z")) {
    existing.latestUsedAt = event.createdAt;
  }
  entryUsage.set(entryId, existing);
}

function usageEntrySummary(entry, usage) {
  return {
    id: entry.id,
    category: entry.category,
    source: entry.source,
    textPreview: previewText(entry.text),
    usageCount: usage?.count || 0,
    latestUsedAt: usage?.latestUsedAt || "",
    commands: usage?.commands || {},
    routes: usage?.routes || {},
  };
}

function parseLearningEvalPayload(evalText, source = "input") {
  let payload = null;
  try {
    payload = JSON.parse(String(evalText || ""));
  } catch {
    throw new Error("Learning eval checkpoint is not valid JSON");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Learning eval checkpoint must be a JSON object with a cases array");
  }
  if (!Array.isArray(payload.cases)) {
    throw new Error("Learning eval checkpoint must include a cases array");
  }
  if (payload.cases.length === 0) {
    throw new Error("Learning eval checkpoint has no cases");
  }

  return {
    source,
    version: Number.isInteger(payload.version) ? payload.version : 1,
    generatedAt: safeIsoString(payload.generatedAt),
    sourceProfile: summarizeLearningEvalSourceProfile(payload.sourceProfile),
    cases: payload.cases,
  };
}

function safeIsoString(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return Number.isNaN(Date.parse(text)) ? "" : text;
}

function nullableBoolean(value) {
  return typeof value === "boolean" ? value : null;
}

function nullableNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function summarizeLearningEvalSourceProfile(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  return {
    file: String(value.file || "").trim(),
    exists: nullableBoolean(value.exists),
    entryCount: nullableNonNegativeInteger(value.entryCount),
    auditStatus: ["pass", "warn", "fail"].includes(String(value.auditStatus || ""))
      ? String(value.auditStatus)
      : "",
    category: value.category ? normalizeCategory(value.category) : "",
    queryPresent: Boolean(cleanNoteText(value.query)),
    limit: nullableNonNegativeInteger(value.limit),
  };
}

function evalStringList(value, { field, caseId }) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`Learning eval case ${caseId} field ${field} must be an array of ids`);
  }
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function evalPositiveInteger(value, { field, caseId, fallback }) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 100) {
    throw new Error(`Learning eval case ${caseId} field ${field} must be an integer from 1 to 100`);
  }
  return number;
}

function evalNonNegativeInteger(value, { field, caseId, fallback = 0 }) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 100) {
    throw new Error(`Learning eval case ${caseId} field ${field} must be an integer from 0 to 100`);
  }
  return number;
}

function normalizeLearningEvalCase(rawCase, index, {
  defaultLimit = 12,
  defaultCategory = "",
} = {}) {
  const caseId = String(rawCase?.id || `case-${index + 1}`).trim() || `case-${index + 1}`;
  if (!rawCase || typeof rawCase !== "object" || Array.isArray(rawCase)) {
    throw new Error(`Learning eval case ${caseId} must be an object`);
  }

  const brief = cleanNoteText(rawCase.brief || rawCase.query);
  if (!brief) {
    throw new Error(`Learning eval case ${caseId} requires a brief`);
  }

  const category = rawCase.category !== undefined
    ? String(rawCase.category || "").trim()
    : defaultCategory;

  return {
    id: caseId,
    routeId: String(rawCase.routeId || "").trim(),
    brief,
    briefHash: shortHash(brief),
    category: category ? normalizeCategory(category) : "",
    limit: evalPositiveInteger(rawCase.limit, {
      field: "limit",
      caseId,
      fallback: defaultLimit,
    }),
    expectedSelectedIds: evalStringList(
      rawCase.expectedSelectedIds ?? rawCase.expectSelectedIds ?? rawCase.expectedEntryIds,
      { field: "expectedSelectedIds", caseId },
    ),
    avoidedSelectedIds: evalStringList(
      rawCase.avoidedSelectedIds ?? rawCase.avoidSelectedIds ?? rawCase.avoidEntryIds,
      { field: "avoidedSelectedIds", caseId },
    ),
    minMatchedCount: evalNonNegativeInteger(rawCase.minMatchedCount, {
      field: "minMatchedCount",
      caseId,
      fallback: 0,
    }),
    requireNoFallback: Boolean(rawCase.requireNoFallback),
  };
}

function learningEvalIssue({ level = "warning", code, message }) {
  return { level, code, message };
}

function summarizeLearningEvalIssues(issues) {
  const failures = issues.filter((issue) => issue.level === "failure").length;
  const warnings = issues.filter((issue) => issue.level === "warning").length;
  return {
    status: failures > 0 ? "fail" : warnings > 0 ? "warn" : "pass",
    failures,
    warnings,
  };
}

function selectedEvalEntry(item) {
  return {
    id: item.id,
    category: item.category,
    score: item.score,
    reason: item.reason,
  };
}

function evaluateLearningCase(profile, rawCase, index, {
  defaultLimit = 12,
  defaultCategory = "",
} = {}) {
  const evalCase = normalizeLearningEvalCase(rawCase, index, {
    defaultLimit,
    defaultCategory,
  });
  const { selection } = selectLearningEntrySet(profile, {
    category: evalCase.category,
    limit: evalCase.limit,
    query: evalCase.brief,
    includeFallback: true,
  });
  const selected = Array.isArray(selection.selected) ? selection.selected : [];
  const selectedEntryIds = selected.map((item) => item.id).filter(Boolean);
  const selectedEntryIdSet = new Set(selectedEntryIds);
  const profileEntryIds = new Set(profile.entries.map((entry) => entry.id).filter(Boolean));
  const issues = [];

  const missingProfileExpectedIds = evalCase.expectedSelectedIds
    .filter((entryId) => !profileEntryIds.has(entryId));
  const missingExpectedIds = evalCase.expectedSelectedIds
    .filter((entryId) => !selectedEntryIdSet.has(entryId));
  const unexpectedAvoidedIds = evalCase.avoidedSelectedIds
    .filter((entryId) => selectedEntryIdSet.has(entryId));

  for (const entryId of missingProfileExpectedIds) {
    issues.push(learningEvalIssue({
      level: "failure",
      code: "expected-entry-not-in-profile",
      message: `Expected entry ${entryId} is not present in the active learning profile.`,
    }));
  }
  if (missingExpectedIds.length > 0) {
    issues.push(learningEvalIssue({
      level: "failure",
      code: "expected-entry-not-selected",
      message: `Expected selected entries were missing: ${missingExpectedIds.join(", ")}.`,
    }));
  }
  if (unexpectedAvoidedIds.length > 0) {
    issues.push(learningEvalIssue({
      level: "failure",
      code: "avoided-entry-selected",
      message: `Avoided entries were selected: ${unexpectedAvoidedIds.join(", ")}.`,
    }));
  }
  if (selection.matchedCount < evalCase.minMatchedCount) {
    issues.push(learningEvalIssue({
      level: "failure",
      code: "matched-count-below-minimum",
      message: `Matched ${selection.matchedCount} learning entries, expected at least ${evalCase.minMatchedCount}.`,
    }));
  }
  if (evalCase.requireNoFallback && selection.fallbackCount > 0) {
    issues.push(learningEvalIssue({
      level: "failure",
      code: "fallback-selected",
      message: `Selected ${selection.fallbackCount} recency fallback entr${selection.fallbackCount === 1 ? "y" : "ies"}.`,
    }));
  }
  if (
    evalCase.expectedSelectedIds.length === 0
    && evalCase.avoidedSelectedIds.length === 0
    && evalCase.minMatchedCount === 0
    && !evalCase.requireNoFallback
  ) {
    issues.push(learningEvalIssue({
      code: "no-eval-assertions",
      message: "Case has no expected ids, avoided ids, minMatchedCount, or requireNoFallback assertion.",
    }));
  }

  const summary = summarizeLearningEvalIssues(issues);

  return {
    id: evalCase.id,
    routeId: evalCase.routeId,
    briefHash: evalCase.briefHash,
    category: evalCase.category,
    limit: evalCase.limit,
    status: summary.status,
    failures: summary.failures,
    warnings: summary.warnings,
    candidateCount: selection.candidateCount,
    matchedCount: selection.matchedCount,
    selectedCount: selection.selectedCount,
    fallbackCount: selection.fallbackCount,
    expectedSelectedIds: evalCase.expectedSelectedIds,
    missingExpectedIds,
    avoidedSelectedIds: evalCase.avoidedSelectedIds,
    unexpectedAvoidedIds,
    minMatchedCount: evalCase.minMatchedCount,
    requireNoFallback: evalCase.requireNoFallback,
    selectedEntryIds,
    selected: selected.map(selectedEvalEntry),
    issues,
  };
}

export function learningEvalReport({
  filePath = defaultLearningFile(),
  evalText = "",
  source = "input",
  limit = 12,
  category = "",
} = {}) {
  const resolvedFile = path.resolve(filePath);
  const defaultLimit = Number.isInteger(limit) && limit > 0 ? limit : 12;
  const defaultCategory = category ? normalizeCategory(category) : "";
  const checkpoint = parseLearningEvalPayload(evalText, source);
  const profileExists = existsSync(resolvedFile);
  const profile = loadLearningProfile(resolvedFile);
  const audit = auditLearningProfile({ filePath: resolvedFile });
  const cases = checkpoint.cases.map((rawCase, index) => evaluateLearningCase(profile, rawCase, index, {
    defaultLimit,
    defaultCategory,
  }));
  const failed = cases.filter((item) => item.status === "fail").length;
  const warned = cases.filter((item) => item.status === "warn").length;
  const passed = cases.filter((item) => item.status === "pass").length;
  const recommendations = [];

  if (!profileExists) {
    recommendations.push({
      level: "warning",
      text: "Learning profile does not exist; initialize or import entries before relying on eval results.",
    });
  }
  if (audit.summary.status !== "pass") {
    recommendations.push({
      level: audit.summary.failures > 0 ? "warning" : "info",
      text: "Run `design-ai learn --audit` before using eval checkpoints as a release gate.",
    });
  }
  if (failed > 0) {
    recommendations.push({
      level: "warning",
      text: "Review failed eval cases before trusting prompt/pack --with-learning selection.",
    });
  }

  return {
    file: resolvedFile,
    source,
    profileExists,
    profileEntryCount: profile.entries.length,
    checkpointVersion: checkpoint.version,
    generatedAt: checkpoint.generatedAt,
    sourceProfile: checkpoint.sourceProfile,
    defaultLimit,
    defaultCategory,
    status: failed > 0 ? "fail" : warned > 0 ? "warn" : "pass",
    caseCount: cases.length,
    passed,
    warned,
    failed,
    auditSummary: audit.summary,
    cases,
    recommendations,
    privacy: {
      storesRawBriefText: false,
      storesBriefHash: true,
      exposesMatchedTokens: false,
    },
  };
}

function learningEvalTemplateCaseId(seed, index) {
  return `eval-${index + 1}-${shortHash(seed).slice(0, 10)}`;
}

function learningEvalTemplateCaseFromEntry(entry, index) {
  return {
    id: learningEvalTemplateCaseId(`${entry.id}\n${entry.category}\n${entry.text}`, index),
    brief: entry.text,
    category: entry.category,
    limit: 1,
    expectedSelectedIds: [entry.id],
    minMatchedCount: 1,
    requireNoFallback: true,
  };
}

export function buildLearningEvalTemplate({
  filePath = defaultLearningFile(),
  query = "",
  category = "",
  limit = 6,
  now = new Date(),
} = {}) {
  const resolvedFile = path.resolve(filePath);
  const normalizedCategory = category ? normalizeCategory(category) : "";
  const maxCases = Number.isInteger(limit) && limit > 0 ? limit : 6;
  const profileExists = existsSync(resolvedFile);
  const profile = loadLearningProfile(resolvedFile);
  const audit = auditLearningProfile({ filePath: resolvedFile });
  const cleanedQuery = cleanNoteText(query);
  const recommendations = [];
  let cases = [];
  let selectionSummary = null;

  if (cleanedQuery) {
    const { selection } = selectLearningEntrySet(profile, {
      category: normalizedCategory,
      limit: maxCases,
      query: cleanedQuery,
      includeFallback: false,
    });
    const expectedSelectedIds = selection.selected.map((item) => item.id).filter(Boolean);
    selectionSummary = {
      mode: selection.mode,
      candidateCount: selection.candidateCount,
      matchedCount: selection.matchedCount,
      selectedCount: expectedSelectedIds.length,
      queryTokenCount: selection.queryTokenCount,
      fallbackCount: selection.fallbackCount,
    };
    if (expectedSelectedIds.length > 0) {
      const evalLimit = expectedSelectedIds.length;
      cases = [
        {
          id: learningEvalTemplateCaseId(`${cleanedQuery}\n${normalizedCategory}`, 0),
          brief: cleanedQuery,
          ...(normalizedCategory ? { category: normalizedCategory } : {}),
          limit: evalLimit,
          expectedSelectedIds,
          minMatchedCount: expectedSelectedIds.length,
          requireNoFallback: true,
        },
      ];
    }
  } else {
    const { entries, selection } = selectLearningEntrySet(profile, {
      category: normalizedCategory,
      limit: maxCases,
      includeFallback: false,
    });
    selectionSummary = {
      mode: selection.mode,
      candidateCount: selection.candidateCount,
      matchedCount: selection.matchedCount,
      selectedCount: entries.length,
      queryTokenCount: selection.queryTokenCount,
      fallbackCount: selection.fallbackCount,
    };
    cases = entries.map((entry, index) => learningEvalTemplateCaseFromEntry(entry, index));
  }

  if (!profileExists) {
    recommendations.push({
      level: "warning",
      text: "Learning profile does not exist; create entries before generating durable eval checkpoints.",
    });
  }
  if (audit.summary.status !== "pass") {
    recommendations.push({
      level: audit.summary.failures > 0 ? "warning" : "info",
      text: "Run `design-ai learn --audit` before using generated eval checkpoints as a gate.",
    });
  }
  if (cases.length === 0) {
    recommendations.push({
      level: "info",
      text: cleanedQuery
        ? "No matching learning entries found for the query; add or adjust learning entries before saving this checkpoint."
        : "No learning entries are available for checkpoint generation.",
    });
  }

  return {
    version: 1,
    generatedAt: now.toISOString(),
    sourceProfile: {
      file: resolvedFile,
      exists: profileExists,
      entryCount: profile.entries.length,
      auditStatus: audit.summary.status,
      category: normalizedCategory,
      query: cleanedQuery,
      limit: maxCases,
    },
    selection: selectionSummary,
    caseCount: cases.length,
    cases,
    recommendations,
    privacy: {
      storesRawBriefText: true,
      storesBriefHash: false,
      exposesMatchedTokens: false,
    },
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

export function learningUsageStats({
  filePath = defaultLearningFile(),
  usageFile = defaultLearningUsageFile(filePath),
  limit = 10,
} = {}) {
  const resolvedFile = path.resolve(filePath);
  const resolvedUsageFile = path.resolve(usageFile);
  const profileExists = existsSync(resolvedFile);
  const usageExists = existsSync(resolvedUsageFile);
  const profile = loadLearningProfile(resolvedFile);
  const usageLog = loadLearningUsageLog(resolvedUsageFile, { profileFile: resolvedFile });
  const events = usageLog.events;
  const maxRecentEvents = Number.isInteger(limit) && limit > 0 ? limit : 10;
  const sortedEvents = [...events].sort((a, b) => usageEventTime(a) - usageEventTime(b));
  const recentEvents = [...sortedEvents].reverse().slice(0, maxRecentEvents).map(usageEventSummary);
  const entryUsage = new Map();

  for (const event of events) {
    for (const entryId of event.selectedEntryIds) {
      incrementUsageEntry(entryUsage, entryId, event);
    }
  }

  const profileEntryIds = new Set(profile.entries.map((entry) => entry.id));
  const selectedEntryIds = [...entryUsage.keys()].sort();
  const usedEntryIds = selectedEntryIds.filter((entryId) => profileEntryIds.has(entryId));
  const staleSelectedEntryIds = selectedEntryIds.filter((entryId) => !profileEntryIds.has(entryId));
  const unusedEntryIds = profile.entries
    .filter((entry) => !entryUsage.has(entry.id))
    .map((entry) => entry.id);
  const topSelectedEntries = profile.entries
    .map((entry) => usageEntrySummary(entry, entryUsage.get(entry.id)))
    .filter((entry) => entry.usageCount > 0)
    .sort((a, b) => b.usageCount - a.usageCount || String(b.latestUsedAt).localeCompare(String(a.latestUsedAt)))
    .slice(0, maxRecentEvents);
  const recommendations = [];

  if (!usageExists) {
    recommendations.push({
      level: "info",
      text: "No learning usage sidecar exists yet. Run prompt or pack with --with-learning to record local usage metadata.",
    });
  } else if (events.length === 0) {
    recommendations.push({
      level: "info",
      text: "Learning usage sidecar exists but has no events yet.",
    });
  }
  if (profile.entries.length > 0 && unusedEntryIds.length > 0) {
    recommendations.push({
      level: "info",
      text: "Review unused learning entries before curating; unused does not mean obsolete until enough prompt/pack usage has accumulated.",
    });
  }
  if (staleSelectedEntryIds.length > 0) {
    recommendations.push({
      level: "warning",
      text: "Usage sidecar references entry ids that are no longer present in the active learning profile.",
    });
  }

  return {
    file: resolvedFile,
    usageFile: resolvedUsageFile,
    exists: usageExists,
    profileExists,
    profileFile: usageLog.profileFile || resolvedFile,
    version: usageLog.version,
    updatedAt: usageLog.updatedAt,
    eventCount: events.length,
    profileEntryCount: profile.entries.length,
    usedEntryCount: usedEntryIds.length,
    unusedEntryCount: unusedEntryIds.length,
    staleSelectedEntryCount: staleSelectedEntryIds.length,
    commandCounts: countBy(events, (event) => event.command),
    routeCounts: countBy(events, (event) => event.routeId || "unrouted"),
    categoryCounts: countBy(events, (event) => event.category || "all"),
    auditStatusCounts: countBy(events, (event) => event.auditStatus || "unknown"),
    selectedEntryCounts: Object.fromEntries(
      selectedEntryIds.map((entryId) => [entryId, entryUsage.get(entryId).count]),
    ),
    topSelectedEntries,
    unusedEntryIds,
    staleSelectedEntryIds,
    oldestEvent: sortedEvents.length > 0 ? usageEventSummary(sortedEvents[0]) : null,
    latestEvent: sortedEvents.length > 0 ? usageEventSummary(sortedEvents[sortedEvents.length - 1]) : null,
    recentEvents,
    recommendations,
    privacy: {
      storesRawBriefText: false,
      storesBriefHash: true,
      storesSelectedEntryIds: true,
    },
  };
}

export function formatLearningJson(payload) {
  return JSON.stringify(payload, null, 2);
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
