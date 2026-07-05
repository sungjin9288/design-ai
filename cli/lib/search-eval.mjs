// Ranked-search eval checkpoint generation and reports for `design-ai search`.
// Mirrors cli/lib/route.mjs's eval-checkpoint pattern (docs/AI-LEARNING-PHASE2.md
// FU-3): runs hand-authored / generated cases through the shipped deterministic
// ranked search path (rankedSearchCorpus, BM25-style lexical scorer) and reports
// pass/warn/fail. This is the standing evidence artifact for any future decision
// to promote `--ranked` to the default `search` behavior.

import { rankedSearchCorpus } from "./search-ranked.mjs";
import { DEFAULT_SEARCH_DIRS } from "./search.mjs";

export const SEARCH_EVAL_VERSION = 1;
// Default per-case result limit when a case does not specify its own `limit`.
// Kept small and eval-appropriate (route's default is 3; search corpus hits are
// noisier, so 10 gives enough headroom for `minHits` assertions without needing
// a large recall window).
export const SEARCH_EVAL_DEFAULT_LIMIT = 10;

function isoTimestamp(now = new Date()) {
  return (now instanceof Date ? now : new Date(now)).toISOString();
}

export function buildSearchEvalTemplate({ sourceRoot, generatedAt = new Date() } = {}) {
  return {
    version: SEARCH_EVAL_VERSION,
    generatedAt: isoTimestamp(generatedAt),
    description: "Deterministic ranked-search checkpoints for design-ai's BM25-style lexical retrieval.",
    cases: [
      {
        id: "korean-button-stem",
        query: "버튼",
        minHits: 1,
      },
      {
        id: "korean-button-particle",
        query: "버튼을",
        minHits: 1,
      },
      {
        id: "korean-accessibility-particle",
        query: "접근성이",
        minHits: 1,
      },
      {
        id: "accessibility-english",
        query: "accessibility",
        minHits: 5,
        matchedTokenIncludes: ["accessibility"],
      },
      {
        id: "button-component-spec-english",
        query: "button component spec",
        minHits: 5,
        matchedTokenIncludes: ["button", "component", "spec"],
      },
      {
        id: "color-palette-english",
        query: "color palette",
        expectRelPathIn: ["commands/palette-from-brand.md"],
        minHits: 5,
        matchedTokenIncludes: ["color", "palette"],
      },
    ],
  };
}

function searchEvalStatus(counts) {
  if (counts.fail > 0) return "fail";
  if (counts.warn > 0) return "warn";
  return "pass";
}

export function normalizeSearchEvalPayload(evalText, source = "search-eval.json") {
  let payload;
  try {
    payload = JSON.parse(evalText);
  } catch (err) {
    throw new Error(`Could not parse search eval JSON from ${source}: ${err.message}`);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Search eval payload must be a JSON object");
  }
  if (payload.version !== SEARCH_EVAL_VERSION) {
    throw new Error(`Search eval payload version must be ${SEARCH_EVAL_VERSION}`);
  }
  if (!Array.isArray(payload.cases)) {
    throw new Error("Search eval payload must include a cases array");
  }

  return payload;
}

function normalizeStringList(value, { field, id }) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`Search eval case ${id} field ${field} must be an array`);
  }
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

export function normalizeSearchEvalCase(rawCase, index) {
  if (!rawCase || typeof rawCase !== "object" || Array.isArray(rawCase)) {
    throw new Error(`Search eval case ${index + 1} must be a JSON object`);
  }

  const id = String(rawCase.id || `case-${index + 1}`).trim();
  if (!id) throw new Error(`Search eval case ${index + 1} is missing id`);

  const query = String(rawCase.query || "").trim();
  if (!query) throw new Error(`Search eval case ${id} is missing query`);

  const dirs = normalizeStringList(rawCase.dirs, { field: "dirs", id });
  for (const dir of dirs) {
    if (!DEFAULT_SEARCH_DIRS.includes(dir)) {
      throw new Error(`Search eval case ${id} field dirs has invalid value: ${dir}`);
    }
  }

  const limit = rawCase.limit === undefined || rawCase.limit === null
    ? SEARCH_EVAL_DEFAULT_LIMIT
    : Number(rawCase.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new Error(`Search eval case ${id} limit must be an integer from 1 to 500`);
  }

  const expectRelPathIn = normalizeStringList(rawCase.expectRelPathIn, { field: "expectRelPathIn", id });
  const matchedTokenIncludes = normalizeStringList(rawCase.matchedTokenIncludes, { field: "matchedTokenIncludes", id })
    .map((token) => token.toLowerCase());

  let minHits;
  if (rawCase.minHits === undefined || rawCase.minHits === null) {
    minHits = undefined;
  } else {
    minHits = Number(rawCase.minHits);
    if (!Number.isInteger(minHits) || minHits < 0) {
      throw new Error(`Search eval case ${id} field minHits must be a non-negative integer`);
    }
  }

  return {
    id,
    query,
    dirs: dirs.length > 0 ? dirs : DEFAULT_SEARCH_DIRS,
    limit,
    expectRelPathIn,
    minHits,
    matchedTokenIncludes,
  };
}

export function evaluateSearchEvalCase(testCase, sourceRoot, defaultLimit) {
  const limit = testCase.limit || defaultLimit || SEARCH_EVAL_DEFAULT_LIMIT;
  const { hits } = rankedSearchCorpus({
    query: testCase.query,
    designAiPath: sourceRoot,
    dirs: testCase.dirs,
    limit,
  });
  const topHit = hits[0] || null;
  const topRelPath = topHit?.relPath || "";
  const topMatchedTokens = (topHit?.matchedTokens || []).map((token) => token.toLowerCase());

  const hasAssertions = testCase.expectRelPathIn.length > 0
    || testCase.minHits !== undefined
    || testCase.matchedTokenIncludes.length > 0;

  let status = "pass";
  let message = "All checkpoint expectations were satisfied.";

  if (!hasAssertions) {
    status = "warn";
    message = "Case has no expectRelPathIn, minHits, or matchedTokenIncludes assertion.";
  } else if (testCase.expectRelPathIn.length > 0 && !testCase.expectRelPathIn.includes(topRelPath)) {
    status = "fail";
    message = topRelPath
      ? `Expected top hit in [${testCase.expectRelPathIn.join(", ")}], but top hit was ${topRelPath}.`
      : `Expected top hit in [${testCase.expectRelPathIn.join(", ")}], but there were no hits.`;
  } else if (testCase.minHits !== undefined && hits.length < testCase.minHits) {
    status = "fail";
    message = `Expected at least ${testCase.minHits} hit(s), got ${hits.length}.`;
  } else if (
    testCase.matchedTokenIncludes.length > 0
    && !testCase.matchedTokenIncludes.every((token) => topMatchedTokens.includes(token))
  ) {
    status = "fail";
    const missing = testCase.matchedTokenIncludes.filter((token) => !topMatchedTokens.includes(token));
    message = topHit
      ? `Top hit ${topRelPath} did not match expected token(s): ${missing.join(", ")}.`
      : `Expected matched tokens [${missing.join(", ")}], but there were no hits.`;
  }

  return {
    id: testCase.id,
    status,
    message,
    query: testCase.query,
    dirs: testCase.dirs,
    limit,
    topRelPath,
    hitCount: hits.length,
    matchedTokens: topHit?.matchedTokens || [],
    expectRelPathIn: testCase.expectRelPathIn,
    minHits: testCase.minHits ?? null,
    matchedTokenIncludes: testCase.matchedTokenIncludes,
    hits,
  };
}

export function searchEvalReport({
  evalText,
  source = "search-eval.json",
  sourceRoot,
  limit = SEARCH_EVAL_DEFAULT_LIMIT,
  generatedAt = new Date(),
}) {
  const payload = normalizeSearchEvalPayload(evalText, source);
  const normalizedCases = payload.cases.map((testCase, index) => normalizeSearchEvalCase(testCase, index));
  const results = normalizedCases.map((testCase) => evaluateSearchEvalCase(testCase, sourceRoot, limit));
  const counts = results.reduce(
    (acc, result) => ({
      ...acc,
      [result.status]: acc[result.status] + 1,
    }),
    { pass: 0, warn: 0, fail: 0 },
  );
  const summary = {
    total: results.length,
    pass: counts.pass,
    warn: counts.warn,
    fail: counts.fail,
  };

  return {
    evalVersion: payload.version,
    source,
    generatedAt: isoTimestamp(generatedAt),
    status: searchEvalStatus(counts),
    summary,
    cases: results,
  };
}
