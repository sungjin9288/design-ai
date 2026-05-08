// `design-ai status` — show installed symlinks.

import { readdirSync, readlinkSync, statSync } from "node:fs";
import path from "node:path";

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

function listLinkedFromSource(dir) {
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
      if (resolved.startsWith(DESIGN_AI_HOME)) ours.push(name);
    } catch {
      // not a symlink; skip
    }
  }
  return ours;
}

export async function runStatus(args) {
  header("design-ai status");
  info(`Source: ${DESIGN_AI_HOME}`);
  info(`Target: ${CLAUDE_HOME}`);
  info(`Prefix: ${SYMLINK_PREFIX}`);
  console.log();

  const targets = [
    { kind: "Skills", dir: SKILLS_DST },
    { kind: "Agents", dir: AGENTS_DST },
    { kind: "Slash commands", dir: COMMANDS_DST },
  ];

  for (const t of targets) {
    if (!isDirectory(t.dir)) {
      warn(`${t.kind}: target dir does not exist (${t.dir})`);
      continue;
    }
    const ours = listLinkedFromSource(t.dir);
    if (!ours || ours.length === 0) {
      warn(`${t.kind}: 0 installed`);
    } else {
      success(`${t.kind}: ${ours.length} installed`);
      if (process.env.VERBOSE) {
        for (const n of ours) console.log(`   ${dim("•")} ${n}`);
      }
    }
  }
}
