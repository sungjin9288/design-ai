// `design-ai index` — build, inspect, and verify the local retrieval index.
// Explicit-only: nothing here runs in the background or on behalf of other commands.

import { DESIGN_AI_HOME } from "../lib/paths.mjs";
import { dim, header, info, success, warn } from "../lib/log.mjs";
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

const INDEX_OPTIONS = ["-h", "--help", "--build", "--status", "--verify", "--json"];

export function parseIndexArgs(args) {
  const out = { action: "status", json: false, help: false };
  for (const arg of args) {
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
    } else {
      throw new Error(unknownOptionMessage("index", arg, INDEX_OPTIONS));
    }
  }
  return out;
}

function printHelp() {
  console.log("Usage:  design-ai index [--build|--status|--verify] [--json]\n");
  console.log("Manages the local retrieval index (derived, rebuildable cache files).");
  console.log("Index files stay on this machine and are safe to delete at any time.\n");
  console.log("Options:");
  console.log("  --build     Build/refresh the corpus + learning retrieval index (explicit, never background)");
  console.log("  --status    Report index paths, digests, staleness, and document counts. Default action");
  console.log("  --verify    Rebuild in memory and compare against the stored index; read-only");
  console.log("  --json      Emit machine-readable output");
}

function statusLine(label, entry) {
  if (!entry.present) return `${label}: missing (run design-ai index --build)`;
  if (entry.error) return `${label}: unreadable — ${entry.error}`;
  const freshness = entry.fresh ? "fresh" : "stale (run design-ai index --build)";
  return `${label}: ${freshness} — ${entry.documentCount} documents, generated ${entry.generatedAt}`;
}

function printStatus(status) {
  header("design-ai index", "status");
  info(`Index dir: ${status.indexDir}`);
  info(statusLine("Corpus index", status.corpus));
  info(statusLine("Learning index", status.learning));
  if (status.fresh) {
    success("Index is fresh.");
  } else {
    warn(`Index is not fresh. Rebuild with: ${status.buildCommand}`);
  }
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

  if (parsed.action === "build") {
    const corpus = buildCorpusIndex({ designAiPath: context.designAiPath });
    const learning = buildLearningIndex({ filePath: context.learningFile });
    const written = writeRetrievalIndexes({ indexDir: context.indexDir, corpus, learning });
    if (parsed.json) {
      console.log(JSON.stringify({
        action: "build",
        indexDir: context.indexDir,
        corpus: { file: written.corpusFile, documentCount: corpus.stats.documentCount, digest: corpus.source.corpusDigest },
        learning: { file: written.learningFile, documentCount: learning.stats.documentCount, digest: learning.source.learningDigest },
      }, null, 2));
      return;
    }
    header("design-ai index", "build");
    info(`Corpus index: ${written.corpusFile} (${corpus.stats.documentCount} documents)`);
    info(`Learning index: ${written.learningFile} (${learning.stats.documentCount} entries)`);
    success("Index built.");
    return;
  }

  if (parsed.action === "verify") {
    const verify = verifyRetrievalIndexes(context);
    if (parsed.json) {
      console.log(JSON.stringify({ action: "verify", ...verify }, null, 2));
    } else {
      header("design-ai index", "verify");
      for (const check of verify.checks) {
        if (check.matches) {
          info(`${check.name}: matches an in-memory rebuild`);
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
  if (parsed.json) {
    console.log(JSON.stringify({ action: "status", ...status }, null, 2));
    return;
  }
  printStatus(status);
}
