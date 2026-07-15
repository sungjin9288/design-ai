import assert from "node:assert/strict";
import { test } from "node:test";

import { reviewHtml } from "./review-adapter.mjs";

const SOURCE = "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>";
const OPTIONS = {
  sourceRef: "settings.html",
  brief: "Review Korean settings",
  locale: "ko-KR",
  viewports: ["mobile", "desktop"],
  generatedAt: "2026-07-15T00:00:00.000Z",
};

test("SDK reviewHtml returns the canonical read-only workflow", () => {
  const workflow = reviewHtml(SOURCE, OPTIONS);
  assert.equal(workflow.kind, "design-ai-review-workflow");
  assert.equal(workflow.plan.kind, "design-ai-start");
  assert.equal(workflow.report.kind, "design-ai-quality-report");
  assert.equal(workflow.linkage.status, "pass");
  assert.equal(workflow.nextAction.status, "pending");
  assert.equal(workflow.boundary.localWrites, false);
});

test("SDK reviewHtml validates source and context inputs", () => {
  assert.throws(() => reviewHtml("", OPTIONS), /source must be a non-empty string/);
  assert.throws(() => reviewHtml(SOURCE, { ...OPTIONS, sourceRef: "" }), /sourceRef must be a non-empty string/);
  assert.throws(() => reviewHtml(SOURCE, { ...OPTIONS, brief: "" }), /brief must be a non-empty string/);
  assert.throws(() => reviewHtml(SOURCE, { ...OPTIONS, viewports: "mobile" }), /viewports must be an array/);
  assert.throws(() => reviewHtml(SOURCE, { ...OPTIONS, screenshots: [3] }), /screenshots\[0\] must be a non-empty string/);
});

test("SDK reviewHtml is byte-stable with a caller-owned timestamp", () => {
  assert.equal(
    JSON.stringify(reviewHtml(SOURCE, OPTIONS)),
    JSON.stringify(reviewHtml(SOURCE, OPTIONS)),
  );
});
