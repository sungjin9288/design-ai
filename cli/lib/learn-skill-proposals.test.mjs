// Tests for skill evolution proposal generation and reports.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { defaultLearningUsageFile } from "./learn.mjs";
import { buildSkillEvolutionProposals, renderSkillEvolutionProposalReport } from "./skill-proposals.mjs";
import { runLearn } from "../commands/learn.mjs";
import { captureStdout, withTempDir, withTempDirAsync } from "./learn-test-support.mjs";

test("buildSkillEvolutionProposals groups repeated check captures into preview-only skill deltas", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:03.000Z",
    entries: [
      {
        id: "learn-check-a",
        category: "accessibility",
        text: "Improve future outputs by addressing Keyboard and focus behavior: No keyboard or focus behavior note detected.",
        source: "check:component-spec",
        createdAt: "2026-06-02T00:00:01.000Z",
      },
      {
        id: "learn-check-b",
        category: "accessibility",
        text: "Improve future outputs by addressing Screen reader behavior: No screen-reader behavior note detected.",
        source: "check:component-spec",
        createdAt: "2026-06-02T00:00:02.000Z",
      },
      {
        id: "learn-check-single",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No mobile behavior note detected.",
        source: "check:artifact",
        createdAt: "2026-06-02T00:00:03.000Z",
      },
    ],
  }), "utf8");

  const payload = buildSkillEvolutionProposals({
    filePath,
    usageFile,
    signalSource: dir,
    root: dir,
    now: new Date("2026-06-02T00:00:04.000Z"),
    signalRegistryProvider: ({ filePath: registryFile, usageFile: registryUsage, signalSource }) => ({
      status: "pass",
      signalSource: path.resolve(signalSource),
      file: registryFile,
      usageFile: registryUsage,
    }),
  });

  assert.equal(payload.dryRun, true);
  assert.equal(payload.applied, false);
  assert.equal(payload.status, "warn");
  assert.equal(payload.checkCaptureCount, 3);
  assert.equal(payload.candidateCount, 2);
  assert.equal(payload.proposalCount, 1);
  assert.equal(payload.skippedCount, 1);
  assert.equal(payload.proposals[0].candidateSkillPath, "skills/component-spec-writer/SKILL.md");
  assert.equal(payload.proposals[0].riskLevel, "low");
  assert.deepEqual(payload.proposals[0].routeIds, ["component-spec"]);
  assert.match(payload.proposals[0].proposedInstructionDelta, /accessibility checkpoint/);
  assert.match(payload.proposals[0].verificationCommand, /--route component-spec/);
  assert.equal(payload.proposals[0].evidenceSources.length, 2);
  assert.equal(payload.privacy.mutatesSkillFiles, false);
}));

test("buildSkillEvolutionProposals honors custom minimum evidence threshold", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:02.000Z",
    entries: [
      {
        id: "learn-check-a",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No mobile behavior note detected.",
        source: "check:website-improvement",
        createdAt: "2026-06-02T00:00:01.000Z",
      },
      {
        id: "learn-check-b",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No tablet behavior note detected.",
        source: "check:website-improvement",
        createdAt: "2026-06-02T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const payload = buildSkillEvolutionProposals({
    filePath,
    usageFile,
    signalSource: dir,
    root: dir,
    minEvidenceCount: 3,
    signalRegistryProvider: ({ signalSource }) => ({
      status: "pass",
      signalSource: path.resolve(signalSource),
    }),
  });

  assert.equal(payload.minEvidenceCount, 3);
  assert.equal(payload.proposalCount, 0);
  assert.equal(payload.skippedCount, 1);
  assert.match(payload.skipped[0].reason, /Needs at least 3/);
  assert.equal(payload.status, "pass");
}));

test("renderSkillEvolutionProposalReport emits reviewer-friendly Markdown without apply semantics", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:02.000Z",
    entries: [
      {
        id: "learn-check-a",
        category: "accessibility",
        text: "Improve future outputs by addressing Keyboard and focus behavior: No keyboard behavior note detected.",
        source: "check:component-spec",
        createdAt: "2026-06-02T00:00:01.000Z",
      },
      {
        id: "learn-check-b",
        category: "accessibility",
        text: "Improve future outputs by addressing Screen reader behavior: No screen-reader behavior note detected.",
        source: "check:component-spec",
        createdAt: "2026-06-02T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const payload = buildSkillEvolutionProposals({
    filePath,
    usageFile,
    signalSource: dir,
    root: dir,
    now: new Date("2026-06-02T00:00:03.000Z"),
    signalRegistryProvider: ({ signalSource }) => ({
      status: "pass",
      signalSource: path.resolve(signalSource),
    }),
  });
  const report = renderSkillEvolutionProposalReport(payload, {
    generatedAt: new Date("2026-06-02T00:00:04.000Z"),
  });

  assert.match(report, /^# Skill Evolution Proposal Report/);
  assert.match(report, /Status: warn/);
  assert.match(report, /Minimum evidence: 2/);
  assert.match(report, /## Proposed Skill Deltas/);
  assert.match(report, /skills\/component-spec-writer\/SKILL\.md/);
  assert.match(report, /```bash\nnode cli\/bin\/design-ai\.mjs check --examples --route component-spec --limit 1 --strict --json\n```/);
  assert.match(report, /Mutates skill files: no/);
  assert.match(report, /This report is preview-only evidence; it does not apply changes\./);
}));

test("runLearn --propose-skills reports JSON and human output without mutating the profile", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:02.000Z",
    entries: [
      {
        id: "learn-check-a",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No mobile behavior note detected.",
        source: "check:website-improvement",
        createdAt: "2026-06-02T00:00:01.000Z",
      },
      {
        id: "learn-check-b",
        category: "workflow",
        text: "Improve future outputs by addressing Responsive behavior: No tablet behavior note detected.",
        source: "check:website-improvement",
        createdAt: "2026-06-02T00:00:02.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(usageFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-06-02T00:00:02.000Z",
    profileFile: filePath,
    events: [],
  }), "utf8");
  const before = readFileSync(filePath, "utf8");
  const candidateSkillPath = path.resolve("skills/website-improvement/SKILL.md");
  const candidateSkillBefore = readFileSync(candidateSkillPath, "utf8");

  const jsonOutput = await captureStdout(() => runLearn([
    "--propose-skills",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--min-evidence",
    "2",
    "--json",
  ]));
  const payload = JSON.parse(jsonOutput);
  assert.equal(payload.file, filePath);
  assert.equal(payload.status, "warn");
  assert.equal(payload.minEvidenceCount, 2);
  assert.equal(payload.proposalCount, 1);
  assert.equal(payload.proposals[0].candidateSkillPath, "skills/website-improvement/SKILL.md");
  assert.equal(payload.privacy.mutatesSkillFiles, false);
  assert.equal(readFileSync(filePath, "utf8"), before);

  const humanOutput = await captureStdout(() => runLearn([
    "--propose-skills",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
  ]));
  assert.match(humanOutput, /Skill evolution proposals/);
  assert.match(humanOutput, /Status: warn/);
  assert.match(humanOutput, /Min evidence: 2/);
  assert.match(humanOutput, /Proposed skill deltas:/);
  assert.match(humanOutput, /skills\/website-improvement\/SKILL\.md/);
  assert.match(humanOutput, /No changes made/);

  const reportPath = path.join(dir, "skill-proposals.md");
  const reportOutput = await captureStdout(() => runLearn([
    "--propose-skills",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--report",
    "--out",
    reportPath,
  ]));
  assert.match(reportOutput, /Wrote /);
  assert.equal(readFileSync(filePath, "utf8"), before);
  const report = readFileSync(reportPath, "utf8");
  assert.match(report, /^# Skill Evolution Proposal Report/);
  assert.match(report, /skills\/website-improvement\/SKILL\.md/);
  assert.match(report, /Mutates learning profile: no/);

  const patchPath = path.join(dir, "skill-proposals.patch");
  const patchOutput = await captureStdout(() => runLearn([
    "--propose-skills",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--from-file",
    dir,
    "--patch",
    "--out",
    patchPath,
  ]));
  assert.match(patchOutput, /Wrote /);
  assert.equal(readFileSync(filePath, "utf8"), before);
  assert.equal(readFileSync(candidateSkillPath, "utf8"), candidateSkillBefore);
  const patch = readFileSync(patchPath, "utf8");
  assert.match(patch, /^# design-ai skill proposal patch preview/);
  assert.match(patch, /diff --git a\/skills\/website-improvement\/SKILL\.md b\/skills\/website-improvement\/SKILL\.md/);
  assert.match(patch, /\+## Local Learning Proposal: skill-proposal-website-improvement-/);
  assert.match(patch, /\+- Proposed instruction: Add a responsive QA checkpoint/);
  assert.match(patch, /\+- Verification: `node cli\/bin\/design-ai\.mjs check --examples --route website-improvement --limit 1 --strict --json`/);
}));
