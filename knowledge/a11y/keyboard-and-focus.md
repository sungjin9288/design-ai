<!-- hand-written -->
---
title: Keyboard and focus — WCAG operable
applies_to: [web, all-ui]
---

# Keyboard and focus

Every interactive element on screen must be operable by keyboard alone, with a visible focus indicator at every step. This is non-negotiable for AA compliance and for ~7% of users.

## Tab order rules

- Logical reading order. Tab follows the visual reading order — top-to-bottom, left-to-right (or RTL equivalent).
- Skipping with `tabindex="-1"`: removes the element from the tab order but keeps it focusable programmatically. Use for items focused by code (e.g., modal title focused on open).
- **Never** use `tabindex` ≥ 1. It overrides natural order and creates inconsistencies.
- Hidden/disabled elements: `display:none`, `visibility:hidden`, `disabled` — auto-removed.
- Decorative interactive-looking divs: must have `role` and `tabindex="0"` to be reachable, OR not be interactive.

## Focus indicators

Required by WCAG 2.4.11 (AA in 2.2).

| Property | Minimum |
| --- | --- |
| Thickness | 2 CSS px outline OR equivalent area |
| Contrast | 3:1 against adjacent colors (the element's normal color AND its background) |
| Coverage | Encloses the element fully OR fills it with a 3:1+ contrast change |

```css
/* Good — works on light and dark backgrounds */
button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Better for design systems — token-driven */
button:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

/* DO NOT do this */
*:focus { outline: none; }  /* removes a11y, fails 2.4.7 */
```

`:focus-visible` (modern browsers) keeps focus rings on keyboard nav but hides them for mouse clicks — users who don't want them are not disturbed, keyboard users are protected.

## Required keyboard interactions per pattern

| Component | Keys |
| --- | --- |
| Button | `Enter`, `Space` activate. |
| Link | `Enter` activates. (Not space — that scrolls.) |
| Menu / Dropdown | `↑/↓` move, `Enter` activate, `Escape` close, `Home/End` first/last. |
| Tabs | `←/→` move (`↑/↓` if vertical), `Home/End` first/last, `Enter/Space` activate (or auto-activate for some patterns). |
| Combobox | `↓` open, `↑/↓` navigate options, `Enter` select, `Escape` close, type-ahead supported. |
| Modal / Dialog | Open: focus moves into dialog. `Escape` closes. Focus is **trapped** until close. On close: focus returns to the trigger. |
| Slider | `←/↓` decrement, `→/↑` increment, `Home` min, `End` max, `PageUp/Down` larger step. |
| Tree | `↑/↓` move, `←` collapse / move to parent, `→` expand / move to first child, `Enter` activate. |
| Toggle / Switch | `Space` toggles. (Not Enter unless `<button>`-typed.) |
| Date picker | Within calendar grid: arrow keys move days, `PageUp/Down` months, `Shift+PgUp/Dn` years. |

Source: [W3C ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) — the canonical reference for keyboard patterns.

## Focus management on route change (SPA)

When a client-side route changes:
- Move focus to the new page's `<h1>` (or main landmark).
- Update document title (so screen reader announces the new context).
- Without this, screen reader users hear nothing — the route change is invisible.

```ts
// On route change
useEffect(() => {
  document.title = newTitle;
  document.querySelector('h1')?.focus();
}, [route]);
```

## Touch target sizing

WCAG 2.5.5 (Level AAA) and 2.5.8 (Level AA in 2.2) require:

| Standard | Minimum |
| --- | --- |
| WCAG 2.2 AA (Target Size — Minimum) | **24×24 CSS px** |
| WCAG 2.1 AAA (Target Size) | **44×44 CSS px** |
| iOS HIG | 44×44 pt |
| Material guidelines | 48×48 dp |

For consumer mobile UIs, **target 44×44 minimum**. Smaller is allowed only when:
- Equivalent target available elsewhere on the page, OR
- Inline within a sentence (e.g., link in body text).

Spacing matters too: a 24×24 button surrounded by enough space to count as a 44×44 hit area is better than a tightly-packed grid of 32×32 buttons.

## Common failures to flag in review

- `<div onClick>` with no `role` and no tab support.
- Placeholder used as label (`<input placeholder="Email">` with no `<label>`).
- Modal that steals focus on open but doesn't return it on close.
- `Escape` on dropdown closes the page modal too (event bubbling).
- Custom select with no type-ahead.
- Focus ring removed globally with `outline: none`.
- Carousel that auto-advances and traps focus.
