# Palette: <name>

> Seed: `<input>` · Mood: `<adjective list>` · Target: `<framework>`

## Why this palette

<2–4 sentences. What problem this solves, what brand position it claims, what tradeoffs were accepted.>

## Tokens

### Brand ramps

| Step | Primary | Accent | Neutral |
| --- | --- | --- | --- |
| 50 | `#...` | `#...` | `#...` |
| 100 | `#...` | `#...` | `#...` |
| ...
| 950 | `#...` | `#...` | `#...` |

### Semantic aliases — light

| Token | Value | Notes |
| --- | --- | --- |
| `--color-primary-default` | `#...` | hits 4.5:1 on white |
| `--color-primary-hover` | `#...` | |
| `--color-primary-active` | `#...` | |
| `--color-primary-subtle` | `#...` | background |
| `--color-on-primary` | `#...` | text/icon on primary |
| `--color-bg-default` | `#...` | |
| `--color-bg-elevated` | `#...` | |
| `--color-text-primary` | `#...` | |
| `--color-text-secondary` | `#...` | |
| `--color-text-disabled` | `#...` | |
| `--color-border-default` | `#...` | |
| `--color-success` | `#...` | |
| `--color-warning` | `#...` | |
| `--color-error` | `#...` | |
| `--color-info` | `#...` | |

### Semantic aliases — dark

<same shape, recomputed values>

## Contrast matrix

| Pair | Ratio | AA | AAA |
| --- | --- | --- | --- |
| text-primary on bg-default | 13.8:1 | ✓ | ✓ |
| primary-default on white | 4.6:1 | ✓ | — |
| primary-default on bg-default | 4.5:1 | ✓ | — |
| text-secondary on bg-default | 7.1:1 | ✓ | ✓ |
| border-default on bg-default | 3.0:1 | ✓ (UI) | — |
| ...

## Output: Tailwind v4

```css
@theme {
  --color-primary-50:  #...;
  --color-primary-100: #...;
  /* ... */
}
```

## Output: shadcn-ui (CSS vars)

```css
:root {
  --primary: #...;
  --primary-foreground: #...;
  /* ... */
}

.dark {
  /* ... */
}
```

## Output: Style Dictionary (JSON)

```json
{
  "color": {
    "primary": {
      "50":  { "value": "#..." },
      "100": { "value": "#..." }
    }
  }
}
```

## Use guidance

- Reach for **primary** for: <list>
- Reach for **accent** for: <list>
- Reach for **neutral** for: <list>
- **Don't**: <list common misuses>

## Cited sources

- [knowledge/colors/color-theory.md](../../knowledge/colors/color-theory.md)
- [knowledge/colors/palettes-by-product-type.md](../../knowledge/colors/palettes-by-product-type.md)
- [knowledge/a11y/contrast.md](../../knowledge/a11y/contrast.md)
