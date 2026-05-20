// Tests for cli/commands/update.mjs option parsing.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseUpdateArgs } from "../commands/update.mjs";

test("parseUpdateArgs supports help output", () => {
  assert.deepEqual(parseUpdateArgs(["--help"]), {
    help: true,
  });
  assert.deepEqual(parseUpdateArgs(["-h"]), {
    help: true,
  });
  assert.deepEqual(parseUpdateArgs([]), {
    help: false,
  });
});

test("parseUpdateArgs rejects unknown options before git or install work", () => {
  assert.throws(
    () => parseUpdateArgs(["--hlep"]),
    /Did you mean `--help`\?/,
  );
  assert.throws(
    () => parseUpdateArgs(["unexpected"]),
    /Usage: design-ai update/,
  );
});
