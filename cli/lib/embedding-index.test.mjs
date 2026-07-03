// Tests for the Phase B embedding sidecar (build/load/status/fresh/stale/identity).

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  EMBEDDING_INDEX_VERSION,
  LEARNING_ID_PREFIX,
  buildEmbeddingIndex,
  embeddingIndexFile,
  embeddingIndexStatus,
  loadEmbeddingIndexFile,
  vectorsById,
  writeEmbeddingIndex,
} from "./embedding-index.mjs";

function withTempDir(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-embedding-index-test-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeFixtureCorpus(root) {
  mkdirSync(path.join(root, "knowledge"), { recursive: true });
  mkdirSync(path.join(root, "examples"), { recursive: true });
  writeFileSync(path.join(root, "knowledge", "color.md"), "# Color tokens\nOKLCH color palette rules.\n", "utf8");
  writeFileSync(path.join(root, "examples", "button.md"), "# Button spec\nButton states and color tokens.\n", "utf8");
}

function writeFixtureProfile(file) {
  writeFileSync(file, JSON.stringify({
    version: 1,
    updatedAt: "2026-07-01T00:00:00.000Z",
    entries: [
      { id: "aaa111", category: "preference", text: "Prefer OKLCH color tokens", createdAt: "2026-07-01T00:00:00.000Z", source: "test" },
    ],
  }, null, 2), "utf8");
}

// Deterministic fake provider runner: emits a fixed-length vector keyed by a stable
// hash of the id so tests never depend on real embeddings or network access.
function stubSpawnRunner({ dimensions = 3 } = {}) {
  return ({ input }) => {
    const lines = input.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
    const outputLines = lines.map(({ id }) => {
      let seed = 0;
      for (const ch of id) seed = (seed * 31 + ch.charCodeAt(0)) % 997;
      const vector = Array.from({ length: dimensions }, (_, i) => Number(((seed + i) / 997).toFixed(6)));
      return JSON.stringify({ id, vector });
    });
    return { status: 0, stdout: `${outputLines.join("\n")}\n`, stderr: "", error: null };
  };
}

const FIXED_NOW = new Date("2026-07-03T00:00:00.000Z");

test("buildEmbeddingIndex embeds corpus + learning docs with prefixed learning ids, no collisions", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const dirs = ["knowledge", "examples"];
  const profileFile = path.join(root, "learning.json");
  writeFixtureProfile(profileFile);

  const result = buildEmbeddingIndex({
    provider: { command: "./bin/local-embed" },
    designAiPath: root,
    dirs,
    learningFile: profileFile,
    now: FIXED_NOW,
    spawnRunner: stubSpawnRunner(),
  });

  assert.equal(result.ok, true);
  const { payload } = result;
  assert.equal(payload.version, EMBEDDING_INDEX_VERSION);
  assert.equal(payload.kind, "embedding-index");
  assert.equal(payload.provider.command, "./bin/local-embed");
  assert.equal(payload.provider.dimensions, 3);
  assert.equal(payload.source.designAiPath, path.resolve(root));
  assert.equal(payload.source.learningFile, path.resolve(profileFile));

  const ids = payload.vectors.map((v) => v.id);
  assert.deepEqual([...ids].sort(), ids); // sorted by id
  assert.ok(ids.includes("examples/button.md"));
  assert.ok(ids.includes("knowledge/color.md"));
  assert.ok(ids.includes(`${LEARNING_ID_PREFIX}aaa111`));
  // No id collisions between corpus and learning namespaces.
  assert.equal(new Set(ids).size, ids.length);

  for (const entry of payload.vectors) {
    assert.equal(entry.v.length, 3);
    for (const component of entry.v) {
      assert.equal(component, Number(component.toFixed(6)));
    }
  }
}));

test("buildEmbeddingIndex fails cleanly without a provider", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const profileFile = path.join(root, "learning.json");
  writeFixtureProfile(profileFile);

  const result = buildEmbeddingIndex({
    provider: null,
    designAiPath: root,
    dirs: ["knowledge", "examples"],
    learningFile: profileFile,
    now: FIXED_NOW,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /no embedding provider configured/);
}));

test("buildEmbeddingIndex propagates provider failure without throwing", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const profileFile = path.join(root, "learning.json");
  writeFixtureProfile(profileFile);

  const failingRunner = () => ({ status: 1, stdout: "", stderr: "provider crashed", error: null });
  const result = buildEmbeddingIndex({
    provider: { command: "./bin/broken" },
    designAiPath: root,
    dirs: ["knowledge", "examples"],
    learningFile: profileFile,
    now: FIXED_NOW,
    spawnRunner: failingRunner,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /exited with code 1/);
}));

test("writeEmbeddingIndex + loadEmbeddingIndexFile round-trip and reject bad payloads", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const dirs = ["knowledge", "examples"];
  const profileFile = path.join(root, "learning.json");
  writeFixtureProfile(profileFile);
  const indexDir = path.join(root, "index");

  const built = buildEmbeddingIndex({
    provider: { command: "./bin/local-embed" },
    designAiPath: root,
    dirs,
    learningFile: profileFile,
    now: FIXED_NOW,
    spawnRunner: stubSpawnRunner(),
  });
  assert.equal(built.ok, true);

  const written = writeEmbeddingIndex({ indexDir, payload: built.payload });
  assert.equal(written.file, embeddingIndexFile(indexDir));
  assert.ok(readFileSync(written.file, "utf8").endsWith("\n"));

  const loaded = loadEmbeddingIndexFile(written.file);
  assert.equal(loaded.present, true);
  assert.equal(loaded.error, "");
  assert.deepEqual(loaded.payload, built.payload);

  const map = vectorsById(loaded.payload);
  assert.equal(map.size, built.payload.vectors.length);

  writeFileSync(written.file, "not json", "utf8");
  assert.match(loadEmbeddingIndexFile(written.file).error, /unreadable/);

  writeFileSync(written.file, JSON.stringify({ version: 99, kind: "embedding-index" }), "utf8");
  assert.match(loadEmbeddingIndexFile(written.file).error, /unsupported/);

  assert.equal(loadEmbeddingIndexFile(path.join(root, "missing.json")).present, false);
}));

test("embeddingIndexStatus reports absent when the sidecar does not exist", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const profileFile = path.join(root, "learning.json");
  writeFixtureProfile(profileFile);
  const status = embeddingIndexStatus({
    designAiPath: root,
    dirs: ["knowledge", "examples"],
    indexDir: path.join(root, "index"),
    learningFile: profileFile,
  });
  assert.equal(status.present, false);
  assert.equal(status.fresh, false);
  assert.equal(status.provider, null);
}));

test("embeddingIndexStatus reports fresh after build and stale after corpus or learning drift", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const dirs = ["knowledge", "examples"];
  const profileFile = path.join(root, "learning.json");
  writeFixtureProfile(profileFile);
  const indexDir = path.join(root, "index");

  const built = buildEmbeddingIndex({
    provider: { command: "./bin/local-embed", modelLabel: "stub-3d" },
    designAiPath: root,
    dirs,
    learningFile: profileFile,
    now: FIXED_NOW,
    spawnRunner: stubSpawnRunner(),
  });
  writeEmbeddingIndex({ indexDir, payload: built.payload });

  const fresh = embeddingIndexStatus({ designAiPath: root, dirs, indexDir, learningFile: profileFile });
  assert.equal(fresh.present, true);
  assert.equal(fresh.fresh, true);
  assert.equal(fresh.sourceMatch, true);
  assert.equal(fresh.documentCount, built.payload.vectors.length);
  assert.deepEqual(fresh.provider, { command: "./bin/local-embed", modelLabel: "stub-3d", dimensions: 3 });

  // Corpus drift -> stale.
  writeFileSync(path.join(root, "knowledge", "color.md"), "# Color tokens\nEdited.\n", "utf8");
  const corpusStale = embeddingIndexStatus({ designAiPath: root, dirs, indexDir, learningFile: profileFile });
  assert.equal(corpusStale.fresh, false);
  assert.equal(corpusStale.sourceMatch, true);
  assert.notEqual(corpusStale.storedDigest, corpusStale.currentDigest);

  // Restore corpus, drift learning instead -> stale.
  writeFixtureCorpus(root);
  writeFileSync(profileFile, readFileSync(profileFile, "utf8").replace("OKLCH", "HCT"), "utf8");
  const learningStale = embeddingIndexStatus({ designAiPath: root, dirs, indexDir, learningFile: profileFile });
  assert.equal(learningStale.fresh, false);
}));

test("embeddingIndexStatus treats a different checkout or learning file as not-my-index", () => withTempDir((root) => {
  const checkoutA = path.join(root, "checkout-a");
  const checkoutB = path.join(root, "checkout-b");
  for (const checkout of [checkoutA, checkoutB]) {
    mkdirSync(checkout, { recursive: true });
    writeFixtureCorpus(checkout);
  }
  const dirs = ["knowledge", "examples"];
  const profileA = path.join(root, "learning-a.json");
  const profileB = path.join(root, "learning-b.json");
  writeFixtureProfile(profileA);
  writeFixtureProfile(profileB);
  const indexDir = path.join(root, "index");

  const built = buildEmbeddingIndex({
    provider: { command: "./bin/local-embed" },
    designAiPath: checkoutA,
    dirs,
    learningFile: profileA,
    now: FIXED_NOW,
    spawnRunner: stubSpawnRunner(),
  });
  writeEmbeddingIndex({ indexDir, payload: built.payload });

  const sameCheckout = embeddingIndexStatus({ designAiPath: checkoutA, dirs, indexDir, learningFile: profileA });
  assert.equal(sameCheckout.fresh, true);
  assert.equal(sameCheckout.sourceMatch, true);

  const otherCheckout = embeddingIndexStatus({ designAiPath: checkoutB, dirs, indexDir, learningFile: profileA });
  assert.equal(otherCheckout.sourceMatch, false);
  assert.equal(otherCheckout.fresh, false);

  const otherLearningFile = embeddingIndexStatus({ designAiPath: checkoutA, dirs, indexDir, learningFile: profileB });
  assert.equal(otherLearningFile.sourceMatch, false);
  assert.equal(otherLearningFile.fresh, false);
}));

test("embeddingIndexStatus surfaces load errors without throwing", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const profileFile = path.join(root, "learning.json");
  writeFixtureProfile(profileFile);
  const indexDir = path.join(root, "index");
  mkdirSync(indexDir, { recursive: true });
  writeFileSync(embeddingIndexFile(indexDir), "not json", "utf8");

  const status = embeddingIndexStatus({
    designAiPath: root,
    dirs: ["knowledge", "examples"],
    indexDir,
    learningFile: profileFile,
  });
  assert.equal(status.present, true);
  assert.equal(status.fresh, false);
  assert.match(status.error, /unreadable/);
}));
