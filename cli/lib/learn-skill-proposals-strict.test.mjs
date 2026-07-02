// Tests for runLearn --propose-skills --strict exits non-zero and emits a review template when review is pending.

import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runLearn } from "../commands/learn.mjs";
import {
  captureStdout,
  withTempDirAsync,
  writeStrictProposalsFixture,
} from "./learn-test-support.mjs";

test("runLearn --propose-skills --strict exits non-zero and emits a review template when review is pending", () => withTempDirAsync(async (dir) => {
  const { filePath, usageFile, before } = writeStrictProposalsFixture(dir);
  const previousExitCode = process.exitCode;
  try {
    process.exitCode = undefined;
    const strictOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--strict",
      "--json",
    ]));
    const strictPayload = JSON.parse(strictOutput);
    assert.equal(strictPayload.status, "warn");
    assert.equal(strictPayload.proposalCount, 1);
    assert.equal(strictPayload.pendingReviewCount, 1);
    assert.equal(process.exitCode, 1);
    assert.equal(readFileSync(filePath, "utf8"), before);

    process.exitCode = 0;
    const reviewTemplateOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-template",
    ]));
    const reviewTemplatePayload = JSON.parse(reviewTemplateOutput);
    assert.equal(reviewTemplatePayload.version, 1);
    assert.equal(reviewTemplatePayload.source, "design-ai learn --propose-skills --review-template");
    assert.equal(reviewTemplatePayload.summary.templateDecisionCount, 1);
    assert.equal(reviewTemplatePayload.decisions[0].proposalId, strictPayload.proposals[0].id);
    assert.equal(reviewTemplatePayload.decisions[0].status, "deferred");
    assert.equal(readFileSync(filePath, "utf8"), before);
  } finally {
    process.exitCode = previousExitCode;
  }
}));
