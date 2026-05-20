// `design-ai status` — show installed symlinks.

import { readdirSync, readlinkSync, statSync } from "node:fs";
import path from "node:path";

import { hasHelpFlag } from "../lib/help-flags.mjs";
import { header, info, success, warn, dim } from "../lib/log.mjs";
import {
  DESIGN_AI_HOME,
  CLAUDE_HOME,
  SYMLINK_PREFIX,
  SKILLS_DST,
  AGENTS_DST,
  COMMANDS_DST,
  pathExists,
  isDirectory,
} from "../lib/paths.mjs";
import { unknownOptionMessage } from "../lib/suggest.mjs";

const STATUS_OPTIONS = ["-h", "--help", "--json"];
const STATUS_USAGE = "Usage: design-ai status [--json]";

export const STATUS_TARGETS = [
  { kind: "skills", label: "Skills", dir: SKILLS_DST },
  { kind: "agents", label: "Agents", dir: AGENTS_DST },
  { kind: "commands", label: "Slash commands", dir: COMMANDS_DST },
];

export function parseStatusArgs(args) {
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
      throw new Error(`${unknownOptionMessage("status", arg, STATUS_OPTIONS)}\n${STATUS_USAGE}`);
    }
    throw new Error(STATUS_USAGE);
  }

  return flags;
}

export function listLinkedFromSource(dir, sourceRoot = DESIGN_AI_HOME) {
  if (!pathExists(dir)) return null;
  const entries = readdirSync(dir);
  const ours = [];
  for (const name of entries) {
    const full = path.join(dir, name);
    let st;
    try {
      st = statSync(full, { throwIfNoEntry: false });
    } catch {
      continue;
    }
    if (!st) continue;
    try {
      const link = readlinkSync(full);
      const resolved = path.resolve(dir, link);
      if (resolved.startsWith(sourceRoot)) ours.push(name);
    } catch {
      // not a symlink; skip
    }
  }
  return ours.sort((a, b) => a.localeCompare(b));
}

export function collectStatusReport({
  sourceRoot = DESIGN_AI_HOME,
  claudeHome = CLAUDE_HOME,
  prefix = SYMLINK_PREFIX,
  targets = STATUS_TARGETS,
} = {}) {
  const sections = targets.map((target) => {
    const targetExists = isDirectory(target.dir);
    const entries = targetExists ? listLinkedFromSource(target.dir, sourceRoot) || [] : [];
    return {
      kind: target.kind,
      label: target.label,
      targetDir: target.dir,
      targetExists,
      installed: entries.length,
      entries,
    };
  });

  return {
    context: {
      sourceRoot,
      claudeHome,
      prefix,
    },
    sections,
    summary: {
      installed: sections.reduce((total, section) => total + section.installed, 0),
      missingSections: sections.filter((section) => !section.targetExists).length,
      emptySections: sections.filter((section) => section.targetExists && section.installed === 0).length,
    },
  };
}

export function formatStatusJson(report) {
  return JSON.stringify(report, null, 2);
}

function printHelp() {
  console.log("Usage:  design-ai status [--json]\n");
  console.log("Shows design-ai symlinks currently installed in Claude Code.");
  console.log("Set VERBOSE=1 to print each installed skill, command, and agent name.\n");
  console.log("Options:");
  console.log("  --json                         Emit machine-readable install status");
  console.log("\nEnvironment:");
  console.log("  CLAUDE_HOME=/path/to/.claude    Target Claude Code home directory");
  console.log("  DESIGN_AI_HOME=/path/to/source  Source repository or package root");
  console.log("  DESIGN_AI_PREFIX=mydesign-     Prefix for installed skill and command names");
  console.log("  VERBOSE=1                       Print full installed item lists");
}

export async function runStatus(args) {
  if (hasHelpFlag(args)) {
    printHelp();
    return;
  }

  const parsed = parseStatusArgs(args);
  const report = collectStatusReport();
  if (parsed.json) {
    console.log(formatStatusJson(report));
    return;
  }

  header("design-ai status");
  info(`Source: ${report.context.sourceRoot}`);
  info(`Target: ${report.context.claudeHome}`);
  info(`Prefix: ${report.context.prefix}`);
  console.log();

  for (const section of report.sections) {
    if (!section.targetExists) {
      warn(`${section.label}: target dir does not exist (${section.targetDir})`);
      continue;
    }
    if (section.installed === 0) {
      warn(`${section.label}: 0 installed`);
    } else {
      success(`${section.label}: ${section.installed} installed`);
      if (process.env.VERBOSE) {
        for (const n of section.entries) console.log(`   ${dim("•")} ${n}`);
      }
    }
  }
}
