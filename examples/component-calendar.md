# `Calendar` (full month view) — spec

> Citing Ant Design `Calendar`, MUI (no dedicated — `DateCalendar` from x-date-pickers is similar), shadcn-ui `calendar` (react-day-picker)
>
> Different from `DatePicker` ([`component-date-picker.md`](component-date-picker.md)) — Calendar is a **full-page month view**; DatePicker is a popover for picking a date.

## Purpose

A full-month or full-year calendar view used as a primary UI surface — for scheduling apps, event listings, attendance trackers, or any view where the calendar IS the page.

## When Calendar vs DatePicker

| Pattern | Use |
| --- | --- |
| **Calendar** (this spec) | Calendar is the primary content of the screen. User browses dates, views events, clicks days. |
| **DatePicker** | User picks a date as form input. Calendar appears in a popover. |

If your screen's main job is "view this month", use Calendar. If picking a date is incidental, use DatePicker.

## Anatomy

```
┌────────────────────────────────────────────────────────────┐
│  ◀  2026년 5월  ▶               [월] [주] [년]   [+ 이벤트] │  ← header: nav + view + actions
├────────────────────────────────────────────────────────────┤
│  일  월  화  수  목  금  토                                  │  ← weekday headers
├────────────────────────────────────────────────────────────┤
│       1   2                                                  │
│       ●           [event chip]                              │  ← cell: number + indicator + events
│  3   4   5   6   7   8   9                                   │
│           ●                                                  │
│ 10  11  12  13  14  15  16                                   │
│ ...                                                           │
└────────────────────────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Header | yes | Month nav, view toggle, "today" button |
| Weekday row | yes | 일–토 (or Sun–Sat) |
| Date cells | yes | One per day; shows day number + events |
| Event indicators | optional | Dots, chips, or full event blocks |
| Today highlight | yes | Current date visually marked |
| Selected highlight | when applicable | Currently-selected date |

## API

```tsx
<Calendar
  value={selectedDate}
  onValueChange={setSelectedDate}
  view="month"
  events={events}
  renderCell={(date) => <CustomCellContent date={date} />}
  onDateClick={(date) => openDayDetail(date)}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `Date` | `today()` | Selected / focused date |
| `onValueChange` | `(date: Date) => void` | — | |
| `view` | `"month" \| "week" \| "year" \| "day"` | `"month"` | Time scale |
| `onViewChange` | `(view) => void` | — | |
| `events` | `Event[]` | `[]` | Events to render in cells |
| `renderCell` | `(date) => ReactNode` | default | Custom cell rendering |
| `onDateClick` | `(date) => void` | — | Cell click |
| `onEventClick` | `(event) => void` | — | Event chip click |
| `weekStartsOn` | `0..6` | `0` (Sun for KR/US) | |
| `locale` | `string` | `"ko-KR"` | |
| `holidays` | `{ date: Date, name: string }[]` | `[]` | Korean 공휴일, etc. |
| `disabledDates` | `(date) => boolean` | — | |
| `minDate` / `maxDate` | `Date` | — | |
| `density` | `"compact" \| "comfortable"` | `"comfortable"` | Cell height |

```ts
type Event = {
  id: string;
  date: Date;
  endDate?: Date;          // For multi-day events
  title: string;
  color?: string;
  data?: unknown;
};
```

## Views

### Month view (default)

7 columns × 5–6 rows. Each cell shows:
- Day number
- Events as small chips/dots (max 2–3 visible; "+N more" for overflow)
- Today highlighted
- Other-month days muted

### Week view

7 columns × 1 column of hours. Used for hour-by-hour schedule (calendar apps).

### Day view

Single column with hour rows. Detail view for one day.

### Year view

12 month thumbnails. Click any month to drill into Month view.

## Cell rendering — events

```
┌──────────────┐
│ 7        ●   │  ← day number + indicator
│              │
│ 10:00 회의   │  ← event chips (max 2-3)
│ 14:00 점심   │
│ + 2 more     │  ← overflow
└──────────────┘
```

| Indicator pattern | Use |
| --- | --- |
| Single dot | "Has events" — minimal, used in compact view |
| Color dots | "Multiple event types" — one per event |
| Event chips | Short title visible — full event titles, truncated |

For compact density (mobile): dots. For comfortable density (desktop): chips.

## States — per cell

| State | Visual |
| --- | --- |
| Default | Day number, events |
| Today | Bold day number, light bg or ring |
| Selected | Filled bg `--color-primary-default`, white number |
| Hover | Bg `--color-bg-subtle` |
| Other-month | Muted day number |
| Disabled | No events, muted, no click |
| Holiday | Day number in red (Korean convention for 공휴일) |
| Weekend | Day number subtly different (often blue for Saturday, red for Sunday in KR) |

### Korean holiday/weekend conventions

- 일요일 (Sunday): red
- 토요일 (Saturday): blue
- 공휴일 (national holidays): red
- 평일 (weekdays): default text color

```css
.calendar-cell[data-day="0"] { color: var(--color-error); }    /* Sunday */
.calendar-cell[data-day="6"] { color: var(--color-info); }     /* Saturday */
.calendar-cell[data-holiday="true"] { color: var(--color-error); }
```

## Sizes / density

| Density | Cell min-height | Padding | Use |
| --- | --- | --- | --- |
| `compact` | 60px | 4px | Mobile, dense schedule |
| `comfortable` (default) | 100px | 8px | Standard desktop |

For event-heavy calendars (Google Calendar style): cells expand to fit events with internal scroll.

## Tokens consumed

```
--color-bg-default
--color-bg-elevated         (cell bg)
--color-bg-subtle           (hover)
--color-primary-default     (today highlight, selected)
--color-primary-subtle-bg
--color-on-primary
--color-text-primary
--color-text-secondary       (other-month)
--color-text-tertiary        (weekday headers)
--color-error                (Sunday, holidays)
--color-info                 (Saturday)
--color-border-default
--space-xs, --space-sm
--radius-md
--font-size-sm, --font-size-base
```

## Accessibility — WAI-ARIA Calendar pattern

- Container: `role="grid"`, `aria-label="달력 2026년 5월"`.
- Weekday headers: `role="columnheader"`, `aria-label` for the full day name.
- Each row: `role="row"`.
- Each cell: `role="gridcell"`, `aria-selected`, `aria-current="date"` for today.
- Disabled: `aria-disabled="true"`.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reach grid (single tab stop into the cells) |
| `←` / `→` | Move 1 day |
| `↑` / `↓` | Move 1 week |
| `PageUp` / `PageDown` | Previous / next month |
| `Shift+PageUp/Down` | Previous / next year |
| `Home` / `End` | First / last day of week |
| `Enter` / `Space` | Select / activate cell |

This is the WAI-ARIA APG datepicker pattern. Same as DatePicker.

### Screen reader

- Announce date on focus change: "May 7, 2026, Wednesday"
- Announce events: "7 events on this day" or names if few
- Announce holidays: "Buddha's Birthday"

## Code example

```tsx
function MonthlyScheduleScreen() {
  const [selected, setSelected] = useState(new Date());
  const events = useEvents(selected);

  return (
    <div>
      <Calendar
        value={selected}
        onValueChange={setSelected}
        events={events}
        holidays={koreanHolidays}
        onDateClick={(date) => openDayDetail(date)}
        onEventClick={(event) => openEventDetail(event)}
        renderCell={(date) => (
          <DefaultCell
            date={date}
            isToday={isToday(date)}
            isHoliday={isHoliday(date)}
            events={events.filter(e => isSameDay(e.date, date))}
          />
        )}
      />
    </div>
  );
}
```

## Edge cases

- **Many events on a single day**: render first 2–3 + "+N more". Click day to open day-detail screen.
- **Multi-day event**: render as a horizontal bar spanning multiple cells (visual challenge — usually a separate library handles).
- **Cell content overflow**: ellipsis truncation; provide tooltip or detail-on-click.
- **Daylight saving** (not in Korea): handle correctly; display dates per local TZ.
- **Korean lunar calendar (음력)**: rare in product UIs. Some apps annotate Korean lunar date in cell (small, secondary).
- **Year boundary**: December → January transition shows partial rows from both.
- **Empty month**: render the grid normally; cells just have no events.
- **Mobile portrait**: month view's 7 columns crunch. Switch to compact density or week view by default.

## Don't

- Don't render Calendar without events when the screen's purpose is event display. Show empty state instead.
- Don't shrink cells below readable size. Switch view (week, day) instead.
- Don't combine 5+ event colors per day. Use neutral chips or fewer event types.
- Don't auto-redirect to day detail on click — let user opt in via explicit action.
- Don't use Calendar where DatePicker fits (form input).
- Don't forget keyboard navigation. Calendar without arrow keys is broken.
- Don't ship without locale support for the user's date/week conventions.

## References

- Ant Design: [`refs/ant-design/components/calendar/`](../docs/reference/ant-design.md#calendar) — `Calendar` with `mode="month" | "year"`, `dateCellRender`, `monthCellRender`. Most exhaustive.
- MUI: `@mui/x-date-pickers` `DateCalendar` — focused on date selection within a calendar grid; not full-month event-display.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/calendar.tsx`](../docs/reference/shadcn-ui.md#calendar) — wraps `react-day-picker`. Use as date selector or full calendar via `mode="default"` + `numberOfMonths`.

For event-heavy calendar apps (Google Calendar style), consider:
- `react-big-calendar` — month/week/day views with events
- `fullcalendar` — feature-rich, all views

This spec covers the **simpler full-month-with-event-indicators** case. For full event-management UIs, layer this with a calendar-specific library.

## Cross-reference

- [`examples/component-date-picker.md`](component-date-picker.md) — for form-input use
- [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md) — Korean date formats
- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md) — holiday + weekend color conventions
- [WAI-ARIA Date Picker pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/)
