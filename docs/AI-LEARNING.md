# AI learning

design-ai supports a local learning profile. This is not model training, fine-tuning, or automatic data collection. It is explicit local memory that you choose to include in generated prompts.

## Scope

What ships in v4.13:

- `design-ai learn --remember ...` stores user or project preferences in a local JSON profile.
- `design-ai learn --list` shows saved entries, with optional `--category` and `--limit` filters.
- `design-ai learn --export` prints the Markdown context block used by prompt generation, with the same filters.
- `design-ai learn --forget ... --yes` removes a single saved entry.
- `design-ai learn --clear --yes` clears the local profile.
- `design-ai prompt --with-learning ...` injects the learned context into the generated task prompt.
- `design-ai pack --with-learning ...` includes the same learned context in portable prompt packs.

What does not ship:

- Model fine-tuning.
- Private model training on user artifacts.
- Automatic telemetry or background collection.
- Semantic embedding index generation.
- Feedback learning from accepted/rejected recommendations.

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
```

Use learned context in a prompt pack:

```bash
design-ai pack "Spec a pricing page for Korean SaaS" --with-learning --max-bytes 80000
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

Use `--with-learning` only when the saved context is relevant to the current task.

Deletion actions require `--yes` because they mutate the local profile. Use `--list` first when you need the exact id or list number.
