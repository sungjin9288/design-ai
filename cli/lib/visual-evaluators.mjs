// P17E visual evaluators: turn artifacts that an approved browser adapter left in
// an evidence directory into a design-ai-visual-evaluation v1 report.
// Reads only regular files inside the evidence directory, writes nothing, starts
// no browser, and makes no network call.
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { decodePng } from "./png-rgba.mjs";
import { brandDrift, overflow, pixelDiff } from "./visual-evaluator-measures.mjs";
import {
  VISUAL_EVALUATOR_VERSION,
  VISUAL_EVALUATORS,
  assertNoScoreFields,
  measuredStatus,
  summarize,
  validateThreshold,
  validateViewport,
  validateVisualEvaluation,
} from "./visual-evaluation-contract.mjs";

const MAX_ARTIFACT_BYTES = 25_000_000;
const REQUEST_KEYS = ["kind", "schemaVersion", "source", "tool", "evaluations"];
const EVALUATION_KEYS = ["id", "evaluator", "viewport", "threshold", "inputs"];

const BASE_UNCERTAINTY = Object.freeze({
  "screenshot-regression": [
    "Pixel comparison counts any channel change above channelTolerance; it cannot tell a regression from intended or dynamic content.",
    "Capture settings such as fonts, device scale, and animation state come from the adapter and are not re-checked.",
    "Embedded color profiles and gamma chunks are ignored; only decoded 8-bit RGB or RGBA values are compared.",
  ],
  "visual-diff": [
    "The reference must already be aligned with the candidate; no cropping, scaling, or registration is applied.",
    "Pixel difference does not measure perceived design fidelity or brand intent.",
    "Embedded color profiles and gamma chunks are ignored; palette and grayscale references are not supported.",
  ],
  "responsive-overflow": [
    "Measurements come from the adapter; Design AI does not re-render the page.",
    "Only elements the adapter reported are covered.",
    "An element past either edge counts, so off-canvas drawers and scroll-container children must be excluded by the adapter.",
  ],
  "brand-token-drift": [
    "Only reported color declarations are compared; spacing, type, and imagery are not.",
    "CIE76 distance approximates perceived color difference and can misjudge saturated colors.",
    "Keywords such as currentcolor and fully transparent colors are skipped; translucent and unparsable values are counted as unevaluated.",
  ],
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function text(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} must be a non-empty string`);
}

function exactKeys(value, keys, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${field} must be an object`);
  const actual = Object.keys(value);
  if (actual.length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) {
    throw new Error(`${field} keys must be: ${keys.join(", ")}`);
  }
}

export function validateVisualRequest(request) {
  exactKeys(request, REQUEST_KEYS, "visual evaluation request");
  if (request.kind !== "design-ai-visual-evaluation-request" || request.schemaVersion !== 1) {
    throw new Error("visual evaluation request must be design-ai-visual-evaluation-request schemaVersion 1");
  }
  assertNoScoreFields(request, "visual evaluation request");
  exactKeys(request.source, ["kind", "sha256"], "visual evaluation request.source");
  text(request.source.kind, "visual evaluation request.source.kind");
  if (!/^[a-f0-9]{64}$/.test(request.source.sha256)) throw new Error("request source.sha256 must be a SHA-256 hex digest");
  exactKeys(request.tool, ["name", "version"], "visual evaluation request.tool");
  text(request.tool.name, "visual evaluation request.tool.name");
  text(request.tool.version, "visual evaluation request.tool.version");
  if (!Array.isArray(request.evaluations) || !request.evaluations.length) {
    throw new Error("visual evaluation request.evaluations must be a non-empty array");
  }
  const ids = new Set();
  request.evaluations.forEach((evaluation, index) => {
    const field = `visual evaluation request.evaluations[${index}]`;
    exactKeys(evaluation, EVALUATION_KEYS, field);
    text(evaluation.id, `${field}.id`);
    if (!Object.hasOwn(VISUAL_EVALUATORS, evaluation.evaluator)) throw new Error(`${field}.evaluator is unknown`);
    if (ids.has(evaluation.id)) throw new Error(`${field}.id is duplicated`);
    ids.add(evaluation.id);
    validateViewport(evaluation.viewport, `${field}.viewport`);
    validateThreshold(evaluation.evaluator, evaluation.threshold, `${field}.threshold`);
    exactKeys(evaluation.inputs, VISUAL_EVALUATORS[evaluation.evaluator].roles, `${field}.inputs`);
  });
  return request;
}

// Returns { artifact, bytes } for a safe regular file, or { reason } otherwise.
function readArtifact(root, role, relative) {
  if (typeof relative !== "string" || !relative.trim() || path.isAbsolute(relative)
      || relative.split(/[\\/]/).includes("..")) {
    return { reason: `${role} path must be relative to the evidence directory without parent traversal` };
  }
  const candidate = path.join(root, relative);
  let stat;
  try {
    stat = lstatSync(candidate);
  } catch {
    return { reason: `${role} artifact is missing: ${relative}` };
  }
  if (stat.isSymbolicLink() || !stat.isFile()) return { reason: `${role} artifact must be a regular file: ${relative}` };
  const inside = path.relative(root, realpathSync(candidate));
  if (!inside || inside.startsWith("..") || path.isAbsolute(inside)) {
    return { reason: `${role} artifact resolves outside the evidence directory` };
  }
  const resolved = path.join(root, inside);
  if (stat.size < 1 || stat.size > MAX_ARTIFACT_BYTES) return { reason: `${role} artifact size is out of range: ${relative}` };
  const bytes = readFileSync(resolved);
  return { artifact: { role, path: relative, sha256: sha256(bytes), bytes: bytes.length }, bytes };
}

function parseJson(bytes, role) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${role} artifact is not valid JSON: ${error.message}`);
  }
}

function measure(evaluation, inputs) {
  const { evaluator, threshold, viewport } = evaluation;
  if (evaluator === "responsive-overflow") return overflow(parseJson(inputs.layout, "layout"), viewport, threshold.tolerancePx);
  if (evaluator === "brand-token-drift") {
    return brandDrift(parseJson(inputs.styles, "styles"), parseJson(inputs.tokens, "tokens"), threshold.maxDeltaE);
  }
  const [expectedRole, actualRole] = VISUAL_EVALUATORS[evaluator].roles;
  const expected = decodePng(inputs[expectedRole]);
  const actual = decodePng(inputs[actualRole]);
  if (actual.width % viewport.width !== 0) {
    throw new Error(`candidate width ${actual.width} is not a multiple of the ${viewport.width}px viewport`);
  }
  const result = pixelDiff(expected, actual, threshold.channelTolerance);
  if (!result.dimensionsMatch && evaluator === "visual-diff") {
    throw new Error("reference and candidate dimensions differ; align them before comparing");
  }
  return result;
}

function evaluateOne(evaluation, root) {
  const read = VISUAL_EVALUATORS[evaluation.evaluator].roles.map((role) => ({ role, ...readArtifact(root, role, evaluation.inputs[role]) }));
  const base = {
    id: evaluation.id, evaluator: evaluation.evaluator, viewport: evaluation.viewport, threshold: evaluation.threshold,
    artifacts: read.filter((item) => item.artifact).map((item) => item.artifact),
    uncertainty: [...BASE_UNCERTAINTY[evaluation.evaluator]],
  };
  const missing = read.filter((item) => item.reason).map((item) => item.reason);
  if (missing.length) return { ...base, status: "unverified", measurement: null, reasons: missing };
  let measurement;
  try {
    measurement = measure(evaluation, Object.fromEntries(read.map((item) => [item.role, item.bytes])));
  } catch (error) {
    return { ...base, status: "unverified", measurement: null, reasons: [error.message] };
  }
  if (measurement.unevaluatedValues > (evaluation.threshold.maxUnevaluated ?? Infinity)) {
    return { ...base, status: "unverified", measurement: null,
      reasons: [`${measurement.unevaluatedValues} color value(s) could not be evaluated; maxUnevaluated is ${evaluation.threshold.maxUnevaluated}`] };
  }
  if (measurement.unevaluatedValues) {
    base.uncertainty.push(`${measurement.unevaluatedValues} color value(s) were translucent or unparsable and were not compared.`);
  }
  const status = measuredStatus(evaluation.evaluator, measurement, evaluation.threshold);
  const reasons = status === "fail" ? [`${evaluation.evaluator} exceeded its threshold`] : [];
  return { ...base, status, measurement, reasons };
}

export function evaluateVisualRequest(request, { evidenceDir }) {
  validateVisualRequest(request);
  if (typeof evidenceDir !== "string" || !path.isAbsolute(evidenceDir)) {
    throw new Error("evidenceDir must be an absolute directory path");
  }
  const root = realpathSync(evidenceDir);
  if (!lstatSync(root).isDirectory()) throw new Error("evidenceDir must be a directory");
  const evaluations = request.evaluations.map((evaluation) => evaluateOne(evaluation, root));
  const ordered = evaluations.map(({ id, evaluator, viewport, threshold, status, measurement, artifacts, uncertainty, reasons }) =>
    ({ id, evaluator, viewport, threshold, status, measurement, artifacts, uncertainty, reasons }));
  return validateVisualEvaluation({
    kind: "design-ai-visual-evaluation",
    schemaVersion: 1,
    evaluatorVersion: VISUAL_EVALUATOR_VERSION,
    source: { kind: request.source.kind, sha256: request.source.sha256 },
    requestSha256: sha256(canonical(request)),
    tool: { name: request.tool.name, version: request.tool.version },
    evaluations: ordered,
    summary: summarize(ordered),
  });
}
