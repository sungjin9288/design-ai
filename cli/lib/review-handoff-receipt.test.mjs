import assert from "node:assert/strict";
import { mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { buildReviewHandoff } from "./review-handoff.mjs";
import {
  parseReviewHandoffReceiptArgs,
  verifyReviewHandoff,
  verifyReviewHandoffFromFile,
} from "./review-handoff-receipt.mjs";
import { validateReviewHandoffReceipt } from "./review-handoff-receipt-contract.mjs";
import { buildReviewWorkflow } from "./review-workflow.mjs";
import { PACKAGE_ROOT, SYMLINK_PREFIX } from "./paths.mjs";

function handoffFixture(recipient = "codex") {
  const workflow = buildReviewWorkflow(
    "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>",
    {
      sourceRef: "settings.html",
      brief: "Review Korean settings",
      locale: "ko-KR",
      viewports: ["mobile"],
      generatedAt: "2026-07-15T00:00:00.000Z",
      sourceRoot: PACKAGE_ROOT,
      prefix: SYMLINK_PREFIX,
    },
  );
  return buildReviewHandoff(JSON.stringify(workflow, null, 2), {
    workflowRef: "review-workflow.json",
    recipient,
  });
}

test("review handoff receipt validates exact source bytes without claiming acceptance", () => {
  const handoffSource = `${JSON.stringify(handoffFixture(), null, 2)}\n`;
  const receipt = verifyReviewHandoff(handoffSource, {
    handoffRef: "review-handoff.json",
    consumer: "codex",
  });

  assert.equal(receipt.kind, "design-ai-review-handoff-receipt");
  assert.equal(receipt.status, "contract-validated");
  assert.equal(receipt.handoff.source, handoffSource);
  assert.equal(receipt.consumer.identity, "self-declared");
  assert.equal(receipt.consumer.acceptance, "not-claimed");
  assert.equal(receipt.evidence.browserStatus, "not-run");
  assert.equal(receipt.nextAction.implementationAuthorized, false);
  assert.deepEqual(receipt.remainingApprovals, receipt.handoff.value.nextAction.approvalRequiredBefore);
  assert.equal(receipt.boundary.consumerIdentityVerified, false);
  assert.strictEqual(validateReviewHandoffReceipt(receipt), receipt);
});

test("review handoff receipt rejects the wrong consumer and changed source evidence", () => {
  const handoffSource = JSON.stringify(handoffFixture("claude"), null, 2);
  assert.throws(
    () => verifyReviewHandoff(handoffSource, {
      handoffRef: "review-handoff.json",
      consumer: "codex",
    }),
    /expected claude, received codex/,
  );

  const receipt = verifyReviewHandoff(handoffSource, {
    handoffRef: "review-handoff.json",
    consumer: "claude",
  });
  receipt.handoff.source += "\n";
  assert.throws(() => validateReviewHandoffReceipt(receipt), /bytes does not match/);
});

test("review handoff receipt CLI parser and file operation preserve the handoff", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "design-ai-handoff-receipt-"));
  const handoffPath = path.join(directory, "review-handoff.json");
  writeFileSync(handoffPath, JSON.stringify(handoffFixture(), null, 2));

  const parsed = parseReviewHandoffReceiptArgs([
    handoffPath,
    "--consumer", "codex",
    "--json",
  ]);
  const receipt = verifyReviewHandoffFromFile(parsed);

  assert.equal(receipt.handoff.reference, realpathSync(handoffPath));
  assert.equal(receipt.consumer.name, "codex");
  assert.throws(
    () => parseReviewHandoffReceiptArgs([handoffPath, "--consmer", "codex"]),
    /Did you mean `--consumer`/,
  );
});
