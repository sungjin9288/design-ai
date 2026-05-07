# Codex CLI integration

How to use design-ai with **OpenAI Codex CLI** (Anthropic-compatible MCP). Codex is the primary "non-Claude-Code" agent target for this project.

## Quickstart

```bash
cd /path/to/design-ai
codex
```

Codex automatically reads `AGENTS.md` from the project root. It primes itself, navigates `knowledge/`, applies `skills/`, and produces deliverables.

**No additional setup is required for read-only design tasks.** For full feature parity with Claude Code (slash commands, agent personas), see below.

## File-loading order

Codex respects this load order:

1. `AGENTS.md` — universal entry (auto-loaded by Codex)
2. `knowledge/PRINCIPLES.md` — referenced by AGENTS.md as "step 0"
3. `knowledge/<category>/<file>.md` — loaded on demand per task
4. `skills/<skill>/PLAYBOOK.md` — loaded when invoked
5. `examples/component-<name>.md` — loaded as quality reference

Codex doesn't auto-load `CLAUDE.md` (it's Claude-specific) — `AGENTS.md` is the single source of truth.

## Invoking skills in Codex

Codex doesn't have a "skill system" in the Claude Code sense. Skills are invoked by reference:

```
User: Generate a fintech color palette for a Korean B2C app.
Codex: [reads AGENTS.md → opens skills/color-palette/PLAYBOOK.md → applies it]
```

Or explicitly:

```
User: Apply the color-palette skill to "calming, premium" with a teal seed.
Codex: [opens skills/color-palette/PLAYBOOK.md → executes the playbook]
```

## Invoking slash commands

Codex doesn't have a `/command` system. The body of each `commands/*.md` file is a **prompt template** — you can:

### Option A: Copy-paste the body

```bash
cat commands/design-from-brief.md
# → Copy the body, replace $ARGUMENTS with your brief, paste into Codex
```

### Option B: Reference by path

```
User: Apply commands/design-from-brief.md with this brief: "Korean fintech tracker, calming, premium, RN."
Codex: [reads the command file, parses the brief, executes the orchestrated steps]
```

This works because the command file documents the orchestration steps explicitly.

## Invoking agent personas

`agents/*.md` files contain self-contained role definitions. Codex can adopt them via:

```
User: Adopt the persona at agents/design-critic.md and review this Figma link: ...
Codex: [reads the persona definition → behaves accordingly]
```

For independent parallel reviews (e.g., a11y-reviewer + design-critic on the same artifact): Codex doesn't natively spawn parallel sub-agents the way Claude Code does. Run them sequentially:

```
User: First, apply agents/a11y-reviewer.md to audit this design.
[wait for output]
User: Now apply agents/design-critic.md to the same design.
```

Or compose them into one prompt:

```
User: Apply agents/a11y-reviewer.md AND agents/design-critic.md to this design.
Run them as two separate analyses; combine findings at the end with no
duplicates.
```

## MCP / tool access

Codex CLI supports MCP servers. Useful integrations for design-ai:

### Figma MCP (recommended)

```bash
# Install and configure the Figma MCP server
# Per https://github.com/figma/mcp-server (or vendor docs)

# Add to your ~/.codex/mcp.json:
{
  "mcpServers": {
    "figma": {
      "command": "node",
      "args": ["/path/to/figma-mcp-server"],
      "env": {
        "FIGMA_API_KEY": "your-key"
      }
    }
  }
}
```

After setup, Codex can:
- `figma.get_metadata(file_key)` — file structure
- `figma.get_variables(file_key)` — extract design tokens from a file
- `figma.get_code_connect_map(file_key)` — Code Connect mapping

See [`docs/FIGMA-INTEGRATION.md`](FIGMA-INTEGRATION.md) for the workflows.

### Filesystem access

Codex has filesystem access by default (within the project root). It can:
- Read any file in the repo (`refs/`, `knowledge/`, etc.)
- Write to any file (with user confirmation depending on Codex version)
- Run shell commands (extractors, audit, preview generator)

## Recommended setup

Three approaches, ordered by preference:

### A. Minimal (works out of the box)

```bash
cd /path/to/design-ai
codex "Generate a Korean fintech design system"
```

Just point Codex at the directory. AGENTS.md does the rest.

### B. Per-task context loading

For higher-quality output on specific tasks, explicitly load the relevant files:

```bash
codex \
  --file AGENTS.md \
  --file knowledge/PRINCIPLES.md \
  --file skills/color-palette/PLAYBOOK.md \
  --file knowledge/colors/color-theory.md \
  --file knowledge/i18n/korean-typography.md \
  "Generate a teal-primary palette for a Korean fintech B2C consumer app."
```

(Codex flag may differ; check `codex --help`.)

### C. System prompt overlay

Concatenate the entry docs into a system prompt:

```bash
cat AGENTS.md knowledge/PRINCIPLES.md > /tmp/system-prompt.md
codex --system /tmp/system-prompt.md "your design task"
```

This primes every turn with the design-ai context.

## Token budget

Each task only needs the relevant subset:

| Task | Files to load | ~Token budget |
| --- | --- | --- |
| Color palette | AGENTS.md + PRINCIPLES.md + skills/color-palette/PLAYBOOK.md + knowledge/colors/color-theory.md + knowledge/colors/palettes-by-product-type.md + knowledge/a11y/contrast.md | ~15K |
| Component spec | AGENTS.md + PRINCIPLES.md + skills/component-spec-writer/PLAYBOOK.md + knowledge/components/INDEX.md + knowledge/a11y/keyboard-and-focus.md + relevant refs/ source | ~20K |
| UX audit | AGENTS.md + PRINCIPLES.md + skills/ux-audit/PLAYBOOK.md + knowledge/patterns/ux-guidelines.md + a11y files | ~12K |
| Full design system | AGENTS.md + PRINCIPLES.md + skills/design-system-builder/PLAYBOOK.md + 8-10 knowledge files | ~40K |

All well within Codex's context window. **Don't load everything** — pick what's relevant.

## Best practices

### Use the verification phase

Each skill's PLAYBOOK has a "Verification phase" section. Tell Codex to apply it explicitly:

```
User: Generate the palette, then run the verification phase from
skills/color-palette/PLAYBOOK.md against your output.
```

Or include in the system prompt:

```
At the end of every artifact, run the verification phase from the relevant
skill PLAYBOOK and report any issues you found.
```

### Prefer the structured commands

Don't ask Codex to "design a system" without context. Use the orchestrating commands:

```
✓ "Apply commands/design-from-brief.md with brief: ..."
✓ "Apply skills/component-spec-writer/PLAYBOOK.md to a Tooltip component."

✗ "Make me a design system."
✗ "Spec a tooltip."
```

The commands carry the verification + citation discipline.

### Cite the knowledge

Tell Codex you expect citations:

```
For every major claim in the output, cite the knowledge/ file you got
it from. If you didn't consult a knowledge file for a claim, mark
the claim as "(judgment, not sourced)".
```

This is part of the AGENTS.md instruction set but worth re-emphasizing per task.

### Re-run extractors as needed

If the upstream design systems get updated:

```bash
cd /path/to/design-ai
bash tools/clone-refs.sh        # pull latest
bash tools/extractors/run-all.sh # regenerate knowledge/
python3 tools/audit/check-coverage.py  # update COVERAGE.md
```

Then commit. Codex will pick up the updated knowledge automatically.

## Common Codex pitfalls

| Pitfall | Fix |
| --- | --- |
| Codex invents component APIs without consulting refs/ | Add to system prompt: "Never invent component APIs. Cite refs/ for every prop." |
| Codex outputs hex values without contrast verification | Add: "Color outputs must include a contrast matrix per AGENTS.md rule 6." |
| Codex skips the verification phase | Explicitly request it at the end of each task. |
| Codex loads too many files | Be selective. Only the files needed for the task. |
| Codex mixes Korean and English inconsistently | Specify language up front. "All output should be in Korean." |

## Codex vs Claude Code — when to use which

| Scenario | Recommendation |
| --- | --- |
| Quick palette generation | Codex CLI (lightweight, scriptable) |
| Long-running design system bootstrap | Either; Claude Code's TodoWrite tracks progress better |
| Multi-agent parallel reviews | Claude Code (sub-agent spawning) |
| CI integration (no human in loop) | Codex CLI (better headless ergonomics) |
| Visual review with `tools/preview/render-tokens.py` | Either (both can run shell commands) |
| Plugin packaging / sharing | Claude Code (plugin format more developed) |

For this project's design tasks: **Codex is fully sufficient**. Claude Code's advantages are mostly orchestration ergonomics for very long sessions.

## Troubleshooting

**"Codex doesn't know about my project."**

Check that `AGENTS.md` exists at the project root. Codex auto-loads from there. If it didn't load, your CLI version may not yet support `AGENTS.md` discovery — pass it explicitly via `--file`.

**"Codex output is generic / not citing knowledge files."**

Ensure `knowledge/PRINCIPLES.md` is loaded. The "step 0" priming reference is in `AGENTS.md`. If you customize the system prompt, include `PRINCIPLES.md` content directly.

**"Codex doesn't know about my custom components."**

Custom components live in `examples/component-*.md`. Either pass them via `--file` or reference them in the prompt: "Refer to examples/component-amount-input.md for the existing AmountInput pattern."

**"Codex's MCP setup for Figma isn't working."**

Codex MCP setup is vendor-specific. Check the OpenAI Codex docs and `~/.codex/mcp.json` configuration. The Figma MCP server itself is generic — same instance works with Claude Code.

## Cross-reference

- [`docs/USING.md`](USING.md) — multi-agent setup overview
- [`docs/FIGMA-INTEGRATION.md`](FIGMA-INTEGRATION.md) — Figma MCP details
- [`AGENTS.md`](../AGENTS.md) — universal agent instructions
- [`knowledge/PRINCIPLES.md`](../knowledge/PRINCIPLES.md) — agent priming
