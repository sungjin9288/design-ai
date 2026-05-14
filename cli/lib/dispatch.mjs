// Command dispatcher

import { runInstall } from "../commands/install.mjs";
import { runUpdate } from "../commands/update.mjs";
import { runUninstall } from "../commands/uninstall.mjs";
import { runStatus } from "../commands/status.mjs";
import { runList } from "../commands/list.mjs";
import { runAudit } from "../commands/audit.mjs";
import { runCheck } from "../commands/check.mjs";
import { runDoctor } from "../commands/doctor.mjs";
import { runExamples } from "../commands/examples.mjs";
import { runSearch } from "../commands/search.mjs";
import { runShow } from "../commands/show.mjs";
import { runRoute } from "../commands/route.mjs";
import { runPrompt } from "../commands/prompt.mjs";
import { runPack } from "../commands/pack.mjs";
import { runVersion } from "../commands/version.mjs";
import { runHelp } from "../commands/help.mjs";

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
  check: runCheck,
  lint: runCheck,
  doctor: runDoctor,
  diag: runDoctor,
  examples: runExamples,
  example: runExamples,
  ex: runExamples,
  search: runSearch,
  find: runSearch,
  show: runShow,
  cat: runShow,
  route: runRoute,
  routes: (args) => runRoute(["--list", ...args]),
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

function levenshteinDistance(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + substitutionCost,
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

export function suggestCommand(name, commandNames = CANONICAL_COMMANDS) {
  const input = String(name || "").trim().toLowerCase();
  if (input.length < 2) return "";

  const ranked = commandNames
    .map((command) => ({
      command,
      distance: levenshteinDistance(input, command),
    }))
    .sort((a, b) => a.distance - b.distance || a.command.localeCompare(b.command));

  const best = ranked[0];
  if (!best) return "";

  const threshold = input.length <= 4 ? 1 : 2;
  return best.distance <= threshold ? best.command : "";
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
