# P17 skill and core hardening plan

## Decision

Strengthen Design AI as a design-quality layer before adding another public CLI,
SDK, MCP, or Website Console surface. The first slice makes the 21 shipped skills
portable, structurally verifiable, and resistant to stale operational guidance.
The next slice reduces the maintenance risk in the oversized smoke harness. New
design capabilities remain evidence-gated and must reuse the existing
review-to-comparison chain.

This is not a pivot toward a visual canvas or a prompt-to-app generator. Design
AI remains responsible for source-grounded judgment, permission boundaries,
implementation handoff, and proof that the delivered result is real.

## Baseline

Snapshot: `main` at `fdb7618` on 2026-08-11.

- Public package: `@design-ai/cli@5.1.0`.
- Installed surface: 21 skills, 16 commands, 4 agents, 29 MCP tools, and 20 SDK
  exports.
- Repository baseline: eight strict corpus audits pass.
- P16 state: external recruitment remains separate, with no candidate, consent,
  participant, result, repeated problem, or adoption claim created by this work.
- The P14 three-slot program baseline and P16 private outreach data are outside
  this change.

## What the repository audit found

| Priority | Finding | Evidence | Decision |
| --- | --- | --- | --- |
| P0 | Skill quality was counted, not validated. | `check-coverage.py` checked `SKILL.md` existence and one verification heading, but not Agent Skills metadata, activation wording, playbook structure, or manifest parity. | Add a deterministic skill contract gate now. |
| P0 | Several durable playbooks contained unstable instructions. | Figma guidance guessed MCP operation names and carried a dated write-capability statement. Design-system QA hard-coded a vendor price. | Replace with active capability/schema detection and current-source checks. |
| P1 | Skill activation metadata did not consistently state when to use the skill. | All 21 descriptions explained the capability, but most lacked an explicit activation condition. | Rewrite descriptions with one concrete `Use when` clause. |
| P1 | Progressive disclosure was implicit and inconsistently described. | `SKILL.md` wrappers linked a playbook but called it “same content,” while the playbook is the actual executable workflow. | Standardize the dispatcher contract without duplicating the playbook. |
| P1 | Release smoke maintenance has become a change-risk hotspot. | `tools/audit/package-smoke.py` is 24,782 lines; one handoff assertion spans more than 2,300 lines. `smoke_assertions.py` is 15,513 lines. | Split by domain after the skill gate, preserving entry points and output. |
| P2 | Source-grounded design-system extraction is not a first-class workflow. | Current skills can build and sync tokens, but there is no staged `verified facts -> closed contract -> generated skill -> mechanical verification` path for a consuming repository. | Design P17C; implement only after fixtures and target ownership are fixed. |
| P2 | UX copy is present as scattered review advice rather than a complete quality lens. | Website review covers content quality and Korean writing knowledge exists, but no canonical interface-copy contract or benchmark exists. | Design P17D as a lens first, not a standalone command. |
| P2 | Objective visual and brand convergence is adapter-dependent. | The browser runner preserves evidence correctly, but it does not ship visual-diff or brand-consistency evaluators. | Design P17E behind the existing adapter and approval boundary. |

## External repository synthesis

The following sources were read as pattern references. No code, assets, tokens,
or templates are copied into Design AI.

| Source | License checked | Useful pattern | Decision |
| --- | --- | --- | --- |
| [Agent Skills specification](https://github.com/agentskills/agentskills) | Apache-2.0 | `SKILL.md` metadata constraints, concise instructions, one-level progressive disclosure, mechanical validation. | **ADAPT** into the local zero-dependency skill gate. |
| [Vercel Labs design-systems-to-agent-skills](https://github.com/vercel-labs/design-systems-to-agent-skills) | MIT | Persisted interview, verified source facts, usage analysis, closed PRD, generation, asset catalog, mechanical verification. | **ADAPT** the source-grounding sequence in P17C. Do not vendor the pipeline. |
| [emilkowalski/skills](https://github.com/emilkowalski/skills) | MIT | Small specialist skills for build, review, improvement plans, opportunity finding, vocabulary, and library choice. | **ADAPT** the narrow task split and self-contained plan format; preserve Design AI evidence rules. |
| [shadcn/improve](https://github.com/shadcn/improve) | MIT | Intent-doc intake, hotspot-weighted audit, plan as an executable handoff, explicit source-mutation boundary. | **ADAPT** for P17 planning and smoke-harness refactors. |
| [Open Design](https://github.com/nexu-io/open-design) | Apache-2.0 | Artifact history, build/test convergence, diff review, and planned visual/brand evaluators. | **DEFER** project continuity and objective evaluators to P17E/P17F. |
| [Open CoDesign](https://github.com/OpenCoworkAI/open-codesign) | MIT | One workspace per design, local-first files as source of truth, lazy capabilities, permissioned commands, multiple exporters. | **DEFER** the application shell; reuse only workspace/history constraints. |
| [StyleSeed](https://github.com/bitjaru/styleseed) | MIT | Design lock plus render/review/revise feedback loop. | **ADAPT** criterion-level gates. **REJECT** a single aggregate quality score because it can hide missing evidence. |
| [UX Writing Skill](https://github.com/content-designer/ux-writing-skill) | MIT | Progressive content patterns, voice contract, accessibility, concrete before/after examples. | **ADAPT** into a source-backed content-quality lens in P17D. |
| [LottieFiles motion-design-skill](https://github.com/LottieFiles/motion-design-skill) | MIT | Philosophy-first motion direction and choreography vocabulary. | **DEFER** as a separate skill because Design AI already owns a deeper motion playbook. Use it only as a future benchmark reference. |

## Target architecture

```mermaid
flowchart LR
    A["Skill metadata"] --> B["Executable playbook"]
    B --> C["Local design authorities"]
    C --> D["Bounded artifact contract"]
    D --> E["Implementation or review"]
    E --> F["Rendered and automated evidence"]
    F --> G["Comparison and owner decision"]

    H["Skill contract gate"] --> A
    H --> B
    H --> C
    I["Domain smoke modules"] --> D
    I --> F
```

One concept has one owner:

- `SKILL.md` owns discovery and activation.
- `PLAYBOOK.md` owns the executable workflow.
- `knowledge/`, `docs/`, and `examples/` own detailed authority and worked proof.
- CLI/SDK/MCP adapters own transport, not design meaning.
- Review, browser, implementation, pilot, and comparison artifacts own evidence
  history and permission state.

## Delivery phases

### P17A - Skill contract hardening

Status: implemented in this change.

1. Add one shared Markdown frontmatter helper and reuse it from the existing
   knowledge frontmatter audit.
2. Add `tools/audit/skill-contracts.py` with repository and isolated mutation
   checks.
3. Enforce:
   - Agent Skills name and description rules;
   - explicit `Use when` activation language;
   - direct `SKILL.md -> PLAYBOOK.md` progressive disclosure;
   - playbook input, workflow, source, verification, and done sections;
   - 500-line skill and 400-line playbook budgets;
   - plugin, capability-manifest, and directory parity;
   - rejection of dated capability claims and hard-coded recurring prices.
4. Standardize all 21 skill dispatchers.
5. Replace guessed MCP names with active tool-schema inspection.
6. Run the skill mutation suite and repository check inside
   `release:self-test`.

Exit criteria:

- `npm run skills:self-test` rejects each named negative fixture.
- `npm run skills:check` passes all 21 shipped skills.
- Existing eight corpus audits remain unchanged and green.
- No version, public API, command, SDK export, MCP tool, or npm publication is
  introduced.

Current verification evidence:

- the isolated mutation suite passes;
- all 21 repository skill contracts pass;
- the shared frontmatter parser preserves strict validation across 96 files;
- the complete Node test suite passes 832/832 tests;
- the generated coverage report remains at 181/200 canonical components with 21
  verified skills;
- `npm run release:check` passes eight strict audits, 794 packaged files, the 0/0
  documentation warning policy, SDK smoke, installed-bin smoke, and one-shot
  package smoke.

### P17B - Smoke harness modularization

Status: in progress. The first Website Console contract extraction is implemented
without changing CLI behavior or smoke command order.

Current P17B.1 evidence:

- 42 `EXPECTED_SITE_*` contract values now have one owner in
  `smoke_domains/site_contracts.py`, while eight shared command, probe, and
  repair validators live in `smoke_domains/site_validators.py`;
- the original `smoke_assertions.py`, `package-smoke.py`, and `registry-smoke.py`
  entry points preserve their existing imports and focused self-tests;
- the extracted contract has a byte-stable SHA-256 snapshot and isolated positive
  and negative fixtures;
- baseline parity confirms all 42 values and the command rewrite order are
  unchanged;
- `smoke_assertions.py` decreased from 15,513 to 15,103 lines,
  `package-smoke.py` from 24,782 to 24,705, and `registry-smoke.py` from 9,159 to
  9,081; the new contract, validator, and self-test files are 345, 219, and 166
  lines, with 13 functions total and no function longer than 85 lines;
- pre-extraction focused baselines were 0.42 seconds for shared smoke assertions
  and 0.96 seconds for package-smoke self-tests;
- pre- and post-extraction packed smoke both execute the same 716-command
  sequence with normalized SHA-256
  `0654a8730d42526860bb1d00c16f1c828395ffd0aca448a1f137fcb30fd24a46`;
  observed local wall time was 1,444.11 seconds before and 914.29 seconds after.

1. Freeze current `package-smoke.py` and `smoke_assertions.py` behavior with
   focused characterization tests.
2. Extract domain modules in this order:
   - Website Console site/bundle/handoff (contract and validator layer complete;
     scenario payload fixtures, assertion groups, and runners remain);
   - learning profile and skill proposals;
   - review/evidence/pilot contracts;
   - install/help/search/route lifecycle.
3. Keep `package-smoke.py` and `smoke_assertions.py` as stable entry points.
4. Move fixtures beside their domain assertions and remove cross-domain globals.
5. Require byte-for-byte stable JSON fixture output and unchanged command order.

Exit criteria:

- No extracted function exceeds 200 lines without a documented reason.
- Each domain module runs independently and through the original entry point.
- Installed-bin and one-shot package smoke remain equivalent.
- Release duration and command count are recorded before and after; no unreviewed
  reduction in coverage is allowed.

### P17C - Source-grounded design-system skill compiler

1. Accept one explicit design-system root and optional consuming repository.
2. Persist scope decisions before reading source.
3. Extract verified token, component, icon, import, variant, and usage facts.
4. Produce a closed generation contract with no invented API names.
5. Generate project-local skill references, never a competing token authority.
6. Verify every path, import, token, and asset against source.

Boundary:

- Start as a clone-only workflow and fixture suite.
- No target write, dependency install, Figma write, commit, push, or publish
  without the existing scope approval chain.
- Promotion to CLI/SDK/MCP requires two independent completed pilot records or a
  new explicit product decision that replaces that evidence rule.

### P17D - Interface content quality

Add content as a ninth review concern only after a contract and fixtures exist.
It must cover purpose, clarity, concision, conversational fit, error recovery,
accessibility, localization, and Korean honorific consistency. It starts as a
knowledge-backed lens inside website and UX review, not a new command.

Exit criteria:

- Buttons, forms, errors, empty states, notifications, onboarding, and destructive
  confirmation each have before/after fixtures.
- Korean and English fixtures preserve product voice and screen-reader meaning.
- No readability score becomes a substitute for user goal or evidence.

### P17E - Objective visual and brand evaluators

Add optional adapter contracts for screenshot regression, responsive overflow,
brand-token drift, and visual diff. Each evaluator must record tool version,
viewport, source digest, threshold, artifacts, and uncertainty. A missing or
invalid artifact remains `unverified`.

### P17F - Project continuity

Build project snapshots from existing review and comparison artifacts rather than
creating a parallel history database. A snapshot links exact source digests,
design contract, approved scope, implementation evidence, comparison, owner
decision, and successor snapshot. Restore remains read-only until separately
approved.

## Selection rule for new public capability

Choose at most one public capability at a time. Rank candidates by:

1. repeated blocking evidence from independent owners;
2. usefulness across CLI, SDK, MCP, and Website Console;
3. ability to preserve exact source and permission history;
4. objective verification strength;
5. maintenance cost and dependency risk.

If evidence does not separate two candidates, improve the existing skill or
knowledge pack instead of widening the public surface.

## Verification

For every P17 implementation PR:

- run the narrow self-test for the changed contract;
- run `npm test` and `npm run audit:strict`;
- run `git diff --check`, `npm run package:check`, and
  `npm run release:self-test`;
- run `npm run docs:check` for documentation changes;
- run `npm run release:check` before merge when packaged behavior changes;
- preserve P16 program and recruitment state unless real external activity
  occurred.

## Rollback

- P17A is additive. Revert the skill gate scripts and dispatcher wording together
  if a supported Agent Skills host proves incompatible.
- P17B keeps stable entry points, so each extracted domain module can be reverted
  independently.
- P17C-P17F remain behind existing approval and evidence boundaries; a failed
  experiment produces no public capability or migration requirement.
