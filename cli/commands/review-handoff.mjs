import { header, info } from "../lib/log.mjs";
import {
  buildReviewHandoffFromFiles,
  parseReviewHandoffArgs,
  renderReviewHandoffMarkdown,
} from "../lib/review-handoff.mjs";

function printHelp() {
  console.log("Usage:  design-ai review-handoff <review-workflow.json> --recipient name [browser evidence] [--json]\n");
  console.log("Prepares one portable, self-validating review handoff without delivering or implementing it.\n");
  console.log("Options:");
  console.log("  --recipient name                    Required receiving agent or role");
  console.log("  --quality-report file               Exact quality-report JSON used by browser verification");
  console.log("  --browser-verification file         Browser-verification JSON; requires --quality-report");
  console.log("  --json                              Emit the review-handoff JSON");
  console.log([
    "\nBoundary: reads explicit JSON files and writes nothing.",
    "The result is not delivered, consumer-validated, or implemented; target-repository and external writes remain approval-gated.",
  ].join("\n"));
}

export async function runReviewHandoff(args) {
  const parsed = parseReviewHandoffArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }
  const handoff = buildReviewHandoffFromFiles(parsed);
  if (parsed.json) {
    console.log(JSON.stringify(handoff, null, 2));
    return;
  }
  header("design-ai review-handoff", "Prepared evidence handoff");
  info(`Recipient: ${handoff.recipient.name}`);
  info(`Status: ${handoff.status}`);
  console.log();
  console.log(renderReviewHandoffMarkdown(handoff));
}
