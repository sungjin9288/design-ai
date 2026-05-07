# Token sync workflow

How design tokens move between three places:

1. **design-ai** — authoritative source (Markdown specs + Style Dictionary JSON)
2. **Codebase** — consuming product (CSS variables, Tailwind config, JS theme)
3. **Figma** — design surface (Variables, Styles)

The goal is **one source of truth** with deterministic mirrors. Pick the source; treat the mirrors as derived.

## The recommended source of truth

For most teams: **design-ai's `knowledge/design-tokens/` + Style Dictionary JSON in `examples/` or a dedicated `tokens/` directory** is the source of truth. Figma and the codebase are mirrors.

Why code-as-source over Figma-as-source:

| Property | Code (authoritative) | Figma (authoritative) |
| --- | --- | --- |
| Diffable | yes (git) | no (visual diff only) |
| PR review | natural | requires plugin |
| CI integration | trivial | requires Figma API |
| Multi-platform output | yes (Style Dictionary) | partial |
| Programmatic generation (skills, palette tools) | yes | hard |

The exception: an established design team with a strong Figma library that pre-dates code tokens. Then Figma is canonical and code is generated from Figma export. We document both directions below.

## Token format — the canonical shape

Use **W3C Design Tokens Community Group format** (DTCG) — emerging standard, supported by Style Dictionary 4+, Tokens Studio, and most modern tooling.

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "brand": {
      "primary": {
        "50":  { "$value": "#F5F3FF", "$type": "color" },
        "500": { "$value": "#8B5CF6", "$type": "color" },
        "600": { "$value": "#7C3AED", "$type": "color" }
      }
    },
    "semantic": {
      "primary": { "$value": "{color.brand.primary.600}", "$type": "color" },
      "primary-hover": { "$value": "{color.brand.primary.700}", "$type": "color" },
      "text-primary": { "$value": "#0F172A", "$type": "color" },
      "bg-default": { "$value": "#FFFFFF", "$type": "color" }
    }
  },
  "spacing": {
    "xs": { "$value": "4px", "$type": "dimension" },
    "sm": { "$value": "8px", "$type": "dimension" }
  }
}
```

Older Style Dictionary (`{ value, type }` without `$` prefix) is still widely used — pick one and stick to it across all tooling.

## Architecture — three layers

```
┌─────────────────────────────────────────────────────────────┐
│ tier 1: primitive tokens                                    │
│   color.brand.primary.{50..950}                             │
│   color.brand.neutral.{50..950}                             │
│   spacing.{xs,sm,md,lg,xl,2xl,3xl}                          │
│   ▶ Hue/value pairs. No semantics. Stable forever.          │
└─────────────────────────────────────────────────────────────┘
                            │ referenced by
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ tier 2: semantic tokens                                     │
│   color.semantic.primary           → primary.600            │
│   color.semantic.bg-default        → neutral.50             │
│   color.semantic.text-primary      → neutral.900            │
│   spacing.gap-component-y          → spacing.md             │
│   ▶ Names describe purpose. Re-aliasable per theme/mode.    │
└─────────────────────────────────────────────────────────────┘
                            │ referenced by
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ tier 3: component tokens                                    │
│   button.primary.bg                → semantic.primary       │
│   button.primary.text              → semantic.on-primary    │
│   button.padding.x                 → spacing.gap-component-x│
│   ▶ Per-component overrides. Optional layer.                │
└─────────────────────────────────────────────────────────────┘
```

Most projects need tiers 1 + 2. Tier 3 only when components routinely need overrides outside the semantic layer.

## Workflow A — code is source of truth

### A1. Author tokens

Edit the canonical JSON file. For this repo, the source-of-truth file is in your consuming product (e.g., `<product-repo>/tokens/source.json`). design-ai provides:

- The reference shape (in `examples/palette-saas-violet.md`).
- Rules for naming, ramp construction, contrast validation (in `knowledge/colors/`).

### A2. Generate platform mirrors via Style Dictionary

```bash
npm install -D style-dictionary
```

`style-dictionary.config.json`:

```json
{
  "source": ["tokens/source.json"],
  "platforms": {
    "css": {
      "transformGroup": "css",
      "buildPath": "src/styles/",
      "files": [{ "destination": "tokens.css", "format": "css/variables" }]
    },
    "tailwind": {
      "transformGroup": "js",
      "buildPath": "src/styles/",
      "files": [{ "destination": "tokens.tailwind.js", "format": "javascript/module" }]
    },
    "ios": {
      "transformGroup": "ios-swift",
      "buildPath": "ios/Tokens/",
      "files": [{ "destination": "DesignTokens.swift", "format": "ios-swift/class.swift", "className": "DesignTokens" }]
    }
  }
}
```

```bash
npx style-dictionary build
```

Outputs:
- `src/styles/tokens.css` — CSS custom properties
- `src/styles/tokens.tailwind.js` — Tailwind theme extension
- `ios/Tokens/DesignTokens.swift` — Swift constants

CI lint: ensure built files are up-to-date with source. If not, fail the PR (forces engineers to commit the regen).

### A3. Mirror to Figma

Tokens Studio plugin → `Sync from Git` (Tokens Studio Pro) or manual `Import JSON`. The Figma file's Variables now match the source.

Maintain in CI: a nightly job exports Figma variables and diffs against `tokens/source.json`. Drift triggers a Slack alert.

## Workflow B — Figma is source of truth

For teams where designers maintain tokens in Figma and engineers consume.

### B1. Author in Figma

Designers create Variables in Figma (`Local variables` panel). Use Tokens Studio plugin for rich token features (themes, multi-mode, references).

### B2. Export to JSON

- Tokens Studio plugin: `Tools → Export → Tokens Studio JSON`.
- Or Figma REST API: `GET /v1/files/<key>/variables/local`.

Land the export in `<product-repo>/tokens/source.json`.

### B3. Generate platform mirrors

Same as workflow A2 — Style Dictionary builds CSS, Tailwind, etc.

### B4. CI gate

A GitHub Action runs on PR open:
1. Pulls latest Figma export.
2. Diffs against committed `tokens/source.json`.
3. If different, fails PR with a "Figma tokens out of sync" message.

## Validation rules (independent of direction)

Every token PR — whether changing source.json or arriving from Figma — must pass:

1. **Contrast check**: every `text` token has ≥ 4.5:1 against its expected `bg`. Use a CI script reading [`knowledge/a11y/contrast.md`](../knowledge/a11y/contrast.md) ratios.
2. **Reference resolution**: no broken aliases. `color.semantic.primary → {color.brand.primary.600}` must resolve.
3. **Type consistency**: a token referencing a `color` must be `$type: color`. No `$type: number → color` aliases.
4. **No raw hex in semantic layer**: `color.semantic.primary` must alias a primitive, not be a hex literal. Catch via lint.
5. **Mode parity**: every token defined in light mode must have a dark mode value. Empty dark = warn.
6. **Naming consistency**: kebab-case file paths, dot-separated token paths. No mixed conventions.

Sample lint script structure:

```ts
// tokens-lint.ts
import { resolve } from "style-dictionary/utils";
import contrast from "wcag-contrast";

function lint(tokens) {
  const issues = [];
  // 1. Reference resolution
  const flat = resolve(tokens);
  // 2. Contrast for text-on-bg pairs
  const pairs = [["text-primary", "bg-default"], ["text-secondary", "bg-default"]];
  for (const [textKey, bgKey] of pairs) {
    const ratio = contrast.hex(flat[`color.semantic.${textKey}`].$value, flat[`color.semantic.${bgKey}`].$value);
    if (ratio < 4.5) issues.push(`${textKey} on ${bgKey} is ${ratio.toFixed(2)}:1 (need 4.5)`);
  }
  // 3. Mode parity, etc.
  return issues;
}
```

## Migration — existing project to tokens

For a project with hardcoded styles:

1. **Inventory**: grep for hex values across the codebase. Group similar hues.
2. **Map to a curated palette**: pick the closest match from [`knowledge/colors/palettes-by-product-type.md`](../knowledge/colors/palettes-by-product-type.md).
3. **Build primitive ramp** for the canonical brand color (use `color-palette` skill).
4. **Replace hardcoded values one section at a time** — start with most-frequent.
5. **Add a CI lint** that fails PRs with new hex values in source files (allows only token references).

Budget: ~1 week for a small product (5–10 components), ~1 month for a large one.

## Tools comparison

| Tool | Strength | Weakness |
| --- | --- | --- |
| **Style Dictionary** | Multi-platform output, maintained by Amazon, mature | Config-heavy; small DSL learning curve |
| **Tokens Studio (Figma plugin)** | Best Figma-side authoring; rich type support | Free tier limited; sync requires paid tier |
| **Theo** (Salesforce) | Older, simpler | Largely superseded by Style Dictionary |
| **Specify** | Hosted token platform with Figma + code sync | SaaS dependency, paid |
| **Knapsack** | Token + design system platform | Heavier; suits larger orgs |
| **W3C DTCG format** | Format standard, not a tool | Spec is still evolving |

For most projects: **Style Dictionary + Tokens Studio plugin (free tier) + manual import**. The Style Dictionary side is automated; the Figma sync is manual every few weeks.

## Cross-reference

- [docs/FIGMA-INTEGRATION.md](FIGMA-INTEGRATION.md) — Figma-specific workflows
- [knowledge/colors/color-theory.md](../knowledge/colors/color-theory.md) — palette construction
- [knowledge/a11y/contrast.md](../knowledge/a11y/contrast.md) — contrast validation rules
- [examples/palette-saas-violet.md](../examples/palette-saas-violet.md) — reference token output
