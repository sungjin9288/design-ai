# Design-system skill compiler (P17C)

This tool compiles one design system into a project-local Agent Skill. The skill
lists only components, props, tokens, and icons that were read from source, and
each fact points back to the file and line it came from.

It is a clone-only maintainer tool. It is not part of the npm package, and it adds
no CLI, SDK, MCP, or Website Console capability. The
[P17 plan](../../docs/P17-SKILL-AND-CORE-HARDENING-PLAN.md) owns the promotion rule.

## Boundary

- The compiler only reads the design-system root and the optional consumer root.
  It never writes inside either one. Its work directory must be outside both.
- It installs no dependency. It makes no Figma write, commit, push, publish, or
  network call.
- The generated skill lands in the work directory. To install it into a consumer
  repository, use the existing review, intake, and scope approval chain.
- The design-system source stays the token authority. The generated references
  are derived, so regenerate them instead of editing by hand.

## Stages

Each stage writes one JSON file. Each file binds to the digest of the stage
before it, so a changed input invalidates everything downstream.

| Stage | Reads | Writes | Refuses when |
| --- | --- | --- | --- |
| `scope` | Directory existence only | `scope.json` | A name is invalid, a path escapes its root, the roots nest, or the work directory is inside a root |
| `facts` | Declared entry, component, token, and icon files; consumer sources | `facts.json`, `usage.json` | The scope is missing or changed, a file exceeds 256 KiB, or more than 2,000 files would be read |
| `contract` | `scope.json`, `facts.json`, `usage.json` | `contract.json` | Any digest link is broken, or no component or token was verified |
| `generate` | `contract.json` | `skill/<name>/`, `provenance.json` | The contract no longer equals a rebuild from its inputs |
| `verify` | Everything above, plus a fresh read of the source | `verify.json` | Any of the six checks fails |

The facts readers accept a small, explicit subset of TypeScript. It covers
named and `*` re-exports from the entry, exported function, const, and class
components, single-line members of `<Name>Props` interfaces, string-literal
unions, CSS custom properties, scalar DTCG JSON `$value` tokens, and SVG files.
Structure is matched on a masked copy of each module, so text inside comments,
strings, and template literals can never look like an export. In CSS only
`/* */` is a comment, so URLs survive.

Anything else goes into `unresolved` with a reason. That covers renamed exports,
modules outside the declared component directories, symbolic links that leave
the root, re-exports nested inside a star-exported module, multi-line or object
members, composite DTCG values, and conflicting token values.

A consumer repository adds usage counts and drift. Drift covers imports the
design system does not export, literal prop values outside a declared union, and
`var(--prefix-*)` references to undefined tokens. The contract keeps drift in a
separate `drift` list for reporting only, and drift never becomes usable
vocabulary. Consumer text is escaped and shortened to one inert line before it
reaches the skill.

## Verification checks

| Check | Fails when |
| --- | --- |
| `digest-chain` | The scope, facts, usage, and contract no longer link by digest, or the skill directory resolves outside `work/skill` |
| `source-reextraction` | A fresh read of the scoped source does not reproduce `facts.json` and `usage.json` byte for byte |
| `fact-anchors` | A component, token, or icon is not at its recorded source line or hash |
| `provenance` | A generated file was edited, removed, or added after generation |
| `rendered-from-contract` | Any generated file differs from a fresh render of the contract |
| `agent-skill-contract` | The skill breaks the repository's Agent Skills contract (`tools/audit/skill-contracts.py`) |

Together these close the chain from source to skill. The source must reproduce
the facts. The facts must rebuild the contract. The contract must re-render every
file, so the skill cannot hold text from outside the contract.
`rendered-from-contract` does not depend on `provenance`. A hand edit still fails
even when someone also updates the recorded hash.

## Run it

Run from the repository root. Choose a work directory outside both roots.

```bash
python3 -B tools/ds_skill/ds_skill.py scope \
  --ds-root ../acme-ds --entry src/index.ts \
  --components src/components --tokens src/tokens --icons src/icons \
  --consumer ../acme-app --consumer-src src \
  --name acme-ds --out /tmp/acme-ds-skill
python3 -B tools/ds_skill/ds_skill.py build --work /tmp/acme-ds-skill
```

`build` runs `facts`, `contract`, `generate`, and `verify` in order. It exits 0
only when all six checks pass. Each stage can also run on its own with
`--work`. `scope` refuses to overwrite an existing scope unless you pass
`--replace`.

## Self-test

```bash
npm run ds-skill:self-test
```

The suite copies `fixtures/acme-ds` and `fixtures/acme-app` into a temporary
directory, runs the real stages, and asserts the exact facts. It also checks
that neither root changed. Its 20 cases cover scope refusals, a tampered skill
name, a symlinked output directory, symbolic-link escape, token conflicts, size
limits, source drift, new source files, invented facts, hand-edited references
and rows, edited contracts, nested JSON key lines, and the Agent Skills gate. `release:self-test` runs
the same suite.
