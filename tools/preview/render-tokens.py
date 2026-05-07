#!/usr/bin/env python3
"""
Render a token-rich palette markdown file into a self-contained HTML preview.

Usage:
  python3 tools/preview/render-tokens.py <input.md> [output.html]
  python3 tools/preview/render-tokens.py examples/palette-saas-violet.md

Accepts:
  - examples/palette-*.md (palette specs with hex tokens)
  - examples/dogfood-*.md (full system bootstraps)
  - any markdown file with hex values in css blocks

Produces:
  - A single-file HTML page with:
    - Token swatches (extracted hex/oklch values)
    - Light + dark mode toggle
    - Computed contrast ratios for text-on-bg pairs
    - Component micro-previews (Button, Card, Input shapes) using the tokens

The output is for visual review by humans — it doesn't need to be
production-ready, just enough to verify token sets look right before
shipping.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from datetime import date

ROOT = Path(__file__).resolve().parents[2]


# --- token extraction --------------------------------------------------------

HEX_RE = re.compile(r"#[0-9A-Fa-f]{3,8}\b")
TOKEN_LINE_RE = re.compile(r"--([a-z][a-z0-9-]*)\s*:\s*([^;]+);")


def extract_tokens(text: str) -> dict[str, dict[str, str]]:
    """Pull `--token-name: value;` from CSS code blocks. Group by light/dark
    based on selector context (`:root` vs `.dark`).

    Returns:
        { "light": { token_name: value, ... }, "dark": { ... } }
    """
    tokens = {"light": {}, "dark": {}}
    in_block = False
    selector = "light"  # default

    for line in text.splitlines():
        stripped = line.strip()

        # Detect code block fences
        if stripped.startswith("```"):
            in_block = not in_block
            continue

        if not in_block:
            continue

        # Detect selector context
        if ":root" in stripped:
            selector = "light"
        elif ".dark" in stripped:
            selector = "dark"

        # Match token lines
        m = TOKEN_LINE_RE.search(stripped)
        if m:
            name, value = m.group(1), m.group(2).strip()
            tokens[selector][name] = value

    return tokens


def normalize_hex(value: str) -> str | None:
    """Pull the first hex from a value string."""
    m = HEX_RE.search(value)
    return m.group(0) if m else None


# --- contrast ----------------------------------------------------------------

def hex_to_rgb(hex_str: str) -> tuple[float, float, float]:
    h = hex_str.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        return (0, 0, 0)
    return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4))


def relative_luminance(rgb: tuple[float, float, float]) -> float:
    def adjust(c: float) -> float:
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (adjust(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(hex1: str, hex2: str) -> float:
    l1 = relative_luminance(hex_to_rgb(hex1))
    l2 = relative_luminance(hex_to_rgb(hex2))
    lighter, darker = max(l1, l2), min(l1, l2)
    return round((lighter + 0.05) / (darker + 0.05), 2)


# --- HTML rendering ----------------------------------------------------------

HTML_TEMPLATE = r"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: __BG_DEFAULT__;
    color: __TEXT_PRIMARY__;
    transition: background-color 200ms, color 200ms;
  }
  .container { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
  header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 1px solid __BORDER_DEFAULT__; }
  header h1 { margin: 0; font-size: 24px; }
  header .meta { color: __TEXT_SECONDARY__; font-size: 13px; }
  .toggle {
    background: __BG_ELEVATED__;
    border: 1px solid __BORDER_DEFAULT__;
    color: __TEXT_PRIMARY__;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
  }
  .toggle:hover { background: __BG_SUBTLE__; }
  section { padding: 32px 0; border-bottom: 1px solid __BORDER_DEFAULT__; }
  section:last-child { border-bottom: 0; }
  h2 { font-size: 18px; margin: 0 0 16px; }
  .swatch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
  .swatch {
    border-radius: 8px;
    border: 1px solid __BORDER_DEFAULT__;
    overflow: hidden;
    background: __BG_ELEVATED__;
  }
  .swatch .chip { height: 64px; }
  .swatch .meta { padding: 8px 12px; }
  .swatch .name { font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: __TEXT_PRIMARY__; }
  .swatch .value { font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: __TEXT_SECONDARY__; margin-top: 2px; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid __BORDER_DEFAULT__; }
  th { font-weight: 600; color: __TEXT_SECONDARY__; }
  .pass { color: __SUCCESS__; font-weight: 600; }
  .fail { color: __ERROR__; font-weight: 600; }
  .components { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .demo-card {
    border-radius: 12px;
    background: __BG_ELEVATED__;
    border: 1px solid __BORDER_DEFAULT__;
    padding: 20px;
  }
  .demo-card h3 { margin: 0 0 8px; font-size: 16px; }
  .demo-card p { margin: 0 0 16px; color: __TEXT_SECONDARY__; font-size: 14px; }
  .demo-btn {
    display: inline-flex;
    align-items: center;
    height: 40px;
    padding: 0 16px;
    border-radius: 8px;
    border: 0;
    font: inherit;
    font-weight: 500;
    cursor: pointer;
    margin-right: 8px;
  }
  .demo-btn--primary { background: __PRIMARY_DEFAULT__; color: __ON_PRIMARY__; }
  .demo-btn--primary:hover { background: __PRIMARY_HOVER__; }
  .demo-btn--outline { background: transparent; color: __TEXT_PRIMARY__; border: 1px solid __BORDER_STRONG__; }
  .demo-btn--outline:hover { background: __BG_SUBTLE__; }
  .demo-input {
    width: 100%;
    height: 40px;
    border-radius: 8px;
    border: 1px solid __BORDER_DEFAULT__;
    background: __BG_DEFAULT__;
    color: __TEXT_PRIMARY__;
    padding: 0 12px;
    font: inherit;
  }
  .demo-input:focus { outline: 2px solid __FOCUS_RING__; outline-offset: 2px; border-color: __PRIMARY_DEFAULT__; }
  .alert {
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 12px;
    font-size: 14px;
  }
  .alert--info    { background: __BG_SUBTLE__;       border-left: 3px solid __INFO__; }
  .alert--success { background: __SUCCESS_SUBTLE__;  border-left: 3px solid __SUCCESS__; }
  .alert--warning { background: __WARNING_SUBTLE__;  border-left: 3px solid __WARNING__; }
  .alert--error   { background: __ERROR_SUBTLE__;    border-left: 3px solid __ERROR__; }
  .empty { color: __TEXT_TERTIARY__; font-style: italic; }
  @media (max-width: 720px) {
    .components { grid-template-columns: 1fr; }
  }
</style>
</head>
<body data-theme="light">
  <div class="container">
    <header>
      <div>
        <h1>__TITLE__</h1>
        <div class="meta">Token preview · generated __DATE__</div>
      </div>
      <button class="toggle" id="theme-toggle">Switch to dark</button>
    </header>

    <section>
      <h2>Color tokens (light)</h2>
      <div class="swatch-grid">__LIGHT_SWATCHES__</div>
    </section>

    <section>
      <h2>Color tokens (dark)</h2>
      <div class="swatch-grid">__DARK_SWATCHES__</div>
    </section>

    <section>
      <h2>Contrast matrix (light)</h2>
      <table>
        <thead><tr><th>Pair</th><th>Ratio</th><th>AA body</th><th>AA UI</th></tr></thead>
        <tbody>__LIGHT_CONTRAST_ROWS__</tbody>
      </table>
    </section>

    <section>
      <h2>Component preview (live tokens)</h2>
      <div class="components">
        <div class="demo-card">
          <h3>Buttons</h3>
          <p>Primary and outline variants in current theme.</p>
          <button class="demo-btn demo-btn--primary">Save changes</button>
          <button class="demo-btn demo-btn--outline">Cancel</button>
        </div>
        <div class="demo-card">
          <h3>Input</h3>
          <p>Focus to see the focus-ring contrast.</p>
          <input class="demo-input" placeholder="Type something..." />
        </div>
        <div class="demo-card">
          <h3>Alerts</h3>
          <div class="alert alert--info">ℹ Info — small announcement.</div>
          <div class="alert alert--success">✓ Success — saved.</div>
          <div class="alert alert--warning">⚠ Warning — check this.</div>
          <div class="alert alert--error">✕ Error — couldn't save.</div>
        </div>
        <div class="demo-card">
          <h3>Sample card</h3>
          <p>Surface elevation in current theme. Border + bg combination.</p>
          <button class="demo-btn demo-btn--primary">Continue</button>
        </div>
      </div>
    </section>
  </div>

  <script>
    const root = document.body;
    const btn = document.getElementById('theme-toggle');
    const styles = {
      light: __LIGHT_VARS__,
      dark: __DARK_VARS__,
    };
    function apply(theme) {
      const vars = styles[theme] || styles.light;
      root.dataset.theme = theme;
      Object.entries(vars).forEach(([k, v]) => {
        document.documentElement.style.setProperty('--' + k, v);
      });
      // Update inline-uses
      document.body.style.background = vars['bg-default'] || '#fff';
      document.body.style.color = vars['text-primary'] || '#000';
      document.querySelectorAll('.demo-card').forEach(el => {
        el.style.background = vars['bg-elevated'] || '#fff';
        el.style.borderColor = vars['border-default'] || '#ddd';
      });
      btn.textContent = theme === 'light' ? 'Switch to dark' : 'Switch to light';
    }
    btn.addEventListener('click', () => {
      apply(root.dataset.theme === 'light' ? 'dark' : 'light');
    });
  </script>
</body>
</html>
"""


def render_swatches(tokens: dict[str, str]) -> str:
    out = []
    for name, value in tokens.items():
        if not name.startswith("color"):
            continue
        hex_val = normalize_hex(value)
        if not hex_val:
            continue
        out.append(f"""<div class="swatch">
  <div class="chip" style="background:{hex_val};"></div>
  <div class="meta">
    <div class="name">--{name}</div>
    <div class="value">{value}</div>
  </div>
</div>""")
    if not out:
        return '<div class="empty">(no color tokens detected — file may not contain a token block)</div>'
    return "\n".join(out)


def render_contrast(tokens: dict[str, str]) -> str:
    pairs = [
        ("color-text-primary", "color-bg-default", "body"),
        ("color-text-secondary", "color-bg-default", "body"),
        ("color-text-tertiary", "color-bg-default", "body"),
        ("color-primary-default", "color-bg-default", "ui"),
        ("color-error", "color-bg-default", "body"),
        ("color-success", "color-bg-default", "body"),
        ("color-warning", "color-bg-default", "body"),
    ]
    rows = []
    for fg_name, bg_name, kind in pairs:
        fg_value = tokens.get(fg_name)
        bg_value = tokens.get(bg_name)
        if not fg_value or not bg_value:
            continue
        fg_hex = normalize_hex(fg_value)
        bg_hex = normalize_hex(bg_value)
        if not fg_hex or not bg_hex:
            continue
        ratio = contrast_ratio(fg_hex, bg_hex)
        body_pass = ratio >= 4.5
        ui_pass = ratio >= 3.0
        rows.append(f"""<tr>
  <td>{fg_name} on {bg_name}</td>
  <td>{ratio}:1</td>
  <td class="{'pass' if body_pass else 'fail'}">{'✓' if body_pass else '✗'}</td>
  <td class="{'pass' if ui_pass else 'fail'}">{'✓' if ui_pass else '✗'}</td>
</tr>""")
    if not rows:
        return '<tr><td colspan="4" class="empty">No measurable text-on-bg pairs in this file.</td></tr>'
    return "\n".join(rows)


def to_js_vars(tokens: dict[str, str]) -> str:
    """JSON-serialize tokens with hex extracted from values."""
    parts = []
    for name, value in tokens.items():
        hex_val = normalize_hex(value)
        if hex_val:
            parts.append(f'"{name}": "{hex_val}"')
        else:
            # Use raw value (e.g., for shadows, motion) — escape quotes
            parts.append(f'"{name}": "{value.replace(chr(34), chr(92) + chr(34))}"')
    return "{" + ", ".join(parts) + "}"


def render_html(input_path: Path, tokens: dict[str, dict[str, str]]) -> str:
    title = input_path.stem.replace("-", " ").replace("_", " ").title()

    light = tokens["light"]
    dark = tokens["dark"]

    # Pull "default" colors for chrome from light tokens with sensible fallbacks
    def get(t: dict[str, str], key: str, fallback: str) -> str:
        return normalize_hex(t.get(key, "")) or fallback

    chrome = {
        "TITLE": title,
        "DATE": date.today().isoformat(),
        "BG_DEFAULT": get(light, "color-bg-default", "#FFFFFF"),
        "BG_ELEVATED": get(light, "color-bg-elevated", "#FAFAFA"),
        "BG_SUBTLE": get(light, "color-bg-subtle", "#F1F5F9"),
        "TEXT_PRIMARY": get(light, "color-text-primary", "#0F172A"),
        "TEXT_SECONDARY": get(light, "color-text-secondary", "#475569"),
        "TEXT_TERTIARY": get(light, "color-text-tertiary", "#64748B"),
        "BORDER_DEFAULT": get(light, "color-border-default", "#E2E8F0"),
        "BORDER_STRONG": get(light, "color-border-strong", "#CBD5E1"),
        "PRIMARY_DEFAULT": get(light, "color-primary-default", "#7C3AED"),
        "PRIMARY_HOVER": get(light, "color-primary-hover", "#6D28D9"),
        "ON_PRIMARY": get(light, "color-on-primary", "#FFFFFF"),
        "FOCUS_RING": get(light, "color-focus-ring", "#A78BFA"),
        "INFO": get(light, "color-info", "#7C3AED"),
        "SUCCESS": get(light, "color-success", "#16A34A"),
        "WARNING": get(light, "color-warning", "#D97706"),
        "ERROR": get(light, "color-error", "#DC2626"),
        "SUCCESS_SUBTLE": get(light, "color-success-subtle-bg", "#F0FDF4"),
        "WARNING_SUBTLE": get(light, "color-warning-subtle-bg", "#FFFBEB"),
        "ERROR_SUBTLE": get(light, "color-error-subtle-bg", "#FEF2F2"),
        "LIGHT_SWATCHES": render_swatches(light),
        "DARK_SWATCHES": render_swatches(dark) if dark else '<div class="empty">(no dark mode tokens in this file)</div>',
        "LIGHT_CONTRAST_ROWS": render_contrast(light),
        "LIGHT_VARS": to_js_vars(light),
        "DARK_VARS": to_js_vars(dark) if dark else "{}",
    }

    out = HTML_TEMPLATE
    for key, value in chrome.items():
        out = out.replace(f"__{key}__", str(value))
    return out


# --- main -------------------------------------------------------------------

def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: render-tokens.py <input.md> [output.html]")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    if not input_path.is_absolute():
        input_path = ROOT / input_path
    if not input_path.exists():
        print(f"Not found: {input_path}")
        sys.exit(2)

    if len(sys.argv) >= 3:
        output_path = Path(sys.argv[2])
        if not output_path.is_absolute():
            output_path = ROOT / output_path
    else:
        output_path = input_path.with_suffix(".preview.html")

    text = input_path.read_text(encoding="utf-8")
    tokens = extract_tokens(text)

    light_count = len(tokens["light"])
    dark_count = len(tokens["dark"])
    if light_count == 0 and dark_count == 0:
        print(f"No tokens found in {input_path}")
        print("(extractor looks for `--token-name: value;` inside ``` code blocks)")
        sys.exit(3)

    html = render_html(input_path, tokens)
    output_path.write_text(html, encoding="utf-8")

    print(f"Read   {input_path.relative_to(ROOT)}")
    print(f"Tokens {light_count} light, {dark_count} dark")
    print(f"Wrote  {output_path.relative_to(ROOT)}")
    print(f"Open:  open {output_path}")


if __name__ == "__main__":
    main()
