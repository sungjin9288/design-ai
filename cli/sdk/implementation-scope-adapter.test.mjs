import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  approveImplementationScope,
  proposeImplementationScope,
} from "./index.mjs";
import { PACKAGE_ROOT, SYMLINK_PREFIX } from "../lib/paths.mjs";
import { buildReviewHandoff } from "../lib/review-handoff.mjs";
import { verifyReviewHandoff } from "../lib/review-handoff-receipt.mjs";
import { buildReviewWorkflow } from "../lib/review-workflow.mjs";
import { buildTargetRepoIntake } from "../lib/target-repo-intake.mjs";

function git(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
}

function createTargetRepo() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-sdk-scope-"));
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

function buildIntakeSource(root) {
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

function buildRequestSource() {
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

test("SDK proposes and approves one exact implementation scope without performing writes", () => {
  const root = createTargetRepo();
  try {
    const intakeSource = buildIntakeSource(root);
    const requestSource = buildRequestSource();
    const proposal = proposeImplementationScope(intakeSource, requestSource, {
      intakeRef: "target-repo-intake.json",
      requestRef: "implementation-scope-request.json",
      consumer: "codex",
    });

    assert.equal(proposal.status, "approval-pending");
    assert.equal(proposal.intake.source, intakeSource);
    assert.equal(proposal.request.source, requestSource);
    assert.equal(proposal.nextAction.implementationAuthorized, false);
    assert.equal(proposal.boundary.applicationSourceRead, false);

    const proposalSource = `${JSON.stringify(proposal, null, 2)}\n`;
    const approval = approveImplementationScope(proposalSource, {
      proposalRef: "implementation-scope-proposal.json",
      approver: "product owner",
      approvalRef: "approved in task",
      approvedAt: "2026-07-15T12:00:00.000Z",
      confirmed: true,
    });

    assert.equal(approval.proposal.source, proposalSource);
    assert.deepEqual(approval.decision.authorizedGateIds, ["source-inspection", "target-files"]);
    assert.deepEqual(approval.decision.remainingGateIds, ["external-writes", "commit", "push"]);
    assert.equal(approval.boundary.targetRepoMutation, false);
    assert.equal(approval.boundary.commitAuthorized, false);
    assert.equal(approval.boundary.pushAuthorized, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("SDK approval requires explicit confirmation", () => {
  assert.throws(
    () => approveImplementationScope("{}", {
      proposalRef: "implementation-scope-proposal.json",
      approver: "product owner",
      approvalRef: "approved in task",
      approvedAt: "2026-07-15T12:00:00.000Z",
      confirmed: false,
    }),
    /confirmed must be true/,
  );
});
