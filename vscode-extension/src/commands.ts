// Command implementations.
//
// Pure-logic helpers (file traversal, search, manifest reading, language
// pairing) live in ./lib.ts so they can be tested without VS Code APIs.

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getLanguagePreference } from "./paths";
import {
  searchCorpus,
  pairWalkthroughs,
  chooseWalkthrough,
  readManifest,
  pickReadme,
  walkMd,
  globToRegex,
  splitGlob,
} from "./lib";

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

  const [dir, pattern] = splitGlob(globPattern);
  const fullDir = path.join(designAiPath, dir);

  if (!fs.existsSync(fullDir)) {
    vscode.window.showWarningMessage(`Directory not found: ${dir}/`);
    return;
  }

  const re = globToRegex(pattern);
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

// ----- walkthrough with language preference -----

async function openWalkthrough(designAiPath: string | undefined): Promise<void> {
  if (!designAiPath) {
    vscode.window.showErrorMessage("design-ai path not found.");
    return;
  }

  const lang = getLanguagePreference();
  const integrationsDir = path.join(designAiPath, "docs", "integrations");
  const options = pairWalkthroughs(integrationsDir);

  if (options.length === 0) {
    vscode.window.showWarningMessage("No walkthroughs found in docs/integrations/.");
    return;
  }

  const items = options
    .map((opt) => {
      const chosen = chooseWalkthrough(opt, lang);
      if (!chosen) return null;
      const tag = chosen.lang === "ko" ? "[KO]" : "[EN]";
      const niceLabel = opt.stem.replace(/-walkthrough$/, "").replace(/-/g, " ");
      return {
        label: `${tag} ${niceLabel}`,
        description: path.relative(designAiPath, chosen.file),
        file: chosen.file,
      };
    })
    .filter((x): x is { label: string; description: string; file: string } => x !== null)
    .sort((a, b) => a.label.localeCompare(b.label));

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: lang === "ko" ? "통합 워크스루 열기" : "Open integration walkthrough",
    matchOnDescription: true,
  });

  if (pick) {
    const doc = await vscode.workspace.openTextDocument(pick.file);
    await vscode.window.showTextDocument(doc);
  }
}

// ----- README opener with language preference -----

async function openReadme(designAiPath: string | undefined): Promise<void> {
  if (!designAiPath) {
    vscode.window.showErrorMessage("design-ai path not found.");
    return;
  }

  const file = pickReadme(designAiPath, getLanguagePreference());
  if (!file) {
    vscode.window.showWarningMessage("README not found.");
    return;
  }
  const doc = await vscode.workspace.openTextDocument(file);
  await vscode.window.showTextDocument(doc);
}

// ----- search across knowledge / examples / skills / docs -----

async function search(designAiPath: string | undefined): Promise<void> {
  if (!designAiPath) {
    vscode.window.showErrorMessage("design-ai path not found.");
    return;
  }

  const lang = getLanguagePreference();
  const query = await vscode.window.showInputBox({
    placeHolder: lang === "ko" ? "검색어 (제목 또는 본문 내용)" : "Search term (title or body content)",
    prompt: lang === "ko" ? "design-ai 코퍼스 전체에서 검색해요" : "Search across the entire design-ai corpus",
  });

  if (!query || query.trim().length < 2) {
    return;
  }

  const hits = searchCorpus({ query, designAiPath });

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
