// Tests for cli/lib/recall.mjs corpus knowledge recall.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { buildRecallContext, parseRecallLimit } from "./recall.mjs";

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
