import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const BROWSER_VERIFICATION_SCHEMA_PATH = fileURLToPath(
  new URL("./browser-verification.schema.json", import.meta.url),
);

export const BROWSER_CHECKS = Object.freeze([
  "responsive",
  "keyboard",
  "accessibility",
  "reduced-motion",
  "loading",
  "error",
  "repeated-action",
]);

export const BROWSER_PROBE_STATUSES = Object.freeze(["pass", "fail", "unverified"]);

export const BROWSER_VERIFICATION_SCHEMA = Object.freeze(
  JSON.parse(readFileSync(BROWSER_VERIFICATION_SCHEMA_PATH, "utf8")),
);

const CHECK_SET = new Set(BROWSER_CHECKS);
const STATUS_SET = new Set(BROWSER_PROBE_STATUSES);
const ARTIFACT_KINDS = new Set(["screenshot", "accessibility", "trace", "log", "result"]);

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
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
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function timestamp(value, field) {
  text(value, field);
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed) || new Date(parsed).toISOString() !== value) {
    throw new Error(`${field} must be a normalized UTC date-time string`);
  }
}

function array(value, field, { empty = true } = {}) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  if (!empty && value.length === 0) throw new Error(`${field} must not be empty`);
}

function validateArtifact(artifact, field) {
  exactKeys(artifact, ["kind", "path"], field);
  if (!ARTIFACT_KINDS.has(artifact.kind)) {
    throw new Error(`${field}.kind must be one of: ${[...ARTIFACT_KINDS].join(", ")}`);
  }
  text(artifact.path, `${field}.path`);
  const parentTraversal = artifact.path.split(/[\\/]/).includes("..");
  if (path.posix.isAbsolute(artifact.path) || path.win32.isAbsolute(artifact.path) || parentTraversal) {
    throw new Error(`${field}.path must be a relative path without parent traversal`);
  }
}

function validateViewport(viewport, field) {
  exactKeys(viewport, ["name", "width", "height"], field);
  if (typeof viewport.name !== "string" || !/^[a-z0-9][a-z0-9-]*$/i.test(viewport.name)) {
    throw new Error(`${field}.name must be a simple name`);
  }
  for (const dimension of ["width", "height"]) {
    if (!Number.isInteger(viewport[dimension]) || viewport[dimension] < 240) {
      throw new Error(`${field}.${dimension} must be an integer of at least 240`);
    }
  }
}

function validateRequestedNetworkPolicy(policy, field) {
  exactKeys(
    policy,
    ["allowedOrigin", "allowedMethods", "blockCrossOrigin", "blockWebSockets", "blockDownloads"],
    field,
  );
  text(policy.allowedOrigin, `${field}.allowedOrigin`);
  if (!Array.isArray(policy.allowedMethods)
    || policy.allowedMethods.length !== 2
    || policy.allowedMethods[0] !== "GET"
    || policy.allowedMethods[1] !== "HEAD") {
    throw new Error(`${field}.allowedMethods must be GET, HEAD`);
  }
  for (const key of ["blockCrossOrigin", "blockWebSockets", "blockDownloads"]) {
    if (policy[key] !== true) throw new Error(`${field}.${key} must be true`);
  }
}

function validateProbe(probe, field, viewportNames, startedAt, completedAt) {
  exactKeys(
    probe,
    ["id", "check", "status", "viewport", "observedAt", "observation", "artifacts", "findingIds"],
    field,
  );
  text(probe.id, `${field}.id`);
  if (!CHECK_SET.has(probe.check)) {
    throw new Error(`${field}.check must be one of: ${BROWSER_CHECKS.join(", ")}`);
  }
  if (!STATUS_SET.has(probe.status)) {
    throw new Error(`${field}.status must be one of: ${BROWSER_PROBE_STATUSES.join(", ")}`);
  }
  if (!viewportNames.has(probe.viewport)) {
    throw new Error(`${field}.viewport must name a declared viewport`);
  }
  if (probe.id !== `${probe.check}:${probe.viewport}`) {
    throw new Error(`${field}.id must match check:viewport`);
  }
  timestamp(probe.observedAt, `${field}.observedAt`);
  if (probe.observedAt < startedAt || probe.observedAt > completedAt) {
    throw new Error(`${field}.observedAt must fall within the run interval`);
  }
  text(probe.observation, `${field}.observation`);
  array(probe.artifacts, `${field}.artifacts`, { empty: false });
  probe.artifacts.forEach((artifact, index) => validateArtifact(artifact, `${field}.artifacts[${index}]`));
  const requiredKind = probe.check === "responsive"
    ? "screenshot"
    : probe.check === "accessibility" ? "accessibility" : null;
  if (probe.status === "pass" && requiredKind
    && !probe.artifacts.some((artifact) => artifact.kind === requiredKind)) {
    throw new Error(`${field} pass status requires a ${requiredKind} artifact`);
  }
  array(probe.findingIds, `${field}.findingIds`);
  probe.findingIds.forEach((findingId, index) => text(findingId, `${field}.findingIds[${index}]`));
  if (new Set(probe.findingIds).size !== probe.findingIds.length) {
    throw new Error(`${field}.findingIds must be unique`);
  }
}

function validateFinding(finding, field, probeIds) {
  exactKeys(finding, ["id", "probeId", "sourceFindingIds", "status", "title", "observation", "artifacts"], field);
  text(finding.id, `${field}.id`);
  if (!probeIds.has(finding.probeId)) throw new Error(`${field}.probeId must name a declared probe`);
  array(finding.sourceFindingIds, `${field}.sourceFindingIds`);
  finding.sourceFindingIds.forEach((id, index) => text(id, `${field}.sourceFindingIds[${index}]`));
  if (new Set(finding.sourceFindingIds).size !== finding.sourceFindingIds.length) {
    throw new Error(`${field}.sourceFindingIds must be unique`);
  }
  if (!new Set(["confirmed", "unverified"]).has(finding.status)) {
    throw new Error(`${field}.status must be confirmed or unverified`);
  }
  text(finding.title, `${field}.title`);
  text(finding.observation, `${field}.observation`);
  array(finding.artifacts, `${field}.artifacts`, { empty: false });
  finding.artifacts.forEach((artifact, index) => validateArtifact(artifact, `${field}.artifacts[${index}]`));
}

export function validateBrowserVerification(report) {
  exactKeys(
    report,
    ["kind", "schemaVersion", "sourceReport", "approval", "run", "boundary", "viewports", "probes", "findings", "summary"],
    "browser verification",
  );
  if (report.kind !== "design-ai-browser-verification") {
    throw new Error("browser verification kind must be design-ai-browser-verification");
  }
  if (report.schemaVersion !== 1) throw new Error("browser verification schemaVersion must be 1");

  exactKeys(report.sourceReport, ["path", "sha256", "postRunDigestMatch"], "browser verification sourceReport");
  text(report.sourceReport.path, "browser verification sourceReport.path");
  if (!/^[a-f0-9]{64}$/.test(report.sourceReport.sha256)) {
    throw new Error("browser verification sourceReport.sha256 must be a lowercase SHA-256 digest");
  }
  if (report.sourceReport.postRunDigestMatch !== true) {
    throw new Error("browser verification sourceReport.postRunDigestMatch must be true");
  }

  exactKeys(report.approval, ["status", "reference"], "browser verification approval");
  if (report.approval.status !== "approved") throw new Error("browser verification approval.status must be approved");
  text(report.approval.reference, "browser verification approval.reference");

  exactKeys(report.run, ["id", "url", "startedAt", "completedAt", "tool"], "browser verification run");
  text(report.run.id, "browser verification run.id");
  text(report.run.url, "browser verification run.url");
  timestamp(report.run.startedAt, "browser verification run.startedAt");
  timestamp(report.run.completedAt, "browser verification run.completedAt");
  if (report.run.completedAt < report.run.startedAt) {
    throw new Error("browser verification run.completedAt must not precede startedAt");
  }
  exactKeys(report.run.tool, ["name", "version"], "browser verification run.tool");
  text(report.run.tool.name, "browser verification run.tool.name");
  text(report.run.tool.version, "browser verification run.tool.version");

  exactKeys(
    report.boundary,
    ["mode", "targetRoot", "requestedNetworkPolicy", "adapterAttestation", "sourceReportDigestMatchedAfterRun", "localEvidenceWrites", "localEvidencePath", "notes"],
    "browser verification boundary",
  );
  if (report.boundary.mode !== "local-evidence-write") {
    throw new Error("browser verification boundary.mode must be local-evidence-write");
  }
  text(report.boundary.targetRoot, "browser verification boundary.targetRoot");
  validateRequestedNetworkPolicy(
    report.boundary.requestedNetworkPolicy,
    "browser verification boundary.requestedNetworkPolicy",
  );
  exactKeys(
    report.boundary.adapterAttestation,
    ["networkPolicy", "targetRepoMutation", "externalWrites"],
    "browser verification boundary.adapterAttestation",
  );
  if (!new Set(["attested", "unverified"]).has(report.boundary.adapterAttestation.networkPolicy)) {
    throw new Error("browser verification boundary.adapterAttestation.networkPolicy must be attested or unverified");
  }
  for (const key of ["targetRepoMutation", "externalWrites"]) {
    if (report.boundary.adapterAttestation[key] !== "unverified") {
      throw new Error(`browser verification boundary.adapterAttestation.${key} must remain unverified`);
    }
  }
  if (report.boundary.sourceReportDigestMatchedAfterRun !== true) {
    throw new Error("browser verification boundary.sourceReportDigestMatchedAfterRun must be true");
  }
  if (report.boundary.localEvidenceWrites !== true) {
    throw new Error("browser verification must record its local evidence write");
  }
  text(report.boundary.localEvidencePath, "browser verification boundary.localEvidencePath");
  array(report.boundary.notes, "browser verification boundary.notes");
  report.boundary.notes.forEach((note, index) => text(note, `browser verification boundary.notes[${index}]`));

  array(report.viewports, "browser verification viewports", { empty: false });
  report.viewports.forEach((viewport, index) => validateViewport(viewport, `browser verification viewports[${index}]`));
  const viewportNames = new Set(report.viewports.map((viewport) => viewport.name));
  if (viewportNames.size !== report.viewports.length) {
    throw new Error("browser verification viewport names must be unique");
  }

  array(report.probes, "browser verification probes", { empty: false });
  report.probes.forEach((probe, index) => validateProbe(
    probe,
    `browser verification probes[${index}]`,
    viewportNames,
    report.run.startedAt,
    report.run.completedAt,
  ));
  const probeIds = new Set(report.probes.map((probe) => probe.id));
  if (probeIds.size !== report.probes.length) throw new Error("browser verification probe ids must be unique");
  for (const viewport of report.viewports) {
    for (const check of BROWSER_CHECKS) {
      const count = report.probes.filter((probe) => probe.viewport === viewport.name && probe.check === check).length;
      if (count !== 1) {
        throw new Error(`browser verification must contain one ${check} probe for viewport ${viewport.name}`);
      }
    }
  }

  array(report.findings, "browser verification findings");
  report.findings.forEach((finding, index) => validateFinding(finding, `browser verification findings[${index}]`, probeIds));
  const findingIds = new Set(report.findings.map((finding) => finding.id));
  if (findingIds.size !== report.findings.length) throw new Error("browser verification finding ids must be unique");
  for (const probe of report.probes) {
    const linkedFindings = report.findings.filter((finding) => finding.probeId === probe.id);
    const expectedFindingCount = probe.status === "pass" ? 0 : 1;
    if (linkedFindings.length !== expectedFindingCount || probe.findingIds.length !== expectedFindingCount) {
      throw new Error(`browser verification probe ${probe.id} must link ${expectedFindingCount} finding(s)`);
    }
    for (const findingId of probe.findingIds) {
      if (!findingIds.has(findingId)) throw new Error(`browser verification probe ${probe.id} names an unknown finding`);
      const finding = report.findings.find((item) => item.id === findingId);
      if (finding.probeId !== probe.id) {
        throw new Error(`browser verification probe ${probe.id} cannot link a finding from another probe`);
      }
      const expectedStatus = probe.status === "fail" ? "confirmed" : "unverified";
      if (finding.status !== expectedStatus) {
        throw new Error(`browser verification finding ${finding.id} must be ${expectedStatus}`);
      }
    }
  }

  exactKeys(report.summary, ["status", "passed", "failed", "unverified", "nextAction"], "browser verification summary");
  if (!STATUS_SET.has(report.summary.status)) {
    throw new Error(`browser verification summary.status must be one of: ${BROWSER_PROBE_STATUSES.join(", ")}`);
  }
  const counts = {
    passed: report.probes.filter((probe) => probe.status === "pass").length,
    failed: report.probes.filter((probe) => probe.status === "fail").length,
    unverified: report.probes.filter((probe) => probe.status === "unverified").length,
  };
  for (const [key, expected] of Object.entries(counts)) {
    if (report.summary[key] !== expected) {
      throw new Error(`browser verification summary.${key} must be ${expected}`);
    }
  }
  const status = counts.failed > 0 ? "fail" : counts.unverified > 0 ? "unverified" : "pass";
  if (report.summary.status !== status) throw new Error(`browser verification summary.status must be ${status}`);
  text(report.summary.nextAction, "browser verification summary.nextAction");
  return report;
}
