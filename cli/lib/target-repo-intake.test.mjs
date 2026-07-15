import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

import { buildReviewHandoff } from "./review-handoff.mjs";
import { verifyReviewHandoff } from "./review-handoff-receipt.mjs";
import { reviewHandoffReceiptSourceDigest } from "./review-handoff-receipt-contract.mjs";
import { buildReviewWorkflow } from "./review-workflow.mjs";
import { PACKAGE_ROOT, SYMLINK_PREFIX } from "./paths.mjs";
import { validateTargetRepoIntake } from "./target-repo-intake-contract.mjs";
import {
  buildTargetRepoIntake,
  buildTargetRepoIntakeFromFile,
  parseTargetRepoIntakeArgs,
} from "./target-repo-intake.mjs";

function runGit(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  }
}

function createTargetRepo() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-target-intake-"));
  writeFileSync(path.join(root, "package.json"), JSON.stringify({
    scripts: { dev: "vite", build: "vite build", test: "node --test" },
    devDependencies: { vite: "7.0.0" },
    packageManager: "pnpm@10.0.0",
  }, null, 2));
  writeFileSync(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  runGit(root, ["init", "-b", "main"]);
  runGit(root, ["config", "user.name", "Design AI Test"]);
  runGit(root, ["config", "user.email", "design-ai@example.com"]);
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-m", "test: initialize target"]);
  runGit(root, ["remote", "add", "origin", "https://github.com/acme/site.git"]);
  return root;
}

function receiptSource(
  targetRoot,
  consumer = "codex",
  repoUrl = "https://github.com/acme/site",
) {
  const workflow = buildReviewWorkflow(
    "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>",
    {
      sourceRef: "settings.html",
      brief: "한국어 설정 화면을 검토한다",
      siteName: "Acme settings",
      repoUrl,
      localPath: targetRoot,
      url: "http://localhost:4173/settings",
      locale: "ko-KR",
      viewports: ["mobile", "desktop"],
      generatedAt: "2026-07-15T00:00:00.000Z",
      sourceRoot: PACKAGE_ROOT,
      prefix: SYMLINK_PREFIX,
    },
  );
  const handoff = buildReviewHandoff(JSON.stringify(workflow, null, 2), {
    workflowRef: "review-workflow.json",
    recipient: consumer,
  });
  const receipt = verifyReviewHandoff(`${JSON.stringify(handoff, null, 2)}\n`, {
    handoffRef: "review-handoff.json",
    consumer,
  });
  return `${JSON.stringify(receipt, null, 2)}\n`;
}

test("target repo intake records bounded metadata for the declared clean repository", () => {
  const root = createTargetRepo();
  try {
    const source = receiptSource(root);
    const intake = buildTargetRepoIntake(source, {
      receiptRef: "review-handoff-receipt.json",
      targetRoot: root,
      consumer: "codex",
    });

    assert.equal(intake.kind, "design-ai-target-repo-intake");
    assert.equal(intake.status, "ready-for-scope-review");
    assert.equal(intake.receipt.sha256, reviewHandoffReceiptSourceDigest(source));
    assert.equal(intake.receipt.bytes, Buffer.byteLength(source, "utf8"));
    assert.equal(intake.target.pathMatch, true);
    assert.equal(intake.target.repositoryUrlMatch, true);
    assert.equal(intake.project.framework, "Vite");
    assert.equal(intake.project.packageManager, "pnpm");
    assert.deepEqual(intake.inspection.metadataFilesRead, ["package.json"]);
    assert.deepEqual(intake.inspection.applicationSourceFilesRead, []);
    assert.equal(intake.git.repository, true);
    assert.equal(intake.git.branch, "main");
    assert.equal(intake.git.clean, true);
    assert.equal(intake.git.remoteMatch, true);
    assert.equal(intake.nextAction.implementationAuthorized, false);
    assert.equal(intake.boundary.applicationSourceRead, false);
    assert.strictEqual(validateTargetRepoIntake(intake), intake);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("target repo intake exposes pre-existing target changes without filtering them", () => {
  const root = createTargetRepo();
  try {
    writeFileSync(path.join(root, "DEV_LOG.md"), "existing operator note\n");
    const intake = buildTargetRepoIntake(receiptSource(root), {
      receiptRef: "review-handoff-receipt.json",
      targetRoot: root,
      consumer: "codex",
    });

    assert.equal(intake.status, "attention-required");
    assert.equal(intake.git.clean, false);
    assert.deepEqual(intake.git.changes.entries, ["?? DEV_LOG.md"]);
    assert.ok(intake.issues.some((issue) => issue.id === "target-worktree-dirty"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("target repo intake rejects undeclared paths and consumers before inspection", () => {
  const root = createTargetRepo();
  const other = mkdtempSync(path.join(tmpdir(), "design-ai-other-target-"));
  try {
    const source = receiptSource(root);
    assert.throws(
      () => buildTargetRepoIntake(source, {
        receiptRef: "review-handoff-receipt.json",
        targetRoot: other,
        consumer: "codex",
      }),
      /targetRoot must match the localPath declared/,
    );
    assert.throws(
      () => buildTargetRepoIntake(source, {
        receiptRef: "review-handoff-receipt.json",
        targetRoot: root,
        consumer: "claude",
      }),
      /expected codex, received claude/,
    );
    assert.throws(
      () => buildTargetRepoIntake(source, {
        receiptRef: "review-handoff-receipt.json",
        targetRoot: "relative/site",
        consumer: "codex",
      }),
      /targetRoot must be an absolute path/,
    );
    assert.throws(
      () => buildTargetRepoIntake(receiptSource(root, "codex", ""), {
        receiptRef: "review-handoff-receipt.json",
        targetRoot: root,
        consumer: "codex",
      }),
      /must declare a repoUrl/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(other, { recursive: true, force: true });
  }
});

test("target repo intake does not run Git inspection through a symbolic link", () => {
  const root = createTargetRepo();
  const parent = mkdtempSync(path.join(tmpdir(), "design-ai-target-link-"));
  const linkedRoot = path.join(parent, "linked-target");
  try {
    symlinkSync(root, linkedRoot, "dir");
    const intake = buildTargetRepoIntake(receiptSource(linkedRoot), {
      receiptRef: "review-handoff-receipt.json",
      targetRoot: linkedRoot,
      consumer: "codex",
    });

    assert.equal(intake.status, "blocked");
    assert.equal(intake.git.repository, false);
    assert.deepEqual(intake.inspection.gitCommands, []);
    assert.ok(intake.issues.some((issue) => issue.id === "linked-path-symlink"));
  } finally {
    rmSync(parent, { recursive: true, force: true });
    rmSync(root, { recursive: true, force: true });
  }
});

test("target repo intake contract rejects receipt drift and implementation claims", () => {
  const root = createTargetRepo();
  try {
    const intake = buildTargetRepoIntake(receiptSource(root), {
      receiptRef: "review-handoff-receipt.json",
      targetRoot: root,
      consumer: "codex",
    });
    const invalidDigest = structuredClone(intake);
    invalidDigest.receipt.sha256 = "not-a-digest";
    assert.throws(() => validateTargetRepoIntake(invalidDigest), /digests must be lowercase/);

    const implementationClaim = structuredClone(intake);
    implementationClaim.nextAction.implementationAuthorized = true;
    assert.throws(
      () => validateTargetRepoIntake(implementationClaim),
      /implementation scope approval pending/,
    );

    const forgedGitStatus = structuredClone(intake);
    forgedGitStatus.git.status = "warn";
    assert.throws(
      () => validateTargetRepoIntake(forgedGitStatus),
      /git status does not match its repository evidence/,
    );

    const forgedAggregateStatus = structuredClone(intake);
    forgedAggregateStatus.git.repository = false;
    forgedAggregateStatus.git.status = "fail";
    assert.throws(
      () => validateTargetRepoIntake(forgedAggregateStatus),
      /status does not match its project, Git, and issue evidence/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("target repo intake parser and file operation preserve the receipt", () => {
  const root = createTargetRepo();
  const receiptPath = path.join(root, "review-handoff-receipt.json");
  try {
    writeFileSync(receiptPath, receiptSource(root));
    const parsed = parseTargetRepoIntakeArgs([
      receiptPath,
      "--target-root", root,
      "--consumer", "codex",
      "--json",
    ]);
    const before = readFileSync(receiptPath, "utf8");
    const intake = buildTargetRepoIntakeFromFile(parsed);

    assert.equal(intake.receipt.sha256, reviewHandoffReceiptSourceDigest(before));
    assert.equal(intake.consumer.name, "codex");
    assert.throws(
      () => parseTargetRepoIntakeArgs([receiptPath, "--target-rooot", root]),
      /Did you mean `--target-root`/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
