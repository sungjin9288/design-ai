# Homebrew formula

This directory contains the Homebrew formula for `design-ai`, enabling installation via `brew install`.

## For users

### Install via tap

```bash
brew tap sungjin9288/design-ai https://github.com/sungjin9288/design-ai.git
brew install design-ai
```

This installs design-ai's corpus + CLI under `$(brew --prefix)/opt/design-ai`. The `design-ai` binary is added to your PATH.

After install:

```bash
design-ai install     # symlink skills/agents/commands into ~/.claude/
design-ai status      # verify
design-ai list skills # browse the catalog
```

### Update

```bash
brew update
brew upgrade design-ai
design-ai update      # re-symlink the new version
```

### Uninstall

```bash
design-ai uninstall   # remove ~/.claude/ symlinks
brew uninstall design-ai
brew untap sungjin9288/design-ai
```

## For maintainers — releasing a new version

1. **Bump versions** in `package.json` and `.claude-plugin/plugin.json` (must match).

2. **Update `CHANGELOG.md`** with the new version section.

3. **Commit + tag**:
   ```bash
   git tag v4.55.0
   git push origin v4.55.0
   ```

4. **Generate Homebrew tarball**:
   ```bash
   gh release create v4.55.0 --generate-notes
   ```
   (Or wait for GitHub Releases to auto-create from the tag.)

5. **Get tarball SHA256**:
   ```bash
   curl -sL https://github.com/sungjin9288/design-ai/archive/refs/tags/v4.55.0.tar.gz | shasum -a 256
   ```

6. **Update `Formula/design-ai.rb`**:
   - Bump `url` to the new tag.
   - Replace `sha256` with the value from step 5.
   - Bump `version`.

7. **Test locally**:
   ```bash
   brew install --build-from-source ./Formula/design-ai.rb
   brew test design-ai
   ```

8. **Commit + push** the formula update.

9. **For `homebrew-core` submission** (when ready for official inclusion):
   - Fork [homebrew/homebrew-core](https://github.com/Homebrew/homebrew-core).
   - Add `Formula/d/design-ai.rb` (note the alphabetical subdirectory).
   - PR with the formula.
   - Address reviewer feedback (Homebrew has strict style rules — `brew style design-ai` locally first).

## For users — alternative install paths

If you don't want Homebrew:

- **NPM CLI** (cross-platform): `npx @design-ai/cli install`
- **Git clone + script**: `git clone ... && ./install.sh`
- **Manual symlinks**: see [`../docs/PLUGIN-PACKAGING.md`](../docs/PLUGIN-PACKAGING.md)

See [`../docs/DISTRIBUTION.md`](../docs/DISTRIBUTION.md) for the full distribution guide.

## Why a tap, not homebrew-core?

design-ai is a project-specific tool with frequent corpus updates. A self-managed tap gives:
- **Faster releases** — no homebrew-core review cycle.
- **Pre-release versions** — easier to ship beta corpus updates.
- **Tied to GitHub Releases** — clean version pinning.

Once design-ai's corpus stabilizes (annual releases instead of frequent), homebrew-core inclusion becomes more viable.

## Caveats

- The formula installs Node as a recommended dependency. Without Node, only the `install.sh` symlink wrapper is available (no `design-ai status` / `list` commands). Most users want Node anyway.
- Homebrew on Linux is supported but less commonly used; the formula should work on Linuxbrew but is primarily tested on macOS.
- For non-Mac systems: prefer the NPM CLI (`npx @design-ai/cli`).
