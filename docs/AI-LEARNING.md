# AI learning

design-ai supports a local learning profile. This is not model training, fine-tuning, or background data collection. It is explicit local memory that you choose to include in generated prompts; `check --learn` can derive entries from a local QA report only when you run it.

## Scope

What ships in v4.13:

- `design-ai learn --init` previews starter local learning entries for dogfood use, and `--init --yes` writes them to the selected profile.
- `design-ai learn --remember ...` stores user or project preferences in a local JSON profile.
- `design-ai learn --feedback ...` converts outcome feedback into reusable local learning notes.
- `design-ai check <artifact.md|--stdin> --learn` previews warning/failure QA results as local learning entries, and `--learn --yes` writes them to the selected profile.
- `design-ai learn --list` shows saved entries, with optional `--category`, `--query`, `--explain`, and `--limit` filters.
- `design-ai learn --export` prints the Markdown context block used by prompt generation, with the same filters.
- `design-ai learn --backup` prints a full portable learning-profile backup in JSON mode.
- `design-ai learn --redact` prints a portable JSON backup with sensitive-looking entry text redacted from the local profile, `--from-file`, or `--stdin`.
- `design-ai learn --out file` writes JSON result artifacts, and `learn --export --out file` writes the Markdown context block, while `--force` controls overwrites.
- `design-ai learn --verify` validates a portable learning JSON payload without importing it.
- `design-ai learn --import` merges entries from a JSON learning profile or `learn --export --json` payload.
- `design-ai learn --audit` inspects profile shape, duplicates, possible sensitive content, and cleanup suggestions without changing the profile.
- `design-ai learn --audit --fix --dry-run` previews safe cleanup suggestions that can be applied automatically.
- `design-ai learn --audit --fix --yes` applies only unambiguous safe cleanup suggestions.
- `design-ai learn --stats` summarizes profile counts, category/source distribution, recency, and audit status without changing the profile.
- `design-ai workspace` includes the selected learning profile path, entry count, category counts, latest entry, audit status, and canonical repository alignment in a broader read-only dogfood readiness snapshot.
- `design-ai learn --forget ... --yes` removes a single saved entry.
- `design-ai learn --clear --yes` clears the local profile.
- `design-ai prompt --with-learning ...` injects learned context into the generated task prompt, ranking entries by current brief relevance before falling back to recency, with optional `--learning-category` and `--learning-limit` scoping plus selection scoring metadata.
- `design-ai pack --with-learning ...` includes the same brief-relevant learned context in portable prompt packs, with the same optional scoping controls and selection scoring metadata.
- Exported and injected learned context carries an audit summary; if the profile has warnings, the generated context includes a notice to run `design-ai learn --audit`.

What does not ship:

- Model fine-tuning.
- Private model training on user artifacts.
- Automatic telemetry or background collection.
- Semantic embedding index generation.
- Background learning from accepted/rejected recommendations without an explicit CLI command.

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

For a broader local readiness check that includes git state, learning audit state, and release-script availability, run:

```bash
design-ai workspace --json
design-ai workspace --learning-file ./learning.json
```

This command is read-only. It does not save learning entries, edit the profile, create commits, push branches, or run release scripts.

## Usage

Bootstrap a starter profile:

```bash
design-ai learn --init
design-ai learn --init --yes
design-ai learn --init --yes --json
```

`learn --init` is preview-first and does not mutate the profile. Add `--yes` to save deterministic starter entries for recommendation style, implementation workflow, accessibility, Korean UX, brand language, and local data boundaries. Existing `category + normalized text` duplicates are skipped and reported, so re-running the command is safe.

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

Capture artifact QA feedback:

```bash
design-ai check output.md --learn
design-ai check output.md --learn --yes
cat output.md | design-ai check --stdin --learn --yes --learning-file ./learning.json --json
```

`check --learn` is a preview and does not mutate the profile. Add `--yes` to save only warning/failure check results. The capture keeps the existing learning entry shape (`id`, `category`, `text`, `source`, `createdAt`), records source as `check:<routeId>` or `check:artifact`, maps keyboard/screen-reader findings to `accessibility`, Korean-context findings to `korean`, and all remaining check findings to `workflow`. Duplicate category+normalized text pairs are skipped and reported.

List saved preferences:

```bash
design-ai learn --list
design-ai learn --list --json
design-ai learn --list --category korean --limit 5
design-ai learn --list --query "keyboard accessibility" --explain --json
```

Export the learned context block:

```bash
design-ai learn --export
design-ai learn --export --category accessibility --limit 3
design-ai learn --export --query "pricing page" --limit 3
design-ai learn --export --out learned-context.md
```

`--query` filters list/export output to entries whose category or text matches the query tokens. Unlike prompt/pack learning injection, query-filtered list/export does not fill remaining limit slots with recency fallback entries, so it is safe for profile inspection. Add `--explain` to `learn --list` when you need the selection score, matched tokens, and reason for each listed entry; JSON output includes the same selection metadata shape used by prompt/pack learning context. The exported block includes profile audit metadata in JSON mode. Human Markdown stays compact when the profile passes audit, and includes a warning notice when the profile has audit warnings. `--out` writes the Markdown block for `--export`, and refuses to overwrite an existing file unless `--force` is provided.

Back up the full local profile:

```bash
design-ai learn --backup --json --out learning-backup.json
```

Backup JSON includes all normalized entries, the source profile path, profile metadata, an `exportedAt` timestamp, and the current audit summary. The payload keeps an `entries` array, so it can be reviewed and then imported on another machine with `design-ai learn --import`. `--out` uses the same safe file-write rules as `prompt` and `pack`: existing files are rejected unless you add `--force`.

Create a redacted portable profile before sharing:

```bash
design-ai learn --redact --json --out learning-redacted.json
design-ai learn --redact --from-file learning-backup.json --json --out learning-redacted.json --force
cat learning-backup.json | design-ai learn --redact --stdin --json --out learning-redacted.json --force
```

Redacted JSON keeps the same importable `entries` shape as a backup, but replaces conservative sensitive-content matches with `[REDACTED:<code>]` markers and includes `redactions`, `sourceAuditSummary`, and post-redaction `auditSummary` fields. It is read-only and does not change the source profile or source portable payload.

Verify a portable learning payload before importing:

```bash
design-ai learn --verify --from-file learning-backup.json
cat learning-backup.json | design-ai learn --verify --stdin --json
```

Verify mode parses the same `entries` payload accepted by import, normalizes imported entry metadata, and reports audit warnings such as duplicate ids or sensitive-looking text. It never reads or writes the target local profile.

Import a portable learning profile:

```bash
design-ai learn --backup --json --out learning-backup.json
design-ai learn --redact --json --out learning-redacted.json
design-ai learn --redact --from-file learning-backup.json --json --out learning-redacted.json --force
design-ai learn --verify --from-file learning-backup.json
design-ai learn --import --from-file learning-backup.json --dry-run
cat learning-backup.json | design-ai learn --import --stdin --yes
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

When `--with-learning` is used, generated prompt plans include the same audit summary as `learn --export --json`. The selected entries are ranked against the prompt brief first, then recency is used for ties or unmatched fallback entries. JSON output includes `selection.selected[]` with each selected entry's `id`, `category`, relevance `score`, `matchedTokens`, and `reason` (`brief-match`, `recency-fallback`, or `recency`). The learned-context block includes a compact selection note, and if the local profile has audit warnings, it tells the receiving agent to run `design-ai learn --audit` before relying on that context.

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

Use `--with-learning` only when saved context should influence the current task. The CLI prioritizes entries whose category/text match the current brief, then falls back to recent entries when the limit still has room. Inspect `learningContext.selection` in `--json` output when you need to confirm whether an entry was selected by brief match or recency fallback. Add `--learning-category <kind>` and `--learning-limit <N>` when only one category or a small subset should influence the prompt. Use `design-ai learn --list --query <text> --explain` or `design-ai learn --export --query <text>` when you want to inspect matching local preferences without recency fallback.

Run `design-ai learn --audit` before exporting or injecting a profile that may contain copied project notes, credentials, contact details, or stale entries. Follow the Suggested cleanup section when it recommends removal; rewrite and re-add entries when the issue is sensitive content or an overlong note that still contains useful preference signal.

Use `design-ai learn --stats` when you need a quick read on profile size, category distribution, source distribution, latest entry, and audit status before deciding whether to run a detailed audit.

Use `design-ai learn --feedback` only for durable preferences you want future prompts to see. Do not store one-off task corrections, private project facts, credentials, contact details, or unresolved critique as feedback entries.

Use `design-ai learn --verify --from-file` before reviewing or applying a profile from another machine or repository. It confirms the payload is importable without touching your current local profile.

Use `design-ai learn --redact --json --out learning-redacted.json` before sending a local learning profile to another person, repository, or support channel. If you already have a portable backup artifact, use `design-ai learn --redact --from-file learning-backup.json --json --out learning-redacted.json --force` or pipe it through `design-ai learn --redact --stdin --json --out learning-redacted.json --force` so the original artifact remains unchanged. Review the resulting `redactions` list and then run `design-ai learn --verify --from-file learning-redacted.json` if the redacted profile will be imported elsewhere.

Use `design-ai learn --import --dry-run` before applying a profile from another machine or repository. Audit the source first when it may include copied project notes, credentials, contact details, or stale entries.

Use `design-ai learn --backup --json --out learning-backup.json` before major cleanup or machine migration when you need a complete local copy. Unlike `learn --export`, backup is not limited to the default prompt-context subset, and `--out` avoids accidental shell redirection overwrites unless `--force` is explicit.

Treat any learned-context audit warning as a review prompt, not as permission to include risky data. Remove, rewrite, or scope entries before using `--with-learning` when audit warnings are not expected. Use `--audit --fix --dry-run` first when you want to see which entries can be cleaned automatically.

Deletion actions and confirmed import require `--yes` because they mutate the local profile. Use `--list` first when you need the exact id or list number.
