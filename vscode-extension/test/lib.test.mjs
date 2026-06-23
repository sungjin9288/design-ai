// Tests for vscode-extension/src/lib.ts pure helpers.
//
// These exercise the shipped JS (./out/lib.js) against the real design-ai
// source — no VS Code instance needed.
//
// Run: node --test vscode-extension/test/lib.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  walkMd,
  splitGlob,
  globToRegex,
  searchCorpus,
  pairWalkthroughs,
  chooseWalkthrough,
  readManifest,
  pickReadme,
} from "../out/lib.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");

// ---------- walkMd ----------

test("walkMd returns markdown files recursively", () => {
  const knowledgeRoot = path.join(REPO_ROOT, "knowledge");
  const files = walkMd(knowledgeRoot);
  assert.ok(files.length > 50, `expected many .md files, got ${files.length}`);
  for (const f of files) {
    assert.ok(f.endsWith(".md"), `${f} should end in .md`);
  }
});

test("walkMd skips node_modules and hidden dirs", () => {
  const tmp = mkdtempSync(path.join(tmpdir(), "design-ai-walkmd-"));
  try {
    mkdirSync(path.join(tmp, "node_modules"), { recursive: true });
    mkdirSync(path.join(tmp, ".git"), { recursive: true });
    mkdirSync(path.join(tmp, "real"), { recursive: true });
    writeFileSync(path.join(tmp, "node_modules", "should-skip.md"), "x");
    writeFileSync(path.join(tmp, ".git", "should-skip.md"), "x");
    writeFileSync(path.join(tmp, "real", "ok.md"), "x");

    const files = walkMd(tmp);
    assert.equal(files.length, 1);
    assert.ok(files[0].endsWith("ok.md"));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("walkMd returns empty array for missing dir", () => {
  assert.deepEqual(walkMd("/nonexistent/path/abc123"), []);
});

// ---------- splitGlob / globToRegex ----------

test("splitGlob splits at last slash", () => {
  assert.deepEqual(splitGlob("examples/component-*.md"), ["examples", "component-*.md"]);
});

test("splitGlob handles no slash", () => {
  assert.deepEqual(splitGlob("file.md"), ["", "file.md"]);
});

test("splitGlob handles nested path", () => {
  assert.deepEqual(splitGlob("docs/integrations/*-walkthrough.md"), [
    "docs/integrations",
    "*-walkthrough.md",
  ]);
});

test("globToRegex matches simple pattern", () => {
  const re = globToRegex("component-*.md");
  assert.ok(re.test("component-button.md"));
  assert.ok(re.test("component-list-item.md"));
  assert.ok(!re.test("button.md"));
  assert.ok(!re.test("component-button.tsx"));
});

test("globToRegex escapes regex special chars", () => {
  const re = globToRegex("a.b+c?d.md");
  assert.ok(re.test("a.b+c?d.md"));
  assert.ok(!re.test("axbycwd.md")); // dots NOT treated as wildcards
});

// ---------- searchCorpus ----------

test("searchCorpus finds known terms in real corpus", () => {
  const hits = searchCorpus({ query: "Pretendard", designAiPath: REPO_ROOT });
  assert.ok(hits.length >= 5, `expected several hits for Pretendard, got ${hits.length}`);
  for (const hit of hits) {
    assert.ok(hit.preview.toLowerCase().includes("pretendard"));
    assert.ok(hit.lineNumber >= 1);
    assert.ok(hit.relPath.endsWith(".md"));
  }
});

test("searchCorpus is case-insensitive", () => {
  const hitsLow = searchCorpus({ query: "korean", designAiPath: REPO_ROOT, cap: 5 });
  const hitsUp = searchCorpus({ query: "KOREAN", designAiPath: REPO_ROOT, cap: 5 });
  assert.equal(hitsLow.length, hitsUp.length);
});

test("searchCorpus respects cap", () => {
  const hits = searchCorpus({ query: "the", designAiPath: REPO_ROOT, cap: 5 });
  assert.ok(hits.length <= 5);
});

test("searchCorpus rejects short queries", () => {
  assert.deepEqual(searchCorpus({ query: "a", designAiPath: REPO_ROOT }), []);
  assert.deepEqual(searchCorpus({ query: " ", designAiPath: REPO_ROOT }), []);
  assert.deepEqual(searchCorpus({ query: "", designAiPath: REPO_ROOT }), []);
});

test("searchCorpus first-match-per-file", () => {
  const hits = searchCorpus({ query: "design", designAiPath: REPO_ROOT });
  // No two hits should be from the same file
  const seen = new Set();
  for (const hit of hits) {
    assert.ok(!seen.has(hit.file), `duplicate file: ${hit.file}`);
    seen.add(hit.file);
  }
});

test("searchCorpus restricted to a single dir", () => {
  const knowledgeOnly = searchCorpus({
    query: "Pretendard",
    designAiPath: REPO_ROOT,
    dirs: ["knowledge"],
  });
  for (const hit of knowledgeOnly) {
    assert.ok(hit.relPath.startsWith("knowledge/"), `${hit.relPath} should be under knowledge/`);
  }
});

// ---------- pairWalkthroughs / chooseWalkthrough ----------

test("pairWalkthroughs finds all 5 walkthrough stems", () => {
  const integrationsDir = path.join(REPO_ROOT, "docs", "integrations");
  const options = pairWalkthroughs(integrationsDir);
  // We expect 5 walkthroughs: codex / cursor / aider / sdk / vscode
  assert.ok(options.length >= 5, `expected 5+ walkthroughs, got ${options.length}`);
  for (const opt of options) {
    assert.ok(opt.stem.endsWith("-walkthrough"));
    // Each should have at least one of EN or KO
    assert.ok(opt.englishFile || opt.koreanFile);
  }
});

test("pairWalkthroughs pairs EN and KO when both exist", () => {
  const integrationsDir = path.join(REPO_ROOT, "docs", "integrations");
  const options = pairWalkthroughs(integrationsDir);
  // Codex walkthrough has both EN and KO
  const codex = options.find((o) => o.stem === "codex-walkthrough");
  assert.ok(codex, "codex-walkthrough should exist");
  assert.ok(codex.englishFile.endsWith(".md") && !codex.englishFile.endsWith(".ko.md"));
  assert.ok(codex.koreanFile.endsWith(".ko.md"));
});

test("chooseWalkthrough prefers KO when set", () => {
  const opt = {
    stem: "x-walkthrough",
    englishFile: "/p/x-walkthrough.md",
    koreanFile: "/p/x-walkthrough.ko.md",
  };
  assert.deepEqual(chooseWalkthrough(opt, "ko"), { file: "/p/x-walkthrough.ko.md", lang: "ko" });
});

test("chooseWalkthrough falls back to EN when KO missing", () => {
  const opt = {
    stem: "x-walkthrough",
    englishFile: "/p/x-walkthrough.md",
    koreanFile: "",
  };
  assert.deepEqual(chooseWalkthrough(opt, "ko"), { file: "/p/x-walkthrough.md", lang: "en" });
});

test("chooseWalkthrough falls back to KO when EN missing and EN preferred", () => {
  const opt = {
    stem: "x-walkthrough",
    englishFile: "",
    koreanFile: "/p/x-walkthrough.ko.md",
  };
  assert.deepEqual(chooseWalkthrough(opt, "en"), { file: "/p/x-walkthrough.ko.md", lang: "ko" });
});

test("chooseWalkthrough returns null when both missing", () => {
  const opt = { stem: "x-walkthrough", englishFile: "", koreanFile: "" };
  assert.equal(chooseWalkthrough(opt, "en"), null);
});

// ---------- readManifest ----------

test("readManifest reads real manifest", () => {
  const m = readManifest(REPO_ROOT);
  assert.ok(m, "manifest should parse");
  assert.equal(typeof m.version, "string");
  assert.ok(/^\d+\.\d+\.\d+$/.test(m.version), `version ${m.version} should be semver`);
  assert.ok(Array.isArray(m.skills));
  assert.ok(Array.isArray(m.commands));
  assert.ok(Array.isArray(m.agents));
  assert.ok(m.skills.length >= 20);
  assert.ok(m.commands.length >= 17);
  assert.ok(m.agents.length >= 4);
});

test("readManifest returns null on missing", () => {
  assert.equal(readManifest("/nonexistent/abc"), null);
});

// ---------- pickReadme ----------

test("pickReadme returns README.md when EN preferred", () => {
  const file = pickReadme(REPO_ROOT, "en");
  assert.ok(file?.endsWith("README.md"));
  assert.ok(!file.endsWith("README.ko.md"));
});

test("pickReadme returns README.ko.md when KO preferred and exists", () => {
  const file = pickReadme(REPO_ROOT, "ko");
  assert.ok(file?.endsWith("README.ko.md"));
});

test("pickReadme returns null when nothing exists", () => {
  const tmp = mkdtempSync(path.join(tmpdir(), "design-ai-readme-"));
  try {
    assert.equal(pickReadme(tmp, "en"), null);
    assert.equal(pickReadme(tmp, "ko"), null);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
