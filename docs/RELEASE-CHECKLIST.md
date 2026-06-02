# Release checklist

Pre-flight steps for every design-ai release. Stamped at v3.12 — usable from v4.0 onward as the canonical pre-release ritual.

## Before tagging any release

### 0. Core automated gate

```bash
npm run release:check
```

This runs CLI unit tests, `npm run audit:strict` all eight repository audits, whitespace checks, automated package contents checks, release metadata checks, `npm run release:self-test`, and the packed-tarball smoke test. The release metadata check verifies package/plugin version alignment, current CHANGELOG and ROADMAP entries, release-facing docs guidance for the `npm run ci:local` command, MkDocs warning-policy baseline, and release gate guidance for the `release:check` command, `npm test`, CLI unit tests, `npm run audit:strict`, all eight repository audits, `git diff --check`, whitespace checks, `package:check`, package contents checks, `release:metadata`, release metadata checks, `release:self-test`, release self-tests, and release smoke guidance for packed-tarball smoke, `package:smoke`, `design-ai workspace --strict --json` workspace strict failure/success readiness checks plus workspace `--learning-usage` sidecar summaries plus workspace `--learning-eval` checkpoint summaries with freshness metadata plus `design-ai workspace` workspace learning restore-backups readiness with restore rollback backup inventory, `design-ai site --stdin --json` Website Console export validation, `design-ai site --sample` Website Console sample workspace coverage, `design-ai site --prompt-list --json` Website Console prompt template listing, `design-ai site --stdin --mcp-check --json` Website Console MCP readiness check, `design-ai site --stdin --mcp-plan` Website Console MCP action plan, `design-ai site --stdin --bundle --out <dir>` Website Console handoff bundle, `design-ai site <bundle-dir> --bundle-check --strict --json` Website Console handoff bundle check with SHA-256 checksum verification and bundle digest/fingerprint verification, `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json` Website Console handoff bundle compare with bundle digest comparison, `design-ai site <bundle-dir> --bundle-handoff --strict --json` Website Console target-repo handoff prompt from a verified bundle digest, `design-ai site --stdin --tasks` Website Console refactor task generation, `design-ai site --stdin --prompt codex-implementation --task task-homepage-cta` Website Console task-selected single prompt generation, packed-tarball installed-bin, one-shot `npm exec --package <tarball>`, public registry `npm exec --package @design-ai/cli@<version>`, `registry:smoke`, human version, `design-ai version --json`, machine-readable version metadata, `design-ai help`, top-level help, `design-ai help --json`, help JSON topic catalog, command alias smoke, functional alias smoke, help topic output, list JSON mode, list catalog domains, corpus discovery JSON, route JSON output, route catalog output, and route stdin input, `show --lines` output and `route --explain` output, unknown command failure, unknown help-topic failure, unknown list-domain failure, and unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, and numeric range failure, prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output, prompt/pack forced output-file coverage and prompt/pack file-write confirmations, check examples output, check artifact output, check stdin output, check all-routes output, and check learning capture output, human `design-ai audit --strict --quiet` output, `design-ai audit --strict --quiet --json`, machine-readable repository-audit output, JSON `design-ai learn --feedback` output plus learn feedback `--out` file-write confirmation, JSON `design-ai learn --init` output, JSON `design-ai learn --backup` output, JSON `design-ai learn --redact` output, `design-ai learn --redact --from-file` output, `design-ai learn --redact --stdin` output, learn JSON `--out` file-write confirmation and forced overwrite coverage, JSON `design-ai learn --verify` output plus learn verify `--out` file-write confirmation, JSON `design-ai learn --restore` preview/apply output plus learn restore `--out` file-write confirmation plus learn restore rollback backup verification plus learn restore `--backup-file` path coverage plus design-ai learn --restore-backups restore rollback backup inventory coverage plus design-ai learn --restore-backups --prune restore rollback backup pruning coverage, JSON `design-ai learn --import` dry-run/apply output plus learn import `--out` file-write confirmation, human / JSON `design-ai learn --stats` profile summary output plus learn stats `--out` file-write confirmation, query-filtered human learn list explanation and export JSON output, brief-relevant prompt/pack learning selection, prompt/pack learning usage sidecar recording, human / JSON `design-ai learn --usage` usage sidecar report plus learn usage `--out` file-write confirmation, human / JSON `design-ai learn --eval-template` checkpoint generation plus generated checkpoint strict validation, human / JSON `design-ai learn --eval` checkpoint report plus learn eval `--out` file-write confirmation plus learn eval `--strict` failure gate, human / JSON `design-ai learn --audit` cleanup suggestion output plus learn audit `--out` file-write confirmation, human install lifecycle, human `design-ai install` output, `design-ai install --json`, machine-readable install lifecycle output, human `design-ai status` output plus JSON status, `design-ai status --json`, machine-readable install-state output, human uninstall lifecycle, human `design-ai uninstall` output, `design-ai uninstall --json`, machine-readable uninstall lifecycle output, `design-ai doctor --strict`, human diagnostics, human diagnostics output from `design-ai doctor --strict`, machine-readable diagnostics output from `design-ai doctor --json`, human `design-ai update --dry-run` output, `design-ai update --dry-run`, `design-ai update --dry-run --json`, machine-readable update plan. The tarball smoke covers installed-bin and one-shot `npm exec --package <tarball>` paths, `design-ai workspace --strict --json` workspace strict failure/success readiness checks plus workspace `--learning-usage` sidecar summaries plus workspace `--learning-eval` checkpoint summaries with freshness metadata plus `design-ai workspace` workspace learning restore-backups readiness with restore rollback backup inventory, `design-ai site --stdin --json` Website Console export validation, `design-ai site --sample` Website Console sample workspace coverage, `design-ai site --prompt-list --json` Website Console prompt template listing, `design-ai site --stdin --mcp-check --json` Website Console MCP readiness check, `design-ai site --stdin --mcp-plan` Website Console MCP action plan, `design-ai site --stdin --bundle --out <dir>` Website Console handoff bundle, `design-ai site <bundle-dir> --bundle-check --strict --json` Website Console handoff bundle check with SHA-256 checksum verification and bundle digest/fingerprint verification, `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json` Website Console handoff bundle compare with bundle digest comparison, `design-ai site <bundle-dir> --bundle-handoff --strict --json` Website Console target-repo handoff prompt from a verified bundle digest, `design-ai site --stdin --tasks` Website Console refactor task generation, `design-ai site --stdin --prompt codex-implementation --task task-homepage-cta` Website Console task-selected single prompt generation, human `design-ai version`, machine-readable version metadata from `design-ai version --json`, and `design-ai help` top-level help output, the `design-ai help --json` topic catalog, command alias help and functional alias output, command-specific help topic output, all three `list` catalog domains in human and JSON mode, human / JSON corpus discovery output, route JSON output, route catalog output, and route stdin input, explicit `show --lines` output and `route --explain` output, unknown command failure, unknown help-topic failure, unknown list-domain failure, and unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, and numeric range failure, prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output, prompt/pack forced `--out` overwrite and prompt/pack file-write confirmations, check examples output, check artifact output, check stdin output, check all-routes output, and check learning capture output, human `design-ai audit --strict --quiet` output and JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output, JSON `design-ai learn --feedback` output plus learn feedback `--out` file-write confirmation, JSON `design-ai learn --init` output, JSON `design-ai learn --backup` output, JSON `design-ai learn --redact` output, `design-ai learn --redact --from-file` output, `design-ai learn --redact --stdin` output, learn JSON `--out` file-write confirmation and forced overwrite coverage, JSON `design-ai learn --verify` output plus learn verify `--out` file-write confirmation, JSON `design-ai learn --restore` preview/apply output plus learn restore `--out` file-write confirmation plus learn restore rollback backup verification plus learn restore `--backup-file` path coverage plus design-ai learn --restore-backups restore rollback backup inventory coverage plus design-ai learn --restore-backups --prune restore rollback backup pruning coverage, JSON `design-ai learn --import` dry-run/apply output plus learn import `--out` file-write confirmation, human / JSON `design-ai learn --stats` profile summary output plus learn stats `--out` file-write confirmation, query-filtered human learn list explanation and export JSON output, brief-relevant prompt/pack learning selection, prompt/pack learning usage sidecar recording, human / JSON `design-ai learn --usage` usage sidecar report plus learn usage `--out` file-write confirmation, human / JSON `design-ai learn --eval-template` checkpoint generation plus generated checkpoint strict validation, human / JSON `design-ai learn --eval` checkpoint report plus learn eval `--out` file-write confirmation plus learn eval `--strict` failure gate, human / JSON `design-ai learn --audit` cleanup suggestion output plus learn audit `--out` file-write confirmation, human `design-ai update --dry-run` output, `design-ai update --dry-run --json` machine-readable update plan, human diagnostics output from `design-ai doctor --strict`, machine-readable diagnostics output from `design-ai doctor --json`, and human `design-ai install` output plus `design-ai install --json` machine-readable install lifecycle output, human `design-ai status` output plus JSON status including `design-ai status --json` machine-readable install-state output, and human `design-ai uninstall` output plus `design-ai uninstall --json` machine-readable uninstall lifecycle output. Continue with the manual release checks below after this gate passes.

Post-publish registry smoke guidance must also retain public registry query-filtered learn list explanation/export JSON output plus public registry brief-relevant prompt/pack learning selection and prompt/pack learning usage sidecar recording with public registry prompt/pack --with-learning.

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

This also checks that the current CHANGELOG and ROADMAP entries mention the same repository audit count as `tools/audit/run-all.py`, and that README, RELEASE-CHECKLIST, and English/Korean distribution docs retain `npm run ci:local` command guidance, MkDocs warning-policy baseline guidance, `npm test` command guidance, CLI unit test guidance, `npm run audit:strict` command guidance, all eight repository audit guidance, `git diff --check` command guidance, whitespace check guidance, `package:check` command guidance, package contents check guidance, `release:metadata` command guidance, release metadata check guidance, `release:self-test` command guidance, release self-test guidance, and release smoke phrases for `design-ai workspace --strict --json` workspace strict failure/success readiness checks plus workspace `--learning-usage` sidecar summaries plus workspace `--learning-eval` checkpoint summaries with freshness metadata plus `design-ai workspace` workspace learning restore-backups readiness with restore rollback backup inventory, `design-ai site --stdin --json` Website Console export validation, `design-ai site --sample` Website Console sample workspace coverage, `design-ai site --prompt-list --json` Website Console prompt template listing, `design-ai site --stdin --mcp-check --json` Website Console MCP readiness check, `design-ai site --stdin --mcp-plan` Website Console MCP action plan, `design-ai site --stdin --bundle --out <dir>` Website Console handoff bundle, `design-ai site <bundle-dir> --bundle-check --strict --json` Website Console handoff bundle check with SHA-256 checksum verification and bundle digest/fingerprint verification, `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json` Website Console handoff bundle compare with bundle digest comparison, `design-ai site <bundle-dir> --bundle-handoff --strict --json` Website Console target-repo handoff prompt from a verified bundle digest, `design-ai site --stdin --tasks` Website Console refactor task generation, `design-ai site --stdin --prompt codex-implementation --task task-homepage-cta` Website Console task-selected single prompt generation, packed-tarball installed-bin, one-shot `npm exec --package <tarball>`, public registry `npm exec --package @design-ai/cli@<version>`, human version, `design-ai version --json`, machine-readable version metadata, `design-ai help`, top-level help, `design-ai help --json`, help JSON topic catalog, command alias smoke, functional alias smoke, help topic output, list JSON mode, list catalog domains, corpus discovery JSON, route JSON output, route catalog output, and route stdin input, `show --lines` output and `route --explain` output, unknown command failure, unknown help-topic failure, unknown list-domain failure, and unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, and numeric range failure, prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output, prompt/pack forced output-file coverage and prompt/pack file-write confirmations, check examples output, check artifact output, check stdin output, check all-routes output, and check learning capture output, human `design-ai audit --strict --quiet` output, `design-ai audit --strict --quiet --json`, machine-readable repository-audit output, JSON `design-ai learn --feedback` output plus learn feedback `--out` file-write confirmation, JSON `design-ai learn --init` output, JSON `design-ai learn --backup` output, JSON `design-ai learn --redact` output, `design-ai learn --redact --from-file` output, `design-ai learn --redact --stdin` output, learn JSON `--out` file-write confirmation and forced overwrite coverage, JSON `design-ai learn --verify` output plus learn verify `--out` file-write confirmation, JSON `design-ai learn --restore` preview/apply output plus learn restore `--out` file-write confirmation plus learn restore rollback backup verification plus learn restore `--backup-file` path coverage plus design-ai learn --restore-backups restore rollback backup inventory coverage plus design-ai learn --restore-backups --prune restore rollback backup pruning coverage, JSON `design-ai learn --import` dry-run/apply output plus learn import `--out` file-write confirmation, human / JSON `design-ai learn --stats` profile summary output plus learn stats `--out` file-write confirmation, query-filtered human learn list explanation and export JSON output, brief-relevant prompt/pack learning selection, prompt/pack learning usage sidecar recording, human / JSON `design-ai learn --usage` usage sidecar report plus learn usage `--out` file-write confirmation, human / JSON `design-ai learn --eval-template` checkpoint generation plus generated checkpoint strict validation, human / JSON `design-ai learn --eval` checkpoint report plus learn eval `--out` file-write confirmation plus learn eval `--strict` failure gate, human / JSON `design-ai learn --audit` cleanup suggestion output plus learn audit `--out` file-write confirmation, human install lifecycle, human `design-ai install` output, `design-ai install --json`, machine-readable install lifecycle output, human `design-ai status` output plus JSON status, `design-ai status --json`, machine-readable install-state output, human uninstall lifecycle, human `design-ai uninstall` output, `design-ai uninstall --json`, machine-readable uninstall lifecycle output, `design-ai doctor --strict`, human diagnostics, human diagnostics output from `design-ai doctor --strict`, machine-readable diagnostics output from `design-ai doctor --json`, and `design-ai update --dry-run`, `design-ai update --dry-run --json`, machine-readable update plan. The checked release policy docs must match the required metadata labels in deterministic order: `README.md`, `README.ko.md`, `docs/RELEASE-CHECKLIST.md`, `docs/DISTRIBUTION.md`, and `docs/DISTRIBUTION.ko.md`. If a core release input, required policy doc, or audit-count source is missing, unreadable, unparsable, or invalid JSON, the release metadata check reports structured bullet errors instead of a Python traceback. The `--json` output preserves stable summary keys, checked-doc order, and readable Korean errors.

It also protects public registry JSON `design-ai learn --import` dry-run/apply output plus public registry learn import `--out` file-write confirmation plus public registry JSON `design-ai learn --redact` output, public registry `design-ai learn --redact --from-file`, public registry `design-ai learn --redact --stdin`, and public registry learn redact `--out` file-write confirmation in release-facing docs.

It also protects public registry JSON `design-ai learn --feedback` output plus public registry learn feedback `--out` file-write confirmation, public registry `design-ai learn --feedback --from-file`, public registry `design-ai learn --feedback --stdin`, public registry JSON `design-ai learn --init` preview/apply output, and public registry learn init duplicate-skip output in release-facing docs.

It also protects public registry JSON `design-ai learn --verify` output plus public registry learn verify `--out` file-write confirmation in release-facing docs.

It also protects public registry JSON `design-ai learn --restore` preview/apply output plus public registry learn restore `--out` file-write confirmation, public registry learn restore rollback backup verification, public registry learn restore `--backup-file` path coverage, public registry `design-ai learn --restore-backups` restore rollback backup inventory coverage, and public registry `design-ai learn --restore-backups --prune` restore rollback backup pruning coverage in release-facing docs.

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
- `publish.yml` runs on `v*` tags — verifies versions, runs audits, checks package contents, packs, smoke-tests the installed tarball, including human/JSON version and top-level help output, command alias help and functional alias output, command-specific help topic output, all three `list` catalog domains in human and JSON mode, human / JSON corpus discovery output, route JSON output, route catalog output, and route stdin input, explicit `show --lines` output and `route --explain` output, unknown command failure, unknown help-topic failure, unknown list-domain failure, and unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, and numeric range failure, prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output, prompt/pack forced `--out` overwrite and prompt/pack file-write confirmations, check examples output, check artifact output, check stdin output, check all-routes output, and check learning capture output, human `design-ai audit --strict --quiet` output and JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output, JSON `design-ai learn --feedback` output plus learn feedback `--out` file-write confirmation, JSON `design-ai learn --init` output, JSON `design-ai learn --backup` output, JSON `design-ai learn --redact` output, `design-ai learn --redact --from-file` output, `design-ai learn --redact --stdin` output, learn JSON `--out` file-write confirmation and forced overwrite coverage, JSON `design-ai learn --verify` output plus learn verify `--out` file-write confirmation, JSON `design-ai learn --restore` preview/apply output plus learn restore `--out` file-write confirmation plus learn restore rollback backup verification plus learn restore `--backup-file` path coverage plus design-ai learn --restore-backups restore rollback backup inventory coverage plus design-ai learn --restore-backups --prune restore rollback backup pruning coverage, JSON `design-ai learn --import` dry-run/apply output plus learn import `--out` file-write confirmation, human / JSON `design-ai learn --stats` profile summary output plus learn stats `--out` file-write confirmation, query-filtered human learn list explanation and export JSON output, brief-relevant prompt/pack learning selection, prompt/pack learning usage sidecar recording, human / JSON `design-ai learn --usage` usage sidecar report plus learn usage `--out` file-write confirmation, human / JSON `design-ai learn --eval-template` checkpoint generation plus generated checkpoint strict validation, human / JSON `design-ai learn --eval` checkpoint report plus learn eval `--out` file-write confirmation plus learn eval `--strict` failure gate, human / JSON `design-ai learn --audit` cleanup suggestion output plus learn audit `--out` file-write confirmation, human `design-ai update --dry-run` output, `design-ai update --dry-run --json` machine-readable update plan, human diagnostics output from `design-ai doctor --strict`, machine-readable diagnostics output from `design-ai doctor --json`, and human `design-ai install` output plus `design-ai install --json` machine-readable install lifecycle output, human `design-ai status` output plus JSON status including `design-ai status --json` machine-readable install-state output, and human `design-ai uninstall` output plus `design-ai uninstall --json` machine-readable uninstall lifecycle output, then publishes to npm with provenance.
- After npm publish, `publish.yml` runs the registry smoke test against the published package so `npm exec --package @design-ai/cli@<version>`, human/JSON version output, the expected `design-ai help --json` catalog, discovered help topic usage output, documented help/command aliases, functional aliases, all three `list` catalog domains in human and JSON mode, human / JSON corpus discovery output, route JSON output, route catalog output, and route stdin input, explicit `show --lines` output and `route --explain` output, unknown command failure, unknown help-topic failure, unknown list-domain failure, and unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, and numeric range failure, prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output, prompt/pack forced `--out` overwrite and prompt/pack file-write confirmations, check examples output, check artifact output, check stdin output, check all-routes output, and check learning capture output, human `design-ai audit --strict --quiet` output and JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output, public registry JSON `design-ai learn --verify` output plus public registry learn verify `--out` file-write confirmation, public registry JSON `design-ai learn --backup` output plus public registry learn backup `--out` file-write confirmation, public registry human / JSON `design-ai learn --stats` profile summary output plus public registry learn stats `--out` file-write confirmation, human `design-ai update --dry-run` output, `design-ai update --dry-run --json` machine-readable update plan, and human `design-ai install` output plus `design-ai install --json` machine-readable install lifecycle output, human diagnostics output from `design-ai doctor --strict`, machine-readable diagnostics output from `design-ai doctor --json`, human `design-ai status` output plus JSON status including `design-ai status --json` machine-readable install-state output, and human `design-ai uninstall` output plus `design-ai uninstall --json` machine-readable uninstall lifecycle output are verified from the public registry.
- The registry smoke also verifies public registry `design-ai workspace --strict --json` workspace strict failure/success readiness checks from the published package path.
- The registry smoke also verifies public registry `design-ai workspace --learning-eval learning-eval.json --strict --json` checkpoint summaries plus auto-detected learning usage sidecar summaries with freshness metadata from the published package path.
- The registry smoke also verifies public registry `design-ai workspace` workspace restore-backups readiness with restore rollback backup inventory from the published package path.
- The registry smoke also verifies public registry `design-ai learn --eval-template` checkpoint generation plus public registry generated checkpoint strict validation from the published package path.
- The registry smoke also verifies public registry human / JSON `design-ai learn --audit` cleanup suggestion output plus public registry learn audit `--out` file-write confirmation and public registry `design-ai learn --audit --fix --dry-run` cleanup preview and confirmed apply output.
- The packed-tarball smoke also verifies human / JSON `design-ai learn --curate` archive-first curation output plus usage-aware curation JSON review and confirmed archive persistence through installed-bin and one-shot `npm exec --package <tarball>` paths.
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
SHA=$(curl -sL "https://github.com/sungjin9288/design-ai/releases/download/$TAG/design-ai-cli-${TAG#v}.tgz" | shasum -a 256 | cut -d' ' -f1)

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
