import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import vm from "node:vm";

import { buildImplementationEvidence } from "../../cli/lib/implementation-evidence.mjs";
import { approveImplementationScope, proposeImplementationScope } from "../../cli/lib/implementation-scope.mjs";
import { PACKAGE_ROOT, SYMLINK_PREFIX } from "../../cli/lib/paths.mjs";
import { buildReviewHandoff } from "../../cli/lib/review-handoff.mjs";
import { verifyReviewHandoff } from "../../cli/lib/review-handoff-receipt.mjs";
import { buildReviewWorkflow } from "../../cli/lib/review-workflow.mjs";
import { buildTargetRepoIntake } from "../../cli/lib/target-repo-intake.mjs";

const CONSOLE_ROOT = path.join(PACKAGE_ROOT, "docs", "website-console");

function loadApi() {
  const sandbox = { console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const file of ["source-bundle.js", "implementation-scope.js", "implementation-evidence.js"]) {
    vm.runInContext(readFileSync(path.join(CONSOLE_ROOT, file), "utf8"), sandbox);
  }
  return sandbox.DesignAiWebsiteConsoleImplementationEvidence;
}

const api = loadApi();

function git(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  return result.stdout.trimEnd();
}

function createTargetRepo() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-console-evidence-"));
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test" } }));
  git(root, ["init", "-b", "main"]);
  git(root, ["config", "user.name", "Design AI Test"]);
  git(root, ["config", "user.email", "design-ai@example.com"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "test: initialize target"]);
  git(root, ["remote", "add", "origin", "https://github.com/acme/site.git"]);
  return root;
}

function approval(root) {
  const workflow = buildReviewWorkflow("<!doctype html><html lang=\"ko\"><body>설정</body></html>", {
    sourceRef: "settings.html",
    brief: "Review settings",
    repoUrl: "https://github.com/acme/site",
    localPath: root,
    locale: "ko-KR",
    viewports: ["mobile", "desktop"],
    generatedAt: "2026-07-15T00:00:00.000Z",
    sourceRoot: PACKAGE_ROOT,
    prefix: SYMLINK_PREFIX,
  });
  const handoff = buildReviewHandoff(JSON.stringify(workflow), { workflowRef: "workflow.json", recipient: "codex" });
  const receipt = verifyReviewHandoff(JSON.stringify(handoff), { handoffRef: "handoff.json", consumer: "codex" });
  const intake = buildTargetRepoIntake(JSON.stringify(receipt), {
    receiptRef: "receipt.json",
    targetRoot: root,
    consumer: "codex",
  });
  const request = {
    kind: "design-ai-implementation-scope-request",
    schemaVersion: 1,
    objective: "Improve settings and retain evidence.",
    intendedBehavior: ["Settings remain accessible and responsive."],
    files: { inspect: ["src/**/*.tsx"], change: ["src/**/*.tsx"], generated: ["evidence/**"] },
    dependencies: [],
    migrations: [],
    externalWrites: [],
    verificationCommands: ["npm test"],
    risks: ["Browser behavior requires observation."],
    preExistingChanges: [],
    release: { commit: true, push: true, deployment: false },
  };
  const proposal = proposeImplementationScope(JSON.stringify(intake), JSON.stringify(request), {
    intakeRef: "intake.json",
    requestRef: "scope-request.json",
    consumer: "codex",
  });
  return approveImplementationScope(JSON.stringify(proposal), {
    proposalRef: "proposal.json",
    approver: "product owner",
    approvalRef: "approved in task",
    approvedAt: "2026-07-15T01:00:00.000Z",
    confirmed: true,
  });
}

function evidence(root) {
  const approved = approval(root);
  mkdirSync(path.join(root, "src"), { recursive: true });
  mkdirSync(path.join(root, "evidence"), { recursive: true });
  writeFileSync(path.join(root, "src", "settings.tsx"), "export const Settings = () => <button>Save</button>;\n");
  writeFileSync(path.join(root, "evidence", "test.log"), "tests passed\n");
  writeFileSync(path.join(root, "evidence", "a11y.json"), "{\"violations\":[]}\n");
  writeFileSync(path.join(root, "evidence", "responsive.png"), "responsive bytes\n");
  writeFileSync(path.join(root, "evidence", "browser.json"), "{\"errors\":0}\n");
  const status = git(root, ["-c", "core.quotepath=false", "status", "--short", "--untracked-files=all"])
    .split("\n")
    .filter(Boolean);
  const request = {
    kind: "design-ai-implementation-evidence-request",
    schemaVersion: 1,
    consumer: "codex",
    implementationStartedAt: "2026-07-15T01:01:00.000Z",
    implementationCompletedAt: "2026-07-15T01:10:00.000Z",
    executedWork: status.map(function (statusEntry) {
      return { statusEntry, path: statusEntry.slice(3), summary: "Completed approved work." };
    }),
    verificationResults: [{
      command: "npm test",
      status: "pass",
      startedAt: "2026-07-15T01:05:00.000Z",
      completedAt: "2026-07-15T01:06:00.000Z",
      exitCode: 0,
      summary: "Tests passed.",
      artifacts: ["evidence/test.log"],
    }],
    observations: [
      { id: "a11y", category: "accessibility", status: "confirmed", summary: "No violations.", artifacts: ["evidence/a11y.json"] },
      { id: "responsive", category: "responsive", status: "confirmed", summary: "Layouts fit.", artifacts: ["evidence/responsive.png"] },
      { id: "browser", category: "browser", status: "confirmed", summary: "Console clean.", artifacts: ["evidence/browser.json"] },
    ],
    remainingRisks: [],
  };
  return buildImplementationEvidence(JSON.stringify(approved), JSON.stringify(request), {
    approvalRef: "approval.json",
    requestRef: "evidence-request.json",
    targetRoot: root,
    consumer: "codex",
  });
}

test("Website Console accepts the exact CLI implementation evidence contract", () => {
  const root = createTargetRepo();
  try {
    const value = evidence(root);
    const normalized = api.normalizeImplementationEvidence(value);
    assert.ok(Object.isFrozen(api));
    assert.equal(normalized.status, "evidence-complete");
    assert.equal(normalized.artifacts.length, 4);
    assert.equal(normalized.boundary.verificationCommandsExecuted.length, 0);
    assert.equal(normalized.nextAction.id, "commit-approval-required");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Website Console rejects source, summary, issue, and authority drift", () => {
  const root = createTargetRepo();
  try {
    const value = evidence(root);
    const changedSource = structuredClone(value);
    changedSource.request.source += "\n";
    assert.equal(api.normalizeImplementationEvidence(changedSource), null);

    const staleSummary = structuredClone(value);
    staleSummary.verification.summary.pass = 0;
    assert.equal(api.normalizeImplementationEvidence(staleSummary), null);

    const hiddenGap = structuredClone(value);
    hiddenGap.request.value.verificationResults[0] = {
      command: "npm test", status: "not-run", startedAt: "", completedAt: "", exitCode: null,
      summary: "Not run.", artifacts: [],
    };
    hiddenGap.request.source = JSON.stringify(hiddenGap.request.value);
    hiddenGap.request.bytes = Buffer.byteLength(hiddenGap.request.source, "utf8");
    hiddenGap.request.sha256 = createHash("sha256").update(hiddenGap.request.source).digest("hex");
    hiddenGap.verification.results = structuredClone(hiddenGap.request.value.verificationResults);
    hiddenGap.verification.summary = { pass: 0, fail: 0, notRun: 1 };
    hiddenGap.artifacts = hiddenGap.artifacts.filter((artifact) => artifact.path !== "evidence/test.log");
    hiddenGap.issues = [];
    hiddenGap.status = "evidence-complete";
    assert.equal(api.normalizeImplementationEvidence(hiddenGap), null);

    const forgedCommit = structuredClone(value);
    forgedCommit.boundary.commitAuthorized = true;
    assert.equal(api.normalizeImplementationEvidence(forgedCommit), null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
