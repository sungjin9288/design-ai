import {
  compareReviewReports,
  summarizeReviewComparison,
} from "../lib/review-comparison.mjs";
import {
  optionalBoolean,
  requireNonEmptyString,
  requireOptions,
} from "./validate.mjs";

/**
 * Compare two exact canonical quality reports without reading or writing files.
 *
 * @param {string} baselineSource
 * @param {string} candidateSource
 * @param {object} opts
 * @returns {object}
 */
export function compareReviews(baselineSource, candidateSource, opts) {
  requireNonEmptyString(baselineSource, "baselineSource");
  requireNonEmptyString(candidateSource, "candidateSource");
  const options = requireOptions(opts, "compareReviews");
  const comparison = compareReviewReports(baselineSource, candidateSource, {
    baselineRef: requireNonEmptyString(options.baselineRef, "baselineRef"),
    candidateRef: requireNonEmptyString(options.candidateRef, "candidateRef"),
  });
  return optionalBoolean(options.compact, "compact")
    ? summarizeReviewComparison(comparison)
    : comparison;
}
