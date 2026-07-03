// `design-ai search` — search the local design-ai markdown corpus.

import { DESIGN_AI_HOME } from "../lib/paths.mjs";
import { dim, header, info, warn } from "../lib/log.mjs";
import { configuredEmbeddingProvider, defaultConfigFile } from "../lib/local-config.mjs";
import { embeddingRerankSearch, rankedSearchCorpus } from "../lib/search-ranked.mjs";
import { formatSearchJson, parseSearchArgs, searchCorpus } from "../lib/search.mjs";

function printHelp() {
  console.log("Usage:  design-ai search <query> [--limit N] [--dir kind] [--ranked] [--embeddings [--provider \"cmd args\"]] [--json]\n");
  console.log("Searches markdown files across knowledge, examples, skills, docs, agents, and commands.\n");
  console.log("Options:");
  console.log("  --limit N   Maximum hits to return, 1-500. Default: 20");
  console.log("  --dir kind  Restrict to one corpus directory. Repeatable.");
  console.log("              kind: knowledge, examples, skills, docs, agents, commands");
  console.log("  --ranked    Rank results with the deterministic lexical (BM25-style) scorer");
  console.log("  --embeddings          Rerank ranked results with the opt-in local embedding backend.");
  console.log("                        Requires --ranked and a configured provider; falls back to the");
  console.log("                        lexical ranking (with a notice) if no provider or sidecar is available");
  console.log("  --provider \"cmd args\" Embedding provider command for this invocation (overrides config)");
  console.log("  --json      Emit machine-readable results");
}

function parseProviderFlag(value) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  return { command: parts[0], args: parts.slice(1) };
}

function resolveProvider({ flagProvider, configFile }) {
  if (flagProvider) return parseProviderFlag(flagProvider);
  return configuredEmbeddingProvider(configFile);
}

function printHits(hits) {
  for (const hit of hits) {
    console.log(`${hit.relPath}:${hit.lineNumber}`);
    console.log(`  ${dim(hit.preview)}`);
  }
}

function printRankedHits(query, hits, backend) {
  header("design-ai search", `${query} (ranked, ${backend})`);
  info(`Source: ${DESIGN_AI_HOME}`);
  info(`Hits: ${hits.length}`);
}

export async function runSearch(args) {
  const parsed = parseSearchArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  if (parsed.embeddings && !parsed.ranked) {
    throw new Error("--embeddings requires --ranked");
  }

  if (!parsed.query) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  if (parsed.ranked) {
    let backend = "lexical";
    let notice = "";
    let hits;

    if (parsed.embeddings) {
      const provider = resolveProvider({ flagProvider: parsed.provider, configFile: defaultConfigFile() });
      const reranked = embeddingRerankSearch({
        query: parsed.query,
        provider,
        designAiPath: DESIGN_AI_HOME,
        dirs: parsed.dirs,
        limit: parsed.limit,
      });
      if (reranked.fallback) {
        notice = `embeddings unavailable, using lexical ranking: ${reranked.notice}`;
        const lexical = rankedSearchCorpus({
          query: parsed.query,
          designAiPath: DESIGN_AI_HOME,
          dirs: parsed.dirs,
          limit: parsed.limit,
        });
        hits = lexical.hits;
      } else {
        backend = "embeddings";
        hits = reranked.hits;
      }
    } else {
      const lexical = rankedSearchCorpus({
        query: parsed.query,
        designAiPath: DESIGN_AI_HOME,
        dirs: parsed.dirs,
        limit: parsed.limit,
      });
      hits = lexical.hits;
      notice = lexical.notice;
    }

    if (parsed.json) {
      const payload = { query: parsed.query, ranked: true, notice, hits };
      if (parsed.embeddings) payload.backend = backend;
      console.log(formatSearchJson(payload));
      return;
    }

    if (parsed.embeddings) {
      printRankedHits(parsed.query, hits, backend);
    } else {
      header("design-ai search", `${parsed.query} (ranked)`);
      info(`Source: ${DESIGN_AI_HOME}`);
      info(`Hits: ${hits.length}`);
    }
    if (notice) info(notice);
    console.log();
    if (hits.length === 0) {
      warn("No matches found.");
      return;
    }
    for (const hit of hits) {
      console.log(`${hit.relPath}  (score ${hit.score}, matched: ${hit.matchedTokens.join(", ")})`);
      console.log(`  ${dim(hit.preview)}`);
    }
    return;
  }

  const hits = searchCorpus({
    query: parsed.query,
    designAiPath: DESIGN_AI_HOME,
    dirs: parsed.dirs,
    limit: parsed.limit,
  });

  if (parsed.json) {
    console.log(formatSearchJson({ query: parsed.query, hits }));
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
