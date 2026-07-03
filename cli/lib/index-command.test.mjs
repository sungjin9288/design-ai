// Tests for the `design-ai index` command flow (build/status/verify round-trip).

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { parseIndexArgs, runIndex } from "../commands/index.mjs";
import { captureStdout } from "./learn-test-support.mjs";

async function withIndexEnv(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-index-cmd-test-"));
  const previousIndexDir = process.env.DESIGN_AI_INDEX_DIR;
  const previousLearningFile = process.env.DESIGN_AI_LEARNING_FILE;
  const previousExitCode = process.exitCode;
  const indexDir = path.join(dir, "index");
  const learningFile = path.join(dir, "learning.json");
  writeFileSync(learningFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-07-01T00:00:00.000Z",
    entries: [
      { id: "cmd001", category: "preference", text: "Prefer ranked corpus search", createdAt: "2026-07-01T00:00:00.000Z", source: "test" },
    ],
  }), "utf8");
  process.env.DESIGN_AI_INDEX_DIR = indexDir;
  process.env.DESIGN_AI_LEARNING_FILE = learningFile;
  process.exitCode = undefined;
  try {
    return await fn({ dir, indexDir, learningFile });
  } finally {
    if (previousIndexDir === undefined) delete process.env.DESIGN_AI_INDEX_DIR;
    else process.env.DESIGN_AI_INDEX_DIR = previousIndexDir;
    if (previousLearningFile === undefined) delete process.env.DESIGN_AI_LEARNING_FILE;
    else process.env.DESIGN_AI_LEARNING_FILE = previousLearningFile;
    process.exitCode = previousExitCode;
    rmSync(dir, { recursive: true, force: true });
  }
}

test("parseIndexArgs supports build/status/verify/json and rejects unknown options", () => {
  assert.deepEqual(parseIndexArgs([]), { action: "status", json: false, help: false });
  assert.equal(parseIndexArgs(["--build"]).action, "build");
  assert.equal(parseIndexArgs(["--verify", "--json"]).json, true);
  assert.equal(parseIndexArgs(["--help"]).help, true);
  assert.throws(() => parseIndexArgs(["--bad"]), /Unknown index option/);
  assert.throws(() => parseIndexArgs(["--buld"]), /Did you mean `--build`\?/);
});

test("runIndex build -> status -> verify round-trip stays fresh and exits zero", () => withIndexEnv(async () => {
  const buildOutput = await captureStdout(() => runIndex(["--build", "--json"]));
  const build = JSON.parse(buildOutput);
  assert.equal(build.action, "build");
  assert.ok(build.corpus.documentCount > 0);
  assert.equal(build.learning.documentCount, 1);
  assert.match(build.corpus.digest, /^sha256:/);

  const statusOutput = await captureStdout(() => runIndex(["--status", "--json"]));
  const status = JSON.parse(statusOutput);
  assert.equal(status.fresh, true);
  assert.equal(status.corpus.fresh, true);
  assert.equal(status.learning.fresh, true);

  const verifyOutput = await captureStdout(() => runIndex(["--verify", "--json"]));
  const verify = JSON.parse(verifyOutput);
  assert.equal(verify.ok, true);
  assert.equal(process.exitCode, undefined);
}));

test("runIndex reports learning staleness after profile edits and verify exits non-zero", () => withIndexEnv(async ({ learningFile }) => {
  await captureStdout(() => runIndex(["--build", "--json"]));

  writeFileSync(learningFile, JSON.stringify({
    version: 1,
    updatedAt: "2026-07-02T00:00:00.000Z",
    entries: [
      { id: "cmd001", category: "preference", text: "Redacted preference text", createdAt: "2026-07-01T00:00:00.000Z", source: "test" },
    ],
  }), "utf8");

  const status = JSON.parse(await captureStdout(() => runIndex(["--status", "--json"])));
  assert.equal(status.learning.fresh, false);
  assert.equal(status.fresh, false);

  const verify = JSON.parse(await captureStdout(() => runIndex(["--verify", "--json"])));
  assert.equal(verify.ok, false);
  assert.equal(process.exitCode, 1);
  const learningCheck = verify.checks.find((check) => check.name === "learning");
  assert.match(learningCheck.reason, /differs/);
}));

test("runIndex status reports missing index files with build guidance", () => withIndexEnv(async () => {
  const output = await captureStdout(() => runIndex(["--status"]));
  assert.match(output, /missing \(run design-ai index --build\)/);
  assert.match(output, /design-ai index --build/);
}));
