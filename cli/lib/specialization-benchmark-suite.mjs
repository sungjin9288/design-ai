import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import { PACKAGE_ROOT } from "./paths.mjs";

const SUITE_FILE = "examples/benchmarks/product-specialization/suite.json";
const JOURNEYS = new Set([
  "new-design",
  "existing-product-refactor",
  "korean-product-ux",
  "multi-agent-handoff",
]);
const OPERATIONS = new Set(["new-design-contract", "quality-comparison", "multi-agent-handoff"]);

function text(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function textList(value, field) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  const items = value.map((item, index) => text(item, `${field}[${index}]`));
  if (new Set(items).size !== items.length) throw new Error(`${field} must not contain duplicates`);
  return items;
}

function exactKeys(value, keys, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (!isDeepStrictEqual(actual, expected)) {
    throw new Error(`${field} keys must be exactly: ${keys.join(", ")}`);
  }
}

export function packagedBenchmarkEvidence(root, relativePath, field) {
  const normalized = text(relativePath, field);
  if (path.isAbsolute(normalized)) throw new Error(`${field} must be package-relative`);
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, normalized);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`${field} must stay inside the package root`);
  }
  let stat;
  try {
    stat = lstatSync(resolved);
  } catch {
    throw new Error(`${field} does not exist: ${normalized}`);
  }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${field} must be a regular non-symbolic-link file`);
  if (stat.size > 2 * 1024 * 1024) throw new Error(`${field} exceeds the 2 MB benchmark limit`);
  const realRoot = realpathSync(resolvedRoot);
  const realFile = realpathSync(resolved);
  if (realFile !== realRoot && !realFile.startsWith(`${realRoot}${path.sep}`)) {
    throw new Error(`${field} resolves outside the package root`);
  }
  const bytes = readFileSync(realFile);
  return {
    path: normalized,
    absolutePath: realFile,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    size: bytes.length,
  };
}

export function packagedBenchmarkPath(root, relativePath, field) {
  return packagedBenchmarkEvidence(root, relativePath, field).absolutePath;
}

export function validateBenchmarkCaseStudy(
  root,
  relativePath,
  field = "benchmark case study",
  { expectedSources = [], caseId = "" } = {},
) {
  const evidence = packagedBenchmarkEvidence(root, relativePath, field);
  const source = readFileSync(evidence.absolutePath, "utf8");
  const required = ["source", "change", "verification", "permission boundary", "remaining risk", "claim boundary"];
  const matches = [...source.matchAll(/^##\s+(.+)$/gm)];
  const sections = new Map(matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? source.length;
    return [match[1].trim().toLowerCase(), source.slice(start, end).trim()];
  }));
  const missing = required.filter((heading) => !sections.has(heading));
  if (missing.length) throw new Error(`${field} is missing required sections: ${missing.join(", ")}`);
  const empty = required.filter((heading) => sections.get(heading) === "");
  if (empty.length) throw new Error(`${field} has empty required sections: ${empty.join(", ")}`);
  const sourceLinks = [...sections.get("source").matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
  if (sourceLinks.length === 0 || sourceLinks.some((link) => /^(?:[a-z]+:|#)/i.test(link))) {
    throw new Error(`${field} source must link to packaged evidence`);
  }
  const linkedSources = new Set(sourceLinks.map((link, index) => {
    const linkedEvidence = path.normalize(path.join(path.dirname(relativePath), link));
    packagedBenchmarkEvidence(root, linkedEvidence, `${field} source link[${index}]`);
    return linkedEvidence;
  }));
  const normalizedExpectedSources = new Set(expectedSources.map((item) => path.normalize(item)));
  if (normalizedExpectedSources.size > 0 && !isDeepStrictEqual(linkedSources, normalizedExpectedSources)) {
    throw new Error(`${field} source links must exactly match its benchmark inputs`);
  }
  if (!/\bdesign-ai benchmark\b/.test(sections.get("verification"))) {
    throw new Error(`${field} verification must include a design-ai benchmark command`);
  }
  const verificationLines = sections.get("verification").split("\n").map((line) => line.trim());
  if (caseId && !verificationLines.includes(`design-ai benchmark ${caseId} --strict`)) {
    throw new Error(`${field} verification must run its exact benchmark case id`);
  }
  const claim = sections.get("claim boundary");
  if (!/synthetic/i.test(claim) || !/does not prove[^.]*adoption/i.test(claim)) {
    throw new Error(`${field} claim boundary must identify synthetic evidence and reject a real adoption claim`);
  }
  const claimsWithoutDenials = claim.replace(/does not prove[^.]*adoption/gi, "");
  if (/\b(?:proves?|confirms?|demonstrates?)\b[^.]*\badoption\b/i.test(claimsWithoutDenials)) {
    throw new Error(`${field} claim boundary must not assert real adoption`);
  }
  return { path: evidence.path, sha256: evidence.sha256, valid: true };
}

function validateExpectation(expectation, field) {
  exactKeys(
    expectation,
    ["beforeConfirmed", "afterConfirmed", "persistentUnverified", "falsePositiveNotes"],
    field,
  );
  textList(expectation.beforeConfirmed, `${field}.beforeConfirmed`);
  textList(expectation.afterConfirmed, `${field}.afterConfirmed`);
  textList(expectation.persistentUnverified, `${field}.persistentUnverified`);
  const notes = textList(expectation.falsePositiveNotes, `${field}.falsePositiveNotes`);
  if (notes.length === 0) throw new Error(`${field}.falsePositiveNotes must not be empty`);
}

function validateBoundary(boundary, field) {
  exactKeys(boundary, ["mode", "targetRepoMutation", "externalWrites", "localWrites"], field);
  if (
    boundary.mode !== "read-only"
    || boundary.targetRepoMutation !== false
    || boundary.externalWrites !== false
    || boundary.localWrites !== false
  ) {
    throw new Error(`${field} must remain read-only with no writes`);
  }
}

function validateCase(definition, index, root) {
  const field = `benchmark suite cases[${index}]`;
  exactKeys(
    definition,
    ["id", "journey", "name", "operation", "brief", "caseStudy", "input", "expectation", "boundary"],
    field,
  );
  text(definition.id, `${field}.id`);
  text(definition.name, `${field}.name`);
  text(definition.brief, `${field}.brief`);
  if (!JOURNEYS.has(definition.journey)) throw new Error(`${field}.journey is unsupported`);
  if (!OPERATIONS.has(definition.operation)) throw new Error(`${field}.operation is unsupported`);
  validateBoundary(definition.boundary, `${field}.boundary`);

  if (definition.operation === "new-design-contract") {
    exactKeys(definition.input, ["routeId", "source", "locale", "viewports"], `${field}.input`);
    text(definition.input.routeId, `${field}.input.routeId`);
    packagedBenchmarkPath(root, definition.input.source, `${field}.input.source`);
    text(definition.input.locale, `${field}.input.locale`);
    textList(definition.input.viewports, `${field}.input.viewports`);
    exactKeys(definition.expectation, [
      "routeId",
      "artifactMode",
      "outputFile",
      "candidateConfirmed",
      "requiredUnverified",
      "falsePositiveNotes",
    ], `${field}.expectation`);
    text(definition.expectation.routeId, `${field}.expectation.routeId`);
    text(definition.expectation.artifactMode, `${field}.expectation.artifactMode`);
    text(definition.expectation.outputFile, `${field}.expectation.outputFile`);
    textList(definition.expectation.candidateConfirmed, `${field}.expectation.candidateConfirmed`);
    textList(definition.expectation.requiredUnverified, `${field}.expectation.requiredUnverified`);
    const notes = textList(definition.expectation.falsePositiveNotes, `${field}.expectation.falsePositiveNotes`);
    if (notes.length === 0) throw new Error(`${field}.expectation.falsePositiveNotes must not be empty`);
    validateBenchmarkCaseStudy(root, definition.caseStudy, `${field}.caseStudy`, {
      expectedSources: [definition.input.source],
      caseId: definition.id,
    });
    return;
  }

  if (definition.operation === "quality-comparison") {
    exactKeys(definition.input, ["before", "after", "locale", "viewports", "reviewPack"], `${field}.input`);
    packagedBenchmarkPath(root, definition.input.before, `${field}.input.before`);
    packagedBenchmarkPath(root, definition.input.after, `${field}.input.after`);
    text(definition.input.locale, `${field}.input.locale`);
    textList(definition.input.viewports, `${field}.input.viewports`);
    if (typeof definition.input.reviewPack !== "string") {
      throw new Error(`${field}.input.reviewPack must be a string`);
    }
    validateExpectation(definition.expectation, `${field}.expectation`);
    validateBenchmarkCaseStudy(root, definition.caseStudy, `${field}.caseStudy`, {
      expectedSources: [definition.input.before, definition.input.after],
      caseId: definition.id,
    });
    return;
  }

  exactKeys(
    definition.input,
    ["routeId", "source", "locale", "viewports", "producer", "consumer"],
    `${field}.input`,
  );
  text(definition.input.routeId, `${field}.input.routeId`);
  packagedBenchmarkPath(root, definition.input.source, `${field}.input.source`);
  text(definition.input.locale, `${field}.input.locale`);
  textList(definition.input.viewports, `${field}.input.viewports`);
  text(definition.input.producer, `${field}.input.producer`);
  text(definition.input.consumer, `${field}.input.consumer`);
  validateExpectation(definition.expectation, `${field}.expectation`);
  validateBenchmarkCaseStudy(root, definition.caseStudy, `${field}.caseStudy`, {
    expectedSources: [definition.input.source],
    caseId: definition.id,
  });
}

export function loadSpecializationBenchmarkSuite(root = PACKAGE_ROOT) {
  const suitePath = packagedBenchmarkPath(root, SUITE_FILE, "benchmark suite");
  const suite = JSON.parse(readFileSync(suitePath, "utf8"));
  exactKeys(suite, ["kind", "schemaVersion", "revision", "cases"], "benchmark suite");
  if (suite.kind !== "design-ai-specialization-benchmark-suite") {
    throw new Error("benchmark suite kind must be design-ai-specialization-benchmark-suite");
  }
  if (suite.schemaVersion !== 1 || suite.revision !== 1) {
    throw new Error("benchmark suite schemaVersion and revision must be 1");
  }
  if (!Array.isArray(suite.cases) || suite.cases.length !== JOURNEYS.size) {
    throw new Error("benchmark suite must contain exactly four cases");
  }
  suite.cases.forEach((definition, index) => validateCase(definition, index, root));
  const ids = suite.cases.map((definition) => definition.id);
  const journeys = suite.cases.map((definition) => definition.journey);
  if (new Set(ids).size !== ids.length) throw new Error("benchmark suite case ids must be unique");
  if (new Set(journeys).size !== JOURNEYS.size) {
    throw new Error("benchmark suite must cover each specialization journey exactly once");
  }
  return suite;
}
