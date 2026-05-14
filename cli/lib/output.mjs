// Output file helpers for CLI commands that can write artifacts.

import {
  existsSync,
  mkdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

function exists(p) {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
}

export function parseOutputFlags(args, out) {
  const arg = args[out.index];
  if (arg === "--out" || arg === "--output") {
    const next = args[out.index + 1];
    if (!next || next.startsWith("--")) throw new Error(`${arg} expects a file path`);
    out.outPath = next;
    out.index += 1;
    return true;
  }
  if (arg === "--force") {
    out.force = true;
    return true;
  }
  return false;
}

export function writeOutputFile({ outPath, content, force = false, cwd = process.cwd() }) {
  if (!outPath) throw new Error("Missing output path");

  const absolute = path.resolve(cwd, outPath);
  if (exists(absolute)) {
    if (statSync(absolute).isDirectory()) {
      throw new Error(`Output path is a directory: ${absolute}`);
    }
    if (!force) {
      throw new Error(`Output file already exists: ${absolute}. Use --force to overwrite.`);
    }
  }

  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, content, "utf8");
  return absolute;
}
