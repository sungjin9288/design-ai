import { isDeepStrictEqual } from "node:util";

import { validateImplementationEvidence } from "./implementation-evidence-contract.mjs";
import { validateSourceArtifact } from "./implementation-scope-contract.mjs";
import { validatePilotRecord } from "./pilot-record-contract.mjs";
import { validateReviewWorkflow } from "./review-workflow-contract.mjs";

const STATUSES = new Set(["evidence-complete", "attention-required", "blocked"]);

export function expectedPilotMetrics(record, implementationEvidence) {
  const accepted = record.findingDecisions.filter((item) => item.decision === "accepted").length;
  const rejected = record.findingDecisions.filter((item) => item.decision === "rejected").length;
  const unresolved = record.findingDecisions.filter((item) => item.decision === "unresolved").length;
  const evaluated = accepted + rejected;
  const approved = record.approvalEvents.filter((item) => item.status === "approved").length;
  const notRequired = record.approvalEvents.filter((item) => item.status === "not-required").length;
  const pending = record.approvalEvents.filter((item) => item.status === "pending").length;
  return {
    timeToFirstUsefulArtifact: {
      milliseconds: new Date(record.timeline.firstUsefulArtifactAt) - new Date(record.timeline.pilotStartedAt),
      startedAt: record.timeline.pilotStartedAt,
      completedAt: record.timeline.firstUsefulArtifactAt,
    },
    findingPrecision: {
      accepted,
      rejected,
      unresolved,
      evaluated,
      precision: evaluated === 0 ? null : accepted / evaluated,
    },
    approvalFriction: {
      total: record.approvalEvents.length,
      approved,
      notRequired,
      pending,
    },
    implementation: {
      status: record.outcome.implementationStatus,
      evidenceStatus: implementationEvidence.status,
    },
    unresolvedRisk: {
      count: implementationEvidence.remainingRisks.length,
      items: structuredClone(implementationEvidence.remainingRisks),
    },
  };
}

export function expectedPilotClaims(record) {
  return Object.fromEntries(["real", "synthetic", "inferred", "unverified"].map((claimClass) => [
    claimClass,
    record.claims
      .filter((claim) => claim.class === claimClass)
      .map(({ statement, reference }) => ({ statement, reference })),
  ]));
}

export function expectedPilotIssues(record, implementationEvidence, reviewWorkflow) {
  const issues = [];
  const approval = implementationEvidence.approval.value;
  const intake = approval.proposal.value.intake.value;
  const add = (level, id, message) => issues.push({ level, id, message });

  if (reviewWorkflow.sha256 !== intake.receipt.reviewWorkflowSha256) {
    add("fail", "pilot-review-workflow-drift", "P6 review workflow does not match the SHA-256 link preserved by the P9 intake.");
  }
  if (record.project.repositoryUrl !== implementationEvidence.observed.repositoryUrl) {
    add("fail", "pilot-project-repository-drift", "Pilot project repository does not match the P11 implementation evidence.");
  }
  if (record.timeline.implementationCompletedAt !== implementationEvidence.request.value.implementationCompletedAt) {
    add("fail", "pilot-completion-time-drift", "Pilot completion time does not match the P11 implementation evidence request.");
  }

  const findingIds = reviewWorkflow.value.report.findings.map((finding) => finding.id);
  const decisionIds = record.findingDecisions.map((decision) => decision.findingId);
  if (!isDeepStrictEqual(findingIds, decisionIds)) {
    add("fail", "pilot-finding-review-incomplete", "Pilot finding decisions must preserve every P6 finding in original order.");
  }

  const expectedEvents = approval.approvalGates.map((gate) => ({ gateId: gate.id, status: gate.status }));
  const actualEvents = record.approvalEvents.map((event) => ({ gateId: event.gateId, status: event.status }));
  if (!isDeepStrictEqual(expectedEvents, actualEvents)) {
    add("fail", "pilot-approval-history-drift", "Pilot approval events must preserve every P10 gate and its status in original order.");
  }

  const expectedImplementationStatus = implementationEvidence.status === "evidence-complete"
    ? "complete"
    : implementationEvidence.status === "attention-required" ? "partial" : "blocked";
  if (record.outcome.implementationStatus !== expectedImplementationStatus) {
    add("fail", "pilot-implementation-status-drift", "Pilot implementation status overstates or understates the P11 evidence status.");
  }
  if (implementationEvidence.status !== "evidence-complete") {
    add("warn", "pilot-implementation-evidence-incomplete", "P11 implementation evidence still contains gaps or blocking issues.");
  }
  if (record.findingDecisions.some((decision) => decision.decision === "unresolved")) {
    add("warn", "pilot-finding-decision-unresolved", "At least one reviewed finding remains unresolved.");
  }
  if (record.outcome.productionStatus === "production-verified") {
    add("warn", "pilot-production-proof-not-verified", "This read-only operation cannot independently verify a production-quality claim.");
  }
  if (record.outcome.feedback.status === "collected") {
    add("warn", "pilot-feedback-source-not-verified", "Feedback is source-referenced but respondent identity and consent to publish are not independently verified.");
  }
  return issues;
}

export function expectedPilotStatus(issues) {
  return issues.some((issue) => issue.level === "fail")
    ? "blocked"
    : issues.length > 0 ? "attention-required" : "evidence-complete";
}

export function expectedPilotNextAction(status) {
  if (status === "blocked") {
    return { id: "pilot-evidence-repair-required", status: "blocked", summary: "Repair source or linkage drift before using this pilot evidence." };
  }
  if (status === "attention-required") {
    return { id: "pilot-evidence-gaps-remain", status: "pending", summary: "Resolve or explicitly retain the listed evidence gaps before making broader claims." };
  }
  return { id: "pilot-evidence-complete", status: "complete", summary: "The bounded pilot evidence is complete; broader adoption and production claims remain outside this contract." };
}

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${field} must be an object`);
  return value;
}

function exactKeys(value, keys, field) {
  const actual = Object.keys(object(value, field)).sort();
  const expected = [...keys].sort();
  if (!isDeepStrictEqual(actual, expected)) throw new Error(`${field} keys must be exactly: ${keys.join(", ")}`);
}

function text(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field} must be a non-empty string`);
}

function count(value, field) {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${field} must be a non-negative integer`);
}

function validateMetrics(metrics) {
  exactKeys(metrics, ["timeToFirstUsefulArtifact", "findingPrecision", "approvalFriction", "implementation", "unresolvedRisk"], "pilot evidence metrics");

  exactKeys(metrics.timeToFirstUsefulArtifact, ["milliseconds", "startedAt", "completedAt"], "pilot evidence time metric");
  count(metrics.timeToFirstUsefulArtifact.milliseconds, "pilot evidence time metric.milliseconds");
  text(metrics.timeToFirstUsefulArtifact.startedAt, "pilot evidence time metric.startedAt");
  text(metrics.timeToFirstUsefulArtifact.completedAt, "pilot evidence time metric.completedAt");

  exactKeys(metrics.findingPrecision, ["accepted", "rejected", "unresolved", "evaluated", "precision"], "pilot evidence finding precision");
  for (const key of ["accepted", "rejected", "unresolved", "evaluated"]) count(metrics.findingPrecision[key], `pilot evidence finding precision.${key}`);
  if (metrics.findingPrecision.precision !== null
    && (typeof metrics.findingPrecision.precision !== "number"
      || metrics.findingPrecision.precision < 0
      || metrics.findingPrecision.precision > 1)) {
    throw new Error("pilot evidence finding precision.precision must be null or between 0 and 1");
  }

  exactKeys(metrics.approvalFriction, ["total", "approved", "notRequired", "pending"], "pilot evidence approval friction");
  for (const key of ["total", "approved", "notRequired", "pending"]) count(metrics.approvalFriction[key], `pilot evidence approval friction.${key}`);

  exactKeys(metrics.implementation, ["status", "evidenceStatus"], "pilot evidence implementation");
  text(metrics.implementation.status, "pilot evidence implementation.status");
  text(metrics.implementation.evidenceStatus, "pilot evidence implementation.evidenceStatus");

  exactKeys(metrics.unresolvedRisk, ["count", "items"], "pilot evidence unresolved risk");
  count(metrics.unresolvedRisk.count, "pilot evidence unresolved risk.count");
  if (!Array.isArray(metrics.unresolvedRisk.items)) throw new Error("pilot evidence unresolved risk.items must be an array");
}

function validateClaims(claims) {
  exactKeys(claims, ["real", "synthetic", "inferred", "unverified"], "pilot evidence claims");
  for (const [claimClass, items] of Object.entries(claims)) {
    if (!Array.isArray(items) || items.length !== 1) throw new Error(`pilot evidence claims.${claimClass} must contain one claim`);
    exactKeys(items[0], ["statement", "reference"], `pilot evidence claims.${claimClass}[0]`);
    text(items[0].statement, `pilot evidence claims.${claimClass}[0].statement`);
    text(items[0].reference, `pilot evidence claims.${claimClass}[0].reference`);
  }
}

function validateIssues(issues) {
  if (!Array.isArray(issues)) throw new Error("pilot evidence issues must be an array");
  issues.forEach((issue, index) => {
    const field = `pilot evidence issues[${index}]`;
    exactKeys(issue, ["level", "id", "message"], field);
    if (!["warn", "fail"].includes(issue.level)) throw new Error(`${field}.level is unsupported`);
    text(issue.id, `${field}.id`);
    text(issue.message, `${field}.message`);
  });
}

function validateBoundary(boundary) {
  exactKeys(boundary, [
    "mode", "localWrites", "targetRepoMutation", "externalWrites", "networkCalls",
    "identityVerified", "feedbackVerified", "adoptionEstablished", "productionQualityEstablished",
  ], "pilot evidence boundary");
  if (boundary.mode !== "read-only-pilot-evidence"
    || boundary.localWrites !== false
    || boundary.targetRepoMutation !== false
    || boundary.externalWrites !== false
    || boundary.networkCalls !== false
    || boundary.identityVerified !== false
    || boundary.feedbackVerified !== false
    || boundary.adoptionEstablished !== false
    || boundary.productionQualityEstablished !== false) {
    throw new Error("pilot evidence boundary exceeds source-backed read-only evidence");
  }
}

export function validatePilotEvidence(evidence) {
  exactKeys(evidence, [
    "kind", "schemaVersion", "status", "implementationEvidence", "reviewWorkflow", "record", "project", "consent",
    "metrics", "claims", "issues", "nextAction", "boundary",
  ], "pilot evidence");
  if (evidence.kind !== "design-ai-pilot-evidence" || evidence.schemaVersion !== 1) {
    throw new Error("pilot evidence must be design-ai-pilot-evidence v1");
  }
  if (!STATUSES.has(evidence.status)) throw new Error("pilot evidence status is unsupported");
  validateSourceArtifact(evidence.implementationEvidence, "pilot evidence implementationEvidence", validateImplementationEvidence);
  validateSourceArtifact(evidence.reviewWorkflow, "pilot evidence reviewWorkflow", validateReviewWorkflow);
  validateSourceArtifact(evidence.record, "pilot evidence record", validatePilotRecord);
  if (!isDeepStrictEqual(evidence.project, evidence.record.value.project)
    || !isDeepStrictEqual(evidence.consent, evidence.record.value.consent)) {
    throw new Error("pilot evidence project and consent changed from the record");
  }
  validateMetrics(evidence.metrics);
  validateClaims(evidence.claims);
  validateIssues(evidence.issues);
  const expectedMetrics = expectedPilotMetrics(evidence.record.value, evidence.implementationEvidence.value);
  if (!isDeepStrictEqual(evidence.metrics, expectedMetrics)) {
    throw new Error("pilot evidence metrics do not match their exact sources");
  }
  const expectedClaims = expectedPilotClaims(evidence.record.value);
  if (!isDeepStrictEqual(evidence.claims, expectedClaims)) {
    throw new Error("pilot evidence claims do not match the pilot record");
  }
  const expectedIssues = expectedPilotIssues(
    evidence.record.value,
    evidence.implementationEvidence.value,
    evidence.reviewWorkflow,
  );
  if (!isDeepStrictEqual(evidence.issues, expectedIssues)) {
    throw new Error("pilot evidence issues do not match their exact sources");
  }
  const expectedStatus = expectedPilotStatus(expectedIssues);
  if (evidence.status !== expectedStatus) throw new Error("pilot evidence status does not match its issues");
  exactKeys(evidence.nextAction, ["id", "status", "summary"], "pilot evidence nextAction");
  text(evidence.nextAction.id, "pilot evidence nextAction.id");
  text(evidence.nextAction.status, "pilot evidence nextAction.status");
  text(evidence.nextAction.summary, "pilot evidence nextAction.summary");
  if (!isDeepStrictEqual(evidence.nextAction, expectedPilotNextAction(expectedStatus))) {
    throw new Error("pilot evidence nextAction does not match its status");
  }
  validateBoundary(evidence.boundary);
  return evidence;
}
