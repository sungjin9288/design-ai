// Pure-logic helpers for the design-ai VS Code extension.
//
// These are the parts that don't touch the `vscode` API — file traversal,
// glob matching, manifest reading, search algorithm. Extracted so they can
// be exercised by `node --test` without booting a VS Code instance.
//
// commands.ts and providers/trees.ts re-import from here.

import * as fs from "node:fs";
import * as path from "node:path";

// ----- file traversal -----

/**
 * Recursively list .md files under `dir`. Returns absolute paths.
 * Returns [] if dir doesn't exist (rather than throwing).
 */
export function walkMd(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue; // unreadable dir; skip
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules / .git etc.
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(full);
      }
    }
  }
  return files;
}

/**
 * Split a `dir/pattern` glob into [dir, pattern].
 * Only supports a single trailing pattern segment.
 */
export function splitGlob(pattern: string): [string, string] {
  const idx = pattern.lastIndexOf("/");
  if (idx === -1) return ["", pattern];
  return [pattern.slice(0, idx), pattern.slice(idx + 1)];
}

/**
 * Convert a simple glob (supports `*` only) to a RegExp anchored to start/end.
 * Used by the openSpec / openWalkthrough commands.
 */
export function globToRegex(pattern: string): RegExp {
  // Escape regex special chars except `*`, then convert `*` → `[^/]*`.
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*");
  return new RegExp(`^${escaped}$`);
}

// ----- search -----

export interface SearchHit {
  file: string;
  lineNumber: number; // 1-indexed
  preview: string;
  relPath: string;
}

export interface SearchOptions {
  query: string;
  designAiPath: string;
  dirs?: readonly string[];
  cap?: number;
}

const DEFAULT_SEARCH_DIRS = [
  "knowledge",
  "examples",
  "skills",
  "docs",
  "agents",
  "commands",
] as const;

/**
 * Build a preview string centered around the match, capped at PREVIEW_LEN.
 * If the line fits, return the whole trimmed line.
 * Otherwise return "...left...{match}...right..." centered on the match.
 *
 * The match itself is preserved with original casing (we search lowercase
 * but slice the original line).
 */
const PREVIEW_LEN = 120;
const PREVIEW_BEFORE = 50; // chars to keep before the match when truncating

export function buildPreview(line: string, queryLower: string): string {
  const trimmed = line.trim();
  if (trimmed.length <= PREVIEW_LEN) return trimmed;

  const idx = trimmed.toLowerCase().indexOf(queryLower);
  if (idx === -1) {
    // No match in trimmed (unlikely if caller already matched). Fallback.
    return trimmed.slice(0, PREVIEW_LEN);
  }

  const start = Math.max(0, idx - PREVIEW_BEFORE);
  const end = Math.min(trimmed.length, start + PREVIEW_LEN);
  const slice = trimmed.slice(start, end);

  const prefix = start > 0 ? "…" : "";
  const suffix = end < trimmed.length ? "…" : "";
  return prefix + slice + suffix;
}

/**
 * Search markdown files for `query` (case-insensitive substring).
 * Returns first-match-per-file, capped at `cap` total hits.
 * Preview is centered on the match (so the user sees the match in context).
 *
 * Pure: takes a path + query, returns hits. No vscode API.
 */
export function searchCorpus(opts: SearchOptions): SearchHit[] {
  const { query, designAiPath, dirs = DEFAULT_SEARCH_DIRS, cap = 200 } = opts;
  if (query.trim().length < 2) return [];

  const needle = query.toLowerCase();
  const hits: SearchHit[] = [];

  for (const dir of dirs) {
    const root = path.join(designAiPath, dir);
    for (const file of walkMd(root)) {
      let content: string;
      try {
        content = fs.readFileSync(file, "utf-8");
      } catch {
        continue;
      }
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(needle)) {
          hits.push({
            file,
            lineNumber: i + 1,
            preview: buildPreview(lines[i], needle),
            relPath: path.relative(designAiPath, file),
          });
          break; // first match per file is enough
        }
      }
      if (hits.length >= cap) break;
    }
    if (hits.length >= cap) break;
  }

  return hits;
}

// ----- walkthrough language pairing -----

export interface WalkthroughOption {
  stem: string; // e.g. "codex-walkthrough"
  englishFile: string; // absolute path to .md (or "" if missing)
  koreanFile: string; // absolute path to .ko.md (or "" if missing)
}

/**
 * Pair English + Korean walkthrough files in `docs/integrations/`.
 * Returns one entry per stem.
 */
export function pairWalkthroughs(integrationsDir: string): WalkthroughOption[] {
  if (!fs.existsSync(integrationsDir)) return [];

  let names: string[];
  try {
    names = fs.readdirSync(integrationsDir);
  } catch {
    return [];
  }

  const stemMap: Map<string, { en: string; ko: string }> = new Map();

  for (const name of names) {
    if (!name.endsWith("-walkthrough.md") && !name.endsWith("-walkthrough.ko.md")) continue;
    const stem = name.replace(/\.ko\.md$|\.md$/, "");
    const entry = stemMap.get(stem) ?? { en: "", ko: "" };
    if (name.endsWith(".ko.md")) {
      entry.ko = path.join(integrationsDir, name);
    } else {
      entry.en = path.join(integrationsDir, name);
    }
    stemMap.set(stem, entry);
  }

  return Array.from(stemMap.entries())
    .map(([stem, { en, ko }]) => ({ stem, englishFile: en, koreanFile: ko }))
    .sort((a, b) => a.stem.localeCompare(b.stem));
}

/**
 * Resolve a walkthrough option to the file to open given language preference.
 * Returns the chosen path + language tag; falls back to whichever exists.
 */
export function chooseWalkthrough(
  option: WalkthroughOption,
  preferred: "en" | "ko",
): { file: string; lang: "en" | "ko" } | null {
  if (preferred === "ko" && option.koreanFile) {
    return { file: option.koreanFile, lang: "ko" };
  }
  if (option.englishFile) {
    return { file: option.englishFile, lang: "en" };
  }
  if (option.koreanFile) {
    return { file: option.koreanFile, lang: "ko" };
  }
  return null;
}

// ----- manifest -----

export interface PluginManifest {
  version: string;
  skills?: unknown[];
  commands?: unknown[];
  agents?: unknown[];
}

export function readManifest(designAiPath: string): PluginManifest | null {
  try {
    const manifestPath = path.join(designAiPath, ".claude-plugin", "plugin.json");
    const text = fs.readFileSync(manifestPath, "utf-8");
    return JSON.parse(text) as PluginManifest;
  } catch {
    return null;
  }
}

// ----- README pick by language -----

export function pickReadme(designAiPath: string, preferred: "en" | "ko"): string | null {
  const candidates = preferred === "ko" ? ["README.ko.md", "README.md"] : ["README.md"];
  for (const name of candidates) {
    const full = path.join(designAiPath, name);
    if (fs.existsSync(full)) return full;
  }
  return null;
}
