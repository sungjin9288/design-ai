// Shared internal helpers for the `design-ai learn` module family.

import {
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import path from "node:path";

const DEFAULT_LEARNING_FILE = path.join(homedir(), ".design-ai", "learning.json");
export const LEARNING_SENSITIVE_PATTERNS = [
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

function shellQuote(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_/:=.,@%+-]+$/.test(text)) return text;
  return `'${text.replace(/'/g, "'\\''")}'`;
}

export function commandFromArgs(args) {
  return args.map(shellQuote).join(" ");
}

export function writeLearningProfile(filePath, profile) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
}

export function shortEntryId({ text, category, createdAt }) {
  const input = `${createdAt}\n${category}\n${text}`;
  return createHash("sha256").update(input).digest("hex").slice(0, 10);
}

export function shortHash(value) {
  return createHash("sha256").update(String(value || "")).digest("hex").slice(0, 16);
}

export function cleanNoteText(text) {
  return String(text || "").trim().replace(/\s+/g, " ");
}

export function learningEntryMergeKey(entry) {
  return `${entry.category}\n${cleanNoteText(entry.text).toLowerCase()}`;
}

export function uniqueImportedEntryId(entry, usedIds) {
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

export function parseLearningProfilePayload(importText, label = "Learning import") {
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

export function countBy(items, getKey) {
  const counts = {};
  for (const item of items) {
    const key = String(getKey(item) || "").trim();
    if (key) counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export function previewText(text, maxChars = 96) {
  const cleaned = cleanNoteText(text);
  if (cleaned.length <= maxChars) return cleaned;
  return `${cleaned.slice(0, maxChars - 3)}...`;
}

export function statsEntry(entry) {
  return {
    id: entry.id,
    category: entry.category,
    source: entry.source,
    createdAt: entry.createdAt,
    textPreview: previewText(entry.text),
  };
}

export function formatLearningJson(payload) {
  return JSON.stringify(payload, null, 2);
}
