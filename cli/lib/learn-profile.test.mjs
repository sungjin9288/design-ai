// Tests for learning profile mutations (remember/feedback/init/forget/clear).

import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  clearLearning,
  forgetLearning,
  initializeLearningProfile,
  loadLearningProfile,
  recordLearningFeedback,
  rememberLearning,
} from "./learn.mjs";
import { withTempDir } from "./learn-test-support.mjs";

test("rememberLearning persists a local profile entry", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const result = rememberLearning({
    text: "Prefer dense Korean product UI",
    category: "korean",
    filePath,
    now: new Date("2026-05-22T00:00:00.000Z"),
  });

  assert.equal(result.entry.category, "korean");
  assert.equal(result.entry.text, "Prefer dense Korean product UI");
  assert.match(result.entry.id, /^learn-[a-f0-9]{10}$/);

  const profile = loadLearningProfile(filePath);
  assert.equal(profile.entries.length, 1);
  assert.equal(profile.entries[0].id, result.entry.id);
  assert.equal(JSON.parse(readFileSync(filePath, "utf8")).version, 1);
}));

test("recordLearningFeedback converts outcome feedback into a learning entry", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const result = recordLearningFeedback({
    text: "Keep audit findings short and evidence-led",
    outcome: "keep",
    filePath,
    now: new Date("2026-05-22T00:00:00.000Z"),
  });

  assert.equal(result.entry.category, "workflow");
  assert.equal(result.entry.source, "feedback:keep");
  assert.equal(result.entry.text, "Repeat in future outputs: Keep audit findings short and evidence-led");

  const avoidResult = recordLearningFeedback({
    text: "decorative marketing language in enterprise dashboards",
    outcome: "avoid",
    category: "brand",
    filePath,
    now: new Date("2026-05-22T00:00:01.000Z"),
  });
  assert.equal(avoidResult.entry.category, "brand");
  assert.equal(avoidResult.entry.source, "feedback:avoid");
  assert.equal(avoidResult.entry.text, "Avoid in future outputs: decorative marketing language in enterprise dashboards");
  assert.equal(loadLearningProfile(filePath).entries.length, 2);
}));

test("initializeLearningProfile previews, applies, and skips duplicate starter entries", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const now = new Date("2026-05-22T00:00:00.000Z");
  const preview = initializeLearningProfile({ filePath, dryRun: true, now });

  assert.equal(preview.dryRun, true);
  assert.equal(preview.applied, false);
  assert.equal(preview.source, "init:local-dogfood");
  assert.equal(preview.candidateCount, 6);
  assert.equal(preview.addedCount, 6);
  assert.equal(preview.skippedCount, 0);
  assert.equal(preview.count, 6);
  assert.equal(preview.entries[0].category, "preference");
  assert.equal(preview.entries[0].source, "init:local-dogfood");
  assert.equal(loadLearningProfile(filePath).entries.length, 0);

  const applied = initializeLearningProfile({ filePath, dryRun: false, now });
  assert.equal(applied.applied, true);
  assert.equal(applied.addedCount, 6);
  assert.equal(loadLearningProfile(filePath).entries.length, 6);

  const duplicate = initializeLearningProfile({
    filePath,
    dryRun: false,
    now: new Date("2026-05-22T00:01:00.000Z"),
  });
  assert.equal(duplicate.addedCount, 0);
  assert.equal(duplicate.skippedCount, 6);
  assert.equal(duplicate.count, 6);
  assert.equal(duplicate.skipped[0].reason, "duplicate-entry-text");
  assert.equal(loadLearningProfile(filePath).entries.length, 6);
}));

test("forgetLearning removes entries by id or list number", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const first = rememberLearning({
    text: "Prefer compact Korean dashboards",
    category: "korean",
    filePath,
    now: new Date("2026-05-22T00:00:00.000Z"),
  });
  const second = rememberLearning({
    text: "Use restrained enterprise language",
    category: "brand",
    filePath,
    now: new Date("2026-05-22T00:00:01.000Z"),
  });

  const byId = forgetLearning({
    target: first.entry.id,
    filePath,
    now: new Date("2026-05-22T00:01:00.000Z"),
  });
  assert.equal(byId.removed.id, first.entry.id);
  assert.equal(byId.count, 1);

  const byNumber = forgetLearning({
    target: "1",
    filePath,
    now: new Date("2026-05-22T00:02:00.000Z"),
  });
  assert.equal(byNumber.removed.id, second.entry.id);
  assert.equal(byNumber.count, 0);

  assert.throws(
    () => forgetLearning({ target: "learn-missing", filePath }),
    /Learning entry not found: learn-missing/,
  );
}));

test("clearLearning removes all local entries", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  rememberLearning({
    text: "Prefer dense Korean product UI",
    category: "korean",
    filePath,
    now: new Date("2026-05-22T00:00:00.000Z"),
  });
  rememberLearning({
    text: "Always include accessibility notes",
    category: "accessibility",
    filePath,
    now: new Date("2026-05-22T00:00:01.000Z"),
  });

  const result = clearLearning({
    filePath,
    now: new Date("2026-05-22T00:03:00.000Z"),
  });

  assert.equal(result.removedCount, 2);
  assert.deepEqual(loadLearningProfile(filePath).entries, []);
}));
