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
    ["version", "Show CLI + plugin versions"],
    ["help", "Show this help"],
  ];

  for (const [name, desc] of cmds) {
    console.log(`  ${name.padEnd(34)} ${dim(desc)}`);
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
  console.log(`  ${dim("$")} design-ai list skills`);

  console.log(`\nDocs:    https://github.com/sungjin/design-ai`);
  console.log(`Plugin:  19 skills, 15 commands, 4 agents (UI/UX, motion,`);
  console.log(`         illustration, print, video, game UI, conversational, spatial)`);
}
