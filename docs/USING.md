# Using design-ai with your AI agent

How to plug this knowledge base into different AI coding tools.

## Codex CLI

Codex automatically reads `AGENTS.md` from the project root.

```bash
cd /path/to/design-ai
codex "Generate a color palette for a Korean fintech app"
```

Codex will consume `AGENTS.md`, navigate `knowledge/`, and apply the relevant skill playbook. No setup required.

## Route eval checkpoints

Use route evals when you want to verify that task briefs still select the intended design-ai command, skill, agents, and knowledge set after changing keywords, skills, or agent docs.

```bash
design-ai route --eval-template --json > route-eval.json
design-ai route --eval --from-file route-eval.json --strict --json
```

The eval is deterministic and read-only. It does not call an AI provider, write to the learning profile, or mutate installed skills. Treat it as the first agent-routing conformance check before deeper prompt, learning, or Website Console evals.

## Prompt and pack eval checkpoints

Use prompt and pack evals after route evals pass. They verify that generated agent prompts and context bundles still include the expected route, playbook files, checklist items, and context coverage.

```bash
design-ai prompt --eval-template --json > prompt-eval.json
design-ai prompt --eval --from-file prompt-eval.json --strict --json

design-ai pack --eval-template --json > pack-eval.json
design-ai pack --eval --from-file pack-eval.json --strict --json
```

Prompt evals check the plan before context bundling. Pack evals check the bundled file set and context status without printing the full context file bodies in eval JSON. Both paths are deterministic, local, and read-only.

## Learning signal registry

Use the learning signal registry when you want one read-only snapshot that joins local learning profile health, usage sidecar activity, route/prompt/pack/learning eval files, check learning capture entries, and workspace readiness.

```bash
design-ai learn --signals --from-file . --json
design-ai learn --signals --from-file . --strict --json
design-ai learn --signals --from-file route-eval-report.json --usage-file learning.usage.json
```

`--from-file` accepts either a single eval signal file or a directory containing `route-eval*.json`, `prompt-eval*.json`, `pack-eval*.json`, or `learning-eval*.json` reports. The command does not mutate `learning.json`, does not call external AI APIs, and exposes only local metadata plus short check-capture text previews. Add `--strict` when you want the signal registry or agent development backlog to fail a local gate on warn/fail status.

## Agent development backlog

Use the focused backlog when you want only the local AI/agent next-action queue from the signal registry, without the full learning/usage/eval/workspace report.

```bash
design-ai learn --agent-backlog --from-file . --json
design-ai learn --agent-backlog --from-file . --strict --json
design-ai learn --agent-backlog --from-file . --report --out agent-backlog.md
```

The command is read-only and uses the same deterministic `agentDevelopment` data as `learn --signals`. JSON and Markdown output include an `actionPlan` with ordered steps, an `executionQueue` that groups preview/read-only commands before file-write and mutation-review commands while also exposing `ordered`, `orderedCount`, `nextActionId`, `nextCommand`, `nextCommandRunPolicy`, and a command-bearing `commandManifest`, aggregate `safetySummary` counts, verification commands, `requiresReviewBeforeMutation` flags, and `commandSafety` metadata that classifies follow-up commands as `read-only`, `writes-local-file`, or `mutates-local-state`. Queue items also expose a `runPolicy` of `preview-only`, `review-before-file-write`, or `review-before-mutation`, plus `commandEffects` target hints for output files, learning profile files, usage sidecars, mutation flags, and clean-workspace review reasons. The queue also includes `commandEffectSummary` aggregate counts and `commandEffectReview` guidance so an operator can scan target and mutation-flag exposure, then follow a concrete review headline, checklist, phase-tagged gate commands, `gatePhaseSummary` counts, and `gateRunbook` buckets before opening every manifest entry. The same queue also exposes an `operatorRunbook` with `before`, `execute`, `after`, and `refresh` stages plus `nextStage` / `nextCommand` metadata, so local operators can start with the first required gate command when present and follow the reviewed handoff sequence without rebuilding it from separate gate and command-manifest fields. This lets an operator move from backlog review to controlled execution without guessing which commands may change local files or rebuilding the recommended action order from grouped buckets. It does not mutate `learning.json`, skill files, usage sidecars, eval files, or target repositories, and it does not call external AI APIs.

## Skill evolution proposals

Use skill evolution proposals after repeated `check --learn --yes` captures point at the same route or category. The report turns those local signals into candidate skill edits, but it remains preview-only.

```bash
design-ai learn --propose-skills --from-file . --json
design-ai learn --propose-skills --from-file . --min-evidence 3 --json
design-ai learn --propose-skills --from-file . --strict --json
design-ai learn --propose-skills --from-file . --report --out skill-proposals.md
design-ai learn --propose-skills --from-file route-eval-report.json --usage-file learning.usage.json
```

Each proposal includes the candidate skill path, evidence sources, proposed instruction delta, verification command, and risk level. Use `--min-evidence N` to tune how many related check-capture entries are required before a proposal appears. Use `--report --out skill-proposals.md` when you need a reviewer-friendly Markdown artifact before editing a skill by hand. Add `--strict` when pending proposals or upstream signal readiness warnings should fail a local gate. The command does not mutate `learning.json`, does not edit `skills/*/SKILL.md`, and does not call external AI APIs.

## Claude Code

Claude Code reads `CLAUDE.md` automatically. To get **slash commands** and **skill auto-loading**, optionally symlink:

```bash
# From the project root:
mkdir -p ~/.claude/commands ~/.claude/skills ~/.claude/agents

# Slash commands
for f in commands/*.md; do
  ln -sf "$(pwd)/$f" "$HOME/.claude/commands/design-$(basename "$f")"
done

# Skills
for d in skills/*/; do
  name=$(basename "$d")
  ln -sf "$(pwd)/$d" "$HOME/.claude/skills/design-$name"
done

# Agents
for f in agents/*.md; do
  [ "$(basename "$f")" = "README.md" ] && continue
  ln -sf "$(pwd)/$f" "$HOME/.claude/agents/$(basename "$f")"
done
```

This makes:
- `/design-design-review`, `/design-palette-from-brand`, etc. available globally.
- The skills auto-loadable by Claude Code's skill system.
- Agents spawnable by name.

If you don't symlink, you can still reference everything by path in conversation:
- "Apply the playbook at `skills/color-palette/PLAYBOOK.md` to a fintech app."
- "Spawn the agent at `agents/design-critic.md` to review this Figma link."

## Cursor

Drop these contents into your project's `.cursorrules`:

```
You are a senior product designer with 20+ years of experience.

When the user asks for design work, follow the playbook in /path/to/design-ai/AGENTS.md.

For UX audits: /path/to/design-ai/skills/ux-audit/PLAYBOOK.md
For palettes: /path/to/design-ai/skills/color-palette/PLAYBOOK.md
For component specs: /path/to/design-ai/skills/component-spec-writer/PLAYBOOK.md
...
```

Adjust paths.

## Aider

```bash
aider --read AGENTS.md --read knowledge/colors/color-theory.md \
      --read skills/color-palette/PLAYBOOK.md
```

Or use `.aider.conf.yml`:

```yaml
read:
  - AGENTS.md
  - knowledge/a11y/contrast.md
  - knowledge/a11y/keyboard-and-focus.md
  - knowledge/colors/color-theory.md
  - knowledge/typography/type-scale-fundamentals.md
```

## Plain prompt (any model)

Concatenate the relevant knowledge + skill into the system prompt:

```bash
cat AGENTS.md \
    skills/color-palette/PLAYBOOK.md \
    knowledge/colors/color-theory.md \
    knowledge/a11y/contrast.md \
    > /tmp/system-prompt.md
```

Pass `/tmp/system-prompt.md` as the system prompt to whatever LLM you're using.

## Token budget

Including everything is overkill. Per-task minimal context:

| Task | Files to load |
| --- | --- |
| Color palette generation | `AGENTS.md`, `skills/color-palette/PLAYBOOK.md`, `knowledge/colors/color-theory.md`, `knowledge/colors/palettes-by-product-type.md`, `knowledge/a11y/contrast.md` |
| Component spec | `AGENTS.md`, `skills/component-spec-writer/PLAYBOOK.md`, `knowledge/components/INDEX.md`, `knowledge/a11y/keyboard-and-focus.md` |
| UX audit | `AGENTS.md`, `skills/ux-audit/PLAYBOOK.md`, `knowledge/patterns/ux-guidelines.md`, `knowledge/a11y/contrast.md`, `knowledge/a11y/keyboard-and-focus.md` |
| Design system bootstrap | `AGENTS.md`, `skills/design-system-builder/PLAYBOOK.md`, `knowledge/colors/color-theory.md`, `knowledge/typography/type-scale-fundamentals.md`, `knowledge/layout/spacing-and-grid.md` |
| Website improvement control tower | `AGENTS.md`, `skills/website-improvement/PLAYBOOK.md`, `docs/WEBSITE-IMPROVEMENT.md`, `knowledge/patterns/dashboard-composition.md`, `knowledge/patterns/report-design.md`, `knowledge/patterns/ux-guidelines.md`, `knowledge/a11y/keyboard-and-focus.md` |

This stays under 30K tokens for any single task — well within most model context windows even before caching.

## Refresh cycle

When new versions of upstream design systems are released, refresh:

```bash
bash tools/clone-refs.sh        # Pull/clone refs/
bash tools/extractors/run-all.sh # Regenerate knowledge/
```

Generated knowledge files include `extracted_at` in their frontmatter. Hand-written files (`<!-- hand-written -->` at top) are preserved.
