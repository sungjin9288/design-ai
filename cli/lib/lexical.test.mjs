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

test("lexicalTokens lowercases, keeps Unicode letters/numbers, drops 1-char tokens, and bigrams Hangul", () => {
  // 한국어 -> keep + bigrams 한국, 국어; b2/button/color unchanged (no Hangul run).
  assert.deepEqual(lexicalTokens("Button, COLOR! a 한국어 b2"), [
    "button",
    "color",
    "한국어",
    "한국",
    "국어",
    "b2",
  ]);
  assert.deepEqual(lexicalTokens(""), []);
  assert.deepEqual(lexicalTokens(null), []);
});

test("lexicalTokens keeps a 2-char Hangul run as-is (its only bigram is itself)", () => {
  assert.deepEqual(lexicalTokens("버튼"), ["버튼"]);
});

test("lexicalTokens expands agglutinative surface forms so stem and particle share bigrams", () => {
  // 버튼을 shares the 버튼 bigram with the bare stem query; 접근성이 shares 접근성.
  assert.deepEqual(lexicalTokens("버튼을"), ["버튼을", "버튼", "튼을"]);
  assert.deepEqual(lexicalTokens("접근성이"), ["접근성이", "접근", "근성", "성이"]);
});

test("lexicalQueryTokens dedupes and sorts for deterministic scoring order", () => {
  assert.deepEqual(lexicalQueryTokens("color Button color"), ["button", "color"]);
  // 버튼 is a 2-char run -> its bigram is itself, so the query token set is just {버튼}.
  assert.deepEqual(lexicalQueryTokens("버튼"), ["버튼"]);
  // 버튼을 dedupes to sorted {버튼, 버튼을, 튼을}.
  assert.deepEqual(lexicalQueryTokens("버튼을"), ["버튼", "버튼을", "튼을"]);
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
  // Bigrams are part of the deterministic token contract now:
  // 결제 -> {결제}; 카카오페이 -> {카카오페이, 카카, 카오, 오페, 페이}; all sorted.
  assert.deepEqual(hits[0].matchedTokens, [
    "결제",
    "오페",
    "카오",
    "카카",
    "카카오페이",
    "페이",
  ]);
});

test("Hangul bigrams let a bare stem query match a particle-attached document", () => {
  // Corpus doc only contains 버튼을 (never bare 버튼), yet the 버튼 query must hit it.
  const stats = buildLexicalStats([
    { id: "btn.md", text: "버튼을 눌러 저장하세요" },
    { id: "misc.md", text: "색상 토큰 정의" },
  ]);
  const hits = rankLexical("버튼", stats);
  assert.deepEqual(hits.map((hit) => hit.id), ["btn.md"]);
  assert.deepEqual(hits[0].matchedTokens, ["버튼"]);
});

test("Hangul bigrams let a particle-attached query match the bare stem document", () => {
  // Corpus doc only contains bare 접근성, yet the 접근성이 query must hit it.
  const stats = buildLexicalStats([
    { id: "a11y.md", text: "접근성 기준 대비 명도" },
    { id: "misc.md", text: "색상 토큰 정의" },
  ]);
  const hits = rankLexical("접근성이", stats);
  assert.deepEqual(hits.map((hit) => hit.id), ["a11y.md"]);
  // Query 접근성이 -> {접근성이, 접근, 근성, 성이}; doc 접근성 has 접근성, 접근, 근성.
  assert.deepEqual(hits[0].matchedTokens, ["근성", "접근"]);
});

test("Hangul tokenization is deterministic across input order", () => {
  const stats = buildLexicalStats(DOCS);
  const again = buildLexicalStats([...DOCS].reverse());
  assert.deepEqual(again, stats);
  assert.deepEqual(rankLexical("접근성이", stats), rankLexical("접근성이", again));
});
