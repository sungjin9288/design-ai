// Tests for cli/commands/help.mjs top-level command discovery output.

import { test } from "node:test";
import assert from "node:assert/strict";

import { runHelp } from "../commands/help.mjs";

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

  assert.match(output, /search <query> \[--dir kind\] \[--limit N\] \[--json\]/);
  assert.match(output, /show <file\[:line\]> \[--lines N:M\] \[--context N\] \[--json\]/);
  assert.match(output, /route <brief\|--from-file file\|--stdin\|--list>/);
  assert.match(output, /prompt <brief\|--from-file file\|--stdin> \[--route id\] \[--out file\]/);
  assert.match(output, /pack <brief\|--from-file file\|--stdin> \[--route id\] \[--max-bytes N\]/);
  assert.match(output, /check <artifact\.md\|--stdin\|--examples> \[--route id\|--all-routes\]/);
  assert.match(output, /examples \[query\] \[--route id\] \[--limit N\] \[--json\]/);
});
