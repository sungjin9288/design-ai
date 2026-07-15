import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";

import { matchingFileSelector } from "./file-selector.mjs";
import { validateImplementationEvidence } from "./implementation-evidence-contract.mjs";
import { validateImplementationEvidenceRequest } from "./implementation-evidence-request-contract.mjs";
import { validateImplementationScopeApproval } from "./implementation-scope-approval-contract.mjs";
import { sourceArtifact } from "./implementation-scope-contract.mjs";
import { readReviewHandoffInput } from "./review-handoff.mjs";
import { unknownOptionMessage } from "./suggest.mjs";
import { collectGitReport, runGitCommand } from "./workspace-git.mjs";
import { normalizeRepositoryUrl } from "./workspace-repo.mjs";

const OPTIONS = ["-h", "--help", "--request", "--target-root", "--consumer", "--json"];
const GIT_COMMANDS = [
  "git rev-parse --is-inside-work-tree",
  "git rev-parse --show-toplevel",
  "git branch --show-current",
  "git status --short",
  "git status --short --untracked-files=all",
  "git -c core.quotepath=false status --short --untracked-files=all",
  "git config --get remote.origin.url",
  "git log -1 --pretty=%h%x09%s",
];

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field} must be a non-empty string`);
  return value;
}

function optionValue(args, index, option) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value`);
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

function splitLines(source) {
  return source.split(/\r?\n/).filter(Boolean);
}

function statusPath(statusEntry) {
  const rawPath = statusEntry.slice(3).trim();
  const renameMarker = rawPath.lastIndexOf(" -> ");
  return renameMarker >= 0 ? rawPath.slice(renameMarker + 4) : rawPath;
}

function issue(level, id, message) {
  return { level, id, message };
}

function inspectGit(targetRoot) {
  const report = collectGitReport({ root: targetRoot, ignoreLocalArtifacts: false });
  const exactStatus = report.isRepo
    ? runGitCommand(["status", "--short", "--untracked-files=all"], { cwd: report.root })
    : { ok: false, stdout: "" };
  const readableStatus = report.isRepo
    ? runGitCommand(["-c", "core.quotepath=false", "status", "--short", "--untracked-files=all"], { cwd: report.root })
    : { ok: false, stdout: "" };
  const exactEntries = exactStatus.ok ? splitLines(exactStatus.stdout) : [];
  const readableEntries = readableStatus.ok ? splitLines(readableStatus.stdout) : [];
  const entries = exactEntries.map((statusEntry, index) => ({
    statusEntry,
    path: statusPath(readableEntries[index] || statusEntry),
  }));
  return {
    report,
    entries,
    statusPairingValid: exactStatus.ok && readableEntries.length === exactEntries.length,
  };
}

function baselineEntryFor(observed, baselineEntries) {
  if (baselineEntries.includes(observed.statusEntry)) return observed.statusEntry;
  return baselineEntries.find((entry) => {
    const baselinePath = statusPath(entry);
    return baselinePath.endsWith("/") && observed.path.startsWith(baselinePath);
  }) || "";
}

function insideRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function readableRealPath(candidate) {
  try {
    return realpathSync(candidate);
  } catch {
    return "";
  }
}

function artifactIdentity(targetRoot, artifactPath) {
  const absolutePath = path.resolve(targetRoot, artifactPath);
  if (!insideRoot(targetRoot, absolutePath)) throw new Error("artifact path escapes the target root");
  const stat = lstatSync(absolutePath);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("artifact must be a regular non-symbolic-link file");
  const realPath = realpathSync(absolutePath);
  if (!insideRoot(realpathSync(targetRoot), realPath)) throw new Error("artifact resolves outside the target root");
  const contents = readFileSync(realPath);
  return {
    path: artifactPath,
    sha256: createHash("sha256").update(contents).digest("hex"),
    bytes: contents.byteLength,
  };
}

function uniqueArtifactPaths(request) {
  return [...new Set([
    ...request.verificationResults.flatMap((result) => result.artifacts),
    ...request.observations.flatMap((observation) => observation.artifacts),
  ])];
}

function verificationIssues(expectedCommands, results) {
  const issues = [];
  const actualCommands = results.map((result) => result.command);
  if (JSON.stringify(actualCommands) !== JSON.stringify(expectedCommands)) {
    issues.push(issue("fail", "verification-command-mismatch", "Verification results must cover every approved command once and in approval order, without extras."));
  }
  for (const result of results) {
    if (result.status === "fail") issues.push(issue("warn", "verification-failed", `Approved verification failed: ${result.command}`));
    if (result.status === "not-run") issues.push(issue("warn", "verification-not-run", `Approved verification was not run: ${result.command}`));
  }
  return issues;
}

function observationIssues(observations) {
  return observations
    .filter((observation) => observation.status === "unverified")
    .map((observation) => issue("warn", "observation-unverified", `${observation.category} remains unverified: ${observation.summary}`));
}

function nextAction(status, remainingGates) {
  if (status === "blocked") {
    return {
      id: "implementation-evidence-repair-required",
      status: "blocked",
      summary: "Restore the approved baseline or obtain a new scope approval, then capture the evidence again.",
      approvalRequiredBefore: remainingGates,
    };
  }
  if (status === "attention-required") {
    return {
      id: "implementation-evidence-gaps-remain",
      status: "pending",
      summary: "Resolve or explicitly accept failed, missing, or uncertain evidence before release approval.",
      approvalRequiredBefore: remainingGates,
    };
  }
  if (!remainingGates.includes("commit")) {
    return remainingGates.length > 0
      ? {
        id: "release-approval-required",
        status: "ready",
        summary: "Implementation evidence is complete. The remaining release actions still require their recorded gates.",
        approvalRequiredBefore: remainingGates,
      }
      : {
        id: "implementation-evidence-complete",
        status: "complete",
        summary: "Implementation evidence is complete and the approved scope requested no later release action.",
        approvalRequiredBefore: [],
      };
  }
  return {
    id: "commit-approval-required",
    status: "ready",
    summary: "Implementation evidence is complete. Commit and later release actions still require their recorded gates.",
    approvalRequiredBefore: remainingGates,
  };
}

export function parseImplementationEvidenceArgs(args) {
  const parsed = { approvalPath: "", requestPath: "", targetRoot: "", consumer: "", json: false, help: false };
  const options = new Map([["--request", "requestPath"], ["--target-root", "targetRoot"], ["--consumer", "consumer"]]);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-h" || arg === "--help") parsed.help = true;
    else if (arg === "--json") parsed.json = true;
    else if (options.has(arg)) {
      parsed[options.get(arg)] = optionValue(args, index, arg);
      index += 1;
    } else if (arg.startsWith("-")) {
      throw new Error(unknownOptionMessage("review-evidence", arg, OPTIONS));
    } else if (!parsed.approvalPath) parsed.approvalPath = arg;
    else throw new Error(`review-evidence accepts one approval; received unexpected argument: ${arg}`);
  }
  return parsed;
}

export function buildImplementationEvidence(approvalSource, requestSource, options = {}) {
  const approvalRef = requiredText(options.approvalRef, "approvalRef");
  const requestRef = requiredText(options.requestRef, "requestRef");
  const targetRoot = requiredText(options.targetRoot, "targetRoot");
  const consumer = requiredText(options.consumer, "consumer");
  if (!path.isAbsolute(targetRoot)) throw new Error("targetRoot must be an absolute path");

  const approvalValue = validateImplementationScopeApproval(parseJson(approvalSource, "approvalSource"));
  const requestValue = validateImplementationEvidenceRequest(parseJson(requestSource, "requestSource"));
  if (consumer !== requestValue.consumer || consumer !== approvalValue.proposal.value.consumer.name) {
    throw new Error("consumer must match the evidence request and scope approval");
  }

  const baseline = approvalValue.proposal.value.baseline;
  if (path.resolve(targetRoot) !== path.resolve(approvalValue.authorization.targetPath)) {
    throw new Error("targetRoot must match the path authorized by the scope approval");
  }

  const { report, entries, statusPairingValid } = inspectGit(targetRoot);
  const issues = [];
  if (!report.isRepo) issues.push(issue("fail", "git-repository-required", "The approved target is no longer a readable Git repository."));
  if (!statusPairingValid) issues.push(issue("fail", "git-status-path-mismatch", "Git status paths could not be paired safely."));
  const repositoryRoot = readableRealPath(report.root);
  const approvedRoot = readableRealPath(targetRoot);
  if (!repositoryRoot || !approvedRoot || repositoryRoot !== approvedRoot) {
    issues.push(issue("fail", "target-root-drift", "The target root no longer matches the Git repository root."));
  }
  if (report.branch !== baseline.branch) issues.push(issue("fail", "branch-drift", "The current branch differs from the approved baseline."));
  if ((report.lastCommit?.hash || "") !== baseline.head) issues.push(issue("fail", "head-drift", "HEAD changed after scope approval; a new approval is required."));
  if (normalizeRepositoryUrl(report.remote) !== normalizeRepositoryUrl(baseline.repositoryUrl)) {
    issues.push(issue("fail", "repository-drift", "The current origin differs from the approved repository."));
  }
  if (requestValue.implementationStartedAt < approvalValue.approver.approvedAt) {
    issues.push(issue("fail", "implementation-before-approval", "Implementation started before the recorded scope approval."));
  }

  const baselineEntries = [...baseline.worktreeChanges];
  const currentEntries = new Set(report.allStatusShort);
  const ownership = new Map(approvalValue.proposal.value.request.value.preExistingChanges.map((item) => [item.statusEntry, item]));
  const reportedByPath = new Map(requestValue.executedWork.map((item) => [item.path, item]));
  const changeSelectors = approvalValue.authorization.files.change;
  const generatedSelectors = approvalValue.authorization.files.generated;

  for (const statusEntry of baselineEntries) {
    if (!currentEntries.has(statusEntry)) issues.push(issue("fail", "pre-existing-change-drift", `Approved pre-existing status changed: ${statusEntry}`));
  }

  const observedChanges = entries.map((entry) => {
    const inheritedBaselineEntry = baselineEntryFor(entry, baselineEntries);
    const preExisting = Boolean(inheritedBaselineEntry);
    const reportItem = reportedByPath.get(entry.path);
    const selector = matchingFileSelector(entry.path, changeSelectors)
      || matchingFileSelector(entry.path, generatedSelectors);
    if (!preExisting && !selector) issues.push(issue("fail", "change-outside-approved-scope", `Changed path is outside approved selectors: ${entry.path}`));
    if (!preExisting && !reportItem) issues.push(issue("fail", "executed-work-missing", `Changed path is missing from executedWork: ${entry.path}`));
    if (reportItem && reportItem.statusEntry !== entry.statusEntry) issues.push(issue("fail", "executed-status-mismatch", `Recorded Git status differs for ${entry.path}.`));
    const handling = ownership.get(inheritedBaselineEntry)?.handling;
    if (preExisting && handling === "preserve" && reportItem) issues.push(issue("fail", "preserved-change-claimed", `Preserved user work cannot be claimed as implementation: ${entry.path}`));
    if (preExisting && handling === "allow-overlap" && reportItem) issues.push(issue("warn", "pre-existing-overlap", `Git status cannot prove the exact overlap with pre-existing work: ${entry.path}`));
    return { statusEntry: entry.statusEntry, path: entry.path, preExisting, reported: Boolean(reportItem), selector };
  });

  for (const work of requestValue.executedWork) {
    if (!entries.some((entry) => entry.path === work.path && entry.statusEntry === work.statusEntry)) {
      issues.push(issue("fail", "executed-work-not-observed", `Recorded work is not present in current Git status: ${work.path}`));
    }
    if (!matchingFileSelector(work.path, [...changeSelectors, ...generatedSelectors])) {
      issues.push(issue("fail", "executed-work-outside-scope", `Recorded work is outside approved selectors: ${work.path}`));
    }
  }

  const expectedCommands = approvalValue.proposal.value.scope.verificationCommands;
  issues.push(...verificationIssues(expectedCommands, requestValue.verificationResults));
  issues.push(...observationIssues(requestValue.observations));
  for (const risk of requestValue.remainingRisks) issues.push(issue("warn", "remaining-risk", `${risk.severity}: ${risk.summary}`));

  const artifactPaths = uniqueArtifactPaths(requestValue);
  const artifacts = [];
  for (const artifactPath of artifactPaths) {
    if (!matchingFileSelector(artifactPath, [...changeSelectors, ...generatedSelectors])) {
      issues.push(issue("fail", "artifact-outside-scope", `Evidence artifact is outside approved selectors: ${artifactPath}`));
      continue;
    }
    try {
      artifacts.push(artifactIdentity(targetRoot, artifactPath));
    } catch (error) {
      issues.push(issue("fail", "artifact-unavailable", `${artifactPath}: ${error.message}`));
    }
  }

  const status = issues.some((item) => item.level === "fail")
    ? "blocked"
    : issues.length > 0 ? "attention-required" : "evidence-complete";
  const remainingGates = [...approvalValue.decision.remainingGateIds];
  const evidence = {
    kind: "design-ai-implementation-evidence",
    schemaVersion: 1,
    status,
    consumer,
    approval: sourceArtifact(approvalSource, approvalValue, approvalRef),
    request: sourceArtifact(requestSource, requestValue, requestRef),
    baseline: {
      targetPath: baseline.targetPath,
      repositoryUrl: baseline.repositoryUrl,
      branch: baseline.branch,
      head: baseline.head,
      worktreeChanges: [...baseline.worktreeChanges],
    },
    observed: {
      targetPath: approvalValue.authorization.targetPath,
      repositoryUrl: report.remote || baseline.repositoryUrl,
      branch: report.branch || baseline.branch,
      head: report.lastCommit?.hash || baseline.head,
      worktreeChanges: observedChanges,
    },
    executedWork: requestValue.executedWork.map((item) => ({ ...item })),
    verification: {
      expectedCommands: [...expectedCommands],
      results: requestValue.verificationResults.map((item) => ({ ...item, artifacts: [...item.artifacts] })),
      summary: {
        pass: requestValue.verificationResults.filter((item) => item.status === "pass").length,
        fail: requestValue.verificationResults.filter((item) => item.status === "fail").length,
        notRun: requestValue.verificationResults.filter((item) => item.status === "not-run").length,
      },
    },
    observations: requestValue.observations.map((item) => ({ ...item, artifacts: [...item.artifacts] })),
    artifacts,
    remainingRisks: requestValue.remainingRisks.map((item) => ({ ...item })),
    issues,
    nextAction: nextAction(status, remainingGates),
    boundary: {
      mode: "read-only-evidence",
      localWrites: false,
      targetRepoMutation: false,
      applicationSourceRead: false,
      evidenceFilesRead: artifactPaths,
      gitCommands: report.isRepo ? GIT_COMMANDS : [GIT_COMMANDS[0]],
      verificationCommandsExecuted: [],
      externalWrites: false,
      networkCalls: false,
      implementationPerformed: false,
      commitAuthorized: false,
      commitPerformed: false,
      pushAuthorized: false,
      pushPerformed: false,
      deploymentAuthorized: false,
      deploymentPerformed: false,
    },
  };
  return validateImplementationEvidence(evidence);
}

export function buildImplementationEvidenceFromFiles(parsed, cwd = process.cwd()) {
  if (!parsed.approvalPath) throw new Error("review-evidence requires a scope approval JSON file");
  if (!parsed.requestPath) throw new Error("review-evidence requires --request");
  if (!parsed.targetRoot) throw new Error("review-evidence requires --target-root");
  if (!parsed.consumer) throw new Error("review-evidence requires --consumer");
  const approval = readReviewHandoffInput(parsed.approvalPath, cwd, "implementation scope approval");
  const request = readReviewHandoffInput(parsed.requestPath, cwd, "implementation evidence request");
  return buildImplementationEvidence(approval.source, request.source, {
    approvalRef: approval.reference,
    requestRef: request.reference,
    targetRoot: parsed.targetRoot,
    consumer: parsed.consumer,
  });
}

export function renderImplementationEvidenceMarkdown(evidence) {
  return [
    `# Implementation evidence for ${evidence.consumer}`,
    "",
    `- Status: ${evidence.status}`,
    `- Target: ${evidence.observed.targetPath}`,
    `- Changed files: ${evidence.observed.worktreeChanges.length}`,
    `- Verification: ${evidence.verification.summary.pass} pass, ${evidence.verification.summary.fail} fail, ${evidence.verification.summary.notRun} not run`,
    "",
    "## Issues",
    "",
    ...(evidence.issues.length > 0 ? evidence.issues.map((item) => `- [${item.level}] ${item.id}: ${item.message}`) : ["- None"]),
    "",
    evidence.nextAction.summary,
  ].join("\n");
}
