# AI learning phase 2: local retrieval memory

This document opens the deeper AI-learning phase selected in [PRODUCT-READINESS.md](PRODUCT-READINESS.md) ("Recommended next decision", option 2). It defines the scope, data boundaries, and phased plan for local retrieval memory on top of the shipped learning system described in [AI-LEARNING.md](AI-LEARNING.md).

Status: **Phase A implemented and release-gated** (see the Phase 754 checklist in [ROADMAP.md](ROADMAP.md)); **Phase B remains planning**. Everything Phase A shipped is local, derived, opt-in retrieval — the shipped learning scope otherwise remains what [AI-LEARNING.md](AI-LEARNING.md) documents, and the README stance is unchanged.

## Goal

Improve how design-ai selects context — corpus files for `search` and `route`, learning entries for `prompt --with-learning` and `pack --with-learning` — by adding a deterministic local retrieval layer, and optionally a local-only embedding backend, without changing the product's honesty stance: design-ai is not a model and does not train one.

Concretely:

- Replace first-substring-match corpus search with ranked lexical retrieval (tokenized TF-IDF/BM25-style scoring) that stays zero-dependency and reproducible.
- Upgrade learning-entry selection from token-containment scoring (`cli/lib/learn-select.mjs`) to the same shared lexical scorer, so prompt/pack learning injection and corpus search rank with one auditable algorithm.
- Allow an explicitly opt-in, user-supplied local embedding backend for reranking, degrading gracefully to the lexical path when absent.

## Non-goals

These stay out of scope for this phase and must not be introduced by its implementation:

- Model fine-tuning, in any form.
- Training a private model on user artifacts.
- External embedding APIs, or any network call made by retrieval code paths.
- Background learning or background indexing without an explicit CLI command.
- Telemetry of any kind.

This preserves the standing repo constraint ("Do not add external AI APIs, embeddings, telemetry, or fine-tuning behavior without explicit approval") — the maintainer approval that opens this phase covers local-only, opt-in mechanisms only.

## Data boundaries and privacy constraints

### What may be indexed

1. **The shipped knowledge corpus**: `knowledge/`, `examples/`, `skills/`, `docs/`, `agents/`, `commands/` — the same directory set `design-ai search` already reads (`DEFAULT_SEARCH_DIRS` in `cli/lib/search.mjs`).
2. **The user's local learning profile**: entries in `learning.json` (or the `DESIGN_AI_LEARNING_FILE` override), which the user already stores explicitly through `learn --remember`, `learn --feedback`, and `check --learn --yes`.

Nothing else. Briefs, prompt text, artifacts under review, target-repo contents, and usage sidecar events are not index inputs.

### What may never leave the machine

- Index files, embedding vectors, and every retrieval artifact are local files. They are never synced, uploaded, or sent to any provider, matching the existing `learning.json` / `learning.usage.json` boundary in [AI-LEARNING.md](AI-LEARNING.md).
- Retrieval code paths make no HTTP requests. Phase B providers are local executables chosen by the user; design-ai never selects or downloads one.
- Query privacy follows the usage-sidecar convention: any retrieval logging stores selected ids and short brief hashes, never raw brief or query text.

### How redaction composes

- Index artifacts are **derived and rebuildable**. They are not part of the profile, so `learn --backup`, `learn --redact`, `learn --restore`, and `learn --import` do not include them, and their contracts do not change.
- Because the learning index is derived from `learning.json`, redacting or curating the profile and rebuilding the index removes the corresponding text from retrieval. The index build records a content digest of its source profile; a mismatch marks the index stale so post-redaction state cannot keep serving pre-redaction text silently.
- `learn --audit` warnings propagate: an index built from a profile with audit warnings carries the same audit summary metadata that `learn --export` and `--with-learning` already attach.
- Restore and rollback (`learn --restore`, `--restore-backups`) invalidate the learning index by digest mismatch; the CLI reports the stale index and the rebuild command instead of rebuilding implicitly.

## Phased plan

### Phase A — deterministic local retrieval memory

A zero-dependency lexical index over the knowledge corpus and local learning entries. No new runtime dependencies; plain Node.js like the rest of `cli/`.

Scoring: shared tokenizer (the Unicode letter/number tokenizer already used by `learn-select.mjs`), document frequency statistics, and a BM25-style score with fixed constants. All math is integer/float-deterministic on the same inputs; no randomness, no time-dependent scoring.

Consumers:

- `design-ai search --ranked`: ranked results across the corpus instead of first-substring-match per file. The default `search` behavior is unchanged until the ranked mode has eval coverage.
- `design-ai route`: unchanged routing table; the index may power an advisory "related knowledge" section in `--explain` output only. Route ids stay keyword-table-driven and deterministic.
- `prompt --with-learning` / `pack --with-learning`: learning-entry selection moves to the shared scorer behind the existing selection-metadata contract (`selection.selected[]` with `id`, `score`, `matchedTokens`, `reason`). Recency fallback and category/limit scoping keep their current semantics.

CLI surface sketch:

```bash
design-ai index --build            # build/refresh corpus + learning index (explicit, never background)
design-ai index --status --json    # paths, digests, staleness, entry/doc counts
design-ai index --verify           # rebuild in memory and compare digests; read-only
design-ai search "query" --ranked  # BM25-style ranked corpus search
design-ai prompt "brief" --with-learning   # same flag; shared scorer underneath
```

Storage format sketch (sidecar JSON, following `learning.json` conventions — versioned, sorted keys, stable ids):

```json
{
  "version": 2,
  "kind": "retrieval-index",
  "generatedAt": "2026-07-03T00:00:00.000Z",
  "source": {
    "designAiPath": "/absolute/path/to/this/checkout",
    "corpusDirs": ["knowledge", "examples", "skills", "docs", "agents", "commands"],
    "corpusDigest": "sha256:...",
    "learningFile": "~/.design-ai/learning.json",
    "learningDigest": "sha256:..."
  },
  "stats": { "documentCount": 0, "termCount": 0, "avgDocLength": 0 },
  "documents": [{ "id": "knowledge/a11y/contrast.md", "length": 0, "terms": {} }]
}
```

Default locations: `~/.design-ai/index/corpus-index.json` and `~/.design-ai/index/learning-index.json`, with `DESIGN_AI_INDEX_DIR` as the override. Index files are cache artifacts: never committed, never packaged, safe to delete.

Determinism and reproducibility: the same corpus bytes and profile bytes produce a byte-identical index apart from `generatedAt`, which is excluded from the digest. `index --verify` proves this by rebuilding and comparing. Ranked results are fully ordered (score, then stable path/id tiebreak), so `search --ranked` output is reproducible across runs and machines with the same inputs.

Verification gates:

- `node --test` unit coverage for tokenizer, scoring, tie-breaking, digest staleness, and `--build/--status/--verify` flows (`npm test`).
- `npm run audit` stays 8/8 — docs links, frontmatter, and integration checks must pass with the new surfaces documented.
- `npm run release:check` additions: packed-tarball smoke for `index --build` + `index --verify` round-trip and for `search --ranked` determinism (two runs, identical output); `learn --eval --strict` checkpoints re-run against the shared scorer to catch selection regressions.
- `npm run release:metadata` stays green; README scope language ("Not a model. Not a fine-tune."; training/fine-tuning outside shipped scope) is unchanged by this phase.

Rollback/compat: default `search`, `route`, `prompt`, and `pack` behavior is preserved until eval evidence supports switching defaults; `--ranked` is additive. If the learning-selection scorer changes selection output for existing profiles, the change ships behind updated `learn --eval-template` checkpoints and is called out in [ROADMAP.md](ROADMAP.md). Deleting the index directory restores pre-index behavior with zero data loss, because every index artifact is derived.

### Phase B — optional local embedding backend

An opt-in reranking layer on top of Phase A. Never a default, never external HTTP.

- Pluggable local provider: the user supplies a local executable (for example an ONNX or llama.cpp embedding runner) via explicit configuration. design-ai shells out to it with document/query text on stdin and reads vectors from stdout. design-ai ships no model weights and adds no dependency.
- Explicit opt-in per profile/config **and** per invocation; no flag, no embeddings. Absent, failing, or misbehaving providers degrade gracefully and visibly to the Phase A lexical path — output metadata reports which backend actually ranked the results.

CLI surface sketch:

```bash
design-ai index --build --embeddings --provider ./bin/local-embed   # explicit provider, explicit build
design-ai search "query" --ranked --embeddings                       # rerank lexical candidates; lexical fallback if unavailable
design-ai index --status --json                                      # reports embedding backend presence, digests, staleness
```

Storage format sketch (sidecar next to the Phase A index):

```json
{
  "version": 1,
  "kind": "embedding-index",
  "provider": { "command": "./bin/local-embed", "modelLabel": "user-supplied", "dimensions": 384 },
  "source": { "corpusDigest": "sha256:...", "learningDigest": "sha256:..." },
  "vectors": [{ "id": "knowledge/a11y/contrast.md", "v": [0.0] }]
}
```

Determinism and reproducibility: design-ai's side is deterministic — candidate generation (Phase A), provider invocation order, cosine similarity, and tie-breaking are all fixed. Vector values depend on the user's provider; the index therefore records the provider command and source digests so results are reproducible for a given provider, and `index --status` surfaces any digest drift. Eval checkpoints for embedding-assisted selection are only valid against the same recorded provider.

Verification gates:

- `npm test` coverage using a deterministic stub provider (fixed fake vectors) for build, rerank, fallback, and provider-failure paths; no real model in CI.
- `npm run audit` 8/8 with Phase B surfaces documented; `npm run release:metadata` green.
- `npm run release:check` additions: packed-tarball smoke proving (1) embeddings are off by default, (2) a missing provider degrades to Phase A with a clear notice and exit code 0, (3) no network access is attempted (provider invocation is a local process spawn only).

Rollback/compat: removing the provider configuration or deleting the embedding sidecar reverts to Phase A everywhere. Phase A never depends on Phase B artifacts. Lexical index format changes required by Phase B bump the sidecar `version` field with a documented migration note.

## Integration points with existing surfaces

- **learn**: `learn --eval` / `--eval-template` remain the regression gate for selection behavior; checkpoints gain an optional `ranker` field (`lexical` default) so Phase A/B changes are eval-visible. `learn --curate`, `--redact`, `--restore` interact with the index only through digest staleness, as described above.
- **signals**: `learn --signals --report` adds a retrieval-readiness section (index presence, staleness, backend) next to the existing usage/eval signal files, keeping the same read-only and privacy rules.
- **workspace**: `design-ai workspace` reports index staleness the same way it reports usage-sidecar and eval-checkpoint freshness — a warning plus a shell-quoted `design-ai index --build` next action; `--strict` treats a stale index as a readiness warning only when retrieval features are in use.
- **eval**: route eval (`route --eval`) and learning eval stay the deterministic QA harness; new ranked surfaces do not ship as defaults before checkpoints cover them.
- **MCP server tools**: `design_ai_search` gains the same opt-in ranked mode as the CLI; `design_ai_prompt` / `design_ai_pack` inherit the shared scorer transparently. A read-only `design_ai_index_status` tool may expose `index --status`. MCP tools never trigger index builds implicitly; building stays an explicit operator action, consistent with the current read-only-by-default MCP posture in [MCP-INTEGRATION.md](MCP-INTEGRATION.md).

## Risks and open questions

Risks:

- **Scope creep toward "AI product" claims.** Mitigation: README status language is a release gate; this document and [PRODUCT-READINESS.md](PRODUCT-READINESS.md) keep retrieval memory listed as planning until shipped.
- **Selection-behavior drift** for existing users when the shared scorer replaces containment scoring. Mitigation: eval checkpoints before/after, selection metadata unchanged in shape, roadmap callout.
- **Stale-index confusion** if users edit the profile and see old retrieval behavior. Mitigation: digest staleness is checked on every consumer read and reported, never silently ignored.
- **Phase B provider quality and safety** are outside design-ai's control. Mitigation: provider results are rerank-only over lexical candidates, provenance is recorded, and the lexical path remains the contract.

Open questions:

1. Should `search --ranked` become the default once eval evidence exists, or stay opt-in permanently to preserve byte-stable output for existing scripts? — answered in the [Phase A implementation review](#phase-a-implementation-review-2026-07-03).
2. Does the corpus index live per-checkout (keyed by corpus digest) or per-machine? Per-checkout is safer for multiple clones; per-machine is simpler. — answered in the [Phase A implementation review](#phase-a-implementation-review-2026-07-03).
3. Should `route` ever consume the index for routing decisions, or is advisory `--explain` enrichment the permanent boundary? — answered in the [Phase A implementation review](#phase-a-implementation-review-2026-07-03).
4. Minimum useful BM25 constants and tokenizer treatment for Korean text — does the current Unicode tokenizer rank Korean briefs well enough, or does Phase A need explicit bigram handling for Hangul? — answered in the [Phase A implementation review](#phase-a-implementation-review-2026-07-03).
5. Phase B configuration home: a new `~/.design-ai/config.json`, or flags-only to keep zero persistent configuration? — answered in the [Phase A implementation review](#phase-a-implementation-review-2026-07-03).

These questions should be answered during Phase A implementation review before Phase B is scheduled.

## Phase A implementation review (2026-07-03)

This review answers the five open questions against the shipped Phase A implementation (`cli/lib/lexical.mjs`, `cli/lib/retrieval-index.mjs`, `cli/lib/search-ranked.mjs`, `cli/lib/learn-select.mjs`) with all Phase 754 Phase A checklist items landed in [ROADMAP.md](ROADMAP.md).

### Decisions

1. **`search --ranked` stays opt-in; it does not become the default.** The default `search` emits byte-stable first-substring-match output that existing scripts and the packed-tarball determinism smoke depend on, and ranked output is a different contract (scores, ordering, previews). The right long-term move is not flipping the default but adding a ranked-mode eval checkpoint so ranked quality is measured; until such a checkpoint exists there is no evidence basis to switch, and even with it the safer path is a documented opt-in plus a possible future `--ranked` alias rather than silently changing default output. Decision: **opt-in permanently**, with promotion to default deferred behind a concrete trigger (a landed ranked-search eval checkpoint showing ranked ≥ substring on the QA set) — and even then only via an announced major-version default change, never a silent one.

2. **Corpus index stays per-machine, but must be keyed by corpus digest within the shared directory.** Today `buildCorpusIndex` writes a single `corpus-index.json` under `~/.design-ai/index/`, so two checkouts with different corpora overwrite each other's index. This is currently harmless because `search --ranked` live-scans the corpus and uses the index file only for a staleness notice (`corpusIndexNotice`) — a wrong-checkout index produces a "stale" notice, never wrong results. It becomes load-bearing the moment Phase B reads vectors from the sidecar instead of live-scanning. Decision: **keep per-machine storage** (simpler, matches the `learning.json` boundary) but add a follow-up to namespace the index file by corpus digest (or record the `designAiPath` in the payload and treat a path/digest mismatch as "not my index") before Phase B consumes the index as a source of truth.

3. **`route` keeps the advisory boundary; the index never drives routing decisions.** Verified in the shipped build: `route --explain` scores against its own deterministic keyword table (observed `matched: 접근성, 개선` with integer scores and `why:` keyword lists), fully independent of the BM25 index, and no "related knowledge" section is wired in yet. Route ids must stay keyword-table-driven and reproducible so routing is auditable and stable across machines regardless of index presence. Decision: **advisory `--explain` enrichment is the permanent boundary** — the index may later populate an advisory "related knowledge" block in `--explain` output only, and must never change which route ids are selected or their order.

4. **The current Unicode tokenizer is NOT adequate for Korean briefs; Phase A needs Hangul handling, tracked as a follow-up rather than a Phase B blocker.** Empirical finding: the tokenizer treats each whitespace-delimited Hangul surface form as one atomic token with no stemming, so agglutinative (particle-attached) forms only match documents containing that exact form. Observed via `search "<q>" --ranked --json`:
   - `버튼을` → 2 hits (matches only literal `버튼을`); bare stem `버튼` → **0 hits**, `버튼이` → **0 hits**. Corpus grep confirms `버튼` appears *only* as `버튼을`/`버튼은`, never bare — so the stem query silently misses every button doc.
   - `접근성이` → **0 hits**, but bare `접근성` → 12 hits (corpus has `접근성` bare 17×).
   - `결제하기` → 2 hits (exact form only); `저장하기` → 3 hits vs `저장` → 20 hits; `삭제` → 13 hits.
   The match/miss outcome is pure coincidence of which surface form happens to occur in the corpus, not linguistic relevance — the same query concept scores 0 or high depending on an accidental particle. English is unaffected because its tokenizer already splits on the space between word and particle. This is a real Korean-brief retrieval gap given the product's Korean-market focus ([NEXT-SURFACE-DECISION.md](NEXT-SURFACE-DECISION.md)). Mitigation is a Phase A follow-up (Hangul-aware handling: character bigrams for CJK runs, or a small particle-stripping pass), gated by new Korean eval checkpoints so the tokenizer change is eval-visible. BM25 constants (`k1=1.2`, `b=0.75`) are standard and fine; the gap is tokenization, not scoring.

5. **Phase B configuration home: introduce `~/.design-ai/config.json`, not flags-only.** A local embedding provider is a durable per-machine setting (a provider command path plus opt-in state) that a user should set once, not re-pass on every invocation; flags-only would force the provider path into every `search`/`index` call and into MCP tool wiring, which is fragile and undiscoverable. `config.json` also composes with the existing `~/.design-ai/` sidecar convention and stays local-only. Decision: **add `~/.design-ai/config.json`** (versioned, sorted keys, local-only, honoring `DESIGN_AI_INDEX_DIR`-style overrides), still requiring the per-invocation `--embeddings` opt-in from the design so config presence alone never silently enables reranking — config supplies the provider, the flag arms it.

### Follow-up work items

- **FU-1 (Q4, before Phase B):** Add Hangul-aware tokenization (CJK bigramming or particle stripping) in `cli/lib/lexical.mjs` behind Korean `learn --eval` checkpoints; regression-test that `버튼`, `버튼을`, `버튼이` converge on the same button docs. _Done (2026-07-03): Hangul runs >= 2 chars now emit overlapping character bigrams alongside the surface form; the review's zero-hit queries recover (`버튼` 0 → 3 ranked hits, `접근성이` 0 → 3), with unit regression coverage in `lexical.test.mjs`._
- **FU-2 (Q2, before Phase B index-as-source-of-truth):** Key the corpus index by corpus digest / record `designAiPath` in the payload so multiple checkouts do not overwrite each other once the index is read for content rather than staleness. _Done (2026-07-03): sidecar format bumped to version 2 (auto-invalidating v1 files); the corpus payload records resolved `designAiPath` and the learning payload the resolved `learningFile`, and `index --status` reports `sourceMatch` and treats identity mismatch as not fresh._
- **FU-3 (Q1, gates default promotion):** Land a ranked-search eval checkpoint so any future `--ranked` default promotion is evidence-backed and announced.
- **FU-4 (Q5, Phase B):** Specify and implement `~/.design-ai/config.json` as the Phase B provider config home with per-invocation `--embeddings` still required.

### Phase B gate: cleared-with-conditions

Phase B may be scheduled. Conditions that must be met before or during Phase B:

- **FU-2 is a hard precondition** if Phase B reads the corpus/embedding sidecar as a source of truth rather than live-scanning: the per-machine single-file index must be digest/path-keyed first, or multiple checkouts will serve each other's vectors.
- **FU-1 should land in Phase A** (or explicitly early in Phase B) so embedding rerank is not layered on top of a Korean lexical candidate set that already silently drops particle-attached queries — otherwise Phase B inherits and masks the tokenization gap.
- **FU-4 (`config.json`)** is the accepted Phase B configuration home and must keep the per-invocation opt-in.
- Non-goals and Data boundaries above are unchanged; Phase B remains local-only, opt-in, no external HTTP, graceful degradation to the Phase A lexical path.
