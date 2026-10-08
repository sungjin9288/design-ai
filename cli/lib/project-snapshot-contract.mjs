// Contract for design-ai-project-snapshot v1 (P17F).
// A snapshot is a small index over existing artifact files: it stores their exact
// byte digests, the cross-artifact links that were checked, the stage those
// artifacts reach, one owner decision, and an optional predecessor snapshot
// digest. It never embeds artifact bodies, so the artifact files stay the only
// source of truth.
const SHA256 = /^[a-f0-9]{64}$/;
const PROJECT_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EVIDENCE_STATUSES = new Set(["evidence-complete", "attention-required", "blocked"]);
const COMPARISON_STATUSES = new Set(["improved", "unchanged", "attention-required", "regressed"]);

export const SNAPSHOT_ARTIFACTS = Object.freeze({
  reviewWorkflow: "design-ai-review-workflow",
  scopeApproval: "design-ai-implementation-scope-approval",
  implementationEvidence: "design-ai-implementation-evidence",
  comparison: "design-ai-review-comparison",
  pilotEvidence: "design-ai-pilot-evidence",
});
// Schema versions each referenced artifact may carry. Review comparisons gained
// v2; every other artifact is still v1.
const ARTIFACT_SCHEMA_VERSIONS = Object.freeze({ comparison: [1, 2] });
export const SNAPSHOT_STAGES = Object.freeze(["reviewed", "scoped", "implemented", "piloted"]);
export const SNAPSHOT_DECISIONS = Object.freeze(["pending", "accepted", "revise", "rejected"]);
export const SNAPSHOT_BOUNDARY = Object.freeze({
  historyDatabase: false,
  embeddedArtifacts: false,
  restore: "read-only",
  automaticLearning: false,
  targetWrites: false,
});

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${field} must be an object`);
  return value;
}

function exactKeys(value, keys, field) {
  object(value, field);
  const actual = Object.keys(value);
  if (actual.length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) {
    throw new Error(`${field} keys must be: ${keys.join(", ")}`);
  }
}

function text(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} must be a non-empty string`);
}

function digest(value, field) {
  if (typeof value !== "string" || !SHA256.test(value)) throw new Error(`${field} must be a SHA-256 hex digest`);
}

function positive(value, field) {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${field} must be a positive integer`);
}

function oneOf(value, allowed, field) {
  if (!allowed.has(value)) throw new Error(`${field} must be one of: ${[...allowed].join(", ")}`);
}

export function timestamp(value, field) {
  text(value, field);
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed) || new Date(parsed).toISOString() !== value) {
    throw new Error(`${field} must be a normalized UTC date-time string`);
  }
}

// The stage follows from which artifacts are present, never from a declaration.
export function derivedStage(artifacts) {
  if (artifacts.pilotEvidence) return "piloted";
  if (artifacts.implementationEvidence) return "implemented";
  if (artifacts.scopeApproval) return "scoped";
  return "reviewed";
}

// The links a snapshot must carry are fixed by which artifacts are present. The
// builder checks each verified link from bytes; this list is what it records.
export function expectedLinks(artifacts) {
  const links = [];
  if (artifacts.scopeApproval) {
    links.push({ from: "scopeApproval", to: "reviewWorkflow", status: "verified",
      check: "intake receipt reviewWorkflowSha256 equals the review workflow bytes" });
  }
  if (artifacts.implementationEvidence) {
    links.push({ from: "implementationEvidence", to: "scopeApproval", status: "verified",
      check: "embedded approval sha256 equals the scope approval bytes" });
  }
  if (artifacts.comparison) {
    links.push({ from: "comparison", to: "reviewWorkflow", status: "verified",
      check: "comparison baseline value equals the review workflow quality report" });
    if (artifacts.implementationEvidence) {
      links.push({ from: "comparison", to: "implementationEvidence", status: "unverified",
        check: "no contract binds the candidate quality report to the implemented source" });
    }
  }
  if (artifacts.pilotEvidence) {
    links.push({ from: "pilotEvidence", to: "implementationEvidence", status: "verified",
      check: "embedded implementation evidence and review workflow digests equal those bytes; same repository" });
  }
  return links;
}

function validateReference(reference, field, kind, versions = [1]) {
  exactKeys(reference, ["reference", "sha256", "bytes", "kind", "schemaVersion"], field);
  text(reference.reference, `${field}.reference`);
  digest(reference.sha256, `${field}.sha256`);
  positive(reference.bytes, `${field}.bytes`);
  if (reference.kind !== kind) throw new Error(`${field}.kind must be ${kind}`);
  if (!versions.includes(reference.schemaVersion)) throw new Error(`${field}.schemaVersion must be ${versions.join(" or ")}`);
}

function validateArtifacts(artifacts, field) {
  exactKeys(artifacts, Object.keys(SNAPSHOT_ARTIFACTS), field);
  for (const [name, kind] of Object.entries(SNAPSHOT_ARTIFACTS)) {
    if (artifacts[name] === null && name !== "reviewWorkflow") continue;
    validateReference(artifacts[name], `${field}.${name}`, kind, ARTIFACT_SCHEMA_VERSIONS[name]);
  }
  if (artifacts.implementationEvidence && !artifacts.scopeApproval) {
    throw new Error(`${field}: implementation evidence requires the scope approval it implements`);
  }
  if (artifacts.pilotEvidence && !artifacts.implementationEvidence) {
    throw new Error(`${field}: pilot evidence requires the implementation evidence it measures`);
  }
}

function validateBaseline(baseline, field) {
  exactKeys(baseline, ["repositoryUrl", "branch", "head"], field);
  text(baseline.repositoryUrl, `${field}.repositoryUrl`);
  text(baseline.branch, `${field}.branch`);
  // The proposal records the commit hash, or an empty string for a repository without commits.
  if (typeof baseline.head !== "string") throw new Error(`${field}.head must be a commit hash string`);
}

// Each optional identity field is present exactly when its artifact is.
function presentExactly(value, present, field, check) {
  if (present !== (value !== null)) throw new Error(`${field} must be present exactly when its artifact is`);
  if (value !== null) check(value, field);
}

function validateIdentity(identity, field, artifacts) {
  exactKeys(identity, ["sourceSha256", "designContractSha256", "reportSha256", "scopeDigest", "baseline",
    "implementationStatus", "comparisonStatus", "pilotStatus"], field);
  for (const key of ["sourceSha256", "designContractSha256", "reportSha256"]) digest(identity[key], `${field}.${key}`);
  presentExactly(identity.scopeDigest, Boolean(artifacts.scopeApproval), `${field}.scopeDigest`, digest);
  presentExactly(identity.baseline, Boolean(artifacts.scopeApproval), `${field}.baseline`, validateBaseline);
  presentExactly(identity.implementationStatus, Boolean(artifacts.implementationEvidence), `${field}.implementationStatus`,
    (value, where) => oneOf(value, EVIDENCE_STATUSES, where));
  presentExactly(identity.comparisonStatus, Boolean(artifacts.comparison), `${field}.comparisonStatus`,
    (value, where) => oneOf(value, COMPARISON_STATUSES, where));
  presentExactly(identity.pilotStatus, Boolean(artifacts.pilotEvidence), `${field}.pilotStatus`,
    (value, where) => oneOf(value, EVIDENCE_STATUSES, where));
}

function validateDecision(decision, field, snapshot) {
  exactKeys(decision, ["status", "owner", "decidedAt", "rationale"], field);
  oneOf(decision.status, new Set(SNAPSHOT_DECISIONS), `${field}.status`);
  exactKeys(decision.owner, ["name", "identity", "reference"], `${field}.owner`);
  text(decision.owner.name, `${field}.owner.name`);
  text(decision.owner.reference, `${field}.owner.reference`);
  if (decision.owner.identity !== "self-declared") throw new Error(`${field}.owner.identity must be self-declared`);
  if (typeof decision.rationale !== "string") throw new Error(`${field}.rationale must be a string`);
  if (decision.status === "pending") {
    if (decision.decidedAt !== null) throw new Error(`${field}.decidedAt must be null while the decision is pending`);
    return;
  }
  timestamp(decision.decidedAt, `${field}.decidedAt`);
  text(decision.rationale, `${field}.rationale`);
  if (Date.parse(decision.decidedAt) > Date.parse(snapshot.recordedAt)) {
    throw new Error(`${field}.decidedAt cannot be later than the snapshot's recordedAt`);
  }
  const blocked = [snapshot.identity.implementationStatus, snapshot.identity.pilotStatus].includes("blocked");
  if (decision.status === "accepted" && blocked) {
    throw new Error(`${field}: blocked evidence cannot be accepted; record revise or rejected instead`);
  }
}

// Rules every predecessor-to-successor edge must satisfy, for building and for reading a chain.
export function successorViolations(previous, previousBytes, next) {
  const violations = [];
  if (next.predecessor.bytes !== previousBytes) violations.push("predecessor size does not match its bytes");
  if (previous.project.id !== next.project.id) violations.push("the predecessor belongs to a different project");
  if (previous.decision.status === "pending") {
    violations.push("a successor can only follow a snapshot whose owner decision is recorded");
  }
  if (Date.parse(previous.recordedAt) >= Date.parse(next.recordedAt)) {
    violations.push("a successor must be recorded after its predecessor");
  }
  const [before, after] = [previous.identity.baseline, next.identity.baseline];
  if (before && after && before.repositoryUrl !== after.repositoryUrl) {
    violations.push(`the repository changed from ${before.repositoryUrl} to ${after.repositoryUrl}`);
  }
  return violations;
}

export function validateProjectSnapshot(snapshot) {
  exactKeys(snapshot, ["kind", "schemaVersion", "project", "recordedAt", "predecessor", "artifacts", "identity",
    "links", "stage", "decision", "boundary"], "project snapshot");
  if (snapshot.kind !== "design-ai-project-snapshot" || snapshot.schemaVersion !== 1) {
    throw new Error("project snapshot must be design-ai-project-snapshot schemaVersion 1");
  }
  exactKeys(snapshot.project, ["id"], "project snapshot.project");
  if (typeof snapshot.project.id !== "string" || !PROJECT_ID.test(snapshot.project.id)) {
    throw new Error("project snapshot.project.id must be lowercase alphanumeric words joined by hyphens");
  }
  timestamp(snapshot.recordedAt, "project snapshot.recordedAt");
  if (snapshot.predecessor !== null) {
    exactKeys(snapshot.predecessor, ["reference", "sha256", "bytes"], "project snapshot.predecessor");
    text(snapshot.predecessor.reference, "project snapshot.predecessor.reference");
    digest(snapshot.predecessor.sha256, "project snapshot.predecessor.sha256");
    positive(snapshot.predecessor.bytes, "project snapshot.predecessor.bytes");
  }
  validateArtifacts(snapshot.artifacts, "project snapshot.artifacts");
  validateIdentity(snapshot.identity, "project snapshot.identity", snapshot.artifacts);
  if (JSON.stringify(snapshot.links) !== JSON.stringify(expectedLinks(snapshot.artifacts))) {
    throw new Error("project snapshot.links must be exactly the links its artifacts require");
  }
  if (snapshot.stage !== derivedStage(snapshot.artifacts)) {
    throw new Error(`project snapshot.stage must be ${derivedStage(snapshot.artifacts)} for these artifacts`);
  }
  validateDecision(snapshot.decision, "project snapshot.decision", snapshot);
  if (JSON.stringify(snapshot.boundary) !== JSON.stringify(SNAPSHOT_BOUNDARY)) {
    throw new Error("project snapshot.boundary must state the fixed read-only boundary");
  }
  return snapshot;
}
