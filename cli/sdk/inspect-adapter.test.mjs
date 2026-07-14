import assert from "node:assert/strict";
import { test } from "node:test";

import { inspectHtml } from "./inspect-adapter.mjs";

const SOURCE = `<html lang="ko"><head><meta name="viewport" content="width=device-width"></head><body><input name="phone"></body></html>`;

test("SDK inspectHtml returns the canonical read-only quality report", () => {
  const report = inspectHtml(SOURCE, {
    sourceRef: "settings.html",
    brief: "Review Korean settings",
    locale: "ko-KR",
    viewports: ["mobile", "desktop"],
  });

  assert.deepEqual(Object.keys(report), [
    "kind", "schemaVersion", "generatedAt", "subject", "context", "boundary",
    "sources", "lenses", "findings", "summary", "approval",
  ]);
  assert.equal(report.kind, "design-ai-quality-report");
  assert.equal(report.summary.confirmedFindings, 1);
  assert.equal(report.summary.unverifiedFindings, 1);
  assert.equal(report.boundary.targetRepoMutation, false);
  assert.equal(report.boundary.externalWrites, false);
});

test("SDK inspectHtml validates source metadata", () => {
  assert.throws(() => inspectHtml("", { sourceRef: "x.html", brief: "Review" }), /source must be a non-empty string/);
  assert.throws(() => inspectHtml(SOURCE, { brief: "Review" }), /sourceRef must be a non-empty string/);
  assert.throws(() => inspectHtml(SOURCE, { sourceRef: "x.html" }), /brief must be a non-empty string/);
  assert.throws(() => inspectHtml(SOURCE, { sourceRef: "x.html", brief: "Review", viewports: "mobile" }), /viewports must be an array/);
});

test("SDK inspectHtml supports a caller-owned timestamp for byte-stable reports", () => {
  const options = {
    sourceRef: "settings.html",
    brief: "Review Korean settings",
    generatedAt: "2026-07-14T00:00:00.000Z",
  };

  assert.equal(JSON.stringify(inspectHtml(SOURCE, options)), JSON.stringify(inspectHtml(SOURCE, options)));
});
