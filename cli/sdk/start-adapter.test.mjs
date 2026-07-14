import assert from "node:assert/strict";
import { test } from "node:test";

import { runStart } from "../commands/start.mjs";
import { captureStdout } from "../lib/learn-test-support.mjs";
import { start } from "./start-adapter.mjs";

const BRIEF = "Review the Korean account settings interaction quality";

test("start validates typed context options", () => {
  assert.throws(() => start(""), /brief must be a non-empty string/);
  assert.throws(() => start(BRIEF, []), /start options must be a plain object/);
  assert.throws(() => start(BRIEF, { screenshots: "screen.png" }), /screenshots must be an array/);
  assert.throws(() => start(BRIEF, { viewports: [3] }), /viewports\[0\] must be a non-empty string/);
  assert.throws(() => start(BRIEF, { localPath: "relative/path" }), /localPath must be an absolute path/);
});

test("start matches the CLI JSON contract", async () => {
  const cliOutput = await captureStdout(() => runStart([
    BRIEF,
    "--route",
    "design-engineering-review",
    "--url",
    "https://example.com/settings",
    "--screenshot",
    "/tmp/settings.png",
    "--locale",
    "ko-KR",
    "--viewport",
    "mobile",
    "--json",
  ]));
  const sdkOutput = start(BRIEF, {
    routeId: "design-engineering-review",
    url: "https://example.com/settings",
    screenshots: ["/tmp/settings.png"],
    locale: "ko-KR",
    viewports: ["mobile"],
  });

  assert.deepEqual(sdkOutput, JSON.parse(cliOutput));
});
