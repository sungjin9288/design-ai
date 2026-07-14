import { header } from "../lib/log.mjs";
import {
  buildReviewPackResult,
  parseReviewPackArgs,
  renderReviewPackMarkdown,
} from "../lib/review-pack.mjs";

function printHelp() {
  console.log("Usage:  design-ai review-pack [id] [--json]\n");
  console.log("Lists or prints the versioned Korean product review packs used by inspect.\n");
  console.log("Options:");
  console.log("  --json   Emit the canonical pack or pack-list JSON");
  console.log("\nUse a pack during inspection with: design-ai inspect page.html --brief text --review-pack korean-fintech");
  console.log("Boundary: reads shipped pack definitions only; does not inspect a repository, open a browser, write files, or mutate a target repository.");
}

export async function runReviewPack(args) {
  const parsed = parseReviewPackArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }
  const result = buildReviewPackResult(parsed);
  if (parsed.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  header("design-ai review-pack", parsed.id || "Korean product review packs");
  console.log();
  console.log(renderReviewPackMarkdown(result));
}
