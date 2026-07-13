import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ARTIFACT_MODES,
  artifactModeDefinition,
  buildArtifact,
  parseArtifactArgs,
} from "./artifact.mjs";
import { DESIGN_AI_HOME, SYMLINK_PREFIX } from "./paths.mjs";

const BRIEF = "Refactor a Korean fintech account settings flow with responsive and accessibility verification";

test("artifact modes are explicit and stable", () => {
  assert.deepEqual(ARTIFACT_MODES, [
    "implementation-plan",
    "critique-loop",
    "design-contract",
  ]);
  assert.equal(artifactModeDefinition("design-contract").outputFile, "DESIGN.md");
  assert.throws(() => artifactModeDefinition("unknown"), /Unknown artifact mode/);
});

test("parseArtifactArgs separates the mode, brief, route, and output options", () => {
  assert.deepEqual(
    parseArtifactArgs([
      "implementation-plan",
      "Improve",
      "settings",
      "--route",
      "flow-design",
      "--json",
      "--out",
      "plan.json",
    ]),
    {
      mode: "implementation-plan",
      briefParts: ["Improve", "settings"],
      fromFile: "",
      stdin: false,
      routeId: "flow-design",
      json: true,
      outPath: "plan.json",
      force: false,
      help: false,
    },
  );
});

test("buildArtifact returns the same portable contract for every mode", () => {
  for (const mode of ARTIFACT_MODES) {
    const artifact = buildArtifact({
      mode,
      brief: BRIEF,
      sourceRoot: DESIGN_AI_HOME,
      prefix: SYMLINK_PREFIX,
      routeId: "flow-design",
    });

    assert.deepEqual(Object.keys(artifact), [
      "kind",
      "schemaVersion",
      "mode",
      "title",
      "brief",
      "route",
      "outputFile",
      "sourceFiles",
      "workflow",
      "outputSections",
      "approval",
      "verification",
      "markdown",
    ]);
    assert.equal(artifact.kind, "design-ai-artifact");
    assert.equal(artifact.schemaVersion, 1);
    assert.equal(artifact.mode, mode);
    assert.equal(artifact.route.id, "flow-design");
    assert.equal(artifact.workflow.length, 4);
    assert.ok(artifact.sourceFiles.includes("knowledge/PRINCIPLES.md"));
    assert.equal(artifact.approval.status, "pending-human-approval");
    assert.equal(
      artifact.verification.command,
      `design-ai check ${artifact.outputFile} --route flow-design --strict`,
    );
    assert.match(artifact.markdown, /## Artifact contract/);
    assert.match(artifact.markdown, /## Source of truth/);
    assert.match(artifact.markdown, /## Approval boundary/);
    assert.match(artifact.markdown, /## Verification/);
  }
});

test("design-contract emits an agent-readable DESIGN.md structure", () => {
  const artifact = buildArtifact({
    mode: "design-contract",
    brief: BRIEF,
    sourceRoot: DESIGN_AI_HOME,
    prefix: SYMLINK_PREFIX,
    routeId: "design-from-brief",
  });

  assert.equal(artifact.outputFile, "DESIGN.md");
  assert.equal(
    artifact.verification.command,
    "design-ai check DESIGN.md --route design-from-brief --strict",
  );
  assert.ok(artifact.outputSections.includes("Brand principles and artifact modes"));
  assert.ok(artifact.outputSections.includes("Accessibility and responsive behavior"));
  assert.match(artifact.markdown, /target-repo edits and external writes require explicit approval/);
});
