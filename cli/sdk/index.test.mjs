// SDK contract test: pins the 8 exported names and return-shape key sets.
// This is the semver anchor described in docs/AGENT-SDK.md — if names or
// top-level keys drift, this test must fail.

import { test } from "node:test";
import assert from "node:assert/strict";

import * as sdk from "./index.mjs";

const EXPECTED_EXPORT_NAMES = [
  "check",
  "pack",
  "prompt",
  "recall",
  "route",
  "routes",
  "search",
  "version",
].sort();

const BRIEF = "Spec a Button component API with variants, props, and keyboard accessibility";

test("SDK exports exactly the 8 Phase A verbs", () => {
  const exportedNames = Object.keys(sdk).sort();
  assert.deepEqual(exportedNames, EXPECTED_EXPORT_NAMES);
  for (const name of exportedNames) {
    assert.equal(typeof sdk[name], "function", `${name} must be a function`);
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
