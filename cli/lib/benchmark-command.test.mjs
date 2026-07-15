import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { runBenchmark } from "../commands/benchmark.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";

async function captureOutput(action) {
  const lines = [];
  const originalLog = console.log;
  console.log = (...args) => lines.push(args.join(" "));
  try {
    await action();
  } finally {
    console.log = originalLog;
  }
  return lines.join("\n");
}

test("benchmark command emits the canonical passing report", async () => {
  const output = await captureOutput(() => runBenchmark(["--strict", "--json"]));
  const report = JSON.parse(output);
  assert.equal(report.kind, "design-ai-specialization-benchmark-report");
  assert.equal(report.status, "pass");
  assert.equal(report.summary.cases, 4);
  assert.equal(Object.hasOwn(report.summary, "aggregateQualityScore"), false);
  assert.equal(process.exitCode, undefined);
});

test("benchmark command lists cases and renders a readable report", async () => {
  const list = JSON.parse(await captureOutput(() => runBenchmark(["--list", "--json"])));
  assert.equal(list.cases.length, 4);

  const report = await captureOutput(() => runBenchmark(["existing-product-refactor"]));
  assert.match(report, /Read-only regression proof/);
  assert.match(report, /Existing settings page refactor/);
  assert.match(report, /Aggregate quality score: not used/);
});

test("benchmark command leaves packaged sources unchanged", async () => {
  const paths = [
    "examples/benchmarks/product-specialization/suite.json",
    "examples/benchmarks/product-specialization/existing-product-refactor/before.html",
    "examples/benchmarks/product-specialization/existing-product-refactor/after.html",
  ];
  const before = paths.map((relativePath) => readFileSync(`${PACKAGE_ROOT}/${relativePath}`, "utf8"));
  await captureOutput(() => runBenchmark(["existing-product-refactor", "--json"]));
  const after = paths.map((relativePath) => readFileSync(`${PACKAGE_ROOT}/${relativePath}`, "utf8"));
  assert.deepEqual(after, before);
});
