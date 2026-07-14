import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const DESIGN_QUALITY_SCHEMA_PATH = fileURLToPath(
  new URL("./design-quality-report.schema.json", import.meta.url),
);

function readSchema() {
  try {
    return JSON.parse(readFileSync(DESIGN_QUALITY_SCHEMA_PATH, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read design quality schema: ${error.message}`);
  }
}

export const DESIGN_QUALITY_SCHEMA = readSchema();
export const DESIGN_QUALITY_LENSES = Object.freeze([
  ...DESIGN_QUALITY_SCHEMA.$defs.lensId.enum,
]);
export const DESIGN_QUALITY_STATUSES = Object.freeze([
  ...DESIGN_QUALITY_SCHEMA.$defs.qualityStatus.enum,
]);

const SUBJECT_TYPES = new Set(DESIGN_QUALITY_SCHEMA.$defs.subject.properties.type.enum);
const BOUNDARY_MODES = new Set(DESIGN_QUALITY_SCHEMA.$defs.boundary.properties.mode.enum);
const EVIDENCE_KINDS = new Set(DESIGN_QUALITY_SCHEMA.$defs.evidence.properties.kind.enum);
const FINDING_SEVERITIES = new Set(DESIGN_QUALITY_SCHEMA.$defs.finding.properties.severity.enum);
const FINDING_STATUSES = new Set(DESIGN_QUALITY_SCHEMA.$defs.finding.properties.status.enum);
const APPROVAL_STATUSES = new Set(DESIGN_QUALITY_SCHEMA.$defs.approval.properties.status.enum);

function assertObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
}

function assertExactKeys(value, keys, field) {
  assertObject(value, field);
  const actual = Object.keys(value);
  if (actual.length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) {
    throw new Error(`${field} keys must be: ${keys.join(", ")}`);
  }
}

function assertNonEmptyString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function assertDenseArray(value, field) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) throw new Error(`${field} must not contain empty slots`);
  }
}

function assertStringArray(value, field, { allowEmpty = true } = {}) {
  assertDenseArray(value, field);
  if (!allowEmpty && value.length === 0) {
    throw new Error(`${field} must be ${allowEmpty ? "an" : "a non-empty"} array`);
  }
  value.forEach((item, index) => assertNonEmptyString(item, `${field}[${index}]`));
}

function assertEnum(value, allowed, field) {
  if (!allowed.has(value)) {
    throw new Error(`${field} must be one of: ${[...allowed].join(", ")}`);
  }
}

function isNormalizedUtcDateTime(value) {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp) && new Date(timestamp).toISOString() === value;
}

function validateEvidence(item, field) {
  assertExactKeys(item, ["kind", "reference", "observation"], field);
  assertEnum(item.kind, EVIDENCE_KINDS, `${field}.kind`);
  assertNonEmptyString(item.reference, `${field}.reference`);
  assertNonEmptyString(item.observation, `${field}.observation`);
}

function validateEvidenceArray(items, field) {
  assertDenseArray(items, field);
  if (items.length === 0) {
    throw new Error(`${field} must be a non-empty array`);
  }
  items.forEach((item, index) => validateEvidence(item, `${field}[${index}]`));
}

function expectedSummaryStatus(lenses) {
  const statuses = new Set(lenses.map((lens) => lens.status));
  if (statuses.has("fail")) return "fail";
  if (statuses.has("warning")) return "warning";
  if (statuses.has("unverified")) return "unverified";
  return "pass";
}

function validateSummary(summary, lenses, findings) {
  assertExactKeys(
    summary,
    ["status", "confirmedFindings", "unverifiedFindings", "blockingFindings", "nextAction"],
    "quality report summary",
  );
  assertEnum(summary.status, new Set(DESIGN_QUALITY_STATUSES), "quality report summary.status");

  const counts = {
    confirmedFindings: findings.filter((finding) => finding.status === "confirmed").length,
    unverifiedFindings: findings.filter((finding) => finding.status === "unverified").length,
    blockingFindings: findings.filter((finding) => finding.severity === "p0").length,
  };
  for (const [field, expected] of Object.entries(counts)) {
    if (!Number.isInteger(summary[field]) || summary[field] !== expected) {
      throw new Error(`quality report summary.${field} must be ${expected}`);
    }
  }

  const expectedStatus = expectedSummaryStatus(lenses);
  if (summary.status !== expectedStatus) {
    throw new Error(`quality report summary.status must be ${expectedStatus}`);
  }
  assertNonEmptyString(summary.nextAction, "quality report summary.nextAction");
}

function validateFindingStatusAlignment(lenses, findings) {
  const lensStatusById = new Map(lenses.map((lens) => [lens.id, lens.status]));
  for (const finding of findings) {
    const lensStatus = lensStatusById.get(finding.lens);
    if (lensStatus === "pass") {
      throw new Error(`quality report lens ${finding.lens} cannot pass while it has findings`);
    }
    if (finding.status === "confirmed" && lensStatus === "unverified") {
      throw new Error(`quality report lens ${finding.lens} cannot be unverified with a confirmed finding`);
    }
    if (finding.status === "confirmed" && finding.severity === "p0" && lensStatus !== "fail") {
      throw new Error(`quality report lens ${finding.lens} must fail for a confirmed p0 finding`);
    }
  }
}

export function validateDesignQualityReport(report) {
  assertExactKeys(
    report,
    [
      "kind",
      "schemaVersion",
      "generatedAt",
      "subject",
      "context",
      "boundary",
      "sources",
      "lenses",
      "findings",
      "summary",
      "approval",
    ],
    "quality report",
  );

  if (report.kind !== "design-ai-quality-report") {
    throw new Error("quality report kind must be design-ai-quality-report");
  }
  if (report.schemaVersion !== 1) {
    throw new Error("quality report schemaVersion must be 1");
  }
  if (!isNormalizedUtcDateTime(report.generatedAt)) {
    throw new Error("quality report generatedAt must be a normalized UTC date-time string");
  }

  assertExactKeys(report.subject, ["name", "type", "source"], "quality report subject");
  assertNonEmptyString(report.subject.name, "quality report subject.name");
  assertEnum(report.subject.type, SUBJECT_TYPES, "quality report subject.type");
  assertNonEmptyString(report.subject.source, "quality report subject.source");

  assertExactKeys(report.context, ["brief", "routeId", "locale", "viewports"], "quality report context");
  assertNonEmptyString(report.context.brief, "quality report context.brief");
  assertNonEmptyString(report.context.routeId, "quality report context.routeId");
  assertNonEmptyString(report.context.locale, "quality report context.locale");
  assertStringArray(report.context.viewports, "quality report context.viewports", { allowEmpty: false });
  if (new Set(report.context.viewports).size !== report.context.viewports.length) {
    throw new Error("quality report context.viewports must not contain duplicates");
  }

  assertExactKeys(
    report.boundary,
    ["mode", "targetRepoMutation", "externalWrites", "localEvidenceWrites", "localEvidencePath", "notes"],
    "quality report boundary",
  );
  assertEnum(report.boundary.mode, BOUNDARY_MODES, "quality report boundary.mode");
  if (report.boundary.targetRepoMutation !== false || report.boundary.externalWrites !== false) {
    throw new Error("quality report must not mutate a target repository or write to an external system");
  }
  if (typeof report.boundary.localEvidenceWrites !== "boolean") {
    throw new Error("quality report boundary.localEvidenceWrites must be a boolean");
  }
  if (report.boundary.mode === "read-only") {
    if (report.boundary.localEvidenceWrites || report.boundary.localEvidencePath !== null) {
      throw new Error("read-only quality reports cannot write local evidence");
    }
  } else {
    if (!report.boundary.localEvidenceWrites) {
      throw new Error("local-evidence-write quality reports must record a local evidence write");
    }
    assertNonEmptyString(report.boundary.localEvidencePath, "quality report boundary.localEvidencePath");
  }
  assertStringArray(report.boundary.notes, "quality report boundary.notes");

  validateEvidenceArray(report.sources, "quality report sources");

  assertDenseArray(report.lenses, "quality report lenses");
  if (report.lenses.length !== DESIGN_QUALITY_LENSES.length) {
    throw new Error(`quality report lenses must contain exactly ${DESIGN_QUALITY_LENSES.length} entries`);
  }
  const seenLenses = new Set();
  report.lenses.forEach((lens, index) => {
    const field = `quality report lenses[${index}]`;
    assertExactKeys(lens, ["id", "status", "summary", "evidence"], field);
    assertEnum(lens.id, new Set(DESIGN_QUALITY_LENSES), `${field}.id`);
    assertEnum(lens.status, new Set(DESIGN_QUALITY_STATUSES), `${field}.status`);
    assertNonEmptyString(lens.summary, `${field}.summary`);
    validateEvidenceArray(lens.evidence, `${field}.evidence`);
    if (seenLenses.has(lens.id)) throw new Error(`quality report lens is duplicated: ${lens.id}`);
    seenLenses.add(lens.id);
  });
  for (const lensId of DESIGN_QUALITY_LENSES) {
    if (!seenLenses.has(lensId)) throw new Error(`quality report lens is missing: ${lensId}`);
  }

  assertDenseArray(report.findings, "quality report findings");
  const findingIds = new Set();
  report.findings.forEach((finding, index) => {
    const field = `quality report findings[${index}]`;
    assertExactKeys(
      finding,
      ["id", "lens", "severity", "status", "title", "location", "before", "after", "why", "evidence", "verification"],
      field,
    );
    for (const key of ["id", "title", "location", "before", "after", "why"]) {
      assertNonEmptyString(finding[key], `${field}.${key}`);
    }
    assertEnum(finding.lens, new Set(DESIGN_QUALITY_LENSES), `${field}.lens`);
    assertEnum(finding.severity, FINDING_SEVERITIES, `${field}.severity`);
    assertEnum(finding.status, FINDING_STATUSES, `${field}.status`);
    validateEvidenceArray(finding.evidence, `${field}.evidence`);
    assertStringArray(finding.verification, `${field}.verification`, { allowEmpty: false });
    if (findingIds.has(finding.id)) throw new Error(`quality report finding id is duplicated: ${finding.id}`);
    findingIds.add(finding.id);
  });

  validateFindingStatusAlignment(report.lenses, report.findings);
  validateSummary(report.summary, report.lenses, report.findings);

  assertExactKeys(report.approval, ["status", "requiredBefore"], "quality report approval");
  assertEnum(report.approval.status, APPROVAL_STATUSES, "quality report approval.status");
  assertStringArray(report.approval.requiredBefore, "quality report approval.requiredBefore");
  if (report.approval.status === "pending" && report.approval.requiredBefore.length === 0) {
    throw new Error("pending quality report approval must name the gated actions");
  }
  if (report.approval.status === "not-required" && report.approval.requiredBefore.length > 0) {
    throw new Error("quality reports without an approval gate cannot name gated actions");
  }

  return report;
}

export function readDesignQualityReport(filePath) {
  let report;
  try {
    report = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read design quality report at ${filePath}: ${error.message}`);
  }
  return validateDesignQualityReport(report);
}
