import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { validateImplementationScopeRequest } from "./implementation-scope-request-contract.mjs";
import { validateTargetRepoIntake } from "./target-repo-intake-contract.mjs";

const DIGEST_PATTERN = /^[a-f0-9]{64}$/;
const GATE_STATUSES = new Set(["pending", "not-required"]);

export const IMPLEMENTATION_GATE_IDS = Object.freeze([
  "source-inspection",
  "target-files",
  "pre-existing-changes",
  "dependency-changes",
  "migration-files",
  "generated-files",
]);

export const RELEASE_GATE_IDS = Object.freeze([
  "external-writes",
  "commit",
  "push",
  "deployment",
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

export function sourceDigest(source) {
  return createHash("sha256").update(source).digest("hex");
}

export function valueDigest(value) {
  return sourceDigest(JSON.stringify(value));
}

function parseSource(source, field) {
  text(source, `${field}.source`);
  try {
    return JSON.parse(source);
  } catch {
    throw new Error(`${field}.source must be valid JSON`);
  }
}

export function sourceArtifact(source, value, reference) {
  return {
    reference,
    sha256: sourceDigest(source),
    bytes: Buffer.byteLength(source, "utf8"),
    source,
    value,
  };
}

export function validateSourceArtifact(artifact, field, validateValue) {
  exactKeys(artifact, ["reference", "sha256", "bytes", "source", "value"], field);
  text(artifact.reference, `${field}.reference`);
  if (!DIGEST_PATTERN.test(artifact.sha256)) {
    throw new Error(`${field}.sha256 must be a lowercase SHA-256 digest`);
  }
  if (!Number.isInteger(artifact.bytes) || artifact.bytes < 1) {
    throw new Error(`${field}.bytes must be a positive integer`);
  }
  if (Buffer.byteLength(artifact.source, "utf8") !== artifact.bytes
    || sourceDigest(artifact.source) !== artifact.sha256) {
    throw new Error(`${field} source identity changed`);
  }
  const parsed = parseSource(artifact.source, field);
  if (!isDeepStrictEqual(parsed, artifact.value)) {
    throw new Error(`${field}.value does not match its source JSON`);
  }
  validateValue(artifact.value);
}

function gate(id, required, summary) {
  return { id, status: required ? "pending" : "not-required", summary };
}

export function expectedScopeGates(request) {
  return [
    gate("source-inspection", true, "Read only the approved file selectors during implementation."),
    gate("target-files", true, "Mutate only the approved change and generated-file selectors."),
    gate("pre-existing-changes", request.preExistingChanges.length > 0, "Respect the recorded ownership and handling of every pre-existing change."),
    gate("dependency-changes", request.dependencies.length > 0, "Apply only the declared dependency changes; installation and network access remain separate."),
    gate("migration-files", request.migrations.length > 0, "Create or edit only declared migration files; running external-state migrations remains separate."),
    gate("generated-files", request.files.generated.length > 0, "Write only the declared generated-file selectors."),
    gate(
      "external-writes",
      request.externalWrites.length > 0
        || request.migrations.some((migration) => migration.affectsExternalState),
      "External writes require a separate explicit approval and execution record.",
    ),
    gate("commit", request.release.commit, "Creating a commit requires a separate explicit gate."),
    gate("push", request.release.push, "Pushing changes requires a separate explicit gate."),
    gate("deployment", request.release.deployment, "Deployment requires a separate explicit gate."),
  ];
}

export function expectedScopeIssues(intake, request) {
  const issues = [];
  if (intake.status === "blocked") {
    issues.push({
      level: "fail",
      id: "intake-blocked",
      message: "The target repository intake is blocked and cannot advance to scope approval.",
    });
  }
  if (!intake.git.branch) {
    issues.push({
      level: "fail",
      id: "named-branch-required",
      message: "A named branch is required before implementation scope can be approved.",
    });
  }
  if (intake.git.changes.truncated) {
    issues.push({
      level: "fail",
      id: "worktree-evidence-truncated",
      message: "The intake did not enumerate every worktree change, so ownership is incomplete.",
    });
  }
  const requestedEntries = request.preExistingChanges.map((change) => change.statusEntry);
  if (!isDeepStrictEqual(requestedEntries, intake.git.changes.entries)) {
    issues.push({
      level: "fail",
      id: "worktree-ownership-mismatch",
      message: "Every pre-existing worktree change must appear once and in intake order.",
    });
  }
  for (const change of request.preExistingChanges) {
    if (change.owner === "unknown" || change.handling === "block") {
      issues.push({
        level: "fail",
        id: "worktree-ownership-unresolved",
        message: `Pre-existing change remains unresolved: ${change.statusEntry}`,
      });
    } else if (change.handling === "allow-overlap") {
      issues.push({
        level: "warn",
        id: "worktree-overlap-needs-approval",
        message: `The approved implementation may overlap this user-owned change: ${change.statusEntry}`,
      });
    }
  }
  if (request.migrations.some((migration) => migration.affectsExternalState)) {
    issues.push({
      level: "warn",
      id: "external-state-migration-not-authorized",
      message: "Migration files may be scoped, but running a migration against external state remains unauthorized.",
    });
  }
  if (issues.length === 0) {
    issues.push({
      level: "pass",
      id: "scope-ready-for-approval",
      message: "Repository identity, file selectors, verification, risks, and existing-change ownership are ready for human approval.",
    });
  }
  return issues;
}

function validateGate(gateValue, index) {
  const field = `implementation scope proposal approvalGates[${index}]`;
  exactKeys(gateValue, ["id", "status", "summary"], field);
  if (![...IMPLEMENTATION_GATE_IDS, ...RELEASE_GATE_IDS].includes(gateValue.id)) {
    throw new Error(`${field}.id is unsupported`);
  }
  if (!GATE_STATUSES.has(gateValue.status)) throw new Error(`${field}.status is unsupported`);
  text(gateValue.summary, `${field}.summary`);
}

function expectedProposalStatus(proposal) {
  return proposal.issues.some((issue) => issue.level === "fail") ? "blocked" : "approval-pending";
}

function validateIssues(proposal) {
  if (!Array.isArray(proposal.issues) || proposal.issues.length === 0) {
    throw new Error("implementation scope proposal issues must be a non-empty array");
  }
  proposal.issues.forEach((issue, index) => {
    const field = `implementation scope proposal issues[${index}]`;
    exactKeys(issue, ["level", "id", "message"], field);
    if (!["pass", "warn", "fail"].includes(issue.level)) throw new Error(`${field}.level is unsupported`);
    text(issue.id, `${field}.id`);
    text(issue.message, `${field}.message`);
  });
  if (proposal.status !== expectedProposalStatus(proposal)) {
    throw new Error("implementation scope proposal status does not match its issues");
  }
}

function validateBoundary(boundary) {
  exactKeys(boundary, [
    "mode",
    "localWrites",
    "targetRepoMutation",
    "externalWrites",
    "networkCalls",
    "applicationSourceRead",
    "scopeApproved",
    "implementationStarted",
  ], "implementation scope proposal boundary");
  if (boundary.mode !== "read-only"
    || boundary.localWrites !== false
    || boundary.targetRepoMutation !== false
    || boundary.externalWrites !== false
    || boundary.networkCalls !== false
    || boundary.applicationSourceRead !== false
    || boundary.scopeApproved !== false
    || boundary.implementationStarted !== false) {
    throw new Error("implementation scope proposal boundary must remain read-only and unapproved");
  }
}

export function validateImplementationScopeProposal(proposal) {
  exactKeys(proposal, [
    "kind",
    "schemaVersion",
    "status",
    "consumer",
    "intake",
    "request",
    "linkage",
    "baseline",
    "scope",
    "approvalGates",
    "issues",
    "nextAction",
    "boundary",
  ], "implementation scope proposal");
  if (proposal.kind !== "design-ai-implementation-scope-proposal" || proposal.schemaVersion !== 1) {
    throw new Error("implementation scope proposal must be design-ai-implementation-scope-proposal v1");
  }
  validateSourceArtifact(proposal.intake, "implementation scope proposal intake", validateTargetRepoIntake);
  validateSourceArtifact(proposal.request, "implementation scope proposal request", validateImplementationScopeRequest);
  exactKeys(proposal.consumer, ["name", "intakeConsumerMatch", "identity"], "implementation scope proposal consumer");
  if (proposal.consumer.name !== proposal.intake.value.consumer.name
    || proposal.consumer.intakeConsumerMatch !== true
    || proposal.consumer.identity !== "self-declared") {
    throw new Error("implementation scope proposal consumer must match the intake consumer");
  }
  exactKeys(proposal.linkage, ["status", "intakeSha256", "requestSha256", "scopeDigest"], "implementation scope proposal linkage");
  if (proposal.linkage.status !== "pass"
    || proposal.linkage.intakeSha256 !== proposal.intake.sha256
    || proposal.linkage.requestSha256 !== proposal.request.sha256
    || proposal.linkage.scopeDigest !== valueDigest(proposal.scope)) {
    throw new Error("implementation scope proposal linkage changed");
  }
  const intake = proposal.intake.value;
  const request = proposal.request.value;
  exactKeys(proposal.baseline, ["targetPath", "repositoryUrl", "branch", "head", "worktreeChanges"], "implementation scope proposal baseline");
  const expectedBaseline = {
    targetPath: intake.target.declaredPath,
    repositoryUrl: intake.target.declaredRepositoryUrl,
    branch: intake.git.branch,
    head: intake.git.head?.hash || "",
    worktreeChanges: [...intake.git.changes.entries],
  };
  if (!isDeepStrictEqual(proposal.baseline, expectedBaseline)) {
    throw new Error("implementation scope proposal baseline changed from its intake");
  }
  const expectedScope = {
    objective: request.objective,
    intendedBehavior: [...request.intendedBehavior],
    files: {
      inspect: [...request.files.inspect],
      change: [...request.files.change],
      generated: [...request.files.generated],
    },
    dependencies: request.dependencies.map((item) => ({ ...item })),
    migrations: request.migrations.map((item) => ({ ...item })),
    externalWrites: request.externalWrites.map((item) => ({ ...item })),
    verificationCommands: [...request.verificationCommands],
    risks: [...request.risks],
    release: { ...request.release },
  };
  if (!isDeepStrictEqual(proposal.scope, expectedScope)) {
    throw new Error("implementation scope proposal scope changed from its request");
  }
  if (!Array.isArray(proposal.approvalGates)) throw new Error("implementation scope proposal approvalGates must be an array");
  proposal.approvalGates.forEach(validateGate);
  if (!isDeepStrictEqual(proposal.approvalGates, expectedScopeGates(request))) {
    throw new Error("implementation scope proposal approval gates changed from its request");
  }
  if (!isDeepStrictEqual(proposal.issues, expectedScopeIssues(intake, request))) {
    throw new Error("implementation scope proposal issues changed from its intake and request evidence");
  }
  validateIssues(proposal);
  exactKeys(proposal.nextAction, ["id", "status", "summary", "implementationAuthorized"], "implementation scope proposal nextAction");
  if (proposal.nextAction.id !== "human-scope-approval-required"
    || proposal.nextAction.status !== "pending"
    || proposal.nextAction.implementationAuthorized !== false) {
    throw new Error("implementation scope proposal must keep human approval pending");
  }
  text(proposal.nextAction.summary, "implementation scope proposal nextAction.summary");
  validateBoundary(proposal.boundary);
  return proposal;
}

export function validateImplementationScopeProposalArtifact(artifact, field = "implementation scope proposal artifact") {
  validateSourceArtifact(artifact, field, validateImplementationScopeProposal);
  return artifact;
}
