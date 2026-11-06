"""Check that the static browser walkthrough matches the real Python sample output."""
import csv
from html.parser import HTMLParser
from pathlib import Path
import tempfile
import unittest

from clean import process


ROOT = Path(__file__).parent


class DemoParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []
        self.in_body = False
        self.in_cell = False
        self.cell_parts = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "tr" and "data-status" in attributes:
            self.in_body = True
            self.rows.append({"status": attributes["data-status"], "cells": []})
        if tag == "td" and self.in_body:
            self.in_cell = True
            self.cell_parts = []

    def handle_data(self, data):
        if self.in_cell:
            self.cell_parts.append(data)

    def handle_endtag(self, tag):
        if tag == "td" and self.in_cell:
            self.rows[-1]["cells"].append("".join(self.cell_parts).strip())
            self.in_cell = False
        if tag == "tr":
            self.in_body = False


class SampleAuditDemoTests(unittest.TestCase):
    def test_static_audit_matches_actual_cleaner_outputs(self):
        parser = DemoParser()
        html = (ROOT / "demo.html").read_text(encoding="utf-8")
        parser.feed(html)
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            clean_file, rejects_file = folder / "clean.csv", folder / "rejects.csv"
            counts = process(ROOT / "sample.csv", clean_file, rejects_file)
            with clean_file.open(encoding="utf-8", newline="") as stream:
                good = list(csv.DictReader(stream))
            with rejects_file.open(encoding="utf-8", newline="") as stream:
                rejected = list(csv.DictReader(stream))
        self.assertEqual(counts, (1, 3))
        self.assertEqual(len(parser.rows), sum(counts))
        self.assertEqual([r["status"] for r in parser.rows].count("accepted"), len(good))
        self.assertEqual([r["status"] for r in parser.rows].count("rejected"), len(rejected))
        self.assertEqual(
            [(int(r["cells"][0]), r["status"]) for r in parser.rows],
            [(2, "rejected"), (3, "accepted"), (4, "rejected"), (5, "rejected")],
        )
        self.assertEqual(parser.rows[1]["cells"][2], good[0]["email"])
        self.assertEqual(
            {int(r["cells"][0]) for r in parser.rows if r["status"] == "rejected"},
            {int(r["line"]) for r in rejected},
        )

    def test_demo_is_offline_and_has_no_user_file_input(self):
        html = (ROOT / "demo.html").read_text(encoding="utf-8").lower()
        self.assertIn("connect-src 'none'", html)
        self.assertIn("form-action 'none'", html)
        self.assertNotIn("<input", html)
        self.assertNotIn("<iframe", html)
        self.assertNotIn("fetch(", html)
        self.assertNotIn("innerhtml", html)
        self.assertIn('aria-pressed="true"', html)
        self.assertIn('aria-live="polite"', html)

    def test_demo_enforces_strict_csp_and_local_assets(self):
        """Regression: no inline execution or external asset dependencies."""
        html = (ROOT / "demo.html").read_text(encoding="utf-8")
        self.assertIn("script-src 'self'", html)
        self.assertIn("style-src 'self'", html)
        self.assertNotIn("'unsafe-inline'", html)
        self.assertNotIn("'unsafe-eval'", html)
        self.assertNotIn("<style", html.lower())
        self.assertNotIn("<script>", html.lower())
        self.assertIn('<script src="demo.js" defer></script>', html)
        self.assertIn('<link rel="stylesheet" href="demo.css">', html)
        js = (ROOT / "demo.js").read_text(encoding="utf-8")
        css = (ROOT / "demo.css").read_text(encoding="utf-8")
        self.assertIn('row.hidden =', js)
        self.assertIn('status.textContent', js)
        for forbidden in ("innerHTML", "eval(", "new Function(", "fetch(", "XMLHttpRequest", "document.write("):
            self.assertNotIn(forbidden, js)
        self.assertNotIn("@import", css)
        self.assertNotIn("url(", css.lower())
        self.assertNotIn("style=", html.lower())


if __name__ == "__main__":
    unittest.main()
