# `Descriptions` (key-value list) — spec

> Citing Ant Design `Descriptions`, MUI (composition with `<dl>`), shadcn-ui (composition).
>
> Renders structured key-value pairs in a tidy layout. Used for: order details, account profile fields, transaction metadata, settings summaries.

## When Descriptions vs alternatives

| Pattern | Use |
| --- | --- |
| **Descriptions** | Static read-only labels + values, multi-row, possibly multi-column |
| **Form** | Editable; each field has validation |
| **Table** | Many comparable items; one row per record |
| **Definition list** (raw `<dl>`) | When tagged HTML is enough; no styling layer needed |

## Anatomy

```
Single column:
┌────────────────────────────────────────────┐
│ 이름        │ 김민지                           │
│ 이메일      │ minji@example.com               │
│ 휴대폰      │ 010-1234-5678                   │
│ 가입일      │ 2024.03.15                      │
└────────────────────────────────────────────┘

Two columns:
┌────────────┬───────────────┬────────────┬───────────────┐
│ 이름        │ 김민지         │ 이메일      │ minji@...     │
│ 휴대폰      │ 010-...        │ 가입일      │ 2024.03.15    │
└────────────┴───────────────┴────────────┴───────────────┘

With sections:
┌────────────────────────────────────────────┐
│ ── 계정 정보 ────────────────────           │
│ 이름        │ 김민지                          │
│ 이메일      │ minji@example.com              │
│ ── 결제 ──────────────────────────          │
│ 카드        │ KB국민 ****-1234               │
│ 자동결제    │ 사용 중                          │
└────────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Item label | yes | Left column or above value |
| Item value | yes | Right column or below label |
| Title | optional | Heading for the descriptions block |
| Section divider | optional | Group items |

## API

```tsx
<Descriptions title="계정 정보" columns={1}>
  <Descriptions.Item label="이름">김민지</Descriptions.Item>
  <Descriptions.Item label="이메일">minji@example.com</Descriptions.Item>
  <Descriptions.Item label="휴대폰">010-1234-5678</Descriptions.Item>
  <Descriptions.Item label="가입일">2024.03.15</Descriptions.Item>
</Descriptions>

// Two-column on desktop, single on mobile
<Descriptions columns={{ default: 1, md: 2 }}>
  ...
</Descriptions>

// With sections
<Descriptions
  sections={[
    {
      title: "계정",
      items: [
        { label: "이름", value: "김민지" },
        { label: "이메일", value: "minji@example.com" },
      ],
    },
    {
      title: "결제",
      items: [
        { label: "카드", value: "KB국민 ****-1234" },
      ],
    },
  ]}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string \| ReactNode` | — | Heading |
| `columns` | `number \| { default, md, lg, ... }` | `1` | How many key-value pairs per row |
| `layout` | `"horizontal" \| "vertical"` | `"horizontal"` | Label position relative to value |
| `bordered` | `boolean` | `false` | Renders cell borders |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |
| `colon` | `boolean` | `false` | Append `:` to labels |
| `labelStyle` / `valueStyle` | `CSSProperties` | — | Per-cell overrides |

| Prop (Item) | Type | Description |
| --- | --- | --- |
| `label` | `ReactNode` | Required |
| `children` | `ReactNode` | Value content |
| `span` | `number` | Multi-column span (when `columns > 1`) |
| `valueColor` | semantic color | For status / amount |

## Layouts

### Horizontal (default)

Label on left, value on right. Most product UIs.

| Property | Width |
| --- | --- |
| Label column | ~30% (or fixed 120–160px) |
| Value column | rest |

### Vertical

Label above value. Use when:
- Labels are long (Korean labels often need this).
- Values are wide (long URLs, multi-line text).
- Forms-adjacent style.

## States

| State | Visual |
| --- | --- |
| Default | Plain text |
| Empty value | "—" or "정보 없음" placeholder |
| Sensitive (masked) | "****-1234" partial reveal |
| Editable on hover | Pen icon appears, click → enters edit mode (if interactive) |

## Tokens consumed

```
--color-text-primary       (value)
--color-text-secondary      (label)
--color-text-tertiary
--color-bg-default
--color-bg-subtle           (alternating rows if bordered)
--color-border-default      (bordered variant)
--space-xs, --space-sm, --space-md
--font-size-sm, --font-size-base
```

## Accessibility

Render as `<dl>` (definition list) for semantics:

```html
<dl>
  <div>
    <dt>이름</dt>
    <dd>김민지</dd>
  </div>
  <div>
    <dt>이메일</dt>
    <dd>minji@example.com</dd>
  </div>
</dl>
```

Screen readers parse `<dt>` as "term", `<dd>` as "description". Keyboard users tab through interactive values only.

For sensitive values (account number): provide `aria-label` on the masked rendering — "계좌번호 마지막 네 자리, 일이삼사".

## Korean conventions

Typical labels:

| Korean | English |
| --- | --- |
| 이름 | Name |
| 이메일 | Email |
| 휴대폰 / 전화번호 | Phone |
| 주소 | Address |
| 가입일 | Sign-up date |
| 결제 수단 | Payment method |
| 자동결제 | Auto-payment |
| 회원 등급 | Membership tier |
| 적립금 | Points |

For long Korean labels: switch to vertical layout (label above value).

## Code example

```tsx
function ProfileScreen() {
  const user = useUser();

  return (
    <Page>
      <PageHeader>내 정보</PageHeader>

      <Descriptions title="계정" columns={1} bordered>
        <Descriptions.Item label="이름">{user.name}</Descriptions.Item>
        <Descriptions.Item label="이메일">{user.email}</Descriptions.Item>
        <Descriptions.Item label="휴대폰">{formatPhone(user.phone)}</Descriptions.Item>
        <Descriptions.Item label="가입일">{formatDate(user.createdAt)}</Descriptions.Item>
      </Descriptions>

      <Descriptions title="결제" columns={1} bordered>
        <Descriptions.Item label="카드">
          {user.savedCard
            ? `${user.savedCard.bank} ****-${user.savedCard.last4}`
            : "등록된 카드 없음"}
        </Descriptions.Item>
        <Descriptions.Item label="자동결제">
          <Tag color={user.autoPayment ? "success" : "default"}>
            {user.autoPayment ? "사용 중" : "미사용"}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Page>
  );
}
```

## Edge cases

- **Long values that wrap**: align label to top of value (`vertical-align: top`).
- **Empty value**: render `—` or culturally-appropriate placeholder ("정보 없음").
- **Sensitive value masked**: pair with copy-button if it's user's identifier (account number, member ID).
- **Editable inline**: switch to Form when in edit mode; revert to Descriptions when done.
- **Mobile**: descend to single-column regardless of `columns` prop, or use vertical layout per item.

## Don't

- Don't use Descriptions for editable forms. Use `Form`.
- Don't put complex interactive widgets in values (use a different component).
- Don't omit the label — values without labels are mystery data.
- Don't show empty values without placeholder — looks broken.
- Don't use `:` in labels by default (Korean convention is space). Toggle `colon` prop if needed.

## References

- Ant Design: [`refs/ant-design/components/descriptions/`](../docs/reference/ant-design.md#descriptions) — most exhaustive (column, span, layout, bordered, sections).
- MUI / shadcn-ui: no built-in. Compose with `<dl>` + Tailwind.

## Cross-reference

- [`examples/component-form.md`](component-form.md) — editable counterpart
- [`examples/component-table.md`](component-table.md) — for many comparable items
- [`examples/component-card.md`](component-card.md) — wraps Descriptions in detail screens
- [`knowledge/patterns/settings-page.md`](../knowledge/patterns/settings-page.md) — Descriptions on settings pages
