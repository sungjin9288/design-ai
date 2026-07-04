// SDK adapter: check(artifact, opts). See docs/AGENT-SDK.md.
//
// Read-only: capture is never enabled from the SDK in Phase A (the CLI's
// `--learn` writes a local learning-profile capture; there is no equivalent
// opt-in here, consistent with "no file writes" for Phase A).

import { checkArtifactContent } from "../lib/check.mjs";
import { assertKnownRouteId } from "../lib/route.mjs";
import { optionalBoolean, optionalString, requireNonEmptyString, requireOptions } from "./validate.mjs";

/**
 * Check a generated design Markdown artifact for grounding, accessibility,
 * responsive, unresolved-marker, and route-specific requirements. Pure,
 * read-only adapter over `checkArtifactContent` from cli/lib/check.mjs.
 *
 * @param {string} artifact - Markdown artifact content to check.
 * @param {{routeId?: string, strict?: boolean}} [opts]
 * @returns {object} CheckReport — the same shape as `design-ai check --json`.
 */
export function check(artifact, opts = {}) {
  requireNonEmptyString(artifact, "artifact");
  const options = requireOptions(opts, "check");

  const routeId = optionalString(options.routeId, "routeId");
  if (routeId) assertKnownRouteId(routeId, { allowEmpty: false });
  // `strict` only affects CLI exit-code behavior; validated for type safety,
  // but the SDK returns the report as-is and lets the caller decide what to
  // do with report.status — there is no process exit code to influence here.
  optionalBoolean(options.strict, "strict", false);

  return checkArtifactContent({
    content: artifact,
    filePath: "sdk",
    routeId,
  });
}
