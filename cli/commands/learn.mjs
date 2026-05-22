// `design-ai learn` — manage a local learning profile for prompt personalization.

import { resolveBriefInput } from "../lib/brief.mjs";
import {
  LEARNING_CATEGORIES,
  auditLearningProfile,
  buildLearningContext,
  clearLearning,
  forgetLearning,
  formatLearningJson,
  loadLearningProfile,
  parseLearnArgs,
  rememberLearning,
  selectLearningEntries,
} from "../lib/learn.mjs";
import { dim, header, info, success } from "../lib/log.mjs";

function printHelp() {
  console.log("Usage:  design-ai learn [--list] [--category kind] [--limit N] [--json]");
  console.log("        design-ai learn --remember text [--category kind] [--json]");
  console.log("        design-ai learn --from-file notes.md [--category kind] [--json]");
  console.log("        cat notes.md | design-ai learn --stdin [--category kind] [--json]");
  console.log("        design-ai learn --export [--category kind] [--limit N] [--json]");
  console.log("        design-ai learn --audit [--json]");
  console.log("        design-ai learn --forget id-or-number --yes [--json]");
  console.log("        design-ai learn --clear --yes [--json]\n");
  console.log("Stores local design preferences for explicit prompt personalization.");
  console.log("This is local memory, not model training or fine-tuning.\n");
  console.log("Options:");
  console.log("  --remember text      Remember an inline preference or project constraint");
  console.log("  --from-file file     Remember text from a markdown/text file");
  console.log("  --stdin              Remember text from standard input");
  console.log("  --category kind      preference, brand, workflow, constraint, accessibility, korean, other");
  console.log("  --limit N            Limit list/export output to the N most recent matching entries, 1-100");
  console.log("  --list               List saved learning entries. Default when no action is given");
  console.log("  --export             Print the learned-context block used by --with-learning");
  console.log("  --audit              Inspect profile shape and possible sensitive content without changing it");
  console.log("  --forget id-or-number Remove one entry by id or 1-based list number; requires --yes");
  console.log("  --clear              Remove all saved learning entries; requires --yes");
  console.log("  --yes                Confirm destructive local profile changes");
  console.log("  --file path          Override the learning profile path");
  console.log("  --json               Emit machine-readable output");
  console.log("");
  console.log("Environment:");
  console.log("  DESIGN_AI_LEARNING_FILE=/path/learning.json  Override the default profile path");
  console.log("");
  console.log("Examples:");
  console.log("  design-ai learn --remember \"Prefer dense Korean product UI\" --category korean");
  console.log("  design-ai learn --list --category korean --limit 5");
  console.log("  design-ai learn --audit");
  console.log("  design-ai learn --forget learn-abc123def0 --yes");
  console.log("  design-ai prompt \"audit checkout UX\" --with-learning");
  console.log("  design-ai pack \"spec a pricing page\" --with-learning");
}

function learningFilter(parsed) {
  return {
    category: parsed.categorySpecified ? parsed.category : "",
    limit: parsed.limit,
  };
}

function listPayload(filePath, parsed) {
  const profile = loadLearningProfile(filePath);
  const filter = learningFilter(parsed);
  const entries = selectLearningEntries(profile, filter);
  return {
    file: filePath,
    version: profile.version,
    updatedAt: profile.updatedAt,
    category: filter.category,
    limit: filter.limit || null,
    entries,
    count: entries.length,
    totalCount: profile.entries.length,
  };
}

function printList(payload) {
  header("design-ai learn", "Local learning profile");
  info(`File: ${payload.file}`);
  info(`Entries: ${payload.count}/${payload.totalCount}`);
  if (payload.category) info(`Category: ${payload.category}`);
  if (payload.limit) info(`Limit: ${payload.limit}`);
  console.log();

  if (payload.entries.length === 0) {
    console.log(payload.category || payload.limit
      ? "No local learning preferences match the current filters."
      : "No local learning preferences are stored yet.");
    return;
  }

  for (let i = 0; i < payload.entries.length; i += 1) {
    const entry = payload.entries[i];
    console.log(`${i + 1}. [${entry.category}] ${entry.text}`);
    console.log(`   ${dim(`${entry.id} · ${entry.createdAt || "unknown time"}`)}`);
  }
}

function formatCategoryCounts(categoryCounts) {
  return LEARNING_CATEGORIES
    .filter((category) => categoryCounts[category])
    .map((category) => `${category} ${categoryCounts[category]}`)
    .join(", ");
}

function printAudit(payload) {
  header("design-ai learn", "Local learning profile audit");
  info(`File: ${payload.file}`);
  info(`Exists: ${payload.exists ? "yes" : "no"}`);
  info(`Entries: ${payload.count}`);
  info(`Status: ${payload.summary.status}`);
  info(`Issues: ${payload.summary.failures} failure(s), ${payload.summary.warnings} warning(s)`);

  const categories = formatCategoryCounts(payload.categoryCounts);
  if (categories) info(`Categories: ${categories}`);
  console.log();

  if (!payload.exists) {
    console.log("No local learning profile file exists yet.");
    return;
  }

  if (payload.issues.length === 0) {
    console.log("No learning profile issues found.");
    return;
  }

  for (const issue of payload.issues) {
    const entry = issue.entryId ? ` (${issue.entryId})` : "";
    console.log(`${issue.level.toUpperCase()} ${issue.code}${entry}: ${issue.message}`);
  }
}

function readLearningInput(parsed) {
  return resolveBriefInput(parsed);
}

function assertConfirmed(parsed, action) {
  if (!parsed.yes) {
    throw new Error(`Refusing to ${action} learning entries without --yes`);
  }
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
    const filter = learningFilter(parsed);
    const context = buildLearningContext({
      filePath: parsed.filePath,
      category: filter.category,
      limit: filter.limit || 12,
    });
    if (parsed.json) {
      console.log(formatLearningJson(context));
      return;
    }
    console.log(context.markdown);
    return;
  }

  if (parsed.action === "list") {
    const payload = listPayload(parsed.filePath, parsed);
    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }
    printList(payload);
    return;
  }

  if (parsed.action === "audit") {
    const payload = auditLearningProfile({ filePath: parsed.filePath });
    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }
    printAudit(payload);
    return;
  }

  if (parsed.action === "forget") {
    assertConfirmed(parsed, "forget");
    const result = forgetLearning({
      target: parsed.forgetTarget,
      filePath: parsed.filePath,
    });
    const payload = {
      file: result.file,
      removed: result.removed,
      count: result.count,
    };

    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }

    success(`Forgot ${result.removed.id}`);
    info(`File: ${result.file}`);
    info(`Entries: ${result.count}`);
    return;
  }

  if (parsed.action === "clear") {
    assertConfirmed(parsed, "clear");
    const result = clearLearning({ filePath: parsed.filePath });
    const payload = {
      file: result.file,
      removedCount: result.removedCount,
      count: result.profile.entries.length,
    };

    if (parsed.json) {
      console.log(formatLearningJson(payload));
      return;
    }

    success(`Cleared ${result.removedCount} learning entr${result.removedCount === 1 ? "y" : "ies"}`);
    info(`File: ${result.file}`);
    return;
  }

  throw new Error(`Unsupported learn action: ${parsed.action}`);
}
