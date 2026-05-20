// `design-ai update` — re-fetch upstream + reinstall.

import { run, runSync } from "../lib/exec.mjs";
import { header, info, success, warn } from "../lib/log.mjs";
import { hasHelpFlag } from "../lib/help-flags.mjs";
import { unknownOptionMessage } from "../lib/suggest.mjs";
import {
  DESIGN_AI_HOME,
  CLAUDE_HOME,
  SYMLINK_PREFIX,
  INSTALL_SCRIPT,
  pathExists,
} from "../lib/paths.mjs";
import path from "node:path";

const UPDATE_OPTIONS = ["-h", "--help", "--dry-run", "--json"];
const UPDATE_USAGE = "Usage: design-ai update [--dry-run] [--json]";

export function parseUpdateArgs(args) {
  const flags = {
    help: false,
    dryRun: false,
    json: false,
  };

  for (const arg of args) {
    if (arg === "-h" || arg === "--help") {
      flags.help = true;
      continue;
    }
    if (arg === "--dry-run") {
      flags.dryRun = true;
      continue;
    }
    if (arg === "--json") {
      flags.json = true;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`${unknownOptionMessage("update", arg, UPDATE_OPTIONS)}\n${UPDATE_USAGE}`);
    }
    throw new Error(UPDATE_USAGE);
  }

  if (flags.json && !flags.dryRun) {
    throw new Error("--json is only supported with --dry-run.\nUsage: design-ai update --dry-run [--json]");
  }

  return flags;
}

export function buildUpdateDryRunReport({
  sourceRoot = DESIGN_AI_HOME,
  claudeHome = CLAUDE_HOME,
  prefix = SYMLINK_PREFIX,
  installScript = INSTALL_SCRIPT,
} = {}) {
  const sourceIsGitClone = pathExists(path.join(sourceRoot, ".git"));
  const installScriptExists = pathExists(installScript);

  return {
    context: {
      sourceRoot,
      claudeHome,
      prefix,
    },
    plan: {
      gitPull: {
        sourceIsGitClone,
        wouldRun: sourceIsGitClone,
        command: sourceIsGitClone ? ["git", "pull", "--ff-only"] : [],
        reason: sourceIsGitClone ? "source is a git clone" : "source is not a git clone",
      },
      install: {
        installScriptExists,
        wouldRun: installScriptExists,
        installScript,
        command: installScriptExists ? ["bash", installScript, "install"] : [],
        reason: installScriptExists ? "install.sh is available" : "install.sh is missing",
      },
    },
    result: {
      dryRun: true,
      mutating: false,
      ready: installScriptExists,
    },
  };
}

export function formatUpdateDryRunJson(report) {
  return JSON.stringify(report, null, 2);
}

function printHelp() {
  console.log("Usage:  design-ai update [--dry-run] [--json]\n");
  console.log("Pulls the latest git source when DESIGN_AI_HOME is a clone, then re-runs install.sh.");
  console.log("For npm installs, update the package with npm and then run install again.\n");
  console.log("Options:");
  console.log("  --dry-run                      Preview git/install actions without changing files");
  console.log("  --json                         Emit machine-readable dry-run plan; requires --dry-run\n");
  console.log("Environment:");
  console.log("  DESIGN_AI_HOME=/path/to/source  Source repository or package root");
  console.log("  CLAUDE_HOME=/path/to/.claude    Target Claude Code home directory");
  console.log("  DESIGN_AI_PREFIX=mydesign-     Prefix for installed skill and command names");
}

function printDryRun(report) {
  header("design-ai update dry run");
  info(`Source: ${report.context.sourceRoot}`);
  info(`Target: ${report.context.claudeHome}`);
  info(`Prefix: ${report.context.prefix}`);
  console.log();

  if (report.plan.gitPull.wouldRun) {
    info(`Git: would run ${report.plan.gitPull.command.join(" ")}`);
  } else {
    warn(`Git: skipped; ${report.plan.gitPull.reason}.`);
  }

  if (report.plan.install.wouldRun) {
    info(`Install: would run ${report.plan.install.command.join(" ")}`);
  } else {
    warn(`Install: skipped; ${report.plan.install.reason}.`);
  }

  console.log();
  success("Dry run complete. No files changed.");
}

export async function runUpdate(args) {
  if (hasHelpFlag(args)) {
    printHelp();
    return;
  }

  const parsed = parseUpdateArgs(args);

  if (parsed.dryRun) {
    const report = buildUpdateDryRunReport();
    if (parsed.json) {
      console.log(formatUpdateDryRunJson(report));
      return;
    }
    printDryRun(report);
    return;
  }

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
