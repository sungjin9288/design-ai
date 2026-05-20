// `design-ai install` — symlink skills/commands/agents into Claude Code.

import { readFileSync } from "node:fs";

import { run } from "../lib/exec.mjs";
import { header, info, success } from "../lib/log.mjs";
import { hasHelpFlag } from "../lib/help-flags.mjs";
import { unknownOptionMessage } from "../lib/suggest.mjs";
import {
  DESIGN_AI_HOME,
  CLAUDE_HOME,
  SYMLINK_PREFIX,
  INSTALL_SCRIPT,
  PLUGIN_MANIFEST,
  checkSourceLayout,
  pathExists,
} from "../lib/paths.mjs";

const INSTALL_OPTIONS = ["-h", "--help", "--json"];
const INSTALL_USAGE = "Usage: design-ai install [--json]";
const INSTALLED_COUNT_PATTERNS = {
  skills: /\bInstalled\s+(\d+)\s+skills\b/,
  agents: /\bInstalled\s+(\d+)\s+agents\b/,
  commands: /\bInstalled\s+(\d+)\s+slash commands\b/,
};

function installerSubtitle() {
  if (!pathExists(PLUGIN_MANIFEST)) return "Claude Code symlink installer";
  try {
    const manifest = JSON.parse(readFileSync(PLUGIN_MANIFEST, "utf8"));
    return manifest.version ? `v${manifest.version}` : "Claude Code symlink installer";
  } catch {
    return "Claude Code symlink installer";
  }
}

export function parseInstallArgs(args) {
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
      throw new Error(`${unknownOptionMessage("install", arg, INSTALL_OPTIONS)}\n${INSTALL_USAGE}`);
    }
    throw new Error(INSTALL_USAGE);
  }

  return flags;
}

export function parseInstalledCounts(raw) {
  const text = String(raw || "");
  const counts = {};
  for (const [key, pattern] of Object.entries(INSTALLED_COUNT_PATTERNS)) {
    const match = pattern.exec(text);
    if (!match) {
      throw new Error(`Unable to parse install output: missing installed ${key} count`);
    }
    counts[key] = Number(match[1]);
  }
  return {
    ...counts,
    total: counts.skills + counts.agents + counts.commands,
  };
}

export function buildInstallReport({
  sourceRoot = DESIGN_AI_HOME,
  claudeHome = CLAUDE_HOME,
  prefix = SYMLINK_PREFIX,
  installed = { skills: 0, agents: 0, commands: 0, total: 0 },
} = {}) {
  return {
    context: {
      sourceRoot,
      claudeHome,
      prefix,
    },
    result: {
      installed: {
        skills: installed.skills,
        agents: installed.agents,
        commands: installed.commands,
        total: installed.total,
      },
    },
  };
}

export function formatInstallJson(report) {
  return JSON.stringify(report, null, 2);
}

function printHelp() {
  console.log("Usage:  design-ai install [--json]\n");
  console.log("Symlinks design-ai skills, slash commands, and agents into Claude Code.");
  console.log("Uses CLAUDE_HOME and DESIGN_AI_PREFIX when provided.\n");
  console.log("Options:");
  console.log("  --json                         Emit machine-readable install result\n");
  console.log("Environment:");
  console.log("  CLAUDE_HOME=/path/to/.claude    Target Claude Code home directory");
  console.log("  DESIGN_AI_PREFIX=mydesign-     Prefix for installed skill and command names");
}

export async function runInstall(args) {
  if (hasHelpFlag(args)) {
    printHelp();
    return;
  }

  const parsed = parseInstallArgs(args);

  if (!parsed.json) {
    header("design-ai installer", installerSubtitle());
  }

  checkSourceLayout();

  if (!parsed.json) {
    info(`Source: ${DESIGN_AI_HOME}`);
    info(`Target: ${CLAUDE_HOME}`);
    info(`Prefix: ${SYMLINK_PREFIX}`);
    console.log();
  }

  if (!pathExists(INSTALL_SCRIPT)) {
    throw new Error(`install.sh not found at ${INSTALL_SCRIPT}`);
  }

  // Delegate to install.sh — single source of truth for symlink logic.
  const result = await run("bash", [INSTALL_SCRIPT, "install"], {
    cwd: DESIGN_AI_HOME,
    silent: parsed.json,
    env: {
      DESIGN_AI_PREFIX: SYMLINK_PREFIX,
      CLAUDE_HOME,
    },
  });

  if (parsed.json) {
    console.log(formatInstallJson(buildInstallReport({
      installed: parseInstalledCounts(result.stdout),
    })));
    return;
  }

  console.log();
  success("Installed. Restart Claude Code (or open a new session) to pick up changes.");
  info(`Try: /${SYMLINK_PREFIX}component-spec, /${SYMLINK_PREFIX}motion-design, /${SYMLINK_PREFIX}spatial`);
  info(`Or: design-ai status`);
}
