// Path resolution shared across CLI commands.

import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CLI is shipped inside the package, in cli/lib/. The package root is two dirs up.
export const PACKAGE_ROOT = path.resolve(__dirname, "..", "..");

// Where install.sh expects to live AND where Claude Code symlinks point.
// Installed via npm: /path/to/node_modules/@design-ai/cli/{cli,knowledge,...}
// Cloned manually:  /path/to/design-ai/{cli,knowledge,...}
export const DESIGN_AI_HOME = process.env.DESIGN_AI_HOME || PACKAGE_ROOT;

// Claude Code home
export const CLAUDE_HOME = process.env.CLAUDE_HOME || path.join(homedir(), ".claude");

// Symlink prefix (defaults to "design-")
export const SYMLINK_PREFIX = process.env.DESIGN_AI_PREFIX || "design-";

// Subdirectories
export const SKILLS_SRC = path.join(DESIGN_AI_HOME, "skills");
export const AGENTS_SRC = path.join(DESIGN_AI_HOME, "agents");
export const COMMANDS_SRC = path.join(DESIGN_AI_HOME, "commands");
export const PLUGIN_MANIFEST = path.join(DESIGN_AI_HOME, ".claude-plugin", "plugin.json");
export const INSTALL_SCRIPT = path.join(DESIGN_AI_HOME, "install.sh");

export const SKILLS_DST = path.join(CLAUDE_HOME, "skills");
export const AGENTS_DST = path.join(CLAUDE_HOME, "agents");
export const COMMANDS_DST = path.join(CLAUDE_HOME, "commands");

export function pathExists(p) {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
}

export function isDirectory(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

export function checkSourceLayout() {
  const required = [SKILLS_SRC, AGENTS_SRC, COMMANDS_SRC, PLUGIN_MANIFEST];
  const missing = required.filter(p => !pathExists(p));
  if (missing.length > 0) {
    throw new Error(
      `design-ai source layout incomplete at ${DESIGN_AI_HOME}.\n` +
      `Missing:\n  ${missing.join("\n  ")}\n` +
      `If installed via npm, this is a packaging bug. ` +
      `If running from a clone, ensure you're in the design-ai project root.`
    );
  }
}
