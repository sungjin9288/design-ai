import { header, info } from "../lib/log.mjs";
import {
  buildImplementationEvidenceFromFiles,
  parseImplementationEvidenceArgs,
  renderImplementationEvidenceMarkdown,
} from "../lib/implementation-evidence.mjs";

function printHelp() {
  console.log("Usage:  design-ai review-evidence <scope-approval.json> --request evidence-request.json --target-root path --consumer name [--json]\n");
  console.log("Checks implementation evidence against one approved baseline without running verification or changing the target.\n");
  console.log("Options:");
  console.log("  --request file       Required design-ai-implementation-evidence-request v1 JSON");
  console.log("  --target-root path   Required absolute path authorized by the approval");
  console.log("  --consumer name      Required consumer matching the approval and request");
  console.log("  --json               Emit the implementation evidence JSON");
  console.log("\nBoundary: reads the two explicit JSON files, local Git metadata, and declared evidence artifacts only. It writes nothing and does not run tests, commit, push, deploy, use the network, or read application source.");
}

export async function runReviewEvidence(args) {
  const parsed = parseImplementationEvidenceArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }
  const evidence = buildImplementationEvidenceFromFiles(parsed);
  if (parsed.json) {
    console.log(JSON.stringify(evidence, null, 2));
    return;
  }
  header("design-ai review-evidence", "Implementation evidence");
  info(`Status: ${evidence.status}`);
  info(`Target: ${evidence.observed.targetPath}`);
  console.log();
  console.log(renderImplementationEvidenceMarkdown(evidence));
}
