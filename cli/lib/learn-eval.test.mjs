// Tests for learning eval checkpoints and --with-learning usage recording.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildLearningEvalTemplate, learningEvalReport, loadLearningUsageLog } from "./learn.mjs";
import { runLearn } from "../commands/learn.mjs";
import { runPrompt } from "../commands/prompt.mjs";
import { runPack } from "../commands/pack.mjs";
import {
  captureStdout,
  withLearningEnv,
  withTempDir,
  withTempDirAsync,
} from "./learn-test-support.mjs";

test("learningEvalReport validates expected learning selection without raw brief text", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:03.000Z",
    entries: [
      {
        id: "learn-relevant",
        category: "accessibility",
        text: "Prioritize keyboard accessibility details for Button component API specs",
        source: "test",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-brand",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "test",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const evalText = JSON.stringify({
    version: 1,
    generatedAt: "2026-05-22T00:00:04.000Z",
    sourceProfile: {
      file: filePath,
      exists: true,
      entryCount: 2,
      auditStatus: "pass",
      category: "accessibility",
      query: "Spec a Button component API with keyboard accessibility",
      limit: 6,
    },
    cases: [
      {
        id: "button-accessibility",
        routeId: "component-spec",
        brief: "Spec a Button component API with keyboard accessibility",
        limit: 1,
        expectedSelectedIds: ["learn-relevant"],
        avoidedSelectedIds: ["learn-brand"],
        minMatchedCount: 1,
        requireNoFallback: true,
      },
      {
        id: "brand-avoidance",
        brief: "Spec a Button component API with keyboard accessibility",
        limit: 2,
        avoidedSelectedIds: ["learn-relevant"],
      },
    ],
  });

  const payload = learningEvalReport({
    filePath,
    evalText,
    source: "learning-eval.json",
    limit: 1,
  });

  assert.equal(payload.status, "fail");
  assert.equal(payload.caseCount, 2);
  assert.equal(payload.passed, 1);
  assert.equal(payload.failed, 1);
  assert.equal(payload.generatedAt, "2026-05-22T00:00:04.000Z");
  assert.equal(payload.sourceProfile.file, filePath);
  assert.equal(payload.sourceProfile.entryCount, 2);
  assert.equal(payload.sourceProfile.queryPresent, true);
  assert.equal(payload.sourceProfile.query, undefined);
  assert.equal(payload.cases[0].status, "pass");
  assert.deepEqual(payload.cases[0].selectedEntryIds, ["learn-relevant"]);
  assert.equal(payload.cases[0].briefHash.length, 16);
  assert.equal(payload.cases[1].unexpectedAvoidedIds[0], "learn-relevant");
  assert.equal(payload.privacy.storesRawBriefText, false);
  assert.equal(payload.privacy.exposesMatchedTokens, false);

  const raw = JSON.stringify(payload);
  assert.ok(!raw.includes("Spec a Button component API with keyboard accessibility"));
  assert.ok(!raw.includes("keyboard accessibility"));
}));

test("buildLearningEvalTemplate generates runnable checkpoints from profile selection", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:03.000Z",
    entries: [
      {
        id: "learn-relevant",
        category: "accessibility",
        text: "Prioritize keyboard accessibility details for Button component API specs",
        source: "test",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-brand",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "test",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const template = buildLearningEvalTemplate({
    filePath,
    query: "Spec a Button component API with keyboard accessibility",
    category: "accessibility",
    limit: 3,
    now: new Date("2026-05-22T00:00:04.000Z"),
  });

  assert.equal(template.version, 1);
  assert.equal(template.sourceProfile.file, filePath);
  assert.equal(template.sourceProfile.query, "Spec a Button component API with keyboard accessibility");
  assert.equal(template.caseCount, 1);
  assert.equal(template.cases[0].expectedSelectedIds[0], "learn-relevant");
  assert.equal(template.cases[0].limit, 1);
  assert.equal(template.cases[0].requireNoFallback, true);
  assert.equal(template.privacy.storesRawBriefText, true);

  const report = learningEvalReport({
    filePath,
    evalText: JSON.stringify(template),
    source: "generated-template",
  });
  assert.equal(report.status, "pass");
  assert.deepEqual(report.cases[0].selectedEntryIds, ["learn-relevant"]);
}));

test("runLearn --eval-template writes runnable checkpoint JSON without mutating profile", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const outPath = path.join(dir, "learning-eval.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:01.000Z",
    entries: [
      {
        id: "learn-keyboard",
        category: "accessibility",
        text: "Prioritize keyboard accessibility details for Button component API specs",
        source: "test",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");
  const before = readFileSync(filePath, "utf8");

  const wroteOutput = await captureStdout(() => runLearn([
    "--eval-template",
    "--query",
    "Spec a Button component API with keyboard accessibility",
    "--category",
    "accessibility",
    "--file",
    filePath,
    "--out",
    outPath,
  ]));
  assert.match(wroteOutput, /Wrote/);
  assert.equal(readFileSync(filePath, "utf8"), before);

  const template = JSON.parse(readFileSync(outPath, "utf8"));
  assert.equal(template.caseCount, 1);
  assert.equal(template.cases[0].expectedSelectedIds[0], "learn-keyboard");
  assert.equal(template.privacy.storesRawBriefText, true);

  const evalOutput = await captureStdout(() => runLearn([
    "--eval",
    "--from-file",
    outPath,
    "--file",
    filePath,
    "--strict",
    "--json",
  ]));
  assert.equal(JSON.parse(evalOutput).status, "pass");

  const humanOutput = await captureStdout(() => runLearn([
    "--eval-template",
    "--file",
    filePath,
  ]));
  assert.match(humanOutput, /Learning eval checkpoint template/);
  assert.match(humanOutput, /Privacy: checkpoint templates store raw brief text/);
}));

test("runLearn --eval reports checkpoint results in JSON and human output", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const evalFile = path.join(dir, "learning-eval.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:01.000Z",
    entries: [
      {
        id: "learn-relevant",
        category: "accessibility",
        text: "Prioritize keyboard accessibility details for Button component API specs",
        source: "test",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(evalFile, JSON.stringify({
    version: 1,
    cases: [
      {
        id: "button-accessibility",
        routeId: "component-spec",
        brief: "Spec a Button component API with keyboard accessibility",
        expectedSelectedIds: ["learn-relevant"],
        minMatchedCount: 1,
      },
    ],
  }), "utf8");

  const jsonOutput = await captureStdout(() => runLearn([
    "--eval",
    "--from-file",
    evalFile,
    "--file",
    filePath,
    "--limit",
    "1",
    "--json",
  ]));
  const payload = JSON.parse(jsonOutput);
  assert.equal(payload.source, evalFile);
  assert.equal(payload.status, "pass");
  assert.equal(payload.cases[0].selectedEntryIds[0], "learn-relevant");

  const humanOutput = await captureStdout(() => runLearn([
    "--eval",
    "--from-file",
    evalFile,
    "--file",
    filePath,
    "--limit",
    "1",
  ]));
  assert.match(humanOutput, /Local learning eval report/);
  assert.match(humanOutput, /button-accessibility \/ component-spec: pass/);
  assert.match(humanOutput, /Privacy: eval reports expose brief hashes and selected ids/);
}));

test("runLearn --eval --strict exits non-zero when checkpoints fail", () => withTempDirAsync(async (dir) => {
  const previousExitCode = process.exitCode;
  const filePath = path.join(dir, "learning.json");
  const evalFile = path.join(dir, "learning-eval.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:01.000Z",
    entries: [
      {
        id: "learn-relevant",
        category: "accessibility",
        text: "Prioritize keyboard accessibility details for Button component API specs",
        source: "test",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");
  writeFileSync(evalFile, JSON.stringify({
    version: 1,
    cases: [
      {
        id: "button-accessibility",
        routeId: "component-spec",
        brief: "Spec a Button component API with keyboard accessibility",
        expectedSelectedIds: ["missing-entry"],
        minMatchedCount: 1,
      },
    ],
  }), "utf8");

  try {
    process.exitCode = undefined;
    const strictOutput = await captureStdout(() => runLearn([
      "--eval",
      "--from-file",
      evalFile,
      "--file",
      filePath,
      "--limit",
      "1",
      "--strict",
      "--json",
    ]));
    const strictPayload = JSON.parse(strictOutput);
    assert.equal(strictPayload.status, "fail");
    assert.equal(process.exitCode, 1);

    process.exitCode = 0;
    await captureStdout(() => runLearn([
      "--eval",
      "--from-file",
      evalFile,
      "--file",
      filePath,
      "--limit",
      "1",
      "--json",
    ]));
    assert.equal(process.exitCode, 0);
  } finally {
    process.exitCode = previousExitCode;
  }
}));

test("prompt and pack commands record --with-learning usage sidecar metadata", () => withTempDirAsync(async (dir) => {
  const learningFile = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  writeFileSync(learningFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:02.000Z",
    entries: [
      {
        id: "learn-relevant",
        category: "accessibility",
        text: "Prioritize keyboard accessibility details for Button component API specs",
        source: "test",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-unrelated",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "test",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  await withLearningEnv({ learningFile, usageFile }, async () => {
    const promptOutput = await captureStdout(() => runPrompt([
      "Spec a Button component API with keyboard accessibility",
      "--route",
      "component-spec",
      "--with-learning",
      "--learning-limit",
      "1",
      "--json",
    ]));
    const promptPayload = JSON.parse(promptOutput);
    assert.equal(promptPayload.learningUsage.recorded, true);
    assert.equal(promptPayload.learningUsage.event.command, "prompt");
    assert.deepEqual(promptPayload.learningUsage.event.selectedEntryIds, ["learn-relevant"]);

    const packOutput = await captureStdout(() => runPack([
      "Spec a Button component API with keyboard accessibility",
      "--route",
      "component-spec",
      "--with-learning",
      "--learning-limit",
      "1",
      "--max-bytes",
      "5000",
      "--json",
    ]));
    const packPayload = JSON.parse(packOutput);
    assert.equal(packPayload.learningUsage.recorded, true);
    assert.equal(packPayload.learningUsage.event.command, "pack");
    assert.equal(packPayload.plan.learningUsage.event.command, "pack");
  });

  const log = loadLearningUsageLog(usageFile, { profileFile: learningFile });
  assert.deepEqual(log.events.map((event) => event.command), ["prompt", "pack"]);
  assert.deepEqual(log.events.map((event) => event.selectedEntryIds), [
    ["learn-relevant"],
    ["learn-relevant"],
  ]);
}));
