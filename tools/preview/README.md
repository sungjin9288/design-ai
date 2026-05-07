# Preview tools

Tools that turn design-ai's structured outputs (markdown specs, JSON tokens) into something humans can visually inspect.

## render-tokens.py

Extracts color tokens from a markdown file and renders an interactive HTML preview with:

- Light + dark mode token swatches
- WCAG contrast matrix
- Light/dark theme toggle
- Live component previews (Button, Input, Alert, Card) using the actual tokens

### Usage

```bash
# Generate alongside the source file (default)
python3 tools/preview/render-tokens.py examples/palette-saas-violet.md
# → examples/palette-saas-violet.preview.html

# Specify output
python3 tools/preview/render-tokens.py examples/palette-saas-violet.md /tmp/preview.html

# Open in browser
open examples/palette-saas-violet.preview.html
```

### What it accepts

- `examples/palette-*.md` — palette specs
- `examples/dogfood-*.md` — full system bootstraps
- Any markdown file containing CSS code blocks with `--token-name: value;` declarations

### What it extracts

- Token names matching `--<name>: <value>;` in code blocks
- Light tokens from blocks scoped to `:root`
- Dark tokens from blocks scoped to `.dark`
- Hex values from each token (for swatches and contrast computation)

### Output is gitignored

`*.preview.html` is in `.gitignore`. Each user regenerates locally for review. The markdown source is the authoritative artifact.

### When to use

- After running `/palette-from-brand` or `/design-from-brief` — visual sanity check before sharing the design.
- During `/iterate` — see before/after by generating two previews.
- Before handoff — give engineering a visual reference alongside the markdown spec.

### Limitations

- HTML/CSS only. No real React components.
- Doesn't render OKLCH literally (uses hex extracted from the file).
- Only shows the components hard-coded in the template. Customizing requires editing `render-tokens.py`.
- Doesn't validate API claims (only color values).

For richer previews — e.g., rendering all 19 component specs as live React components — that's a Phase 4 item (HTML preview generator + Storybook export).
