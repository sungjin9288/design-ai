// Tests for runLearn --propose-skills --patch and --review-template write preview artifacts without mutating skills.

import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runLearn } from "../commands/learn.mjs";
import {
  captureStdout,
  runStrictProposalsPayload,
  withTempDirAsync,
  writePendingReviewFile,
  writeStrictProposalsFixture,
} from "./learn-test-support.mjs";

test("runLearn --propose-skills --patch and --review-template write preview artifacts without mutating skills", () => withTempDirAsync(async (dir) => {
  const { filePath, usageFile, before } = writeStrictProposalsFixture(dir);
  const previousExitCode = process.exitCode;
  try {
    process.exitCode = undefined;
    const strictPayload = await runStrictProposalsPayload({ dir, filePath, usageFile });
    const reviewFile = writePendingReviewFile(dir, strictPayload);
    const reviewedPatchOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      reviewFile,
      "--patch",
    ]));
    assert.match(reviewedPatchOutput, /No pending skill proposal deltas remain after review-file decisions/);
    assert.doesNotMatch(reviewedPatchOutput, /diff --git/);

    const reviewedTemplateFile = path.join(dir, "review-template.json");
    const reviewedTemplateWriteOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      reviewFile,
      "--review-template",
      "--out",
      reviewedTemplateFile,
    ]));
    assert.match(reviewedTemplateWriteOutput, /Wrote /);
    const reviewedTemplatePayload = JSON.parse(readFileSync(reviewedTemplateFile, "utf8"));
    assert.equal(reviewedTemplatePayload.summary.templateDecisionCount, 0);
    assert.deepEqual(reviewedTemplatePayload.decisions, []);
    assert.equal(readFileSync(filePath, "utf8"), before);
    assert.equal(readFileSync(reviewFile, "utf8"), JSON.stringify({
      version: 1,
      decisions: [
        {
          proposalId: strictPayload.proposals[0].id,
          status: "applied",
          reviewedAt: "2026-06-10T00:05:00.000Z",
          reviewer: "local-operator",
          note: "Instruction delta was manually reviewed and applied.",
        },
        {
          proposalId: "skill-proposal-stale",
          status: "rejected",
          reviewedAt: "2026-06-09T00:00:00.000Z",
        },
      ],
    }));
  } finally {
    process.exitCode = previousExitCode;
  }
}));
