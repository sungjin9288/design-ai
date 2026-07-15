import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { sourceDigest } from "../lib/implementation-scope-contract.mjs";
import { PACKAGE_ROOT } from "../lib/paths.mjs";
import { compareReviews } from "./review-comparison-adapter.mjs";

const FIXTURE_PATH = path.join(
  PACKAGE_ROOT,
  "examples",
  "benchmarks",
  "korean-fintech-settings",
  "quality-report.json",
);
const BASELINE_SOURCE = readFileSync(FIXTURE_PATH, "utf8");

function candidateSource() {
  const report = JSON.parse(BASELINE_SOURCE);
  report.generatedAt = "2026-07-15T00:00:00.000Z";
  return `${JSON.stringify(report, null, 2)}\n`;
}

test("SDK compareReviews preserves exact source identity and a read-only boundary", () => {
  const candidate = candidateSource();
  const result = compareReviews(BASELINE_SOURCE, candidate, {
    baselineRef: "before.json",
    candidateRef: "after.json",
  });

  assert.equal(result.kind, "design-ai-review-comparison");
  assert.equal(result.status, "attention-required");
  assert.equal(result.baseline.sha256, sourceDigest(BASELINE_SOURCE));
  assert.equal(result.candidate.sha256, sourceDigest(candidate));
  assert.equal(result.boundary.mode, "read-only-review-comparison");
  assert.equal(result.boundary.localWrites, false);
  assert.equal(result.boundary.targetRepoMutation, false);
  assert.equal(result.boundary.externalWrites, false);
});

test("SDK compareReviews can return a compact result without losing source identity", () => {
  const candidate = candidateSource();
  const result = compareReviews(BASELINE_SOURCE, candidate, {
    baselineRef: "before.json",
    candidateRef: "after.json",
    compact: true,
  });

  assert.equal(result.kind, "design-ai-review-comparison-summary");
  assert.equal(result.sources.baseline.reference, "before.json");
  assert.equal(result.sources.baseline.sha256, sourceDigest(BASELINE_SOURCE));
  assert.equal(Object.hasOwn(result.sources.baseline, "source"), false);
});

test("SDK compareReviews requires explicit sources, references, and boolean compact mode", () => {
  assert.throws(
    () => compareReviews("", candidateSource(), { baselineRef: "before.json", candidateRef: "after.json" }),
    /baselineSource must be a non-empty string/,
  );
  assert.throws(
    () => compareReviews(BASELINE_SOURCE, candidateSource(), { candidateRef: "after.json" }),
    /baselineRef must be a non-empty string/,
  );
  assert.throws(
    () => compareReviews(BASELINE_SOURCE, candidateSource(), {
      baselineRef: "before.json",
      candidateRef: "after.json",
      compact: "yes",
    }),
    /compact must be a boolean/,
  );
});
