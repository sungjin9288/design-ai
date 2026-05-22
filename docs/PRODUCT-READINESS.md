# Product readiness

Current status: **core design consulting product is locally release-ready; local learning preferences are shipped; model training is not part of the shipped product.**

This document separates shipped product scope from future product ideas so the roadmap does not imply that every possible AI feature is already complete.

## TL;DR

| Area | Status | Evidence | Remaining work |
|---|---|---|---|
| Design consulting skills | Complete for v4.13 | 19 skills across design systems, UX audit, critique, handoff, motion, illustration, print, video, game UI, conversational UI, and spatial design | Keep knowledge fresh through normal stability review |
| Design agent workflows | Complete for v4.13 | 16 commands, 4 review agents, route/prompt/pack/check/search/show/examples CLI workflows | Real-CI verification before external launch |
| Local release confidence | Complete for v4.13 | `npm run release:check` covers tests, audits, package contents, metadata, self-tests, and packed-tarball smoke including learning audit cleanup guidance | Public registry smoke after publish |
| AI chat / conversational design consulting | Complete for v4.13 | `conversational-ui-designer`, `/conversational`, and conversational knowledge cover voice, chatbot, and AI chat UX | Keep Korean platform conventions current |
| Local AI learning preferences | Complete for v4.13 | `design-ai learn`, filtered `prompt --with-learning` / `pack --with-learning`, confirmed `learn --forget`/`--clear`, non-mutating `learn --audit` cleanup suggestions / `learn --stats`, and learned-context audit summaries provide explicit local preference memory | Keep privacy boundaries clear as learning scope expands |
| AI model training | Not shipped scope | README states fine-tuning is outside shipped scope | Define a separate product phase if embeddings or fine-tuning becomes a goal |
| External launch | Not complete | Launch kit exists, but roadmap still marks external launch as held | Push, observe Real-CI, then publish/announce |

## What is complete

The shipped product is a model-agnostic design intelligence layer for AI coding agents. It is complete when an agent can:

- Route a design request to the right workflow.
- Load the relevant design knowledge and examples.
- Produce design-system, component, UX, motion, illustration, print, video, game UI, conversational, spatial, document, and slide-deck artifacts.
- Check those artifacts for grounding, accessibility, responsive coverage, route-specific quality, and unresolved markers.
- Store, filter, audit with cleanup suggestions, summarize, export, forget, and clear explicit local learning preferences, and inject scoped category/limit subsets into prompts/packs only when requested with audit-summary metadata attached.
- Install, update, status-check, and uninstall through the packaged CLI.
- Pass the release gate without relying on manual inspection.

As of v4.13, these are covered by the manifest, commands, skills, agents, examples, and release smoke suite, including packed-tarball checks for learning audit cleanup suggestions.

Local learning preferences are documented in [`AI-LEARNING.md`](AI-LEARNING.md).

## What is not complete

The product now includes local learning preferences, but it should not be described as having completed AI model learning unless that scope is explicitly added later.

Not shipped:

- Fine-tuning a model.
- Training a private model on user artifacts.
- Embedding index generation for semantic retrieval.
- Feedback loops that learn from accepted/rejected design recommendations.

These are valid future product ideas, but they are different from the current architecture. The current architecture is deterministic corpus routing, prompt packing, quality checking, scoped local preference injection, and release-smoked CLI distribution.

## Current release blockers

Only launch-readiness items remain in the active roadmap:

- Real-CI verification: push the branch and observe GitHub Actions green.
- External launch: publish/announce after CI and registry smoke are proven.
- Reference-link policy: decide whether `refs/` source links remain visible or move behind generated reference pages.

## Recommended next decision

The next product decision is scope, not another hardening pass:

1. If the goal is to ship the current design consulting tool, run the push/Real-CI/public launch path.
2. If the goal is a deeper AI learning product, open a new phase for retrieval memory, feedback learning, or fine-tuning, with explicit data boundaries and privacy constraints.
3. If the goal is “best design tool” as a broader product, define whether the next surface is CLI, VS Code, web UI, Figma plugin, or agent SDK.
