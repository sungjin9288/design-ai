// Tests for cli/commands/help.mjs top-level command discovery output.

import { test } from "node:test";
import assert from "node:assert/strict";

import { HELP_ALIASES, HELP_TOPICS, runHelp } from "../commands/help.mjs";

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

test("runHelp lists advanced options supported by command parsers", async () => {
  const output = await captureStdout(() => runHelp([]));

  assert.match(output, /Usage:\s+design-ai <command> \[args\]/);
  assert.match(output, /design-ai help \[command\|--json\]/);
  assert.match(output, /search <query> \[--dir kind\] \[--limit N\] \[--json\]/);
  assert.match(output, /show <file\[:line\]> \[--lines N:M\] \[--context N\] \[--json\]/);
  assert.match(output, /route <brief\|--from-file file\|--stdin\|--list> \[--limit N\]/);
  assert.match(output, /prompt <brief\|--from-file file\|--stdin> \[--route id\] \[--out file\]/);
  assert.match(output, /pack <brief\|--from-file file\|--stdin> \[--route id\] \[--max-bytes N\]/);
  assert.match(output, /check <artifact\.md\|--stdin\|--examples> \[--route id\|--all-routes\]/);
  assert.match(output, /examples \[query\] \[--route id\] \[--limit N\] \[--json\]/);
});

test("runHelp emits a machine-readable help topic catalog", async () => {
  const output = await captureStdout(() => runHelp(["--json"]));
  const catalog = JSON.parse(output);

  assert.equal(catalog.usage, "design-ai help [command|--json]");
  assert.deepEqual(catalog.topics.map((topic) => topic.topic), HELP_TOPICS);
  assert.deepEqual(catalog.aliases, HELP_ALIASES);
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "route").usage,
    "design-ai route <brief|--from-file file|--stdin|--list> [--limit N]",
  );
  assert.deepEqual(catalog.topics.find((topic) => topic.topic === "search").aliases, ["find"]);
});

test("runHelp delegates command topics to command-specific help", async () => {
  const routeOutput = await captureStdout(() => runHelp(["route"]));
  assert.match(routeOutput, /Usage:\s+design-ai route <brief>/);
  assert.match(routeOutput, /design-ai route --list \[--json\]/);
  assert.match(routeOutput, /design-ai route --from-file brief\.md \[--limit N\] \[--explain\] \[--json\]/);
  assert.match(routeOutput, /cat brief\.md \| design-ai route --stdin \[--limit N\] \[--explain\] \[--json\]/);
  assert.doesNotMatch(routeOutput, /Environment overrides:/);

  const promptOutput = await captureStdout(() => runHelp(["prompt"]));
  assert.match(promptOutput, /design-ai prompt <brief> \[--route id\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(promptOutput, /cat brief\.md \| design-ai prompt --stdin \[--route id\] \[--json\]/);

  const packOutput = await captureStdout(() => runHelp(["pack"]));
  assert.match(packOutput, /design-ai pack <brief> \[--route id\] \[--max-bytes N\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(packOutput, /cat brief\.md \| design-ai pack --stdin \[--route id\] \[--max-bytes N\] \[--json\]/);

  const installOutput = await captureStdout(() => runHelp(["install"]));
  assert.match(installOutput, /Usage:\s+design-ai install/);
  assert.match(installOutput, /Symlinks design-ai skills/);
});

test("runHelp exposes usage output for every supported help topic", async () => {
  for (const topic of HELP_TOPICS) {
    const output = await captureStdout(() => runHelp([topic]));
    assert.match(output, /Usage:\s+design-ai/, `expected usage output for help topic ${topic}`);
    assert.doesNotMatch(output, /Unknown help topic/, `expected known help topic ${topic}`);
  }
});

test("runHelp supports aliases and suggestions for help topics", async () => {
  const aliasOutput = await captureStdout(() => runHelp(["find"]));
  assert.match(aliasOutput, /Usage:\s+design-ai search <query>/);

  await assert.rejects(
    () => runHelp(["serach"]),
    /Did you mean `design-ai help search`\?/,
  );
});
