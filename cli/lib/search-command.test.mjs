// Thin command-level smoke tests for `design-ai search --eval-template`/`--eval`,
// proving runSearch wires the eval modes end to end (help text renders, --json
// mode works, --strict sets the process exit code). Mirrors the granularity of
// route-command.test.mjs's command-level coverage for route's --explain feature.

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runSearch } from "../commands/search.mjs";
import { captureStdout } from "./learn-test-support.mjs";

function writeEvalFixture(dir, payload) {
  const file = path.join(dir, "search-eval.json");
  writeFileSync(file, JSON.stringify(payload));
  return file;
}

test("runSearch --help documents eval-template and eval modes", async () => {
  const output = await captureStdout(() => runSearch(["--help"]));
  assert.match(output, /--eval-template/);
  assert.match(output, /--eval\s/);
  assert.match(output, /--strict/);
});

test("runSearch --eval-template renders human output and JSON", async () => {
  const human = await captureStdout(() => runSearch(["--eval-template"]));
  assert.match(human, /Ranked-search eval checkpoint template/);

  const json = await captureStdout(() => runSearch(["--eval-template", "--json"]));
  const template = JSON.parse(json);
  assert.equal(template.version, 1);
  assert.ok(Array.isArray(template.cases));
  assert.ok(template.cases.some((testCase) => testCase.query === "버튼"));
});

test("runSearch --eval --from-file reports pass status without setting an exit code", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-search-command-"));
  try {
    const file = writeEvalFixture(dir, {
      version: 1,
      cases: [{ id: "korean-button", query: "버튼", minHits: 1 }],
    });

    process.exitCode = undefined;
    const output = await captureStdout(() => runSearch(["--eval", "--from-file", file, "--strict", "--json"]));
    const report = JSON.parse(output);

    assert.equal(report.status, "pass");
    assert.equal(process.exitCode, undefined);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runSearch --eval --strict sets exit code 1 on a failing checkpoint", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-search-command-"));
  try {
    const file = writeEvalFixture(dir, {
      version: 1,
      cases: [{ id: "impossible", query: "accessibility", minHits: 999999 }],
    });

    process.exitCode = undefined;
    const output = await captureStdout(() => runSearch(["--eval", "--from-file", file, "--strict", "--json"]));
    const report = JSON.parse(output);

    assert.equal(report.status, "fail");
    assert.equal(process.exitCode, 1);
  } finally {
    process.exitCode = undefined;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runSearch --eval without --strict does not set an exit code even on failure", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-search-command-"));
  try {
    const file = writeEvalFixture(dir, {
      version: 1,
      cases: [{ id: "impossible", query: "accessibility", minHits: 999999 }],
    });

    process.exitCode = undefined;
    const output = await captureStdout(() => runSearch(["--eval", "--from-file", file, "--json"]));
    const report = JSON.parse(output);

    assert.equal(report.status, "fail");
    assert.equal(process.exitCode, undefined);
  } finally {
    process.exitCode = undefined;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runSearch --eval human output renders per-case status lines", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-search-command-"));
  try {
    const file = writeEvalFixture(dir, {
      version: 1,
      cases: [{ id: "korean-button", query: "버튼", minHits: 1 }],
    });

    const output = await captureStdout(() => runSearch(["--eval", "--from-file", file]));
    assert.match(output, /Ranked-search eval report/);
    assert.match(output, /PASS korean-button/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
