// Locate the design-ai source directory.
//
// Resolution order:
//   1. design-ai.path setting (if set)
//   2. workspace folder containing AGENTS.md + .claude-plugin/plugin.json
//   3. Common locations: ~/dev/design-ai, ~/.local/lib/design-ai,
//      /opt/design-ai, /usr/local/lib/design-ai
//   4. Probe for npm-installed @design-ai/cli package

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const REQUIRED_MARKERS = ["AGENTS.md", path.join(".claude-plugin", "plugin.json")];

export function isDesignAiRoot(dir: string): boolean {
  return REQUIRED_MARKERS.every((m) => fs.existsSync(path.join(dir, m)));
}

export function findDesignAiPath(): string | undefined {
  // 1. Setting
  const setting = vscode.workspace.getConfiguration("design-ai").get<string>("path");
  if (setting && fs.existsSync(setting) && isDesignAiRoot(setting)) {
    return setting;
  }

  // 2. Open workspace folder(s)
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    if (isDesignAiRoot(folder.uri.fsPath)) {
      return folder.uri.fsPath;
    }
  }

  // 3. Common locations
  const home = os.homedir();
  const candidates = [
    path.join(home, "dev", "design-ai"),
    path.join(home, "dev", "design"),
    path.join(home, ".local", "lib", "design-ai"),
    "/opt/design-ai",
    "/usr/local/lib/design-ai",
    // npm global install
    path.join(home, ".npm-global", "lib", "node_modules", "@design-ai", "cli"),
    path.join("/usr/local/lib/node_modules/@design-ai/cli"),
    path.join("/opt/homebrew/lib/node_modules/@design-ai/cli"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && isDesignAiRoot(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

export function getLanguagePreference(): "en" | "ko" {
  const lang = vscode.workspace.getConfiguration("design-ai").get<string>("language");
  return lang === "ko" ? "ko" : "en";
}
