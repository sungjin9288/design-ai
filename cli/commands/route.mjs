// `design-ai route` — recommend commands, skills, and knowledge for a task brief.

import { DESIGN_AI_HOME } from "../lib/paths.mjs";
import { dim, header, info, warn } from "../lib/log.mjs";
import { resolveBriefInput } from "../lib/brief.mjs";
import { parseRouteArgs, readRouteManifestVersion, routeBrief, routeCatalog } from "../lib/route.mjs";

function printHelp() {
  console.log("Usage:  design-ai route <brief> [--limit N] [--explain] [--json]");
  console.log("        design-ai route --from-file brief.md [--json]");
  console.log("        design-ai route --list [--json]");
  console.log("        cat brief.md | design-ai route --stdin\n");
  console.log("Recommends the best design-ai command, skill, and knowledge files for a task brief.\n");
  console.log("Examples:");
  console.log("  design-ai route \"audit a Figma signup flow for Korean fintech\"");
  console.log("  design-ai route \"spec a Button component\" --explain");
  console.log("  design-ai route --list");
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

export async function runRoute(args) {
  const parsed = parseRouteArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  if (parsed.list) {
    const routes = routeCatalog({ sourceRoot: DESIGN_AI_HOME });
    const payload = {
      version: readRouteManifestVersion(DESIGN_AI_HOME),
      routes,
    };

    if (parsed.json) {
      console.log(JSON.stringify(payload, null, 2));
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
  });

  const payload = {
    brief,
    version: readRouteManifestVersion(DESIGN_AI_HOME),
    routes,
  };

  if (parsed.json) {
    console.log(JSON.stringify(payload, null, 2));
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
