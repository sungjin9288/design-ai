"""Small build hooks for the public documentation site."""

from __future__ import annotations

import shutil
from pathlib import Path, PurePosixPath


def _locale_paths(config: dict) -> list[PurePosixPath]:
    alternates = config.get("extra", {}).get("alternate", [])
    paths: list[PurePosixPath] = []

    for alternate in alternates:
        raw_link = alternate.get("link", "")
        locale_path = PurePosixPath(raw_link.strip("/"))
        if not locale_path.parts or any(part in {".", ".."} for part in locale_path.parts):
            continue
        paths.append(locale_path)

    return paths


def mirror_locale_sitemaps(config: dict) -> list[Path]:
    """Mirror the combined sitemap at each localized site root."""

    site_dir = Path(config["site_dir"])
    sitemap_sources = [
        path
        for path in (site_dir / "sitemap.xml", site_dir / "sitemap.xml.gz")
        if path.is_file()
    ]
    mirrored: list[Path] = []

    for locale_path in _locale_paths(config):
        locale_dir = site_dir.joinpath(*locale_path.parts)
        locale_dir.mkdir(parents=True, exist_ok=True)

        for source in sitemap_sources:
            target = locale_dir / source.name
            shutil.copyfile(source, target)
            mirrored.append(target)

    return mirrored


def on_post_build(config: dict, **_kwargs) -> None:
    mirror_locale_sitemaps(config)
