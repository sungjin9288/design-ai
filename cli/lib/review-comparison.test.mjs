import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { sourceDigest } from "./implementation-scope-contract.mjs";
import {
  compareReviewReports,
  compareReviewReportFiles,
  parseReviewComparisonArgs,
  summarizeReviewComparison,
} from "./review-comparison.mjs";
import { validateReviewComparison } from "./review-comparison-contract.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";

const FIXTURE_PATH = path.join(
  PACKAGE_ROOT,
  "examples",
  "benchmarks",
  "korean-fintech-settings",
  "quality-report.json",
);
const BASELINE_SOURCE = readFileSync(FIXTURE_PATH, "utf8");
const BASELINE = JSON.parse(BASELINE_SOURCE);

function candidateReport({
  removeFindingIds = [],
  addFindings = [],
  lensStatuses = {},
  generatedAt = "2026-07-15T00:00:00.000Z",
} = {}) {
  const report = structuredClone(BASELINE);
  report.generatedAt = generatedAt;
  report.findings = report.findings
    .filter((finding) => !removeFindingIds.includes(finding.id))
    .concat(structuredClone(addFindings));

  for (const lens of report.lenses) {
    if (lensStatuses[lens.id]) lens.status = lensStatuses[lens.id];
  }

  const lensStatusesInReport = new Set(report.lenses.map((lens) => lens.status));
  report.summary = {
    status: lensStatusesInReport.has("fail")
      ? "fail"
      : lensStatusesInReport.has("warning")
        ? "warning"
        : lensStatusesInReport.has("unverified")
          ? "unverified"
          : "pass",
    confirmedFindings: report.findings.filter((finding) => finding.status === "confirmed").length,
    unverifiedFindings: report.findings.filter((finding) => finding.status === "unverified").length,
    blockingFindings: report.findings.filter((finding) => finding.severity === "p0").length,
    nextAction: "Continue from the evidence recorded in this candidate report.",
  };
  return report;
}

function source(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

test("review comparison preserves exact sources and resolves only a passing lens", () => {
  const candidateSource = source(candidateReport({
    removeFindingIds: ["missing-associated-label"],
    lensStatuses: { accessibility: "pass" },
  }));
  const comparison = compareReviewReports(BASELINE_SOURCE, candidateSource, {
    baselineRef: "before.json",
    candidateRef: "after.json",
  });

  assert.equal(comparison.status, "attention-required");
  assert.equal(comparison.baseline.reference, "before.json");
  assert.equal(comparison.baseline.source, BASELINE_SOURCE);
  assert.equal(comparison.baseline.sha256, sourceDigest(BASELINE_SOURCE));
  assert.equal(comparison.candidate.reference, "after.json");
  assert.equal(comparison.candidate.source, candidateSource);
  assert.equal(comparison.candidate.sha256, sourceDigest(candidateSource));
  assert.deepEqual(comparison.findings.resolved.map(({ id }) => id), ["missing-associated-label"]);
  assert.deepEqual(comparison.findings.persistent.map(({ id }) => id), ["runtime-interaction-proof-missing"]);
  assert.equal(comparison.findings.uncertain.length, 0);
  assert.equal(comparison.boundary.boundedImprovementEstablished, false);
});

test("review comparison keeps an absent finding uncertain until its lens passes", () => {
  const candidateSource = source(candidateReport({
    removeFindingIds: ["runtime-interaction-proof-missing"],
  }));
  const comparison = compareReviewReports(BASELINE_SOURCE, candidateSource);

  assert.equal(comparison.status, "attention-required");
  assert.deepEqual(comparison.findings.uncertain.map(({ id }) => id), ["runtime-interaction-proof-missing"]);
  assert.equal(comparison.findings.uncertain[0].afterLensStatus, "unverified");
});

test("review comparison marks a new confirmed finding as a regression", () => {
  const introduced = structuredClone(BASELINE.findings[0]);
  introduced.id = "missing-submit-name";
  introduced.lens = "response";
  introduced.location = "candidate.html:20";
  const candidateSource = source(candidateReport({
    addFindings: [introduced],
    lensStatuses: { response: "warning" },
  }));
  const comparison = compareReviewReports(BASELINE_SOURCE, candidateSource);

  assert.equal(comparison.status, "regressed");
  assert.deepEqual(comparison.findings.introduced.map(({ id }) => id), ["missing-submit-name"]);
  assert.equal(comparison.lensTransitions.find(({ id }) => id === "response").change, "evidence-gained");
});

test("review comparison rejects context drift and finding lens drift", () => {
  const changedContext = candidateReport();
  changedContext.context.locale = "en-US";
  assert.throws(
    () => compareReviewReports(BASELINE_SOURCE, source(changedContext)),
    /same brief, route, locale, and viewports/,
  );

  const changedLens = candidateReport();
  changedLens.findings[0].lens = "response";
  changedLens.lenses.find((lens) => lens.id === "accessibility").status = "warning";
  changedLens.lenses.find((lens) => lens.id === "response").status = "warning";
  changedLens.summary.status = "warning";
  assert.throws(
    () => compareReviewReports(BASELINE_SOURCE, source(changedLens)),
    /changed lens identity/,
  );
});

test("review comparison validator rejects drift in derived decisions", () => {
  const candidateSource = source(candidateReport({
    removeFindingIds: ["missing-associated-label"],
    lensStatuses: { accessibility: "pass" },
  }));
  const comparison = compareReviewReports(BASELINE_SOURCE, candidateSource);
  const changed = structuredClone(comparison);
  changed.findings.resolved[0].reason = "Trust this claim without checking the candidate lens.";

  assert.throws(() => validateReviewComparison(changed), /finding decisions drifted/);
});

test("compact review comparison keeps source identity without source bodies", () => {
  const candidateSource = source(candidateReport());
  const comparison = compareReviewReports(BASELINE_SOURCE, candidateSource, {
    baselineRef: "before.json",
    candidateRef: "after.json",
  });
  const compact = summarizeReviewComparison(comparison);

  assert.equal(compact.kind, "design-ai-review-comparison-summary");
  assert.deepEqual(compact.sources.baseline, {
    reference: "before.json",
    sha256: sourceDigest(BASELINE_SOURCE),
    bytes: Buffer.byteLength(BASELINE_SOURCE),
    kind: "design-ai-quality-report",
    schemaVersion: 1,
    reportStatus: "fail",
  });
  assert.equal(Object.hasOwn(compact.sources.baseline, "source"), false);
  assert.equal(Object.hasOwn(compact.sources.baseline, "value"), false);
  assert.deepEqual(compact.representation.omittedFields, [
    "baseline.source",
    "baseline.value",
    "candidate.source",
    "candidate.value",
  ]);
});

test("review comparison CLI parser requires explicit candidate input", () => {
  assert.deepEqual(
    parseReviewComparisonArgs(["before.json", "--candidate", "after.json", "--compact", "--json"]),
    {
      baselinePath: "before.json",
      candidatePath: "after.json",
      compact: true,
      json: true,
      help: false,
    },
  );
  assert.throws(
    () => parseReviewComparisonArgs(["before.json", "--unknown"]),
    /Unknown review-compare option: --unknown/,
  );
});

test("review comparison file inputs reject symbolic links and files above 5 MB", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "design-ai-review-compare-"));
  const baselinePath = path.join(directory, "baseline.json");
  const candidatePath = path.join(directory, "candidate.json");
  const linkedPath = path.join(directory, "linked-baseline.json");
  const oversizedPath = path.join(directory, "oversized.json");

  try {
    writeFileSync(baselinePath, BASELINE_SOURCE);
    writeFileSync(candidatePath, BASELINE_SOURCE);
    symlinkSync(baselinePath, linkedPath);
    writeFileSync(oversizedPath, " ".repeat((5 * 1024 * 1024) + 1));

    assert.throws(
      () => compareReviewReportFiles({ baselinePath: linkedPath, candidatePath }, directory),
      /baseline quality report must be a regular non-symbolic-link file/,
    );
    assert.throws(
      () => compareReviewReportFiles({ baselinePath: oversizedPath, candidatePath }, directory),
      /baseline quality report exceeds the 5 MB limit/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
