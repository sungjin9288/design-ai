# `Link` — spec

> Synthesized from MUI `Link`, Ant Design's link styles, and shadcn-ui's `<a>` patterns. The canonical text link primitive — distinct from `Button` and `Anchor` (TOC nav).

## Link vs Button

> **Links navigate. Buttons do.**

Use `Link` when the action is "go somewhere" (URL change). Use `Button` when the action is "do something" (state change, side effect).

| | Link | Button |
| --- | --- | --- |
| Native element | `<a href>` | `<button>` |
| Default keyboard | Enter activates | Enter / Space activate |
| Default behavior | Navigate | Custom handler |
| Right-click context | Open in new tab | n/a |
| Drag | Drag URL | n/a |
| User expectation | New URL | Stay |

For ambiguous cases ("Sign out" — is that a state change or a navigation to /logout?): pick based on the destination. If `/logout` is a real route, use Link. If it's purely a state action, use Button.

## Anatomy

Inline link in flowing text:

```
The system audits your design system across five layers. See the full
report.
                                                            ↑ link
```

Standalone link (CTA-style):

```
[ → 자세히 보기 ]
```

External link with indicator:

```
Visit our docs ↗
```

## API

```tsx
<Link href="/docs">documentation</Link>
<Link href="https://example.com" external>External site ↗</Link>
<Link href="/profile" as={NextLink}>profile</Link>
<Link variant="standalone">Learn more →</Link>
<Link variant="muted" href="...">Privacy policy</Link>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `href` | `string` | required | Destination URL |
| `external` | `boolean` | auto-detected from URL | Add visual indicator + open-in-new-tab semantics |
| `variant` | `"default" \| "muted" \| "standalone" \| "destructive"` | `"default"` | Visual style |
| `underline` | `"hover" \| "always" \| "none"` | `"hover"` | When underline is visible |
| `as` | Component | `"a"` | Render as router-aware Link (NextLink, react-router Link) |
| `disabled` | `boolean` | `false` | Disabled (rare for links; usually means "not yet available") |

## Variants

### `default` (in-flow link)

Brand-colored, underline on hover (or always for accessibility-strict contexts). Used inline within paragraphs.

### `muted`

Gray, less prominent. For secondary links (legal, footer, "skip").

### `standalone`

CTA-style link, often with arrow indicator. Used as a section's primary navigation:

```tsx
<Link variant="standalone" href="/learn-more">
  Learn more <ArrowRightIcon />
</Link>
```

Larger touch target; bolder weight.

### `destructive`

Red. For "Delete account", "Cancel subscription" — actions that remove data. Pair with confirmation flow if irreversible.

## Underline policies

| Setting | When |
| --- | --- |
| `hover` (default) | Body text in well-styled pages — link is brand-colored already |
| `always` | Long-form content, accessibility-strict, when link can't be color-distinguished |
| `none` | Standalone CTAs that have arrow indicator + clear context |

WCAG note: links must be distinguishable from surrounding text by **more than color alone**. If your design relies on color only: enable `underline="always"` to satisfy WCAG.

## States

| State | Visual |
| --- | --- |
| Default | Brand color (or muted), underline policy applies |
| Hover | Underline visible (if hover policy); subtle color shift |
| Visited | Optional muted color shift (rare in modern apps) |
| Active (during click) | Slightly deeper color |
| Focus-visible | 2px focus ring AROUND link (preserve underline) |
| Disabled | `aria-disabled="true"`, gray text, no events |

## External link

```tsx
<Link external href="https://example.com">Docs ↗</Link>
```

Adds:
- `target="_blank"` (new tab)
- `rel="noopener noreferrer"` (security)
- Visual indicator (↗ arrow OR external icon)
- `aria-label` extension: "Docs (opens in new tab)" for screen readers

```html
<a href="https://example.com"
   target="_blank"
   rel="noopener noreferrer"
   aria-label="Docs (opens in new tab)">
  Docs <ExternalIcon aria-hidden="true" />
</a>
```

## Tokens consumed

```
--color-link-default               (typically brand color)
--color-link-hover
--color-link-visited               (optional)
--color-link-active
--color-link-muted
--color-link-destructive
--color-focus-ring
--text-decoration-thickness        (1-2px underline)
--text-underline-offset            (3-4px below text baseline)
--motion-fast                      (color transition)
```

## Accessibility

- Always use `<a>` (or framework Link). Don't fake a link with `<div onClick>`.
- For non-text links (icon-only): `aria-label` required.
- Focus-visible ring must be visible against any background.
- Don't disable `pointer-events` to make a "disabled" link — use `aria-disabled="true"` and prevent navigation in the click handler.
- For links that look like buttons (CTA-style): users expect them to navigate; if they trigger a state action, use Button.
- Korean: identical accessibility rules apply. Hangul links should not be color-only either.

## Korean conventions

- 한국어 link 스타일은 일반적으로 영문보다 underline 사용이 약간 더 적극적 (Hangul 글자에서 underline 가독성이 좋음).
- 외부 링크 표시: ↗ 또는 ↪ 화살표 + "(새 창에서 열림)" sr-only 텍스트.
- "더보기 →" / "자세히 보기 →" / "전체 보기" — common standalone link copy.
- For B2C: 해요체 ("자세히 보기"); for B2B: 합쇼체 ("더 알아보기").

## Code example

```tsx
function ArticleFooter() {
  return (
    <footer className="article-footer">
      <p>
        이 글은 <Link href="/authors/sungjin">박성진</Link>이 작성했어요.
        <Link href="https://blog.example.com" external>블로그</Link>에서
        더 많은 글을 확인할 수 있어요.
      </p>
      <Link variant="standalone" href="/articles">
        모든 글 보기 <ArrowRightIcon />
      </Link>
    </footer>
  );
}
```

## With Next.js / React Router

```tsx
import NextLink from "next/link";

<Link as={NextLink} href="/docs">documentation</Link>
```

The `as` prop swaps the underlying element from `<a>` to a router-aware Link. This preserves design-ai's styling but uses client-side routing.

## Edge cases

- **Disabled link**: rare; typically means "not yet available". Use `aria-disabled` + click handler that prevents nav. Don't use `pointer-events: none` (still focusable, confusing).
- **Link wrapping multiple lines**: ensure underline appears on each line, not just the first. Default browser behavior; verify in your CSS reset.
- **Email link**: `<Link href="mailto:hello@example.com">` works; consider `mailto:` link best practices.
- **Phone link** (mobile): `<Link href="tel:+8210...">`.
- **Anchor link** (`#section`): scroll behavior + browser history. Use smooth scroll if appropriate.
- **Protocol-relative**: avoid `//example.com` — fully qualify.
- **RTL**: arrow direction flips automatically if using `→` / `←` SVG. For text arrows, use logical names (`block-start`, `inline-start`).
- **Reduced motion**: skip color transition.

## Don't

- Don't use Link as a button (state action). Use Button.
- Don't omit `target="_blank"` external indicator. Users hate context-loss.
- Don't ship Link with `target="_blank"` without `rel="noopener"`. Security.
- Don't disable underline AND make link only differentiated by color. WCAG fail.
- Don't open EVERY link in a new tab. User-hostile.
- Don't put long descriptive text inside link — extract a short label, use the surrounding paragraph for context.

## References

- HTML5 `<a>` element
- MUI: [`Link`](../refs/mui/packages/mui-material/src/Link)
- Ant Design: link styling within `Typography`
- WCAG 2.1: SC 1.4.1 (Use of Color), SC 2.4.4 (Link Purpose)

## Cross-reference

- [`examples/component-button.md`](component-button.md) — when action is not navigation
- [`examples/component-anchor.md`](component-anchor.md) — table-of-contents nav (different use)
- [`examples/component-typography.md`](component-typography.md) — text primitives
- [`knowledge/a11y/contrast.md`](../knowledge/a11y/contrast.md)
