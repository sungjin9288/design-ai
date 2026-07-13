# Extractor Maintenance

These scripts regenerate `knowledge/` from the clone-only `refs/` source mirrors. They are repository maintenance tools, not public Claude Code commands and are excluded from the npm package.

## Refresh Knowledge

1. Optionally update each populated source mirror: `git -C refs/<repo> pull`.
2. Run `bash tools/extractors/run-all.sh`.
3. Review the generated `knowledge/` changes. Generated files need valid YAML frontmatter, must be non-empty, and should remain under 1 MB.
4. Keep hand-written knowledge files unchanged and report the regenerated paths.

Run this from a full git clone with the relevant `refs/` mirrors available. npm installs intentionally do not include `refs/` or this extractor directory.
