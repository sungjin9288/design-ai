// Tests for local retrieval index build/status/verify.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildCorpusIndex,
  buildLearningIndex,
  collectCorpusDocuments,
  computeCorpusDigest,
  corpusIndexFile,
  learningIndexFile,
  loadIndexFile,
  retrievalIndexStatus,
  verifyRetrievalIndexes,
  writeRetrievalIndexes,
} from "./retrieval-index.mjs";

function withTempDir(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-index-test-"));
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
      { id: "bbb222", category: "workflow", text: "Run audits before handoff", createdAt: "2026-07-01T00:00:00.000Z", source: "test" },
    ],
  }, null, 2), "utf8");
}

const FIXED_NOW = new Date("2026-07-03T00:00:00.000Z");

test("buildCorpusIndex is deterministic apart from generatedAt and digests source bytes", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const dirs = ["knowledge", "examples"];
  const first = buildCorpusIndex({ designAiPath: root, dirs, now: FIXED_NOW });
  const second = buildCorpusIndex({ designAiPath: root, dirs, now: new Date("2027-01-01T00:00:00.000Z") });

  assert.equal(first.kind, "retrieval-index");
  assert.deepEqual(first.documents.map((doc) => doc.id), ["examples/button.md", "knowledge/color.md"]);
  assert.match(first.source.corpusDigest, /^sha256:[0-9a-f]{64}$/);
  const { generatedAt: g1, ...restFirst } = first;
  const { generatedAt: g2, ...restSecond } = second;
  assert.deepEqual(restSecond, restFirst);
  assert.notEqual(g1, g2);

  const docs = collectCorpusDocuments({ designAiPath: root, dirs });
  assert.equal(first.source.corpusDigest, computeCorpusDigest(docs));
}));

test("buildLearningIndex indexes only profile entries and records digest + audit status", () => withTempDir((root) => {
  const profileFile = path.join(root, "learning.json");
  writeFixtureProfile(profileFile);
  const index = buildLearningIndex({ filePath: profileFile, now: FIXED_NOW });

  assert.equal(index.kind, "learning-retrieval-index");
  assert.equal(index.source.learningExists, true);
  assert.match(index.source.learningDigest, /^sha256:[0-9a-f]{64}$/);
  assert.equal(index.stats.documentCount, 2);
  assert.deepEqual(index.documents.map((doc) => doc.id), ["aaa111", "bbb222"]);
  assert.ok(index.documents[0].terms.oklch);
}));

test("status reports fresh after build and stale after source change", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const dirs = ["knowledge", "examples"];
  const profileFile = path.join(root, "learning.json");
  writeFixtureProfile(profileFile);
  const indexDir = path.join(root, "index");

  const corpus = buildCorpusIndex({ designAiPath: root, dirs, now: FIXED_NOW });
  const learning = buildLearningIndex({ filePath: profileFile, now: FIXED_NOW });
  const written = writeRetrievalIndexes({ indexDir, corpus, learning });
  assert.equal(written.corpusFile, corpusIndexFile(indexDir));
  assert.equal(written.learningFile, learningIndexFile(indexDir));
  assert.ok(readFileSync(written.corpusFile, "utf8").endsWith("\n"));

  const freshStatus = retrievalIndexStatus({ designAiPath: root, dirs, indexDir, learningFile: profileFile });
  assert.equal(freshStatus.fresh, true);
  assert.equal(freshStatus.corpus.fresh, true);
  assert.equal(freshStatus.learning.fresh, true);
  assert.equal(freshStatus.buildCommand, "design-ai index --build");

  writeFileSync(path.join(root, "knowledge", "color.md"), "# Color tokens\nEdited after redaction.\n", "utf8");
  const staleStatus = retrievalIndexStatus({ designAiPath: root, dirs, indexDir, learningFile: profileFile });
  assert.equal(staleStatus.corpus.fresh, false);
  assert.equal(staleStatus.learning.fresh, true);
  assert.equal(staleStatus.fresh, false);
  assert.notEqual(staleStatus.corpus.storedDigest, staleStatus.corpus.currentDigest);
}));

test("status and verify report missing index files without throwing", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const dirs = ["knowledge", "examples"];
  const profileFile = path.join(root, "learning.json");
  writeFixtureProfile(profileFile);
  const indexDir = path.join(root, "index");

  const status = retrievalIndexStatus({ designAiPath: root, dirs, indexDir, learningFile: profileFile });
  assert.equal(status.corpus.present, false);
  assert.equal(status.fresh, false);

  const verify = verifyRetrievalIndexes({ designAiPath: root, dirs, indexDir, learningFile: profileFile, now: FIXED_NOW });
  assert.equal(verify.ok, false);
  assert.match(verify.checks[0].reason, /missing/);
}));

test("verify passes on a faithful build and fails when sources drift", () => withTempDir((root) => {
  writeFixtureCorpus(root);
  const dirs = ["knowledge", "examples"];
  const profileFile = path.join(root, "learning.json");
  writeFixtureProfile(profileFile);
  const indexDir = path.join(root, "index");

  writeRetrievalIndexes({
    indexDir,
    corpus: buildCorpusIndex({ designAiPath: root, dirs, now: FIXED_NOW }),
    learning: buildLearningIndex({ filePath: profileFile, now: FIXED_NOW }),
  });

  const ok = verifyRetrievalIndexes({ designAiPath: root, dirs, indexDir, learningFile: profileFile, now: FIXED_NOW });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.checks.map((check) => check.matches), [true, true]);

  writeFixtureProfile(profileFile);
  writeFileSync(profileFile, readFileSync(profileFile, "utf8").replace("OKLCH", "HCT"), "utf8");
  const drifted = verifyRetrievalIndexes({ designAiPath: root, dirs, indexDir, learningFile: profileFile, now: FIXED_NOW });
  assert.equal(drifted.ok, false);
  assert.equal(drifted.checks.find((check) => check.name === "learning").matches, false);
  assert.equal(drifted.checks.find((check) => check.name === "corpus").matches, true);
}));

test("loadIndexFile flags unreadable and wrong-version payloads", () => withTempDir((root) => {
  const file = path.join(root, "corpus-index.json");
  writeFileSync(file, "not json", "utf8");
  assert.match(loadIndexFile(file).error, /unreadable/);
  writeFileSync(file, JSON.stringify({ version: 99 }), "utf8");
  assert.match(loadIndexFile(file).error, /version/);
  assert.equal(loadIndexFile(path.join(root, "missing.json")).present, false);
}));
