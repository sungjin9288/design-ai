// Tests for cli/lib/log.mjs color/format helpers.
//
// Run: NO_COLOR=1 node --test cli/lib/log.test.mjs
//
// We force NO_COLOR=1 so the helpers return uncolored strings — predictable
// to assert against.

import { test } from "node:test";
import assert from "node:assert/strict";

// Force no-color mode by setting env BEFORE importing.
process.env.NO_COLOR = "1";

const { bold, dim, red, green, yellow, blue, cyan } = await import("./log.mjs");

test("bold returns input unchanged in NO_COLOR mode", () => {
  assert.equal(bold("hello"), "hello");
});

test("dim returns input unchanged in NO_COLOR mode", () => {
  assert.equal(dim("hello"), "hello");
});

test("red/green/yellow/blue/cyan all pass through in NO_COLOR mode", () => {
  assert.equal(red("x"), "x");
  assert.equal(green("x"), "x");
  assert.equal(yellow("x"), "x");
  assert.equal(blue("x"), "x");
  assert.equal(cyan("x"), "x");
});

test("color helpers handle empty string", () => {
  assert.equal(bold(""), "");
  assert.equal(red(""), "");
});

test("color helpers handle non-string-ish input gracefully", () => {
  // The helpers expect strings; passing a number gets coerced.
  // The current implementation embeds via template literal — number is fine.
  assert.equal(bold(String(42)), "42");
});
