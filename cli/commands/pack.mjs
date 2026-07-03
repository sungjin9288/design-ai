// `design-ai pack` — generate a prompt plus bounded context file contents.

import { DESIGN_AI_HOME, SYMLINK_PREFIX } from "../lib/paths.mjs";
import { header, info, success } from "../lib/log.mjs";
import { resolveBriefInput } from "../lib/brief.mjs";
import { recordLearningUsage } from "../lib/learn.mjs";
import {
  buildPackEvalTemplate,
  buildPromptPack,
  formatPackJson,
  packEvalReport,
  parsePackArgs,
} from "../lib/pack.mjs";
import { writeOutputFile } from "../lib/output.mjs";

function printHelp() {
  console.log("Usage:  design-ai pack <brief> [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--with-recall] [--recall-limit N] [--max-bytes N] [--json] [--out file] [--force]");
  console.log("        design-ai pack --from-file brief.md [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--with-recall] [--recall-limit N] [--max-bytes N] [--json] [--out file] [--force]");
  console.log("        design-ai pack --eval-template [--json] [--out file] [--force]");
  console.log("        design-ai pack --eval --from-file pack-eval.json [--strict] [--json] [--out file] [--force]");
  console.log("        cat pack-eval.json | design-ai pack --eval --stdin [--strict] [--json]");
  console.log("        cat brief.md | design-ai pack --stdin [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--with-recall] [--recall-limit N] [--max-bytes N] [--json]\n");
  console.log("Generates a ready-to-use prompt plus bounded context file contents, summary, and warnings.");
  console.log("Pack eval is read-only and checks generated prompt-pack context contracts.\n");
  console.log("Options:");
  console.log("  --from-file file  Read the task brief, or pack eval JSON with --eval, from a file");
  console.log("  --stdin           Read the task brief, or pack eval JSON with --eval, from standard input");
  console.log("  --route id        Force a route id from `design-ai route --json`");
  console.log("  --with-learning   Include brief-relevant local learning preferences and record local usage metadata");
  console.log("  --learning-category kind  Include only one learning category; requires --with-learning");
  console.log("  --learning-limit N        Limit included learning entries, 1-100; requires --with-learning");
  console.log("  --with-recall     Include brief-relevant corpus knowledge files recalled from the shipped design corpus");
  console.log("  --recall-limit N          Limit recalled corpus knowledge files, 1-20; requires --with-recall");
  console.log("  --max-bytes N     Maximum context bytes to include, 1000-1000000. Default: 120000");
  console.log("  --eval-template   Generate a runnable pack eval checkpoint JSON template");
  console.log("  --eval            Run deterministic prompt-pack checkpoint cases");
  console.log("  --strict          With --eval, exit non-zero on warning or failure");
  console.log("  --json            Emit machine-readable bundle");
  console.log("  --out file        Write output to a file instead of stdout");
  console.log("  --force           Overwrite an existing --out file");
  console.log("");
  console.log("Environment:");
  console.log("  DESIGN_AI_LEARNING_FILE=/path/learning.json        Override the profile used by --with-learning");
  console.log("  DESIGN_AI_LEARNING_USAGE_FILE=/path/usage.json     Override the local usage sidecar path");
  console.log("");
  console.log("Examples:");
  console.log("  design-ai pack \"audit checkout UX\" --with-learning --learning-category korean --learning-limit 5");
  console.log("  design-ai pack --from-file product-brief.md --route design-review --out prompt-pack.md");
  console.log("  design-ai pack \"spec a Button component API\" --max-bytes 80000");
  console.log("  design-ai pack --eval-template --json > pack-eval.json");
  console.log("  design-ai pack --eval --from-file pack-eval.json --strict --json");
}

function printPackEvalTemplate(template) {
  header("design-ai pack", "Pack eval checkpoint template");
  info(`Source: ${DESIGN_AI_HOME}`);
  info(`Corpus version: ${template.sourcePackVersion}`);
  info(`Cases: ${template.cases.length}`);
  console.log();
  console.log("Write the JSON below to a file, edit cases if needed, then run:");
  console.log("design-ai pack --eval --from-file pack-eval.json --strict");
  console.log();
  console.log(formatPackJson(template));
}

function printPackEvalReport(report) {
  header("design-ai pack", "Pack eval report");
  info(`Source: ${report.source}`);
  info(`Corpus version: ${report.version}`);
  info(`Status: ${report.status}`);
  info(`Cases: ${report.summary.total} (${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail)`);
  console.log();

  for (const result of report.cases) {
    console.log(`${result.status.toUpperCase()} ${result.id}`);
    console.log(`   expected: ${result.expectedRouteId}`);
    console.log(`   route:    ${result.routeId || "none"}`);
    console.log(`   context:  ${result.contextStatus}, ${result.includedFiles}/${result.totalFiles} files included`);
    console.log(`   missing:  ${result.missingRequiredFiles.length} planned files, ${result.missingIncludedFiles.length} included files`);
    console.log(`   result:   ${result.message}`);
    console.log();
  }
}

export async function runPack(args) {
  const parsed = parsePackArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  if (parsed.evalTemplate) {
    const template = buildPackEvalTemplate({ sourceRoot: DESIGN_AI_HOME });
    const content = `${formatPackJson(template)}\n`;
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
    printPackEvalTemplate(template);
    return;
  }

  if (parsed.eval) {
    const evalText = resolveBriefInput(parsed);
    const report = packEvalReport({
      evalText,
      source: parsed.fromFile || "stdin",
      sourceRoot: DESIGN_AI_HOME,
      prefix: SYMLINK_PREFIX,
      maxBytes: parsed.maxBytes,
    });
    const content = `${formatPackJson(report)}\n`;
    if (parsed.outPath) {
      const written = writeOutputFile({
        outPath: parsed.outPath,
        content,
        force: parsed.force,
      });
      success(`Wrote ${written}`);
    } else if (parsed.json) {
      console.log(content.trimEnd());
    } else {
      printPackEvalReport(report);
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

  const pack = buildPromptPack({
    brief,
    sourceRoot: DESIGN_AI_HOME,
    prefix: SYMLINK_PREFIX,
    maxBytes: parsed.maxBytes,
    routeId: parsed.routeId,
    withLearning: parsed.withLearning,
    learningCategory: parsed.learningCategory,
    learningLimit: parsed.learningLimit,
    withRecall: parsed.withRecall,
    recallLimit: parsed.recallLimit,
  });
  const learningUsage = parsed.withLearning
    ? recordLearningUsage({
      command: "pack",
      routeId: pack.plan.route.id,
      learningContext: pack.plan.learningContext,
    })
    : null;
  const outputPack = learningUsage
    ? {
      ...pack,
      learningUsage,
      plan: {
        ...pack.plan,
        learningUsage,
      },
    }
    : pack;

  const content = parsed.json ? `${formatPackJson(outputPack)}\n` : `${outputPack.markdown}\n`;

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
  info(`Corpus version: ${outputPack.version}`);
  info(`Context: ${outputPack.summary.status}, ${outputPack.usedBytes}/${outputPack.maxBytes} bytes, ${outputPack.warnings.length} warnings`);
  if (learningUsage?.recorded) {
    info(`Learning usage: recorded ${learningUsage.event.id}`);
  }
  console.log();
  console.log(outputPack.markdown);
}
