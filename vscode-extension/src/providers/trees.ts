// Tree data providers for the four sidebar views (Skills / Knowledge / Examples / Walkthroughs).

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

class FileTreeItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly fileUri: vscode.Uri,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
  ) {
    super(label, collapsibleState);
    this.command = {
      command: "vscode.open",
      title: "Open",
      arguments: [fileUri],
    };
    this.contextValue = "file";
    this.resourceUri = fileUri;
  }
}

class FolderTreeItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly folderPath: string,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed,
  ) {
    super(label, collapsibleState);
    this.contextValue = "folder";
    this.iconPath = new vscode.ThemeIcon("folder");
  }
}

abstract class BaseProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  constructor(protected designAiPath: string) {}

  refresh(): void {
    this._onDidChange.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  abstract getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]>;

  protected listMdFiles(dir: string): vscode.TreeItem[] {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const items: vscode.TreeItem[] = [];

    // First the markdown files
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const full = path.join(dir, entry.name);
        items.push(
          new FileTreeItem(
            entry.name.replace(/\.md$/, ""),
            vscode.Uri.file(full),
          ),
        );
      }
    }

    // Then folders
    for (const entry of entries) {
      if (entry.isDirectory()) {
        items.push(
          new FolderTreeItem(entry.name, path.join(dir, entry.name)),
        );
      }
    }

    return items.sort((a, b) => {
      const al = String(a.label);
      const bl = String(b.label);
      // Folders after files? Or files after folders? Mixed alpha order.
      return al.localeCompare(bl);
    });
  }
}

// --- Skills tree ---

export class SkillsTreeProvider extends BaseProvider {
  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    const skillsDir = path.join(this.designAiPath, "skills");
    if (!fs.existsSync(skillsDir)) return [];

    if (!element) {
      // Root: list skill directories
      return fs
        .readdirSync(skillsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => {
          const playbook = path.join(skillsDir, d.name, "PLAYBOOK.md");
          return new FileTreeItem(d.name, vscode.Uri.file(playbook));
        })
        .sort((a, b) => String(a.label).localeCompare(String(b.label)));
    }
    return [];
  }
}

// --- Knowledge tree (recursive) ---

export class KnowledgeTreeProvider extends BaseProvider {
  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    const root = path.join(this.designAiPath, "knowledge");
    const target = element instanceof FolderTreeItem ? element.folderPath : root;
    return this.listMdFiles(target);
  }
}

// --- Examples tree (component specs) ---

export class ExamplesTreeProvider extends BaseProvider {
  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    const root = path.join(this.designAiPath, "examples");
    if (!fs.existsSync(root) || element) return [];

    return fs
      .readdirSync(root)
      .filter((name) => name.startsWith("component-") && name.endsWith(".md"))
      .map((name) =>
        new FileTreeItem(
          name.replace(/^component-|\.md$/g, ""),
          vscode.Uri.file(path.join(root, name)),
        ),
      )
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }
}

// --- Walkthroughs tree ---

export class WalkthroughsTreeProvider extends BaseProvider {
  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    const root = path.join(this.designAiPath, "docs", "integrations");
    if (!fs.existsSync(root) || element) return [];

    return fs
      .readdirSync(root)
      .filter((name) => name.endsWith("-walkthrough.md"))
      .map((name) => {
        const label = name
          .replace(/-walkthrough\.md$/, "")
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return new FileTreeItem(
          label,
          vscode.Uri.file(path.join(root, name)),
        );
      })
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }
}
