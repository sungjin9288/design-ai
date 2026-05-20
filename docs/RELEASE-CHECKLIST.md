# Release checklist

Pre-flight steps for every design-ai release. Stamped at v3.12 — usable from v4.0 onward as the canonical pre-release ritual.

## Before tagging any release

### 0. Core automated gate

```bash
npm run release:check
```

This runs CLI unit tests, all eight repository audits, whitespace checks, automated package contents checks, release metadata checks, `npm run release:self-test`, and the packed-tarball smoke test. The release metadata check verifies package/plugin version alignment, current CHANGELOG and ROADMAP entries, release-facing docs guidance for the MkDocs warning-policy baseline, and release smoke guidance for human version, `audit --strict --quiet`, `doctor --strict`, top-level help, `help --json`, alias smoke, help topic output, `list --json`, corpus discovery JSON, `show --lines` / `route --explain`, suggestion/range failures, prompt/pack output-file confirmations, check examples/artifact/stdin/all-routes, `status --json`, `version --json`, `install --json`, `uninstall --json`, and `update --dry-run`. The tarball smoke covers human/JSON version and top-level help output, the `design-ai help --json` topic catalog, command alias help and functional alias output, command-specific help topic output, all three `list` catalog domains in human and JSON mode, human / JSON corpus discovery output, explicit `show --lines` and `route --explain` output, unknown route-id/option/value suggestion and numeric range failures, prompt/pack forced `--out` overwrite plus file-write confirmations, check examples/artifact/stdin/all-routes output, human/JSON `audit --strict --quiet`, human/JSON `update --dry-run`, `doctor --strict` human diagnostics, and human install plus JSON `install --json`, human+JSON status, human uninstall, and JSON `uninstall --json` lifecycle output. Continue with the manual release checks below after this gate passes.

For pre-push Real-CI parity, run the broader local workflow gate:

```bash
npm run ci:local
```

This wraps `release:check`, then adds the GitHub workflow-only checks: Python `py_compile`, knowledge/docs/examples size budget, VS Code extension dependency install + compile + unit tests, docs workflow policy alignment, `mkdocs build --clean`, and the MkDocs warning policy that allows only intentional `refs/` source-link warnings while capping them at the accepted baseline. If mkdocs is missing, install the docs dependencies first:

```bash
python3 -m pip install -r docs/requirements.txt
```

### 1. Audits

```bash
node cli/bin/design-ai.mjs audit --strict
```

All eight audits must pass: frontmatter, link, Korean copy, raw hex color hygiene, integration, stale, coverage, and example QA. The CI workflow runs them on PR; verify locally before tagging.

### 2. Version alignment

```bash
node -p "require('./package.json').version"           # CLI version
node -p "require('./.claude-plugin/plugin.json').version"  # plugin version
grep "^## v" CHANGELOG.md | head -1                   # most-recent CHANGELOG entry
```

All three must match. The publish workflow enforces this; verifying locally avoids a wasted Actions run.

Automated gate:

```bash
npm run release:metadata
```

This also checks that the current CHANGELOG and ROADMAP entries mention the same repository audit count as `tools/audit/run-all.py`, and that README, RELEASE-CHECKLIST, and English/Korean distribution docs retain the MkDocs warning-policy baseline guidance plus release smoke phrases for human version, `audit --strict --quiet`, `doctor --strict`, top-level help, `help --json`, alias smoke, help topic output, `list --json`, corpus discovery JSON, `show --lines` / `route --explain`, suggestion/range failures, prompt/pack output-file confirmations, check examples/artifact/stdin/all-routes, `status --json`, `version --json`, `install --json`, `uninstall --json`, and `update --dry-run`. The checked release policy docs must match the required metadata labels in deterministic order: `README.md`, `README.ko.md`, `docs/RELEASE-CHECKLIST.md`, `docs/DISTRIBUTION.md`, and `docs/DISTRIBUTION.ko.md`. If a core release input, required policy doc, or audit-count source is missing, unreadable, unparsable, or invalid JSON, the release metadata check reports structured bullet errors instead of a Python traceback. The `--json` output preserves stable summary keys, checked-doc order, and readable Korean errors.

### 3. CHANGELOG

```bash
head -50 CHANGELOG.md
```

The top entry should:
- Match the new version.
- Date in `YYYY-MM` format.
- Have `### Added` / `### Changed` / `### Verified` sections at minimum.
- List all `Versions` bumps (CLI / plugin / extension).
- Document `What this enables` so adopters understand the value.

### 4. ROADMAP entry

The same release must have a corresponding entry in `docs/ROADMAP.md`. Include:
- `### Added` (per phase).
- `### Verified` (audit + verification status).
- `### What this enables`.
- `### What's still ahead (vN.N+1)` — keeps the roadmap rolling.

### 5. CLI smoke test

```bash
node cli/bin/design-ai.mjs version
node cli/bin/design-ai.mjs version --json
node cli/bin/design-ai.mjs help
node cli/bin/design-ai.mjs status
node cli/bin/design-ai.mjs status --json
node cli/bin/design-ai.mjs audit --strict --quiet --json
node cli/bin/design-ai.mjs list skills
node cli/bin/design-ai.mjs list skills --json
```

All eight must respond cleanly.

### 6. NPM package preview

```bash
npm run package:check
```

Verify:
- Tarball size < 15MB (warn at 10MB).
- `files` allowlist matches expectations.
- No `refs/`, `.git/`, `node_modules/`, `*.tgz` slipping in.
- Packed tarball installs cleanly:

```bash
npm run package:smoke
```

### 7. Doc site build

```bash
pip install -r docs/requirements.txt
python3 -B tools/audit/local-ci.py --docs-only
```

Should succeed in < 20 seconds and end with the MkDocs warning policy summary, including the refs-only warning count versus its accepted baseline. Visit `site/index.html` locally to spot-check.

### 8. VS Code extension build

```bash
cd vscode-extension
npm install
npm run compile
```

Compiles cleanly via `tsc -p .`.

### 9. Korean copy spot-check

For releases that update Korean translations:

```bash
python3 tools/audit/korean-copy-check.py
```

Spot-check the most-translated files (README.ko.md, QUICKSTART.ko.md) for:
- Honorific consistency (해요체 throughout adopter-facing docs; 합쇼체 for formal/legal).
- No machine-translation artifacts.
- Korean-specific brand names preserved (Toss, KakaoPay, Pretendard).

### 10. Tag and push

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

GitHub Actions takes over:
- `audit.yml` re-runs all eight audits and unit tests.
- `publish.yml` runs on `v*` tags — verifies versions, runs audits, checks package contents, packs, smoke-tests the installed tarball, including human/JSON version and top-level help output, command alias help and functional alias output, command-specific help topic output, all three `list` catalog domains in human and JSON mode, human / JSON corpus discovery output, explicit `show --lines` and `route --explain` output, unknown route-id/option/value suggestion and numeric range failures, prompt/pack forced `--out` overwrite plus file-write confirmations, check examples/artifact/stdin/all-routes output, human/JSON `update --dry-run`, `doctor --strict` human diagnostics, and human install plus JSON `install --json`, human+JSON status, human uninstall, and JSON `uninstall --json` lifecycle output, then publishes to npm with provenance.
- After npm publish, `publish.yml` runs the registry smoke test against the published package so `npm exec --package @design-ai/cli@<version>`, human/JSON version output, the expected `design-ai help --json` catalog, discovered help topic usage output, documented help/command aliases, functional aliases, all three `list` catalog domains in human and JSON mode, human / JSON corpus discovery output, explicit `show --lines` and `route --explain` output, unknown route-id/option/value suggestion and numeric range failures, prompt/pack forced `--out` overwrite plus file-write confirmations, check examples/artifact/stdin/all-routes output, human/JSON `update --dry-run`, and human install plus JSON `install --json`, `doctor --strict`, human+JSON status, human uninstall, and JSON `uninstall --json` lifecycle output are verified from the public registry.
- `release.yml` verifies versions, runs audits + CLI unit tests, checks package contents, smoke-tests the installed tarball, then creates a GitHub Release using the same `npm pack` allowlist as the npm package.
- `docs.yml` re-builds the doc site through `tools/audit/local-ci.py --docs-only` and deploys it.

### 11. Post-tag

After the tag is live:

- [ ] Verify npm publication: `npm view @design-ai/cli version`
- [ ] Verify public install path: `npm run registry:smoke`
- [ ] Verify doc site updated: visit deployed URL
- [ ] If breaking change in major version: update Homebrew formula sha256 + version.
- [ ] Optional: GitHub release notes (auto-generated from CHANGELOG.md section).

## For major versions (vN.0.0)

Additional steps:

### Migration guide

Create `docs/MIGRATION-vN.md`:
- What broke.
- How to migrate (per-API).
- Deprecation timeline (deprecate in vN.0; remove in vN+1).

### Announcement

Draft for blog / Twitter / Show HN / Korean tech communities (hashnode.kr, OKKY, etc.):

```
design-ai vN.0.0 — <one-line headline>

What's new:
- <feature 1>
- <feature 2>
- <feature 3>

Try it: npx @design-ai/cli install

Full notes: <link to CHANGELOG section>
```

### Stability re-review

Walk through all knowledge files with `stability: experimental` or `stability: beta`. Promote to `stable` if substantively reviewed during this cycle. Document in CHANGELOG.

## For VS Code marketplace publish

Separate from npm:

```bash
cd vscode-extension
npm install
npx @vscode/vsce package        # produces .vsix
npx @vscode/vsce publish        # requires Azure DevOps PAT + publisher account
```

Publisher account setup: <https://code.visualstudio.com/api/working-with-extensions/publishing-extension>

## For Homebrew formula updates

```bash
# After GitHub release tarball is available:
TAG=v3.12.0
SHA=$(curl -sL "https://github.com/sungjin/design-ai/releases/download/$TAG/design-ai-cli-${TAG#v}.tgz" | shasum -a 256 | cut -d' ' -f1)

# Update Formula/design-ai.rb:
# - url: GitHub Release asset URL
# - sha256: $SHA above
# - version: matching the tag

brew install --build-from-source ./Formula/design-ai.rb
brew test design-ai
git commit -am "Homebrew formula: $TAG"
git push
```

## Common failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| `frontmatter-check` fails | New file missing `title:` | Add YAML frontmatter |
| `link-check` fails | Renamed file; old link not updated | grep + sed the old name |
| `korean-copy-check` fails | English UI string in Korean file | Replace with Korean equivalent |
| `coverage` diff fails | New examples but COVERAGE.md not regenerated | Run check-coverage.py + commit |
| `stale-check` errors | Knowledge files >12mo old | Review + bump `last_updated` |
| `npm pack` shows `refs/` | `.npmignore` regression | Add `refs/` back to .npmignore |
| Doc site fails to build | mkdocs nav references missing file | Fix nav OR add file |
| VS Code extension TS errors | Type bumped without code update | Read errors, fix per-file |

## Stability promotion ritual

Quarterly (or per-major):

1. Run `tools/audit/stale-check.py --warn-months 3`.
2. For files showing as warned: review + decide:
   - Still accurate? → Bump `last_updated`.
   - Needs revision? → Edit + bump.
   - Obsolete? → Mark `stability: deprecated` and add a deprecation note.
3. For `experimental` knowledge that has held up: promote to `stable`.
4. For `beta` knowledge: review, polish, promote to `stable`.

Document the review cycle in `docs/CONTRIBUTING.md`.

## Cross-reference

- [`docs/DISTRIBUTION.md`](DISTRIBUTION.md) — distribution channels
- [`docs/CONTRIBUTING.md`](CONTRIBUTING.md) — for contributors
- [`CHANGELOG.md`](../CHANGELOG.md) — version history
- [`docs/ROADMAP.md`](ROADMAP.md) — phase log
- [`docs/SESSION-LOG.md`](SESSION-LOG.md) — narrative of how design-ai got here
