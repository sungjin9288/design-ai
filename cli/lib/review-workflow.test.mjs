import assert from "node:assert/strict";
import { test } from "node:test";

import { PACKAGE_ROOT } from "./paths.mjs";
import {
  reviewSourceDigest,
  validateReviewWorkflow,
} from "./review-workflow-contract.mjs";
import { buildReviewWorkflow } from "./review-workflow.mjs";

const SOURCE = "<!doctype html><html lang=\"ko\"><head><meta name=\"viewport\" content=\"width=device-width\"></head><body><button>저장</button></body></html>";

function buildWorkflow() {
  return buildReviewWorkflow(SOURCE, {
    brief: "한국어 계정 설정 화면을 검토한다",
    sourceRef: "settings.html",
    sourceRoot: PACKAGE_ROOT,
    prefix: "design-",
    locale: "ko-KR",
    viewports: ["mobile", "desktop"],
    generatedAt: "2026-07-15T00:00:00.000Z",
    reviewPack: "korean-fintech",
  });
}

test("review workflow composes canonical planning and static evidence", () => {
  const workflow = buildWorkflow();

  assert.equal(workflow.plan.kind, "design-ai-start");
  assert.equal(workflow.plan.route.id, "design-review");
  assert.equal(workflow.report.kind, "design-ai-quality-report");
  assert.equal(workflow.linkage.status, "pass");
  assert.deepEqual(workflow.boundary, {
    mode: "read-only",
    localWrites: false,
    targetRepoMutation: false,
    externalWrites: false,
  });
  assert.equal(validateReviewWorkflow(workflow, { source: SOURCE }), workflow);
});

test("review workflow rejects context, digest, stage, and approval drift", () => {
  const workflow = buildWorkflow();

  const localeDrift = structuredClone(workflow);
  localeDrift.report.context.locale = "en";
  assert.throws(() => validateReviewWorkflow(localeDrift), /localeMatch is inconsistent/);

  const digestDrift = structuredClone(workflow);
  digestDrift.linkage.reportSha256 = "0".repeat(64);
  assert.throws(() => validateReviewWorkflow(digestDrift), /reportSha256 does not match/);

  const stageDrift = structuredClone(workflow);
  stageDrift.stages[2].status = "pass";
  assert.throws(() => validateReviewWorkflow(stageDrift), /canonical review sequence/);

  const approvalDrift = structuredClone(workflow);
  approvalDrift.nextAction.approvalRequiredBefore = [];
  assert.throws(() => validateReviewWorkflow(approvalDrift), /preserve the quality report approval gates/);
});

test("review workflow leaves supplied source unchanged", () => {
  const before = Buffer.from(SOURCE);
  buildWorkflow();
  assert.deepEqual(Buffer.from(SOURCE), before);
});

test("review workflow preserves source whitespace in its byte identity", () => {
  const source = `\n${SOURCE}\n`;
  const workflow = buildReviewWorkflow(source, {
    brief: "Review exact source bytes",
    sourceRef: "settings.html",
    sourceRoot: PACKAGE_ROOT,
    prefix: "design-",
    generatedAt: "2026-07-15T00:00:00.000Z",
  });

  assert.equal(workflow.source.bytes, Buffer.byteLength(source, "utf8"));
  assert.equal(workflow.source.sha256, reviewSourceDigest(source));
  assert.notEqual(workflow.source.sha256, reviewSourceDigest(source.trim()));
});
