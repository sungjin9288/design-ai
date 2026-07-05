// Tests for cli/lib/search-eval.mjs ranked-search eval checkpoints.

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
  SEARCH_EVAL_VERSION,
  buildSearchEvalTemplate,
  evaluateSearchEvalCase,
  normalizeSearchEvalCase,
  normalizeSearchEvalPayload,
  searchEvalReport,
} from "./search-eval.mjs";

function makeFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-search-eval-"));
  const files = {
    "knowledge/components/button.md": "Button component spec: variants, sizes, and keyboard accessibility.\n",
    "knowledge/i18n/korean-button.md": "버튼을 눌러 계속하세요. 버튼 접근성이 중요합니다.\n",
    "knowledge/colors/palette.md": "Color palette guidance: ramps, semantic aliases, and dark mode contrast.\n",
    "docs/unrelated.md": "This file has nothing to do with the eval cases.\n",
  };

  for (const [relPath, content] of Object.entries(files)) {
    const full = path.join(root, relPath);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  }

  return root;
}

test("buildSearchEvalTemplate creates runnable ranked-search checkpoints including Korean regression queries", () => {
  const template = buildSearchEvalTemplate({ generatedAt: new Date("2026-07-05T00:00:00.000Z") });

  assert.equal(template.version, SEARCH_EVAL_VERSION);
  assert.equal(template.generatedAt, "2026-07-05T00:00:00.000Z");
  assert.equal(typeof template.description, "string");
  assert.ok(template.description.length > 0);
  assert.ok(template.cases.length >= 6);

  const queries = template.cases.map((testCase) => testCase.query);
  assert.ok(queries.includes("버튼"));
  assert.ok(queries.includes("버튼을"));
  assert.ok(queries.includes("접근성이"));
});

test("searchEvalReport passes a template built against a fixture corpus", () => {
  const root = makeFixture();
  try {
    const evalText = JSON.stringify({
      version: SEARCH_EVAL_VERSION,
      cases: [
        { id: "button-spec", query: "button component spec", expectRelPathIn: ["knowledge/components/button.md"], minHits: 1 },
        { id: "korean-button-stem", query: "버튼", minHits: 1 },
        { id: "korean-button-particle", query: "버튼을", minHits: 1 },
        { id: "korean-accessibility-particle", query: "접근성이", minHits: 1 },
        { id: "color-palette", query: "color palette", matchedTokenIncludes: ["color", "palette"], minHits: 1 },
      ],
    });

    const report = searchEvalReport({
      evalText,
      source: "fixture-eval.json",
      sourceRoot: root,
      generatedAt: new Date("2026-07-05T00:00:00.000Z"),
    });

    assert.equal(report.status, "pass");
    assert.equal(report.summary.total, 5);
    assert.equal(report.summary.pass, 5);
    assert.equal(report.summary.fail, 0);
    assert.equal(report.generatedAt, "2026-07-05T00:00:00.000Z");
    assert.ok(report.cases.every((testCase) => testCase.status === "pass"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("searchEvalReport fails cases with unmet expectations", () => {
  const root = makeFixture();
  try {
    const report = searchEvalReport({
      evalText: JSON.stringify({
        version: SEARCH_EVAL_VERSION,
        cases: [
          { id: "too-many-hits", query: "button", minHits: 999 },
          { id: "wrong-top-hit", query: "color palette", expectRelPathIn: ["docs/unrelated.md"] },
        ],
      }),
      source: "fixture-fail.json",
      sourceRoot: root,
    });

    assert.equal(report.status, "fail");
    assert.equal(report.summary.fail, 2);
    assert.match(report.cases[0].message, /Expected at least 999 hit/);
    assert.match(report.cases[1].message, /Expected top hit in/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("searchEvalReport warns on cases with no assertions", () => {
  const root = makeFixture();
  try {
    const report = searchEvalReport({
      evalText: JSON.stringify({
        version: SEARCH_EVAL_VERSION,
        cases: [{ id: "no-assertions", query: "button" }],
      }),
      source: "fixture-warn.json",
      sourceRoot: root,
    });

    assert.equal(report.status, "warn");
    assert.equal(report.cases[0].status, "warn");
    assert.match(report.cases[0].message, /no expectRelPathIn, minHits, or matchedTokenIncludes assertion/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("normalizeSearchEvalPayload rejects malformed payloads", () => {
  assert.throws(() => normalizeSearchEvalPayload("not json"), /Could not parse search eval JSON/);
  assert.throws(() => normalizeSearchEvalPayload(JSON.stringify([])), /must be a JSON object/);
  assert.throws(() => normalizeSearchEvalPayload(JSON.stringify({ version: 999, cases: [] })), /version must be 1/);
  assert.throws(() => normalizeSearchEvalPayload(JSON.stringify({ version: 1 })), /must include a cases array/);
});

test("normalizeSearchEvalCase rejects cases missing required fields", () => {
  assert.throws(() => normalizeSearchEvalCase(null, 0), /must be a JSON object/);
  assert.throws(() => normalizeSearchEvalCase({}, 0), /is missing query/);
  assert.throws(() => normalizeSearchEvalCase({ query: "x", dirs: ["bogus"] }, 0), /invalid value: bogus/);
  assert.throws(() => normalizeSearchEvalCase({ query: "x", limit: 0 }, 0), /limit must be an integer from 1 to 500/);
  assert.throws(() => normalizeSearchEvalCase({ query: "x", minHits: -1 }, 0), /minHits must be a non-negative integer/);

  const normalized = normalizeSearchEvalCase({ id: "case-a", query: "button", limit: 5 }, 0);
  assert.equal(normalized.id, "case-a");
  assert.equal(normalized.limit, 5);
  assert.deepEqual(normalized.dirs, ["knowledge", "examples", "skills", "docs", "agents", "commands"]);
});

test("evaluateSearchEvalCase reports topRelPath, hitCount, and matchedTokens", () => {
  const root = makeFixture();
  try {
    const testCase = normalizeSearchEvalCase({
      id: "button-spec",
      query: "button component spec",
      expectRelPathIn: ["knowledge/components/button.md"],
      minHits: 1,
      matchedTokenIncludes: ["button"],
    }, 0);

    const result = evaluateSearchEvalCase(testCase, root, 10);

    assert.equal(result.status, "pass");
    assert.equal(result.topRelPath, "knowledge/components/button.md");
    assert.ok(result.hitCount >= 1);
    assert.ok(result.matchedTokens.includes("button"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
