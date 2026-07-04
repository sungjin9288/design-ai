// Tests for cli/sdk/learn-adapter.mjs — the Phase B local-write namespace.
// Each verb writes only DESIGN_AI_LEARNING_FILE; tests point that env var at a
// fresh temp file per test and clean up after. Ids/timestamps are
// non-deterministic and are never asserted exactly.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { learn } from "./learn-adapter.mjs";
import { withLearningEnv } from "../lib/learn-test-support.mjs";

function withTempLearningFile(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-sdk-learn-test-"));
  const learningFile = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  try {
    return withLearningEnv({ learningFile, usageFile }, () => fn({ dir, learningFile, usageFile }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function readProfile(learningFile) {
  return JSON.parse(readFileSync(learningFile, "utf8"));
}

// ── learn is frozen ─────────────────────────────────────────────────────────

test("learn namespace is frozen", () => {
  assert.equal(Object.isFrozen(learn), true);
  assert.deepEqual(Object.keys(learn).sort(), ["captureFromCheck", "feedback", "remember"]);
});

// ── learn.remember ───────────────────────────────────────────────────────────

test("learn.remember persists an entry with source 'sdk'", () => {
  return withTempLearningFile(({ learningFile }) => {
    const result = learn.remember("Use 8px spacing grid for cards.");
    assert.equal(result.entry.source, "sdk");
    assert.equal(result.entry.text, "Use 8px spacing grid for cards.");
    assert.equal(result.entry.category, "preference");
    assert.ok(existsSync(learningFile));

    const onDisk = readProfile(learningFile);
    assert.equal(onDisk.entries.length, 1);
    assert.equal(onDisk.entries[0].id, result.entry.id);
    assert.equal(result.profile.entries.length, 1);
  });
});

test("learn.remember accepts a category option", () => {
  return withTempLearningFile(({ learningFile }) => {
    const result = learn.remember("Prefer Pretendard for Korean UI.", { category: "korean" });
    assert.equal(result.entry.category, "korean");
    const onDisk = readProfile(learningFile);
    assert.equal(onDisk.entries[0].category, "korean");
  });
});

test("learn.remember throws on empty/non-string text", () => {
  return withTempLearningFile(() => {
    assert.throws(() => learn.remember(""), /text must be a non-empty string/);
    assert.throws(() => learn.remember("   "), /text must be a non-empty string/);
    assert.throws(() => learn.remember(42), /text must be a non-empty string/);
  });
});

test("learn.remember throws on a non-object opts bag", () => {
  return withTempLearningFile(() => {
    assert.throws(() => learn.remember("text", 5), /learn\.remember options must be a plain object/);
  });
});

test("learn.remember throws when category is not a string", () => {
  return withTempLearningFile(() => {
    assert.throws(() => learn.remember("text", { category: 5 }), /category must be a string/);
  });
});

// ── learn.feedback ───────────────────────────────────────────────────────────

test("learn.feedback persists an entry mapping outcome into the stored text/source", () => {
  return withTempLearningFile(({ learningFile }) => {
    const result = learn.feedback("Dense tables on mobile.", { outcome: "avoid" });
    assert.match(result.entry.text, /Avoid in future outputs: Dense tables on mobile\./);
    assert.equal(result.entry.source, "feedback:avoid");

    const onDisk = readProfile(learningFile);
    assert.equal(onDisk.entries.length, 1);
    assert.equal(onDisk.entries[0].source, "feedback:avoid");
  });
});

test("learn.feedback defaults outcome to 'improve' and category to 'workflow'", () => {
  return withTempLearningFile(() => {
    const result = learn.feedback("Use consistent button sizing.");
    assert.equal(result.entry.source, "feedback:improve");
    assert.equal(result.entry.category, "workflow");
    assert.match(result.entry.text, /Improve future outputs by: Use consistent button sizing\./);
  });
});

test("learn.feedback accepts 'keep' outcome", () => {
  return withTempLearningFile(() => {
    const result = learn.feedback("The onboarding flow copy.", { outcome: "keep" });
    assert.equal(result.entry.source, "feedback:keep");
    assert.match(result.entry.text, /Repeat in future outputs: The onboarding flow copy\./);
  });
});

test("learn.feedback throws on empty/non-string text", () => {
  return withTempLearningFile(() => {
    assert.throws(() => learn.feedback(""), /text must be a non-empty string/);
    assert.throws(() => learn.feedback(null), /text must be a non-empty string/);
  });
});

test("learn.feedback throws when outcome is not a string", () => {
  return withTempLearningFile(() => {
    assert.throws(() => learn.feedback("text", { outcome: 5 }), /outcome must be a string/);
  });
});

// ── learn.captureFromCheck ───────────────────────────────────────────────────

const THIN_ARTIFACT = [
  "# Title",
  "",
  "This artifact is intentionally missing accessibility and responsive notes",
  "so that check() reports warnings/failures worth capturing as learning entries.",
].join("\n");

test("learn.captureFromCheck writes the non-pass check results and returns added/skipped", () => {
  return withTempLearningFile(({ learningFile }) => {
    const result = learn.captureFromCheck(THIN_ARTIFACT);
    assert.equal(result.dryRun, false);
    assert.equal(result.applied, true);
    assert.equal(result.source, "check:artifact");
    assert.ok(result.addedCount > 0, "expected at least one captured entry");
    assert.equal(result.entries.length, result.addedCount);
    assert.deepEqual(result.skipped, []);
    assert.ok(existsSync(learningFile));

    const onDisk = readProfile(learningFile);
    assert.equal(onDisk.entries.length, result.addedCount);
  });
});

test("learn.captureFromCheck with a routeId tags the capture source and validates the route id", () => {
  return withTempLearningFile(() => {
    const result = learn.captureFromCheck(THIN_ARTIFACT, { routeId: "component-spec" });
    assert.equal(result.source, "check:component-spec");
    assert.throws(
      () => learn.captureFromCheck(THIN_ARTIFACT, { routeId: "not-a-real-route" }),
      /route/i,
    );
  });
});

test("learn.captureFromCheck skips duplicate capture on a second call", () => {
  return withTempLearningFile(({ learningFile }) => {
    const first = learn.captureFromCheck(THIN_ARTIFACT);
    assert.ok(first.addedCount > 0);

    const second = learn.captureFromCheck(THIN_ARTIFACT);
    assert.equal(second.addedCount, 0, "second identical capture should add nothing new");
    assert.equal(second.skippedCount, first.addedCount, "second identical capture should skip everything as duplicate");
    for (const skipped of second.skipped) {
      assert.equal(skipped.reason, "duplicate-entry-text");
    }

    const onDisk = readProfile(learningFile);
    assert.equal(onDisk.entries.length, first.addedCount, "no duplicate entries should be persisted");
  });
});

test("learn.captureFromCheck throws on empty/non-string artifact", () => {
  return withTempLearningFile(() => {
    assert.throws(() => learn.captureFromCheck(""), /artifact must be a non-empty string/);
    assert.throws(() => learn.captureFromCheck(undefined), /artifact must be a non-empty string/);
  });
});

test("learn.captureFromCheck throws on a non-object opts bag", () => {
  return withTempLearningFile(() => {
    assert.throws(
      () => learn.captureFromCheck(THIN_ARTIFACT, 5),
      /learn\.captureFromCheck options must be a plain object/,
    );
  });
});
