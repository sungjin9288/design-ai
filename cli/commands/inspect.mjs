import { header, info } from "../lib/log.mjs";
import {
  buildInspectReport,
  formatInspectJson,
  parseInspectArgs,
  renderInspectMarkdown,
} from "../lib/inspect.mjs";

function printHelp() {
  console.log("Usage:  design-ai inspect <source.html> --brief text [--name name] [--locale locale] [--viewport name] [--review-pack id] [--json]\n");
  console.log("Builds a canonical read-only design quality report from one explicit HTML file.\n");
  console.log("Options:");
  console.log("  --brief text       Required review brief");
  console.log("  --name name        Optional subject name; defaults to the file name");
  console.log("  --locale locale    Review locale. Default: en");
  console.log("  --viewport name    Declared viewport; repeat as needed. Defaults: mobile, desktop");
  console.log("  --review-pack id   Apply one shipped Korean product review pack");
  console.log("  --json             Emit the canonical quality-report JSON");
  console.log("\nBoundary: reads only the selected HTML file; does not execute scripts, open a browser, follow links, write files, or mutate a target repository.");
}

export async function runInspect(args) {
  const parsed = parseInspectArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  const report = buildInspectReport(parsed);
  if (parsed.json) {
    console.log(formatInspectJson(report));
    return;
  }

  header("design-ai inspect", "Read-only static HTML review");
  info(`Status: ${report.summary.status}`);
  info(`Source: ${report.subject.source}`);
  console.log();
  console.log(renderInspectMarkdown(report));
}
