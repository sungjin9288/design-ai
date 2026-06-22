# CLI Sequence Evidence

```mermaid
sequenceDiagram
  actor U as User
  participant Bin as cli/bin/design-ai.mjs
  participant Dispatch as cli/lib/dispatch.mjs
  participant Command as cli/commands/*.mjs
  participant Lib as cli/lib/*.mjs
  participant Corpus as knowledge/skills/commands/examples
  participant Output as stdout or output artifact

  U->>Bin: design-ai route / prompt / pack / site
  Bin->>Dispatch: runCommand(command, args)
  Dispatch->>Command: call matching command handler
  Command->>Lib: parse args and execute workflow logic
  Lib->>Corpus: read relevant Markdown/JSON files
  Lib->>Output: write report, prompt, pack, bundle, or JSON
  Output-->>U: result and exit code
```

## Verified in this evidence run

- `evidence/cli-logs/cli-version-json.log`
- `evidence/cli-logs/cli-route-json.log`
- `evidence/cli-logs/cli-prompt-output.log`
- `evidence/cli-logs/cli-pack-output.log`
- `evidence/cli-logs/cli-site-sample.log`
- `evidence/cli-logs/cli-site-next-actions.log`
