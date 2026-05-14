// `design-ai version` — show CLI + plugin versions.

import { readFileSync } from "node:fs";
import path from "node:path";

import { hasHelpFlag } from "../lib/help-flags.mjs";
import { info, dim } from "../lib/log.mjs";
import { DESIGN_AI_HOME, PLUGIN_MANIFEST, pathExists } from "../lib/paths.mjs";

function printHelp() {
  console.log("Usage:  design-ai version\n");
  console.log("Prints the CLI package version, plugin/corpus version, and source root.");
}

export async function runVersion(args) {
  if (hasHelpFlag(args)) {
    printHelp();
    return;
  }

  // CLI version (from package.json)
  const pkgPath = path.join(DESIGN_AI_HOME, "package.json");
  let cliVersion = "unknown";
  if (pathExists(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      cliVersion = pkg.version || "unknown";
    } catch {
      // ignore
    }
  }

  // Plugin / corpus version (from .claude-plugin/plugin.json)
  let pluginVersion = "unknown";
  if (pathExists(PLUGIN_MANIFEST)) {
    try {
      const manifest = JSON.parse(readFileSync(PLUGIN_MANIFEST, "utf8"));
      pluginVersion = manifest.version || "unknown";
    } catch {
      // ignore
    }
  }

  info(`design-ai CLI:    ${cliVersion}`);
  info(`Plugin / corpus:  ${pluginVersion}`);
  info(dim(`Source:           ${DESIGN_AI_HOME}`));
}
