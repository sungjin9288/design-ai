// Tests for the runLearn --recall read-only combined recall CLI flow.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runLearn } from "../commands/learn.mjs";
import { captureStdout, withTempDirAsync } from "./learn-test-support.mjs";

function writeLearningFixture(dir) {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-01T00:00:00.000Z",
    entries: [
      {
        id: "learn-korean-payment",
        category: "korean",
        text: "Korean payment flows should use dense receipts and honorific copy.",
        source: "test",
        createdAt: "2026-06-01T00:00:01.000Z",
      },
      {
        id: "learn-a11y",
        category: "accessibility",
        text: "Buttons need visible focus and WCAG AA contrast for keyboard accessibility.",
        source: "test",
        createdAt: "2026-06-01T00:00:02.000Z",
      },
    ],
  }), "utf8");
  return filePath;
}

test("runLearn --recall emits combined corpus and learning JSON without mutating the profile", () => withTempDirAsync(async (dir) => {
  const filePath = writeLearningFixture(dir);
  const before = readFileSync(filePath, "utf8");

  const jsonOutput = await captureStdout(() => runLearn([
    "--recall",
    "korean",
    "payment",
    "--file",
    filePath,
    "--json",
  ]));
  const payload = JSON.parse(jsonOutput);

  assert.equal(payload.query, "korean payment");
  assert.ok(payload.corpus.candidateCount > 0);
  assert.ok(payload.corpus.selectedCount >= 1);
  assert.ok(payload.corpus.selected[0].score > 0);
  assert.ok(Array.isArray(payload.corpus.selected[0].matchedTokens));
  assert.equal(payload.learning.mode, "brief-relevance");
  assert.equal(payload.learning.candidateCount, 2);
  assert.equal(payload.learning.selected[0].id, "learn-korean-payment");
  assert.equal(payload.learning.selected[0].category, "korean");
  assert.ok(payload.learning.selected[0].score > 0);

  // Read-only: profile file unchanged.
  assert.equal(readFileSync(filePath, "utf8"), before);
}));

test("runLearn --recall human output shows corpus and learning sections", () => withTempDirAsync(async (dir) => {
  const filePath = writeLearningFixture(dir);
  const before = readFileSync(filePath, "utf8");

  const humanOutput = await captureStdout(() => runLearn([
    "--recall",
    "korean payment",
    "--file",
    filePath,
  ]));

  assert.match(humanOutput, /Recall \(read-only\)/);
  assert.match(humanOutput, /Query: korean payment/);
  assert.match(humanOutput, /Corpus:/);
  assert.match(humanOutput, /Learning:/);
  assert.match(humanOutput, /learn-korean-payment \[korean\]/);
  assert.match(humanOutput, /Privacy: recall is read-only/);
  assert.equal(readFileSync(filePath, "utf8"), before);
}));

test("runLearn --recall --category scopes only the learning list", () => withTempDirAsync(async (dir) => {
  const filePath = writeLearningFixture(dir);

  const jsonOutput = await captureStdout(() => runLearn([
    "--recall",
    "korean payment accessibility",
    "--category",
    "accessibility",
    "--file",
    filePath,
    "--json",
  ]));
  const payload = JSON.parse(jsonOutput);

  assert.equal(payload.learning.candidateCount, 1);
  for (const item of payload.learning.selected) {
    assert.equal(item.category, "accessibility");
  }
  assert.ok(payload.corpus.candidateCount > 1);
}));

test("runLearn --recall with an empty query exits 1 without output", () => withTempDirAsync(async (dir) => {
  const filePath = writeLearningFixture(dir);
  await assert.rejects(
    () => runLearn(["--recall", "--file", filePath]),
    /learn --recall requires a query/,
  );
}));
