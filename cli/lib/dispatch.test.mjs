// Tests for cli/lib/dispatch.mjs command suggestion helpers.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CANONICAL_COMMANDS,
  runCommand,
  suggestCommand,
} from "./dispatch.mjs";

async function captureStdout(fn) {
  const lines = [];
  const originalLog = console.log;
  console.log = (...args) => {
    lines.push(args.join(" "));
  };
  try {
    await fn();
  } finally {
    console.log = originalLog;
  }
  return lines.join("\n");
}

test("suggestCommand suggests close canonical command names", () => {
  assert.equal(suggestCommand("docter"), "doctor");
  assert.equal(suggestCommand("serach"), "search");
  assert.equal(suggestCommand("routess"), "routes");
  assert.equal(suggestCommand("stats"), "status");
});

test("suggestCommand ignores aliases and distant input", () => {
  assert.equal(CANONICAL_COMMANDS.includes("diag"), false);
  assert.equal(suggestCommand("diag"), "");
  assert.equal(suggestCommand("xx"), "");
  assert.equal(suggestCommand("completely-unknown"), "");
});

test("routes alias help uses routes-specific usage", async () => {
  const output = await captureStdout(() => runCommand("routes", ["--help"]));

  assert.match(output, /Usage:\s+design-ai routes \[--json\]/);
  assert.match(output, /Equivalent to: design-ai route --list/);
  assert.doesNotMatch(output, /Usage:\s+design-ai route <brief>/);
});
