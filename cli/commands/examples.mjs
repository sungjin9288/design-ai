// `design-ai examples` — discover worked examples for a route or query.

import { DESIGN_AI_HOME } from "../lib/paths.mjs";
import { dim, header, info, warn } from "../lib/log.mjs";
import { formatExamplesJson, listExamples, parseExamplesArgs } from "../lib/examples.mjs";

function printHelp() {
  console.log("Usage:  design-ai examples [query] [--route id] [--limit N] [--json]\n");
  console.log("Finds worked outputs in examples/ so users can compare against known-good design-ai artifacts.\n");
  console.log("Options:");
  console.log("  --route id  Bias example search to a route id from `design-ai routes`");
  console.log("  --limit N   Maximum examples to return, 1-100. Default: 12");
  console.log("  --json      Emit machine-readable results");
}

function printExamples(examples) {
  for (let i = 0; i < examples.length; i += 1) {
    const example = examples[i];
    console.log(`${i + 1}. ${example.title} ${dim(`(${example.category}, score ${example.score})`)}`);
    console.log(`   ${example.relPath}`);
    if (example.preview) {
      console.log(`   ${dim(example.preview)}`);
    }
  }
}

export async function runExamples(args) {
  const parsed = parseExamplesArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  const payload = listExamples({
    designAiPath: DESIGN_AI_HOME,
    query: parsed.query,
    routeId: parsed.routeId,
    limit: parsed.limit,
  });

  if (parsed.json) {
    console.log(formatExamplesJson(payload));
    return;
  }

  header("design-ai examples", parsed.routeId || parsed.query || "all");
  info(`Source: ${DESIGN_AI_HOME}`);
  info(`Effective query: ${payload.effectiveQuery || "(none)"}`);
  info(`Examples: ${payload.examples.length}`);
  console.log();

  if (payload.examples.length === 0) {
    warn("No examples found.");
    return;
  }

  printExamples(payload.examples);
}
