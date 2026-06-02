# Agent development plan

This document tracks how design-ai should evolve its local AI learning and agent workflow surface after reviewing adjacent open-source agent projects. It is a product and engineering plan, not a mandate to copy code from those repositories.

## Reference baseline

| Reference | Useful pattern | design-ai decision |
|---|---|---|
| [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) | Closed learning loop, skills from experience, session search, scheduled automations, subagent delegation | Adopt the pattern as local deterministic learning, route evals, skill proposals, and explicit operator approval. Do not add autonomous background collection yet. |
| [harness/harness](https://github.com/harness/harness) | Pipeline, conformance tests, release evidence, local service readiness | Adopt evidence-first release gates and conformance-style CLI smoke checks. Do not build a DevOps platform in this repo. |
| [strands-agents/sdk-python](https://github.com/strands-agents/sdk-python) | Model/tool abstraction, MCP-native agent composition, lightweight SDK shape | Keep design-ai model-agnostic and add tool readiness metadata before adding provider adapters. |
| [obra/superpowers](https://github.com/obra/superpowers) | Skill-triggered workflow, planning before coding, test-first checkpoints | Adopt mandatory workflow checkpoints in skills and route evals. Keep user approval for destructive or external actions. |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | Cross-harness packaging, memory persistence, eval/checkpoint framing, security guardrails | Adopt cross-harness compatibility and eval checkpoint language. Avoid hidden hooks that mutate state without explicit CLI commands. |
| [anomalyco/opencode](https://github.com/anomalyco/opencode) | Separate plan/build agents and terminal-first agent UX | Add route/eval support for plan vs implementation prompts; no full coding agent runtime in design-ai. |
| [langflow-ai/langflow](https://github.com/langflow-ai/langflow) and [langgenius/dify](https://github.com/langgenius/dify) | Visual workflow builders, API/MCP deployment, observability | Future Website Console can export workflow JSON and reports. MVP stays static/local. |
| [anthropics/skills](https://github.com/anthropics/skills) | Self-contained `SKILL.md` folders with metadata, scripts, and resources | Keep skills self-contained and add validation for route/skill coverage. |
| [langchain-ai/langchain](https://github.com/langchain-ai/langchain) | Agent engineering layers, integrations, observability/evals | Adopt eval/observability concepts only; no dependency on LangChain. |
| [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) | Terminal-first CLI, MCP support, checkpointing, GitHub action workflows | Add CLI checkpoint reports and future CI smoke targets. |
| [TauricResearch/TradingAgents](https://github.com/TauricResearch/TradingAgents) | Role-specialized multi-agent debate and risk review | Use role debate as a prompt template for design decisions, not as financial-domain logic. |
| [farion1231/cc-switch](https://github.com/farion1231/cc-switch) | Cross-tool provider, MCP, and skill management | Future UI can manage provider/readiness metadata. Avoid API relay or provider switching inside this repo. |
| [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | Runnable app examples and RAG/agent catalog | Use as inspiration for examples only. |
| [x1xhlol/system-prompts-and-models-of-ai-tools](https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools) | Prompt surface comparison | Do not copy prompts or code. Treat as a red-team/input hygiene reference because licensing and provenance are risky. |

## Architecture stance

design-ai should remain a local, deterministic control layer:

- It routes tasks to skills, commands, agents, examples, and checked knowledge files.
- It stores explicit local learning entries and usage metadata.
- It validates artifacts and captures warn/fail feedback only when requested.
- It produces prompts, packs, site handoff reports, and release evidence.
- It should not become a hosted model runtime, external telemetry system, or hidden background trainer.

## Phase plan

### Phase 271: route eval harness

Add `design-ai route --eval-template` and `design-ai route --eval` so route selection can be checked with deterministic fixtures. This protects agent routing before deeper learning features rely on it.

Example:

```bash
design-ai route --eval-template --json > route-eval.json
design-ai route --eval --from-file route-eval.json --strict --json
```

### Phase 272: prompt/pack eval harness

Extend the eval pattern from route selection to prompt plans and context bundles:

- expected route id
- required files to read
- required checklist items
- required prompt fragments
- optional learning context expectations
- strict failure on missing playbook files, missing checklist items, route drift, or context bundle drift

Examples:

```bash
design-ai prompt --eval-template --json > prompt-eval.json
design-ai prompt --eval --from-file prompt-eval.json --strict --json

design-ai pack --eval-template --json > pack-eval.json
design-ai pack --eval --from-file pack-eval.json --strict --json
```

Prompt evals report the generated prompt plan. Pack evals report a context snapshot with file metadata, context status, and markdown byte counts without dumping full context file bodies into eval JSON.

### Phase 273: learning signal registry

Implemented `design-ai learn --signals` as a read-only registry report that joins:

- learning profile audit
- usage sidecar
- route/prompt/pack/learning eval signal files
- check learning capture entries
- workspace readiness

```bash
design-ai learn --signals --from-file . --json
design-ai learn --signals --from-file route-eval-report.json --usage-file learning.usage.json
```

This exposes drift without changing the learning profile, calling external AI APIs, adding dependencies, or storing raw brief text.

### Phase 274: skill evolution proposals

Implemented `design-ai learn --propose-skills` as a preview-only command that converts repeated learning/check issues into proposed skill edits:

- candidate skill
- evidence sources
- proposed instruction delta
- verification command
- risk level

```bash
design-ai learn --propose-skills --from-file . --json
design-ai learn --propose-skills --from-file route-eval-report.json --usage-file learning.usage.json
```

The command groups repeated `source: check:*` learning entries by candidate skill and category. It reports single-entry groups as skipped, rejects `--yes`, and does not change `learning.json`, edit `skills/*/SKILL.md`, call external AI APIs, or add dependencies. No skill file should be changed unless the operator runs an explicit apply command in a later phase.

### Phase 275: Website Console MCP probes

Extend the existing MCP readiness matrix from declared status to optional live probes:

- GitHub repo reachable
- Figma URL parseable
- browser smoke available
- deployment provider configured

This remains read-only and should not write to external systems.

### Phase 276: workflow graph export

Export website improvement workspaces and agent plans as portable JSON graphs that can be rendered later in the static console. This borrows the useful part of visual workflow tools without adding a heavy runtime dependency.

## Current MVP boundary

In scope:

- deterministic route, prompt, learning, and site evals
- local JSON state
- explicit preview/apply boundaries
- release smoke coverage
- skill and command documentation

Out of scope:

- embeddings
- fine-tuning
- autonomous background learning
- external telemetry
- hosted sync
- provider/API relay management
- copying third-party system prompts

## Verification checklist

For every agent/AI phase:

- `node --test` for touched CLI modules
- `design-ai <command> --help` for public CLI surface
- JSON round-trip check for every machine-readable report
- strict-mode failure fixture for every eval
- `git diff --check`
- release metadata update only when the public smoke surface changes
