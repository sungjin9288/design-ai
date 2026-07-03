// Tests for learning stats, selection, markdown context, and prompt/pack learning.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildLearningContext,
  learningStats,
  renderLearningMarkdown,
  selectLearningEntries,
  selectLearningEntrySet,
} from "./learn.mjs";
import { buildPromptPlan } from "./prompt.mjs";
import { buildPromptPack } from "./pack.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";
import { runLearn } from "../commands/learn.mjs";
import { captureStdout, withTempDir, withTempDirAsync } from "./learn-test-support.mjs";

test("learningStats summarizes profile counts, sources, recency, and audit status", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:02.000Z",
    entries: [
      {
        id: "learn-a",
        category: "brand",
        text: "Use quiet enterprise language",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-b",
        category: "korean",
        text: "Prefer dense Korean mobile layouts with compact form controls",
        source: "import",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const stats = learningStats({ filePath });

  assert.equal(stats.file, filePath);
  assert.equal(stats.exists, true);
  assert.equal(stats.count, 2);
  assert.deepEqual(stats.categoryCounts, { brand: 1, korean: 1 });
  assert.deepEqual(stats.sourceCounts, { cli: 1, import: 1 });
  assert.equal(stats.auditSummary.status, "pass");
  assert.equal(stats.oldestEntry.id, "learn-a");
  assert.equal(stats.latestEntry.id, "learn-b");
  assert.equal(stats.latestEntry.textPreview, "Prefer dense Korean mobile layouts with compact form controls");
}));

test("learningStats reports missing and invalid profiles without mutating files", () => withTempDir((dir) => {
  const missingPath = path.join(dir, "missing.json");
  const missing = learningStats({ filePath: missingPath });
  assert.equal(missing.exists, false);
  assert.equal(missing.count, 0);
  assert.equal(missing.auditSummary.status, "pass");
  assert.deepEqual(missing.sourceCounts, {});

  const filePath = path.join(dir, "learning.json");
  const invalidJson = "{ not json";
  writeFileSync(filePath, invalidJson, "utf8");

  const stats = learningStats({ filePath });

  assert.equal(stats.exists, true);
  assert.equal(stats.count, 0);
  assert.equal(stats.auditSummary.status, "fail");
  assert.equal(stats.auditSummary.failures, 1);
  assert.equal(stats.latestEntry, null);
  assert.equal(readFileSync(filePath, "utf8"), invalidJson);
}));

test("runLearn list and export filter learned entries by query without fallback", () => withTempDirAsync(async (dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:02.000Z",
    entries: [
      {
        id: "learn-brand",
        category: "brand",
        text: "Use quiet enterprise brand language",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-a11y",
        category: "accessibility",
        text: "Prioritize keyboard accessibility in Button specs",
        source: "cli",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-korean",
        category: "korean",
        text: "Prefer dense Korean mobile layouts",
        source: "cli",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const listOutput = await captureStdout(() => runLearn([
    "--list",
    "--query",
    "keyboard accessibility",
    "--explain",
    "--file",
    filePath,
  ]));

  assert.match(listOutput, /Query: keyboard accessibility/);
  assert.match(listOutput, /Explain: selection score, matched tokens, and reason/);
  assert.match(listOutput, /\[accessibility\] Prioritize keyboard accessibility/);
  assert.match(listOutput, /score [\d.]+ .* matched accessibility, keyboard .* reason brief-match/);
  assert.doesNotMatch(listOutput, /dense Korean mobile/);
  assert.doesNotMatch(listOutput, /quiet enterprise brand/);

  const listJsonOutput = await captureStdout(() => runLearn([
    "--list",
    "--query",
    "keyboard accessibility",
    "--explain",
    "--file",
    filePath,
    "--json",
  ]));
  const listPayload = JSON.parse(listJsonOutput);
  assert.equal(listPayload.query, "keyboard accessibility");
  assert.equal(listPayload.count, 1);
  assert.equal(listPayload.totalCount, 3);
  assert.deepEqual(listPayload.entries.map((entry) => entry.id), ["learn-a11y"]);
  assert.equal(listPayload.selection.mode, "brief-relevance");
  assert.equal(listPayload.selection.fallbackEnabled, false);
  assert.equal(listPayload.selection.selectedCount, 1);
  assert.equal(listPayload.selection.selected[0].id, "learn-a11y");
  assert.equal(listPayload.selection.selected[0].reason, "brief-match");
  assert.ok(listPayload.selection.selected[0].score > 0);
  assert.deepEqual(listPayload.selection.selected[0].matchedTokens, ["accessibility", "keyboard"]);

  const exportJsonOutput = await captureStdout(() => runLearn([
    "--export",
    "--query",
    "keyboard accessibility",
    "--file",
    filePath,
    "--json",
  ]));
  const exportPayload = JSON.parse(exportJsonOutput);
  assert.equal(exportPayload.query, "keyboard accessibility");
  assert.equal(exportPayload.selection.mode, "brief-relevance");
  assert.equal(exportPayload.selection.fallbackEnabled, false);
  assert.equal(exportPayload.selection.fallbackCount, 0);
  assert.equal(exportPayload.selection.selectedCount, 1);
  assert.deepEqual(exportPayload.entries.map((entry) => entry.id), ["learn-a11y"]);
  assert.match(exportPayload.markdown, /no recency fallback/);

  const emptyExport = await captureStdout(() => runLearn([
    "--export",
    "--query",
    "pricing page",
    "--file",
    filePath,
  ]));
  assert.match(emptyExport, /No local learning preferences match the current filters/);
}));

test("selectLearningEntries filters by category and limit", () => {
  const profile = {
    version: 1,
    entries: [
      {
        id: "learn-a",
        category: "korean",
        text: "Prefer Korean density",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-b",
        category: "brand",
        text: "Use quiet brand voice",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-c",
        category: "korean",
        text: "Use Korean mobile conventions",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  };

  assert.deepEqual(
    selectLearningEntries(profile, { category: "korean", limit: 1 }).map((entry) => entry.id),
    ["learn-c"],
  );
  assert.deepEqual(
    selectLearningEntries(profile, { limit: 2 }).map((entry) => entry.id),
    ["learn-b", "learn-c"],
  );
  assert.deepEqual(
    selectLearningEntries(profile, { limit: 1, query: "Korean mobile checkout UX" }).map((entry) => entry.id),
    ["learn-c"],
  );
  assert.deepEqual(
    selectLearningEntries(profile, { limit: 1, query: "enterprise brand voice" }).map((entry) => entry.id),
    ["learn-b"],
  );
  assert.deepEqual(
    selectLearningEntries(profile, {
      limit: 2,
      query: "enterprise brand voice",
      includeFallback: false,
    }).map((entry) => entry.id),
    ["learn-b"],
  );
  assert.deepEqual(
    selectLearningEntries(profile, {
      query: "pricing page",
      includeFallback: false,
    }).map((entry) => entry.id),
    [],
  );

  const explained = selectLearningEntrySet(profile, {
    query: "enterprise brand voice",
    includeFallback: false,
  });
  assert.deepEqual(explained.entries.map((entry) => entry.id), ["learn-b"]);
  assert.equal(explained.selection.selected[0].reason, "brief-match");
  assert.deepEqual(explained.selection.selected[0].matchedTokens, ["brand", "voice"]);
});

test("renderLearningMarkdown produces a prompt-safe context block", () => {
  const markdown = renderLearningMarkdown({
    version: 1,
    entries: [
      {
        id: "learn-a",
        category: "preference",
        text: "Prefer restrained SaaS density",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
    ],
  });

  assert.match(markdown, /## Learned design context/);
  assert.match(markdown, /Do not let them override explicit task instructions/);
  assert.match(markdown, /\[preference\] Prefer restrained SaaS density/);

  const filteredMarkdown = renderLearningMarkdown({
    version: 1,
    entries: [
      {
        id: "learn-b",
        category: "brand",
        text: "Use quiet enterprise language",
      },
    ],
  }, { category: "korean" });
  assert.match(filteredMarkdown, /No local learning preferences match the current filters/);
});

test("prompt and pack can include learning context explicitly", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:00.000Z",
    entries: [
      {
        id: "learn-a",
        category: "brand",
        text: "Use quiet enterprise UI language",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
    ],
  }), "utf8");

  const plan = buildPromptPlan({
    brief: "Spec a Button component API",
    sourceRoot: PACKAGE_ROOT,
    routeId: "component-spec",
    withLearning: true,
    learningFilePath: filePath,
  });

  assert.equal(plan.learningContext.entries.length, 1);
  assert.deepEqual(plan.learningContext.auditSummary, {
    status: "pass",
    failures: 0,
    warnings: 0,
  });
  assert.match(plan.prompt, /Learned design context:/);
  assert.match(plan.prompt, /Use quiet enterprise UI language/);

  const pack = buildPromptPack({
    brief: "Spec a Button component API",
    sourceRoot: PACKAGE_ROOT,
    routeId: "component-spec",
    maxBytes: 1000,
    withLearning: true,
    learningFilePath: filePath,
  });

  assert.match(pack.markdown, /Learned design context:/);
  assert.match(pack.plan.prompt, /Use quiet enterprise UI language/);
}));

test("buildLearningContext carries audit warnings into learned-context markdown", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:01.000Z",
    entries: [
      {
        id: "learn-a",
        category: "brand",
        text: "Use quiet enterprise UI language",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-b",
        category: "brand",
        text: "Use quiet enterprise UI language",
        source: "cli",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
    ],
  }), "utf8");

  const context = buildLearningContext({ filePath });

  assert.equal(context.auditSummary.status, "warn");
  assert.equal(context.auditSummary.failures, 0);
  assert.ok(context.auditSummary.warnings >= 1);
  assert.match(context.markdown, /Learning profile audit: warn/);
  assert.match(context.markdown, /design-ai learn --audit/);
}));

test("buildLearningContext ranks learned entries by brief relevance with recency fallback", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    updatedAt: "2026-05-22T00:00:02.000Z",
    entries: [
      {
        id: "learn-brand",
        category: "brand",
        text: "Use quiet enterprise brand language",
        source: "cli",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "learn-korean",
        category: "korean",
        text: "Prefer dense Korean checkout and payment layouts",
        source: "cli",
        createdAt: "2026-05-22T00:00:01.000Z",
      },
      {
        id: "learn-motion",
        category: "workflow",
        text: "Keep motion specs short",
        source: "cli",
        createdAt: "2026-05-22T00:00:02.000Z",
      },
    ],
  }), "utf8");

  const context = buildLearningContext({
    filePath,
    limit: 2,
    query: "Audit Korean checkout UX",
  });

  assert.equal(context.selection.mode, "brief-relevance");
  assert.equal(context.selection.candidateCount, 3);
  assert.equal(context.selection.matchedCount, 1);
  assert.equal(context.selection.queryTokenCount, 4);
  assert.equal(context.selection.selectedCount, 2);
  assert.equal(context.selection.fallbackCount, 1);
  assert.deepEqual(
    context.selection.selected.map((entry) => ({
      id: entry.id,
      score: entry.score,
      matchedTokens: entry.matchedTokens,
      reason: entry.reason,
    })),
    [
      {
        id: "learn-korean",
        score: 2.141202,
        matchedTokens: ["checkout", "korean"],
        reason: "brief-match",
      },
      {
        id: "learn-motion",
        score: 0,
        matchedTokens: [],
        reason: "recency-fallback",
      },
    ],
  );
  assert.deepEqual(context.entries.map((entry) => entry.id), ["learn-korean", "learn-motion"]);
  assert.match(context.markdown, /Learning selection: brief relevance \(1\/3 matched/);
  assert.match(context.markdown, /\[korean\] Prefer dense Korean checkout and payment layouts/);
}));

test("buildLearningContext reports empty profiles without creating files", () => withTempDir((dir) => {
  const filePath = path.join(dir, "missing.json");
  const context = buildLearningContext({ filePath });

  assert.equal(context.empty, true);
  assert.deepEqual(context.entries, []);
  assert.deepEqual(context.selection.selected, []);
  assert.equal(context.selection.selectedCount, 0);
  assert.equal(context.selection.fallbackCount, 0);
  assert.deepEqual(context.auditSummary, {
    status: "pass",
    failures: 0,
    warnings: 0,
  });
  assert.match(context.markdown, /No local learning preferences are stored yet/);
}));
