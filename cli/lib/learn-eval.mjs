// Learning eval checkpoint generation and reports for `design-ai learn`.

import { existsSync } from "node:fs";
import path from "node:path";

import { normalizeCategory } from "./learn-args.mjs";
import { auditLearningProfile, loadLearningProfile } from "./learn-profile.mjs";
import { selectLearningEntrySet } from "./learn-select.mjs";
import { cleanNoteText, defaultLearningFile, shortHash } from "./learn-shared.mjs";

function parseLearningEvalPayload(evalText, source = "input") {
  let payload = null;
  try {
    payload = JSON.parse(String(evalText || ""));
  } catch {
    throw new Error("Learning eval checkpoint is not valid JSON");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Learning eval checkpoint must be a JSON object with a cases array");
  }
  if (!Array.isArray(payload.cases)) {
    throw new Error("Learning eval checkpoint must include a cases array");
  }
  if (payload.cases.length === 0) {
    throw new Error("Learning eval checkpoint has no cases");
  }

  return {
    source,
    version: Number.isInteger(payload.version) ? payload.version : 1,
    generatedAt: safeIsoString(payload.generatedAt),
    sourceProfile: summarizeLearningEvalSourceProfile(payload.sourceProfile),
    cases: payload.cases,
  };
}

function safeIsoString(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return Number.isNaN(Date.parse(text)) ? "" : text;
}

function nullableBoolean(value) {
  return typeof value === "boolean" ? value : null;
}

function nullableNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function summarizeLearningEvalSourceProfile(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  return {
    file: String(value.file || "").trim(),
    exists: nullableBoolean(value.exists),
    entryCount: nullableNonNegativeInteger(value.entryCount),
    auditStatus: ["pass", "warn", "fail"].includes(String(value.auditStatus || ""))
      ? String(value.auditStatus)
      : "",
    category: value.category ? normalizeCategory(value.category) : "",
    queryPresent: Boolean(cleanNoteText(value.query)),
    limit: nullableNonNegativeInteger(value.limit),
  };
}

function evalStringList(value, { field, caseId }) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`Learning eval case ${caseId} field ${field} must be an array of ids`);
  }
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function evalPositiveInteger(value, { field, caseId, fallback }) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 100) {
    throw new Error(`Learning eval case ${caseId} field ${field} must be an integer from 1 to 100`);
  }
  return number;
}

function evalNonNegativeInteger(value, { field, caseId, fallback = 0 }) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 100) {
    throw new Error(`Learning eval case ${caseId} field ${field} must be an integer from 0 to 100`);
  }
  return number;
}

function normalizeLearningEvalCase(rawCase, index, {
  defaultLimit = 12,
  defaultCategory = "",
} = {}) {
  const caseId = String(rawCase?.id || `case-${index + 1}`).trim() || `case-${index + 1}`;
  if (!rawCase || typeof rawCase !== "object" || Array.isArray(rawCase)) {
    throw new Error(`Learning eval case ${caseId} must be an object`);
  }

  const brief = cleanNoteText(rawCase.brief || rawCase.query);
  if (!brief) {
    throw new Error(`Learning eval case ${caseId} requires a brief`);
  }

  const category = rawCase.category !== undefined
    ? String(rawCase.category || "").trim()
    : defaultCategory;

  return {
    id: caseId,
    routeId: String(rawCase.routeId || "").trim(),
    brief,
    briefHash: shortHash(brief),
    category: category ? normalizeCategory(category) : "",
    limit: evalPositiveInteger(rawCase.limit, {
      field: "limit",
      caseId,
      fallback: defaultLimit,
    }),
    expectedSelectedIds: evalStringList(
      rawCase.expectedSelectedIds ?? rawCase.expectSelectedIds ?? rawCase.expectedEntryIds,
      { field: "expectedSelectedIds", caseId },
    ),
    avoidedSelectedIds: evalStringList(
      rawCase.avoidedSelectedIds ?? rawCase.avoidSelectedIds ?? rawCase.avoidEntryIds,
      { field: "avoidedSelectedIds", caseId },
    ),
    minMatchedCount: evalNonNegativeInteger(rawCase.minMatchedCount, {
      field: "minMatchedCount",
      caseId,
      fallback: 0,
    }),
    requireNoFallback: Boolean(rawCase.requireNoFallback),
  };
}

function learningEvalIssue({ level = "warning", code, message }) {
  return { level, code, message };
}

function summarizeLearningEvalIssues(issues) {
  const failures = issues.filter((issue) => issue.level === "failure").length;
  const warnings = issues.filter((issue) => issue.level === "warning").length;
  return {
    status: failures > 0 ? "fail" : warnings > 0 ? "warn" : "pass",
    failures,
    warnings,
  };
}

function selectedEvalEntry(item) {
  return {
    id: item.id,
    category: item.category,
    score: item.score,
    reason: item.reason,
  };
}

function evaluateLearningCase(profile, rawCase, index, {
  defaultLimit = 12,
  defaultCategory = "",
} = {}) {
  const evalCase = normalizeLearningEvalCase(rawCase, index, {
    defaultLimit,
    defaultCategory,
  });
  const { selection } = selectLearningEntrySet(profile, {
    category: evalCase.category,
    limit: evalCase.limit,
    query: evalCase.brief,
    includeFallback: true,
  });
  const selected = Array.isArray(selection.selected) ? selection.selected : [];
  const selectedEntryIds = selected.map((item) => item.id).filter(Boolean);
  const selectedEntryIdSet = new Set(selectedEntryIds);
  const profileEntryIds = new Set(profile.entries.map((entry) => entry.id).filter(Boolean));
  const issues = [];

  const missingProfileExpectedIds = evalCase.expectedSelectedIds
    .filter((entryId) => !profileEntryIds.has(entryId));
  const missingExpectedIds = evalCase.expectedSelectedIds
    .filter((entryId) => !selectedEntryIdSet.has(entryId));
  const unexpectedAvoidedIds = evalCase.avoidedSelectedIds
    .filter((entryId) => selectedEntryIdSet.has(entryId));

  for (const entryId of missingProfileExpectedIds) {
    issues.push(learningEvalIssue({
      level: "failure",
      code: "expected-entry-not-in-profile",
      message: `Expected entry ${entryId} is not present in the active learning profile.`,
    }));
  }
  if (missingExpectedIds.length > 0) {
    issues.push(learningEvalIssue({
      level: "failure",
      code: "expected-entry-not-selected",
      message: `Expected selected entries were missing: ${missingExpectedIds.join(", ")}.`,
    }));
  }
  if (unexpectedAvoidedIds.length > 0) {
    issues.push(learningEvalIssue({
      level: "failure",
      code: "avoided-entry-selected",
      message: `Avoided entries were selected: ${unexpectedAvoidedIds.join(", ")}.`,
    }));
  }
  if (selection.matchedCount < evalCase.minMatchedCount) {
    issues.push(learningEvalIssue({
      level: "failure",
      code: "matched-count-below-minimum",
      message: `Matched ${selection.matchedCount} learning entries, expected at least ${evalCase.minMatchedCount}.`,
    }));
  }
  if (evalCase.requireNoFallback && selection.fallbackCount > 0) {
    issues.push(learningEvalIssue({
      level: "failure",
      code: "fallback-selected",
      message: `Selected ${selection.fallbackCount} recency fallback entr${selection.fallbackCount === 1 ? "y" : "ies"}.`,
    }));
  }
  if (
    evalCase.expectedSelectedIds.length === 0
    && evalCase.avoidedSelectedIds.length === 0
    && evalCase.minMatchedCount === 0
    && !evalCase.requireNoFallback
  ) {
    issues.push(learningEvalIssue({
      code: "no-eval-assertions",
      message: "Case has no expected ids, avoided ids, minMatchedCount, or requireNoFallback assertion.",
    }));
  }

  const summary = summarizeLearningEvalIssues(issues);

  return {
    id: evalCase.id,
    routeId: evalCase.routeId,
    briefHash: evalCase.briefHash,
    category: evalCase.category,
    limit: evalCase.limit,
    status: summary.status,
    failures: summary.failures,
    warnings: summary.warnings,
    candidateCount: selection.candidateCount,
    matchedCount: selection.matchedCount,
    selectedCount: selection.selectedCount,
    fallbackCount: selection.fallbackCount,
    expectedSelectedIds: evalCase.expectedSelectedIds,
    missingExpectedIds,
    avoidedSelectedIds: evalCase.avoidedSelectedIds,
    unexpectedAvoidedIds,
    minMatchedCount: evalCase.minMatchedCount,
    requireNoFallback: evalCase.requireNoFallback,
    selectedEntryIds,
    selected: selected.map(selectedEvalEntry),
    issues,
  };
}

export function learningEvalReport({
  filePath = defaultLearningFile(),
  evalText = "",
  source = "input",
  limit = 12,
  category = "",
} = {}) {
  const resolvedFile = path.resolve(filePath);
  const defaultLimit = Number.isInteger(limit) && limit > 0 ? limit : 12;
  const defaultCategory = category ? normalizeCategory(category) : "";
  const checkpoint = parseLearningEvalPayload(evalText, source);
  const profileExists = existsSync(resolvedFile);
  const profile = loadLearningProfile(resolvedFile);
  const audit = auditLearningProfile({ filePath: resolvedFile });
  const cases = checkpoint.cases.map((rawCase, index) => evaluateLearningCase(profile, rawCase, index, {
    defaultLimit,
    defaultCategory,
  }));
  const failed = cases.filter((item) => item.status === "fail").length;
  const warned = cases.filter((item) => item.status === "warn").length;
  const passed = cases.filter((item) => item.status === "pass").length;
  const recommendations = [];

  if (!profileExists) {
    recommendations.push({
      level: "warning",
      text: "Learning profile does not exist; initialize or import entries before relying on eval results.",
    });
  }
  if (audit.summary.status !== "pass") {
    recommendations.push({
      level: audit.summary.failures > 0 ? "warning" : "info",
      text: "Run `design-ai learn --audit` before using eval checkpoints as a release gate.",
    });
  }
  if (failed > 0) {
    recommendations.push({
      level: "warning",
      text: "Review failed eval cases before trusting prompt/pack --with-learning selection.",
    });
  }

  return {
    file: resolvedFile,
    source,
    profileExists,
    profileEntryCount: profile.entries.length,
    checkpointVersion: checkpoint.version,
    generatedAt: checkpoint.generatedAt,
    sourceProfile: checkpoint.sourceProfile,
    defaultLimit,
    defaultCategory,
    status: failed > 0 ? "fail" : warned > 0 ? "warn" : "pass",
    caseCount: cases.length,
    passed,
    warned,
    failed,
    auditSummary: audit.summary,
    cases,
    recommendations,
    privacy: {
      storesRawBriefText: false,
      storesBriefHash: true,
      exposesMatchedTokens: false,
    },
  };
}

function learningEvalTemplateCaseId(seed, index) {
  return `eval-${index + 1}-${shortHash(seed).slice(0, 10)}`;
}

function learningEvalTemplateCaseFromEntry(entry, index) {
  return {
    id: learningEvalTemplateCaseId(`${entry.id}\n${entry.category}\n${entry.text}`, index),
    brief: entry.text,
    category: entry.category,
    limit: 1,
    expectedSelectedIds: [entry.id],
    minMatchedCount: 1,
    requireNoFallback: true,
  };
}

export function buildLearningEvalTemplate({
  filePath = defaultLearningFile(),
  query = "",
  category = "",
  limit = 6,
  now = new Date(),
} = {}) {
  const resolvedFile = path.resolve(filePath);
  const normalizedCategory = category ? normalizeCategory(category) : "";
  const maxCases = Number.isInteger(limit) && limit > 0 ? limit : 6;
  const profileExists = existsSync(resolvedFile);
  const profile = loadLearningProfile(resolvedFile);
  const audit = auditLearningProfile({ filePath: resolvedFile });
  const cleanedQuery = cleanNoteText(query);
  const recommendations = [];
  let cases = [];
  let selectionSummary = null;

  if (cleanedQuery) {
    const { selection } = selectLearningEntrySet(profile, {
      category: normalizedCategory,
      limit: maxCases,
      query: cleanedQuery,
      includeFallback: false,
    });
    const expectedSelectedIds = selection.selected.map((item) => item.id).filter(Boolean);
    selectionSummary = {
      mode: selection.mode,
      candidateCount: selection.candidateCount,
      matchedCount: selection.matchedCount,
      selectedCount: expectedSelectedIds.length,
      queryTokenCount: selection.queryTokenCount,
      fallbackCount: selection.fallbackCount,
    };
    if (expectedSelectedIds.length > 0) {
      const evalLimit = expectedSelectedIds.length;
      cases = [
        {
          id: learningEvalTemplateCaseId(`${cleanedQuery}\n${normalizedCategory}`, 0),
          brief: cleanedQuery,
          ...(normalizedCategory ? { category: normalizedCategory } : {}),
          limit: evalLimit,
          expectedSelectedIds,
          minMatchedCount: expectedSelectedIds.length,
          requireNoFallback: true,
        },
      ];
    }
  } else {
    const { entries, selection } = selectLearningEntrySet(profile, {
      category: normalizedCategory,
      limit: maxCases,
      includeFallback: false,
    });
    selectionSummary = {
      mode: selection.mode,
      candidateCount: selection.candidateCount,
      matchedCount: selection.matchedCount,
      selectedCount: entries.length,
      queryTokenCount: selection.queryTokenCount,
      fallbackCount: selection.fallbackCount,
    };
    cases = entries.map((entry, index) => learningEvalTemplateCaseFromEntry(entry, index));
  }

  if (!profileExists) {
    recommendations.push({
      level: "warning",
      text: "Learning profile does not exist; create entries before generating durable eval checkpoints.",
    });
  }
  if (audit.summary.status !== "pass") {
    recommendations.push({
      level: audit.summary.failures > 0 ? "warning" : "info",
      text: "Run `design-ai learn --audit` before using generated eval checkpoints as a gate.",
    });
  }
  if (cases.length === 0) {
    recommendations.push({
      level: "info",
      text: cleanedQuery
        ? "No matching learning entries found for the query; add or adjust learning entries before saving this checkpoint."
        : "No learning entries are available for checkpoint generation.",
    });
  }

  return {
    version: 1,
    generatedAt: now.toISOString(),
    sourceProfile: {
      file: resolvedFile,
      exists: profileExists,
      entryCount: profile.entries.length,
      auditStatus: audit.summary.status,
      category: normalizedCategory,
      query: cleanedQuery,
      limit: maxCases,
    },
    selection: selectionSummary,
    caseCount: cases.length,
    cases,
    recommendations,
    privacy: {
      storesRawBriefText: true,
      storesBriefHash: false,
      exposesMatchedTokens: false,
    },
  };
}
