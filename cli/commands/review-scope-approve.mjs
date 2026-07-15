import { header, info } from "../lib/log.mjs";
import {
  approveImplementationScopeFromFile,
  parseImplementationScopeApprovalArgs,
  renderImplementationScopeApprovalMarkdown,
} from "../lib/implementation-scope.mjs";

function printHelp() {
  console.log("Usage:  design-ai review-scope-approve <scope-proposal.json> --approver name --approval-ref text --approved-at ISO --yes [--json]\n");
  console.log("Records a separate approval for one exact implementation-scope proposal.\n");
  console.log("Options:");
  console.log("  --approver name     Required self-declared approving person or role");
  console.log("  --approval-ref text Required human-readable approval evidence reference");
  console.log("  --approved-at ISO   Required approval timestamp");
  console.log("  --yes               Required explicit confirmation");
  console.log("  --json              Emit the scope approval JSON");
  console.log([
    "\nBoundary: reads one explicit proposal JSON file and writes nothing.",
    "Only approved source selectors and target-file mutation are authorized for P11.",
    "External writes, commit, push, deployment, and external-state migration remain separately gated.",
  ].join("\n"));
}

export async function runReviewScopeApprove(args) {
  const parsed = parseImplementationScopeApprovalArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }
  const approval = approveImplementationScopeFromFile(parsed);
  if (parsed.json) {
    console.log(JSON.stringify(approval, null, 2));
    return;
  }
  header("design-ai review-scope-approve", "Implementation scope approval");
  info(`Status: ${approval.status}`);
  info(`Approver: ${approval.approver.name}`);
  console.log();
  console.log(renderImplementationScopeApprovalMarkdown(approval));
}
