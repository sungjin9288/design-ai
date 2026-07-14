# design-ai MCP server

Use this guide when you want Claude Code or Codex to call design-ai as an MCP server instead of asking the agent to read files manually.

The server is local, stdio-based, and deterministic. The current source candidate exposes 19 tools, including the shared start flow, supplied-HTML quality inspection, design artifact operations, recall, a read-only Website Improvement bundle handoff, a read-only linked-code preview inspection, and exactly three opt-in local learning-write tools. Published v5.0.0 remains at 17 tools. The server wraps existing `design-ai` CLI workflows such as route selection, prompt generation, corpus search, artifact checks, and Website Improvement planning.

## What the server exposes

| Tool | Purpose | Mutation risk |
|---|---|---|
| `design_ai_route` | Recommend the best design-ai route, skill, command, and knowledge files for a task brief. | Read-only |
| `design_ai_start` | Build one route, design contract, unexecuted review state, next command, and explicit performed/intended effect boundary from a brief and declared context. | Read-only; declared repository, page, and screenshot references are not inspected |
| `design_ai_inspect_html` | Inspect supplied HTML and return the canonical eight-lens quality report with confirmed and unverified findings kept separate. Oversized reports return valid structured error JSON rather than truncated JSON. | Read-only; reads only the supplied string and does not run scripts, open a browser, read paths, or write files |
| `design_ai_prompt` | Generate a ready-to-use prompt from a brief. Optional `withRecall` (with `recallLimit`, 1-20) augments the output with brief-relevant shipped corpus knowledge ranked by the deterministic lexical scorer; requires no index and makes no network call. | Read-only by default; `withLearning` records local usage metadata |
| `design_ai_artifact` | Build an `implementation-plan`, `critique-loop`, or agent-readable `DESIGN.md` contract with source files, approval boundary, and verification evidence. | Read-only; no file writes, external calls, or target-repo mutation |
| `design_ai_pack` | Generate a prompt plus bounded context files. Optional `withRecall` (with `recallLimit`, 1-20) augments the output with brief-relevant shipped corpus knowledge ranked by the deterministic lexical scorer; requires no index and makes no network call. | Read-only by default; `withLearning` records local usage metadata |
| `design_ai_search` | Search `knowledge/`, `examples/`, `skills/`, `docs/`, `agents/`, and `commands/`. Optional `ranked` opts into deterministic BM25-style results (`design-ai search --ranked`); requires no index and never builds one. | Read-only |
| `design_ai_show` | Read a corpus file or line range. | Read-only |
| `design_ai_examples` | Find worked examples by query or route. | Read-only |
| `design_ai_recall` | Recall brief-relevant shipped corpus knowledge plus local learning-profile entries for a query, ranked by the deterministic lexical scorer (`design-ai learn --recall`). | Read-only |
| `design_ai_check` | Check generated Markdown artifacts for grounding, accessibility, responsive notes, and unresolved markers. | Read-only |
| `design_ai_site_mcp_check` | Validate Website Improvement MCP readiness from workspace JSON. | Read-only |
| `design_ai_site_mcp_plan` | Generate a Website Improvement MCP action plan. | Read-only |
| `design_ai_site_linked_preview` | Inspect root metadata for the workspace's absolute local path and return an operator-controlled preview loop. | Read-only; no process start, URL probe, source scan, or target-repo mutation |
| `design_ai_site_bundle_handoff` | Verify a local Website Improvement bundle and return an approval-gated target-repo implementation prompt for an optional task selector. | Read-only; no external calls or target-repo mutation |
| `design_ai_learn_remember` | Record a local learning-profile preference for prompt personalization. | Writes only the local learning profile, opt-in |
| `design_ai_learn_feedback` | Record keep/improve/avoid feedback as a local learning-profile entry. | Writes only the local learning profile, opt-in |
| `design_ai_learn_capture` | Check a Markdown artifact, then capture its non-pass results as local learning-profile entries. The only compound read+write tool. | Writes only the local learning profile, opt-in |
| `design_ai_version` | Return CLI and corpus version metadata. | Read-only |

### Opt-in write tools

`design_ai_learn_remember`, `design_ai_learn_feedback`, and `design_ai_learn_capture` are the MCP mirror of the SDK's `learn.*` namespace (see [`../SDK.md`](../SDK.md)). Each writes ONLY the local learning profile (`DESIGN_AI_LEARNING_FILE` or its default path), and only when explicitly called by name — no other tool call implicitly triggers a write. `design_ai_learn_capture` maps to `design-ai check --stdin --learn --yes --json`, the same path as the CLI's `--learn --yes` capture flow.

## Start the server manually

From a local clone:

```bash
cd /path/to/design-ai
node cli/bin/design-ai-mcp.mjs
```

After package installation, use either entrypoint:

```bash
design-ai mcp
design-ai-mcp
```

To verify the public npm package without installing it globally, run the one-shot command from a clean directory outside a `@design-ai/cli` source checkout:

```bash
tmp="$(mktemp -d)"
cd "$tmp"
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25"}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | npm exec --yes --package=@design-ai/cli@4.65.0 -- design-ai-mcp
```

Running that one-shot command from the package source root can make npm prefer the local checkout context, which may hide the temporary package bin shim.

Do not run the server as a normal terminal command unless an MCP client is connected. It waits for newline-delimited JSON-RPC messages on stdin and writes MCP responses to stdout.

## Connect Claude Code

For a local-only server on the current machine:

```bash
claude mcp add --transport stdio design-ai -- design-ai mcp
```

If `design-ai` is not on `PATH`, point Claude Code at the local clone:

```bash
claude mcp add --transport stdio design-ai \
  -- node /path/to/design-ai/cli/bin/design-ai-mcp.mjs
```

Then open Claude Code and run:

```text
/mcp
```

Confirm that `design-ai` is connected and exposes tools.

Project-scoped Claude configuration can also live in `.mcp.json`:

```json
{
  "mcpServers": {
    "design-ai": {
      "command": "design-ai",
      "args": ["mcp"]
    }
  }
}
```

Claude Code asks for approval before using project-scoped `.mcp.json` servers.

## Connect Codex

Use the Codex CLI:

```bash
codex mcp add design-ai -- design-ai mcp
```

Or edit `~/.codex/config.toml`:

```toml
[mcp_servers.design-ai]
command = "design-ai"
args = ["mcp"]
startup_timeout_sec = 10
tool_timeout_sec = 60
```

For a local clone without a global install:

```toml
[mcp_servers.design-ai]
command = "node"
args = ["/path/to/design-ai/cli/bin/design-ai-mcp.mjs"]
cwd = "/path/to/design-ai"
startup_timeout_sec = 10
tool_timeout_sec = 60
```

In the Codex TUI, run:

```text
/mcp
```

Confirm that `design-ai` is active.

## Recommended prompts

Ask Claude or Codex to use the MCP server explicitly:

```text
Use the design-ai MCP server to route this task, then generate a prompt pack:
Spec a dense Korean fintech AmountInput component with accessibility notes.
```

For Website Improvement work:

```text
Use design_ai_site_mcp_check on this Website Improvement workspace JSON.
Then generate a design_ai_site_mcp_plan and summarize blocking MCP gaps.
```

For homepage implementation or refactoring after a bundle is ready:

```text
Call design_ai_site_bundle_handoff with the absolute bundle directory and selected homepage task id. Strict bundle verification is mandatory and cannot be disabled. Inspect the target repository read-only, present the exact files, risks, and verification plan, then stop until I approve that task. After approval, implement and verify desktop, tablet, mobile, keyboard, focus, contrast, lint, test, and build behavior. Ask again before dependencies, deployment, commit, push, or broader scope.
```

## Safety boundaries

- The server runs locally over stdio.
- The default tools do not call external MCP servers.
- Website Improvement MCP readiness tools inspect local workspace JSON only; the bundle handoff tool inspects a local verified bundle only.
- `design_ai_site_bundle_handoff` returns a pending approval contract and never edits the target repository or calls an external service.
- `design_ai_prompt` and `design_ai_pack` are read-only unless `withLearning` is set.
- `design_ai_learn_remember`, `design_ai_learn_feedback`, and `design_ai_learn_capture` write only the local learning profile, never the network, and only when called explicitly.
- The server does not mutate target repositories.
- Do not pass secrets in briefs, workspace JSON, or artifacts.

## Verify locally

Run the unit and subprocess smoke tests:

```bash
node --test cli/lib/mcp-server.test.mjs
```

Run the package smoke self-test when changing the packaged MCP entrypoint:

```bash
npm run package:smoke:self-test
```

Run a protocol smoke manually:

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25"}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | node cli/bin/design-ai-mcp.mjs
```

The output must contain valid one-line JSON-RPC responses and a `tools` list.

The packed-tarball release smoke also checks `design-ai-mcp` after install and through one-shot `npm exec`, so package releases catch missing bin shims or broken stdio startup before publish.

After publish, the public registry smoke also runs `npm exec --package @design-ai/cli@<version> -- design-ai-mcp` with the same JSON-RPC protocol checks, so npm propagation verification covers the Claude/Codex MCP entrypoint as installed by users.

## Troubleshooting

| Symptom | What to check |
|---|---|
| `/mcp` does not show `design-ai` | Confirm the command in Claude/Codex points at either `design-ai mcp` or `node /path/to/design-ai/cli/bin/design-ai-mcp.mjs`. |
| Tool calls return `Unknown argument` | Remove unsupported fields from the MCP tool input. The server validates tool arguments before running the CLI. |
| Tool calls return `must be an integer` or `must be a boolean` | Send JSON values with the right type, for example `{"limit": 3}` instead of `{"limit": "3"}`. |
| Tool calls are marked `isError: true` with `[stderr]` | The MCP protocol is working; inspect the CLI error text and rerun the equivalent `design-ai ...` command locally. |

## References

- [Model Context Protocol specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [Claude Code MCP documentation](https://code.claude.com/docs/en/mcp)
- [Codex MCP documentation](https://developers.openai.com/codex/mcp)

## Cross-reference

- [`../MCP-INTEGRATION.md`](../MCP-INTEGRATION.md)
- [`../CODEX-INTEGRATION.md`](../CODEX-INTEGRATION.md)
- [`../USING.md`](../USING.md)
