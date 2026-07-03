# `AlertTitle` — spec

> Synthesized from MUI `AlertTitle`. The header line inside an `Alert`. Use for alerts with both a short title and a longer body — without it, the alert just shows a one-line message.

## When to use

- Multi-line alerts where the first line is a summary and the rest is detail.
- Alerts that need a strong visual hierarchy ("Something went wrong" + paragraph of detail).

## When NOT to use

- One-line alerts → just use `<Alert>` with text content.

## API

```tsx
<Alert severity="error">
  <AlertTitle>저장에 실패했어요</AlertTitle>
  네트워크 연결을 확인하고 다시 시도해 주세요. 문제가 계속되면{' '}
  <Link href="/help">도움말</Link>을 참고하세요.
</Alert>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Title text |

Extends `Typography` — typography props work.

## Tokens consumed

```
--font-size-heading-sm     /* 16px */
--font-weight-semibold
--space-xs                 /* margin-bottom to body */
```

## Accessibility

- Renders inside the Alert's accessible region.
- For severity changes, the title color follows (error red, warning amber, etc.).
- Don't omit the title for severity-error multi-paragraph alerts — title gives quick scan.

## Edge cases

- **Korean honorific** — match the alert severity. Error: 합쇼체 ("저장에 실패하셨습니다"). Info: 해요체 ("저장됐어요").
- **Long titles** — wrap; for ellipsis, use `noWrap` on Typography.

## Code example

```tsx
<Alert
  severity="warning"
  action={
    <Button color="inherit" size="small" onClick={handleDismiss}>
      닫기
    </Button>
  }
>
  <AlertTitle>저장하지 않은 변경사항이 있어요</AlertTitle>
  페이지를 떠나면 변경사항이 사라져요. 저장하시겠어요?
</Alert>
```

## Don't

- Don't use for one-liner alerts.
- Don't put interactive elements inside the title — they belong in `action`.

## References

- MUI: [`AlertTitle`](../docs/reference/mui.md#alert-title)

## Cross-reference

- [`component-alert.md`](component-alert.md)
- [`component-snackbar.md`](component-snackbar.md)
