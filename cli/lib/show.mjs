// File display helpers for `design-ai show`.

import {
  existsSync,
  readFileSync,
  statSync,
} from "node:fs";
import path from "node:path";

import { unknownOptionMessage } from "./suggest.mjs";

const SHOW_OPTIONS = ["-h", "--help", "--json", "--lines", "--context"];

function exists(p) {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
}

function isInsidePath(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function parseRange(value) {
  const match = String(value).match(/^(\d+)(?:(?::|-)(\d+))?$/);
  if (!match) {
    throw new Error("Line range must use N, N:M, or N-M");
  }

  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : start;
  if (start < 1 || end < start) {
    throw new Error("Line range must start at 1 and end after the start");
  }

  return { start, end, explicitRange: Boolean(match[2]) };
}

export function parseShowTarget(rawTarget) {
  const target = String(rawTarget || "").trim();
  if (!target) throw new Error("Missing file path");

  const match = target.match(/^(.+):(\d+(?:(?::|-)\d+)?)$/);
  if (!match) return { relPath: target, range: null };

  return {
    relPath: match[1],
    range: parseRange(match[2]),
  };
}

export function parseShowArgs(args) {
  const out = {
    target: "",
    lines: null,
    context: 8,
    json: false,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--json") {
      out.json = true;
    } else if (arg === "--lines") {
      out.lines = parseRange(args[i + 1] || "");
      i += 1;
    } else if (arg === "--context") {
      const context = Number(args[i + 1]);
      if (!Number.isInteger(context) || context < 0 || context > 100) {
        throw new Error("--context expects an integer from 0 to 100");
      }
      out.context = context;
      i += 1;
    } else if (arg.startsWith("--")) {
      throw new Error(unknownOptionMessage("show", arg, SHOW_OPTIONS));
    } else if (!out.target) {
      out.target = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  return out;
}

export function resolveShowFile({ sourceRoot, target }) {
  const { relPath, range } = parseShowTarget(target);
  const absolute = path.isAbsolute(relPath)
    ? path.resolve(relPath)
    : path.resolve(sourceRoot, relPath.replace(/^\/+/, ""));
  const relative = path.relative(sourceRoot, absolute);

  if (!isInsidePath(sourceRoot, absolute)) {
    throw new Error("Refusing to read outside DESIGN_AI_HOME");
  }
  if (relative.split(path.sep).some((part) => part === ".git" || part === "node_modules")) {
    throw new Error("Refusing to read ignored internal directories");
  }
  if (!exists(absolute)) {
    throw new Error(`File not found: ${relative}`);
  }
  if (!statSync(absolute).isFile()) {
    throw new Error(`Not a file: ${relative}`);
  }

  return {
    file: absolute,
    relPath: relative,
    targetRange: range,
  };
}

export function readShowFile({ sourceRoot, target, lines = null, context = 8 }) {
  const resolved = resolveShowFile({ sourceRoot, target });
  const content = readFileSync(resolved.file, "utf8");
  const allLines = content.split("\n");
  const requested = lines || resolved.targetRange;

  let start = 1;
  let end = allLines.length;

  if (requested) {
    if (requested.explicitRange) {
      start = requested.start;
      end = requested.end;
    } else {
      start = Math.max(1, requested.start - context);
      end = Math.min(allLines.length, requested.start + context);
    }
  }

  start = Math.min(start, allLines.length || 1);
  end = Math.min(end, allLines.length);

  const visibleLines = [];
  for (let lineNumber = start; lineNumber <= end; lineNumber += 1) {
    visibleLines.push({
      number: lineNumber,
      text: allLines[lineNumber - 1] ?? "",
    });
  }

  return {
    file: resolved.file,
    relPath: resolved.relPath,
    start,
    end,
    totalLines: allLines.length,
    lines: visibleLines,
  };
}

export function formatShowJson(result) {
  return JSON.stringify(result, null, 2);
}
