import { header, info } from "../lib/log.mjs";
import {
  compareReviewReportFiles,
  parseReviewComparisonArgs,
  renderReviewComparisonMarkdown,
  summarizeReviewComparison,
} from "../lib/review-comparison.mjs";

function printHelp() {
  console.log("Usage:  design-ai review-compare <baseline-quality-report.json> --candidate candidate-quality-report.json [--compact] [--json]\n");
  console.log("Compares two exact canonical quality reports without changing the project.\n");
  console.log("Options:");
  console.log("  --candidate file Required post-change design-ai-quality-report v1 JSON");
  console.log("  --compact        Omit duplicated source bodies from JSON output");
  console.log("  --json           Emit machine-readable comparison JSON");
  console.log("\nBoundary: reads two explicit JSON files only. It writes nothing, changes no repository, calls no network, and does not establish production quality or adoption.");
}

export async function runReviewCompare(args) {
  const parsed = parseReviewComparisonArgs(args);
  if (parsed.help) return printHelp();
  const comparison = compareReviewReportFiles(parsed);
  const output = parsed.compact ? summarizeReviewComparison(comparison) : comparison;
  if (parsed.json) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }
  header("design-ai review-compare", "Verified design iteration");
  info(`Status: ${comparison.status}`);
  info(`Subject: ${comparison.context.subject.name}`);
  console.log();
  console.log(renderReviewComparisonMarkdown(comparison));
}
