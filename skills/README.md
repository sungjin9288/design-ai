# Skills

Task-focused playbooks. Each skill is a directory containing:

- `SKILL.md` — Claude Code-compatible manifest (frontmatter + body). Auto-loaded if dropped under `~/.claude/skills/`.
- `PLAYBOOK.md` — Plain-markdown version for Codex CLI / any agent. Same content as `SKILL.md`.
- `TEMPLATE.md` — Optional output template.
- `examples/` — Optional worked examples.

| Skill | When to use |
| --- | --- |
| [design-system-builder](design-system-builder/PLAYBOOK.md) | Bootstrap a complete design system from a brand brief or single brand color. |
| [component-spec-writer](component-spec-writer/PLAYBOOK.md) | Produce a developer-ready spec sheet for a single component. |
| [color-palette](color-palette/PLAYBOOK.md) | Generate a full palette (ramps + semantic aliases + dark mode) from inputs. |
| [ux-audit](ux-audit/PLAYBOOK.md) | Audit a screen, flow, or page against UX best practices and a11y. |
| [design-critique](design-critique/PLAYBOOK.md) | Senior-designer feedback on a design proposal. |
| [handoff-spec](handoff-spec/PLAYBOOK.md) | Produce a developer handoff document from a finalized design. |
| [design-system-qa](design-system-qa/PLAYBOOK.md) | Audit a design system across 5 testing layers (types / tokens / contract / a11y / visual) and recommend CI integration. |
| [design-pr-review](design-pr-review/PLAYBOOK.md) | Review a GitHub PR for design system compliance. Uses GitHub MCP when connected. |
| [website-improvement](website-improvement/PLAYBOOK.md) | Plan a website improvement control tower with Site Profile, audit pipeline, MCP readiness, refactor tasks, prompts, and handoff report. |
| [design-engineering-review](design-engineering-review/PLAYBOOK.md) | Review or improve web/app interface craft across code, runtime response, motion, accessibility, and responsive states. |
| [figma-token-sync](figma-token-sync/PLAYBOOK.md) | Sync tokens between Figma and code. Uses Figma MCP. |
| [design-broadcast](design-broadcast/PLAYBOOK.md) | Post artifacts to Slack / Notion. Uses Slack + Notion MCPs. |
| [document-author](document-author/PLAYBOOK.md) | Write technical / product documentation. Picks the right Diátaxis type, applies template, follows technical-writing voice rules. Korean-aware. |
| [slide-deck-author](slide-deck-author/PLAYBOOK.md) | Outline a slide deck (talk / pitch / reading). Message-led titles, brand-applied, Korean-aware. |
| [motion-designer](motion-designer/PLAYBOOK.md) | Spec motion for a screen / component / page. Picks tool (CSS / Framer Motion / GSAP / Lottie / Rive), durations, easings, choreography. Reduced-motion-safe by default. |
| [illustration-designer](illustration-designer/PLAYBOOK.md) | Design or spec an illustration system (or single illustration). Style, voice, color, format (SVG / Lottie / PNG), accessibility, SVG optimization. Korean-market-aware. |
| [print-designer](print-designer/PLAYBOOK.md) | Spec a print piece — business card, brochure, poster, packaging, stationery. CMYK + Pantone, bleed, finish, regulatory content; Korean print conventions. |
| [video-designer](video-designer/PLAYBOOK.md) | Spec video for marketing, social, or in-product use. Length, format, aspect, codec, captions, voiceover; Korean ad disclosure + KFDA compliance. |
| [game-ui-designer](game-ui-designer/PLAYBOOK.md) | Spec game UI — HUD, menus, inventory, store — across genres + platforms. Korean gaming conventions (확률 표시, 본인인증, PC bang) + accessibility. |
| [conversational-ui-designer](conversational-ui-designer/PLAYBOOK.md) | Spec a conversational UI — voice assistant, chatbot, AI chat (LLM), or live agent. Modality, persona (해요체 / 합쇼체), intents, flows, Korean conventions (Bixby / Clova / KakaoTalk channel). |
| [spatial-designer](spatial-designer/PLAYBOOK.md) | Spec spatial / AR / VR / MR experiences. Platform (Vision Pro / Quest / HoloLens / mobile AR / WebXR), anchoring, locomotion (teleport / smooth / snap turn), comfort, accessibility, Korean Galaxy XR. |

## Invoking a skill

**Claude Code**: skills are auto-discovered. Reference by name: "Use the `color-palette` skill to..."

**Codex CLI** (or any other agent): paste the contents of `PLAYBOOK.md` into your prompt, or have the agent `cat` it.

**Self-hosted prompt**: include the playbook in your system prompt. Each playbook is self-contained.
