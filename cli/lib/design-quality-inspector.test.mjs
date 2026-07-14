import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { inspectHtml } from "./design-quality-inspector.mjs";
import { validateDesignQualityReport } from "./design-quality-contract.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";

const SOURCE_REF = "examples/benchmarks/korean-fintech-settings/source.html";
const BENCHMARK_PATH = path.join(PACKAGE_ROOT, SOURCE_REF);
const BENCHMARK = readFileSync(BENCHMARK_PATH, "utf8");
const OPTIONS = {
  sourceRef: SOURCE_REF,
  brief: "Review a Korean fintech account settings flow before implementation handoff.",
  name: "Korean fintech account settings benchmark",
  locale: "ko-KR",
  viewports: ["mobile", "desktop"],
  generatedAt: "2026-07-14T00:00:00.000Z",
};

test("inspector reproduces the benchmark's confirmed and unverified evidence split", () => {
  const report = inspectHtml(BENCHMARK, OPTIONS);

  assert.strictEqual(validateDesignQualityReport(report), report);
  assert.equal(report.summary.status, "fail");
  assert.equal(report.summary.confirmedFindings, 1);
  assert.equal(report.summary.unverifiedFindings, 1);
  assert.deepEqual(report.findings.map((finding) => finding.status), ["confirmed", "unverified"]);
  assert.match(report.findings[0].id, /^missing-accessible-name-input-14-/);
  assert.equal(report.findings[0].location, `${SOURCE_REF}:14`);
  assert.equal(report.boundary.targetRepoMutation, false);
  assert.equal(report.boundary.externalWrites, false);
});

test("associated, nested, and ARIA labels satisfy the supported static naming checks", () => {
  const source = `<!doctype html>
<html lang="ko">
  <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body>
    <label for="phone">휴대폰 번호</label><input id="phone" type="tel">
    <label>이름 <input name="name"></label>
    <span id="email-label">이메일</span><input aria-labelledby="email-label">
    <button><span>저장</span></button>
    <button><img src="save.png" alt="이미지로 저장"></button>
    <input type="submit"><input type="reset">
    <img src="decorative.png" alt="">
  </body>
</html>`;
  const report = inspectHtml(source, OPTIONS);

  assert.equal(report.summary.confirmedFindings, 0);
  assert.equal(report.summary.unverifiedFindings, 1);
  assert.equal(report.summary.status, "unverified");
  assert.equal(report.findings.some((finding) => finding.lens === "accessibility" && finding.status === "confirmed"), false);
  assert.equal(report.lenses.find((lens) => lens.id === "accessibility").status, "unverified");
});

test("empty labels and whitespace entities do not hide missing accessible names", () => {
  const source = `<!doctype html>
<html lang="en">
  <head><meta name="viewport" content="width=device-width"></head>
  <body><label><input name="empty"></label><button>&nbsp;</button></body>
</html>`;
  const report = inspectHtml(source, OPTIONS);
  const confirmed = report.findings.filter((finding) => finding.status === "confirmed");

  assert.equal(confirmed.length, 2);
  assert.deepEqual(confirmed.map((finding) => finding.lens), ["accessibility", "accessibility"]);
});

test("inert and raw-text contexts do not create controls that are absent from the active document", () => {
  const source = `<!doctype html>
<html lang="en">
  <head><meta name="viewport" content="width=device-width"></head>
  <body>
    <textarea aria-label="Example source"><button></button></textarea>
    <iframe><input></iframe><listing><input></listing><xmp><input></xmp>
    <noembed><input></noembed><noframes><input></noframes><noscript><input></noscript>
    <template><input><img src="draft.png"></template>
    <div inert><input><button>Draft</button></div>
    <plaintext><input>
  </body>
</html>`;
  const report = inspectHtml(source, OPTIONS);

  assert.equal(report.summary.confirmedFindings, 0);
  assert.equal(report.summary.status, "unverified");
});

test("SVG title text contributes to an enclosing button name", () => {
  const source = `<!doctype html>
<html lang="en">
  <head><meta name="viewport" content="width=device-width"></head>
  <body><button><svg><title>Save</title></svg></button></body>
</html>`;
  const report = inspectHtml(source, OPTIONS);

  assert.equal(report.summary.confirmedFindings, 0);
});

test("hidden descendant text and decoded whitespace do not name a button", () => {
  const source = `<!doctype html>
<html lang="en">
  <head><meta name="viewport" content="width=device-width"></head>
  <body><button><span aria-hidden="true">X</span></button><button>&#32;&#x200B;</button></body>
</html>`;
  const report = inspectHtml(source, OPTIONS);
  const confirmed = report.findings.filter((finding) => finding.status === "confirmed");

  assert.equal(confirmed.length, 2);
  assert.deepEqual(confirmed.map((finding) => finding.location), [
    `${SOURCE_REF}:4`,
    `${SOURCE_REF}:4`,
  ]);
});

test("direct aria-labelledby references may use hidden text", () => {
  const source = `<!doctype html>
<html lang="en">
  <head><meta name="viewport" content="width=device-width"></head>
  <body><span id="search-label" hidden>Search</span><input aria-labelledby="search-label"></body>
</html>`;
  const report = inspectHtml(source, OPTIONS);

  assert.equal(report.summary.confirmedFindings, 0);
});

test("named whitespace references do not create a button name", () => {
  const source = `<!doctype html>
<html lang="en">
  <head><meta name="viewport" content="width=device-width"></head>
  <body>
    <button>&MediumSpace;</button><button>&VeryThinSpace;</button><button>&ZeroWidthSpace;</button>
    <button>&af;</button><button>&#xFE0F;</button>
  </body>
</html>`;
  const report = inspectHtml(source, OPTIONS);

  assert.equal(report.summary.confirmedFindings, 5);
});

test("source locations preserve leading whitespace from the supplied document", () => {
  const report = inspectHtml(`\n\n<button></button>`, { ...OPTIONS, sourceRef: "leading-lines.html" });

  assert.equal(report.findings[0].location, "leading-lines.html:3");
});

test("document language, image alt, and mobile viewport defects keep concrete locations", () => {
  const source = `<!doctype html>
<html>
  <head><title>Settings</title></head>
  <body><img src="avatar.png"><button aria-label="Save"></button></body>
</html>`;
  const report = inspectHtml(source, { ...OPTIONS, sourceRef: "settings.html" });

  assert.equal(report.summary.confirmedFindings, 3);
  assert.equal(report.summary.unverifiedFindings, 1);
  assert.equal(report.summary.status, "fail");
  assert.deepEqual(report.findings.slice(0, 3).map((finding) => finding.id), [
    "missing-document-language",
    "missing-image-alt-4-1",
    "missing-viewport-declaration",
  ]);
  assert.equal(report.findings[0].location, "settings.html:2");
  assert.equal(report.findings[1].location, "settings.html:4");
  assert.equal(report.findings[2].location, "settings.html:head");
});

test("desktop-only and fragment reviews do not invent a missing mobile document contract", () => {
  const fragment = `<div><input aria-label="Search"><button>Submit</button></div>`;
  const report = inspectHtml(fragment, {
    ...OPTIONS,
    sourceRef: "component-fragment.html",
    viewports: ["desktop"],
  });

  assert.equal(report.summary.confirmedFindings, 0);
  assert.equal(report.findings.some((finding) => finding.id === "missing-document-language"), false);
  assert.equal(report.findings.some((finding) => finding.id === "missing-viewport-declaration"), false);
});

test("document contracts ignore html and viewport elements inside inert templates", () => {
  const source = `<template><html lang="en"><meta name="viewport" content="width=device-width"></html></template>`;
  const report = inspectHtml(source, OPTIONS);

  assert.equal(report.findings.some((finding) => finding.id === "missing-document-language"), false);
  assert.equal(report.findings.some((finding) => finding.id === "missing-viewport-declaration"), false);
  assert.equal(report.lenses.find((lens) => lens.id === "responsive-resilience").status, "unverified");
});

test("viewport metadata must declare device width to satisfy the mobile contract", () => {
  const source = `<!doctype html>
<html lang="en">
  <head><meta name="viewport"></head>
  <body><button>Save</button></body>
</html>`;
  const report = inspectHtml(source, { ...OPTIONS, sourceRef: "viewport.html" });
  const finding = report.findings.find((item) => item.id === "missing-viewport-declaration");

  assert.equal(finding.location, "viewport.html:3");
  assert.match(finding.evidence[0].observation, /without width=device-width/);
});

test("fixed timestamps make repeated reports byte-equivalent and inspection leaves source unchanged", () => {
  const before = readFileSync(BENCHMARK_PATH, "utf8");
  const first = inspectHtml(BENCHMARK, OPTIONS);
  const second = inspectHtml(BENCHMARK, OPTIONS);

  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(readFileSync(BENCHMARK_PATH, "utf8"), before);
});
