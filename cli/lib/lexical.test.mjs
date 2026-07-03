// Tests for the shared deterministic lexical (BM25-style) scorer.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildLexicalStats,
  bm25Score,
  lexicalQueryTokens,
  lexicalTokens,
  rankLexical,
} from "./lexical.mjs";

const DOCS = [
  { id: "b.md", text: "Button color tokens. Button states hover focus disabled." },
  { id: "a.md", text: "Color palette and color contrast for accessible color tokens." },
  { id: "c.md", text: "한국어 결제 카카오페이 토스 결제 흐름" },
  { id: "d.md", text: "" },
];

test("lexicalTokens lowercases, keeps Unicode letters/numbers, and drops 1-char tokens", () => {
  assert.deepEqual(lexicalTokens("Button, COLOR! a 한국어 b2"), ["button", "color", "한국어", "b2"]);
  assert.deepEqual(lexicalTokens(""), []);
  assert.deepEqual(lexicalTokens(null), []);
});

test("lexicalQueryTokens dedupes and sorts for deterministic scoring order", () => {
  assert.deepEqual(lexicalQueryTokens("color Button color"), ["button", "color"]);
});

test("buildLexicalStats produces sorted, deterministic document and term structures", () => {
  const stats = buildLexicalStats(DOCS);
  assert.equal(stats.documentCount, 4);
  assert.deepEqual(stats.documents.map((doc) => doc.id), ["a.md", "b.md", "c.md", "d.md"]);
  assert.deepEqual(Object.keys(stats.docFrequency), [...Object.keys(stats.docFrequency)].sort());
  assert.equal(stats.docFrequency.color, 2);
  assert.equal(stats.documents[1].terms.button, 2);
  const again = buildLexicalStats([...DOCS].reverse());
  assert.deepEqual(again, stats);
});

test("bm25Score rewards term frequency and rarity, skips zero-length docs", () => {
  const stats = buildLexicalStats(DOCS);
  const a = stats.documents.find((doc) => doc.id === "a.md");
  const b = stats.documents.find((doc) => doc.id === "b.md");
  const d = stats.documents.find((doc) => doc.id === "d.md");
  const query = lexicalQueryTokens("color");
  assert.ok(bm25Score(query, a, stats).score > bm25Score(query, b, stats).score);
  assert.deepEqual(bm25Score(query, d, stats), { score: 0, matchedTokens: [] });
  assert.deepEqual(bm25Score(lexicalQueryTokens("button"), b, stats).matchedTokens, ["button"]);
});

test("rankLexical is fully ordered with stable id tiebreak and excludes zero scores", () => {
  const stats = buildLexicalStats(DOCS);
  const hits = rankLexical("color tokens", stats, { limit: 10 });
  assert.deepEqual(hits.map((hit) => hit.id), ["a.md", "b.md"]);
  assert.ok(hits[0].score > hits[1].score);
  assert.deepEqual(hits[0].matchedTokens, ["color", "tokens"]);

  const tie = buildLexicalStats([
    { id: "z.md", text: "grid layout" },
    { id: "y.md", text: "grid layout" },
  ]);
  assert.deepEqual(rankLexical("grid", tie).map((hit) => hit.id), ["y.md", "z.md"]);

  assert.deepEqual(rankLexical("grid", stats), []);
  assert.deepEqual(rankLexical("", stats), []);
});

test("rankLexical ranks Korean queries against Korean documents", () => {
  const stats = buildLexicalStats(DOCS);
  const hits = rankLexical("카카오페이 결제", stats);
  assert.deepEqual(hits.map((hit) => hit.id), ["c.md"]);
  assert.deepEqual(hits[0].matchedTokens, ["결제", "카카오페이"]);
});
