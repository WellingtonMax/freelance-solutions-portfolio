"""Regression guard: the eight integrated projects must remain discoverable.

Static source contract only, not a browser or deployment test. Uses synthetic demos.
"""
from pathlib import Path
import re
import unittest

# CI invokes this module explicitly; import the separate preview regression suite
# so its assertions actually run in the existing showcase CI step.
from test_showcase_preview_links import ShowcasePreviewTests  # noqa: F401

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    "01": ("Excel Rescue", "01-excel-rescue/demo.html"),
    "02": ("Sales Intelligence", "02-sales-intelligence/CASE_STUDY.md"),
    "03": ("API Bridge", "03-api-bridge/CASE_STUDY.md"),
    "04": ("CRM Lead Intelligence", "04-crm-lead-intelligence/README.md"),
    "05": ("Landing Page Studio", "05-landing-page-studio/index.html"),
    "06": ("Document Factory", "06-document-factory/README.md"),
    "07": ("Data Quality Auditor", "07-data-quality-auditor/README.md"),
    "08": ("Site Change Monitor", "08-site-change-monitor/README.md"),
}


class MainShowcaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.page = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.readme = (ROOT / "README.md").read_text(encoding="utf-8")

    def test_exactly_eight_numbered_cards_and_no_unapproved_projects(self):
        numbers = re.findall(r"<span>(0[1-9]|10) /", self.page)
        self.assertEqual(numbers, list(EXPECTED))
        self.assertNotIn("Bug Fix Laboratory", self.page)
        self.assertNotIn("Business Operations API", self.page)

    def test_each_card_links_to_real_integrated_source(self):
        for number, (title, target) in EXPECTED.items():
            with self.subTest(project=number):
                cards = re.findall(r'<article class="card">.*?</article>', self.page, flags=re.DOTALL)
                matches = [card for card in cards if f"<span>{number} /" in card]
                self.assertEqual(len(matches), 1)
                self.assertIn(f"<h3>{title}</h3>", matches[0])
                self.assertIn(f'href="{target}"', matches[0])
                self.assertTrue((ROOT / target).is_file(), target)

    def test_prototype_labels_do_not_claim_production(self):
        for number in ("04", "05", "06", "07", "08"):
            card = next(card for card in re.findall(
                r'<article class="card">.*?</article>', self.page, flags=re.DOTALL
            ) if f"<span>{number} /" in card)
            self.assertIn("Prototype", card)
            self.assertNotIn("Production-ready", card)
        self.assertIn("not production-ready", self.page)
        self.assertIn("human review", self.page.lower())

    def test_readme_matches_integrated_tree(self):
        self.assertIn("## The eight core projects", self.readme)
        self.assertNotIn("Planned portfolio expansion", self.readme)
        for number, (_, target) in EXPECTED.items():
            with self.subTest(project=number):
                self.assertIn(f"| **{number} ·", self.readme)
                self.assertIn(f"]({target})", self.readme)
                self.assertTrue((ROOT / target).is_file())


if __name__ == "__main__":
    unittest.main()
