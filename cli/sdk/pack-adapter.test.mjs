// Tests for cli/sdk/pack-adapter.mjs — option defaults, determinism, input
// validation, Phase A read-only guarantee, and parity with `design-ai pack --json`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { pack } from "./pack-adapter.mjs";
import { runPack } from "../commands/pack.mjs";
import { captureStdout, withLearningEnv } from "../lib/learn-test-support.mjs";

const BRIEF = "Spec a Button component API with variants, props, and keyboard accessibility";

test("pack rejects non-string or empty briefs", () => {
  assert.throws(() => pack(42), /brief must be a non-empty string/);
  assert.throws(() => pack(""), /brief must be a non-empty string/);
});

test("pack rejects a non-object opts bag", () => {
  assert.throws(() => pack(BRIEF, 5), /pack options must be a plain object/);
});

test("pack validates option types and bounds", () => {
  assert.throws(() => pack(BRIEF, { maxBytes: 10 }), /maxBytes must be an integer from 1000 to 1000000/);
  assert.throws(() => pack(BRIEF, { maxBytes: 2_000_000 }), /maxBytes must be an integer from 1000 to 1000000/);
  assert.throws(() => pack(BRIEF, { withRecall: 1 }), /withRecall must be a boolean/);
});

test("pack defaults maxBytes to 120000", () => {
  const withDefaults = pack(BRIEF);
  const explicit = pack(BRIEF, { maxBytes: 120000 });
  assert.deepEqual(withDefaults, explicit);
  assert.equal(withDefaults.maxBytes, 120000);
});

test("pack never includes learningUsage, even with withLearning: true (Phase A read-only)", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-sdk-pack-test-"));
  const learningFile = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  try {
    return withLearningEnv({ learningFile, usageFile }, () => {
      const result = pack(BRIEF, { withLearning: true });
      assert.equal(Object.hasOwn(result, "learningUsage"), false);
      assert.equal(Object.hasOwn(result.plan, "learningUsage"), false);
      assert.ok(!existsSync(usageFile), "usage sidecar must not be written");
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("pack is deterministic: same input produces the same output", () => {
  const first = pack(BRIEF, { routeId: "component-spec", maxBytes: 50000 });
  const second = pack(BRIEF, { routeId: "component-spec", maxBytes: 50000 });
  assert.deepEqual(first, second);
});

test("pack matches the CLI --json output for a fixed brief", async () => {
  const cliOutput = await captureStdout(() => runPack([BRIEF, "--route", "component-spec", "--max-bytes", "50000", "--json"]));
  const cliPayload = JSON.parse(cliOutput);
  const sdkResult = pack(BRIEF, { routeId: "component-spec", maxBytes: 50000 });
  assert.deepEqual(sdkResult, cliPayload);
});
