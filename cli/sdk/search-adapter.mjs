// SDK adapter: search(query, opts). See docs/AGENT-SDK.md.

import { DESIGN_AI_HOME } from "../lib/paths.mjs";
import { rankedSearchCorpus } from "../lib/search-ranked.mjs";
import { DEFAULT_SEARCH_DIRS, searchCorpus } from "../lib/search.mjs";
import {
  optionalBoolean,
  optionalInteger,
  optionalString,
  requireNonEmptyString,
  requireOptions,
} from "./validate.mjs";

function resolveDirs(dirName) {
  if (!dirName) return DEFAULT_SEARCH_DIRS;
  if (!DEFAULT_SEARCH_DIRS.includes(dirName)) {
    throw new Error(`dir must be one of: ${DEFAULT_SEARCH_DIRS.join(", ")}`);
  }
  return [dirName];
}

/**
 * Search the local design-ai markdown corpus. Pure, read-only adapter over
 * `searchCorpus` / `rankedSearchCorpus` from cli/lib/search.mjs and
 * cli/lib/search-ranked.mjs.
 *
 * @param {string} query - Search query text.
 * @param {{dir?: string, limit?: number, ranked?: boolean}} [opts]
 * @returns {Array<object>} SearchHit[] — line hits by default, ranked (score + matchedTokens) hits when `ranked: true`.
 */
export function search(query, opts = {}) {
  requireNonEmptyString(query, "query");
  const options = requireOptions(opts, "search");

  const dirName = optionalString(options.dir, "dir");
  const dirs = resolveDirs(dirName);
  const limit = optionalInteger(options.limit, "limit", { fallback: 20, min: 1, max: 500 });
  const ranked = optionalBoolean(options.ranked, "ranked", false);

  if (ranked) {
    return rankedSearchCorpus({
      query,
      designAiPath: DESIGN_AI_HOME,
      dirs,
      limit,
    }).hits;
  }

  return searchCorpus({
    query,
    designAiPath: DESIGN_AI_HOME,
    dirs,
    limit,
  });
}
