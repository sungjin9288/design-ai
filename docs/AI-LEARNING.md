# AI learning

design-ai supports a local learning profile. This is not model training, fine-tuning, or automatic data collection. It is explicit local memory that you choose to include in generated prompts.

## Scope

What ships in v4.13:

- `design-ai learn --remember ...` stores user or project preferences in a local JSON profile.
- `design-ai learn --feedback ...` converts outcome feedback into reusable local learning notes.
- `design-ai learn --list` shows saved entries, with optional `--category` and `--limit` filters.
- `design-ai learn --export` prints the Markdown context block used by prompt generation, with the same filters.
- `design-ai learn --import` merges entries from a JSON learning profile or `learn --export --json` payload.
- `design-ai learn --audit` inspects profile shape, duplicates, possible sensitive content, and cleanup suggestions without changing the profile.
- `design-ai learn --audit --fix --dry-run` previews safe cleanup suggestions that can be applied automatically.
- `design-ai learn --audit --fix --yes` applies only unambiguous safe cleanup suggestions.
- `design-ai learn --stats` summarizes profile counts, category/source distribution, recency, and audit status without changing the profile.
- `design-ai learn --forget ... --yes` removes a single saved entry.
- `design-ai learn --clear --yes` clears the local profile.
- `design-ai prompt --with-learning ...` injects the learned context into the generated task prompt, with optional `--learning-category` and `--learning-limit` scoping.
- `design-ai pack --with-learning ...` includes the same learned context in portable prompt packs, with the same optional scoping controls.
- Exported and injected learned context carries an audit summary; if the profile has warnings, the generated context includes a notice to run `design-ai learn --audit`.

What does not ship:

- Model fine-tuning.
- Private model training on user artifacts.
- Automatic telemetry or background collection.
- Semantic embedding index generation.
- Automatic feedback capture from accepted/rejected recommendations.

## Storage

Default path:

```bash
~/.design-ai/learning.json
```

Override path:

```bash
DESIGN_AI_LEARNING_FILE=/path/to/learning.json design-ai learn --list
```

The profile is local to the machine. It is not synced, uploaded, or sent to any provider by this CLI.

## Usage

Remember a preference:

```bash
design-ai learn --remember "Prefer dense Korean product UI with restrained enterprise styling" --category korean
```

Record outcome feedback:

```bash
design-ai learn --feedback "Keep audit findings short and evidence-led" --outcome keep
design-ai learn --feedback "Avoid decorative marketing language in enterprise dashboards" --outcome avoid --category brand
design-ai learn --feedback --from-file feedback.md --outcome improve --category workflow
cat feedback.md | design-ai learn --feedback --stdin --outcome avoid --category brand
```

Feedback is explicit local memory. `--outcome keep` stores a "repeat this" instruction, `--outcome improve` stores an "improve future outputs by..." instruction, and `--outcome avoid` stores an "avoid this" instruction. The default feedback category is `workflow`; use `--category` when feedback belongs to brand, accessibility, Korean-market behavior, or another scoped area. Use `--from-file` or `--stdin` when the reviewed-output note is too long or already saved in another tool.

List saved preferences:

```bash
design-ai learn --list
design-ai learn --list --json
design-ai learn --list --category korean --limit 5
```

Export the learned context block:

```bash
design-ai learn --export
design-ai learn --export --category accessibility --limit 3
```

The exported block includes profile audit metadata in JSON mode. Human Markdown stays compact when the profile passes audit, and includes a warning notice when the profile has audit warnings.

Import a portable learning profile:

```bash
design-ai learn --export --json > learning-export.json
design-ai learn --import --from-file learning-export.json --dry-run
cat learning-export.json | design-ai learn --import --stdin --yes
```

Import accepts JSON objects with an `entries` array, including full local profile files and `learn --export --json` output. `--dry-run` previews added and skipped entries without mutating the target profile. Confirmed import requires `--yes`, skips duplicate category+text pairs, preserves imported timestamps when valid, marks imported sources with `import:`, and remints ids only when an imported id conflicts with an existing entry.

Audit the local profile before using it in prompts:

```bash
design-ai learn --audit
design-ai learn --audit --json
design-ai learn --audit --fix --dry-run
design-ai learn --audit --fix --yes
```

The plain audit is advisory and non-mutating. It reports invalid JSON/profile shape failures plus warnings for duplicate entries, missing timestamps, long notes, and conservative sensitive-content patterns such as secret-like assignments, private key blocks, email addresses, and Korean mobile phone numbers. JSON output includes `suggestions`; human output adds a Suggested cleanup section with safe `design-ai learn --file ... --forget ... --yes` commands only when id-based deletion is unambiguous.

`--audit --fix --dry-run` turns those safe suggestions into a cleanup plan without changing the file. `--audit --fix --yes` removes only entries that have stable, unambiguous ids and skips anything that still needs manual review, such as invalid JSON, duplicate ids, malformed entries, or warnings without a safe target.

Summarize profile health and recency:

```bash
design-ai learn --stats
design-ai learn --stats --json
```

Stats mode is also read-only. It is a compact overview for deciding whether to inspect, filter, or clean up the profile before using `--with-learning`.

Remove one saved entry:

```bash
design-ai learn --forget learn-abc123def0 --yes
design-ai learn --forget 2 --yes
```

Clear every saved entry:

```bash
design-ai learn --clear --yes
```

Use learned context in a prompt:

```bash
design-ai prompt "Audit this checkout UX" --with-learning
design-ai prompt "Audit this checkout UX" --with-learning --learning-category korean --learning-limit 5
```

When `--with-learning` is used, generated prompt plans include the same audit summary as `learn --export --json`. If the local profile has audit warnings, the learned-context block tells the receiving agent to run `design-ai learn --audit` before relying on that context.

Use learned context in a prompt pack:

```bash
design-ai pack "Spec a pricing page for Korean SaaS" --with-learning --max-bytes 80000
design-ai pack "Spec a pricing page for Korean SaaS" --with-learning --learning-category brand --learning-limit 3 --max-bytes 80000
```

## Categories

Use categories to make learned context scannable:

| Category | Use for |
|---|---|
| `preference` | General design taste or output preference |
| `brand` | Brand voice, visual language, tone |
| `workflow` | Team process, handoff, review norms |
| `constraint` | Business, legal, product, or platform constraints |
| `accessibility` | Accessibility preferences that exceed the baseline |
| `korean` | Korean market, language, typography, or platform conventions |
| `other` | Anything that does not fit the above |

## Safety rules

Learning entries are treated as preferences, not absolute instructions. They must not override:

- Explicit task instructions.
- Accessibility requirements.
- Privacy constraints.
- Legal or policy constraints.
- Checked knowledge files and route playbooks.

Use `--with-learning` only when the saved context is relevant to the current task. Add `--learning-category <kind>` and `--learning-limit <N>` when only one category or a small recent subset should influence the prompt.

Run `design-ai learn --audit` before exporting or injecting a profile that may contain copied project notes, credentials, contact details, or stale entries. Follow the Suggested cleanup section when it recommends removal; rewrite and re-add entries when the issue is sensitive content or an overlong note that still contains useful preference signal.

Use `design-ai learn --stats` when you need a quick read on profile size, category distribution, source distribution, latest entry, and audit status before deciding whether to run a detailed audit.

Use `design-ai learn --feedback` only for durable preferences you want future prompts to see. Do not store one-off task corrections, private project facts, credentials, contact details, or unresolved critique as feedback entries.

Use `design-ai learn --import --dry-run` before applying a profile from another machine or repository. Audit the source first when it may include copied project notes, credentials, contact details, or stale entries.

Treat any learned-context audit warning as a review prompt, not as permission to include risky data. Remove, rewrite, or scope entries before using `--with-learning` when audit warnings are not expected. Use `--audit --fix --dry-run` first when you want to see which entries can be cleaned automatically.

Deletion actions and confirmed import require `--yes` because they mutate the local profile. Use `--list` first when you need the exact id or list number.
