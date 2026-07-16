# Candidate browser observations

## Viewports

- English desktop: 1440×900; no horizontal overflow; the complete action hero
  ends at 656.6 pixels.
- English mobile: 390×844; document and viewport widths both equal 390 pixels;
  the complete action hero ends at 714.2 pixels.
- Korean mobile: 390×844; document and viewport widths both equal 390 pixels;
  the complete action hero ends at 654.4 pixels.
- Both action controls measure 49.59 pixels high.

## Accessibility

- The drawer and search toggles expose localized programmatic names.
- The first Tab reaches the skip link. Activating it focuses the `#design-ai`
  heading, and subsequent navigation reaches the primary action in document order.
- The primary action focus indicator is a three-pixel solid outline with a
  three-pixel offset.
- Primary action contrast: 6.86:1, white on `rgb(64, 81, 181)`.
- Secondary action contrast: 16.07:1, dark text on white.
- A manual screen-reader session was not run.

## Interaction and motion

- Five keyboard search open and Escape-dismiss cycles passed.
- Five drawer open and overlay-dismiss cycles passed.
- No cycle left a stale overlay or trapped focus.
- Under `prefers-reduced-motion: reduce`, hero and action animation durations and
  transition durations resolve to zero seconds.

## Console

- The pinned Pretendard request succeeds; the baseline 403 is resolved.
- The loopback multilingual preview still logs one `/ko/sitemap.xml` 404. The
  warning is retained in the performance lens and is not hidden or called fixed.

These observations apply to the approved local candidate. Public Pages behavior
is verified separately after deployment.
