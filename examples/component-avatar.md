# `Avatar` — spec

> Citing Ant Design `Avatar`, MUI `Avatar`, shadcn-ui `avatar`

## Purpose

A small visual representation of a user, group, or entity. Optimized for image, with deterministic fallbacks (initials, then default icon) when image is missing or fails to load.

## Anatomy

```
[image]              [initials]          [default icon]      [group → cluster]
   ◯                    ◯                    ◯                ◯◯◯+2
                     "김민지"                                
                       MJ                                     
```

## API

```tsx
<Avatar
  src="/avatars/minji.jpg"
  alt="김민지"
  fallback="민지"
  size="md"
/>

<AvatarGroup max={4} size="sm">
  <Avatar src="..." alt="A" fallback="A" />
  <Avatar src="..." alt="B" fallback="B" />
  <Avatar src="..." alt="C" fallback="C" />
  <Avatar src="..." alt="D" fallback="D" />
  <Avatar src="..." alt="E" fallback="E" />
</AvatarGroup>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | — | Image URL |
| `alt` | `string` | — | Alt text. Required if `src` set. |
| `fallback` | `string \| ReactNode` | first 1–2 chars of `alt` | Initials, emoji, or custom node when image fails/missing |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` or `number` | `"md"` | |
| `shape` | `"circle" \| "rounded"` | `"circle"` | `rounded` for org / company avatars |
| `bgColor` | `string` | derived from name hash | Background when showing fallback |
| `status` | `"online" \| "offline" \| "away" \| "busy"` | — | Optional indicator dot |
| `loading` | `boolean` | `false` | Show skeleton variant |

### AvatarGroup

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `max` | `number` | `5` | Visible avatars before "+N" |
| `size` | same as Avatar | `"md"` | Applied to all children |
| `direction` | `"row" \| "row-reverse"` | `"row-reverse"` | Stacking order (rightmost overlaps leftmost when row-reverse) |

## Sizes

| Size | Diameter | Font (initials) |
| --- | --- | --- |
| `xs` | 16px | 9px |
| `sm` | 24px | 11px |
| `md` (default) | 32px | 13px |
| `lg` | 48px | 16px |
| `xl` | 64px | 22px |
| Hero (custom number) | 96px+ | 28px+ |

## Fallback strategy

```
1. Try image (src)
2. On image error → render initials (fallback)
3. If no fallback or empty → render default user icon
```

Initials rules:
- Latin: 1–2 uppercase chars from first name + last name (e.g., "Jane Smith" → "JS").
- Korean: usually 1 char (성 — surname). "김민지" → "민" or "김". Pick one and be consistent. Many KR apps prefer the given name's first syllable (`민`) over surname (`김`).
- Empty / unknown: default user icon.

### Background color from name

Hash the name to a stable color from a curated palette of 8–12 colors. Same name always gets same color across the app:

```ts
const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
const bg = colors[hash % colors.length];
```

Pick colors with text readable in white.

## States

| State | Visual |
| --- | --- |
| Loading image | Skeleton placeholder, 4–6 sec timeout to fallback |
| Image loaded | Cropped to circle, `object-fit: cover` |
| Image failed | Fallback (initials or icon) |
| With status indicator | Small dot at bottom-right (1/4 of diameter, 2px white border) |

## Tokens consumed

```
--color-bg-subtle              (default fallback bg)
--color-text-primary           (initials text on light fallback)
--color-text-on-fallback        (initials text — usually white)
--color-border-default          (status dot border, group offset)
--color-success                 (online status)
--color-text-tertiary           (offline)
--color-warning                 (away)
--color-error                   (busy / do-not-disturb)
--radius-full                   (circle)
--radius-md                     (rounded square)
```

## Group behavior

```
●●●●● +3
```

- Avatars overlap by 25–30% of their width (depending on size).
- The "+N" item is the same size as avatars, with `--color-bg-subtle` background and `--color-text-primary` text.
- Hover/focus on "+N" shows a Popover or Tooltip with the full list.
- Direction: `row-reverse` is the default stacking order (rightmost on top), looks more natural in LTR.

## Accessibility

- `<img alt="...">` for image avatars. **Don't omit alt** — even if you think the image is decorative, the user's name matters for context.
- Initials fallback should also include `aria-label="Jane Smith"` or wrap text in `aria-hidden="true"` if the avatar has a separate visible name nearby.
- Default icon (no fallback): `aria-label="User"` or appropriate generic.
- Avatar group "+N": `aria-label="3 more"` or `"3 more users"`.
- Avatar inside a clickable card / button: don't make avatar separately clickable — let the parent handle.
- For large hero avatars used as buttons (e.g., "change avatar"): `<button>` wrapper with proper label.

## Code example

```tsx
// Standard user avatar
<Avatar src={user.photoUrl} alt={user.name} fallback={initials(user.name)} />

// Avatar with status (online indicator)
<Avatar src={user.photoUrl} alt={user.name} fallback="민지" status="online" />

// Avatar group
<AvatarGroup max={3}>
  {participants.map(p => (
    <Avatar key={p.id} src={p.photoUrl} alt={p.name} fallback={initials(p.name)} />
  ))}
</AvatarGroup>

// Org / company (rounded square)
<Avatar shape="rounded" src={org.logoUrl} alt={org.name} fallback={org.name[0]} />

// Hero size for profile screen
<Avatar src={user.photoUrl} alt={user.name} size={120} />

// Default fallback icon (user has no image, no name)
<Avatar />
```

## Edge cases

- **Image takes too long to load**: render fallback after 6s of waiting.
- **Image returns 200 with broken bytes**: catch via `onerror`; render fallback.
- **Image without `alt`**: lint should flag. Don't silently skip alt.
- **Name with emoji**: "김민지 🌸" — strip emoji from initials computation, but keep in `alt`.
- **All-Latin name in Korean app**: still works; initials draw from the Latin name as expected.
- **Anonymous users**: use a stable random ID-based color but a default icon fallback (no initials).
- **Cropping issues**: `object-fit: cover` + `object-position: center`. For face-aware cropping, depend on server-side image processing.
- **Hi-DPI**: serve 2× resolution image for retina; use `srcset` if available.

## Don't

- Don't omit `alt`. Empty avatars have no semantic meaning.
- Don't let initials wrap to two lines — use `overflow: hidden` and clip.
- Don't use rectangular avatars for people. People are circles, organizations can be rounded squares.
- Don't use the same fallback color for every avatar — distinguishable colors help readability.
- Don't put status indicators on avatars where the status isn't meaningful (e.g., a list of past authors — they're not "online").
- Don't wrap avatars in additional buttons for navigation if the parent row is already clickable.

## References

- Ant Design: [`refs/ant-design/components/avatar/`](../refs/ant-design/components/avatar/) — `Avatar`, `Avatar.Group`. `shape="circle" | "square"`. Multi-size + scaling for groups.
- MUI: [`refs/mui/packages/mui-material/src/Avatar/`](../refs/mui/packages/mui-material/src/Avatar/) — `Avatar` + `AvatarGroup`. Falls back to first letter of `children` text.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/avatar.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/avatar.tsx) — Radix Avatar primitive. Composition: `Avatar`, `AvatarImage`, `AvatarFallback`.

## Cross-reference

- [knowledge/i18n/korean-typography.md](../knowledge/i18n/korean-typography.md) — Korean initials conventions
- [knowledge/patterns/list-and-feed.md](../knowledge/patterns/list-and-feed.md) — chat / conversation list avatars
