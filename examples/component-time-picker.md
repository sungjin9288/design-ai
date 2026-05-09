# `TimePicker` — spec

> Synthesized from Ant Design `TimePicker` and MUI `TimePicker`. A picker for hour / minute / second selection. Distinct from `DatePicker` (date only) and `DateTimePicker` (combined).

## When to use

- Schedule pickers (meeting time, alarm, reservation).
- Time-only inputs (no date context).
- Time range selection (start + end time).

When NOT to use:
- Date-only — use `DatePicker`.
- Date + time combined — use `DateTimePicker`.
- Duration (e.g., "30 minutes") — use a duration input (numeric stepper).

## Anatomy

```
[ 14:30  ▾ ]                ← trigger field
       ↓ open
       ┌─────────────────────┐
       │  10  ▲  20  ▲  00 ▲  │
       │  11     21     45    │
       │  12     22     50    │
       │  13     23     55    │
       │  14   ◀ 30   ◀ 00 ◀ │   ← currently selected
       │  15     31     05    │
       │  ...                 │
       │                      │
       │  [Now]    [Confirm]  │
       └─────────────────────┘
```

## API

```tsx
<TimePicker
  value={time}
  onChange={setTime}
  format="HH:mm"
  use12Hours={false}
  step={5}
/>

<TimeRangePicker
  value={[start, end]}
  onChange={([s, e]) => { setStart(s); setEnd(e); }}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `Date \| Dayjs \| null` | controlled | Selected time |
| `onChange` | `(time) => void` | — | Callback |
| `format` | `string` | `"HH:mm:ss"` | Display format |
| `use12Hours` | `boolean` | `false` | 12-hour with AM/PM |
| `step` | `number` | `1` | Minute granularity (5, 10, 15, 30) |
| `showSecond` | `boolean` | `true` | Include seconds picker |
| `disabled` | `boolean` | `false` | — |
| `disabledHours` | `() => number[]` | — | Hours unavailable |
| `disabledMinutes` | `(hour) => number[]` | — | Minutes unavailable per hour |
| `placeholder` | `string` | locale default | Placeholder |

## Variants

### Granularity

| Step | Use |
| --- | --- |
| 1 | Precise scheduling |
| 5 | Most consumer apps |
| 15 | Calendar appointments |
| 30 | Hourly time slots |

Avoid step=2 / 3 — feels arbitrary.

### 12 vs 24 hour

| Format | Default region |
| --- | --- |
| 24-hour (HH:mm) | Korea, EU, military |
| 12-hour (h:mm AM/PM) | US, casual contexts |

Korean apps default to 24-hour. Some consumer apps offer toggle.

### Range

```tsx
<TimeRangePicker value={[start, end]} onChange={...} />
```

For appointments, schedules. End must be after start (validate inline).

## States

| State | Visual |
| --- | --- |
| Default | Field shows placeholder or value |
| Focus | Field highlighted; picker can open on click |
| Open | Time grid overlay |
| Selected | Highlighted hour / minute / second columns |
| Disabled hour/min | Grayed in picker |
| Error | Red border (validation) |

## Tokens consumed

```
--time-picker-bg                   (panel)
--time-picker-fg
--time-picker-bg-hover
--time-picker-bg-selected
--time-picker-border
--space-sm, --space-md
--font-size-sm
--motion-fast
--z-overlay
```

## Accessibility

- Trigger: `<input>` with `role="combobox" aria-haspopup="dialog"`.
- Picker: `role="dialog"` (or `listbox`).
- Each column (hours / minutes / seconds): `role="listbox"` with `<li role="option">` items.
- Keyboard:
  - Arrow Up/Down within column.
  - Tab moves between columns.
  - Enter confirms selection.
  - Esc closes picker.
- Touch: large tap targets (≥ 44pt) for each cell.
- Format announcement: read selected time clearly ("오후 2시 30분" or "14시 30분").

## Korean conventions

- 24-hour default; some apps toggle 오전/오후 (AM/PM).
- Format: "14:30" or "오후 2:30".
- Speaker: "오후 두 시 삼십 분" (TTS).
- Korean step convention: 30분 (half-hour) for appointments; 5분 / 10분 for finer-grained.

```tsx
<TimePicker
  value={time}
  onChange={setTime}
  format="HH:mm"
  step={5}
  placeholder="시간 선택"
  locale={koLocale}
/>
```

## Code example — appointment booking

```tsx
function AppointmentBooking() {
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);

  // Disable past times today
  const disabledHours = () => {
    if (!isSameDay(date, today)) return [];
    const now = new Date().getHours();
    return Array.from({ length: now }, (_, i) => i);
  };

  return (
    <Field>
      <Label>예약 시간</Label>
      <TimePicker
        value={time}
        onChange={setTime}
        format="HH:mm"
        step={30}
        disabled={!date}
        disabledHours={disabledHours}
      />
    </Field>
  );
}
```

## Edge cases

- **DST transitions**: spring-forward / fall-back hours may have valid time pairs (1:30 AM happens twice on fall-back). Disambiguate via timezone.
- **Different timezones**: clearly label which zone is being selected.
- **Async-disabled times**: server checks "is this slot available?" — show loading + filter.
- **End-time before start-time** (range picker): validate inline; show error before submit.
- **Reduced motion**: skip column-scroll animation.
- **RTL**: column order may flip (hours/min/sec right-to-left).

## Don't

- Don't use 24-hour AM/PM ("14:30 PM"). One or the other.
- Don't use step=1 minute by default for casual schedulers — 30 picks per hour is overwhelming.
- Don't omit "Now" button on time-of-day pickers.
- Don't allow seconds for casual scheduling (most users don't care).

## References

- Ant: [`TimePicker`](../refs/ant-design/components/time-picker)
- MUI: `TimePicker` (in @mui/x-date-pickers)
- HTML5: `<input type="time">` (limited but accessible default)

## Cross-reference

- [`examples/component-date-picker.md`](component-date-picker.md)
- [`examples/component-calendar.md`](component-calendar.md)
