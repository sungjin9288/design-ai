"""Website Console fixtures preserved for public registry smoke."""
from __future__ import annotations

import json

from .site_fixtures_intake import passing_site_sample_json


def registry_site_workspace_fixture_json() -> str:
    return passing_site_sample_json()


def registry_site_workspace_warning_fixture_json() -> str:
    payload = json.loads(registry_site_workspace_fixture_json())
    payload["siteProfile"]["sentryProject"] = ""
    return json.dumps(payload, ensure_ascii=False)
