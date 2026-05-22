// `design-ai learn` — manage a local learning profile for prompt personalization.

import { resolveBriefInput } from "../lib/brief.mjs";
import {
  buildLearningContext,
  formatLearningJson,
  loadLearningProfile,
  parseLearnArgs,
  rememberLearning,
} from "../lib/learn.mjs";
import { dim, header, info, success } from "../lib/log.mjs";

function printHelp() {
  console.log("Usage:  design-ai learn [--list] [--json]");
  console.log("        design-ai learn --remember text [--category kind] [--json]");
  console.log("        design-ai learn --from-file notes.md [--category kind] [--json]");
  console.log("        cat notes.md | design-ai learn --stdin [--category kind] [--json]");
  console.log("        design-ai learn --export [--json]\n");
  console.log("Stores local design preferences for explicit prompt personalization.");
  console.log("This is local memory, not model training or fine-tuning.\n");
  console.log("Options:");
  console.log("  --remember text      Remember an inline preference or project constraint");
  console.log("  --from-file file     Remember text from a markdown/text file");
  console.log("  --stdin              Remember text from standard input");
  console.log("  --category kind      preference, brand, workflow, constraint, accessibility, korean, other");
  console.log("  --list               List saved learning entries. Default when no action is given");
  console.log("  --export             Print the learned-context block used by --with-learning");
  console.log("  --file path          Override the learning profile path");
  console.log("  --json               Emit machine-readable output");
  console.log("");
  console.log("Environment:");
  console.log("  DESIGN_AI_LEARNING_FILE=/path/learning.json  Override the default profile path");
  console.log("");
  console.log("Examples:");
  console.log("  design-ai learn --remember \"Prefer dense Korean product UI\" --category korean");
  console.log("  design-ai prompt \"audit checkout UX\" --with-learning");
  console.log("  design-ai pack \"spec a pricing page\" --with-learning");
}

function listPayload(filePath) {
  const profile = loadLearningProfile(filePath);
  return {
    file: filePath,
    version: profile.version,
    updatedAt: profile.updatedAt,
    entries: profile.entries,
    count: profile.entries.length,
  };
}

function printList(payload) {
  header("design-ai learn", "Local learning profile");
  info(`File: ${payload.file}`);
  info(`Entries: ${payload.count}`);
  console.log();

  if (payload.entries.length === 0) {
    console.log("No local learning preferences are stored yet.");
    return;
  }

  for (let i = 0; i < payload.entries.length; i += 1) {
    const entry = payload.entries[i];
    console.log(`${i + 1}. [${entry.category}] ${entry.text}`);
    console.log(`   ${dim(`${entry.id} · ${entry.createdAt || "unknown time"}`)}`);
  }
}

function readLearningInput(parsed) {
  return resolveBriefInput(parsed);
}

export async function runLearn(args) {
  const parsed = parseLearnArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  if (parsed.action === "remember") {
    const text = readLearningInput(parsed);
    const result = rememberLearning({
      text,
      category: parsed.category,
      filePath: parsed.filePath,
    });

    const payload = {
      file: result.file,
      entry: result.entry,
      count: result.profile.entries.length,
    };

    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }

    success(`Remembered ${result.entry.id}`);
    info(`File: ${result.file}`);
    info(`Category: ${result.entry.category}`);
    return;
  }

  if (parsed.action === "export") {
    const context = buildLearningContext({ filePath: parsed.filePath });
    if (parsed.json) {
      console.log(formatLearningJson(context));
      return;
    }
    console.log(context.markdown);
    return;
  }

  if (parsed.action === "list") {
    const payload = listPayload(parsed.filePath);
    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }
    printList(payload);
    return;
  }

  throw new Error(`Unsupported learn action: ${parsed.action}`);
}
