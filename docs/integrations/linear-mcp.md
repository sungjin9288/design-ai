# Linear MCP integration

Use Linear MCP to track design system work, audit findings, and design debt as Linear issues. Pairs with `skills/design-system-qa` and `skills/ux-audit` to convert findings into trackable work.

## Available tools (when Linear MCP connected)

After authenticating via `mcp__plugin_design_linear__authenticate`:

| Tool | What it does |
| --- | --- |
| `list_issues` | Read issues (filtered by team / state / labels) |
| `get_issue` | Single issue detail |
| `create_issue` | New issue |
| `update_issue` | Edit existing |
| `list_projects` | List Linear projects |
| `list_teams` | List teams |
| `add_comment` | Comment on an issue |

## Workflow A: convert audit findings to issues

After `/design-review` or `skills/design-system-qa`, file each finding as a Linear issue.

```
You: Run skills/design-system-qa on this codebase; create Linear issues for criticals.
Agent:
  1. Apply skills/design-system-qa/PLAYBOOK.md.
  2. linear__list_teams() → find the design or eng team.
  3. For each Critical finding:
     linear__create_issue(
       team="DESIGN",
       title="[design-debt] Raw hex values in Button.tsx",
       description=<finding details + cited knowledge file links>,
       labels=["design-debt", "critical"],
       priority=1,        // 1=urgent
       project="Design System"
     )
  4. Output: list of created issue URLs.
```

## Workflow B: track design system rollout

Use Linear's project + cycle structure to track rollout of a new design system version.

```
You: Plan the v2.0 design system rollout in Linear.
Agent:
  1. linear__create_project(
       name="Design System v2.0",
       description=<scope, goals>
     )
  2. For each component to migrate, create a sub-issue:
     linear__create_issue(
       team="ENG",
       project=<project_id>,
       title="Migrate Button to v2 tokens",
       description=<migration checklist>,
       labels=["design-system-v2"]
     )
  3. Output: project URL + issue list.
```

## Workflow C: read team's design backlog

Before applying `/design-from-brief`, agent can read existing context from Linear.

```
You: What design issues are open right now?
Agent:
  1. linear__list_issues(
       team="DESIGN",
       state="in_progress",
       labels=["design-system"]
     )
  2. Summarize: <N> open, <breakdown by priority>.
```

## Workflow D: link audit reports to existing issues

When the same finding has been filed before, comment on the existing issue rather than duplicating.

```
You: Audit the dashboard; file Linear issues but check for duplicates.
Agent:
  1. Apply skills/ux-audit/PLAYBOOK.md.
  2. For each finding:
     - linear__list_issues(query=<finding title fragment>)
     - If existing issue found:
       linear__add_comment(issue=<existing>, comment="Audit re-confirms this issue: ...")
     - Else:
       linear__create_issue(...)
```

## Severity → Linear priority mapping

design-ai's severity model translates to Linear priorities:

| design-ai severity | Linear priority |
| --- | --- |
| 🔴 Critical | 1 (Urgent) |
| 🟠 High | 2 (High) |
| 🟡 Medium | 3 (Medium) |
| 🟢 Low | 4 (Low) |

## Issue formatting

Use Linear's markdown for the description:

```markdown
## Finding
Raw hex value `#7C3AED` in `src/components/Button/Button.tsx:23` instead of `--color-primary-default` token.

## Why
Hardcoded hex values cause:
- Inability to theme the app
- Drift from the design system
- Manual updates required when tokens change

## Cited rule
[knowledge/PRINCIPLES.md](https://github.com/your-org/design-ai/blob/main/knowledge/PRINCIPLES.md) rule 2:
> Tokens by role, not by hex.

## Recommended fix
Replace `#7C3AED` with `var(--color-primary-default)` (CSS) or `tokens.color.primary.default` (JS).

## Detection rule
Stylelint with `color-no-hex` rule would catch this on PR.
```

Linear's markdown supports:
- Headings, paragraphs, lists
- Code blocks (with language)
- Inline code
- Links
- Mentions (`@username`)

## Setup

### Authentication

```
# In agent:
mcp__plugin_design_linear__authenticate
```

OAuth → user grants Linear workspace access. Per-workspace once.

### Required scopes

- `read` (issues, projects, teams)
- `write` (create / update issues)
- `admin:project` (only if creating projects)

### Team selection

design-ai's issues should go to a designated team:
- Design team (if dedicated): `DESIGN-`.
- Eng team if design-and-eng-share: `ENG-`.
- Specific design-system team if exists: `DS-`.

Confirm with team lead. Document in `.cursorrules` or project-level config.

## Workflow integration with design-system-qa

`skills/design-system-qa` outputs a structured findings list. Each finding has:
- Severity
- Title
- Location (file/line)
- Cited knowledge

Map this 1:1 to Linear issues:

```python
# Pseudocode
for finding in qa_report.findings:
    linear.create_issue({
        team="DESIGN",
        project="Design System",
        title=f"[{finding.severity}] {finding.title}",
        description=format_for_linear(finding),
        priority=severity_to_priority(finding.severity),
        labels=["design-debt", finding.severity],
    })
```

This is the canonical "audit → tracked work" pipeline.

## Privacy

- Linear auth has full workspace access. Audit installed apps quarterly.
- Don't include customer data in issue descriptions.
- For sensitive design (security review findings, leaked-credential issues): post privately, not in Design board.

## Common pitfalls

| Pitfall | Fix |
| --- | --- |
| Issue created in wrong team | Verify team_id before bulk-creating |
| Duplicates after re-audit | Search-first pattern (Workflow D) |
| Auth expires | Refresh / re-authenticate |
| Markdown links don't render | Linear has slightly different markdown — test before bulk-creating |
| Priority not setting | Linear uses 1=urgent, 4=low; reverse from many systems |

## When Linear MCP is unavailable

design-system-qa skill falls back to:
- Outputting the findings list as a markdown report.
- User pastes into Linear manually OR uses GitHub MCP for GitHub Issues.

## Cross-reference

- [`docs/MCP-INTEGRATION.md`](../MCP-INTEGRATION.md) — overview
- [`docs/integrations/github-mcp.md`](github-mcp.md) — GitHub Issues alternative
- [`skills/design-system-qa/PLAYBOOK.md`](../../skills/design-system-qa/PLAYBOOK.md) — generates findings
- [`skills/ux-audit/PLAYBOOK.md`](../../skills/ux-audit/PLAYBOOK.md) — generates findings
- [`knowledge/patterns/design-system-qa.md`](../../knowledge/patterns/design-system-qa.md)
