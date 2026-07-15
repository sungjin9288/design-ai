import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { validateBrowserVerification } from "./browser-verification-contract.mjs";
import { validateDesignQualityReport } from "./design-quality-contract.mjs";
import {
  reviewWorkflowDigest,
  validateReviewWorkflow,
} from "./review-workflow-contract.mjs";

const DIGEST_PATTERN = /^[a-f0-9]{64}$/;

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

function parseSource(source, field) {
  text(source, `${field}.source`);
  try {
    return JSON.parse(source);
  } catch {
    throw new Error(`${field}.source must be valid JSON`);
  }
}

export function reviewHandoffSourceDigest(source) {
  return createHash("sha256").update(source).digest("hex");
}

export function reviewHandoffArtifact(source, value, reference) {
  return {
    reference,
    sha256: reviewHandoffSourceDigest(source),
    bytes: Buffer.byteLength(source, "utf8"),
    source,
    value,
  };
}

function validateArtifact(artifact, field, validateValue) {
  exactKeys(artifact, ["reference", "sha256", "bytes", "source", "value"], field);
  text(artifact.reference, `${field}.reference`);
  if (!DIGEST_PATTERN.test(artifact.sha256)) {
    throw new Error(`${field}.sha256 must be a lowercase SHA-256 digest`);
  }
  if (!Number.isInteger(artifact.bytes) || artifact.bytes < 1) {
    throw new Error(`${field}.bytes must be a positive integer`);
  }
  if (Buffer.byteLength(artifact.source, "utf8") !== artifact.bytes) {
    throw new Error(`${field}.bytes does not match its source`);
  }
  if (reviewHandoffSourceDigest(artifact.source) !== artifact.sha256) {
    throw new Error(`${field}.sha256 does not match its source`);
  }
  const parsed = parseSource(artifact.source, field);
  if (!isDeepStrictEqual(parsed, artifact.value)) {
    throw new Error(`${field}.value does not match its source JSON`);
  }
  validateValue(artifact.value);
}

function expectedStages(hasBrowserVerification) {
  return [
    { id: "plan", status: "complete", artifactKind: "design-ai-start" },
    { id: "static-review", status: "complete", artifactKind: "design-ai-quality-report" },
    {
      id: "browser-verification",
      status: hasBrowserVerification ? "complete" : "not-run",
      artifactKind: hasBrowserVerification ? "design-ai-browser-verification" : null,
    },
    { id: "implementation-handoff", status: "prepared", artifactKind: "design-ai-review-handoff" },
  ];
}

export function reviewHandoffPendingApprovals(workflow, browserVerificationPassed) {
  const requirements = workflow.nextAction.approvalRequiredBefore;
  return browserVerificationPassed
    ? requirements.filter((requirement) => !requirement.toLowerCase().includes("browser"))
    : [...requirements];
}

function validateLinkage(handoff, hasBrowserVerification) {
  const { artifacts, linkage } = handoff;
  exactKeys(linkage, [
    "status",
    "reviewWorkflowArtifactSha256",
    "qualityReportArtifactSha256",
    "browserVerificationArtifactSha256",
    "qualityReportArtifactMatch",
    "browserSourceReportMatch",
    "viewportCoverage",
  ], "review handoff linkage");

  if (linkage.status !== "pass") throw new Error("review handoff linkage.status must be pass");
  const expectedWorkflowDigest = reviewWorkflowDigest(artifacts.reviewWorkflow.value);
  if (linkage.reviewWorkflowArtifactSha256 !== expectedWorkflowDigest) {
    throw new Error("review handoff workflow artifact digest does not match");
  }
  if (linkage.qualityReportArtifactSha256 !== artifacts.reviewWorkflow.value.linkage.reportSha256) {
    throw new Error("review handoff quality report artifact digest does not match");
  }

  if (!hasBrowserVerification) {
    if (linkage.browserVerificationArtifactSha256 !== null
      || linkage.qualityReportArtifactMatch !== null
      || linkage.browserSourceReportMatch !== null
      || linkage.viewportCoverage !== "not-run") {
      throw new Error("review handoff browser linkage must remain not-run without browser evidence");
    }
    return;
  }

  const qualityReport = artifacts.qualityReport;
  const browserVerification = artifacts.browserVerification;
  if (!isDeepStrictEqual(qualityReport.value, artifacts.reviewWorkflow.value.report)) {
    throw new Error("review handoff quality report does not match the review workflow");
  }
  if (browserVerification.value.sourceReport.sha256 !== qualityReport.sha256) {
    throw new Error("review handoff browser source report digest does not match the quality report bytes");
  }
  const declaredViewports = artifacts.reviewWorkflow.value.report.context.viewports;
  const observedViewports = browserVerification.value.viewports.map((viewport) => viewport.name);
  if (!isDeepStrictEqual(new Set(observedViewports), new Set(declaredViewports))) {
    throw new Error("review handoff browser viewports do not cover the review workflow");
  }
  if (linkage.browserVerificationArtifactSha256 !== reviewWorkflowDigest(browserVerification.value)
    || linkage.qualityReportArtifactMatch !== true
    || linkage.browserSourceReportMatch !== true
    || linkage.viewportCoverage !== "pass") {
    throw new Error("review handoff browser linkage evidence does not match its artifacts");
  }
}

function validateNextAction(handoff, hasBrowserVerification) {
  exactKeys(
    handoff.nextAction,
    ["id", "status", "summary", "approvalRequiredBefore"],
    "review handoff nextAction",
  );
  if (handoff.nextAction.id !== "consumer-validation-required"
    || handoff.nextAction.status !== "pending") {
    throw new Error("review handoff nextAction must require pending consumer validation");
  }
  text(handoff.nextAction.summary, "review handoff nextAction.summary");
  const expected = reviewHandoffPendingApprovals(
    handoff.artifacts.reviewWorkflow.value,
    hasBrowserVerification
      && handoff.artifacts.browserVerification.value.summary.status === "pass",
  );
  if (!isDeepStrictEqual(handoff.nextAction.approvalRequiredBefore, expected)) {
    throw new Error("review handoff nextAction approval requirements changed");
  }
}

function validateBoundary(boundary) {
  exactKeys(
    boundary,
    ["mode", "localWrites", "targetRepoMutation", "externalWrites", "deliveryPerformed"],
    "review handoff boundary",
  );
  if (boundary.mode !== "read-only"
    || boundary.localWrites !== false
    || boundary.targetRepoMutation !== false
    || boundary.externalWrites !== false
    || boundary.deliveryPerformed !== false) {
    throw new Error("review handoff boundary must remain read-only and undelivered");
  }
}

export function validateReviewHandoff(handoff) {
  exactKeys(handoff, [
    "kind",
    "schemaVersion",
    "status",
    "recipient",
    "artifacts",
    "linkage",
    "stages",
    "nextAction",
    "boundary",
  ], "review handoff");
  if (handoff.kind !== "design-ai-review-handoff" || handoff.schemaVersion !== 1) {
    throw new Error("review handoff kind and schemaVersion must be design-ai-review-handoff v1");
  }

  exactKeys(handoff.recipient, ["name", "delivery", "consumerValidation"], "review handoff recipient");
  text(handoff.recipient.name, "review handoff recipient.name");
  if (handoff.recipient.delivery !== "not-delivered"
    || handoff.recipient.consumerValidation !== "pending") {
    throw new Error("review handoff recipient must remain undelivered and pending validation");
  }

  exactKeys(
    handoff.artifacts,
    ["reviewWorkflow", "qualityReport", "browserVerification"],
    "review handoff artifacts",
  );
  validateArtifact(handoff.artifacts.reviewWorkflow, "review handoff artifacts.reviewWorkflow", validateReviewWorkflow);
  const hasBrowserVerification = handoff.artifacts.browserVerification !== null;
  if ((handoff.artifacts.qualityReport !== null) !== hasBrowserVerification) {
    throw new Error("review handoff quality and browser evidence must be supplied together");
  }
  if (hasBrowserVerification) {
    validateArtifact(
      handoff.artifacts.qualityReport,
      "review handoff artifacts.qualityReport",
      validateDesignQualityReport,
    );
    validateArtifact(
      handoff.artifacts.browserVerification,
      "review handoff artifacts.browserVerification",
      validateBrowserVerification,
    );
  }

  const expectedStatus = hasBrowserVerification
    ? "browser-evidence-prepared"
    : "static-evidence-prepared";
  if (handoff.status !== expectedStatus) {
    throw new Error(`review handoff status must be ${expectedStatus}`);
  }
  validateLinkage(handoff, hasBrowserVerification);
  if (!isDeepStrictEqual(handoff.stages, expectedStages(hasBrowserVerification))) {
    throw new Error("review handoff stages must preserve the prepared handoff sequence");
  }
  validateNextAction(handoff, hasBrowserVerification);
  validateBoundary(handoff.boundary);
  return handoff;
}

export function canonicalReviewHandoffStages(hasBrowserVerification) {
  return expectedStages(hasBrowserVerification).map((stage) => ({ ...stage }));
}
