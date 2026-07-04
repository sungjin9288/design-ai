// Tests for cli/sdk/prompt-adapter.mjs — option defaults, determinism, input
// validation, Phase A read-only guarantee, and parity with `design-ai prompt --json`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { prompt } from "./prompt-adapter.mjs";
import { runPrompt } from "../commands/prompt.mjs";
import { captureStdout, withLearningEnv } from "../lib/learn-test-support.mjs";

const BRIEF = "Spec a Button component API with variants, props, and keyboard accessibility";

test("prompt rejects non-string or empty briefs", () => {
  assert.throws(() => prompt(42), /brief must be a non-empty string/);
  assert.throws(() => prompt(""), /brief must be a non-empty string/);
});

test("prompt rejects a non-object opts bag", () => {
  assert.throws(() => prompt(BRIEF, 5), /prompt options must be a plain object/);
});

test("prompt validates option types and bounds", () => {
  assert.throws(() => prompt(BRIEF, { routeId: 5 }), /routeId must be a string/);
  assert.throws(() => prompt(BRIEF, { withLearning: "yes" }), /withLearning must be a boolean/);
  assert.throws(() => prompt(BRIEF, { learningLimit: 101 }), /learningLimit must be an integer from 1 to 100/);
  assert.throws(() => prompt(BRIEF, { learningLimit: -1 }), /learningLimit must be an integer from 1 to 100/);
  assert.throws(() => prompt(BRIEF, { recallLimit: 21 }), /recallLimit must be an integer from 1 to 20/);
});

test("prompt treats learningLimit: 0 and recallLimit: 0 as unset (library defaults apply)", () => {
  assert.doesNotThrow(() => prompt(BRIEF, { learningLimit: 0, recallLimit: 0 }));
});

test("prompt defaults produce the same result as explicit defaults", () => {
  const withDefaults = prompt(BRIEF);
  const explicit = prompt(BRIEF, {
    routeId: "",
    withLearning: false,
    learningCategory: "",
    learningLimit: 0,
    withRecall: false,
    recallLimit: 0,
  });
  assert.deepEqual(withDefaults, explicit);
});

test("prompt never includes learningUsage, even with withLearning: true (Phase A read-only)", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-sdk-prompt-test-"));
  const learningFile = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  try {
    return withLearningEnv({ learningFile, usageFile }, () => {
      const result = prompt(BRIEF, { withLearning: true });
      assert.equal(Object.hasOwn(result, "learningUsage"), false);
      assert.ok(!existsSync(usageFile), "usage sidecar must not be written");
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("prompt is deterministic: same input produces the same output", () => {
  const first = prompt(BRIEF, { routeId: "component-spec" });
  const second = prompt(BRIEF, { routeId: "component-spec" });
  assert.deepEqual(first, second);
});

test("prompt matches the CLI --json output for a fixed brief (minus learningUsage which Phase A never writes)", async () => {
  const cliOutput = await captureStdout(() => runPrompt([BRIEF, "--route", "component-spec", "--json"]));
  const cliPayload = JSON.parse(cliOutput);
  const sdkResult = prompt(BRIEF, { routeId: "component-spec" });
  assert.deepEqual(sdkResult, cliPayload);
});
