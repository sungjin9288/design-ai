import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";

import {
  canonicalReviewHandoffStages,
  reviewHandoffArtifact,
  reviewHandoffPendingApprovals,
  validateReviewHandoff,
} from "./review-handoff-contract.mjs";
import { reviewWorkflowDigest } from "./review-workflow-contract.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

const MAX_JSON_BYTES = 5 * 1024 * 1024;
const REVIEW_HANDOFF_OPTIONS = [
  "-h",
  "--help",
  "--recipient",
  "--quality-report",
  "--browser-verification",
  "--json",
];

function optionValue(args, index, option) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value`);
  return value;
}

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function optionalSource(value, field) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty JSON string`);
  }
  return value;
}

function parseJson(source, field) {
  try {
    return JSON.parse(source);
  } catch {
    throw new Error(`${field} must be valid JSON`);
  }
}

export function parseReviewHandoffArgs(args) {
  const parsed = {
    workflowPath: "",
    recipient: "",
    qualityReportPath: "",
    browserVerificationPath: "",
    json: false,
    help: false,
  };

  const options = new Map([
    ["--recipient", "recipient"],
    ["--quality-report", "qualityReportPath"],
    ["--browser-verification", "browserVerificationPath"],
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-h" || arg === "--help") parsed.help = true;
    else if (arg === "--json") parsed.json = true;
    else if (options.has(arg)) {
      parsed[options.get(arg)] = optionValue(args, index, arg);
      index += 1;
    } else if (arg.startsWith("-")) {
      throw new Error(unknownOptionMessage("review-handoff", arg, REVIEW_HANDOFF_OPTIONS));
    } else if (!parsed.workflowPath) parsed.workflowPath = arg;
    else throw new Error(`review-handoff accepts one review workflow; received unexpected argument: ${arg}`);
  }
  return parsed;
}

export function readReviewHandoffInput(filePath, cwd = process.cwd(), field = "review handoff input") {
  if (!filePath) throw new Error(`${field} requires a JSON file`);
  const resolved = path.resolve(cwd, filePath);
  const stat = lstatSync(resolved);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`${field} must be a regular non-symbolic-link file`);
  }
  if (stat.size > MAX_JSON_BYTES) throw new Error(`${field} exceeds the 5 MB limit`);
  const reference = realpathSync(resolved);
  return { source: readFileSync(reference, "utf8"), reference };
}

export function buildReviewHandoff(workflowSource, options = {}) {
  const workflowJson = optionalSource(workflowSource, "workflowSource");
  const recipient = requiredText(options.recipient, "recipient");
  const workflowRef = requiredText(options.workflowRef, "workflowRef");
  const qualityReportSource = optionalSource(options.qualityReportSource, "qualityReportSource");
  const browserVerificationSource = optionalSource(
    options.browserVerificationSource,
    "browserVerificationSource",
  );
  const hasBrowserVerification = Boolean(browserVerificationSource);
  if (Boolean(qualityReportSource) !== hasBrowserVerification) {
    throw new Error("qualityReportSource and browserVerificationSource must be supplied together");
  }

  const workflow = parseJson(workflowJson, "workflowSource");
  const qualityReport = hasBrowserVerification
    ? parseJson(qualityReportSource, "qualityReportSource")
    : null;
  const browserVerification = hasBrowserVerification
    ? parseJson(browserVerificationSource, "browserVerificationSource")
    : null;
  const artifacts = {
    reviewWorkflow: reviewHandoffArtifact(workflowJson, workflow, workflowRef),
    qualityReport: hasBrowserVerification
      ? reviewHandoffArtifact(
        qualityReportSource,
        qualityReport,
        requiredText(options.qualityReportRef, "qualityReportRef"),
      )
      : null,
    browserVerification: hasBrowserVerification
      ? reviewHandoffArtifact(
        browserVerificationSource,
        browserVerification,
        requiredText(options.browserVerificationRef, "browserVerificationRef"),
      )
      : null,
  };

  const handoff = {
    kind: "design-ai-review-handoff",
    schemaVersion: 1,
    status: hasBrowserVerification ? "browser-evidence-prepared" : "static-evidence-prepared",
    recipient: {
      name: recipient,
      delivery: "not-delivered",
      consumerValidation: "pending",
    },
    artifacts,
    linkage: {
      status: "pass",
      reviewWorkflowArtifactSha256: reviewWorkflowDigest(workflow),
      qualityReportArtifactSha256: workflow.linkage?.reportSha256 || "",
      browserVerificationArtifactSha256: browserVerification
        ? reviewWorkflowDigest(browserVerification)
        : null,
      qualityReportArtifactMatch: browserVerification ? true : null,
      browserSourceReportMatch: browserVerification ? true : null,
      viewportCoverage: browserVerification ? "pass" : "not-run",
    },
    stages: canonicalReviewHandoffStages(hasBrowserVerification),
    nextAction: {
      id: "consumer-validation-required",
      status: "pending",
      summary: `Deliver this prepared handoff to ${recipient}, then validate it before implementation.`,
      approvalRequiredBefore: reviewHandoffPendingApprovals(
        workflow,
        browserVerification?.summary.status === "pass",
      ),
    },
    boundary: {
      mode: "read-only",
      localWrites: false,
      targetRepoMutation: false,
      externalWrites: false,
      deliveryPerformed: false,
    },
  };
  return validateReviewHandoff(handoff);
}

export function buildReviewHandoffFromFiles(parsed, cwd = process.cwd()) {
  if (!parsed.workflowPath) throw new Error("review-handoff requires a review workflow JSON file");
  if (!parsed.recipient) throw new Error("review-handoff requires --recipient");
  const workflow = readReviewHandoffInput(parsed.workflowPath, cwd, "review workflow");
  const hasQualityReport = Boolean(parsed.qualityReportPath);
  const hasBrowserVerification = Boolean(parsed.browserVerificationPath);
  if (hasQualityReport !== hasBrowserVerification) {
    throw new Error("--quality-report and --browser-verification must be supplied together");
  }
  const qualityReport = hasQualityReport
    ? readReviewHandoffInput(parsed.qualityReportPath, cwd, "quality report")
    : null;
  const browserVerification = hasBrowserVerification
    ? readReviewHandoffInput(parsed.browserVerificationPath, cwd, "browser verification")
    : null;
  return buildReviewHandoff(workflow.source, {
    workflowRef: workflow.reference,
    recipient: parsed.recipient,
    qualityReportSource: qualityReport?.source,
    qualityReportRef: qualityReport?.reference,
    browserVerificationSource: browserVerification?.source,
    browserVerificationRef: browserVerification?.reference,
  });
}

export function renderReviewHandoffMarkdown(handoff) {
  const lines = [
    `# Review handoff for ${handoff.recipient.name}`,
    "",
    `- Status: ${handoff.status}`,
    `- Delivery: ${handoff.recipient.delivery}`,
    `- Consumer validation: ${handoff.recipient.consumerValidation}`,
    `- Linkage: ${handoff.linkage.status}`,
    `- Boundary: ${handoff.boundary.mode}; no local write, target-repository mutation, external write, or delivery`,
    "",
    "## Evidence",
    "",
    `- Review workflow: ${handoff.artifacts.reviewWorkflow.reference}`,
    handoff.artifacts.qualityReport
      ? `- Quality report: ${handoff.artifacts.qualityReport.reference}`
      : "- Quality report: nested in the review workflow; no browser source file supplied",
    handoff.artifacts.browserVerification
      ? `- Browser verification: ${handoff.artifacts.browserVerification.reference}`
      : "- Browser verification: not run",
    "",
    "## Stages",
    "",
    ...handoff.stages.map((stage) => `- ${stage.id}: ${stage.status}`),
    "",
    "## Next action",
    "",
    `- ${handoff.nextAction.summary}`,
    ...handoff.nextAction.approvalRequiredBefore.map(
      (requirement) => `- Approval required before ${requirement}.`,
    ),
  ];
  return lines.join("\n");
}
