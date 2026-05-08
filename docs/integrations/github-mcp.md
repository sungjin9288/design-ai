# GitHub MCP integration

Use GitHub MCP to bring design-ai into pull request review workflows. Audit PRs for design system compliance, post review comments, create issues for design debt.

## Available tools (when GitHub MCP connected)

After authenticating via `mcp__plugin_engineering_github__authenticate`:

| Tool | What it does |
| --- | --- |
| `get_pull_request` | Read PR metadata, files changed, diff |
| `list_pull_requests` | List PRs (open / merged / by author) |
| `create_pr_comment` | Post a review comment |
| `create_review` | Post a multi-comment review |
| `create_issue` | New issue |
| `list_issues` | Read issues |
| `get_repo_contents` | Read file from a repo |
| `update_pr` | Update title/description |

## Workflow A: PR design review

The headline use case. Agent reviews a PR for design system compliance.

```
You: Review PR #123 in our-org/web for design system compliance.
Agent:
  1. github__get_pull_request(repo="our-org/web", number=123)
     [returns diff, files changed]
  2. For each changed file:
     - Read content via github__get_repo_contents
     - Apply skills/design-system-qa/ checks:
       * Raw hex values (instead of token references)?
       * Missing aria-* attributes on new components?
       * Hardcoded spacing values not on the 4-base scale?
       * Missing prefers-reduced-motion handling?
  3. Compile findings by file with severity.
  4. github__create_review(repo=..., pr=123, body=summary, comments=[
       {path: "src/Button.tsx", line: 23, body: "Use --color-primary-default, not #7C3AED"},
       ...
     ])
```

The agent posts inline review comments. Critical issues block merge.

See the new [`skills/design-pr-review/PLAYBOOK.md`](../../skills/design-pr-review/PLAYBOOK.md).

## Workflow B: create issues for design debt

After running a UX audit / design system audit, file each finding as an issue.

```
You: Run skills/design-system-qa on our-org/web; create issues for criticals.
Agent:
  1. Pull repo state via github__get_repo_contents (or clone locally).
  2. Apply design-system-qa playbook.
  3. For each Critical finding:
     github__create_issue(
       repo="our-org/web",
       title="[design-debt] Raw hex values in Button.tsx",
       body=<finding details + cited knowledge file>,
       labels=["design-debt", "design-system"]
     )
```

Pairs well with Linear MCP for teams using Linear instead of GitHub Issues.

## Workflow C: track design system PR status

Generate a status report of design system-related PRs.

```
You: Show me design system PRs from the last 2 weeks.
Agent:
  1. github__list_pull_requests(repo=..., state=all, since=2weeks_ago)
  2. Filter by labels (design-system, design-debt)
  3. Categorize: shipped, in review, blocked, abandoned.
  4. Output a markdown summary.
```

## Workflow D: comment on design system token bumps

When a PR bumps the design tokens, design-ai checks for breaking changes.

```
PR opens that modifies tokens/source.json:
  - Changed: --color-primary-default from #1976D2 to #0D9488

Agent (via webhook or scheduled):
  1. github__get_pull_request(...)
  2. Detect token diff.
  3. Run impact analysis: how many components consume this token?
  4. github__create_pr_comment(
       body=`Breaking change: --color-primary-default. Affects 47 components.
             Verify Storybook visual tests pass before merging.`
     )
```

## Setup

### Authentication

```
# In Claude Code or other agent:
mcp__plugin_engineering_github__authenticate
```

OAuth flow opens browser; user grants the GitHub App access. Per-workspace one-time.

### Required scopes

For full design-ai workflow:
- `repo` (read code, PRs, issues)
- `pull_requests:write` (post comments, reviews)
- `issues:write` (create design debt issues)

For read-only workflows (just review): `repo:read` is enough.

### App config

GitHub MCP server can be:
- Anthropic-provided (managed) — simpler.
- Self-hosted via `@modelcontextprotocol/server-github` — for security-sensitive orgs.

## Common pitfalls

| Pitfall | Fix |
| --- | --- |
| Auth expires after 1 hour | Re-authenticate. Some MCP servers refresh automatically. |
| Rate limit (5K req/hour for GitHub API) | Cache PR contents; don't refetch the same PR multiple times. |
| Large diffs return truncated | Use `get_repo_contents` per-file rather than full diff. |
| Comments post but aren't visible | Check the user has commenting permission on the repo. |
| Bot comments spam the PR | Aggregate findings into one review, not per-finding comments. |

## Aggregation strategy

Don't post 50 inline comments. Instead:

```
[Single Review Comment]
Body:
  ## Design system review: 12 issues
  
  ### Critical (3)
  - Button.tsx:23 — Raw hex `#7C3AED` should be `--color-primary-default`
  - Card.tsx:45 — Missing `aria-label` on icon-only button
  - ...
  
  ### High (4)
  - ...
  
  ### Cited references
  - [knowledge/colors/color-theory.md](https://github.com/your-org/design-ai/...)
  - ...
```

Plus 2–3 inline comments on the most-critical specific lines (where context matters).

This is humane review — actionable summary at top, deep links to specifics.

## Privacy

- GitHub MCP has access to whatever the auth user can see.
- Don't grant org-wide tokens for personal work.
- Audit installed GitHub Apps quarterly.
- design-ai never logs the auth token.

## When GitHub MCP is unavailable

`design-pr-review` skill falls back to:
- User pastes the diff manually.
- Agent outputs the review as markdown for the user to copy into the PR.

## Cross-reference

- [`docs/MCP-INTEGRATION.md`](../MCP-INTEGRATION.md) — overview
- [`skills/design-pr-review/`](../../skills/design-pr-review/) — the MCP-aware skill
- [`docs/integrations/linear-mcp.md`](linear-mcp.md) — Linear alternative for issue tracking
- [`knowledge/patterns/design-system-qa.md`](../../knowledge/patterns/design-system-qa.md) — what gets checked
