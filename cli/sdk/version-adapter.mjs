// SDK adapter: version(). See docs/AGENT-SDK.md.

import { collectVersionReport } from "../commands/version.mjs";

/**
 * Report the CLI package version and the plugin/corpus version. Pure,
 * read-only adapter over `collectVersionReport` from cli/commands/version.mjs.
 *
 * @returns {{cli: string, corpus: string}} version summary.
 */
export function version() {
  const report = collectVersionReport();
  return {
    cli: report.versions.cli,
    corpus: report.versions.plugin,
  };
}
