import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { validateDesignQualityReport } from "./design-quality-contract.mjs";
import { validateStartPayload } from "./start-contract.mjs";

const DIGEST_PATTERN = /^[a-f0-9]{64}$/;

const REVIEW_STAGES = Object.freeze([
  { id: "plan", status: "complete", artifactKind: "design-ai-start" },
  { id: "static-review", status: "complete", artifactKind: "design-ai-quality-report" },
  { id: "browser-verification", status: "not-run", artifactKind: null },
  { id: "implementation-handoff", status: "not-started", artifactKind: null },
]);

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

function digest(value, field) {
  if (typeof value !== "string" || !DIGEST_PATTERN.test(value)) {
    throw new Error(`${field} must be a lowercase SHA-256 digest`);
  }
}

export function reviewWorkflowDigest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function reviewSourceDigest(source) {
  return createHash("sha256").update(source).digest("hex");
}

function validateSource(source) {
  exactKeys(source, ["reference", "sha256", "bytes"], "review workflow source");
  text(source.reference, "review workflow source.reference");
  digest(source.sha256, "review workflow source.sha256");
  if (!Number.isInteger(source.bytes) || source.bytes < 1) {
    throw new Error("review workflow source.bytes must be a positive integer");
  }
}

function validateLinkage(workflow) {
  const { linkage, plan, report, source } = workflow;
  exactKeys(linkage, [
    "status",
    "briefMatch",
    "localeMatch",
    "viewportMatch",
    "sourceReferenceMatch",
    "planSha256",
    "designContractSha256",
    "reportSha256",
  ], "review workflow linkage");

  if (linkage.status !== "pass") throw new Error("review workflow linkage.status must be pass");
  for (const field of ["briefMatch", "localeMatch", "viewportMatch", "sourceReferenceMatch"]) {
    if (linkage[field] !== true) throw new Error(`review workflow linkage.${field} must be true`);
  }
  for (const field of ["planSha256", "designContractSha256", "reportSha256"]) {
    digest(linkage[field], `review workflow linkage.${field}`);
  }

  const expectedMatches = {
    briefMatch: plan.brief === report.context.brief,
    localeMatch: plan.context.locale === report.context.locale,
    viewportMatch: isDeepStrictEqual(plan.context.viewports, report.context.viewports),
    sourceReferenceMatch: source.reference === report.subject.source
      && report.sources[0]?.reference === source.reference,
  };
  for (const [field, expected] of Object.entries(expectedMatches)) {
    if (!expected) throw new Error(`review workflow ${field} is inconsistent with its artifacts`);
  }

  const expectedDigests = {
    planSha256: reviewWorkflowDigest(plan),
    designContractSha256: reviewWorkflowDigest(plan.designContract),
    reportSha256: reviewWorkflowDigest(report),
  };
  for (const [field, expected] of Object.entries(expectedDigests)) {
    if (linkage[field] !== expected) {
      throw new Error(`review workflow linkage.${field} does not match its artifact`);
    }
  }
}

function validateStages(stages) {
  if (!isDeepStrictEqual(stages, REVIEW_STAGES)) {
    throw new Error("review workflow stages must preserve the canonical review sequence");
  }
}

function validateNextAction(nextAction, report) {
  exactKeys(
    nextAction,
    ["id", "status", "summary", "approvalRequiredBefore"],
    "review workflow nextAction",
  );
  if (nextAction.id !== "human-review-required" || nextAction.status !== "pending") {
    throw new Error("review workflow nextAction must remain pending human review");
  }
  if (nextAction.summary !== report.summary.nextAction) {
    throw new Error("review workflow nextAction.summary must match the quality report");
  }
  if (!isDeepStrictEqual(nextAction.approvalRequiredBefore, report.approval.requiredBefore)) {
    throw new Error("review workflow nextAction must preserve the quality report approval gates");
  }
}

function validateBoundary(boundary) {
  exactKeys(
    boundary,
    ["mode", "localWrites", "targetRepoMutation", "externalWrites"],
    "review workflow boundary",
  );
  if (boundary.mode !== "read-only"
    || boundary.localWrites !== false
    || boundary.targetRepoMutation !== false
    || boundary.externalWrites !== false) {
    throw new Error("review workflow boundary must remain read-only without writes");
  }
}

export function validateReviewWorkflow(workflow, { source = "" } = {}) {
  exactKeys(workflow, [
    "kind",
    "schemaVersion",
    "status",
    "source",
    "plan",
    "report",
    "linkage",
    "stages",
    "nextAction",
    "boundary",
  ], "review workflow");
  if (workflow.kind !== "design-ai-review-workflow" || workflow.schemaVersion !== 1) {
    throw new Error("review workflow kind and schemaVersion must be design-ai-review-workflow v1");
  }
  if (workflow.status !== "static-review-complete") {
    throw new Error("review workflow status must be static-review-complete");
  }

  validateSource(workflow.source);
  validateStartPayload(workflow.plan);
  validateDesignQualityReport(workflow.report);
  if (workflow.plan.route.id !== "design-review") {
    throw new Error("review workflow plan must use the design-review route");
  }
  if (workflow.report.context.routeId !== "design-engineering-review") {
    throw new Error("review workflow report must use the design-engineering-review route");
  }
  if (source) {
    if (Buffer.byteLength(source, "utf8") !== workflow.source.bytes) {
      throw new Error("review workflow source.bytes does not match the supplied source");
    }
    if (reviewSourceDigest(source) !== workflow.source.sha256) {
      throw new Error("review workflow source.sha256 does not match the supplied source");
    }
  }

  validateLinkage(workflow);
  validateStages(workflow.stages);
  validateNextAction(workflow.nextAction, workflow.report);
  validateBoundary(workflow.boundary);
  return workflow;
}

export function canonicalReviewStages() {
  return REVIEW_STAGES.map((stage) => ({ ...stage }));
}
