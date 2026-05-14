// `design-ai uninstall` — remove symlinks.

import { run } from "../lib/exec.mjs";
import { header, info, success } from "../lib/log.mjs";
import { hasHelpFlag } from "../lib/help-flags.mjs";
import {
  DESIGN_AI_HOME,
  CLAUDE_HOME,
  SYMLINK_PREFIX,
  INSTALL_SCRIPT,
  pathExists,
} from "../lib/paths.mjs";

function printHelp() {
  console.log("Usage:  design-ai uninstall\n");
  console.log("Removes design-ai symlinks from Claude Code while keeping the source files.");
  console.log("Uses CLAUDE_HOME and DESIGN_AI_PREFIX to find the installed links.\n");
  console.log("Environment:");
  console.log("  CLAUDE_HOME=/path/to/.claude    Target Claude Code home directory");
  console.log("  DESIGN_AI_PREFIX=mydesign-     Prefix for installed skill and command names");
}

export async function runUninstall(args) {
  if (hasHelpFlag(args)) {
    printHelp();
    return;
  }

  header("design-ai uninstaller");

  if (!pathExists(INSTALL_SCRIPT)) {
    throw new Error(`install.sh not found at ${INSTALL_SCRIPT}`);
  }

  await run("bash", [INSTALL_SCRIPT, "--uninstall"], {
    cwd: DESIGN_AI_HOME,
    env: {
      DESIGN_AI_PREFIX: SYMLINK_PREFIX,
      CLAUDE_HOME,
    },
  });

  console.log();
  success("Done. To remove the design-ai source, delete its directory manually.");
  info(`Source location: ${DESIGN_AI_HOME}`);
}
