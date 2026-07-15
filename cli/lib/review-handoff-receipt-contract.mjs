import { isDeepStrictEqual } from "node:util";

import { validateReviewHandoffArtifact } from "./review-handoff-contract.mjs";

const BROWSER_STATUSES = new Set(["not-run", "pass", "fail", "unverified"]);

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value;
}

function exactKeys(value, keys, field) {
  const actual = Object.keys(object(value, field)).sort();
  const expected = [...keys].sort();
  if (!isDeepStrictEqual(actual, expected)) {
    throw new Error(`${field} keys must be exactly: ${keys.join(", ")}`);
  }
}

function text(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function validateConsumer(receipt) {
  exactKeys(
    receipt.consumer,
    ["name", "expectedRecipient", "recipientMatch", "identity", "contractValidation", "acceptance"],
    "review handoff receipt consumer",
  );
  text(receipt.consumer.name, "review handoff receipt consumer.name");
  if (receipt.consumer.expectedRecipient !== receipt.handoff.value.recipient.name
    || receipt.consumer.name !== receipt.consumer.expectedRecipient
    || receipt.consumer.recipientMatch !== true) {
    throw new Error("review handoff receipt consumer must match the named handoff recipient");
  }
  if (receipt.consumer.identity !== "self-declared"
    || receipt.consumer.contractValidation !== "pass"
    || receipt.consumer.acceptance !== "not-claimed") {
    throw new Error("review handoff receipt consumer claims exceed contract validation");
  }
}

function validateEvidence(receipt) {
  exactKeys(
    receipt.evidence,
    ["qualityStatus", "confirmedFindings", "unverifiedFindings", "browserStatus"],
    "review handoff receipt evidence",
  );
  const reportSummary = receipt.handoff.value.artifacts.reviewWorkflow.value.report.summary;
  const browserStatus = receipt.handoff.value.artifacts.browserVerification?.value.summary.status
    || "not-run";
  if (receipt.evidence.qualityStatus !== reportSummary.status
    || receipt.evidence.confirmedFindings !== reportSummary.confirmedFindings
    || receipt.evidence.unverifiedFindings !== reportSummary.unverifiedFindings
    || receipt.evidence.browserStatus !== browserStatus
    || !BROWSER_STATUSES.has(receipt.evidence.browserStatus)) {
    throw new Error("review handoff receipt evidence does not match the handoff");
  }
}

function validateNextAction(receipt) {
  exactKeys(
    receipt.nextAction,
    ["id", "status", "summary", "implementationAuthorized"],
    "review handoff receipt nextAction",
  );
  if (receipt.nextAction.id !== "target-repo-intake-required"
    || receipt.nextAction.status !== "pending"
    || receipt.nextAction.implementationAuthorized !== false) {
    throw new Error("review handoff receipt must keep target-repository intake pending");
  }
  text(receipt.nextAction.summary, "review handoff receipt nextAction.summary");
  if (!isDeepStrictEqual(
    receipt.remainingApprovals,
    receipt.handoff.value.nextAction.approvalRequiredBefore,
  )) {
    throw new Error("review handoff receipt remaining approvals changed");
  }
}

function validateBoundary(boundary) {
  exactKeys(
    boundary,
    [
      "mode",
      "localWrites",
      "targetRepoMutation",
      "externalWrites",
      "transportVerified",
      "consumerIdentityVerified",
      "acceptanceRecorded",
      "implementationStarted",
    ],
    "review handoff receipt boundary",
  );
  if (boundary.mode !== "read-only"
    || boundary.localWrites !== false
    || boundary.targetRepoMutation !== false
    || boundary.externalWrites !== false
    || boundary.transportVerified !== false
    || boundary.consumerIdentityVerified !== false
    || boundary.acceptanceRecorded !== false
    || boundary.implementationStarted !== false) {
    throw new Error("review handoff receipt boundary must preserve unverified external claims");
  }
}

export function validateReviewHandoffReceipt(receipt) {
  exactKeys(receipt, [
    "kind",
    "schemaVersion",
    "status",
    "consumer",
    "handoff",
    "evidence",
    "remainingApprovals",
    "nextAction",
    "boundary",
  ], "review handoff receipt");
  if (receipt.kind !== "design-ai-review-handoff-receipt" || receipt.schemaVersion !== 1) {
    throw new Error(
      "review handoff receipt kind and schemaVersion must be design-ai-review-handoff-receipt v1",
    );
  }
  if (receipt.status !== "contract-validated") {
    throw new Error("review handoff receipt status must be contract-validated");
  }
  validateReviewHandoffArtifact(receipt.handoff, "review handoff receipt handoff");
  validateConsumer(receipt);
  validateEvidence(receipt);
  if (!Array.isArray(receipt.remainingApprovals)) {
    throw new Error("review handoff receipt remainingApprovals must be an array");
  }
  validateNextAction(receipt);
  validateBoundary(receipt.boundary);
  return receipt;
}
