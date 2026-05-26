// `design-ai check` — verify generated design artifacts against core output rules.

import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildCheckLearningCapture,
  checkAllExampleArtifacts,
  checkArtifactContent,
  checkExampleArtifacts,
  formatCheckJson,
  parseCheckArgs,
} from "../lib/check.mjs";
import { dim, error, header, info, red, success, warn } from "../lib/log.mjs";
import { DESIGN_AI_HOME } from "../lib/paths.mjs";

function printHelp() {
  console.log("Usage:  design-ai check <artifact.md> [--strict] [--json] [--route id] [--learn [--yes] [--learning-file path]]");
  console.log("        cat artifact.md | design-ai check --stdin [--strict] [--route id] [--learn [--yes] [--learning-file path]]");
  console.log("        design-ai check --examples --route id [--limit N] [--issues-only] [--strict] [--json]");
  console.log("        design-ai check --examples --all-routes [--limit N] [--issues-only] [--strict] [--json]\n");
  console.log("Checks generated design-ai Markdown artifacts for grounding, accessibility, responsive, unresolved-marker, and route-specific requirements.\n");
  console.log("Options:");
  console.log("  --stdin     Read artifact Markdown from standard input");
  console.log("  --examples  Check worked examples for the selected route");
  console.log("  --all-routes  Check worked examples for every route");
  console.log("  --route id  Add route-specific checks such as component-spec, palette-from-brand, or slide-deck");
  console.log("  --limit N   Number of route examples to check, 1-25. Default: 3");
  console.log("  --issues-only  In human output, show only warnings and failures");
  console.log("  --strict    Treat warnings as a failing exit code");
  console.log("  --learn     Capture warning/failure checks as local learning entries");
  console.log("  --yes       Apply --learn entries instead of previewing them");
  console.log("  --learning-file path  Override the learning profile used by --learn");
  console.log("  --json      Emit machine-readable check results");
}

function mark(level) {
  if (level === "pass") return "✓";
  if (level === "warn") return "!";
  return "✗";
}

function printResult(item) {
  const line = `${mark(item.level)} ${item.title}: ${item.message}`;
  if (item.level === "pass") {
    success(line.slice(2));
  } else if (item.level === "warn") {
    warn(line.slice(2));
  } else {
    error(line.slice(2));
  }
  if (item.evidence) {
    console.log(`   ${dim(item.evidence)}`);
  }
}

function printExampleResult(item) {
  const { example, report } = item;
  const title = `${example.relPath}: ${report.status} (${report.failures} fail, ${report.warnings} warn)`;
  if (report.status === "pass") {
    success(title);
  } else if (report.status === "warn") {
    warn(title);
  } else {
    error(title);
  }

  const notable = report.results.filter((resultItem) => resultItem.level !== "pass").slice(0, 3);
  for (const resultItem of notable) {
    console.log(`   ${dim(`${resultItem.id}: ${resultItem.evidence || resultItem.message}`)}`);
  }
}

function printRouteExampleSummary(routeReport, { issuesOnly = false } = {}) {
  if (issuesOnly && routeReport.status === "pass") return;

  const line = `${routeReport.routeId}: ${routeReport.status} (${routeReport.failed} fail, ${routeReport.warned} warn, ${routeReport.passed} pass)`;
  if (routeReport.status === "pass") {
    success(line);
  } else if (routeReport.status === "warn") {
    warn(line);
  } else {
    console.log(`${red("✗")}  ${line}`);
  }

  const notable = routeReport.examples
    .filter((item) => item.report.status !== "pass")
    .slice(0, 1);
  for (const item of notable) {
    console.log(`   ${dim(`${item.example.relPath}: ${item.report.status}`)}`);
    const firstIssue = item.report.results.find((resultItem) => resultItem.level !== "pass");
    if (firstIssue) {
      console.log(`   ${dim(`${firstIssue.id}: ${firstIssue.evidence || firstIssue.message}`)}`);
    }
  }
}

function printLearningCapture(capture) {
  console.log();
  console.log(capture.applied ? "Learning capture applied" : "Learning capture preview");
  info(`File: ${capture.file}`);
  info(`Source: ${capture.source}`);
  info(`Candidates: ${capture.candidateCount}`);
  info(`Added: ${capture.addedCount}`);
  info(`Skipped: ${capture.skippedCount}`);
  console.log();

  if (capture.candidateCount === 0) {
    console.log("No warning or failure check results to capture.");
    return;
  }

  if (capture.entries.length > 0) {
    console.log(capture.applied ? "Saved entries:" : "Would save:");
    for (const entry of capture.entries) {
      console.log(`- [${entry.category}] ${entry.text}`);
    }
  }

  if (capture.skipped.length > 0) {
    if (capture.entries.length > 0) console.log();
    console.log("Skipped:");
    for (const entry of capture.skipped) {
      console.log(`- [${entry.category}] ${entry.textPreview} (${entry.reason})`);
    }
  }

  if (capture.dryRun) {
    console.log();
    console.log("No changes made. Add --yes to save these learning entries.");
  }
}

export async function runCheck(args) {
  const parsed = parseCheckArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  if (parsed.examples) {
    const report = parsed.allRoutes
      ? checkAllExampleArtifacts({
        designAiPath: DESIGN_AI_HOME,
        limit: parsed.limit,
      })
      : checkExampleArtifacts({
        designAiPath: DESIGN_AI_HOME,
        routeId: parsed.routeId,
        limit: parsed.limit,
      });

    if (parsed.json) {
      console.log(formatCheckJson(report));
    } else if (parsed.allRoutes) {
      header("design-ai check examples", "all routes");
      info(`Source: ${DESIGN_AI_HOME}`);
      info(`Status: ${report.status}`);
      info(`Routes: ${report.totalRoutes} (${report.failedRoutes} fail, ${report.warnedRoutes} warn, ${report.passedRoutes} pass)`);
      info(`Examples: ${report.totalExamples} (${report.failedExamples} fail, ${report.warnedExamples} warn, ${report.passedExamples} pass)`);
      console.log();
      for (const routeReport of report.routes) {
        printRouteExampleSummary(routeReport, { issuesOnly: parsed.issuesOnly });
      }
    } else {
      header("design-ai check examples", parsed.routeId);
      info(`Source: ${DESIGN_AI_HOME}`);
      info(`Query: ${report.query}`);
      info(`Status: ${report.status}`);
      info(`Examples: ${report.total} (${report.failed} fail, ${report.warned} warn, ${report.passed} pass)`);
      if (report.message) info(report.message);
      console.log();
      const examplesToPrint = parsed.issuesOnly
        ? report.examples.filter((item) => item.report.status !== "pass")
        : report.examples;
      for (const item of examplesToPrint) {
        printExampleResult(item);
      }
    }

    if (report.status === "fail" || (parsed.strict && report.status !== "pass")) {
      process.exitCode = 1;
    }
    return;
  }

  if (!parsed.target && !parsed.stdin) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const filePath = parsed.stdin ? "stdin" : path.resolve(process.cwd(), parsed.target);
  const content = parsed.stdin ? readFileSync(0, "utf8") : readFileSync(filePath, "utf8");
  const report = checkArtifactContent({ content, filePath, routeId: parsed.routeId });
  const learningCapture = parsed.learn
    ? buildCheckLearningCapture(report, {
      filePath: parsed.learningFilePath ? path.resolve(process.cwd(), parsed.learningFilePath) : "",
      dryRun: !parsed.yes,
    })
    : null;
  const outputReport = learningCapture ? { ...report, learningCapture } : report;

  if (parsed.json) {
    console.log(formatCheckJson(outputReport));
  } else {
    header("design-ai check", parsed.stdin ? "stdin" : parsed.target);
    if (parsed.routeId) info(`Route: ${parsed.routeId}`);
    info(`Status: ${report.status}`);
    info(`Score: ${report.score} (${report.failures} fail, ${report.warnings} warn)`);
    console.log();
    const resultsToPrint = parsed.issuesOnly
      ? report.results.filter((item) => item.level !== "pass")
      : report.results;
    for (const item of resultsToPrint) {
      printResult(item);
    }
    if (learningCapture) {
      printLearningCapture(learningCapture);
    }
  }

  if (report.status === "fail" || (parsed.strict && report.status !== "pass")) {
    process.exitCode = 1;
  }
}
