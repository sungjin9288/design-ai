import { buildReviewHandoff } from "../lib/review-handoff.mjs";
import {
  optionalString,
  requireNonEmptyString,
  requireOptions,
} from "./validate.mjs";

/**
 * Prepare a self-validating review handoff without delivering or implementing it.
 *
 * @param {string} workflowSource
 * @param {object} opts
 * @returns {object}
 */
export function reviewHandoff(workflowSource, opts) {
  requireNonEmptyString(workflowSource, "workflowSource");
  const options = requireOptions(opts, "reviewHandoff");
  return buildReviewHandoff(workflowSource, {
    workflowRef: requireNonEmptyString(options.workflowRef, "workflowRef"),
    recipient: requireNonEmptyString(options.recipient, "recipient"),
    qualityReportSource: optionalString(options.qualityReportSource, "qualityReportSource"),
    qualityReportRef: optionalString(options.qualityReportRef, "qualityReportRef"),
    browserVerificationSource: optionalString(
      options.browserVerificationSource,
      "browserVerificationSource",
    ),
    browserVerificationRef: optionalString(
      options.browserVerificationRef,
      "browserVerificationRef",
    ),
  });
}
