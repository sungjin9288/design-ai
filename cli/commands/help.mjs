// `design-ai help`

import { header, dim } from "../lib/log.mjs";
import { suggestNearest } from "../lib/suggest.mjs";

import { runAudit } from "./audit.mjs";
import { runCheck } from "./check.mjs";
import { runDoctor } from "./doctor.mjs";
import { runExamples } from "./examples.mjs";
import { runInstall } from "./install.mjs";
import { runList } from "./list.mjs";
import { runPack } from "./pack.mjs";
import { runPrompt } from "./prompt.mjs";
import { runRoute } from "./route.mjs";
import { runSearch } from "./search.mjs";
import { runShow } from "./show.mjs";
import { runStatus } from "./status.mjs";
import { runUninstall } from "./uninstall.mjs";
import { runUpdate } from "./update.mjs";
import { runVersion } from "./version.mjs";

const HELP_TOPICS = [
  "install",
  "update",
  "uninstall",
  "status",
  "list",
  "search",
  "show",
  "route",
  "routes",
  "prompt",
  "pack",
  "check",
  "audit",
  "doctor",
  "examples",
  "version",
  "help",
];

const HELP_ALIASES = {
  i: "install",
  upgrade: "update",
  u: "update",
  remove: "uninstall",
  rm: "uninstall",
  s: "status",
  ls: "list",
  find: "search",
  cat: "show",
  recommend: "route",
  lint: "check",
  a: "audit",
  diag: "doctor",
  example: "examples",
  ex: "examples",
  v: "version",
};

const HELP_RUNNERS = {
  install: () => runInstall(["--help"]),
  update: () => runUpdate(["--help"]),
  uninstall: () => runUninstall(["--help"]),
  status: () => runStatus(["--help"]),
  list: () => runList(["--help"]),
  search: () => runSearch(["--help"]),
  show: () => runShow(["--help"]),
  route: () => runRoute(["--help"]),
  routes: printRoutesHelp,
  prompt: () => runPrompt(["--help"]),
  pack: () => runPack(["--help"]),
  check: () => runCheck(["--help"]),
  audit: () => runAudit(["--help"]),
  doctor: () => runDoctor(["--help"]),
  examples: () => runExamples(["--help"]),
  version: () => runVersion(["--help"]),
  help: printHelpHelp,
};

function resolveHelpTopic(rawTopic) {
  const topic = String(rawTopic || "").trim().toLowerCase();
  return HELP_ALIASES[topic] || topic;
}

function unknownHelpTopicMessage(rawTopic) {
  const topic = String(rawTopic || "").trim().toLowerCase();
  const suggestion = suggestNearest(topic, HELP_TOPICS);
  const lines = [`Unknown help topic: ${rawTopic}`];
  if (suggestion) lines.push(`Did you mean \`design-ai help ${suggestion}\`?`);
  lines.push("Run `design-ai help` to list available commands.");
  return lines.join("\n");
}

function printRoutesHelp() {
  console.log("Usage:  design-ai routes [--json]\n");
  console.log("Lists route ids that can be passed to prompt, pack, examples, and check.");
  console.log("Equivalent to: design-ai route --list\n");
  console.log("Options:");
  console.log("  --json   Emit machine-readable route catalog");
}

function printHelpHelp() {
  console.log("Usage:  design-ai help [command]\n");
  console.log("Shows top-level CLI help, or command-specific help when a command is provided.\n");
  console.log("Examples:");
  console.log("  design-ai help");
  console.log("  design-ai help route");
  console.log("  design-ai help prompt");
  console.log("  design-ai help doctor");
}

function printMainHelp() {
  header("design-ai", "Senior product designer for Claude Code");

  console.log(`Usage:  design-ai <command> [args]`);
  console.log(`        design-ai help [command]\n`);

  const cmds = [
    ["install", "Symlink design-ai into Claude Code (~/.claude)"],
    ["update", "Pull latest source + reinstall"],
    ["uninstall", "Remove symlinks (keeps source files)"],
    ["status", "Show what's installed (use VERBOSE=1 for full list)"],
    ["list [skills|commands|agents]", "List catalog from the plugin manifest"],
    ["search <query> [--dir kind] [--limit N] [--json]", "Search the local markdown corpus"],
    ["show <file[:line]> [--lines N:M] [--context N] [--json]", "Print a corpus file or line range"],
    ["route <brief|--from-file file|--stdin|--list> [--limit N]", "Recommend commands, skills, and knowledge; add --explain"],
    ["routes [--json]", "List available route ids"],
    ["prompt <brief|--from-file file|--stdin> [--route id] [--out file]", "Generate a ready-to-use agent prompt"],
    ["pack <brief|--from-file file|--stdin> [--route id] [--max-bytes N]", "Generate prompt plus bounded context with summary"],
    ["check <artifact.md|--stdin|--examples> [--route id|--all-routes]", "Check generated Markdown artifact quality; add --issues-only"],
    ["audit [--strict] [--quiet]", "Run repository quality checks"],
    ["doctor [--strict] [--json] [--fix]", "Diagnose source, runtime, and install state"],
    ["examples [query] [--route id] [--limit N] [--json]", "Find worked examples for a route or query"],
    ["version", "Show CLI + plugin versions"],
    ["help [command]", "Show top-level or command-specific help"],
  ];

  for (const [name, desc] of cmds) {
    console.log(`  ${name.padEnd(70)} ${dim(desc)}`);
  }

  console.log(`\nEnvironment overrides:`);
  console.log(`  ${dim("DESIGN_AI_PREFIX=mydesign-")}     prefix for symlinks (default: design-)`);
  console.log(`  ${dim("CLAUDE_HOME=/path/to/.claude")}    Claude Code home dir`);
  console.log(`  ${dim("DESIGN_AI_HOME=/path/to/source")}  override source location`);
  console.log(`  ${dim("VERBOSE=1")}                       verbose output`);
  console.log(`  ${dim("DEBUG=1")}                         show stack traces on error`);

  console.log(`\nQuickstart:`);
  console.log(`  ${dim("$")} design-ai install`);
  console.log(`  ${dim("$")} design-ai status`);
  console.log(`  ${dim("$")} design-ai help route`);
  console.log(`  ${dim("$")} design-ai search Pretendard`);
  console.log(`  ${dim("$")} design-ai show knowledge/PRINCIPLES.md:29`);
  console.log(`  ${dim("$")} design-ai routes`);
  console.log(`  ${dim("$")} design-ai route "audit a Figma signup flow" --explain`);
  console.log(`  ${dim("$")} design-ai prompt --from-file brief.md --route design-review --out prompt.md`);
  console.log(`  ${dim("$")} design-ai prompt "spec a Button component"`);
  console.log(`  ${dim("$")} design-ai pack "spec a Button component"`);
  console.log(`  ${dim("$")} design-ai check output.md --route component-spec --strict`);
  console.log(`  ${dim("$")} design-ai check --examples --route design-from-brief --limit 1`);
  console.log(`  ${dim("$")} design-ai check --examples --all-routes --issues-only`);
  console.log(`  ${dim("$")} design-ai examples --route component-spec`);
  console.log(`  ${dim("$")} design-ai doctor`);
  console.log(`  ${dim("$")} design-ai audit --strict`);
  console.log(`  ${dim("$")} design-ai list skills`);

  console.log(`\nDocs:    https://github.com/sungjin/design-ai`);
  console.log(`Plugin:  19 skills, 16 commands, 4 agents (UI/UX, motion,`);
  console.log(`         illustration, print, video, game UI, conversational, spatial)`);
}

export async function runHelp(args) {
  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    printMainHelp();
    return;
  }

  if (args.length > 1) {
    throw new Error("Usage: design-ai help [command]");
  }

  const topic = resolveHelpTopic(args[0]);
  const runner = HELP_RUNNERS[topic];
  if (!runner) {
    throw new Error(unknownHelpTopicMessage(args[0]));
  }

  await runner();
}
