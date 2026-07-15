import { buildPilotEvidence } from "../lib/pilot-evidence.mjs";
import { requireNonEmptyString, requireOptions } from "./validate.mjs";

export function recordPilotEvidence(implementationEvidenceSource, reviewWorkflowSource, recordSource, opts) {
  requireNonEmptyString(implementationEvidenceSource, "implementationEvidenceSource");
  requireNonEmptyString(reviewWorkflowSource, "reviewWorkflowSource");
  requireNonEmptyString(recordSource, "recordSource");
  const options = requireOptions(opts, "recordPilotEvidence");
  return buildPilotEvidence(implementationEvidenceSource, reviewWorkflowSource, recordSource, {
    implementationEvidenceRef: requireNonEmptyString(options.implementationEvidenceRef, "implementationEvidenceRef"),
    reviewWorkflowRef: requireNonEmptyString(options.reviewWorkflowRef, "reviewWorkflowRef"),
    recordRef: requireNonEmptyString(options.recordRef, "recordRef"),
  });
}
