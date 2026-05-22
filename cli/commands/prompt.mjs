// `design-ai prompt` — generate a ready-to-use agent prompt from a task brief.

import { DESIGN_AI_HOME, SYMLINK_PREFIX } from "../lib/paths.mjs";
import { header, info, success } from "../lib/log.mjs";
import { resolveBriefInput } from "../lib/brief.mjs";
import { buildPromptPlan, formatPromptJson, parsePromptArgs } from "../lib/prompt.mjs";
import { writeOutputFile } from "../lib/output.mjs";

function printHelp() {
  console.log("Usage:  design-ai prompt <brief> [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--json] [--out file] [--force]");
  console.log("        design-ai prompt --from-file brief.md [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--json] [--out file] [--force]");
  console.log("        cat brief.md | design-ai prompt --stdin [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--json]\n");
  console.log("Builds a ready-to-use prompt from route recommendations and required design-ai files.\n");
  console.log("Options:");
  console.log("  --from-file file  Read the task brief from a markdown/text file");
  console.log("  --stdin           Read the task brief from standard input");
  console.log("  --route id        Force a route id from `design-ai route --json`");
  console.log("  --with-learning   Include local learning preferences from `design-ai learn`");
  console.log("  --learning-category kind  Include only one learning category; requires --with-learning");
  console.log("  --learning-limit N        Limit included learning entries, 1-100; requires --with-learning");
  console.log("  --json            Emit machine-readable prompt plan");
  console.log("  --out file        Write output to a file instead of stdout");
  console.log("  --force           Overwrite an existing --out file");
  console.log("");
  console.log("Examples:");
  console.log("  design-ai prompt \"audit a Figma signup flow for Korean fintech\"");
  console.log("  design-ai prompt \"audit checkout UX\" --with-learning --learning-category korean --learning-limit 5");
  console.log("  design-ai prompt --from-file product-brief.md --route design-review --out prompt.md");
  console.log("  design-ai prompt \"spec a Button component API\" --json --out button-prompt.json");
}

export async function runPrompt(args) {
  const parsed = parsePromptArgs(args);
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

  const plan = buildPromptPlan({
    brief,
    sourceRoot: DESIGN_AI_HOME,
    prefix: SYMLINK_PREFIX,
    routeId: parsed.routeId,
    withLearning: parsed.withLearning,
    learningCategory: parsed.learningCategory,
    learningLimit: parsed.learningLimit,
  });

  const content = parsed.json ? `${formatPromptJson(plan)}\n` : `${plan.prompt}\n`;

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

  header("design-ai prompt", brief);
  info(`Source: ${DESIGN_AI_HOME}`);
  info(`Corpus version: ${plan.version}`);
  console.log();
  console.log(plan.prompt);
}
