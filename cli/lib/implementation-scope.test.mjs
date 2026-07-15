import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

import { validateImplementationScopeApproval } from "./implementation-scope-approval-contract.mjs";
import {
  valueDigest,
  validateImplementationScopeProposal,
} from "./implementation-scope-contract.mjs";
import { validateImplementationScopeRequest } from "./implementation-scope-request-contract.mjs";
import {
  approveImplementationScope,
  approveImplementationScopeFromFile,
  parseImplementationScopeApprovalArgs,
  parseImplementationScopeArgs,
  proposeImplementationScope,
  proposeImplementationScopeFromFiles,
} from "./implementation-scope.mjs";
import { PACKAGE_ROOT, SYMLINK_PREFIX } from "./paths.mjs";
import { buildReviewHandoff } from "./review-handoff.mjs";
import { verifyReviewHandoff } from "./review-handoff-receipt.mjs";
import { buildReviewWorkflow } from "./review-workflow.mjs";
import { buildTargetRepoIntake } from "./target-repo-intake.mjs";

function runGit(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
}

function createTargetRepo() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-scope-target-"));
  writeFileSync(path.join(root, "package.json"), JSON.stringify({
    scripts: { test: "node --test", build: "vite build" },
    devDependencies: { vite: "7.0.0" },
  }, null, 2));
  runGit(root, ["init", "-b", "main"]);
  runGit(root, ["config", "user.name", "Design AI Test"]);
  runGit(root, ["config", "user.email", "design-ai@example.com"]);
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-m", "test: initialize target"]);
  runGit(root, ["remote", "add", "origin", "https://github.com/acme/site.git"]);
  return root;
}

function intakeSource(root) {
  const workflow = buildReviewWorkflow(
    "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>",
    {
      sourceRef: "settings.html",
      brief: "한국어 설정 화면을 검토한다",
      siteName: "Acme settings",
      repoUrl: "https://github.com/acme/site",
      localPath: root,
      locale: "ko-KR",
      viewports: ["mobile", "desktop"],
      generatedAt: "2026-07-15T00:00:00.000Z",
      sourceRoot: PACKAGE_ROOT,
      prefix: SYMLINK_PREFIX,
    },
  );
  const handoff = buildReviewHandoff(JSON.stringify(workflow, null, 2), {
    workflowRef: "review-workflow.json",
    recipient: "codex",
  });
  const receipt = verifyReviewHandoff(JSON.stringify(handoff, null, 2), {
    handoffRef: "review-handoff.json",
    consumer: "codex",
  });
  const intake = buildTargetRepoIntake(JSON.stringify(receipt, null, 2), {
    receiptRef: "review-handoff-receipt.json",
    targetRoot: root,
    consumer: "codex",
  });
  return `${JSON.stringify(intake, null, 2)}\n`;
}

function scopeRequest(preExistingChanges = []) {
  return {
    kind: "design-ai-implementation-scope-request",
    schemaVersion: 1,
    objective: "Clarify the settings save action without changing the existing architecture.",
    intendedBehavior: [
      "The primary action has one clear label.",
      "Keyboard and responsive behavior remain intact.",
    ],
    files: {
      inspect: ["src/settings/**/*.tsx", "src/settings/**/*.test.tsx"],
      change: ["src/settings/**/*.tsx"],
      generated: [],
    },
    dependencies: [],
    migrations: [],
    externalWrites: [{
      system: "GitHub",
      action: "push branch",
      destination: "sungjin9288/design-ai",
    }],
    verificationCommands: ["npm test", "npm run build"],
    risks: ["Existing settings behavior may rely on the current button label."],
    preExistingChanges,
    release: { commit: true, push: true, deployment: false },
  };
}

function proposalFrom(root, request = scopeRequest()) {
  return proposeImplementationScope(intakeSource(root), `${JSON.stringify(request, null, 2)}\n`, {
    intakeRef: "target-repo-intake.json",
    requestRef: "implementation-scope-request.json",
    consumer: "codex",
  });
}

test("implementation scope proposal preserves exact sources and keeps every write pending", () => {
  const root = createTargetRepo();
  try {
    const proposal = proposalFrom(root);

    assert.equal(proposal.kind, "design-ai-implementation-scope-proposal");
    assert.equal(proposal.status, "approval-pending");
    assert.equal(proposal.consumer.name, "codex");
    assert.equal(proposal.baseline.targetPath, root);
    assert.equal(proposal.baseline.branch, "main");
    assert.deepEqual(proposal.baseline.worktreeChanges, []);
    assert.deepEqual(proposal.scope.files.change, ["src/settings/**/*.tsx"]);
    assert.equal(proposal.approvalGates.find((gate) => gate.id === "target-files").status, "pending");
    assert.equal(proposal.approvalGates.find((gate) => gate.id === "external-writes").status, "pending");
    assert.equal(proposal.nextAction.implementationAuthorized, false);
    assert.equal(proposal.boundary.applicationSourceRead, false);
    assert.equal(proposal.boundary.targetRepoMutation, false);
    assert.strictEqual(validateImplementationScopeProposal(proposal), proposal);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scope request rejects unsafe selectors and implicit changed files", () => {
  const relativeDrift = scopeRequest();
  relativeDrift.files.change = ["../outside.ts"];
  relativeDrift.files.inspect = ["../outside.ts"];
  assert.throws(
    () => validateImplementationScopeRequest(relativeDrift),
    /relative selector without traversal/,
  );

  const missingInspection = scopeRequest();
  missingInspection.files.change = ["src/other.ts"];
  assert.throws(
    () => validateImplementationScopeRequest(missingInspection),
    /changed-file selector must also appear/,
  );
});

test("pre-existing worktree ownership must match the intake exactly", () => {
  const root = createTargetRepo();
  try {
    writeFileSync(path.join(root, "operator-note.md"), "existing user note\n");
    const intake = intakeSource(root);
    const missingOwnership = scopeRequest();
    const blocked = proposeImplementationScope(intake, JSON.stringify(missingOwnership), {
      intakeRef: "target-repo-intake.json",
      requestRef: "implementation-scope-request.json",
      consumer: "codex",
    });
    assert.equal(blocked.status, "blocked");
    assert.ok(blocked.issues.some((issue) => issue.id === "worktree-ownership-mismatch"));
    assert.throws(
      () => approveImplementationScope(JSON.stringify(blocked), {
        proposalRef: "scope-proposal.json",
        approver: "product owner",
        approvalRef: "approved in task",
        approvedAt: "2026-07-15T12:00:00.000Z",
        confirmed: true,
      }),
      /blocked implementation scope proposals cannot be approved/,
    );

    const owned = scopeRequest([{
      statusEntry: "?? operator-note.md",
      owner: "user",
      handling: "preserve",
    }]);
    const ready = proposeImplementationScope(intake, JSON.stringify(owned), {
      intakeRef: "target-repo-intake.json",
      requestRef: "implementation-scope-request.json",
      consumer: "codex",
    });
    assert.equal(ready.status, "approval-pending");
    assert.equal(ready.approvalGates.find((gate) => gate.id === "pre-existing-changes").status, "pending");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("proposal contract rejects scope, gate, issue, and source drift", () => {
  const root = createTargetRepo();
  try {
    const proposal = proposalFrom(root);

    const changedScope = structuredClone(proposal);
    changedScope.scope.files.change.push("src/other.ts");
    changedScope.linkage.scopeDigest = valueDigest(changedScope.scope);
    assert.throws(() => validateImplementationScopeProposal(changedScope), /scope changed from its request/);

    const approvedGate = structuredClone(proposal);
    approvedGate.approvalGates[0].status = "approved";
    assert.throws(() => validateImplementationScopeProposal(approvedGate), /status is unsupported/);

    const missingIssue = structuredClone(proposal);
    missingIssue.issues = [{ level: "pass", id: "forged", message: "Looks ready." }];
    assert.throws(() => validateImplementationScopeProposal(missingIssue), /issues changed from its intake and request evidence/);

    const changedIntakeBytes = structuredClone(proposal);
    changedIntakeBytes.intake.source += "\n";
    assert.throws(() => validateImplementationScopeProposal(changedIntakeBytes), /source identity changed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scope approval authorizes only implementation selectors and preserves release gates", () => {
  const root = createTargetRepo();
  try {
    const proposalSource = `${JSON.stringify(proposalFrom(root), null, 2)}\n`;
    assert.throws(
      () => approveImplementationScope(proposalSource, {
        proposalRef: "scope-proposal.json",
        approver: "product owner",
        approvalRef: "approved in task",
        approvedAt: "2026-07-15T12:00:00.000Z",
      }),
      /confirmed: true/,
    );

    const approval = approveImplementationScope(proposalSource, {
      proposalRef: "scope-proposal.json",
      approver: "product owner",
      approvalRef: "approved in task",
      approvedAt: "2026-07-15T12:00:00.000Z",
      confirmed: true,
    });

    assert.equal(approval.kind, "design-ai-implementation-scope-approval");
    assert.equal(approval.status, "approved-for-implementation");
    assert.deepEqual(approval.decision.authorizedGateIds, ["source-inspection", "target-files"]);
    assert.deepEqual(approval.decision.remainingGateIds, ["external-writes", "commit", "push"]);
    assert.equal(approval.nextAction.implementationAuthorized, true);
    assert.equal(approval.boundary.sourceReadAuthorized, true);
    assert.equal(approval.boundary.targetMutationAuthorized, true);
    assert.equal(approval.boundary.targetRepoMutation, false);
    assert.equal(approval.boundary.externalWritesAuthorized, false);
    assert.equal(approval.boundary.commitAuthorized, false);
    assert.equal(approval.boundary.pushAuthorized, false);
    assert.equal(approval.boundary.deploymentAuthorized, false);
    assert.strictEqual(validateImplementationScopeApproval(approval), approval);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("external-state migrations retain a separate external-write gate", () => {
  const root = createTargetRepo();
  try {
    const request = scopeRequest();
    request.externalWrites = [];
    request.migrations = [{
      name: "backfill settings metadata",
      command: "npm run migrate:settings",
      affectsExternalState: true,
    }];
    const proposal = proposalFrom(root, request);

    assert.equal(proposal.approvalGates.find((gate) => gate.id === "migration-files").status, "pending");
    assert.equal(proposal.approvalGates.find((gate) => gate.id === "external-writes").status, "pending");
    assert.ok(proposal.issues.some((issue) => issue.id === "external-state-migration-not-authorized"));

    const approval = approveImplementationScope(JSON.stringify(proposal), {
      proposalRef: "scope-proposal.json",
      approver: "product owner",
      approvalRef: "approved in task",
      approvedAt: "2026-07-15T12:00:00.000Z",
      confirmed: true,
    });
    assert.deepEqual(approval.decision.authorizedGateIds, [
      "source-inspection",
      "target-files",
      "migration-files",
    ]);
    assert.deepEqual(approval.decision.remainingGateIds, ["external-writes", "commit", "push"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scope approval rejects proposal drift and forged external authority", () => {
  const root = createTargetRepo();
  try {
    const proposal = proposalFrom(root);
    const approval = approveImplementationScope(JSON.stringify(proposal), {
      proposalRef: "scope-proposal.json",
      approver: "product owner",
      approvalRef: "approved in task",
      approvedAt: "2026-07-15T12:00:00.000Z",
      confirmed: true,
    });

    const changedProposal = structuredClone(approval);
    changedProposal.proposal.source += "\n";
    assert.throws(() => validateImplementationScopeApproval(changedProposal), /source identity changed/);

    const externalWrite = structuredClone(approval);
    externalWrite.boundary.externalWritesAuthorized = true;
    assert.throws(() => validateImplementationScopeApproval(externalWrite), /exceeds scoped implementation authority/);

    const approvedPush = structuredClone(approval);
    approvedPush.approvalGates.find((gate) => gate.id === "push").status = "approved";
    assert.throws(() => validateImplementationScopeApproval(approvedPush), /gates changed from its proposal/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("file adapters preserve exact input sources and require explicit approval", () => {
  const root = createTargetRepo();
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), "design-ai-scope-files-"));
  try {
    const intake = intakeSource(root);
    const request = `${JSON.stringify(scopeRequest(), null, 2)}\n`;
    const intakePath = path.join(fixtureRoot, "target-repo-intake.json");
    const requestPath = path.join(fixtureRoot, "implementation-scope-request.json");
    writeFileSync(intakePath, intake);
    writeFileSync(requestPath, request);

    const proposalArgs = parseImplementationScopeArgs([
      intakePath,
      "--request",
      requestPath,
      "--consumer",
      "codex",
      "--json",
    ]);
    const proposal = proposeImplementationScopeFromFiles(proposalArgs, fixtureRoot);
    assert.equal(proposal.intake.source, intake);
    assert.equal(proposal.request.source, request);

    const proposalPath = path.join(fixtureRoot, "implementation-scope-proposal.json");
    writeFileSync(proposalPath, `${JSON.stringify(proposal, null, 2)}\n`);
    const approvalArgs = parseImplementationScopeApprovalArgs([
      proposalPath,
      "--approver",
      "product owner",
      "--approval-ref",
      "task confirmation",
      "--approved-at",
      "2026-07-15T12:00:00.000Z",
      "--yes",
    ]);
    const approval = approveImplementationScopeFromFile(approvalArgs, fixtureRoot);
    assert.equal(approval.proposal.source, `${JSON.stringify(proposal, null, 2)}\n`);
    assert.equal(approval.boundary.implementationStarted, false);

    assert.throws(
      () => approveImplementationScopeFromFile({ ...approvalArgs, confirmed: false }, fixtureRoot),
      /requires --yes/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("scope approval accepts only canonical UTC timestamps", () => {
  const root = createTargetRepo();
  try {
    const proposalSource = JSON.stringify(proposalFrom(root));
    assert.throws(
      () => approveImplementationScope(proposalSource, {
        proposalRef: "scope-proposal.json",
        approver: "product owner",
        approvalRef: "task confirmation",
        approvedAt: "2026-07-15 12:00:00",
        confirmed: true,
      }),
      /canonical UTC ISO timestamp/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
