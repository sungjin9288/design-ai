import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";

import { validateDesignQualityReport } from "./design-quality-contract.mjs";
import { sourceArtifact } from "./implementation-scope-contract.mjs";
import {
  assertComparableReports,
  expectedComparisonStatus,
  expectedComparisonSummary,
  expectedFindingChanges,
  expectedLensTransitions,
  validateReviewComparison,
} from "./review-comparison-contract.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

const MAX_JSON_BYTES = 5 * 1024 * 1024;

function parseReport(source, field) {
  try {
    return validateDesignQualityReport(JSON.parse(source));
  } catch (error) {
    throw new Error(`${field} must be a valid design-ai-quality-report: ${error.message}`);
  }
}

export function compareReviewReports(baselineSource, candidateSource, options = {}) {
  const baselineValue = parseReport(baselineSource, "baseline source");
  const candidateValue = parseReport(candidateSource, "candidate source");
  assertComparableReports(baselineValue, candidateValue);
  const lensTransitions = expectedLensTransitions(baselineValue, candidateValue);
  const findings = expectedFindingChanges(baselineValue, candidateValue);
  const status = expectedComparisonStatus(lensTransitions, findings);
  return validateReviewComparison({
    kind: "design-ai-review-comparison",
    schemaVersion: 1,
    status,
    baseline: sourceArtifact(baselineSource, baselineValue, options.baselineRef || "baseline-quality-report.json"),
    candidate: sourceArtifact(candidateSource, candidateValue, options.candidateRef || "candidate-quality-report.json"),
    context: {
      subject: structuredClone(baselineValue.subject),
      brief: baselineValue.context.brief,
      routeId: baselineValue.context.routeId,
      locale: baselineValue.context.locale,
      viewports: structuredClone(baselineValue.context.viewports),
    },
    lensTransitions,
    findings,
    summary: expectedComparisonSummary(status, findings),
    approval: {
      status: "pending",
      requiredBefore: ["target repository mutation", "commit", "push", "deployment", "external writes"],
    },
    boundary: {
      mode: "read-only-review-comparison",
      localWrites: false,
      targetRepoMutation: false,
      externalWrites: false,
      networkCalls: false,
      boundedImprovementEstablished: status === "improved",
      productionQualityEstablished: false,
      adoptionEstablished: false,
    },
  });
}

function compactSource(artifact) {
  return {
    reference: artifact.reference,
    sha256: artifact.sha256,
    bytes: artifact.bytes,
    kind: artifact.value.kind,
    schemaVersion: artifact.value.schemaVersion,
    reportStatus: artifact.value.summary.status,
  };
}

export function summarizeReviewComparison(comparison) {
  const value = validateReviewComparison(comparison);
  return {
    kind: "design-ai-review-comparison-summary",
    schemaVersion: 1,
    status: value.status,
    sources: {
      baseline: compactSource(value.baseline),
      candidate: compactSource(value.candidate),
    },
    context: structuredClone(value.context),
    lensTransitions: structuredClone(value.lensTransitions),
    findings: structuredClone(value.findings),
    summary: structuredClone(value.summary),
    approval: structuredClone(value.approval),
    boundary: structuredClone(value.boundary),
    representation: {
      mode: "compact",
      fullArtifactKind: value.kind,
      fullArtifactSchemaVersion: value.schemaVersion,
      omittedFields: ["baseline.source", "baseline.value", "candidate.source", "candidate.value"],
    },
  };
}

function readInput(file, cwd, field) {
  const resolved = path.resolve(cwd, file);
  const stat = lstatSync(resolved);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`${field} must be a regular non-symbolic-link file`);
  }
  if (stat.size > MAX_JSON_BYTES) throw new Error(`${field} exceeds the 5 MB limit`);
  const reference = realpathSync(resolved);
  return { source: readFileSync(reference, "utf8"), reference };
}

export function compareReviewReportFiles(parsed, cwd = process.cwd()) {
  if (!parsed.baselinePath) throw new Error("review-compare requires a baseline quality report");
  if (!parsed.candidatePath) throw new Error("review-compare requires --candidate");
  const baseline = readInput(parsed.baselinePath, cwd, "baseline quality report");
  const candidate = readInput(parsed.candidatePath, cwd, "candidate quality report");
  return compareReviewReports(baseline.source, candidate.source, {
    baselineRef: baseline.reference,
    candidateRef: candidate.reference,
  });
}

export function parseReviewComparisonArgs(args) {
  const parsed = { baselinePath: "", candidatePath: "", compact: false, json: false, help: false };
  const values = [...args];
  while (values.length) {
    const token = values.shift();
    if (token === "--help" || token === "-h") parsed.help = true;
    else if (token === "--candidate") parsed.candidatePath = values.shift() || "";
    else if (token === "--compact") parsed.compact = true;
    else if (token === "--json") parsed.json = true;
    else if (token.startsWith("-")) throw new Error(unknownOptionMessage("review-compare", token, ["--help", "--candidate", "--compact", "--json"]));
    else if (!parsed.baselinePath) parsed.baselinePath = token;
    else throw new Error(`Unexpected review-compare argument: ${token}`);
  }
  return parsed;
}

export function renderReviewComparisonMarkdown(comparison) {
  const { summary } = comparison;
  return [
    `# Design iteration: ${comparison.context.subject.name}`,
    "",
    `- Status: ${comparison.status}`,
    `- Resolved: ${summary.resolved}`,
    `- Persistent: ${summary.persistent}`,
    `- Introduced: ${summary.introduced}`,
    `- Uncertain: ${summary.uncertain}`,
    "",
    "## Next action",
    "",
    summary.nextAction,
    "",
    "The comparison is read-only. Production quality and adoption remain outside this contract.",
  ].join("\n");
}
