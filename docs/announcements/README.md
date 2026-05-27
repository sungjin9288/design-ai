# Launch kit

Ready-to-post announcement drafts for design-ai v4.0.0 launch. **Drafts only** — review before posting; tailor as needed.

## What's here

| File | Channel | Language | Length |
|---|---|---|---|
| [`press-kit.md`](press-kit.md) | Reusable assets (one-liner / stats / FAQ) | EN + KO | — |
| [`okky-post.ko.md`](https://github.com/sungjin9288/design-ai/blob/main/docs/announcements/okky-post.ko.md) | OKKY (okky.kr) | KO long-form | ~600 words |
| [`hashnode-post.ko.md`](https://github.com/sungjin9288/design-ai/blob/main/docs/announcements/hashnode-post.ko.md) | hashnode.com (KR tag) | KO blog | ~800 words |
| [`dev-to-korea.md`](dev-to-korea.md) | dev.to (#korea + #design tags) | EN + bilingual examples | ~600 words |
| [`show-hn.md`](show-hn.md) | Hacker News Show HN | EN concise | ~150 words title+body |
| [`twitter-thread.md`](twitter-thread.md) | X / Twitter | EN + KO threads | 6-8 tweets each |
| [`reddit-r-korea.md`](reddit-r-korea.md) | r/korea / r/programming | EN + KO versions | ~300 words |

## Posting order (suggested)

1. **Tag v4.0.0 + verify CI publish**. Wait for `npm view @design-ai/cli version` to show `4.0.0`.
2. **Show HN** (Tuesday-Thursday 8-10am PT — best HN window).
3. **dev.to** (same day or +1).
4. **OKKY post** + **hashnode** (Korean morning, KST 9-11am).
5. **Twitter threads** (EN + KO) staggered by 2 hours.
6. **Reddit** (r/programming, then r/korea) — wait 24h after HN to avoid duplicate-feel.

## Tracking

After posting, log in `docs/announcements/posted.md` (created at first post):
- Channel + URL.
- Posted at (timestamp + timezone).
- 24h metrics (upvotes, comments, click-through if known).
- 7-day metrics.

## Don't

- **Don't post all on the same day.** Staggered = sustained visibility; same-day = burst then silence.
- **Don't translate KR content via auto-translate.** Drafts are written in natural Korean; auto-translation breaks tone.
- **Don't post before npm publish.** Adopters see the link, try `npx`, fail. Tag → verify → then announce.
- **Don't oversell.** "Senior product designer" is the tagline; "replaces designers" is not.

## Tone

| Channel | Voice |
|---|---|
| Show HN | Engineer-to-engineer, low-key, factual |
| dev.to | Technical blog, code-heavy |
| OKKY | 한국 개발자 톤, 해요체, 구체적 use case 중심 |
| hashnode KR | 기술 블로그, 해요체, 코드 + 그림 |
| Twitter/X | Hook-first, scannable |
| Reddit | Modest, ask-don't-tell, link to repo |

## Cross-reference

- [`CHANGELOG.md`](../../CHANGELOG.md) — full v4.0.0 release notes
- [`docs/SESSION-LOG.md`](../SESSION-LOG.md) — v2.0 → v4.0 narrative for press
- [`docs/RELEASE-CHECKLIST.md`](../RELEASE-CHECKLIST.md) — post-tag steps
