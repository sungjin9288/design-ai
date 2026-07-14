import { inspectHtml as buildQualityReport } from "../lib/design-quality-inspector.mjs";
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
 * Inspect supplied HTML without reading or writing files.
 *
 * @param {string} source
 * @param {object} opts
 * @returns {object}
 */
export function inspectHtml(source, opts = {}) {
  requireNonEmptyString(source, "source");
  const options = requireOptions(opts, "inspectHtml");
  return buildQualityReport(source, {
    sourceRef: requireNonEmptyString(options.sourceRef, "sourceRef"),
    brief: requireNonEmptyString(options.brief, "brief"),
    name: optionalString(options.name, "name") || undefined,
    locale: optionalString(options.locale, "locale") || undefined,
    viewports: optionalStringList(options.viewports, "viewports"),
    generatedAt: optionalString(options.generatedAt, "generatedAt") || undefined,
    reviewPack: optionalString(options.reviewPack, "reviewPack") || undefined,
  });
}
