import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";

import { validateImplementationEvidence } from "./implementation-evidence-contract.mjs";
import { sourceArtifact } from "./implementation-scope-contract.mjs";
import {
  expectedPilotClaims,
  expectedPilotIssues,
  expectedPilotMetrics,
  expectedPilotNextAction,
  expectedPilotStatus,
  validatePilotEvidence,
} from "./pilot-evidence-contract.mjs";
import { validatePilotRecord } from "./pilot-record-contract.mjs";
import { validateReviewWorkflow } from "./review-workflow-contract.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

function parseJson(source, field, validate) {
  let value;
  try {
    value = JSON.parse(source);
  } catch {
    throw new Error(`${field} must be valid JSON`);
  }
  return validate(value);
}

export function buildPilotEvidence(implementationEvidenceSource, reviewWorkflowSource, recordSource, options = {}) {
  const implementationEvidence = parseJson(
    implementationEvidenceSource,
    "implementation evidence source",
    validateImplementationEvidence,
  );
  const workflow = parseJson(reviewWorkflowSource, "review workflow source", validateReviewWorkflow);
  const record = parseJson(recordSource, "pilot record source", validatePilotRecord);
  const reviewWorkflow = sourceArtifact(
    reviewWorkflowSource,
    workflow,
    options.reviewWorkflowRef || "review-workflow.json",
  );
  const issues = expectedPilotIssues(record, implementationEvidence, reviewWorkflow);
  const status = expectedPilotStatus(issues);
  return validatePilotEvidence({
    kind: "design-ai-pilot-evidence",
    schemaVersion: 1,
    status,
    implementationEvidence: sourceArtifact(
      implementationEvidenceSource,
      implementationEvidence,
      options.implementationEvidenceRef || "implementation-evidence.json",
    ),
    reviewWorkflow,
    record: sourceArtifact(recordSource, record, options.recordRef || "pilot-record.json"),
    project: structuredClone(record.project),
    consent: structuredClone(record.consent),
    metrics: expectedPilotMetrics(record, implementationEvidence),
    claims: expectedPilotClaims(record),
    issues,
    nextAction: expectedPilotNextAction(status),
    boundary: {
      mode: "read-only-pilot-evidence",
      localWrites: false,
      targetRepoMutation: false,
      externalWrites: false,
      networkCalls: false,
      identityVerified: false,
      feedbackVerified: false,
      adoptionEstablished: false,
      productionQualityEstablished: false,
    },
  });
}

function readInput(file, cwd) {
  const absolute = realpathSync(path.resolve(cwd, file));
  return { source: readFileSync(absolute, "utf8"), reference: absolute };
}

export function buildPilotEvidenceFromFiles(parsed, cwd = process.cwd()) {
  if (!parsed.implementationEvidencePath) throw new Error("review-pilot requires an implementation evidence JSON file");
  if (!parsed.reviewWorkflowPath) throw new Error("review-pilot requires --workflow");
  if (!parsed.recordPath) throw new Error("review-pilot requires --record");
  const implementationEvidence = readInput(parsed.implementationEvidencePath, cwd);
  const reviewWorkflow = readInput(parsed.reviewWorkflowPath, cwd);
  const record = readInput(parsed.recordPath, cwd);
  return buildPilotEvidence(implementationEvidence.source, reviewWorkflow.source, record.source, {
    implementationEvidenceRef: implementationEvidence.reference,
    reviewWorkflowRef: reviewWorkflow.reference,
    recordRef: record.reference,
  });
}

export function parsePilotEvidenceArgs(args) {
  const parsed = { implementationEvidencePath: "", reviewWorkflowPath: "", recordPath: "", json: false, help: false };
  const values = [...args];
  while (values.length > 0) {
    const token = values.shift();
    if (token === "--help" || token === "-h") parsed.help = true;
    else if (token === "--json") parsed.json = true;
    else if (token === "--workflow") parsed.reviewWorkflowPath = values.shift() || "";
    else if (token === "--record") parsed.recordPath = values.shift() || "";
    else if (token.startsWith("-")) throw new Error(unknownOptionMessage("review-pilot", token, ["--help", "--json", "--workflow", "--record"]));
    else if (!parsed.implementationEvidencePath) parsed.implementationEvidencePath = token;
    else throw new Error(`Unexpected review-pilot argument: ${token}`);
  }
  return parsed;
}

export function renderPilotEvidenceMarkdown(evidence) {
  const metric = evidence.metrics;
  return [
    `# Pilot evidence for ${evidence.project.name}`,
    "",
    `- Status: ${evidence.status}`,
    `- Pilot class: ${evidence.project.pilotClass}`,
    `- Time to first useful artifact: ${metric.timeToFirstUsefulArtifact.milliseconds} ms`,
    `- Finding decisions: ${metric.findingPrecision.accepted} accepted, ${metric.findingPrecision.rejected} rejected, ${metric.findingPrecision.unresolved} unresolved`,
    `- Approval gates: ${metric.approvalFriction.approved} approved, ${metric.approvalFriction.notRequired} not required, ${metric.approvalFriction.pending} pending`,
    `- Implementation: ${metric.implementation.status}`,
    `- Unresolved risks: ${metric.unresolvedRisk.count}`,
    "",
    "This evidence records one bounded pilot. It does not independently establish customer adoption, respondent identity, production quality, or business outcomes.",
  ].join("\n");
}
