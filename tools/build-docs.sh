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

# Korean index page (mkdocs-static-i18n convention: index.ko.md)
if [ -f "$REPO_ROOT/README.ko.md" ]; then
  ln -sf "../README.ko.md" "$SITE_SRC/index.ko.md"
fi

# Top-level docs that should be browsable (English + Korean translations)
for f in AGENTS.md AGENTS.ko.md CLAUDE.md CHANGELOG.md; do
  if [ -f "$REPO_ROOT/$f" ]; then
    ln -sf "../$f" "$SITE_SRC/$f"
  fi
done

# Evidence screenshots are referenced from portfolio docs but live outside the
# main documentation corpus. Include only static assets, not the whole evidence
# tree, so MkDocs can resolve image links without publishing CI logs as pages.
if [ -d "$REPO_ROOT/evidence/screenshots" ]; then
  mkdir -p "$SITE_SRC/evidence/screenshots"
  while IFS= read -r -d '' evidence_file; do
    rel_path="${evidence_file#$REPO_ROOT/}"
    mkdir -p "$SITE_SRC/$(dirname "$rel_path")"
    ln -sf "$evidence_file" "$SITE_SRC/$rel_path"
  done < <(find "$REPO_ROOT/evidence/screenshots" -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.gif' -o -name '*.svg' -o -name '*.webp' \) -print0)
fi

# Corpus directories
if git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  for d in knowledge examples skills commands agents docs; do
    if [ -d "$REPO_ROOT/$d" ]; then
      while IFS= read -r -d '' tracked_file; do
        [ -f "$REPO_ROOT/$tracked_file" ] || continue
        mkdir -p "$SITE_SRC/$(dirname "$tracked_file")"
        ln -sf "$REPO_ROOT/$tracked_file" "$SITE_SRC/$tracked_file"
      done < <(
        {
          git -C "$REPO_ROOT" ls-files -z -- "$d"
          git -C "$REPO_ROOT" ls-files --others --exclude-standard -z -- "$d"
        } | sort -zu
      )
    fi
  done
else
  for d in knowledge examples skills commands agents docs; do
    if [ -d "$REPO_ROOT/$d" ]; then
      ln -sf "../$d" "$SITE_SRC/$d"
    fi
  done
fi

count=$(find "$SITE_SRC" -maxdepth 1 -mindepth 1 | wc -l | tr -d ' ')
echo -e "${BLUE}ℹ${NC}  Populated $SITE_SRC with $count entries"
echo -e "${GREEN}✓${NC}  Now run: mkdocs serve  (or mkdocs build)"
