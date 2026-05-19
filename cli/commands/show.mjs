// `design-ai show` — print a corpus file or line range.

import { DESIGN_AI_HOME } from "../lib/paths.mjs";
import { header, info } from "../lib/log.mjs";
import { formatShowJson, parseShowArgs, readShowFile } from "../lib/show.mjs";

function printHelp() {
  console.log("Usage:  design-ai show <file[:line|start-end]> [--lines N:M] [--context N] [--json]\n");
  console.log("Prints a file from DESIGN_AI_HOME. Search results like `knowledge/foo.md:42` are accepted.\n");
  console.log("Options:");
  console.log("  --lines N:M   Print an exact line range. Also accepts N-M.");
  console.log("  --context N   Context lines around a single `file:line`. Default: 8");
  console.log("  --json        Emit machine-readable output");
}

function printLines(result) {
  const width = String(result.end).length;
  for (const line of result.lines) {
    console.log(`${String(line.number).padStart(width, " ")} | ${line.text}`);
  }
}

export async function runShow(args) {
  const parsed = parseShowArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  if (!parsed.target) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const result = readShowFile({
    sourceRoot: DESIGN_AI_HOME,
    target: parsed.target,
    lines: parsed.lines,
    context: parsed.context,
  });

  if (parsed.json) {
    console.log(formatShowJson(result));
    return;
  }

  header("design-ai show", result.relPath);
  info(`Lines: ${result.start}-${result.end} of ${result.totalLines}`);
  console.log();
  printLines(result);
}
