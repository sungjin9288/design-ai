<!-- hand-written -->
---
title: Settings page patterns
applies_to: [web, mobile, all-ui]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Settings page patterns

A settings page is a list of toggles, choices, and links. The hard parts: organization, save behavior, and the destructive actions at the bottom.

## Three layouts

| Layout | Use |
| --- | --- |
| **Single-page list** | Mobile, simple settings (≤ 20 items) |
| **Sidebar + content** | Desktop, complex settings (account, billing, integrations, etc.) |
| **Tabbed** | Medium complexity — 3–5 sections, no need for sidebar |

For Korean consumer mobile: **single-page list** is the convention. Settings sections separated by visual gaps; section headers small and gray.

For B2B SaaS desktop: **sidebar + content** is the convention. The sidebar lists categories; clicking shifts the right panel.

## Anatomy — single-page

```
[Top app bar: ← 설정]

──── 계정 ────────────────────
이름                  김민지   >
이메일       minji@example.com >
프로필 사진             변경  >

──── 알림 ────────────────────
푸시 알림                 ●━○
이메일 수신                ○━●
   알림 빈도            매일  >

──── 결제 ────────────────────
결제 수단              KB ****  >
구독 관리                      >

──── 보안 ────────────────────
비밀번호 변경                  >
2단계 인증                ○━●

──── 기타 ────────────────────
약관                          >
개인정보처리방침                >
앱 버전               v1.4.2

──── ─────────────────────────
로그아웃                  ↗
계정 삭제                  ⚠
```

| Element | Notes |
| --- | --- |
| Section header | Small (12–13px), `--color-text-tertiary`, uppercase or label-style |
| Section gap | `--space-2xl` (32px) between sections |
| Row height | 48px mobile / 40px desktop dense |
| Trailing chevron `>` | For drill-in (opens detail screen) |
| Trailing toggle | For boolean settings |
| Trailing value (e.g., "매일") | When the setting has a current value visible |
| Destructive at bottom | Logout, delete account |

## Save behavior — three patterns

| Pattern | Save trigger | Use |
| --- | --- | --- |
| **Auto-save (per change)** | On toggle, on blur of input | Settings that are clearly individual toggles. Default for most. |
| **Save bar** | Sticky banner appears when changes exist; user clicks Save | Multi-field forms, billing info, profile editing |
| **Modal with confirm** | Open detail screen, edit, click Save | Complex changes (password change, payment method) |

**Pick the lowest-friction pattern that's safe.**

For toggles (notifications on/off): auto-save. The user expects immediate effect.

For forms (display name, address): save bar. The user might tweak multiple fields before deciding.

For destructive (delete account, change password): modal with explicit confirm.

### Save bar

```
┌────────────────────────────────────────────────────┐
│ Profile                                             │
│ [name input]                                        │
│ [email input]                                       │
│ [bio textarea]                                      │
│ ...                                                 │
│                                                     │
│ [save bar appears as soon as anything changes]      │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐  ← sticky bottom
│  Unsaved changes        [Discard]    [Save]        │
└────────────────────────────────────────────────────┘
```

- Appears when state diverges from saved.
- Cleanly disappears after successful save (toast confirmation).
- Disabled save button during validation errors — but tooltip explains why.
- Discard prompt for unsaved navigation away.

## Korean settings copy

Standard section labels:

| Korean | English |
| --- | --- |
| 계정 | Account |
| 알림 | Notifications |
| 결제 | Billing / Payments |
| 구독 | Subscription |
| 보안 | Security |
| 개인정보 | Privacy |
| 약관 | Terms |
| 도움말 | Help |
| 앱 정보 | About |
| 기타 | Other |

Standard row labels:

| Korean | English |
| --- | --- |
| 비밀번호 변경 | Change password |
| 이메일 수신 | Email notifications |
| 푸시 알림 | Push notifications |
| 다크 모드 | Dark mode |
| 언어 | Language |
| 로그아웃 | Sign out |
| 계정 삭제 | Delete account |

## Section organization — what goes where

The order matters. Korean consumer apps converge on this rough order:

1. **계정 (Account)** — name, email, photo, basic identity
2. **알림 (Notifications)** — frequency, channels
3. **결제 / 구독** — payment methods, current plan
4. **보안** — password, 2FA, login history
5. **앱 환경** — language, theme, density
6. **개인정보** — data, marketing consent
7. **기타 / 정보** — legal, about, version
8. **위험한 액션** — sign out, delete (with separator)

Don't:
- Don't put destructive actions in the middle.
- Don't bury security under "More" — make it a top-level section.
- Don't combine billing + payment methods + subscription if they're different concepts.

## Destructive actions at the bottom

```
──── ─────────────────────────
로그아웃                       
계정 삭제 ⚠ 
```

- Visual gap above (heavier divider or extra space).
- "Log out" is neutral; "Delete account" is red (`--color-error`).
- Both require confirmation:
  - **Log out**: simple Yes/No modal.
  - **Delete account**: stronger confirm — type the username, plus checkboxes for "I understand this is permanent" + "I understand my data will be deleted".
- For data export before delete: provide an obvious "Export my data" link first.

## Toggles vs drill-in

| Choice | Use toggle | Use drill-in |
| --- | --- | --- |
| Setting has 2 values (on/off) | ✓ | — |
| Setting has 3+ values | — | ✓ — opens a screen with radios |
| Setting needs sub-options | — | ✓ |
| Setting includes input field | — | ✓ |

```
✓ Push notifications              ●━○      [boolean → toggle]
✓ Notification frequency    매일  >        [3+ values → drill-in]
✓ Profile name              민지  >        [text input → drill-in]

✗ Theme                  Light  ●━○        [3 values can't fit a toggle]
```

## Drill-in screens

When a row drills into a sub-screen:

```
[← Back] Notification frequency

Choose how often you want notifications:

○  Real-time
●  Daily summary
○  Weekly summary
○  Off

[설명: ...]
```

- Use radio group for 3+ choices.
- Use form for free-text input.
- Save behavior: usually auto-save on selection (radio) OR save button (form).
- Back button returns to settings list.

## Mobile patterns

- Settings is the canonical use case for the **bottom-tab-bar with no settings tab** — instead, settings is reached via "MY" or "More" tab → drill in.
- Don't show settings as a top-level tab unless the app is settings-heavy.
- Header: "← 설정" with no actions.
- Pull-to-refresh: not applicable (settings don't refresh).

## Desktop patterns — sidebar + content

```
┌──────────────┬─────────────────────────────────────────┐
│ ⚙ 설정        │  ── 계정 ─────────────────────         │
│              │  Profile                                │
│ ● 계정        │  [name input]                          │
│ ○ 알림        │  [email input]                         │
│ ○ 결제        │  ...                                    │
│ ○ 보안        │                                        │
│ ○ 정보        │                                        │
└──────────────┴─────────────────────────────────────────┘
```

- Sidebar fixed-width 200–280px.
- Active section highlighted (full row, not just text).
- Right panel scrolls; sidebar doesn't.
- URL syncs to section: `/settings/account`, `/settings/notifications`. Refresh preserves.

For very deep settings (organization-level, multi-tenant), nested sub-navigation in sidebar:

```
계정
  ▾ 프로필
    개인 정보
    공개 설정
  ▸ 보안
  ▸ 결제
```

But avoid > 2 levels — that's too deep.

## Tokens consumed

```
--color-bg-default
--color-bg-elevated         (sidebar bg, card sections)
--color-bg-subtle           (hover, section bg)
--color-text-primary
--color-text-secondary       (helper text)
--color-text-tertiary        (section labels)
--color-text-disabled
--color-error                (destructive)
--color-border-default       (rows divider)
--color-focus-ring
--space-md, --space-base, --space-2xl
--font-size-sm, --font-size-base
--font-size-xs               (section labels)
--radius-md
```

## Accessibility

- Section headers: `<h2>` (or appropriate); each section a `<section>` with `aria-labelledby`.
- Each row is keyboard-reachable. Toggles via `Space`. Drill-ins via `Enter`.
- For drill-in rows: render as `<a href>` (web) or `<Pressable>` (RN), not just clickable divs.
- Screen reader announces section + row label + current value.
- Destructive actions: confirmation modal must trap focus + restore on close. See [`examples/component-modal.md`](../../examples/component-modal.md).
- Form save bar: `aria-live="polite"` so changes announced.

## Common settings page anti-patterns

- **Hiding sign-out** under multiple drill-downs.
- **No confirmation on destructive actions** (delete account in one tap).
- **Auto-save on text inputs** (user paused typing → got saved with typo).
- **Save button without disabled state** (user clicks save with no changes).
- **Settings everywhere** — every page has its own settings panel. Centralize.
- **Inconsistent toggle direction** (some "off" is left, some "off" is right).
- **No breadcrumb on deep settings** (user lost in /settings/account/security/2fa/codes).
- **Modal stacking** for nested settings drill-ins — should be a screen push, not a modal.
- **Settings modal that closes on outside click** while editing — user loses unsaved input.

## Code example

```tsx
function SettingsPage() {
  return (
    <Page>
      <PageHeader>설정</PageHeader>

      <SettingsSection title="계정">
        <SettingsRow label="이름" value={user.name} onClick={() => nav("/settings/account/name")} />
        <SettingsRow label="이메일" value={user.email} onClick={() => nav("/settings/account/email")} />
      </SettingsSection>

      <SettingsSection title="알림">
        <SettingsRow label="푸시 알림" trailing={<Switch checked={notifyPush} onCheckedChange={setNotifyPush} />} />
        <SettingsRow label="이메일 수신" trailing={<Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />} />
        <SettingsRow label="알림 빈도" value={notifyFreq} onClick={() => nav("/settings/notifications/frequency")} />
      </SettingsSection>

      <SettingsSection title="기타">
        <SettingsRow label="약관" onClick={() => nav("/settings/terms")} />
        <SettingsRow label="앱 버전" trailing={<span>v{APP_VERSION}</span>} />
      </SettingsSection>

      <SettingsSection>
        <SettingsRow label="로그아웃" onClick={() => confirmLogout()} />
        <SettingsRow label="계정 삭제" intent="danger" onClick={() => confirmDelete()} />
      </SettingsSection>
    </Page>
  );
}
```

## Cross-reference

- [`knowledge/patterns/form-design.md`](form-design.md) — when settings include forms
- [`knowledge/patterns/mobile-navigation.md`](mobile-navigation.md) — settings inside MY tab
- [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md) — Korean labels and conventions
- [`examples/component-form-controls.md`](../../examples/component-form-controls.md) — Switch / Checkbox / Radio
