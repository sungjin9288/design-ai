import { isDeepStrictEqual } from "node:util";

export const DESIGN_ARTIFACT_APPROVAL_REQUIREMENTS = Object.freeze([
  "editing a target repository",
  "installing or changing dependencies",
  "running migrations or changing persistent data",
  "creating commits, pushing, deploying, or writing to an external system",
]);

export const DESIGN_ARTIFACT_MODES = Object.freeze([
  "implementation-plan",
  "critique-loop",
  "design-contract",
]);

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value;
}

function exactKeys(value, keys, field) {
  const actual = Object.keys(object(value, field)).sort();
  const expected = [...keys].sort();
  if (!isDeepStrictEqual(actual, expected)) {
    throw new Error(`${field} keys must be exactly: ${keys.join(", ")}`);
  }
}

function keysWithOptional(value, required, optional, field) {
  const actual = Object.keys(object(value, field));
  const missing = required.filter((key) => !actual.includes(key));
  const allowed = new Set([...required, ...optional]);
  const unknown = actual.filter((key) => !allowed.has(key));
  if (missing.length || unknown.length) {
    throw new Error(`${field} keys must include ${required.join(", ")} and may include ${optional.join(", ")}`);
  }
}

function text(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function textList(value, field) {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${field} must be a non-empty array`);
  value.forEach((item, index) => text(item, `${field}[${index}]`));
}


function stringList(value, field) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  value.forEach((item, index) => text(item, `${field}[${index}]`));
}

function finiteNumber(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${field} must be a finite number`);
}

function boolean(value, field) {
  if (typeof value !== "boolean") throw new Error(`${field} must be a boolean`);
}

function routeReference(value, field) {
  exactKeys(value, ["path", "exists"], field);
  text(value.path, `${field}.path`);
  boolean(value.exists, `${field}.exists`);
}

function routeReferenceList(value, field) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  value.forEach((item, index) => routeReference(item, `${field}[${index}]`));
}

function coverageCount(value, field) {
  exactKeys(value, ["available", "total"], field);
  finiteNumber(value.available, `${field}.available`);
  finiteNumber(value.total, `${field}.total`);
  const invalidCount = !Number.isInteger(value.available)
    || !Number.isInteger(value.total)
    || value.available < 0
    || value.total < 0
    || value.available > value.total;
  if (invalidCount) {
    throw new Error(`${field} must contain non-negative integer coverage counts`);
  }
}

function routeExplanation(value, field) {
  exactKeys(value, ["summary", "scoreBreakdown", "referenceCoverage", "missingReferences"], field);
  text(value.summary, `${field}.summary`);
  if (!Array.isArray(value.scoreBreakdown) || value.scoreBreakdown.length === 0) {
    throw new Error(`${field}.scoreBreakdown must be a non-empty array`);
  }
  value.scoreBreakdown.forEach((entry, index) => {
    exactKeys(entry, ["label", "value"], `${field}.scoreBreakdown[${index}]`);
    text(entry.label, `${field}.scoreBreakdown[${index}].label`);
    finiteNumber(entry.value, `${field}.scoreBreakdown[${index}].value`);
  });
  exactKeys(value.referenceCoverage, ["command", "skills", "agents", "knowledge", "total"], `${field}.referenceCoverage`);
  for (const key of ["command", "skills", "agents", "knowledge", "total"]) {
    coverageCount(value.referenceCoverage[key], `${field}.referenceCoverage.${key}`);
  }
  stringList(value.missingReferences, `${field}.missingReferences`);
}

function route(value, field) {
  const required = [
    "id",
    "label",
    "score",
    "confidence",
    "matchedKeywords",
    "command",
    "skills",
    "agents",
    "knowledge",
    "keywords",
    "explanation",
  ];
  keysWithOptional(value, required, ["relatedKnowledge", "forced", "fallback"], field);
  text(value.id, `${field}.id`);
  text(value.label, `${field}.label`);
  finiteNumber(value.score, `${field}.score`);
  if (!["high", "medium", "low", "catalog", "forced"].includes(value.confidence)) {
    throw new Error(`${field}.confidence is unsupported`);
  }
  stringList(value.matchedKeywords, `${field}.matchedKeywords`);
  if (value.command !== null) routeReference(value.command, `${field}.command`);
  routeReferenceList(value.skills, `${field}.skills`);
  routeReferenceList(value.agents, `${field}.agents`);
  routeReferenceList(value.knowledge, `${field}.knowledge`);
  stringList(value.keywords, `${field}.keywords`);
  routeExplanation(value.explanation, `${field}.explanation`);
  if (value.relatedKnowledge !== undefined) {
    if (!Array.isArray(value.relatedKnowledge)) throw new Error(`${field}.relatedKnowledge must be an array`);
    value.relatedKnowledge.forEach((item, index) => {
      exactKeys(item, ["id", "score", "matchedTokens"], `${field}.relatedKnowledge[${index}]`);
      text(item.id, `${field}.relatedKnowledge[${index}].id`);
      finiteNumber(item.score, `${field}.relatedKnowledge[${index}].score`);
      stringList(item.matchedTokens, `${field}.relatedKnowledge[${index}].matchedTokens`);
    });
  }
  if (value.forced !== undefined && value.forced !== true) throw new Error(`${field}.forced may only be present as true`);
  if (value.fallback !== undefined && value.fallback !== true) throw new Error(`${field}.fallback may only be present as true`);
  if (value.forced === true && value.fallback === true) throw new Error(`${field} cannot be forced and fallback`);
  if ((value.confidence === "forced") !== (value.forced === true)) {
    throw new Error(`${field}.confidence and forced provenance must agree`);
  }
  const fallbackShape = value.confidence === "low"
    && value.score === 0
    && value.matchedKeywords.length === 0;
  if (fallbackShape !== (value.fallback === true)) {
    throw new Error(`${field}.fallback provenance must identify every zero-score low-confidence route`);
  }
}

export function validateDesignArtifact(artifact) {
  exactKeys(artifact, [
    "kind",
    "schemaVersion",
    "mode",
    "title",
    "brief",
    "route",
    "outputFile",
    "sourceFiles",
    "workflow",
    "outputSections",
    "approval",
    "verification",
    "markdown",
  ], "design artifact");
  if (artifact.kind !== "design-ai-artifact" || artifact.schemaVersion !== 1) {
    throw new Error("design artifact kind and schemaVersion must be design-ai-artifact v1");
  }
  if (!DESIGN_ARTIFACT_MODES.includes(artifact.mode)) {
    throw new Error(`design artifact.mode must be one of: ${DESIGN_ARTIFACT_MODES.join(", ")}`);
  }
  for (const field of ["title", "brief", "outputFile", "markdown"]) text(artifact[field], `design artifact.${field}`);
  route(artifact.route, "design artifact.route");
  if (!Array.isArray(artifact.sourceFiles)) throw new Error("design artifact.sourceFiles must be an array");
  artifact.sourceFiles.forEach((item, index) => text(item, `design artifact.sourceFiles[${index}]`));
  if (!Array.isArray(artifact.workflow) || artifact.workflow.length === 0) {
    throw new Error("design artifact.workflow must be a non-empty array");
  }
  artifact.workflow.forEach((step, index) => {
    exactKeys(step, ["title", "purpose", "evidence"], `design artifact.workflow[${index}]`);
    for (const field of ["title", "purpose", "evidence"]) text(step[field], `design artifact.workflow[${index}].${field}`);
  });
  textList(artifact.outputSections, "design artifact.outputSections");
  exactKeys(artifact.approval, ["status", "requiresApproval"], "design artifact.approval");
  if (artifact.approval.status !== "pending-human-approval") {
    throw new Error("design artifact.approval.status must be pending-human-approval");
  }
  textList(artifact.approval.requiresApproval, "design artifact.approval.requiresApproval");
  if (!isDeepStrictEqual(artifact.approval.requiresApproval, DESIGN_ARTIFACT_APPROVAL_REQUIREMENTS)) {
    throw new Error("design artifact approval requirements must preserve all four permission gates");
  }
  exactKeys(artifact.verification, ["command", "checklist"], "design artifact.verification");
  text(artifact.verification.command, "design artifact.verification.command");
  textList(artifact.verification.checklist, "design artifact.verification.checklist");
  return artifact;
}
