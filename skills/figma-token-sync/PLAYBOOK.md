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

Inspect the active tool inventory and the schema of each connected Figma
operation. Record variable read and variable write as separate capabilities.
Never infer a tool name from this playbook. If variable reads are unavailable,
use the Tokens Studio export workflow. If variable writes are unavailable, keep
the result as a diff and prepare a manual import.

### 2. Read tokens from Figma

Call only a connected Figma operation whose declared schema reads variable
definitions for the supplied file. Preserve collection, mode, alias, value, and
source identifiers from the returned payload before mapping them into code.

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

Proceed only when the active Figma tool schema explicitly supports variable
writes, the authenticated principal has write access, and the user approved the
displayed diff. Otherwise, stop at the verified diff and use Tokens Studio for
the import. Capability detection in the active session is authoritative; this
playbook does not assume that read and write support move together.

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
- [ ] Did I use only Figma operations present in the active tool inventory?
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
