// Boot a headless VS Code instance and run the integration suite inside it.
//
// The test runner downloads VS Code (~300MB; cached after first run) and
// launches it with the extension under development loaded. The extension's
// activation, commands, and configuration are then exercised from the
// in-process test suite.
//
// Run: npm run test:e2e
// Requires: network access for VS Code download on first run.

import * as path from "node:path";
import { runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
  try {
    // Path to the extension's package.json (parent dir).
    const extensionDevelopmentPath = path.resolve(__dirname, "../../..");

    // Path to the compiled test suite entry point.
    const extensionTestsPath = path.resolve(__dirname, "./suite/index.js");

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      // Use a dedicated user-data dir so the test run doesn't pollute the
      // developer's real VS Code profile.
      launchArgs: [
        "--disable-extensions",
        "--user-data-dir",
        path.resolve(__dirname, "./.vscode-test-user-data"),
      ],
    });
  } catch (err) {
    console.error("Failed to run integration tests:", err);
    process.exit(1);
  }
}

void main();
