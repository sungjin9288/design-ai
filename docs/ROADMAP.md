# Roadmap

## Phase 1 — Foundation (current)

- [x] Project skeleton, entry docs (`README`, `AGENTS.md`, `CLAUDE.md`)
- [x] Sparse-clone source material into `refs/`
- [x] Architecture documentation
- [ ] Extractor scripts that turn `refs/` into `knowledge/`
- [ ] Initial extracted knowledge: tokens, components index, color systems, typography
- [ ] Six core skills with playbooks and templates
- [ ] Four agent personas
- [ ] Four slash commands
- [ ] Dry-run validation: ask the system to produce a design artifact end-to-end

## Phase 2 — Depth

- Per-component anatomy specs derived from `ant-design` + `mui` + `shadcn-ui`
- Pattern catalog: forms, navigation, data tables, empty states, loading, errors, onboarding, settings
- Motion principles: easing, duration, choreography
- Responsive layout patterns: breakpoint strategies, container queries, fluid typography
- Korean-market design considerations (font rendering, line-height for Hangul, payment patterns)

## Phase 3 — Connective

- `/design-from-brief` — full design from a one-paragraph brief
- `/iterate` — apply critique and produce revision
- HTML preview generator: render token sets and component specs as a static page for visual review
- Optional embedding index for fuzzy retrieval if knowledge base exceeds 100K tokens

## Phase 4 — Multi-tool

- Codex CLI verification: full design task run via Codex against this repo
- Cursor `.cursorrules` overlay
- Aider configuration

## Out of scope

- Image generation. We produce specs, tokens, and code-ready artifacts. Visual mockups go through Figma/external tools.
- Brand strategy. We assume a brand exists and translate it into tokens/components.
- Custom font design. We pair existing fonts.
