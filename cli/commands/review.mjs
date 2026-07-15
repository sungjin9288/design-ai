import { header, info } from "../lib/log.mjs";
import { DESIGN_AI_HOME, SYMLINK_PREFIX } from "../lib/paths.mjs";
import {
  buildReviewReport,
  formatReviewJson,
  parseReviewArgs,
  renderReviewMarkdown,
} from "../lib/review.mjs";

function printHelp() {
  console.log("Usage:  design-ai review <source.html> --brief text [context options] [--json]\n");
  console.log("Builds one canonical read-only plan and static design quality review.\n");
  console.log("Review options:");
  console.log("  --brief text       Required review brief");
  console.log("  --name name        Optional subject name; defaults to the file name");
  console.log("  --locale locale    Review locale. Default: en");
  console.log("  --viewport name    Declared viewport; repeat as needed. Defaults: mobile, desktop");
  console.log("  --review-pack id   Apply one shipped Korean product review pack");
  console.log("Context options:");
  console.log("  --site-name name   Declare a site name without creating a workspace");
  console.log("  --repo-url url     Declare a repository URL without fetching it");
  console.log("  --local-path path  Declare a repository path without reading it");
  console.log("  --url url          Declare a page URL without opening it");
  console.log("  --screenshot ref   Declare a screenshot reference; repeat as needed");
  console.log("  --json             Emit the canonical review-workflow JSON");
  console.log([
    "\nBoundary: reads one explicit HTML file and shipped design-ai corpus files only.",
    "It does not run a browser, write files, mutate a target repository, or call an external service.",
  ].join("\n"));
}

export async function runReview(args) {
  const parsed = parseReviewArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  const workflow = buildReviewReport(parsed, {
    sourceRoot: DESIGN_AI_HOME,
    prefix: SYMLINK_PREFIX,
  });
  if (parsed.json) {
    console.log(formatReviewJson(workflow));
    return;
  }

  header("design-ai review", "Canonical read-only review workflow");
  info(`Quality: ${workflow.report.summary.status}`);
  info(`Next: ${workflow.nextAction.id} (${workflow.nextAction.status})`);
  console.log();
  console.log(renderReviewMarkdown(workflow));
}
