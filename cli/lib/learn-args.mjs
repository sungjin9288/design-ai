// CLI argument parsing for `design-ai learn`.

import path from "node:path";

import { parseBriefSourceFlag } from "./brief.mjs";
import {
  defaultLearningFile,
  defaultLearningUsageFile,
} from "./learn-shared.mjs";
import { parseOutputFlags } from "./output.mjs";
import { expectedValueMessage, unknownOptionMessage } from "./suggest.mjs";

const LEARN_OPTIONS = [
  "-h",
  "--help",
  "--json",
  "--init",
  "--remember",
  "--feedback",
  "--from-file",
  "--stdin",
  "--out",
  "--output",
  "--force",
  "--query",
  "--explain",
  "--recall",
  "--list",
  "--export",
  "--import",
  "--backup",
  "--verify",
  "--diff",
  "--restore",
  "--restore-backups",
  "--prune",
  "--redact",
  "--audit",
  "--stats",
  "--usage",
  "--signals",
  "--agent-backlog",
  "--propose-skills",
  "--apply-plan",
  "--patch",
  "--review-check",
  "--eval",
  "--eval-template",
  "--strict",
  "--curate",
  "--report",
  "--fix",
  "--dry-run",
  "--outcome",
  "--forget",
  "--clear",
  "--category",
  "--limit",
  "--min-evidence",
  "--keep",
  "--file",
  "--usage-file",
  "--review-file",
  "--review-template",
  "--backup-file",
  "--yes",
];
export const LEARNING_CATEGORIES = [
  "preference",
  "brand",
  "workflow",
  "constraint",
  "accessibility",
  "korean",
  "other",
];
export const LEARNING_FEEDBACK_OUTCOMES = [
  "keep",
  "improve",
  "avoid",
];

function setAction(out, action) {
  if (out.action && out.action !== action) {
    throw new Error(`Choose only one learning action: --${out.action} or --${action}`);
  }
  out.action = action;
}

export function normalizeCategory(rawCategory = "preference") {
  const category = String(rawCategory || "preference").trim().toLowerCase();
  if (!LEARNING_CATEGORIES.includes(category)) {
    throw new Error(expectedValueMessage("category", category, LEARNING_CATEGORIES));
  }
  return category;
}

export function normalizeFeedbackOutcome(rawOutcome = "improve") {
  const outcome = String(rawOutcome || "improve").trim().toLowerCase();
  if (!LEARNING_FEEDBACK_OUTCOMES.includes(outcome)) {
    throw new Error(expectedValueMessage("outcome", outcome, LEARNING_FEEDBACK_OUTCOMES));
  }
  return outcome;
}

export function parseLearningLimit(rawLimit) {
  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("--limit expects an integer from 1 to 100");
  }
  return limit;
}

export function parseLearningKeep(rawKeep) {
  const keep = Number(rawKeep);
  if (!Number.isInteger(keep) || keep < 1 || keep > 100) {
    throw new Error("--keep expects an integer from 1 to 100");
  }
  return keep;
}

export function parseLearningMinEvidence(rawMinEvidence) {
  const minEvidence = Number(rawMinEvidence);
  if (!Number.isInteger(minEvidence) || minEvidence < 1 || minEvidence > 100) {
    throw new Error("--min-evidence expects an integer from 1 to 100");
  }
  return minEvidence;
}

export const LEARN_SUBCOMMANDS = Object.freeze([
  "agent-backlog",
  "audit",
  "backup",
  "clear",
  "curate",
  "diff",
  "eval",
  "eval-template",
  "export",
  "feedback",
  "forget",
  "import",
  "init",
  "list",
  "propose-skills",
  "recall",
  "redact",
  "remember",
  "restore",
  "restore-backups",
  "signals",
  "stats",
  "usage",
  "verify",
]);

export function parseLearnArgs(rawArgs) {
  const args = rawArgs.length > 0 && LEARN_SUBCOMMANDS.includes(rawArgs[0])
    ? [`--${rawArgs[0]}`, ...rawArgs.slice(1)]
    : rawArgs;
  const out = {
    action: "",
    noteParts: [],
    fromFile: "",
    stdin: false,
    category: "preference",
    categorySpecified: false,
    feedbackOutcome: "improve",
    outcomeSpecified: false,
    filePath: "",
    usageFilePath: "",
    reviewFilePath: "",
    backupFilePath: "",
    outPath: "",
    force: false,
    query: "",
    explain: false,
    forgetTarget: "",
    limit: 0,
    minEvidenceCount: 0,
    keep: 0,
    fix: false,
    prune: false,
    dryRun: false,
    strict: false,
    report: false,
    applyPlan: false,
    patch: false,
    reviewCheck: false,
    reviewTemplate: false,
    yes: false,
    json: false,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    out.index = i;

    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--json") {
      out.json = true;
    } else if (arg === "--init") {
      setAction(out, "init");
    } else if (arg === "--remember") {
      setAction(out, "remember");
    } else if (arg === "--feedback") {
      setAction(out, "feedback");
    } else if (arg === "--recall") {
      setAction(out, "recall");
    } else if (arg === "--list") {
      setAction(out, "list");
    } else if (arg === "--export") {
      setAction(out, "export");
    } else if (arg === "--import") {
      setAction(out, "import");
    } else if (arg === "--backup") {
      setAction(out, "backup");
    } else if (arg === "--verify") {
      setAction(out, "verify");
    } else if (arg === "--diff") {
      setAction(out, "diff");
    } else if (arg === "--restore") {
      setAction(out, "restore");
    } else if (arg === "--restore-backups") {
      setAction(out, "restore-backups");
    } else if (arg === "--prune") {
      out.prune = true;
    } else if (arg === "--redact") {
      setAction(out, "redact");
    } else if (arg === "--audit") {
      setAction(out, "audit");
    } else if (arg === "--stats") {
      setAction(out, "stats");
    } else if (arg === "--usage") {
      setAction(out, "usage");
    } else if (arg === "--signals") {
      setAction(out, "signals");
    } else if (arg === "--agent-backlog") {
      setAction(out, "agent-backlog");
    } else if (arg === "--propose-skills") {
      setAction(out, "propose-skills");
    } else if (arg === "--eval") {
      setAction(out, "eval");
    } else if (arg === "--eval-template") {
      setAction(out, "eval-template");
    } else if (arg === "--curate") {
      setAction(out, "curate");
    } else if (arg === "--report") {
      out.report = true;
    } else if (arg === "--apply-plan") {
      out.applyPlan = true;
    } else if (arg === "--patch") {
      out.patch = true;
    } else if (arg === "--review-check") {
      out.reviewCheck = true;
    } else if (arg === "--review-template") {
      out.reviewTemplate = true;
    } else if (arg === "--fix") {
      out.fix = true;
    } else if (arg === "--dry-run") {
      out.dryRun = true;
    } else if (arg === "--strict") {
      out.strict = true;
    } else if (arg === "--query") {
      const query = args[i + 1];
      if (!query || query.startsWith("--")) throw new Error("--query expects search text");
      out.query = String(query).trim();
      i += 1;
    } else if (arg === "--explain") {
      out.explain = true;
    } else if (arg === "--outcome") {
      const outcome = args[i + 1];
      if (!outcome || outcome.startsWith("--")) throw new Error("--outcome expects keep, improve, or avoid");
      out.feedbackOutcome = normalizeFeedbackOutcome(outcome);
      out.outcomeSpecified = true;
      i += 1;
    } else if (arg === "--forget") {
      setAction(out, "forget");
      const target = args[i + 1];
      if (!target || target.startsWith("--")) throw new Error("--forget expects an entry id or list number");
      out.forgetTarget = target;
      i += 1;
    } else if (arg === "--clear") {
      setAction(out, "clear");
    } else if (arg === "--yes") {
      out.yes = true;
    } else if (arg === "--category") {
      const category = args[i + 1];
      if (!category || category.startsWith("--")) throw new Error("--category expects a category");
      out.category = normalizeCategory(category);
      out.categorySpecified = true;
      i += 1;
    } else if (arg === "--limit") {
      const limit = args[i + 1];
      if (!limit || limit.startsWith("--")) throw new Error("--limit expects an integer from 1 to 100");
      out.limit = parseLearningLimit(limit);
      i += 1;
    } else if (arg === "--min-evidence") {
      const minEvidence = args[i + 1];
      if (!minEvidence || minEvidence.startsWith("--")) throw new Error("--min-evidence expects an integer from 1 to 100");
      out.minEvidenceCount = parseLearningMinEvidence(minEvidence);
      i += 1;
    } else if (arg === "--keep") {
      const keep = args[i + 1];
      if (!keep || keep.startsWith("--")) throw new Error("--keep expects an integer from 1 to 100");
      out.keep = parseLearningKeep(keep);
      i += 1;
    } else if (arg === "--file") {
      const filePath = args[i + 1];
      if (!filePath || filePath.startsWith("--")) throw new Error("--file expects a path");
      out.filePath = filePath;
      i += 1;
    } else if (arg === "--usage-file") {
      const usageFilePath = args[i + 1];
      if (!usageFilePath || usageFilePath.startsWith("--")) throw new Error("--usage-file expects a path");
      out.usageFilePath = usageFilePath;
      i += 1;
    } else if (arg === "--review-file") {
      const reviewFilePath = args[i + 1];
      if (!reviewFilePath || reviewFilePath.startsWith("--")) throw new Error("--review-file expects a path");
      out.reviewFilePath = reviewFilePath;
      i += 1;
    } else if (arg === "--backup-file") {
      const backupFilePath = args[i + 1];
      if (!backupFilePath || backupFilePath.startsWith("--")) throw new Error("--backup-file expects a path");
      out.backupFilePath = backupFilePath;
      i += 1;
    } else if (parseBriefSourceFlag(args, out)) {
      if (!out.action) {
        setAction(out, "remember");
      } else if (!["remember", "feedback", "import", "verify", "diff", "restore", "redact", "eval", "signals", "agent-backlog", "propose-skills"].includes(out.action)) {
        setAction(out, "remember");
      }
      i = out.index;
    } else if (parseOutputFlags(args, out)) {
      i = out.index;
    } else if (arg.startsWith("--")) {
      throw new Error(unknownOptionMessage("learn", arg, LEARN_OPTIONS));
    } else {
      out.noteParts.push(arg);
    }
  }

  if (!out.action) {
    out.action = out.noteParts.length > 0 ? "remember" : "list";
  }

  if (!["remember", "feedback", "recall"].includes(out.action) && out.noteParts.length > 0) {
    throw new Error(`Unexpected learn argument for --${out.action}: ${out.noteParts[0]}`);
  }
  if (out.outcomeSpecified && out.action !== "feedback") {
    throw new Error("--outcome can only be used with --feedback");
  }
  if (out.fix && out.action !== "audit") {
    throw new Error("--fix can only be used with --audit");
  }
  if (out.prune && out.action !== "restore-backups") {
    throw new Error("--prune can only be used with --restore-backups");
  }
  if (out.keep && !(out.action === "restore-backups" && out.prune)) {
    throw new Error("--keep can only be used with --restore-backups --prune");
  }
  if (out.dryRun && !out.fix && !["import", "init", "curate", "restore"].includes(out.action) && !(out.action === "restore-backups" && out.prune)) {
    throw new Error("--dry-run requires --fix, --init, --import, --restore, --curate, or --restore-backups --prune");
  }
  if (out.fix && out.dryRun && out.yes) {
    throw new Error("Choose either --dry-run or --yes for --audit --fix");
  }
  if (out.action === "import" && out.dryRun && out.yes) {
    throw new Error("Choose either --dry-run or --yes for --import");
  }
  if (out.action === "restore" && out.dryRun && out.yes) {
    throw new Error("Choose either --dry-run or --yes for --restore");
  }
  if (out.action === "init" && out.dryRun && out.yes) {
    throw new Error("Choose either --dry-run or --yes for --init");
  }
  if (out.action === "curate" && out.dryRun && out.yes) {
    throw new Error("Choose either --dry-run or --yes for --curate");
  }
  if (out.action === "restore-backups" && out.prune && out.dryRun && out.yes) {
    throw new Error("Choose either --dry-run or --yes for --restore-backups --prune");
  }
  if (out.action === "restore-backups" && out.yes && !out.prune) {
    throw new Error("--yes can only be used with --restore-backups --prune");
  }
  if (out.action === "feedback" && !out.categorySpecified) {
    out.category = "workflow";
  }
  if (out.query && !["list", "export", "eval-template"].includes(out.action)) {
    throw new Error("--query can only be used with --list, --export, or --eval-template");
  }
  if (out.explain && out.action !== "list") {
    throw new Error("--explain can only be used with --list");
  }
  if (out.usageFilePath && !["usage", "curate", "signals", "agent-backlog", "propose-skills"].includes(out.action)) {
    throw new Error("--usage-file can only be used with --usage, --curate, --signals, --agent-backlog, or --propose-skills");
  }
  if (out.reviewFilePath && out.action !== "propose-skills") {
    throw new Error("--review-file can only be used with --propose-skills");
  }
  if (out.reviewTemplate && out.action !== "propose-skills") {
    throw new Error("--review-template can only be used with --propose-skills");
  }
  if (out.reviewCheck && out.action !== "propose-skills") {
    throw new Error("--review-check can only be used with --propose-skills");
  }
  if (out.applyPlan && out.action !== "propose-skills") {
    throw new Error("--apply-plan can only be used with --propose-skills");
  }
  if (out.minEvidenceCount && out.action !== "propose-skills") {
    throw new Error("--min-evidence can only be used with --propose-skills");
  }
  if (out.backupFilePath && out.action !== "restore") {
    throw new Error("--backup-file can only be used with --restore");
  }
  if (out.report && !["curate", "signals", "agent-backlog", "propose-skills"].includes(out.action)) {
    throw new Error("--report can only be used with --curate, --signals, --agent-backlog, or --propose-skills");
  }
  if (out.patch && out.action !== "propose-skills") {
    throw new Error("--patch can only be used with --propose-skills");
  }
  if (out.reviewCheck && (out.patch || out.reviewTemplate)) {
    throw new Error("--review-check cannot be combined with --patch or --review-template");
  }
  if (out.reviewCheck && !out.reviewFilePath) {
    throw new Error("--review-check requires --review-file");
  }
  if (out.applyPlan && (out.patch || out.reviewTemplate || out.reviewCheck)) {
    throw new Error("--apply-plan cannot be combined with --patch, --review-template, or --review-check");
  }
  if (out.applyPlan && !out.reviewFilePath) {
    throw new Error("--apply-plan requires --review-file");
  }
  if ([out.json, out.report, out.patch, out.reviewTemplate].filter(Boolean).length > 1) {
    throw new Error("Choose only one output mode: --json, --report, --patch, or --review-template");
  }
  if (out.strict && !["eval", "signals", "agent-backlog", "propose-skills"].includes(out.action)) {
    throw new Error("--strict can only be used with --eval, --signals, --agent-backlog, or --propose-skills");
  }
  if (out.action === "eval" && !out.fromFile && !out.stdin) {
    throw new Error("--eval requires --from-file or --stdin");
  }
  if (out.action === "signals" && out.stdin) {
    throw new Error("--signals does not support --stdin; use --from-file for a signal file or directory");
  }
  if (out.action === "agent-backlog" && out.stdin) {
    throw new Error("--agent-backlog does not support --stdin; use --from-file for a signal file or directory");
  }
  if (out.action === "agent-backlog" && out.yes) {
    throw new Error("--agent-backlog is read-only and does not accept --yes");
  }
  if (out.action === "propose-skills" && out.stdin) {
    throw new Error("--propose-skills does not support --stdin; use --from-file for a signal file or directory");
  }
  if (out.action === "propose-skills" && out.yes) {
    throw new Error("--propose-skills is preview-only and does not accept --yes");
  }
  if (out.action === "diff" && !out.fromFile && !out.stdin) {
    throw new Error("--diff requires --from-file or --stdin");
  }
  if (out.action === "restore" && !out.fromFile && !out.stdin) {
    throw new Error("--restore requires --from-file or --stdin");
  }
  const allowsMarkdownOut = ["export", "eval-template"].includes(out.action)
    || (out.action === "curate" && out.report)
    || (out.action === "signals" && out.report)
    || (out.action === "agent-backlog" && out.report)
    || (out.action === "propose-skills" && (out.report || out.patch || out.reviewTemplate));
  if (!out.help && out.outPath && !allowsMarkdownOut && !out.json) {
    throw new Error("--out requires --json for learn actions other than --export, --eval-template, --curate --report, --signals --report, --agent-backlog --report, --propose-skills --report, --propose-skills --patch, or --propose-skills --review-template");
  }

  const resolvedFilePath = path.resolve(out.filePath || defaultLearningFile());
  return {
    ...out,
    index: undefined,
    briefParts: out.noteParts,
    filePath: resolvedFilePath,
    usageFilePath: path.resolve(out.usageFilePath || defaultLearningUsageFile(resolvedFilePath)),
    reviewFilePath: out.reviewFilePath ? path.resolve(out.reviewFilePath) : "",
    backupFilePath: out.backupFilePath ? path.resolve(out.backupFilePath) : "",
    category: normalizeCategory(out.category),
    feedbackOutcome: normalizeFeedbackOutcome(out.feedbackOutcome),
    query: out.query,
    brief: out.noteParts.join(" ").trim(),
  };
}
