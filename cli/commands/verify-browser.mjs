import { header, info, warn } from "../lib/log.mjs";
import { parseBrowserVerificationArgs } from "../lib/browser-verification.mjs";
import { runBrowserVerification } from "../lib/browser-verification-runner.mjs";

function printHelp() {
  console.log("Usage:  design-ai verify-browser <quality-report.json> --url loopback-url --target-root path --adapter executable --approval-ref text --yes [options]\n");
  console.log("Runs an approved external browser adapter and records normalized local evidence.\n");
  console.log("Options:");
  console.log("  --url url              Running loopback preview URL");
  console.log("  --target-root path     Target repository root; evidence must remain outside it");
  console.log("  --adapter executable   Browser probe adapter to execute");
  console.log("  --adapter-arg value    Adapter argument; repeat as needed");
  console.log("  --approval-ref text    Human-readable approval record");
  console.log("  --viewport spec        Repeatable viewport. Defaults: mobile=390x844, desktop=1440x900");
  console.log("  --yes                  Confirm browser execution and local evidence writes");
  console.log("  --json                 Emit the normalized browser verification JSON");
  console.log("\nBoundary: On macOS/Linux, Design AI confines its own writes to ~/.design-ai/evidence/browser and compares the source-report digest after adapter exit. The user-supplied adapter is not sandboxed; target-repository writes, external writes, and restored intermediate source mutations remain unverified.");
}

export async function runVerifyBrowser(args) {
  const parsed = parseBrowserVerificationArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }
  const { report, reportFile } = await runBrowserVerification(parsed);
  if (parsed.json) console.log(JSON.stringify(report, null, 2));
  else {
    header("design-ai verify-browser", "Approved browser evidence run");
    info(`Status: ${report.summary.status}`);
    info(`URL: ${report.run.url}`);
    info(`Evidence: ${reportFile}`);
    info(`Passed: ${report.summary.passed}; failed: ${report.summary.failed}; unverified: ${report.summary.unverified}`);
    if (report.summary.status !== "pass") warn(report.summary.nextAction);
  }
  if (report.summary.status !== "pass") process.exitCode = 1;
}
