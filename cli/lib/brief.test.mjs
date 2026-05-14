// Tests for cli/lib/brief.mjs shared brief input handling.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  parseBriefSourceFlag,
  resolveBriefInput,
} from "./brief.mjs";

test("parseBriefSourceFlag handles file and stdin sources", () => {
  const file = { index: 0 };
  assert.equal(parseBriefSourceFlag(["--from-file", "brief.md"], file), true);
  assert.equal(file.fromFile, "brief.md");
  assert.equal(file.index, 1);

  const alias = { index: 0 };
  assert.equal(parseBriefSourceFlag(["--file", "brief.md"], alias), true);
  assert.equal(alias.fromFile, "brief.md");

  const stdin = { index: 0 };
  assert.equal(parseBriefSourceFlag(["--stdin"], stdin), true);
  assert.equal(stdin.stdin, true);
});

test("parseBriefSourceFlag rejects missing file path", () => {
  assert.throws(() => parseBriefSourceFlag(["--from-file"], { index: 0 }), /expects a file path/);
  assert.throws(() => parseBriefSourceFlag(["--from-file", "--json"], { index: 0 }), /expects a file path/);
});

test("resolveBriefInput supports inline, file, and stdin briefs", () => {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-brief-"));
  try {
    writeFileSync(path.join(root, "brief.md"), "spec a Button component\n");

    assert.equal(resolveBriefInput({ briefParts: ["audit", "signup"] }), "audit signup");
    assert.equal(resolveBriefInput({ fromFile: "brief.md", cwd: root }), "spec a Button component");
    assert.equal(resolveBriefInput({ stdin: true, readStdin: () => "design a dashboard\n" }), "design a dashboard");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("resolveBriefInput rejects empty or conflicting brief sources", () => {
  assert.throws(() => resolveBriefInput({ briefParts: [] }), /Brief is empty/);
  assert.throws(
    () => resolveBriefInput({ briefParts: ["x"], fromFile: "brief.md" }),
    /Use only one brief source/,
  );
  assert.throws(
    () => resolveBriefInput({ fromFile: "brief.md", stdin: true }),
    /Use only one brief source/,
  );
});
