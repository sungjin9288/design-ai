import { isDeepStrictEqual } from "node:util";

import {
  IMPLEMENTATION_GATE_IDS,
  RELEASE_GATE_IDS,
  validateImplementationScopeProposalArtifact,
  valueDigest,
} from "./implementation-scope-contract.mjs";

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

function isoTimestamp(value, field) {
  text(value, field);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${field} must be a canonical UTC ISO timestamp`);
  }
}

function expectedApprovedGates(proposal) {
  return proposal.approvalGates.map((gate) => ({
    ...gate,
    status: IMPLEMENTATION_GATE_IDS.includes(gate.id) && gate.status === "pending"
      ? "approved"
      : gate.status,
  }));
}

function remainingGateIds(gates) {
  return gates
    .filter((gate) => RELEASE_GATE_IDS.includes(gate.id) && gate.status === "pending")
    .map((gate) => gate.id);
}

function validateApprover(approval) {
  exactKeys(approval.approver, ["name", "identity", "reference", "approvedAt"], "implementation scope approval approver");
  text(approval.approver.name, "implementation scope approval approver.name");
  text(approval.approver.reference, "implementation scope approval approver.reference");
  if (approval.approver.identity !== "self-declared") {
    throw new Error("implementation scope approval approver identity must remain self-declared");
  }
  isoTimestamp(
    approval.approver.approvedAt,
    "implementation scope approval approver.approvedAt",
  );
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
    "sourceReadAuthorized",
    "targetMutationAuthorized",
    "externalWritesAuthorized",
    "commitAuthorized",
    "pushAuthorized",
    "deploymentAuthorized",
  ], "implementation scope approval boundary");
  if (boundary.mode !== "scope-approved"
    || boundary.localWrites !== false
    || boundary.targetRepoMutation !== false
    || boundary.externalWrites !== false
    || boundary.networkCalls !== false
    || boundary.applicationSourceRead !== false
    || boundary.scopeApproved !== true
    || boundary.implementationStarted !== false
    || boundary.sourceReadAuthorized !== true
    || boundary.targetMutationAuthorized !== true
    || boundary.externalWritesAuthorized !== false
    || boundary.commitAuthorized !== false
    || boundary.pushAuthorized !== false
    || boundary.deploymentAuthorized !== false) {
    throw new Error("implementation scope approval boundary exceeds scoped implementation authority");
  }
}

export function validateImplementationScopeApproval(approval) {
  exactKeys(approval, [
    "kind",
    "schemaVersion",
    "status",
    "proposal",
    "approver",
    "decision",
    "authorization",
    "approvalGates",
    "nextAction",
    "boundary",
  ], "implementation scope approval");
  if (approval.kind !== "design-ai-implementation-scope-approval" || approval.schemaVersion !== 1) {
    throw new Error("implementation scope approval must be design-ai-implementation-scope-approval v1");
  }
  if (approval.status !== "approved-for-implementation") {
    throw new Error("implementation scope approval status must be approved-for-implementation");
  }
  validateImplementationScopeProposalArtifact(approval.proposal);
  if (approval.proposal.value.status !== "approval-pending") {
    throw new Error("implementation scope approval cannot approve a blocked proposal");
  }
  validateApprover(approval);
  exactKeys(approval.decision, ["status", "proposalSha256", "scopeDigest", "authorizedGateIds", "remainingGateIds"], "implementation scope approval decision");
  const expectedGates = expectedApprovedGates(approval.proposal.value);
  const authorizedGateIds = expectedGates
    .filter((gate) => IMPLEMENTATION_GATE_IDS.includes(gate.id) && gate.status === "approved")
    .map((gate) => gate.id);
  const expectedRemaining = remainingGateIds(expectedGates);
  if (approval.decision.status !== "approved"
    || approval.decision.proposalSha256 !== approval.proposal.sha256
    || approval.decision.scopeDigest !== valueDigest(approval.proposal.value.scope)
    || !isDeepStrictEqual(approval.decision.authorizedGateIds, authorizedGateIds)
    || !isDeepStrictEqual(approval.decision.remainingGateIds, expectedRemaining)) {
    throw new Error("implementation scope approval decision changed from its proposal");
  }
  exactKeys(approval.authorization, ["targetPath", "repositoryUrl", "branch", "head", "files", "expiresOnDrift"], "implementation scope approval authorization");
  const proposal = approval.proposal.value;
  const expectedAuthorization = {
    targetPath: proposal.baseline.targetPath,
    repositoryUrl: proposal.baseline.repositoryUrl,
    branch: proposal.baseline.branch,
    head: proposal.baseline.head,
    files: {
      inspect: [...proposal.scope.files.inspect],
      change: [...proposal.scope.files.change],
      generated: [...proposal.scope.files.generated],
    },
    expiresOnDrift: true,
  };
  if (!isDeepStrictEqual(approval.authorization, expectedAuthorization)) {
    throw new Error("implementation scope approval authorization changed from its proposal");
  }
  if (!isDeepStrictEqual(approval.approvalGates, expectedGates)) {
    throw new Error("implementation scope approval gates changed from its proposal");
  }
  exactKeys(approval.nextAction, ["id", "status", "summary", "implementationAuthorized", "approvalRequiredBefore"], "implementation scope approval nextAction");
  if (approval.nextAction.id !== "implementation-evidence-required"
    || approval.nextAction.status !== "ready"
    || approval.nextAction.implementationAuthorized !== true
    || !isDeepStrictEqual(approval.nextAction.approvalRequiredBefore, expectedRemaining)) {
    throw new Error("implementation scope approval nextAction changed");
  }
  text(approval.nextAction.summary, "implementation scope approval nextAction.summary");
  validateBoundary(approval.boundary);
  return approval;
}

export function approvedScopeGates(proposal) {
  return expectedApprovedGates(proposal).map((gate) => ({ ...gate }));
}

export function remainingScopeGateIds(gates) {
  return remainingGateIds(gates);
}
