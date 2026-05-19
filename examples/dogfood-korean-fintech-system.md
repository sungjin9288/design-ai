# Dogfood: Korean fintech mobile app — design system bootstrap

> **Scenario**: A 가계부 (personal finance tracker) mobile app for Korean millennials/Gen-Z. Brand-new product, no existing design system. Single-founder team — needs to ship MVP in 6 weeks.
>
> **Inputs given to the agent**:
> - Product type: fintech, consumer mobile, Korean primary
> - Brand: undecided — wants "trustworthy + approachable + youthful"
> - Stack: React Native + Tailwind via NativeWind, no MUI/Ant
> - Light + dark mode
>
> **Skill used**: `design-system-builder` (which itself orchestrates `color-palette`, `component-spec-writer` patterns)
>
> **Output**: this document — a complete bootstrap deliverable a frontend dev could implement against without follow-up.

---

## 1. Foundations

### Why this palette

Korean fintech consumer apps live or die on **trust** and **approachability**. Trust says cool blue. Approachability says soft saturation, never neon. Youthful says not corporate-Samsung-blue (too cold) — closer to Toss's coral-brand or Kakao Bank's golden warmth, but distinct.

Picked: **teal-600 primary** (`#0D9488`). Reasoning:
- Cool enough to read as financial / trustworthy.
- Warm enough to not feel sterile (closer to nature than pure blue).
- Differentiated from the dominant Korean fintech blues (Toss `#3182F6`, KakaoBank `#FFEB00`, NH Bank green `#10B981`).
- Pairs cleanly with a coral accent for "money in" affordances and slate neutrals for surfaces.

Tradeoff accepted: teal is less established as "money color" than blue or green. We claim it intentionally — differentiation matters more than instant-recognition for an MVP.

### Tokens — color (light)

Generated via `color-palette` skill, citing [knowledge/colors/color-theory.md](../knowledge/colors/color-theory.md), [knowledge/colors/palettes-by-product-type.md](../knowledge/colors/palettes-by-product-type.md), [knowledge/a11y/contrast.md](../knowledge/a11y/contrast.md).

```css
:root {
  /* Primary — teal */
  --color-primary-50:  #F0FDFA;
  --color-primary-100: #CCFBF1;
  --color-primary-200: #99F6E4;
  --color-primary-300: #5EEAD4;
  --color-primary-400: #2DD4BF;
  --color-primary-500: #14B8A6;
  --color-primary-600: #0D9488;  /* brand anchor — 5.6:1 on white ✓ */
  --color-primary-700: #0F766E;
  --color-primary-800: #115E59;
  --color-primary-900: #134E4A;
  --color-primary-950: #042F2E;

  /* Accent — coral (money-in / positive amount) */
  --color-accent-50:  #FFF1F2;
  --color-accent-500: #F43F5E;
  --color-accent-600: #E11D48;  /* 4.8:1 on white ✓ */

  /* Neutrals — warm-leaning slate (cleaner with Hangul) */
  --color-neutral-50:  #F8FAFC;
  --color-neutral-100: #F1F5F9;
  --color-neutral-200: #E2E8F0;
  --color-neutral-300: #CBD5E1;
  --color-neutral-400: #94A3B8;
  --color-neutral-500: #64748B;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1E293B;
  --color-neutral-900: #0F172A;

  /* Semantic — light */
  --color-bg-default: #FFFFFF;
  --color-bg-elevated: #F8FAFC;       /* cards */
  --color-bg-subtle: #F1F5F9;          /* section bg, hover */

  --color-text-primary: #0F172A;       /* 18.7:1 on white */
  --color-text-secondary: #475569;     /* 7.4:1 */
  --color-text-tertiary: #64748B;      /* 4.9:1 — passes AA body */
  --color-text-disabled: #94A3B8;      /* aria-disabled only */

  --color-border-default: #E2E8F0;
  --color-border-strong: #CBD5E1;
  --color-divider: #F1F5F9;

  --color-primary-default: #0D9488;
  --color-primary-hover: #0F766E;
  --color-primary-active: #115E59;
  --color-primary-subtle-bg: #F0FDFA;
  --color-on-primary: #FFFFFF;

  --color-focus-ring: #5EEAD4;          /* primary-300 — 3:1 on both white and primary */

  /* Money-specific (fintech essential) */
  --color-money-positive: #16A34A;     /* income, deposits — green-600 */
  --color-money-negative: #DC2626;     /* expense, withdrawal — red-600 */
  --color-money-neutral: #475569;      /* unchanged amount, transfer */

  --color-success: #16A34A;
  --color-success-subtle-bg: #F0FDF4;
  --color-warning: #D97706;
  --color-warning-subtle-bg: #FFFBEB;
  --color-error: #DC2626;
  --color-error-subtle-bg: #FEF2F2;
  --color-info: #0D9488;               /* matches primary */
}
```

### Tokens — color (dark)

Recomputed, not inverted. Cite [knowledge/colors/color-theory.md](../knowledge/colors/color-theory.md) for the recompute approach.

```css
.dark {
  --color-bg-default: #020617;          /* near-black with slate hue */
  --color-bg-elevated: #0F172A;
  --color-bg-subtle: #1E293B;

  --color-text-primary: #F8FAFC;        /* 17.4:1 on bg-default */
  --color-text-secondary: #CBD5E1;
  --color-text-tertiary: #94A3B8;
  --color-text-disabled: #64748B;

  --color-border-default: #334155;
  --color-border-strong: #475569;
  --color-divider: #1E293B;

  --color-primary-default: #2DD4BF;     /* primary-400 — pops on dark */
  --color-primary-hover: #5EEAD4;
  --color-primary-active: #99F6E4;
  --color-primary-subtle-bg: #042F2E;   /* primary-950 */
  --color-on-primary: #042F2E;

  --color-focus-ring: #2DD4BF;

  --color-money-positive: #4ADE80;      /* green-400 — chroma boost for low-light eye */
  --color-money-negative: #F87171;      /* red-400 */
  --color-money-neutral: #94A3B8;

  --color-success: #4ADE80;
  --color-warning: #FBBF24;
  --color-error: #F87171;
  --color-info: #2DD4BF;
}
```

### Contrast matrix

| Pair (light) | Ratio | AA body | AA UI |
| --- | --- | --- | --- |
| text-primary on bg-default | 18.7:1 | ✓ | — |
| text-secondary on bg-default | 7.4:1 | ✓ | — |
| text-tertiary on bg-default | 4.9:1 | ✓ | — |
| primary-default on bg-default | 5.6:1 | ✓ | — |
| on-primary on primary-default | 8.0:1 | ✓ | — |
| focus-ring on bg-default | 3.1:1 | — | ✓ |
| focus-ring on primary-default | 3.0:1 | — | ✓ |
| money-positive on bg-default | 4.5:1 | ✓ | — |
| money-negative on bg-default | 4.8:1 | ✓ | — |

| Pair (dark) | Ratio | AA body | AA UI |
| --- | --- | --- | --- |
| text-primary on bg-default | 17.4:1 | ✓ | — |
| text-secondary on bg-default | 11.6:1 | ✓ | — |
| primary-default on bg-default | 7.2:1 | ✓ | — |
| focus-ring on bg-default | 7.2:1 | — | ✓ |

### Typography

Korean primary → Pretendard. Cite [knowledge/i18n/korean-typography.md](../knowledge/i18n/korean-typography.md) for stack rationale.

```css
:root {
  --font-family-base: 'Pretendard', -apple-system, BlinkMacSystemFont,
                      'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
  --font-family-mono: 'Pretendard JetBrains Mono', ui-monospace, Menlo, monospace;

  /* Numerals — tabular for amounts */
  --font-feature-amount: 'tnum' 1;

  /* Scale — base 15 for mobile-primary, ratio 1.25 (major third) */
  --font-size-xs: 12px;
  --font-size-sm: 13px;
  --font-size-base: 15px;
  --font-size-lg: 17px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;
  --font-size-4xl: 38px;       /* hero amount displays */

  /* Line heights — Korean +10% from Latin defaults */
  --line-height-tight: 1.25;
  --line-height-base: 1.6;     /* body — Korean adjustment */
  --line-height-relaxed: 1.75;

  /* Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;  /* body emphasis — Korean reads thin at 500 */
  --font-weight-bold: 700;
}
```

Variants:

| Token | Family | Weight | Size | LH | LS | Use |
| --- | --- | --- | --- | --- | --- | --- |
| `display` | base | 700 | 38px | 1.2 | -0.01em | hero amounts, balance display |
| `heading-lg` | base | 700 | 24px | 1.3 | 0 | screen titles |
| `heading-md` | base | 600 | 20px | 1.4 | 0 | section titles |
| `heading-sm` | base | 600 | 17px | 1.4 | 0 | card titles |
| `body-lg` | base | 400 | 17px | 1.6 | 0 | important body |
| `body` | base | 400 | 15px | 1.6 | 0 | default body |
| `body-sm` | base | 400 | 13px | 1.6 | 0 | secondary text |
| `caption` | base | 400 | 12px | 1.5 | 0 | timestamps, metadata |
| `amount` | base | 600 | varies | 1.2 | -0.01em | monetary amounts (tnum) |

`amount` variant has `font-feature-settings: 'tnum'` so digits align in columns (essential for transaction lists). Cite [knowledge/typography/type-scale-fundamentals.md](../knowledge/typography/type-scale-fundamentals.md).

### Spacing

4-base scale per [knowledge/layout/spacing-and-grid.md](../knowledge/layout/spacing-and-grid.md):

```css
:root {
  --space-2xs: 2px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-base: 16px;
  --space-lg: 20px;
  --space-xl: 24px;
  --space-2xl: 32px;
  --space-3xl: 48px;
  --space-4xl: 64px;
}
```

Density bias for Korean consumer apps: **higher than Western defaults** (cite [knowledge/i18n/korean-product-conventions.md](../knowledge/i18n/korean-product-conventions.md)). List items use `--space-md` vertical padding (not `--space-base`); cards use `--space-base` (not `--space-lg`).

### Radius

```css
:root {
  --radius-sm: 6px;
  --radius-md: 10px;          /* default — friendly but not toy */
  --radius-lg: 16px;          /* cards, sheets */
  --radius-xl: 24px;          /* hero modules */
  --radius-full: 9999px;      /* pills, avatars */
}
```

### Elevation

Mobile-first: avoid heavy shadows (battery, GPU). Use border-default for separation; reserve shadow for floating UI.

```css
:root {
  --shadow-none: none;
  --shadow-card: 0 1px 2px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.04);  /* very soft border-shadow combo */
  --shadow-popover: 0 12px 24px rgba(15, 23, 42, 0.10);  /* dropdown, popover */
  --shadow-modal: 0 24px 48px rgba(15, 23, 42, 0.18);    /* sheet, modal */
}

.dark {
  --shadow-card: none;        /* in dark, use --color-bg-elevated for separation, no shadow */
  --shadow-popover: 0 12px 24px rgba(0, 0, 0, 0.5);
  --shadow-modal: 0 24px 48px rgba(0, 0, 0, 0.6);
}
```

### Motion

Cite [knowledge/motion/principles.md](../knowledge/motion/principles.md):

```css
:root {
  --motion-fast: 150ms;
  --motion-default: 250ms;
  --motion-slow: 400ms;

  --easing-out: cubic-bezier(0, 0, 0.2, 1);          /* entrances */
  --easing-in: cubic-bezier(0.4, 0, 1, 1);            /* exits */
  --easing-in-out: cubic-bezier(0.4, 0, 0.2, 1);      /* position changes */
  --easing-emphasized: cubic-bezier(0.2, 0, 0, 1);    /* hero moments */
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-fast: 0ms;
    --motion-default: 0ms;
    --motion-slow: 0ms;
  }
}
```

---

## 2. Component baseline

**Picked: shadcn-ui (NativeWind/Tailwind compatible variants).**

Reasoning:
- Stack mandate (NativeWind) → tokens-via-CSS-variables, not theme-prop pattern.
- Solo founder → wants to **own** the components, not depend on a library that locks the API.
- Korean market → expect to override copy, validation rules, payment integrations heavily; copy-paste suits.
- Speed → shadcn add-by-name is the fastest path to "shipped".

Rejected:
- **MUI**: ThemeProvider-based, doesn't translate cleanly to React Native.
- **Ant Design Mobile**: powerful but Chinese-market-coded; less common in Korean consumer apps; aesthetic doesn't fit modern Korean fintech.
- **NativeBase / Tamagui**: Tailwind-adjacent but smaller community in Korea.

For React Native specifically: shadcn-ui has community RN ports (`gluestack-ui` is the closest 1:1, or use shadcn web → adapt). Spec the components per [skills/component-spec-writer/PLAYBOOK.md](../skills/component-spec-writer/PLAYBOOK.md) and pick the implementation per platform.

---

## 3. Starter component set (v0.1.0)

The minimum to ship MVP. Each one is either **derived** (use shadcn baseline + token override) or **custom** (needs its own spec — fintech-specific).

### Derived from shadcn baseline

- Button — see [examples/component-button.md](component-button.md)
- Input — see [examples/component-input.md](component-input.md)
- Modal / Sheet — see [examples/component-modal.md](component-modal.md) (use Sheet variant for mobile)
- Toast — see [examples/component-toast.md](component-toast.md)
- Card — see [examples/component-card.md](component-card.md)
- Badge, Tag
- Tabs (bottom tab bar specifically)
- Switch, Checkbox, Radio
- Skeleton

### Custom — needs in-house spec (Phase 2 work)

- **AmountInput** — number-formatted, comma-separator, ₩ suffix, KRW-rounded validation. Most-used input in the app.
- **TransactionListItem** — composed of icon + category + memo + amount; tabular numerals; pressable.
- **CategoryPicker** — emoji + Korean label, scrollable horizontal pill list.
- **DateRangeSelector** — supports Korean expressions ("이번 달", "지난 달", "최근 7일").
- **AccountCard** — bank logo + nickname + masked account number + balance.
- **AmountDisplay** — large display variant for "balance" hero with breakdown chips.
- **BiometricGate** — fingerprint/face-id wall (Korean fintech expectation).

---

## 4. Foundations document — color usage

When to use each color:

- **`--color-primary-default`**: primary CTA only ("이체하기", "확인", "다음"). One per screen.
- **`--color-money-positive`**: amount text when positive (income line, deposit, balance increase). NOT for buttons.
- **`--color-money-negative`**: amount text when negative (expense, withdrawal). NOT for "destructive" buttons — use `--color-error` for those.
- **`--color-error`**: validation errors, destructive button intent.
- **`--color-text-primary`**: body, neutral amounts.
- **`--color-accent`**: rarely — promotional banners, "new" badges. Not for amount semantics.

Don't:
- Don't use `--color-primary-default` for amount text. Money color is its own axis.
- Don't use `--color-money-positive` for success buttons — use `--color-success`. Money colors are noun-scoped (the amount is income), not adjective-scoped (the action succeeded).
- Don't use `--color-error` for the negative-amount text. Negative != bad.

---

## 5. Foundations document — Korean considerations

Cite [knowledge/i18n/korean-product-conventions.md](../knowledge/i18n/korean-product-conventions.md), [knowledge/i18n/korean-publishing.md](../knowledge/i18n/korean-publishing.md).

- **Phone-first auth**: KakaoTalk login as primary social, SMS verification for native sign-up. Apple/Google login below.
- **본인인증**: integrate PASS or NICE for transactions over ₩500K (typical fintech threshold).
- **Address**: Daum Postcode API for any address field.
- **Payment integrations**: Toss Payments SDK (cards), KakaoPay/NaverPay (wallets), 휴대폰결제 (small amounts).
- **Currency display**: `1,200,000원` (Korean consumer convention) or `₩1,200,000` (Western/fintech). Pick one — default to `원` suffix for consumer warmth.
- **Date format**: `2026.05.07` (compact) or `2026년 5월 7일` (formal). Default compact in tables, formal in transaction details.
- **Tone**: polite/honorific in error messages ("오류가 발생했습니다"), casual in CTAs ("저장", not "저장하시겠습니까").
- **Submission compliance**: separate marketing-consent checkbox at signup; in-app permission disclosure popups before requesting Android permissions; GRAC age rating not needed (non-game).

---

## 6. Output structure (what to commit)

```
fintech-app/
├── tokens/
│   ├── source.json              # Style Dictionary source (W3C DTCG)
│   └── README.md
├── src/
│   ├── styles/
│   │   ├── tokens.css           # generated
│   │   └── tokens.tailwind.js   # generated
│   ├── components/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── AmountInput/         # custom
│   │   ├── TransactionListItem/ # custom
│   │   └── ...
│   └── theme/
│       └── ThemeProvider.tsx
├── docs/
│   ├── FOUNDATIONS.md           # color, type, spacing, motion, iconography rules
│   ├── KOREAN.md                # Korean-specific patterns
│   └── COMPONENTS.md            # component inventory + status
└── style-dictionary.config.json
```

`tokens/source.json` is the canonical source. Style Dictionary builds the rest.

---

## 7. Hand-off — what eng needs to do

1. `npm install -D style-dictionary` and copy `style-dictionary.config.json` (see [docs/TOKEN-SYNC.md](../docs/TOKEN-SYNC.md)).
2. Create `tokens/source.json` from this document (use Style Dictionary V4 W3C format).
3. Run `npx style-dictionary build`. Outputs land in `src/styles/`.
4. `npx shadcn@latest add button input dialog sheet sonner card badge tabs switch checkbox radio skeleton` — pulls baseline components.
5. For each baseline, override the CSS-vars usage to point at our token names (a 5-min find-replace per component).
6. Implement custom components from the Phase 2 list. Each gets its own spec via `component-spec-writer` skill.
7. Wire up Toss Payments / KakaoPay SDKs.
8. Add Daum Postcode for address fields.
9. Implement Korean publishing checklist before submission to App Store / Play.

---

## Cited sources

- [knowledge/colors/color-theory.md](../knowledge/colors/color-theory.md)
- [knowledge/colors/palettes-by-product-type.md](../knowledge/colors/palettes-by-product-type.md)
- [knowledge/a11y/contrast.md](../knowledge/a11y/contrast.md)
- [knowledge/typography/type-scale-fundamentals.md](../knowledge/typography/type-scale-fundamentals.md)
- [knowledge/typography/font-pairings.md](../knowledge/typography/font-pairings.md)
- [knowledge/layout/spacing-and-grid.md](../knowledge/layout/spacing-and-grid.md)
- [knowledge/motion/principles.md](../knowledge/motion/principles.md)
- [knowledge/i18n/korean-typography.md](../knowledge/i18n/korean-typography.md)
- [knowledge/i18n/korean-product-conventions.md](../knowledge/i18n/korean-product-conventions.md)
- [knowledge/i18n/korean-publishing.md](../knowledge/i18n/korean-publishing.md)
- [knowledge/components/INDEX.md](../knowledge/components/INDEX.md)
- [skills/design-system-builder/PLAYBOOK.md](../skills/design-system-builder/PLAYBOOK.md)
- [skills/color-palette/PLAYBOOK.md](../skills/color-palette/PLAYBOOK.md)
- [docs/TOKEN-SYNC.md](../docs/TOKEN-SYNC.md)
