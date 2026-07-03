// `design-ai index` — build, inspect, and verify the local retrieval index.
// Explicit-only: nothing here runs in the background or on behalf of other commands.

import { DESIGN_AI_HOME } from "../lib/paths.mjs";
import { dim, header, info, success, warn } from "../lib/log.mjs";
import {
  buildEmbeddingIndex,
  embeddingIndexStatus,
  loadEmbeddingIndexFile,
  writeEmbeddingIndex,
} from "../lib/embedding-index.mjs";
import { configuredEmbeddingProvider, defaultConfigFile } from "../lib/local-config.mjs";
import {
  buildCorpusIndex,
  buildLearningIndex,
  defaultIndexDir,
  retrievalIndexStatus,
  verifyRetrievalIndexes,
  writeRetrievalIndexes,
} from "../lib/retrieval-index.mjs";
import { defaultLearningFile } from "../lib/learn-shared.mjs";
import { unknownOptionMessage } from "../lib/suggest.mjs";

const INDEX_OPTIONS = ["-h", "--help", "--build", "--status", "--verify", "--json", "--embeddings", "--provider"];

// A bare --provider command string is split on spaces (documented here and in
// printHelp): "python3 embed.py --quiet" -> command "python3", args ["embed.py",
// "--quiet"]. Providers whose command or args need spaces/quoting should be
// configured via ~/.design-ai/config.json embeddings.provider.args instead — that
// is the robust path; --provider is the quick one-shot override.
function parseProviderFlag(value) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  return { command: parts[0], args: parts.slice(1) };
}

export function parseIndexArgs(args) {
  const out = { action: "status", json: false, help: false, embeddings: false, provider: "" };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--json") {
      out.json = true;
    } else if (arg === "--build") {
      out.action = "build";
    } else if (arg === "--status") {
      out.action = "status";
    } else if (arg === "--verify") {
      out.action = "verify";
    } else if (arg === "--embeddings") {
      out.embeddings = true;
    } else if (arg === "--provider") {
      out.provider = args[i + 1] || "";
      i += 1;
    } else {
      throw new Error(unknownOptionMessage("index", arg, INDEX_OPTIONS));
    }
  }
  return out;
}

function printHelp() {
  console.log("Usage:  design-ai index [--build|--status|--verify] [--json] [--embeddings [--provider \"cmd args\"]]\n");
  console.log("Manages the local retrieval index (derived, rebuildable cache files).");
  console.log("Index files stay on this machine and are safe to delete at any time.\n");
  console.log("Options:");
  console.log("  --build     Build/refresh the corpus + learning retrieval index (explicit, never background)");
  console.log("  --status    Report index paths, digests, staleness, and document counts. Default action");
  console.log("  --verify    Rebuild in memory and compare against the stored index; read-only");
  console.log("  --json      Emit machine-readable output");
  console.log("  --embeddings          Also build the opt-in local embedding sidecar (requires a provider)");
  console.log("  --provider \"cmd args\" Embedding provider command for this invocation (overrides config).");
  console.log("                        Split on spaces; for commands needing quoting, use the config file's");
  console.log("                        embeddings.provider.args array instead (~/.design-ai/config.json)");
  console.log("\nEmbeddings are never built by default: --embeddings requires a provider from --provider or");
  console.log("~/.design-ai/config.json (embeddings.provider), and both a config AND the --embeddings flag");
  console.log("are required — config alone never silently enables it.");
}

function statusLine(label, entry) {
  if (!entry.present) return `${label}: missing (run design-ai index --build)`;
  if (entry.error) return `${label}: unreadable — ${entry.error}`;
  const freshness = entry.fresh ? "fresh" : "stale (run design-ai index --build)";
  return `${label}: ${freshness} — ${entry.documentCount} documents, generated ${entry.generatedAt}`;
}

function embeddingsStatusLine(embeddings) {
  if (!embeddings) return "Embeddings: not built (opt-in; design-ai index --build --embeddings --provider ...)";
  if (embeddings.error) return `Embeddings: unreadable — ${embeddings.error}`;
  const freshness = embeddings.fresh ? "fresh" : "stale (run design-ai index --build --embeddings)";
  const providerLabel = embeddings.provider ? ` (provider: ${embeddings.provider.command})` : "";
  return `Embeddings: ${freshness} — ${embeddings.documentCount} vectors, generated ${embeddings.generatedAt}${providerLabel}`;
}

function printStatus(status) {
  header("design-ai index", "status");
  info(`Index dir: ${status.indexDir}`);
  info(statusLine("Corpus index", status.corpus));
  info(statusLine("Learning index", status.learning));
  info(embeddingsStatusLine(status.embeddings));
  if (status.fresh) {
    success("Index is fresh.");
  } else {
    warn(`Index is not fresh. Rebuild with: ${status.buildCommand}`);
  }
}

function resolveProvider({ flagProvider, configFile }) {
  if (flagProvider) return { provider: parseProviderFlag(flagProvider), source: "flag" };
  const configured = configuredEmbeddingProvider(configFile);
  if (configured) return { provider: configured, source: "config" };
  return { provider: null, source: "" };
}

function embeddingsUnavailableError({ configFile }) {
  return [
    "--embeddings requires a provider: pass --provider \"command args\" for this invocation,",
    `or configure embeddings.provider in ${configFile} (see docs/AI-LEARNING-PHASE2.md, Phase B).`,
  ].join("\n");
}

// index --status embeddings section shape (nullable, present only when the sidecar
// file exists): { file, present, fresh, sourceMatch, generatedAt, documentCount,
// provider, storedDigest, currentDigest, error }. Positioned after "learning" and
// before top-level "fresh" in the JSON payload (documented contract).
function embeddingsStatusSection(context) {
  const raw = embeddingIndexStatus(context);
  if (!raw.present) return null;
  return raw;
}

export async function runIndex(args) {
  const parsed = parseIndexArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  const context = {
    designAiPath: DESIGN_AI_HOME,
    indexDir: defaultIndexDir(),
    learningFile: defaultLearningFile(),
  };
  const configFile = defaultConfigFile();

  if (parsed.action === "build") {
    const corpus = buildCorpusIndex({ designAiPath: context.designAiPath });
    const learning = buildLearningIndex({ filePath: context.learningFile });
    const written = writeRetrievalIndexes({ indexDir: context.indexDir, corpus, learning });

    let embeddingsResult = null;
    if (parsed.embeddings) {
      const { provider } = resolveProvider({ flagProvider: parsed.provider, configFile });
      if (!provider) {
        embeddingsResult = { ok: false, error: embeddingsUnavailableError({ configFile }) };
      } else {
        const built = buildEmbeddingIndex({
          provider,
          designAiPath: context.designAiPath,
          learningFile: context.learningFile,
        });
        if (built.ok) {
          const writtenEmbeddings = writeEmbeddingIndex({ indexDir: context.indexDir, payload: built.payload });
          embeddingsResult = {
            ok: true,
            file: writtenEmbeddings.file,
            documentCount: built.payload.vectors.length,
            provider: { command: built.payload.provider.command, modelLabel: built.payload.provider.modelLabel, dimensions: built.payload.provider.dimensions },
          };
        } else {
          embeddingsResult = { ok: false, error: built.error };
        }
      }
    }

    if (parsed.json) {
      const payload = {
        action: "build",
        indexDir: context.indexDir,
        corpus: { file: written.corpusFile, documentCount: corpus.stats.documentCount, digest: corpus.source.corpusDigest },
        learning: { file: written.learningFile, documentCount: learning.stats.documentCount, digest: learning.source.learningDigest },
      };
      if (embeddingsResult) payload.embeddings = embeddingsResult;
      console.log(JSON.stringify(payload, null, 2));
      if (embeddingsResult && !embeddingsResult.ok) process.exitCode = 1;
      return;
    }

    header("design-ai index", "build");
    info(`Corpus index: ${written.corpusFile} (${corpus.stats.documentCount} documents)`);
    info(`Learning index: ${written.learningFile} (${learning.stats.documentCount} entries)`);
    success("Index built.");
    if (embeddingsResult) {
      if (embeddingsResult.ok) {
        success(`Embedding index built: ${embeddingsResult.file} (${embeddingsResult.documentCount} vectors)`);
      } else {
        warn(`Embedding index not built: ${embeddingsResult.error}`);
        process.exitCode = 1;
      }
    }
    return;
  }

  if (parsed.action === "verify") {
    const verify = verifyRetrievalIndexes(context);
    const embeddings = embeddingsStatusSection(context);
    let embeddingsCheck = null;
    if (embeddings) {
      if (embeddings.error) {
        embeddingsCheck = { name: "embeddings", file: embeddings.file, matches: false, reason: embeddings.error };
      } else {
        const { provider } = resolveProvider({ flagProvider: parsed.provider, configFile });
        if (!provider) {
          embeddingsCheck = {
            name: "embeddings",
            file: embeddings.file,
            matches: true,
            skipped: true,
            reason: "skipped: provider unavailable (pass --provider or configure ~/.design-ai/config.json to verify embedding content)",
          };
        } else {
          const rebuilt = buildEmbeddingIndex({
            provider,
            designAiPath: context.designAiPath,
            learningFile: context.learningFile,
          });
          if (!rebuilt.ok) {
            embeddingsCheck = {
              name: "embeddings",
              file: embeddings.file,
              matches: true,
              skipped: true,
              reason: `skipped: provider unavailable (${rebuilt.error})`,
            };
          } else {
            const stored = loadEmbeddingIndexFile(embeddings.file);
            const normalize = (payload) => {
              const { generatedAt, ...rest } = payload || {};
              return JSON.stringify(rest);
            };
            const matches = normalize(stored.payload) === normalize(rebuilt.payload);
            embeddingsCheck = {
              name: "embeddings",
              file: embeddings.file,
              matches,
              reason: matches ? "" : "stored embedding index differs from an in-memory rebuild of its sources",
            };
          }
        }
      }
      verify.checks.push(embeddingsCheck);
      verify.ok = verify.ok && (embeddingsCheck.matches !== false);
    }

    if (parsed.json) {
      console.log(JSON.stringify({ action: "verify", ...verify }, null, 2));
    } else {
      header("design-ai index", "verify");
      for (const check of verify.checks) {
        if (check.matches) {
          info(check.skipped ? `${check.name}: ${check.reason}` : `${check.name}: matches an in-memory rebuild`);
        } else {
          warn(`${check.name}: ${check.reason}`);
          console.log(`  ${dim(check.file)}`);
        }
      }
      if (verify.ok) success("Stored index matches its sources.");
    }
    if (!verify.ok) process.exitCode = 1;
    return;
  }

  const status = retrievalIndexStatus(context);
  const embeddings = embeddingsStatusSection(context);
  const fresh = embeddings ? status.fresh && embeddings.fresh : status.fresh;
  // Key order is a documented contract (embeddings sits after learning, before
  // fresh) — build the object explicitly rather than relying on spread order.
  const fullStatus = {
    indexDir: status.indexDir,
    corpus: status.corpus,
    learning: status.learning,
    embeddings,
    fresh,
    buildCommand: status.buildCommand,
  };
  if (parsed.json) {
    console.log(JSON.stringify({ action: "status", ...fullStatus }, null, 2));
    return;
  }
  printStatus(fullStatus);
}
