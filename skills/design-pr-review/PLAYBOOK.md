# design-pr-review — playbook

Review a GitHub pull request for design system compliance. When GitHub MCP is connected, fetches the PR and posts a structured review. Without MCP: outputs a markdown review for manual paste.

## When to use

- "Review PR #123 for design system compliance"
- "Audit this PR before merging"
- Pre-merge gate as part of CI (run via Codex headlessly)

## Inputs (ask if missing)

1. **PR identifier**: org/repo + number, OR full URL.
2. **Severity threshold**: which findings should block merge? (default: Critical only)
3. **Post comments?**: yes (write back to PR) or no (just output report).

## Steps

### 1. Detect MCP availability

```
if mcp__plugin_engineering_github is connected:
  proceed with full PR fetch + comment workflow
else:
  ask user to paste the PR diff; output review as markdown only
```

### 2. Fetch PR (MCP path)

```
github__get_pull_request(repo="org/repo", number=123)
→ returns PR metadata, files changed, diff
```

For each changed file: `github__get_repo_contents(repo, path, ref=PR_HEAD)` to get full content (diff alone may not be enough context).

### 3. Apply design system QA layers

Open [`knowledge/patterns/design-system-qa.md`](../../knowledge/patterns/design-system-qa.md) — apply each layer to the PR's changed files:

#### Layer 1 — TypeScript

Skip in this skill (assume types exist; tsc handles separately).

#### Layer 2 — Token drift

For each `.tsx` / `.css` / `.scss` file changed:
- Search for raw hex (`#[0-9A-F]{3,8}`) outside of comments.
- Search for raw px / rem outside of token references.
- Flag each occurrence with:
  - Severity: 🟠 High (or 🔴 Critical if it's in a shipped component).
  - Cited rule: [`knowledge/PRINCIPLES.md`](../../knowledge/PRINCIPLES.md) rule 2.

#### Layer 3 — Component contract

For new component definitions in the PR:
- Required ARIA attributes per [`knowledge/a11y/keyboard-and-focus.md`](../../knowledge/a11y/keyboard-and-focus.md).
- Disabled state has `aria-disabled`.
- Loading state has `aria-busy`.
- Buttons explicitly `type="button"` (not the default submit).

#### Layer 4 — A11y

Static checks the agent can do:
- `<img>` without `alt`.
- `<button>` without text or `aria-label` for icon-only.
- `<div onClick>` without `role` and tab support.
- Color used as the only meaning signal.

For deeper a11y: defer to runtime axe-core (mention in review).

#### Layer 5 — Visual regression

Skip (requires CI / Storybook).

### 4. Read related design-ai knowledge

For each finding type, cite the knowledge file. Common ones:

| Finding | Cite |
| --- | --- |
| Raw hex | `knowledge/PRINCIPLES.md` (rule 2), `knowledge/colors/color-theory.md` |
| Missing aria | `knowledge/a11y/keyboard-and-focus.md` |
| Wrong contrast | `knowledge/a11y/contrast.md` |
| Korean copy missing | `knowledge/i18n/korean-product-conventions.md` |
| Money color wrong | `knowledge/patterns/money-and-amount.md` |

Use deep links so the PR reviewer can click through.

### 5. Compose the review

Aggregate by severity, not by file:

```markdown
## Design system review — PR #123

> Reviewed by design-ai (skills/design-pr-review)
> Files changed: 12
> Findings: 2 Critical, 4 High, 3 Medium

### 🔴 Critical (2 — must fix)

1. **Raw hex `#7C3AED` in `Button.tsx:23`** instead of `--color-primary-default`.
   Why: tokens by role per [PRINCIPLES.md rule 2](https://github.com/your-org/design-ai/blob/main/knowledge/PRINCIPLES.md).
   Fix: replace with `var(--color-primary-default)`.

2. **Missing `aria-label` on icon-only button in `Header.tsx:45`**.
   Why: WCAG 2.1 4.1.2 — controls need accessible name.
   Fix: add `aria-label="Open menu"`.

### 🟠 High (4 — should fix)

...

### 🟡 Medium (3 — consider)

...

### Things that look good

- Form fields use `<label>` correctly throughout.
- Card components consume `--space-md` consistently.
- Korean fonts loaded via Pretendard.
```

### 6. Post the review (MCP path)

```
github__create_review(
  repo="org/repo",
  pr=123,
  body=<full review>,
  event="REQUEST_CHANGES"  // or "COMMENT" for non-blocking
  comments=[
    { path: "Button.tsx", line: 23, body: "Use --color-primary-default" },
    ...
  ]
)
```

Limit inline comments to **2–3 most-critical** specifics. The full review body has the rest.

### Without MCP

Output the full review as markdown. User copies it into the PR review UI manually.

## Verification phase (run before declaring done)

- [ ] Did I check all 5 QA layers?
- [ ] Did I cite knowledge files for every finding?
- [ ] Did I aggregate by severity (not file-by-file noise)?
- [ ] Did I include "Things that look good" (constructive)?
- [ ] Did I keep inline comments ≤ 3?
- [ ] If posting via MCP: did I confirm "post" with user (don't auto-post critical reviews without ack)?

## Source files this skill reads

- [`knowledge/patterns/design-system-qa.md`](../../knowledge/patterns/design-system-qa.md) — full QA model
- [`knowledge/PRINCIPLES.md`](../../knowledge/PRINCIPLES.md) — citation source
- [`knowledge/a11y/contrast.md`](../../knowledge/a11y/contrast.md)
- [`knowledge/a11y/keyboard-and-focus.md`](../../knowledge/a11y/keyboard-and-focus.md)
- [`docs/integrations/github-mcp.md`](../../docs/integrations/github-mcp.md) — MCP usage details

## Done when

- One review posted (or output as markdown).
- Severity-aggregated, with citations.
- Inline comments capped at 3 most-critical.
- "Things that look good" included.
- User confirmed before posting (when posting via MCP).
- Verification phase passes.
