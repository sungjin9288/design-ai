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

async function captureStderrAndExit(fn) {
  const lines = [];
  const originalError = console.error;
  const originalExit = process.exit;
  let exitCode;
  console.error = (...args) => {
    lines.push(args.join(" "));
  };
  process.exit = (code = 0) => {
    exitCode = code;
    throw new Error(`process.exit:${code}`);
  };
  try {
    await fn();
  } catch (err) {
    if (!String(err?.message || err).startsWith("process.exit:")) {
      throw err;
    }
  } finally {
    console.error = originalError;
    process.exit = originalExit;
  }
  return { stderr: lines.join("\n"), exitCode };
}

const FUNCTIONAL_ALIAS_TARGETS = {
  ls: "list",
  find: "search",
  cat: "show",
  recommend: "route",
  example: "examples",
  ex: "examples",
  lint: "check",
  ws: "workspace",
};

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

test("unknown commands print canonical suggestions and exit with code 1", async () => {
  const { stderr, exitCode } = await captureStderrAndExit(() => runCommand("docter", []));

  assert.equal(exitCode, 1);
  assert.match(stderr, /Unknown command: docter/);
  assert.match(stderr, /Did you mean `design-ai doctor`\?/);
  assert.match(stderr, /Run `design-ai help` for usage\./);
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

test("functional command aliases dispatch to canonical command behavior", async () => {
  const cases = [
    {
      alias: "ls",
      command: "list",
      args: ["skills"],
      expected: [/design-ai catalog/, /skills \(21\)/],
    },
    {
      alias: "find",
      command: "search",
      args: ["Pretendard", "--dir", "knowledge", "--limit", "1", "--json"],
      expected: [/"query": "Pretendard"/, /"relPath": "knowledge\/PRINCIPLES\.md"/],
    },
    {
      alias: "cat",
      command: "show",
      args: ["knowledge/PRINCIPLES.md:1", "--context", "0", "--json"],
      expected: [/"relPath": "knowledge\/PRINCIPLES\.md"/, /"start": 1/],
    },
    {
      alias: "recommend",
      command: "route",
      args: ["Spec a Button component API with keyboard accessibility", "--limit", "1", "--json"],
      expected: [/"brief": "Spec a Button component API with keyboard accessibility"/, /"id": "component-spec"/],
    },
    {
      alias: "example",
      command: "examples",
      args: ["--route", "component-spec", "--limit", "1", "--json"],
      expected: [/"routeId": "component-spec"/, /"relPath": "examples\/component-button\.md"/],
    },
    {
      alias: "ex",
      command: "examples",
      args: ["--route", "component-spec", "--limit", "1"],
      expected: [/design-ai examples/, /examples\/component-button\.md/],
    },
    {
      alias: "lint",
      command: "check",
      args: ["--examples", "--route", "component-spec", "--limit", "1", "--strict", "--json"],
      expected: [/"routeId": "component-spec"/, /"status": "pass"/],
    },
    {
      alias: "ws",
      command: "workspace",
      args: ["--json"],
      expected: [/"git": \{/, /"learning": \{/],
    },
  ];

  assert.equal(
    new Set(cases.map((item) => item.alias)).size,
    cases.length,
    "functional alias test cases should not contain duplicate aliases",
  );
  assert.deepEqual(
    Object.fromEntries(cases.map((item) => [item.alias, item.command])),
    FUNCTIONAL_ALIAS_TARGETS,
  );

  for (const item of cases) {
    assert.equal(HELP_ALIASES[item.alias], item.command, `${item.alias} should map to ${item.command}`);

    const aliasOutput = await captureStdout(() => runCommand(item.alias, item.args));
    const canonicalOutput = await captureStdout(() => runCommand(item.command, item.args));

    assert.equal(aliasOutput, canonicalOutput, `${item.alias} should match ${item.command} output`);
    for (const pattern of item.expected) {
      assert.match(aliasOutput, pattern, `${item.alias} should include ${pattern}`);
    }
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
