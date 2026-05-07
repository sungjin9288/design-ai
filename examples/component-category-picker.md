# `CategoryPicker` (custom — Korean fintech / 가계부) — spec

> Custom component pattern. Universal in Korean 가계부 (personal finance / expense tracker) apps. Not in any upstream design system.

## Purpose

Lets the user pick a category for a transaction (식비 / 교통 / 쇼핑 / etc.). Uses **emoji + Korean label** as the category visual identity — distinctive Korean app convention.

## Anatomy

```
Horizontal scrollable pills (default):
┌───────────────────────────────────────────────────────┐
│ [🍽 식비]  [🚌 교통]  [🛍 쇼핑]  [🏠 주거]  [💊 건강]  │
└───────────────────────────────────────────────────────┘
                  ↑ active (filled bg)

Grid (alternative for many categories):
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  🍽    │ │  🚌    │ │  🛍    │ │  🏠    │
│  식비   │ │  교통   │ │  쇼핑   │ │  주거   │
└────────┘ └────────┘ └────────┘ └────────┘
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  💊    │ │  🎬    │ │  ✈     │ │   +    │
│  건강   │ │  엔터  │ │  여행   │ │ 추가  │
└────────┘ └────────┘ └────────┘ └────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Category icon | yes | Emoji or pictogram (Korean 가계부 apps overwhelmingly use emoji) |
| Category label | yes | Korean term |
| "Add custom" affordance | optional | Lets user create their own category |
| Search / filter | optional | For 30+ categories |

## API

```tsx
<CategoryPicker
  value={categoryId}
  onValueChange={setCategoryId}
  categories={[
    { id: "food", icon: "🍽", label: "식비" },
    { id: "transport", icon: "🚌", label: "교통" },
    { id: "shopping", icon: "🛍", label: "쇼핑" },
    // ...
  ]}
  layout="horizontal"
  allowCustom
  onCustomAdd={(name, icon) => addCategory({ name, icon })}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| null` | — | Selected category id |
| `onValueChange` | `(id: string \| null) => void` | — | |
| `categories` | `Category[]` | — | List of categories |
| `layout` | `"horizontal" \| "grid" \| "list"` | `"horizontal"` | |
| `allowCustom` | `boolean` | `false` | Show "+ 추가" button |
| `onCustomAdd` | `(name: string, icon: string) => void` | — | Open modal to create new |
| `searchable` | `boolean` | `false` | Search input above |
| `disabled` | `boolean` | `false` | |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |

```ts
type Category = {
  id: string;
  icon: string;        // Emoji or icon name
  label: string;       // Korean
  color?: string;      // Optional bg tint
  isCustom?: boolean;  // User-created
};
```

## Default categories (Korean 가계부 standard)

Korean apps converge on this categorization. Use as a starting point:

| ID | Emoji | Korean | English |
| --- | --- | --- | --- |
| `food` | 🍽 | 식비 | Food |
| `cafe` | ☕ | 카페 / 간식 | Cafe / Snack |
| `transport` | 🚌 | 교통 | Transport |
| `shopping` | 🛍 | 쇼핑 | Shopping |
| `housing` | 🏠 | 주거 | Housing |
| `utilities` | 💡 | 공과금 | Utilities |
| `health` | 💊 | 건강 / 의료 | Health |
| `entertainment` | 🎬 | 엔터테인먼트 | Entertainment |
| `education` | 📚 | 교육 | Education |
| `travel` | ✈ | 여행 | Travel |
| `gift` | 🎁 | 선물 / 경조사 | Gift / Ceremony |
| `subscription` | 📺 | 구독 | Subscription |
| `salary` | 💰 | 급여 | Income — salary |
| `bonus` | 💵 | 부수입 | Income — side |
| `investment` | 📈 | 투자 | Investment |
| `other` | ✨ | 기타 | Other |

Income vs expense: usually two separate `CategoryPicker` instances OR a single picker with type filter.

## Layouts

### Horizontal scrollable pills (default for mobile)

Best for 6–12 categories. User swipes horizontally to see more.

```
[🍽 식비] [🚌 교통] [🛍 쇼핑] ...→
```

### Grid (4-column on mobile, 6-column on tablet+)

Best for 12+ categories. All visible at once.

### List (vertical)

Best for accessibility / dense desktop forms.

## States

| State | Visual |
| --- | --- |
| Default (unselected) | Outline border, neutral bg |
| Hover | Slight bg shift |
| Selected | Filled bg `--color-primary-subtle-bg`, border `--color-primary-default`, text `--color-primary-default` |
| Custom (user-added) | Same as default but with subtle "edit" icon on hover |
| Disabled | Muted, no events |

## Tokens consumed

```
--color-bg-default
--color-bg-subtle
--color-primary-subtle-bg     (selected bg)
--color-primary-default        (selected border + text)
--color-text-primary
--color-text-secondary
--color-border-default
--color-focus-ring
--space-xs, --space-sm, --space-md
--radius-md, --radius-full     (pill style for horizontal)
--font-size-sm
```

## Sizes

| Size | Pill height | Icon | Font |
| --- | --- | --- | --- |
| `sm` | 32px | 16px | 12px |
| `md` (default) | 40px | 20px | 14px |
| `lg` | 48px | 24px | 16px |

For grid layout: each cell is square (e.g., 80×80 for `md`), with icon on top + label below.

## Accessibility

- Container: `role="radiogroup"`, `aria-label="카테고리 선택"`.
- Each category: `role="radio"`, `aria-checked={value === id}`.
- Emoji icons: `aria-hidden="true"` (the label carries meaning for screen readers).
- "+ 추가" button: standard `<button>` with `aria-label="새 카테고리 추가"`.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reach the active category (single tab stop) |
| `←` / `→` (horizontal) or `↑` / `↓` (grid) | Move + select next |
| `Home` / `End` | First / last |
| `Space` / `Enter` | Activate (or auto-activate on focus, configurable) |

## Korean conventions

- **Emoji is mandatory**, not decorative. Korean users associate emoji with categories — text-only feels sterile.
- **Label is short** — 1-3 syllables typically. "식비", "교통", "쇼핑".
- **Income categories use 💰 / 💵 / 📈 family**; expense uses everything else.
- **Subscription** (구독) is a major Korean fintech category — Netflix, YouTube Premium, music services.
- **경조사** (special-occasion gifts: weddings, funerals, holidays) is a uniquely Korean expense category — not in Western 가계부 apps.

## Custom category creation

When user clicks "+ 추가":

```
┌──────────────────────────────────┐
│ 새 카테고리                        │
│                                  │
│ 이름:    [____________]            │
│ 아이콘:  [😀] (tap to change)      │
│                                  │
│ 색상:    ●  ●  ●  ●  ●            │
│                                  │
│      [취소]    [추가]             │
└──────────────────────────────────┘
```

- Name (required): Korean, 1-10 chars.
- Icon (emoji picker — use system emoji picker or grid of common ones).
- Color (optional): bg tint for visual distinction.

Save to user-scoped storage (server-side typically, with sync).

## Code example

```tsx
function TransactionForm() {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const categories = useCategories();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <Form>
      <Form.Field name="amount">
        <AmountInput value={amount} onValueChange={setAmount} />
      </Form.Field>

      <Form.Field name="category">
        <Form.Label>카테고리</Form.Label>
        <CategoryPicker
          value={categoryId}
          onValueChange={setCategoryId}
          categories={categories}
          layout="horizontal"
          allowCustom
          onCustomAdd={() => setCreateOpen(true)}
        />
        <Form.ErrorText />
      </Form.Field>

      <CreateCategoryModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={(c) => {
          createCategory(c);
          setCategoryId(c.id);
        }}
      />
    </Form>
  );
}
```

## Edge cases

- **Many custom categories** (50+): switch to grid layout + search.
- **No selection allowed** (clear): show null state, `value={null}`.
- **Income vs expense**: filter list based on transaction type. Don't show `food` for income.
- **Emoji rendering inconsistency** (Apple vs Android vs Web): emoji are rendered by OS; minor visual differences across platforms are acceptable.
- **Korean accessibility**: aria-checked state needs Korean translation if assistive tech localized.

## Don't

- Don't use category icons without labels — Korean users want to see "식비" written out.
- Don't omit emoji — text-only categorization feels lifeless to Korean users.
- Don't use Western category emoji standards (🍔 for food). Use 🍽 for "Korean meal" feel.
- Don't pre-select a default category. Let the user pick — wrong default is annoying.
- Don't allow > 30 categories without search. Cognitive overload.

## References

No upstream component is exactly this. Closest analogs:
- Ant Design: `Tag` checkable mode (but no emoji-first design)
- MUI: `Chip` with avatar (similar idea)

This is a **Korean-market-specific custom pattern**.

## Cross-reference

- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md) — Korean app conventions
- [`examples/component-amount-input.md`](component-amount-input.md) — paired in transaction forms
- [`examples/component-form.md`](component-form.md) — form orchestration
- [`knowledge/patterns/form-design.md`](../knowledge/patterns/form-design.md)
