// Tests for learning usage sidecar recording and reports.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildLearningContext,
  buildLearningUsageEvent,
  defaultLearningUsageFile,
  learningUsageStats,
  loadLearningUsageLog,
  recordLearningUsage,
} from "./learn.mjs";
import { runLearn } from "../commands/learn.mjs";
import { captureStdout, withTempDir, withTempDirAsync } from "./learn-test-support.mjs";

test("recordLearningUsage writes a privacy-preserving sidecar event", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
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

  const learningContext = buildLearningContext({
    filePath,
    limit: 1,
    query: "Spec a Button component API with keyboard accessibility",
  });
  const event = buildLearningUsageEvent({
    command: "prompt",
    routeId: "component-spec",
    learningContext,
    now: new Date("2026-06-01T00:00:00.000Z"),
  });

  assert.equal(event.command, "prompt");
  assert.equal(event.routeId, "component-spec");
  assert.equal(event.briefHash.length, 16);
  assert.deepEqual(event.selectedEntryIds, ["learn-relevant"]);
  assert.equal(event.selectedCount, 1);
  assert.equal(event.matchedCount, 1);
  assert.equal(event.auditStatus, "pass");
  assert.ok(!Object.hasOwn(event, "query"));

  const result = recordLearningUsage({
    command: "prompt",
    routeId: "component-spec",
    learningContext,
    usageFile,
    now: new Date("2026-06-01T00:00:00.000Z"),
  });

  assert.equal(result.recorded, true);
  assert.equal(result.file, usageFile);
  assert.equal(result.event.id, event.id);

  const log = loadLearningUsageLog(usageFile, { profileFile: filePath });
  assert.equal(log.version, 1);
  assert.equal(log.profileFile, filePath);
  assert.equal(log.events.length, 1);
  assert.deepEqual(log.events[0].selectedEntryIds, ["learn-relevant"]);

  const raw = readFileSync(usageFile, "utf8");
  assert.ok(!raw.includes("Spec a Button component API with keyboard accessibility"));
}));

test("learningUsageStats summarizes sidecar events without raw brief text", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
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
        id: "learn-unused",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "test",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const learningContext = buildLearningContext({
    filePath,
    limit: 1,
    query: "Spec a Button component API with keyboard accessibility",
  });
  recordLearningUsage({
    command: "prompt",
    routeId: "component-spec",
    learningContext,
    usageFile,
    now: new Date("2026-06-01T00:00:00.000Z"),
  });
  recordLearningUsage({
    command: "pack",
    routeId: "component-spec",
    learningContext,
    usageFile,
    now: new Date("2026-06-01T00:01:00.000Z"),
  });

  const payload = learningUsageStats({ filePath, usageFile, limit: 1 });
  assert.equal(payload.exists, true);
  assert.equal(payload.eventCount, 2);
  assert.equal(payload.profileEntryCount, 2);
  assert.equal(payload.usedEntryCount, 1);
  assert.equal(payload.unusedEntryCount, 1);
  assert.deepEqual(payload.commandCounts, { prompt: 1, pack: 1 });
  assert.deepEqual(payload.routeCounts, { "component-spec": 2 });
  assert.deepEqual(payload.selectedEntryCounts, { "learn-relevant": 2 });
  assert.deepEqual(payload.unusedEntryIds, ["learn-unused"]);
  assert.equal(payload.topSelectedEntries[0].id, "learn-relevant");
  assert.equal(payload.topSelectedEntries[0].usageCount, 2);
  assert.equal(payload.recentEvents.length, 1);
  assert.equal(payload.recentEvents[0].command, "pack");
  assert.equal(payload.privacy.storesRawBriefText, false);

  const raw = JSON.stringify(payload);
  assert.ok(!raw.includes("Spec a Button component API with keyboard accessibility"));
}));

test("runLearn --usage reports sidecar summaries in JSON and human output", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  const usageFile = defaultLearningUsageFile(filePath);
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
  const learningContext = buildLearningContext({
    filePath,
    limit: 1,
    query: "Spec a Button component API with keyboard accessibility",
  });
  recordLearningUsage({
    command: "prompt",
    routeId: "component-spec",
    learningContext,
    usageFile,
    now: new Date("2026-06-01T00:00:00.000Z"),
  });

  const jsonOutput = await captureStdout(() => runLearn([
    "--usage",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
    "--json",
  ]));
  const payload = JSON.parse(jsonOutput);
  assert.equal(payload.usageFile, usageFile);
  assert.equal(payload.eventCount, 1);
  assert.equal(payload.latestEvent.command, "prompt");

  const humanOutput = await captureStdout(() => runLearn([
    "--usage",
    "--file",
    filePath,
    "--usage-file",
    usageFile,
  ]));
  assert.match(humanOutput, /Local learning usage report/);
  assert.match(humanOutput, /Usage sidecar:/);
  assert.match(humanOutput, /Events: 1/);
  assert.match(humanOutput, /Top selected entries:/);
  assert.match(humanOutput, /Privacy: usage events store selected entry ids and a short brief hash/);
}));
