// SDK contract test: pins the read-only function verbs, plus the `learn`
// namespace object (Phase B) and its 3 write verbs. This is the semver
// anchor described in docs/AGENT-SDK.md — if names or top-level keys drift,
// this test must fail.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import * as sdk from "./index.mjs";
import { withLearningEnv } from "../lib/learn-test-support.mjs";
import { readCapabilityManifest } from "../lib/capability-manifest.mjs";

const CAPABILITY_MANIFEST = readCapabilityManifest();
const EXPECTED_FUNCTION_EXPORT_NAMES = CAPABILITY_MANIFEST.sdk.exports
  .filter((name) => name !== "learn")
  .sort();
const EXPECTED_LEARN_VERB_NAMES = [...CAPABILITY_MANIFEST.sdk.learnMethods].sort();

const BRIEF = "Spec a Button component API with variants, props, and keyboard accessibility";

test("SDK exports exactly the manifest-declared read-only function verbs", () => {
  const exportedNames = Object.keys(sdk).sort();
  assert.deepEqual(exportedNames, [...EXPECTED_FUNCTION_EXPORT_NAMES, "learn"].sort());
  for (const name of EXPECTED_FUNCTION_EXPORT_NAMES) {
    assert.equal(typeof sdk[name], "function", `${name} must be a function`);
  }
});

test("SDK exports a frozen `learn` namespace with exactly the 3 Phase B write verbs", () => {
  assert.equal(typeof sdk.learn, "object");
  assert.ok(sdk.learn !== null);
  assert.equal(Object.isFrozen(sdk.learn), true);
  assert.deepEqual(Object.keys(sdk.learn).sort(), EXPECTED_LEARN_VERB_NAMES);
  for (const name of EXPECTED_LEARN_VERB_NAMES) {
    assert.equal(typeof sdk.learn[name], "function", `learn.${name} must be a function`);
  }
});

test("learn.remember() return-shape keys are pinned", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-sdk-learn-contract-"));
  const learningFile = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  try {
    return withLearningEnv({ learningFile, usageFile }, () => {
      const result = sdk.learn.remember("Prefer 8px spacing grid for cards.");
      assert.deepEqual(Object.keys(result).sort(), ["entry", "file", "profile"].sort());
      assert.deepEqual(Object.keys(result.entry).sort(), [
        "category",
        "createdAt",
        "id",
        "source",
        "text",
      ].sort());
      assert.deepEqual(Object.keys(result.profile).sort(), ["entries", "updatedAt", "version"].sort());
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("learn.feedback() return-shape keys are pinned", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-sdk-learn-contract-"));
  const learningFile = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  try {
    return withLearningEnv({ learningFile, usageFile }, () => {
      const result = sdk.learn.feedback("Avoid dense tables on mobile.", { outcome: "avoid" });
      assert.deepEqual(Object.keys(result).sort(), ["entry", "file", "profile"].sort());
      assert.deepEqual(Object.keys(result.entry).sort(), [
        "category",
        "createdAt",
        "id",
        "source",
        "text",
      ].sort());
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("learn.captureFromCheck() return-shape keys are pinned", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-sdk-learn-contract-"));
  const learningFile = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  const artifact = [
    "# Title",
    "",
    "Short artifact without accessibility or responsive notes.",
  ].join("\n");
  try {
    return withLearningEnv({ learningFile, usageFile }, () => {
      const result = sdk.learn.captureFromCheck(artifact);
      assert.deepEqual(Object.keys(result).sort(), [
        "addedCount",
        "applied",
        "candidateCount",
        "count",
        "dryRun",
        "entries",
        "file",
        "skipped",
        "skippedCount",
        "source",
      ].sort());
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("route() return-shape keys are pinned", () => {
  const [result] = sdk.route(BRIEF, { limit: 1 });
  assert.deepEqual(Object.keys(result).sort(), [
    "agents",
    "command",
    "confidence",
    "explanation",
    "id",
    "keywords",
    "knowledge",
    "label",
    "matchedKeywords",
    "score",
    "skills",
  ].sort());
});

test("routes() return-shape keys are pinned", () => {
  const result = sdk.routes();
  assert.deepEqual(Object.keys(result).sort(), ["routes", "version"].sort());
});

test("prompt() return-shape keys are pinned (Phase A: no learningUsage)", () => {
  const result = sdk.prompt(BRIEF);
  assert.deepEqual(Object.keys(result).sort(), [
    "brief",
    "checklist",
    "filesToRead",
    "prompt",
    "qualityCommand",
    "referenceExamples",
    "route",
    "slashCommand",
    "version",
  ].sort());
  assert.equal(Object.hasOwn(result, "learningUsage"), false);
});

test("artifact() return-shape keys and read-only boundary are pinned", () => {
  const result = sdk.artifact(BRIEF, {
    mode: "implementation-plan",
    routeId: "component-spec",
  });
  assert.deepEqual(Object.keys(result), [
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
  assert.equal(result.approval.status, "pending-human-approval");
});

test("start() return-shape keys and read-only boundary are pinned", () => {
  const result = sdk.start(BRIEF, {
    routeId: "component-spec",
    locale: "en-US",
    viewports: ["mobile", "desktop"],
  });
  assert.deepEqual(Object.keys(result), [
    "kind",
    "schemaVersion",
    "brief",
    "context",
    "route",
    "designContract",
    "review",
    "pathway",
    "effects",
  ]);
  assert.equal(result.kind, "design-ai-start");
  assert.equal(result.designContract.route.id, result.route.id);
  assert.equal(result.review.executed, false);
  assert.deepEqual(result.effects.performed.localWrites, []);
  assert.deepEqual(result.effects.performed.targetRepoMutations, []);
  assert.deepEqual(result.effects.performed.externalActions, []);
});

test("inspectHtml() return-shape keys and evidence boundary are pinned", () => {
  const result = sdk.inspectHtml(
    `<html lang="en"><head><meta name="viewport" content="width=device-width"></head><body><button>Save</button></body></html>`,
    { sourceRef: "settings.html", brief: "Review settings" },
  );
  assert.deepEqual(Object.keys(result), [
    "kind",
    "schemaVersion",
    "generatedAt",
    "subject",
    "context",
    "boundary",
    "sources",
    "lenses",
    "findings",
    "summary",
    "approval",
  ]);
  assert.equal(result.kind, "design-ai-quality-report");
  assert.equal(result.summary.confirmedFindings, 0);
  assert.equal(result.summary.unverifiedFindings, 1);
  assert.equal(result.boundary.targetRepoMutation, false);
});

test("reviewHtml() return-shape keys and linked read-only boundary are pinned", () => {
  const result = sdk.reviewHtml(
    "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>",
    {
      sourceRef: "settings.html",
      brief: "Review Korean settings",
      locale: "ko-KR",
      viewports: ["mobile", "desktop"],
      generatedAt: "2026-07-15T00:00:00.000Z",
    },
  );

  assert.deepEqual(Object.keys(result), [
    "kind",
    "schemaVersion",
    "status",
    "source",
    "plan",
    "report",
    "linkage",
    "stages",
    "nextAction",
    "boundary",
  ]);
  assert.equal(result.linkage.status, "pass");
  assert.equal(result.boundary.mode, "read-only");
  assert.equal(result.boundary.localWrites, false);
  assert.equal(result.boundary.targetRepoMutation, false);
  assert.equal(result.boundary.externalWrites, false);
});

test("reviewHandoff() return-shape keeps transfer, validation, and writes pending", () => {
  const workflow = sdk.reviewHtml(
    "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>",
    {
      sourceRef: "settings.html",
      brief: "Review Korean settings",
      locale: "ko-KR",
      viewports: ["mobile"],
      generatedAt: "2026-07-15T00:00:00.000Z",
    },
  );
  const result = sdk.reviewHandoff(JSON.stringify(workflow, null, 2), {
    workflowRef: "review-workflow.json",
    recipient: "claude",
  });

  assert.deepEqual(Object.keys(result), [
    "kind",
    "schemaVersion",
    "status",
    "recipient",
    "artifacts",
    "linkage",
    "stages",
    "nextAction",
    "boundary",
  ]);
  assert.equal(result.recipient.delivery, "not-delivered");
  assert.equal(result.recipient.consumerValidation, "pending");
  assert.equal(result.boundary.deliveryPerformed, false);
});

test("verifyReviewHandoff() proves contract validation without claiming consumer identity", () => {
  const workflow = sdk.reviewHtml(
    "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>",
    {
      sourceRef: "settings.html",
      brief: "Review Korean settings",
      locale: "ko-KR",
      viewports: ["mobile"],
      generatedAt: "2026-07-15T00:00:00.000Z",
    },
  );
  const handoff = sdk.reviewHandoff(JSON.stringify(workflow, null, 2), {
    workflowRef: "review-workflow.json",
    recipient: "codex",
  });
  const receipt = sdk.verifyReviewHandoff(JSON.stringify(handoff, null, 2), {
    handoffRef: "review-handoff.json",
    consumer: "codex",
  });

  assert.equal(receipt.kind, "design-ai-review-handoff-receipt");
  assert.equal(receipt.consumer.contractValidation, "pass");
  assert.equal(receipt.consumer.identity, "self-declared");
  assert.equal(receipt.nextAction.implementationAuthorized, false);
  assert.equal(receipt.boundary.targetRepoMutation, false);
});

test("reviewPack() exposes the shipped read-only Korean review registry", () => {
  const list = sdk.reviewPack();
  const pack = sdk.reviewPack("korean-commerce");
  assert.deepEqual(Object.keys(list), ["kind", "schemaVersion", "packs"]);
  assert.equal(list.packs.length, 5);
  assert.equal(pack.kind, "design-ai-product-review-pack");
  assert.equal(pack.revision, 1);
  assert.equal(pack.boundary.mode, "read-only");
  assert.equal(pack.boundary.targetRepoMutation, false);
});

test("pack() return-shape keys are pinned (Phase A: no learningUsage)", () => {
  const result = sdk.pack(BRIEF, { maxBytes: 20000 });
  assert.deepEqual(Object.keys(result).sort(), [
    "brief",
    "files",
    "markdown",
    "maxBytes",
    "plan",
    "summary",
    "usedBytes",
    "version",
    "warnings",
  ].sort());
  assert.equal(Object.hasOwn(result, "learningUsage"), false);
  assert.equal(Object.hasOwn(result.plan, "learningUsage"), false);
});

test("search() ranked hit return-shape keys are pinned", () => {
  const [hit] = sdk.search("accessibility", { ranked: true, limit: 1 });
  assert.deepEqual(Object.keys(hit).sort(), [
    "file",
    "matchedTokens",
    "preview",
    "relPath",
    "score",
  ].sort());
});

test("search() unranked hit return-shape keys are pinned", () => {
  const [hit] = sdk.search("accessibility", { limit: 1 });
  assert.deepEqual(Object.keys(hit).sort(), [
    "file",
    "lineNumber",
    "preview",
    "relPath",
  ].sort());
});

test("recall() return-shape keys are pinned", () => {
  const result = sdk.recall("accessibility button", { limit: 2 });
  assert.deepEqual(Object.keys(result).sort(), ["corpus", "learning"].sort());
  assert.deepEqual(Object.keys(result.corpus).sort(), [
    "candidateCount",
    "selectedCount",
    "selected",
  ].sort());
  assert.deepEqual(Object.keys(result.learning).sort(), [
    "candidateCount",
    "mode",
    "selected",
    "selectedCount",
  ].sort());
});

test("check() return-shape keys are pinned", () => {
  const artifact = [
    "# Title",
    "",
    "This is a component spec with anatomy, variants, and API props.",
    "Contrast ratio 4.5:1. Keyboard focus and screen reader aria- support.",
    "Responsive on mobile and desktop.",
  ].join("\n");
  const result = sdk.check(artifact);
  assert.deepEqual(Object.keys(result).sort(), [
    "failures",
    "filePath",
    "passes",
    "results",
    "score",
    "status",
    "total",
    "warnings",
  ].sort());
});

test("version() return-shape keys are pinned", () => {
  const result = sdk.version();
  assert.deepEqual(Object.keys(result).sort(), ["cli", "corpus"].sort());
  assert.equal(typeof result.cli, "string");
  assert.equal(typeof result.corpus, "string");
});
