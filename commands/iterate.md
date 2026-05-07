---
description: Apply a critique or change request to an existing design artifact and produce a revised version with a clear changelog.
---

Take an existing design artifact and a critique/change request. Produce a revised artifact + a changelog of what changed and why.

## Input

`$ARGUMENTS` is structured as:

```
<artifact-path-or-content>

---

<critique-or-change-request>
```

Where:
- **Artifact**: a path to an existing file in this repo (e.g., `examples/palette-saas-violet.md`) or pasted markdown content.
- **Critique**: free-form feedback ("primary feels too saturated"), a list of changes ("add error/danger color, increase border-radius"), or a `design-critique` agent output.

If the input doesn't separate the two with `---`, ask one clarifying question.

## Steps

### 1. Diagnose what kind of artifact this is

| Artifact type | Identifying signature |
| --- | --- |
| Color palette | Contains "Tokens", contrast matrix, ramp tables |
| Component spec | Contains "Anatomy", "API", "States" sections |
| Design system bootstrap | Contains foundations + component baseline + starter set |
| UX audit report | Contains severity sections (🔴 / 🟠 / 🟡 / 🟢) |
| Handoff spec | Contains screens + interactions + responsive sections |

The artifact type determines which skill's playbook to re-apply.

### 2. Parse the critique into discrete changes

Decompose the critique into a list of actionable items:

```
Critique: "Primary feels too saturated. Also need a tertiary text color and the
focus ring isn't visible enough on light bg."

→ Parsed:
1. Reduce primary chroma (~0.18 → ~0.13?)
2. Add `--color-text-tertiary` if not present
3. Increase focus-ring contrast (current ratio? target 3:1+)
```

If items are vague (e.g., "make it more modern"), ask for specifics OR pick a defensible interpretation and note the assumption.

### 3. Apply each change with citation

For each item, re-open the relevant skill playbook section and apply per the rules. Cite the rule:

```
1. Reduced primary chroma from 0.24 → 0.16 (cite color-theory.md: "muted brands
   feel more trustworthy"). Re-validated contrast: still 5.1:1 on white ✓.
```

When a change has knock-on effects (e.g., changing primary forces hover/active to be re-derived), apply them all and note them in the changelog.

### 4. Re-run verification

Run the original skill's verification phase against the revised artifact. Fix anything that regressed.

### 5. Output — the revised artifact + changelog

Two outputs:

#### A. Revised artifact

The original artifact, modified in place. **Don't strip the front-matter** — update `extracted_at` to today; bump a `version: 1.1` field if not present (start at 1.0).

#### B. Changelog

```markdown
# Iteration changelog: <artifact name>

> Revised on: <date>
> From: <previous version>
> To: <new version>

## Changes applied

### 1. <change description>
- **Why**: <reason from critique>
- **What changed**: <before → after>
- **Knock-on effects**: <derived adjustments>
- **Cited rule**: <link to knowledge/ source>

### 2. ...

## Verification

- [✓] All re-validations passed
- [✓] No regressions vs prior version

## Items NOT applied

If the critique included items I didn't apply, list them with reasoning:
- "X" — declined because <reason>. Suggest <alternative path> instead.
```

## Examples

### Example 1 — palette iteration

```
Artifact: examples/palette-saas-violet.md

---

Primary feels too punchy for an enterprise audit tool. Also our brand has a
secondary teal that should be the accent. And we need warmer neutrals — current
slate reads cold against our marketing photos.
```

Output:
- Revised palette with chroma reduced + accent swapped from amber to teal + neutrals shifted toward warm-gray (slight C ~ 0.01 with H ~ 50–80°).
- Changelog explaining each, citing color-theory.md and the warm-neutral rationale.

### Example 2 — component spec iteration

```
Artifact: examples/component-button.md

---

We don't need the `link` variant — link styling is its own component. And
add a `size="xs"` for inline buttons in dense tables.
```

Output:
- Revised spec: `link` variant removed (with note "use Link component"), `xs` size added (height 24px, font 12px).
- Changelog noting the API shrink + the new size's spec values + a "Don't" updated to redirect link use.

### Example 3 — UX audit reaction

```
Artifact: <pasted ux-audit-report-from-yesterday.md>

---

We fixed Critical #1 (contrast) and Critical #2 (missing labels). Re-audit.
```

Output:
- Revised audit removing items #1 and #2 from Critical
- Renumbering the rest
- Adding any new findings if the artifact text suggests changes elsewhere
- Changelog with the closure notes for #1 and #2

## When NOT to iterate

If the critique is fundamental ("the entire approach is wrong") rather than incremental ("primary is too saturated"), don't iterate — restart with `/design-from-brief` or fresh `color-palette` skill. Iteration is for refinement, not reset.

## Done when

- Revised artifact has been updated with `extracted_at` + version bumped.
- Changelog enumerates every change with **why** + **what changed** + **citation**.
- Items declined are listed with reasoning.
- No regressions in re-run verification.
- Both files (revised + changelog) referenced clearly so user knows what to read.
