// SDK adapter: route(brief, opts) and routes(). See docs/AGENT-SDK.md.

import { DESIGN_AI_HOME } from "../lib/paths.mjs";
import { readRouteManifestVersion, routeBrief, routeCatalog } from "../lib/route.mjs";
import {
  optionalBoolean,
  optionalInteger,
  requireNonEmptyString,
  requireOptions,
} from "./validate.mjs";

/**
 * Recommend the best design-ai route(s), commands, skills, and knowledge files
 * for a task brief. Pure, read-only adapter over `routeBrief` from cli/lib/route.mjs.
 *
 * @param {string} brief - Task brief text.
 * @param {{limit?: number, explain?: boolean}} [opts]
 * @returns {Array<object>} RouteResult[] — the same shape as `design-ai route --json`'s `routes` array.
 */
export function route(brief, opts = {}) {
  requireNonEmptyString(brief, "brief");
  const options = requireOptions(opts, "route");
  const limit = optionalInteger(options.limit, "limit", { fallback: 3, min: 1, max: 10 });
  const explain = optionalBoolean(options.explain, "explain", false);

  return routeBrief({
    brief,
    sourceRoot: DESIGN_AI_HOME,
    limit,
    explain,
  });
}

/**
 * List the full route catalog (all route ids with their static metadata),
 * independent of any brief. Pure, read-only adapter over `routeCatalog`.
 *
 * @returns {{version: string, routes: Array<object>}} RouteCatalog
 */
export function routes() {
  return {
    version: readRouteManifestVersion(DESIGN_AI_HOME),
    routes: routeCatalog({ sourceRoot: DESIGN_AI_HOME }),
  };
}
