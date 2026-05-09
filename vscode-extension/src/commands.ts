// Command implementations.

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
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
      openWalkthrough(designAiPath),
    ),
    vscode.commands.registerCommand("design-ai.openReadme", () =>
      openReadme(designAiPath),
    ),
    vscode.commands.registerCommand("design-ai.search", () =>
      search(designAiPath),
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

interface PluginManifest {
  version: string;
  skills?: unknown[];
  commands?: unknown[];
  agents?: unknown[];
}

function readManifest(designAiPath: string): PluginManifest | undefined {
  try {
    const manifestPath = path.join(designAiPath, ".claude-plugin", "plugin.json");
    const text = fs.readFileSync(manifestPath, "utf-8");
    const parsed = JSON.parse(text) as PluginManifest;
    return parsed;
  } catch {
    return undefined;
  }
}

async function status(designAiPath: string | undefined): Promise<void> {
  if (!designAiPath) {
    vscode.window.showWarningMessage("design-ai source not found.");
    return;
  }

  const manifest = readManifest(designAiPath);
  if (!manifest) {
    vscode.window.showErrorMessage("Failed to read plugin manifest.");
    return;
  }

  const lang = getLanguagePreference();
  const labels = lang === "ko"
    ? { title: "design-ai", source: "소스", skills: "스킬", commands: "커맨드", agents: "에이전트" }
    : { title: "design-ai", source: "Source", skills: "Skills", commands: "Commands", agents: "Agents" };

  const message =
    `${labels.title} v${manifest.version}\n` +
    `${labels.source}: ${designAiPath}\n` +
    `${labels.skills}: ${(manifest.skills ?? []).length}\n` +
    `${labels.commands}: ${(manifest.commands ?? []).length}\n` +
    `${labels.agents}: ${(manifest.agents ?? []).length}`;

  vscode.window.showInformationMessage(message, { modal: false });
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

// ----- new: walkthrough with language preference -----

async function openWalkthrough(designAiPath: string | undefined): Promise<void> {
  if (!designAiPath) {
    vscode.window.showErrorMessage("design-ai path not found.");
    return;
  }

  const lang = getLanguagePreference();
  const integrationsDir = path.join(designAiPath, "docs", "integrations");

  if (!fs.existsSync(integrationsDir)) {
    vscode.window.showWarningMessage("docs/integrations/ not found");
    return;
  }

  const allFiles = fs.readdirSync(integrationsDir).filter((n) => n.endsWith("-walkthrough.md") || n.endsWith("-walkthrough.ko.md"));
  // Group: prefer .ko.md if KO selected, fall back to .md.
  const stems = new Set<string>();
  for (const name of allFiles) {
    stems.add(name.replace(/\.ko\.md$|\.md$/, ""));
  }

  const items = Array.from(stems)
    .map((stem) => {
      const koFile = `${stem}.ko.md`;
      const enFile = `${stem}.md`;
      const preferKo = lang === "ko" && allFiles.includes(koFile);
      const chosen = preferKo ? koFile : enFile;
      const tag = preferKo ? "[KO]" : "[EN]";
      return {
        label: `${tag} ${stem.replace(/-walkthrough$/, "").replace(/-/g, " ")}`,
        description: chosen,
        file: path.join(integrationsDir, chosen),
      };
    })
    .filter((entry) => fs.existsSync(entry.file))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (items.length === 0) {
    vscode.window.showWarningMessage("No walkthroughs found.");
    return;
  }

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: lang === "ko" ? "통합 워크스루 열기" : "Open integration walkthrough",
    matchOnDescription: true,
  });

  if (pick) {
    const doc = await vscode.workspace.openTextDocument(pick.file);
    await vscode.window.showTextDocument(doc);
  }
}

// ----- new: README opener with language preference -----

async function openReadme(designAiPath: string | undefined): Promise<void> {
  if (!designAiPath) {
    vscode.window.showErrorMessage("design-ai path not found.");
    return;
  }

  const lang = getLanguagePreference();
  const candidates = lang === "ko"
    ? ["README.ko.md", "README.md"]
    : ["README.md"];

  for (const name of candidates) {
    const full = path.join(designAiPath, name);
    if (fs.existsSync(full)) {
      const doc = await vscode.workspace.openTextDocument(full);
      await vscode.window.showTextDocument(doc);
      return;
    }
  }

  vscode.window.showWarningMessage("README not found.");
}

// ----- new: search across knowledge / examples / skills / docs -----

async function search(designAiPath: string | undefined): Promise<void> {
  if (!designAiPath) {
    vscode.window.showErrorMessage("design-ai path not found.");
    return;
  }

  const lang = getLanguagePreference();
  const placeholder = lang === "ko"
    ? "검색어 (제목 또는 본문 내용)"
    : "Search term (title or body content)";

  const query = await vscode.window.showInputBox({
    placeHolder: placeholder,
    prompt: lang === "ko"
      ? "design-ai 코퍼스 전체에서 검색해요"
      : "Search across the entire design-ai corpus",
  });

  if (!query || query.trim().length < 2) {
    return;
  }

  const needle = query.toLowerCase();
  const dirs = ["knowledge", "examples", "skills", "docs", "agents", "commands"];
  type Hit = { file: string; lineNumber: number; preview: string; relPath: string };
  const hits: Hit[] = [];

  for (const dir of dirs) {
    const root = path.join(designAiPath, dir);
    for (const file of walkMd(root)) {
      try {
        const content = fs.readFileSync(file, "utf-8");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(needle)) {
            hits.push({
              file,
              lineNumber: i + 1,
              preview: lines[i].trim().slice(0, 120),
              relPath: path.relative(designAiPath, file),
            });
            break; // first match per file is enough
          }
        }
      } catch {
        // skip unreadable files
      }
      if (hits.length >= 200) break; // cap
    }
    if (hits.length >= 200) break;
  }

  if (hits.length === 0) {
    vscode.window.showInformationMessage(
      lang === "ko" ? `"${query}" 결과 없음` : `No results for "${query}"`,
    );
    return;
  }

  const items = hits.map((hit) => ({
    label: hit.relPath,
    description: `:${hit.lineNumber}`,
    detail: hit.preview,
    hit,
  }));

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder:
      lang === "ko"
        ? `${hits.length}개 결과 — "${query}"`
        : `${hits.length} results for "${query}"`,
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (pick) {
    const doc = await vscode.workspace.openTextDocument(pick.hit.file);
    const editor = await vscode.window.showTextDocument(doc);
    const pos = new vscode.Position(pick.hit.lineNumber - 1, 0);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
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
