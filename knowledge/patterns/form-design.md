<!-- hand-written -->
---
title: Form design patterns
applies_to: [web, mobile, all-ui]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Form design patterns

Forms are where users do real work. Bad forms cost real conversions and real frustration. This is the floor for any form longer than two fields.

## Layout

### Single column over multi-column

Single column is faster to fill, faster to scan, simpler on mobile. Use multi-column **only** for genuine pairs (first/last name — though for Korean, this is a single field; address line 1/2; city/state/zip).

```
✗ multi-column scattering related fields:
  [Name      ]  [Email     ]
  [Phone     ]  [Birthday  ]
  [Address   ]  [Postal    ]

✓ single-column logical flow:
  [Name      ]
  [Email     ]
  [Phone     ]
  [Birthday  ]
  [Address              ]
  [Postal   ]
```

### Label position

| Position | Use |
| --- | --- |
| **Above the field** (default) | Always — fastest scan, accommodates long labels, RTL-safe, mobile-friendly |
| Inline left | Only for dense desktop forms with predictable short labels (admin tools, settings) |
| Floating label (Material) | Avoid — animation distracts, label disappears as users start typing, accessibility tooling struggles |
| Placeholder-as-label | **Never** — vanishes on input, fails contrast, fails screen readers |

For Korean labels (often longer than English), above-field is required.

### Group with visual grouping, not boxes

Use whitespace + section headings to group related fields. Heavy borders or shaded card backgrounds for each section make the form feel like a tax document.

## Field anatomy

```
┌──────────────────────────────────┐
│ Label                            │ ← always above
│ ┌──────────────────────────────┐ │
│ │ optional placeholder hint    │ │ ← shows the format, NOT the label
│ └──────────────────────────────┘ │
│ Help text — explains what or why │ ← grey, below
│ ⚠ Error: be specific             │ ← red, replaces help text on error
└──────────────────────────────────┘
```

### Required vs optional

Mark **optional** with `(optional)`, not required with `*`. Reasoning: most fields in a well-designed form are required; visually marking the few exceptions is less noisy than marking the majority.

```
✓ Email
✓ Phone (optional)
✓ Company

✗ Email *
✗ Phone
✗ Company *
```

For forms where most fields ARE optional (e.g., "complete your profile" type pages), reverse: mark required with `Required` text label, not `*`.

`*` alone fails accessibility — screen readers read it as "asterisk", not "required". Use `aria-required="true"` plus visible text.

### Help text vs placeholder

| Type | Use | Example |
| --- | --- | --- |
| **Label** | What this field is | `Email address` |
| **Help text** (under field) | Why or how (constraints, format hints) | `We'll only use this for password recovery.` |
| **Placeholder** | Optional, format example only | `name@company.com` |
| **Error** (replaces help text on error) | What's wrong, how to fix | `Email must include @` |

Help text is the single most underused affordance. If you're tempted to add a tooltip — make it help text instead.

## Validation

### When to validate

| Trigger | Use |
| --- | --- |
| **On blur** (after user leaves the field) | Default for most fields. Don't yell while user is typing. |
| **On change** (every keystroke) | After the first error has shown — gives real-time feedback once user knows what's wrong. |
| **On submit** | Always — final pass. Catches anything missed. |
| **Async (server-side)** | Username availability, email taken, etc. Show a spinner/icon at the field, not a global loader. |

**Never** validate on focus (when user lands in field) — there's no input to validate.

### Error message rules

1. **Be specific**: `Password must be 8+ characters` not `Invalid password`.
2. **Be actionable**: tell them what to do, not just what's wrong. `Use a different email — this one's already registered.` is better than `Email taken`.
3. **Don't blame**: avoid "you failed to" or "you must". `This field is required` is fine.
4. **Korean tone**: be polite/apologetic. `이메일 형식이 올바르지 않습니다` not `잘못된 이메일`.
5. **Position next to the field**: never just at the top. Users miss top-level error summaries on mobile.
6. **Plus a top summary on submit-fail** (with anchor links to each field) — for users with screen readers and for forms longer than ~5 fields.

### Inline success affirmation

For fields with non-obvious correctness (strong password, valid coupon, available username), show a positive checkmark or message:

```
✓ Password is strong
✓ "username123" is available
✓ Coupon applied — 20% off
```

Use sparingly — confirming every field reads as patronizing.

## Specific field types

### Email

- `<input type="email">` — gets correct mobile keyboard, native validation.
- `inputmode="email"` for older browsers.
- `autocomplete="email"` always — saves users typing it again.
- Validate format on blur with regex, but **don't be strict** — RFC-compliant emails are weirder than your regex thinks. Better to send a verification email than to reject `user+tag@subdomain.example.co.kr`.

### Password

- `<input type="password">` with a **show/hide toggle** (eye icon).
- `autocomplete="new-password"` for sign-up, `autocomplete="current-password"` for sign-in. This determines whether the password manager prompts to save vs autofill.
- Strength meter: yes for sign-up, no for sign-in.
- Show requirements **before** the user types, not as red errors. `Use 8+ chars with a number` listed under the field.
- Don't mask password length. `••••••••` of fixed width regardless of actual length is harmful — users lose track.

### Phone

- `<input type="tel">` for mobile keyboard.
- `inputmode="tel"`.
- `autocomplete="tel"`.
- Auto-format as user types: `010-1234-5678` (Korea), `(415) 555-1234` (US).
- For international, use a country-code dropdown + national number input. Don't ask users to type `+82` manually.

### Date

- For dates the user knows (birthdate, expiry) — text input + format hint, OR three dropdowns. Calendar pickers are slow for known dates.
- For dates the user is choosing (appointment, travel) — calendar picker.
- Format: localize. Korean default `YYYY.MM.DD`, US `MM/DD/YYYY`, ISO `YYYY-MM-DD` for technical.

### Address (Korea-specific)

- **Always use postcode lookup** (Daum Postcode API). Never free-form.
- Two-line address structure: 도로명/지번 (lookup) + 상세주소 (detail, free text).
- See [knowledge/i18n/korean-product-conventions.md](../i18n/korean-product-conventions.md).

### Numbers / currency

- `<input type="number">` only when free integer input is fine.
- For currency: `<input type="text" inputmode="decimal">` + format on blur. (`type="number"` strips leading zeros and rejects formatting.)
- Show the unit (`₩`, `$`, `kg`) inside or beside the field — don't force the user to type it.
- For Korean currency: comma-separator on display, bare on submit.

### File upload

- Drag-and-drop **plus** a button — both modalities. Drag-only excludes mobile.
- Show file name and size after select. Allow remove.
- State limits clearly **before** upload: `Max 10 MB. JPG, PNG, PDF.`
- For images, show preview after upload.

## Multi-step forms

Use multi-step when:
- Form has > 8 logically separable fields.
- Steps have completion incentive (progressive disclosure).
- You can save progress between steps.

Don't use multi-step when:
- All fields could fit on one page comfortably.
- Steps are arbitrary chunks (no logical grouping).

Required affordances:
- **Progress indicator**: dots, numbered steps, or progress bar.
- **Back button** on every step except the first.
- **Save progress** if the form takes > 2 minutes.
- **Don't reset** on back navigation.
- **Allow non-linear navigation** if steps are independent.

## Submit button

- Action-specific label: `Create account` not `Submit`. `Send password reset email` not `Send`.
- Always one primary submit per form. Multiple primary buttons confuse.
- Disable while submitting (loading state).
- After submit, show toast/banner with next-step guidance — don't just clear the form silently.
- For destructive submits (delete, remove): require confirmation, use red intent.

## Mobile considerations

- All fields full-width on mobile — no left/right padding wasted.
- Field height ≥ 44 px for tap target.
- Spacing between fields ≥ 16 px (so the field above doesn't get accidentally tapped).
- Use the right `inputmode` for every field — gets users the right keyboard.
- Submit button at the bottom, sticky if form is long.
- Avoid datepickers that take over the screen — system native is better.

## Accessibility

- Every field has a `<label for>` linking to its `id`. (Or `aria-labelledby` for non-label cases.)
- Required fields: `aria-required="true"` AND visible "required" indicator.
- Errors: `aria-invalid="true"` on the field + `aria-describedby` pointing to the error message.
- Error messages live in `role="alert"` or `aria-live="polite"` — announced by screen reader.
- Group related fields with `<fieldset>` and `<legend>`.
- For multi-step: announce step changes via live region.
- Cite [knowledge/a11y/keyboard-and-focus.md](../a11y/keyboard-and-focus.md) for keyboard handling.

## Common form anti-patterns

- **Reset button**: nobody wants to reset by accident; remove it.
- **CAPTCHA at the end of a long form**: blocks valid users; use invisible reCAPTCHA or hCaptcha.
- **Confirm-email field**: just have one. Email validation + verification covers it.
- **Confirm-password field**: redundant if there's a show/hide toggle. Skip.
- **Fields that aren't actually used**: cut. Every field is friction.
- **Asking for info you can derive**: don't ask for "country" if you have IP. Don't ask for "age" if you have DOB.
- **Soft-disabled submit until "all valid"**: confusing — users can't tell why. Better: let them click, then surface specific errors.
- **Error summary on top of long form, no anchor links**: users have to scroll to find the field.

## Cross-reference

- [knowledge/patterns/ux-guidelines.md](ux-guidelines.md) — broader UX rules
- [knowledge/i18n/korean-product-conventions.md](../i18n/korean-product-conventions.md) — Korean form expectations (phone, address, terms)
- [knowledge/a11y/keyboard-and-focus.md](../a11y/keyboard-and-focus.md) — keyboard navigation contract
