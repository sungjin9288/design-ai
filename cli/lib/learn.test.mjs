// Tests for local learning profile helpers.

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildLearningContext,
  loadLearningProfile,
  normalizeCategory,
  parseLearnArgs,
  rememberLearning,
  renderLearningMarkdown,
} from "./learn.mjs";
import { buildPromptPlan } from "./prompt.mjs";
import { buildPromptPack } from "./pack.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";

function withTempDir(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-learn-test-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("parseLearnArgs defaults to list and supports remember notes", () => {
  const listArgs = parseLearnArgs([]);
  assert.equal(listArgs.action, "list");
  assert.equal(listArgs.category, "preference");

  const rememberArgs = parseLearnArgs(["--remember", "Prefer", "compact", "tables", "--category", "workflow"]);
  assert.equal(rememberArgs.action, "remember");
  assert.equal(rememberArgs.brief, "Prefer compact tables");
  assert.equal(rememberArgs.category, "workflow");
  assert.deepEqual(rememberArgs.briefParts, ["Prefer", "compact", "tables"]);
});

test("parseLearnArgs rejects unsupported categories and unknown options", () => {
  assert.throws(
    () => normalizeCategory("private-model"),
    /category expects one of:/,
  );
  assert.throws(
    () => parseLearnArgs(["--jsn"]),
    /Did you mean `--json`\?/,
  );
});

test("rememberLearning persists a local profile entry", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  const result = rememberLearning({
    text: "Prefer dense Korean product UI",
    category: "korean",
    filePath,
    now: new Date("2026-05-22T00:00:00.000Z"),
  });

  assert.equal(result.entry.category, "korean");
  assert.equal(result.entry.text, "Prefer dense Korean product UI");
  assert.match(result.entry.id, /^learn-[a-f0-9]{10}$/);

  const profile = loadLearningProfile(filePath);
  assert.equal(profile.entries.length, 1);
  assert.equal(profile.entries[0].id, result.entry.id);
  assert.equal(JSON.parse(readFileSync(filePath, "utf8")).version, 1);
}));

test("loadLearningProfile normalizes legacy entries without ids", () => withTempDir((dir) => {
  const filePath = path.join(dir, "learning.json");
  writeFileSync(filePath, JSON.stringify({
    entries: [
      {
        category: "preference",
        text: "Prefer compact Korean dashboards",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
    ],
  }), "utf8");

  const profile = loadLearningProfile(filePath);

  assert.equal(profile.entries.length, 1);
  assert.match(profile.entries[0].id, /^learn-[a-f0-9]{10}$/);
}));

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

test("buildLearningContext reports empty profiles without creating files", () => withTempDir((dir) => {
  const filePath = path.join(dir, "missing.json");
  const context = buildLearningContext({ filePath });

  assert.equal(context.empty, true);
  assert.deepEqual(context.entries, []);
  assert.match(context.markdown, /No local learning preferences are stored yet/);
}));
