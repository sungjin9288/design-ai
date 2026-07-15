import { DESIGN_AI_HOME, SYMLINK_PREFIX } from "../lib/paths.mjs";
import { buildReviewWorkflow } from "../lib/review-workflow.mjs";
import {
  optionalString,
  requireNonEmptyString,
  requireOptions,
} from "./validate.mjs";

function optionalStringList(value, label) {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value.map((item, index) => requireNonEmptyString(item, `${label}[${index}]`));
}

/**
 * Compose one canonical read-only plan and static HTML quality review.
 *
 * @param {string} source
 * @param {object} opts
 * @returns {object}
 */
export function reviewHtml(source, opts = {}) {
  requireNonEmptyString(source, "source");
  const options = requireOptions(opts, "reviewHtml");
  return buildReviewWorkflow(source, {
    sourceRef: requireNonEmptyString(options.sourceRef, "sourceRef"),
    brief: requireNonEmptyString(options.brief, "brief"),
    name: optionalString(options.name, "name") || undefined,
    locale: optionalString(options.locale, "locale") || undefined,
    viewports: optionalStringList(options.viewports, "viewports"),
    generatedAt: optionalString(options.generatedAt, "generatedAt") || undefined,
    reviewPack: optionalString(options.reviewPack, "reviewPack") || undefined,
    siteName: optionalString(options.siteName, "siteName") || undefined,
    repoUrl: optionalString(options.repoUrl, "repoUrl") || undefined,
    localPath: optionalString(options.localPath, "localPath") || undefined,
    url: optionalString(options.url, "url") || undefined,
    screenshots: optionalStringList(options.screenshots, "screenshots"),
    sourceRoot: DESIGN_AI_HOME,
    prefix: SYMLINK_PREFIX,
  });
}
