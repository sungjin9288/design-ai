// Ranked (BM25-style) corpus search for `design-ai search --ranked`, plus the
// opt-in Phase B embedding rerank (docs/AI-LEARNING-PHASE2.md, Phase B).
// Deterministic: ranks a live corpus scan, then reports retrieval-index staleness
// instead of ever serving stale index text (docs/AI-LEARNING-PHASE2.md, Phase A).

import { readFileSync } from "node:fs";
import path from "node:path";

import { embeddingIndexFile, loadEmbeddingIndexFile, vectorsById as embeddingVectorsById } from "./embedding-index.mjs";
import { embedDocuments } from "./embedding-provider.mjs";
import { cosineRerank } from "./embedding-rerank.mjs";
import { buildLexicalStats, rankLexical } from "./lexical.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";
import {
  collectCorpusDocuments,
  computeCorpusDigest,
  computeLearningDigest,
  corpusIndexFile,
  defaultIndexDir,
  loadIndexFile,
} from "./retrieval-index.mjs";
import { defaultLearningFile } from "./learn-shared.mjs";
import { DEFAULT_SEARCH_DIRS } from "./search.mjs";

const RANKED_PREVIEW_LEN = 120;

// Predicate for GENERATED index/meta docs that must be kept out of the RECALL /
// context-injection layer (pack/prompt --with-recall, learn --recall corpus side,
// route --explain related knowledge). These files rank on keyword density but are
// meta/index tables, not design knowledge worth injecting into an agent's context.
// Rule: true when the basename is `COVERAGE.md` or `INDEX.md` (generated coverage
// table / component index), OR the forward-slash-normalized path starts with
// `docs/reference/` (generated upstream-reference pages). Raw `search --ranked`
// does NOT apply this — a user explicitly searching may legitimately want an index.
export function isGeneratedIndexDoc(relPath) {
  const normalized = String(relPath || "").replace(/\\/g, "/");
  const basename = normalized.slice(normalized.lastIndexOf("/") + 1);
  return basename === "COVERAGE.md"
    || basename === "INDEX.md"
    || normalized.startsWith("docs/reference/");
}

// Repo-meta docs (portfolio/case-study/interview material) that ship in the repo
// but are deliberately excluded from the npm package via the `!docs/*.md` entries
// in package.json `files`. Keep this Set in sync with that list — verify against
// package.json `files` before adding/removing an entry. Not design knowledge;
// found polluting recall-injection results in the Phase 764 dogfood pass
// (docs/DOGFOOD-SDK-FINDINGS.md, F-2: docs/case-study.md ranked #1 for a design brief).
const NON_KNOWLEDGE_META_DOCS = new Set([
  "docs/case-study.md",
  "docs/evidence-checklist.md",
  "docs/evidence-gallery.md",
  "docs/implementation-evidence.md",
  "docs/interview-story.md",
  "docs/project-card.md",
  "docs/project-roadmap.md",
  "docs/readme-improvement.md",
  "docs/resume-bullets.md",
]);

// Predicate for the full RECALL-injection exclusion set (docs/DOGFOOD-SDK-FINDINGS.md,
// F-2): generated index/meta docs (isGeneratedIndexDoc) OR the package-excluded
// repo-meta docs (NON_KNOWLEDGE_META_DOCS) OR anything under docs/integrations/
// (agent walkthroughs, not design knowledge). Same recall-injection-surfaces-only
// boundary as isGeneratedIndexDoc: raw `search --ranked` never applies this.
export function isRecallExcludedDoc(relPath) {
  const normalized = String(relPath || "").replace(/\\/g, "/");
  return isGeneratedIndexDoc(normalized)
    || NON_KNOWLEDGE_META_DOCS.has(normalized)
    || normalized.startsWith("docs/integrations/");
}

// N = max(limit*5, 25): the number of top lexical candidates handed to the embedding
// reranker. Documented constant (docs/AI-LEARNING-PHASE2.md, Phase B CLI wiring).
export function embeddingCandidateCount(limit) {
  return Math.max(limit * 5, 25);
}

export function rankedPreview(text, matchedTokens) {
  const lines = text.split("\n");
  for (const token of matchedTokens) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.toLowerCase().includes(token)) {
        return trimmed.length <= RANKED_PREVIEW_LEN
          ? trimmed
          : `${trimmed.slice(0, RANKED_PREVIEW_LEN)}...`;
      }
    }
  }
  const firstLine = lines.map((line) => line.trim()).find((line) => line.length > 0) || "";
  return firstLine.length <= RANKED_PREVIEW_LEN ? firstLine : `${firstLine.slice(0, RANKED_PREVIEW_LEN)}...`;
}

function corpusIndexNotice({ indexDir, currentDigest }) {
  const loaded = loadIndexFile(corpusIndexFile(indexDir));
  if (!loaded.present) {
    return "no corpus index built yet; ranked results come from a live corpus scan (design-ai index --build)";
  }
  if (loaded.error) {
    return `corpus index is unreadable (${loaded.error}); ranked results come from a live corpus scan (design-ai index --build)`;
  }
  if ((loaded.payload.source?.corpusDigest || "") !== currentDigest) {
    return "corpus index is stale; ranked results come from a live corpus scan (design-ai index --build)";
  }
  return "";
}

export function rankedSearchCorpus({
  query,
  designAiPath = PACKAGE_ROOT,
  dirs = DEFAULT_SEARCH_DIRS,
  limit = 20,
  indexDir = defaultIndexDir(),
  // Opt-in RECALL filter: when true, drop non-knowledge docs (isRecallExcludedDoc —
  // generated index/meta docs, package-excluded repo-meta docs, docs/integrations/
  // walkthroughs) BEFORE applying `limit`, so the limit fills with real knowledge
  // instead of those files. Default false keeps raw `search --ranked` byte-unchanged.
  // Filtering before the limit preserves determinism (score desc, id asc) — the rank
  // pass already orders fully, we only remove excluded ids.
  excludeNonKnowledge = false,
} = {}) {
  const documents = collectCorpusDocuments({ designAiPath, dirs });
  const stats = buildLexicalStats(documents.map(({ id, text }) => ({ id, text })));
  const textById = new Map(documents.map((doc) => [doc.id, doc.text]));

  // When excluding, rank the FULL candidate pool first (limit = documents.length)
  // so that filtering out non-knowledge docs cannot let a real-knowledge hit fall
  // off the pre-limit cutoff; then re-apply `limit`. Ordering is unchanged (score
  // desc, id asc).
  const ranked = rankLexical(query, stats, {
    limit: excludeNonKnowledge ? documents.length : limit,
  });
  const filtered = excludeNonKnowledge
    ? ranked.filter((hit) => !isRecallExcludedDoc(hit.id)).slice(0, limit)
    : ranked;

  const hits = filtered.map((hit) => ({
    relPath: hit.id,
    file: path.join(designAiPath, hit.id),
    score: hit.score,
    matchedTokens: hit.matchedTokens,
    preview: rankedPreview(textById.get(hit.id) || "", hit.matchedTokens),
  }));

  return {
    hits,
    notice: corpusIndexNotice({ indexDir, currentDigest: computeCorpusDigest(documents) }),
  };
}

function embeddingSidecarFreshness({ indexDir, designAiPath, learningFile, corpusDigest }) {
  const file = embeddingIndexFile(indexDir);
  const loaded = loadEmbeddingIndexFile(file);
  if (!loaded.present) return { ok: false, reason: "no embedding index built yet (design-ai index --build --embeddings)" };
  if (loaded.error) return { ok: false, reason: `embedding index is unreadable (${loaded.error})` };

  const source = loaded.payload.source || {};
  const sourceMatch =
    source.designAiPath === path.resolve(designAiPath) && source.learningFile === path.resolve(learningFile);
  if (!sourceMatch) {
    return { ok: false, reason: "embedding index was built from a different checkout or learning file" };
  }

  const { digest: currentLearningDigest } = computeLearningDigest(learningFile);
  const digestMatch = source.corpusDigest === corpusDigest && source.learningDigest === currentLearningDigest;
  if (!digestMatch) {
    return { ok: false, reason: "embedding index is stale (design-ai index --build --embeddings)" };
  }

  return { ok: true, payload: loaded.payload };
}

// Opt-in Phase B rerank: take the top-N lexical candidates, embed the QUERY via the
// provider, cosine-rerank against the stored sidecar vectors, return the top `limit`.
// ANY failure (no provider, no sidecar, stale sidecar, provider error) is reported
// via `fallback: true` + a specific `notice` — callers must fall back to the lexical
// path and exit 0; a stale sidecar must never silently serve embedding results.
export function embeddingRerankSearch({
  query,
  provider,
  designAiPath = PACKAGE_ROOT,
  dirs = DEFAULT_SEARCH_DIRS,
  limit = 20,
  indexDir = defaultIndexDir(),
  learningFile = defaultLearningFile(),
  spawnRunner,
} = {}) {
  if (!provider || typeof provider.command !== "string" || provider.command.trim() === "") {
    return { fallback: true, notice: "no embedding provider configured (pass --provider or configure ~/.design-ai/config.json)" };
  }

  // Freshness is checked against the FULL corpus (the same dirs `index --build
  // --embeddings` always embeds), independent of this search's --dir filter — a
  // scoped `--dir knowledge` search must not be compared against a digest of only
  // the knowledge dir, or every scoped search would spuriously report the sidecar
  // stale. Candidate generation below still respects the caller's `dirs` filter.
  const fullCorpusDocuments = collectCorpusDocuments({ designAiPath, dirs: DEFAULT_SEARCH_DIRS });
  const corpusDigest = computeCorpusDigest(fullCorpusDocuments);
  const freshness = embeddingSidecarFreshness({ indexDir, designAiPath, learningFile, corpusDigest });
  if (!freshness.ok) return { fallback: true, notice: freshness.reason };

  const documents = dirs === DEFAULT_SEARCH_DIRS ? fullCorpusDocuments : collectCorpusDocuments({ designAiPath, dirs });
  const candidateCount = embeddingCandidateCount(limit);
  const stats = buildLexicalStats(documents.map(({ id, text }) => ({ id, text })));
  const textById = new Map(documents.map((doc) => [doc.id, doc.text]));
  const candidates = rankLexical(query, stats, { limit: candidateCount });
  if (candidates.length === 0) {
    return { fallback: true, notice: "no lexical candidates matched the query; nothing to rerank" };
  }

  const embedArgs = { provider, documents: [{ id: "__query__", text: query }] };
  if (spawnRunner) embedArgs.spawnRunner = spawnRunner;
  const embedded = embedDocuments(embedArgs);
  if (!embedded.ok) return { fallback: true, notice: `embedding provider failed: ${embedded.error}` };

  const queryVector = embedded.vectorsById.get("__query__");
  const vectors = embeddingVectorsById(freshness.payload);
  const reranked = cosineRerank({ queryVector, candidates, vectorsById: vectors, limit });

  const hits = reranked.map((hit) => ({
    relPath: hit.id,
    file: path.join(designAiPath, hit.id),
    // `score` is a cosine similarity for embedded candidates; a candidate the
    // provider had no vector for (placed after all embedded ones, see
    // embedding-rerank.mjs) keeps its lexical BM25 score here as a documented,
    // deterministic fallback value rather than an undefined/null field.
    score: hit.score,
    matchedTokens: hit.matchedTokens,
    preview: rankedPreview(textById.get(hit.id) || "", hit.matchedTokens),
  }));

  return { fallback: false, hits };
}
