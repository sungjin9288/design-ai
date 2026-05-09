// design-ai VS Code extension entry point.

import * as vscode from "vscode";
import { findDesignAiPath } from "./paths";
import { registerCommands } from "./commands";
import {
  SkillsTreeProvider,
  KnowledgeTreeProvider,
  ExamplesTreeProvider,
  WalkthroughsTreeProvider,
} from "./providers/trees";

export function activate(context: vscode.ExtensionContext): void {
  console.log("design-ai extension activated");

  const designAiPath = findDesignAiPath();

  if (!designAiPath) {
    vscode.window
      .showWarningMessage(
        "design-ai source not found. Set 'design-ai.path' in settings or install via npm/Homebrew/clone.",
        "Open settings",
        "Install guide",
      )
      .then((choice) => {
        if (choice === "Open settings") {
          vscode.commands.executeCommand("workbench.action.openSettings", "design-ai.path");
        } else if (choice === "Install guide") {
          vscode.env.openExternal(
            vscode.Uri.parse("https://github.com/sungjin/design-ai#install-claude-code"),
          );
        }
      });
  }

  // Register commands
  registerCommands(context, designAiPath);

  // Register tree providers
  if (designAiPath) {
    const skills = new SkillsTreeProvider(designAiPath);
    const knowledge = new KnowledgeTreeProvider(designAiPath);
    const examples = new ExamplesTreeProvider(designAiPath);
    const walkthroughs = new WalkthroughsTreeProvider(designAiPath);

    context.subscriptions.push(
      vscode.window.registerTreeDataProvider("design-ai.skills", skills),
      vscode.window.registerTreeDataProvider("design-ai.knowledge", knowledge),
      vscode.window.registerTreeDataProvider("design-ai.examples", examples),
      vscode.window.registerTreeDataProvider("design-ai.walkthroughs", walkthroughs),
    );

    // Refresh command refreshes all trees
    context.subscriptions.push(
      vscode.commands.registerCommand("design-ai.refreshTree", () => {
        skills.refresh();
        knowledge.refresh();
        examples.refresh();
        walkthroughs.refresh();
      }),
    );

    // Re-find the path if user changes the setting
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("design-ai.path")) {
        skills.refresh();
        knowledge.refresh();
        examples.refresh();
        walkthroughs.refresh();
      }
    });
  }
}

export function deactivate(): void {
  // Cleanup if needed
}
