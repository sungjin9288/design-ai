#!/usr/bin/env node
// design-ai CLI — distribution entry point
//
// Commands:
//   install              Install design-ai into Claude Code (~/.claude)
//   update               Update to latest design-ai (re-fetch + reinstall)
//   uninstall            Remove design-ai from Claude Code
//   status               Show what's installed
//   list [domain]        List skills / commands / knowledge (optionally filtered)
//   version              Show CLI + plugin versions
//   help                 Show help

import { runCommand } from "../lib/dispatch.mjs";

const args = process.argv.slice(2);
const command = args[0] || "help";
const restArgs = args.slice(1);

try {
  await runCommand(command, restArgs);
} catch (err) {
  console.error(`\x1b[31m✗\x1b[0m ${err.message}`);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
}
