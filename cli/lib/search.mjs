// Markdown corpus search helpers for `design-ai search`.

import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import path from "node:path";

import { expectedValueMessage, unknownOptionMessage } from "./suggest.mjs";

export const DEFAULT_SEARCH_DIRS = [
  "knowledge",
  "examples",
  "skills",
  "docs",
  "agents",
  "commands",
];

const PREVIEW_LEN = 120;
const PREVIEW_BEFORE = 50;
const SEARCH_OPTIONS = ["-h", "--help", "--json", "--limit", "--dir"];

function exists(p) {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
}

export function walkMarkdown(dir) {
  if (!exists(dir)) return [];

  const files = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(full);
      }
    }
  }

  return files.sort();
}

export function buildPreview(line, queryLower) {
  const trimmed = line.trim();
  if (trimmed.length <= PREVIEW_LEN) return trimmed;

  const idx = trimmed.toLowerCase().indexOf(queryLower);
  if (idx === -1) return trimmed.slice(0, PREVIEW_LEN);

  const start = Math.max(0, idx - PREVIEW_BEFORE);
  const end = Math.min(trimmed.length, start + PREVIEW_LEN);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < trimmed.length ? "..." : "";
  return `${prefix}${trimmed.slice(start, end)}${suffix}`;
}

export function searchCorpus({ query, designAiPath, dirs = DEFAULT_SEARCH_DIRS, limit = 20 }) {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return [];

  const needle = normalizedQuery.toLowerCase();
  const hits = [];

  for (const dir of dirs) {
    const root = path.join(designAiPath, dir);
    for (const file of walkMarkdown(root)) {
      let content;
      try {
        content = readFileSync(file, "utf8");
      } catch {
        continue;
      }

      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i += 1) {
        if (lines[i].toLowerCase().includes(needle)) {
          hits.push({
            file,
            lineNumber: i + 1,
            relPath: path.relative(designAiPath, file),
            preview: buildPreview(lines[i], needle),
          });
          break;
        }
      }

      if (hits.length >= limit) return hits;
    }
  }

  return hits;
}

export function parseSearchArgs(args) {
  const out = {
    queryParts: [],
    dirs: [],
    limit: 20,
    json: false,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--json") {
      out.json = true;
    } else if (arg === "--limit") {
      const next = args[i + 1];
      const limit = Number(next);
      if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
        throw new Error("--limit expects an integer from 1 to 500");
      }
      out.limit = limit;
      i += 1;
    } else if (arg === "--dir") {
      const next = args[i + 1];
      if (!DEFAULT_SEARCH_DIRS.includes(next)) {
        throw new Error(expectedValueMessage("--dir", next, DEFAULT_SEARCH_DIRS));
      }
      out.dirs.push(next);
      i += 1;
    } else if (arg.startsWith("--")) {
      throw new Error(unknownOptionMessage("search", arg, SEARCH_OPTIONS));
    } else {
      out.queryParts.push(arg);
    }
  }

  return {
    ...out,
    query: out.queryParts.join(" ").trim(),
    dirs: out.dirs.length > 0 ? out.dirs : DEFAULT_SEARCH_DIRS,
  };
}

export function formatSearchJson(payload) {
  return JSON.stringify(payload, null, 2);
}
