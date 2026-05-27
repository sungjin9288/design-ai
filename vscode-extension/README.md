# design-ai for VS Code

Senior product designer for any AI coding agent — now inside VS Code.

This extension surfaces the [design-ai](https://github.com/sungjin9288/design-ai) corpus directly in your editor:

- **19 design skills** as searchable PLAYBOOKs (color palette, component spec, UX audit, motion, illustration, print, video, game UI, conversational UI, spatial design)
- **142 worked component specs** synthesized from Ant Design + MUI + shadcn-ui
- **91 knowledge files** covering tokens, typography, layout, accessibility, Korean i18n, and more
- **4 integration walkthroughs** (Codex CLI / Cursor / Aider / SDK)

The extension does **not** compete with your AI assistant (Cursor, Copilot, Continue, Claude). It surfaces design-aware **content** that you (or your AI assistant) can reference while building.

## Install

The extension needs the design-ai source to function. Pick one:

```bash
# NPM (recommended)
npx @design-ai/cli install

# Homebrew (macOS)
brew tap sungjin9288/design-ai https://github.com/sungjin9288/design-ai.git
brew install design-ai
design-ai install

# Git clone
git clone https://github.com/sungjin9288/design-ai.git ~/dev/design-ai
cd ~/dev/design-ai
./install.sh
```

The extension auto-probes common locations (`~/dev/design-ai`, `~/.local/lib/design-ai`, npm-global, Homebrew). Set `design-ai.path` in settings if it lives elsewhere.

## Features

### Sidebar tree

Four collapsible views in the design-ai activity bar:

- **Skills** — 19 skill PLAYBOOKs. Click to open in editor.
- **Knowledge** — 91 knowledge files organized by category (motion, illustration, print, game UI, conversational, spatial, i18n, etc.).
- **Component specs** — 142 worked component specs (Banner, Button, Modal, Table, Sheet, ...).
- **Integration walkthroughs** — Codex CLI / Cursor / Aider / SDK guides.

### Commands

Run via `Cmd+Shift+P` → "design-ai: ...":

- **Install (Claude Code)** — runs `install.sh` to symlink into `~/.claude/`.
- **Show install status** — displays plugin manifest version + skill / command / agent counts.
- **Open knowledge file...** — quick-pick across all knowledge files.
- **Open component spec...** — quick-pick across the 142 component specs.
- **Open skill PLAYBOOK...** — quick-pick across the 19 skills.
- **Open integration walkthrough...** — quick-pick across walkthroughs.

### Use with your AI assistant

The most common workflow:

1. Open a knowledge file or skill PLAYBOOK in the editor.
2. In your AI assistant (Copilot Chat, Cursor Chat, Continue, etc.), reference the open file:
   - "Apply the patterns in `@workspaceFile` to my Banner component"
   - "Use the rules in this PLAYBOOK to spec a CommandPalette"

Because design-ai files are pure markdown, every AI assistant can read them natively.

## Settings

| Setting | Default | Purpose |
|---|---|---|
| `design-ai.path` | _(auto-probe)_ | Absolute path to design-ai source if non-standard location |
| `design-ai.language` | `en` | Preferred language when opening README / QUICKSTART (`en` or `ko`) |

## Korean / 한국어

design-ai's primary audience is Korean designers and developers. The corpus includes deep coverage of:

- 한글 typography (Pretendard / NanumSquare / 본명조)
- Korean payments (Toss / KakaoPay / NaverPay / PASS / NICE / KCB 본인인증)
- Korean print conventions (명함 90×50, KFDA 규제, 분리배출 표시)
- Korean voice (해요체 / 합쇼체)
- Korean game / fintech / spam law compliance

Set `design-ai.language` to `ko` to open Korean translations of README / QUICKSTART / DISTRIBUTION / AGENTS.

## Repository

[github.com/sungjin9288/design-ai](https://github.com/sungjin9288/design-ai) — corpus, skills, examples, and CLI live there. This extension is a thin VS Code wrapper.

## License

MIT — same as the design-ai project.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Issues

Bug reports + feature requests: [github.com/sungjin9288/design-ai/issues](https://github.com/sungjin9288/design-ai/issues).
