<!-- hand-written -->
---
title: Korean gaming conventions (PC bang, mobile gacha, MMO, regulations)
applies_to: [game-ui, korean, kr-market, gacha, mmo]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Korean gaming conventions

Korean gaming has distinct UI conventions, regulatory requirements, monetization patterns, and cultural expectations. This file covers what's specific to the Korean game market.

Read [`game-ui-fundamentals.md`](game-ui-fundamentals.md) first.

## Market overview

Korea is one of the world's most important game markets:
- **Mobile gacha + MMORPG** dominate revenue.
- **PC bang (PC방)** culture: PC cafés where games are played with hourly rates.
- **High ARPU** — Korean players spend more per user than most markets.
- **Whale-driven monetization** — top spenders fund most revenue.

### Major Korean studios

| Studio | Notable games |
| --- | --- |
| **NEXON** | 메이플스토리, FIFA Online, KartRider, 던전앤파이터, 서든어택 |
| **NCSoft** | 리니지 / 리니지 M / 리니지 W, 길드워, 블레이드 & 소울, 아이온 |
| **Smilegate** | 크로스파이어, 로스트아크, 에픽세븐 |
| **Krafton** | 배틀그라운드 (PUBG), 칼리스토 프로토콜 |
| **Pearl Abyss** | 검은사막, 도깨비 |
| **Com2uS** | 서머너즈 워, 데스티니 차일드 |
| **Netmarble** | 세븐나이츠, 리니지 2 레볼루션, 마블 콘테스트 오브 챔피언스 |
| **Kakao Games** | 오딘:발할라 라이징, 우마무스메 (KR distribution) |

## Regulatory framework

### 게임산업진흥에관한법률 (Game Industry Promotion Act)

Korea regulates games heavily. Key rules:

#### 확률 표시 (probability disclosure)

**Mandatory**: gacha / loot box / random reward systems must disclose drop rates.

```
[가챠 결과 화면 또는 상점 페이지]
─────────────────────
SSR 캐릭터: 1.5%
SR 캐릭터: 8.5%
R 캐릭터: 90%
```

Required:
- All probabilities listed.
- Updated after each balance change.
- Accessible from store / gacha screen.
- For ENHANCED guaranteed (pity / 천장 system): also disclosed.

Failure = KFTC (공정거래위원회) fine. Several Korean gaming companies have been fined heavily for missing / incorrect disclosure (NEXON, Smilegate notable cases).

#### 청소년이용시간제한 (Youth play-time restriction)

Historically (now mostly relaxed but still relevant):
- **Shutdown law (셧다운제)** — youth couldn't play between midnight and 6am. Repealed 2022 but historical context for older games.
- **선택적 셧다운제** — parental control; family can set limits.
- **확인 시스템** — game IDs link to real-name verification (실명인증 / 본인인증) — Korean games require this.

#### 등급 분류 (Game ratings)

Korean Game Rating Administration Committee (GRAC / 게임물관리위원회) rates all games:
- **전체이용가** (All ages)
- **12세 이용가** (12+)
- **15세 이용가** (15+)
- **청소년이용불가** (18+)

Mobile / PC games released in Korea must have GRAC rating. Affects what content can be displayed.

### 본인인증 (real-name verification)

Korean games require player identity verification:
- **PASS** (mobile carrier authentication)
- **NICE / KCB** (credit bureau)
- **휴대폰 본인인증** (mobile phone)

For login screens / sign-up: typically deeper than Western games.

See [`knowledge/i18n/korean-payments.md`](../i18n/korean-payments.md) for 본인인증 details.

## PC bang (PC방) culture

PC bangs are PC cafés — pay hourly to use a high-end PC. Critical to Korean PC gaming culture.

### Implications for game UI

- **PC bang exclusive content / bonuses** — many games have benefits when played from PC bang IP.
- **Account login** is heavy (vs Western "press play to start").
- **Auto-detection of PC bang** — server-side; UI shows PC bang badge / XP boost.
- **Hourly session expectation** — long PvP / raid sessions; UI assumes 2-5 hour play windows.

### Common Korean PC games

- **롤 (League of Legends)** — Korea is LoL-dominant.
- **오버워치 (Overwatch)** — major PC bang draw.
- **배틀그라운드 (PUBG)** — Krafton's flagship.
- **로스트아크 (Lost Ark)** — recent PC bang hit.
- **메이플스토리** — long-running 2D MMORPG.

## Mobile gaming conventions

Mobile is the bigger market. Conventions:

### Auto-battle (자동 전투)

Most Korean mobile RPGs offer auto-play:
- Toggle on; characters fight autonomously.
- Player still earns rewards.
- Reduces grind tedium.
- 2x / 4x speed options.

UI:
- **Auto button** prominent (often bottom-right).
- **Speed control** (1x, 2x, 4x).
- **Pause auto** mid-battle for player intervention.

Western games rarely have this; Korean / Asian mobile games default to it.

### Daily login bonuses

Visible in main menu:

```
일일 출석체크
[Day 1 ✓] [Day 2 ✓] [Day 3 ▶ today] [Day 4 ▢] [Day 5 ▢]
[Day 6 ▢] [Day 7 ▢ — 보상]
```

Player gets reward each day. Big reward at Day 7 / Day 30 / Day 100.

### VIP / 출석

Tiered loyalty:
- **VIP 1-15 levels**.
- Each level requires accumulated spending.
- VIP perks: extra inventory, daily premium currency, exclusive cosmetics.

Visible UI badge for VIP tier.

### Battle pass / season pass

Time-limited progress track:
- **Free track** + **Premium track** (purchased).
- Unlocks via gameplay.
- Resets each season (1-3 months).

Most major Korean mobile games have this 2024+.

### Gacha (가챠)

Random pulls for characters / items:

```
┌─────────────────────────────────┐
│  [영웅 가챠]                       │
│                                 │
│  💎 1000 = 1회 뽑기                │
│  💎 9000 = 10회 뽑기 (10% 할인)     │
│                                 │
│  최근 SSR 보장: 0/100 — 100회 후   │
│  100% SSR 보장                   │
│                                 │
│  ▶ 확률 보기                       │   ← legally required link
│                                 │
│  [1회 뽑기]    [10회 뽑기]         │
└─────────────────────────────────┘
```

Required:
- Probability disclosure link.
- Pity counter (천장 progress).
- Currency cost.
- Limited-time event indicator.

### Whale signaling

Korean mobile games signal whale status:
- **Costume / mount** exclusive to high spenders.
- **Server-wide announcement** ("[PlayerName] 님이 SSR 영웅 [Name]를 획득하셨습니다!").
- **Leaderboards** prominent.
- **Guild contributions** visible.

UI design supports both whales (showing off) and free players (motivation to spend).

## Korean MMO UI conventions

Korean MMOs (Lineage, MapleStory, Lost Ark, BDO) share UI patterns:

### Dense HUD

- 5-7 hotbars visible.
- Buff / debuff stacks of 10-20+.
- Multiple chat tabs (general / guild / party / whisper / system).
- Floating combat numbers always on.
- Mini-map detailed with quest markers.

Western players sometimes find "cluttered"; Korean players consider standard.

### Heavy customization

- Hundreds of HUD options.
- UI scale per element.
- Color theme presets.
- Multiple keybind layouts.

### Item labeling

- **Tier color** (common / uncommon / rare / epic / legendary / mythic).
- **+N enhancement** ("Iron Sword +12") — enhancement level visible everywhere.
- **Soulbound / 귀속** marker — items locked to character.
- **Tradable / 거래가능** marker.

### PvP / siege UI

Korean MMOs traditionally have heavy PvP. Siege UI:
- **Castle / fortress timer**.
- **Faction / guild standings**.
- **Real-money bidding for siege participation** (some games).

## Mobile gacha character UI

Character roster screens show:

```
┌──────────────────────────────────┐
│ [Tab filters: SSR / SR / Element]│
│                                  │
│ [Character card] [card] [card]   │
│ [Character card] [card] [card]   │
│ [Character card] [card] [card]   │
│                                  │
│ Selected:                        │
│ ┌──────┐                         │
│ │      │ Character name          │
│ │ Img  │ Lv 60 / SSR             │
│ │      │ HP 12,400 / ATK 1,820   │
│ └──────┘ [Equip] [Level Up] [Awa]│
└──────────────────────────────────┘
```

For each character:
- **Star rating** (1★ - 6★).
- **Element / class** icons.
- **Awakening / 각성** stage (post-level-cap upgrades).
- **Skill levels**.
- **Equipped gear**.
- **Affinity / 호감도** (relationship-style stat).

Korean gacha trends to higher complexity than Western (more layered upgrade systems).

## Cross-platform Korean games

Many Korean games release on PC + mobile + console. UI must adapt:

- **Account sync** across platforms.
- **Cloud save** mandatory (mobile freed up but progress preserved).
- **Cross-play** if supported.
- **Cross-progression** (single character used everywhere).

UI signals current platform (PC bang badge, mobile data warnings, controller prompts on console).

## Korean game typography

For Korean game UI:

| Use | Font |
| --- | --- |
| Logo | Custom calligraphy or stylized brand font |
| HUD numbers | Tabular numerals; condensed sans (Pretendard, NanumSquare) |
| Body text | Pretendard, NanumSquare, NEXON Lv1 / Lv2 (NEXON's free game-friendly font) |
| Display / titles | NEXON 두꺼비, 검은고딕, 본명조 |
| Combat numbers | Bold sans, white / yellow with dark outline |

NEXON Lv1 / Lv2 font: free, designed specifically for game UI, includes Latin + Hangul + numbers.

## Audio in Korean games

- **Korean voice acting** mandatory for major games (Western imports get full Korean dub).
- **Voice options**: Korean / Japanese / English / Chinese (popular in MMOs).
- **Voice sample** in character screen (preview).
- **Cinematic dialogue** subtitled even if voice is Korean.

## Don't

- Don't ship a game in Korea without 본인인증. Required for most genres.
- Don't skip 확률 표시 for gacha. KFTC fines + reputation damage.
- Don't release without GRAC rating.
- Don't apply Western mobile UI patterns to Korean players (less auto-battle, fewer login bonuses) — Korean players expect daily-login + auto-play.
- Don't use Latin-only fonts for game UI in Korean. Pretendard / NanumSquare / NEXON Lv handle Hangul + Latin together.
- Don't skip Korean voice acting for major releases. Players notice.
- Don't ignore PC bang detection. Free XP boosts in PC bangs are competitive table stakes.
- Don't treat all Korean players as one block. Mobile gacha audience differs from MMO audience differs from FPS audience.

## Cross-reference

- [`knowledge/game-ui/game-ui-fundamentals.md`](game-ui-fundamentals.md) — categories
- [`knowledge/game-ui/hud-design.md`](hud-design.md) — HUD conventions
- [`knowledge/game-ui/menu-systems.md`](menu-systems.md) — menus
- [`knowledge/game-ui/game-accessibility.md`](game-accessibility.md) — a11y
- [`knowledge/i18n/korean-payments.md`](../i18n/korean-payments.md) — 본인인증, payments
- [`knowledge/i18n/korean-app-store-visual.md`](../i18n/korean-app-store-visual.md) — app store / store visuals
- [`knowledge/i18n/korean-typography.md`](../i18n/korean-typography.md) — Korean fonts
