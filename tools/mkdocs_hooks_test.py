from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tools.mkdocs_hooks import mirror_locale_sitemaps


class MirrorLocaleSitemapsTest(unittest.TestCase):
    def test_mirrors_combined_sitemap_for_each_locale(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            site_dir = Path(directory)
            source = site_dir / "sitemap.xml"
            source.write_text("<urlset>combined</urlset>\n", encoding="utf-8")
            config = {
                "site_dir": str(site_dir),
                "extra": {
                    "alternate": [
                        {"lang": "en", "link": "/"},
                        {"lang": "ko", "link": "/ko/"},
                    ]
                },
            }

            mirrored = mirror_locale_sitemaps(config)

            self.assertEqual(mirrored, [site_dir / "ko" / "sitemap.xml"])
            self.assertEqual(mirrored[0].read_bytes(), source.read_bytes())

    def test_rejects_parent_paths(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            site_dir = Path(directory)
            (site_dir / "sitemap.xml").write_text("safe\n", encoding="utf-8")
            config = {
                "site_dir": str(site_dir),
                "extra": {"alternate": [{"lang": "ko", "link": "/../ko/"}]},
            }

            self.assertEqual(mirror_locale_sitemaps(config), [])
            self.assertFalse((site_dir.parent / "ko" / "sitemap.xml").exists())


if __name__ == "__main__":
    unittest.main()
