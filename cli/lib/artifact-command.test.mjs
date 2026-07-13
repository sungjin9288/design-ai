import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { runArtifact } from "../commands/artifact.mjs";
import { captureStdout } from "./learn-test-support.mjs";

const BRIEF = "Plan a responsive settings page refactor";

test("runArtifact emits the machine-readable contract", async () => {
  const output = await captureStdout(() => runArtifact([
    "implementation-plan",
    BRIEF,
    "--route",
    "flow-design",
    "--json",
  ]));
  const artifact = JSON.parse(output);

  assert.equal(artifact.mode, "implementation-plan");
  assert.equal(artifact.route.id, "flow-design");
  assert.equal(artifact.outputFile, "implementation-plan.md");
});

test("runArtifact writes only the requested local output file", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "design-ai-artifact-"));
  const outputPath = path.join(directory, "DESIGN.md");
  try {
    await captureStdout(() => runArtifact([
      "design-contract",
      BRIEF,
      "--route",
      "design-from-brief",
      "--out",
      outputPath,
    ]));
    const content = readFileSync(outputPath, "utf8");
    assert.match(content, /# Agent-readable design contract/);
    assert.match(content, /## Approval boundary/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
