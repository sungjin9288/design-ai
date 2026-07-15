#!/usr/bin/env node
// design-ai CLI — distribution entry point
//
// Commands:
//   install              Install design-ai into Claude Code (~/.claude)
//   update [--dry-run]   Update to latest design-ai (re-fetch + reinstall)
//   uninstall            Remove design-ai from Claude Code
//   status               Show what's installed
//   list [domain]        List skills / commands / knowledge (optionally filtered)
//   search               Search the local design-ai markdown corpus
//   index                Build, inspect, and verify the local retrieval index
//   show                 Print a corpus file or line range
//   route                Recommend and explain commands, skills, and knowledge for a brief
//   routes               List available route ids
//   start                Build one read-only route, design contract, review state, and next-step plan
//   inspect              Build a read-only quality report from one explicit HTML file
//   review               Compose one read-only plan and static quality review
//   review-handoff       Prepare a self-validating review handoff for another agent
//   review-handoff-verify Validate a review handoff and emit a consumer receipt
//   review-intake        Inspect bounded target-repository metadata before implementation approval
//   review-scope         Build an immutable implementation-scope proposal
//   review-scope-approve Approve one exact implementation-scope proposal
//   review-evidence      Check implementation evidence against an approved baseline
//   review-pack          List or print Korean product review packs
//   benchmark            Run read-only product specialization regression proof
//   verify-browser       Run an approved external browser adapter and record local evidence
//   prompt               Generate a ready-to-use agent prompt from a brief
//   pack                 Generate a prompt plus bounded context file contents
//   audit                Run repository quality checks
//   check                Check generated Markdown artifact quality
//   doctor               Diagnose source, runtime, and install state
//   examples             Find worked examples by query or route
//   learn                Manage local learning preferences for prompt personalization
//   workspace            Show read-only dogfood readiness: git, repository, learning usage/eval, release scripts
//                        Add --strict to fail on readiness warnings/failures
//   site                 Validate Website Improvement Console exports and generate handoff artifacts
//   version [--json]     Show CLI + plugin versions
//   help                 Show help

import { runCommand } from "../lib/dispatch.mjs";
import { red } from "../lib/log.mjs";

const args = process.argv.slice(2);
const command = args[0] || "help";
const restArgs = args.slice(1);

try {
  await runCommand(command, restArgs);
} catch (err) {
  console.error(`${red("✗")} ${err.message}`);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
}
