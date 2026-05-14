// `design-ai audit` — run the repository quality gate from the shipped CLI.

import path from "node:path";

import { run } from "../lib/exec.mjs";
import { header, info } from "../lib/log.mjs";
import { DESIGN_AI_HOME, pathExists } from "../lib/paths.mjs";

const AUDIT_RUNNER = path.join(DESIGN_AI_HOME, "tools", "audit", "run-all.py");
const ALLOWED_ARGS = new Set(["--strict", "--quiet"]);

function normalizeArgs(args) {
  const normalized = [];
  for (const arg of args) {
    if (arg === "-h" || arg === "--help") {
      return ["--help"];
    }
    if (!ALLOWED_ARGS.has(arg)) {
      throw new Error(
        `Unknown audit option: ${arg}\n` +
          "Usage: design-ai audit [--strict] [--quiet]"
      );
    }
    normalized.push(arg);
  }
  return normalized;
}

function printHelp() {
  console.log("Usage:  design-ai audit [--strict] [--quiet]\n");
  console.log("Runs the same seven repository audits used by CI:");
  console.log("  frontmatter, link, Korean copy, integration, stale, coverage, example QA\n");
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
