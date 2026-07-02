// Shared test helpers for the learn.* test suite.

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export function withTempDir(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-learn-test-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function withTempDirAsync(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-learn-test-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function captureStdout(fn) {
  const lines = [];
  const originalLog = console.log;
  console.log = (...args) => {
    lines.push(args.join(" "));
  };
  try {
    await fn();
  } finally {
    console.log = originalLog;
  }
  return lines.join("\n");
}

export async function withLearningEnv({ learningFile, usageFile }, fn) {
  const previousLearningFile = process.env.DESIGN_AI_LEARNING_FILE;
  const previousUsageFile = process.env.DESIGN_AI_LEARNING_USAGE_FILE;
  process.env.DESIGN_AI_LEARNING_FILE = learningFile;
  process.env.DESIGN_AI_LEARNING_USAGE_FILE = usageFile;
  try {
    return await fn();
  } finally {
    if (previousLearningFile === undefined) {
      delete process.env.DESIGN_AI_LEARNING_FILE;
    } else {
      process.env.DESIGN_AI_LEARNING_FILE = previousLearningFile;
    }
    if (previousUsageFile === undefined) {
      delete process.env.DESIGN_AI_LEARNING_USAGE_FILE;
    } else {
      process.env.DESIGN_AI_LEARNING_USAGE_FILE = previousUsageFile;
    }
  }
}

import assert from "node:assert/strict";

import { runLearn } from "../commands/learn.mjs";
import { defaultLearningUsageFile } from "./learn.mjs";
import {
  buildSkillEvolutionProposals,
  buildSkillProposalApplyPlan,
} from "./skill-proposals.mjs";

export function writeStrictProposalsFixture(dir) {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-10T00:00:02.000Z",
    entries: [
      {
        id: "learn-check-a",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No mobile behavior note detected.",
        source: "check:website-improvement",
        createdAt: "2026-06-10T00:00:01.000Z",
      },
      {
        id: "learn-check-b",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No tablet behavior note detected.",
        source: "check:website-improvement",
        createdAt: "2026-06-10T00:00:02.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-10T00:00:02.000Z",
    profileFile: filePath,
    events: [],
  }), "utf8");
  const before = readFileSync(filePath, "utf8");
  const candidateSkillPath = path.resolve("skills/website-improvement/SKILL.md");
  const candidateSkillBefore = readFileSync(candidateSkillPath, "utf8");
  return { filePath, usageFile, before, candidateSkillPath, candidateSkillBefore };
}

export function writePendingReviewFile(dir, strictPayload) {
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
  return reviewFile;
}

export function writeCleanReviewFile(dir, strictPayload) {
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
  return cleanReviewFile;
}

export function buildAcceptedApplyPlanFixture(dir, filePath, usageFile, strictPayload) {
    const acceptedReviewFile = path.join(dir, "skill-proposals.accepted.review.json");
    writeFileSync(acceptedReviewFile, JSON.stringify({
      version: 1,
      decisions: [
        {
          proposalId: strictPayload.proposals[0].id,
          status: "accepted",
          reviewedAt: "2026-06-10T00:07:00.000Z",
          reviewer: "local-operator",
          note: "Instruction delta is accepted for manual skill editing.",
        },
      ],
    }), "utf8");
    const acceptedReviewBefore = readFileSync(acceptedReviewFile, "utf8");
    const acceptedProposalPayload = buildSkillEvolutionProposals({
      filePath,
      usageFile,
      signalSource: dir,
      root: dir,
      reviewFile: acceptedReviewFile,
      signalRegistryProvider: ({ signalSource }) => ({
        status: "pass",
        signalSource: path.resolve(signalSource),
      }),
    });
    const applyPlan = buildSkillProposalApplyPlan(acceptedProposalPayload, {
      generatedAt: new Date("2026-06-10T00:12:00.000Z"),
    });
    assert.equal(applyPlan.kind, "skill-proposal-apply-plan");
    assert.equal(applyPlan.status, "warn");
    assert.equal(applyPlan.acceptedCount, 1);
    assert.equal(applyPlan.tasks[0].proposalId, strictPayload.proposals[0].id);
    assert.equal(applyPlan.tasks[0].candidateSkillPath, "skills/website-improvement/SKILL.md");
    assert.match(applyPlan.tasks[0].manualSteps.join("\n"), /update the review decision from `accepted` to `applied`/);
    assert.match(applyPlan.commands.reviewCheckJson, /--file /);
    assert.match(applyPlan.commands.reviewCheckJson, /--usage-file /);
    assert.match(applyPlan.commands.reviewCheckJson, /--from-file /);
    assert.match(applyPlan.commands.reviewCheckJson, /--review-check --json/);
    const applyPlanContextArgs = [
      "design-ai",
      "learn",
      "--propose-skills",
      "--file",
      filePath,
      "--usage-file",
      usageFile,
      "--from-file",
      dir,
      "--review-file",
      acceptedReviewFile,
    ];
  return {
    acceptedReviewFile,
    acceptedReviewBefore,
    acceptedProposalPayload,
    applyPlan,
    applyPlanContextArgs,
  };
}

export async function runStrictProposalsPayload({ dir, filePath, usageFile }) {
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
  process.exitCode = 0;
  return JSON.parse(strictOutput);
}
