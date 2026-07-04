// Tests for cli/sdk/version-adapter.mjs — return shape, determinism, and
// parity with `design-ai version --json`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { version } from "./version-adapter.mjs";
import { runVersion } from "../commands/version.mjs";
import { captureStdout } from "../lib/learn-test-support.mjs";

test("version takes no arguments and returns { cli, corpus } strings", () => {
  const result = version();
  assert.deepEqual(Object.keys(result).sort(), ["cli", "corpus"]);
  assert.equal(typeof result.cli, "string");
  assert.equal(typeof result.corpus, "string");
});

test("version is deterministic: same input produces the same output", () => {
  assert.deepEqual(version(), version());
});

test("version matches the CLI --json output for the shipped package", async () => {
  const cliOutput = await captureStdout(() => runVersion(["--json"]));
  const cliPayload = JSON.parse(cliOutput);
  const sdkResult = version();
  assert.deepEqual(sdkResult, {
    cli: cliPayload.versions.cli,
    corpus: cliPayload.versions.plugin,
  });
});
