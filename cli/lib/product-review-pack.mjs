import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PACKAGE_ROOT } from "./paths.mjs";

export const PRODUCT_REVIEW_PACK_SCHEMA_PATH = fileURLToPath(
  new URL("./product-review-pack.schema.json", import.meta.url),
);
export const PRODUCT_REVIEW_PACK_ROOT = path.join(PACKAGE_ROOT, "product-packs");
export const PRODUCT_REVIEW_PACK_SCHEMA = Object.freeze(
  JSON.parse(readFileSync(PRODUCT_REVIEW_PACK_SCHEMA_PATH, "utf8")),
);

const PACK_IDS = Object.freeze([
  "korean-fintech",
  "korean-commerce",
  "korean-saas",
  "korean-content",
  "korean-game",
]);
const DOMAINS = new Set(PRODUCT_REVIEW_PACK_SCHEMA.properties.domain.enum);
const LENSES = new Set(PRODUCT_REVIEW_PACK_SCHEMA.$defs.criterion.properties.lens.enum);
const MODES = new Set(PRODUCT_REVIEW_PACK_SCHEMA.$defs.criterion.properties.mode.enum);
const SEVERITIES = new Set(PRODUCT_REVIEW_PACK_SCHEMA.$defs.criterion.properties.severity.enum);
const STATIC_RULES = new Set([
  "korean-phone-input-semantics",
  "korean-auth-autocomplete",
  "korean-marketing-consent-default",
]);

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
}

function exactKeys(value, keys, field) {
  object(value, field);
  const actual = Object.keys(value);
  if (actual.length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) {
    throw new Error(`${field} keys must be: ${keys.join(", ")}`);
  }
}

function text(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function simpleId(value, field) {
  text(value, field);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error(`${field} must be a lowercase kebab-case id`);
  }
}

function stringArray(value, field, { unique = false } = {}) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${field} must be a non-empty array`);
  }
  value.forEach((item, index) => text(item, `${field}[${index}]`));
  if (unique && new Set(value).size !== value.length) {
    throw new Error(`${field} must not contain duplicates`);
  }
}

function relativePath(value, field) {
  text(value, field);
  const parentTraversal = value.split(/[\\/]/).includes("..");
  if (path.posix.isAbsolute(value) || path.win32.isAbsolute(value) || parentTraversal) {
    throw new Error(`${field} must be a relative path without parent traversal`);
  }
}

function criterion(value, field) {
  exactKeys(value, [
    "id", "lens", "mode", "severity", "title", "question", "evidence",
    "verification", "falsePositiveNotes",
  ], field);
  simpleId(value.id, `${field}.id`);
  if (!LENSES.has(value.lens)) throw new Error(`${field}.lens is not supported`);
  if (!MODES.has(value.mode)) throw new Error(`${field}.mode is not supported`);
  if (!SEVERITIES.has(value.severity)) throw new Error(`${field}.severity is not supported`);
  for (const key of ["title", "question", "evidence"]) text(value[key], `${field}.${key}`);
  stringArray(value.verification, `${field}.verification`);
  stringArray(value.falsePositiveNotes, `${field}.falsePositiveNotes`);
  if (value.mode === "static-html" && !STATIC_RULES.has(value.id)) {
    throw new Error(`${field}.id has no deterministic static rule: ${value.id}`);
  }
}

export function validateProductReviewPack(pack) {
  exactKeys(pack, [
    "kind", "schemaVersion", "revision", "id", "name", "domain", "locale", "summary",
    "viewports", "knowledge", "criteria", "benchmark", "boundary",
  ], "product review pack");
  if (pack.kind !== "design-ai-product-review-pack") {
    throw new Error("product review pack kind must be design-ai-product-review-pack");
  }
  if (pack.schemaVersion !== 1) throw new Error("product review pack schemaVersion must be 1");
  if (!Number.isInteger(pack.revision) || pack.revision < 1) {
    throw new Error("product review pack.revision must be a positive integer");
  }
  simpleId(pack.id, "product review pack.id");
  if (!PACK_IDS.includes(pack.id)) throw new Error(`unknown product review pack id: ${pack.id}`);
  text(pack.name, "product review pack.name");
  if (!DOMAINS.has(pack.domain)) throw new Error("product review pack.domain is not supported");
  if (pack.locale !== "ko-KR") throw new Error("product review pack.locale must be ko-KR");
  text(pack.summary, "product review pack.summary");

  if (!Array.isArray(pack.viewports) || pack.viewports.length !== 2) {
    throw new Error("product review pack.viewports must contain mobile and desktop");
  }
  const viewportNames = new Set();
  pack.viewports.forEach((viewport, index) => {
    const field = `product review pack.viewports[${index}]`;
    exactKeys(viewport, ["name", "width", "height"], field);
    if (!new Set(["mobile", "desktop"]).has(viewport.name)) throw new Error(`${field}.name is not supported`);
    if (!Number.isInteger(viewport.width) || viewport.width < 240) throw new Error(`${field}.width must be at least 240`);
    if (!Number.isInteger(viewport.height) || viewport.height < 240) throw new Error(`${field}.height must be at least 240`);
    viewportNames.add(viewport.name);
  });
  if (viewportNames.size !== 2) throw new Error("product review pack.viewports must include mobile and desktop once");

  stringArray(pack.knowledge, "product review pack.knowledge", { unique: true });
  pack.knowledge.forEach((value, index) => relativePath(value, `product review pack.knowledge[${index}]`));
  if (!Array.isArray(pack.criteria) || pack.criteria.length < 4) {
    throw new Error("product review pack.criteria must contain at least four criteria");
  }
  pack.criteria.forEach((value, index) => criterion(value, `product review pack.criteria[${index}]`));
  if (new Set(pack.criteria.map((item) => item.id)).size !== pack.criteria.length) {
    throw new Error("product review pack.criteria ids must be unique");
  }

  exactKeys(pack.benchmark, ["source", "expectedFindingIds", "falsePositiveNotes"], "product review pack.benchmark");
  relativePath(pack.benchmark.source, "product review pack.benchmark.source");
  stringArray(pack.benchmark.expectedFindingIds, "product review pack.benchmark.expectedFindingIds", { unique: true });
  stringArray(pack.benchmark.falsePositiveNotes, "product review pack.benchmark.falsePositiveNotes");

  exactKeys(pack.boundary, ["mode", "targetRepoMutation", "externalWrites", "notes"], "product review pack.boundary");
  if (pack.boundary.mode !== "read-only") throw new Error("product review pack.boundary.mode must be read-only");
  if (pack.boundary.targetRepoMutation !== false || pack.boundary.externalWrites !== false) {
    throw new Error("product review pack must not mutate a target repository or write externally");
  }
  stringArray(pack.boundary.notes, "product review pack.boundary.notes");
  return pack;
}

function readPack(id) {
  const file = path.join(PRODUCT_REVIEW_PACK_ROOT, `${id}.json`);
  try {
    const pack = JSON.parse(readFileSync(file, "utf8"));
    validateProductReviewPack(pack);
    if (pack.id !== id) throw new Error(`pack id must match file name: ${id}`);
    return pack;
  } catch (error) {
    throw new Error(`Unable to read product review pack ${id}: ${error.message}`);
  }
}

export function listProductReviewPacks() {
  const files = readdirSync(PRODUCT_REVIEW_PACK_ROOT)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.slice(0, -5));
  if (files.length !== PACK_IDS.length || PACK_IDS.some((id) => !files.includes(id))) {
    throw new Error(`Product review pack directory must contain: ${PACK_IDS.join(", ")}`);
  }
  return PACK_IDS.map((id) => {
    const pack = readPack(id);
    return {
      id: pack.id,
      revision: pack.revision,
      name: pack.name,
      domain: pack.domain,
      locale: pack.locale,
      summary: pack.summary,
      criteriaCount: pack.criteria.length,
      benchmark: pack.benchmark.source,
    };
  });
}

export function loadProductReviewPack(id) {
  const normalized = String(id || "").trim();
  if (!PACK_IDS.includes(normalized)) {
    throw new Error(`Unknown product review pack: ${normalized || "(empty)"}. Available: ${PACK_IDS.join(", ")}`);
  }
  return structuredClone(readPack(normalized));
}
