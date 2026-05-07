# `DatePicker` — spec

> Citing Ant Design `DatePicker`, MUI `DatePicker` (X package), shadcn-ui `calendar` + `date-picker` (react-day-picker)

## Purpose

A DatePicker lets users pick a date or date range. Two distinct use cases drive different optimal UI:

| Use case | Recommended UI |
| --- | --- |
| Pick a date the user **knows** (DOB, expiry, settled appointment) | Text input with format hint, OR three dropdowns (Y/M/D) |
| Pick a date the user is **choosing** (booking, scheduling, filtering) | Calendar grid (popover or sheet) |

Implementing the wrong UI for the use case is the most common bug. Don't make users navigate a calendar to enter their birthday.

## Variants

### `single` — pick one date

```
┌──────────────────────┐
│ 📅  2026.05.07       │   ← compact input (month+day visible)
└──────────────────────┘
        │
        ▼ (on click, opens popover)
┌────────────────────────────────────┐
│       ◀  May 2026  ▶               │
│ Su Mo Tu We Th Fr Sa               │
│              1  2                  │
│  3  4  5  6  7  8  9               │
│ 10 11 12 13 14 15 16               │
│ ...                                │
└────────────────────────────────────┘
```

### `range` — pick a start + end

Same UI; calendar shows both selections highlighted with the days between styled as range fill.

```
┌──────────────────────────────────┐
│ 📅  2026.05.07 — 2026.05.14      │
└──────────────────────────────────┘
```

### `dateTime` — date + time

```
┌──────────────────────────────────────────┐
│ 📅  2026.05.07  14:30                    │
└──────────────────────────────────────────┘
```

Calendar above, time picker below. Time as separate scrollable wheels (mobile native), dropdowns (desktop), or two number inputs.

### `quickRange` — preset range pills

For dashboards / analytics:

```
[오늘]  [7일]  [30일]  [이번 달]  [지난 달]  [사용자 지정 ▾]
```

Clicking "사용자 지정" opens the full range picker. Pre-defined ranges cover ~80% of analytics use cases.

## API

```tsx
<DatePicker
  value={date}
  onValueChange={setDate}
  mode="single"          // "single" | "range" | "dateTime" | "quickRange"
  format="yyyy.MM.dd"     // display format
  placeholder="날짜 선택"
  minDate={new Date()}
  maxDate={addYears(new Date(), 1)}
  disabledDates={(d) => isWeekend(d)}
  locale="ko-KR"
  showTime={false}
  weekStartsOn={0}        // 0=Sun, 1=Mon
  presets={[
    { label: "오늘", value: today() },
    { label: "이번 주", value: thisWeek() },
  ]}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `Date \| { from: Date, to: Date } \| null` | — | Controlled value |
| `defaultValue` | same | — | Uncontrolled default |
| `onValueChange` | `(value) => void` | — | Fires on selection |
| `mode` | `"single" \| "range" \| "dateTime" \| "quickRange"` | `"single"` | |
| `format` | `string` | locale default | Display format (date-fns or dayjs syntax) |
| `placeholder` | `string` | locale default | When no value |
| `minDate` / `maxDate` | `Date` | — | Bounds |
| `disabledDates` | `(date) => boolean` | — | Disable specific dates (weekends, holidays) |
| `locale` | `string` | `"ko-KR"` (KR builds) | |
| `weekStartsOn` | `0..6` | `0` (Sunday) for KR/US | Korean and US start on Sun; EU on Mon |
| `presets` | `{ label, value }[]` | — | Quick-pick buttons in popover |
| `disabled` / `readOnly` | `boolean` | `false` | |
| `error` / `errorText` | — | — | Validation state |

## Korean format conventions

Per [knowledge/i18n/korean-typography.md](../knowledge/i18n/korean-typography.md):

| Format | Example | Use |
| --- | --- | --- |
| `yyyy.MM.dd` | `2026.05.07` | Compact — default for most product UIs |
| `yyyy년 M월 d일` | `2026년 5월 7일` | Formal — invoices, legal docs |
| `yyyy-MM-dd` | `2026-05-07` | Technical / ISO — admin tools |
| `M월 d일 (E)` | `5월 7일 (목)` | Casual — "이번 주", "오늘" relative contexts |

Korean weekday short forms: 일 월 화 수 목 금 토 (single character).

Do **not** use US format `MM/dd/yyyy` in Korean apps.

## States

| State | Visual |
| --- | --- |
| Empty (no value) | Placeholder text, calendar icon |
| Filled | Selected date in input format |
| Hover (input) | Border emphasis |
| Focus-visible | 2px ring (matches Input spec) |
| Open (popover visible) | Border emphasis, panel positioned below or above per viewport |
| Disabled date in calendar | Muted text, no events, `aria-disabled` |
| Today | Subtle highlight (border or bold) |
| Selected date | Filled bg `--color-primary-default`, white text |
| In-range dates | Subtle bg `--color-primary-subtle-bg` |
| Range start/end | Filled bg, rounded only on the appropriate side |

## Calendar grid

```
┌────────────────────────────────────────────┐
│  ◀     2026년 5월     ▶     [오늘로]        │
├────────────────────────────────────────────┤
│ 일  월  화  수  목  금  토                   │
├────────────────────────────────────────────┤
│              1   2                          │  ← month-prev days muted
│  3   4   5   6  ●7   8   9                  │  ● = today
│ 10  11  12  13  14  15  16                  │
│ ...                                         │
└────────────────────────────────────────────┘
[       ✕ Cancel       ✓ Confirm  ]   ← (mobile only, on sheet variant)
```

| Cell size | Use |
| --- | --- |
| 32×32 | Compact desktop |
| 40×40 | Default desktop |
| 48×48 | Mobile (touch target) |

## Mobile presentation

| Width | Presentation |
| --- | --- |
| Desktop (> md) | Popover anchored to input |
| Tablet | Popover, larger cells |
| Mobile (< md) | **Bottom sheet** with confirm/cancel buttons |

On mobile, **don't try to fit a popover under the input** — use a bottom sheet that takes ~70% of viewport height. Cells are 48×48 minimum.

The native `<input type="date">` on mobile uses the OS-native picker (iOS scrolling wheels, Android calendar). For Korean apps with custom branding, prefer a custom picker over native — but accept that custom picker has more bugs than native.

## Accessibility

- **Combobox pattern**: input has `role="combobox"`, `aria-expanded`, `aria-controls` pointing at the calendar's id.
- **Calendar grid**: `role="grid"`, each cell `role="gridcell"`. Day-of-week headers `role="columnheader"`.
- **Selected cell**: `aria-selected="true"`.
- **Disabled cell**: `aria-disabled="true"`.
- **Today**: `aria-current="date"`.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reaches input. Pressing again leaves the picker. |
| `↓` (on input) | Opens calendar, focus moves to today (or selected date). |
| `Esc` | Closes calendar. |
| `←` `→` | Move 1 day |
| `↑` `↓` | Move 1 week |
| `PageUp` / `PageDown` | Move 1 month |
| `Shift+PageUp` / `Shift+PageDown` | Move 1 year |
| `Home` / `End` | First / last day of week |
| `Enter` / `Space` | Select focused date |

This is the WAI-ARIA APG date picker pattern. Required for AAA compliance.

### Screen reader

Announce on date selection: "May 7, 2026 selected" (or KR "2026년 5월 7일 선택됨").

## Tokens consumed

```
--color-bg-default          (calendar bg)
--color-bg-subtle           (current month days hover)
--color-text-primary
--color-text-secondary      (other-month days)
--color-text-tertiary       (weekday headers)
--color-primary-default     (selected day)
--color-primary-subtle-bg   (in-range days)
--color-on-primary          (selected day text)
--color-border-default
--space-sm, --space-md
--radius-md                  (calendar cells)
--motion-fast, --easing-out
```

## Edge cases

- **Range start before end after re-pick**: if user picks a date before current `from`, swap automatically (it becomes the new `from`).
- **Time zone**: store dates as ISO 8601 with TZ. KST is UTC+9, no DST. For multi-region apps, display in user's local TZ; store in UTC.
- **Korean lunar calendar (음력)**: rare in product UIs but present in tradition/festival apps. Don't try to support both in one component — make it a separate `LunarDatePicker` if needed.
- **Disabled dates that include the current value**: when min/max changes and current value falls outside, clear the value or clamp to the new bound. Surface to user.
- **Far-past dates** (DOB year picker): scrolling 80 years in monthly steps is hostile. Provide a year-jump dropdown in the calendar header.
- **Far-future dates** (lease end, project deadline): same — year jump.
- **Holidays / 공휴일**: Korean apps often highlight holidays in red. Pass `holidays={[...]}` and style at the cell level.
- **Quick presets vs calendar**: when both are present, picking a preset highlights the date(s) on the calendar but stays in the popover. User can adjust manually after.

## Don't

- Don't ship date picker for birthday / DOB in calendar mode. Use 3-dropdown (Y/M/D) or text input with format hint. The user **knows** their DOB.
- Don't disable confirm-button until both range dates are picked — let user click the same date twice (single-day range) or pick non-contiguous if `mode="multi"` is supported.
- Don't auto-close popover after picking start of range. Wait for end.
- Don't use 12-hour time with AM/PM in Korean apps. Default 24-hour.
- Don't use month names "January" in Korean app. Use `1월`.
- Don't put DatePicker inside a Modal — both want focus management. Use a non-modal popover anchored to the input.

## References

- Ant Design: [`refs/ant-design/components/date-picker/`](../refs/ant-design/components/date-picker/) — most variants (`DatePicker`, `RangePicker`, `MonthPicker`, `YearPicker`, `WeekPicker`, `QuarterPicker`). Heavy but covers everything.
- MUI: `@mui/x-date-pickers` (separate package) — `DatePicker`, `DateTimePicker`, `DateRangePicker`. Excellent locale support; pairs with date-fns / dayjs / luxon adapters.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/calendar.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/calendar.tsx) — wraps `react-day-picker`. Compose with `Popover` for the picker pattern.

API choices made:
- **`mode` axis** (single / range / dateTime / quickRange) over Ant's separate components — fewer top-level imports.
- **`presets` first-class**: most product UIs eventually want them; building a wrapper to add them is more friction than necessary.
- **`weekStartsOn` exposed**: locale-driven default (KR/US: Sunday; EU: Monday).
- **No "lunar calendar" mode**: niche. Spec a separate `LunarDatePicker` if needed; don't bloat this.

## Cross-reference

- [knowledge/i18n/korean-typography.md](../knowledge/i18n/korean-typography.md) — Korean date formats
- [knowledge/patterns/form-design.md](../knowledge/patterns/form-design.md) — when to use vs three-dropdown
- [WAI-ARIA Date Picker pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/)
