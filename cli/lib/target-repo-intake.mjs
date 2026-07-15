import path from "node:path";

import {
  reviewHandoffReceiptSourceDigest,
  validateReviewHandoffReceipt,
} from "./review-handoff-receipt-contract.mjs";
import { readReviewHandoffInput } from "./review-handoff.mjs";
import { buildSiteLinkedPreviewReport } from "./site-linked-preview.mjs";
import { unknownOptionMessage } from "./suggest.mjs";
import { validateTargetRepoIntake } from "./target-repo-intake-contract.mjs";
import { collectGitReport } from "./workspace-git.mjs";
import { normalizeRepositoryUrl } from "./workspace-repo.mjs";

const OPTIONS = ["-h", "--help", "--target-root", "--consumer", "--json"];
const MAX_STATUS_ENTRIES = 100;

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function requiredSource(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function optionValue(args, index, option) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value`);
  return value;
}

function parseJson(source, field) {
  try {
    return JSON.parse(source);
  } catch {
    throw new Error(`${field} must be valid JSON`);
  }
}

function targetWithinRepository(targetRoot, repositoryRoot) {
  if (!targetRoot || !repositoryRoot) return false;
  const relative = path.relative(repositoryRoot, targetRoot);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function gitStatus(git, remoteMatch, withinRepository) {
  if (!git.isRepo || !withinRepository || remoteMatch === false) return "fail";
  if (!git.clean || !git.branch) return "warn";
  return "pass";
}

function gitCommands(git, inspected) {
  if (!inspected) return [];
  const commands = ["git rev-parse --is-inside-work-tree"];
  if (!git.isRepo) return commands;
  commands.push(
    "git rev-parse --show-toplevel",
    "git branch --show-current",
    "git status --short",
    "git rev-parse --abbrev-ref --symbolic-full-name @{u}",
    "git config --get remote.origin.url",
    "git log -1 --pretty=%h%x09%s",
  );
  if (git.upstream) commands.push("git rev-list --left-right --count @{u}...HEAD");
  return commands;
}

function unavailableGitReport(root, reason) {
  return {
    isRepo: false,
    root,
    branch: "",
    clean: true,
    upstream: "",
    ahead: 0,
    behind: 0,
    remote: "",
    lastCommit: null,
    statusShort: [],
    allStatusShort: [],
    ignoredStatusShort: [],
    ignoredLocalArtifactCount: 0,
    hasIgnoredLocalArtifacts: false,
    reason,
  };
}

function gitIssues(git, remoteMatch, withinRepository) {
  if (!git.isRepo) {
    return [{ level: "fail", id: "target-not-git-repository", message: git.reason }];
  }
  const issues = [];
  if (!withinRepository) {
    issues.push({
      level: "fail",
      id: "target-outside-git-root",
      message: "The inspected target is not inside the detected Git repository root.",
    });
  }
  if (remoteMatch === false) {
    issues.push({
      level: "fail",
      id: "target-remote-mismatch",
      message: "The observed Git remote does not match the repository URL declared in the receipt.",
    });
  }
  if (!git.clean) {
    issues.push({
      level: "warn",
      id: "target-worktree-dirty",
      message: "The target repository has existing changes that need ownership review before implementation.",
    });
  }
  if (!git.branch) {
    issues.push({
      level: "warn",
      id: "target-detached-head",
      message: "The target repository is not on a named branch.",
    });
  }
  if (issues.length === 0) {
    issues.push({
      level: "pass",
      id: "target-git-ready",
      message: "The target repository path, remote, branch, and working tree are ready for scope review.",
    });
  }
  return issues;
}

function intakeStatus(issues) {
  if (issues.some((issue) => issue.level === "fail")) return "blocked";
  if (issues.some((issue) => issue.level === "warn")) return "attention-required";
  return "ready-for-scope-review";
}

function approvals(receipt) {
  return [...new Set([...receipt.remainingApprovals, "implementation scope"])];
}

function receiptLink(source, receipt, reference) {
  return {
    reference,
    sha256: reviewHandoffReceiptSourceDigest(source),
    bytes: Buffer.byteLength(source, "utf8"),
    kind: receipt.kind,
    schemaVersion: receipt.schemaVersion,
    status: receipt.status,
    consumer: receipt.consumer.name,
    handoffSha256: receipt.handoff.sha256,
    reviewWorkflowSha256: receipt.handoff.value.artifacts.reviewWorkflow.sha256,
    remainingApprovals: [...receipt.remainingApprovals],
  };
}

export function parseTargetRepoIntakeArgs(args) {
  const parsed = { receiptPath: "", targetRoot: "", consumer: "", json: false, help: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-h" || arg === "--help") parsed.help = true;
    else if (arg === "--json") parsed.json = true;
    else if (arg === "--target-root") {
      parsed.targetRoot = optionValue(args, index, arg);
      index += 1;
    } else if (arg === "--consumer") {
      parsed.consumer = optionValue(args, index, arg);
      index += 1;
    } else if (arg.startsWith("-")) {
      throw new Error(unknownOptionMessage("review-intake", arg, OPTIONS));
    } else if (!parsed.receiptPath) parsed.receiptPath = arg;
    else throw new Error(`review-intake accepts one receipt; received unexpected argument: ${arg}`);
  }
  return parsed;
}

export function buildTargetRepoIntake(receiptSource, options = {}) {
  const source = requiredSource(receiptSource, "receiptSource");
  const receiptRef = requiredText(options.receiptRef, "receiptRef");
  const consumer = requiredText(options.consumer, "consumer");
  const targetRoot = requiredText(options.targetRoot, "targetRoot");
  const receipt = validateReviewHandoffReceipt(parseJson(source, "receiptSource"));
  if (consumer !== receipt.consumer.name) {
    throw new Error(
      `consumer must match the receipt consumer: expected ${receipt.consumer.name}, received ${consumer}`,
    );
  }

  const context = receipt.handoff.value.artifacts.reviewWorkflow.value.plan.context;
  if (!context.localPath) {
    throw new Error("receipt workflow must declare an absolute localPath before target intake");
  }
  if (!path.isAbsolute(context.localPath)) {
    throw new Error("receipt workflow localPath must be absolute before target intake");
  }
  if (!context.repoUrl) {
    throw new Error("receipt workflow must declare a repoUrl before target intake");
  }
  if (!path.isAbsolute(targetRoot)) throw new Error("targetRoot must be an absolute path");
  if (path.resolve(targetRoot) !== path.resolve(context.localPath)) {
    throw new Error("targetRoot must match the localPath declared in the receipt workflow");
  }

  const preview = buildSiteLinkedPreviewReport({
    siteProfile: {
      id: "review-intake",
      name: context.siteName,
      localPath: targetRoot,
      liveUrl: context.url,
    },
  }, { filePath: receiptRef });
  const resolvedPath = preview.linkedCode.resolvedPath;
  const inspectGit = preview.linkedCode.directory && !preview.linkedCode.symbolicLink;
  const git = inspectGit
    ? collectGitReport({ root: resolvedPath, ignoreLocalArtifacts: false })
    : unavailableGitReport(
      path.resolve(targetRoot),
      "Git inspection was not performed because the declared target path was unavailable or unsafe.",
    );
  const withinRepository = targetWithinRepository(resolvedPath, git.root);
  const remoteMatch = normalizeRepositoryUrl(context.repoUrl) === normalizeRepositoryUrl(git.remote);
  const issues = [...preview.issues, ...gitIssues(git, remoteMatch, withinRepository)];
  const entries = git.allStatusShort.slice(0, MAX_STATUS_ENTRIES);

  const intake = {
    kind: "design-ai-target-repo-intake",
    schemaVersion: 1,
    status: intakeStatus(issues),
    consumer: {
      name: consumer,
      receiptConsumerMatch: true,
      identity: "self-declared",
    },
    receipt: receiptLink(source, receipt, receiptRef),
    target: {
      declaredPath: context.localPath,
      resolvedPath,
      pathMatch: true,
      declaredRepositoryUrl: context.repoUrl,
      observedRepositoryUrl: git.remote,
      repositoryUrlMatch: remoteMatch,
    },
    project: {
      metadataStatus: preview.status,
      manifest: preview.linkedCode.manifest,
      staticEntry: preview.linkedCode.staticEntry,
      packageManager: preview.linkedCode.packageManager,
      framework: preview.linkedCode.framework,
      scripts: preview.linkedCode.scripts.map(({ name, run }) => ({ name, run })),
      startCommand: preview.linkedCode.startCommand,
    },
    git: {
      status: gitStatus(git, remoteMatch, withinRepository),
      repository: git.isRepo,
      root: git.root,
      targetWithinRepository: withinRepository,
      branch: git.branch,
      clean: git.clean,
      upstream: git.upstream,
      ahead: git.ahead,
      behind: git.behind,
      remote: git.remote,
      remoteMatch,
      head: git.lastCommit,
      changes: {
        total: git.allStatusShort.length,
        entries,
        truncated: git.allStatusShort.length > entries.length,
      },
    },
    inspection: {
      scope: "root-metadata-and-git-state",
      metadataFilesRead: preview.linkedCode.manifest ? [preview.linkedCode.manifest] : [],
      metadataEntriesInspected: ["supported root lockfile", "index.html existence"],
      applicationSourceFilesRead: [],
      gitCommands: gitCommands(git, inspectGit),
    },
    issues,
    remainingApprovals: [...receipt.remainingApprovals],
    nextAction: {
      id: "implementation-scope-approval-required",
      status: "pending",
      summary: "Review the proposed files, scope, risks, and verification commands before implementation.",
      approvalRequiredBefore: approvals(receipt),
      implementationAuthorized: false,
    },
    boundary: {
      mode: "read-only",
      localWrites: false,
      targetRepoMutation: false,
      externalWrites: false,
      networkCalls: false,
      previewStarted: false,
      applicationSourceRead: false,
      consumerIdentityVerified: false,
      implementationStarted: false,
    },
  };
  return validateTargetRepoIntake(intake);
}

export function buildTargetRepoIntakeFromFile(parsed, cwd = process.cwd()) {
  if (!parsed.receiptPath) throw new Error("review-intake requires a receipt JSON file");
  if (!parsed.targetRoot) throw new Error("review-intake requires --target-root");
  if (!parsed.consumer) throw new Error("review-intake requires --consumer");
  const receipt = readReviewHandoffInput(parsed.receiptPath, cwd, "review handoff receipt");
  return buildTargetRepoIntake(receipt.source, {
    receiptRef: receipt.reference,
    targetRoot: parsed.targetRoot,
    consumer: parsed.consumer,
  });
}

export function renderTargetRepoIntakeMarkdown(intake) {
  return [
    `# Target repository intake for ${intake.consumer.name}`,
    "",
    `- Status: ${intake.status}`,
    `- Target: ${intake.target.resolvedPath || intake.target.declaredPath}`,
    `- Project: ${intake.project.framework} / ${intake.project.packageManager || "no package manager"}`,
    `- Git: ${intake.git.branch || "detached"}; ${intake.git.clean ? "clean" : "existing changes"}`,
    `- Remote match: ${intake.git.remoteMatch}`,
    "",
    "## Issues",
    "",
    ...intake.issues.map((issue) => `- [${issue.level}] ${issue.id}: ${issue.message}`),
    "",
    "## Next action",
    "",
    `- ${intake.nextAction.summary}`,
    "- Implementation remains unauthorized.",
  ].join("\n");
}
