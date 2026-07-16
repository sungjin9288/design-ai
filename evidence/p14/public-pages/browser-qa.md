# Public documentation Pages QA

## Deployment

- Source commit: `92043f09a12e5fad190a9f26cb56c4f89b9900c7`
- Pull request: #51
- Required CI: run `29492331845`
- GitHub Pages: run `29492452008`
- Public URL: `https://sungjin9288.github.io/design-ai/`

## English desktop

- Viewport: 1440 by 900 pixels
- Document width: 1440 pixels
- Horizontal overflow: none
- `<html lang>`: `en`
- Alternate links:
  - English: `https://sungjin9288.github.io/design-ai/`
  - Korean: `https://sungjin9288.github.io/design-ai/ko/`
- Console: 0 errors, 0 warnings
- Capture: `en-desktop.png`

## Korean mobile

- Viewport: 390 by 844 pixels
- Document width: 390 pixels
- Horizontal overflow: none
- `<html lang>`: `ko`
- Alternate links use the same correct public project paths as English.
- First Tab: `콘텐츠로 이동`, linked to `#design-ai`
- Skip activation: focus moves to `H1#design-ai`
- Console: 0 errors, 0 warnings
- Capture: `ko-mobile.png`

## Sitemap

Both requests returned HTTP 200:

- `https://sungjin9288.github.io/design-ai/sitemap.xml`
- `https://sungjin9288.github.io/design-ai/ko/sitemap.xml`

The responses are byte-identical with SHA-256
`3c8737fc5b8801eab0fbdae7f27517406e12bbf615c03569c4735e41e3aa1215`.

## Claim boundary

This follow-up closes the deployed project-path and locale sitemap warning. It does
not rewrite the immutable P6-P13 candidate artifacts or claim broader browser,
assistive-technology, adoption, or production evidence.

## Nested-page regression check

The external pilot program document was served locally at 390 by 844 pixels after
the language-root change:

- document width: 390 pixels;
- head alternate roots: `/` and `/ko/`;
- visible contextual links: `/docs/EXTERNAL-PILOT-PROGRAM/` and
  `/ko/docs/EXTERNAL-PILOT-PROGRAM/`;
- sitemap requests: `/sitemap.xml` and `/ko/sitemap.xml`, both 200;
- console: 0 errors, 0 warnings.

Material search now uses language-root alternate links for sitemap discovery,
while visible language controls keep contextual page links. Public nested-page
verification follows the main deployment and does not rewrite the immutable
P6-P13 source chain.
