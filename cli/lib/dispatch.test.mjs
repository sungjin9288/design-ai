// Tests for cli/lib/dispatch.mjs command suggestion helpers.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CANONICAL_COMMANDS,
  suggestCommand,
} from "./dispatch.mjs";

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
