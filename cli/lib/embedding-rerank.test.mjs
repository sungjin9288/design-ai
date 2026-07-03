// Tests for deterministic cosine rerank (order, tie-break, missing-vector placement).

import { test } from "node:test";
import assert from "node:assert/strict";

import { cosineRerank, cosineSimilarity } from "./embedding-rerank.mjs";

test("cosineSimilarity is 1 for identical vectors, 0 for orthogonal, and safe for zero vectors", () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(cosineSimilarity([0, 0], [1, 1]), 0);
  assert.equal(cosineSimilarity([1, 2], [1, 2, 3]), 0); // dimension mismatch -> 0, not throw
  assert.equal(cosineSimilarity([], []), 0);
});

test("cosineRerank orders scored candidates by similarity desc", () => {
  const vectorsById = new Map([
    ["a", [1, 0]],
    ["b", [0.9, 0.1]],
    ["c", [0, 1]],
  ]);
  const candidates = [{ id: "c" }, { id: "b" }, { id: "a" }]; // deliberately out of score order
  const result = cosineRerank({ queryVector: [1, 0], candidates, vectorsById });
  assert.deepEqual(result.map((r) => r.id), ["a", "b", "c"]);
  assert.ok(result[0].score > result[1].score);
  assert.ok(result[1].score > result[2].score);
});

test("cosineRerank ties break by id ascending", () => {
  const vectorsById = new Map([
    ["z", [1, 0]],
    ["a", [1, 0]],
    ["m", [1, 0]],
  ]);
  const candidates = [{ id: "z" }, { id: "a" }, { id: "m" }];
  const result = cosineRerank({ queryVector: [1, 0], candidates, vectorsById });
  assert.deepEqual(result.map((r) => r.id), ["a", "m", "z"]);
});

test("cosineRerank places candidates missing a vector after all scored candidates, preserving lexical order", () => {
  const vectorsById = new Map([["a", [1, 0]]]);
  const candidates = [{ id: "missing-1" }, { id: "a" }, { id: "missing-2" }];
  const result = cosineRerank({ queryVector: [1, 0], candidates, vectorsById });
  assert.deepEqual(result.map((r) => r.id), ["a", "missing-1", "missing-2"]);
});

test("cosineRerank respects limit after ordering", () => {
  const vectorsById = new Map([
    ["a", [1, 0]],
    ["b", [0.5, 0.5]],
    ["c", [0, 1]],
  ]);
  const candidates = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const result = cosineRerank({ queryVector: [1, 0], candidates, vectorsById, limit: 2 });
  assert.deepEqual(result.map((r) => r.id), ["a", "b"]);
});

test("cosineRerank rounds scores to 6 decimals deterministically", () => {
  const vectorsById = new Map([["a", [1, 1, 1]]]);
  const result = cosineRerank({ queryVector: [1, 0, 0], candidates: [{ id: "a" }], vectorsById });
  assert.equal(result[0].score, Number(result[0].score.toFixed(6)));
});
