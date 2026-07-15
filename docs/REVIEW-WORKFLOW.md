# Canonical review workflow

Use the canonical review workflow when you already have an HTML artifact and want
one evidence-backed path from design intent to a review decision.

The workflow combines the existing read-only start plan and static quality report.
It does not hide either artifact behind a new summary. Their original contracts
remain intact and are linked by SHA-256 evidence.

## Run one review

```bash
design-ai review page.html \
  --brief "Review the Korean account settings flow" \
  --locale ko-KR \
  --viewport mobile \
  --viewport desktop \
  --review-pack korean-fintech \
  --json > review-workflow.json
```

The HTML file is the only project artifact read by the command. Repository, page,
and screenshot options are declarations for the plan; Design AI does not fetch or
inspect them.

Use the human output when reading the result in a terminal:

```bash
design-ai review page.html \
  --brief "Review the account settings flow" \
  --locale ko-KR
```

## Read the result

The `design-ai-review-workflow` v1 payload contains:

1. `source`: the exact HTML byte length and SHA-256 digest.
2. `plan`: the unchanged `design-ai-start` contract using the `design-review` route.
3. `report`: the unchanged `design-ai-quality-report` contract.
4. `linkage`: context checks plus digests for the plan, design contract, and report.
5. `stages`: the canonical review sequence.
6. `nextAction`: the pending human decision and its approval gates.
7. `boundary`: the read-only effect contract.

The stage sequence is deliberately honest:

| Stage | Initial status | Meaning |
|---|---|---|
| Plan | `complete` | Route and design contract are ready. |
| Static review | `complete` | Supported markup evidence was inspected. |
| Browser verification | `not-run` | Runtime behavior has not been exercised. |
| Implementation handoff | `not-started` | No target-repository work has begun. |

A `pass` linkage means the two artifacts describe the same brief, locale,
viewports, and source reference. It does not mean that the design passed review.
Read `report.summary.status` and each finding status separately.

## Use the same workflow from an agent

### Node.js SDK

```js
import { readFileSync } from "node:fs";
import { reviewHtml } from "@design-ai/cli/sdk";

const source = readFileSync("page.html", "utf8");
const workflow = reviewHtml(source, {
  sourceRef: "page.html",
  brief: "Review the Korean account settings flow",
  locale: "ko-KR",
  viewports: ["mobile", "desktop"],
  reviewPack: "korean-fintech",
});
```

### MCP

Call `design_ai_review_html` with the same HTML text and context. Claude, Codex,
or another MCP client receives the same contract without spawning the CLI.

```json
{
  "source": "<!doctype html>...",
  "sourceRef": "page.html",
  "brief": "Review the Korean account settings flow",
  "locale": "ko-KR",
  "viewports": ["mobile", "desktop"],
  "reviewPack": "korean-fintech"
}
```

### Website Console

Import `review-workflow.json` into Website Console. The Console preserves the
original JSON bytes, renders the nested plan and quality report, and shows the
ordered stage timeline. Export returns the original workflow, not a reconstructed
copy.

## Permission boundary

This workflow:

- reads one explicit regular HTML file in the CLI, or caller-supplied text in SDK
  and MCP;
- reads the shipped Design AI corpus and an explicitly selected review pack;
- does not run scripts or a browser;
- does not inspect declared repositories, URLs, or screenshots;
- does not write local evidence;
- does not mutate a target repository;
- does not call an external service;
- does not record a learning signal.

Locale never selects a product review pack automatically. Choose a pack only when
its product contract applies.

Browser verification and implementation remain separate, approval-gated steps.
Do not describe either as complete until its own evidence contract exists.

## Acceptance check

For a prepared HTML fixture, a valid review must preserve the source digest, pass
all linkage checks, keep confirmed and unverified findings separate, leave browser
verification at `not-run`, leave implementation at `not-started`, and report no
local, target-repository, or external writes.
