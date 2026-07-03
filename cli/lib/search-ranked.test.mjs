// Tests for ranked lexical search and the opt-in Phase B embedding rerank
// (docs/AI-LEARNING-PHASE2.md). Covers the search fallback matrix: no config,
// no sidecar, stale sidecar, provider failure -> lexical + notice; success -> embeddings.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildEmbeddingIndex, writeEmbeddingIndex } from "./embedding-index.mjs";
import { embeddingCandidateCount, embeddingRerankSearch, rankedPreview, rankedSearchCorpus } from "./search-ranked.mjs";
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
