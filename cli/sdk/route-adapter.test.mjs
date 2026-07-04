// Tests for cli/sdk/route-adapter.mjs — option defaults, determinism, input
// validation, and parity with `design-ai route --json`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { route, routes } from "./route-adapter.mjs";
import { runRoute } from "../commands/route.mjs";
import { captureStdout } from "../lib/learn-test-support.mjs";

const BRIEF = "Spec a Button component API with variants, props, and keyboard accessibility";

test("route rejects non-string or empty briefs", () => {
  assert.throws(() => route(123), /brief must be a non-empty string/);
  assert.throws(() => route(""), /brief must be a non-empty string/);
  assert.throws(() => route("   "), /brief must be a non-empty string/);
  assert.throws(() => route(null), /brief must be a non-empty string/);
});

test("route rejects a non-object opts bag", () => {
  assert.throws(() => route(BRIEF, "nope"), /route options must be a plain object/);
});

test("route defaults limit to 3 and explain to false", () => {
  const withDefaults = route(BRIEF);
  const explicit = route(BRIEF, { limit: 3, explain: false });
  assert.deepEqual(withDefaults, explicit);
  assert.ok(withDefaults.length <= 3);
  assert.equal(Object.hasOwn(withDefaults[0], "relatedKnowledge"), false);
});

test("route validates limit bounds", () => {
  assert.throws(() => route(BRIEF, { limit: 0 }), /limit must be an integer from 1 to 10/);
  assert.throws(() => route(BRIEF, { limit: 11 }), /limit must be an integer from 1 to 10/);
  assert.throws(() => route(BRIEF, { limit: 1.5 }), /limit must be an integer from 1 to 10/);
});

test("route explain: true includes relatedKnowledge", () => {
  const [result] = route(BRIEF, { limit: 1, explain: true });
  assert.ok(Array.isArray(result.relatedKnowledge));
});

test("route is deterministic: same input produces the same output", () => {
  const first = route(BRIEF, { limit: 2, explain: true });
  const second = route(BRIEF, { limit: 2, explain: true });
  assert.deepEqual(first, second);
});

test("route matches the CLI --json output for a fixed brief", async () => {
  const cliOutput = await captureStdout(() => runRoute([BRIEF, "--limit", "2", "--explain", "--json"]));
  const cliPayload = JSON.parse(cliOutput);
  const sdkResult = route(BRIEF, { limit: 2, explain: true });
  assert.deepEqual(sdkResult, cliPayload.routes);
});

test("routes lists the full catalog with a version", () => {
  const result = routes();
  assert.equal(typeof result.version, "string");
  assert.ok(result.routes.length > 0);
  assert.ok(result.routes.every((entry) => typeof entry.id === "string"));
});

test("routes matches the CLI route --list --json catalog", async () => {
  const cliOutput = await captureStdout(() => runRoute(["--list", "--json"]));
  const cliPayload = JSON.parse(cliOutput);
  const sdkResult = routes();
  assert.deepEqual(sdkResult, cliPayload);
});

test("routes takes no arguments and is deterministic", () => {
  assert.deepEqual(routes(), routes());
});
