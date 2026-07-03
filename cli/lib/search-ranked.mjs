// Ranked (BM25-style) corpus search for `design-ai search --ranked`.
// Deterministic: ranks a live corpus scan, then reports retrieval-index staleness
// instead of ever serving stale index text (docs/AI-LEARNING-PHASE2.md, Phase A).

import { readFileSync } from "node:fs";
import path from "node:path";

import { buildLexicalStats, rankLexical } from "./lexical.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";
import {
  collectCorpusDocuments,
  computeCorpusDigest,
  corpusIndexFile,
  defaultIndexDir,
  loadIndexFile,
} from "./retrieval-index.mjs";
import { DEFAULT_SEARCH_DIRS } from "./search.mjs";

const RANKED_PREVIEW_LEN = 120;

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
} = {}) {
  const documents = collectCorpusDocuments({ designAiPath, dirs });
  const stats = buildLexicalStats(documents.map(({ id, text }) => ({ id, text })));
  const textById = new Map(documents.map((doc) => [doc.id, doc.text]));

  const hits = rankLexical(query, stats, { limit }).map((hit) => ({
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
