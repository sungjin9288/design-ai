# Current Architecture Evidence

```mermaid
flowchart TD
  User["User or AI coding agent"]
  Instructions["AGENTS.md / CLAUDE.md instructions"]
  CLI["design-ai CLI\ncli/bin/design-ai.mjs"]
  Dispatcher["Command dispatcher\ncli/lib/dispatch.mjs"]
  Workflows["CLI workflows\nroute / prompt / pack / check / audit / workspace / site / learn"]
  Corpus["Markdown corpus\nknowledge / skills / commands / agents / examples"]
  WebsiteConsole["Website Improvement Console\ndocs/website-console"]
  LocalArtifacts["Local artifacts\nMarkdown / JSON / bundles / logs"]
  DocsSite["MkDocs documentation site\nmkdocs.yml"]
  VSCode["VS Code extension\nvscode-extension"]

  User --> Instructions
  User --> CLI
  CLI --> Dispatcher
  Dispatcher --> Workflows
  Workflows --> Corpus
  Workflows --> LocalArtifacts
  User --> WebsiteConsole
  WebsiteConsole --> LocalArtifacts
  Corpus --> DocsSite
  Corpus --> VSCode
```

## Evidence files

- `cli/bin/design-ai.mjs`
- `cli/lib/dispatch.mjs`
- `cli/commands/*.mjs`
- `cli/lib/*.mjs`
- `knowledge/`
- `skills/`
- `commands/`
- `examples/`
- `docs/website-console/index.html`
- `docs/website-console/app.js`
- `mkdocs.yml`
- `vscode-extension/package.json`
