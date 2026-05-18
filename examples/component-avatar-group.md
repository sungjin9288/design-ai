# `AvatarGroup` - spec

> Direct upstream component: MUI `AvatarGroup`. Parent pattern references: Ant Design `Avatar.Group`, MUI `AvatarGroup`, shadcn-ui avatar examples.

## Purpose

`AvatarGroup` shows a compact set of people or entities by overlapping avatars and summarizing overflow as a surplus item such as `+3`. Use it in collaboration surfaces, assignee lists, chat participants, document viewers, and activity feeds.

Use a text list instead when the user must compare every participant name.

## Anatomy

```
AvatarGroup
├── Avatar item 1
├── Avatar item 2
├── Avatar item 3
└── Surplus item       optional; "+N" or custom renderer
```

| Part | Required | Purpose |
| --- | --- | --- |
| Root | yes | Groups stacked avatars as one visual unit. |
| Avatar child | yes | Individual `Avatar` components or compatible nodes. |
| Surplus item | conditional | Represents hidden participants when `total > max`. |
| Tooltip/popover | optional | Reveals hidden names when surplus is interactive. |

## API

```tsx
<AvatarGroup
  max={4}
  total={project.members.length}
  renderSurplus={(count) => `+${count}`}
>
  {project.members.slice(0, 4).map((member) => (
    <Avatar key={member.id} src={member.photoUrl} alt={member.name} />
  ))}
</AvatarGroup>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | Avatars to stack. |
| `classes` | `Partial<AvatarGroupClasses>` | - | Style override hooks for MUI-style implementations. |
| `component` | `React.ElementType` | `"div"` | Root element override. Use semantic list elements when names are meaningful content. |
| `max` | `number` | `5` | Maximum visible avatars before showing surplus. |
| `renderSurplus` | `(surplus: number) => ReactNode` | - | Custom surplus renderer. Keep accessible text. |
| `spacing` | `"small" \| "medium" \| number` | `"medium"` | Overlap distance between avatars. |
| `slots` | `{ surplus?: React.ElementType }` | - | Slot override for surplus item. |
| `slotProps` | `{ surplus?: object }` | - | Props forwarded to surplus slot. |
| `sx` | `SxProps<Theme>` | - | MUI system override. Prefer tokens for shared design-system code. |
| `total` | `number` | `children.length` | Total count when only a subset of avatars is rendered. |
| `variant` | `"circular" \| "rounded" \| "square"` | `"circular"` | Shape passed to visible avatars and surplus. |

## API choices made

- Keep `max`, `total`, and `renderSurplus` because they solve the common virtualized/partial-render participant case.
- Keep `spacing` as a token-mapped prop, but prefer named values over arbitrary numbers in product code.
- Do not add `size` to this thin spec because parent `Avatar` already owns sizing. A product wrapper may pass size to children.
- Use composition over an `items` prop so existing `Avatar` fallback, status, and image behavior stay intact.

## States

| State | Trigger | Visual rule |
| --- | --- | --- |
| Default | `children.length <= max` | Avatars overlap by a tokenized offset and share a border ring. |
| Surplus | `total > max` | Last visible item displays surplus count with same size/shape as avatars. |
| Hover | Pointer over interactive avatar/surplus | Raise z-index and show tooltip/popover only if the item is actionable. |
| Focus-visible | Keyboard focus on interactive child | 2px focus ring, not clipped by overlap. |
| Active | Press interactive surplus | Pressed state belongs to the surplus button/popover trigger. |
| Disabled | Parent surface disabled | Avoid interactive affordances; avatars remain visible but muted only if the parent is disabled. |
| Loading | Participants loading | Use skeleton avatars with fixed group width to avoid layout shift. |
| Error | Failed participant load | Fall back to initials/default avatar; do not hide the person. |

## Tokens consumed

```
--avatar-size-sm
--avatar-size-md
--avatar-size-lg
--avatar-overlap-sm
--avatar-overlap-md
--color-bg-default
--color-bg-subtle
--color-text-primary
--color-text-secondary
--color-border-default
--color-focus-ring
--radius-full
--radius-md
```

If these avatar tokens do not exist, map them to the existing size, spacing, border, and radius tokens instead of adding raw values.

## Accessibility

- If the group conveys meaningful membership, render as `<ul aria-label="참여자">` with each avatar in an `<li>`.
- If visible names already appear adjacent to the group, the avatar images can be hidden from the accessibility tree to avoid duplicate announcements.
- Each image avatar still needs correct `alt` text when it is the only name representation.
- Surplus item needs an accessible name such as `aria-label="외 3명"`.
- If surplus opens a popover, it must be a real `<button>` and the popover must list the hidden names.
- Interactive avatars must meet 44x44 mobile touch target. For smaller visual avatars, extend hit area without changing visual size.

## Layout rules

| Rule | Value |
| --- | --- |
| Stacking | Later avatars sit visually above earlier avatars in LTR unless `direction` is explicitly reversed by a wrapper. |
| Border ring | Use `--color-bg-default` or parent surface color so overlap remains legible. |
| Overlap | About one quarter to one third of avatar size; use tokens. |
| Surplus | Same size and shape as avatars; do not use a loose text label outside the stack. |
| RTL | Reverse margin direction with logical CSS. |

## Code example

```tsx
<AvatarGroup
  component="ul"
  aria-label="프로젝트 참여자"
  max={4}
  total={members.length}
  renderSurplus={(count) => (
    <button type="button" aria-label={`외 ${count}명 보기`}>
      +{count}
    </button>
  )}
>
  {members.slice(0, 4).map((member) => (
    <li key={member.id}>
      <Avatar
        src={member.photoUrl}
        alt={member.name}
        fallback={initials(member.name)}
      />
    </li>
  ))}
</AvatarGroup>
```

## Edge cases

- **`max` less than 2**: clamp in product wrappers or warn in development. One visible avatar plus surplus is the minimum useful group.
- **`total` exceeds rendered children**: surplus should use `total - visibleCount`, not hidden rendered children only.
- **Duplicate names**: tooltip/popover should include secondary identifiers, such as team or email.
- **Hundreds of participants**: render only visible avatars plus surplus; do not mount every avatar image.
- **RTL**: overlap direction and z-index order must be reviewed visually.
- **High contrast mode**: overlap boundaries must remain visible through border, not only shadow.
- **Failed image loads**: each avatar follows `Avatar` fallback rules; group layout must not shift.

## Don't

- Don't use `AvatarGroup` when exact identity comparison is the primary task.
- Don't make each avatar separately clickable inside a clickable parent row.
- Don't show `+0` or a surplus item when all avatars are visible.
- Don't use color alone to indicate online/away status in the group.

## References

- MUI direct source: [`refs/mui/packages/mui-material/src/AvatarGroup/AvatarGroup.d.ts`](../refs/mui/packages/mui-material/src/AvatarGroup/AvatarGroup.d.ts)
- MUI implementation: [`refs/mui/packages/mui-material/src/AvatarGroup/AvatarGroup.js`](../refs/mui/packages/mui-material/src/AvatarGroup/AvatarGroup.js)
- Ant Design parent pattern: [`refs/ant-design/components/avatar/`](../refs/ant-design/components/avatar/)
- shadcn-ui avatar source: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/avatar.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/avatar.tsx)
- shadcn-ui group examples: [`refs/shadcn-ui/apps/v4/examples/base/avatar-group.tsx`](../refs/shadcn-ui/apps/v4/examples/base/avatar-group.tsx)
- Accessibility baseline: [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)

## Cross-reference

- [examples/component-avatar.md](component-avatar.md)
- [knowledge/patterns/list-and-feed.md](../knowledge/patterns/list-and-feed.md)
