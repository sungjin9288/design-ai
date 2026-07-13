// SDK adapter for the shared, read-only design artifact operation.

import { artifactModeDefinition, buildArtifact } from "../lib/artifact.mjs";
import { DESIGN_AI_HOME, SYMLINK_PREFIX } from "../lib/paths.mjs";
import {
  optionalString,
  requireNonEmptyString,
  requireOptions,
} from "./validate.mjs";

/**
 * Build a portable implementation, critique, or DESIGN.md artifact plan.
 * This function is read-only and never writes the output file itself.
 *
 * @param {string} brief
 * @param {{mode: "implementation-plan"|"critique-loop"|"design-contract", routeId?: string}} opts
 * @returns {object}
 */
export function artifact(brief, opts) {
  requireNonEmptyString(brief, "brief");
  const options = requireOptions(opts, "artifact");
  const mode = requireNonEmptyString(options.mode, "mode");
  const routeId = optionalString(options.routeId, "routeId");
  artifactModeDefinition(mode);

  return buildArtifact({
    mode,
    brief,
    sourceRoot: DESIGN_AI_HOME,
    prefix: SYMLINK_PREFIX,
    routeId,
  });
}
