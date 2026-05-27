# SDK walkthrough — Anthropic + OpenAI

How to use design-ai inside your own code via the Anthropic SDK or OpenAI SDK. For when you're embedding design-aware AI into a product (not using a CLI agent).

## Prerequisites

```bash
# Get design-ai (just the corpus; no CLI install needed for SDK use)
git clone https://github.com/sungjin9288/design-ai.git ~/dev/design-ai

# Install your SDK of choice
pip install anthropic   # or
pip install openai

# Set API key
export ANTHROPIC_API_KEY=...
# OR
export OPENAI_API_KEY=...
```

## Setup

For SDK adoption, design-ai is just markdown files. There's no install step — your code reads them directly into the model's system prompt at runtime.

The pattern below loads a configurable subset of the corpus:

```python
from pathlib import Path

DESIGN_AI = Path("/Users/you/dev/design-ai")  # adjust to your clone path

def design_ai_path(rel: str) -> str:
    return (DESIGN_AI / rel).read_text(encoding="utf-8")
```

That's it. The walkthroughs below build on this primitive.

## Pattern: design-ai as system prompt

design-ai is markdown. Load relevant files into the system prompt; the model treats them as authoritative context.

### Anatomy

```
System prompt =
  AGENTS.md (universal entry)
  + knowledge/PRINCIPLES.md (single-page load-bearing rules)
  + skills/<skill>/PLAYBOOK.md (the active skill)
  + knowledge/<relevant>/<file>.md (per task)

User message =
  "Apply the X skill: <task>"

Output =
  Per the skill's template
```

## Walkthrough 1: Anthropic SDK + Sonnet

```python
import anthropic
from pathlib import Path

DESIGN_AI = Path("/Users/you/dev/design-ai")

def load_skill_context(skill: str, knowledge_files: list[str]) -> str:
    parts = [
        (DESIGN_AI / "AGENTS.md").read_text(),
        (DESIGN_AI / "knowledge/PRINCIPLES.md").read_text(),
        (DESIGN_AI / f"skills/{skill}/PLAYBOOK.md").read_text(),
    ]
    for k in knowledge_files:
        parts.append((DESIGN_AI / k).read_text())
    return "\n\n---\n\n".join(parts)

client = anthropic.Anthropic()

system = load_skill_context(
    skill="component-spec-writer",
    knowledge_files=[
        "knowledge/components/INDEX.md",
        "knowledge/i18n/korean-document-style.md",
        "examples/component-banner.md",  # reference for shape
    ],
)

message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    system=system,
    messages=[
        {"role": "user", "content": (
            "Spec a Banner component for a Korean fintech app. "
            "Persistent in-page strip for system status. Distinct from "
            "Alert (inline) and Toast (transient). Variants: info / "
            "success / warning / error / promo. Dismissible."
        )},
    ],
)

print(message.content[0].text)
```

### With prompt caching (recommended)

For repeated calls with the same system prompt, use prompt caching to avoid re-paying for the corpus:

```python
import anthropic

client = anthropic.Anthropic()

system_blocks = [
    {
        "type": "text",
        "text": (DESIGN_AI / "AGENTS.md").read_text(),
        "cache_control": {"type": "ephemeral"},
    },
    {
        "type": "text",
        "text": (DESIGN_AI / "knowledge/PRINCIPLES.md").read_text(),
        "cache_control": {"type": "ephemeral"},
    },
    {
        "type": "text",
        "text": (DESIGN_AI / "skills/component-spec-writer/PLAYBOOK.md").read_text(),
        "cache_control": {"type": "ephemeral"},
    },
]

message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    system=system_blocks,  # array of cache-aware blocks
    messages=[{"role": "user", "content": "Spec a Banner component..."}],
)
```

The corpus contributes ~10-30K tokens to the prompt. With caching, after the first call, subsequent calls hit the cache (5-min TTL); cost drops by ~90%.

## Walkthrough 2: OpenAI SDK + GPT-4o

```python
import openai
from pathlib import Path

DESIGN_AI = Path("/Users/you/dev/design-ai")

def load_skill_context(skill: str, knowledge_files: list[str]) -> str:
    parts = [
        (DESIGN_AI / "AGENTS.md").read_text(),
        (DESIGN_AI / "knowledge/PRINCIPLES.md").read_text(),
        (DESIGN_AI / f"skills/{skill}/PLAYBOOK.md").read_text(),
    ]
    for k in knowledge_files:
        parts.append((DESIGN_AI / k).read_text())
    return "\n\n---\n\n".join(parts)

client = openai.OpenAI()

system = load_skill_context(
    skill="color-palette",
    knowledge_files=[
        "knowledge/colors/color-theory.md",
        "knowledge/colors/palettes-by-product-type.md",
        "knowledge/i18n/korean-typography.md",
    ],
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": system},
        {"role": "user", "content": (
            "Generate a full palette for a Korean fintech for freelancers. "
            "Brand: trustworthy, calm, modern. Seed: oklch(56% 0.16 244)."
        )},
    ],
)

print(response.choices[0].message.content)
```

OpenAI's prompt caching (auto-detected for `messages` ≥ 1024 tokens) handles the cost savings without explicit `cache_control`.

## Walkthrough 3: Streaming for long outputs

For long design system bootstraps, streaming UX is essential:

```python
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=8192,
    system=system_blocks,
    messages=[{"role": "user", "content": "Apply design-system-builder..."}],
) as stream:
    for chunk in stream.text_stream:
        print(chunk, end="", flush=True)
```

OpenAI equivalent:

```python
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "system", "content": system}, {"role": "user", "content": "..."}],
    stream=True,
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

## Walkthrough 4: Tool use for multi-skill workflows

Use the model's tool-use capability to chain skills:

```python
tools = [
    {
        "name": "apply_skill",
        "description": "Apply a design-ai skill. Returns the skill's playbook for the model to follow.",
        "input_schema": {
            "type": "object",
            "properties": {
                "skill": {
                    "type": "string",
                    "enum": ["color-palette", "component-spec-writer", "ux-audit", "..."],
                },
            },
            "required": ["skill"],
        },
    },
    {
        "name": "read_knowledge",
        "description": "Read a knowledge file from the design-ai corpus.",
        "input_schema": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"],
        },
    },
]

# When the model calls apply_skill or read_knowledge, your handler reads
# the corresponding markdown file and returns its content as the tool result.
```

This lets the model dynamically choose what to read instead of forcing all context into the initial system prompt.

## Walkthrough 5: Production app — design-aware chatbot

A practical example: a chatbot that answers design questions for your team, grounded in design-ai.

```python
from anthropic import Anthropic
from pathlib import Path

DESIGN_AI = Path("/Users/you/dev/design-ai")
client = Anthropic()

# Pre-load corpus into a single cached system prompt.
def build_system() -> list[dict]:
    return [
        {
            "type": "text",
            "text": (DESIGN_AI / "AGENTS.md").read_text(),
            "cache_control": {"type": "ephemeral"},
        },
        {
            "type": "text",
            "text": (DESIGN_AI / "knowledge/PRINCIPLES.md").read_text(),
            "cache_control": {"type": "ephemeral"},
        },
        # Pre-include the most-asked playbooks
        *[
            {
                "type": "text",
                "text": (DESIGN_AI / f"skills/{s}/PLAYBOOK.md").read_text(),
                "cache_control": {"type": "ephemeral"},
            }
            for s in ["component-spec-writer", "color-palette", "ux-audit"]
        ],
    ]

SYSTEM = build_system()

def ask(question: str) -> str:
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=SYSTEM,
        messages=[{"role": "user", "content": question}],
    )
    return response.content[0].text

# Use:
print(ask("What's the canonical Toast vs Alert vs Banner distinction?"))
print(ask("How should I compose a Form using shadcn primitives?"))
```

For a Slack bot / Discord bot / web chat: wrap `ask()` in your platform's HTTP handler. Cache hit-rate stays high; per-question cost drops to ~$0.001-0.005 with Sonnet.

## Tips for SDK adoption

### Cost control

- **Cache the corpus**: 90% cost reduction on repeat calls.
- **Load only what's needed**: don't include all 91 knowledge files. Per-task selection (3-7 files) is plenty.
- **Use Haiku for simpler tasks**: color-palette generation works fine on Haiku (5× cheaper). Reserve Sonnet/Opus for design-system-builder, ux-audit (complex synthesis).

### Output structure

design-ai skills produce predictable structures (anatomy / API / states / tokens / a11y). For programmatic post-processing:
- Parse markdown into sections via headings.
- Or instruct the model to output JSON: "Same content, but as JSON with keys: anatomy, api, states, tokens, a11y, edgeCases."

### Integration with your product

Common patterns:
- **Design assistant chatbot** — Q&A bot for design teams.
- **PR comment bot** — auto-review design PRs against the corpus.
- **Internal docs generator** — turn brand brief → design system docs.
- **Token sync agent** — compare Figma tokens to code tokens, suggest reconciliation.
- **Pre-flight check** — before shipping a component, audit it via design-system-qa.

### Korean output

Same as other agents: load `knowledge/i18n/` files for Korean tasks; prompt explicitly for 해요체 / 합쇼체 register.

## Reference projects

This pattern mirrors how Anthropic's own internal design tooling and other open-source projects load corpus context. Notable similar approaches:
- **Continue.dev** — code-context-aware coding assistants.
- **Claude Code itself** — uses skills + agents the same way at the SDK level.
- **Cursor / Windsurf / Codeium** — workspace-aware editors that load relevant docs.

## Troubleshooting

### "Context too large" errors

Reduce loaded files. Default load:
- AGENTS.md (~3K tokens)
- PRINCIPLES.md (~5K tokens)
- One skill PLAYBOOK (~3-8K tokens)
- 1-3 knowledge files (~3-15K tokens each)

Total: 15-50K tokens. Well within Sonnet 4.6 (200K) / GPT-4o (128K). If you're loading more, you're probably loading too much.

### Model ignores skill conventions

The skill PLAYBOOK has a "verification phase" checklist at the end. Prompt the model to apply it:

```
"After producing your output, run the verification phase from the
playbook. List any items that fail and adjust."
```

### Korean conventions ignored

Either load `i18n/` files explicitly OR add to system prompt:

```
"Audience is Korean B2C. Apply 해요체 voice. Use Pretendard
typography defaults. Follow knowledge/i18n/ conventions."
```

## Next

- [`docs/integrations/codex-walkthrough.md`](codex-walkthrough.md) — Codex CLI
- [`docs/integrations/cursor-walkthrough.md`](cursor-walkthrough.md) — Cursor
- [`docs/integrations/aider-walkthrough.md`](aider-walkthrough.md) — Aider
- [`docs/MCP-INTEGRATION.md`](../MCP-INTEGRATION.md) — MCP servers (alternative to SDK loading)
- [Anthropic SDK docs](https://docs.anthropic.com/) — prompt caching reference
- [OpenAI SDK docs](https://platform.openai.com/docs) — caching reference
