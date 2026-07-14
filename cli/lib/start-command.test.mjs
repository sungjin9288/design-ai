import assert from "node:assert/strict";
import { test } from "node:test";

import { runStart } from "../commands/start.mjs";
import { captureStdout } from "./learn-test-support.mjs";

test("runStart emits the canonical machine-readable payload", async () => {
  const output = await captureStdout(() => runStart([
    "Review",
    "the",
    "settings",
    "flow",
    "--route",
    "design-engineering-review",
    "--url",
    "https://example.com/settings",
    "--locale",
    "ko-KR",
    "--viewport",
    "mobile",
    "--json",
  ]));
  const payload = JSON.parse(output);

  assert.equal(payload.kind, "design-ai-start");
  assert.equal(payload.route.id, "design-engineering-review");
  assert.equal(payload.designContract.route.id, payload.route.id);
  assert.equal(payload.review.executed, false);
  assert.deepEqual(payload.effects.performed.externalActions, []);
});
