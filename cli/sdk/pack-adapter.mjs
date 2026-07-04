// SDK adapter: pack(brief, opts). See docs/AGENT-SDK.md.
//
// Phase A is read-only: like the prompt adapter, this never records the
// learning-usage sidecar, even when withLearning is requested.

import { DESIGN_AI_HOME, SYMLINK_PREFIX } from "../lib/paths.mjs";
import { buildPromptPack } from "../lib/pack.mjs";
import {
  optionalBoolean,
  optionalInteger,
  optionalString,
  requireNonEmptyString,
  requireOptions,
} from "./validate.mjs";

const DEFAULT_MAX_BYTES = 120_000;

/**
 * Build a ready-to-use prompt plus bounded context-file bundle from a task
 * brief. Pure, read-only adapter over `buildPromptPack` from cli/lib/pack.mjs.
 * Never records learning-usage, even with withLearning: true.
 *
 * @param {string} brief - Task brief text.
 * @param {{routeId?: string, maxBytes?: number, withLearning?: boolean, learningCategory?: string, learningLimit?: number, withRecall?: boolean, recallLimit?: number}} [opts]
 * @returns {object} Pack — the same shape as `design-ai pack --json` (minus learningUsage).
 */
export function pack(brief, opts = {}) {
  requireNonEmptyString(brief, "brief");
  const options = requireOptions(opts, "pack");

  const routeId = optionalString(options.routeId, "routeId");
  const maxBytes = optionalInteger(options.maxBytes, "maxBytes", {
    fallback: DEFAULT_MAX_BYTES,
    min: 1000,
    max: 1_000_000,
  });
  const withLearning = optionalBoolean(options.withLearning, "withLearning", false);
  const learningCategory = optionalString(options.learningCategory, "learningCategory");
  const learningLimit = optionalInteger(options.learningLimit, "learningLimit", { fallback: 0, min: 1, max: 100, zeroMeansUnset: true });
  const withRecall = optionalBoolean(options.withRecall, "withRecall", false);
  const recallLimit = optionalInteger(options.recallLimit, "recallLimit", { fallback: 0, min: 1, max: 20, zeroMeansUnset: true });

  return buildPromptPack({
    brief,
    sourceRoot: DESIGN_AI_HOME,
    prefix: SYMLINK_PREFIX,
    maxBytes,
    routeId,
    withLearning,
    learningCategory,
    learningLimit,
    withRecall,
    recallLimit,
  });
}
