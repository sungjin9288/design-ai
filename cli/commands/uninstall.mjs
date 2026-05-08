// `design-ai uninstall` — remove symlinks.

import { run } from "../lib/exec.mjs";
import { header, info, success } from "../lib/log.mjs";
import {
  DESIGN_AI_HOME,
  CLAUDE_HOME,
  SYMLINK_PREFIX,
  INSTALL_SCRIPT,
  pathExists,
} from "../lib/paths.mjs";

export async function runUninstall(args) {
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
