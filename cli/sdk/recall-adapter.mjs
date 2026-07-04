// SDK adapter: recall(query, opts). See docs/AGENT-SDK.md.
//
// Combined recall view: brief-relevant shipped corpus knowledge (`corpus`) plus
// brief-relevant local learning-profile entries (`learning`), both ranked by the
// same shipped deterministic lexical scorer used by `search --ranked`. Read-only:
// reads the local corpus and `DESIGN_AI_LEARNING_FILE` learning profile, exactly
// as `design-ai learn --recall` does, and never writes either.

import { DESIGN_AI_HOME } from "../lib/paths.mjs";
import { buildLearnRecall, DEFAULT_RECALL_LIMIT } from "../lib/recall.mjs";
import { optionalInteger, optionalString, requireNonEmptyString, requireOptions } from "./validate.mjs";

/**
 * Recall brief-relevant corpus knowledge and local learning-profile entries for
 * a query. Pure, read-only adapter over `buildLearnRecall` from cli/lib/recall.mjs.
 *
 * @param {string} query - Recall query text.
 * @param {{limit?: number, category?: string}} [opts]
 * @returns {{corpus: object, learning: object}} combined recall view.
 */
export function recall(query, opts = {}) {
  requireNonEmptyString(query, "query");
  const options = requireOptions(opts, "recall");

  const limit = optionalInteger(options.limit, "limit", { fallback: DEFAULT_RECALL_LIMIT, min: 1, max: 20 });
  const category = optionalString(options.category, "category");

  const result = buildLearnRecall({
    query,
    limit,
    category,
    designAiPath: DESIGN_AI_HOME,
  });

  return {
    corpus: result.corpus,
    learning: result.learning,
  };
}
