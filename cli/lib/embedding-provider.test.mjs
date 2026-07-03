// Tests for the local embedding provider protocol (spawn, JSON Lines in/out, failure modes).

import { test } from "node:test";
import assert from "node:assert/strict";

import { embedDocuments } from "./embedding-provider.mjs";

function linesRunner(fn) {
  return ({ command, args, input }) => fn({ command, args, input });
}

function jsonLine(obj) {
  return `${JSON.stringify(obj)}\n`;
}

test("embedDocuments happy path: sorted-id stdin, id-matched vectors regardless of stdout order", () => {
  let capturedInput = "";
  const runner = linesRunner(({ input }) => {
    capturedInput = input;
    return {
      status: 0,
      stdout: jsonLine({ id: "b", vector: [0.5, 0.5] }) + jsonLine({ id: "a", vector: [1, 0] }),
      stderr: "",
      error: null,
    };
  });

  const result = embedDocuments({
    provider: { command: "./bin/local-embed" },
    documents: [{ id: "b", text: "second" }, { id: "a", text: "first" }],
    spawnRunner: runner,
  });

  assert.equal(result.ok, true);
  assert.equal(result.dimensions, 2);
  assert.deepEqual(result.vectorsById.get("a"), [1, 0]);
  assert.deepEqual(result.vectorsById.get("b"), [0.5, 0.5]);

  const lines = capturedInput.trim().split("\n").map((line) => JSON.parse(line));
  assert.deepEqual(lines.map((line) => line.id), ["a", "b"]);
});

test("embedDocuments returns ok:true with empty vectors for zero documents without spawning", () => {
  let spawned = false;
  const runner = linesRunner(() => {
    spawned = true;
    return { status: 0, stdout: "", stderr: "", error: null };
  });

  const result = embedDocuments({ provider: { command: "x" }, documents: [], spawnRunner: runner });
  assert.equal(result.ok, true);
  assert.equal(result.vectorsById.size, 0);
  assert.equal(spawned, false);
});

test("embedDocuments fails without throwing on non-zero exit", () => {
  const runner = linesRunner(() => ({ status: 1, stdout: "", stderr: "boom", error: null }));
  const result = embedDocuments({
    provider: { command: "./bin/local-embed" },
    documents: [{ id: "a", text: "x" }],
    spawnRunner: runner,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /exited with code 1/);
  assert.match(result.error, /boom/);
});

test("embedDocuments fails without throwing on unparseable output", () => {
  const runner = linesRunner(() => ({ status: 0, stdout: "not json\n", stderr: "", error: null }));
  const result = embedDocuments({
    provider: { command: "./bin/local-embed" },
    documents: [{ id: "a", text: "x" }],
    spawnRunner: runner,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /unparseable output/);
});

test("embedDocuments fails when an id is missing from provider output", () => {
  const runner = linesRunner(() => ({
    status: 0,
    stdout: jsonLine({ id: "a", vector: [1] }),
    stderr: "",
    error: null,
  }));
  const result = embedDocuments({
    provider: { command: "./bin/local-embed" },
    documents: [{ id: "a", text: "x" }, { id: "b", text: "y" }],
    spawnRunner: runner,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /did not return vectors for id\(s\): b/);
});

test("embedDocuments fails on empty vector", () => {
  const runner = linesRunner(() => ({
    status: 0,
    stdout: jsonLine({ id: "a", vector: [] }),
    stderr: "",
    error: null,
  }));
  const result = embedDocuments({
    provider: { command: "./bin/local-embed" },
    documents: [{ id: "a", text: "x" }],
    spawnRunner: runner,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /empty vector/);
});

test("embedDocuments fails on inconsistent vector dimensions", () => {
  const runner = linesRunner(() => ({
    status: 0,
    stdout: jsonLine({ id: "a", vector: [1, 2] }) + jsonLine({ id: "b", vector: [1, 2, 3] }),
    stderr: "",
    error: null,
  }));
  const result = embedDocuments({
    provider: { command: "./bin/local-embed" },
    documents: [{ id: "a", text: "x" }, { id: "b", text: "y" }],
    spawnRunner: runner,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /inconsistent vector dimensions/);
});

test("embedDocuments fails when output line has a non-string id or missing vector", () => {
  const runner = linesRunner(() => ({
    status: 0,
    stdout: `${JSON.stringify({ id: 1, vector: [1] })}\n`,
    stderr: "",
    error: null,
  }));
  const result = embedDocuments({
    provider: { command: "./bin/local-embed" },
    documents: [{ id: "a", text: "x" }],
    spawnRunner: runner,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /missing a string id/);
});

test("embedDocuments fails when a vector entry is non-numeric", () => {
  const runner = linesRunner(() => ({
    status: 0,
    stdout: `${JSON.stringify({ id: "a", vector: [1, "x"] })}\n`,
    stderr: "",
    error: null,
  }));
  const result = embedDocuments({
    provider: { command: "./bin/local-embed" },
    documents: [{ id: "a", text: "x" }],
    spawnRunner: runner,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /missing a numeric vector/);
});

test("embedDocuments fails cleanly when no provider is configured", () => {
  const result = embedDocuments({ provider: null, documents: [{ id: "a", text: "x" }] });
  assert.equal(result.ok, false);
  assert.match(result.error, /no embedding provider command configured/);
});

test("embedDocuments fails cleanly when spawning itself throws", () => {
  const runner = () => {
    throw new Error("ENOENT");
  };
  const result = embedDocuments({
    provider: { command: "./missing-binary" },
    documents: [{ id: "a", text: "x" }],
    spawnRunner: runner,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /failed to spawn embedding provider/);
  assert.match(result.error, /ENOENT/);
});

test("embedDocuments fails cleanly when spawnRunner reports a spawn error object", () => {
  const runner = linesRunner(() => ({
    status: null,
    stdout: "",
    stderr: "",
    error: new Error("spawn ENOENT"),
  }));
  const result = embedDocuments({
    provider: { command: "./missing-binary" },
    documents: [{ id: "a", text: "x" }],
    spawnRunner: runner,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /failed to spawn embedding provider/);
});

test("embedDocuments passes provider args through to the runner and ignores blank output lines", () => {
  let capturedArgs = null;
  const runner = linesRunner(({ args }) => {
    capturedArgs = args;
    return { status: 0, stdout: `\n${jsonLine({ id: "a", vector: [1] })}\n`, stderr: "", error: null };
  });
  const result = embedDocuments({
    provider: { command: "python3", args: ["embed.py", "--quiet"] },
    documents: [{ id: "a", text: "x" }],
    spawnRunner: runner,
  });
  assert.equal(result.ok, true);
  assert.deepEqual(capturedArgs, ["embed.py", "--quiet"]);
});
