// P17F project continuity: build, verify, and read chains of project snapshots
// from existing artifact bytes. Nothing here writes a file, keeps a history
// database, or restores state; `inspectProjectSnapshotChain` only reports what a
// restore would need.
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { validateImplementationEvidence } from "./implementation-evidence-contract.mjs";
import { validateImplementationScopeApproval } from "./implementation-scope-approval-contract.mjs";
import { validatePilotEvidence } from "./pilot-evidence-contract.mjs";
import {
  SNAPSHOT_ARTIFACTS,
  SNAPSHOT_BOUNDARY,
  derivedStage,
  expectedLinks,
  successorViolations,
  validateProjectSnapshot,
} from "./project-snapshot-contract.mjs";
import { validateReviewComparison } from "./review-comparison-contract.mjs";
import { validateReviewWorkflow } from "./review-workflow-contract.mjs";

const VALIDATORS = Object.freeze({
  reviewWorkflow: (value) => validateReviewWorkflow(value),
  scopeApproval: validateImplementationScopeApproval,
  implementationEvidence: validateImplementationEvidence,
  comparison: validateReviewComparison,
  pilotEvidence: validatePilotEvidence,
});
// Pilot issues that mean the pilot record describes different work.
const FOREIGN_PILOT_ISSUES = new Set(["pilot-project-repository-drift", "pilot-review-workflow-drift"]);
const DECLARED_FIELDS = Object.freeze(["project.id", "recordedAt", "decision"]);

function sha256(source) {
  return createHash("sha256").update(source, "utf8").digest("hex");
}

function parse(input, name) {
  if (!input || typeof input.reference !== "string" || !input.reference.trim() || typeof input.source !== "string") {
    throw new Error(`${name} must be { reference, source } with the artifact's exact file text`);
  }
  let value;
  try {
    value = JSON.parse(input.source);
  } catch (error) {
    throw new Error(`${name} is not valid JSON: ${error.message}`);
  }
  return { reference: input.reference, source: input.source, value, sha256: sha256(input.source),
    bytes: Buffer.byteLength(input.source, "utf8") };
}

function loadArtifacts(sources) {
  const unknown = Object.keys(sources || {}).filter((name) => !Object.hasOwn(SNAPSHOT_ARTIFACTS, name));
  if (unknown.length) throw new Error(`unknown snapshot artifact(s): ${unknown.join(", ")}`);
  if (!sources?.reviewWorkflow) throw new Error("a project snapshot needs the review workflow");
  const loaded = {};
  for (const [name, kind] of Object.entries(SNAPSHOT_ARTIFACTS)) {
    if (!sources[name]) {
      loaded[name] = null;
      continue;
    }
    const artifact = parse(sources[name], name);
    if (artifact.value?.kind !== kind) throw new Error(`${name} must be a ${kind} artifact`);
    VALIDATORS[name](artifact.value);
    loaded[name] = artifact;
  }
  if (loaded.implementationEvidence && !loaded.scopeApproval) {
    throw new Error("implementation evidence requires the scope approval it implements");
  }
  if (loaded.pilotEvidence && !loaded.implementationEvidence) {
    throw new Error("pilot evidence requires the implementation evidence it measures");
  }
  return loaded;
}

function requireLink(condition, message) {
  if (!condition) throw new Error(`project snapshot link broken: ${message}`);
}

// Prove every verifiable link from exact bytes; a broken link rejects the snapshot,
// because it would join artifacts from different work.
function checkLinks(a) {
  if (a.scopeApproval) {
    requireLink(a.scopeApproval.value.proposal.value.intake.value.receipt.reviewWorkflowSha256 === a.reviewWorkflow.sha256,
      "the scope approval was granted for a different review workflow");
  }
  if (a.implementationEvidence) {
    requireLink(a.implementationEvidence.value.approval.sha256 === a.scopeApproval.sha256,
      "the implementation evidence embeds a different scope approval");
  }
  if (a.comparison) {
    requireLink(isDeepStrictEqual(a.comparison.value.baseline.value, a.reviewWorkflow.value.report),
      "the comparison baseline is not the reviewed quality report");
  }
  if (a.pilotEvidence) {
    const pilot = a.pilotEvidence.value;
    requireLink(pilot.implementationEvidence.sha256 === a.implementationEvidence.sha256,
      "the pilot evidence embeds different implementation evidence");
    requireLink(pilot.reviewWorkflow.sha256 === a.reviewWorkflow.sha256, "the pilot evidence embeds a different review workflow");
    const foreign = pilot.issues.filter((issue) => issue.level === "fail" && FOREIGN_PILOT_ISSUES.has(issue.id));
    requireLink(!foreign.length, `the pilot record describes different work (${foreign.map((issue) => issue.id).join(", ")})`);
  }
}

function reference(artifact) {
  if (!artifact) return null;
  return { reference: artifact.reference, sha256: artifact.sha256, bytes: artifact.bytes,
    kind: artifact.value.kind, schemaVersion: artifact.value.schemaVersion };
}

function identityOf(a) {
  const workflow = a.reviewWorkflow.value;
  const baseline = a.scopeApproval?.value.proposal.value.baseline;
  return {
    sourceSha256: workflow.source.sha256,
    designContractSha256: workflow.linkage.designContractSha256,
    reportSha256: workflow.linkage.reportSha256,
    scopeDigest: a.scopeApproval ? a.scopeApproval.value.decision.scopeDigest : null,
    baseline: baseline ? { repositoryUrl: baseline.repositoryUrl, branch: baseline.branch, head: baseline.head } : null,
    implementationStatus: a.implementationEvidence ? a.implementationEvidence.value.status : null,
    comparisonStatus: a.comparison ? a.comparison.value.status : null,
    pilotStatus: a.pilotEvidence ? a.pilotEvidence.value.status : null,
  };
}

export function buildProjectSnapshot({ project, recordedAt, sources, predecessor = null, decision }) {
  const artifacts = loadArtifacts(sources);
  checkLinks(artifacts);
  const references = Object.fromEntries(Object.keys(SNAPSHOT_ARTIFACTS).map((name) => [name, reference(artifacts[name])]));
  const previous = predecessor ? parse(predecessor, "predecessor") : null;
  if (previous) validateProjectSnapshot(previous.value);
  const snapshot = validateProjectSnapshot({
    kind: "design-ai-project-snapshot",
    schemaVersion: 1,
    project: { id: project?.id },
    recordedAt,
    predecessor: previous ? { reference: previous.reference, sha256: previous.sha256, bytes: previous.bytes } : null,
    artifacts: references,
    identity: identityOf(artifacts),
    links: expectedLinks(references),
    stage: derivedStage(references),
    decision: structuredClone(decision),
    boundary: { ...SNAPSHOT_BOUNDARY },
  });
  const violations = previous ? successorViolations(previous.value, previous.bytes, snapshot) : [];
  if (violations.length) throw new Error(`invalid successor: ${violations.join("; ")}`);
  return snapshot;
}

function artifactDrift(recordedArtifacts, sources) {
  const drift = [];
  for (const [name, recorded] of Object.entries(recordedArtifacts)) {
    const supplied = sources?.[name];
    if (supplied && typeof supplied.source !== "string") drift.push(`${name} was supplied without its file text`);
    else if (!recorded && supplied) drift.push(`${name} was supplied but the snapshot records none`);
    else if (recorded && !supplied) drift.push(`${name} is missing; expected ${recorded.reference} at ${recorded.sha256}`);
    else if (recorded && sha256(supplied.source) !== recorded.sha256) drift.push(`${name} bytes changed since the snapshot (${recorded.reference})`);
    else if (recorded && supplied.reference !== recorded.reference) drift.push(`${name} reference changed to ${supplied.reference}`);
  }
  const unknown = Object.keys(sources || {}).filter((name) => !Object.hasOwn(SNAPSHOT_ARTIFACTS, name));
  return drift.concat(unknown.map((name) => `${name} is not a snapshot artifact`));
}

// Recheck a stored snapshot against the artifact files as they are now. Declared
// fields (project, recordedAt, decision) are copied, not proven, and the result says so.
export function verifyProjectSnapshot(snapshotInput, sources, { predecessor = null } = {}) {
  const snapshot = parse(snapshotInput, "snapshot");
  validateProjectSnapshot(snapshot.value);
  const drift = artifactDrift(snapshot.value.artifacts, sources);
  if (snapshot.value.predecessor && !predecessor) drift.push("the recorded predecessor was not supplied");
  if (!snapshot.value.predecessor && predecessor) drift.push("a predecessor was supplied but the snapshot records none");
  if (!drift.length) {
    try {
      const rebuilt = buildProjectSnapshot({ project: snapshot.value.project, recordedAt: snapshot.value.recordedAt,
        sources, predecessor, decision: snapshot.value.decision });
      const changed = Object.keys(rebuilt).filter((key) => !isDeepStrictEqual(rebuilt[key], snapshot.value[key]));
      drift.push(...changed.map((key) => `${key} does not match a rebuild from the supplied artifacts`));
    } catch (error) {
      drift.push(`rebuild failed: ${error.message}`);
    }
  }
  return { kind: "design-ai-project-snapshot-verification", schemaVersion: 1, snapshotSha256: snapshot.sha256,
    status: drift.length ? "drift" : "verified", drift, notProvenByArtifacts: [...DECLARED_FIELDS] };
}

function chainIssues(nodes) {
  const issues = [];
  const byDigest = new Map(nodes.map((node) => [node.sha256, node]));
  const successors = new Map(nodes.map((node) => [node.sha256, []]));
  let missing = 0;
  for (const node of nodes) {
    const link = node.value.predecessor;
    if (!link) continue;
    const previous = byDigest.get(link.sha256);
    if (!previous) {
      missing += 1;
      issues.push(`${node.reference}: predecessor ${link.sha256} is not among the supplied snapshots`);
      continue;
    }
    successors.get(previous.sha256).push(node.sha256);
    issues.push(...successorViolations(previous.value, previous.bytes, node.value).map((v) => `${node.reference}: ${v}`));
  }
  for (const [digestValue, next] of successors) {
    if (next.length > 1) issues.push(`${byDigest.get(digestValue).reference}: forked into ${next.length} successors`);
  }
  const roots = nodes.filter((node) => !node.value.predecessor);
  if (!missing && roots.length !== 1) issues.push(`expected exactly one root snapshot, found ${roots.length}`);
  return { issues, successors, byDigest };
}

function orderFrom(start, successors, byDigest) {
  const order = [];
  for (let node = start; node;) {
    order.push({ reference: node.reference, sha256: node.sha256, stage: node.value.stage, decision: node.value.decision.status });
    const next = successors.get(node.sha256);
    node = next.length === 1 ? byDigest.get(next[0]) : null;
  }
  return order;
}

// Read-only restore plan: which snapshot is the head and which exact artifact
// files, by reference and digest, a restore would need. Nothing is written.
export function inspectProjectSnapshotChain(snapshotInputs) {
  if (!Array.isArray(snapshotInputs) || !snapshotInputs.length) throw new Error("supply at least one snapshot");
  const nodes = snapshotInputs.map((input, index) => {
    const node = parse(input, `snapshot ${index + 1}`);
    validateProjectSnapshot(node.value);
    return node;
  });
  const projects = new Set(nodes.map((node) => node.value.project.id));
  if (projects.size !== 1) throw new Error(`snapshots span more than one project: ${[...projects].join(", ")}`);
  if (new Set(nodes.map((node) => node.sha256)).size !== nodes.length) throw new Error("the same snapshot was supplied more than once");
  const { issues, successors, byDigest } = chainIssues(nodes);
  const start = nodes.find((node) => !node.value.predecessor || !byDigest.has(node.value.predecessor.sha256));
  const order = start ? orderFrom(start, successors, byDigest) : [];
  const head = !issues.length && order.length === nodes.length ? byDigest.get(order.at(-1).sha256) : null;
  return {
    kind: "design-ai-project-snapshot-chain",
    schemaVersion: 1,
    project: { id: [...projects][0] },
    status: head ? "linear" : "needs-review",
    issues,
    order,
    restore: {
      mode: "read-only-plan",
      writes: false,
      head: head ? { reference: head.reference, sha256: head.sha256, stage: head.value.stage,
        decision: head.value.decision.status } : null,
      artifacts: head ? Object.values(head.value.artifacts).filter(Boolean)
        .map(({ reference: ref, sha256: digestValue, kind }) => ({ reference: ref, sha256: digestValue, kind })) : [],
    },
  };
}
