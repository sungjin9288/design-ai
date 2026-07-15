import { header, info } from "../lib/log.mjs";
import {
  parseImplementationScopeArgs,
  proposeImplementationScopeFromFiles,
  renderImplementationScopeProposalMarkdown,
} from "../lib/implementation-scope.mjs";

function printHelp() {
  console.log("Usage:  design-ai review-scope <target-intake.json> --request scope-request.json --consumer name [--json]\n");
  console.log("Builds one immutable implementation-scope proposal without reading application source.\n");
  console.log("Options:");
  console.log("  --request file    Required design-ai-implementation-scope-request v1 JSON");
  console.log("  --consumer name   Required consumer; must match the target intake");
  console.log("  --json            Emit the scope proposal JSON");
  console.log([
    "\nBoundary: reads only the two explicit JSON files and writes nothing.",
    "Source inspection, target mutation, external writes, commit, push, and deployment remain unapproved.",
  ].join("\n"));
}

export async function runReviewScope(args) {
  const parsed = parseImplementationScopeArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }
  const proposal = proposeImplementationScopeFromFiles(parsed);
  if (parsed.json) {
    console.log(JSON.stringify(proposal, null, 2));
    return;
  }
  header("design-ai review-scope", "Implementation scope proposal");
  info(`Status: ${proposal.status}`);
  info(`Target: ${proposal.baseline.targetPath}`);
  console.log();
  console.log(renderImplementationScopeProposalMarkdown(proposal));
}
