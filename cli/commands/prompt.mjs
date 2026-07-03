// `design-ai prompt` — generate a ready-to-use agent prompt from a task brief.

import { DESIGN_AI_HOME, SYMLINK_PREFIX } from "../lib/paths.mjs";
import { header, info, success } from "../lib/log.mjs";
import { resolveBriefInput } from "../lib/brief.mjs";
import { recordLearningUsage } from "../lib/learn.mjs";
import {
  buildPromptEvalTemplate,
  buildPromptPlan,
  formatPromptJson,
  parsePromptArgs,
  promptEvalReport,
} from "../lib/prompt.mjs";
import { writeOutputFile } from "../lib/output.mjs";

function printHelp() {
  console.log("Usage:  design-ai prompt <brief> [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--with-recall] [--recall-limit N] [--json] [--out file] [--force]");
  console.log("        design-ai prompt --from-file brief.md [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--with-recall] [--recall-limit N] [--json] [--out file] [--force]");
  console.log("        design-ai prompt --eval-template [--json] [--out file] [--force]");
  console.log("        design-ai prompt --eval --from-file prompt-eval.json [--strict] [--json] [--out file] [--force]");
  console.log("        cat prompt-eval.json | design-ai prompt --eval --stdin [--strict] [--json]");
  console.log("        cat brief.md | design-ai prompt --stdin [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--with-recall] [--recall-limit N] [--json]\n");
  console.log("Builds a ready-to-use prompt from route recommendations and required design-ai files.");
  console.log("Prompt eval is read-only and checks generated prompt-plan contracts.\n");
  console.log("Options:");
  console.log("  --from-file file  Read the task brief, or prompt eval JSON with --eval, from a file");
  console.log("  --stdin           Read the task brief, or prompt eval JSON with --eval, from standard input");
  console.log("  --route id        Force a route id from `design-ai route --json`");
  console.log("  --with-learning   Include brief-relevant local learning preferences and record local usage metadata");
  console.log("  --learning-category kind  Include only one learning category; requires --with-learning");
  console.log("  --learning-limit N        Limit included learning entries, 1-100; requires --with-learning");
  console.log("  --with-recall     Include brief-relevant corpus knowledge files recalled from the shipped design corpus");
  console.log("  --recall-limit N          Limit recalled corpus knowledge files, 1-20; requires --with-recall");
  console.log("  --eval-template   Generate a runnable prompt eval checkpoint JSON template");
  console.log("  --eval            Run deterministic prompt-plan checkpoint cases");
  console.log("  --strict          With --eval, exit non-zero on warning or failure");
  console.log("  --json            Emit machine-readable prompt plan");
  console.log("  --out file        Write output to a file instead of stdout");
  console.log("  --force           Overwrite an existing --out file");
  console.log("");
  console.log("Environment:");
  console.log("  DESIGN_AI_LEARNING_FILE=/path/learning.json        Override the profile used by --with-learning");
  console.log("  DESIGN_AI_LEARNING_USAGE_FILE=/path/usage.json     Override the local usage sidecar path");
  console.log("");
  console.log("Examples:");
  console.log("  design-ai prompt \"audit a Figma signup flow for Korean fintech\"");
  console.log("  design-ai prompt \"audit checkout UX\" --with-learning --learning-category korean --learning-limit 5");
  console.log("  design-ai prompt --from-file product-brief.md --route design-review --out prompt.md");
  console.log("  design-ai prompt \"spec a Button component API\" --json --out button-prompt.json");
  console.log("  design-ai prompt --eval-template --json > prompt-eval.json");
  console.log("  design-ai prompt --eval --from-file prompt-eval.json --strict --json");
}

function printPromptEvalTemplate(template) {
  header("design-ai prompt", "Prompt eval checkpoint template");
  info(`Source: ${DESIGN_AI_HOME}`);
  info(`Corpus version: ${template.sourcePromptVersion}`);
  info(`Cases: ${template.cases.length}`);
  console.log();
  console.log("Write the JSON below to a file, edit cases if needed, then run:");
  console.log("design-ai prompt --eval --from-file prompt-eval.json --strict");
  console.log();
  console.log(formatPromptJson(template));
}

function printPromptEvalReport(report) {
  header("design-ai prompt", "Prompt eval report");
  info(`Source: ${report.source}`);
  info(`Corpus version: ${report.version}`);
  info(`Status: ${report.status}`);
  info(`Cases: ${report.summary.total} (${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail)`);
  console.log();

  for (const result of report.cases) {
    console.log(`${result.status.toUpperCase()} ${result.id}`);
    console.log(`   expected: ${result.expectedRouteId}`);
    console.log(`   route:    ${result.routeId || "none"}`);
    console.log(`   files:    ${result.filesToReadCount} planned, ${result.missingRequiredFiles.length} required missing`);
    console.log(`   checks:   ${result.missingChecklist.length} checklist missing, ${result.missingPromptFragments.length} prompt fragments missing`);
    console.log(`   result:   ${result.message}`);
    console.log();
  }
}

export async function runPrompt(args) {
  const parsed = parsePromptArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  if (parsed.evalTemplate) {
    const template = buildPromptEvalTemplate({ sourceRoot: DESIGN_AI_HOME });
    const content = parsed.json ? `${formatPromptJson(template)}\n` : `${formatPromptJson(template)}\n`;
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
    printPromptEvalTemplate(template);
    return;
  }

  if (parsed.eval) {
    const evalText = resolveBriefInput(parsed);
    const report = promptEvalReport({
      evalText,
      source: parsed.fromFile || "stdin",
      sourceRoot: DESIGN_AI_HOME,
      prefix: SYMLINK_PREFIX,
    });
    const content = parsed.json ? `${formatPromptJson(report)}\n` : "";
    if (parsed.outPath) {
      const written = writeOutputFile({
        outPath: parsed.outPath,
        content: parsed.json ? content : `${formatPromptJson(report)}\n`,
        force: parsed.force,
      });
      success(`Wrote ${written}`);
    } else if (parsed.json) {
      console.log(content.trimEnd());
    } else {
      printPromptEvalReport(report);
    }
    if (parsed.strict && report.status !== "pass") {
      process.exitCode = 1;
    }
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
    withRecall: parsed.withRecall,
    recallLimit: parsed.recallLimit,
  });
  const learningUsage = parsed.withLearning
    ? recordLearningUsage({
      command: "prompt",
      routeId: plan.route.id,
      learningContext: plan.learningContext,
    })
    : null;
  const outputPlan = learningUsage ? { ...plan, learningUsage } : plan;

  const content = parsed.json ? `${formatPromptJson(outputPlan)}\n` : `${outputPlan.prompt}\n`;

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
  info(`Corpus version: ${outputPlan.version}`);
  if (learningUsage?.recorded) {
    info(`Learning usage: recorded ${learningUsage.event.id}`);
  }
  console.log();
  console.log(outputPlan.prompt);
}
