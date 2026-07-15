import { isDeepStrictEqual } from "node:util";

const PILOT_CLASSES = new Set(["internal-dogfood", "external-pilot"]);
const FINDING_DECISIONS = new Set(["accepted", "rejected", "unresolved"]);
const GATE_STATUSES = new Set(["approved", "not-required", "pending"]);
const IMPLEMENTATION_STATUSES = new Set(["complete", "partial", "blocked"]);
const PRODUCTION_STATUSES = new Set(["not-deployed", "deployed-unverified", "production-verified"]);
const CLAIM_CLASSES = ["real", "synthetic", "inferred", "unverified"];

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

function text(value, field, { empty = false } = {}) {
  if (typeof value !== "string" || (!empty && value.trim() === "")) {
    throw new Error(`${field} must be ${empty ? "a string" : "a non-empty string"}`);
  }
}

function timestamp(value, field, { empty = false } = {}) {
  text(value, field, { empty });
  if (empty && value === "") return;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${field} must be a canonical UTC ISO timestamp`);
  }
}

function validateProject(project) {
  exactKeys(project, ["name", "repositoryUrl", "pilotClass"], "pilot record project");
  text(project.name, "pilot record project.name");
  text(project.repositoryUrl, "pilot record project.repositoryUrl");
  if (!PILOT_CLASSES.has(project.pilotClass)) {
    throw new Error("pilot record project.pilotClass is unsupported");
  }
}

function validateConsent(consent) {
  exactKeys(
    consent,
    ["status", "approver", "identity", "reference", "approvedAt", "evidenceCollection", "targetMutation"],
    "pilot record consent",
  );
  if (consent.status !== "approved" || consent.identity !== "self-declared") {
    throw new Error("pilot record consent must be approved and self-declared");
  }
  text(consent.approver, "pilot record consent.approver");
  text(consent.reference, "pilot record consent.reference");
  timestamp(consent.approvedAt, "pilot record consent.approvedAt");
  if (consent.evidenceCollection !== true || consent.targetMutation !== true) {
    throw new Error("pilot record consent must approve evidence collection and target mutation");
  }
}

function validateTimeline(timeline) {
  exactKeys(
    timeline,
    ["pilotStartedAt", "firstUsefulArtifactAt", "implementationCompletedAt"],
    "pilot record timeline",
  );
  timestamp(timeline.pilotStartedAt, "pilot record timeline.pilotStartedAt");
  timestamp(timeline.firstUsefulArtifactAt, "pilot record timeline.firstUsefulArtifactAt");
  timestamp(timeline.implementationCompletedAt, "pilot record timeline.implementationCompletedAt");
  if (timeline.firstUsefulArtifactAt < timeline.pilotStartedAt
    || timeline.implementationCompletedAt < timeline.firstUsefulArtifactAt) {
    throw new Error("pilot record timeline must remain chronological");
  }
}

function validateFindingDecisions(decisions) {
  if (!Array.isArray(decisions)) throw new Error("pilot record findingDecisions must be an array");
  decisions.forEach((decision, index) => {
    const field = `pilot record findingDecisions[${index}]`;
    exactKeys(decision, ["findingId", "decision", "summary", "reference"], field);
    text(decision.findingId, `${field}.findingId`);
    if (!FINDING_DECISIONS.has(decision.decision)) throw new Error(`${field}.decision is unsupported`);
    text(decision.summary, `${field}.summary`);
    text(decision.reference, `${field}.reference`);
  });
  const ids = decisions.map((decision) => decision.findingId);
  if (new Set(ids).size !== ids.length) throw new Error("pilot record findingDecisions must use unique finding ids");
}

function validateApprovalEvents(events) {
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error("pilot record approvalEvents must be a non-empty array");
  }
  events.forEach((event, index) => {
    const field = `pilot record approvalEvents[${index}]`;
    exactKeys(event, ["gateId", "status", "occurredAt", "reference"], field);
    text(event.gateId, `${field}.gateId`);
    if (!GATE_STATUSES.has(event.status)) throw new Error(`${field}.status is unsupported`);
    timestamp(event.occurredAt, `${field}.occurredAt`, { empty: event.status !== "approved" });
    if (event.status !== "approved" && event.occurredAt !== "") {
      throw new Error(`${field}.occurredAt must be empty unless the gate was approved`);
    }
    text(event.reference, `${field}.reference`);
  });
  const ids = events.map((event) => event.gateId);
  if (new Set(ids).size !== ids.length) throw new Error("pilot record approvalEvents must use unique gate ids");
}

function validateOutcome(outcome) {
  exactKeys(outcome, ["implementationStatus", "productionStatus", "feedback"], "pilot record outcome");
  if (!IMPLEMENTATION_STATUSES.has(outcome.implementationStatus)) {
    throw new Error("pilot record outcome.implementationStatus is unsupported");
  }
  if (!PRODUCTION_STATUSES.has(outcome.productionStatus)) {
    throw new Error("pilot record outcome.productionStatus is unsupported");
  }
  exactKeys(outcome.feedback, ["status", "summary", "reference"], "pilot record outcome.feedback");
  if (!["collected", "not-collected"].includes(outcome.feedback.status)) {
    throw new Error("pilot record outcome.feedback.status is unsupported");
  }
  text(outcome.feedback.summary, "pilot record outcome.feedback.summary");
  text(outcome.feedback.reference, "pilot record outcome.feedback.reference", {
    empty: outcome.feedback.status === "not-collected",
  });
  if (outcome.feedback.status === "collected" && outcome.feedback.reference.trim() === "") {
    throw new Error("collected pilot feedback requires a source reference");
  }
}

function validateClaims(claims) {
  if (!Array.isArray(claims) || claims.length !== CLAIM_CLASSES.length) {
    throw new Error("pilot record claims must contain one real, synthetic, inferred, and unverified claim");
  }
  claims.forEach((claim, index) => {
    const field = `pilot record claims[${index}]`;
    exactKeys(claim, ["class", "statement", "reference"], field);
    if (!CLAIM_CLASSES.includes(claim.class)) throw new Error(`${field}.class is unsupported`);
    text(claim.statement, `${field}.statement`);
    text(claim.reference, `${field}.reference`);
  });
  if (!isDeepStrictEqual(claims.map((claim) => claim.class).sort(), [...CLAIM_CLASSES].sort())) {
    throw new Error("pilot record claims must classify every claim class exactly once");
  }
}

export function validatePilotRecord(record) {
  exactKeys(record, [
    "kind", "schemaVersion", "project", "consent", "timeline", "findingDecisions",
    "approvalEvents", "outcome", "claims",
  ], "pilot record");
  if (record.kind !== "design-ai-pilot-record" || record.schemaVersion !== 1) {
    throw new Error("pilot record must be design-ai-pilot-record v1");
  }
  validateProject(record.project);
  validateConsent(record.consent);
  validateTimeline(record.timeline);
  validateFindingDecisions(record.findingDecisions);
  validateApprovalEvents(record.approvalEvents);
  validateOutcome(record.outcome);
  validateClaims(record.claims);
  return record;
}

export const pilotClaimClasses = () => [...CLAIM_CLASSES];
