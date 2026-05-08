// `design-ai version` — show CLI + plugin versions.

import { readFileSync } from "node:fs";
import path from "node:path";

import { info, dim } from "../lib/log.mjs";
import { DESIGN_AI_HOME, PLUGIN_MANIFEST, pathExists } from "../lib/paths.mjs";

export async function runVersion(args) {
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
