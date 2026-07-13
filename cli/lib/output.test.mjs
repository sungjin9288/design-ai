// Tests for cli/lib/output.mjs output file helpers.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  parseOutputFlags,
  writeOutputFile,
  writeOutputFiles,
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

test("output helpers refuse symbolic link targets", () => {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-output-"));
  try {
    const outside = path.join(root, "outside.md");
    const bundle = path.join(root, "bundle");
    writeFileSync(outside, "sentinel", "utf8");
    symlinkSync(outside, path.join(root, "out.md"));

    assert.throws(
      () => writeOutputFile({ cwd: root, outPath: "out.md", content: "changed", force: true }),
      /must not be a symbolic link/,
    );

    writeOutputFiles({ outPath: bundle, files: [{ path: "safe.md", content: "safe" }] });
    symlinkSync(outside, path.join(bundle, "linked.md"));
    assert.throws(
      () => writeOutputFiles({ outPath: bundle, files: [{ path: "linked.md", content: "changed" }], force: true }),
      /must not be a symbolic link/,
    );
    assert.equal(readFileSync(outside, "utf8"), "sentinel");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
