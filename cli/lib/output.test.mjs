// Tests for cli/lib/output.mjs output file helpers.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  parseOutputFlags,
  writeOutputFile,
} from "./output.mjs";

test("parseOutputFlags handles --out and --force", () => {
  const out = { index: 0 };
  assert.equal(parseOutputFlags(["--out", "x.md"], out), true);
  assert.equal(out.outPath, "x.md");
  assert.equal(out.index, 1);

  const force = { index: 0 };
  assert.equal(parseOutputFlags(["--force"], force), true);
  assert.equal(force.force, true);
});

test("parseOutputFlags rejects missing output path", () => {
  assert.throws(() => parseOutputFlags(["--out"], { index: 0 }), /expects a file path/);
  assert.throws(() => parseOutputFlags(["--out", "--force"], { index: 0 }), /expects a file path/);
});

test("writeOutputFile creates parent directories", () => {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-output-"));
  try {
    const written = writeOutputFile({
      cwd: root,
      outPath: "nested/out.md",
      content: "hello",
    });

    assert.equal(readFileSync(written, "utf8"), "hello");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("writeOutputFile refuses overwrite unless forced", () => {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-output-"));
  try {
    const file = path.join(root, "out.md");
    writeFileSync(file, "old");

    assert.throws(
      () => writeOutputFile({ cwd: root, outPath: "out.md", content: "new" }),
      /already exists/,
    );

    writeOutputFile({ cwd: root, outPath: "out.md", content: "new", force: true });
    assert.equal(readFileSync(file, "utf8"), "new");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
