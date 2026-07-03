// Tests for local Phase B provider configuration (~/.design-ai/config.json).

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { configuredEmbeddingProvider, defaultConfigFile, loadLocalConfig } from "./local-config.mjs";

function withTempDir(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-config-test-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("defaultConfigFile honors DESIGN_AI_CONFIG_FILE override", () => {
  const previous = process.env.DESIGN_AI_CONFIG_FILE;
  try {
    delete process.env.DESIGN_AI_CONFIG_FILE;
    assert.match(defaultConfigFile(), /\.design-ai[/\\]config\.json$/);

    process.env.DESIGN_AI_CONFIG_FILE = "/tmp/custom-config.json";
    assert.equal(defaultConfigFile(), "/tmp/custom-config.json");
  } finally {
    if (previous === undefined) delete process.env.DESIGN_AI_CONFIG_FILE;
    else process.env.DESIGN_AI_CONFIG_FILE = previous;
  }
});

test("loadLocalConfig reports absent when the file is missing", () => withTempDir((dir) => {
  const filePath = path.join(dir, "config.json");
  assert.deepEqual(loadLocalConfig(filePath), { present: false, config: null, error: "" });
}));

test("loadLocalConfig accepts a valid minimal provider config", () => withTempDir((dir) => {
  const filePath = path.join(dir, "config.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    embeddings: { provider: { command: "./bin/local-embed" } },
  }), "utf8");

  const result = loadLocalConfig(filePath);
  assert.equal(result.present, true);
  assert.equal(result.error, "");
  assert.equal(result.config.embeddings.provider.command, "./bin/local-embed");
}));

test("loadLocalConfig accepts args array and modelLabel", () => withTempDir((dir) => {
  const filePath = path.join(dir, "config.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    embeddings: {
      provider: { command: "python3", args: ["embed.py", "--quiet"] },
      modelLabel: "user-supplied-384d",
    },
  }), "utf8");

  const result = loadLocalConfig(filePath);
  assert.equal(result.present, true);
  assert.equal(result.error, "");
  assert.deepEqual(result.config.embeddings.provider.args, ["embed.py", "--quiet"]);
  assert.equal(result.config.embeddings.modelLabel, "user-supplied-384d");
}));

test("loadLocalConfig rejects malformed JSON", () => withTempDir((dir) => {
  const filePath = path.join(dir, "config.json");
  writeFileSync(filePath, "not json", "utf8");
  const result = loadLocalConfig(filePath);
  assert.equal(result.present, true);
  assert.equal(result.config, null);
  assert.match(result.error, /not valid JSON/);
}));

test("loadLocalConfig rejects unknown top-level keys", () => withTempDir((dir) => {
  const filePath = path.join(dir, "config.json");
  writeFileSync(filePath, JSON.stringify({ version: 1, telemetry: true }), "utf8");
  const result = loadLocalConfig(filePath);
  assert.equal(result.config, null);
  assert.match(result.error, /unknown top-level key/);
  assert.match(result.error, /telemetry/);
}));

test("loadLocalConfig rejects wrong version", () => withTempDir((dir) => {
  const filePath = path.join(dir, "config.json");
  writeFileSync(filePath, JSON.stringify({ version: 2 }), "utf8");
  const result = loadLocalConfig(filePath);
  assert.equal(result.config, null);
  assert.match(result.error, /version must be 1/);
}));

test("loadLocalConfig rejects missing provider.command", () => withTempDir((dir) => {
  const filePath = path.join(dir, "config.json");
  writeFileSync(filePath, JSON.stringify({ version: 1, embeddings: { provider: {} } }), "utf8");
  const result = loadLocalConfig(filePath);
  assert.equal(result.config, null);
  assert.match(result.error, /provider\.command is required/);
}));

test("loadLocalConfig rejects non-array provider.args", () => withTempDir((dir) => {
  const filePath = path.join(dir, "config.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    embeddings: { provider: { command: "x", args: "not-an-array" } },
  }), "utf8");
  const result = loadLocalConfig(filePath);
  assert.equal(result.config, null);
  assert.match(result.error, /provider\.args must be an array of strings/);
}));

test("loadLocalConfig rejects unknown embeddings keys", () => withTempDir((dir) => {
  const filePath = path.join(dir, "config.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    embeddings: { provider: { command: "x" }, endpoint: "https://example.com" },
  }), "utf8");
  const result = loadLocalConfig(filePath);
  assert.equal(result.config, null);
  assert.match(result.error, /unknown key\(s\): endpoint/);
}));

test("loadLocalConfig rejects unknown provider keys", () => withTempDir((dir) => {
  const filePath = path.join(dir, "config.json");
  writeFileSync(filePath, JSON.stringify({
    version: 1,
    embeddings: { provider: { command: "x", url: "https://example.com" } },
  }), "utf8");
  const result = loadLocalConfig(filePath);
  assert.equal(result.config, null);
  assert.match(result.error, /provider has unknown key\(s\): url/);
}));

test("loadLocalConfig rejects embeddings without a provider", () => withTempDir((dir) => {
  const filePath = path.join(dir, "config.json");
  writeFileSync(filePath, JSON.stringify({ version: 1, embeddings: {} }), "utf8");
  const result = loadLocalConfig(filePath);
  assert.equal(result.config, null);
  assert.match(result.error, /embeddings\.provider is required/);
}));

test("loadLocalConfig rejects an array or non-object payload", () => withTempDir((dir) => {
  const filePath = path.join(dir, "config.json");
  writeFileSync(filePath, JSON.stringify([1, 2, 3]), "utf8");
  const result = loadLocalConfig(filePath);
  assert.equal(result.config, null);
  assert.match(result.error, /must be a JSON object/);
}));

test("configuredEmbeddingProvider returns null when absent or malformed, provider object when valid", () => withTempDir((dir) => {
  const filePath = path.join(dir, "config.json");
  assert.equal(configuredEmbeddingProvider(filePath), null);

  writeFileSync(filePath, "not json", "utf8");
  assert.equal(configuredEmbeddingProvider(filePath), null);

  writeFileSync(filePath, JSON.stringify({
    version: 1,
    embeddings: { provider: { command: "./bin/local-embed", args: ["--flag"] } },
  }), "utf8");
  assert.deepEqual(configuredEmbeddingProvider(filePath), { command: "./bin/local-embed", args: ["--flag"] });
}));
