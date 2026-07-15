import assert from "node:assert/strict";
import { test } from "node:test";

import { reviewHandoff } from "./review-handoff-adapter.mjs";
import { reviewHtml } from "./review-adapter.mjs";

function workflowSource() {
  return JSON.stringify(reviewHtml(
    "<html lang=\"ko\"><body><button>저장</button></body></html>",
    {
      sourceRef: "settings.html",
      brief: "Review Korean settings",
      locale: "ko-KR",
      viewports: ["mobile"],
      generatedAt: "2026-07-15T00:00:00.000Z",
    },
  ), null, 2);
}

test("reviewHandoff() preserves source bytes and the read-only transfer boundary", () => {
  const source = workflowSource();
  const handoff = reviewHandoff(source, {
    workflowRef: "review-workflow.json",
    recipient: "codex",
  });

  assert.equal(handoff.kind, "design-ai-review-handoff");
  assert.equal(handoff.artifacts.reviewWorkflow.source, source);
  assert.equal(handoff.recipient.delivery, "not-delivered");
  assert.equal(handoff.recipient.consumerValidation, "pending");
  assert.equal(handoff.boundary.localWrites, false);
  assert.equal(handoff.boundary.targetRepoMutation, false);
  assert.equal(handoff.boundary.externalWrites, false);
  assert.equal(handoff.boundary.deliveryPerformed, false);
});

test("reviewHandoff() requires explicit references and paired browser evidence", () => {
  const source = workflowSource();
  assert.throws(
    () => reviewHandoff(source, { recipient: "codex" }),
    /workflowRef must be a non-empty string/,
  );
  assert.throws(
    () => reviewHandoff(source, {
      workflowRef: "review-workflow.json",
      recipient: "codex",
      qualityReportSource: "{}",
    }),
    /must be supplied together/,
  );
});
