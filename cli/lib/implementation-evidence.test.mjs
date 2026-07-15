import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

import { matchesFileSelector } from "./file-selector.mjs";
import { validateImplementationEvidenceRequest } from "./implementation-evidence-request-contract.mjs";
import { validateImplementationEvidence } from "./implementation-evidence-contract.mjs";
import { buildImplementationEvidence } from "./implementation-evidence.mjs";
import { approveImplementationScope, proposeImplementationScope } from "./implementation-scope.mjs";
import { PACKAGE_ROOT, SYMLINK_PREFIX } from "./paths.mjs";
import { buildReviewHandoff } from "./review-handoff.mjs";
import { verifyReviewHandoff } from "./review-handoff-receipt.mjs";
import { buildReviewWorkflow } from "./review-workflow.mjs";
import { buildTargetRepoIntake } from "./target-repo-intake.mjs";

function git(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  return result.stdout.trimEnd();
}

function createTargetRepo() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-evidence-target-"));
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test", build: "vite build" } }, null, 2));
  git(root, ["init", "-b", "main"]);
  git(root, ["config", "user.name", "Design AI Test"]);
  git(root, ["config", "user.email", "design-ai@example.com"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "test: initialize target"]);
  git(root, ["remote", "add", "origin", "https://github.com/acme/site.git"]);
  return root;
}

function approvedScope(root) {
  const workflow = buildReviewWorkflow("<!doctype html><html lang=\"ko\"><body>설정</body></html>", {
    sourceRef: "settings.html",
    brief: "설정 화면을 검토한다",
    siteName: "Acme settings",
    repoUrl: "https://github.com/acme/site",
    localPath: root,
    locale: "ko-KR",
    viewports: ["mobile", "desktop"],
    generatedAt: "2026-07-15T00:00:00.000Z",
    sourceRoot: PACKAGE_ROOT,
    prefix: SYMLINK_PREFIX,
  });
  const handoff = buildReviewHandoff(JSON.stringify(workflow), {
    workflowRef: "review-workflow.json",
    recipient: "codex",
  });
  const receipt = verifyReviewHandoff(JSON.stringify(handoff), {
    handoffRef: "review-handoff.json",
    consumer: "codex",
  });
  const intake = buildTargetRepoIntake(JSON.stringify(receipt), {
    receiptRef: "review-handoff-receipt.json",
    targetRoot: root,
    consumer: "codex",
  });
  const scopeRequest = {
    kind: "design-ai-implementation-scope-request",
    schemaVersion: 1,
    objective: "Clarify the settings screen and retain implementation evidence.",
    intendedBehavior: ["The settings screen remains accessible and responsive."],
    files: {
      inspect: ["src/settings/**/*.tsx"],
      change: ["src/settings/**/*.tsx"],
      generated: ["evidence/**"],
    },
    dependencies: [],
    migrations: [],
    externalWrites: [],
    verificationCommands: ["npm test", "npm run build"],
    risks: ["Responsive behavior requires browser confirmation."],
    preExistingChanges: [],
    release: { commit: true, push: true, deployment: false },
  };
  const proposal = proposeImplementationScope(JSON.stringify(intake), JSON.stringify(scopeRequest), {
    intakeRef: "target-repo-intake.json",
    requestRef: "implementation-scope-request.json",
    consumer: "codex",
  });
  return approveImplementationScope(JSON.stringify(proposal), {
    proposalRef: "implementation-scope-proposal.json",
    approver: "product owner",
    approvalRef: "approved in task",
    approvedAt: "2026-07-15T01:00:00.000Z",
    confirmed: true,
  });
}

function writeImplementation(root) {
  mkdirSync(path.join(root, "src", "settings"), { recursive: true });
  mkdirSync(path.join(root, "evidence"), { recursive: true });
  writeFileSync(path.join(root, "src", "settings", "view.tsx"), "export function Settings() { return <button>저장</button>; }\n");
  writeFileSync(path.join(root, "evidence", "test.log"), "2 tests passed\n");
  writeFileSync(path.join(root, "evidence", "accessibility.json"), "{\"violations\":[]}\n");
  writeFileSync(path.join(root, "evidence", "responsive.png"), "responsive screenshot bytes\n");
  writeFileSync(path.join(root, "evidence", "browser.json"), "{\"consoleErrors\":0}\n");
}

function statusItems(root) {
  return git(root, ["-c", "core.quotepath=false", "status", "--short", "--untracked-files=all"])
    .split("\n")
    .filter(Boolean)
    .map((statusEntry) => ({ statusEntry, path: statusEntry.slice(3) }));
}

function evidenceRequest(root, overrides = {}) {
  const work = statusItems(root).map(({ statusEntry, path: filePath }) => ({
    statusEntry,
    path: filePath,
    summary: filePath.startsWith("src/") ? "Implemented the approved settings UI." : "Recorded approved verification evidence.",
  }));
  return {
    kind: "design-ai-implementation-evidence-request",
    schemaVersion: 1,
    consumer: "codex",
    implementationStartedAt: "2026-07-15T01:01:00.000Z",
    implementationCompletedAt: "2026-07-15T01:10:00.000Z",
    executedWork: work,
    verificationResults: [
      {
        command: "npm test",
        status: "pass",
        startedAt: "2026-07-15T01:05:00.000Z",
        completedAt: "2026-07-15T01:06:00.000Z",
        exitCode: 0,
        summary: "Unit tests passed.",
        artifacts: ["evidence/test.log"],
      },
      {
        command: "npm run build",
        status: "pass",
        startedAt: "2026-07-15T01:06:00.000Z",
        completedAt: "2026-07-15T01:07:00.000Z",
        exitCode: 0,
        summary: "Production build passed.",
        artifacts: ["evidence/test.log"],
      },
    ],
    observations: [
      { id: "a11y", category: "accessibility", status: "confirmed", summary: "No automated violations.", artifacts: ["evidence/accessibility.json"] },
      { id: "responsive", category: "responsive", status: "confirmed", summary: "Mobile and desktop layouts fit.", artifacts: ["evidence/responsive.png"] },
      { id: "browser", category: "browser", status: "confirmed", summary: "Browser console remained clean.", artifacts: ["evidence/browser.json"] },
    ],
    remainingRisks: [],
    ...overrides,
  };
}

function build(root, approval, request) {
  return buildImplementationEvidence(JSON.stringify(approval), JSON.stringify(request), {
    approvalRef: "implementation-scope-approval.json",
    requestRef: "implementation-evidence-request.json",
    targetRoot: root,
    consumer: "codex",
  });
}

test("file selectors support readable exact, star, double-star, and question matching", () => {
  assert.equal(matchesFileSelector("src/settings/view.tsx", "src/settings/**/*.tsx"), true);
  assert.equal(matchesFileSelector("src/settings/deep/view.tsx", "src/settings/**/*.tsx"), true);
  assert.equal(matchesFileSelector("src/settings/view.ts", "src/settings/**/*.tsx"), false);
  assert.equal(matchesFileSelector("evidence/a.json", "evidence/**"), true);
  assert.equal(matchesFileSelector("icon-1.svg", "icon-?.svg"), true);
});

test("implementation evidence binds approved changes, verification, and exact artifact identities", () => {
  const root = createTargetRepo();
  try {
    const approval = approvedScope(root);
    writeImplementation(root);
    const evidence = build(root, approval, evidenceRequest(root));

    assert.equal(evidence.status, "evidence-complete", JSON.stringify(evidence.issues, null, 2));
    assert.equal(evidence.issues.length, 0);
    assert.equal(evidence.observed.worktreeChanges.length, 5);
    assert.ok(evidence.observed.worktreeChanges.every((change) => change.reported && change.selector));
    assert.equal(evidence.artifacts.length, 4);
    assert.deepEqual(evidence.verification.summary, { pass: 2, fail: 0, notRun: 0 });
    assert.equal(evidence.nextAction.id, "commit-approval-required");
    assert.deepEqual(evidence.nextAction.approvalRequiredBefore, ["commit", "push"]);
    assert.equal(evidence.boundary.applicationSourceRead, false);
    assert.equal(evidence.boundary.verificationCommandsExecuted.length, 0);
    assert.equal(evidence.boundary.commitAuthorized, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("missing approved target returns blocked evidence instead of a filesystem error", () => {
  const root = createTargetRepo();
  const approval = approvedScope(root);
  writeImplementation(root);
  const request = evidenceRequest(root);
  rmSync(root, { recursive: true, force: true });

  const evidence = build(root, approval, request);

  assert.equal(evidence.status, "blocked");
  assert.ok(evidence.issues.some((item) => item.id === "git-repository-required"));
  assert.ok(evidence.issues.some((item) => item.id === "target-root-drift"));
  assert.equal(evidence.boundary.targetRepoMutation, false);
});

test("failed or missing verification remains attention-required rather than becoming pass", () => {
  const root = createTargetRepo();
  try {
    const approval = approvedScope(root);
    writeImplementation(root);
    const request = evidenceRequest(root);
    request.verificationResults[1] = {
      command: "npm run build",
      status: "not-run",
      startedAt: "",
      completedAt: "",
      exitCode: null,
      summary: "Build was not run.",
      artifacts: [],
    };
    request.observations[1] = {
      id: "responsive",
      category: "responsive",
      status: "unverified",
      summary: "Responsive behavior was not exercised.",
      artifacts: [],
    };
    const evidence = build(root, approval, request);
    assert.equal(evidence.status, "attention-required", JSON.stringify(evidence.issues, null, 2));
    assert.ok(evidence.issues.some((item) => item.id === "verification-not-run"));
    assert.ok(evidence.issues.some((item) => item.id === "observation-unverified"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("HEAD drift and changed files outside approved selectors block evidence", () => {
  const root = createTargetRepo();
  try {
    const approval = approvedScope(root);
    writeFileSync(path.join(root, "README.md"), "outside scope\n");
    git(root, ["add", "README.md"]);
    git(root, ["commit", "-m", "test: drift after approval"]);
    writeImplementation(root);
    const evidence = build(root, approval, evidenceRequest(root));
    assert.equal(evidence.status, "blocked");
    assert.ok(evidence.issues.some((item) => item.id === "head-drift"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }

  const secondRoot = createTargetRepo();
  try {
    const approval = approvedScope(secondRoot);
    writeImplementation(secondRoot);
    writeFileSync(path.join(secondRoot, "README.md"), "outside scope\n");
    const evidence = build(secondRoot, approval, evidenceRequest(secondRoot));
    assert.equal(evidence.status, "blocked");
    assert.ok(evidence.issues.some((item) => item.id === "change-outside-approved-scope"));
  } finally {
    rmSync(secondRoot, { recursive: true, force: true });
  }
});

test("evidence requests reject false pass metadata and symlink artifacts remain blocked", () => {
  const invalid = {
    kind: "design-ai-implementation-evidence-request",
    schemaVersion: 1,
    consumer: "codex",
    implementationStartedAt: "2026-07-15T01:01:00.000Z",
    implementationCompletedAt: "2026-07-15T01:02:00.000Z",
    executedWork: [{ statusEntry: "?? src/a.ts", path: "src/a.ts", summary: "Changed A." }],
    verificationResults: [{ command: "npm test", status: "pass", startedAt: "2026-07-15T01:01:00.000Z", completedAt: "2026-07-15T01:02:00.000Z", exitCode: 1, summary: "Passed.", artifacts: [] }],
    observations: [
      { id: "a", category: "accessibility", status: "unverified", summary: "Not run.", artifacts: [] },
      { id: "r", category: "responsive", status: "unverified", summary: "Not run.", artifacts: [] },
      { id: "b", category: "browser", status: "unverified", summary: "Not run.", artifacts: [] },
    ],
    remainingRisks: [],
  };
  assert.throws(() => validateImplementationEvidenceRequest(invalid), /pass result must use exitCode 0/);

  const root = createTargetRepo();
  try {
    const approval = approvedScope(root);
    writeImplementation(root);
    rmSync(path.join(root, "evidence", "browser.json"));
    symlinkSync(path.join(root, "package.json"), path.join(root, "evidence", "browser.json"));
    const evidence = build(root, approval, evidenceRequest(root));
    assert.equal(evidence.status, "blocked");
    assert.ok(evidence.issues.some((item) => item.id === "artifact-unavailable"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("implementation evidence cannot hide an exact-source not-run result", () => {
  const root = createTargetRepo();
  try {
    const approved = approvedScope(root);
    writeImplementation(root);
    const forged = build(root, approved, evidenceRequest(root));
    forged.request.value.verificationResults[0] = {
      command: "npm test",
      status: "not-run",
      startedAt: "",
      completedAt: "",
      exitCode: null,
      summary: "Not run.",
      artifacts: [],
    };
    forged.request.source = JSON.stringify(forged.request.value);
    forged.request.bytes = Buffer.byteLength(forged.request.source, "utf8");
    forged.request.sha256 = createHash("sha256").update(forged.request.source).digest("hex");
    forged.verification.results = structuredClone(forged.request.value.verificationResults);
    forged.verification.summary = { pass: 1, fail: 0, notRun: 1 };
    forged.artifacts = forged.artifacts.filter((artifact) => artifact.path !== "evidence/test.log");
    forged.issues = [];
    forged.status = "evidence-complete";
    assert.throws(() => validateImplementationEvidence(forged), /cannot hide missing or uncertain proof/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
