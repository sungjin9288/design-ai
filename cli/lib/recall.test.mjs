// Tests for cli/lib/recall.mjs corpus knowledge recall.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { buildLearnRecall, buildRecallContext, parseRecallLimit } from "./recall.mjs";

// A small deterministic corpus with distinct lexical signals per file so ranking is
// predictable. Korean content is included to exercise the Hangul bigram tokenizer.
function makeCorpusFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-recall-"));
  const files = {
    "knowledge/button-component.md":
      "# Button component API\n\nButton anatomy, variants, states, and keyboard accessibility for the Button component.",
    "knowledge/color-tokens.md":
      "# Color tokens\n\nSemantic color roles, contrast ratios, and light and dark palette tokens.",
    "knowledge/korean-forms.md":
      "# 한국어 회원가입 폼\n\n한국 핀테크 회원가입 폼의 접근성과 레이아웃 컨벤션을 정리합니다.",
    "docs/overview.md":
      "# Overview\n\nGeneral overview of the design corpus and its structure.",
  };

  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), text);
  }

  return root;
}

test("parseRecallLimit accepts 1-20 and rejects out-of-range", () => {
  assert.equal(parseRecallLimit("5"), 5);
  assert.equal(parseRecallLimit("1"), 1);
  assert.equal(parseRecallLimit("20"), 20);
  assert.throws(() => parseRecallLimit("0"), /--recall-limit expects an integer from 1 to 20/);
  assert.throws(() => parseRecallLimit("21"), /--recall-limit expects an integer from 1 to 20/);
  assert.throws(() => parseRecallLimit("abc"), /--recall-limit expects an integer from 1 to 20/);
  assert.throws(() => parseRecallLimit("2.5"), /--recall-limit expects an integer from 1 to 20/);
});

test("buildRecallContext ranks corpus files for a brief", () => {
  const root = makeCorpusFixture();
  const context = buildRecallContext({
    brief: "Button component keyboard accessibility",
    recallLimit: 5,
    designAiPath: root,
  });

  assert.equal(context.mode, "lexical");
  assert.equal(context.query, "Button component keyboard accessibility");
  assert.equal(context.candidateCount, 4);
  assert.ok(context.selectedCount >= 1);
  // Highest-scoring file for a Button brief is the Button knowledge file.
  assert.equal(context.selected[0].id, "knowledge/button-component.md");
  assert.ok(context.selected[0].score > 0);
  assert.ok(context.selected[0].matchedTokens.includes("button"));
  assert.match(context.markdown, /## Recalled design knowledge/);
  assert.match(context.markdown, /knowledge\/button-component\.md/);
  assert.match(context.markdown, /Button component API/);
});

test("buildRecallContext orders results deterministically by score desc, id asc", () => {
  const root = makeCorpusFixture();
  const first = buildRecallContext({ brief: "design corpus tokens accessibility", designAiPath: root });
  const second = buildRecallContext({ brief: "design corpus tokens accessibility", designAiPath: root });

  assert.deepEqual(
    first.selected.map((item) => item.id),
    second.selected.map((item) => item.id),
  );

  // Scores are non-increasing; ties break by ascending id.
  for (let i = 1; i < first.selected.length; i += 1) {
    const prev = first.selected[i - 1];
    const curr = first.selected[i];
    assert.ok(
      prev.score > curr.score || (prev.score === curr.score && prev.id < curr.id),
      `expected ${prev.id} (${prev.score}) to rank before ${curr.id} (${curr.score})`,
    );
  }
});

test("buildRecallContext honors recallLimit", () => {
  const root = makeCorpusFixture();
  const context = buildRecallContext({
    brief: "design corpus overview tokens accessibility button",
    recallLimit: 2,
    designAiPath: root,
  });

  assert.ok(context.selectedCount <= 2);
  assert.ok(context.selected.length <= 2);
});

test("buildRecallContext returns no hits for an empty brief", () => {
  const root = makeCorpusFixture();
  const context = buildRecallContext({ brief: "   ", designAiPath: root });

  assert.equal(context.query, "");
  assert.equal(context.selectedCount, 0);
  assert.deepEqual(context.selected, []);
  assert.equal(context.candidateCount, 4);
  assert.match(context.markdown, /No corpus knowledge files matched this brief\./);
});

test("buildRecallContext returns no hits when nothing matches the brief", () => {
  const root = makeCorpusFixture();
  const context = buildRecallContext({ brief: "zzzznonexistentquux", designAiPath: root });

  assert.equal(context.selectedCount, 0);
  assert.deepEqual(context.selected, []);
  assert.match(context.markdown, /No corpus knowledge files matched this brief\./);
});

test("buildRecallContext bounds each rendered file block", () => {
  const root = makeCorpusFixture();
  const context = buildRecallContext({ brief: "Button component keyboard accessibility", designAiPath: root });

  // Each per-file block starts with "- <relPath>"; every block stays under ~400 chars
  // plus the closing ellipsis when truncated.
  const blocks = context.markdown.split("\n- ").slice(1);
  for (const block of blocks) {
    assert.ok(block.length <= 404, `recall block exceeded cap: ${block.length}`);
  }
});

test("buildRecallContext recalls Korean docs for a Korean brief via Hangul bigrams", () => {
  const root = makeCorpusFixture();
  const context = buildRecallContext({
    brief: "한국 핀테크 회원가입 폼 접근성",
    recallLimit: 5,
    designAiPath: root,
  });

  assert.ok(context.selectedCount >= 1);
  assert.equal(context.selected[0].id, "knowledge/korean-forms.md");
  assert.match(context.markdown, /한국어 회원가입 폼/);
});

// A learning profile fixture with distinct lexical signals per entry.
function makeLearningFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-learn-recall-"));
  const filePath = path.join(root, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-01T00:00:00.000Z",
    entries: [
      {
        id: "learn-korean-1",
        category: "korean",
        text: "Korean payment flows should use Toss-style dense receipts and honorific copy.",
        source: "test",
        createdAt: "2026-06-01T00:00:01.000Z",
      },
      {
        id: "learn-a11y-1",
        category: "accessibility",
        text: "Buttons need visible focus and WCAG AA contrast for keyboard accessibility.",
        source: "test",
        createdAt: "2026-06-01T00:00:02.000Z",
      },
      {
        id: "learn-brand-1",
        category: "brand",
        text: "Use the corporate teal palette for primary brand color.",
        source: "test",
        createdAt: "2026-06-01T00:00:03.000Z",
      },
    ],
  }), "utf8");
  return filePath;
}

test("buildLearnRecall combines ranked corpus and learning lists for a query", () => {
  const designAiPath = makeCorpusFixture();
  const learningFilePath = makeLearningFixture();
  const recall = buildLearnRecall({
    query: "Button keyboard accessibility",
    designAiPath,
    learningFilePath,
    limit: 5,
  });

  assert.equal(recall.query, "Button keyboard accessibility");
  // Corpus side ranks the Button knowledge file first.
  assert.equal(recall.corpus.candidateCount, 4);
  assert.ok(recall.corpus.selectedCount >= 1);
  assert.equal(recall.corpus.selected[0].id, "knowledge/button-component.md");
  assert.ok(recall.corpus.selected[0].score > 0);
  assert.ok(recall.corpus.selected[0].matchedTokens.includes("button"));
  // Learning side ranks the accessibility entry first.
  assert.equal(recall.learning.mode, "brief-relevance");
  assert.equal(recall.learning.candidateCount, 3);
  assert.ok(recall.learning.selectedCount >= 1);
  assert.equal(recall.learning.selected[0].id, "learn-a11y-1");
  assert.equal(recall.learning.selected[0].category, "accessibility");
  assert.ok(recall.learning.selected[0].score > 0);
  assert.ok(recall.learning.selected[0].matchedTokens.includes("accessibility"));
  assert.match(recall.learning.selected[0].text, /keyboard accessibility/);
});

test("buildLearnRecall is deterministic across runs", () => {
  const designAiPath = makeCorpusFixture();
  const learningFilePath = makeLearningFixture();
  const first = buildLearnRecall({ query: "korean payment accessibility", designAiPath, learningFilePath });
  const second = buildLearnRecall({ query: "korean payment accessibility", designAiPath, learningFilePath });
  assert.deepEqual(first, second);
});

test("buildLearnRecall returns empty corpus and learning lists for an empty query", () => {
  const designAiPath = makeCorpusFixture();
  const learningFilePath = makeLearningFixture();
  const recall = buildLearnRecall({ query: "   ", designAiPath, learningFilePath });

  assert.equal(recall.query, "");
  assert.equal(recall.corpus.selectedCount, 0);
  assert.deepEqual(recall.corpus.selected, []);
  assert.equal(recall.corpus.candidateCount, 4);
  assert.equal(recall.learning.selectedCount, 0);
  assert.deepEqual(recall.learning.selected, []);
  assert.equal(recall.learning.candidateCount, 3);
});

test("buildLearnRecall category scopes only the learning list", () => {
  const designAiPath = makeCorpusFixture();
  const learningFilePath = makeLearningFixture();
  const recall = buildLearnRecall({
    query: "korean payment accessibility",
    category: "accessibility",
    designAiPath,
    learningFilePath,
  });

  // Learning is scoped to accessibility only.
  assert.equal(recall.learning.candidateCount, 1);
  for (const item of recall.learning.selected) {
    assert.equal(item.category, "accessibility");
  }
  // Corpus is unaffected by the category filter.
  assert.equal(recall.corpus.candidateCount, 4);
  assert.ok(recall.corpus.selectedCount >= 1);
});

test("buildLearnRecall honors limit on both corpus and learning lists", () => {
  const designAiPath = makeCorpusFixture();
  const learningFilePath = makeLearningFixture();
  const recall = buildLearnRecall({
    query: "korean payment accessibility color button overview",
    limit: 1,
    designAiPath,
    learningFilePath,
  });

  assert.ok(recall.corpus.selectedCount <= 1);
  assert.ok(recall.learning.selectedCount <= 1);
});

test("buildLearnRecall recalls Korean learning entries for a Korean query", () => {
  const designAiPath = makeCorpusFixture();
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-learn-recall-ko-"));
  const learningFilePath = path.join(root, "learning.json");
  writeFileSync(learningFilePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-01T00:00:00.000Z",
    entries: [
      {
        id: "learn-korean-hangul",
        category: "korean",
        text: "한국 핀테크 회원가입 폼은 조밀한 레이아웃과 존댓말 카피를 사용한다.",
        source: "test",
        createdAt: "2026-06-01T00:00:01.000Z",
      },
      {
        id: "learn-en-only",
        category: "brand",
        text: "Use the corporate teal palette for primary brand color.",
        source: "test",
        createdAt: "2026-06-01T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const recall = buildLearnRecall({
    query: "한국 회원가입 폼",
    designAiPath,
    learningFilePath,
  });

  assert.ok(recall.learning.selectedCount >= 1);
  assert.equal(recall.learning.selected[0].id, "learn-korean-hangul");
});
