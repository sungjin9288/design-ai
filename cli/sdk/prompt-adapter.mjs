// SDK adapter: prompt(brief, opts). See docs/AGENT-SDK.md.
//
// Phase A is read-only: unlike the CLI's `--with-learning` (which records a
// local usage sidecar entry via recordLearningUsage), the SDK adapter never
// writes the learning-usage sidecar, even when withLearning is requested. It
// only reads the local learning profile to build the learning context.

import { DESIGN_AI_HOME, SYMLINK_PREFIX } from "../lib/paths.mjs";
import { buildPromptPlan } from "../lib/prompt.mjs";
import {
  optionalBoolean,
  optionalInteger,
  optionalString,
  requireNonEmptyString,
  requireOptions,
} from "./validate.mjs";

/**
 * Build a ready-to-use agent prompt plan from a task brief. Pure, read-only
 * adapter over `buildPromptPlan` from cli/lib/prompt.mjs. Never records
 * learning-usage, even with withLearning: true (Phase A is read-only).
 *
 * @param {string} brief - Task brief text.
 * @param {{routeId?: string, withLearning?: boolean, learningCategory?: string, learningLimit?: number, withRecall?: boolean, recallLimit?: number}} [opts]
 * @returns {object|null} PromptPlan — the same shape as `design-ai prompt --json` (minus learningUsage).
 */
export function prompt(brief, opts = {}) {
  requireNonEmptyString(brief, "brief");
  const options = requireOptions(opts, "prompt");

  const routeId = optionalString(options.routeId, "routeId");
  const withLearning = optionalBoolean(options.withLearning, "withLearning", false);
  const learningCategory = optionalString(options.learningCategory, "learningCategory");
  const learningLimit = optionalInteger(options.learningLimit, "learningLimit", { fallback: 0, min: 1, max: 100, zeroMeansUnset: true });
  const withRecall = optionalBoolean(options.withRecall, "withRecall", false);
  const recallLimit = optionalInteger(options.recallLimit, "recallLimit", { fallback: 0, min: 1, max: 20, zeroMeansUnset: true });

  return buildPromptPlan({
    brief,
    sourceRoot: DESIGN_AI_HOME,
    prefix: SYMLINK_PREFIX,
    routeId,
    withLearning,
    learningCategory,
    learningLimit,
    withRecall,
    recallLimit,
  });
}
