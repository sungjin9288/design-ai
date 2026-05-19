# figma-token-sync — playbook

Sync design tokens between Figma and code. When Figma MCP is connected, reads/writes Variables directly. Without MCP, falls back to Tokens Studio plugin export workflow.

## When to use

- "Pull tokens from this Figma file"
- "Export our code tokens to Figma"
- "Verify Figma tokens match our code"
- Pre-release: confirm Figma + code are in sync.

## Inputs (ask if missing)

1. **Direction**:
   - `figma → code`: pull from Figma into code's `tokens/source.json`.
   - `code → figma`: push from code into Figma Variables.
   - `verify`: read both, diff, report.
2. **Figma file URL** (with `file_key`).
3. **Code token path**: usually `tokens/source.json` in the consuming project.
4. **Mode mapping**: which Figma mode = light, which = dark?

## Steps

### 1. Detect MCP availability

```
if mcp__Figma is connected:
  proceed with full read/write workflow
else:
  walk through Tokens Studio plugin manual flow
```

### 2. Read tokens from Figma

```
mcp__Figma__get_variable_defs(file_key=<...>)
→ returns all Variables grouped by collection
```

Transform into design-ai's W3C DTCG / Style Dictionary format:

```json
{
  "color": {
    "brand": {
      "primary": {
        "600": { "$value": "#7C3AED", "$type": "color" }
      }
    }
  }
}
```

Notes:
- Figma's collection name → top-level key.
- Variable name (with slashes for hierarchy) → dot-separated nested keys.
- Multi-mode (light/dark) → separate output OR `$value` map per mode.

### 3. Read tokens from code

```
read tokens/source.json from the consuming project
```

Already in W3C DTCG format (assumption).

### 4. Diff (verify mode)

For each token path:

| Status | Action |
| --- | --- |
| In both, value matches | ✓ in sync |
| In both, value differs | ⚠ drift — show both values, ask user which is canonical |
| In Figma only | Code is missing this token — add or warn |
| In code only | Figma is missing — push or warn |

Output report:

```
Token sync report

✓ 38 tokens in sync
⚠ 4 tokens drifted:
  - color.primary.default: code=#7C3AED, figma=#8B5CF6
  - spacing.md: code=12px, figma=16px
  - ...

→ 2 tokens in code only (not in Figma):
  - color.money-positive
  - color.money-negative

← 1 token in Figma only (not in code):
  - color.experimental.purple
```

### 5. Push tokens code → Figma

For each token in `tokens/source.json`:

```
mcp__Figma__... (write Variable in the appropriate collection)
```

⚠ As of mid-2025, Figma MCP's WRITE operations for Variables are limited. The Tokens Studio plugin is more capable for true bidirectional sync.

For now: agent can READ from Figma reliably; for WRITE, recommend Tokens Studio.

### 6. Without MCP — fallback to Tokens Studio

```
1. User: install Tokens Studio for Figma plugin (free tier OK).
2. In Figma: Plugins → Tokens Studio → Import → paste tokens/source.json.
3. Apply to Figma.
4. Output: "Imported via Tokens Studio. Verify in Variables panel."
```

For verify mode without MCP:
1. User: in Tokens Studio, Export → Tokens Studio JSON.
2. Save to /tmp/figma-tokens.json.
3. Agent: diff against tokens/source.json. Output report.

### 7. Apply changes (or stop and ask)

For destructive operations (push, overwrite), stop after diff and confirm before proceeding. Read-only diff/verify operations can complete without confirmation.

## Verification phase (run before declaring done)

- [ ] Did I confirm direction (figma→code / code→figma / verify) before acting?
- [ ] Did I check for write access before pushing (read-only auth = abort)?
- [ ] Did I show the diff to user before applying changes?
- [ ] Did I cite the source-of-truth strategy ([`docs/TOKEN-SYNC.md`](../../docs/TOKEN-SYNC.md))?
- [ ] Did I warn about MCP write limitations when relevant?
- [ ] Did I produce a final report with synced / drifted / extra counts?

## Source files this skill reads

- [`docs/TOKEN-SYNC.md`](../../docs/TOKEN-SYNC.md) — three-tier source-of-truth strategy
- [`docs/integrations/figma-mcp.md`](../../docs/integrations/figma-mcp.md) — MCP usage details
- [`docs/FIGMA-INTEGRATION.md`](../../docs/FIGMA-INTEGRATION.md) — broader Figma workflows
- [`knowledge/design-tokens/ant-design.md`](../../knowledge/design-tokens/ant-design.md) — token format references

## Done when

- Tokens are in sync OR diff is shown for user to resolve.
- Direction was explicit (no surprise writes).
- Tokens Studio fallback used cleanly when MCP unavailable.
- Output includes summary stats (counts: synced / drifted / extra).
- Verification phase passes.
