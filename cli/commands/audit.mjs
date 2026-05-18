// `design-ai audit` — run the repository quality gate from the shipped CLI.

import path from "node:path";

import { run } from "../lib/exec.mjs";
import { REPOSITORY_AUDIT_SCRIPTS } from "../lib/doctor.mjs";
import { header, info } from "../lib/log.mjs";
import { DESIGN_AI_HOME, pathExists } from "../lib/paths.mjs";
import { unknownOptionMessage } from "../lib/suggest.mjs";

const AUDIT_RUNNER = path.join(DESIGN_AI_HOME, "tools", "audit", "run-all.py");
const AUDIT_OPTIONS = ["-h", "--help", "--strict", "--quiet"];
const ALLOWED_ARGS = new Set(["--strict", "--quiet"]);
const AUDIT_HELP_LABEL_OVERRIDES = new Map([
  ["korean-copy-check.py", "Korean copy"],
  ["example-qa.py", "example QA"],
]);

export function auditScriptLabel(script) {
  if (AUDIT_HELP_LABEL_OVERRIDES.has(script)) {
    return AUDIT_HELP_LABEL_OVERRIDES.get(script);
  }

  return script
    .replace(/\.py$/, "")
    .replace(/-check$/, "")
    .replace(/^check-/, "")
    .replaceAll("-", " ");
}

function normalizeArgs(args) {
  const normalized = [];
  for (const arg of args) {
    if (arg === "-h" || arg === "--help") {
      return ["--help"];
    }
    if (!ALLOWED_ARGS.has(arg)) {
      throw new Error(
        `${unknownOptionMessage("audit", arg, AUDIT_OPTIONS)}\n` +
          "Usage: design-ai audit [--strict] [--quiet]"
      );
    }
    normalized.push(arg);
  }
  return normalized;
}

function printHelp() {
  const auditLabels = REPOSITORY_AUDIT_SCRIPTS.map(auditScriptLabel).join(", ");

  console.log("Usage:  design-ai audit [--strict] [--quiet]\n");
  console.log(`Runs the same ${REPOSITORY_AUDIT_SCRIPTS.length} repository audits used by CI:`);
  console.log(`  ${auditLabels}\n`);
  console.log("Options:");
  console.log("  --strict   Exit non-zero when any supported audit fails");
  console.log("  --quiet    Print only failures and the final summary");
}

export async function runAudit(args) {
  const auditArgs = normalizeArgs(args);
  if (auditArgs.includes("--help")) {
    printHelp();
    return;
  }

  header("design-ai audit", "Run repository quality checks");

  if (!pathExists(AUDIT_RUNNER)) {
    throw new Error(
      `Audit runner not found at ${AUDIT_RUNNER}.\n` +
        "If installed via npm, this is a packaging bug. If running from a clone, ensure DESIGN_AI_HOME points at the repo root."
    );
  }

  info(`Source: ${DESIGN_AI_HOME}`);
  info("Runner: tools/audit/run-all.py");
  console.log();

  await run("python3", [AUDIT_RUNNER, ...auditArgs], {
    cwd: DESIGN_AI_HOME,
  });
}
