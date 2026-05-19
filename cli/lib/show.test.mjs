// Tests for cli/lib/show.mjs file display helpers.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  formatShowJson,
  parseShowArgs,
  parseShowTarget,
  readShowFile,
  resolveShowFile,
} from "./show.mjs";

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-show-"));
  mkdirSync(path.join(root, "knowledge"), { recursive: true });
  writeFileSync(
    path.join(root, "knowledge", "sample.md"),
    ["# Title", "one", "two", "three", "four", "five"].join("\n"),
  );
  return root;
}

test("parseShowTarget accepts file, file:line, and file:start-end", () => {
  assert.deepEqual(parseShowTarget("knowledge/sample.md"), {
    relPath: "knowledge/sample.md",
    range: null,
  });
  assert.deepEqual(parseShowTarget("knowledge/sample.md:3"), {
    relPath: "knowledge/sample.md",
    range: { start: 3, end: 3, explicitRange: false },
  });
  assert.deepEqual(parseShowTarget("knowledge/sample.md:2-4"), {
    relPath: "knowledge/sample.md",
    range: { start: 2, end: 4, explicitRange: true },
  });
});

test("parseShowArgs supports target, lines, context, and json", () => {
  assert.deepEqual(parseShowArgs(["knowledge/sample.md", "--lines", "2:4", "--context", "1", "--json"]), {
    target: "knowledge/sample.md",
    lines: { start: 2, end: 4, explicitRange: true },
    context: 1,
    json: true,
    help: false,
  });
});

test("parseShowArgs rejects invalid arguments", () => {
  assert.throws(() => parseShowArgs(["a.md", "--lines", "4:2"]), /Line range/);
  assert.throws(() => parseShowArgs(["a.md", "--context", "101"]), /--context/);
  assert.throws(() => parseShowArgs(["a.md", "--line", "1"]), /Did you mean `--lines`\?/);
  assert.throws(() => parseShowArgs(["a.md", "extra"]), /Unexpected/);
});

test("resolveShowFile blocks traversal outside source root", () => {
  const root = fixture();
  try {
    assert.throws(
      () => resolveShowFile({ sourceRoot: root, target: "../secret.md" }),
      /outside DESIGN_AI_HOME/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("resolveShowFile accepts absolute paths inside source root", () => {
  const root = fixture();
  try {
    const file = path.join(root, "knowledge", "sample.md");
    const result = resolveShowFile({ sourceRoot: root, target: file });

    assert.equal(result.file, file);
    assert.equal(result.relPath, path.join("knowledge", "sample.md"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("readShowFile prints whole file by default", () => {
  const root = fixture();
  try {
    const result = readShowFile({
      sourceRoot: root,
      target: "knowledge/sample.md",
    });

    assert.equal(result.start, 1);
    assert.equal(result.end, 6);
    assert.equal(result.lines.length, 6);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("readShowFile expands single-line target with context", () => {
  const root = fixture();
  try {
    const result = readShowFile({
      sourceRoot: root,
      target: "knowledge/sample.md:4",
      context: 1,
    });

    assert.equal(result.start, 3);
    assert.equal(result.end, 5);
    assert.deepEqual(result.lines.map((line) => line.text), ["two", "three", "four"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("formatShowJson preserves file payload order and readable Korean lines", () => {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-show-"));
  try {
    mkdirSync(path.join(root, "knowledge"), { recursive: true });
    writeFileSync(
      path.join(root, "knowledge", "korean-show.md"),
      ["# 한국어 문서", "첫 줄", "두 번째 줄"].join("\n"),
    );

    const result = readShowFile({
      sourceRoot: root,
      target: "knowledge/korean-show.md:2",
      context: 1,
    });
    const formatted = formatShowJson(result);
    const parsed = JSON.parse(formatted);

    assert.deepEqual(Object.keys(parsed), [
      "file",
      "relPath",
      "start",
      "end",
      "totalLines",
      "lines",
    ]);
    assert.deepEqual(Object.keys(parsed.lines[0]), ["number", "text"]);
    assert.equal(parsed.relPath, path.join("knowledge", "korean-show.md"));
    assert.equal(parsed.start, 1);
    assert.equal(parsed.end, 3);
    assert.equal(parsed.totalLines, 3);
    assert.deepEqual(parsed.lines.map((line) => line.text), ["# 한국어 문서", "첫 줄", "두 번째 줄"]);
    assert.match(formatted, /"lines": \[\n    \{\n      "number": 1,/);
    assert.ok(formatted.includes("한국어 문서"));
    assert.ok(!formatted.includes("\\u"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("formatShowJson preserves explicit line range output order", () => {
  const root = fixture();
  try {
    const result = readShowFile({
      sourceRoot: root,
      target: "knowledge/sample.md",
      lines: { start: 2, end: 4, explicitRange: true },
    });
    const formatted = formatShowJson(result);
    const parsed = JSON.parse(formatted);

    assert.deepEqual(Object.keys(parsed), [
      "file",
      "relPath",
      "start",
      "end",
      "totalLines",
      "lines",
    ]);
    assert.equal(parsed.start, 2);
    assert.equal(parsed.end, 4);
    assert.deepEqual(parsed.lines.map((line) => line.number), [2, 3, 4]);
    assert.deepEqual(Object.keys(parsed.lines[2]), ["number", "text"]);
    assert.match(formatted, /"start": 2,\n  "end": 4,\n  "totalLines": 6/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
