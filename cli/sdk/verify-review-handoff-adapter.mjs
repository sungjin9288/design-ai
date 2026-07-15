import { verifyReviewHandoff as verifyReviewHandoffContract } from "../lib/review-handoff-receipt.mjs";
import { requireNonEmptyString, requireOptions } from "./validate.mjs";

/**
 * Validate an exact review handoff and return a bounded consumer receipt.
 *
 * @param {string} handoffSource
 * @param {object} opts
 * @returns {object}
 */
export function verifyReviewHandoff(handoffSource, opts) {
  requireNonEmptyString(handoffSource, "handoffSource");
  const options = requireOptions(opts, "verifyReviewHandoff");
  return verifyReviewHandoffContract(handoffSource, {
    handoffRef: requireNonEmptyString(options.handoffRef, "handoffRef"),
    consumer: requireNonEmptyString(options.consumer, "consumer"),
  });
}
