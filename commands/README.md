# Commands

Slash commands. In Claude Code, drop these into `~/.claude/commands/` (or symlink) to invoke as `/<name>`. In Codex CLI or generic agents, use the body as a prompt template.

| Command | What it does |
| --- | --- |
| [/design-from-brief](design-from-brief.md) | Generate a complete design system (palette + foundations + component baseline + starter set + handoff) from a one-paragraph product brief. **The most ambitious endpoint.** |
| [/iterate](iterate.md) | Apply a critique to an existing artifact, produce a revision + changelog. |
| [/document-from-brief](document-from-brief.md) | Generate documentation (tutorial / how-to / reference / explanation) from a brief. |
| [/slide-deck](slide-deck.md) | Generate a slide deck outline (talk / pitch / reading) from a brief. |
| [/design-review](design-review.md) | Run UX audit + a11y review + design critique in parallel and combine. |
| [/palette-from-brand](palette-from-brand.md) | Generate a full palette from a brand input (hex, category, or mood). |
| [/component-spec](component-spec.md) | Spec a single component using the component-spec-writer skill. |
| [/extract-tokens](extract-tokens.md) | Run the token extractor pipeline. |
| [/motion-design](motion-design.md) | Spec motion for a screen / component / page. Picks tool, durations, easings; reduced-motion-safe. |
| [/illustration](illustration.md) | Design or spec an illustration system or piece. Style, voice, format; Korean-market-aware. |
| [/print](print.md) | Spec a print piece (business card, brochure, poster, packaging). CMYK + Pantone, bleed, finish; KR conventions. |
| [/video](video.md) | Spec video for marketing, social, or in-product. Length, format, captions, voiceover; KR ad disclosure. |
| [/game-ui](game-ui.md) | Spec game UI (HUD / menu / inventory / store). Genre + platform + KR conventions + a11y. |
| [/conversational](conversational.md) | Spec a chatbot / voice / AI chat / live agent. Persona, intents, flows; KR conventions (해요체 / 합쇼체, Bixby / Clova / KakaoTalk channel). |
| [/spatial](spatial.md) | Spec a VR / AR / MR / WebXR experience. Platform, anchoring, locomotion, comfort, accessibility; Korean Galaxy XR + KR market. |

Each file has YAML frontmatter (`description`) and a body. The body is the prompt the command expands to.
