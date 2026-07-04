// SDK namespace: learn.*. See docs/AGENT-SDK.md (Phase B) and docs/SDK.md.
//
// The ONLY writing verbs in the SDK. Phase A (route, prompt, pack, search,
// recall, check, routes, version) stays read-only and unchanged — this
// namespace is the explicit, opt-in write boundary: every verb here writes
// only the local learning profile (`DESIGN_AI_LEARNING_FILE` /
// `defaultLearningFile()`), never the network. Consumers target a specific
// profile file via the `DESIGN_AI_LEARNING_FILE` env var, exactly like the
// CLI — there is no `filePath` option and no `now`/timestamp option; the
// underlying cli/lib functions use their own defaults (the env var and
// `new Date()`).

import { checkArtifactContent, buildCheckLearningCapture } from "../lib/check.mjs";
import { rememberLearning, recordLearningFeedback } from "../lib/learn-profile.mjs";
import { assertKnownRouteId } from "../lib/route.mjs";
import { optionalString, requireNonEmptyString, requireOptions } from "./validate.mjs";

/**
 * Record a local learning-profile preference. Writes only the local learning
 * profile (`DESIGN_AI_LEARNING_FILE` / `defaultLearningFile()`); never the
 * network. Pure adapter over `rememberLearning` from cli/lib/learn-profile.mjs.
 *
 * @param {string} text - Preference text to remember.
 * @param {{category?: string}} [opts]
 * @returns {{file: string, entry: object, profile: object}} RememberResult.
 */
function remember(text, opts = {}) {
  requireNonEmptyString(text, "text");
  const options = requireOptions(opts, "learn.remember");
  const category = optionalString(options.category, "category", "preference");

  return rememberLearning({
    text,
    category,
    source: "sdk",
  });
}

/**
 * Record feedback (keep/avoid/improve) as a local learning-profile entry.
 * Writes only the local learning profile; never the network. Pure adapter
 * over `recordLearningFeedback` from cli/lib/learn-profile.mjs.
 *
 * @param {string} text - Feedback text.
 * @param {{outcome?: string, category?: string}} [opts]
 * @returns {{file: string, entry: object, profile: object}} RememberResult.
 */
function feedback(text, opts = {}) {
  requireNonEmptyString(text, "text");
  const options = requireOptions(opts, "learn.feedback");
  // The lib normalizes the outcome itself (normalizeFeedbackOutcome); the SDK
  // only validates that, if given, it is a string.
  const outcome = optionalString(options.outcome, "outcome", "improve");
  const category = optionalString(options.category, "category", "workflow");

  return recordLearningFeedback({
    text,
    outcome,
    category,
  });
}

/**
 * Check a Markdown artifact, then capture its non-pass results as local
 * learning-profile entries. Writes only the local learning profile; never the
 * network. Pure adapter over `checkArtifactContent` + `buildCheckLearningCapture`
 * from cli/lib/check.mjs (the same path as the CLI's `check --learn --yes`).
 *
 * @param {string} artifact - Markdown artifact content to check and capture.
 * @param {{routeId?: string}} [opts]
 * @returns {object} CaptureResult — the `captureLearningEntries` return shape:
 *   { file, dryRun, applied, source, candidateCount, addedCount, skippedCount,
 *     count, entries, skipped }.
 */
function captureFromCheck(artifact, opts = {}) {
  requireNonEmptyString(artifact, "artifact");
  const options = requireOptions(opts, "learn.captureFromCheck");

  const routeId = optionalString(options.routeId, "routeId");
  if (routeId) assertKnownRouteId(routeId, { allowEmpty: false });

  const report = checkArtifactContent({
    content: artifact,
    filePath: "sdk",
    routeId,
  });

  return buildCheckLearningCapture(report, { dryRun: false });
}

/**
 * The Phase B local-write namespace. `learn.remember`, `learn.feedback`, and
 * `learn.captureFromCheck` are the only SDK verbs that write files; all three
 * write exclusively to the local learning profile. See docs/SDK.md.
 */
export const learn = Object.freeze({
  remember,
  feedback,
  captureFromCheck,
});
