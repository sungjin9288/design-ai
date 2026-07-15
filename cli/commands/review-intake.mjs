import { header, info } from "../lib/log.mjs";
import {
  buildTargetRepoIntakeFromFile,
  parseTargetRepoIntakeArgs,
  renderTargetRepoIntakeMarkdown,
} from "../lib/target-repo-intake.mjs";

function printHelp() {
  console.log("Usage:  design-ai review-intake <receipt.json> --target-root path --consumer name [--json]\n");
  console.log("Inspect bounded target-repository metadata and emit a read-only intake record.\n");
  console.log("Options:");
  console.log("  --target-root path  Required absolute path; must match the receipt workflow");
  console.log("  --consumer name     Required consumer; must match the validated receipt");
  console.log("  --json              Emit the target-repository intake JSON");
  console.log([
    "\nBoundary: reads package.json, supported root entry metadata, and local Git metadata only.",
    "It does not read application source, start a preview, call a network, write a file, mutate the target repository, or authorize implementation.",
  ].join("\n"));
}

export async function runReviewIntake(args) {
  const parsed = parseTargetRepoIntakeArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }
  const intake = buildTargetRepoIntakeFromFile(parsed);
  if (parsed.json) {
    console.log(JSON.stringify(intake, null, 2));
    return;
  }
  header("design-ai review-intake", "Target repository intake");
  info(`Status: ${intake.status}`);
  info(`Target: ${intake.target.resolvedPath || intake.target.declaredPath}`);
  console.log();
  console.log(renderTargetRepoIntakeMarkdown(intake));
}
