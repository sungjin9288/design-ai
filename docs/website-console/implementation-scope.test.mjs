import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import {
  approveImplementationScope,
  proposeImplementationScope,
} from "../../cli/lib/implementation-scope.mjs";
import { PACKAGE_ROOT, SYMLINK_PREFIX } from "../../cli/lib/paths.mjs";
import { buildReviewHandoff } from "../../cli/lib/review-handoff.mjs";
import { verifyReviewHandoff } from "../../cli/lib/review-handoff-receipt.mjs";
import { buildReviewWorkflow } from "../../cli/lib/review-workflow.mjs";
import { buildTargetRepoIntake } from "../../cli/lib/target-repo-intake.mjs";

const consoleRoot = path.dirname(fileURLToPath(import.meta.url));

function loadApi() {
  const sandbox = {};
  vm.createContext(sandbox);
  for (const file of ["source-bundle.js", "implementation-scope.js"]) {
    vm.runInContext(readFileSync(path.join(consoleRoot, file), "utf8"), sandbox);
  }
  return sandbox.DesignAiWebsiteConsoleImplementationScope;
}

const api = loadApi();

function git(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
}

function createTargetRepo() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-console-scope-"));
  writeFileSync(path.join(root, "package.json"), JSON.stringify({
    scripts: { test: "node --test", build: "vite build" },
    devDependencies: { vite: "7.0.0" },
  }));
  git(root, ["init", "-b", "main"]);
  git(root, ["config", "user.name", "Design AI Test"]);
  git(root, ["config", "user.email", "design-ai@example.com"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "test: initialize target"]);
  git(root, ["remote", "add", "origin", "https://github.com/acme/site.git"]);
  return root;
}

function intakeSource(root) {
  const workflow = buildReviewWorkflow(
    "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>",
    {
      sourceRef: "settings.html",
      brief: "Review Korean settings",
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

function requestSource() {
  return `${JSON.stringify({
    kind: "design-ai-implementation-scope-request",
    schemaVersion: 1,
    objective: "Clarify the settings save action without changing the architecture.",
    intendedBehavior: ["Keep the primary action clear and keyboard accessible."],
    files: {
      inspect: ["src/settings/**/*.tsx", "src/settings/**/*.test.tsx"],
      change: ["src/settings/**/*.tsx"],
      generated: [],
    },
    dependencies: [],
    migrations: [],
    externalWrites: [{ system: "GitHub", action: "push branch", destination: "acme/site" }],
    verificationCommands: ["npm test", "npm run build"],
    risks: ["The current label may be referenced by an existing test."],
    preExistingChanges: [],
    release: { commit: true, push: true, deployment: false },
  }, null, 2)}\n`;
}

function artifacts(root) {
  const proposal = proposeImplementationScope(intakeSource(root), requestSource(), {
    intakeRef: "target-repo-intake.json",
    requestRef: "implementation-scope-request.json",
    consumer: "codex",
  });
  const proposalSource = `${JSON.stringify(proposal, null, 2)}\n`;
  const approval = approveImplementationScope(proposalSource, {
    proposalRef: "implementation-scope-proposal.json",
    approver: "product owner",
    approvalRef: "approved in task",
    approvedAt: "2026-07-15T12:00:00.000Z",
    confirmed: true,
  });
  return { proposal, proposalSource, approval };
}

test("Website Console exposes a frozen implementation-scope contract API", () => {
  assert.equal(Object.isFrozen(api), true);
  assert.deepEqual(Object.keys(api), [
    "normalizeImplementationScopeRequest",
    "normalizeImplementationScopeProposal",
    "normalizeImplementationScopeApproval",
  ]);
});

test("Website Console accepts exact proposal and approval artifacts", () => {
  const root = createTargetRepo();
  try {
    const { proposal, approval } = artifacts(root);
    const normalizedProposal = api.normalizeImplementationScopeProposal(proposal);
    const normalizedApproval = api.normalizeImplementationScopeApproval(approval);

    assert.notEqual(normalizedProposal, proposal);
    assert.equal(JSON.stringify(normalizedProposal), JSON.stringify(proposal));
    assert.notEqual(normalizedApproval, approval);
    assert.equal(JSON.stringify(normalizedApproval), JSON.stringify(approval));
    assert.equal(normalizedProposal.boundary.applicationSourceRead, false);
    assert.equal(normalizedApproval.boundary.targetRepoMutation, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Website Console preserves the external-write gate for external-state migrations", () => {
  const root = createTargetRepo();
  try {
    const request = JSON.parse(requestSource());
    request.externalWrites = [];
    request.migrations = [{
      name: "backfill settings metadata",
      command: "npm run migrate:settings",
      affectsExternalState: true,
    }];
    const proposal = proposeImplementationScope(intakeSource(root), JSON.stringify(request), {
      intakeRef: "target-repo-intake.json",
      requestRef: "implementation-scope-request.json",
      consumer: "codex",
    });
    const approval = approveImplementationScope(JSON.stringify(proposal), {
      proposalRef: "implementation-scope-proposal.json",
      approver: "product owner",
      approvalRef: "approved in task",
      approvedAt: "2026-07-15T12:00:00.000Z",
      confirmed: true,
    });

    assert.equal(api.normalizeImplementationScopeProposal(proposal).approvalGates
      .find((gate) => gate.id === "external-writes").status, "pending");
    assert.equal(
      JSON.stringify(api.normalizeImplementationScopeApproval(approval).decision.remainingGateIds),
      JSON.stringify(["external-writes", "commit", "push"]),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Website Console rejects source, gate, status, and authority drift", () => {
  const root = createTargetRepo();
  try {
    const { proposal, approval } = artifacts(root);
    const forged = [];

    const changedSource = structuredClone(proposal);
    changedSource.request.source += "\n";
    forged.push(changedSource);

    const changedGate = structuredClone(proposal);
    changedGate.approvalGates[0].status = "approved";
    forged.push(changedGate);

    const changedStatus = structuredClone(proposal);
    changedStatus.status = "blocked";
    forged.push(changedStatus);

    forged.forEach((value) => {
      assert.equal(api.normalizeImplementationScopeProposal(value), null);
    });

    const externalAuthority = structuredClone(approval);
    externalAuthority.boundary.externalWritesAuthorized = true;
    assert.equal(api.normalizeImplementationScopeApproval(externalAuthority), null);

    const approvedPush = structuredClone(approval);
    approvedPush.approvalGates.find((gate) => gate.id === "push").status = "approved";
    assert.equal(api.normalizeImplementationScopeApproval(approvedPush), null);

    const nonCanonicalTime = structuredClone(approval);
    nonCanonicalTime.approver.approvedAt = "2026-07-15 12:00:00";
    assert.equal(api.normalizeImplementationScopeApproval(nonCanonicalTime), null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
