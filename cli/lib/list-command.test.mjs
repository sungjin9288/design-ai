// Tests for cli/commands/list.mjs catalog domain helpers.

import { test } from "node:test";
import assert from "node:assert/strict";

import { LIST_KINDS, runList } from "../commands/list.mjs";
import { expectedValueMessage } from "./suggest.mjs";

test("LIST_KINDS keeps supported catalog domains explicit", () => {
  assert.deepEqual(LIST_KINDS, ["skills", "commands", "agents"]);
});

test("list domain suggestion points close typos to supported domains", () => {
  assert.match(
    expectedValueMessage("domain", "skillz", LIST_KINDS),
    /Did you mean `skills`\?/,
  );
});

test("runList rejects unknown domains before loading the manifest", async () => {
  await assert.rejects(
    () => runList(["skillz"]),
    /Did you mean `skills`\?/,
  );
});
