# `Upload` — spec

> Citing Ant Design `Upload`, MUI (composition with file input), shadcn-ui (composition)

## Purpose

Lets users select files from disk to upload (or stage for upload) — profile photo, attachments, document import.

## Three patterns

| Pattern | Use |
| --- | --- |
| **Drop zone** (large dashed area) | File-centric uploads — bulk import, document upload |
| **Button trigger** (small button + native picker) | Single-file uploads — profile photo, attach |
| **Inline avatar** (click photo to replace) | Profile photo, contained image |

Most products need 1–2 of these. Drop zone is most flexible.

## Anatomy — drop zone

```
┌──────────────────────────────────────────────────┐
│                                                  │
│             📤                                   │
│                                                  │
│       파일을 드래그하거나 클릭하여 선택            │
│       JPG, PNG, PDF · 최대 10 MB                 │
│                                                  │
└──────────────────────────────────────────────────┘
            (after select)
┌──────────────────────────────────────────────────┐
│ 📄 design-spec.pdf            ━━━━━━━━━━ 85%  ✕ │
│ 🖼 hero-image.jpg              ━━━━━━━━━━ 100%   │
└──────────────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Drop zone | yes | Large dashed area with icon + helper text |
| File list | yes (after select) | Each file with progress bar and remove |
| Helper text | yes | Allowed types, max size |
| Upload progress | yes (during upload) | Per-file bar + total |
| Error state | when applicable | Per-file or top-level error |

## API

```tsx
<Upload
  accept={["image/jpeg", "image/png", "application/pdf"]}
  multiple
  maxFiles={5}
  maxSize={10 * 1024 * 1024}  // 10 MB
  onFilesChange={setFiles}
  onUpload={uploadHandler}
  uploadOnSelect={true}
  pattern="drop-zone"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `accept` | `string[]` | — | MIME types or extensions (`["image/*", ".pdf"]`) |
| `multiple` | `boolean` | `false` | Allow multiple files |
| `maxFiles` | `number` | — | Cap on count |
| `maxSize` | `number` | — | Bytes per file |
| `value` | `UploadedFile[]` | — | Controlled list |
| `onFilesChange` | `(files) => void` | — | Fires when list changes |
| `onUpload` | `(file) => Promise<UploadResult>` | — | Per-file upload handler. Returns when upload completes. |
| `uploadOnSelect` | `boolean` | `true` | Auto-upload on select; false = stage and upload separately |
| `pattern` | `"drop-zone" \| "button" \| "avatar"` | `"drop-zone"` | UI pattern |
| `disabled` | `boolean` | `false` | |
| `directory` | `boolean` | `false` | Allow folder selection (browser support varies) |
| `paste` | `boolean` | `true` | Allow paste-to-upload (Cmd+V on focused zone) |
| `errorText` | `string` | — | Top-level error |
| `helpText` | `string` | derived from accept + maxSize | E.g., "JPG, PNG · max 10MB" |

```ts
type UploadedFile = {
  id: string;
  file: File;             // browser File object
  status: "pending" | "uploading" | "success" | "error";
  progress: number;        // 0–100
  url?: string;            // server-returned after success
  error?: string;
};
```

## Behavior

### Selection paths

1. **Click drop zone**: opens native file picker.
2. **Drag-and-drop**: drop file onto the zone.
3. **Paste** (when `paste: true` and zone focused): Cmd+V pastes a copied image.

### Upload flow

```
[file selected] → validate (size, type) → if pass: add to list, status="pending"
→ if uploadOnSelect: status="uploading", call onUpload, track progress
→ on success: status="success", store url
→ on error: status="error", show retry
```

### Validation

Per file:
- Type matches `accept`. If not, reject with "지원하지 않는 형식입니다."
- Size <= `maxSize`. If not, reject with "파일이 너무 큽니다."

Per batch:
- Total count <= `maxFiles`. If exceeds, reject the excess.

Show validation errors inline (per-file) or as a top banner if multiple files share the same issue.

### Progress tracking

Per file: 0–100% bar. The `onUpload` handler should report progress:

```ts
const upload = async (file) => {
  const xhr = new XMLHttpRequest();
  xhr.upload.onprogress = (e) => {
    setProgress(file.id, (e.loaded / e.total) * 100);
  };
  xhr.open("POST", "/api/upload");
  xhr.send(file);
};
```

Or use `fetch` with a `ReadableStream` for progress (modern, more complex).

### Cancel mid-upload

Provide a ✕ on each uploading file. Aborts the request:

```ts
const controller = new AbortController();
fetch("/api/upload", { body: file, signal: controller.signal });
// On cancel:
controller.abort();
```

### Retry on error

Show "다시 시도" button next to errored files.

## Patterns

### Drop zone

Default pattern. Clicking opens picker; dragging files works.

```
┌──────────────────────────────────────────────────┐
│  📤  파일을 드래그하거나 클릭하여 선택               │
│       JPG, PNG, PDF · 최대 10 MB                  │
└──────────────────────────────────────────────────┘
```

### Button

Small button that triggers native picker. Renders selected files inline below or as tags.

```tsx
<Upload pattern="button" multiple>
  <Button variant="outline" iconStart={<UploadIcon />}>
    파일 선택
  </Button>
</Upload>
```

### Avatar (single image)

Profile photo replacement. Click opens picker; uploaded file replaces avatar.

```tsx
<Upload pattern="avatar" accept="image/*" maxSize={5 * 1024 * 1024}>
  <Avatar src={user.photoUrl} alt={user.name} size="xl" />
  <span className="overlay">변경</span>
</Upload>
```

## States

| State | Visual |
| --- | --- |
| Default | Resting drop zone or button |
| Drag-over | Border emphasizes (`--color-primary-default` border, `--color-primary-subtle-bg` bg) |
| Disabled | Muted, no events |
| Has files | File list rendered below (or replaces zone) |
| Uploading | Progress bars on each file; spinner on zone if uploading more |
| Error (per-file) | Red border on file row + retry button |
| Error (top-level) | Banner above zone with message |

## Tokens consumed

```
--color-bg-default
--color-bg-subtle
--color-primary-default       (drag-over border, progress bar)
--color-primary-subtle-bg     (drag-over bg)
--color-text-primary
--color-text-secondary        (helper text)
--color-text-tertiary          (file metadata)
--color-error                  (validation errors)
--color-success                 (upload success)
--color-border-default
--color-border-default-dashed   (drop zone border style)
--color-focus-ring
--space-md, --space-base, --space-lg
--radius-md
--font-size-sm, --font-size-base
--motion-fast
```

## Sizes

| Size | Drop zone height | Padding |
| --- | --- | --- |
| `sm` | 80px | 16px |
| `md` (default) | 120px | 24px |
| `lg` | 200px | 32px |

## Accessibility

- The drop zone is a `<button>` (or has `role="button"`) that opens the file picker.
- `<input type="file">` is hidden but real — keyboard activates it.
- File list: `<ul>` with each file as `<li>` containing description + status announcements.
- Progress: `aria-valuenow` on the per-file progress bar.
- Errors: `role="alert"` on per-file error.
- Drag-and-drop is supplementary — keyboard users go through the file picker.
- For drag enter/leave: announce via `aria-live="polite"` ("Drop file to upload" appears).

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reach drop zone |
| `Enter` / `Space` | Open file picker |
| `Tab` (inside file list) | Move to retry / remove buttons |

## Korean considerations

| English | Korean |
| --- | --- |
| Drop file or click | 파일을 드래그하거나 클릭 |
| Click to upload | 클릭하여 업로드 |
| File too large | 파일이 너무 큽니다 |
| Unsupported format | 지원하지 않는 형식입니다 |
| Uploading | 업로드 중 |
| Failed | 실패 |
| Try again | 다시 시도 |
| Remove | 제거 |
| Max N files | 최대 N개 |

## Edge cases

- **User selects huge file (>maxSize)**: reject before starting upload. Don't begin upload of a 1GB file just to cancel at 99%.
- **User selects 50 files when max is 5**: accept first 5; reject the rest with a banner.
- **Network drops mid-upload**: file row goes to error state with retry button.
- **Same file uploaded twice**: detect by name + size (not 100% reliable). Optional warning, not block.
- **Drag from another browser tab**: works; the dragged item is a URL/text. Some browsers fire `dataTransfer.files` differently.
- **Mobile**: native picker handles camera/gallery selection. Drag-and-drop not applicable. Use button pattern.
- **Folder upload**: browser support is limited (`webkitdirectory`). Document the constraint.
- **Paste image**: most browsers support pasting an image (e.g., screenshot). If `paste: true`, focus zone first.

## Don't

- Don't upload silently in the background without progress — user has no feedback.
- Don't accept all file types unless truly meant. Restrict via `accept`.
- Don't fail silently on unsupported types. Show why.
- Don't lose files in a list when one fails. Failed files stay until removed.
- Don't render a 1MB file's progress bar but skip it for a 10KB file. Consistency.
- Don't make the drop zone a click target without keyboard alternative.
- Don't accept user uploads to your server without server-side validation. Client validation is UX only.
- Don't show "Uploaded successfully" toast for every successful file. Use the inline checkmark.

## References

- Ant Design: [`refs/ant-design/components/upload/`](../refs/ant-design/components/upload/) — `Upload` with `Upload.Dragger` (drop zone), file list, multiple modes. Most exhaustive.
- MUI: no dedicated component. Compose `<input type="file">` with custom button.
- shadcn-ui: no built-in. Compose with file input + drop-zone library (e.g., `react-dropzone`).

API choices made:
- **`pattern` prop** (drop-zone / button / avatar) collapses three sibling components into one with mode.
- **`uploadOnSelect` opt-in vs explicit upload**: matches the two real-world flows (auto-upload vs review-then-upload).
- **`onUpload` returns Promise**: enables progress tracking + retry uniformly.

## Cross-reference

- [`knowledge/patterns/form-design.md`](../knowledge/patterns/form-design.md) — file inputs in forms
- [`examples/component-progress.md`](component-progress.md) — per-file upload progress
- [`examples/component-avatar.md`](component-avatar.md) — avatar pattern for image uploads
- [`knowledge/i18n/korean-publishing.md`](../knowledge/i18n/korean-publishing.md) — image upload size constraints for app store
