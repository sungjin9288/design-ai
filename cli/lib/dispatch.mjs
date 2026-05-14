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

export async function runCommand(name, args) {
  const handler = commands[name];
  if (!handler) {
    console.error(`Unknown command: ${name}`);
    console.error(`Run \`design-ai help\` for usage.`);
    process.exit(1);
  }
  await handler(args);
}
