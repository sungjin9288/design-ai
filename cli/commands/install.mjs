// `design-ai install` — symlink skills/commands/agents into Claude Code.

import { readFileSync } from "node:fs";

import { run } from "../lib/exec.mjs";
import { header, info, success } from "../lib/log.mjs";
import { hasHelpFlag } from "../lib/help-flags.mjs";
import {
  DESIGN_AI_HOME,
  CLAUDE_HOME,
  SYMLINK_PREFIX,
  INSTALL_SCRIPT,
  PLUGIN_MANIFEST,
  checkSourceLayout,
  pathExists,
} from "../lib/paths.mjs";

function installerSubtitle() {
  if (!pathExists(PLUGIN_MANIFEST)) return "Claude Code symlink installer";
  try {
    const manifest = JSON.parse(readFileSync(PLUGIN_MANIFEST, "utf8"));
    return manifest.version ? `v${manifest.version}` : "Claude Code symlink installer";
  } catch {
    return "Claude Code symlink installer";
  }
}

function printHelp() {
  console.log("Usage:  design-ai install\n");
  console.log("Symlinks design-ai skills, slash commands, and agents into Claude Code.");
  console.log("Uses CLAUDE_HOME and DESIGN_AI_PREFIX when provided.\n");
  console.log("Environment:");
  console.log("  CLAUDE_HOME=/path/to/.claude    Target Claude Code home directory");
  console.log("  DESIGN_AI_PREFIX=mydesign-     Prefix for installed skill and command names");
}

export async function runInstall(args) {
  if (hasHelpFlag(args)) {
    printHelp();
    return;
  }

  header("design-ai installer", installerSubtitle());

  checkSourceLayout();

  info(`Source: ${DESIGN_AI_HOME}`);
  info(`Target: ${CLAUDE_HOME}`);
  info(`Prefix: ${SYMLINK_PREFIX}`);
  console.log();

  if (!pathExists(INSTALL_SCRIPT)) {
    throw new Error(`install.sh not found at ${INSTALL_SCRIPT}`);
  }

  // Delegate to install.sh — single source of truth for symlink logic.
  await run("bash", [INSTALL_SCRIPT, "install"], {
    cwd: DESIGN_AI_HOME,
    env: {
      DESIGN_AI_PREFIX: SYMLINK_PREFIX,
      CLAUDE_HOME,
    },
  });

  console.log();
  success("Installed. Restart Claude Code (or open a new session) to pick up changes.");
  info(`Try: /${SYMLINK_PREFIX}component-spec, /${SYMLINK_PREFIX}motion-design, /${SYMLINK_PREFIX}spatial`);
  info(`Or: design-ai status`);
}
