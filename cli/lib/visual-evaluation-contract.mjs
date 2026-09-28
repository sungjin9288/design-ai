// Contract for design-ai-visual-evaluation v1 reports (P17E).
// Each evaluation records its evaluator version, capture tool, viewport, source
// digest, threshold, artifacts, and uncertainty. A pass must be derivable from
// its own measurement and threshold; missing evidence stays unverified; no
// aggregate score exists anywhere in the report.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const VISUAL_EVALUATION_SCHEMA_PATH = fileURLToPath(
  new URL("./visual-evaluation.schema.json", import.meta.url),
);
export const VISUAL_EVALUATION_SCHEMA = Object.freeze(
  JSON.parse(readFileSync(VISUAL_EVALUATION_SCHEMA_PATH, "utf8")),
);
export const VISUAL_EVALUATOR_VERSION = "1.0.0";
export const VISUAL_STATUSES = Object.freeze(["pass", "fail", "unverified"]);

// Required input roles and exact threshold keys per evaluator.
export const VISUAL_EVALUATORS = Object.freeze({
  "screenshot-regression": { roles: ["baseline", "candidate"], threshold: ["maxChangedRatio", "channelTolerance"] },
  "visual-diff": { roles: ["reference", "candidate"], threshold: ["maxChangedRatio", "channelTolerance"] },
  "responsive-overflow": { roles: ["layout"], threshold: ["tolerancePx"] },
  "brand-token-drift": { roles: ["styles", "tokens"], threshold: ["maxDeltaE", "maxOffPalette", "maxUnevaluated"] },
});

const SCORE_KEY = /score|grade|rating/i;
const MAX_LISTED = 20;
const INTEGER_THRESHOLDS = new Set(["channelTolerance", "maxOffPalette", "maxUnevaluated"]);
const SHA256 = /^[a-f0-9]{64}$/;

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${field} must be an object`);
  return value;
}

function exactKeys(value, keys, field) {
  object(value, field);
  const actual = Object.keys(value);
  if (actual.length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) {
    throw new Error(`${field} keys must be: ${keys.join(", ")}`);
  }
}

function text(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} must be a non-empty string`);
}

function textList(value, field, { empty }) {
  if (!Array.isArray(value) || (!empty && value.length === 0)) {
    throw new Error(`${field} must be ${empty ? "an" : "a non-empty"} array`);
  }
  value.forEach((item, index) => text(item, `${field}[${index}]`));
}

function nonNegative(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
}

export function assertNoScoreFields(value, field = "report") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoScoreFields(item, `${field}[${index}]`));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (SCORE_KEY.test(key)) throw new Error(`${field}.${key} is not allowed: visual evaluation has no aggregate score`);
      assertNoScoreFields(item, `${field}.${key}`);
    }
  }
}

export function validateViewport(viewport, field) {
  exactKeys(viewport, ["name", "width", "height"], field);
  if (typeof viewport.name !== "string" || !/^[a-z0-9][a-z0-9-]*$/i.test(viewport.name)) {
    throw new Error(`${field}.name must be a simple name`);
  }
  for (const key of ["width", "height"]) {
    if (!Number.isInteger(viewport[key]) || viewport[key] < 1 || viewport[key] > 10000) {
      throw new Error(`${field}.${key} must be an integer from 1 to 10000`);
    }
  }
}

export function validateThreshold(evaluator, threshold, field) {
  exactKeys(threshold, VISUAL_EVALUATORS[evaluator].threshold, field);
  for (const [key, value] of Object.entries(threshold)) {
    nonNegative(value, `${field}.${key}`);
    if (INTEGER_THRESHOLDS.has(key) && !Number.isInteger(value)) throw new Error(`${field}.${key} must be an integer`);
  }
  if (Object.hasOwn(threshold, "maxChangedRatio") && threshold.maxChangedRatio > 1) {
    throw new Error(`${field}.maxChangedRatio must be at most 1`);
  }
  if (Object.hasOwn(threshold, "channelTolerance") && threshold.channelTolerance > 254) {
    throw new Error(`${field}.channelTolerance must be at most 254 so a change can still be detected`);
  }
}

function validateArtifacts(evaluation, field) {
  if (!Array.isArray(evaluation.artifacts)) throw new Error(`${field}.artifacts must be an array`);
  const roles = new Set();
  evaluation.artifacts.forEach((artifact, index) => {
    const where = `${field}.artifacts[${index}]`;
    exactKeys(artifact, ["role", "path", "sha256", "bytes"], where);
    if (!VISUAL_EVALUATORS[evaluation.evaluator].roles.includes(artifact.role)) {
      throw new Error(`${where}.role ${artifact.role} is not an input of ${evaluation.evaluator}`);
    }
    if (roles.has(artifact.role)) throw new Error(`${where}.role ${artifact.role} is duplicated`);
    roles.add(artifact.role);
    text(artifact.path, `${where}.path`);
    if (path.posix.isAbsolute(artifact.path) || artifact.path.split(/[\\/]/).includes("..")) {
      throw new Error(`${where}.path must be relative without parent traversal`);
    }
    if (!SHA256.test(artifact.sha256)) throw new Error(`${where}.sha256 must be a SHA-256 hex digest`);
    if (!Number.isInteger(artifact.bytes) || artifact.bytes < 1) throw new Error(`${where}.bytes must be positive`);
  });
  return roles;
}

function count(value, field, max = Infinity) {
  if (!Number.isInteger(value) || value < 0 || value > max) throw new Error(`${field} must be an integer from 0 to ${max}`);
  return value;
}

function dimensions(value, field) {
  exactKeys(value, ["width", "height"], field);
  count(value.width, `${field}.width`);
  count(value.height, `${field}.height`);
  if (!value.width || !value.height) throw new Error(`${field} must be positive`);
}

function listed(list, total, field, keys) {
  if (!Array.isArray(list) || list.length !== Math.min(total, MAX_LISTED)) {
    throw new Error(`${field} must list the first ${Math.min(total, MAX_LISTED)} of ${total} item(s)`);
  }
  list.forEach((item, index) => exactKeys(item, keys, `${field}[${index}]`));
}

function validatePixelMeasurement(evaluator, m, field) {
  exactKeys(m, ["dimensionsMatch", "expected", "actual", "changedPixels", "changedRatio", "maxChannelDelta",
    "changedBounds"], field);
  if (typeof m.dimensionsMatch !== "boolean") throw new Error(`${field}.dimensionsMatch must be a boolean`);
  dimensions(m.expected, `${field}.expected`);
  dimensions(m.actual, `${field}.actual`);
  const same = m.expected.width === m.actual.width && m.expected.height === m.actual.height;
  if (same !== m.dimensionsMatch) throw new Error(`${field}.dimensionsMatch contradicts the recorded dimensions`);
  if (!m.dimensionsMatch) {
    if (evaluator === "visual-diff") throw new Error(`${field}: a visual diff with different dimensions is unverified`);
    if ([m.changedPixels, m.changedRatio, m.maxChannelDelta, m.changedBounds].some((value) => value !== null)) {
      throw new Error(`${field}: pixel counts must be null when dimensions differ`);
    }
    return;
  }
  const total = m.actual.width * m.actual.height;
  count(m.changedPixels, `${field}.changedPixels`, total);
  count(m.maxChannelDelta, `${field}.maxChannelDelta`, 255);
  if (m.changedRatio !== m.changedPixels / total) throw new Error(`${field}.changedRatio must equal changedPixels / pixels`);
  if ((m.changedBounds === null) !== (m.changedPixels === 0)) {
    throw new Error(`${field}.changedBounds must be null exactly when no pixel changed`);
  }
  if (m.changedBounds !== null) exactKeys(m.changedBounds, ["x", "y", "width", "height"], `${field}.changedBounds`);
}

function validateMeasurement(evaluator, m, field) {
  if (evaluator === "screenshot-regression" || evaluator === "visual-diff") {
    validatePixelMeasurement(evaluator, m, field);
  } else if (evaluator === "responsive-overflow") {
    exactKeys(m, ["documentOverflowPx", "elementsChecked", "offenderCount", "offenders"], field);
    nonNegative(m.documentOverflowPx, `${field}.documentOverflowPx`);
    count(m.elementsChecked, `${field}.elementsChecked`);
    count(m.offenderCount, `${field}.offenderCount`, m.elementsChecked);
    listed(m.offenders, m.offenderCount, `${field}.offenders`, ["selector", "left", "right"]);
  } else {
    exactKeys(m, ["colorsChecked", "unevaluatedValues", "paletteSize", "offPaletteCount", "offPalette"], field);
    count(m.colorsChecked, `${field}.colorsChecked`);
    if (!m.colorsChecked) throw new Error(`${field}.colorsChecked must be positive for a pass or fail`);
    count(m.unevaluatedValues, `${field}.unevaluatedValues`);
    count(m.paletteSize, `${field}.paletteSize`);
    count(m.offPaletteCount, `${field}.offPaletteCount`, m.colorsChecked);
    listed(m.offPalette, m.offPaletteCount, `${field}.offPalette`, ["selector", "property", "value", "nearestToken", "deltaE"]);
  }
}

// A pass or fail must follow from the measurement and threshold, never be asserted.
// Pixel status uses the exact changed-pixel count so rounding can never hide a change.
export function measuredStatus(evaluator, measurement, threshold) {
  if (evaluator === "screenshot-regression" || evaluator === "visual-diff") {
    if (!measurement.dimensionsMatch) return "fail";
    const allowed = Math.floor(threshold.maxChangedRatio * measurement.actual.width * measurement.actual.height + 1e-9);
    return measurement.changedPixels <= allowed ? "pass" : "fail";
  }
  if (evaluator === "responsive-overflow") {
    return measurement.documentOverflowPx <= threshold.tolerancePx && measurement.offenderCount === 0 ? "pass" : "fail";
  }
  return measurement.offPaletteCount <= threshold.maxOffPalette ? "pass" : "fail";
}

function validateEvaluation(evaluation, field) {
  exactKeys(evaluation, ["id", "evaluator", "viewport", "threshold", "status", "measurement", "artifacts",
    "uncertainty", "reasons"], field);
  text(evaluation.id, `${field}.id`);
  if (!Object.hasOwn(VISUAL_EVALUATORS, evaluation.evaluator)) throw new Error(`${field}.evaluator is unknown`);
  validateViewport(evaluation.viewport, `${field}.viewport`);
  validateThreshold(evaluation.evaluator, evaluation.threshold, `${field}.threshold`);
  if (!VISUAL_STATUSES.includes(evaluation.status)) throw new Error(`${field}.status must be pass, fail, or unverified`);
  const roles = validateArtifacts(evaluation, field);
  textList(evaluation.uncertainty, `${field}.uncertainty`, { empty: false });
  textList(evaluation.reasons, `${field}.reasons`, { empty: evaluation.status !== "unverified" });
  if (evaluation.status === "unverified") {
    if (evaluation.measurement !== null) throw new Error(`${field}: an unverified evaluation has no measurement`);
    return;
  }
  const missing = VISUAL_EVALUATORS[evaluation.evaluator].roles.filter((role) => !roles.has(role));
  if (missing.length) throw new Error(`${field}: ${evaluation.status} needs artifacts for ${missing.join(", ")}`);
  validateMeasurement(evaluation.evaluator, evaluation.measurement, `${field}.measurement`);
  if (evaluation.evaluator === "brand-token-drift"
      && evaluation.measurement.unevaluatedValues > evaluation.threshold.maxUnevaluated) {
    throw new Error(`${field}: more values went unevaluated than maxUnevaluated allows, so the result is unverified`);
  }
  if (measuredStatus(evaluation.evaluator, evaluation.measurement, evaluation.threshold) !== evaluation.status) {
    throw new Error(`${field}.status ${evaluation.status} contradicts its measurement and threshold`);
  }
}

export function summarize(evaluations) {
  const counts = Object.fromEntries(VISUAL_STATUSES.map((status) => [status, 0]));
  for (const evaluation of evaluations) counts[evaluation.status] += 1;
  const status = counts.fail ? "fail" : counts.unverified ? "unverified" : "pass";
  return { ...counts, status };
}

export function validateVisualEvaluation(report) {
  exactKeys(report, ["kind", "schemaVersion", "evaluatorVersion", "source", "requestSha256", "tool", "evaluations",
    "summary"], "visual evaluation");
  if (report.kind !== "design-ai-visual-evaluation" || report.schemaVersion !== 1) {
    throw new Error("visual evaluation must be design-ai-visual-evaluation schemaVersion 1");
  }
  assertNoScoreFields(report);
  text(report.evaluatorVersion, "visual evaluation.evaluatorVersion");
  exactKeys(report.source, ["kind", "sha256"], "visual evaluation.source");
  text(report.source.kind, "visual evaluation.source.kind");
  if (!SHA256.test(report.source.sha256)) throw new Error("visual evaluation.source.sha256 must be a SHA-256 hex digest");
  if (!SHA256.test(report.requestSha256)) throw new Error("visual evaluation.requestSha256 must be a SHA-256 hex digest");
  exactKeys(report.tool, ["name", "version"], "visual evaluation.tool");
  text(report.tool.name, "visual evaluation.tool.name");
  text(report.tool.version, "visual evaluation.tool.version");
  if (!Array.isArray(report.evaluations) || !report.evaluations.length) {
    throw new Error("visual evaluation.evaluations must be a non-empty array");
  }
  const ids = new Set();
  report.evaluations.forEach((evaluation, index) => {
    validateEvaluation(evaluation, `visual evaluation.evaluations[${index}]`);
    if (ids.has(evaluation.id)) throw new Error(`visual evaluation id ${evaluation.id} is duplicated`);
    ids.add(evaluation.id);
  });
  const expected = summarize(report.evaluations);
  if (JSON.stringify(report.summary) !== JSON.stringify(expected)) {
    throw new Error("visual evaluation.summary must be derived from the evaluation statuses");
  }
  return report;
}
