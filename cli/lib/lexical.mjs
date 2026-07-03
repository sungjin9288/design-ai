// Shared deterministic lexical (BM25-style) scoring for corpus and learning retrieval.
// Phase A of docs/AI-LEARNING-PHASE2.md: zero-dependency, no randomness, no time-dependent scoring.

export const BM25_K1 = 1.2;
export const BM25_B = 0.75;

// Same token model as learn-select.mjs: Unicode letters/numbers, lowercased, length >= 2.
export function lexicalTokens(text) {
  return (String(text || "")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) || [])
    .filter((token) => token.length >= 2);
}

export function lexicalQueryTokens(query) {
  return Array.from(new Set(lexicalTokens(query))).sort();
}

function termFrequencies(tokens) {
  const terms = {};
  for (const token of tokens) {
    terms[token] = (terms[token] || 0) + 1;
  }
  const sorted = {};
  for (const term of Object.keys(terms).sort()) {
    sorted[term] = terms[term];
  }
  return sorted;
}

// documents: [{ id, text }] -> deterministic index stats with sorted ids and term keys.
export function buildLexicalStats(documents) {
  const indexed = [...documents]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((doc) => {
      const tokens = lexicalTokens(doc.text);
      return { id: doc.id, length: tokens.length, terms: termFrequencies(tokens) };
    });

  const docFrequency = {};
  for (const doc of indexed) {
    for (const term of Object.keys(doc.terms)) {
      docFrequency[term] = (docFrequency[term] || 0) + 1;
    }
  }
  const sortedDocFrequency = {};
  for (const term of Object.keys(docFrequency).sort()) {
    sortedDocFrequency[term] = docFrequency[term];
  }

  const totalLength = indexed.reduce((sum, doc) => sum + doc.length, 0);
  return {
    documentCount: indexed.length,
    termCount: Object.keys(sortedDocFrequency).length,
    avgDocLength: indexed.length > 0 ? totalLength / indexed.length : 0,
    docFrequency: sortedDocFrequency,
    documents: indexed,
  };
}

function inverseDocumentFrequency(documentCount, docFrequency) {
  return Math.log(1 + (documentCount - docFrequency + 0.5) / (docFrequency + 0.5));
}

export function bm25Score(queryTokens, doc, stats) {
  if (stats.documentCount === 0 || doc.length === 0) return { score: 0, matchedTokens: [] };

  let score = 0;
  const matchedTokens = [];
  for (const token of queryTokens) {
    const tf = doc.terms[token] || 0;
    if (tf === 0) continue;
    const df = stats.docFrequency[token] || 0;
    const idf = inverseDocumentFrequency(stats.documentCount, df);
    const lengthNorm = 1 - BM25_B + BM25_B * (doc.length / (stats.avgDocLength || 1));
    score += idf * ((tf * (BM25_K1 + 1)) / (tf + BM25_K1 * lengthNorm));
    matchedTokens.push(token);
  }
  return { score, matchedTokens };
}

// Fully ordered ranking: score desc, then id asc. Zero-score documents are excluded.
export function rankLexical(query, stats, { limit = 20 } = {}) {
  const queryTokens = lexicalQueryTokens(query);
  if (queryTokens.length === 0) return [];

  const ranked = [];
  for (const doc of stats.documents) {
    const { score, matchedTokens } = bm25Score(queryTokens, doc, stats);
    if (score > 0) {
      ranked.push({ id: doc.id, score, matchedTokens });
    }
  }
  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return ranked.slice(0, limit).map((hit) => ({
    ...hit,
    score: Number(hit.score.toFixed(6)),
  }));
}
