// Tests for cli/lib/dispatch.mjs command suggestion helpers.

import { test } from "node:test";
import assert from "node:assert/strict";

import { HELP_ALIASES, HELP_TOPICS } from "../commands/help.mjs";
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

test("canonical command list matches the help catalog topics", () => {
  assert.deepEqual(CANONICAL_COMMANDS, HELP_TOPICS);
});

test("help catalog aliases dispatch to their canonical commands", async () => {
  for (const [alias, command] of Object.entries(HELP_ALIASES)) {
    assert.equal(CANONICAL_COMMANDS.includes(command), true, `${command} should be canonical`);
    assert.equal(CANONICAL_COMMANDS.includes(alias), false, `${alias} should stay an alias`);

    const aliasOutput = await captureStdout(() => runCommand(alias, ["--help"]));
    const canonicalOutput = await captureStdout(() => runCommand(command, ["--help"]));
    assert.equal(aliasOutput, canonicalOutput, `${alias} should dispatch to ${command}`);
  }
});

test("top-level flag aliases dispatch to version and help", async () => {
  const versionOutput = await captureStdout(() => runCommand("version", []));
  assert.equal(await captureStdout(() => runCommand("--version", [])), versionOutput);
  assert.equal(await captureStdout(() => runCommand("-v", [])), versionOutput);

  const helpOutput = await captureStdout(() => runCommand("help", []));
  assert.equal(await captureStdout(() => runCommand("--help", [])), helpOutput);
  assert.equal(await captureStdout(() => runCommand("-h", [])), helpOutput);
});

test("routes shorthand dispatches to route catalog listing", async () => {
  const routeListOutput = await captureStdout(() => runCommand("route", ["--list"]));
  assert.equal(await captureStdout(() => runCommand("routes", [])), routeListOutput);

  const routeListJsonOutput = await captureStdout(() => runCommand("route", ["--list", "--json"]));
  assert.equal(await captureStdout(() => runCommand("routes", ["--json"])), routeListJsonOutput);
});

test("routes alias help uses routes-specific usage", async () => {
  const output = await captureStdout(() => runCommand("routes", ["--help"]));

  assert.match(output, /Usage:\s+design-ai routes \[--json\]/);
  assert.match(output, /Equivalent to: design-ai route --list/);
  assert.doesNotMatch(output, /Usage:\s+design-ai route <brief>/);
});
