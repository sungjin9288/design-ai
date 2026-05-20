// `design-ai version` — show CLI + plugin versions.

import { readFileSync } from "node:fs";
import path from "node:path";

import { hasHelpFlag } from "../lib/help-flags.mjs";
import { info, dim } from "../lib/log.mjs";
import { DESIGN_AI_HOME, pathExists } from "../lib/paths.mjs";
import { unknownOptionMessage } from "../lib/suggest.mjs";

const VERSION_OPTIONS = ["-h", "--help", "--json"];
const VERSION_USAGE = "Usage: design-ai version [--json]";

export function parseVersionArgs(args) {
  const flags = {
    help: false,
    json: false,
  };

  for (const arg of args) {
    if (arg === "-h" || arg === "--help") {
      flags.help = true;
      continue;
    }
    if (arg === "--json") {
      flags.json = true;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`${unknownOptionMessage("version", arg, VERSION_OPTIONS)}\n${VERSION_USAGE}`);
    }
    throw new Error(VERSION_USAGE);
  }

  return flags;
}

function readVersion(filePath) {
  if (!pathExists(filePath)) return "unknown";
  try {
    const data = JSON.parse(readFileSync(filePath, "utf8"));
    return typeof data.version === "string" && data.version ? data.version : "unknown";
  } catch {
    return "unknown";
  }
}

export function collectVersionReport({
  sourceRoot = DESIGN_AI_HOME,
  packagePath = path.join(sourceRoot, "package.json"),
  pluginManifest = path.join(sourceRoot, ".claude-plugin", "plugin.json"),
} = {}) {
  const cliVersion = readVersion(packagePath);
  const pluginVersion = readVersion(pluginManifest);
  return {
    context: {
      sourceRoot,
    },
    versions: {
      cli: cliVersion,
      plugin: pluginVersion,
      aligned: cliVersion !== "unknown" && cliVersion === pluginVersion,
    },
  };
}

export function formatVersionJson(report) {
  return JSON.stringify(report, null, 2);
}

function printHelp() {
  console.log("Usage:  design-ai version [--json]\n");
  console.log("Prints the CLI package version, plugin/corpus version, and source root.");
  console.log("\nOptions:");
  console.log("  --json   Emit machine-readable version metadata");
}

export async function runVersion(args) {
  if (hasHelpFlag(args)) {
    printHelp();
    return;
  }

  const parsed = parseVersionArgs(args);
  const report = collectVersionReport();
  if (parsed.json) {
    console.log(formatVersionJson(report));
    return;
  }

  info(`design-ai CLI:    ${report.versions.cli}`);
  info(`Plugin / corpus:  ${report.versions.plugin}`);
  info(dim(`Source:           ${report.context.sourceRoot}`));
}
