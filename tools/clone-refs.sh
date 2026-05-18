#!/usr/bin/env bash
# Clone (or refresh) upstream design system source repos into refs/.
# Run after a fresh checkout, or when sources need updating.
# Idempotent — re-running pulls latest from each.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p refs

clone_or_pull() {
    local name="$1"
    local url="$2"
    if [ -d "refs/$name" ]; then
        echo "==> Pulling refs/$name"
        git -C "refs/$name" pull --quiet || echo "  (pull failed, leaving as-is)"
    else
        echo "==> Cloning $name"
        git clone --depth 1 --filter=blob:none --sparse "$url" "refs/$name"
    fi
}

apply_sparse() {
    local name="$1"; shift
    git -C "refs/$name" sparse-checkout init --cone
    git -C "refs/$name" sparse-checkout set --skip-checks "$@"
}

# Small, full clones
clone_or_pull awesome-design-md https://github.com/VoltAgent/awesome-design-md.git
clone_or_pull ui-ux-pro-max https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git
clone_or_pull open-design https://github.com/nexu-io/open-design.git
clone_or_pull material-design-lite https://github.com/google/material-design-lite.git

# Sparse clones — only the parts we need
clone_or_pull ant-design https://github.com/ant-design/ant-design.git
apply_sparse ant-design components docs scripts

clone_or_pull mui https://github.com/mui/material-ui.git
apply_sparse mui packages docs

clone_or_pull shadcn-ui https://github.com/shadcn-ui/ui.git
apply_sparse shadcn-ui apps packages

clone_or_pull material-icons https://github.com/google/material-design-icons.git
apply_sparse material-icons update

clone_or_pull nerd-fonts https://github.com/ryanoasis/nerd-fonts.git
apply_sparse nerd-fonts bin/scripts/lib readme-files css glyphnames.json

echo
echo "==> Done. Run 'bash tools/extractors/run-all.sh' next."
