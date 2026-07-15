import { header, info } from "../lib/log.mjs";
import {
  parseReviewHandoffReceiptArgs,
  renderReviewHandoffReceiptMarkdown,
  verifyReviewHandoffFromFile,
} from "../lib/review-handoff-receipt.mjs";

function printHelp() {
  console.log("Usage:  design-ai review-handoff-verify <review-handoff.json> --consumer name [--json]\n");
  console.log("Validates one exact review handoff and emits a read-only consumer receipt.\n");
  console.log("Options:");
  console.log("  --consumer name   Required receiving agent or role; must match the handoff recipient");
  console.log("  --json            Emit the review-handoff receipt JSON");
  console.log([
    "\nBoundary: reads one explicit JSON file and writes nothing.",
    "The receipt proves contract validation only; identity, transport, acceptance, target-repository intake, and implementation remain unverified.",
  ].join("\n"));
}

export async function runReviewHandoffVerify(args) {
  const parsed = parseReviewHandoffReceiptArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }
  const receipt = verifyReviewHandoffFromFile(parsed);
  if (parsed.json) {
    console.log(JSON.stringify(receipt, null, 2));
    return;
  }
  header("design-ai review-handoff-verify", "Consumer validation receipt");
  info(`Consumer: ${receipt.consumer.name}`);
  info(`Status: ${receipt.status}`);
  console.log();
  console.log(renderReviewHandoffReceiptMarkdown(receipt));
}
