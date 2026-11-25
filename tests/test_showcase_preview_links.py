"""Static regression checks for six synthetic browser previews in the showcase.

These checks verify source links, local paths and honest disclosure; they do not
replace browser accessibility, responsiveness or functional E2E testing.
"""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SHOWCASE_ROUTE_OVERRIDES = {"02": "02-sales-intelligence/sample-explorer.html", "03": "03-api-bridge/mapper.html"}
PREVIEWS = {
    "02": "02-sales-intelligence/demo-ui.html",
    "03": "03-api-bridge/demo-ui.html",
    "04": "04-crm-lead-intelligence/demo-ui.html",
    "06": "06-document-factory/demo-ui.html",
    "07": "07-data-quality-auditor/demo-ui.html",
    "08": "08-site-change-monitor/demo-ui.html",
}


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.links.extend(value for key, value in attrs if key == "href")


class ShowcasePreviewTests(unittest.TestCase):
    def test_six_project_demo_links_exist_and_resolve(self):
        page = LinkParser()
        page.feed((ROOT / "index.html").read_text(encoding="utf-8"))
        for number, target in PREVIEWS.items():
            with self.subTest(project=number):
                route = SHOWCASE_ROUTE_OVERRIDES.get(number, target)
                self.assertEqual(page.links.count(route), 1)
                self.assertTrue((ROOT / route).is_file(), route)

    def test_previews_disclose_synthetic_scope_and_link_back(self):
        for number, target in PREVIEWS.items():
            with self.subTest(project=number):
                source = (ROOT / target).read_text(encoding="utf-8")
                parser = LinkParser()
                parser.feed(source)
                self.assertIn("../index.html", parser.links)
                self.assertIn("README.md", parser.links)
                self.assertIn("Synthetic data only", source)
                if number in {"02", "03"}:  # Legacy links remain standalone, unsaved previews.
                    self.assertIn("No data is sent or saved", source)
                else:
                    self.assertIn("Only numerical summaries are saved locally", source)
                    self.assertIn("form-action 'none'", source)
                    self.assertIn("connect-src 'self'", source)
                self.assertNotIn("fetch(", source)
                self.assertNotIn("XMLHttpRequest", source)
                self.assertNotIn("innerHTML", source)
                self.assertIn('name="viewport"', source)


if __name__ == "__main__":
    unittest.main()
