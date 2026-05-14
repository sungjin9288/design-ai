// `design-ai pack` — generate a prompt plus bounded context file contents.

import { DESIGN_AI_HOME, SYMLINK_PREFIX } from "../lib/paths.mjs";
import { header, info, success } from "../lib/log.mjs";
import { resolveBriefInput } from "../lib/brief.mjs";
import { buildPromptPack, parsePackArgs } from "../lib/pack.mjs";
import { writeOutputFile } from "../lib/output.mjs";

function printHelp() {
  console.log("Usage:  design-ai pack <brief> [--max-bytes N] [--json] [--out file] [--force]");
  console.log("        design-ai pack --from-file brief.md [--route id] [--out file]");
  console.log("        cat brief.md | design-ai pack --stdin\n");
  console.log("Generates a ready-to-use prompt plus bounded context file contents, summary, and warnings.\n");
  console.log("Options:");
  console.log("  --from-file file  Read the task brief from a markdown/text file");
  console.log("  --stdin           Read the task brief from standard input");
  console.log("  --route id        Force a route id from `design-ai route --json`");
  console.log("  --max-bytes N  Maximum context bytes to include, 1000-1000000. Default: 120000");
  console.log("  --json         Emit machine-readable bundle");
  console.log("  --out file     Write output to a file instead of stdout");
  console.log("  --force        Overwrite an existing --out file");
  console.log("");
  console.log("Examples:");
  console.log("  design-ai pack --from-file product-brief.md --route design-review --out prompt-pack.md");
  console.log("  design-ai pack \"spec a Button component API\" --max-bytes 80000");
}

export async function runPack(args) {
  const parsed = parsePackArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  let brief = "";
  try {
    brief = resolveBriefInput(parsed);
  } catch (err) {
    if (err.message === "Brief is empty") {
      printHelp();
    } else {
      throw err;
    }
    process.exitCode = 1;
    return;
  }

  if (!brief) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const pack = buildPromptPack({
    brief,
    sourceRoot: DESIGN_AI_HOME,
    prefix: SYMLINK_PREFIX,
    maxBytes: parsed.maxBytes,
    routeId: parsed.routeId,
  });

  const content = parsed.json ? `${JSON.stringify(pack, null, 2)}\n` : `${pack.markdown}\n`;

  if (parsed.outPath) {
    const written = writeOutputFile({
      outPath: parsed.outPath,
      content,
      force: parsed.force,
    });
    success(`Wrote ${written}`);
    return;
  }

  if (parsed.json) {
    console.log(content.trimEnd());
    return;
  }

  header("design-ai pack", brief);
  info(`Source: ${DESIGN_AI_HOME}`);
  info(`Corpus version: ${pack.version}`);
  info(`Context: ${pack.summary.status}, ${pack.usedBytes}/${pack.maxBytes} bytes, ${pack.warnings.length} warnings`);
  console.log();
  console.log(pack.markdown);
}
