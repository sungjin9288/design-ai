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
- deterministic agent development backlog actions
- workspace readiness

```bash
design-ai learn --signals --from-file . --json
design-ai learn --signals --from-file . --strict --json
design-ai learn --signals --from-file route-eval-report.json --usage-file learning.usage.json
```

This exposes drift without changing the learning profile, calling external AI APIs, adding dependencies, or storing raw brief text. Use `--strict` when the signal registry and agent development backlog should behave like a local deterministic gate.

### Phase 488: readiness check index

Added automation-friendly readiness indexes to `design-ai learn --signals` and `design-ai learn --agent-backlog` JSON:

- `requiredCheckIds`
- `optionalCheckIds`
- `checkStatusById`
- `checkRequiredById`

These fields keep the existing `checks` array intact while letting local runners branch on checks such as `check-capture` or `agent-development` without array scanning or prose parsing. The change remains deterministic, local, read-only, and dependency-free.

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

### Phase 425: skill proposal patch handoffs

Added `design-ai learn --propose-skills --patch` as a preview-only handoff mode:

```bash
design-ai learn --propose-skills --from-file . --patch
design-ai learn --propose-skills --from-file . --patch --out skill-proposals.patch
```

The patch output is a unified diff preview that appends proposal review notes to candidate `skills/*/SKILL.md` files for manual review. It still does not mutate `learning.json`, edit skill files, call external AI APIs, add embeddings/fine-tuning, or add dependencies.

### Phase 510: apply-plan sequence key index

Added `commandSequenceKeys` and `commandSequenceByKey` to `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` so local AI/agent wrappers can retrieve named follow-up commands without scanning the ordered `commandSequence` array.

The index preserves the same validated command items:

- `reviewCheckJson`
- `reviewCheckReport`
- `proposalPatchPreview`
- `strictGate`

Invalid command contracts stay fail-closed with an empty key list and empty key map. The key index is additive and keeps the same boundary as the ordered sequence: local output previews may write requested `--out` artifacts, but the apply plan still does not mutate `learning.json`, review files, skill files, external AI APIs, embeddings, or fine-tuning jobs.

### Phase 509: apply-plan sequence safety summary

Added `commandSequenceSummary` to `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` so local AI/agent wrappers can branch on the full follow-up handoff without reducing the full `commandSequence` array.

The summary reports:

- whether the sequence is executable or blocked
- total step count
- read-only vs local-output step counts
- local write/output artifact flags
- profile, review-file, and skill-file mutation flags
- external AI API and clean-workspace boundaries
- aggregate run policy

This keeps the apply-plan handoff deterministic and explicit: preview/report/patch artifacts may write local output files when requested with `--out`, but the sequence still does not mutate `learning.json`, review files, skill files, external AI APIs, embeddings, or fine-tuning jobs.

### Phase 275: Website Console MCP probes

Implemented `design-ai site --mcp-check --probes` and `design-ai site --mcp-plan --probes` as optional read-only probe overlays for the existing Website Console MCP readiness matrix:

- GitHub repo reference parseable through `github.com/<owner>/<repo>` or an existing local repo path
- Figma URL parseable for `design`, `file`, `board`, `slides`, or `make` handoff references
- Browser smoke target available from a valid live URL plus configured viewport set
- deployment provider reference configured with a valid live URL

The probes report as a separate `probes` JSON block so the default `--mcp-check` contract stays stable. They remain deterministic, local, and read-only: no external MCP calls, no writes to GitHub/Figma/deploy providers, no crawling, no Lighthouse/axe automation, and no new dependencies.

### Phase 276: workflow graph export

Implemented `design-ai site --graph [--json]` so website improvement workspaces and agent plans can be exported as portable graphs that are renderable later in the static console.

The graph includes deterministic nodes for:

- workspace intake
- site profile
- audit categories
- MCP readiness
- generated and retained refactor tasks
- prompt templates
- handoff report, local bundle, and target website repo boundary

Edges connect profile context, audit findings, MCP readiness, task execution, prompt generation, and handoff flow. The export remains deterministic, local, and read-only: no external MCP calls, no target-repo mutation, no workflow runtime dependency, no Lighthouse/axe/crawling, and no new dependencies.

### Phase 277: static workflow graph rendering

Implemented the static Website Console `Workflow Graph` tab so operators can inspect the workflow graph in the browser before exporting JSON or handing prompts to a target website repo.

The view renders:

- summary metrics for graph nodes, edges, tasks, and required MCPs
- lane-based node groups for intake, audit, MCP readiness, tasks, prompts, and handoff
- deterministic edge rows matching the portable graph contract
- boundary markers for local execution, no external MCP calls, no target-repo mutation, and no new dependencies
- copy/export actions for `website-workflow-graph.json`

This keeps the useful part of visual workflow builders in a dependency-free, local/read-only console. It does not add a workflow runtime, backend sync, crawling, Lighthouse/axe automation, or live MCP connection checks.

### Phase 278: handoff evidence tracking

Implemented browser-local Website Console evidence tracking for the handoff phase:

- executed target-repo work
- verification results from lint/typecheck/build, Browser QA, deployment checks, or manual QA
- remaining risks
- next actions

The Handoff Report tab stores those fields in the workspace JSON, shows compact evidence counts, and injects the evidence into copied/exported Markdown reports. This keeps the closed loop between generated prompts and final operator evidence without mutating the target repo, calling external MCPs, adding a backend, or adding dependencies.

### Phase 279: CLI handoff evidence export

Implemented `implementationEvidence` support in `design-ai site` so browser-captured evidence survives the file-first CLI workflow:

- `--json` reports evidence counts
- `--tasks` preserves the evidence block
- `--report` renders executed work, verification results, remaining risks, and next actions
- `--bundle` stores evidence in `website-workspace.tasks.json`, `website-handoff.md`, and `summary.json`

The CLI validates malformed evidence array shapes, but it does not verify target-repo claims automatically. Evidence remains operator-entered, deterministic, local, and dependency-free.

### Phase 280: evidence package smoke expansion

Expanded packed-tarball smoke coverage for Website Console evidence preservation:

- installed-bin `design-ai site --stdin --report` preserves non-empty handoff evidence in Markdown
- installed-bin `design-ai site --stdin --tasks` preserves the `implementationEvidence` JSON block
- installed-bin `design-ai site --stdin --bundle --out <dir>` preserves evidence in `summary.json`, `website-workspace.tasks.json`, and `website-handoff.md`
- one-shot `npm exec --package <tarball>` covers the same report, tasks, and bundle paths
- `package-smoke.py --self-test` now includes evidence payload and Markdown drift fixtures

This turns the Website Console evidence loop into a release-smoked distribution contract without adding dependencies, calling external MCPs, mutating target repos, or claiming that target-repo evidence is automatically verified.

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
