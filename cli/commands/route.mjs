// `design-ai route` — recommend commands, skills, and knowledge for a task brief.

import { DESIGN_AI_HOME } from "../lib/paths.mjs";
import { dim, header, info, warn } from "../lib/log.mjs";
import { resolveBriefInput } from "../lib/brief.mjs";
import {
  buildRouteEvalTemplate,
  formatRouteJson,
  parseRouteArgs,
  readRouteManifestVersion,
  routeBrief,
  routeCatalog,
  routeEvalReport,
} from "../lib/route.mjs";

function printHelp() {
  console.log("Usage:  design-ai route <brief> [--limit N] [--explain] [--json]");
  console.log("        design-ai route --from-file brief.md [--limit N] [--explain] [--json]");
  console.log("        design-ai route --list [--json]");
  console.log("        design-ai route --eval-template [--json]");
  console.log("        design-ai route --eval --from-file route-eval.json [--strict] [--json]");
  console.log("        cat route-eval.json | design-ai route --eval --stdin [--strict] [--json]");
  console.log("        cat brief.md | design-ai route --stdin [--limit N] [--explain] [--json]\n");
  console.log("Recommends the best design-ai command, skill, and knowledge files for a task brief.");
  console.log("Route eval is read-only and checks deterministic agent routing fixtures.\n");
  console.log("Options:");
  console.log("  --from-file file  Read the task brief, or route eval JSON with --eval, from a file");
  console.log("  --stdin           Read the task brief, or route eval JSON with --eval, from standard input");
  console.log("  --list            List route ids without scoring a brief");
  console.log("  --limit N         Maximum route recommendations to return, 1-10. Default: 3");
  console.log("  --explain         Include route scoring, reference coverage, and related knowledge");
  console.log("  --eval-template   Generate a runnable route eval checkpoint JSON template");
  console.log("  --eval            Run deterministic route-selection checkpoint cases");
  console.log("  --strict          With --eval, exit non-zero on warning or failure");
  console.log("  --json            Emit machine-readable route results");
  console.log("");
  console.log("Examples:");
  console.log("  design-ai route \"audit a Figma signup flow for Korean fintech\"");
  console.log("  design-ai route \"spec a Button component\" --explain");
  console.log("  design-ai route --list");
  console.log("  design-ai route --eval-template --json > route-eval.json");
  console.log("  design-ai route --eval --from-file route-eval.json --strict --json");
  console.log("  design-ai route --from-file product-brief.md");
  console.log("  design-ai route \"spec a Button component\" --json");
}

function formatPath(entry) {
  const mark = entry.exists ? "✓" : "!";
  return `${mark} ${entry.path}`;
}

function printRoute(route, index, explain = false) {
  console.log(`${index + 1}. ${route.label} ${dim(`(${route.confidence}, score ${route.score})`)}`);
  console.log(`   id:      ${route.id}`);
  if (route.matchedKeywords.length > 0) {
    console.log(`   matched: ${route.matchedKeywords.join(", ")}`);
  } else if (route.fallback) {
    console.log("   matched: fallback route");
  }
  if (explain) {
    const coverage = route.explanation.referenceCoverage.total;
    console.log(`   why:     ${route.explanation.summary}`);
    console.log(`   refs:    ${coverage.available}/${coverage.total} available`);
    if (route.explanation.missingReferences.length > 0) {
      console.log(`   missing: ${route.explanation.missingReferences.join(", ")}`);
    }
  }

  if (route.command) {
    console.log(`   command: ${formatPath(route.command)}`);
  }
  for (const skill of route.skills) {
    console.log(`   skill:   ${formatPath(skill)}`);
  }
  for (const agent of route.agents) {
    console.log(`   agent:   ${formatPath(agent)}`);
  }
  for (const knowledge of route.knowledge) {
    console.log(`   read:    ${formatPath(knowledge)}`);
  }

  if (explain) {
    const related = route.relatedKnowledge || [];
    if (related.length === 0) {
      console.log("   related: (none)");
    } else {
      for (const item of related) {
        console.log(`   related: ${item.id} ${dim(`(score ${item.score.toFixed(2)})`)}`);
      }
    }
  }
}

function printCatalogRoute(route, index) {
  console.log(`${index + 1}. ${route.id} ${dim(route.label)}`);
  if (route.command) {
    console.log(`   command: ${formatPath(route.command)}`);
  }
  if (route.skills.length > 0) {
    console.log(`   skills:  ${route.skills.map((skill) => skill.path).join(", ")}`);
  }
  if (route.keywords.length > 0) {
    console.log(`   matches: ${route.keywords.slice(0, 8).join(", ")}`);
  }
}

function printRouteEvalTemplate(template) {
  header("design-ai route", "Route eval checkpoint template");
  info(`Source: ${DESIGN_AI_HOME}`);
  info(`Corpus version: ${template.sourceRouteVersion}`);
  info(`Cases: ${template.cases.length}`);
  console.log();
  console.log("Write the JSON below to a file, edit cases if needed, then run:");
  console.log("design-ai route --eval --from-file route-eval.json --strict");
  console.log();
  console.log(formatRouteJson(template));
}

function printRouteEvalReport(report) {
  header("design-ai route", "Route eval report");
  info(`Source: ${report.source}`);
  info(`Corpus version: ${report.version}`);
  info(`Status: ${report.status}`);
  info(`Cases: ${report.summary.total} (${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail)`);
  console.log();

  for (const result of report.cases) {
    const top = result.topRouteId || "none";
    console.log(`${result.status.toUpperCase()} ${result.id}`);
    console.log(`   expected: ${result.expectedRouteId}`);
    console.log(`   top:      ${top} ${dim(result.topConfidence ? `(${result.topConfidence}, score ${result.topScore})` : "")}`);
    if (result.matchedKeywords.length > 0) {
      console.log(`   matched:  ${result.matchedKeywords.join(", ")}`);
    }
    console.log(`   result:   ${result.message}`);
    console.log();
  }
}

export async function runRoute(args) {
  const parsed = parseRouteArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  if (parsed.evalTemplate) {
    const template = buildRouteEvalTemplate({ sourceRoot: DESIGN_AI_HOME });
    if (parsed.json) {
      console.log(formatRouteJson(template));
      return;
    }
    printRouteEvalTemplate(template);
    return;
  }

  if (parsed.eval) {
    const evalText = resolveBriefInput(parsed);
    const report = routeEvalReport({
      evalText,
      source: parsed.fromFile || "stdin",
      sourceRoot: DESIGN_AI_HOME,
      limit: parsed.limit,
    });

    if (parsed.json) {
      console.log(formatRouteJson(report));
    } else {
      printRouteEvalReport(report);
    }

    if (parsed.strict && report.status !== "pass") {
      process.exitCode = 1;
    }
    return;
  }

  if (parsed.list) {
    const routes = routeCatalog({ sourceRoot: DESIGN_AI_HOME });
    const payload = {
      version: readRouteManifestVersion(DESIGN_AI_HOME),
      routes,
    };

    if (parsed.json) {
      console.log(formatRouteJson(payload));
      return;
    }

    header("design-ai route", "Available route ids");
    info(`Source: ${DESIGN_AI_HOME}`);
    info(`Corpus version: ${payload.version}`);
    console.log();

    for (let i = 0; i < routes.length; i += 1) {
      printCatalogRoute(routes[i], i);
      console.log();
    }
    return;
  }

  let brief = "";
  try {
    brief = resolveBriefInput(parsed);
  } catch (err) {
    if (err.message === "Brief is empty") {
      printHelp();
    } else {
      throw err;
    }
    process.exitCode = 1;
    return;
  }

  if (!brief) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const routes = routeBrief({
    brief,
    sourceRoot: DESIGN_AI_HOME,
    limit: parsed.limit,
    explain: parsed.explain,
  });

  const payload = {
    brief,
    version: readRouteManifestVersion(DESIGN_AI_HOME),
    routes,
  };

  if (parsed.json) {
    console.log(formatRouteJson(payload));
    return;
  }

  header("design-ai route", brief);
  info(`Source: ${DESIGN_AI_HOME}`);
  info(`Corpus version: ${payload.version}`);
  console.log();

  for (let i = 0; i < routes.length; i += 1) {
    printRoute(routes[i], i, parsed.explain);
    console.log();
  }

  const missing = routes.flatMap((route) => [
    ...(route.command ? [route.command] : []),
    ...route.skills,
    ...route.agents,
    ...route.knowledge,
  ]).filter((entry) => !entry.exists);

  if (missing.length > 0) {
    warn(`${missing.length} referenced path(s) are missing. Run \`design-ai doctor\`.`);
  }
}
