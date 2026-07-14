import { resolveBriefInput } from "../lib/brief.mjs";
import { header, info } from "../lib/log.mjs";
import { DESIGN_AI_HOME, SYMLINK_PREFIX } from "../lib/paths.mjs";
import { buildStartPayload } from "../lib/start-operation.mjs";
import { formatStartJson, parseStartArgs, renderStartMarkdown } from "../lib/start.mjs";

function printHelp() {
  console.log("Usage:  design-ai start <brief> [context options] [--route id] [--json]");
  console.log("        design-ai start --from-file brief.md [context options] [--json]");
  console.log("        cat brief.md | design-ai start --stdin [context options] [--json]\n");
  console.log("Builds a read-only route, DESIGN.md contract, review playbook, and next-step plan.\n");
  console.log("Context options:");
  console.log("  --site-name name   Site name used only to prepare a Website Improvement command");
  console.log("  --repo-url url     Declare a repository URL without fetching it");
  console.log("  --local-path path  Declare an absolute local repository path without reading it");
  console.log("  --url url          Declare a page URL without opening it");
  console.log("  --screenshot ref   Declare a screenshot path or URL; repeat as needed");
  console.log("  --locale locale    Declare a locale such as ko-KR");
  console.log("  --viewport name    Declare a viewport; repeat as needed");
  console.log("  --route id         Force a route id from `design-ai routes`");
  console.log("  --json             Emit the canonical start payload");
}

export async function runStart(args) {
  const parsed = parseStartArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  let brief = "";
  try {
    brief = resolveBriefInput(parsed);
  } catch (error) {
    if (error.message === "Brief is empty") {
      printHelp();
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const payload = buildStartPayload({
    brief,
    sourceRoot: DESIGN_AI_HOME,
    prefix: SYMLINK_PREFIX,
    routeId: parsed.routeId,
    context: {
      siteName: parsed.siteName,
      repoUrl: parsed.repoUrl,
      localPath: parsed.localPath,
      url: parsed.url,
      screenshots: parsed.screenshots,
      locale: parsed.locale,
      viewports: parsed.viewports,
    },
  });

  if (parsed.json) {
    console.log(formatStartJson(payload));
    return;
  }

  header("design-ai start", "Read-only design entry plan");
  info(`Route: ${payload.route.id}`);
  info(`Next: ${payload.pathway.id} (${payload.pathway.status})`);
  console.log();
  console.log(renderStartMarkdown(payload));
}
