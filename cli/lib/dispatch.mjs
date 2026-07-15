// Command dispatcher

import { runInstall } from "../commands/install.mjs";
import { runUpdate } from "../commands/update.mjs";
import { runUninstall } from "../commands/uninstall.mjs";
import { runStatus } from "../commands/status.mjs";
import { runList } from "../commands/list.mjs";
import { runAudit } from "../commands/audit.mjs";
import { runArtifact } from "../commands/artifact.mjs";
import { runStart } from "../commands/start.mjs";
import { runInspect } from "../commands/inspect.mjs";
import { runReview } from "../commands/review.mjs";
import { runReviewHandoff } from "../commands/review-handoff.mjs";
import { runReviewHandoffVerify } from "../commands/review-handoff-verify.mjs";
import { runReviewIntake } from "../commands/review-intake.mjs";
import { runReviewScope } from "../commands/review-scope.mjs";
import { runReviewScopeApprove } from "../commands/review-scope-approve.mjs";
import { runReviewEvidence } from "../commands/review-evidence.mjs";
import { runReviewPilot } from "../commands/review-pilot.mjs";
import { runReviewPack } from "../commands/review-pack.mjs";
import { runBenchmark } from "../commands/benchmark.mjs";
import { runVerifyBrowser } from "../commands/verify-browser.mjs";
import { runCheck } from "../commands/check.mjs";
import { runDoctor } from "../commands/doctor.mjs";
import { runExamples } from "../commands/examples.mjs";
import { runLearn } from "../commands/learn.mjs";
import { runWorkspace } from "../commands/workspace.mjs";
import { runSite } from "../commands/site.mjs";
import { runMcp } from "../commands/mcp.mjs";
import { runSearch } from "../commands/search.mjs";
import { runShow } from "../commands/show.mjs";
import { runRoute } from "../commands/route.mjs";
import { runPrompt } from "../commands/prompt.mjs";
import { runPack } from "../commands/pack.mjs";
import { runVersion } from "../commands/version.mjs";
import { runHelp } from "../commands/help.mjs";
import { runIndex } from "../commands/index.mjs";
import { hasHelpFlag } from "./help-flags.mjs";
import { suggestNearest } from "./suggest.mjs";

const commands = {
  install: runInstall,
  i: runInstall,
  update: runUpdate,
  upgrade: runUpdate,
  u: runUpdate,
  uninstall: runUninstall,
  remove: runUninstall,
  rm: runUninstall,
  status: runStatus,
  s: runStatus,
  list: runList,
  ls: runList,
  audit: runAudit,
  a: runAudit,
  artifact: runArtifact,
  start: runStart,
  inspect: runInspect,
  review: runReview,
  "review-handoff": runReviewHandoff,
  "review-handoff-verify": runReviewHandoffVerify,
  "review-intake": runReviewIntake,
  "review-scope": runReviewScope,
  "review-scope-approve": runReviewScopeApprove,
  "review-evidence": runReviewEvidence,
  "review-pilot": runReviewPilot,
  "review-pack": runReviewPack,
  benchmark: runBenchmark,
  "verify-browser": runVerifyBrowser,
  check: runCheck,
  lint: runCheck,
  doctor: runDoctor,
  diag: runDoctor,
  examples: runExamples,
  example: runExamples,
  ex: runExamples,
  learn: runLearn,
  workspace: runWorkspace,
  ws: runWorkspace,
  site: runSite,
  mcp: runMcp,
  search: runSearch,
  find: runSearch,
  index: runIndex,
  show: runShow,
  cat: runShow,
  route: runRoute,
  routes: (args) => hasHelpFlag(args) ? runHelp(["routes"]) : runRoute(["--list", ...args]),
  recommend: runRoute,
  prompt: runPrompt,
  pack: runPack,
  version: runVersion,
  v: runVersion,
  "--version": runVersion,
  "-v": runVersion,
  help: runHelp,
  "--help": runHelp,
  "-h": runHelp,
};

export const CANONICAL_COMMANDS = [
  "install",
  "update",
  "uninstall",
  "status",
  "list",
  "search",
  "index",
  "show",
  "route",
  "routes",
  "prompt",
  "pack",
  "check",
  "audit",
  "artifact",
  "start",
  "inspect",
  "review",
  "review-handoff",
  "review-handoff-verify",
  "review-intake",
  "review-scope",
  "review-scope-approve",
  "review-evidence",
  "review-pilot",
  "review-pack",
  "benchmark",
  "verify-browser",
  "doctor",
  "examples",
  "learn",
  "workspace",
  "site",
  "mcp",
  "version",
  "help",
];

export function suggestCommand(name, commandNames = CANONICAL_COMMANDS) {
  return suggestNearest(name, commandNames);
}

export async function runCommand(name, args) {
  const handler = commands[name];
  if (!handler) {
    const suggestion = suggestCommand(name);
    console.error(`Unknown command: ${name}`);
    if (suggestion) console.error(`Did you mean \`design-ai ${suggestion}\`?`);
    console.error(`Run \`design-ai help\` for usage.`);
    process.exit(1);
  }
  await handler(args);
}
