import { header, info } from "../lib/log.mjs";
import {
  listSpecializationBenchmarks,
  parseSpecializationBenchmarkArgs,
  renderSpecializationBenchmarkMarkdown,
  runSpecializationBenchmarks,
} from "../lib/specialization-benchmark.mjs";

function printHelp() {
  console.log("Usage:  design-ai benchmark [case-id] [--strict] [--json]");
  console.log("        design-ai benchmark --list [--json]\n");
  console.log("Runs the packaged product-specialization regression suite without an aggregate quality score.\n");
  console.log("Options:");
  console.log("  --list     List the four benchmark cases without running them");
  console.log("  --strict   Exit non-zero when a contract or finding-precision regression is present");
  console.log("  --json     Emit the canonical benchmark list or report JSON");
  console.log(
    "\nBoundary: reads shipped fixtures and design-ai corpus files only; "
      + "does not write files, mutate a target repository, or call an external service.",
  );
}

export async function runBenchmark(args) {
  const parsed = parseSpecializationBenchmarkArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  const result = parsed.list
    ? listSpecializationBenchmarks()
    : runSpecializationBenchmarks({ id: parsed.id });
  if (parsed.strict && result.status === "fail") process.exitCode = 1;
  if (parsed.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  header("design-ai benchmark", parsed.list ? "Product specialization cases" : "Read-only regression proof");
  if (!parsed.list) info(`Status: ${result.status}`);
  console.log();
  console.log(renderSpecializationBenchmarkMarkdown(result));
}
