import {
  approvedScopeGates,
  remainingScopeGateIds,
  validateImplementationScopeApproval,
} from "./implementation-scope-approval-contract.mjs";
import {
  sourceArtifact,
  expectedScopeGates,
  expectedScopeIssues,
  validateImplementationScopeProposal,
  validateSourceArtifact,
  valueDigest,
} from "./implementation-scope-contract.mjs";
import { validateImplementationScopeRequest } from "./implementation-scope-request-contract.mjs";
import { readReviewHandoffInput } from "./review-handoff.mjs";
import { unknownOptionMessage } from "./suggest.mjs";
import { validateTargetRepoIntake } from "./target-repo-intake-contract.mjs";

const PROPOSAL_OPTIONS = ["-h", "--help", "--request", "--consumer", "--json"];
const APPROVAL_OPTIONS = [
  "-h",
  "--help",
  "--approver",
  "--approval-ref",
  "--approved-at",
  "--yes",
  "--json",
];

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function parseJson(source, field) {
  requiredText(source, field);
  try {
    return JSON.parse(source);
  } catch {
    throw new Error(`${field} must be valid JSON`);
  }
}

function isoTimestamp(value, field) {
  requiredText(value, field);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${field} must be a canonical UTC ISO timestamp`);
  }
  return value;
}

function optionValue(args, index, option) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value`);
  return value;
}

export function parseImplementationScopeArgs(args) {
  const parsed = {
    intakePath: "",
    requestPath: "",
    consumer: "",
    json: false,
    help: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-h" || arg === "--help") parsed.help = true;
    else if (arg === "--json") parsed.json = true;
    else if (arg === "--request") {
      parsed.requestPath = optionValue(args, index, arg);
      index += 1;
    } else if (arg === "--consumer") {
      parsed.consumer = optionValue(args, index, arg);
      index += 1;
    } else if (arg.startsWith("-")) {
      throw new Error(unknownOptionMessage("review-scope", arg, PROPOSAL_OPTIONS));
    } else if (!parsed.intakePath) parsed.intakePath = arg;
    else throw new Error(`review-scope accepts one intake; received unexpected argument: ${arg}`);
  }
  return parsed;
}

export function parseImplementationScopeApprovalArgs(args) {
  const parsed = {
    proposalPath: "",
    approver: "",
    approvalRef: "",
    approvedAt: "",
    confirmed: false,
    json: false,
    help: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-h" || arg === "--help") parsed.help = true;
    else if (arg === "--yes") parsed.confirmed = true;
    else if (arg === "--json") parsed.json = true;
    else if (arg === "--approver") {
      parsed.approver = optionValue(args, index, arg);
      index += 1;
    } else if (arg === "--approval-ref") {
      parsed.approvalRef = optionValue(args, index, arg);
      index += 1;
    } else if (arg === "--approved-at") {
      parsed.approvedAt = optionValue(args, index, arg);
      index += 1;
    } else if (arg.startsWith("-")) {
      throw new Error(unknownOptionMessage("review-scope-approve", arg, APPROVAL_OPTIONS));
    } else if (!parsed.proposalPath) parsed.proposalPath = arg;
    else throw new Error(`review-scope-approve accepts one proposal; received unexpected argument: ${arg}`);
  }
  return parsed;
}

function scopeFromRequest(request) {
  return {
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
}

export function proposeImplementationScope(intakeSource, requestSource, options = {}) {
  const intakeRef = requiredText(options.intakeRef, "intakeRef");
  const requestRef = requiredText(options.requestRef, "requestRef");
  const consumer = requiredText(options.consumer, "consumer");
  const intake = validateTargetRepoIntake(parseJson(intakeSource, "intakeSource"));
  const request = validateImplementationScopeRequest(parseJson(requestSource, "requestSource"));
  if (consumer !== intake.consumer.name) {
    throw new Error(`consumer must match the intake consumer: expected ${intake.consumer.name}, received ${consumer}`);
  }
  const issues = expectedScopeIssues(intake, request);
  const scope = scopeFromRequest(request);
  const intakeArtifact = sourceArtifact(intakeSource, intake, intakeRef);
  const requestArtifact = sourceArtifact(requestSource, request, requestRef);
  const proposal = {
    kind: "design-ai-implementation-scope-proposal",
    schemaVersion: 1,
    status: issues.some((issue) => issue.level === "fail") ? "blocked" : "approval-pending",
    consumer: {
      name: consumer,
      intakeConsumerMatch: true,
      identity: "self-declared",
    },
    intake: intakeArtifact,
    request: requestArtifact,
    linkage: {
      status: "pass",
      intakeSha256: intakeArtifact.sha256,
      requestSha256: requestArtifact.sha256,
      scopeDigest: valueDigest(scope),
    },
    baseline: {
      targetPath: intake.target.declaredPath,
      repositoryUrl: intake.target.declaredRepositoryUrl,
      branch: intake.git.branch,
      head: intake.git.head?.hash || "",
      worktreeChanges: [...intake.git.changes.entries],
    },
    scope,
    approvalGates: expectedScopeGates(request),
    issues,
    nextAction: {
      id: "human-scope-approval-required",
      status: "pending",
      summary: "Review the immutable proposal and record a separate approval before reading or changing application source.",
      implementationAuthorized: false,
    },
    boundary: {
      mode: "read-only",
      localWrites: false,
      targetRepoMutation: false,
      externalWrites: false,
      networkCalls: false,
      applicationSourceRead: false,
      scopeApproved: false,
      implementationStarted: false,
    },
  };
  return validateImplementationScopeProposal(proposal);
}

export function approveImplementationScope(proposalSource, options = {}) {
  if (options.confirmed !== true) {
    throw new Error("scope approval requires explicit confirmed: true");
  }
  const proposalRef = requiredText(options.proposalRef, "proposalRef");
  const approver = requiredText(options.approver, "approver");
  const approvalRef = requiredText(options.approvalRef, "approvalRef");
  const approvedAt = isoTimestamp(options.approvedAt, "approvedAt");
  const proposalValue = validateImplementationScopeProposal(parseJson(proposalSource, "proposalSource"));
  if (proposalValue.status !== "approval-pending") {
    throw new Error("blocked implementation scope proposals cannot be approved");
  }
  const proposal = sourceArtifact(proposalSource, proposalValue, proposalRef);
  validateSourceArtifact(proposal, "implementation scope approval proposal", validateImplementationScopeProposal);
  const approvalGates = approvedScopeGates(proposalValue);
  const remainingGates = remainingScopeGateIds(approvalGates);
  const approval = {
    kind: "design-ai-implementation-scope-approval",
    schemaVersion: 1,
    status: "approved-for-implementation",
    proposal,
    approver: {
      name: approver,
      identity: "self-declared",
      reference: approvalRef,
      approvedAt,
    },
    decision: {
      status: "approved",
      proposalSha256: proposal.sha256,
      scopeDigest: valueDigest(proposalValue.scope),
      authorizedGateIds: approvalGates
        .filter((gate) => gate.status === "approved")
        .map((gate) => gate.id),
      remainingGateIds: remainingGates,
    },
    authorization: {
      targetPath: proposalValue.baseline.targetPath,
      repositoryUrl: proposalValue.baseline.repositoryUrl,
      branch: proposalValue.baseline.branch,
      head: proposalValue.baseline.head,
      files: {
        inspect: [...proposalValue.scope.files.inspect],
        change: [...proposalValue.scope.files.change],
        generated: [...proposalValue.scope.files.generated],
      },
      expiresOnDrift: true,
    },
    approvalGates,
    nextAction: {
      id: "implementation-evidence-required",
      status: "ready",
      summary: "Implement only the approved selectors, stop on baseline drift, and record P11 evidence before any release action.",
      implementationAuthorized: true,
      approvalRequiredBefore: remainingGates,
    },
    boundary: {
      mode: "scope-approved",
      localWrites: false,
      targetRepoMutation: false,
      externalWrites: false,
      networkCalls: false,
      applicationSourceRead: false,
      scopeApproved: true,
      implementationStarted: false,
      sourceReadAuthorized: true,
      targetMutationAuthorized: true,
      externalWritesAuthorized: false,
      commitAuthorized: false,
      pushAuthorized: false,
      deploymentAuthorized: false,
    },
  };
  return validateImplementationScopeApproval(approval);
}

export function proposeImplementationScopeFromFiles(parsed, cwd = process.cwd()) {
  if (!parsed.intakePath) throw new Error("review-scope requires a target-intake JSON file");
  if (!parsed.requestPath) throw new Error("review-scope requires --request");
  if (!parsed.consumer) throw new Error("review-scope requires --consumer");
  const intake = readReviewHandoffInput(parsed.intakePath, cwd, "implementation scope intake");
  const request = readReviewHandoffInput(parsed.requestPath, cwd, "implementation scope request");
  return proposeImplementationScope(intake.source, request.source, {
    intakeRef: intake.reference,
    requestRef: request.reference,
    consumer: parsed.consumer,
  });
}

export function approveImplementationScopeFromFile(parsed, cwd = process.cwd()) {
  if (!parsed.proposalPath) throw new Error("review-scope-approve requires a proposal JSON file");
  if (!parsed.approver) throw new Error("review-scope-approve requires --approver");
  if (!parsed.approvalRef) throw new Error("review-scope-approve requires --approval-ref");
  if (!parsed.approvedAt) throw new Error("review-scope-approve requires --approved-at");
  if (!parsed.confirmed) throw new Error("review-scope-approve requires --yes");
  const proposal = readReviewHandoffInput(
    parsed.proposalPath,
    cwd,
    "implementation scope proposal",
  );
  return approveImplementationScope(proposal.source, {
    proposalRef: proposal.reference,
    approver: parsed.approver,
    approvalRef: parsed.approvalRef,
    approvedAt: parsed.approvedAt,
    confirmed: parsed.confirmed,
  });
}

export function renderImplementationScopeProposalMarkdown(proposal) {
  return [
    `# Implementation scope proposal for ${proposal.consumer.name}`,
    "",
    `- Status: ${proposal.status}`,
    `- Target: ${proposal.baseline.targetPath}`,
    `- Branch: ${proposal.baseline.branch || "not named"}`,
    `- Objective: ${proposal.scope.objective}`,
    "",
    "## Files",
    "",
    ...proposal.scope.files.change.map((selector) => `- Change: ${selector}`),
    ...proposal.scope.files.generated.map((selector) => `- Generate: ${selector}`),
    "",
    "## Verification",
    "",
    ...proposal.scope.verificationCommands.map((item) => `- ${item}`),
    "",
    "Implementation remains unauthorized until the separate approval artifact is recorded.",
  ].join("\n");
}

export function renderImplementationScopeApprovalMarkdown(approval) {
  return [
    `# Implementation scope approved by ${approval.approver.name}`,
    "",
    `- Status: ${approval.status}`,
    `- Approval reference: ${approval.approver.reference}`,
    `- Target: ${approval.authorization.targetPath}`,
    `- Proposal SHA-256: ${approval.proposal.sha256}`,
    "",
    "Implementation is authorized only for the listed selectors. Commit, push, deployment, external writes, and external-state migrations remain separately gated.",
  ].join("\n");
}
