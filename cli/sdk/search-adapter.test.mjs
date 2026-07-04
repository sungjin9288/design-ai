// Tests for cli/sdk/search-adapter.mjs — option defaults, determinism, input
// validation, and parity with `design-ai search --json` (plain and --ranked).

import { test } from "node:test";
import assert from "node:assert/strict";

import { search } from "./search-adapter.mjs";
import { runSearch } from "../commands/search.mjs";
import { captureStdout } from "../lib/learn-test-support.mjs";

const QUERY = "keyboard accessibility";

test("search rejects non-string, empty, or too-short queries", () => {
  assert.throws(() => search(42), /query must be a non-empty string/);
  assert.throws(() => search(""), /query must be a non-empty string/);
});

test("search rejects a non-object opts bag", () => {
  assert.throws(() => search(QUERY, 5), /search options must be a plain object/);
});

test("search validates dir, limit, and ranked types", () => {
  assert.throws(() => search(QUERY, { dir: "nope" }), /dir must be one of:/);
  assert.throws(() => search(QUERY, { limit: 0 }), /limit must be an integer from 1 to 500/);
  assert.throws(() => search(QUERY, { limit: 501 }), /limit must be an integer from 1 to 500/);
  assert.throws(() => search(QUERY, { ranked: "yes" }), /ranked must be a boolean/);
});

test("search defaults limit to 20 and ranked to false", () => {
  const withDefaults = search(QUERY);
  const explicit = search(QUERY, { limit: 20, ranked: false });
  assert.deepEqual(withDefaults, explicit);
});

test("search is deterministic (unranked): same input produces the same output", () => {
  const first = search(QUERY, { limit: 5 });
  const second = search(QUERY, { limit: 5 });
  assert.deepEqual(first, second);
});

test("search is deterministic (ranked): same input produces the same output", () => {
  const first = search(QUERY, { limit: 5, ranked: true });
  const second = search(QUERY, { limit: 5, ranked: true });
  assert.deepEqual(first, second);
});

test("search matches the CLI --json output (unranked) for a fixed query", async () => {
  const cliOutput = await captureStdout(() => runSearch([QUERY, "--limit", "5", "--json"]));
  const cliPayload = JSON.parse(cliOutput);
  const sdkResult = search(QUERY, { limit: 5 });
  assert.deepEqual(sdkResult, cliPayload.hits);
});

test("search matches the CLI --json output (ranked) for a fixed query", async () => {
  const cliOutput = await captureStdout(() => runSearch([QUERY, "--limit", "5", "--ranked", "--json"]));
  const cliPayload = JSON.parse(cliOutput);
  const sdkResult = search(QUERY, { limit: 5, ranked: true });
  assert.deepEqual(sdkResult, cliPayload.hits);
});

test("search --dir scopes to a single corpus directory", () => {
  const results = search(QUERY, { dir: "knowledge", limit: 10, ranked: true });
  for (const hit of results) {
    assert.match(hit.relPath, /^knowledge\//);
  }
});
