// Tests for cli/sdk/recall-adapter.mjs — option defaults, determinism, input
// validation, and parity with `design-ai learn --recall --json`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { recall } from "./recall-adapter.mjs";
import { runLearn } from "../commands/learn.mjs";
import { captureStdout, withLearningEnv } from "../lib/learn-test-support.mjs";

const QUERY = "keyboard accessibility button";

test("recall rejects non-string or empty queries", () => {
  assert.throws(() => recall(42), /query must be a non-empty string/);
  assert.throws(() => recall(""), /query must be a non-empty string/);
});

test("recall rejects a non-object opts bag", () => {
  assert.throws(() => recall(QUERY, 5), /recall options must be a plain object/);
});

test("recall validates limit and category types", () => {
  assert.throws(() => recall(QUERY, { limit: 0 }), /limit must be an integer from 1 to 20/);
  assert.throws(() => recall(QUERY, { limit: 21 }), /limit must be an integer from 1 to 20/);
  assert.throws(() => recall(QUERY, { category: 5 }), /category must be a string/);
});

test("recall defaults limit to 5 and category to empty", () => {
  const withDefaults = recall(QUERY);
  const explicit = recall(QUERY, { limit: 5, category: "" });
  assert.deepEqual(withDefaults, explicit);
});

test("recall is read-only: never creates the learning profile file", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-sdk-recall-test-"));
  const learningFile = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  try {
    return withLearningEnv({ learningFile, usageFile }, () => {
      recall(QUERY, { limit: 3 });
      assert.ok(!existsSync(learningFile), "recall must not create the learning profile");
      assert.ok(!existsSync(usageFile), "recall must not create the usage sidecar");
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("recall is deterministic: same input produces the same output", () => {
  const first = recall(QUERY, { limit: 3 });
  const second = recall(QUERY, { limit: 3 });
  assert.deepEqual(first, second);
});

test("recall matches the CLI learn --recall --json output for a fixed query", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-sdk-recall-parity-"));
  const learningFile = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  try {
    await withLearningEnv({ learningFile, usageFile }, async () => {
      const cliOutput = await captureStdout(() => runLearn(["--recall", QUERY, "--limit", "3", "--json"]));
      const cliPayload = JSON.parse(cliOutput);
      const sdkResult = recall(QUERY, { limit: 3 });
      assert.deepEqual(sdkResult.corpus, cliPayload.corpus);
      assert.deepEqual(sdkResult.learning, cliPayload.learning);
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
