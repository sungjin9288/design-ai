// Shared deterministic lexical (BM25-style) scoring for corpus and learning retrieval.
// Phase A of docs/AI-LEARNING-PHASE2.md: zero-dependency, no randomness, no time-dependent scoring.

export const BM25_K1 = 1.2;
export const BM25_B = 0.75;

// Hangul syllable block (U+AC00–U+D7A3). Korean surface forms are written without
// spaces between stem and particle (버튼을, 접근성이), so a whitespace-delimited token
// is an atomic surface form. To let a stem query match particle-attached documents
// (and vice versa), we deterministically expand every Hangul run of length >= 2 into
// its overlapping character bigrams and emit them ALONGSIDE the original token.
//   버튼을 -> keep 버튼을, add 버튼, 튼을
//   접근성 -> keep 접근성, add 접근, 근성
//   버튼   -> the 2-char run's only bigram is itself; kept via dedupe
// Latin/number tokens and mixed tokens' non-Hangul parts are unchanged. The rule is
// pure and deterministic (no locale, no time, no randomness); order is normalized by
// the dedupe+sort in lexicalQueryTokens and by termFrequencies for stats.
const HANGUL_RUN = /[가-힣]{2,}/gu;

function hangulBigrams(token) {
  const bigrams = [];
  for (const run of token.match(HANGUL_RUN) || []) {
    for (let i = 0; i + 2 <= run.length; i += 1) {
      bigrams.push(run.slice(i, i + 2));
    }
  }
  return bigrams;
}

// Same base token model as learn-select.mjs: Unicode letters/numbers, lowercased,
// length >= 2. Hangul tokens additionally emit character bigrams (see HANGUL_RUN).
export function lexicalTokens(text) {
  const base = (String(text || "")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) || [])
    .filter((token) => token.length >= 2);

  const expanded = [];
  for (const token of base) {
    expanded.push(token);
    for (const bigram of hangulBigrams(token)) {
      // A 2-char Hangul run's only bigram is the token itself; do not re-emit it,
      // which would double-count its term frequency and distort BM25.
      if (bigram !== token) expanded.push(bigram);
    }
  }
  return expanded;
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
