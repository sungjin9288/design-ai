# Notion MCP integration

Mirror design-ai's knowledge base to Notion so non-engineering audiences (designers, PMs, executives) can browse without GitHub access. Capture team's design decisions back into the knowledge base.

## Available tools (when Notion MCP connected)

| Tool | What it does |
| --- | --- |
| `notion-fetch` | Read a Notion page or database |
| `notion-search` | Find pages by query |
| `notion-create-pages` | Create new pages |
| `notion-update-page` | Edit existing |
| `notion-create-database` | New database (table-of-pages) |
| `notion-update-data-source` | Modify database schema |
| `notion-create-comment` | Comment on a page |
| `notion-get-comments` | Read comments |
| `notion-get-users` | List workspace users (for permissions) |
| `notion-get-teams` | List teams |

## Workflow A: mirror knowledge base to Notion

Designers may not be in the GitHub repo. Sync design-ai's knowledge to a Notion site they can browse.

```
You: Sync the knowledge base to Notion under our Design page.
Agent:
  1. notion-search(query="Design") → find the parent page.
  2. For each file in knowledge/:
     - Convert markdown → Notion blocks.
     - notion-create-pages(parent={...}, title=..., body=...)
  3. Create an index page linking to all sub-pages.
  4. Output the URL.
```

Run periodically (weekly) to keep Notion in sync.

### Direction-of-truth

Knowledge files in this repo are the **source of truth**. Notion is a mirror.

If a designer edits Notion content, that's lost on next sync. Capture design decisions as **separate Notion pages** (in a "Design Decisions" database) — those don't get overwritten and feed back into knowledge as needed.

## Workflow B: capture design decisions

Team meeting → decisions → into Notion → into knowledge base.

```
You: Capture this decision: "We're using teal-600 (#0D9488) as our primary
because differentiation from Toss/Shinhan blue matters more than safest-blue."

Agent:
  1. notion-create-pages(
       database="Design Decisions",
       title="Primary brand: teal not blue (2026-05-08)",
       body="...",
       properties={status: "decided", date: ..., area: "color"}
     )
  2. Optionally suggest updating knowledge/colors/* with the rationale.
```

Pattern: decisions live in Notion (timestamped log); knowledge files reflect the *outcome*.

## Workflow C: read team's brand brief from Notion

User has a brand brief in Notion; agent should read it before generating a palette.

```
You: Read our brand brief from Notion and apply /design-from-brief.
Agent:
  1. notion-search(query="brand brief") → page URL.
  2. notion-fetch(url=...)
  3. Extract structured brief from the page content.
  4. Apply commands/design-from-brief.md.
```

## Workflow D: design system status report

Auto-generate a weekly status report in Notion.

```
You: Post this week's design system update to Notion.
Agent:
  1. python3 tools/audit/check-coverage.py — get current numbers.
  2. python3 tools/audit/changelog-generate.py — recent changes.
  3. Compose update: components added, coverage %, open audit issues.
  4. notion-update-page(url="<weekly status page URL>", content=...)
```

## Setup

### Authentication

Notion MCP uses Notion's official integration:
1. Create an internal integration at notion.so/profile/integrations.
2. Grant access to the workspace pages design-ai will modify.
3. Configure the agent's MCP server with the integration token.

```jsonc
// ~/.codex/mcp.json or equivalent
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["@notionhq/mcp-server"],
      "env": {
        "NOTION_TOKEN": "secret_..."
      }
    }
  }
}
```

For Claude Code: similar; add via `claude mcp add notion ...`.

### Permissions

Be careful with write access. Recommended:
- **Read access** to the entire team's design pages.
- **Write access** only to the design-ai mirror page hierarchy.

This way, design-ai can't accidentally clobber unrelated content.

## Markdown → Notion blocks conversion

Notion's API expects structured blocks, not markdown. Conversion rules:

| Markdown | Notion block |
| --- | --- |
| `# Heading 1` | `heading_1` |
| `## Heading 2` | `heading_2` |
| `### Heading 3` | `heading_3` |
| `paragraph text` | `paragraph` |
| `- bullet` | `bulleted_list_item` |
| `1. numbered` | `numbered_list_item` |
| `[link](url)` | text with link annotation |
| `**bold**` | text with bold annotation |
| `` `code` `` | text with code annotation |
| ` ```block``` ` | `code` block |
| `<!-- HTML -->` | render as paragraph or strip |
| `\| table \|` | `table` (Notion's table API is awkward — many tools render as 2-column lists instead) |

Libraries that handle this:
- `notion-to-md` (Notion → markdown — reverse direction)
- Custom parser for design-ai's specific markdown patterns

For simple knowledge-mirror use case: a basic converter handling headings, paragraphs, lists, and code blocks is ~80% of value.

## Common pitfalls

| Pitfall | Fix |
| --- | --- |
| Notion API rate limit | Cap to 3 req/sec; batch creates |
| Page not found after create | Notion's API is eventually consistent; wait 200ms before fetching newly-created |
| Code blocks render as plain text | Set `language` on the code block |
| Tables don't render | Convert to bullet list or fall back to text |
| Auth lost | Re-share workspace pages with the integration |

## Privacy

- The integration token has access to whatever you grant. Audit shared pages periodically.
- Don't include secrets in the design-ai content that gets mirrored — Notion is shared.
- Soft delete (archive) Notion pages, don't hard delete — easier rollback.

## When Notion MCP is unavailable

design-ai's `design-broadcast` skill (covers Slack + Notion) detects missing MCP and falls back to:
- Outputting markdown the user can paste into Notion manually.
- Generating a shareable URL via the project's GitHub instead.

## Cross-reference

- [`docs/MCP-INTEGRATION.md`](../MCP-INTEGRATION.md) — overview
- [`skills/design-broadcast/`](../../skills/design-broadcast/) — uses Notion MCP for sharing
- [`docs/integrations/slack-mcp.md`](slack-mcp.md) — companion for design review summaries
