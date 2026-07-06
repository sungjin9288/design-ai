// Tests for ranked lexical search and the opt-in Phase B embedding rerank
// (docs/AI-LEARNING-PHASE2.md). Covers the search fallback matrix: no config,
// no sidecar, stale sidecar, provider failure -> lexical + notice; success -> embeddings.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildEmbeddingIndex, writeEmbeddingIndex } from "./embedding-index.mjs";
import { embeddingCandidateCount, embeddingRerankSearch, isGeneratedIndexDoc, isRecallExcludedDoc, rankedPreview, rankedSearchCorpus } from "./search-ranked.mjs";
import { DEFAULT_SEARCH_DIRS } from "./search.mjs";

function withTempDir(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-search-ranked-test-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeFixtureCorpus(root) {
  mkdirSync(path.join(root, "knowledge"), { recursive: true });
  writeFileSync(path.join(root, "knowledge", "color.md"), "# Color tokens\nOKLCH color palette rules for buttons.\n", "utf8");
  writeFileSync(path.join(root, "knowledge", "layout.md"), "# Layout grid\nResponsive grid spacing rules.\n", "utf8");
}

function writeFixtureProfile(file) {
  writeFileSync(file, JSON.stringify({ version: 1, updatedAt: "2026-07-01T00:00:00.000Z", entries: [] }, null, 2), "utf8");
}

function stubSpawnRunner({ dimensions = 3, favor = null } = {}) {
  return ({ input }) => {
    const lines = input.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
    const outputLines = lines.map(({ id }) => {
      if (favor && id === favor) return JSON.stringify({ id, vector: [1, 0, 0] });
      if (id === "__query__") return JSON.stringify({ id, vector: [1, 0, 0] });
      let seed = 0;
      for (const ch of id) seed = (seed * 31 + ch.charCodeAt(0)) % 997;
      const vector = Array.from({ length: dimensions }, (_, i) => Number((((seed + i) % 997) / 997).toFixed(6)));
      return JSON.stringify({ id, vector });
    });
    return { status: 0, stdout: `${outputLines.join("\n")}\n`, stderr: "", error: null };
  };
}

test("rankedPreview finds a matching line and falls back to the first non-empty line", () => {
  const text = "# Title\n\nSome intro line.\nButton color is OKLCH.\n";
  assert.equal(rankedPreview(text, ["oklch"]), "Button color is OKLCH.");
  assert.equal(rankedPreview(text, ["nomatch"]), "# Title");
});

test("embeddingCandidateCount is max(limit*5, 25)", () => {
  assert.equal(embeddingCandidateCount(1), 25);
  assert.equal(embeddingCandidateCount(10), 50);
});

test("isGeneratedIndexDoc flags COVERAGE.md, INDEX.md, and docs/reference/* only", () => {
  // Generated coverage/index tables anywhere in the tree.
  assert.equal(isGeneratedIndexDoc("knowledge/COVERAGE.md"), true);
  assert.equal(isGeneratedIndexDoc("knowledge/components/INDEX.md"), true);
  // Generated upstream-reference pages under docs/reference/.
  assert.equal(isGeneratedIndexDoc("docs/reference/ant-design.md"), true);
  assert.equal(isGeneratedIndexDoc("docs/reference/mui.md"), true);
  // Backslash paths are normalized before matching.
  assert.equal(isGeneratedIndexDoc("docs\\reference\\shadcn-ui.md"), true);
  // Real design knowledge is never flagged.
  assert.equal(isGeneratedIndexDoc("knowledge/patterns/money-and-amount.md"), false);
  assert.equal(isGeneratedIndexDoc("knowledge/components/shadcn-registry.md"), false);
  // A docs/ page NOT under docs/reference/ is not flagged.
  assert.equal(isGeneratedIndexDoc("docs/MCP-INTEGRATION.md"), false);
  // "INDEX.md" only matches as a basename, not as a substring.
  assert.equal(isGeneratedIndexDoc("knowledge/INDEXER.md"), false);
  assert.equal(isGeneratedIndexDoc(""), false);
});

// Truth table for the broader RECALL exclusion predicate (docs/DOGFOOD-SDK-FINDINGS.md,
// F-2): generated-index cases stay true, each package-excluded meta doc is true,
// anything under docs/integrations/ is true, and real knowledge/docs stay false.
test("isRecallExcludedDoc truth table", () => {
  // Still covers every isGeneratedIndexDoc case.
  assert.equal(isRecallExcludedDoc("knowledge/COVERAGE.md"), true);
  assert.equal(isRecallExcludedDoc("knowledge/components/INDEX.md"), true);
  assert.equal(isRecallExcludedDoc("docs/reference/ant-design.md"), true);
  assert.equal(isRecallExcludedDoc("docs\\reference\\shadcn-ui.md"), true);

  // Package-excluded repo-meta docs (the `!docs/*.md` entries in package.json `files`).
  assert.equal(isRecallExcludedDoc("docs/case-study.md"), true);
  assert.equal(isRecallExcludedDoc("docs/evidence-checklist.md"), true);
  assert.equal(isRecallExcludedDoc("docs/evidence-gallery.md"), true);
  assert.equal(isRecallExcludedDoc("docs/implementation-evidence.md"), true);
  assert.equal(isRecallExcludedDoc("docs/interview-story.md"), true);
  assert.equal(isRecallExcludedDoc("docs/project-card.md"), true);
  assert.equal(isRecallExcludedDoc("docs/project-roadmap.md"), true);
  assert.equal(isRecallExcludedDoc("docs/readme-improvement.md"), true);
  assert.equal(isRecallExcludedDoc("docs/resume-bullets.md"), true);

  // Agent walkthroughs under docs/integrations/.
  assert.equal(isRecallExcludedDoc("docs/integrations/codex-walkthrough.ko.md"), true);
  assert.equal(isRecallExcludedDoc("docs/integrations/agent-sdk-walkthrough.md"), true);
  // Backslash paths are normalized before matching.
  assert.equal(isRecallExcludedDoc("docs\\integrations\\anything.md"), true);

  // Real design knowledge and live docs are never flagged.
  assert.equal(isRecallExcludedDoc("knowledge/patterns/money-and-amount.md"), false);
  assert.equal(isRecallExcludedDoc("examples/dashboard-composition.md"), false);
  assert.equal(isRecallExcludedDoc("docs/USING.md"), false);
  assert.equal(isRecallExcludedDoc("docs/SDK.md"), false);
  assert.equal(isRecallExcludedDoc(""), false);
});

// The recall/injection layer opts in to excludeNonKnowledge; raw `search --ranked`
// (default false) must keep returning index docs. Filtering happens BEFORE the limit
// so it fills with real knowledge, and determinism (score desc, id asc) is preserved.
function writeIndexCorpus(root) {
  mkdirSync(path.join(root, "knowledge", "components"), { recursive: true });
  mkdirSync(path.join(root, "docs", "reference"), { recursive: true });
  writeFileSync(path.join(root, "knowledge", "COVERAGE.md"), "# Coverage\ncoverage table matrix widget", "utf8");
  writeFileSync(path.join(root, "knowledge", "components", "INDEX.md"), "# Components\nwidget component index matrix", "utf8");
  writeFileSync(path.join(root, "docs", "reference", "mui.md"), "# MUI\nwidget matrix reference", "utf8");
  writeFileSync(path.join(root, "knowledge", "widget.md"), "# Widget\nwidget matrix real knowledge", "utf8");
  writeFileSync(path.join(root, "knowledge", "widget-two.md"), "# Widget two\nwidget matrix more knowledge", "utf8");
}

test("rankedSearchCorpus default (excludeNonKnowledge=false) still returns index docs", () => withTempDir((root) => {
  writeIndexCorpus(root);
  const { hits } = rankedSearchCorpus({
    query: "widget matrix",
    designAiPath: root,
    dirs: ["knowledge", "docs"],
    indexDir: path.join(root, "index"),
  });
  const ids = hits.map((hit) => hit.relPath);
  assert.ok(ids.includes("knowledge/COVERAGE.md"), "raw search must keep COVERAGE.md");
  assert.ok(ids.includes("knowledge/components/INDEX.md"), "raw search must keep INDEX.md");
  assert.ok(ids.includes("docs/reference/mui.md"), "raw search must keep docs/reference pages");
}));

test("rankedSearchCorpus excludeNonKnowledge drops index docs before the limit", () => withTempDir((root) => {
  writeIndexCorpus(root);
  const { hits } = rankedSearchCorpus({
    query: "widget matrix",
    designAiPath: root,
    dirs: ["knowledge", "docs"],
    indexDir: path.join(root, "index"),
    excludeNonKnowledge: true,
  });
  const ids = hits.map((hit) => hit.relPath);
  assert.ok(!ids.some((id) => id === "knowledge/COVERAGE.md"));
  assert.ok(!ids.some((id) => id === "knowledge/components/INDEX.md"));
  assert.ok(!ids.some((id) => id.startsWith("docs/reference/")));
  // Real knowledge still surfaces.
  assert.ok(ids.includes("knowledge/widget.md"));
  assert.ok(ids.includes("knowledge/widget-two.md"));
  // Determinism preserved: score desc, then id asc.
  for (let i = 1; i < hits.length; i += 1) {
    const prev = hits[i - 1];
    const curr = hits[i];
    assert.ok(prev.score > curr.score || (prev.score === curr.score && prev.relPath < curr.relPath));
  }
}));

test("rankedSearchCorpus excludeNonKnowledge fills the limit with real knowledge, not index files", () => withTempDir((root) => {
  writeIndexCorpus(root);
  // limit 2 with COVERAGE.md/INDEX.md/mui.md ranking high on 'matrix': excluding them
  // must let the two real widget knowledge files fill the two slots.
  const { hits } = rankedSearchCorpus({
    query: "widget matrix",
    designAiPath: root,
    dirs: ["knowledge", "docs"],
    indexDir: path.join(root, "index"),
    limit: 2,
    excludeNonKnowledge: true,
  });
  assert.equal(hits.length, 2);
  assert.deepEqual(
    hits.map((hit) => hit.relPath).sort(),
    ["knowledge/widget-two.md", "knowledge/widget.md"],
  );
}));

// Integration-style regression for F-2: a query that matches a repo-meta doc must
// have it excluded from recall-mode results (excludeNonKnowledge: true), while raw
// ranked search (the default) still surfaces it — same boundary as the v4.58
// generated-index exclusion.
test("rankedSearchCorpus excludeNonKnowledge drops a matching meta doc; raw ranked search still returns it", () => withTempDir((root) => {
  mkdirSync(path.join(root, "docs", "integrations"), { recursive: true });
  mkdirSync(path.join(root, "knowledge"), { recursive: true });
  writeFileSync(
    path.join(root, "docs", "case-study.md"),
    "# Case study\nreport moderation flow design story\n",
    "utf8",
  );
  writeFileSync(
    path.join(root, "docs", "integrations", "codex-walkthrough.ko.md"),
    "# Codex walkthrough\nreport moderation flow design story\n",
    "utf8",
  );
  writeFileSync(
    path.join(root, "knowledge", "moderation.md"),
    "# Moderation\nreport moderation flow design story\n",
    "utf8",
  );

  const query = "report moderation flow design";
  const raw = rankedSearchCorpus({
    query,
    designAiPath: root,
    dirs: ["knowledge", "docs"],
    indexDir: path.join(root, "index"),
  });
  const rawIds = raw.hits.map((hit) => hit.relPath);
  assert.ok(rawIds.includes("docs/case-study.md"), "raw ranked search must still return the meta doc");
  assert.ok(rawIds.includes("docs/integrations/codex-walkthrough.ko.md"), "raw ranked search must still return the walkthrough");

  const recall = rankedSearchCorpus({
    query,
    designAiPath: root,
    dirs: ["knowledge", "docs"],
    indexDir: path.join(root, "index"),
    excludeNonKnowledge: true,
  });
  const recallIds = recall.hits.map((hit) => hit.relPath);
  assert.ok(!recallIds.includes("docs/case-study.md"), "recall mode must drop the meta doc");
  assert.ok(!recallIds.includes("docs/integrations/codex-walkthrough.ko.md"), "recall mode must drop the walkthrough");
  assert.ok(recallIds.includes("knowledge/moderation.md"), "recall mode must still surface real knowledge");
}));

test("rankedSearchCorpus reports a not-built notice when no corpus index exists", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const result = rankedSearchCorpus({
    query: "color",
    designAiPath: root,
    dirs: ["knowledge"],
    indexDir: path.join(root, "index"),
  });
  assert.ok(result.hits.length > 0);
  assert.match(result.notice, /no corpus index built yet/);
}));

test("embeddingRerankSearch falls back with a notice when no provider is configured", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const result = embeddingRerankSearch({
    query: "color",
    provider: null,
    designAiPath: root,
    dirs: ["knowledge"],
    indexDir: path.join(root, "index"),
    learningFile: path.join(root, "learning.json"),
  });
  assert.equal(result.fallback, true);
  assert.match(result.notice, /no embedding provider configured/);
}));

test("embeddingRerankSearch falls back with a notice when no sidecar has been built", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const result = embeddingRerankSearch({
    query: "color",
    provider: { command: "./bin/local-embed" },
    designAiPath: root,
    dirs: ["knowledge"],
    indexDir: path.join(root, "index"),
    learningFile: path.join(root, "learning.json"),
  });
  assert.equal(result.fallback, true);
  assert.match(result.notice, /no embedding index built yet/);
}));

test("embeddingRerankSearch falls back with a notice when the sidecar is stale", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const dirs = ["knowledge"];
  const learningFile = path.join(root, "learning.json");
  writeFixtureProfile(learningFile);
  const indexDir = path.join(root, "index");

  const built = buildEmbeddingIndex({
    provider: { command: "./bin/local-embed" },
    designAiPath: root,
    dirs,
    learningFile,
    spawnRunner: stubSpawnRunner(),
  });
  writeEmbeddingIndex({ indexDir, payload: built.payload });

  // Drift the corpus after building the sidecar.
  writeFileSync(path.join(root, "knowledge", "color.md"), "# Color tokens\nEdited after build.\n", "utf8");

  const result = embeddingRerankSearch({
    query: "color",
    provider: { command: "./bin/local-embed" },
    designAiPath: root,
    dirs,
    indexDir,
    learningFile,
  });
  assert.equal(result.fallback, true);
  assert.match(result.notice, /stale/);
}));

test("embeddingRerankSearch falls back with a notice when the provider fails at query time", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const dirs = ["knowledge"];
  const learningFile = path.join(root, "learning.json");
  writeFixtureProfile(learningFile);
  const indexDir = path.join(root, "index");

  const built = buildEmbeddingIndex({
    provider: { command: "./bin/local-embed" },
    designAiPath: root,
    dirs,
    learningFile,
    spawnRunner: stubSpawnRunner(),
  });
  writeEmbeddingIndex({ indexDir, payload: built.payload });

  const failingRunner = () => ({ status: 1, stdout: "", stderr: "provider crashed", error: null });
  const result = embeddingRerankSearch({
    query: "color",
    provider: { command: "./bin/local-embed" },
    designAiPath: root,
    dirs,
    indexDir,
    learningFile,
    spawnRunner: failingRunner,
  });
  assert.equal(result.fallback, true);
  assert.match(result.notice, /embedding provider failed/);
}));

test("embeddingRerankSearch succeeds and reranks lexical candidates by cosine similarity", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const dirs = ["knowledge"];
  const learningFile = path.join(root, "learning.json");
  writeFixtureProfile(learningFile);
  const indexDir = path.join(root, "index");

  const built = buildEmbeddingIndex({
    provider: { command: "./bin/local-embed" },
    designAiPath: root,
    dirs,
    learningFile,
    spawnRunner: stubSpawnRunner({ favor: "knowledge/layout.md" }),
  });
  writeEmbeddingIndex({ indexDir, payload: built.payload });

  const result = embeddingRerankSearch({
    query: "rules",
    provider: { command: "./bin/local-embed" },
    designAiPath: root,
    dirs,
    indexDir,
    learningFile,
    spawnRunner: stubSpawnRunner({ favor: "knowledge/layout.md" }),
  });
  assert.equal(result.fallback, false);
  assert.ok(result.hits.length > 0);
  // The favored doc's vector matches the query vector exactly (cosine 1) and should rank first.
  assert.equal(result.hits[0].relPath, "knowledge/layout.md");
  assert.equal(result.hits[0].score, 1);
}));

// Regression: a sidecar is always built over the full corpus (matching `index --build
// --embeddings`'s default dirs), but `search --ranked --embeddings --dir knowledge`
// scopes results to one directory. The freshness check must compare against the FULL
// corpus digest the sidecar actually stores, not a digest of only the scoped dirs —
// otherwise every --dir-scoped embeddings search would spuriously report the sidecar
// stale and silently fall back to lexical.
test("embeddingRerankSearch succeeds with a --dir-scoped search against a sidecar built over the full corpus", () => withTempDir((root) => {
  mkdirSync(path.join(root, "examples"), { recursive: true });
  writeFileSync(path.join(root, "examples", "card.md"), "# Card example\nCard spacing rules.\n", "utf8");
  writeFixtureCorpus(root); // adds knowledge/color.md, knowledge/layout.md

  const fullDirs = [...DEFAULT_SEARCH_DIRS.filter((dir) => dir === "knowledge" || dir === "examples")];
  const learningFile = path.join(root, "learning.json");
  writeFixtureProfile(learningFile);
  const indexDir = path.join(root, "index");

  // Sidecar built over the FULL corpus (both dirs), exactly like `index --build --embeddings`.
  const built = buildEmbeddingIndex({
    provider: { command: "./bin/local-embed" },
    designAiPath: root,
    dirs: fullDirs,
    learningFile,
    spawnRunner: stubSpawnRunner({ favor: "knowledge/layout.md" }),
  });
  writeEmbeddingIndex({ indexDir, payload: built.payload });

  // Search scoped to a single dir, as `search --ranked --embeddings --dir knowledge` would do.
  const result = embeddingRerankSearch({
    query: "rules",
    provider: { command: "./bin/local-embed" },
    designAiPath: root,
    dirs: ["knowledge"],
    indexDir,
    learningFile,
    spawnRunner: stubSpawnRunner({ favor: "knowledge/layout.md" }),
  });
  assert.equal(result.fallback, false);
  assert.ok(result.hits.length > 0);
  assert.ok(result.hits.every((hit) => hit.relPath.startsWith("knowledge/")));
}));
