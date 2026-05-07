# `AddressInput` (custom — Korean) — spec

> Status: example artifact for **custom components**. Korean addresses require Daum Postcode lookup and a two-line structure that doesn't exist in any upstream design system.
>
> Cited knowledge: [`knowledge/patterns/form-design.md`](../knowledge/patterns/form-design.md), [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md)

## Purpose

Captures a Korean address. Uses **Daum Postcode API** (the universal standard) to look up postal codes + main address; user adds detail line manually.

**Never accept Korean addresses as free text.** Address validation is a real problem; Daum solves it for free; users expect it.

## Anatomy

```
┌─────────────────────────────────────────┐
│ 우편번호                                  │
│ ┌──────────────┐  ┌─────────────────┐   │
│ │  06234       │  │  주소 검색       │   │   ← read-only zip + lookup button
│ └──────────────┘  └─────────────────┘   │
│                                          │
│ 기본 주소                                 │
│ ┌──────────────────────────────────────┐ │
│ │ 서울특별시 강남구 테헤란로 123        │ │   ← read-only, populated by lookup
│ └──────────────────────────────────────┘ │
│                                          │
│ 상세 주소 (선택)                          │
│ ┌──────────────────────────────────────┐ │
│ │ 5층 501호                              │ │   ← user-editable
│ └──────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Zip code field | yes | Read-only, populated by Daum lookup |
| Lookup button | yes | "주소 검색" — opens Daum Postcode |
| Main address | yes | Read-only, from Daum (도로명 or 지번 — choose) |
| Detail line | optional | User-typed (apt #, suite, instructions) |
| Address-type toggle | optional | 도로명 vs 지번 (street name vs lot number) |

## API

```tsx
<AddressInput
  value={address}
  onValueChange={setAddress}
  required
  onLookupClick={openDaumPostcode}
/>

// where address is:
type Address = {
  postalCode: string;     // "06234"
  mainAddress: string;    // "서울특별시 강남구 테헤란로 123"
  detailAddress: string;  // "5층 501호"
  addressType: "road" | "lot";   // 도로명 (road) | 지번 (lot)
  englishAddress?: string; // "123 Teheran-ro, Gangnam-gu, Seoul" — for international
}
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `Address \| null` | — | The full address object |
| `onValueChange` | `(address: Address) => void` | — | |
| `required` | `boolean` | `false` | All three fields required (typically just zip + main) |
| `onLookupClick` | `() => void` | — | Triggers Daum Postcode UI; required to wire up |
| `disabled` | `boolean` | `false` | |
| `error` / `errorText` | — | — | Validation state |
| `addressTypeToggle` | `boolean` | `false` | Allow user to switch between 도로명 / 지번 |
| `requireDetail` | `boolean` | `false` | If detail address is mandatory (e.g., apartment # required) |
| `country` | `"KR"` | `"KR"` | Reserved for future i18n support |

## Daum Postcode integration

Daum (Kakao) provides a free embedded postcode lookup:

```ts
// In a real implementation, load the script:
// <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>

const openDaumPostcode = () => {
  new window.daum.Postcode({
    oncomplete: (data) => {
      const newAddress: Partial<Address> = {
        postalCode: data.zonecode,
        mainAddress: data.address,        // 도로명 by default
        addressType: data.userSelectedType === "R" ? "road" : "lot",
        englishAddress: data.addressEnglish,
      };
      // Detail address is left for the user to fill
      setAddress({ ...address, ...newAddress, detailAddress: "" });

      // Focus the detail input next
      detailInputRef.current?.focus();
    },
  }).open();
};
```

The Daum widget opens a modal/popup with its own UI (search field, results list). Returns the selected address.

For React Native / non-web: use a webview to embed the Daum widget OR a vendor's wrapper (e.g., `react-native-daum-postcode`).

## Behavior

### Lookup flow

1. User clicks "주소 검색" button.
2. Daum Postcode modal opens.
3. User searches by keyword (`강남역`, `테헤란로 123`, `청담동 100-1`).
4. User picks a result from the list.
5. Modal closes; zip + main address populate.
6. Focus moves to the detail address input (best practice).
7. User types apartment / suite / instructions.

### Editing existing address

If `value` is already populated and user clicks "주소 검색" again:
- All three fields are **replaced** with the new lookup.
- Confirm with user if detail was already filled (toast: "상세 주소가 초기화됩니다").

### Address type (도로명 vs 지번)

도로명 (road name): "서울특별시 강남구 테헤란로 123" — modern, since 2014.
지번 (lot number): "서울특별시 강남구 역삼동 821-1" — legacy, still common in older systems and rural areas.

Daum lookup returns both. Default to 도로명 unless the user prefers 지번. Provide a toggle if your form needs both displayed.

### Detail address rules

- Free-text, max ~50 chars.
- Common formats:
  - "5층 501호" (5th floor, room 501)
  - "302호" (room 302 — for 빌라 / villa-style buildings)
  - "B동 1502호" (building B, room 1502)
- Optional unless your business requires it.
- Don't validate beyond character length — variations are too many.

## States

| State | Visual |
| --- | --- |
| Empty | All fields empty, "주소 검색" button prominent |
| Looking up | Daum modal is open (this component's UI is mostly inactive) |
| Populated | Fields filled, "주소 검색" button still available for re-lookup |
| Disabled | All fields and button disabled |
| Error | Red border on whichever field failed validation |
| Read-only (existing user) | All fields show, no edit affordances, no lookup button |

## Tokens consumed

Inherited from Input + Button. No new tokens.

## Accessibility

- Each field is a labeled input. Group with `<fieldset><legend>주소</legend>`.
- "주소 검색" is a `<button>` with clear label.
- Daum's modal is its own dialog — focus management is handled by Daum (not by this component).
- After lookup completes, focus moves to detail input via `ref.focus()` — improves keyboard flow.
- `aria-required="true"` on required fields.
- Error: `aria-invalid="true"` + `aria-describedby` to error text.
- Postal code field: `aria-readonly="true"` (don't let users guess they can type).

## Korean considerations

Per [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md):

- Always use Daum Postcode. Korean users expect it; free-form is broken.
- Address-type defaults to 도로명 for modern apps (matches government standardization).
- Display labels: "우편번호" / "기본 주소" / "상세 주소" — these are conventional. Don't translate.
- For international shipments: optionally include `englishAddress` from Daum.
- Server-side: store the full structured address (all 4 fields), not just the formatted string. Lets you re-display in different formats later.

## Mobile patterns

- The lookup button: full-width on mobile, alongside the zip field on desktop.
- Daum's modal is responsive — trust it.
- After lookup, scroll the detail input into view (it's the next thing user types in).

## Code example

```tsx
function CheckoutForm() {
  const [address, setAddress] = useState<Address | null>(null);
  const detailRef = useRef<HTMLInputElement>(null);

  const openLookup = () => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        setAddress({
          postalCode: data.zonecode,
          mainAddress: data.address,
          detailAddress: "",
          addressType: data.userSelectedType === "R" ? "road" : "lot",
          englishAddress: data.addressEnglish,
        });
        setTimeout(() => detailRef.current?.focus(), 100);
      },
    }).open();
  };

  return (
    <Form>
      <AddressInput
        label="배송지"
        value={address}
        onValueChange={setAddress}
        onLookupClick={openLookup}
        detailInputRef={detailRef}
        required
        errorText={address && !address.postalCode ? "주소를 검색해 주세요" : undefined}
      />

      <Form.Field name="recipient">
        <Form.Label>받는 사람</Form.Label>
        <Form.Control><Input /></Form.Control>
      </Form.Field>

      <Form.Field name="phone">
        <Form.Label>연락처</Form.Label>
        <Form.Control><Input type="tel" /></Form.Control>
      </Form.Field>
    </Form>
  );
}
```

## Edge cases

- **No internet**: Daum widget can't load. Show error + retry button. Don't allow free-form fallback.
- **Daum API fails / banned**: rare, but vendors do change. Have a backup vendor (Naver Maps geocoding, juso.go.kr official API).
- **Address that Daum doesn't recognize**: rare for residential. For very new construction, Daum might lag — let user note in detail address.
- **PO Box / virtual addresses**: Korean PO Boxes use a separate system; out of scope for residential AddressInput. Different field.
- **Multi-tenant address** (e.g., apartment complex with multiple buildings): Daum returns the building-level address; user adds 동 (building) and 호 (unit) in detail.
- **International orders**: AddressInput is KR-only here. For multi-country: separate `InternationalAddressInput` component with country dropdown.
- **Server-side normalization**: even with Daum's clean output, server should normalize whitespace and casing.

## Don't

- Don't accept Korean addresses as free text.
- Don't roll your own postal-code database.
- Don't make all three fields free-form (zip + main + detail). Zip and main come from lookup.
- Don't auto-validate detail address against a real-world database (impossible).
- Don't ship without a lookup button — there's no other way to get the right zip.
- Don't store only the formatted string — store all 4 components for future flexibility.
- Don't use `<input type="text">` for postal code with `pattern` regex as the only validation. Use Daum.

## API rationale

- **`value: Address` (structured object)**: matches what Daum returns; frees the consumer from re-parsing.
- **`onLookupClick: () => void`**: lookup is side-effectful (DOM manipulation, script load). Consumer wires it; component doesn't bake in Daum dependency.
- **No "free-form" mode**: forcing the lookup is the point. If a consumer wants free-form, they shouldn't use this component.

## Cross-reference

- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md) — Daum Postcode, address conventions
- [`knowledge/patterns/form-design.md`](../knowledge/patterns/form-design.md) — address-field pattern
- [`examples/component-input.md`](component-input.md) — base Input
- [Daum Postcode Service](https://postcode.map.daum.net/guide) — official documentation
