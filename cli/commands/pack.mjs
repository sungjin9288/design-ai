// `design-ai pack` — generate a prompt plus bounded context file contents.

import { DESIGN_AI_HOME, SYMLINK_PREFIX } from "../lib/paths.mjs";
import { header, info, success } from "../lib/log.mjs";
import { resolveBriefInput } from "../lib/brief.mjs";
import { buildPromptPack, formatPackJson, parsePackArgs } from "../lib/pack.mjs";
import { writeOutputFile } from "../lib/output.mjs";

function printHelp() {
  console.log("Usage:  design-ai pack <brief> [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--max-bytes N] [--json] [--out file] [--force]");
  console.log("        design-ai pack --from-file brief.md [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--max-bytes N] [--json] [--out file] [--force]");
  console.log("        cat brief.md | design-ai pack --stdin [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--max-bytes N] [--json]\n");
  console.log("Generates a ready-to-use prompt plus bounded context file contents, summary, and warnings.\n");
  console.log("Options:");
  console.log("  --from-file file  Read the task brief from a markdown/text file");
  console.log("  --stdin           Read the task brief from standard input");
  console.log("  --route id        Force a route id from `design-ai route --json`");
  console.log("  --with-learning   Include local learning preferences from `design-ai learn`");
  console.log("  --learning-category kind  Include only one learning category; requires --with-learning");
  console.log("  --learning-limit N        Limit included learning entries, 1-100; requires --with-learning");
  console.log("  --max-bytes N     Maximum context bytes to include, 1000-1000000. Default: 120000");
  console.log("  --json            Emit machine-readable bundle");
  console.log("  --out file        Write output to a file instead of stdout");
  console.log("  --force           Overwrite an existing --out file");
  console.log("");
  console.log("Examples:");
  console.log("  design-ai pack \"audit checkout UX\" --with-learning --learning-category korean --learning-limit 5");
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
    withLearning: parsed.withLearning,
    learningCategory: parsed.learningCategory,
    learningLimit: parsed.learningLimit,
  });

  const content = parsed.json ? `${formatPackJson(pack)}\n` : `${pack.markdown}\n`;

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
