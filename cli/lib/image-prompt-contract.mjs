// Fail-closed contracts shared by the Prompt Guide client and image workflow.

import { createHash } from "node:crypto";

export const PROMPT_GUIDE_SOURCE_REPOSITORY = "https://github.com/freestylefly/awesome-gpt-image-2.git";
export const PROMPT_GUIDE_UPSTREAM_COMMIT = "de6a8ad89b6308dc49b316fcd9f7a56bf2a73273";
export const PROMPT_GUIDE_RESPONSE_VERSION = "v1";

const TASK_TYPES = new Set(["generation", "editing"]);
const ARRAY_FIELDS = [
  "exactTexts", "styles", "scenes", "constraints", "negativeConstraints",
  "preserve", "modify", "remove", "add", "mustNotChange", "referenceAssetIds",
];
const SENSITIVE_KEY = /api.?key|authorization|token|secret|billing|user|storage|database|raw.*response/i;

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function text(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be a non-empty string`);
  return value.trim();
}

function optionalText(value, label) {
  return value === undefined || value === null || value === "" ? undefined : text(value, label);
}

function strings(value, label) {
  if (!Array.isArray(value) || value.length > 100 || !value.every((item) => typeof item === "string" && item.trim() !== "")) {
    throw new TypeError(`${label} must be a bounded array of non-empty strings`);
  }
  return value.map((item) => item.trim());
}

function hasSensitiveValue(value) {
  if (Array.isArray(value)) return value.some(hasSensitiveValue);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, item]) => SENSITIVE_KEY.test(key) || hasSensitiveValue(item));
}

function taskType(value, label) {
  const result = text(value, label);
  if (!TASK_TYPES.has(result)) throw new TypeError(`${label} must be generation or editing`);
  return result;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalJson(value[key])]));
}

function promptMetadata(value) {
  const source = value === undefined ? {} : object(value, "metadata");
  const allowed = new Set(["size", "quality", "providerOptions"]);
  if (Object.keys(source).some((key) => !allowed.has(key))) throw new TypeError("metadata contains an unsupported field");
  const result = {};
  for (const key of ["size", "quality"]) {
    const normalized = optionalText(source[key], `metadata.${key}`);
    if (normalized) result[key] = normalized;
  }
  if (source.providerOptions !== undefined) {
    const options = object(source.providerOptions, "metadata.providerOptions");
    if (hasSensitiveValue(options)) throw new TypeError("metadata.providerOptions must not contain secrets");
    let serialized;
    try { serialized = JSON.stringify(options); } catch { throw new TypeError("metadata.providerOptions must be JSON-serializable"); }
    if (serialized.length > 16384) throw new TypeError("metadata.providerOptions exceeds the size limit");
    result.providerOptions = options;
  }
  return result;
}

export function assertResponseVersion(value, label = "responseVersion") {
  if (text(value, label) !== PROMPT_GUIDE_RESPONSE_VERSION) {
    throw new TypeError(`${label} must match the accepted /api/v1 response version`);
  }
  return PROMPT_GUIDE_RESPONSE_VERSION;
}

export function assertImageEditingInstructions(value) {
  const source = object(value, "image editing instructions");
  const result = {};
  for (const key of ["preserve", "modify", "remove", "add", "mustNotChange", "referenceAssetIds"]) {
    result[key] = source[key] === undefined ? [] : strings(source[key], key);
  }
  return result;
}

export function assertPromptRequest(value) {
  const source = object(value, "image prompt request");
  const result = { taskType: taskType(source.taskType, "taskType") };
  for (const key of ["domain", "outputType", "intent", "language"]) result[key] = text(source[key], key);
  for (const key of ["audience", "aspectRatio"]) {
    const normalized = optionalText(source[key], key);
    if (normalized) result[key] = normalized;
  }
  for (const key of ARRAY_FIELDS) result[key] = source[key] === undefined ? [] : strings(source[key], key);
  result.metadata = promptMetadata(source.metadata);
  if (result.taskType === "generation" && ["preserve", "modify", "remove", "add", "mustNotChange", "referenceAssetIds"].some((key) => result[key].length > 0)) {
    throw new TypeError("generation requests must not contain editing instructions or reference assets");
  }
  if (result.taskType === "editing" && result.referenceAssetIds.length === 0) {
    throw new TypeError("editing requests require referenceAssetIds");
  }
  return result;
}

export function assertProvenance(value, label = "provenance") {
  const provenance = object(value, label);
  if (text(provenance.sourceRepository, `${label}.sourceRepository`) !== PROMPT_GUIDE_SOURCE_REPOSITORY) {
    throw new TypeError(`${label}.sourceRepository does not match the pinned upstream repository`);
  }
  if (text(provenance.upstreamCommit, `${label}.upstreamCommit`) !== PROMPT_GUIDE_UPSTREAM_COMMIT) {
    throw new TypeError(`${label}.upstreamCommit does not match the pinned upstream commit`);
  }
  const overlayVersions = provenance.overlayVersions === undefined ? {} : object(provenance.overlayVersions, `${label}.overlayVersions`);
  if (hasSensitiveValue(overlayVersions)) throw new TypeError(`${label}.overlayVersions must not contain secrets`);
  return {
    sourceRepository: PROMPT_GUIDE_SOURCE_REPOSITORY,
    upstreamCommit: PROMPT_GUIDE_UPSTREAM_COMMIT,
    catalogVersion: text(provenance.catalogVersion, `${label}.catalogVersion`),
    overlayVersions,
  };
}

export function assertCatalogSummary(value) {
  const catalog = object(value, "catalog summary");
  if (!Number.isInteger(catalog.templateCount) || catalog.templateCount < 0) {
    throw new TypeError("catalog summary.templateCount must be a non-negative integer");
  }
  const provenance = assertProvenance(catalog, "catalog summary");
  if (catalog.templates !== undefined && (!Array.isArray(catalog.templates) || catalog.templates.length > 100)) {
    throw new TypeError("catalog summary.templates must be a bounded array when present");
  }
  return { ...provenance, templateCount: catalog.templateCount, responseVersion: assertResponseVersion(catalog.responseVersion, "catalog summary.responseVersion") };
}

export function assertRecommendation(value) {
  const recommendation = object(value, "recommendation");
  return {
    taskType: taskType(recommendation.taskType, "recommendation.taskType"),
    language: text(recommendation.language, "recommendation.language"),
    selectedTemplateId: text(recommendation.selectedTemplateId, "recommendation.selectedTemplateId"),
    selectedTemplateVersion: text(recommendation.selectedTemplateVersion, "recommendation.selectedTemplateVersion"),
    catalogVersion: text(recommendation.catalogVersion, "recommendation.catalogVersion"),
    reason: text(recommendation.reason, "recommendation.reason"),
    provenance: assertProvenance(recommendation.provenance, "recommendation.provenance"),
    responseVersion: assertResponseVersion(recommendation.responseVersion, "recommendation.responseVersion"),
  };
}

export function assertCompiledPrompt(value) {
  const compiled = object(value, "compiled prompt");
  const result = {};
  for (const key of ["promptId", "selectedTemplateId", "selectedTemplateVersion", "catalogVersion", "language", "compiledPrompt", "createdAt"]) {
    result[key] = text(compiled[key], `compiled prompt.${key}`);
  }
  result.taskType = taskType(compiled.taskType, "compiled prompt.taskType");
  for (const key of ["promptBlocks", "evaluationCriteria"]) {
    if (!Array.isArray(compiled[key])) throw new TypeError(`compiled prompt.${key} must be an array`);
    result[key] = compiled[key];
  }
  result.negativeConstraints = strings(compiled.negativeConstraints, "compiled prompt.negativeConstraints");
  result.provenance = assertProvenance(compiled.provenance, "compiled prompt.provenance");
  result.responseVersion = assertResponseVersion(compiled.responseVersion, "compiled prompt.responseVersion");
  return result;
}

export function assertValidationResult(value) {
  const source = object(value, "validation result");
  if (typeof source.valid !== "boolean") throw new TypeError("validation result.valid must be a boolean");
  const result = { valid: source.valid };
  for (const key of ["errors", "warnings"]) {
    if (!Array.isArray(source[key])) throw new TypeError(`validation result.${key} must be an array`);
    result[key] = source[key].map((issue) => {
      object(issue, `validation result.${key} item`);
      const normalized = { code: text(issue.code, `validation result.${key} item.code`), message: text(issue.message, `validation result.${key} item.message`) };
      const field = optionalText(issue.field, `validation result.${key} item.field`);
      return field ? { ...normalized, field } : normalized;
    });
  }
  result.responseVersion = assertResponseVersion(source.responseVersion, "validation result.responseVersion");
  return result;
}

export function assertValidateRequest(value) {
  const request = assertPromptRequest(value);
  const hasCompiled = value && typeof value === "object" && value.compiled !== undefined;
  const hasPrompt = value && typeof value === "object" && value.compiledPrompt !== undefined;
  if (hasCompiled === hasPrompt) throw new TypeError("validation request requires exactly one of compiled or compiledPrompt");
  return hasCompiled ? { ...request, compiled: assertCompiledPrompt(value.compiled) } : { ...request, compiledPrompt: text(value.compiledPrompt, "compiledPrompt") };
}

export function assertPromptLineage(request, recommendation, compiled) {
  const normalizedRequest = assertPromptRequest(request);
  const normalizedRecommendation = assertRecommendation(recommendation);
  const normalizedCompiled = assertCompiledPrompt(compiled);
  const failures = [];
  for (const [label, actual, expected] of [
    ["recommendation taskType", normalizedRecommendation.taskType, normalizedRequest.taskType],
    ["compiled taskType", normalizedCompiled.taskType, normalizedRequest.taskType],
    ["recommendation language", normalizedRecommendation.language, normalizedRequest.language],
    ["compiled language", normalizedCompiled.language, normalizedRequest.language],
    ["template ID", normalizedCompiled.selectedTemplateId, normalizedRecommendation.selectedTemplateId],
    ["template version", normalizedCompiled.selectedTemplateVersion, normalizedRecommendation.selectedTemplateVersion],
    ["catalog version", normalizedCompiled.catalogVersion, normalizedRecommendation.catalogVersion],
    ["compiled provenance catalog version", normalizedCompiled.provenance.catalogVersion, normalizedCompiled.catalogVersion],
    ["recommendation provenance catalog version", normalizedRecommendation.provenance.catalogVersion, normalizedRecommendation.catalogVersion],
  ]) if (actual !== expected) failures.push(label);
  if (JSON.stringify(canonicalJson(normalizedRecommendation.provenance.overlayVersions)) !== JSON.stringify(canonicalJson(normalizedCompiled.provenance.overlayVersions))) failures.push("provenance overlay versions");
  if (failures.length) throw new TypeError(`Prompt Guide response lineage drift: ${failures.join(", ")}`);
  return { request: normalizedRequest, recommendation: normalizedRecommendation, compiled: normalizedCompiled };
}
