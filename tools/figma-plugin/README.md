# Figma plugin: design-ai token importer

Scaffold for a Figma plugin that imports design-ai's token output (W3C DTCG / Style Dictionary JSON) into Figma as Variables. Plus Code Connect example mappings for the most-used components.

> **Status: scaffold.** This is a working starting point — finalize, build, and test before publishing to the Figma Community.

## What's here

```
tools/figma-plugin/
├── manifest.json                        # Figma plugin manifest
├── src/
│   ├── code.ts                          # plugin sandbox code (the part that talks to Figma)
│   └── ui.html                          # plugin UI (paste tokens, click Import)
├── code-connect-examples/
│   ├── Button.figma.tsx                 # how to map a Button main-component to React code
│   ├── Input.figma.tsx
│   └── Card.figma.tsx
└── README.md                            # (this file)
```

## How the plugin works

1. User opens the plugin in Figma Desktop.
2. Pastes a token JSON (W3C DTCG / Style Dictionary format) into the textarea.
3. Clicks "Import".
4. The plugin creates a Variable Collection per top-level key (color / spacing / typography), with Variables for each token (flattened dot-separated names).
5. Variables are then assignable to layers in Figma.

The token format expected matches what `tools/preview/render-tokens.py` reads and what `examples/palette-*.md` outputs.

## Building the plugin

This scaffold uses TypeScript. To build:

```bash
cd tools/figma-plugin

# Initial setup (one-time)
npm init -y
npm install -D typescript @figma/plugin-typings esbuild

# Add a build script to package.json:
#   "build": "esbuild src/code.ts --bundle --target=es2020 --outfile=build/code.js && cp src/ui.html build/ui.html"

npm run build
```

After building, install in Figma:

1. Figma desktop → Plugins → Development → Import plugin from manifest…
2. Select `tools/figma-plugin/manifest.json`.
3. Run from Plugins → Development → design-ai token importer.

## Code Connect setup

Code Connect maps Figma main components to your real React code. Once mapped, designers see actual code snippets in Figma's Inspect panel.

### Per-product setup

In the **product repo** (not in design-ai):

```bash
npm install -D @figma/code-connect
npx figma connect connect    # initial config (one-time per repo)
```

Copy the relevant `*.figma.tsx` from `code-connect-examples/` to your product repo (next to the actual component file). Replace:

- The import path: `from "./Button"` → your real Button component
- The Figma URL: paste from Figma (right-click main component → Copy link)
- The variant enum keys: match your actual Figma variant names

### Publish

```bash
npx figma connect publish
```

This uploads the mapping to Figma. After publish, designers see the mapped code in the Inspect panel for any instance of the connected component.

## Limitations of this scaffold

- **No OKLCH support**: Figma Variables don't natively support OKLCH. Convert to hex before importing. (`tools/preview/render-tokens.py` only extracts hex anyway, so this is rarely a problem in practice.)
- **No mode (light/dark) handling**: this scaffold imports into the default mode. Multi-mode requires additional logic to map JSON's separate light/dark groups to Figma Variable modes.
- **No reference resolution**: tokens like `{ "$value": "{color.brand.primary.600}" }` aren't resolved to references between Variables — they're treated as raw strings. Adding reference resolution requires walking the token tree twice (first pass: create primitives; second pass: resolve aliases).
- **No dimension scaling**: `"12px"` is parsed as `12`. If your Figma uses points/dp/different unit systems, adjust `parseValue`.

These are documented as TODOs in `src/code.ts`. Production-ready implementations exist as paid plugins (Tokens Studio for Figma, Specify) — this scaffold is for teams who want to roll their own.

## Alternative: just use Tokens Studio

For most teams: install **Tokens Studio for Figma** instead. It handles W3C DTCG imports with reference resolution, multi-mode, sync to Git, etc. — much more capable than this scaffold.

This scaffold exists for teams that:
- Need a custom workflow not covered by Tokens Studio
- Want to embed token import in a larger plugin
- Want to learn the Figma Plugin API

For straightforward token sync: use Tokens Studio. See [`docs/FIGMA-INTEGRATION.md`](../../docs/FIGMA-INTEGRATION.md).

## Cross-reference

- [`docs/FIGMA-INTEGRATION.md`](../../docs/FIGMA-INTEGRATION.md) — workflow overview
- [`docs/TOKEN-SYNC.md`](../../docs/TOKEN-SYNC.md) — token sync between code and Figma
- [`docs/PLUGIN-PACKAGING.md`](../../docs/PLUGIN-PACKAGING.md) — plugin packaging strategy
- [`tools/preview/render-tokens.py`](../preview/render-tokens.py) — generates the JSON this plugin imports
- [Figma Plugin API docs](https://www.figma.com/plugin-docs/)
- [Figma Code Connect docs](https://www.figma.com/code-connect-docs/)
