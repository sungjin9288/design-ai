import { isDeepStrictEqual } from "node:util";

import { validateDesignQualityReport } from "./design-quality-contract.mjs";
import { validateSourceArtifact } from "./implementation-scope-contract.mjs";

const COMPARISON_STATUSES = new Set(["improved", "unchanged", "attention-required", "regressed"]);
const LENS_CHANGES = new Set(["unchanged", "improved", "regressed", "evidence-gained", "evidence-lost"]);

function exactKeys(value, keys, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${field} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (!isDeepStrictEqual(actual, expected)) throw new Error(`${field} keys must be exactly: ${keys.join(", ")}`);
}

function text(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field} must be a non-empty string`);
}

function count(value, field) {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${field} must be a non-negative integer`);
}

function lensChange(before, after) {
  if (before === after) return "unchanged";
  if (before === "unverified") return "evidence-gained";
  if (after === "unverified") return "evidence-lost";
  const rank = { pass: 0, warning: 1, fail: 2 };
  return rank[after] < rank[before] ? "improved" : "regressed";
}

export function assertComparableReports(baseline, candidate) {
  if (!isDeepStrictEqual(baseline.subject, candidate.subject)) {
    throw new Error("review comparison reports must describe the same subject");
  }
  if (!isDeepStrictEqual(baseline.context, candidate.context)) {
    throw new Error("review comparison reports must use the same brief, route, locale, and viewports");
  }
  const baselineLenses = new Map(baseline.findings.map((finding) => [finding.id, finding.lens]));
  for (const finding of candidate.findings) {
    const priorLens = baselineLenses.get(finding.id);
    if (priorLens && priorLens !== finding.lens) {
      throw new Error(`review comparison finding ${finding.id} changed lens identity`);
    }
  }
}

export function expectedLensTransitions(baseline, candidate) {
  return baseline.lenses.map((beforeLens) => {
    const afterLens = candidate.lenses.find((lens) => lens.id === beforeLens.id);
    return {
      id: beforeLens.id,
      before: beforeLens.status,
      after: afterLens.status,
      change: lensChange(beforeLens.status, afterLens.status),
    };
  });
}

function resolvedFinding(finding, afterLensStatus) {
  return {
    id: finding.id,
    lens: finding.lens,
    beforeStatus: finding.status,
    beforeSeverity: finding.severity,
    afterLensStatus,
    reason: "The finding is absent and its candidate lens passes.",
  };
}

function uncertainFinding(finding, afterLensStatus) {
  return {
    id: finding.id,
    lens: finding.lens,
    beforeStatus: finding.status,
    beforeSeverity: finding.severity,
    afterLensStatus,
    reason: "The finding is absent, but its candidate lens does not pass.",
  };
}

export function expectedFindingChanges(baseline, candidate) {
  const beforeById = new Map(baseline.findings.map((finding) => [finding.id, finding]));
  const afterById = new Map(candidate.findings.map((finding) => [finding.id, finding]));
  const afterLensById = new Map(candidate.lenses.map((lens) => [lens.id, lens.status]));
  const resolved = [];
  const persistent = [];
  const introduced = [];
  const uncertain = [];

  for (const before of baseline.findings) {
    const after = afterById.get(before.id);
    if (after) {
      persistent.push({
        id: before.id,
        lens: before.lens,
        beforeStatus: before.status,
        afterStatus: after.status,
        beforeSeverity: before.severity,
        afterSeverity: after.severity,
        reason: "The finding remains in the candidate report.",
      });
      continue;
    }
    const afterLensStatus = afterLensById.get(before.lens);
    if (afterLensStatus === "pass") {
      resolved.push(resolvedFinding(before, afterLensStatus));
    } else {
      uncertain.push(uncertainFinding(before, afterLensStatus));
    }
  }

  for (const after of candidate.findings) {
    if (beforeById.has(after.id)) continue;
    introduced.push({
      id: after.id,
      lens: after.lens,
      afterStatus: after.status,
      afterSeverity: after.severity,
      reason: "The finding appears only in the candidate report.",
    });
  }

  return { resolved, persistent, introduced, uncertain };
}

export function expectedComparisonStatus(lensTransitions, findings) {
  const hasRegression = lensTransitions.some(({ change }) => change === "regressed" || change === "evidence-lost")
    || findings.introduced.some(({ afterStatus }) => afterStatus === "confirmed");
  if (hasRegression) return "regressed";
  if (findings.persistent.length || findings.introduced.length || findings.uncertain.length) return "attention-required";
  return findings.resolved.length ? "improved" : "unchanged";
}

export function expectedComparisonSummary(status, findings) {
  const nextAction = status === "regressed"
    ? "Review introduced findings and regressed or evidence-lost lenses before release approval."
    : status === "attention-required"
      ? "Resolve persistent and introduced findings, or collect evidence for uncertain findings."
      : status === "improved"
        ? "Preserve this comparison with implementation evidence; broader production claims remain separate."
        : "No verified finding change was established; decide whether another iteration is needed.";
  return {
    status,
    resolved: findings.resolved.length,
    persistent: findings.persistent.length,
    introduced: findings.introduced.length,
    uncertain: findings.uncertain.length,
    nextAction,
  };
}

function validateLensTransitions(transitions) {
  if (!Array.isArray(transitions) || transitions.length !== 8) throw new Error("review comparison lensTransitions must contain eight lenses");
  transitions.forEach((transition, index) => {
    const field = `review comparison lensTransitions[${index}]`;
    exactKeys(transition, ["id", "before", "after", "change"], field);
    for (const key of ["id", "before", "after"]) text(transition[key], `${field}.${key}`);
    if (!LENS_CHANGES.has(transition.change)) throw new Error(`${field}.change is unsupported`);
  });
}

function validateFindingChanges(findings) {
  exactKeys(findings, ["resolved", "persistent", "introduced", "uncertain"], "review comparison findings");
  for (const [name, items] of Object.entries(findings)) {
    if (!Array.isArray(items)) throw new Error(`review comparison findings.${name} must be an array`);
  }
}

export function validateReviewComparison(comparison) {
  exactKeys(comparison, [
    "kind", "schemaVersion", "status", "baseline", "candidate", "context",
    "lensTransitions", "findings", "summary", "approval", "boundary",
  ], "review comparison");
  if (comparison.kind !== "design-ai-review-comparison" || comparison.schemaVersion !== 1) {
    throw new Error("review comparison must be design-ai-review-comparison v1");
  }
  if (!COMPARISON_STATUSES.has(comparison.status)) throw new Error("review comparison status is unsupported");
  validateSourceArtifact(comparison.baseline, "review comparison baseline", validateDesignQualityReport);
  validateSourceArtifact(comparison.candidate, "review comparison candidate", validateDesignQualityReport);
  assertComparableReports(comparison.baseline.value, comparison.candidate.value);

  exactKeys(comparison.context, ["subject", "brief", "routeId", "locale", "viewports"], "review comparison context");
  const expectedContext = {
    subject: structuredClone(comparison.baseline.value.subject),
    brief: comparison.baseline.value.context.brief,
    routeId: comparison.baseline.value.context.routeId,
    locale: comparison.baseline.value.context.locale,
    viewports: structuredClone(comparison.baseline.value.context.viewports),
  };
  if (!isDeepStrictEqual(comparison.context, expectedContext)) throw new Error("review comparison context drifted from the baseline report");

  validateLensTransitions(comparison.lensTransitions);
  validateFindingChanges(comparison.findings);
  const transitions = expectedLensTransitions(comparison.baseline.value, comparison.candidate.value);
  const findings = expectedFindingChanges(comparison.baseline.value, comparison.candidate.value);
  const status = expectedComparisonStatus(transitions, findings);
  const summary = expectedComparisonSummary(status, findings);
  if (!isDeepStrictEqual(comparison.lensTransitions, transitions)) throw new Error("review comparison lens transitions drifted");
  if (!isDeepStrictEqual(comparison.findings, findings)) throw new Error("review comparison finding decisions drifted");
  if (comparison.status !== status) throw new Error("review comparison status drifted");

  exactKeys(comparison.summary, ["status", "resolved", "persistent", "introduced", "uncertain", "nextAction"], "review comparison summary");
  for (const key of ["resolved", "persistent", "introduced", "uncertain"]) count(comparison.summary[key], `review comparison summary.${key}`);
  if (!isDeepStrictEqual(comparison.summary, summary)) throw new Error("review comparison summary drifted");

  exactKeys(comparison.approval, ["status", "requiredBefore"], "review comparison approval");
  if (comparison.approval.status !== "pending" || !isDeepStrictEqual(comparison.approval.requiredBefore, ["target repository mutation", "commit", "push", "deployment", "external writes"])) {
    throw new Error("review comparison must preserve the release approval boundary");
  }
  exactKeys(comparison.boundary, [
    "mode", "localWrites", "targetRepoMutation", "externalWrites", "networkCalls",
    "boundedImprovementEstablished", "productionQualityEstablished", "adoptionEstablished",
  ], "review comparison boundary");
  const expectedBoundary = {
    mode: "read-only-review-comparison",
    localWrites: false,
    targetRepoMutation: false,
    externalWrites: false,
    networkCalls: false,
    boundedImprovementEstablished: status === "improved",
    productionQualityEstablished: false,
    adoptionEstablished: false,
  };
  if (!isDeepStrictEqual(comparison.boundary, expectedBoundary)) throw new Error("review comparison boundary drifted");
  return comparison;
}
