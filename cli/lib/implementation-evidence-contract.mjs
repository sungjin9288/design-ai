import { isDeepStrictEqual } from "node:util";

import { validateImplementationScopeApproval } from "./implementation-scope-approval-contract.mjs";
import { validateImplementationEvidenceRequest } from "./implementation-evidence-request-contract.mjs";
import { validateSourceArtifact } from "./implementation-scope-contract.mjs";

const DIGEST_PATTERN = /^[a-f0-9]{64}$/;
const STATUSES = new Set(["evidence-complete", "attention-required", "blocked"]);
const ISSUE_LEVELS = new Set(["warn", "fail"]);

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${field} must be an object`);
  return value;
}

function exactKeys(value, keys, field) {
  const actual = Object.keys(object(value, field)).sort();
  const expected = [...keys].sort();
  if (!isDeepStrictEqual(actual, expected)) throw new Error(`${field} keys must be exactly: ${keys.join(", ")}`);
}

function text(value, field, { empty = false } = {}) {
  if (typeof value !== "string" || (!empty && value.trim() === "")) throw new Error(`${field} must be ${empty ? "a string" : "a non-empty string"}`);
}

function textList(value, field) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  value.forEach((item, index) => text(item, `${field}[${index}]`));
}

function validateBaseline(value) {
  exactKeys(value, ["targetPath", "repositoryUrl", "branch", "head", "worktreeChanges"], "implementation evidence baseline");
  for (const key of ["targetPath", "repositoryUrl", "branch", "head"]) text(value[key], `implementation evidence baseline.${key}`);
  textList(value.worktreeChanges, "implementation evidence baseline.worktreeChanges");
}

function validateObserved(value) {
  exactKeys(value, ["targetPath", "repositoryUrl", "branch", "head", "worktreeChanges"], "implementation evidence observed");
  for (const key of ["targetPath", "repositoryUrl", "branch", "head"]) text(value[key], `implementation evidence observed.${key}`);
  if (!Array.isArray(value.worktreeChanges)) throw new Error("implementation evidence observed.worktreeChanges must be an array");
  value.worktreeChanges.forEach((change, index) => {
    const field = `implementation evidence observed.worktreeChanges[${index}]`;
    exactKeys(change, ["statusEntry", "path", "preExisting", "reported", "selector"], field);
    text(change.statusEntry, `${field}.statusEntry`);
    text(change.path, `${field}.path`);
    if (typeof change.preExisting !== "boolean" || typeof change.reported !== "boolean") throw new Error(`${field} flags must be booleans`);
    text(change.selector, `${field}.selector`, { empty: true });
  });
}

function validateVerification(value, request) {
  exactKeys(value, ["expectedCommands", "results", "summary"], "implementation evidence verification");
  textList(value.expectedCommands, "implementation evidence verification.expectedCommands");
  if (!isDeepStrictEqual(value.results, request.verificationResults)) throw new Error("implementation evidence verification results changed from the request");
  exactKeys(value.summary, ["pass", "fail", "notRun"], "implementation evidence verification.summary");
  for (const count of Object.values(value.summary)) if (!Number.isInteger(count) || count < 0) throw new Error("implementation evidence verification summary counts must be non-negative integers");
  const expected = {
    pass: value.results.filter((result) => result.status === "pass").length,
    fail: value.results.filter((result) => result.status === "fail").length,
    notRun: value.results.filter((result) => result.status === "not-run").length,
  };
  if (!isDeepStrictEqual(value.summary, expected)) throw new Error("implementation evidence verification summary is stale");
}

function validateArtifacts(artifacts) {
  if (!Array.isArray(artifacts)) throw new Error("implementation evidence artifacts must be an array");
  artifacts.forEach((artifact, index) => {
    const field = `implementation evidence artifacts[${index}]`;
    exactKeys(artifact, ["path", "sha256", "bytes"], field);
    text(artifact.path, `${field}.path`);
    if (!DIGEST_PATTERN.test(artifact.sha256)) throw new Error(`${field}.sha256 must be a lowercase SHA-256 digest`);
    if (!Number.isInteger(artifact.bytes) || artifact.bytes < 1) throw new Error(`${field}.bytes must be a positive integer`);
  });
}

function requestedArtifactPaths(request) {
  return [...new Set([
    ...request.verificationResults.flatMap((result) => result.artifacts),
    ...request.observations.flatMap((observation) => observation.artifacts),
  ])];
}

function validateIssues(issues) {
  if (!Array.isArray(issues)) throw new Error("implementation evidence issues must be an array");
  issues.forEach((issue, index) => {
    const field = `implementation evidence issues[${index}]`;
    exactKeys(issue, ["level", "id", "message"], field);
    if (!ISSUE_LEVELS.has(issue.level)) throw new Error(`${field}.level must be warn or fail`);
    text(issue.id, `${field}.id`);
    text(issue.message, `${field}.message`);
  });
}

function validateBoundary(boundary) {
  exactKeys(boundary, [
    "mode", "localWrites", "targetRepoMutation", "applicationSourceRead", "evidenceFilesRead",
    "gitCommands", "verificationCommandsExecuted", "externalWrites", "networkCalls", "implementationPerformed",
    "commitAuthorized", "commitPerformed", "pushAuthorized", "pushPerformed", "deploymentAuthorized", "deploymentPerformed",
  ], "implementation evidence boundary");
  textList(boundary.evidenceFilesRead, "implementation evidence boundary.evidenceFilesRead");
  textList(boundary.gitCommands, "implementation evidence boundary.gitCommands");
  if (!Array.isArray(boundary.verificationCommandsExecuted) || boundary.verificationCommandsExecuted.length !== 0) {
    throw new Error("implementation evidence operation must not execute verification commands");
  }
  const falseKeys = [
    "localWrites", "targetRepoMutation", "applicationSourceRead", "externalWrites", "networkCalls", "implementationPerformed",
    "commitAuthorized", "commitPerformed", "pushAuthorized", "pushPerformed", "deploymentAuthorized", "deploymentPerformed",
  ];
  if (boundary.mode !== "read-only-evidence" || falseKeys.some((key) => boundary[key] !== false)) {
    throw new Error("implementation evidence boundary exceeds read-only evidence authority");
  }
}

export function validateImplementationEvidence(evidence) {
  exactKeys(evidence, [
    "kind", "schemaVersion", "status", "consumer", "approval", "request", "baseline", "observed",
    "executedWork", "verification", "observations", "artifacts", "remainingRisks", "issues", "nextAction", "boundary",
  ], "implementation evidence");
  if (evidence.kind !== "design-ai-implementation-evidence" || evidence.schemaVersion !== 1) {
    throw new Error("implementation evidence must be design-ai-implementation-evidence v1");
  }
  if (!STATUSES.has(evidence.status)) throw new Error("implementation evidence status is unsupported");
  text(evidence.consumer, "implementation evidence consumer");
  validateSourceArtifact(evidence.approval, "implementation evidence approval", validateImplementationScopeApproval);
  validateSourceArtifact(evidence.request, "implementation evidence request", validateImplementationEvidenceRequest);
  if (evidence.consumer !== evidence.request.value.consumer) throw new Error("implementation evidence consumer changed from its request");
  validateBaseline(evidence.baseline);
  if (!isDeepStrictEqual(evidence.baseline, evidence.approval.value.proposal.value.baseline)) {
    throw new Error("implementation evidence baseline changed from its approval");
  }
  validateObserved(evidence.observed);
  if (evidence.observed.targetPath !== evidence.approval.value.authorization.targetPath) {
    throw new Error("implementation evidence observed target changed from its approval");
  }
  if (!isDeepStrictEqual(evidence.executedWork, evidence.request.value.executedWork)
    || !isDeepStrictEqual(evidence.observations, evidence.request.value.observations)
    || !isDeepStrictEqual(evidence.remainingRisks, evidence.request.value.remainingRisks)) {
    throw new Error("implementation evidence claims changed from the request");
  }
  validateVerification(evidence.verification, evidence.request.value);
  if (!isDeepStrictEqual(
    evidence.verification.expectedCommands,
    evidence.approval.value.proposal.value.scope.verificationCommands,
  )) {
    throw new Error("implementation evidence expected commands changed from its approval");
  }
  validateArtifacts(evidence.artifacts);
  const requestedArtifacts = requestedArtifactPaths(evidence.request.value);
  const recordedArtifactPaths = evidence.artifacts.map((artifact) => artifact.path);
  if (new Set(recordedArtifactPaths).size !== recordedArtifactPaths.length
    || recordedArtifactPaths.some((artifactPath) => !requestedArtifacts.includes(artifactPath))) {
    throw new Error("implementation evidence artifacts changed from its request");
  }
  validateIssues(evidence.issues);
  const claimNeedsAttention = evidence.request.value.verificationResults.some((result) => result.status !== "pass")
    || evidence.request.value.observations.some((observation) => observation.status === "unverified")
    || evidence.request.value.remainingRisks.length > 0;
  if (claimNeedsAttention && evidence.issues.length === 0) {
    throw new Error("implementation evidence cannot hide missing or uncertain proof");
  }
  const expectedStatus = evidence.issues.some((issue) => issue.level === "fail")
    ? "blocked"
    : evidence.issues.length > 0 ? "attention-required" : "evidence-complete";
  if (evidence.status !== expectedStatus) throw new Error("implementation evidence status does not match its issues");
  exactKeys(evidence.nextAction, ["id", "status", "summary", "approvalRequiredBefore"], "implementation evidence nextAction");
  text(evidence.nextAction.id, "implementation evidence nextAction.id");
  text(evidence.nextAction.status, "implementation evidence nextAction.status");
  text(evidence.nextAction.summary, "implementation evidence nextAction.summary");
  textList(evidence.nextAction.approvalRequiredBefore, "implementation evidence nextAction.approvalRequiredBefore");
  if (!isDeepStrictEqual(evidence.nextAction.approvalRequiredBefore, evidence.approval.value.decision.remainingGateIds)) {
    throw new Error("implementation evidence nextAction changed remaining approval gates");
  }
  const expectedNextAction = evidence.status === "blocked"
    ? ["implementation-evidence-repair-required", "blocked"]
    : evidence.status === "attention-required"
      ? ["implementation-evidence-gaps-remain", "pending"]
      : evidence.approval.value.decision.remainingGateIds.includes("commit")
        ? ["commit-approval-required", "ready"]
        : evidence.approval.value.decision.remainingGateIds.length > 0
          ? ["release-approval-required", "ready"]
          : ["implementation-evidence-complete", "complete"];
  if (evidence.nextAction.id !== expectedNextAction[0] || evidence.nextAction.status !== expectedNextAction[1]) {
    throw new Error("implementation evidence nextAction does not match its status and remaining gates");
  }
  validateBoundary(evidence.boundary);
  return evidence;
}
