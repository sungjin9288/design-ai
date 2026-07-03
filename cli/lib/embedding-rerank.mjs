// Deterministic cosine-similarity rerank for Phase B (docs/AI-LEARNING-PHASE2.md).
//
// design-ai's side of Phase B stays fully deterministic: candidate generation is the
// existing Phase A lexical ranking, and this module only computes cosine similarity
// against provider-supplied vectors and sorts with a fixed tie-break rule. Vector
// values depend on the user's provider, but everything design-ai does with them here
// is pure and order-stable.

function dotProduct(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += a[i] * b[i];
  return sum;
}

function magnitude(vector) {
  return Math.sqrt(dotProduct(vector, vector));
}

export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0;
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

// candidates: [{ id, ... }] in Phase A lexical order (used as the tie-break/placement
// order for anything without a vector). vectorsById: Map<id, number[]>. queryVector:
// number[]. Candidates missing a vector are NOT scored — they keep their lexical
// order and are placed AFTER every scored (embedded) candidate, deterministically.
export function cosineRerank({ queryVector, candidates, vectorsById, limit }) {
  const scored = [];
  const unscored = [];

  for (const candidate of candidates) {
    const vector = vectorsById.get(candidate.id);
    if (!vector) {
      unscored.push(candidate);
      continue;
    }
    const score = cosineSimilarity(queryVector, vector);
    scored.push({ ...candidate, score: Number(score.toFixed(6)) });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const ordered = [...scored, ...unscored];
  return Number.isInteger(limit) ? ordered.slice(0, limit) : ordered;
}
