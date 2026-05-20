// Tests for cli/commands/audit.mjs argument handling.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseAuditArgs } from "../commands/audit.mjs";

test("parseAuditArgs supports strict quiet and json runner options", () => {
  assert.deepEqual(parseAuditArgs(["--strict", "--quiet", "--json"]), {
    help: false,
    strict: true,
    quiet: true,
    json: true,
    runnerArgs: ["--strict", "--quiet", "--json"],
  });
});

test("parseAuditArgs supports help without forwarding runner args", () => {
  assert.deepEqual(parseAuditArgs(["--help"]), {
    help: true,
    strict: false,
    quiet: false,
    json: false,
    runnerArgs: [],
  });
});

test("parseAuditArgs rejects unknown options with suggestions", () => {
  assert.throws(
    () => parseAuditArgs(["--jsn"]),
    /Did you mean `--json`\?/,
  );
  assert.throws(
    () => parseAuditArgs(["unexpected"]),
    /Usage: design-ai audit \[--strict\] \[--quiet\] \[--json\]/,
  );
});
