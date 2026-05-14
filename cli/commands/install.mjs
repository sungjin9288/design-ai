// `design-ai install` — symlink skills/commands/agents into Claude Code.

import { readFileSync } from "node:fs";

import { run } from "../lib/exec.mjs";
import { header, info, success } from "../lib/log.mjs";
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

export async function runInstall(args) {
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
