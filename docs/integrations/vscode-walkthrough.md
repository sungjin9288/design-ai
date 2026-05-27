# VS Code walkthrough

How to use design-ai inside **VS Code** via the [design-ai-vscode extension](https://github.com/sungjin9288/design-ai/tree/main/vscode-extension). The extension surfaces the corpus as sidebar trees + quick-pick commands; pair with any AI assistant (Copilot Chat, Continue, Cursor, etc.) for full design-aware coding.

## Prerequisites

```bash
# Install design-ai source (any one method)
npx @design-ai/cli install
# OR
brew tap sungjin9288/design-ai https://github.com/sungjin9288/design-ai.git && brew install design-ai
# OR
git clone https://github.com/sungjin9288/design-ai.git ~/dev/design-ai && cd ~/dev/design-ai && ./install.sh

# Install VS Code extension (when published to marketplace)
# code --install-extension sungjin.design-ai-vscode
# Or sideload from .vsix during development
```

## Setup (60 seconds)

1. Install the design-ai source (above).
2. Install the design-ai VS Code extension.
3. Open VS Code; the design-ai activity bar entry appears (icon: gradient "D").
4. Click it — 4 sidebar trees populate with Skills / Knowledge / Component specs / Walkthroughs.

If the extension can't find design-ai, it shows a banner with **"Open settings"** — set `design-ai.path` to your install location.

## Walkthrough 1: Browse + reference in chat

Goal: write a Banner component with your AI assistant, using design-ai's spec as the source of truth.

### Session

```
1. Click design-ai activity bar → Component specs.
2. Find component-banner.md in the tree → click → opens in editor.
3. Open Copilot Chat (or Cursor / Continue / Claude Chat).
4. Reference the open file:

You ▸ #file:component-banner.md  Implement this Banner spec as a React
      component in src/components/Banner.tsx. Use our token system
      (var(--color-banner-bg-info) etc).

AI  ▸ [generates Banner.tsx implementation faithful to the spec]
```

The pattern: **design-ai spec is the authority**, AI is the implementation engine. Quality of output = quality of spec being referenced.

## Walkthrough 2: Audit existing component

Goal: bring an old `Alert.tsx` up to design-ai's spec.

```
1. Open src/components/Alert.tsx in your project.
2. design-ai sidebar → Component specs → component-alert.md → click.
3. Now you have both files open side-by-side.
4. In your AI assistant:

You ▸ Compare the two files. List concrete diffs needed to make
      Alert.tsx match component-alert.md. Categorize as CRITICAL /
      HIGH / MEDIUM.

AI  ▸ [audit findings]
```

## Walkthrough 3: Generate from skill PLAYBOOK

Goal: bootstrap a color palette using the design-ai skill.

```
1. design-ai sidebar → Skills → color-palette → click (opens PLAYBOOK).
2. In your AI assistant:

You ▸ #file:PLAYBOOK.md  Apply this skill to generate a palette for a
      Korean fintech for freelancers. Brand: trustworthy, calm, modern.
      Seed: oklch(56% 0.16 244). Output to src/tokens/colors.css and
      tailwind.config.ts.

AI  ▸ [follows the playbook step-by-step; produces both files]
```

The PLAYBOOK has a verification phase checklist at the end — ask the AI to apply it after producing output.

## Walkthrough 4: Quick-pick across the corpus

Goal: find the right knowledge file fast.

```
Cmd+Shift+P → "design-ai: Open knowledge file..."
```

A quick-pick lists all 91 knowledge files with their paths. Filter by typing — "korean", "motion", "spatial", "typography", etc. Hit Enter to open.

Same pattern for:
- "design-ai: Open component spec..." → 142 specs
- "design-ai: Open skill PLAYBOOK..." → 19 skills
- "design-ai: Open integration walkthrough..." → 4 walkthroughs

## Walkthrough 5: Multi-file design system bootstrap

Goal: generate a full design system from a brief, materialize as files.

```
1. design-ai sidebar → Skills → design-system-builder → click.
2. design-ai sidebar → Skills → color-palette → cmd+click (open in 2nd tab).
3. design-ai sidebar → Knowledge → i18n/korean-typography.md → cmd+click.
4. In your AI assistant:

You ▸ Apply skills in order: color-palette, then design-system-builder.
      Brief: 프리랜서를 위한 한국 핀테크. Trustworthy, calm. Pretendard.
      Seed oklch(56% 0.16 244). Output:
      - src/tokens/colors.css
      - src/tokens/typography.css
      - src/tokens/spacing.css
      - tailwind.config.ts

AI  ▸ [reads all 3 referenced files; generates 4 output files atomically]
```

VS Code's multi-file edit support (especially in Cursor / Copilot Edits / Continue) handles this cleanly.

## Settings

| Setting | Default | Use |
|---|---|---|
| `design-ai.path` | _(auto-probe)_ | Set if design-ai is at non-standard location |
| `design-ai.language` | `en` | Set to `ko` to open Korean translations of README / QUICKSTART / DISTRIBUTION / AGENTS |

Cmd+Shift+P → "design-ai: Open extension settings".

## Korean teams

For Korean primary teams:

```jsonc
// .vscode/settings.json
{
  "design-ai.language": "ko"
}
```

Now opening README / QUICKSTART / etc. via the extension shows Korean versions when available. Skills + knowledge files are language-agnostic (the corpus' Korean coverage is in the content, not a separate translation).

## VS Code + AI assistant pairing

design-ai works with **any** AI assistant. Tested combinations:

| AI assistant | Design-ai pairing |
| --- | --- |
| **Copilot Chat** | `#file:` references |
| **Cursor Chat** | `@file` references |
| **Continue** | `@File` slash command |
| **Claude in VS Code** (when avail.) | `#file:` references |
| **CodeWhisperer** | Open files; chat references current file |

The pattern is consistent across all: design-ai opens content; AI references it. No vendor lock-in.

## Troubleshooting

### Sidebar shows "design-ai source not found"

The extension can't find design-ai. Click "Open settings" in the banner, set `design-ai.path` to your install location:

```bash
# Find where design-ai installed
npm root -g  # → /path/to/global/node_modules
# So design-ai is at /path/to/global/node_modules/@design-ai/cli

# Or for git clone
ls ~/dev/design-ai/.claude-plugin/plugin.json  # confirm marker file
```

Set the absolute path; restart VS Code.

### Trees are empty

Ensure design-ai source is intact:

```bash
ls ~/dev/design-ai/{knowledge,examples,skills,docs}
```

If empty, re-install:

```bash
cd ~/dev/design-ai && git pull && ./install.sh
```

### Updates not reflected

```bash
# In VS Code:
Cmd+Shift+P → "design-ai: Refresh tree"
```

### Korean file doesn't open

Check `design-ai.language` setting. The Korean variant must exist (`README.ko.md`, `docs/QUICKSTART.ko.md`, etc.). Not all files have Korean translations yet.

## Next

- [`docs/integrations/codex-walkthrough.md`](codex-walkthrough.md) — Codex CLI variant
- [`docs/integrations/cursor-walkthrough.md`](cursor-walkthrough.md) — Cursor variant
- [`docs/integrations/aider-walkthrough.md`](aider-walkthrough.md) — Aider variant
- [`docs/integrations/sdk-walkthrough.md`](sdk-walkthrough.md) — Anthropic / OpenAI SDK
- [VS Code extension source](https://github.com/sungjin9288/design-ai/tree/main/vscode-extension)
