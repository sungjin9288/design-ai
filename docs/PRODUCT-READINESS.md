# Product readiness

Current status: **core design consulting product is locally release-ready; local learning preferences, starter learning bootstrap, explicit check feedback capture, and internal dogfood readiness snapshots are shipped; model training is not part of the shipped product.**

This document separates shipped product scope from future product ideas so the roadmap does not imply that every possible AI feature is already complete.

## TL;DR

| Area | Status | Evidence | Remaining work |
|---|---|---|---|
| Design consulting skills | Complete for v4.13 | 19 skills across design systems, UX audit, critique, handoff, motion, illustration, print, video, game UI, conversational UI, and spatial design | Keep knowledge fresh through normal stability review |
| Design agent workflows | Complete for v4.13 | 16 commands, 4 review agents, route/prompt/pack/check/search/show/examples CLI workflows | Real-CI verification before external launch |
| Local release confidence | Complete for v4.13 | `npm run release:check` covers tests, audits, package contents, metadata, self-tests, and packed-tarball smoke including workspace strict failure/success readiness checks, check learning capture, learning feedback, backup, redaction, learn JSON `--out` file writes, verify, import, query-filtered learn list explanation/export, brief-relevant prompt/pack learning selection, and audit cleanup guidance | Public registry smoke after publish |
| Internal dogfood readiness | Complete for v4.13 | `design-ai workspace` reports read-only git cleanliness/sync, canonical repository remote/metadata alignment, local learning profile audit state, release-script availability, and next-action hints before solo/internal distribution work; `--strict` exits non-zero on readiness warnings/failures; package smoke verifies strict JSON failure and clean-success behavior in installed-bin and one-shot paths, and registry smoke verifies the same contract after publish | Use findings to decide whether the next surface should be CLI, web UI, VS Code, Figma, or SDK |
| AI chat / conversational design consulting | Complete for v4.13 | `conversational-ui-designer`, `/conversational`, and conversational knowledge cover voice, chatbot, and AI chat UX | Keep Korean platform conventions current |
| Local AI learning preferences | Complete for v4.13 | `design-ai learn`, preview-first `learn --init` starter profile bootstrap, explicit `learn --feedback` keep/improve/avoid guidance, explicit `check --learn --yes` capture for local QA warning/failure results, full `learn --backup --json` export, redacted `learn --redact --json` sharing export from local profile / `--from-file` / `--stdin`, safe `--out` file output with `--force` overwrite control for JSON artifacts and export Markdown, non-mutating `learn --verify`, confirmed `learn --import`, query-filtered `learn --list --explain` / `learn --export` without recency fallback, brief-relevant filtered `prompt --with-learning` / `pack --with-learning` with selection scoring metadata, confirmed `learn --forget`/`--clear`, non-mutating `learn --audit` cleanup suggestions / `learn --stats`, safe `learn --audit --fix --dry-run` previews plus confirmed `--fix --yes` cleanup, and learned-context audit summaries provide explicit local preference memory | Keep privacy boundaries clear as learning scope expands |
| AI model training | Not shipped scope | README states fine-tuning is outside shipped scope | Define a separate product phase if embeddings or fine-tuning becomes a goal |
| External launch | Not complete | Launch kit exists, but roadmap still marks external launch as held | Push, observe Real-CI, then publish/announce |

## What is complete

The shipped product is a model-agnostic design intelligence layer for AI coding agents. It is complete when an agent can:

- Route a design request to the right workflow.
- Load the relevant design knowledge and examples.
- Produce design-system, component, UX, motion, illustration, print, video, game UI, conversational, spatial, document, and slide-deck artifacts.
- Check those artifacts for grounding, accessibility, responsive coverage, route-specific quality, and unresolved markers, with optional `check --learn` preview/application for non-pass QA feedback.
- Inspect the current local dogfood workspace with a read-only `design-ai workspace` snapshot, or `design-ai workspace --strict` when warnings should block handoff, before deciding whether to continue development, run verification, capture learning feedback, commit, or push.
- Store, initialize starter dogfood preferences through preview-first `learn --init`, record explicit keep/improve/avoid feedback, capture local check warning/failure feedback after `--yes`, query-filter with optional list explanations, audit with cleanup suggestions, preview/apply safe audit cleanup, summarize, export, write JSON/export artifacts through safe `--out` file output, create redacted shareable backups from local profiles or portable JSON sources, verify/import portable profiles, forget, and clear explicit local learning preferences, and inject brief-relevant scoped category/limit subsets into prompts/packs only when requested with selection scoring and audit-summary metadata attached.
- Install, update, status-check, and uninstall through the packaged CLI.
- Pass the release gate without relying on manual inspection.

As of v4.13, these are covered by the manifest, commands, skills, agents, examples, and release smoke suite, including packed-tarball checks for workspace strict failure/success readiness behavior, public registry checks for the same workspace strict contract after publish, check learning capture, learning feedback, backup, redaction, learn JSON `--out` file-write confirmation and forced overwrite coverage, verify, import, query-filtered learn list explanation/export, brief-relevant prompt/pack learning selection, and learning audit cleanup suggestions. Public registry smoke also verifies learning feedback/init bootstrap, portable learning backup `--out` output-file persistence, portable learning import/redact behavior, query-filtered learn list/export behavior, brief-relevant prompt/pack learning selection, and learning audit cleanup suggestions plus safe cleanup dry-run/apply behavior after publish.

Local learning preferences are documented in [`AI-LEARNING.md`](AI-LEARNING.md).

## What is not complete

The product now includes local learning preferences, but it should not be described as having completed AI model learning unless that scope is explicitly added later.

Not shipped:

- Fine-tuning a model.
- Training a private model on user artifacts.
- Embedding index generation for semantic retrieval.
- Background feedback loops that learn from accepted/rejected design recommendations without an explicit CLI command.

These are valid future product ideas, but they are different from the current architecture. The current architecture is deterministic corpus routing, prompt packing, quality checking, scoped local preference injection, and release-smoked CLI distribution.

## Current release blockers

Only launch-readiness items remain in the active roadmap:

- Real-CI verification: push the branch and observe GitHub Actions green.
- External launch: publish/announce after CI and registry smoke are proven.
- Reference-link policy: decide whether `refs/` source links remain visible or move behind generated reference pages.

## Recommended next decision

The next product decision is scope, not another hardening pass:

1. If the goal is to ship the current design consulting tool, run the push/Real-CI/public launch path.
2. If the goal is a deeper AI learning product, open a new phase for retrieval memory, embeddings, or fine-tuning, with explicit data boundaries and privacy constraints.
3. If the goal is “best design tool” as a broader product, define whether the next surface is CLI, VS Code, web UI, Figma plugin, or agent SDK.
