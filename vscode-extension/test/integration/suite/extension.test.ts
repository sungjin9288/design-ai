// Integration tests that run inside a real VS Code instance.
//
// Verifies:
// - The extension activates without errors.
// - All 10 declared commands are registered with vscode.commands.
// - Configuration keys are accepted.
// - Tree providers register against the design-ai view container.

import * as assert from "node:assert/strict";
import * as path from "node:path";
import * as vscode from "vscode";

const EXTENSION_ID = "sungjin.design-ai-vscode";
const EXPECTED_COMMANDS = [
  "design-ai.install",
  "design-ai.status",
  "design-ai.openKnowledge",
  "design-ai.openSpec",
  "design-ai.openSkill",
  "design-ai.openWalkthrough",
  "design-ai.openReadme",
  "design-ai.search",
  "design-ai.refreshTree",
  "design-ai.openSettings",
] as const;

suite("design-ai extension — integration", () => {
  suiteSetup(async function () {
    // Force activation. onStartupFinished should already have fired, but be defensive.
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `extension ${EXTENSION_ID} should be loaded`);
    if (!ext.isActive) {
      await ext.activate();
    }
  });

  test("extension is active after activation event", () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.equal(ext?.isActive, true);
  });

  test("all 10 declared commands are registered", async () => {
    const allCommands = await vscode.commands.getCommands(/* filterInternal */ true);
    for (const cmd of EXPECTED_COMMANDS) {
      assert.ok(
        allCommands.includes(cmd),
        `command ${cmd} should be registered`,
      );
    }
  });

  test("design-ai.path setting is readable", () => {
    const cfg = vscode.workspace.getConfiguration("design-ai");
    const value = cfg.get<string>("path");
    // Value can be empty string (default); assert it's at least a string.
    assert.equal(typeof value, "string");
  });

  test("design-ai.language setting accepts en or ko", () => {
    const cfg = vscode.workspace.getConfiguration("design-ai");
    const value = cfg.get<"en" | "ko">("language");
    assert.ok(value === "en" || value === "ko", `unexpected: ${value}`);
  });

  test("openSettings command opens the settings UI without throwing", async () => {
    // Should resolve cleanly even though no UI assertion is possible here.
    await vscode.commands.executeCommand("design-ai.openSettings");
    // Close the opened editor to keep the test environment clean.
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  });

  test("status command resolves (with or without source)", async () => {
    // If design-ai.path is unset and probing fails, we expect a warning
    // dialog rather than a throw. The command should complete.
    await vscode.commands.executeCommand("design-ai.status");
  });

  test("refreshTree command resolves", async () => {
    await vscode.commands.executeCommand("design-ai.refreshTree");
  });

  test("activity bar view container 'design-ai' is registered", async () => {
    // Open the design-ai view container; if the registration is missing,
    // this command will reject.
    await vscode.commands.executeCommand("workbench.view.extension.design-ai");
    // Restore previous focus by closing the activity bar (best-effort).
  });
});
