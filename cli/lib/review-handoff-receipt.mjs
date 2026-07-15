import {
  reviewHandoffArtifact,
  validateReviewHandoff,
} from "./review-handoff-contract.mjs";
import { validateReviewHandoffReceipt } from "./review-handoff-receipt-contract.mjs";
import { readReviewHandoffInput } from "./review-handoff.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

const OPTIONS = ["-h", "--help", "--consumer", "--json"];

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function requiredSource(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
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

export function parseReviewHandoffReceiptArgs(args) {
  const parsed = { handoffPath: "", consumer: "", json: false, help: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-h" || arg === "--help") parsed.help = true;
    else if (arg === "--json") parsed.json = true;
    else if (arg === "--consumer") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--consumer requires a value");
      parsed.consumer = value;
      index += 1;
    } else if (arg.startsWith("-")) {
      throw new Error(unknownOptionMessage("review-handoff-verify", arg, OPTIONS));
    } else if (!parsed.handoffPath) parsed.handoffPath = arg;
    else {
      throw new Error(
        `review-handoff-verify accepts one review handoff; received unexpected argument: ${arg}`,
      );
    }
  }
  return parsed;
}

export function verifyReviewHandoff(handoffSource, options = {}) {
  const source = requiredSource(handoffSource, "handoffSource");
  const reference = requiredText(options.handoffRef, "handoffRef");
  const consumer = requiredText(options.consumer, "consumer");
  const handoff = validateReviewHandoff(parseJson(source, "handoffSource"));
  if (consumer !== handoff.recipient.name) {
    throw new Error(
      `consumer must match the handoff recipient: expected ${handoff.recipient.name}, received ${consumer}`,
    );
  }

  const reportSummary = handoff.artifacts.reviewWorkflow.value.report.summary;
  const receipt = {
    kind: "design-ai-review-handoff-receipt",
    schemaVersion: 1,
    status: "contract-validated",
    consumer: {
      name: consumer,
      expectedRecipient: handoff.recipient.name,
      recipientMatch: true,
      identity: "self-declared",
      contractValidation: "pass",
      acceptance: "not-claimed",
    },
    handoff: reviewHandoffArtifact(source, handoff, reference),
    evidence: {
      qualityStatus: reportSummary.status,
      confirmedFindings: reportSummary.confirmedFindings,
      unverifiedFindings: reportSummary.unverifiedFindings,
      browserStatus: handoff.artifacts.browserVerification?.value.summary.status || "not-run",
    },
    remainingApprovals: [...handoff.nextAction.approvalRequiredBefore],
    nextAction: {
      id: "target-repo-intake-required",
      status: "pending",
      summary: "Inspect the declared target repository before any implementation begins.",
      implementationAuthorized: false,
    },
    boundary: {
      mode: "read-only",
      localWrites: false,
      targetRepoMutation: false,
      externalWrites: false,
      transportVerified: false,
      consumerIdentityVerified: false,
      acceptanceRecorded: false,
      implementationStarted: false,
    },
  };
  return validateReviewHandoffReceipt(receipt);
}

export function verifyReviewHandoffFromFile(parsed, cwd = process.cwd()) {
  if (!parsed.handoffPath) {
    throw new Error("review-handoff-verify requires a review handoff JSON file");
  }
  if (!parsed.consumer) throw new Error("review-handoff-verify requires --consumer");
  const handoff = readReviewHandoffInput(parsed.handoffPath, cwd, "review handoff");
  return verifyReviewHandoff(handoff.source, {
    handoffRef: handoff.reference,
    consumer: parsed.consumer,
  });
}

export function renderReviewHandoffReceiptMarkdown(receipt) {
  const approvals = receipt.remainingApprovals.length
    ? receipt.remainingApprovals.map((item) => `- ${item}`).join("\n")
    : "- None";
  return [
    `# Review handoff receipt for ${receipt.consumer.name}`,
    "",
    `- Status: ${receipt.status}`,
    `- Recipient match: ${receipt.consumer.recipientMatch}`,
    `- Identity: ${receipt.consumer.identity}`,
    `- Acceptance: ${receipt.consumer.acceptance}`,
    `- Handoff SHA-256: ${receipt.handoff.sha256}`,
    `- Quality: ${receipt.evidence.qualityStatus}`,
    `- Browser: ${receipt.evidence.browserStatus}`,
    "",
    "## Remaining approvals",
    "",
    approvals,
    "",
    "## Next action",
    "",
    `- ${receipt.nextAction.summary}`,
    "- Implementation is not authorized by this receipt.",
  ].join("\n");
}
