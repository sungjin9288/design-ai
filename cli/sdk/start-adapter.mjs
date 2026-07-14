import { DESIGN_AI_HOME, SYMLINK_PREFIX } from "../lib/paths.mjs";
import { buildStartPayload } from "../lib/start-operation.mjs";
import {
  optionalString,
  requireNonEmptyString,
  requireOptions,
} from "./validate.mjs";

function optionalStringList(value, label) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value.map((item, index) => requireNonEmptyString(item, `${label}[${index}]`));
}

/**
 * Build the canonical read-only design entry plan.
 * Declared repositories, URLs, and screenshots are not inspected.
 *
 * @param {string} brief
 * @param {object} opts
 * @returns {object}
 */
export function start(brief, opts = {}) {
  requireNonEmptyString(brief, "brief");
  const options = requireOptions(opts, "start");

  return buildStartPayload({
    brief,
    sourceRoot: DESIGN_AI_HOME,
    prefix: SYMLINK_PREFIX,
    routeId: optionalString(options.routeId, "routeId"),
    context: {
      siteName: optionalString(options.siteName, "siteName"),
      repoUrl: optionalString(options.repoUrl, "repoUrl"),
      localPath: optionalString(options.localPath, "localPath"),
      url: optionalString(options.url, "url"),
      screenshots: optionalStringList(options.screenshots, "screenshots"),
      locale: optionalString(options.locale, "locale"),
      viewports: optionalStringList(options.viewports, "viewports"),
    },
  });
}
