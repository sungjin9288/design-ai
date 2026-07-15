# MCP integration overview

design-ai is an MCP-aware system. When MCP servers are connected to your AI agent, design-ai's skills and commands invoke them directly to read from / write to external tools (Figma, Notion, GitHub, Slack, Linear).

design-ai can also run as its own local stdio MCP server. Use this when you want Claude Code or Codex to call design-ai tools directly instead of asking the agent to read files manually. See [`integrations/design-ai-mcp-server.md`](integrations/design-ai-mcp-server.md).

## Two MCP modes

| Mode | What connects | Use when |
| --- | --- | --- |
| design-ai uses external MCPs | Claude/Codex loads Figma, GitHub, Slack, Notion, or Linear MCP servers; design-ai skills use those tools when available. | You need live product workflow context or write-back to external tools. |
| design-ai as an MCP server | Claude/Codex loads `design-ai mcp`; the current source candidate exposes 22 tools, including the canonical read-only review workflow, self-validating review handoff, shared start flow, supplied-HTML quality inspection, Korean product review packs, artifact operations, a Website Improvement bundle handoff, linked-code preview inspection, and exactly three opt-in local learning-write tools. Published v5.0.0 remains at 17 tools. | You want agents to call design-ai through MCP without manually opening repo files. |

## What MCP enables for design-ai

Without MCP, design-ai produces markdown deliverables. The user manually pastes/copies them into other tools.

With MCP, design-ai can:

| MCP | Input from | Output to |
| --- | --- | --- |
| **Figma** | Read Variables, components, frames | Write Variables, comment on frames |
| **Notion** | Read team's design decisions, brand briefs | Sync knowledge base to a Notion site |
| **GitHub** | Read PRs for design review | Comment on PRs with audit findings |
| **Slack** | — | Post design review summaries to a channel |
| **Linear** | Read design system tasks | Create issues for design debt |
| **Atlassian (Jira/Confluence)** | Read briefs, design decisions | Mirror knowledge to Confluence |

This turns design-ai from "a document generator" into "an agent that operates on real product workflows."

### Shared design artifact operation

`design_ai_artifact` exposes the same three read-only modes as `design-ai artifact` and SDK `artifact()`: `implementation-plan`, `critique-loop`, and `design-contract`. The response carries the selected route, source files, workflow, output sections, approval boundary, verification checklist, and rendered Markdown. It never writes the declared output file or changes a target repository.

### Shared start operation

`design_ai_start` maps to CLI `design-ai start` and SDK `start()`. It accepts one
brief plus optional site name, repository URL, absolute local path, page URL,
screenshot references, locale, and viewports. It chooses one route, embeds the
existing design-contract artifact, marks the review playbook as not run, and
returns one next command. Declared references are not read or fetched. The
performed effect boundary always contains no local writes, target-repository
mutations, or external actions.

### Shared static HTML inspection

`design_ai_inspect_html` maps to CLI `design-ai inspect` and SDK `inspectHtml()`.
MCP and SDK receive HTML source text plus a display reference; they do not read a
target path. The operation confirms only supported static markup evidence and
returns all eight quality lenses. Interaction, motion, performance, keyboard,
accessibility-tree, and rendered responsive behavior remain `unverified` until an
approved runtime supplies evidence.
If the serialized report exceeds the MCP response limit, the tool returns a valid
`design-ai-mcp-error` JSON object instead of truncating and corrupting the report.

`design_ai_review_pack` lists or reads the five shipped Korean review contracts.
Pass one returned id as `reviewPack` to `design_ai_inspect_html`. Packs are never
selected from locale alone; browser and scenario criteria remain `unverified`.

### Canonical review workflow

`design_ai_review_html` maps to CLI `design-ai review` and SDK `reviewHtml()`.
It composes the shared start plan and static quality report without spawning the
CLI, then proves their context and SHA-256 linkage. The supplied HTML string is not
changed. Browser verification remains `not-run`, implementation remains
`not-started`, and local, target-repository, and external writes remain false.

Use this as the default MCP entry point for an existing HTML artifact. Use
`design_ai_inspect_html` only when the consumer needs the lower-level quality
report by itself. See [Canonical review workflow](REVIEW-WORKFLOW.md).

### Review evidence handoff

`design_ai_review_handoff` maps to CLI `design-ai review-handoff` and SDK
`reviewHandoff()`. It accepts the exact canonical workflow JSON, its reference,
and a named recipient. Optional quality-report and browser-verification sources
must be supplied together and pass source-byte, semantic, and viewport linkage.

The result stays `not-delivered` with consumer validation pending. The tool does
not inspect a target repository, write a local file, call an external transport,
or start implementation. See [Review evidence handoff](REVIEW-HANDOFF.md).

### Approval-gated website implementation handoff

The v5.0.0 source candidate adds `design_ai_site_bundle_handoff`. It verifies a local Website Improvement bundle through the existing CLI boundary and returns a target-repo prompt plus a `pending-human-approval` contract. The call is read-only: it does not contact an external MCP, edit the target repository, install dependencies, deploy, commit, or push.

```json
{
  "bundleDir": "/absolute/path/website-handoff-bundle",
  "taskSelector": "task-homepage-cta"
}
```

Strict verification is mandatory for this MCP tool and cannot be disabled by callers.

The consuming Codex or Claude task must first inspect the target repository read-only, present the exact scope and verification plan, and stop for explicit approval. Implementation begins only after that approval; any broader scope, dependency, migration, deploy, commit, push, or external write requires a new approval.

### Linked-code preview readiness

`design_ai_site_linked_preview` accepts Website Improvement workspace JSON with an absolute `siteProfile.localPath`. It reads only root `package.json`, a supported lockfile, and whether `index.html` exists, then reports the detected framework, package manager, existing start command, and five manual stages. It does not install dependencies, start a server, probe the configured URL, inspect application source files, or modify the target repository. A `pass` result means metadata is ready for a manual start; it is not browser verification.

## Supported MCPs

### Tier 1 — high-value, well-supported

| MCP | Status | Use cases |
| --- | --- | --- |
| **Figma** | ✓ stable, official | Token sync, component spec extraction, code-connect mapping |
| **Notion** | ✓ stable | Knowledge mirror, design-decision capture |
| **GitHub** | ✓ stable | PR design review, issue creation |
| **Slack** | ✓ stable | Posting design review summaries, sharing artifacts |

### Tier 2 — useful, mature

| MCP | Use cases |
| --- | --- |
| **Linear** | Track design system debt as issues |
| **Atlassian** (Jira/Confluence) | Enterprise alternative to Linear+Notion |
| **Asana** | Alternative project tracking |
| **Intercom** | Read user feedback for design audits |

### Tier 3 — situational

| MCP | Use cases |
| --- | --- |
| **Canva** | Asset reference (less common for design systems) |
| **Apollo / Common Room** | Sales/CRM — not design |
| **Hubspot** | Marketing — UX feedback only |

design-ai's per-MCP integration guides cover Tier 1 + 2.

## Per-integration guides

| Guide | What it covers |
| --- | --- |
| [`integrations/design-ai-mcp-server.md`](integrations/design-ai-mcp-server.md) | Running design-ai itself as a stdio MCP server for Claude Code and Codex |
| [`integrations/figma-mcp.md`](integrations/figma-mcp.md) | Reading variables/components, writing tokens, code-connect via MCP |
| [`integrations/notion-mcp.md`](integrations/notion-mcp.md) | Mirror knowledge base to a Notion site, capture design decisions |
| [`integrations/github-mcp.md`](integrations/github-mcp.md) | PR design review, issue creation, design system change tracking |
| [`integrations/slack-mcp.md`](integrations/slack-mcp.md) | Post review summaries, share artifacts, notify on token changes |
| [`integrations/linear-mcp.md`](integrations/linear-mcp.md) | Create/update issues, track design debt |

## Setup overview

Each MCP requires:
1. **Server installation** (per-MCP — see vendor docs).
2. **Auth** (OAuth flow per MCP — done once per workspace).
3. **Agent configuration** (e.g., `~/.codex/mcp.json`, Claude Code's MCP settings).

After setup, MCP tools appear in your agent's available tools. design-ai's skills detect and use them.

### Claude Code

```bash
# Add design-ai itself as a local stdio MCP server
claude mcp add --transport stdio design-ai -- design-ai mcp

# Install Figma MCP (example)
claude mcp add figma -- node /path/to/figma-mcp-server
# Auth flow opens browser
```

### Codex CLI

Use the CLI:

```bash
codex mcp add design-ai -- design-ai mcp
```

Or edit `~/.codex/config.toml`:

```toml
[mcp_servers.design-ai]
command = "design-ai"
args = ["mcp"]
```

### Cursor

Cursor's MCP settings UI (mid-2025+). Add server, complete auth.

## When MCP is unavailable (graceful fallback)

design-ai's skills are designed to work **without** MCPs. When an MCP is missing:

- Figma read → user provides Figma export JSON manually
- Notion sync → user copies the markdown manually
- GitHub PR comment → user pastes the audit into the PR review

Skills detect MCP availability and choose path:

```
[skill check]
- mcp__Figma__get_variable_defs available? Use it.
- Else? Ask user for the exported JSON or paste of token list.
```

This keeps design-ai useful in environments without MCP setup.

## MCP-aware skills

These skills explicitly leverage MCPs when present:

| Skill | MCP used (when available) |
| --- | --- |
| `design-pr-review` | GitHub (read PR), Figma (compare designs) |
| `figma-token-sync` | Figma (read/write Variables) |
| `design-broadcast` | Slack (post), Notion (page) |

See [`skills/README.md`](../skills/README.md) for full playbooks.

## MCP catalog with design-ai relevance

For each MCP, note **what design-ai can do with it** (concrete actions):

### Figma MCP

```
mcp__Figma__get_metadata          # File structure
mcp__Figma__get_design_context    # Selected node's tokens, styles, components
mcp__Figma__get_variable_defs     # All Figma Variables
mcp__Figma__get_screenshot        # Render frame as image
mcp__Figma__get_code_connect_map  # Existing Code Connect mappings
mcp__Figma__add_code_connect_map  # Add new mapping
mcp__Figma__create_design_system_rules  # Apply rules to a file
```

design-ai uses these for:
- Extracting tokens from a real Figma file
- Auditing a Figma design against the spec
- Generating component specs from existing Figma components

### Notion MCP

```
mcp__864aac7f-...__notion-fetch          # Read page/database
mcp__864aac7f-...__notion-search         # Find pages
mcp__864aac7f-...__notion-create-pages   # Create new
mcp__864aac7f-...__notion-update-page    # Edit existing
mcp__864aac7f-...__notion-create-database
mcp__864aac7f-...__notion-create-comment
mcp__864aac7f-...__notion-get-users
```

design-ai uses these for:
- Mirroring knowledge files as Notion pages
- Reading team's design decisions / brand briefs
- Creating the design-ai knowledge index in Notion

### GitHub MCP

```
mcp__plugin_engineering_github__authenticate
# After auth:
github__get_pull_request
github__list_pull_requests
github__create_pr_comment
github__create_issue
github__list_issues
github__get_repo_contents
```

design-ai uses these for:
- Reading PR diff to audit design system compliance
- Posting review comments on PRs
- Creating issues for design debt found in audits

### Slack MCP

```
mcp__plugin_design_slack__authenticate
# After auth:
slack__send_message
slack__list_channels
slack__find_user
slack__upload_file
```

design-ai uses these for:
- Posting design review summaries
- Sharing palette / spec artifacts to a `#design` channel
- Pinging the right people on token changes

### Linear MCP

```
mcp__plugin_design_linear__authenticate
# After auth:
linear__list_issues
linear__create_issue
linear__update_issue
linear__list_projects
```

design-ai uses these for:
- Creating issues for each gap found in a design system audit
- Tracking the rollout of a new design system version
- Querying status of design debt items

## Privacy considerations

- **Figma file URLs are sensitive**. Don't commit to public repos.
- **Notion / GitHub auth tokens** are stored per-agent in their respective config files. Don't share.
- **Don't post auth secrets to chat or commit logs**.
- design-ai's skills should never log or echo MCP auth tokens.

## Cross-reference

- [`docs/USING.md`](USING.md) — multi-agent setup
- [`docs/CODEX-INTEGRATION.md`](CODEX-INTEGRATION.md) — Codex MCP setup
- [`docs/CURSOR-INTEGRATION.md`](CURSOR-INTEGRATION.md) — Cursor MCP setup
- [`docs/AIDER-INTEGRATION.md`](AIDER-INTEGRATION.md) — Aider (no MCP yet)
- [`docs/integrations/figma-mcp.md`](integrations/figma-mcp.md) — per-MCP guide examples
