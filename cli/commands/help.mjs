// `design-ai help`

import { header, info, dim } from "../lib/log.mjs";

export async function runHelp(args) {
  header("design-ai", "Senior product designer for Claude Code");

  console.log(`Usage:  design-ai <command> [args]\n`);

  const cmds = [
    ["install", "Symlink design-ai into Claude Code (~/.claude)"],
    ["update", "Pull latest source + reinstall"],
    ["uninstall", "Remove symlinks (keeps source files)"],
    ["status", "Show what's installed (use VERBOSE=1 for full list)"],
    ["list [skills|commands|agents]", "List catalog from the plugin manifest"],
    ["search <query> [--limit N] [--json]", "Search the local markdown corpus"],
    ["show <file[:line]> [--lines N:M]", "Print a corpus file or line range"],
    ["route <brief|--from-file file|--list>", "Recommend commands, skills, and knowledge; add --explain"],
    ["routes [--json]", "List available route ids"],
    ["prompt <brief|--from-file file> [--route id]", "Generate a ready-to-use agent prompt"],
    ["pack <brief|--from-file file> [--route id]", "Generate prompt plus bounded context with summary"],
    ["check <artifact.md|--examples> [--route id]", "Check generated Markdown artifact quality; add --issues-only"],
    ["audit [--strict] [--quiet]", "Run repository quality checks"],
    ["doctor [--strict] [--json] [--fix]", "Diagnose source, runtime, and install state"],
    ["examples [query] [--route id]", "Find worked examples for a route or query"],
    ["version", "Show CLI + plugin versions"],
    ["help", "Show this help"],
  ];

  for (const [name, desc] of cmds) {
    console.log(`  ${name.padEnd(52)} ${dim(desc)}`);
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
