// `design-ai artifact` — build a portable implementation, critique, or DESIGN.md plan.

import { resolveBriefInput } from "../lib/brief.mjs";
import {
  ARTIFACT_MODES,
  buildArtifact,
  formatArtifactJson,
  parseArtifactArgs,
} from "../lib/artifact.mjs";
import { header, info, success } from "../lib/log.mjs";
import { writeOutputFile } from "../lib/output.mjs";
import { DESIGN_AI_HOME, SYMLINK_PREFIX } from "../lib/paths.mjs";

function printHelp() {
  console.log("Usage:  design-ai artifact <mode> <brief> [--route id] [--json] [--out file] [--force]");
  console.log("        design-ai artifact <mode> --from-file brief.md [--route id] [--json] [--out file]");
  console.log("        cat brief.md | design-ai artifact <mode> --stdin [--route id] [--json]\n");
  console.log("Builds a read-only design artifact plan shared by CLI, SDK, MCP, and Website Console.\n");
  console.log(`Modes: ${ARTIFACT_MODES.join(", ")}\n`);
  console.log("Options:");
  console.log("  --from-file file  Read the task brief from a file");
  console.log("  --stdin           Read the task brief from standard input");
  console.log("  --route id        Force a route id from `design-ai routes`");
  console.log("  --json            Emit the machine-readable artifact contract");
  console.log("  --out file        Write the artifact locally instead of stdout");
  console.log("  --force           Overwrite an existing --out file");
  console.log("");
  console.log("Examples:");
  console.log('  design-ai artifact implementation-plan "refactor the account settings flow"');
  console.log('  design-ai artifact critique-loop "revise the pricing page after design review" --out critique-loop.md');
  console.log('  design-ai artifact design-contract "Korean fintech dashboard design system" --out DESIGN.md');
}

export async function runArtifact(args) {
  const parsed = parseArtifactArgs(args);
  if (parsed.help || !parsed.mode) {
    printHelp();
    if (!parsed.help) process.exitCode = 1;
    return;
  }

  let brief = "";
  try {
    brief = resolveBriefInput(parsed);
  } catch (error) {
    if (error.message === "Brief is empty") {
      printHelp();
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const artifact = buildArtifact({
    mode: parsed.mode,
    brief,
    sourceRoot: DESIGN_AI_HOME,
    prefix: SYMLINK_PREFIX,
    routeId: parsed.routeId,
  });
  const content = parsed.json ? `${formatArtifactJson(artifact)}\n` : `${artifact.markdown}\n`;

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

  header("design-ai artifact", artifact.title);
  info(`Route: ${artifact.route.id}`);
  info(`Output: ${artifact.outputFile}`);
  console.log();
  console.log(artifact.markdown);
}
