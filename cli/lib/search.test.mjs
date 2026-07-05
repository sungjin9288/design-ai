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
  formatSearchJson,
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

test("formatSearchJson preserves search payload order and readable Korean preview", () => {
  const tmp = mkdtempSync(path.join(tmpdir(), "design-ai-search-"));
  try {
    mkdirSync(path.join(tmp, "knowledge"), { recursive: true });
    writeFileSync(path.join(tmp, "knowledge", "korean-button.md"), "# 한국어 버튼\n\n버튼 검색 결과는 readable JSON이어야 합니다.");

    const hits = searchCorpus({
      query: "버튼",
      designAiPath: tmp,
      dirs: ["knowledge"],
      limit: 1,
    });
    const formatted = formatSearchJson({
      query: "버튼",
      hits,
    });
    const parsed = JSON.parse(formatted);

    assert.deepEqual(Object.keys(parsed), ["query", "hits"]);
    assert.deepEqual(Object.keys(parsed.hits[0]), [
      "file",
      "lineNumber",
      "relPath",
      "preview",
    ]);
    assert.equal(parsed.query, "버튼");
    assert.equal(parsed.hits[0].lineNumber, 1);
    assert.equal(parsed.hits[0].relPath, path.join("knowledge", "korean-button.md"));
    assert.ok(parsed.hits[0].preview.includes("한국어 버튼"));
    assert.match(formatted, /"hits": \[\n    \{\n      "file": "/);
    assert.ok(formatted.includes("한국어 버튼"));
    assert.ok(!formatted.includes("\\u"));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("formatSearchJson preserves empty search result payload order", () => {
  const formatted = formatSearchJson({
    query: "missing",
    hits: [],
  });
  const parsed = JSON.parse(formatted);

  assert.deepEqual(Object.keys(parsed), ["query", "hits"]);
  assert.equal(parsed.query, "missing");
  assert.deepEqual(parsed.hits, []);
  assert.match(formatted, /"query": "missing",\n  "hits": \[\]/);
});

test("parseSearchArgs supports query, limit, dirs, and json", () => {
  assert.deepEqual(parseSearchArgs(["Pretendard", "font", "--limit", "3", "--dir", "knowledge", "--json"]), {
    queryParts: ["Pretendard", "font"],
    query: "Pretendard font",
    dirs: ["knowledge"],
    limit: 3,
    json: true,
    ranked: false,
    embeddings: false,
    provider: "",
    evalTemplate: false,
    eval: false,
    strict: false,
    fromFile: "",
    stdin: false,
    help: false,
    index: undefined,
  });
  assert.equal(parseSearchArgs(["tokens", "--ranked"]).ranked, true);
});

test("parseSearchArgs supports --embeddings and --provider", () => {
  const parsed = parseSearchArgs(["tokens", "--ranked", "--embeddings", "--provider", "./bin/local-embed --quiet"]);
  assert.equal(parsed.embeddings, true);
  assert.equal(parsed.provider, "./bin/local-embed --quiet");
});

test("parseSearchArgs rejects invalid options", () => {
  assert.throws(() => parseSearchArgs(["x", "--limit", "0"]), /--limit/);
  assert.throws(() => parseSearchArgs(["x", "--dir", "bad"]), /--dir/);
  assert.throws(() => parseSearchArgs(["x", "--dir", "knowlege"]), /Did you mean `knowledge`\?/);
  assert.throws(() => parseSearchArgs(["x", "--bad"]), /Unknown search option/);
  assert.throws(() => parseSearchArgs(["x", "--jsno"]), /Did you mean `--json`\?/);
});

test("parseSearchArgs supports search eval template and eval checkpoints", () => {
  assert.deepEqual(parseSearchArgs(["--eval-template", "--json"]), {
    queryParts: [],
    query: "",
    dirs: ["knowledge", "examples", "skills", "docs", "agents", "commands"],
    limit: 20,
    json: true,
    ranked: false,
    embeddings: false,
    provider: "",
    evalTemplate: true,
    eval: false,
    strict: false,
    fromFile: "",
    stdin: false,
    help: false,
    index: undefined,
  });

  assert.deepEqual(parseSearchArgs(["--eval", "--from-file", "search-eval.json", "--strict", "--json"]), {
    queryParts: [],
    query: "",
    dirs: ["knowledge", "examples", "skills", "docs", "agents", "commands"],
    limit: 20,
    json: true,
    ranked: false,
    embeddings: false,
    provider: "",
    evalTemplate: false,
    eval: true,
    strict: true,
    fromFile: "search-eval.json",
    stdin: false,
    help: false,
    index: undefined,
  });

  assert.equal(parseSearchArgs(["--eval", "--stdin", "--limit", "5"]).limit, 5);
});

test("parseSearchArgs rejects invalid eval option combinations", () => {
  assert.throws(() => parseSearchArgs(["--eval", "--eval-template"]), /Choose either --eval-template or --eval/);
  assert.throws(() => parseSearchArgs(["--strict"]), /--strict can only be used with --eval/);
  assert.throws(() => parseSearchArgs(["--eval"]), /--eval requires --from-file or --stdin/);
  assert.throws(() => parseSearchArgs(["--eval-template", "query"]), /--eval-template cannot be combined/);
  assert.throws(() => parseSearchArgs(["--eval-template", "--ranked"]), /--eval-template cannot be combined/);
  assert.throws(() => parseSearchArgs(["--eval-template", "--dir", "knowledge"]), /--eval-template cannot be combined/);
  assert.throws(() => parseSearchArgs(["--eval", "--from-file", "search-eval.json", "query"]), /--eval cannot be combined/);
  assert.throws(() => parseSearchArgs(["--eval", "--from-file", "search-eval.json", "--ranked"]), /--eval cannot be combined/);
  assert.throws(() => parseSearchArgs(["query", "--from-file", "search-eval.json"]), /--from-file and --stdin require --eval/);
  assert.throws(() => parseSearchArgs(["query", "--stdin"]), /--from-file and --stdin require --eval/);
});
