import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { buildInspectReport, parseInspectArgs, readInspectSource } from "./inspect.mjs";

test("inspect parser keeps one explicit source and repeatable viewport context", () => {
  assert.deepEqual(
    parseInspectArgs([
      "page.html",
      "--brief", "Review settings",
      "--name", "Settings",
      "--locale", "ko-KR",
      "--viewport", "mobile",
      "--viewport", "desktop",
      "--review-pack", "korean-fintech",
      "--json",
    ]),
    {
      sourcePath: "page.html",
      brief: "Review settings",
      name: "Settings",
      locale: "ko-KR",
      viewports: ["mobile", "desktop"],
      reviewPack: "korean-fintech",
      json: true,
      help: false,
    },
  );
});

test("inspect reads one regular HTML file without changing it", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-inspect-"));
  const file = path.join(dir, "page.html");
  const source = `<html lang="en"><head><meta name="viewport" content="width=device-width"></head><body><button>Save</button></body></html>`;
  writeFileSync(file, source);
  try {
    const parsed = parseInspectArgs(["page.html", "--brief", "Review settings", "--json"]);
    const report = buildInspectReport(parsed, dir);
    assert.equal(report.subject.source, "page.html");
    assert.equal(report.summary.confirmedFindings, 0);
    assert.equal(readFileSync(file, "utf8"), source);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("inspect rejects non-HTML input and symbolic links", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-inspect-boundary-"));
  const html = path.join(dir, "page.html");
  const link = path.join(dir, "linked.html");
  const realDir = path.join(dir, "real");
  const linkedDir = path.join(dir, "linked-dir");
  writeFileSync(html, "<main>content</main>");
  symlinkSync(html, link);
  mkdirSync(realDir);
  writeFileSync(path.join(realDir, "page.html"), "<main>content</main>");
  symlinkSync(realDir, linkedDir);
  try {
    assert.throws(() => readInspectSource("page.txt", dir), /supports \.html and \.htm/);
    assert.throws(() => readInspectSource("linked.html", dir), /does not follow symbolic links/);
    assert.throws(() => readInspectSource("linked-dir/page.html", dir), /does not follow symbolic links/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("inspect accepts an absolute sibling file without treating system path aliases as user symlinks", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-inspect-absolute-"));
  const projectDir = path.join(dir, "project");
  const sourceFile = path.join(dir, "page.html");
  mkdirSync(projectDir);
  writeFileSync(sourceFile, "<main>content</main>");
  try {
    assert.equal(readInspectSource(sourceFile, realpathSync(projectDir)).source, "<main>content</main>");
    assert.equal(readInspectSource(sourceFile, process.cwd()).source, "<main>content</main>");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("inspect requires a brief and rejects extra positional arguments", () => {
  assert.throws(() => buildInspectReport(parseInspectArgs(["page.html"])), /requires --brief/);
  assert.throws(() => parseInspectArgs(["one.html", "two.html"]), /accepts one HTML source file/);
});

test("inspect applies one explicit product review pack without mutating the source", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-inspect-review-pack-"));
  const file = path.join(dir, "page.html");
  const source = `<html lang="ko-KR"><head><meta name="viewport" content="width=device-width"></head><body><label for="phone">휴대폰 번호</label><input id="phone" name="phone"></body></html>`;
  writeFileSync(file, source);
  try {
    const parsed = parseInspectArgs([
      "page.html", "--brief", "Review Korean finance", "--review-pack", "korean-fintech", "--json",
    ]);
    const report = buildInspectReport(parsed, dir);
    assert.equal(report.findings.some((finding) => (
      finding.id === "product-pack:korean-fintech:korean-phone-input-semantics"
    )), true);
    assert.equal(readFileSync(file, "utf8"), source);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
