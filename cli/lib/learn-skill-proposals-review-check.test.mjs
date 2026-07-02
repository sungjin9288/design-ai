// Tests for runLearn --propose-skills --review-check reports readiness in JSON, human, and Markdown.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runLearn } from "../commands/learn.mjs";
import {
  captureStdout,
  runStrictProposalsPayload,
  withTempDirAsync,
  writeStrictProposalsFixture,
} from "./learn-test-support.mjs";

test("runLearn --propose-skills --review-check reports readiness in JSON, human, and Markdown", () => withTempDirAsync(async (dir) => {
  const { filePath, usageFile, before } = writeStrictProposalsFixture(dir);
  const previousExitCode = process.exitCode;
  try {
    process.exitCode = undefined;
    const strictPayload = await runStrictProposalsPayload({ dir, filePath, usageFile });
    const cleanReviewFile = path.join(dir, "skill-proposals.clean.review.json");
    writeFileSync(cleanReviewFile, JSON.stringify({
      version: 1,
      decisions: [
        {
          proposalId: strictPayload.proposals[0].id,
          status: "applied",
          reviewedAt: "2026-06-10T00:06:00.000Z",
          reviewer: "local-operator",
          note: "Instruction delta was manually reviewed and applied.",
        },
      ],
    }), "utf8");
    const cleanReviewBefore = readFileSync(cleanReviewFile, "utf8");

    process.exitCode = 0;
    const reviewCheckJsonOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      cleanReviewFile,
      "--review-check",
      "--strict",
      "--json",
    ]));
    const reviewCheckJsonPayload = JSON.parse(reviewCheckJsonOutput);
    assert.equal(reviewCheckJsonPayload.kind, "skill-proposal-review-check");
    assert.equal(reviewCheckJsonPayload.status, "pass");
    assert.equal(reviewCheckJsonPayload.proposalStatus, "warn");
    assert.equal(reviewCheckJsonPayload.pendingReviewCount, 0);
    assert.equal(reviewCheckJsonPayload.review.appliedCount, 1);
    assert.equal(reviewCheckJsonPayload.review.staleCount, 0);
    assert.equal(reviewCheckJsonPayload.summary.failures, 0);
    assert.equal(reviewCheckJsonPayload.summary.warnings, 0);
    assert.equal(process.exitCode, 0);
    assert.equal(readFileSync(filePath, "utf8"), before);
    assert.equal(readFileSync(cleanReviewFile, "utf8"), cleanReviewBefore);

    const reviewCheckHumanOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      cleanReviewFile,
      "--review-check",
    ]));
    assert.match(reviewCheckHumanOutput, /Skill proposal review check/);
    assert.match(reviewCheckHumanOutput, /Status: pass/);
    assert.match(reviewCheckHumanOutput, /Privacy: review check is read-only/);

    const reviewCheckReportPath = path.join(dir, "skill-proposals-review-check.md");
    const reviewCheckReportOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      cleanReviewFile,
      "--review-check",
      "--report",
      "--out",
      reviewCheckReportPath,
    ]));
    assert.match(reviewCheckReportOutput, /Wrote /);
    const reviewCheckReport = readFileSync(reviewCheckReportPath, "utf8");
    assert.match(reviewCheckReport, /^# Skill Proposal Review Check/);
    assert.match(reviewCheckReport, /- Status: pass/);
    assert.match(reviewCheckReport, /- Mutates skill files: no/);
    assert.equal(readFileSync(filePath, "utf8"), before);

    const acceptedReviewFile = path.join(dir, "skill-proposals.accepted.review.json");
  } finally {
    process.exitCode = previousExitCode;
  }
}));
