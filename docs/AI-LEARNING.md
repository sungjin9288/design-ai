# AI learning

design-ai supports a local learning profile. This is not model training, fine-tuning, or external telemetry. It is explicit local memory that you choose to include in generated prompts; `check --learn` can derive entries from a local QA report only when you run it.

## Scope

What ships in v4.47:

- `design-ai learn --init` previews starter local learning entries for dogfood use, and `--init --yes` writes them to the selected profile.
- `design-ai learn --remember ...` stores user or project preferences in a local JSON profile.
- `design-ai learn --feedback ...` converts outcome feedback into reusable local learning notes.
- `design-ai check <artifact.md|--stdin> --learn` previews warning/failure QA results as local learning entries, and `--learn --yes` writes them to the selected profile.
- `design-ai learn --list` shows saved entries, with optional `--category`, `--query`, `--explain`, and `--limit` filters.
- `design-ai learn --export` prints the Markdown context block used by prompt generation, with the same filters.
- `design-ai learn --backup` prints a full portable learning-profile backup in JSON mode.
- `design-ai learn --redact` prints a portable JSON backup with sensitive-looking entry text redacted from the local profile, `--from-file`, or `--stdin`.
- `design-ai learn --out file` writes JSON result artifacts, `learn --export --out file` writes the Markdown context block, and `learn --curate --report --out file` writes the Markdown curation report, while `--force` controls overwrites.
- `design-ai learn --verify` validates a portable learning JSON payload without importing it.
- `design-ai learn --diff --from-file learning.json` compares the active profile against a portable learning JSON payload without importing it, reporting profile-only entries, comparison-only entries, metadata changes, and id conflicts.
- `design-ai learn --import` merges entries from a JSON learning profile or `learn --export --json` payload.
- `design-ai learn --audit` inspects profile shape, duplicates, possible sensitive content, and cleanup suggestions without changing the profile.
- `design-ai learn --audit --fix --dry-run` previews safe cleanup suggestions that can be applied automatically.
- `design-ai learn --audit --fix --yes` applies only unambiguous safe cleanup suggestions.
- `design-ai learn --curate` previews archive-first cleanup for duplicate and sensitive learning entries without changing the profile, and includes advisory usage review hints for profile-path mismatch, stale selected ids, and unused active entries when a usage sidecar is available.
- `design-ai learn --curate --report` emits a Markdown curation report for preview or apply results, and `--out file` writes it as a durable local review artifact.
- `design-ai learn --curate --yes` moves duplicate/sensitive candidates into a sibling `*.archive.json` file instead of deleting them.
- `design-ai learn --stats` summarizes profile counts, category/source distribution, recency, and audit status without changing the profile.
- `design-ai learn --usage` summarizes prompt/pack `--with-learning` usage sidecar events, selected entry counts, unused active entries, and recent usage without changing any files.
- `design-ai learn --eval-template` generates a runnable learning eval checkpoint JSON from the active profile, optional query, category, and limit.
- `design-ai learn --eval` validates deterministic learning-selection checkpoints from a JSON file or stdin without changing the profile; add `--strict` to exit non-zero when any checkpoint warns or fails. JSON reports expose checkpoint `generatedAt` plus a sanitized `sourceProfile` summary without raw checkpoint brief or query text.
- `design-ai workspace` includes the selected learning profile path, entry count, category counts, latest entry, audit status, usage sidecar readiness, eval checkpoint readiness, and canonical repository alignment in a broader read-only dogfood readiness snapshot; add `--learning-usage path` or `--learning-eval path` to include specific artifacts, omit them to auto-detect sibling `learning.usage.json` and `learning-eval.json` files when present, and add `--strict` when warning/failure readiness should fail the command.
- `design-ai workspace` checks learning usage sidecar readiness when usage metadata is available. If the sidecar points at another profile or references selected entry ids that are no longer present in the active profile, `workspace` emits a warning and suggests `design-ai learn --curate --usage-file ...` so profile audit and usage review are inspected together.
- When learning curation is recommended, `design-ai workspace` also suggests a companion report artifact command such as `design-ai learn --curate --report --out <learning-file-dir>/learning-curation-report.md`, adding `--usage-file` when usage metadata is part of the readiness warning.
- `design-ai workspace` checks learning eval checkpoint freshness when metadata is available. If the profile was updated after the checkpoint was generated, the checkpoint came from another profile path, or the source entry count changed, `workspace` emits a warning and suggests regenerating the checkpoint.
- When a clean learning profile has entries but no checkpoint is available, `design-ai workspace` adds a next-action command for `design-ai learn --eval-template --file <learning.json> --out <learning-file-dir>/learning-eval.json`.
- Workspace next-action commands that include learning profile, usage sidecar, or eval checkpoint paths are shell-quoted, so paths with spaces or apostrophes remain copy/paste safe.
- Post-publish registry smoke verifies public registry `design-ai workspace --learning-eval learning-eval.json --strict --json` checkpoint summaries, auto-detected learning usage sidecar summaries, and public registry `design-ai learn --eval-template` checkpoint generation plus generated checkpoint strict validation from the published package path.
- `design-ai learn --forget ... --yes` removes a single saved entry.
- `design-ai learn --clear --yes` clears the local profile.
- `design-ai prompt --with-learning ...` injects learned context into the generated task prompt, ranking entries by current brief relevance before falling back to recency, with optional `--learning-category` and `--learning-limit` scoping plus selection scoring metadata.
- `design-ai pack --with-learning ...` includes the same brief-relevant learned context in portable prompt packs, with the same optional scoping controls and selection scoring metadata.
- `prompt --with-learning` and `pack --with-learning` write a local usage sidecar such as `learning.usage.json` with command, route id, selected learning entry ids, selection counts, audit status, and a short brief hash. The sidecar does not store raw brief/query text.
- Exported and injected learned context carries an audit summary; if the profile has warnings, the generated context includes a notice to run `design-ai learn --audit`.

What does not ship:

- Model fine-tuning.
- Private model training on user artifacts.
- External telemetry or background collection outside explicit local CLI runs.
- Semantic embedding index generation.
- Background learning from accepted/rejected recommendations without an explicit CLI command.

## Storage

Default path:

```bash
~/.design-ai/learning.json
```

Default usage sidecar path:

```bash
~/.design-ai/learning.usage.json
```

Override path:

```bash
DESIGN_AI_LEARNING_FILE=/path/to/learning.json design-ai learn --list
DESIGN_AI_LEARNING_USAGE_FILE=/path/to/learning.usage.json design-ai prompt "audit checkout UX" --with-learning
design-ai learn --usage --file /path/to/learning.json --usage-file /path/to/learning.usage.json
```

The profile and usage sidecar are local to the machine. They are not synced, uploaded, or sent to any provider by this CLI.

For a broader local readiness check that includes git state, learning audit state, and release-script availability, run:

```bash
design-ai workspace --json
design-ai workspace --learning-file ./learning.json
design-ai workspace --learning-file ./learning.json --learning-usage ./learning.usage.json
design-ai workspace --learning-file ./learning.json --strict
design-ai workspace --learning-file ./learning.json --learning-usage ./learning.usage.json --learning-eval ./learning-eval.json --strict
design-ai workspace --strict
```

This command is read-only. It does not save learning entries, edit the profile, create commits, push branches, or run release scripts.

If the selected learning profile has sibling `learning.usage.json` or `learning-eval.json` files, `workspace` automatically includes those summaries. Use `--learning-usage path` or `--learning-eval path` only when you want a different sidecar or checkpoint.

When usage metadata is available, `workspace` compares it against the selected profile. A usage sidecar becomes a readiness warning when its `profileFile` points at another profile or when its selected entry ids no longer exist in the active profile, and the next actions point to usage-aware curation plus a companion curation Markdown report rather than a separate usage-only report.

When checkpoint metadata is available, `workspace` also compares it against the selected profile. A passing checkpoint still becomes a readiness warning when the profile `updatedAt` is newer than checkpoint `generatedAt`, when `sourceProfile.file` does not match the active profile path, or when the recorded source entry count differs from the active profile count.

If the selected profile, usage sidecar, report output, or checkpoint path includes spaces or shell-sensitive characters, the suggested `learn --curate --usage-file`, `learn --curate --report --out`, `learn --usage`, `learn --eval-template`, and `learn --eval --from-file` commands quote the path in the next action output.

If the selected learning profile already contains entries and passes audit, `workspace` suggests an eval-template bootstrap command until a sibling or explicit checkpoint is available:

```bash
design-ai learn --eval-template --file ./learning.json --out ./learning-eval.json
design-ai workspace --learning-file ./learning.json --strict
```

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

Compare a portable learning payload against the active profile:

```bash
design-ai learn --diff --from-file learning-backup.json
design-ai learn --diff --from-file learning-backup.json --json --out learning-diff.json
cat learning-backup.json | design-ai learn --diff --stdin --json
```

Diff mode is read-only. It compares the active profile with a portable profile by category plus normalized text, then reports profile-only entries, comparison-only entries, metadata changes for matching notes, and id conflicts where the same id points at different learning text.

Import a portable learning profile:

```bash
design-ai learn --backup --json --out learning-backup.json
design-ai learn --redact --json --out learning-redacted.json
design-ai learn --redact --from-file learning-backup.json --json --out learning-redacted.json --force
design-ai learn --verify --from-file learning-backup.json
design-ai learn --diff --from-file learning-backup.json --json
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
design-ai learn --curate
design-ai learn --curate --usage-file ./learning.usage.json
design-ai learn --curate --report --out learning-curation-report.md
design-ai learn --curate --yes --json
```

The plain audit is advisory and non-mutating. It reports invalid JSON/profile shape failures plus warnings for duplicate entries, missing timestamps, long notes, and conservative sensitive-content patterns such as secret-like assignments, private key blocks, email addresses, and Korean mobile phone numbers. JSON output includes `suggestions`; human output adds a Suggested cleanup section with safe `design-ai learn --file ... --forget ... --yes` commands only when id-based deletion is unambiguous.

`--audit --fix --dry-run` turns those safe suggestions into a cleanup plan without changing the file. `--audit --fix --yes` removes only entries that have stable, unambiguous ids and skips anything that still needs manual review, such as invalid JSON, duplicate ids, malformed entries, or warnings without a safe target.

`--curate` is the safer Hermes-inspired path for normal profile maintenance. It previews curation proposals by default, classifies duplicate text and conservative sensitive-content warnings as archive candidates, and leaves timestamp, long-note, malformed-entry, duplicate-id, or profile-level failures for manual review. When a default or explicit `--usage-file` sidecar is available, the same preview adds a usage review section for sidecars recorded against a different profile path, stale selected ids, and active entries that have not appeared in recorded prompt/pack usage. Usage review is advisory only: `autoArchive` stays `false`, and unused or mismatched usage signals never archive entries by themselves. Add `--report` when you need a Markdown audit trail with profile/archive paths, before/after summaries, archive candidates, manual review items, usage review, privacy notes, and next steps; `--curate --report --out file` writes that report without requiring `--json`. Confirmed `--curate --yes` rewrites the active `learning.json` with duplicate/sensitive archive candidates removed and appends their full entries plus `archivedAt`, `archiveReason`, `issueCodes`, and `originalFile` metadata to a sibling archive file such as `learning.archive.json`. No archive file is written during preview.

Summarize profile health and recency:

```bash
design-ai learn --stats
design-ai learn --stats --json
```

Stats mode is also read-only. It is a compact overview for deciding whether to inspect, filter, or clean up the profile before using `--with-learning`.

Summarize usage sidecar activity:

```bash
design-ai learn --usage
design-ai learn --usage --json
design-ai learn --usage --limit 5 --usage-file ./learning.usage.json
```

Usage mode is read-only. It reports event count, command/route/category distribution, entry ids selected by `prompt` and `pack`, active profile entries that have not been used yet, stale selected ids no longer present in the active profile, and recent events. It preserves the privacy boundary from the sidecar: selected entry ids and short brief hashes are shown, but raw prompt or query text is not stored or reported.

Evaluate learning-selection checkpoints:

```bash
design-ai learn --eval-template --query "Spec a Button component API with keyboard accessibility" --category accessibility --out learning-eval.json
cat > learning-eval.json <<'JSON'
{
  "version": 1,
  "cases": [
    {
      "id": "button-accessibility",
      "routeId": "component-spec",
      "brief": "Spec a Button component API with keyboard accessibility",
      "category": "accessibility",
      "limit": 1,
      "expectedSelectedIds": ["learn-relevant"],
      "avoidedSelectedIds": ["learn-brand"],
      "minMatchedCount": 1,
      "requireNoFallback": true
    }
  ]
}
JSON
design-ai learn --eval --from-file learning-eval.json --strict --json
cat learning-eval.json | design-ai learn --eval --stdin --category accessibility --limit 1
design-ai learn --eval --from-file learning-eval.json --json --out learning-eval-report.json
```

`learn --eval-template` is read-only and writes a checkpoint file that can be passed directly to `learn --eval`; checkpoint templates intentionally store raw `brief` text so they can be re-run locally, so review them before sharing. Eval mode is also read-only. It compares checkpoint cases against the same brief-relevance selection used by `prompt --with-learning` and `pack --with-learning`, then reports expected selected ids, avoided selected ids, minimum matched counts, fallback policy failures, and per-case status. JSON and human eval reports expose a short `briefHash`, selected entry ids, counts, and issues; they do not expose raw brief/query text or matched tokens. `--out` writes only the eval report artifact and follows the normal overwrite protection unless `--force` is provided.
Add `--strict` when the eval report should act as a local CI or release gate: the report is printed or written first, then the command exits non-zero if any case warns or fails.

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

When `--with-learning` is used, generated prompt plans include the same audit summary as `learn --export --json`. The selected entries are ranked against the prompt brief first, then recency is used for ties or unmatched fallback entries. JSON output includes `selection.selected[]` with each selected entry's `id`, `category`, relevance `score`, `matchedTokens`, and `reason` (`brief-match`, `recency-fallback`, or `recency`). Prompt and pack JSON also include `learningUsage`, and the CLI writes a local sidecar event that records selected entry ids and a short brief hash, not raw brief text. The learned-context block includes a compact selection note, and if the local profile has audit warnings, it tells the receiving agent to run `design-ai learn --audit` before relying on that context.

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

Use `design-ai learn --diff --from-file` after verification when you need to understand what would be new, missing, or metadata-changed before deciding whether to import or restore a portable profile.

Use `design-ai learn --redact --json --out learning-redacted.json` before sending a local learning profile to another person, repository, or support channel. If you already have a portable backup artifact, use `design-ai learn --redact --from-file learning-backup.json --json --out learning-redacted.json --force` or pipe it through `design-ai learn --redact --stdin --json --out learning-redacted.json --force` so the original artifact remains unchanged. Review the resulting `redactions` list and then run `design-ai learn --verify --from-file learning-redacted.json` if the redacted profile will be imported elsewhere.

Use `design-ai learn --import --dry-run` before applying a profile from another machine or repository. Audit the source first when it may include copied project notes, credentials, contact details, or stale entries.

Use `design-ai learn --backup --json --out learning-backup.json` before major cleanup or machine migration when you need a complete local copy. Unlike `learn --export`, backup is not limited to the default prompt-context subset, and `--out` avoids accidental shell redirection overwrites unless `--force` is explicit.

Treat any learned-context audit warning as a review prompt, not as permission to include risky data. Remove, rewrite, or scope entries before using `--with-learning` when audit warnings are not expected. Use `--audit --fix --dry-run` first when you want to see which entries can be cleaned automatically.

Deletion actions and confirmed import require `--yes` because they mutate the local profile. Use `--list` first when you need the exact id or list number.
