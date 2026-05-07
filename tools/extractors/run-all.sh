#!/usr/bin/env bash
# Run every extractor and refresh knowledge/.
# Idempotent: each extractor overwrites only its own outputs.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Extracting Ant Design tokens"
python3 tools/extractors/ant_design_tokens.py

echo "==> Extracting MUI palette"
python3 tools/extractors/mui_palette.py

echo "==> Extracting component index"
python3 tools/extractors/component_index.py

echo "==> Extracting shadcn registry"
python3 tools/extractors/shadcn_registry.py

echo "==> Mirroring awesome-design-md"
python3 tools/extractors/awesome_design_mirror.py

echo "==> Mirroring ui-ux-pro-max catalog"
python3 tools/extractors/ui_ux_pro_max.py

echo "==> Extracting ui-ux-pro-max extras (charts, icons, ui-reasoning, landing)"
python3 tools/extractors/ui_ux_pro_max_extras.py

echo "==> Done. See knowledge/ for outputs."
