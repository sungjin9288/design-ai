// `design-ai update` — re-fetch upstream + reinstall.

import { run, runSync } from "../lib/exec.mjs";
import { header, info, success, warn } from "../lib/log.mjs";
import {
  DESIGN_AI_HOME,
  CLAUDE_HOME,
  SYMLINK_PREFIX,
  INSTALL_SCRIPT,
  pathExists,
} from "../lib/paths.mjs";
import path from "node:path";

export async function runUpdate(args) {
  header("design-ai update");
  info(`Source: ${DESIGN_AI_HOME}`);

  const gitDir = path.join(DESIGN_AI_HOME, ".git");
  const isGitClone = pathExists(gitDir);

  if (isGitClone) {
    info("Pulling latest from git...");
    try {
      const out = runSync("git", ["pull", "--ff-only"], { cwd: DESIGN_AI_HOME });
      console.log(out.trim());
    } catch (err) {
      warn("git pull failed; continuing with current source.");
      if (process.env.DEBUG) console.error(err.stderr || err.message);
    }
  } else {
    warn("Not a git clone; can't auto-update the source.");
    info("If installed via npm, run: npm install -g @design-ai/cli@latest");
    info("If installed manually, re-clone or pull yourself.");
  }

  if (!pathExists(INSTALL_SCRIPT)) {
    throw new Error(`install.sh not found at ${INSTALL_SCRIPT}`);
  }

  info("Re-running install.sh...");
  await run("bash", [INSTALL_SCRIPT, "install"], {
    cwd: DESIGN_AI_HOME,
    env: {
      DESIGN_AI_PREFIX: SYMLINK_PREFIX,
      CLAUDE_HOME,
    },
  });

  console.log();
  success("Update complete. Restart Claude Code to pick up changes.");
}
