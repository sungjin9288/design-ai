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
