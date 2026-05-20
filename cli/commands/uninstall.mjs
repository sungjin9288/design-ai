// `design-ai uninstall` — remove symlinks.

import { run } from "../lib/exec.mjs";
import { header, info, success } from "../lib/log.mjs";
import { hasHelpFlag } from "../lib/help-flags.mjs";
import { unknownOptionMessage } from "../lib/suggest.mjs";
import {
  DESIGN_AI_HOME,
  CLAUDE_HOME,
  SYMLINK_PREFIX,
  INSTALL_SCRIPT,
  pathExists,
} from "../lib/paths.mjs";

const UNINSTALL_OPTIONS = ["-h", "--help", "--json"];
const UNINSTALL_USAGE = "Usage: design-ai uninstall [--json]";
const REMOVED_COUNT_RE = /\bRemoved\s+(\d+)\s+design-ai symlinks\b/;

export function parseUninstallArgs(args) {
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
      throw new Error(`${unknownOptionMessage("uninstall", arg, UNINSTALL_OPTIONS)}\n${UNINSTALL_USAGE}`);
    }
    throw new Error(UNINSTALL_USAGE);
  }

  return flags;
}

export function parseRemovedCount(raw) {
  const match = REMOVED_COUNT_RE.exec(String(raw || ""));
  if (!match) {
    throw new Error("Unable to parse uninstall output: missing removed symlink count");
  }
  return Number(match[1]);
}

export function buildUninstallReport({
  sourceRoot = DESIGN_AI_HOME,
  claudeHome = CLAUDE_HOME,
  prefix = SYMLINK_PREFIX,
  removed = 0,
} = {}) {
  return {
    context: {
      sourceRoot,
      claudeHome,
      prefix,
    },
    result: {
      removed,
    },
  };
}

export function formatUninstallJson(report) {
  return JSON.stringify(report, null, 2);
}

function printHelp() {
  console.log("Usage:  design-ai uninstall [--json]\n");
  console.log("Removes design-ai symlinks from Claude Code while keeping the source files.");
  console.log("Uses CLAUDE_HOME and DESIGN_AI_PREFIX to find the installed links.\n");
  console.log("Options:");
  console.log("  --json                         Emit machine-readable uninstall result\n");
  console.log("Environment:");
  console.log("  CLAUDE_HOME=/path/to/.claude    Target Claude Code home directory");
  console.log("  DESIGN_AI_PREFIX=mydesign-     Prefix for installed skill and command names");
}

export async function runUninstall(args) {
  if (hasHelpFlag(args)) {
    printHelp();
    return;
  }

  const parsed = parseUninstallArgs(args);

  if (!pathExists(INSTALL_SCRIPT)) {
    throw new Error(`install.sh not found at ${INSTALL_SCRIPT}`);
  }

  if (!parsed.json) {
    header("design-ai uninstaller");
  }

  const result = await run("bash", [INSTALL_SCRIPT, "--uninstall"], {
    cwd: DESIGN_AI_HOME,
    silent: parsed.json,
    env: {
      DESIGN_AI_PREFIX: SYMLINK_PREFIX,
      CLAUDE_HOME,
    },
  });

  if (parsed.json) {
    console.log(formatUninstallJson(buildUninstallReport({
      removed: parseRemovedCount(result.stdout),
    })));
    return;
  }

  console.log();
  success("Done. To remove the design-ai source, delete its directory manually.");
  info(`Source location: ${DESIGN_AI_HOME}`);
}
