import path from "node:path";
import { isDeepStrictEqual } from "node:util";

const RESULT_STATUSES = new Set(["pass", "fail", "not-run"]);
const OBSERVATION_CATEGORIES = new Set(["accessibility", "responsive", "browser", "runtime", "manual"]);
const OBSERVATION_STATUSES = new Set(["confirmed", "unverified"]);
const RISK_SEVERITIES = new Set(["p0", "p1", "p2", "p3"]);

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

function text(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function timestamp(value, field) {
  text(value, field);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${field} must be a canonical UTC ISO timestamp`);
  }
}

function safePath(value, field) {
  text(value, field);
  if (path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value)
    || value.split(/[\\/]/).includes("..") || /[\\\0\r\n*?]/.test(value)) {
    throw new Error(`${field} must be an exact relative path without traversal or wildcards`);
  }
}

function pathList(value, field) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  value.forEach((item, index) => safePath(item, `${field}[${index}]`));
  if (new Set(value).size !== value.length) throw new Error(`${field} must not contain duplicates`);
}

function command(value, field) {
  text(value, field);
  if (/[\0\r\n]/.test(value)) throw new Error(`${field} must be one command line`);
}

function validateExecutedWork(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("implementation evidence request executedWork must be a non-empty array");
  }
  items.forEach((item, index) => {
    const field = `implementation evidence request executedWork[${index}]`;
    exactKeys(item, ["statusEntry", "path", "summary"], field);
    text(item.statusEntry, `${field}.statusEntry`);
    if (/[\0\r\n]/.test(item.statusEntry)) throw new Error(`${field}.statusEntry must be one Git status line`);
    safePath(item.path, `${field}.path`);
    text(item.summary, `${field}.summary`);
  });
  const paths = items.map((item) => item.path);
  if (new Set(paths).size !== paths.length) {
    throw new Error("implementation evidence request executedWork paths must not contain duplicates");
  }
}

function validateVerificationResults(results) {
  if (!Array.isArray(results)) throw new Error("implementation evidence request verificationResults must be an array");
  results.forEach((result, index) => {
    const field = `implementation evidence request verificationResults[${index}]`;
    exactKeys(result, ["command", "status", "startedAt", "completedAt", "exitCode", "summary", "artifacts"], field);
    command(result.command, `${field}.command`);
    if (!RESULT_STATUSES.has(result.status)) throw new Error(`${field}.status must be pass, fail, or not-run`);
    text(result.summary, `${field}.summary`);
    pathList(result.artifacts, `${field}.artifacts`);
    if (result.status === "not-run") {
      if (result.startedAt !== "" || result.completedAt !== "" || result.exitCode !== null) {
        throw new Error(`${field} not-run result must keep timestamps empty and exitCode null`);
      }
      return;
    }
    timestamp(result.startedAt, `${field}.startedAt`);
    timestamp(result.completedAt, `${field}.completedAt`);
    if (result.completedAt < result.startedAt) throw new Error(`${field} completedAt must not precede startedAt`);
    if (!Number.isInteger(result.exitCode)) throw new Error(`${field}.exitCode must be an integer`);
    if (result.status === "pass" && result.exitCode !== 0) throw new Error(`${field} pass result must use exitCode 0`);
    if (result.status === "fail" && result.exitCode === 0) throw new Error(`${field} fail result must use a non-zero exitCode`);
  });
  const commands = results.map((result) => result.command);
  if (new Set(commands).size !== commands.length) {
    throw new Error("implementation evidence request verificationResults commands must not contain duplicates");
  }
}

function validateObservations(observations) {
  if (!Array.isArray(observations)) throw new Error("implementation evidence request observations must be an array");
  observations.forEach((observation, index) => {
    const field = `implementation evidence request observations[${index}]`;
    exactKeys(observation, ["id", "category", "status", "summary", "artifacts"], field);
    text(observation.id, `${field}.id`);
    if (!OBSERVATION_CATEGORIES.has(observation.category)) throw new Error(`${field}.category is unsupported`);
    if (!OBSERVATION_STATUSES.has(observation.status)) throw new Error(`${field}.status must be confirmed or unverified`);
    text(observation.summary, `${field}.summary`);
    pathList(observation.artifacts, `${field}.artifacts`);
    if (observation.status === "confirmed" && observation.artifacts.length === 0) {
      throw new Error(`${field} confirmed observation requires an artifact`);
    }
  });
  const ids = observations.map((observation) => observation.id);
  if (new Set(ids).size !== ids.length) throw new Error("implementation evidence request observation ids must not contain duplicates");
  for (const category of ["accessibility", "responsive", "browser"]) {
    if (!observations.some((observation) => observation.category === category)) {
      throw new Error(`implementation evidence request observations must explicitly cover ${category}`);
    }
  }
}

function validateRemainingRisks(risks) {
  if (!Array.isArray(risks)) throw new Error("implementation evidence request remainingRisks must be an array");
  risks.forEach((risk, index) => {
    const field = `implementation evidence request remainingRisks[${index}]`;
    exactKeys(risk, ["severity", "summary"], field);
    if (!RISK_SEVERITIES.has(risk.severity)) throw new Error(`${field}.severity must be p0, p1, p2, or p3`);
    text(risk.summary, `${field}.summary`);
  });
}

export function validateImplementationEvidenceRequest(request) {
  exactKeys(request, [
    "kind",
    "schemaVersion",
    "consumer",
    "implementationStartedAt",
    "implementationCompletedAt",
    "executedWork",
    "verificationResults",
    "observations",
    "remainingRisks",
  ], "implementation evidence request");
  if (request.kind !== "design-ai-implementation-evidence-request" || request.schemaVersion !== 1) {
    throw new Error("implementation evidence request must be design-ai-implementation-evidence-request v1");
  }
  text(request.consumer, "implementation evidence request consumer");
  timestamp(request.implementationStartedAt, "implementation evidence request implementationStartedAt");
  timestamp(request.implementationCompletedAt, "implementation evidence request implementationCompletedAt");
  if (request.implementationCompletedAt < request.implementationStartedAt) {
    throw new Error("implementation evidence request completion must not precede its start");
  }
  validateExecutedWork(request.executedWork);
  validateVerificationResults(request.verificationResults);
  validateObservations(request.observations);
  validateRemainingRisks(request.remainingRisks);
  return request;
}
