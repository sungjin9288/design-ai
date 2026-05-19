# Figma MCP integration

Use Figma MCP to bridge design-ai with real Figma files: read existing tokens/components, write generated tokens as Variables, set up Code Connect mappings.

## Available tools (when MCP connected)

| Tool | What it does |
| --- | --- |
| `mcp__Figma__get_metadata` | File structure — nodes, pages, components |
| `mcp__Figma__get_design_context` | Selected node's design tokens, styles, components |
| `mcp__Figma__get_variable_defs` | All Variables in the file |
| `mcp__Figma__get_screenshot` | Render a frame as image |
| `mcp__Figma__get_code_connect_map` | Existing Code Connect mappings |
| `mcp__Figma__add_code_connect_map` | Add a new component mapping |
| `mcp__Figma__create_design_system_rules` | Apply rule sets to file |

## Workflow A: read tokens from Figma

When a designer maintains tokens in Figma and you want to extract them.

```
You: Pull the latest tokens from this Figma file: <link>
Agent:
  1. mcp__Figma__get_variable_defs(file_key=...)
  2. Transforms the result into design-ai's token format (W3C DTCG / Style Dictionary).
  3. Saves to refs/figma/<file>-tokens.json (gitignored).
  4. Shows summary: "Extracted 47 color, 12 spacing, 8 typography variables."
```

The output is then consumed by `tools/extractors/figma.py` (when added) or imported into Style Dictionary directly.

## Workflow B: audit a Figma design

When designs are in Figma and you want a design-ai review.

```
You: Audit this Figma frame: <link>
Agent:
  1. mcp__Figma__get_screenshot(file_key=..., node_id=...)
     [image returned, agent inspects]
  2. mcp__Figma__get_design_context(file_key=..., node_id=...)
     [used components, applied tokens]
  3. Apply skills/ux-audit/PLAYBOOK.md against the screenshot + tokens.
  4. Output: severity-ranked findings.
```

The agent evaluates the design AND its token usage simultaneously.

## Workflow C: spec a component from Figma

User has a component in Figma but no spec.

```
You: Spec this component: <Figma link with node_id>
Agent:
  1. mcp__Figma__get_metadata(file_key=..., node_id=...)
  2. Read variants from the component set.
  3. Read tokens from the design context.
  4. Apply skills/component-spec-writer/PLAYBOOK.md.
  5. Output a spec markdown file matching examples/component-*.md format.
```

The Figma component is the source; the spec is the derived contract.

## Workflow D: write tokens TO Figma

When code is the source-of-truth and Figma needs updating.

```
You: Push our design-ai tokens to this Figma file: <link>
Agent:
  1. Read tokens/source.json from the project.
  2. For each token, mcp__Figma__... (write Variable).

  Note: as of mid-2025, Figma MCP's WRITE access for Variables is
  limited. The Tokens Studio plugin is more capable for bidirectional
  sync. For now, READ is the strong path.
```

For real two-way sync: use Tokens Studio (UI-based) AND Figma MCP (read-only verification). See [`docs/TOKEN-SYNC.md`](../TOKEN-SYNC.md).

## Workflow E: Code Connect mapping via MCP

Map a Figma component to its React code without leaving the agent.

```
You: Map our Figma Button to src/components/Button/Button.tsx
Agent:
  1. mcp__Figma__get_code_connect_map(file_key=...)
     [check existing mappings]
  2. Read the React component's TypeScript types.
  3. Build a Code Connect manifest matching variants.
  4. mcp__Figma__add_code_connect_map(file_key=..., mapping={...})
  5. Confirm.
```

## Setup

### Authentication

Figma MCP requires:
- A Figma account (free or paid).
- The Figma desktop app open (some MCPs need active session).
- An auth token with read scope (and write, for token-write workflows).

```bash
# Claude Code
claude mcp add figma --command "npx" --args "@figma/mcp-server"

# Codex CLI: add to ~/.codex/mcp.json
```

After setup, run `mcp__Figma__get_metadata` once to verify auth works.

### File access

Figma MCP reads files the authenticated user can access. For team files: ensure the auth user has been invited.

For public Figma Community files: anyone can read with auth.

## Common pitfalls

| Pitfall | Fix |
| --- | --- |
| MCP can't find file | Verify `file_key` in URL: `figma.com/file/<file_key>/...` |
| Variables not returned | File uses Styles (legacy), not Variables. Check Figma's Variables panel. |
| Permission denied | Auth user needs file access. Re-auth or share the file. |
| Rate limit | Figma API caps. Cache MCP responses; avoid polling. |

## Privacy

- Figma file URLs identify private design work. Don't commit them to public repos.
- The auth token has access to all files the user can see — careful where it's deployed.
- design-ai never logs or echoes the auth token (skills reference `mcp__Figma__*` tools, not the underlying credentials).

## When Figma MCP is unavailable

design-ai's `figma-token-sync` skill detects no MCP and falls back to:
- Asking user to export tokens from Tokens Studio plugin manually.
- Asking user to paste a screenshot for visual audits.
- Skipping the Code Connect step (do it via Figma desktop directly).

## Cross-reference

- [`docs/MCP-INTEGRATION.md`](../MCP-INTEGRATION.md) — overview
- [`docs/FIGMA-INTEGRATION.md`](../FIGMA-INTEGRATION.md) — broader Figma workflows (without MCP)
- [`docs/TOKEN-SYNC.md`](../TOKEN-SYNC.md) — token sync strategy
- [`skills/figma-token-sync/PLAYBOOK.md`](../../skills/figma-token-sync/PLAYBOOK.md) — the MCP-aware skill
- `tools/figma-plugin/README.md` — alternative manual import path
