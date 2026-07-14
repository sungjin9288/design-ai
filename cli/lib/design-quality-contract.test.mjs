import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import {
  DESIGN_QUALITY_LENSES,
  DESIGN_QUALITY_SCHEMA,
  DESIGN_QUALITY_SCHEMA_PATH,
  DESIGN_QUALITY_STATUSES,
  readDesignQualityReport,
  validateDesignQualityReport,
} from "./design-quality-contract.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";

const FIXTURE_PATH = path.join(
  PACKAGE_ROOT,
  "examples",
  "benchmarks",
  "korean-fintech-settings",
  "quality-report.json",
);

const fixture = readDesignQualityReport(FIXTURE_PATH);
const fixtureSource = readFileSync(
  path.join(path.dirname(FIXTURE_PATH), "source.html"),
  "utf8",
);

test("design quality schema keeps the evidence-first status and lens contract", () => {
  assert.deepEqual(DESIGN_QUALITY_STATUSES, ["pass", "warning", "fail", "unverified"]);
  assert.deepEqual(DESIGN_QUALITY_LENSES, [
    "purpose-frequency",
    "response",
    "spatial-continuity",
    "interruptibility",
    "timing-cohesion",
    "performance",
    "accessibility",
    "responsive-resilience",
  ]);
  assert.equal(DESIGN_QUALITY_SCHEMA.properties.kind.const, "design-ai-quality-report");
  assert.equal(path.relative(PACKAGE_ROOT, DESIGN_QUALITY_SCHEMA_PATH).startsWith(".."), false);
});

test("benchmark quality report validates as the canonical v1 contract", () => {
  assert.strictEqual(validateDesignQualityReport(fixture), fixture);
  assert.equal(fixture.schemaVersion, 1);
  assert.equal(fixture.summary.status, "fail");
  assert.equal(fixture.summary.confirmedFindings, 1);
  assert.equal(fixture.summary.unverifiedFindings, 1);
  assert.match(fixtureSource, /<span>휴대폰 번호<\/span>[\s\S]*<input(?![^>]*(?:aria-label|aria-labelledby))/);
});

test("quality reports reject unsupported mutation boundaries", () => {
  const changed = structuredClone(fixture);
  changed.boundary.targetRepoMutation = true;
  assert.throws(
    () => validateDesignQualityReport(changed),
    /must not mutate a target repository or write to an external system/,
  );

  const externalWrite = structuredClone(fixture);
  externalWrite.boundary.externalWrites = true;
  assert.throws(
    () => validateDesignQualityReport(externalWrite),
    /must not mutate a target repository or write to an external system/,
  );

  const hiddenLocalWrite = structuredClone(fixture);
  hiddenLocalWrite.boundary.localEvidencePath = "quality-report.json";
  assert.throws(
    () => validateDesignQualityReport(hiddenLocalWrite),
    /read-only quality reports cannot write local evidence/,
  );

  const unnamedLocalWrite = structuredClone(fixture);
  unnamedLocalWrite.boundary.mode = "local-evidence-write";
  assert.throws(
    () => validateDesignQualityReport(unnamedLocalWrite),
    /must record a local evidence write/,
  );
});

test("quality reports require evidence and all eight lenses", () => {
  const missingEvidence = structuredClone(fixture);
  missingEvidence.findings[0].evidence = [];
  assert.throws(
    () => validateDesignQualityReport(missingEvidence),
    /findings\[0\]\.evidence must be a non-empty array/,
  );

  const missingLens = structuredClone(fixture);
  missingLens.lenses.pop();
  assert.throws(
    () => validateDesignQualityReport(missingLens),
    /lenses must contain exactly 8 entries/,
  );
});

test("quality report summaries are derived from findings and lens status", () => {
  const staleCount = structuredClone(fixture);
  staleCount.summary.confirmedFindings = 0;
  assert.throws(
    () => validateDesignQualityReport(staleCount),
    /summary\.confirmedFindings must be 1/,
  );

  const inflatedStatus = structuredClone(fixture);
  inflatedStatus.summary.status = "pass";
  assert.throws(
    () => validateDesignQualityReport(inflatedStatus),
    /summary\.status must be fail/,
  );

  const hiddenBlocker = structuredClone(fixture);
  hiddenBlocker.findings[0].severity = "p0";
  hiddenBlocker.summary.blockingFindings = 1;
  hiddenBlocker.lenses.find((lens) => lens.id === "accessibility").status = "warning";
  hiddenBlocker.summary.status = "warning";
  assert.throws(
    () => validateDesignQualityReport(hiddenBlocker),
    /must fail for a confirmed p0 finding/,
  );

  const passingFinding = structuredClone(fixture);
  passingFinding.lenses.find((lens) => lens.id === "accessibility").status = "pass";
  passingFinding.summary.status = "unverified";
  assert.throws(
    () => validateDesignQualityReport(passingFinding),
    /cannot pass while it has findings/,
  );
});

test("quality reports reject malformed arrays and timestamps", () => {
  const sparseSources = structuredClone(fixture);
  sparseSources.sources = new Array(1);
  assert.throws(
    () => validateDesignQualityReport(sparseSources),
    /sources must not contain empty slots/,
  );

  const invalidDate = structuredClone(fixture);
  invalidDate.generatedAt = "2026-02-30T00:00:00.000Z";
  assert.throws(
    () => validateDesignQualityReport(invalidDate),
    /must be a normalized UTC date-time string/,
  );

  const impossibleMonth = structuredClone(fixture);
  impossibleMonth.generatedAt = "2026-13-14T00:00:00.000Z";
  assert.throws(
    () => validateDesignQualityReport(impossibleMonth),
    /must be a normalized UTC date-time string/,
  );
});
