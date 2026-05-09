// Command implementations.

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as cp from "child_process";
import { getLanguagePreference } from "./paths";

export function registerCommands(
  context: vscode.ExtensionContext,
  designAiPath: string | undefined,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("design-ai.install", () =>
      install(designAiPath),
    ),
    vscode.commands.registerCommand("design-ai.status", () =>
      status(designAiPath),
    ),
    vscode.commands.registerCommand("design-ai.openKnowledge", () =>
      openFromDir(designAiPath, "knowledge", "Open knowledge file"),
    ),
    vscode.commands.registerCommand("design-ai.openSpec", () =>
      openFromGlob(
        designAiPath,
        "examples/component-*.md",
        "Open component spec",
      ),
    ),
    vscode.commands.registerCommand("design-ai.openSkill", () =>
      openSkill(designAiPath),
    ),
    vscode.commands.registerCommand("design-ai.openWalkthrough", () =>
      openFromGlob(
        designAiPath,
        "docs/integrations/*-walkthrough.md",
        "Open integration walkthrough",
      ),
    ),
    vscode.commands.registerCommand("design-ai.openSettings", () =>
      vscode.commands.executeCommand("workbench.action.openSettings", "design-ai"),
    ),
  );
}

// ----- helpers -----

async function install(designAiPath: string | undefined): Promise<void> {
  if (!designAiPath) {
    vscode.window.showErrorMessage("design-ai path not found. Set 'design-ai.path' in settings.");
    return;
  }

  const installScript = path.join(designAiPath, "install.sh");
  if (!fs.existsSync(installScript)) {
    vscode.window.showErrorMessage(`install.sh not found at ${installScript}`);
    return;
  }

  const terminal = vscode.window.createTerminal({
    name: "design-ai install",
    cwd: designAiPath,
  });
  terminal.show();
  terminal.sendText("./install.sh", true);
}

async function status(designAiPath: string | undefined): Promise<void> {
  if (!designAiPath) {
    vscode.window.showWarningMessage("design-ai source not found.");
    return;
  }

  // Read .claude-plugin/plugin.json for version + counts
  try {
    const manifestPath = path.join(designAiPath, ".claude-plugin", "plugin.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    const message =
      `design-ai v${manifest.version}\n` +
      `Source: ${designAiPath}\n` +
      `Skills: ${(manifest.skills ?? []).length}\n` +
      `Commands: ${(manifest.commands ?? []).length}\n` +
      `Agents: ${(manifest.agents ?? []).length}`;

    vscode.window.showInformationMessage(message, { modal: false });
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to read plugin manifest: ${err}`);
  }
}

async function openFromDir(
  designAiPath: string | undefined,
  subdir: string,
  prompt: string,
): Promise<void> {
  if (!designAiPath) {
    vscode.window.showErrorMessage("design-ai path not found.");
    return;
  }

  const root = path.join(designAiPath, subdir);
  const files = walkMd(root)
    .map((f) => ({
      label: path.relative(root, f),
      description: path.relative(designAiPath, f),
      file: f,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (files.length === 0) {
    vscode.window.showWarningMessage(`No markdown files found in ${subdir}/`);
    return;
  }

  const pick = await vscode.window.showQuickPick(files, {
    placeHolder: prompt,
    matchOnDescription: true,
  });

  if (pick) {
    const doc = await vscode.workspace.openTextDocument(pick.file);
    await vscode.window.showTextDocument(doc);
  }
}

async function openFromGlob(
  designAiPath: string | undefined,
  globPattern: string,
  prompt: string,
): Promise<void> {
  if (!designAiPath) {
    vscode.window.showErrorMessage("design-ai path not found.");
    return;
  }

  // Manual glob without dependencies
  const [dir, pattern] = splitGlob(globPattern);
  const fullDir = path.join(designAiPath, dir);

  if (!fs.existsSync(fullDir)) {
    vscode.window.showWarningMessage(`Directory not found: ${dir}/`);
    return;
  }

  const re = new RegExp("^" + pattern.replace(/\*/g, "[^/]*") + "$");
  const files = fs
    .readdirSync(fullDir)
    .filter((name) => re.test(name))
    .map((name) => path.join(fullDir, name));

  if (files.length === 0) {
    vscode.window.showWarningMessage(`No files matching ${globPattern}`);
    return;
  }

  const items = files
    .map((f) => ({
      label: path.basename(f),
      description: path.relative(designAiPath, f),
      file: f,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: prompt,
    matchOnDescription: true,
  });

  if (pick) {
    const doc = await vscode.workspace.openTextDocument(pick.file);
    await vscode.window.showTextDocument(doc);
  }
}

async function openSkill(designAiPath: string | undefined): Promise<void> {
  if (!designAiPath) {
    vscode.window.showErrorMessage("design-ai path not found.");
    return;
  }

  const skillsDir = path.join(designAiPath, "skills");
  if (!fs.existsSync(skillsDir)) {
    vscode.window.showWarningMessage("skills/ directory not found");
    return;
  }

  const skills = fs
    .readdirSync(skillsDir)
    .filter((name) => fs.statSync(path.join(skillsDir, name)).isDirectory())
    .map((name) => ({
      label: name,
      description: path.relative(designAiPath, path.join(skillsDir, name, "PLAYBOOK.md")),
      file: path.join(skillsDir, name, "PLAYBOOK.md"),
    }))
    .filter((entry) => fs.existsSync(entry.file))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (skills.length === 0) {
    vscode.window.showWarningMessage("No skills found");
    return;
  }

  const pick = await vscode.window.showQuickPick(skills, {
    placeHolder: "Open skill PLAYBOOK",
  });

  if (pick) {
    const doc = await vscode.workspace.openTextDocument(pick.file);
    await vscode.window.showTextDocument(doc);
  }
}

// ----- utilities -----

function walkMd(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop()!;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(full);
      }
    }
  }
  return files;
}

function splitGlob(pattern: string): [string, string] {
  const idx = pattern.lastIndexOf("/");
  if (idx === -1) return ["", pattern];
  return [pattern.slice(0, idx), pattern.slice(idx + 1)];
}
