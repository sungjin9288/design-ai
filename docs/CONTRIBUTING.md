# Contributing

## Adding a new source repo

1. Add to `refs/` via sparse clone:
   ```bash
   git clone --depth 1 --filter=blob:none --sparse https://github.com/<org>/<repo>.git refs/<name>
   git -C refs/<name> sparse-checkout init --cone
   git -C refs/<name> sparse-checkout set <only the dirs you need>
   ```
2. Add it to the table in `README.md`.
3. Write or update an extractor in `tools/extractors/<source>.py`.
4. Run `./tools/extractors/run-all.sh`.
5. Verify generated files in `knowledge/` cite the new source.

## Adding a new skill

1. Create `skills/<skill-name>/`.
2. Author `PLAYBOOK.md` with the step-by-step process.
3. Author `SKILL.md` — same content, with frontmatter:
   ```markdown
   ---
   name: <skill-name>
   description: <one sentence — the trigger condition>
   ---
   ```
4. Author `TEMPLATE.md` if the skill produces a structured artifact.
5. Add a worked example in `skills/<skill-name>/examples/`.
6. Update `skills/README.md` index.

## Adding a new agent persona

1. Create `agents/<persona>.md` with frontmatter:
   ```markdown
   ---
   name: <persona>
   description: <when to spawn>
   tools: [Read, Grep, Glob]
   ---
   ```
2. Body: persona description, scope, output format.
3. Update `agents/README.md` index.

## Adding a slash command

1. Create `commands/<name>.md` with frontmatter:
   ```markdown
   ---
   description: <what /name does>
   ---
   ```
2. Body: the prompt template the command expands to.
3. Update `commands/README.md` index.

## Editing knowledge files

- Generated files: edit the extractor, re-run, do not edit output by hand.
- Hand-written files: must include `<!-- hand-written -->` at the top of the body.
- Mixed files: not allowed. Split into one generated + one hand-written file with cross-links.

## Citation rules

When a knowledge file references upstream source:
```markdown
---
source: refs/ant-design/components/button/Button.tsx
extracted_at: 2026-05-07
---
```

Multi-source files use a list:
```yaml
sources:
  - refs/ant-design/components/button/Button.tsx
  - refs/mui/packages/mui-material/src/Button/Button.js
  - refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/button.tsx
```

## Style

- Markdown over prose.
- Tables for any comparison.
- Code blocks tagged with language (`json`, `tsx`, `css`).
- Links to local files use relative paths.
- Links to upstream use the GitHub canonical URL, not local `refs/` (so docs survive if `refs/` is wiped).
