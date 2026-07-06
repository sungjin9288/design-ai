// Corpus knowledge recall (retrieval-augmentation) for `design-ai prompt`/`pack`
// --with-recall. Injects the most brief-relevant CORPUS KNOWLEDGE FILES, ranked by
// the SAME shipped deterministic lexical (BM25-style) scorer that powers
// `design-ai search --ranked` and learning selection (docs/AI-LEARNING-PHASE2.md,
// Phase A). Sibling of learning selection: learning recalls LOCAL preferences,
// recall recalls SHIPPED corpus knowledge. Zero-dependency and deterministic.
//
// NO embeddings in this path: the pack/prompt recall stays lexical-only. Embedding
// rerank remains a search-only opt-in for now (docs/AI-LEARNING-PHASE2.md, Phase B);
// there is deliberately no --embeddings recall variant.

import { readFileSync } from "node:fs";
import path from "node:path";

import { rankedSearchCorpus, rankedPreview } from "./search-ranked.mjs";
import { collectCorpusDocuments } from "./retrieval-index.mjs";
import { loadLearningProfile } from "./learn-profile.mjs";
import { selectLearningEntrySet } from "./learn-select.mjs";
import { defaultLearningFile } from "./learn-shared.mjs";
import { DESIGN_AI_HOME } from "./paths.mjs";
import { DEFAULT_SEARCH_DIRS } from "./search.mjs";

export const DEFAULT_RECALL_LIMIT = 5;

// Mirrors parseLearningLimit but bounded 1-20 (recall injects whole corpus files, so a
// tighter cap than learning's 1-100 keeps the recall section budget-friendly).
export function parseRecallLimit(rawLimit) {
  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new Error("--recall-limit expects an integer from 1 to 20");
  }
  return limit;
}

// Cap each recalled file's rendered block so the total recall section stays bounded.
// The pack's takeUtf8(maxBytes) truncation still applies to the WHOLE pack as-is, so
// recall respects the byte budget by being subject to the same cap; this per-file cap
// keeps any single file from crowding out the rest of the recall section.
const RECALL_BLOCK_CHAR_CAP = 400;

// First Markdown `# ` heading, else the first non-empty line — a short, deterministic
// citation label for the recalled file.
function firstHeadingOrLine(text) {
  const lines = String(text || "").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) return trimmed.slice(2).trim();
  }
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return "";
}

function readCorpusText(designAiPath, relPath) {
  try {
    return readFileSync(path.join(designAiPath, relPath), "utf8");
  } catch {
    return "";
  }
}

// Bounded per-file block: relPath citation + heading/first line + matched excerpt.
// Capped to ~RECALL_BLOCK_CHAR_CAP chars so no single file dominates the section.
function renderRecallBlock({ id, text, matchedTokens }) {
  const heading = firstHeadingOrLine(text);
  const excerpt = rankedPreview(text, matchedTokens);
  const parts = [`- ${id}`];
  if (heading) parts.push(`  - ${heading}`);
  if (excerpt) parts.push(`  - ${excerpt}`);
  const block = parts.join("\n");
  return block.length <= RECALL_BLOCK_CHAR_CAP
    ? block
    : `${block.slice(0, RECALL_BLOCK_CHAR_CAP)}...`;
}

function renderRecallMarkdown(selected, textById) {
  const lines = ["## Recalled design knowledge", ""];
  if (selected.length === 0) {
    lines.push("No corpus knowledge files matched this brief.");
    return lines.join("\n");
  }

  lines.push("Cite these shipped corpus knowledge files when they inform a design decision.");
  lines.push("");
  for (const item of selected) {
    lines.push(renderRecallBlock({
      id: item.id,
      text: textById.get(item.id) || "",
      matchedTokens: item.matchedTokens,
    }));
  }
  return lines.join("\n");
}

// Returns a recall context mirroring learning's selection-item shape (id = corpus
// relPath). REUSES rankedSearchCorpus for scoring — no reimplemented ranking. The
// ranker already orders fully by score desc, id asc, so the result is deterministic.
// Empty brief or no lexical hits -> selectedCount 0 and a "no corpus knowledge"
// markdown line.
export function buildRecallContext({
  brief = "",
  recallLimit = DEFAULT_RECALL_LIMIT,
  designAiPath = DESIGN_AI_HOME,
  dirs = DEFAULT_SEARCH_DIRS,
} = {}) {
  const query = String(brief || "").trim();
  const candidateCount = collectCorpusDocuments({ designAiPath, dirs }).length;

  const hits = query
    ? rankedSearchCorpus({ query, designAiPath, dirs, limit: recallLimit, excludeNonKnowledge: true }).hits
    : [];

  const selected = hits.map((hit) => ({
    id: hit.relPath,
    score: hit.score,
    matchedTokens: hit.matchedTokens,
  }));

  const textById = new Map(
    selected.map((item) => [item.id, readCorpusText(designAiPath, item.id)]),
  );

  return {
    query,
    mode: "lexical",
    candidateCount,
    selectedCount: selected.length,
    selected,
    markdown: renderRecallMarkdown(selected, textById),
  };
}

// Read-side companion to `pack --with-recall`: a unified "what does design-ai
// recall for this query" view. Combines (1) the top corpus knowledge files ranked
// by rankedSearchCorpus with (2) the top local learning-profile entries ranked by
// selectLearningEntrySet — BOTH using the same shipped deterministic lexical scorer.
// Read-only: never writes the profile or any file. Empty query -> zero hits on both
// sides. `limit` applies to BOTH lists; `category` scopes ONLY the learning list.
export function buildLearnRecall({
  query = "",
  limit = DEFAULT_RECALL_LIMIT,
  category = "",
  designAiPath = DESIGN_AI_HOME,
  learningFilePath = defaultLearningFile(),
  dirs = DEFAULT_SEARCH_DIRS,
} = {}) {
  const normalizedQuery = String(query || "").trim();

  const corpusCandidateCount = collectCorpusDocuments({ designAiPath, dirs }).length;
  const corpusHits = normalizedQuery
    ? rankedSearchCorpus({ query: normalizedQuery, designAiPath, dirs, limit, excludeNonKnowledge: true }).hits
    : [];
  const corpusSelected = corpusHits.map((hit) => ({
    id: hit.relPath,
    score: hit.score,
    matchedTokens: hit.matchedTokens,
  }));

  const profile = loadLearningProfile(learningFilePath);
  const textById = new Map(profile.entries.map((entry) => [entry.id, entry.text || ""]));
  const { selection } = selectLearningEntrySet(profile, {
    query: normalizedQuery,
    limit,
    category,
    includeFallback: false,
  });
  const learningSelected = normalizedQuery
    ? selection.selected.map((item) => ({
      id: item.id,
      category: item.category,
      score: item.score,
      matchedTokens: item.matchedTokens,
      text: textById.get(item.id) || "",
    }))
    : [];

  return {
    query: normalizedQuery,
    corpus: {
      candidateCount: corpusCandidateCount,
      selectedCount: corpusSelected.length,
      selected: corpusSelected,
    },
    learning: {
      mode: selection.mode,
      candidateCount: selection.candidateCount,
      selectedCount: learningSelected.length,
      selected: learningSelected,
    },
  };
}
