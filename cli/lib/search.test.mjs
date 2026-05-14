// Tests for cli/lib/search.mjs corpus search helpers.

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
  buildPreview,
  parseSearchArgs,
  searchCorpus,
  walkMarkdown,
} from "./search.mjs";

test("buildPreview keeps short matching lines intact", () => {
  assert.equal(buildPreview("  Pretendard is the Korean default.  ", "pretendard"), "Pretendard is the Korean default.");
});

test("buildPreview centers long lines around the match", () => {
  const line = `${"a".repeat(90)}Pretendard${"b".repeat(90)}`;
  const preview = buildPreview(line, "pretendard");

  assert.ok(preview.startsWith("..."));
  assert.ok(preview.includes("Pretendard"));
  assert.ok(preview.endsWith("..."));
  assert.ok(preview.length <= 126);
});

test("walkMarkdown skips dot directories and node_modules", () => {
  const tmp = mkdtempSync(path.join(tmpdir(), "design-ai-search-"));
  try {
    mkdirSync(path.join(tmp, "knowledge"), { recursive: true });
    mkdirSync(path.join(tmp, "knowledge", ".hidden"), { recursive: true });
    mkdirSync(path.join(tmp, "knowledge", "node_modules"), { recursive: true });
    writeFileSync(path.join(tmp, "knowledge", "a.md"), "visible");
    writeFileSync(path.join(tmp, "knowledge", ".hidden", "b.md"), "hidden");
    writeFileSync(path.join(tmp, "knowledge", "node_modules", "c.md"), "ignored");

    const files = walkMarkdown(path.join(tmp, "knowledge")).map((file) => path.basename(file));
    assert.deepEqual(files, ["a.md"]);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("searchCorpus returns first match per file with relative paths", () => {
  const tmp = mkdtempSync(path.join(tmpdir(), "design-ai-search-"));
  try {
    mkdirSync(path.join(tmp, "knowledge"), { recursive: true });
    mkdirSync(path.join(tmp, "docs"), { recursive: true });
    writeFileSync(path.join(tmp, "knowledge", "type.md"), "one\nPretendard\nPretendard again");
    writeFileSync(path.join(tmp, "docs", "none.md"), "nothing");

    const hits = searchCorpus({
      query: "pretendard",
      designAiPath: tmp,
      dirs: ["knowledge", "docs"],
    });

    assert.equal(hits.length, 1);
    assert.equal(hits[0].lineNumber, 2);
    assert.equal(hits[0].relPath, path.join("knowledge", "type.md"));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("searchCorpus respects limit", () => {
  const tmp = mkdtempSync(path.join(tmpdir(), "design-ai-search-"));
  try {
    mkdirSync(path.join(tmp, "knowledge"), { recursive: true });
    writeFileSync(path.join(tmp, "knowledge", "a.md"), "token");
    writeFileSync(path.join(tmp, "knowledge", "b.md"), "token");

    const hits = searchCorpus({
      query: "token",
      designAiPath: tmp,
      dirs: ["knowledge"],
      limit: 1,
    });

    assert.equal(hits.length, 1);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("parseSearchArgs supports query, limit, dirs, and json", () => {
  assert.deepEqual(parseSearchArgs(["Pretendard", "font", "--limit", "3", "--dir", "knowledge", "--json"]), {
    queryParts: ["Pretendard", "font"],
    query: "Pretendard font",
    dirs: ["knowledge"],
    limit: 3,
    json: true,
    help: false,
  });
});

test("parseSearchArgs rejects invalid options", () => {
  assert.throws(() => parseSearchArgs(["x", "--limit", "0"]), /--limit/);
  assert.throws(() => parseSearchArgs(["x", "--dir", "bad"]), /--dir/);
  assert.throws(() => parseSearchArgs(["x", "--bad"]), /Unknown search option/);
  assert.throws(() => parseSearchArgs(["x", "--jsno"]), /Did you mean `--json`\?/);
});
