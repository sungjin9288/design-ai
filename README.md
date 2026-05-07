# Design AI

A model-agnostic design knowledge base and skill system. Built so any AI coding agent — Claude Code, Codex CLI, Cursor, Aider — can pick up this project and produce expert-level UI/UX design output.

## What this is

Not a model. Not a fine-tune. A **structured corpus** of design expertise extracted from battle-tested sources, plus **agent-ready instructions** that turn a general-purpose LLM into a senior product designer for the duration of a session.

## Project layout

```
design-ai/
├── AGENTS.md            # Universal entry point for any AI coding agent (Codex, etc.)
├── CLAUDE.md            # Claude Code specific overlay
├── README.md            # Human entry point (this file)
│
├── refs/                # Sparse-cloned source material from upstream design systems
│   ├── ant-design/
│   ├── mui/
│   ├── shadcn-ui/
│   ├── material-icons/
│   ├── nerd-fonts/
│   ├── material-design-lite/
│   ├── awesome-design-md/
│   └── ui-ux-pro-max/
│
├── knowledge/           # Extracted, structured, model-readable knowledge
│   ├── design-tokens/   # Color, typography, spacing, radius, shadow tokens
│   ├── components/      # Component API specs, variants, anatomy
│   ├── patterns/        # UX patterns: forms, navigation, empty states, etc.
│   ├── colors/          # Palette systems, semantic color, accessibility
│   ├── typography/      # Type scales, pairings, hierarchy
│   ├── layout/          # Grid, spacing, responsive breakpoints
│   ├── icons/           # Icon system metadata
│   ├── a11y/            # WCAG checklists, contrast rules, focus states
│   ├── motion/          # Duration, easing, choreography
│   └── i18n/            # Korean typography, product conventions, publishing
│
├── examples/            # Worked outputs — what "good" looks like for each skill
│
├── skills/              # Reusable, task-focused design playbooks
│   ├── design-system-builder/
│   ├── component-spec-writer/
│   ├── color-palette/
│   ├── ux-audit/
│   ├── design-critique/
│   └── handoff-spec/
│
├── agents/              # Persona definitions for sub-agents
│   ├── design-critic.md
│   ├── token-extractor.md
│   ├── component-architect.md
│   └── a11y-reviewer.md
│
├── commands/            # Slash command definitions (Claude Code) / prompt recipes (Codex)
│   ├── design-review.md
│   ├── extract-tokens.md
│   ├── component-spec.md
│   └── palette-from-brand.md
│
├── tools/               # Scripts that build/refresh the knowledge base
│   └── extractors/      # Pull tokens/components/patterns from refs/ into knowledge/
│
└── docs/                # How this system works
    ├── ARCHITECTURE.md
    ├── CONTRIBUTING.md
    └── ROADMAP.md
```

## How to use it (any AI agent)

1. Open this directory as the project root.
2. The agent reads `AGENTS.md` (universal) or `CLAUDE.md` (Claude Code).
3. Ask design questions or request artifacts. The agent navigates `knowledge/`, applies `skills/`, and produces deliverables.

See [docs/USING.md](docs/USING.md) for setup instructions per agent (Codex CLI, Claude Code, Cursor, Aider, plain prompts).

## Source material

| Source | Why |
|---|---|
| [ant-design](https://github.com/ant-design/ant-design) | Mature enterprise component API, dense token system |
| [mui/material-ui](https://github.com/mui/material-ui) | Material Design React reference implementation |
| [shadcn-ui](https://github.com/shadcn-ui/ui) | Modern Radix-based, copy-paste component model |
| [material-design-icons](https://github.com/google/material-design-icons) | Canonical icon set with semantic naming |
| [nerd-fonts](https://github.com/ryanoasis/nerd-fonts) | Developer/code-UI typography glyph metadata |
| [material-design-lite](https://github.com/google/material-design-lite) | Historical CSS-first Material reference |
| [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | Curated design markdown guides |
| [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | UI/UX skill: 50+ styles, 161 palettes, 57 font pairings |
| [open-design](https://github.com/nexu-io/open-design) | Open source design system reference |

**Excluded (not visual design):** `system-design-primer` (software architecture), `clash-verge-rev` (VPN UI), `rustdesk` (remote desktop). If a desktop-app UI reference is needed later, we add a focused alternative.

## Status

See [docs/ROADMAP.md](docs/ROADMAP.md) for the build plan and current progress.
