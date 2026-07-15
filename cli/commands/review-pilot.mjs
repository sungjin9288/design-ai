import { header, info } from "../lib/log.mjs";
import {
  buildPilotEvidenceFromFiles,
  parsePilotEvidenceArgs,
  renderPilotEvidenceMarkdown,
} from "../lib/pilot-evidence.mjs";

function printHelp() {
  console.log("Usage:  design-ai review-pilot <implementation-evidence.json> --workflow review-workflow.json --record pilot-record.json [--json]\n");
  console.log("Builds source-linked evidence for one consented real pilot without changing the project.\n");
  console.log("Options:");
  console.log("  --workflow file Required exact design-ai-review-workflow v1 JSON");
  console.log("  --record file   Required design-ai-pilot-record v1 JSON");
  console.log("  --json          Emit the design-ai-pilot-evidence JSON");
  console.log("\nBoundary: reads three explicit JSON files only. It writes nothing, changes no repository, calls no network, and does not establish customer adoption or production quality.");
}

export async function runReviewPilot(args) {
  const parsed = parsePilotEvidenceArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }
  const evidence = buildPilotEvidenceFromFiles(parsed);
  if (parsed.json) {
    console.log(JSON.stringify(evidence, null, 2));
    return;
  }
  header("design-ai review-pilot", "Real pilot evidence");
  info(`Status: ${evidence.status}`);
  info(`Project: ${evidence.project.name}`);
  console.log();
  console.log(renderPilotEvidenceMarkdown(evidence));
}
