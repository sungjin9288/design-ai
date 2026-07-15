import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import { normalizeRepositoryUrl } from "./workspace-repo.mjs";

const INTAKE_STATUSES = new Set(["ready-for-scope-review", "attention-required", "blocked"]);
const ISSUE_LEVELS = new Set(["pass", "warn", "fail"]);
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

function string(value, field) {
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
}

function stringList(value, field) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  value.forEach((item, index) => text(item, `${field}[${index}]`));
}

function intakeStatus(intake) {
  const evidenceLevels = [
    intake.project.metadataStatus,
    intake.git.status,
    ...intake.issues.map((issue) => issue.level),
  ];
  if (evidenceLevels.includes("fail")) return "blocked";
  if (evidenceLevels.includes("warn")) return "attention-required";
  return "ready-for-scope-review";
}

function expectedApprovals(receipt) {
  return [...new Set([...receipt.remainingApprovals, "implementation scope"])];
}

function expectedGitStatus(git) {
  if (!git.repository || !git.targetWithinRepository || git.remoteMatch === false) return "fail";
  if (!git.clean || !git.branch) return "warn";
  return "pass";
}

function validateReceiptLink(receipt) {
  exactKeys(receipt, [
    "reference",
    "sha256",
    "bytes",
    "kind",
    "schemaVersion",
    "status",
    "consumer",
    "handoffSha256",
    "reviewWorkflowSha256",
    "remainingApprovals",
  ], "target repo intake receipt");
  text(receipt.reference, "target repo intake receipt.reference");
  if (!DIGEST_PATTERN.test(receipt.sha256)
    || !DIGEST_PATTERN.test(receipt.handoffSha256)
    || !DIGEST_PATTERN.test(receipt.reviewWorkflowSha256)) {
    throw new Error("target repo intake receipt digests must be lowercase SHA-256 values");
  }
  if (!Number.isInteger(receipt.bytes) || receipt.bytes < 1) {
    throw new Error("target repo intake receipt.bytes must be a positive integer");
  }
  if (receipt.kind !== "design-ai-review-handoff-receipt"
    || receipt.schemaVersion !== 1
    || receipt.status !== "contract-validated") {
    throw new Error("target repo intake receipt must link a validated receipt v1");
  }
  text(receipt.consumer, "target repo intake receipt.consumer");
  stringList(receipt.remainingApprovals, "target repo intake receipt.remainingApprovals");
}

function validateConsumer(intake) {
  exactKeys(
    intake.consumer,
    ["name", "receiptConsumerMatch", "identity"],
    "target repo intake consumer",
  );
  if (intake.consumer.name !== intake.receipt.consumer
    || intake.consumer.receiptConsumerMatch !== true
    || intake.consumer.identity !== "self-declared") {
    throw new Error("target repo intake consumer must match the validated receipt");
  }
}

function validateTarget(intake) {
  exactKeys(intake.target, [
    "declaredPath",
    "resolvedPath",
    "pathMatch",
    "declaredRepositoryUrl",
    "observedRepositoryUrl",
    "repositoryUrlMatch",
  ], "target repo intake target");
  if (!path.isAbsolute(intake.target.declaredPath)) {
    throw new Error("target repo intake declared path must be absolute");
  }
  string(intake.target.resolvedPath, "target repo intake target.resolvedPath");
  if (intake.target.resolvedPath && !path.isAbsolute(intake.target.resolvedPath)) {
    throw new Error("target repo intake resolved path must be absolute");
  }
  if (intake.target.pathMatch !== true) {
    throw new Error("target repo intake path must match the declared target");
  }
  text(intake.target.declaredRepositoryUrl, "target repo intake target.declaredRepositoryUrl");
  string(intake.target.observedRepositoryUrl, "target repo intake target.observedRepositoryUrl");
  const expectedMatch = normalizeRepositoryUrl(intake.target.declaredRepositoryUrl)
    === normalizeRepositoryUrl(intake.target.observedRepositoryUrl);
  if (intake.target.repositoryUrlMatch !== expectedMatch) {
    throw new Error("target repo intake repository URL match is inconsistent");
  }
}

function validateProject(project) {
  exactKeys(project, [
    "metadataStatus",
    "manifest",
    "staticEntry",
    "packageManager",
    "framework",
    "scripts",
    "startCommand",
  ], "target repo intake project");
  if (!["pass", "warn", "fail"].includes(project.metadataStatus)) {
    throw new Error("target repo intake project.metadataStatus is unsupported");
  }
  for (const field of ["manifest", "staticEntry", "packageManager", "framework", "startCommand"]) {
    string(project[field], `target repo intake project.${field}`);
  }
  if (!Array.isArray(project.scripts)) throw new Error("target repo intake project.scripts must be an array");
  project.scripts.forEach((script, index) => {
    exactKeys(script, ["name", "run"], `target repo intake project.scripts[${index}]`);
    text(script.name, `target repo intake project.scripts[${index}].name`);
    text(script.run, `target repo intake project.scripts[${index}].run`);
  });
}

function validateGit(git, target) {
  exactKeys(git, [
    "status",
    "repository",
    "root",
    "targetWithinRepository",
    "branch",
    "clean",
    "upstream",
    "ahead",
    "behind",
    "remote",
    "remoteMatch",
    "head",
    "changes",
  ], "target repo intake git");
  if (!["pass", "warn", "fail"].includes(git.status)) {
    throw new Error("target repo intake git.status is unsupported");
  }
  if (typeof git.repository !== "boolean" || typeof git.clean !== "boolean") {
    throw new Error("target repo intake git repository and clean flags must be booleans");
  }
  for (const field of ["root", "branch", "upstream", "remote"]) {
    string(git[field], `target repo intake git.${field}`);
  }
  if (typeof git.targetWithinRepository !== "boolean") {
    throw new Error("target repo intake git.targetWithinRepository must be a boolean");
  }
  for (const field of ["ahead", "behind"]) {
    if (!Number.isInteger(git[field]) || git[field] < 0) {
      throw new Error(`target repo intake git.${field} must be a non-negative integer`);
    }
  }
  if (typeof git.remoteMatch !== "boolean") {
    throw new Error("target repo intake git.remoteMatch must be a boolean");
  }
  if (git.remoteMatch !== target.repositoryUrlMatch) {
    throw new Error("target repo intake git remote match changed");
  }
  if (git.status !== expectedGitStatus(git)) {
    throw new Error("target repo intake git status does not match its repository evidence");
  }
  if (git.head !== null) {
    exactKeys(git.head, ["hash", "subject"], "target repo intake git.head");
    text(git.head.hash, "target repo intake git.head.hash");
    string(git.head.subject, "target repo intake git.head.subject");
  }
  exactKeys(git.changes, ["total", "entries", "truncated"], "target repo intake git.changes");
  if (!Number.isInteger(git.changes.total) || git.changes.total < 0) {
    throw new Error("target repo intake git.changes.total must be a non-negative integer");
  }
  stringList(git.changes.entries, "target repo intake git.changes.entries");
  if (typeof git.changes.truncated !== "boolean"
    || git.changes.total < git.changes.entries.length
    || git.changes.truncated !== (git.changes.total > git.changes.entries.length)) {
    throw new Error("target repo intake git change truncation is inconsistent");
  }
}

function validateInspection(inspection, project) {
  exactKeys(inspection, [
    "scope",
    "metadataFilesRead",
    "metadataEntriesInspected",
    "applicationSourceFilesRead",
    "gitCommands",
  ], "target repo intake inspection");
  if (inspection.scope !== "root-metadata-and-git-state") {
    throw new Error("target repo intake inspection scope changed");
  }
  stringList(inspection.metadataFilesRead, "target repo intake inspection.metadataFilesRead");
  stringList(inspection.metadataEntriesInspected, "target repo intake inspection.metadataEntriesInspected");
  if (!Array.isArray(inspection.applicationSourceFilesRead)
    || inspection.applicationSourceFilesRead.length !== 0) {
    throw new Error("target repo intake must not claim application source reads");
  }
  stringList(inspection.gitCommands, "target repo intake inspection.gitCommands");
  const expectedFiles = project.manifest ? [project.manifest] : [];
  if (!isDeepStrictEqual(inspection.metadataFilesRead, expectedFiles)) {
    throw new Error("target repo intake metadata file evidence changed");
  }
}

function validateIssues(intake) {
  if (!Array.isArray(intake.issues)) throw new Error("target repo intake issues must be an array");
  intake.issues.forEach((issue, index) => {
    exactKeys(issue, ["level", "id", "message"], `target repo intake issues[${index}]`);
    if (!ISSUE_LEVELS.has(issue.level)) {
      throw new Error(`target repo intake issues[${index}].level is unsupported`);
    }
    text(issue.id, `target repo intake issues[${index}].id`);
    text(issue.message, `target repo intake issues[${index}].message`);
  });
  if (!INTAKE_STATUSES.has(intake.status) || intake.status !== intakeStatus(intake)) {
    throw new Error("target repo intake status does not match its project, Git, and issue evidence");
  }
}

function validateNextAction(intake) {
  stringList(intake.remainingApprovals, "target repo intake remainingApprovals");
  if (!isDeepStrictEqual(intake.remainingApprovals, intake.receipt.remainingApprovals)) {
    throw new Error("target repo intake remaining approvals changed");
  }
  exactKeys(intake.nextAction, [
    "id",
    "status",
    "summary",
    "approvalRequiredBefore",
    "implementationAuthorized",
  ], "target repo intake nextAction");
  if (intake.nextAction.id !== "implementation-scope-approval-required"
    || intake.nextAction.status !== "pending"
    || intake.nextAction.implementationAuthorized !== false) {
    throw new Error("target repo intake must keep implementation scope approval pending");
  }
  text(intake.nextAction.summary, "target repo intake nextAction.summary");
  if (!isDeepStrictEqual(
    intake.nextAction.approvalRequiredBefore,
    expectedApprovals(intake.receipt),
  )) {
    throw new Error("target repo intake approval requirements changed");
  }
}

function validateBoundary(boundary) {
  exactKeys(boundary, [
    "mode",
    "localWrites",
    "targetRepoMutation",
    "externalWrites",
    "networkCalls",
    "previewStarted",
    "applicationSourceRead",
    "consumerIdentityVerified",
    "implementationStarted",
  ], "target repo intake boundary");
  if (boundary.mode !== "read-only"
    || boundary.localWrites !== false
    || boundary.targetRepoMutation !== false
    || boundary.externalWrites !== false
    || boundary.networkCalls !== false
    || boundary.previewStarted !== false
    || boundary.applicationSourceRead !== false
    || boundary.consumerIdentityVerified !== false
    || boundary.implementationStarted !== false) {
    throw new Error("target repo intake boundary exceeds read-only metadata inspection");
  }
}

export function validateTargetRepoIntake(intake) {
  exactKeys(intake, [
    "kind",
    "schemaVersion",
    "status",
    "consumer",
    "receipt",
    "target",
    "project",
    "git",
    "inspection",
    "issues",
    "remainingApprovals",
    "nextAction",
    "boundary",
  ], "target repo intake");
  if (intake.kind !== "design-ai-target-repo-intake" || intake.schemaVersion !== 1) {
    throw new Error("target repo intake kind and schemaVersion must be design-ai-target-repo-intake v1");
  }
  validateReceiptLink(intake.receipt);
  validateConsumer(intake);
  validateTarget(intake);
  validateProject(intake.project);
  validateGit(intake.git, intake.target);
  validateInspection(intake.inspection, intake.project);
  validateIssues(intake);
  validateNextAction(intake);
  validateBoundary(intake.boundary);
  return intake;
}
