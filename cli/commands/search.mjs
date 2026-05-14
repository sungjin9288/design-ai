// `design-ai search` — search the local design-ai markdown corpus.

import { DESIGN_AI_HOME } from "../lib/paths.mjs";
import { dim, header, info, warn } from "../lib/log.mjs";
import { parseSearchArgs, searchCorpus } from "../lib/search.mjs";

function printHelp() {
  console.log("Usage:  design-ai search <query> [--limit N] [--dir kind] [--json]\n");
  console.log("Searches markdown files across knowledge, examples, skills, docs, agents, and commands.\n");
  console.log("Options:");
  console.log("  --limit N   Maximum hits to return, 1-500. Default: 20");
  console.log("  --dir kind  Restrict to one corpus directory. Repeatable.");
  console.log("              kind: knowledge, examples, skills, docs, agents, commands");
  console.log("  --json      Emit machine-readable results");
}

function printHits(hits) {
  for (const hit of hits) {
    console.log(`${hit.relPath}:${hit.lineNumber}`);
    console.log(`  ${dim(hit.preview)}`);
  }
}

export async function runSearch(args) {
  const parsed = parseSearchArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  if (!parsed.query) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const hits = searchCorpus({
    query: parsed.query,
    designAiPath: DESIGN_AI_HOME,
    dirs: parsed.dirs,
    limit: parsed.limit,
  });

  if (parsed.json) {
    console.log(JSON.stringify({ query: parsed.query, hits }, null, 2));
    return;
  }

  header("design-ai search", parsed.query);
  info(`Source: ${DESIGN_AI_HOME}`);
  info(`Hits: ${hits.length}`);
  console.log();

  if (hits.length === 0) {
    warn("No matches found.");
    return;
  }

  printHits(hits);
}
