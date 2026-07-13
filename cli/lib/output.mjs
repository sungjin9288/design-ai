// Output file helpers for CLI commands that can write artifacts.

import {
  lstatSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

function pathStats(p) {
  try {
    return lstatSync(p);
  } catch {
    return null;
  }
}

function assertNotSymbolicLink(target, stats = pathStats(target)) {
  if (stats?.isSymbolicLink()) {
    throw new Error(`Output path must not be a symbolic link: ${target}`);
  }
  return stats;
}

function assertNoSymbolicLinkWithin(root, target) {
  const relative = path.relative(root, target);
  let current = root;
  assertNotSymbolicLink(current);
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    assertNotSymbolicLink(current);
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
  const existing = assertNotSymbolicLink(absolute);
  if (existing) {
    if (existing.isDirectory()) {
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

function assertSafeRelativePath(relPath) {
  const normalized = path.normalize(String(relPath || ""));
  if (!normalized || normalized === ".") {
    throw new Error("Output bundle file path is empty");
  }
  if (path.isAbsolute(normalized) || normalized.startsWith("..") || normalized.includes(`${path.sep}..${path.sep}`)) {
    throw new Error(`Output bundle file path must stay inside the output directory: ${relPath}`);
  }
  return normalized;
}

export function writeOutputFiles({ outPath, files, force = false, cwd = process.cwd() }) {
  if (!outPath) throw new Error("Missing output directory");
  if (!Array.isArray(files) || files.length === 0) throw new Error("No output files provided");

  const absolute = path.resolve(cwd, outPath);
  const outputDirectory = assertNotSymbolicLink(absolute);
  if (outputDirectory && !outputDirectory.isDirectory()) {
    throw new Error(`Output path is not a directory: ${absolute}`);
  }

  const planned = files.map((file) => {
    const relativePath = assertSafeRelativePath(file.path);
    const target = path.join(absolute, relativePath);
    assertNoSymbolicLinkWithin(absolute, target);
    const existing = pathStats(target);
    if (existing) {
      if (existing.isDirectory()) {
        throw new Error(`Output bundle file path is a directory: ${target}`);
      }
      if (!force) {
        throw new Error(`Output bundle file already exists: ${target}. Use --force to overwrite.`);
      }
    }
    return {
      relativePath,
      target,
      content: String(file.content ?? ""),
    };
  });

  mkdirSync(absolute, { recursive: true });
  for (const file of planned) {
    mkdirSync(path.dirname(file.target), { recursive: true });
    writeFileSync(file.target, file.content, "utf8");
  }

  return {
    directory: absolute,
    files: planned.map((file) => file.target),
  };
}
