// Shared task brief input handling for route/prompt/pack commands.

import { readFileSync } from "node:fs";
import path from "node:path";

export function parseBriefSourceFlag(args, out) {
  const arg = args[out.index];

  if (arg === "--from-file" || arg === "--file") {
    const next = args[out.index + 1];
    if (!next || next.startsWith("--")) throw new Error(`${arg} expects a file path`);
    out.fromFile = next;
    out.index += 1;
    return true;
  }

  if (arg === "--stdin") {
    out.stdin = true;
    return true;
  }

  return false;
}

export function resolveBriefInput({
  briefParts = [],
  fromFile = "",
  stdin = false,
  cwd = process.cwd(),
  readStdin = () => readFileSync(0, "utf8"),
}) {
  const inlineBrief = briefParts.join(" ").trim();
  const sources = [
    inlineBrief ? "inline brief" : "",
    fromFile ? "--from-file" : "",
    stdin ? "--stdin" : "",
  ].filter(Boolean);

  if (sources.length > 1) {
    throw new Error(`Use only one brief source: ${sources.join(", ")}`);
  }

  let brief = inlineBrief;
  if (fromFile) {
    brief = readFileSync(path.resolve(cwd, fromFile), "utf8").trim();
  } else if (stdin) {
    brief = String(readStdin()).trim();
  }

  if (!brief) throw new Error("Brief is empty");
  return brief;
}
