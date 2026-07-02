// Tests for runLearn --propose-skills --strict passes with a reviewed decision file.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runLearn } from "../commands/learn.mjs";
import { buildSkillEvolutionProposals, buildSkillProposalReviewCheck, renderSkillProposalReviewCheckReport } from "./skill-proposals.mjs";
import {
  captureStdout,
  runStrictProposalsPayload,
  withTempDirAsync,
  writeStrictProposalsFixture,
} from "./learn-test-support.mjs";

test("runLearn --propose-skills --strict passes with a reviewed decision file", () => withTempDirAsync(async (dir) => {
  const { filePath, usageFile, before } = writeStrictProposalsFixture(dir);
  const previousExitCode = process.exitCode;
  try {
    process.exitCode = undefined;
    const strictPayload = await runStrictProposalsPayload({ dir, filePath, usageFile });
    const reviewFile = path.join(dir, "skill-proposals.review.json");
    writeFileSync(reviewFile, JSON.stringify({
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
    }), "utf8");

    process.exitCode = 0;
    const reviewedStrictOutput = await captureStdout(() => runLearn([
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      reviewFile,
      "--strict",
      "--json",
    ]));
    const reviewedStrictPayload = JSON.parse(reviewedStrictOutput);
    assert.equal(reviewedStrictPayload.status, "warn");
    assert.equal(reviewedStrictPayload.signalStatus, "warn");
    assert.equal(reviewedStrictPayload.pendingReviewCount, 0);
    assert.equal(reviewedStrictPayload.review.appliedCount, 1);
    assert.equal(reviewedStrictPayload.review.staleCount, 1);
    assert.equal(reviewedStrictPayload.proposals[0].reviewStatus, "applied");
    assert.equal(process.exitCode, 1);
    assert.equal(readFileSync(filePath, "utf8"), before);

    const proposalGatePayload = buildSkillEvolutionProposals({
      filePath,
      usageFile,
      signalSource: dir,
      root: dir,
      reviewFile,
      signalRegistryProvider: ({ signalSource }) => ({
        status: "pass",
        signalSource: path.resolve(signalSource),
      }),
    });
    assert.equal(proposalGatePayload.status, "pass");
    assert.equal(proposalGatePayload.pendingReviewCount, 0);
    assert.equal(proposalGatePayload.review.appliedCount, 1);

    const proposalReviewCheck = buildSkillProposalReviewCheck(proposalGatePayload, {
      generatedAt: new Date("2026-06-10T00:10:00.000Z"),
    });
    assert.equal(proposalReviewCheck.kind, "skill-proposal-review-check");
    assert.equal(proposalReviewCheck.status, "warn");
    assert.equal(proposalReviewCheck.proposalStatus, "pass");
    assert.equal(proposalReviewCheck.review.staleCount, 1);
    assert.equal(proposalReviewCheck.privacy.mutatesSkillFiles, false);
    const proposalReviewCheckReport = renderSkillProposalReviewCheckReport(proposalReviewCheck, {
      generatedAt: new Date("2026-06-10T00:11:00.000Z"),
    });
    assert.match(proposalReviewCheckReport, /^# Skill Proposal Review Check/);
    assert.match(proposalReviewCheckReport, /- Status: warn/);
    assert.match(proposalReviewCheckReport, /- Mutates skill files: no/);
  } finally {
    process.exitCode = previousExitCode;
  }
}));
