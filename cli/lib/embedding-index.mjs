// Local embedding sidecar for Phase B (docs/AI-LEARNING-PHASE2.md).
//
// Sits next to the Phase A retrieval index under the same index directory. Never a
// source of truth on its own: it records the same corpus/learning source identity as
// the Phase A index (reusing retrieval-index.mjs helpers) so staleness/identity rules
// stay identical (FU-2). Building requires a working provider (cli/lib/embedding-provider.mjs);
// there is no network call anywhere in this module.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { embedDocuments } from "./embedding-provider.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";
import {
  collectCorpusDocuments,
  computeCorpusDigest,
  computeLearningDigest,
  defaultIndexDir,
  learningEntryDocuments,
} from "./retrieval-index.mjs";
import { auditLearningProfile, loadLearningProfile } from "./learn-profile.mjs";
import { defaultLearningFile } from "./learn-shared.mjs";
import { DEFAULT_SEARCH_DIRS } from "./search.mjs";

export const EMBEDDING_INDEX_VERSION = 1;

// Learning ids are prefixed in the embedding sidecar ONLY, so they can never collide
// with corpus document ids (corpus ids are relative file paths and never contain ":").
export const LEARNING_ID_PREFIX = "learning:";

export function embeddingIndexFile(indexDir = defaultIndexDir()) {
  return path.join(indexDir, "embedding-index.json");
}

function roundVector(vector) {
  return vector.map((n) => Number(n.toFixed(6)));
}

// Builds the embedding sidecar by embedding both the corpus documents and the
// learning entry documents (learning ids prefixed with "learning:" here only —
// the Phase A learning index and learning.json itself are untouched).
export function buildEmbeddingIndex({
  provider,
  designAiPath = PACKAGE_ROOT,
  dirs = DEFAULT_SEARCH_DIRS,
  learningFile = defaultLearningFile(),
  now = new Date(),
  spawnRunner,
} = {}) {
  if (!provider || typeof provider.command !== "string" || provider.command.trim() === "") {
    return { ok: false, error: "no embedding provider configured (pass --provider or set embeddings.provider in ~/.design-ai/config.json)" };
  }

  const corpusDocuments = collectCorpusDocuments({ designAiPath, dirs });
  const profile = loadLearningProfile(learningFile);
  const learningDocuments = learningEntryDocuments(profile).map((doc) => ({
    id: `${LEARNING_ID_PREFIX}${doc.id}`,
    text: doc.text,
  }));

  const allDocuments = [...corpusDocuments, ...learningDocuments].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const embedArgs = { provider, documents: allDocuments };
  if (spawnRunner) embedArgs.spawnRunner = spawnRunner;
  const embedded = embedDocuments(embedArgs);
  if (!embedded.ok) return { ok: false, error: embedded.error };

  const vectors = allDocuments
    .map((doc) => ({ id: doc.id, v: roundVector(embedded.vectorsById.get(doc.id)) }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const { digest: learningDigest } = computeLearningDigest(learningFile);
  const audit = auditLearningProfile({ filePath: learningFile });

  const payload = {
    version: EMBEDDING_INDEX_VERSION,
    kind: "embedding-index",
    generatedAt: now.toISOString(),
    provider: {
      command: provider.command,
      args: Array.isArray(provider.args) ? [...provider.args] : [],
      modelLabel: provider.modelLabel || "",
      dimensions: embedded.dimensions,
    },
    source: {
      designAiPath: path.resolve(designAiPath),
      corpusDirs: [...dirs],
      corpusDigest: computeCorpusDigest(corpusDocuments),
      learningFile: path.resolve(learningFile),
      learningDigest,
      auditStatus: audit.status || "unknown",
    },
    vectors,
  };

  return { ok: true, payload };
}

export function writeEmbeddingIndex({ indexDir = defaultIndexDir(), payload }) {
  mkdirSync(indexDir, { recursive: true });
  const file = embeddingIndexFile(indexDir);
  writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return { file };
}

// Mirrors loadIndexFile's validation shape/version contract from retrieval-index.mjs.
export function loadEmbeddingIndexFile(file) {
  if (!existsSync(file)) return { present: false, payload: null, error: "" };
  try {
    const payload = JSON.parse(readFileSync(file, "utf8"));
    if (!payload || typeof payload !== "object" || payload.version !== EMBEDDING_INDEX_VERSION || payload.kind !== "embedding-index") {
      return { present: true, payload: null, error: "unsupported embedding index payload shape or version" };
    }
    return { present: true, payload, error: "" };
  } catch (error) {
    return { present: true, payload: null, error: `unreadable embedding index file: ${error.message}` };
  }
}

// Status mirrors retrieval-index.mjs's statusEntry rules: fresh requires both digests
// to match AND both source identities (designAiPath, learningFile) to match — a
// different checkout or a different learning file is "not my index" (same FU-2 rule).
export function embeddingIndexStatus({
  designAiPath = PACKAGE_ROOT,
  dirs = DEFAULT_SEARCH_DIRS,
  indexDir = defaultIndexDir(),
  learningFile = defaultLearningFile(),
} = {}) {
  const file = embeddingIndexFile(indexDir);
  const loaded = loadEmbeddingIndexFile(file);

  if (!loaded.present) {
    return {
      file,
      present: false,
      fresh: false,
      sourceMatch: false,
      generatedAt: "",
      documentCount: 0,
      provider: null,
      storedDigest: "",
      currentDigest: "",
      error: "",
    };
  }

  const currentCorpusDigest = computeCorpusDigest(collectCorpusDocuments({ designAiPath, dirs }));
  const currentLearningDigest = computeLearningDigest(learningFile).digest;

  if (loaded.error) {
    return {
      file,
      present: true,
      fresh: false,
      sourceMatch: false,
      generatedAt: "",
      documentCount: 0,
      provider: null,
      storedDigest: "",
      currentDigest: currentCorpusDigest,
      error: loaded.error,
    };
  }

  const storedSource = loaded.payload.source || {};
  const storedCorpusDigest = storedSource.corpusDigest || "";
  const storedLearningDigest = storedSource.learningDigest || "";
  const sourceMatch =
    storedSource.designAiPath === path.resolve(designAiPath) &&
    storedSource.learningFile === path.resolve(learningFile);
  const digestMatch = storedCorpusDigest === currentCorpusDigest && storedLearningDigest === currentLearningDigest;
  const fresh = sourceMatch && digestMatch;

  const provider = loaded.payload.provider || null;

  return {
    file,
    present: true,
    fresh,
    sourceMatch,
    generatedAt: loaded.payload.generatedAt || "",
    documentCount: Array.isArray(loaded.payload.vectors) ? loaded.payload.vectors.length : 0,
    provider: provider ? { command: provider.command, modelLabel: provider.modelLabel || "", dimensions: provider.dimensions } : null,
    // storedDigest/currentDigest track the corpus digest, matching the Phase A status
    // entry shape; learning drift is folded into `fresh`/`sourceMatch` above since the
    // embedding sidecar has two source digests (corpus + learning) but one file.
    storedDigest: storedCorpusDigest,
    currentDigest: currentCorpusDigest,
    error: "",
  };
}

export function vectorsById(payload) {
  const map = new Map();
  for (const entry of payload?.vectors || []) {
    map.set(entry.id, entry.v);
  }
  return map;
}
