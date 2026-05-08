#!/usr/bin/env bash
# build-docs.sh — populate site-src/ with symlinks to corpus content.
# Idempotent: safe to re-run.
#
# mkdocs requires docs_dir to be a sibling/descendant of the config file
# (not the parent). We satisfy that by creating site-src/ alongside
# mkdocs.yml and symlinking corpus content into it.
#
# Usage:
#   ./tools/build-docs.sh           # create symlinks
#   ./tools/build-docs.sh --clean   # remove site-src/

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_SRC="$REPO_ROOT/site-src"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ "${1:-}" = "--clean" ]; then
  rm -rf "$SITE_SRC"
  echo -e "${GREEN}✓${NC}  Removed $SITE_SRC"
  exit 0
fi

# Recreate clean
rm -rf "$SITE_SRC"
mkdir -p "$SITE_SRC"

# Index page (mkdocs convention) → README.md
ln -sf "../README.md" "$SITE_SRC/index.md"

# Top-level docs that should be browsable
for f in AGENTS.md CLAUDE.md CHANGELOG.md; do
  if [ -f "$REPO_ROOT/$f" ]; then
    ln -sf "../$f" "$SITE_SRC/$f"
  fi
done

# Corpus directories
for d in knowledge examples skills commands agents docs; do
  if [ -d "$REPO_ROOT/$d" ]; then
    ln -sf "../$d" "$SITE_SRC/$d"
  fi
done

count=$(find "$SITE_SRC" -maxdepth 1 -mindepth 1 | wc -l | tr -d ' ')
echo -e "${BLUE}ℹ${NC}  Populated $SITE_SRC with $count entries"
echo -e "${GREEN}✓${NC}  Now run: mkdocs serve  (or mkdocs build)"
