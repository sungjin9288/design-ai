import assert from "node:assert/strict";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { PACKAGE_ROOT } from "./paths.mjs";
import {
  listSpecializationBenchmarks,
  loadSpecializationBenchmarkSuite,
  parseSpecializationBenchmarkArgs,
  renderSpecializationBenchmarkMarkdown,
  runSpecializationBenchmarks,
} from "./specialization-benchmark.mjs";
import {
  packagedBenchmarkEvidence,
  validateBenchmarkCaseStudy,
} from "./specialization-benchmark-suite.mjs";

const INCOMPLETE_CASE_STUDY = `# Case

## Source
Synthetic fixture.

## Change
Change.

## Verification
Verify.

## Permission boundary
Read only.

## Remaining risk
Risk.
`;

const FALSE_ADOPTION_CASE_STUDY = `# Case

## Source
Synthetic [fixture](fixture.html).

## Change
Change.

## Verification
Run \`design-ai benchmark case --strict\`.

## Permission boundary
Read only.

## Remaining risk
Risk.

## Claim boundary
This synthetic case does not prove customer adoption. This proves real customer adoption.
`;

function copyPackagedSuite(tempRoot) {
  const fixtureRoot = path.join(tempRoot, "examples", "benchmarks", "product-specialization");
  const suite = JSON.parse(readFileSync(
    path.join(PACKAGE_ROOT, "examples", "benchmarks", "product-specialization", "suite.json"),
    "utf8",
  ));

  for (const definition of suite.cases) {
    const paths = [
      definition.caseStudy,
      definition.input.before,
      definition.input.after,
      definition.input.source,
    ].filter(Boolean);
    for (const relativePath of paths) {
      const destination = path.join(tempRoot, relativePath);
      mkdirSync(path.dirname(destination), { recursive: true });
      copyFileSync(path.join(PACKAGE_ROOT, relativePath), destination);
    }
  }
  writeFileSync(path.join(fixtureRoot, "suite.json"), JSON.stringify(suite));
  return { fixtureRoot, suite };
}

test("specialization benchmark suite covers the four promised journeys", () => {
  const suite = loadSpecializationBenchmarkSuite();
  assert.deepEqual(suite.cases.map((item) => item.journey).sort(), [
    "existing-product-refactor",
    "korean-product-ux",
    "multi-agent-handoff",
    "new-design",
  ]);

  const list = listSpecializationBenchmarks();
  assert.equal(list.kind, "design-ai-specialization-benchmark-list");
  assert.equal(list.cases.length, 4);
  assert.match(renderSpecializationBenchmarkMarkdown(list), /multi-agent-handoff/);
});

test("specialization benchmarks pass without an aggregate quality score", () => {
  const report = runSpecializationBenchmarks();
  assert.equal(report.kind, "design-ai-specialization-benchmark-report");
  assert.equal(report.status, "pass");
  assert.equal(report.summary.cases, 4);
  assert.equal(report.summary.failedCases, 0);
  assert.equal(report.summary.contractFailures, 0);
  assert.equal(report.summary.findingRegressions, 0);
  assert.equal(Object.hasOwn(report.summary, "aggregateQualityScore"), false);
  assert.match(report.suite.sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(report.boundary, {
    mode: "read-only",
    targetRepoMutation: false,
    externalWrites: false,
    localWrites: false,
  });
  assert.equal(report.cases.every((item) => item.status === "pass"), true);
  assert.match(renderSpecializationBenchmarkMarkdown(report), /Aggregate quality score: not used/);
});

test("one benchmark case preserves confirmed and unverified finding semantics", () => {
  const report = runSpecializationBenchmarks({ id: "korean-product-ux" });
  const result = report.cases[0];
  assert.equal(result.findingComparison.status, "pass");
  assert.equal(result.findingComparison.unit, "finding-id");
  assert.deepEqual(result.findingComparison.after.confirmed.observed, []);
  assert.equal(
    result.findingComparison.after.unverified.observed.includes(
      "product-pack:korean-fintech:korean-payment-disclosure",
    ),
    true,
  );
});

test("benchmark parser keeps execution, listing, JSON, and strict modes explicit", () => {
  assert.deepEqual(parseSpecializationBenchmarkArgs(["existing-product-refactor", "--strict", "--json"]), {
    id: "existing-product-refactor",
    json: true,
    list: false,
    strict: true,
    help: false,
  });
  assert.throws(() => parseSpecializationBenchmarkArgs(["--list", "case"]), /cannot be combined/);
  assert.throws(() => parseSpecializationBenchmarkArgs(["--list", "--strict"]), /cannot be combined/);
  assert.throws(() => parseSpecializationBenchmarkArgs(["--unknown"]), /Unknown benchmark option/);
  assert.throws(() => runSpecializationBenchmarks({ id: "unknown" }), /Unknown benchmark case/);
});

test("suite validation rejects missing journey coverage and unsafe boundaries", () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "design-ai-benchmark-suite-"));
  try {
    const { fixtureRoot, suite } = copyPackagedSuite(tempRoot);
    suite.cases[0].journey = "existing-product-refactor";
    writeFileSync(path.join(fixtureRoot, "suite.json"), JSON.stringify(suite));
    assert.throws(() => loadSpecializationBenchmarkSuite(tempRoot), /each specialization journey exactly once/);

    suite.cases[0].journey = "new-design";
    suite.cases[0].boundary.targetRepoMutation = true;
    writeFileSync(path.join(fixtureRoot, "suite.json"), JSON.stringify(suite));
    assert.throws(() => loadSpecializationBenchmarkSuite(tempRoot), /must remain read-only/);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("benchmark fails when an unverified finding is not part of the expected contract", () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "design-ai-benchmark-regression-"));
  try {
    const { fixtureRoot, suite } = copyPackagedSuite(tempRoot);
    const definition = suite.cases.find((item) => item.id === "existing-product-refactor");
    definition.expectation.persistentUnverified = [];
    writeFileSync(path.join(fixtureRoot, "suite.json"), JSON.stringify(suite));

    const report = runSpecializationBenchmarks({ id: definition.id, root: tempRoot });
    assert.equal(report.status, "fail");
    assert.deepEqual(
      report.cases[0].findingComparison.before.unverified.unexpected,
      ["runtime-evidence-not-collected"],
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("suite validation ties each case study to its inputs and exact command", () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "design-ai-benchmark-case-study-"));
  try {
    copyPackagedSuite(tempRoot);
    const relativePath = "docs/case-studies/new-design-contract.md";
    const caseStudy = path.join(tempRoot, relativePath);
    const original = readFileSync(caseStudy, "utf8");

    writeFileSync(
      caseStudy,
      original.replace(
        "../../examples/benchmarks/product-specialization/new-design-contract/candidate.html",
        "../../examples/benchmarks/product-specialization/suite.json",
      ),
    );
    assert.throws(() => loadSpecializationBenchmarkSuite(tempRoot), /source links must exactly match/);

    writeFileSync(
      caseStudy,
      original.replace(
        "fixture.\n\n## Change",
        "fixture. It does not use the unrelated [`suite.json`](../../examples/benchmarks/product-specialization/suite.json).\n\n## Change",
      ),
    );
    assert.throws(() => loadSpecializationBenchmarkSuite(tempRoot), /source links must exactly match/);

    writeFileSync(
      caseStudy,
      original.replace("benchmark new-design-contract --strict", "benchmark definitely-not-a-case --strict"),
    );
    assert.throws(() => loadSpecializationBenchmarkSuite(tempRoot), /must run its exact benchmark case id/);

    writeFileSync(
      caseStudy,
      original.replace("benchmark new-design-contract --strict", "benchmark new-design-contract --strictly"),
    );
    assert.throws(() => loadSpecializationBenchmarkSuite(tempRoot), /must run its exact benchmark case id/);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("suite validation rejects incomplete case studies and symbolic-link evidence", () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "design-ai-benchmark-evidence-"));
  const caseStudy = path.join(tempRoot, "case-study.md");
  const fixture = path.join(tempRoot, "fixture.html");
  const linkedFixture = path.join(tempRoot, "linked-fixture.html");

  try {
    writeFileSync(caseStudy, INCOMPLETE_CASE_STUDY);
    writeFileSync(fixture, "<main>Fixture</main>");
    symlinkSync(fixture, linkedFixture);

    assert.throws(
      () => validateBenchmarkCaseStudy(tempRoot, "case-study.md"),
      /claim boundary/,
    );

    writeFileSync(caseStudy, FALSE_ADOPTION_CASE_STUDY);
    assert.throws(
      () => validateBenchmarkCaseStudy(tempRoot, "case-study.md"),
      /claim boundary must not assert real adoption/,
    );
    assert.throws(
      () => packagedBenchmarkEvidence(tempRoot, "linked-fixture.html", "fixture"),
      /regular non-symbolic-link file/,
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
