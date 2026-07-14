# Browser verification adapter

`design-ai verify-browser` turns an approved browser session into a normalized
local evidence sidecar. Design AI owns the approval, path, validation, and history
contract. A separately trusted adapter owns the browser engine.

## Before running

1. Generate a canonical report with `design-ai inspect ... --json`.
2. Start the target preview yourself on `localhost`, `127.0.0.1`, or `::1`.
3. Review the adapter executable and confirm it already has the browser tooling it
   needs. The runner never installs a package or downloads a browser.
4. Record who or what approved the run in `--approval-ref`.

```bash
design-ai verify-browser /tmp/quality-report.json \
  --url http://127.0.0.1:4173/settings \
  --target-root /absolute/path/to/product \
  --adapter node \
  --adapter-arg /absolute/path/to/adapter.mjs \
  --approval-ref "human: settings browser run approved" \
  --yes \
  --json
```

Omit `--viewport` to use `mobile=390x844` and `desktop=1440x900`. Repeat
`--viewport name=WIDTHxHEIGHT` for a different matrix.

## Adapter input

The runner starts the adapter from a new evidence directory and sends one JSON
object on stdin:

```json
{
  "kind": "design-ai-browser-probe-request",
  "schemaVersion": 1,
  "runId": "2026-07-14T00-00-00Z-12345678",
  "url": "http://127.0.0.1:4173/settings",
  "outputDir": "/Users/example/.design-ai/evidence/browser/run-id",
  "checks": [
    "responsive",
    "keyboard",
    "accessibility",
    "reduced-motion",
    "loading",
    "error",
    "repeated-action"
  ],
  "viewports": [
    { "name": "mobile", "width": 390, "height": 844 }
  ],
  "networkPolicy": {
    "allowedOrigin": "http://127.0.0.1:4173",
    "allowedMethods": ["GET", "HEAD"],
    "blockCrossOrigin": true,
    "blockWebSockets": true,
    "blockDownloads": true
  }
}
```

The adapter must enforce that network policy and attest to every requested value.
Design AI checks that the attestation matches the request, but it does not sandbox
the adapter or independently observe its network traffic. Review the executable
before approval.

## Adapter output

Write artifacts inside `outputDir`, then emit one JSON object and no other stdout
text. Diagnostic text belongs on stderr.

```json
{
  "kind": "design-ai-browser-probe-result",
  "schemaVersion": 1,
  "tool": { "name": "playwright-chromium", "version": "1.58.0" },
  "policy": {
    "allowedOrigin": "http://127.0.0.1:4173",
    "allowedMethods": ["GET", "HEAD"],
    "crossOrigin": "blocked",
    "webSockets": "blocked",
    "downloads": "blocked"
  },
  "probes": [
    {
      "check": "responsive",
      "viewport": "mobile",
      "status": "pass",
      "observedAt": "2026-07-14T00:01:00.000Z",
      "observation": "No horizontal overflow at 390x844.",
      "artifacts": [
        { "kind": "screenshot", "path": "responsive-mobile.png" }
      ]
    }
  ]
}
```

Return one probe for every requested check and viewport. Artifact paths must be
relative, regular files inside `outputDir`; absolute paths, missing files, symbolic
links, and parent traversal are rejected.

Allowed artifact kinds are `screenshot`, `accessibility`, `trace`, `log`, and
`result`. A responsive pass needs a minimal 8-bit RGB or RGBA PNG containing only
`IHDR`, consecutive `IDAT`, and `IEND` chunks with valid CRCs, dimensions,
compressed image data, scanline lengths, filters, and terminal boundary. An
accessibility pass needs a non-empty JSON object or array. Runner-owned files such
as `request.json` and `adapter-output.json` cannot be relabeled as adapter evidence.
Other checks need at least one non-empty artifact. Every adapter timestamp must
fall within the recorded run interval. A failed check may use the
normalized adapter output as fallback evidence, but incomplete passing evidence
becomes `unverified`.

## Result and exit behavior

The final sidecar is
`~/.design-ai/evidence/browser/<run-id>/browser-verification.json`. The same
directory retains the request, raw adapter output, and adapter stderr log.

- `pass`: every requested probe passed with complete evidence;
- `fail`: at least one probe reported a failure;
- `unverified`: the adapter was unavailable or evidence, including its observation
  time, was missing or invalid.

The CLI exits non-zero for `fail` and `unverified`. It never updates the canonical
quality report. Source-report digest drift creates `boundary-violation.json` and
rejects the run.

The sidecar separates the requested network policy from the adapter's attestation.
It records the post-run source-report digest match and Design AI's local evidence
path as runner checks. Mutation restored before adapter exit, target-repository
mutation, and external writes by the adapter remain `unverified`; approval means
the operator accepts that executable boundary.

Adapter execution currently requires macOS or Linux because the runner uses POSIX
process groups to terminate the adapter and every descendant after timeout. Windows
execution is rejected before an evidence directory is created.
