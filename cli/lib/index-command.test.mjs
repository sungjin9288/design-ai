// Tests for the `design-ai index` command flow (build/status/verify round-trip).

import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { parseIndexArgs, runIndex } from "../commands/index.mjs";
import { captureStdout } from "./learn-test-support.mjs";

// A tiny deterministic stub provider script: reads JSON Lines from stdin, emits a
// fixed-length vector keyed by a stable character-code hash of the id. No network,
// no randomness — safe to invoke as a real child process from these tests.
const STUB_PROVIDER_SCRIPT = `
const chunks = [];
process.stdin.on("data", (c) => chunks.push(c));
process.stdin.on("end", () => {
  const lines = Buffer.concat(chunks).toString("utf8").trim().split("\\n").filter(Boolean);
  for (const line of lines) {
    const { id } = JSON.parse(line);
    let seed = 0;
    for (const ch of id) seed = (seed * 31 + ch.charCodeAt(0)) % 997;
    const vector = [seed / 997, (seed + 1) / 997, (seed + 2) / 997];
    process.stdout.write(JSON.stringify({ id, vector }) + "\\n");
  }
});
`;

function writeStubProvider(dir) {
  const scriptPath = path.join(dir, "stub-provider.mjs");
  writeFileSync(scriptPath, STUB_PROVIDER_SCRIPT, "utf8");
  chmodSync(scriptPath, 0o755);
  return scriptPath;
}

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
  assert.deepEqual(parseIndexArgs([]), { action: "status", json: false, help: false, embeddings: false, provider: "" });
  assert.equal(parseIndexArgs(["--build"]).action, "build");
  assert.equal(parseIndexArgs(["--verify", "--json"]).json, true);
  assert.equal(parseIndexArgs(["--help"]).help, true);
  assert.throws(() => parseIndexArgs(["--bad"]), /Unknown index option/);
  assert.throws(() => parseIndexArgs(["--buld"]), /Did you mean `--build`\?/);
});

test("parseIndexArgs supports --embeddings and --provider", () => {
  const withEmbeddings = parseIndexArgs(["--build", "--embeddings"]);
  assert.equal(withEmbeddings.embeddings, true);
  assert.equal(withEmbeddings.provider, "");

  const withProvider = parseIndexArgs(["--build", "--embeddings", "--provider", "./bin/local-embed --quiet"]);
  assert.equal(withProvider.embeddings, true);
  assert.equal(withProvider.provider, "./bin/local-embed --quiet");
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

test("runIndex --build --embeddings without any provider errors clearly but still completes the lexical build", () => withIndexEnv(async () => {
  const output = await captureStdout(() => runIndex(["--build", "--embeddings", "--json"]));
  const build = JSON.parse(output);
  assert.ok(build.corpus.documentCount > 0); // lexical build completed first
  assert.ok(build.learning.documentCount >= 0);
  assert.equal(build.embeddings.ok, false);
  assert.match(build.embeddings.error, /--embeddings requires a provider/);
  assert.match(build.embeddings.error, /--provider/);
  assert.match(build.embeddings.error, /config\.json/);
  assert.equal(process.exitCode, 1);
}));

test("runIndex --build --embeddings --provider round-trips with a stub provider and status/verify report embeddings", () => withIndexEnv(async ({ dir }) => {
  const scriptPath = writeStubProvider(dir);
  const providerFlag = `node ${scriptPath}`;

  const buildOutput = await captureStdout(() => runIndex(["--build", "--embeddings", "--provider", providerFlag, "--json"]));
  const build = JSON.parse(buildOutput);
  assert.equal(build.embeddings.ok, true);
  assert.ok(build.embeddings.documentCount > 0);
  assert.equal(build.embeddings.provider.command, "node");
  assert.equal(build.embeddings.provider.dimensions, 3);
  assert.equal(process.exitCode, undefined);

  const statusOutput = await captureStdout(() => runIndex(["--status", "--json"]));
  const status = JSON.parse(statusOutput);
  const keys = Object.keys(status);
  assert.deepEqual(keys, ["action", "indexDir", "corpus", "learning", "embeddings", "fresh", "buildCommand"]);
  assert.ok(status.embeddings);
  assert.equal(status.embeddings.present, true);
  assert.equal(status.embeddings.fresh, true);
  assert.equal(status.fresh, true);

  const verifyOutput = await captureStdout(() => runIndex(["--verify", "--provider", providerFlag, "--json"]));
  const verify = JSON.parse(verifyOutput);
  assert.equal(verify.ok, true);
  const embeddingsCheck = verify.checks.find((check) => check.name === "embeddings");
  assert.equal(embeddingsCheck.matches, true);
  assert.equal(process.exitCode, undefined);
}));

test("runIndex --verify skips the embeddings check with a non-failing note when the provider is unavailable", () => withIndexEnv(async ({ dir }) => {
  const scriptPath = writeStubProvider(dir);
  const providerFlag = `node ${scriptPath}`;

  await captureStdout(() => runIndex(["--build", "--embeddings", "--provider", providerFlag, "--json"]));

  const verifyOutput = await captureStdout(() => runIndex(["--verify", "--json"]));
  const verify = JSON.parse(verifyOutput);
  const embeddingsCheck = verify.checks.find((check) => check.name === "embeddings");
  assert.equal(embeddingsCheck.matches, true);
  assert.equal(embeddingsCheck.skipped, true);
  assert.match(embeddingsCheck.reason, /skipped: provider unavailable/);
  assert.equal(verify.ok, true);
  assert.equal(process.exitCode, undefined);
}));

test("runIndex status reports embeddings: null when the sidecar was never built", () => withIndexEnv(async () => {
  await captureStdout(() => runIndex(["--build", "--json"]));
  const status = JSON.parse(await captureStdout(() => runIndex(["--status", "--json"])));
  assert.equal(status.embeddings, null);
  assert.equal(status.fresh, true);
}));
