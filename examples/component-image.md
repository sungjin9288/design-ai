# `Image` — spec

> Citing Ant Design `Image`, MUI (composition), shadcn-ui (composition with native `<img>`)

## Purpose

A wrapper around `<img>` that adds: lazy loading, fallback for broken images, lightbox preview, aspect ratio enforcement, optional zoom + skeleton. Use for any non-trivial image display in product UIs.

For pure `<img>` (decorative icons, avatars): use the native element OR `Avatar` component.

## Anatomy

```
Default:                       With preview enabled (click to expand):
┌──────────────────────┐       ┌──────────────────────┐
│                      │       │                      │
│    [image]           │       │    [image]      🔍   │ ← magnifier overlay
│                      │       │                      │
└──────────────────────┘       └──────────────────────┘

In lightbox (after click):
   ┌───────────────────────────────────────────┐
   │  [image at full resolution, zoom enabled] │ ← modal-style overlay
   │                                            │
   │  [previous] [next]              [close ✕] │
   └───────────────────────────────────────────┘
```

## API

```tsx
<Image
  src="/photo.jpg"
  alt="Product photo"
  aspectRatio="1/1"
  preview
  fallback="/placeholder.png"
  loading="lazy"
/>

<Image.Group>
  <Image src="/p1.jpg" alt="..." />
  <Image src="/p2.jpg" alt="..." />
  <Image src="/p3.jpg" alt="..." />
</Image.Group>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | — | Required. Image URL. |
| `alt` | `string` | — | Required. Alt text — describe meaning, or `""` for decorative. |
| `width` / `height` | `number \| string` | — | |
| `aspectRatio` | `string` | — | `"16/9"`, `"1/1"`, `"4/3"`. Cleaner than width+height. |
| `fit` | `"cover" \| "contain" \| "fill" \| "scale-down" \| "none"` | `"cover"` | CSS object-fit |
| `position` | CSS object-position | `"center"` | |
| `preview` | `boolean` | `false` | Click opens lightbox |
| `fallback` | `string \| ReactNode` | default broken-image icon | What to render on load error |
| `placeholder` | `ReactNode` | skeleton | What to render while loading |
| `loading` | `"lazy" \| "eager"` | `"lazy"` | Native lazy-load attribute |
| `srcset` | `string` | — | Responsive sources |
| `sizes` | `string` | — | Hints for srcset selection |
| `priority` | `boolean` | `false` | If true, sets `loading="eager"` and `fetchpriority="high"` (above-fold images) |
| `radius` | `"none" \| "sm" \| "md" \| "lg" \| "full"` | `"none"` | Corner radius |

### Image.Group (lightbox sequence)

When grouped, clicking any image opens the lightbox with previous/next navigation:

```tsx
<Image.Group>
  <Image src="/p1.jpg" alt="..." />
  <Image src="/p2.jpg" alt="..." />
  <Image src="/p3.jpg" alt="..." />
</Image.Group>
```

The lightbox shows previous/next arrows + counter "1 / 3".

## Behavior

### Loading sequence

1. Render skeleton (`placeholder` or default).
2. Browser fetches image.
3. On load: replace skeleton with image.
4. On error: render fallback.

### Aspect ratio

Use `aspectRatio` to prevent layout shift (CLS):

```css
.image-wrapper {
  aspect-ratio: 16 / 9;
  width: 100%;
}
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

The wrapper takes its full width; height is computed from aspect ratio. Image fills the wrapper with object-fit cover.

### Fallback

When the image fails to load (404, CORS, network):
- Default: small icon (broken image symbol) + "이미지를 불러올 수 없습니다."
- Custom: pass `fallback` (URL or React node).

### Lightbox

When `preview: true`:
- Click image → opens modal-style overlay with the image at full resolution.
- Lightbox features: zoom (mouse wheel / pinch), pan, close on Escape, close on backdrop click.
- For Image.Group: keyboard arrows navigate between images; click outside closes.

### Lazy loading

Default `loading="lazy"` defers image fetch until near viewport. Saves bandwidth on long pages.

For above-fold (hero) images: set `priority` to load eagerly.

## Sizes / aspect ratios

Common ratios:

| Ratio | Use |
| --- | --- |
| `1/1` | Avatars, product cards (square), Instagram-style |
| `4/3` | Standard photo |
| `16/9` | Video thumbnails, hero banners |
| `21/9` | Cinematic banners |
| `2/3` | Portrait product photos |
| `9/16` | Story / vertical mobile content |

Always set an aspect ratio — this prevents the browser-jumping layout shift when images load.

## States

| State | Visual |
| --- | --- |
| Loading | Skeleton (or `placeholder`) at the aspect ratio |
| Loaded | Image visible |
| Error | Fallback icon + text |
| Lightbox open | Modal overlay; underlying page locked |
| Lightbox zooming | Cursor changes to zoom-in/out; image scales |

## Tokens consumed

```
--color-bg-subtle               (skeleton bg)
--color-text-tertiary           (fallback icon)
--color-text-secondary          (fallback caption)
--color-bg-overlay              (lightbox backdrop, ~rgba(0,0,0,0.85))
--color-on-overlay              (lightbox text/icons — typically white)
--space-md
--radius-md, --radius-lg, --radius-full
--motion-default                (lightbox open/close)
--easing-out
--shadow-modal                   (lightbox surface)
```

## Accessibility

### Alt text rules

- **Decorative** (alt=""): screen readers skip. Use for purely visual flourishes.
- **Functional** (icon-button image): `alt` describes the action.
- **Informational**: `alt` describes what the image shows. Don't say "image of" — screen readers announce it's an image already.

```html
<!-- Decorative -->
<img src="/decorative-blob.svg" alt="" />

<!-- Functional -->
<button>
  <img src="/print-icon.svg" alt="Print this page" />
</button>

<!-- Informational -->
<img src="/team-photo.jpg" alt="Three engineers in front of a whiteboard during a sprint planning session" />
```

### Lightbox accessibility

- Modal pattern: focus trap, restore focus on close. See [`examples/component-modal.md`](component-modal.md).
- Image in lightbox: `role="img" aria-label={alt}` on the wrapper if multiple are stacked.
- Counter "N / M" announced on slide change via `aria-live="polite"`.
- Zoom: keyboard `+` / `-` for zoom in / out, `0` to reset. (Optional but nice.)

## Korean considerations

- Alt text in Korean for KR-primary apps.
- For e-commerce / fashion: include garment color + style in alt (helps blind users compare).
- For receipts / 영수증: never replace text content with screenshots without an accessible alternative.

## Code example

```tsx
// Standard product card image
<Image
  src={product.imageUrl}
  alt={product.name}
  aspectRatio="1/1"
  fit="cover"
  radius="md"
  loading="lazy"
/>

// Hero image (above fold)
<Image
  src="/hero.jpg"
  alt="Workspace with laptop and coffee"
  aspectRatio="16/9"
  priority
/>

// Image gallery with lightbox
<Image.Group>
  {product.images.map(img => (
    <Image
      key={img.id}
      src={img.thumbnailUrl}
      srcset={`${img.thumbnailUrl} 400w, ${img.fullUrl} 1200w`}
      sizes="(max-width: 768px) 100vw, 400px"
      alt={`${product.name} 사진 ${img.index}`}
      aspectRatio="1/1"
      preview
    />
  ))}
</Image.Group>

// Avatar-style with full radius
<Image
  src={user.photoUrl}
  alt={user.name}
  aspectRatio="1/1"
  radius="full"
  fallback="/default-avatar.png"
/>
```

## Edge cases

- **Image takes >5s to load**: still show skeleton; don't fall back to error prematurely. Errors are for actual failures (404, CORS).
- **Very large image** (10MB+): forces user to wait. Always serve resized versions via `srcset`.
- **Hi-DPI / retina**: serve 2x resolution for retina screens via `srcset` `2x` descriptor.
- **CORS-blocked image**: counts as load error, fallback renders. Inform user if it's a recurring issue.
- **Image with broken `src` URL**: fallback renders. Log the error for debugging (don't silently hide).
- **Zoomed image larger than viewport** (lightbox): allow pan; clamp at edges.
- **Reduced motion**: lightbox open/close animations are minimal; respect `prefers-reduced-motion`.
- **Print**: images print by default. For receipts/invoices: ensure print stylesheet renders them at appropriate sizes.

## Don't

- Don't omit `alt`. Even decorative images need `alt=""` (empty, but present).
- Don't lazy-load above-fold images. Use `priority` or `loading="eager"`.
- Don't render images at unspecified aspect ratio — causes layout shift.
- Don't put critical info only in images. Provide text alternative.
- Don't auto-zoom without user input. The user should drive zoom.
- Don't use `Image` for icons. Use `Icon` component or inline SVG.
- Don't ship images without responsive sources (`srcset`/`sizes`) for content-heavy pages.

## References

- Ant Design: [`refs/ant-design/components/image/`](../docs/reference/ant-design.md#image) — `Image` + `Image.PreviewGroup` for lightbox. Has `placeholder`, `fallback`, `preview` config. Solid impl.
- MUI: no dedicated component. Compose with native `<img>`.
- shadcn-ui: no built-in. Compose `<img>` + Tailwind. For lightbox: `react-photo-view` or `yet-another-react-lightbox`.

API choices made:
- **`aspectRatio` as first-class prop**: prevents layout shift; cleaner than separate width+height.
- **`preview` opt-in**: most images don't need lightbox; opting in is the right friction.
- **`Image.Group` for sequence**: mirrors Ant's pattern; lightbox navigates within group.
- **`priority` boolean**: simpler than passing `loading="eager"` + `fetchpriority="high"` separately for the common above-fold case.

## Cross-reference

- [`examples/component-avatar.md`](component-avatar.md) — for user/profile images (different fallback semantics)
- [`examples/component-modal.md`](component-modal.md) — lightbox uses modal a11y pattern
- [`knowledge/a11y/contrast.md`](../knowledge/a11y/contrast.md) — text on image overlays
