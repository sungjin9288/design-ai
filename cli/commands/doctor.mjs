// `design-ai doctor` — diagnose source, runtime, and Claude Code install state.

import { collectDoctorReport, STATUS } from "../lib/doctor.mjs";
import { header, info, success, warn, error, dim } from "../lib/log.mjs";
import { run } from "../lib/exec.mjs";
import {
  DESIGN_AI_HOME,
  CLAUDE_HOME,
  SYMLINK_PREFIX,
  INSTALL_SCRIPT,
} from "../lib/paths.mjs";
import { unknownOptionMessage } from "../lib/suggest.mjs";

const DOCTOR_OPTIONS = ["-h", "--help", "--strict", "--json", "--fix"];
const ALLOWED_ARGS = new Set(["--strict", "--json", "--fix"]);

function normalizeArgs(args) {
  const flags = {
    strict: false,
    json: false,
    fix: false,
    help: false,
  };

  for (const arg of args) {
    if (arg === "-h" || arg === "--help") {
      flags.help = true;
      continue;
    }
    if (!ALLOWED_ARGS.has(arg)) {
      throw new Error(
        `${unknownOptionMessage("doctor", arg, DOCTOR_OPTIONS)}\n` +
          "Usage: design-ai doctor [--strict] [--json] [--fix]",
      );
    }
    if (arg === "--strict") flags.strict = true;
    if (arg === "--json") flags.json = true;
    if (arg === "--fix") flags.fix = true;
  }

  return flags;
}

function printHelp() {
  console.log("Usage:  design-ai doctor [--strict] [--json] [--fix]\n");
  console.log("Checks source layout, versions, runtimes, audit tooling, and Claude Code symlinks.\n");
  console.log("Options:");
  console.log("  --strict   Exit non-zero when warnings are present");
  console.log("  --json     Emit machine-readable diagnostics");
  console.log("  --fix      Re-run install.sh when diagnostics show only fixable warnings");
}

function printCheck(check) {
  const line = `${check.label}: ${check.detail}`;
  if (check.status === STATUS.PASS) {
    success(line);
  } else if (check.status === STATUS.WARN) {
    warn(line);
  } else {
    error(line);
  }

  if (check.action) {
    console.log(`   ${dim(check.action)}`);
  }
}

async function applyFix() {
  await run("bash", [INSTALL_SCRIPT, "install"], {
    cwd: DESIGN_AI_HOME,
    silent: true,
    env: {
      DESIGN_AI_PREFIX: SYMLINK_PREFIX,
      CLAUDE_HOME,
    },
  });
}

function printReport(report) {
  header("design-ai doctor", "Diagnose install and runtime health");
  info(`Source: ${report.context.sourceRoot}`);
  info(`Target: ${report.context.claudeHome}`);
  info(`Prefix: ${report.context.prefix}`);
  console.log();

  for (const check of report.checks) {
    printCheck(check);
  }

  console.log();
  info(
    `Summary: ${report.summary.pass} pass, ${report.summary.warn} warning(s), ${report.summary.fail} failure(s)`,
  );
}

export async function runDoctor(args) {
  const flags = normalizeArgs(args);
  if (flags.help) {
    printHelp();
    return;
  }

  const before = collectDoctorReport();
  let report = before;
  let fix = {
    attempted: false,
    applied: false,
    reason: "",
  };

  if (flags.fix) {
    fix.attempted = true;
    if (before.summary.fail > 0) {
      fix.reason = "Skipped because diagnostics contain failure(s) that require manual review.";
    } else if (before.summary.warn === 0) {
      fix.reason = "Skipped because no fixable warnings were found.";
    } else {
      await applyFix();
      fix.applied = true;
      fix.reason = "Ran install.sh to refresh Claude Code symlinks.";
      report = collectDoctorReport();
    }
  }

  if (flags.json) {
    console.log(JSON.stringify({ ...report, fix }, null, 2));
  } else {
    printReport(report);
    if (flags.fix) {
      if (fix.applied) {
        success(`Fix applied: ${fix.reason}`);
      } else {
        warn(`Fix not applied: ${fix.reason}`);
      }
    }
  }

  if (report.summary.fail > 0 || (flags.strict && report.summary.warn > 0)) {
    process.exitCode = 1;
  }
}
