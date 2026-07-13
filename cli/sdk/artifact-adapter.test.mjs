import assert from "node:assert/strict";
import { test } from "node:test";

import { runArtifact } from "../commands/artifact.mjs";
import { captureStdout } from "../lib/learn-test-support.mjs";
import { artifact } from "./artifact-adapter.mjs";

const BRIEF = "Create an agent-readable design contract for a Korean SaaS dashboard";

test("artifact validates its brief, options, mode, and route id", () => {
  assert.throws(() => artifact("", { mode: "design-contract" }), /brief must be a non-empty string/);
  assert.throws(() => artifact(BRIEF), /mode must be a non-empty string/);
  assert.throws(() => artifact(BRIEF, 3), /artifact options must be a plain object/);
  assert.throws(() => artifact(BRIEF, {}), /mode must be a non-empty string/);
  assert.throws(() => artifact(BRIEF, { mode: "unknown" }), /Unknown artifact mode/);
  assert.throws(() => artifact(BRIEF, { mode: "design-contract", routeId: 3 }), /routeId must be a string/);
});

test("artifact matches the CLI JSON contract", async () => {
  const cliOutput = await captureStdout(() => runArtifact([
    "design-contract",
    BRIEF,
    "--route",
    "design-from-brief",
    "--json",
  ]));
  const sdkOutput = artifact(BRIEF, {
    mode: "design-contract",
    routeId: "design-from-brief",
  });

  assert.deepEqual(sdkOutput, JSON.parse(cliOutput));
});
